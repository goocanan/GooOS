"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

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
  const params = useParams();
  const slug = params.slug as string;

  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadBatches() {
      try {
        setLoading(true);
        const res = await fetch(`/api/workspaces/${slug}/flow/batches`);
        const json = await res.json();
        if (json.success) {
          setBatches(json.data);
        } else {
          setError(json.error || "Failed to load batches");
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadBatches();
  }, [slug]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Smart Batching &amp; Bed Plates
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Optimized print queues grouped by material, color, and build plate dimensions.
          </p>
        </div>
        <div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-goo-50 text-goo-700 border border-goo-200">
            {batches.length} Active Batches
          </span>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200 text-slate-400 text-sm">
          Loading smart batches...
        </div>
      ) : error ? (
        <div className="text-center py-8 bg-rose-50 text-rose-600 rounded-xl text-sm">
          {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {batches.map((batch) => (
            <div
              key={batch.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4 hover:border-goo-300 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-xs text-slate-400">{batch.id}</span>
                  <h3 className="font-bold text-slate-900 mt-0.5">{batch.material} &bull; {batch.color}</h3>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700 capitalize">
                  {batch.status}
                </span>
              </div>

              {/* Build Plate Spec */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span className="text-slate-400">Bed Plate:</span>
                  <span className="font-medium text-slate-800">{batch.bedPlate || "Standard 256x256"}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span className="text-slate-400">Dimensions:</span>
                  <span className="font-medium text-slate-800">{batch.bedWidth || 256} &times; {batch.bedDepth || 256} mm</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span className="text-slate-400">Assigned Spool:</span>
                  <span className="font-mono text-goo-700 font-medium">{batch.spoolId || "Auto-Select"}</span>
                </div>
              </div>

              {/* Parts In Plate */}
              <div>
                <p className="text-xs font-semibold text-slate-700 mb-2">
                  Parts on Plate ({batch.partsCount})
                </p>
                {batch.parts.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No parts assigned to this batch yet.</p>
                ) : (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {batch.parts.map((p) => (
                      <div
                        key={p.id}
                        className="p-2 bg-slate-50 rounded border border-slate-200/60 text-xs flex justify-between items-center"
                      >
                        <span className="truncate max-w-[70%] font-medium text-slate-700">{p.name}</span>
                        <span className="text-slate-400 font-mono">{p.weight}g</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
