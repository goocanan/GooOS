"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { GOO_APPS, GooApp } from "@/config/apps.config";
import { GooNavbar } from "@/components/GooNavbar";
import {
  Activity,
  Layers,
  Printer,
  Package,
  TrendingUp,
  Sparkles,
  ArrowUpRight,
  SlidersHorizontal,
  Box,
  Flame,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronRight,
  Compass,
  Cpu,
  BadgeAlert,
} from "lucide-react";

interface TelemetryOverview {
  inventory: {
    totalSpools: number;
    totalWeightKg: number;
    totalValue: number;
    lowStockCount: number;
  };
  printers: {
    total: number;
    online: number;
    printing: number;
  };
  orders: {
    total: number;
    pending: number;
    completed: number;
  };
  finance: {
    totalIncome: number;
    totalExpense: number;
    netProfit: number;
  };
  productsCount: number;
}

export default function BentoBoxDashboardPage() {
  const [telemetry, setTelemetry] = useState<TelemetryOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/flow/stats");
        const json = await res.json();
        if (json.success) {
          setTelemetry(json.data);
        }
      } catch (e) {
        console.error("Failed to load telemetry", e);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const categories = ["all", "Manufacturing", "Design & CAD", "E-Commerce", "Intelligence"];
  const filteredApps =
    activeCategory === "all"
      ? GOO_APPS
      : GOO_APPS.filter((a) => a.category.toLowerCase() === activeCategory.toLowerCase());

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col selection:bg-rose-500/30 selection:text-rose-200">
      <GooNavbar />

      {/* Sandbox Comparison Pill Top Bar */}
      <div className="bg-gradient-to-r from-indigo-950/80 via-slate-900/90 to-rose-950/80 border-b border-slate-800/80 px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-slate-200">
              Sandbox Eksperimen: <span className="text-indigo-300 font-mono">Bento Box Modern</span>
            </span>
            <span className="hidden sm:inline text-slate-500">|</span>
            <span className="hidden sm:inline text-slate-400">
              Desain terisolasi tanpa mengubah kode produksi utama
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors font-medium text-[11px]"
            >
              <span>Lihat Versi Klasik (/dashboard)</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        
        {/* ==================================================================== */}
        {/* SECTION 1: ASYMMETRIC BENTO GRID HERO & REAL-TIME TELEMETRY          */}
        {/* ==================================================================== */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* Bento Tile 1: Hero OS Hub (Span 8 Cols) */}
          <div className="lg:col-span-7 xl:col-span-8 rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-indigo-950/30 border border-slate-800/90 shadow-2xl relative overflow-hidden flex flex-col justify-between group hover:border-slate-700/80 transition-all duration-300">
            {/* Ambient Background Glows */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -z-10 group-hover:bg-indigo-500/15 transition-all duration-500" />
            <div className="absolute bottom-0 left-10 w-72 h-72 bg-rose-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold backdrop-blur-md">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>GooOS Universal Operating Hub</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-800/70 border border-slate-700/60 text-[11px] font-mono text-slate-400">
                  v2.4 Bento Layout
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl xl:text-5xl font-black tracking-tight text-white leading-tight">
                Pusat Operasi Manufaktur &amp;{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-indigo-300 to-cyan-300">
                  Studio 3D
                </span>
              </h1>

              <p className="text-sm text-slate-300/90 max-w-2xl leading-relaxed">
                Platform terpadu untuk monitoring armada printer 3D, manajemen inventaris filamen, pembuatan model parametrik CAD, dan automasi batching nesting.
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-wrap items-center gap-3">
              <Link
                href="/flow"
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/25 flex items-center gap-2 active:scale-95"
              >
                <span>Buka GooFlow Hub</span>
                <ChevronRight className="w-4 h-4" />
              </Link>

              <Link
                href="/cad"
                className="px-4 py-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700/80 transition-all flex items-center gap-2"
              >
                <Box className="w-3.5 h-3.5 text-cyan-400" />
                <span>CAD Studio Parametrik</span>
              </Link>

              <Link
                href="/orders"
                className="px-4 py-2.5 rounded-2xl bg-slate-900/60 hover:bg-slate-800 text-slate-300 text-xs font-medium border border-slate-800 transition-colors"
              >
                <span>Antrean Cetak</span>
              </Link>
            </div>
          </div>

          {/* Bento Tile 2: Live Fleet Status (Span 4 Cols) */}
          <div className="lg:col-span-5 xl:col-span-4 rounded-3xl p-6 bg-slate-900/50 border border-slate-800/80 backdrop-blur-sm shadow-xl flex flex-col justify-between hover:border-slate-700/80 transition-all duration-300 relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <Printer className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Armada Printer</h3>
                  <p className="text-[11px] text-slate-400">Creality &amp; Bambu Lab</p>
                </div>
              </div>

              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Online
              </span>
            </div>

            {/* Visual Gauge Metric */}
            <div className="my-6 space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-black font-mono text-white tracking-tight">
                  {telemetry ? `${telemetry.printers.online} / ${telemetry.printers.total}` : "3 / 3"}
                </span>
                <span className="text-xs font-semibold text-cyan-400">Mesin Beroperasi</span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-800/80 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
                <div
                  className="bg-gradient-to-r from-cyan-400 to-indigo-500 h-full rounded-full transition-all duration-500"
                  style={{
                    width: telemetry
                      ? `${Math.max(15, (telemetry.printers.online / Math.max(1, telemetry.printers.total)) * 100)}%`
                      : "100%",
                  }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span>Sedang Mencetak: {telemetry ? telemetry.printers.printing : 1} Mesin</span>
                <span className="text-slate-500">Idle: 2 Mesin</span>
              </div>
            </div>

            <Link
              href="/printers"
              className="w-full py-2.5 rounded-2xl bg-slate-800/60 hover:bg-slate-800 text-xs font-semibold text-slate-200 border border-slate-700/60 flex items-center justify-center gap-2 transition-colors group-hover:border-cyan-500/30"
            >
              <span>Buka Telemetri Printer</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </section>

        {/* ==================================================================== */}
        {/* SECTION 2: BENTO METRICS TRIO (Filament, Orders, Ledger)            */}
        {/* ==================================================================== */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
          
          {/* Card 1: Filament Spools */}
          <div className="rounded-3xl p-6 bg-slate-900/50 border border-slate-800/80 hover:border-slate-700/80 transition-all duration-300 flex flex-col justify-between group">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400">Inventaris Spul</span>
                <p className="text-2xl sm:text-3xl font-black font-mono text-white">
                  {telemetry ? `${telemetry.inventory.totalWeightKg} kg` : "128 Spool"}
                </p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 group-hover:scale-105 transition-transform">
                <Layers className="w-5 h-5" />
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800/60 flex items-center justify-between text-xs">
              <span className="text-slate-400">128 Spul aktif di rak</span>
              <Link href="/inventory" className="text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1">
                <span>Detail</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Card 2: Orders & Queue */}
          <div className="rounded-3xl p-6 bg-slate-900/50 border border-slate-800/80 hover:border-slate-700/80 transition-all duration-300 flex flex-col justify-between group">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400">Antrean Pesanan</span>
                <p className="text-2xl sm:text-3xl font-black font-mono text-white">
                  {telemetry ? `${telemetry.orders.total} Order` : "69 Order"}
                </p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800/60 flex items-center justify-between text-xs">
              <span className="text-emerald-400 font-medium">
                {telemetry ? `${telemetry.orders.completed} selesai` : "58 selesai"}
              </span>
              <Link href="/orders" className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1">
                <span>Kelola Antrean</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Card 3: Finance Ledger */}
          <div className="rounded-3xl p-6 bg-slate-900/50 border border-slate-800/80 hover:border-slate-700/80 transition-all duration-300 flex flex-col justify-between group">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400">Buku Kas &amp; Profit</span>
                <p className="text-2xl sm:text-3xl font-black font-mono text-white">
                  {telemetry ? `Rp ${(telemetry.finance.netProfit / 1_000_000).toFixed(1)}M` : "474 Catatan"}
                </p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800/60 flex items-center justify-between text-xs">
              <span className="text-slate-400">Shopee &amp; Tokopedia ledger</span>
              <Link href="/transactions" className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1">
                <span>Catatan</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

        </section>

        {/* ==================================================================== */}
        {/* SECTION 3: BENTO APP TILES SUITE                                     */}
        {/* ==================================================================== */}
        <section className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Filter Ekosistem:
              </span>
              <div className="flex flex-wrap gap-1.5 ml-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                      activeCategory === cat
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-105"
                        : "bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800"
                    }`}
                  >
                    {cat === "all" ? "Semua Modul" : cat}
                  </button>
                ))}
              </div>
            </div>

            <span className="text-xs font-mono text-slate-500">
              {filteredApps.length} Aplikasi Terpasang
            </span>
          </div>

          {/* Asymmetric Bento App Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredApps.map((app, index) => {
              // Give first app (GooFlow) wider prominence if all are displayed
              const isHeroApp = app.id === "3dflow" && activeCategory === "all";

              return (
                <div
                  key={app.id}
                  className={`rounded-3xl border border-slate-800/90 bg-slate-900/40 hover:bg-slate-900/70 transition-all duration-300 overflow-hidden flex flex-col justify-between shadow-xl hover:-translate-y-1 hover:shadow-2xl ${
                    isHeroApp ? "md:col-span-2 lg:col-span-2" : ""
                  }`}
                >
                  <div className="p-6 sm:p-7 space-y-5">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <div
                          className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-md shrink-0"
                          style={{
                            backgroundColor: `${app.color}20`,
                            borderColor: `${app.color}40`,
                          }}
                        >
                          {app.icon}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-xl font-black text-white">{app.name}</h2>
                            <span
                              className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border uppercase"
                              style={{
                                backgroundColor: `${app.color}15`,
                                color: app.color,
                                borderColor: `${app.color}35`,
                              }}
                            >
                              {app.version}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 font-medium">{app.tagline}</p>
                        </div>
                      </div>

                      {app.status === "coming_soon" && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 shrink-0">
                          R&amp;D
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                      {app.description}
                    </p>

                    {/* Stats pills */}
                    {app.stats && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {app.stats.map((s, idx) => (
                          <div
                            key={idx}
                            className="px-2.5 py-1 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] flex items-center gap-1.5"
                          >
                            <span className="text-slate-500">{s.label}:</span>
                            <span className="font-semibold text-slate-200 font-mono">{s.value}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Submenu Pills Grid */}
                    <div className="space-y-2 pt-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Fitur Utama
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {app.menu.slice(0, isHeroApp ? 6 : 4).map((m, mIdx) => (
                          <Link
                            key={mIdx}
                            href={app.status === "active" ? m.href : "#"}
                            className="p-2.5 rounded-xl bg-slate-950/40 hover:bg-slate-800/60 border border-slate-800/80 hover:border-slate-700 transition-all flex items-center justify-between text-xs group/item"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-sm shrink-0">{m.icon}</span>
                              <span className="font-medium text-slate-300 group-hover/item:text-white truncate">
                                {m.name}
                              </span>
                            </div>
                            {m.badge && (
                              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 shrink-0">
                                {m.badge}
                              </span>
                            )}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Footer Action */}
                  <div className="p-4 bg-slate-950/40 border-t border-slate-800/60 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">
                      Kategori: <strong className="text-slate-400 font-normal">{app.category}</strong>
                    </span>

                    {app.status === "active" ? (
                      <Link
                        href={app.href}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-md flex items-center gap-1.5 hover:opacity-95"
                        style={{ backgroundColor: app.color }}
                      >
                        <span>Buka {app.name}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    ) : (
                      <span className="text-[11px] font-medium text-slate-500 italic">
                        Segera Hadir
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500 mt-12">
        © 2026 GOOCANAN · Bento Box Modern Sandbox · GooOS Universal Platform
      </footer>
    </div>
  );
}
