// =============================================================================
// CONTENT PLANNER & PERFORMANCE TRACKER - LOCAL STORAGE & PERSISTENCE
// Handles client-side persistence, CRUD operations, export/import (JSON/CSV)
// =============================================================================

import {
  Account,
  Content,
  Post,
  Idea,
  PillarProfile,
  LibraryItem,
  MonthlySales,
  SalesAttribution,
  ScoringConfig,
  PlatformType,
  PostFormat,
  MetricSnapshot,
} from "./types";
import {
  INITIAL_ACCOUNTS,
  INITIAL_CONTENTS,
  INITIAL_POSTS,
  INITIAL_IDEAS,
  INITIAL_PILLAR_PROFILE,
  INITIAL_LIBRARY_ITEMS,
  INITIAL_MONTHLY_SALES,
  INITIAL_SALES_ATTRIBUTIONS,
} from "./initial-data";
import { DEFAULT_SCORING_CONFIG } from "./scoring";

export const STORAGE_KEY = "gooos_content_planner_v1";

export interface ContentPlannerState {
  accounts: Account[];
  contents: Content[];
  posts: Post[];
  ideas: Idea[];
  pillarProfile: PillarProfile;
  libraryItems: LibraryItem[];
  monthlySales: MonthlySales[];
  salesAttributions: SalesAttribution[];
  config: ScoringConfig;
  lastUpdated: string;
}

export function getInitialState(): ContentPlannerState {
  return {
    accounts: INITIAL_ACCOUNTS,
    contents: INITIAL_CONTENTS,
    posts: INITIAL_POSTS,
    ideas: INITIAL_IDEAS,
    pillarProfile: INITIAL_PILLAR_PROFILE,
    libraryItems: INITIAL_LIBRARY_ITEMS,
    monthlySales: INITIAL_MONTHLY_SALES,
    salesAttributions: INITIAL_SALES_ATTRIBUTIONS,
    config: DEFAULT_SCORING_CONFIG,
    lastUpdated: new Date().toISOString(),
  };
}

export function loadPlannerState(): ContentPlannerState {
  if (typeof window === "undefined") {
    return getInitialState();
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = getInitialState();
      savePlannerState(initial);
      return initial;
    }
    const parsed = JSON.parse(raw) as Partial<ContentPlannerState>;
    return {
      accounts: parsed.accounts?.length ? parsed.accounts : INITIAL_ACCOUNTS,
      contents: parsed.contents?.length ? parsed.contents : INITIAL_CONTENTS,
      posts: parsed.posts?.length ? parsed.posts : INITIAL_POSTS,
      ideas: parsed.ideas?.length ? parsed.ideas : INITIAL_IDEAS,
      pillarProfile: parsed.pillarProfile || INITIAL_PILLAR_PROFILE,
      libraryItems: parsed.libraryItems?.length ? parsed.libraryItems : INITIAL_LIBRARY_ITEMS,
      monthlySales: parsed.monthlySales?.length ? parsed.monthlySales : INITIAL_MONTHLY_SALES,
      salesAttributions: parsed.salesAttributions?.length ? parsed.salesAttributions : INITIAL_SALES_ATTRIBUTIONS,
      config: parsed.config || DEFAULT_SCORING_CONFIG,
      lastUpdated: parsed.lastUpdated || new Date().toISOString(),
    };
  } catch (err) {
    console.error("Gagal memuat state Content Planner dari localStorage:", err);
    return getInitialState();
  }
}

export function savePlannerState(state: ContentPlannerState): void {
  if (typeof window === "undefined") return;
  try {
    const toSave = {
      ...state,
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (err) {
    console.error("Gagal menyimpan state Content Planner:", err);
  }
}

export function resetPlannerState(): ContentPlannerState {
  const initial = getInitialState();
  savePlannerState(initial);
  return initial;
}

// =============================================================================
// Helper Promosi Ide -> Content + N Postingan Multi-Platform
// =============================================================================
export function promoteIdeaToContent(
  state: ContentPlannerState,
  ideaId: string,
  targetPlatforms: PlatformType[],
  contentCode?: string
): { nextState: ContentPlannerState; newContentId: string } {
  const idea = state.ideas.find((i) => i.id === ideaId);
  if (!idea) throw new Error("Ide tidak ditemukan");

  const newContentId = `content_${Date.now()}`;
  const code = contentCode || `C${state.contents.length + 1}`;

  const newContent: Content = {
    id: newContentId,
    code,
    title: idea.title,
    idea_id: idea.id,
    category: idea.category || "Fidget & Sensory",
    cta_goal: idea.cta_goal || "Follow & Komentar",
    target_product: idea.title,
    brief: {
      hook: idea.title,
      script_structure: "Hook (0-3s) -> Demonstrasi / Problem -> CTA",
      caption: `${idea.title} - Dibuat dengan 3D Print presisi tinggi di GOOCANAN! Simpan & bagikan jika kamu suka inovasi ini.`,
      cta_text: "Komentar di bawah jika mau file STL / produk jadinya!",
      reference_url: idea.reference_url,
    },
    policy_checklist: {
      no_weapon_likeness: true,
      safe_for_all_ages: true,
      platform_guidelines_compliant: true,
      clear_3d_printed_disclaimer: true,
    },
    created_at: new Date().toISOString(),
  };

  const newPosts: Post[] = targetPlatforms.map((platform, idx) => {
    // Cari akun matching
    const account = state.accounts.find((a) => a.platform === platform);
    const accountId = account ? account.id : `acc_${platform}`;

    let format: PostFormat = "reels_tiktok_shorts";
    if (platform === "youtube_video") format = "youtube_video";
    else if (platform === "instagram") format = "reels_tiktok_shorts";
    else if (platform === "facebook") format = "facebook_reels";

    return {
      id: `post_${Date.now()}_${idx}`,
      content_id: newContentId,
      account_id: accountId,
      platform,
      format,
      status: "Script",
      snapshots: [],
      selected_snapshot_window: "7d",
    };
  });

  const updatedIdeas = state.ideas.map((i) =>
    i.id === ideaId ? { ...i, status: "in_use" as const } : i
  );

  const nextState: ContentPlannerState = {
    ...state,
    ideas: updatedIdeas,
    contents: [newContent, ...state.contents],
    posts: [...newPosts, ...state.posts],
  };

  savePlannerState(nextState);
  return { nextState, newContentId };
}

// =============================================================================
// Helper Export / Import
// =============================================================================
export function exportStateToJson(state: ContentPlannerState): string {
  return JSON.stringify(state, null, 2);
}

export function exportPostsToCsv(state: ContentPlannerState): string {
  const headers = [
    "Content Code",
    "Content Title",
    "Platform",
    "Status",
    "Views",
    "Likes",
    "Comments",
    "Saves",
    "Shares",
    "Followers Gain",
    "Scheduled At",
    "Post URL",
  ];

  const rows = state.posts.map((post) => {
    const parent = state.contents.find((c) => c.id === post.content_id);
    const snapshot = post.snapshots[post.snapshots.length - 1] || null;
    return [
      `"${parent?.code || ""}"`,
      `"${(parent?.title || "").replace(/"/g, '""')}"`,
      post.platform,
      post.status,
      snapshot?.views || 0,
      snapshot?.likes || 0,
      snapshot?.comments || 0,
      snapshot?.saves || 0,
      snapshot?.shares || 0,
      snapshot?.followers_gain || 0,
      `"${post.scheduled_at || ""}"`,
      `"${post.post_url || ""}"`,
    ].join(",");
  });

  return [headers.join(","), ...rows].join("\n");
}

export function importStateFromJson(jsonString: string): ContentPlannerState {
  const parsed = JSON.parse(jsonString);
  if (!parsed.contents || !parsed.posts) {
    throw new Error("Format JSON tidak valid: tidak memiliki data contents atau posts");
  }
  const newState: ContentPlannerState = {
    ...getInitialState(),
    ...parsed,
    lastUpdated: new Date().toISOString(),
  };
  savePlannerState(newState);
  return newState;
}

/**
 * Parser angka yang toleran terhadap pemisah ribuan titik atau koma (2.286 / 2,286)
 */
export function parseNumericInput(val: string | number | undefined | null): number {
  if (val === undefined || val === null || val === "") return 0;
  if (typeof val === "number") return isNaN(val) ? 0 : val;
  // Hapus titik ribuan atau koma ribuan
  const cleaned = val.replace(/\./g, "").replace(/,/g, "").trim();
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}
