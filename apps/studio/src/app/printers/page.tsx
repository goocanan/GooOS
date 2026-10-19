"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { GooNavbar } from "@/components/GooNavbar";

interface Printer {
  id: string;
  name: string;
  model: string;
  status: string;
  nozzleTemp: number;
  bedTemp: number;
  printProgress: number;
  currentJob: string | null;
  errorMessage: string | null;
  updatedAt: string;
}

export default function PrintersPage() {
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadPrinters() {
      try {
        setLoading(true);
        const res = await fetch("/api/flow/printers");
        const json = await res.json();
        if (json.success) {
          setPrinters(json.data);
        } else {
          setError(json.error || "Gagal memuat telemetri printer");
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadPrinters();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <GooNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                3DFlow Fleet
              </span>
              <span className="text-xs text-slate-400 font-mono">Real-time Telemetry</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
              Armada 3D Printer &amp; Status Mesin
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Monitoring telemetri temperatur nozzle, suhu meja pemanas (bed), dan progress pencetakan secara real-time.
            </p>
          </div>
          <div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 font-mono">
              {printers.length} Printer Terhubung
            </span>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 bg-slate-900/40 rounded-3xl border border-slate-800 text-slate-400 text-sm">
            Menghubungkan ke telemetri armada printer...
          </div>
        ) : error ? (
          <div className="text-center py-8 bg-rose-950/40 text-rose-300 border border-rose-800 rounded-3xl text-sm">
            {error}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {printers.map((p) => {
              const isOnline = p.status !== "offline";
              const isPrinting = p.status === "printing";

              return (
                <div
                  key={p.id}
                  className="bg-slate-900/60 rounded-3xl border border-slate-800 p-6 shadow-xl space-y-5 hover:border-rose-500/40 hover:bg-slate-900/80 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-2xl shadow-inner">
                        🖨️
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-base">{p.name}</h3>
                        <p className="text-xs text-slate-400 font-mono">{p.model}</p>
                      </div>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        isPrinting
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                          : isOnline
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                          : "bg-slate-800 text-slate-500 border-slate-700"
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-slate-300 font-medium">
                      <span>Progress Cetak Job</span>
                      <span className="font-mono text-rose-400">{p.printProgress || 0}%</span>
                    </div>
                    <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="bg-gradient-to-r from-rose-500 to-indigo-500 h-full rounded-full transition-all"
                        style={{ width: `${p.printProgress || 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Telemetry info */}
                  <div className="grid grid-cols-2 gap-3 bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-xs">
                    <div>
                      <span className="text-slate-500 text-[11px]">Suhu Nozzle</span>
                      <p className="font-bold text-white text-base mt-0.5 font-mono">
                        {p.nozzleTemp || 0}&deg;C
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[11px]">Suhu Bed</span>
                      <p className="font-bold text-white text-base mt-0.5 font-mono">
                        {p.bedTemp || 0}&deg;C
                      </p>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 flex justify-between items-center pt-2 border-t border-slate-800 font-mono">
                    <span className="truncate max-w-[65%]">Job: {p.currentJob || "Standby"}</span>
                    <span>ID: {p.id.slice(0, 8)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
