"use client";

import React, { useState } from "react";
import { Account, Post } from "@/lib/content-planner/types";
import { Users, Eye, Film, TrendingUp, Edit3, Check } from "lucide-react";

interface PlatformTrackerTabProps {
  accounts: Account[];
  posts: Post[];
  onUpdateAccountFollowers: (accountId: string, currentFollowers: number) => void;
}

export function PlatformTrackerTab({
  accounts,
  posts,
  onUpdateAccountFollowers,
}: PlatformTrackerTabProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editVal, setEditVal] = useState<string>("");

  const getPlatformIcon = (plat: string) => {
    switch (plat) {
      case "tiktok":
        return "🎵";
      case "instagram":
        return "📸";
      case "youtube_shorts":
      case "youtube_video":
        return "▶️";
      case "facebook":
        return "📘";
      default:
        return "🌐";
    }
  };

  const handleStartEdit = (acc: Account) => {
    setEditingId(acc.id);
    setEditVal(acc.followers_current.toString());
  };

  const handleSaveEdit = (acc: Account) => {
    const parsed = parseInt(editVal.replace(/\./g, "").replace(/,/g, ""), 10);
    if (!isNaN(parsed) && parsed >= 0) {
      onUpdateAccountFollowers(acc.id, parsed);
    }
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
        <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-indigo-400" />
          Tracker Akun &amp; Pertumbuhan Platform GOOCANAN
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Pantau pertumbuhan follower, total views, dan produktivitas postingan lintas channel secara terpusat.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((acc) => {
          // Count posts belonging to this account or platform
          const accPosts = posts.filter(
            (p) => p.account_id === acc.id || p.platform === acc.platform
          );
          const totalViews = accPosts.reduce((sum, p) => {
            const snap = p.snapshots[p.snapshots.length - 1];
            return sum + (snap?.views || 0);
          }, 0);
          const postedCount = accPosts.filter((p) => p.status === "Posted").length;
          const netGain = acc.followers_current - acc.followers_start;

          // Milestone target: 1,000 followers
          const target = 1000;
          const progressPct = Math.min(
            100,
            Math.round((acc.followers_current / target) * 100)
          );

          const isEditing = editingId === acc.id;

          return (
            <div
              key={acc.id}
              className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all shadow-sm space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{getPlatformIcon(acc.platform)}</span>
                  <div>
                    <h4 className="text-sm font-bold text-slate-100">{acc.name}</h4>
                    <span className="text-xs text-indigo-400 font-mono">
                      {acc.handle}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium capitalize">
                  {acc.status}
                </span>
              </div>

              {/* Follower Stats Card */}
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-500" /> Followers Saat Ini
                  </span>
                  {isEditing ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={editVal}
                        onChange={(e) => setEditVal(e.target.value)}
                        className="w-20 px-2 py-0.5 rounded bg-slate-900 border border-indigo-500 text-xs font-mono text-slate-100"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveEdit(acc)}
                        className="p-1 rounded bg-indigo-600 text-white hover:bg-indigo-500"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-base text-slate-100">
                        {acc.followers_current.toLocaleString("id-ID")}
                      </span>
                      <button
                        onClick={() => handleStartEdit(acc)}
                        className="text-slate-500 hover:text-slate-300"
                        title="Edit follower"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-800/60">
                  <span>Awal: {acc.followers_start.toLocaleString("id-ID")}</span>
                  <span
                    className={`font-semibold font-mono ${
                      netGain >= 0 ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {netGain >= 0 ? `+${netGain}` : netGain} net gain
                  </span>
                </div>
              </div>

              {/* Progress to 1,000 */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Milestone Awal</span>
                  <span className="font-mono text-indigo-400">
                    {acc.followers_current} / {target} ({progressPct}%)
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-950 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>

              {/* Views and Post Stats */}
              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60">
                  <div className="text-[10px] text-slate-500 flex items-center justify-center gap-1">
                    <Eye className="w-3 h-3" /> Total Views
                  </div>
                  <div className="font-bold font-mono text-slate-200 mt-0.5">
                    {totalViews.toLocaleString("id-ID")}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60">
                  <div className="text-[10px] text-slate-500 flex items-center justify-center gap-1">
                    <Film className="w-3 h-3" /> Postingan Tayang
                  </div>
                  <div className="font-bold font-mono text-slate-200 mt-0.5">
                    {postedCount} Post
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
