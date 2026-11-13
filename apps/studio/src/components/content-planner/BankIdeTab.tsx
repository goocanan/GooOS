"use client";

import React, { useState } from "react";
import { Idea, IdeaStatus } from "@/lib/content-planner/types";
import {
  Lightbulb,
  Plus,
  ArrowRight,
  Sparkles,
  ExternalLink,
  Trash2,
  CheckCircle2,
  Tag,
  AlertCircle,
} from "lucide-react";

interface BankIdeTabProps {
  ideas: Idea[];
  onAddIdea: (newIdea: Omit<Idea, "id" | "created_at">) => void;
  onUpdateIdeaStatus: (id: string, status: IdeaStatus) => void;
  onDeleteIdea: (id: string) => void;
  onOpenPromoteModal: (idea: Idea) => void;
}

export function BankIdeTab({
  ideas,
  onAddIdea,
  onUpdateIdeaStatus,
  onDeleteIdea,
  onOpenPromoteModal,
}: BankIdeTabProps) {
  const [fastTitle, setFastTitle] = useState("");
  const [fastCategory, setFastCategory] = useState("Fidget & Sensory");
  const [fastPriority, setFastPriority] = useState<"low" | "medium" | "high">("medium");
  const [fastTag, setFastTag] = useState("");
  const [fastRef, setFastRef] = useState("");

  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [search, setSearch] = useState("");

  const handleCreateFastIdea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fastTitle.trim()) return;

    onAddIdea({
      title: fastTitle.trim(),
      status: "raw", // Selalu masuk ke RAW Inbox dulu per PRD
      category: fastCategory,
      tags: fastTag ? fastTag.split(",").map((t) => t.trim()) : [fastCategory],
      cta_goal: "Follow & Komentar",
      priority: fastPriority,
      reference_url: fastRef.trim() || undefined,
    });

    setFastTitle("");
    setFastTag("");
    setFastRef("");
  };

  const filteredIdeas = ideas.filter((idea) => {
    const matchesFilter = filterStatus === "all" || idea.status === filterStatus;
    const matchesSearch =
      idea.title.toLowerCase().includes(search.toLowerCase()) ||
      idea.category.toLowerCase().includes(search.toLowerCase()) ||
      idea.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case "high":
        return "bg-rose-500/20 text-rose-300 border-rose-500/30";
      case "medium":
        return "bg-amber-500/20 text-amber-300 border-amber-500/30";
      default:
        return "bg-slate-800 text-slate-400 border-slate-700";
    }
  };

  const getStatusBadge = (s: IdeaStatus) => {
    switch (s) {
      case "raw":
        return "bg-sky-500/20 text-sky-300 border-sky-500/30";
      case "banked":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
      case "in_use":
        return "bg-indigo-500/20 text-indigo-300 border-indigo-500/30";
      case "dropped":
        return "bg-slate-800 text-slate-500 border-slate-700";
    }
  };

  const rawCount = ideas.filter((i) => i.status === "raw").length;
  const bankedCount = ideas.filter((i) => i.status === "banked").length;

  return (
    <div className="space-y-6">
      {/* 1-Click Fast Capture Bar (RAW Inbox) */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-500/20 shadow-lg shadow-indigo-950/20">
        <div className="flex items-center gap-2 mb-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" /> Tangkap Ide Instan (RAW Capture &lt; 10 Detik)
        </div>
        <form onSubmit={handleCreateFastIdea} className="space-y-2.5">
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <input
              type="text"
              placeholder="Ketik ide konten / link referensi viral (misal: ASMR Fidget Stepper suara klik satisfying)..."
              value={fastTitle}
              onChange={(e) => setFastTitle(e.target.value)}
              className="flex-1 w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={!fastTitle.trim()}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all whitespace-nowrap"
            >
              <Plus className="w-4 h-4" /> Simpan ke RAW Inbox
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select
              value={fastCategory}
              onChange={(e) => setFastCategory(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 text-[11px] focus:outline-none"
            >
              <option value="Fidget & Sensory">Fidget &amp; Sensory</option>
              <option value="Mechanical & Kinetic">Mechanical &amp; Kinetic</option>
              <option value="Utility & EDC">Utility &amp; EDC</option>
              <option value="Home & Decor">Home &amp; Decor</option>
              <option value="Behind The Scenes">Behind The Scenes</option>
            </select>

            <select
              value={fastPriority}
              onChange={(e) => setFastPriority(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 text-[11px] focus:outline-none"
            >
              <option value="high">Prioritas: High</option>
              <option value="medium">Prioritas: Medium</option>
              <option value="low">Prioritas: Low</option>
            </select>

            <input
              type="text"
              placeholder="Tag (e.g. viral, asmr, tiktok)"
              value={fastTag}
              onChange={(e) => setFastTag(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 text-[11px] focus:outline-none placeholder-slate-600 w-36"
            />

            <input
              type="text"
              placeholder="URL referensi (opsional)"
              value={fastRef}
              onChange={(e) => setFastRef(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 text-[11px] focus:outline-none placeholder-slate-600 flex-1 min-w-[140px]"
            />
          </div>
        </form>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs">
          <button
            onClick={() => setFilterStatus("all")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filterStatus === "all"
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Semua ({ideas.length})
          </button>
          <button
            onClick={() => setFilterStatus("raw")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              filterStatus === "raw"
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            RAW Inbox{" "}
            <span className="px-1.5 py-0.2 rounded-full bg-sky-500/30 text-sky-200 text-[10px]">
              {rawCount}
            </span>
          </button>
          <button
            onClick={() => setFilterStatus("banked")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              filterStatus === "banked"
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Bank Ide Siap Produksi{" "}
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/30 text-emerald-200 text-[10px]">
              {bankedCount}
            </span>
          </button>
          <button
            onClick={() => setFilterStatus("in_use")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filterStatus === "in_use"
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Sedang Dibuat
          </button>
          <button
            onClick={() => setFilterStatus("dropped")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filterStatus === "dropped"
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Dropped
          </button>
        </div>

        <input
          type="text"
          placeholder="Cari ide / kategori / tag..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-60 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500"
        />
      </div>

      {/* Grid of Idea Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredIdeas.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800">
            Tidak ada ide pada filter ini. Tangkap ide baru di atas!
          </div>
        ) : (
          filteredIdeas.map((idea) => {
            return (
              <div
                key={idea.id}
                className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between shadow-sm space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full border uppercase tracking-wider font-semibold ${getStatusBadge(
                        idea.status
                      )}`}
                    >
                      {idea.status}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full border font-medium capitalize ${getPriorityBadge(
                        idea.priority
                      )}`}
                    >
                      {idea.priority} priority
                    </span>
                  </div>

                  <h4 className="text-sm font-semibold text-slate-100 line-clamp-2">
                    {idea.title}
                  </h4>

                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                      {idea.category}
                    </span>
                    {idea.tags.map((t, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 font-mono"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>

                  {idea.reference_url && (
                    <a
                      href={idea.reference_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 pt-1 truncate"
                    >
                      <ExternalLink className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{idea.reference_url}</span>
                    </a>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    {idea.status === "raw" && (
                      <button
                        onClick={() => onUpdateIdeaStatus(idea.id, "banked")}
                        className="px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[11px] font-medium"
                        title="Tandai siap produksi (Banked)"
                      >
                        Jadikan Banked
                      </button>
                    )}
                    {idea.status === "banked" && (
                      <button
                        onClick={() => onUpdateIdeaStatus(idea.id, "dropped")}
                        className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 text-[11px]"
                      >
                        Drop
                      </button>
                    )}
                    <button
                      onClick={() => onDeleteIdea(idea.id)}
                      className="p-1 rounded-lg text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Hapus Ide"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {idea.status !== "in_use" && (
                    <button
                      onClick={() => onOpenPromoteModal(idea)}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1 shadow-sm shadow-indigo-600/30"
                    >
                      Promosikan <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
