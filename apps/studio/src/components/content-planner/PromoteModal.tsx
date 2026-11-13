"use client";

import React, { useState } from "react";
import { Idea, PlatformType } from "@/lib/content-planner/types";
import { X, ArrowRight, CheckSquare, Square, Sparkles } from "lucide-react";

interface PromoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  idea: Idea | null;
  onPromote: (ideaId: string, platforms: PlatformType[], code: string) => void;
}

const AVAILABLE_PLATFORMS: { id: PlatformType; label: string; icon: string }[] = [
  { id: "tiktok", label: "TikTok (@goocanan)", icon: "🎵" },
  { id: "instagram", label: "Instagram (@goocanan)", icon: "📸" },
  { id: "youtube_shorts", label: "YouTube Shorts", icon: "▶️" },
  { id: "youtube_video", label: "YouTube Long Video", icon: "📺" },
  { id: "facebook", label: "Facebook Reels", icon: "📘" },
];

export function PromoteModal({
  isOpen,
  onClose,
  idea,
  onPromote,
}: PromoteModalProps) {
  const [selectedPlatforms, setSelectedPlatforms] = useState<PlatformType[]>([
    "tiktok",
    "instagram",
    "youtube_shorts",
  ]);
  const [code, setCode] = useState("");

  if (!isOpen || !idea) return null;

  const togglePlatform = (p: PlatformType) => {
    if (selectedPlatforms.includes(p)) {
      if (selectedPlatforms.length > 1) {
        setSelectedPlatforms(selectedPlatforms.filter((item) => item !== p));
      }
    } else {
      setSelectedPlatforms([...selectedPlatforms, p]);
    }
  };

  const handlePromote = () => {
    const finalCode =
      code.trim().toUpperCase() ||
      `C${Math.floor(Math.random() * 900 + 100)}`;
    onPromote(idea.id, selectedPlatforms, finalCode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div>
            <div className="flex items-center gap-1.5 text-indigo-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" /> Promosi Ide ke Pipeline Konten
            </div>
            <h3 className="text-sm font-semibold text-slate-100 truncate max-w-xs mt-0.5">
              {idea.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 mb-1 font-medium">
              Kode Konten Pelacakan (Tracking Code)
            </label>
            <input
              type="text"
              placeholder="e.g. FS25, KH02 (opsional, auto-generated jika kosong)"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono text-xs uppercase"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Digunakan untuk atribusi penjualan Shopee/Tokopedia/WA via promo code & deskripsi.
            </p>
          </div>

          <div>
            <label className="block text-slate-300 mb-2 font-medium">
              Pilih Platform Distribusi (1 Konten &rarr; N Postingan)
            </label>
            <div className="space-y-1.5">
              {AVAILABLE_PLATFORMS.map((plat) => {
                const isChecked = selectedPlatforms.includes(plat.id);
                return (
                  <div
                    key={plat.id}
                    onClick={() => togglePlatform(plat.id)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                      isChecked
                        ? "bg-indigo-500/10 border-indigo-500/40 text-slate-100 shadow-sm"
                        : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{plat.icon}</span>
                      <span className="font-medium text-xs">{plat.label}</span>
                    </div>
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 text-indigo-400" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-600" />
                    )}
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              Sistem akan otomatis membuat 1 Konten Master dengan {selectedPlatforms.length} entri postingan berstatus &quot;Script&quot; di papan Kanban.
            </p>
          </div>
        </div>

        {/* Footer */}
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
            onClick={handlePromote}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/30"
          >
            Promosikan Sekarang <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
