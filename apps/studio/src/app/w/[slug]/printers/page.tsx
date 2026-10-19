"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

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
  const params = useParams();
  const slug = params.slug as string;

  const [printers, setPrinters] = useState<Printer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadPrinters() {
      try {
        setLoading(true);
        const res = await fetch(`/api/workspaces/${slug}/flow/printers`);
        const json = await res.json();
        if (json.success) {
          setPrinters(json.data);
        } else {
          setError(json.error || "Failed to load printers");
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadPrinters();
  }, [slug]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            3D Printers &amp; Farm Status
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time telemetry, nozzle temperatures, and job progress across your 3D printers.
          </p>
        </div>
        <div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-goo-50 text-goo-700 border border-goo-200">
            {printers.length} Printers Connected
          </span>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200 text-slate-400 text-sm">
          Connecting to printer fleet telemetry...
        </div>
      ) : error ? (
        <div className="text-center py-8 bg-rose-50 text-rose-600 rounded-xl text-sm">
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
                className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5 hover:border-goo-300 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-xl">
                      🖨️
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">{p.name}</h3>
                      <p className="text-xs text-slate-400 font-mono">{p.model}</p>
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                      isPrinting
                        ? "bg-amber-100 text-amber-700"
                        : isOnline
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {p.status}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-slate-600 font-medium">
                    <span>Job Progress</span>
                    <span>{p.printProgress || 0}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-goo-600 h-full rounded-full transition-all"
                      style={{ width: `${p.printProgress || 0}%` }}
                    />
                  </div>
                </div>

                {/* Telemetry info */}
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 text-[11px]">Nozzle Temp</span>
                    <p className="font-bold text-slate-800 text-sm mt-0.5">
                      {p.nozzleTemp || 0}&deg;C
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px]">Bed Temp</span>
                    <p className="font-bold text-slate-800 text-sm mt-0.5">
                      {p.bedTemp || 0}&deg;C
                    </p>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 flex justify-between items-center pt-1 border-t border-slate-100">
                  <span>Current: {p.currentJob || "None"}</span>
                  <span>ID: {p.id.slice(0, 8)}...</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
