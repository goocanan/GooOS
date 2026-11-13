"use client";

import React, { useState } from "react";
import {
  Content,
  Post,
  ScoringConfig,
  SalesAttribution,
  MonthlySales,
  PerformanceLabel,
} from "@/lib/content-planner/types";
import {
  calculateInteractions,
  calculateEngagementRate,
  calculateContentScore,
  displayScore,
  calculatePerformanceLabel,
  calculateRevenueContribution,
} from "@/lib/content-planner/scoring";
import {
  TrendingUp,
  ArrowUpDown,
  Filter,
  Edit2,
  ExternalLink,
  Info,
} from "lucide-react";

interface PerformaTabProps {
  contents: Content[];
  posts: Post[];
  config: ScoringConfig;
  salesAttributions: SalesAttribution[];
  monthlySales: MonthlySales[];
  onOpenMetricModal: (post: Post) => void;
  onOpenDetailModal: (post: Post, content: Content) => void;
}

export function PerformaTab({
  contents,
  posts,
  config,
  salesAttributions,
  monthlySales,
  onOpenMetricModal,
  onOpenDetailModal,
}: PerformaTabProps) {
  const [platformFilter, setPlatformFilter] = useState("all");
  const [labelFilter, setLabelFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"views" | "score" | "er" | "date">("score");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [search, setSearch] = useState("");

  const currentMonthSales =
    monthlySales.find((m) => m.month === "2026-11")?.total_sales_rp || 18500000;

  // Process rows with calculations
  const rows = posts.map((post) => {
    const parent = contents.find((c) => c.id === post.content_id);
    const snap = post.snapshots[post.snapshots.length - 1] || null;
    const inter = calculateInteractions(snap);
    const er = calculateEngagementRate(snap);
    const score = calculateContentScore(snap, config.weights);
    const dispScore = displayScore(score);
    const labelResult = calculatePerformanceLabel(post, snap, config, posts);
    const label = labelResult.label;

    // Sales attribution
    const attr = salesAttributions.filter(
      (a) => a.content_id === post.content_id || a.post_id === post.id
    );
    const salesRp = attr.reduce((s, a) => s + (a.sales_rp || 0), 0);
    const revShare = calculateRevenueContribution(salesRp, currentMonthSales);

    return {
      post,
      content: parent,
      snap,
      inter,
      er,
      score,
      dispScore,
      label,
      salesRp,
      revShare,
    };
  });

  // Filter
  const filtered = rows.filter((r) => {
    const matchesSearch =
      (r.content?.title || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.content?.code || "").toLowerCase().includes(search.toLowerCase());
    const matchesPlatform =
      platformFilter === "all" || r.post.platform === platformFilter;
    const matchesLabel = labelFilter === "all" || r.label === labelFilter;
    return matchesSearch && matchesPlatform && matchesLabel;
  });

  // Sort
  filtered.sort((a, b) => {
    let diff = 0;
    if (sortBy === "views") {
      diff = (a.snap?.views || 0) - (b.snap?.views || 0);
    } else if (sortBy === "score") {
      diff = a.score - b.score;
    } else if (sortBy === "er") {
      diff = (a.er || 0) - (b.er || 0);
    } else if (sortBy === "date") {
      diff = (a.post.posted_at || "").localeCompare(b.post.posted_at || "");
    }
    return sortDir === "desc" ? -diff : diff;
  });

  const getLabelBadge = (l: PerformanceLabel) => {
    switch (l) {
      case "Winning":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
      case "Average":
        return "bg-amber-500/20 text-amber-300 border-amber-500/30";
      case "Low Performer":
        return "bg-rose-500/20 text-rose-300 border-rose-500/30";
      case "Data kurang":
        return "bg-amber-900/30 text-amber-400 border-amber-800/40";
      case "Belum tayang":
        return "bg-slate-800 text-slate-400 border-slate-700";
      default:
        return "bg-slate-800 text-slate-400 border-slate-700";
    }
  };

  const getPlatformIcon = (plat: string) => {
    switch (plat) {
      case "tiktok":
        return "🎵";
      case "instagram":
        return "📸";
      case "youtube_shorts":
        return "▶️";
      case "youtube_video":
        return "📺";
      case "facebook":
        return "📘";
      default:
        return "🌐";
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters bar */}
      <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Platform Filter */}
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-xs focus:outline-none focus:border-indigo-500"
          >
            <option value="all">Semua Platform</option>
            <option value="tiktok">TikTok</option>
            <option value="instagram">Instagram</option>
            <option value="youtube_shorts">YouTube Shorts</option>
            <option value="youtube_video">YouTube Video</option>
            <option value="facebook">Facebook</option>
          </select>

          {/* Label Filter */}
          <select
            value={labelFilter}
            onChange={(e) => setLabelFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-xs focus:outline-none focus:border-indigo-500"
          >
            <option value="all">Semua Label Evaluasi</option>
            <option value="Winning">Winning 🏆</option>
            <option value="Average">Average ⚖️</option>
            <option value="Low Performer">Low Performer 📉</option>
            <option value="Data kurang">Data Kurang (&lt;100 views) ⚠️</option>
            <option value="Belum tayang">Belum Tayang</option>
          </select>

          {/* Sort By */}
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl px-2 py-1 text-xs text-slate-400">
            <span>Urutkan:</span>
            <button
              onClick={() => {
                if (sortBy === "score") setSortDir(sortDir === "asc" ? "desc" : "asc");
                else {
                  setSortBy("score");
                  setSortDir("desc");
                }
              }}
              className={`px-2 py-0.5 rounded font-medium ${
                sortBy === "score" ? "text-indigo-400 font-bold" : "hover:text-slate-200"
              }`}
            >
              Skor
            </button>
            <button
              onClick={() => {
                if (sortBy === "views") setSortDir(sortDir === "asc" ? "desc" : "asc");
                else {
                  setSortBy("views");
                  setSortDir("desc");
                }
              }}
              className={`px-2 py-0.5 rounded font-medium ${
                sortBy === "views" ? "text-indigo-400 font-bold" : "hover:text-slate-200"
              }`}
            >
              Views
            </button>
            <button
              onClick={() => {
                if (sortBy === "er") setSortDir(sortDir === "asc" ? "desc" : "asc");
                else {
                  setSortBy("er");
                  setSortDir("desc");
                }
              }}
              className={`px-2 py-0.5 rounded font-medium ${
                sortBy === "er" ? "text-indigo-400 font-bold" : "hover:text-slate-200"
              }`}
            >
              ER
            </button>
          </div>
        </div>

        <input
          type="text"
          placeholder="Cari judul / kode konten..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:w-64 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500"
        />
      </div>

      {/* Main Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/90 text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-3">Kode</th>
                <th className="py-3 px-3">Konten &amp; Platform</th>
                <th className="py-3 px-3 text-right">Views</th>
                <th className="py-3 px-3 text-right">Interaksi</th>
                <th className="py-3 px-3 text-right">ER (Views)</th>
                <th className="py-3 px-3 text-right">Skor Metrik</th>
                <th className="py-3 px-3 text-center">Label Evaluasi</th>
                <th className="py-3 px-3 text-right">Kontribusi Omzet</th>
                <th className="py-3 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {filtered.map((item) => {
                return (
                  <tr
                    key={item.post.id}
                    className="hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-3 font-mono text-indigo-400 font-semibold whitespace-nowrap">
                      {item.content?.code}
                    </td>

                    <td className="py-3 px-3 min-w-[200px] max-w-xs">
                      <div
                        onClick={() => {
                          if (item.content) onOpenDetailModal(item.post, item.content);
                        }}
                        className="font-medium text-slate-100 hover:text-indigo-300 truncate cursor-pointer transition-colors"
                      >
                        {item.content?.title}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <span>{getPlatformIcon(item.post.platform)}</span>
                        <span className="capitalize">{item.post.platform.replace("_", " ")}</span>
                        <span>•</span>
                        <span className="text-[10px]">{item.post.status}</span>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-medium">
                      {item.snap?.views ? item.snap.views.toLocaleString("id-ID") : "-"}
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-slate-400 text-[11px]">
                      {item.inter > 0 ? (
                        <span>
                          {item.inter}{" "}
                          <span className="text-[10px] text-slate-600">
                            (L:{item.snap?.likes} C:{item.snap?.comments} S:{item.snap?.saves})
                          </span>
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-indigo-300 font-semibold">
                      {item.er !== null ? `${item.er.toFixed(2)}%` : "-"}
                    </td>

                    <td className="py-3 px-3 text-right font-mono">
                      {item.snap ? (
                        <span className="text-emerald-400 font-bold">
                          {item.dispScore}{" "}
                          <span className="text-[10px] text-slate-500 font-normal">
                            ({item.score.toFixed(2)})
                          </span>
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold whitespace-nowrap ${getLabelBadge(
                          item.label
                        )}`}
                      >
                        {item.label}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-[11px]">
                      {item.salesRp > 0 ? (
                        <div>
                          <div className="text-violet-300 font-medium">
                            Rp {(item.salesRp / 1000).toLocaleString("id-ID")}k
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {item.revShare !== null ? `${item.revShare.toFixed(1)}%` : ""}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-right whitespace-nowrap space-x-1.5">
                      <button
                        onClick={() => onOpenMetricModal(item.post)}
                        className="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 text-[11px] font-medium flex items-center gap-1 inline-flex"
                        title="Input / Edit Metrik Snapshot"
                      >
                        <Edit2 className="w-3 h-3" /> Metrik
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
