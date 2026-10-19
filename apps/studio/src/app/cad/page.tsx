"use client";

import Link from "next/link";
import { GooNavbar } from "@/components/GooNavbar";

interface ToolCard {
  title: string;
  badge: string;
  desc: string;
  icon: string;
  features: string[];
}

const TOOLS: ToolCard[] = [
  {
    title: "AI Parametric CAD Studio",
    badge: "Next-Gen AI",
    desc: "Hasilkan model CAD parametrik siap cetak 3D dengan toleransi presisi langsung dari instruksi teks dan parameter geometri.",
    icon: "🪄",
    features: ["Text to Solid 3D", "Pengecekan Ketebalan Dinding", "Tolerance Engine", "Export STEP / STL / 3MF"],
  },
  {
    title: "Foto ke Figurin 3D Realistis",
    badge: "AI Vision",
    desc: "Ubah foto objek atau figur tampak depan/samping menjadi model 3D printable dengan dasar mesh penyangga optimal.",
    icon: "📸",
    features: ["Depth Map Reconstruction", "Auto-Support Generator", "Hollow Volume Optimization"],
  },
  {
    title: "Gridfinity Storage Generator",
    badge: "Workshop Utility",
    desc: "Generator wadah modular, dudukan tool holder, dan organizer meja bengkel sesuai standar sistem Gridfinity 42mm.",
    icon: "🧰",
    features: ["Ukuran Slot Parametrik", "Kantong Magnet Presisi", "Profil Bibir Stackable"],
  },
  {
    title: "Topography Landscape Slicer",
    badge: "Terrain CAD",
    desc: "Konversi peta kontur satelit elevasi GIS menjadi model 3D topografi bertingkat siap kirim ke armada printer 3DFlow.",
    icon: "🏔️",
    features: ["Eksagerasi Elevasi Kontur", "Frame Dudukan Custom", "Multi-Tile Slicer Split"],
  },
];

export default function CadHubPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <GooNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                GooPrint Engine
              </span>
              <span className="text-xs text-slate-400 font-mono">Cloud CAD Studio v1.2</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
              GooPrint &bull; Parametric CAD Studio &amp; Prototyping
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Studio pemodelan CAD parametrik berbasis web, generator perkakas modular, dan konektor langsung ke mesin printer 3DFlow.
            </p>
          </div>
          <div>
            <Link
              href="/flow"
              className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-medium transition-colors"
            >
              Lihat Antrean di 3DFlow &rarr;
            </Link>
          </div>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {TOOLS.map((tool) => (
            <div
              key={tool.title}
              className="bg-slate-900/60 rounded-3xl border border-slate-800 p-6 shadow-xl hover:border-cyan-500/40 hover:bg-slate-900/80 transition-all space-y-5 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-2xl shadow-inner">
                    {tool.icon}
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono">
                    {tool.badge}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-white">{tool.title}</h2>
                <p className="text-xs text-slate-400 leading-relaxed">{tool.desc}</p>
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex flex-wrap gap-1.5">
                  {tool.features.map((feat) => (
                    <span
                      key={feat}
                      className="text-[10px] px-2.5 py-0.5 rounded-lg bg-slate-950 border border-slate-800/80 text-slate-400 font-medium"
                    >
                      &bull; {feat}
                    </span>
                  ))}
                </div>

                <button
                  onClick={() => alert(`Memulai ${tool.title} di engine GooPrint...`)}
                  className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold rounded-2xl text-xs transition-all shadow-md shadow-cyan-600/20"
                >
                  Luncurkan Modul CAD Studio &rarr;
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
