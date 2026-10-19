"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

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
  idea: "bg-slate-100 text-slate-700",
  ready: "bg-blue-100 text-blue-700",
  printing: "bg-amber-100 text-amber-700",
  completed: "bg-emerald-100 text-emerald-700",
  done: "bg-emerald-100 text-emerald-700",
};

export default function ProjectsPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  useEffect(() => {
    async function loadProjects() {
      try {
        setLoading(true);
        const res = await fetch(`/api/workspaces/${slug}/flow/projects`);
        const json = await res.json();
        if (json.success) {
          setProjects(json.data);
          if (json.data.length > 0) setSelectedProject(json.data[0]);
        } else {
          setError(json.error || "Failed to load projects");
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadProjects();
  }, [slug]);

  const filtered = projects.filter((p) =>
    search === "" || p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            3D Printing Projects
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage multi-part 3D printing jobs, STL files, print duration, and material allocation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-goo-50 text-goo-700 border border-goo-200">
            {projects.length} Projects ({projects.reduce((a, b) => a + b.partsCount, 0)} Total Parts)
          </span>
        </div>
      </div>

      {/* Main split view */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Projects list */}
        <div className="lg:col-span-5 space-y-3">
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-goo-500/20 focus:border-goo-500"
          />

          {loading ? (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200 text-slate-400 text-sm">
              Loading 3D projects...
            </div>
          ) : error ? (
            <div className="text-center py-6 bg-rose-50 text-rose-600 rounded-xl text-sm">
              {error}
            </div>
          ) : (
            <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-280px)] pr-1">
              {filtered.map((proj) => {
                const isSelected = selectedProject?.id === proj.id;
                const hours = (proj.totalTimeMinutes / 60).toFixed(1);

                return (
                  <div
                    key={proj.id}
                    onClick={() => setSelectedProject(proj)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all text-left ${
                      isSelected
                        ? "bg-white border-goo-500 shadow-md ring-2 ring-goo-500/20"
                        : "bg-white border-slate-200 hover:border-slate-300 shadow-sm"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-sm text-slate-900 line-clamp-1">
                        {proj.name}
                      </h3>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize whitespace-nowrap ${
                          STATUS_BADGES[proj.status] || "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {proj.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                      <span>🧩 {proj.partsCount} parts</span>
                      <span>⚖️ {proj.totalWeight}g</span>
                      <span>⏱️ {hours}h</span>
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
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-slate-400">{selectedProject.id}</span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                        STATUS_BADGES[selectedProject.status] || "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {selectedProject.status}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 mt-1">{selectedProject.name}</h2>
                </div>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                <div>
                  <p className="text-[11px] text-slate-500">Parts Quantity</p>
                  <p className="text-lg font-bold text-slate-900 mt-0.5">{selectedProject.partsCount}</p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-500">Filament Weight</p>
                  <p className="text-lg font-bold text-slate-900 mt-0.5">{selectedProject.totalWeight}g</p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-500">Est. Print Time</p>
                  <p className="text-lg font-bold text-slate-900 mt-0.5">
                    {(selectedProject.totalTimeMinutes / 60).toFixed(1)} hrs
                  </p>
                </div>
              </div>

              {/* Parts list */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center justify-between">
                  <span>Component Parts ({selectedProject.parts.length})</span>
                </h3>
                <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                  {selectedProject.parts.map((part) => (
                    <div
                      key={part.id}
                      className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5 max-w-[65%]">
                        <p className="font-semibold text-slate-900 truncate">{part.name}</p>
                        <p className="text-[11px] text-slate-500">
                          {part.material} &bull; {part.color} &bull; Qty: {part.quantity}
                        </p>
                      </div>
                      <div className="text-right space-y-0.5 flex-shrink-0">
                        <p className="font-medium text-slate-800">{part.weight}g</p>
                        <p className="text-[11px] text-slate-400">{part.printDurationMinutes} mins</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-xl border border-slate-200 text-slate-400">
              Select a project to view its parts.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
