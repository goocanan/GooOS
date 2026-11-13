"use client";

import React, { useState } from "react";
import {
  Content,
  Post,
  PostStatus,
  PlatformType,
} from "@/lib/content-planner/types";
import {
  Kanban,
  Table as TableIcon,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Filter,
  Plus,
  Eye,
  ExternalLink,
  Edit3,
} from "lucide-react";

interface PipelineTabProps {
  contents: Content[];
  posts: Post[];
  onUpdatePostStatus: (postId: string, status: PostStatus) => void;
  onOpenDetailModal: (post: Post, content: Content) => void;
  onOpenMetricModal: (post: Post) => void;
  onNewContent: () => void;
}

const KANBAN_COLUMNS: { id: PostStatus; label: string; color: string }[] = [
  { id: "Idea", label: "Idea", color: "border-slate-700 bg-slate-900/60" },
  { id: "Script", label: "Naskah (Script)", color: "border-sky-500/30 bg-sky-950/20" },
  { id: "Shoot", label: "Shooting", color: "border-amber-500/30 bg-amber-950/20" },
  { id: "Edit", label: "Editing", color: "border-purple-500/30 bg-purple-950/20" },
  { id: "Scheduled", label: "Terjadwal", color: "border-indigo-500/30 bg-indigo-950/20" },
  { id: "Posted", label: "Tayang (Posted)", color: "border-emerald-500/30 bg-emerald-950/20" },
  { id: "Archived", label: "Arsip", color: "border-slate-800 bg-slate-950/40" },
];

export function PipelineTab({
  contents,
  posts,
  onUpdatePostStatus,
  onOpenDetailModal,
  onOpenMetricModal,
  onNewContent,
}: PipelineTabProps) {
  const [viewMode, setViewMode] = useState<"kanban" | "table" | "calendar">("kanban");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const filteredPosts = posts.filter((p) => {
    const parent = contents.find((c) => c.id === p.content_id);
    const matchesSearch =
      (parent?.title || "").toLowerCase().includes(search.toLowerCase()) ||
      (parent?.code || "").toLowerCase().includes(search.toLowerCase());
    const matchesPlatform = platformFilter === "all" || p.platform === platformFilter;
    return matchesSearch && matchesPlatform;
  });

  const getPlatformIcon = (plat: PlatformType) => {
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

  const advanceStatus = (current: PostStatus, dir: "prev" | "next"): PostStatus => {
    const order: PostStatus[] = [
      "Idea",
      "Script",
      "Shoot",
      "Edit",
      "Scheduled",
      "Posted",
      "Archived",
    ];
    const idx = order.indexOf(current);
    if (dir === "next" && idx >= 0 && idx < order.length - 1) {
      return order[idx + 1] ?? current;
    }
    if (dir === "prev" && idx > 0) {
      return order[idx - 1] ?? current;
    }
    return current;
  };

  return (
    <div className="space-y-4">
      {/* Top Filter and View Switcher Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* View Mode */}
          <div className="flex items-center p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <button
              onClick={() => setViewMode("kanban")}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition-all ${
                viewMode === "kanban"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Kanban className="w-3.5 h-3.5" /> Kanban
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition-all ${
                viewMode === "table"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" /> Tabel
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition-all ${
                viewMode === "calendar"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" /> Kalender
            </button>
          </div>

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
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <input
            type="text"
            placeholder="Cari judul / kode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500 w-48"
          />
          <button
            onClick={onNewContent}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1 shadow-md shadow-indigo-600/20 whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" /> Konten Baru
          </button>
        </div>
      </div>

      {/* Kanban Board View */}
      {viewMode === "kanban" && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 overflow-x-auto pb-4">
          {KANBAN_COLUMNS.filter((c) => c.id !== "Archived").map((col) => {
            const colPosts = filteredPosts.filter((p) => p.status === col.id);

            return (
              <div
                key={col.id}
                className={`rounded-2xl border p-3 flex flex-col min-h-[580px] ${col.color}`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                  <span className="text-xs font-semibold text-slate-200">
                    {col.label}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                    {colPosts.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="space-y-2.5 flex-1 overflow-y-auto">
                  {colPosts.length === 0 ? (
                    <div className="text-center py-8 text-[11px] text-slate-500 italic">
                      Kosong
                    </div>
                  ) : (
                    colPosts.map((post) => {
                      const parent = contents.find((c) => c.id === post.content_id);
                      const latestSnap = post.snapshots[post.snapshots.length - 1];

                      return (
                        <div
                          key={post.id}
                          className="p-3 rounded-xl bg-slate-900 border border-slate-800/90 hover:border-slate-700 shadow-sm transition-all space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm">
                              {getPlatformIcon(post.platform)}
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                              {parent?.code}
                            </span>
                          </div>

                          <div
                            onClick={() => {
                              if (parent) onOpenDetailModal(post, parent);
                            }}
                            className="cursor-pointer group"
                          >
                            <h4 className="text-xs font-medium text-slate-100 group-hover:text-indigo-300 line-clamp-2 transition-colors">
                              {parent?.title || "Untitled Post"}
                            </h4>
                          </div>

                          {/* Hook preview */}
                          {parent?.brief?.hook && (
                            <p className="text-[10px] text-slate-400 line-clamp-1 italic bg-slate-950/60 p-1 rounded">
                              &ldquo;{parent.brief.hook}&rdquo;
                            </p>
                          )}

                          {/* Views if posted */}
                          {latestSnap && (
                            <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between pt-1 border-t border-slate-800/60">
                              <span>Views: {latestSnap.views.toLocaleString("id-ID")}</span>
                              <span className="text-emerald-400 font-semibold">
                                {latestSnap.likes} likes
                              </span>
                            </div>
                          )}

                          {/* Action Advance Bar */}
                          <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
                            <button
                              onClick={() =>
                                onUpdatePostStatus(post.id, advanceStatus(post.status, "prev"))
                              }
                              disabled={post.status === "Idea"}
                              className="p-1 rounded text-slate-500 hover:text-slate-200 disabled:opacity-30 disabled:hover:text-slate-500"
                              title="Kembali ke tahap sebelumnya"
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => onOpenMetricModal(post)}
                              className="px-2 py-0.5 rounded text-[10px] font-medium text-indigo-300 hover:bg-indigo-500/20"
                            >
                              Metrik
                            </button>

                            <button
                              onClick={() =>
                                onUpdatePostStatus(post.id, advanceStatus(post.status, "next"))
                              }
                              disabled={post.status === "Posted"}
                              className="p-1 rounded text-slate-500 hover:text-slate-200 disabled:opacity-30 disabled:hover:text-slate-500"
                              title="Lanjut ke tahap berikutnya"
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table View */}
      {viewMode === "table" && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Kode</th>
                  <th className="py-3 px-4">Judul Konten</th>
                  <th className="py-3 px-4">Platform</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Jadwal Tayang</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {filteredPosts.map((post) => {
                  const parent = contents.find((c) => c.id === post.content_id);
                  return (
                    <tr
                      key={post.id}
                      className="hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono text-indigo-400 font-semibold">
                        {parent?.code}
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate font-medium">
                        {parent?.title}
                      </td>
                      <td className="py-3 px-4">
                        <span className="flex items-center gap-1.5 capitalize">
                          {getPlatformIcon(post.platform)} {post.platform.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 border border-slate-700">
                          {post.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-[11px]">
                        {post.scheduled_at || post.posted_at || "-"}
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => {
                            if (parent) onOpenDetailModal(post, parent);
                          }}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px]"
                        >
                          Brief
                        </button>
                        <button
                          onClick={() => onOpenMetricModal(post)}
                          className="px-2 py-1 rounded bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 text-[10px]"
                        >
                          Metrik
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Calendar View */}
      {viewMode === "calendar" && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-indigo-400" />
              Jadwal Distribusi Konten (November 2026)
            </h3>
            <span className="text-xs text-slate-400">
              {filteredPosts.filter((p) => p.scheduled_at || p.posted_at).length} postingan terjadwal
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredPosts
              .filter((p) => p.scheduled_at || p.posted_at)
              .map((post) => {
                const parent = contents.find((c) => c.id === post.content_id);
                return (
                  <div
                    key={post.id}
                    className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="flex items-center gap-1.5 font-mono text-indigo-400">
                        {getPlatformIcon(post.platform)} {post.platform}
                      </span>
                      <span className="font-semibold text-emerald-400">
                        {post.posted_at || post.scheduled_at}
                      </span>
                    </div>
                    <h4 className="text-xs font-medium text-slate-100 line-clamp-2">
                      {parent?.title}
                    </h4>
                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => {
                          if (parent) onOpenDetailModal(post, parent);
                        }}
                        className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                      >
                        Buka Detail &rarr;
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
