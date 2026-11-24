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
  Zap,
  Gauge,
  Radio,
  Boxes,
  Terminal,
  Palette,
  Crosshair,
  ShieldAlert,
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

type ThemeMode = "cyber-forge" | "neobrutalism" | "scifi-hud" | "oled-cyberpunk";

export default function NewThemeDashboardPage() {
  const [telemetry, setTelemetry] = useState<TelemetryOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [theme, setTheme] = useState<ThemeMode>("cyber-forge");

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

  // ==========================================================================
  // THEME CONFIGURATION PROFILES
  // ==========================================================================
  const themeConfig = {
    "cyber-forge": {
      name: "Industrial Cyber-Forge",
      badge: "Titanium & Amber Laser",
      pageBg: "bg-[#090b10] text-zinc-100",
      heroBg: "bg-gradient-to-br from-[#121620] via-[#0d1017] to-[#181d29] border border-amber-500/30 shadow-[0_0_50px_rgba(245,158,11,0.06)]",
      cardBg: "bg-[#0f131c]/90 border border-zinc-800/90 hover:border-amber-500/50 shadow-xl",
      accentText: "text-amber-400",
      accentBg: "bg-amber-500",
      accentGlow: "from-amber-500/20 via-amber-500/5 to-transparent",
      accentBorder: "border-amber-500/30",
      metricCardBg: "bg-[#111622] border border-zinc-800 hover:border-amber-500/40",
      pillActive: "bg-amber-500 text-black font-black shadow-lg shadow-amber-500/25",
      pillInactive: "bg-[#111520] text-zinc-400 hover:text-zinc-200 border border-zinc-800",
      primaryButton: "bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black font-black shadow-lg shadow-amber-500/20",
      badgeStyle: "font-mono uppercase tracking-wider text-[10px] px-2.5 py-0.5 rounded border border-amber-500/30 bg-amber-500/10 text-amber-300",
      radius: "rounded-2xl",
    },
    "neobrutalism": {
      name: "Neubrutalism Studio",
      badge: "High-Contrast & Acid Yellow",
      pageBg: "bg-[#101216] text-white",
      heroBg: "bg-[#181a20] border-2 border-yellow-400 shadow-[6px_6px_0px_#facc15]",
      cardBg: "bg-[#1a1d24] border-2 border-zinc-700 hover:border-yellow-400 shadow-[4px_4px_0px_#27272a] hover:shadow-[4px_4px_0px_#facc15] transition-all",
      accentText: "text-yellow-400",
      accentBg: "bg-yellow-400",
      accentGlow: "from-yellow-400/20 via-yellow-400/5 to-transparent",
      accentBorder: "border-yellow-400",
      metricCardBg: "bg-[#181a20] border-2 border-zinc-700 hover:border-yellow-400 shadow-[4px_4px_0px_#27272a]",
      pillActive: "bg-yellow-400 text-black font-black shadow-[2px_2px_0px_#fff]",
      pillInactive: "bg-[#1c1f27] text-zinc-300 hover:text-white border-2 border-zinc-800",
      primaryButton: "bg-yellow-400 text-black font-black border-2 border-black hover:bg-yellow-300 shadow-[3px_3px_0px_#fff] active:translate-x-0.5 active:translate-y-0.5",
      badgeStyle: "font-mono font-bold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded-none border border-yellow-400 bg-yellow-400/20 text-yellow-300",
      radius: "rounded-none",
    },
    "scifi-hud": {
      name: "Sci-Fi HUD Cockpit",
      badge: "Holographic Cyan & Neon",
      pageBg: "bg-[#030712] text-cyan-50",
      heroBg: "bg-black/90 border border-cyan-500/40 shadow-[0_0_35px_rgba(6,182,212,0.2)] relative before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] before:from-cyan-900/20 before:to-transparent",
      cardBg: "bg-[#050b14]/90 border border-cyan-900/60 hover:border-cyan-400/60 shadow-[0_0_20px_rgba(6,182,212,0.08)]",
      accentText: "text-cyan-400",
      accentBg: "bg-cyan-500",
      accentGlow: "from-cyan-500/20 via-cyan-500/5 to-transparent",
      accentBorder: "border-cyan-500/40",
      metricCardBg: "bg-[#040813] border border-cyan-900/70 hover:border-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.1)]",
      pillActive: "bg-cyan-500 text-black font-bold shadow-[0_0_15px_rgba(6,182,212,0.5)]",
      pillInactive: "bg-[#070f1e] text-cyan-300/60 hover:text-cyan-200 border border-cyan-900/60",
      primaryButton: "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold shadow-[0_0_20px_rgba(6,182,212,0.4)]",
      badgeStyle: "font-mono uppercase tracking-widest text-[10px] px-2 py-0.5 rounded border border-cyan-400/40 bg-cyan-950/60 text-cyan-300",
      radius: "rounded-xl",
    },
    "oled-cyberpunk": {
      name: "OLED Cyberpunk UI",
      badge: "Pure Black #000000 + Neon Matrix",
      pageBg: "bg-[#000000] text-zinc-100",
      heroBg: "bg-[#050505] border border-[#00F0FF]/40 shadow-[0_0_35px_rgba(0,240,255,0.15)] relative before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] before:from-[#00F0FF]/10 before:to-transparent",
      cardBg: "bg-[#080808] border border-zinc-800/90 hover:border-[#00F0FF]/60 shadow-[0_0_20px_rgba(0,0,0,0.9)] hover:shadow-[0_0_25px_rgba(0,240,255,0.15)]",
      accentText: "text-[#00F0FF]",
      accentBg: "bg-[#00F0FF]",
      accentGlow: "from-[#00F0FF]/20 via-[#00F0FF]/5 to-transparent",
      accentBorder: "border-[#00F0FF]/40",
      metricCardBg: "bg-[#080808] border border-zinc-800 hover:border-[#00F0FF]/60 shadow-[0_0_15px_rgba(0,0,0,0.8)]",
      pillActive: "bg-[#00F0FF] text-black font-black shadow-[0_0_15px_rgba(0,240,255,0.5)]",
      pillInactive: "bg-[#0a0a0a] text-zinc-400 hover:text-white border border-zinc-800",
      primaryButton: "bg-[#00F0FF] hover:bg-[#00d8e6] text-black font-black uppercase tracking-wider shadow-[0_0_20px_rgba(0,240,255,0.4)]",
      badgeStyle: "font-mono uppercase tracking-widest text-[10px] px-2.5 py-0.5 rounded border border-[#00F0FF]/40 bg-[#00F0FF]/10 text-[#00F0FF]",
      radius: "rounded-xl",
    },
  }[theme];

  return (
    <div className={`min-h-screen ${themeConfig.pageBg} flex flex-col transition-colors duration-500`}>
      <GooNavbar />

      {/* ====================================================================== */}
      {/* THEME CONTROL BAR & EXPERIMENT COMPARISON                             */}
      {/* ====================================================================== */}
      <div className="sticky top-0 z-40 backdrop-blur-xl bg-black/70 border-b border-zinc-800/80 px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Switcher Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-400 mr-1">
              <Palette className="w-3.5 h-3.5 text-amber-400" />
              <span>Pilih Karakter Tema:</span>
            </span>

            <button
              onClick={() => setTheme("cyber-forge")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                theme === "cyber-forge"
                  ? "bg-amber-500 text-black shadow-md shadow-amber-500/30 scale-105"
                  : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
              }`}
            >
              <span>⚡</span>
              <span>Cyber-Forge (Titanium &amp; Amber)</span>
            </button>

            <button
              onClick={() => setTheme("neobrutalism")}
              className={`px-3 py-1.5 text-xs font-bold transition-all flex items-center gap-1.5 ${
                theme === "neobrutalism"
                  ? "bg-yellow-400 text-black border-2 border-black shadow-[3px_3px_0px_#fff] scale-105 font-black"
                  : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
              }`}
            >
              <span>🟨</span>
              <span>Neubrutalism (Acid &amp; Contrast)</span>
            </button>

            <button
              onClick={() => setTheme("scifi-hud")}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                theme === "scifi-hud"
                  ? "bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.6)] scale-105"
                  : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
              }`}
            >
              <span>🌌</span>
              <span>Sci-Fi HUD (Cosmic Cyan)</span>
            </button>

            <button
              onClick={() => setTheme("oled-cyberpunk")}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                theme === "oled-cyberpunk"
                  ? "bg-[#00F0FF] text-black shadow-[0_0_15px_rgba(0,240,255,0.7)] scale-105 font-black"
                  : "bg-black text-[#00F0FF] hover:bg-zinc-900 border border-[#00F0FF]/40"
              }`}
            >
              <span>⚡🖤</span>
              <span>Dark Mode (OLED) + Cyberpunk</span>
            </button>
          </div>

          {/* Quick Info & Compare */}
          <div className="flex items-center gap-3 shrink-0">
            <span className="hidden lg:inline text-[11px] font-mono text-zinc-400">
              Tema aktif: <strong className={themeConfig.accentText}>{themeConfig.badge}</strong>
            </span>
            <Link
              href="/dashboard"
              className="px-3 py-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <span>Bandingkan dg /dashboard</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* ====================================================================== */}
      {/* MAIN CONTENT WORKSPACE                                                */}
      {/* ====================================================================== */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* -------------------------------------------------------------------- */}
        {/* HERO SECTION WITH NEW AESTHETICS                                      */}
        {/* -------------------------------------------------------------------- */}
        <section className={`${themeConfig.radius} ${themeConfig.heroBg} p-6 sm:p-9 relative overflow-hidden transition-all duration-300`}>
          
          {/* Subtle Industrial Overlay Graphics */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-white/5 via-transparent to-transparent pointer-events-none -z-10" />

          <div className="max-w-4xl space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className={themeConfig.badgeStyle}>
                ● GOO-OS COMMAND STATION
              </span>
              <span className="text-[11px] font-mono text-zinc-400">
                [ PROTOCOL: 3D-AM-FACTORY ]
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Pusat Kendali Fabrikasi &amp;{" "}
              <span className={`text-transparent bg-clip-text bg-gradient-to-r ${
                theme === "cyber-forge"
                  ? "from-amber-400 via-orange-400 to-amber-200"
                  : theme === "neobrutalism"
                  ? "from-yellow-300 via-yellow-400 to-white"
                  : "from-cyan-300 via-teal-300 to-blue-400"
              }`}>
                Ekosistem GooOS
              </span>
            </h1>

            <p className="text-sm sm:text-base text-zinc-300/90 leading-relaxed max-w-3xl">
              Platform komprehensif kendali mesin cetak 3D, pengawasan sisa filamen real-time, perancangan parametrik CAD, hingga otomatisasi pembagian bed plate nesting batching.
            </p>

            {/* Quick Action Navigation Buttons */}
            <div className="pt-4 flex flex-wrap items-center gap-3">
              <Link
                href="/flow"
                className={`px-5 py-2.5 ${themeConfig.radius} ${themeConfig.primaryButton} text-xs transition-all flex items-center gap-2`}
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>Masuk GooFlow Telemetri</span>
                <ChevronRight className="w-4 h-4" />
              </Link>

              <Link
                href="/cad"
                className={`px-4 py-2.5 ${themeConfig.radius} bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 text-xs font-bold border border-zinc-700/80 transition-colors flex items-center gap-2`}
              >
                <Box className={`w-4 h-4 ${themeConfig.accentText}`} />
                <span>CAD Studio Slicer</span>
              </Link>

              <Link
                href="/orders"
                className={`px-4 py-2.5 ${themeConfig.radius} bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold border border-zinc-800 transition-colors`}
              >
                <span>Antrean Pesanan</span>
              </Link>
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------------------- */}
        {/* TELEMETRY METRIC STRIP (NEW DESIGN)                                  */}
        {/* -------------------------------------------------------------------- */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Metric 1: Filament Inventory */}
          <div className={`${themeConfig.radius} ${themeConfig.metricCardBg} p-5 transition-all duration-300 flex flex-col justify-between group`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono">
                Inventaris Filamen
              </span>
              <div className="w-8 h-8 rounded-lg bg-zinc-800/80 flex items-center justify-center text-zinc-300 group-hover:scale-110 transition-transform">
                <Layers className={`w-4 h-4 ${themeConfig.accentText}`} />
              </div>
            </div>

            <div className="my-3">
              <p className="text-3xl font-black font-mono tracking-tight text-white">
                {telemetry ? `${telemetry.inventory.totalWeightKg} kg` : "128 Spool"}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-[11px] font-semibold ${themeConfig.accentText}`}>
                  128 Spul aktif di rak
                </span>
                <span className="text-zinc-600">|</span>
                <span className="text-[11px] text-zinc-400">Total Gramasi</span>
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs">
              <span className="text-zinc-500 font-mono text-[11px]">Nilai Aset Stok</span>
              <Link href="/inventory" className={`${themeConfig.accentText} hover:underline font-bold text-xs flex items-center gap-1`}>
                <span>Kelola</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Metric 2: Printers Fleet Status */}
          <div className={`${themeConfig.radius} ${themeConfig.metricCardBg} p-5 transition-all duration-300 flex flex-col justify-between group`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono">
                Armada Printer
              </span>
              <div className="w-8 h-8 rounded-lg bg-zinc-800/80 flex items-center justify-center text-zinc-300 group-hover:scale-110 transition-transform">
                <Printer className={`w-4 h-4 ${themeConfig.accentText}`} />
              </div>
            </div>

            <div className="my-3">
              <div className="flex items-baseline justify-between">
                <p className="text-3xl font-black font-mono tracking-tight text-white">
                  {telemetry ? `${telemetry.printers.online} / ${telemetry.printers.total}` : "3 / 3"}
                </p>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  ONLINE
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">
                Creality Hi &amp; Bambu Lab armada aktif
              </p>
            </div>

            <div className="pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs">
              <span className="text-zinc-500 font-mono text-[11px]">Mencetak: {telemetry?.printers.printing ?? 1} unit</span>
              <Link href="/printers" className={`${themeConfig.accentText} hover:underline font-bold text-xs flex items-center gap-1`}>
                <span>Live View</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Metric 3: Active Orders */}
          <div className={`${themeConfig.radius} ${themeConfig.metricCardBg} p-5 transition-all duration-300 flex flex-col justify-between group`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono">
                Antrean Pesanan
              </span>
              <div className="w-8 h-8 rounded-lg bg-zinc-800/80 flex items-center justify-center text-zinc-300 group-hover:scale-110 transition-transform">
                <Clock className={`w-4 h-4 ${themeConfig.accentText}`} />
              </div>
            </div>

            <div className="my-3">
              <p className="text-3xl font-black font-mono tracking-tight text-white">
                {telemetry ? `${telemetry.orders.total}` : "69"} <span className="text-lg font-normal text-zinc-400">Order</span>
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[11px] font-semibold text-emerald-400">
                  {telemetry ? telemetry.orders.completed : 58} Selesai
                </span>
                <span className="text-zinc-600">|</span>
                <span className="text-[11px] text-amber-400">
                  {telemetry ? telemetry.orders.pending : 11} Dalam Antrean
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs">
              <span className="text-zinc-500 font-mono text-[11px]">Siklus Produksi</span>
              <Link href="/orders" className={`${themeConfig.accentText} hover:underline font-bold text-xs flex items-center gap-1`}>
                <span>Lihat Antrean</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Metric 4: Ledger & Net Profit */}
          <div className={`${themeConfig.radius} ${themeConfig.metricCardBg} p-5 transition-all duration-300 flex flex-col justify-between group`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono">
                Buku Kas &amp; Profit
              </span>
              <div className="w-8 h-8 rounded-lg bg-zinc-800/80 flex items-center justify-center text-zinc-300 group-hover:scale-110 transition-transform">
                <TrendingUp className={`w-4 h-4 ${themeConfig.accentText}`} />
              </div>
            </div>

            <div className="my-3">
              <p className="text-3xl font-black font-mono tracking-tight text-white">
                {telemetry ? `Rp ${(telemetry.finance.netProfit / 1_000_000).toFixed(1)}M` : "474 Catatan"}
              </p>
              <p className="text-[11px] text-zinc-400 mt-1">
                Shopee, Tokopedia &amp; Direct Ledger
              </p>
            </div>

            <div className="pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs">
              <span className="text-zinc-500 font-mono text-[11px]">Akuntansi Finansial</span>
              <Link href="/transactions" className={`${themeConfig.accentText} hover:underline font-bold text-xs flex items-center gap-1`}>
                <span>Buku Kas</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

        </section>

        {/* -------------------------------------------------------------------- */}
        {/* CATEGORY FILTER BAR (THEMED)                                         */}
        {/* -------------------------------------------------------------------- */}
        <section className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider font-mono text-zinc-400 mr-2 flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filter Modul:</span>
            </span>

            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3.5 py-1.5 ${themeConfig.radius} text-xs font-bold transition-all ${
                    activeCategory === cat ? themeConfig.pillActive : themeConfig.pillInactive
                  }`}
                >
                  {cat === "all" ? "Semua Modul" : cat}
                </button>
              ))}
            </div>
          </div>

          <div className="text-xs font-mono text-zinc-500">
            Terpasang: {filteredApps.length} Aplikasi
          </div>
        </section>

        {/* -------------------------------------------------------------------- */}
        {/* APPLICATIONS SUITE (ALL APPS PRESERVED WITH COMPLETE FEATURE SET)    */}
        {/* -------------------------------------------------------------------- */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredApps.map((app) => {
            const isAvailable = app.status === "active";

            return (
              <div
                key={app.id}
                className={`${themeConfig.radius} ${themeConfig.cardBg} p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 relative overflow-hidden`}
              >
                <div className="space-y-4">
                  
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-12 h-12 ${themeConfig.radius} flex items-center justify-center text-2xl shrink-0 shadow-md`}
                        style={{
                          backgroundColor: `${app.color}20`,
                          border: `1px solid ${app.color}40`,
                        }}
                      >
                        {app.icon}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-xl font-black text-white tracking-tight">{app.name}</h2>
                          <span
                            className="text-[9px] font-mono font-bold px-2 py-0.5 rounded border uppercase"
                            style={{
                              backgroundColor: `${app.color}15`,
                              color: app.color,
                              borderColor: `${app.color}40`,
                            }}
                          >
                            {app.version}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-zinc-400">{app.tagline}</p>
                      </div>
                    </div>

                    {app.status === "coming_soon" ? (
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 shrink-0 font-mono">
                        TAHAP R&amp;D
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0 font-mono">
                        READY
                      </span>
                    )}
                  </div>

                  {/* App Description */}
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    {app.description}
                  </p>

                  {/* Stats Pill Strip */}
                  {app.stats && app.stats.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {app.stats.map((s, idx) => (
                        <div
                          key={idx}
                          className="px-2.5 py-1 rounded-md bg-black/40 border border-zinc-800 text-[11px] flex items-center gap-1.5"
                        >
                          <span className="text-zinc-500 font-mono">{s.label}:</span>
                          <span className="font-bold text-zinc-200 font-mono">{s.value}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Submenu Grid */}
                  <div className="space-y-2 pt-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono">
                      Sub-Modul &amp; Fitur ({app.menu.length})
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {app.menu.map((menuItem, idx) => (
                        <Link
                          key={idx}
                          href={isAvailable ? menuItem.href : "#"}
                          className={`p-2.5 ${themeConfig.radius} border transition-all flex items-center justify-between text-xs group/item ${
                            isAvailable
                              ? "bg-black/30 hover:bg-zinc-800/60 border-zinc-800/80 hover:border-zinc-700 cursor-pointer"
                              : "bg-black/10 border-zinc-900 opacity-50 cursor-not-allowed"
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-sm shrink-0">{menuItem.icon}</span>
                            <span className="font-semibold text-zinc-300 group-hover/item:text-white truncate">
                              {menuItem.name}
                            </span>
                          </div>

                          {menuItem.badge && (
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 shrink-0 border border-zinc-700/60">
                              {menuItem.badge}
                            </span>
                          )}
                        </Link>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Card Action Footer */}
                <div className="mt-6 pt-4 border-t border-zinc-800/80 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-zinc-500">
                    Kategori: <strong className="text-zinc-300 font-normal">{app.category}</strong>
                  </span>

                  {isAvailable ? (
                    <Link
                      href={app.href}
                      className={`px-4 py-2 ${themeConfig.radius} text-xs font-bold text-white transition-all shadow-md flex items-center gap-1.5 hover:opacity-90`}
                      style={{ backgroundColor: app.color }}
                    >
                      <span>Buka {app.name}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  ) : (
                    <span className="text-[11px] text-zinc-500 font-mono italic">
                      [ Segera Hadir ]
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-6 text-center text-xs text-zinc-500 mt-12 font-mono">
        © 2026 GOOCANAN · GooOS Multi-Theme Workspace Sandbox · All Features Preserved
      </footer>
    </div>
  );
}
