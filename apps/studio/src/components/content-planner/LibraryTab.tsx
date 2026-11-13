"use client";

import React, { useState } from "react";
import { LibraryItem, LibraryType } from "@/lib/content-planner/types";
import {
  BookOpen,
  Copy,
  Check,
  Search,
  Sparkles,
  Sliders,
  Tag,
  Star,
} from "lucide-react";

interface LibraryTabProps {
  libraryItems: LibraryItem[];
}

export function LibraryTab({ libraryItems }: LibraryTabProps) {
  const [selectedType, setSelectedType] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Dynamic placeholders state
  const [placeholders, setPlaceholders] = useState<{ [key: string]: string }>({
    nama_produk: "Fidget Stepper",
    link_bio: "link.goocanan.com",
    fitur_utama: "suara klik presisi & bearing halus",
    masalah_user: "stres saat kerja & tangan gelisah",
  });

  const handleCopy = (id: string, text: string) => {
    // Replace all placeholders [key]
    let finalText = text;
    Object.keys(placeholders).forEach((k) => {
      const reg = new RegExp(`\\[${k}\\]`, "g");
      finalText = finalText.replace(reg, placeholders[k] ?? "");
    });

    navigator.clipboard.writeText(finalText);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const renderProcessedText = (text: string) => {
    let replaced = text;
    Object.keys(placeholders).forEach((k) => {
      const reg = new RegExp(`\\[${k}\\]`, "g");
      replaced = replaced.replace(reg, placeholders[k] ?? "");
    });
    return replaced;
  };

  const filteredItems = libraryItems.filter((item) => {
    const matchesType = selectedType === "all" || item.type === selectedType;
    const matchesSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.body.toLowerCase().includes(search.toLowerCase()) ||
      item.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    return matchesType && matchesSearch;
  });

  const getTypeLabel = (t: LibraryType) => {
    switch (t) {
      case "hook":
        return "🎣 Hook";
      case "caption":
        return "✍️ Caption";
      case "cta":
        return "📣 CTA";
      case "copy_formula":
        return "📐 Formula Copy";
      case "ai_prompt":
        return "🤖 AI Prompt";
      default:
        return t;
    }
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Placeholder Live Injector Bar */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-500/20 shadow-md">
        <div className="flex items-center gap-2 mb-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
          <Sliders className="w-3.5 h-3.5" /> Variabel Dynamic Template (Live Replacer)
        </div>
        <p className="text-[11px] text-slate-400 mb-3">
          Ubah variabel di bawah untuk langsung mengganti semua tag <span className="font-mono text-indigo-300">[nama_produk]</span>, <span className="font-mono text-indigo-300">[link_bio]</span>, dll di perpustakaan copywriting secara otomatis.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          <div>
            <label className="block text-[10px] font-mono text-slate-400 mb-1">
              [nama_produk]
            </label>
            <input
              type="text"
              value={placeholders.nama_produk}
              onChange={(e) =>
                setPlaceholders({ ...placeholders, nama_produk: e.target.value })
              }
              className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs font-medium focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono text-slate-400 mb-1">
              [link_bio]
            </label>
            <input
              type="text"
              value={placeholders.link_bio}
              onChange={(e) =>
                setPlaceholders({ ...placeholders, link_bio: e.target.value })
              }
              className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs font-medium focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono text-slate-400 mb-1">
              [fitur_utama]
            </label>
            <input
              type="text"
              value={placeholders.fitur_utama}
              onChange={(e) =>
                setPlaceholders({ ...placeholders, fitur_utama: e.target.value })
              }
              className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs font-medium focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono text-slate-400 mb-1">
              [masalah_user]
            </label>
            <input
              type="text"
              value={placeholders.masalah_user}
              onChange={(e) =>
                setPlaceholders({ ...placeholders, masalah_user: e.target.value })
              }
              className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs font-medium focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs">
          <button
            onClick={() => setSelectedType("all")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              selectedType === "all"
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Semua ({libraryItems.length})
          </button>
          <button
            onClick={() => setSelectedType("hook")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              selectedType === "hook"
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            🎣 Hooks
          </button>
          <button
            onClick={() => setSelectedType("caption")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              selectedType === "caption"
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            ✍️ Captions
          </button>
          <button
            onClick={() => setSelectedType("cta")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              selectedType === "cta"
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            📣 CTAs
          </button>
          <button
            onClick={() => setSelectedType("copy_formula")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              selectedType === "copy_formula"
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            📐 Rumus Copy
          </button>
          <button
            onClick={() => setSelectedType("ai_prompt")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              selectedType === "ai_prompt"
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            🤖 AI Prompts
          </button>
        </div>

        <input
          type="text"
          placeholder="Cari copy / hook / prompt..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-60 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500"
        />
      </div>

      {/* Grid of Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredItems.map((item) => {
          const isCopied = copiedId === item.id;
          const processedBody = renderProcessedText(item.body);

          return (
            <div
              key={item.id}
              className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all shadow-sm flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-indigo-400">
                    {getTypeLabel(item.type)}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-400">
                    {item.category}
                  </span>
                </div>

                <h4 className="text-sm font-semibold text-slate-100">{item.title}</h4>

                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-wrap">
                  {processedBody}
                </div>

                <div className="flex flex-wrap gap-1 pt-1">
                  {item.tags.map((t, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Bottom 1-Click Copy */}
              <div className="pt-2 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => handleCopy(item.id, item.body)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
                    isCopied
                      ? "bg-emerald-600 text-white"
                      : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30"
                  }`}
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> Disalin ke Clipboard!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Salin Teks
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
