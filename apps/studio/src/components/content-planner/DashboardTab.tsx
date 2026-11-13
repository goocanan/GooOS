"use client";

import React from "react";
import {
  Content,
  Post,
  Account,
  ScoringConfig,
  SalesAttribution,
  MonthlySales,
} from "@/lib/content-planner/types";
import {
  calculateEngagementRate,
  calculateContentScore,
  displayScore,
  calculatePerformanceLabel,
  calculateRevenueContribution,
} from "@/lib/content-planner/scoring";
import {
  Eye,
  Users,
  Film,
  TrendingUp,
  Award,
  AlertCircle,
  Clock,
  DollarSign,
  ChevronRight,
  ExternalLink,
} from "lucide-react";

interface DashboardTabProps {
  contents: Content[];
  posts: Post[];
  accounts: Account[];
  config: ScoringConfig;
  salesAttributions: SalesAttribution[];
  monthlySales: MonthlySales[];
  onOpenMetricModal: (post: Post) => void;
  onOpenDetailModal: (post: Post, content: Content) => void;
  onSwitchTab: (tabId: string) => void;
}

export function DashboardTab({
  contents,
  posts,
  accounts,
  config,
  salesAttributions,
  monthlySales,
  onOpenMetricModal,
  onOpenDetailModal,
  onSwitchTab,
}: DashboardTabProps) {
  // Aggregate Views across all posts
  const totalViews = posts.reduce((sum, p) => {
    const snap = p.snapshots[p.snapshots.length - 1];
    return sum + (snap?.views || 0);
  }, 0);

  // Aggregate Follower Gain
  const totalFollowerGain = posts.reduce((sum, p) => {
    const snap = p.snapshots[p.snapshots.length - 1];
    return sum + (snap?.followers_gain || 0);
  }, 0);

  // Posted count
  const postedCount = posts.filter((p) => p.status === "Posted").length;
  const inPipelineCount = posts.filter(
    (p) => p.status !== "Posted" && p.status !== "Archived"
  ).length;

  // Performance labels distribution
  const labelCounts: Record<string, number> = {
    Winning: 0,
    Average: 0,
    "Low Performer": 0,
    "Data kurang": 0,
    "Belum tayang": 0,
    "Belum ada data": 0,
  };

  posts.forEach((p) => {
    const snap = p.snapshots[p.snapshots.length - 1];
    const res = calculatePerformanceLabel(p, snap, config, posts);
    labelCounts[res.label] = (labelCounts[res.label] || 0) + 1;
  });

  // Calculate top 5 posts by score
  const postsWithScores = posts.map((p) => {
    const parent = contents.find((c) => c.id === p.content_id);
    const snap = p.snapshots[p.snapshots.length - 1] || null;
    const er = calculateEngagementRate(snap);
    const score = calculateContentScore(snap, config.weights);
    const res = calculatePerformanceLabel(p, snap, config, posts);
    return {
      post: p,
      content: parent,
      snap,
      er,
      score,
      dispScore: displayScore(score),
      label: res.label,
    };
  });

  const top5Posts = [...postsWithScores]
    .filter((item) => item.post.status === "Posted")
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  // Pipeline Due / Upcoming
  const upcomingPosts = posts
    .filter((p) => p.status !== "Posted" && p.status !== "Archived")
    .slice(0, 5);

  // Total Attributed Sales
  const totalAttributedRp = salesAttributions.reduce(
    (sum, a) => sum + (a.sales_rp || 0),
    0
  );
  const currentMonthSales =
    monthlySales.find((m) => m.month === "2026-11")?.total_sales_rp || 18500000;
  const revenueShare = calculateRevenueContribution(
    totalAttributedRp,
    currentMonthSales
  );

  return (
    <div className="space-y-6">
      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Views */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400">
              Total Tayangan (Views)
            </span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100">
            {totalViews.toLocaleString("id-ID")}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span className="text-emerald-400 font-medium">31 Postingan</span> multi-platform
          </div>
        </div>

        {/* Follower Gain */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400">
              Follower Baru Net
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            +{totalFollowerGain.toLocaleString("id-ID")}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            Target fase awal menuju 1.000 followers
          </div>
        </div>

        {/* Postingan Tayang */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400">
              Status Postingan
            </span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Film className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100">
            {postedCount}{" "}
            <span className="text-sm font-normal text-slate-500">/ {posts.length}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            <span className="text-amber-400 font-medium">{inPipelineCount}</span> dalam pipeline aktif
          </div>
        </div>

        {/* Atribusi Penjualan */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400">
              Atribusi Omzet Konten
            </span>
            <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-violet-300">
            Rp {(totalAttributedRp / 1000).toLocaleString("id-ID")}k
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            <span className="text-violet-400 font-medium">
              {revenueShare !== null ? `${revenueShare.toFixed(1)}%` : "0%"}
            </span>{" "}
            dari omzet Nov 2026
          </div>
        </div>
      </div>

      {/* Distribution & Mode Banner */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-indigo-400" />
            Distribusi Evaluasi Kinerja Konten (Mode Terkalibrasi)
          </div>
          <p className="text-[11px] text-slate-500">
            Berdasarkan threshold terkalibrasi ER &ge; 3.0% &amp; Skor &ge; 4.0 (Winning) | ER &ge; 2.0% &amp; Skor &ge; 2.0 (Average).
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1">
            🏆 {labelCounts["Winning"] || 0} Winning
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1">
            ⚖️ {labelCounts["Average"] || 0} Average
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1">
            📉 {labelCounts["Low Performer"] || 0} Low Performer
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-amber-900/30 text-amber-400 border border-amber-800/40 text-xs font-semibold flex items-center gap-1">
            ⚠️ {labelCounts["Data kurang"] || 0} Data Kurang (&lt;100 views)
          </span>
        </div>
      </div>

      {/* Grid: Top 5 Content & Upcoming Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Top 5 Content Ranking */}
        <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Top 5 Konten Berkinerja Terbaik
              </h3>
              <p className="text-[11px] text-slate-500">
                Peringkat postingan berdasarkan Content Score &amp; Engagement Rate
              </p>
            </div>
            <button
              onClick={() => onSwitchTab("performa")}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5"
            >
              Lihat Semua ({posts.length}) <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {top5Posts.map((item, idx) => {
              const platformIcon =
                item.post.platform === "tiktok"
                  ? "🎵"
                  : item.post.platform === "instagram"
                  ? "📸"
                  : item.post.platform === "youtube_shorts"
                  ? "▶️"
                  : item.post.platform === "youtube_video"
                  ? "📺"
                  : "📘";

              return (
                <div
                  key={item.post.id}
                  onClick={() => {
                    if (item.content) onOpenDetailModal(item.post, item.content);
                  }}
                  className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between gap-3 cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-bold font-mono text-slate-300 flex-shrink-0">
                      #{idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{platformIcon}</span>
                        <span className="text-xs font-medium text-slate-100 truncate">
                          {item.content?.title || "Untitled Post"}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-300 font-mono">
                          {item.content?.code}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-3 mt-0.5">
                        <span>Views: {item.snap?.views.toLocaleString("id-ID")}</span>
                        <span>ER: {item.er !== null ? `${item.er.toFixed(2)}%` : "-"}</span>
                        <span>Likes: {item.snap?.likes || 0}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <div className="text-sm font-bold font-mono text-emerald-400">
                        {item.dispScore}
                      </div>
                      <div className="text-[10px] text-slate-500">Skor</div>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${
                        item.label === "Winning"
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                          : item.label === "Average"
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                          : "bg-rose-500/20 text-rose-300 border-rose-500/30"
                      }`}
                    >
                      {item.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Pipeline Antrean & Produksi Due */}
        <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                Antrean Pipeline Produksi
              </h3>
              <p className="text-[11px] text-slate-500">
                Konten dalam tahap naskah, pengambilan gambar, &amp; editing
              </p>
            </div>
            <button
              onClick={() => onSwitchTab("pipeline")}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5"
            >
              Papan Kanban <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {upcomingPosts.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500 bg-slate-950/40 rounded-xl">
                Semua konten telah tayang atau dipindahkan ke arsip!
              </div>
            ) : (
              upcomingPosts.map((post) => {
                const parent = contents.find((c) => c.id === post.content_id);
                return (
                  <div
                    key={post.id}
                    onClick={() => {
                      if (parent) onOpenDetailModal(post, parent);
                    }}
                    className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between cursor-pointer"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-slate-200 truncate">
                        {parent?.title || "Untitled"}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span className="capitalize">{post.platform}</span>
                        <span>•</span>
                        <span>{parent?.category}</span>
                      </div>
                    </div>
                    <span className="text-[10px] px-2.5 py-1 rounded-full font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      {post.status}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
