"use client";

import { useParams } from "next/navigation";
import Link from "next/link";

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
    desc: "Generate production-grade 3D printable parametric CAD models directly from natural language prompts.",
    icon: "🪄",
    features: ["Text to Solid 3D", "Wall thickness checks", "Tolerance engine", "Export STEP / STL / 3MF"],
  },
  {
    title: "Photo to 3D Figurine",
    badge: "AI Vision",
    desc: "Transform single or multi-angle photos into articulated 3D printable figurines with optimized mesh base.",
    icon: "📸",
    features: ["Depth map reconstruction", "Auto-support generator", "Hollow optimization"],
  },
  {
    title: "Gridfinity Storage Generator",
    badge: "Workshop Utility",
    desc: "Custom modular workshop bins, tool holders, and modular desk organizers aligned with the 42mm Gridfinity standard.",
    icon: "🧰",
    features: ["Parametric slot sizing", "Magnet pocket tolerance", "Stackable rim profile"],
  },
  {
    title: "Topography Landscape Slicer",
    badge: "Terrain CAD",
    desc: "Convert satellite elevation data and GIS maps into crisp 3D contour terrain models ready for FDM & SLA printers.",
    icon: "🏔️",
    features: ["Contour layer exaggeration", "Custom base framing", "Multi-tile split"],
  },
];

export default function CadHubPage() {
  const params = useParams();
  const slug = params.slug as string;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 border border-amber-500/20">
              GooPrint Engine
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            GooPrint &bull; Parametric CAD Studio
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            AI-assisted parametric modeling, modular workshop organizers, and slicer-ready model generators.
          </p>
        </div>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {TOOLS.map((tool) => (
          <div
            key={tool.title}
            className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:border-goo-400 hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-2xl">
                  {tool.icon}
                </div>
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-goo-50 text-goo-700 border border-goo-100">
                  {tool.badge}
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-900">{tool.title}</h2>
              <p className="text-xs text-slate-500 leading-relaxed">{tool.desc}</p>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex flex-wrap gap-1.5">
                {tool.features.map((feat) => (
                  <span
                    key={feat}
                    className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium"
                  >
                    &bull; {feat}
                  </span>
                ))}
              </div>

              <button
                onClick={() => alert(`Launching ${tool.title} in GooPrint engine...`)}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg text-xs transition-colors"
              >
                Launch Studio Tool &rarr;
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
