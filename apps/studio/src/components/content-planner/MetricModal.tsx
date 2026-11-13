"use client";

import React, { useState, useEffect } from "react";
import {
  Post,
  Content,
  MetricSnapshot,
  SnapshotWindow,
  ScoringConfig,
} from "@/lib/content-planner/types";
import {
  calculateInteractions,
  calculateEngagementRate,
  calculateContentScore,
  displayScore,
  calculatePerformanceLabel,
} from "@/lib/content-planner/scoring";
import { parseNumericInput } from "@/lib/content-planner/storage";
import { X, Sparkles, Check, Info } from "lucide-react";

interface MetricModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: Post | null;
  content: Content | null;
  config: ScoringConfig;
  allPosts?: Post[];
  onSaveSnapshot: (postId: string, snapshot: MetricSnapshot) => void;
}

export function MetricModal({
  isOpen,
  onClose,
  post,
  content,
  config,
  allPosts = [],
  onSaveSnapshot,
}: MetricModalProps) {
  const [windowType, setWindowType] = useState<SnapshotWindow>("7d");
  const [viewsStr, setViewsStr] = useState("");
  const [likesStr, setLikesStr] = useState("");
  const [commentsStr, setCommentsStr] = useState("");
  const [savesStr, setSavesStr] = useState("");
  const [sharesStr, setSharesStr] = useState("");
  const [followersGainStr, setFollowersGainStr] = useState("");
  const [notes, setNotes] = useState("");

  // Populate when opening
  useEffect(() => {
    if (post) {
      // Cari snapshot window terpilih atau snapshot terakhir
      const snap =
        post.snapshots.find((s) => s.window === windowType) ||
        post.snapshots[post.snapshots.length - 1];
      if (snap) {
        setViewsStr(snap.views.toString());
        setLikesStr(snap.likes.toString());
        setCommentsStr(snap.comments.toString());
        setSavesStr(snap.saves.toString());
        setSharesStr(snap.shares.toString());
        setFollowersGainStr(snap.followers_gain.toString());
        setNotes(snap.notes || "");
        setWindowType(snap.window || "7d");
      } else {
        setViewsStr("");
        setLikesStr("");
        setCommentsStr("");
        setSavesStr("");
        setSharesStr("");
        setFollowersGainStr("");
        setNotes("");
      }
    }
  }, [post, isOpen]);

  if (!isOpen || !post) return null;

  // Realtime calculated preview
  const parsedViews = parseNumericInput(viewsStr);
  const parsedLikes = parseNumericInput(likesStr);
  const parsedComments = parseNumericInput(commentsStr);
  const parsedSaves = parseNumericInput(savesStr);
  const parsedShares = parseNumericInput(sharesStr);
  const parsedFollowers = parseNumericInput(followersGainStr);

  const previewMetrics: Partial<MetricSnapshot> = {
    views: parsedViews,
    likes: parsedLikes,
    comments: parsedComments,
    saves: parsedSaves,
    shares: parsedShares,
    followers_gain: parsedFollowers,
  };

  const interactions = calculateInteractions(previewMetrics);
  const er = calculateEngagementRate(previewMetrics);
  const rawScore = calculateContentScore(previewMetrics, config.weights);
  const dispScore = displayScore(rawScore);

  // Mock post for label preview
  const previewPost: Post = {
    ...post,
    snapshots: [
      {
        id: "preview",
        post_id: post.id,
        captured_at: new Date().toISOString(),
        window: windowType,
        views: parsedViews,
        likes: parsedLikes,
        comments: parsedComments,
        saves: parsedSaves,
        shares: parsedShares,
        followers_gain: parsedFollowers,
      },
    ],
  };

  const labelResult = calculatePerformanceLabel(previewPost, previewPost.snapshots[0], config, allPosts);
  const label = labelResult.label;

  const handleSave = () => {
    const snapshot: MetricSnapshot = {
      id: `snap_${Date.now()}`,
      post_id: post.id,
      captured_at: new Date().toISOString(),
      window: windowType,
      views: parsedViews,
      likes: parsedLikes,
      comments: parsedComments,
      saves: parsedSaves,
      shares: parsedShares,
      followers_gain: parsedFollowers,
      notes: notes.trim(),
    };
    onSaveSnapshot(post.id, snapshot);
    onClose();
  };

  const getLabelBadge = () => {
    switch (label) {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/90">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                Input Metrik (&lt; 60 Detik)
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {post.platform}
              </span>
            </div>
            <h3 className="text-sm font-semibold text-slate-100 truncate max-w-sm mt-0.5">
              {content ? `[${content.code}] ${content.title}` : `Post ${post.id}`}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Snapshot Window selection */}
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1.5">
              Jendela Waktu Snapshot
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(["24h", "7d", "30d", "manual"] as SnapshotWindow[]).map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setWindowType(w)}
                  className={`py-1.5 rounded-xl text-center font-medium transition-all ${
                    windowType === w
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                  }`}
                >
                  {w === "manual" ? "Manual" : `${w}`}
                </button>
              ))}
            </div>
          </div>

          {/* Metric input grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 mb-1 font-medium">
                Views (Tayangan)
              </label>
              <input
                type="text"
                placeholder="misal: 2.286 atau 2286"
                value={viewsStr}
                onChange={(e) => setViewsStr(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-300 mb-1 font-medium">Likes</label>
              <input
                type="text"
                placeholder="0"
                value={likesStr}
                onChange={(e) => setLikesStr(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-300 mb-1 font-medium">Komentar</label>
              <input
                type="text"
                placeholder="0"
                value={commentsStr}
                onChange={(e) => setCommentsStr(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-300 mb-1 font-medium">Saves (Simpan)</label>
              <input
                type="text"
                placeholder="0"
                value={savesStr}
                onChange={(e) => setSavesStr(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-300 mb-1 font-medium">Shares (Bagikan)</label>
              <input
                type="text"
                placeholder="0"
                value={sharesStr}
                onChange={(e) => setSharesStr(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-300 mb-1 font-medium">
                Follower Baru
              </label>
              <input
                type="text"
                placeholder="0"
                value={followersGainStr}
                onChange={(e) => setFollowersGainStr(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono text-xs"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-slate-400 mb-1 font-medium">
              Catatan Khusus (Opsional)
            </label>
            <input
              type="text"
              placeholder="e.g. Di-boost reels ads / sound trending"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 text-xs"
            />
          </div>

          {/* Live Preview Card */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2.5">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 border-b border-slate-800 pb-2">
              <span className="flex items-center gap-1 text-indigo-400">
                <Sparkles className="w-3.5 h-3.5" /> Kalkulasi Engine Live
              </span>
              <span className="text-[10px] text-slate-500 font-normal">
                Mode: {config.mode}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800/50">
                <div className="text-[10px] text-slate-400">Interaksi</div>
                <div className="text-sm font-bold text-slate-100 font-mono">
                  {interactions.toLocaleString("id-ID")}
                </div>
              </div>
              <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800/50">
                <div className="text-[10px] text-slate-400">ER (Views)</div>
                <div className="text-sm font-bold text-indigo-300 font-mono">
                  {er !== null ? `${er.toFixed(2)}%` : "-"}
                </div>
              </div>
              <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800/50">
                <div className="text-[10px] text-slate-400">Skor (Half-up)</div>
                <div className="text-sm font-bold text-emerald-400 font-mono">
                  {dispScore} <span className="text-[10px] font-normal text-slate-500">({rawScore.toFixed(2)})</span>
                </div>
              </div>
              <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800/50 flex flex-col justify-center items-center">
                <div className="text-[10px] text-slate-400 mb-0.5">Label</div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${getLabelBadge()}`}
                >
                  {label}
                </span>
              </div>
            </div>

            {parsedViews > 0 && parsedViews < config.min_views && (
              <div className="text-[10px] text-amber-400/90 flex items-center gap-1.5 pt-1">
                <Info className="w-3 h-3 flex-shrink-0" />
                <span>
                  Views ({parsedViews}) di bawah batas minimum {config.min_views}. Label otomatis diberi &quot;Data kurang&quot; agar tidak bias.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 text-xs font-medium"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/30"
          >
            <Check className="w-3.5 h-3.5" /> Simpan Metrik
          </button>
        </div>
      </div>
    </div>
  );
}
