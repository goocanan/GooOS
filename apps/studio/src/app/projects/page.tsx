"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { GooNavbar } from "@/components/GooNavbar";

interface Part {
  id: string;
  name: string;
  material: string;
  color: string;
  weight: number;
  printDurationMinutes: number;
  quantity: number;
  status: string;
  path: string | null;
  dimX: number;
  dimY: number;
  dimZ: number;
}

interface Project {
  id: string;
  name: string;
  status: string;
  priority: string;
  notes: string | null;
  image: string | null;
  parts: Part[];
  partsCount: number;
  totalWeight: number;
  totalTimeMinutes: number;
  createdAt: string;
}

const STATUS_BADGES: Record<string, string> = {
  idea: "bg-slate-800 text-slate-300 border-slate-700",
  ready: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  printing: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  completed: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  done: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  useEffect(() => {
    async function loadProjects() {
      try {
        setLoading(true);
        const res = await fetch("/api/flow/projects");
        const json = await res.json();
        if (json.success) {
          setProjects(json.data);
          if (json.data.length > 0) setSelectedProject(json.data[0]);
        } else {
          setError(json.error || "Gagal memuat proyek 3D");
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadProjects();
  }, []);

  const filtered = projects.filter((p) =>
    search === "" || p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <GooNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                GOO-Studio Projects
              </span>
              <span className="text-xs text-slate-400 font-mono">14 Proyek &bull; 265 Parts</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
              Proyek Desain 3D &amp; File Part STL
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Manajemen proyek perakitan multi-komponen, spesifikasi file STL part, estimasi gramasi material, dan durasi cetak per part.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/batching"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors shadow-md shadow-indigo-600/30"
            >
              Buka Smart Batching &rarr;
            </Link>
          </div>
        </div>

        {/* Main split view */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Projects list */}
          <div className="lg:col-span-5 space-y-3">
            <input
              type="text"
              placeholder="Cari proyek berdasarkan judul..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
            />

            {loading ? (
              <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-slate-800 text-slate-400 text-xs">
                Memuat proyek desain 3D...
              </div>
            ) : error ? (
              <div className="text-center py-6 bg-rose-950/40 text-rose-300 border border-rose-800 rounded-2xl text-xs">
                {error}
              </div>
            ) : (
              <div className="space-y-2.5 overflow-y-auto max-h-[calc(100vh-280px)] pr-1">
                {filtered.map((proj) => {
                  const isSelected = selectedProject?.id === proj.id;
                  const hours = (proj.totalTimeMinutes / 60).toFixed(1);

                  return (
                    <div
                      key={proj.id}
                      onClick={() => setSelectedProject(proj)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all text-left ${
                        isSelected
                          ? "bg-slate-900 border-indigo-500 shadow-md ring-1 ring-indigo-500/30"
                          : "bg-slate-900/60 border-slate-800 hover:border-slate-700 shadow-sm"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-sm text-white line-clamp-1">
                          {proj.name}
                        </h3>
                        <span
                          className={`text-[9px] font-semibold px-2 py-0.5 rounded-full capitalize whitespace-nowrap border ${
                            STATUS_BADGES[proj.status] || "bg-slate-800 text-slate-300 border-slate-700"
                          }`}
                        >
                          {proj.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 mt-3 text-xs text-slate-400 font-mono">
                        <span>🧩 {proj.partsCount} parts</span>
                        <span>⚖️ {proj.totalWeight}g</span>
                        <span>⏱️ {hours} jam</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right: Selected Project Details & Parts */}
          <div className="lg:col-span-7">
            {selectedProject ? (
              <div className="bg-slate-900/70 rounded-3xl border border-slate-800 p-6 shadow-xl space-y-6">
                <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-slate-400">{selectedProject.id}</span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize border ${
                          STATUS_BADGES[selectedProject.status] || "bg-slate-800 text-slate-300 border-slate-700"
                        }`}
                      >
                        {selectedProject.status}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-white mt-1">{selectedProject.name}</h2>
                  </div>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-3 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center">
                  <div>
                    <p className="text-[11px] text-slate-400">Total Komponen</p>
                    <p className="text-lg font-black text-white font-mono mt-0.5">{selectedProject.partsCount} Part</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400">Total Berat Filamen</p>
                    <p className="text-lg font-black text-rose-400 font-mono mt-0.5">{selectedProject.totalWeight}g</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400">Estimasi Durasi Cetak</p>
                    <p className="text-lg font-black text-indigo-400 font-mono mt-0.5">
                      {(selectedProject.totalTimeMinutes / 60).toFixed(1)} jam
                    </p>
                  </div>
                </div>

                {/* Parts list */}
                <div>
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center justify-between">
                    <span>Komponen File Part STL ({selectedProject.parts.length})</span>
                  </h3>
                  <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                    {selectedProject.parts.map((part) => (
                      <div
                        key={part.id}
                        className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs"
                      >
                        <div className="space-y-0.5 max-w-[65%]">
                          <p className="font-bold text-white truncate">{part.name}</p>
                          <p className="text-[11px] text-slate-400 font-mono">
                            {part.material} &bull; {part.color} &bull; Qty: {part.quantity}
                          </p>
                        </div>
                        <div className="text-right space-y-0.5 flex-shrink-0 font-mono">
                          <p className="font-bold text-rose-400">{part.weight}g</p>
                          <p className="text-[11px] text-slate-500">{part.printDurationMinutes} menit</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-20 bg-slate-900/40 rounded-3xl border border-slate-800 text-slate-400 text-sm">
                Pilih proyek untuk melihat detail komponen part.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
