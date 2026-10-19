"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { GooNavbar } from "@/components/GooNavbar";

interface Batch {
  id: string;
  material: string;
  color: string;
  totalWeight: number;
  spoolId: string | null;
  bedPlate: string | null;
  bedWidth: number;
  bedDepth: number;
  status: string;
  parts: any[];
  partsCount: number;
  spool: any | null;
  createdAt: string;
}

export default function BatchingPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadBatches() {
      try {
        setLoading(true);
        const res = await fetch("/api/flow/batches");
        const json = await res.json();
        if (json.success) {
          setBatches(json.data);
        } else {
          setError(json.error || "Gagal memuat batching bed plates");
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadBatches();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <GooNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                GOO-Studio Batching
              </span>
              <span className="text-xs text-slate-400 font-mono">7 Bed Plates Aktif</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
              Smart Batching &amp; Bed Plate Optimizer
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Antrean cetak batching multi-part otomatis yang dikelompokkan berdasarkan kesamaan material, warna filamen, dan dimensi pelat meja cetak.
            </p>
          </div>
          <div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 font-mono">
              {batches.length} Plate Aktif
            </span>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 bg-slate-900/40 rounded-3xl border border-slate-800 text-slate-400 text-sm">
            Memuat susunan smart batching...
          </div>
        ) : error ? (
          <div className="text-center py-8 bg-rose-950/40 text-rose-300 border border-rose-800 rounded-3xl text-sm">
            {error}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {batches.map((batch) => (
              <div
                key={batch.id}
                className="bg-slate-900/60 rounded-3xl border border-slate-800 p-6 shadow-xl space-y-4 hover:border-indigo-500/40 hover:bg-slate-900/80 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-xs text-slate-400">{batch.id}</span>
                    <h3 className="font-bold text-white text-base mt-0.5">
                      {batch.material} &bull; {batch.color}
                    </h3>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 capitalize">
                    {batch.status}
                  </span>
                </div>

                {/* Build Plate Spec */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs space-y-1.5 font-mono">
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500">Bed Plate:</span>
                    <span className="font-medium text-white">{batch.bedPlate || "Standard 256x256"}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500">Dimensi Pelat:</span>
                    <span className="font-medium text-white">
                      {batch.bedWidth || 256} &times; {batch.bedDepth || 256} mm
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500">Alokasi Spool ID:</span>
                    <span className="text-indigo-400 font-semibold">{batch.spoolId || "Auto-Select"}</span>
                  </div>
                </div>

                {/* Parts In Plate */}
                <div>
                  <p className="text-xs font-bold text-slate-300 mb-2.5 flex items-center justify-between">
                    <span>Komponen pada Plate</span>
                    <span className="text-slate-400 font-mono">({batch.partsCount} Parts)</span>
                  </p>
                  {batch.parts.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">Belum ada komponen di batch ini.</p>
                  ) : (
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {batch.parts.map((p) => (
                        <div
                          key={p.id}
                          className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs flex justify-between items-center"
                        >
                          <span className="truncate max-w-[70%] font-medium text-slate-200">{p.name}</span>
                          <span className="text-rose-400 font-mono text-[11px]">{p.weight}g</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
