// =============================================================================
// SCORING ENGINE - EXACT PRD IMPLEMENTATION & TEST CASES
// Pure TypeScript engine with auditability & unit tests
// =============================================================================

import {
  MetricSnapshot,
  Post,
  ScoringConfig,
  PerformanceLabel,
  ScoringWeights,
} from "./types";

export const DEFAULT_SCORING_CONFIG: ScoringConfig = {
  mode: "calibrated", // Default per PRD section 8.3
  weights: {
    likes: 0.2,
    comments: 0.25,
    shares: 0.25,
    saves: 0.3,
    followers: 2.0,
  },
  thresholds: {
    // Mode B: Terkalibrasi (default hasil riset 29 postingan tayang James)
    calibrated: {
      win: { er: 3.0, score: 4.0 },
      avg: { er: 2.0, score: 2.0 },
    },
    // Mode A: Paritas Template Notion (menghasilkan 31/31 Low pada akun < 10k)
    template: {
      win: { er: 5.0, score: 200.0 },
      avg: { er: 2.0, score: 100.0 },
    },
  },
  min_views: 100, // Batas bawah agar ER views kecil tidak berisik
  baseline_n: 30, // N postingan terakhir untuk median mode relatif
  snapshot_window: "7d", // Default window snapshot scoring
};

const n = (x?: number | null): number => x ?? 0;

/**
 * Interactions = likes + comments + saves + shares
 */
export const calculateInteractions = (
  m?: Partial<MetricSnapshot> | null
): number => {
  if (!m) return 0;
  return n(m.likes) + n(m.comments) + n(m.saves) + n(m.shares);
};

/**
 * ER (%) = interactions ÷ views × 100 (null jika views = 0)
 * Di UI diberi label "ER terhadap views"
 */
export const calculateEngagementRate = (
  m?: Partial<MetricSnapshot> | null
): number | null => {
  if (!m || n(m.views) <= 0) return null;
  const inter = calculateInteractions(m);
  return (inter / n(m.views)) * 100;
};

/**
 * Content Score = likes × 0,2 + comments × 0,25 + shares × 0,25 + saves × 0,3 + followers_gain × 2
 * Disimpan dengan presisi 2 desimal
 */
export const calculateContentScore = (
  m?: Partial<MetricSnapshot> | null,
  weights: ScoringWeights = DEFAULT_SCORING_CONFIG.weights
): number => {
  if (!m) return 0;
  const s =
    n(m.likes) * weights.likes +
    n(m.comments) * weights.comments +
    n(m.shares) * weights.shares +
    n(m.saves) * weights.saves +
    n(m.followers_gain) * weights.followers;
  return Math.round(s * 100) / 100;
};

/**
 * Tampilan skor dibulatkan half-up (0,5 menjadi 1), persis sama seperti rumus Notion
 */
export const displayScore = (score: number): number => {
  return Math.floor(score + 0.5);
};

/**
 * Helper untuk menghitung median angka
 */
export const calculateMedian = (values: number[]): number => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const valMid = sorted[mid] ?? 0;
  const valPrev = sorted[mid - 1] ?? 0;
  return sorted.length % 2 !== 0 ? valMid : (valPrev + valMid) / 2;
};

/**
 * Mesin penentuan Label Performa Utama
 */
export function calculatePerformanceLabel(
  post: Pick<Post, "status">,
  snapshot: MetricSnapshot | null | undefined,
  config: ScoringConfig = DEFAULT_SCORING_CONFIG,
  peerPostsOnPlatform: Post[] = []
): {
  label: PerformanceLabel;
  score: number;
  displayScore: number;
  er: number | null;
  reason: string;
} {
  // Prasyarat 1: Hanya untuk post berstatus Posted
  if (post.status !== "Posted") {
    return {
      label: "Belum tayang",
      score: 0,
      displayScore: 0,
      er: null,
      reason: "Konten belum dipublikasikan (masih naskah/produksi/jadwal).",
    };
  }

  // Prasyarat 2: Harus memiliki snapshot metrik
  if (!snapshot) {
    return {
      label: "Belum ada data",
      score: 0,
      displayScore: 0,
      er: null,
      reason: "Belum ada data metrik yang diinput untuk postingan ini.",
    };
  }

  const views = n(snapshot.views);
  const er = calculateEngagementRate(snapshot);
  const score = calculateContentScore(snapshot, config.weights);
  const dScore = displayScore(score);

  // Prasyarat 3: Ambang batas views minimal (default 100 views)
  if (views < config.min_views) {
    return {
      label: "Data kurang",
      score,
      displayScore: dScore,
      er,
      reason: `Views (${views}) masih di bawah batas validitas ${config.min_views} views.`,
    };
  }

  const effectiveER = er ?? 0;

  // -------------------------------------------------------------
  // Mode A: Paritas Template Notion Asli
  // -------------------------------------------------------------
  if (config.mode === "template") {
    const th = config.thresholds.template;
    if (effectiveER >= th.win.er && score >= th.win.score) {
      return { label: "Winning", score, displayScore: dScore, er, reason: `ER ≥ ${th.win.er}% & Skor ≥ ${th.win.score}` };
    }
    if (effectiveER >= th.avg.er && score >= th.avg.score) {
      return { label: "Average", score, displayScore: dScore, er, reason: `ER ≥ ${th.avg.er}% & Skor ≥ ${th.avg.score}` };
    }
    return { label: "Low Performer", score, displayScore: dScore, er, reason: "Di bawah ambang batas paritas template." };
  }

  // -------------------------------------------------------------
  // Mode C: Relatif (Dihitung terhadap median platform)
  // -------------------------------------------------------------
  if (config.mode === "relative") {
    // Ambil metrik dari N postingan tayang terakhir pada platform yang sama
    const validPeerSnapshots: MetricSnapshot[] = peerPostsOnPlatform
      .filter((p) => p.status === "Posted" && p.snapshots && p.snapshots.length > 0)
      .slice(0, config.baseline_n)
      .map((p) => p.snapshots[p.snapshots.length - 1])
      .filter((s): s is MetricSnapshot => s !== undefined);

    // Jika sampel peer kurang dari 10, fallback otomatis ke mode B (terkalibrasi)
    if (validPeerSnapshots.length < 10) {
      const th = config.thresholds.calibrated;
      if (effectiveER >= th.win.er && score >= th.win.score) {
        return { label: "Winning", score, displayScore: dScore, er, reason: `(Fallback Terkalibrasi) ER ≥ ${th.win.er}% & Skor ≥ ${th.win.score}` };
      }
      if (effectiveER >= th.avg.er && score >= th.avg.score) {
        return { label: "Average", score, displayScore: dScore, er, reason: `(Fallback Terkalibrasi) ER ≥ ${th.avg.er}% & Skor ≥ ${th.avg.score}` };
      }
      return { label: "Low Performer", score, displayScore: dScore, er, reason: "(Fallback Terkalibrasi) Di bawah rata-rata." };
    }

    const medianViews = calculateMedian(validPeerSnapshots.map((s) => s.views));
    const medianER = calculateMedian(
      validPeerSnapshots
        .map((s) => calculateEngagementRate(s))
        .filter((r): r is number => r !== null)
    );

    const isWinning =
      views >= 1.2 * medianViews &&
      effectiveER >= 2.0 * medianER &&
      views >= config.min_views;

    if (isWinning) {
      return {
        label: "Winning",
        score,
        displayScore: dScore,
        er,
        reason: `Views ≥ 120% median (${medianViews.toFixed(0)}) & ER ≥ 200% median (${medianER.toFixed(1)}%)`,
      };
    }

    if (effectiveER >= medianER) {
      return {
        label: "Average",
        score,
        displayScore: dScore,
        er,
        reason: `ER ≥ median platform (${medianER.toFixed(1)}%)`,
      };
    }

    return {
      label: "Low Performer",
      score,
      displayScore: dScore,
      er,
      reason: `ER di bawah median platform (${medianER.toFixed(1)}%)`,
    };
  }

  // -------------------------------------------------------------
  // Mode B: Terkalibrasi (Default Rekomendasi PRD)
  // -------------------------------------------------------------
  const th = config.thresholds.calibrated;
  if (effectiveER >= th.win.er && score >= th.win.score) {
    return {
      label: "Winning",
      score,
      displayScore: dScore,
      er,
      reason: `ER ${effectiveER.toFixed(1)}% ≥ ${th.win.er}% & Skor ${score.toFixed(1)} ≥ ${th.win.score}`,
    };
  }
  if (effectiveER >= th.avg.er && score >= th.avg.score) {
    return {
      label: "Average",
      score,
      displayScore: dScore,
      er,
      reason: `ER ${effectiveER.toFixed(1)}% ≥ ${th.avg.er}% & Skor ${score.toFixed(1)} ≥ ${th.avg.score}`,
    };
  }
  return {
    label: "Low Performer",
    score,
    displayScore: dScore,
    er,
    reason: `Belum mencapai ambang Average (butuh ER ≥ ${th.avg.er}% & Skor ≥ ${th.avg.score}).`,
  };
}

/**
 * Revenue Contribution = (Sales Generated ÷ Total Sales Bulan Ini) × 100
 * Jika Total Sales Bulan Ini <= 0 atau kosong, return null (tampil strip "-")
 */
export const calculateRevenueContribution = (
  salesGenerated: number | undefined | null,
  totalMonthlySales: number | undefined | null
): number | null => {
  const gen = n(salesGenerated);
  const total = n(totalMonthlySales);
  if (total <= 0 || gen <= 0) return null;
  return (gen / total) * 100;
};

// =============================================================================
// VERIFIKASI TEST CASES SESUAI PRD LAMPIRAN B
// =============================================================================
export function runScoringUnitTests(): {
  allPassed: boolean;
  results: { testName: string; passed: boolean; details: string }[];
} {
  const results: { testName: string; passed: boolean; details: string }[] = [];

  // Case 1: Fidget Stepper, Shorts
  // views 2.284, likes 21, followers +2 -> Skor 8.2 (tampil 8), ER 0.9% -> Mode A: Low, Mode B: Low
  {
    const m: MetricSnapshot = {
      id: "t1",
      post_id: "p1",
      captured_at: new Date().toISOString(),
      window: "7d",
      views: 2284,
      likes: 21,
      comments: 0,
      saves: 0,
      shares: 0,
      followers_gain: 2,
    };
    const s = calculateContentScore(m);
    const dS = displayScore(s);
    const er = calculateEngagementRate(m);
    const post = { status: "Posted" as const };
    const labelA = calculatePerformanceLabel(post, m, { ...DEFAULT_SCORING_CONFIG, mode: "template" }).label;
    const labelB = calculatePerformanceLabel(post, m, { ...DEFAULT_SCORING_CONFIG, mode: "calibrated" }).label;

    const pass =
      s === 8.2 &&
      dS === 8 &&
      Math.abs((er ?? 0) - 0.919) < 0.05 &&
      labelA === "Low Performer" &&
      labelB === "Low Performer";

    results.push({
      testName: "Case 1: Fidget Stepper, Shorts",
      passed: pass,
      details: `Score: ${s} (disp: ${dS}), ER: ${er?.toFixed(1)}%, LabelA: ${labelA}, LabelB: ${labelB}`,
    });
  }

  // Case 2: Kinetic Hypnotize, TikTok
  // views 318, likes 9, followers +1 -> Skor 3.8 (tampil 4), ER 2.8% -> Mode A: Low, Mode B: Average
  {
    const m: MetricSnapshot = {
      id: "t2",
      post_id: "p2",
      captured_at: new Date().toISOString(),
      window: "7d",
      views: 318,
      likes: 9,
      comments: 0,
      saves: 0,
      shares: 0,
      followers_gain: 1,
    };
    const s = calculateContentScore(m);
    const dS = displayScore(s);
    const er = calculateEngagementRate(m);
    const post = { status: "Posted" as const };
    const labelA = calculatePerformanceLabel(post, m, { ...DEFAULT_SCORING_CONFIG, mode: "template" }).label;
    const labelB = calculatePerformanceLabel(post, m, { ...DEFAULT_SCORING_CONFIG, mode: "calibrated" }).label;

    const pass =
      s === 3.8 &&
      dS === 4 &&
      Math.abs((er ?? 0) - 2.83) < 0.1 &&
      labelA === "Low Performer" &&
      labelB === "Average";

    results.push({
      testName: "Case 2: Kinetic Hypnotize, TikTok",
      passed: pass,
      details: `Score: ${s} (disp: ${dS}), ER: ${er?.toFixed(1)}%, LabelA: ${labelA}, LabelB: ${labelB}`,
    });
  }

  // Case 3: OTF Fidget Knife, Shorts
  // views 429, likes 9, shares 2, followers +1 -> Skor 4.3 (tampil 4), ER 2.6% -> Mode A: Low, Mode B: Average
  {
    const m: MetricSnapshot = {
      id: "t3",
      post_id: "p3",
      captured_at: new Date().toISOString(),
      window: "7d",
      views: 429,
      likes: 9,
      comments: 0,
      saves: 0,
      shares: 2,
      followers_gain: 1,
    };
    const s = calculateContentScore(m);
    const dS = displayScore(s);
    const er = calculateEngagementRate(m);
    const post = { status: "Posted" as const };
    const labelA = calculatePerformanceLabel(post, m, { ...DEFAULT_SCORING_CONFIG, mode: "template" }).label;
    const labelB = calculatePerformanceLabel(post, m, { ...DEFAULT_SCORING_CONFIG, mode: "calibrated" }).label;

    const pass =
      s === 4.3 &&
      dS === 4 &&
      Math.abs((er ?? 0) - 2.56) < 0.1 &&
      labelA === "Low Performer" &&
      labelB === "Average";

    results.push({
      testName: "Case 3: OTF Fidget Knife, Shorts",
      passed: pass,
      details: `Score: ${s} (disp: ${dS}), ER: ${er?.toFixed(1)}%, LabelA: ${labelA}, LabelB: ${labelB}`,
    });
  }

  // Case 4: Hipotetis (ER 6.0% & Skor 200) -> Winning di Mode A dan Mode B
  {
    const m: MetricSnapshot = {
      id: "t4",
      post_id: "p4",
      captured_at: new Date().toISOString(),
      window: "7d",
      views: 10000,
      likes: 600, // interactions = 600 -> ER = 6.0%
      comments: 0,
      saves: 0,
      shares: 0,
      followers_gain: 40, // 600 * 0.2 + 40 * 2 = 120 + 80 = 200
    };
    const s = calculateContentScore(m);
    const er = calculateEngagementRate(m);
    const post = { status: "Posted" as const };
    const labelA = calculatePerformanceLabel(post, m, { ...DEFAULT_SCORING_CONFIG, mode: "template" }).label;
    const labelB = calculatePerformanceLabel(post, m, { ...DEFAULT_SCORING_CONFIG, mode: "calibrated" }).label;

    const pass = s === 200 && er === 6.0 && labelA === "Winning" && labelB === "Winning";

    results.push({
      testName: "Case 4: Hipotetis Winning Content",
      passed: pass,
      details: `Score: ${s}, ER: ${er}%, LabelA: ${labelA}, LabelB: ${labelB}`,
    });
  }

  // Case 5: Revenue Attribution (Rp250k / Rp1.000k -> 25%)
  {
    const rev = calculateRevenueContribution(250000, 1000000);
    const pass = rev === 25;
    results.push({
      testName: "Case 5: Revenue Attribution 25%",
      passed: pass,
      details: `Calculated: ${rev}%`,
    });
  }

  // Case 6: Revenue Attribution Total Kosong (null / strip)
  {
    const rev = calculateRevenueContribution(250000, 0);
    const pass = rev === null;
    results.push({
      testName: "Case 6: Revenue Total Kosong -> null",
      passed: pass,
      details: `Calculated: ${rev}`,
    });
  }

  // Case 7: Half-up Rounding (0.5 -> 1)
  {
    const disp = displayScore(0.5);
    const pass = disp === 1;
    results.push({
      testName: "Case 7: Half-up Rounding (0.5 -> 1)",
      passed: pass,
      details: `displayScore(0.5) = ${disp}`,
    });
  }

  const allPassed = results.every((r) => r.passed);
  return { allPassed, results };
}
