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
  Radio,
  Terminal,
  Crosshair,
  Shield,
  CircleDot,
  Gauge,
  Wifi,
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

export default function OledCyberpunkDashboardPage() {
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
    <div className="min-h-screen bg-[#000000] text-zinc-100 flex flex-col font-sans selection:bg-[#00F0FF]/30 selection:text-[#00F0FF]">
      <GooNavbar />

      {/* ====================================================================== */}
      {/* CYBERPUNK HUD TOP TICKER & SANDBOX CONTROLLER                          */}
      {/* ====================================================================== */}
      <div className="bg-[#050505] border-b border-[#00F0FF]/30 px-4 py-2.5 shadow-[0_0_15px_rgba(0,240,255,0.15)]">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#00F0FF]/10 border border-[#00F0FF]/40 text-[#00F0FF] text-[11px] font-bold tracking-wider">
              <span className="w-2 h-2 rounded-full bg-[#00FF66] animate-ping" />
              <span>OLED // CYBERPUNK v4.2</span>
            </div>
            <span className="text-zinc-600">|</span>
            <span className="text-zinc-400 hidden sm:inline">
              SYS STATUS: <strong className="text-[#00FF66]">ALL NODES OPERATIONAL</strong>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] text-zinc-500 hidden md:inline">
              PURE PITCH BLACK #000000 (0% OLED PIXEL EMISSION)
            </span>
            <Link
              href="/dashboard"
              className="px-3 py-1 rounded bg-[#0a0a0a] hover:bg-[#141414] text-zinc-300 hover:text-[#00F0FF] border border-zinc-800 hover:border-[#00F0FF]/50 text-[11px] font-semibold flex items-center gap-1.5 transition-all"
            >
              <span>Versi Klasik (/dashboard)</span>
              <ArrowUpRight className="w-3 h-3 text-[#00F0FF]" />
            </Link>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* ==================================================================== */}
        {/* HERO SECTION: OLED CYBER FORGE COMMAND NEXUS                          */}
        {/* ==================================================================== */}
        <section className="relative rounded-2xl bg-[#050505] border border-[#00F0FF]/40 p-6 sm:p-9 shadow-[0_0_35px_rgba(0,240,255,0.12)] overflow-hidden group">
          {/* Cyber HUD Corner Tech Accents */}
          <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#00F0FF]" />
          <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#00F0FF]" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#00F0FF]" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#00F0FF]" />

          {/* Ambient Cyber Neon Glow */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#00F0FF]/10 rounded-full blur-3xl pointer-events-none -z-10 group-hover:bg-[#00F0FF]/15 transition-all duration-700" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#FF007F]/10 rounded-full blur-3xl pointer-events-none -z-10" />

          <div className="max-w-4xl space-y-4">
            <div className="flex flex-wrap items-center gap-2 font-mono">
              <span className="px-2.5 py-0.5 rounded bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/40 text-[10px] font-black uppercase tracking-widest">
                [ FABRICATION PROTOCOL // ACTIVE ]
              </span>
              <span className="text-[11px] text-zinc-500">
                HOST: GOO-OS-MAIN-NODE // 3D-PRINT-FARM
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight uppercase font-mono">
              PUSAT KENDALI{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00F0FF] via-[#00FF66] to-[#FFE600] drop-shadow-[0_0_20px_rgba(0,240,255,0.4)]">
                GOO-OS MANUFAKTUR
              </span>
            </h1>

            <p className="text-sm sm:text-base text-zinc-300 leading-relaxed max-w-3xl">
              Terminal orkestrasi printer 3D terpadu: telemetri armada real-time, monitoring level sisa filamen, engine perancangan parametrik CAD, dan automasi batching nesting.
            </p>

            {/* Quick Action Cyber Buttons */}
            <div className="pt-4 flex flex-wrap items-center gap-3 font-mono">
              <Link
                href="/flow"
                className="px-5 py-2.5 rounded-lg bg-[#00F0FF] hover:bg-[#00d8e6] text-black text-xs font-black tracking-wider uppercase transition-all shadow-[0_0_20px_rgba(0,240,255,0.4)] flex items-center gap-2 active:scale-95"
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>Masuk GooFlow Telemetri</span>
                <ChevronRight className="w-4 h-4" />
              </Link>

              <Link
                href="/cad"
                className="px-4 py-2.5 rounded-lg bg-[#0a0a0a] hover:bg-[#141414] text-[#00F0FF] text-xs font-bold border border-[#00F0FF]/40 hover:border-[#00F0FF] transition-all flex items-center gap-2 shadow-[0_0_10px_rgba(0,240,255,0.1)]"
              >
                <Box className="w-4 h-4 text-[#00FF66]" />
                <span>CAD Studio Slicer</span>
              </Link>

              <Link
                href="/orders"
                className="px-4 py-2.5 rounded-lg bg-[#0a0a0a] hover:bg-[#141414] text-zinc-300 hover:text-white text-xs font-semibold border border-zinc-800 transition-colors"
              >
                <span>Antrean Pesanan</span>
              </Link>
            </div>
          </div>
        </section>

        {/* ==================================================================== */}
        {/* TELEMETRY GAUGES (OLED HIGH CONTRAST & NEON ACCENTS)                 */}
        {/* ==================================================================== */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Filament Inventory */}
          <div className="rounded-xl p-5 bg-[#080808] border border-zinc-800 hover:border-[#FF007F]/60 transition-all duration-300 shadow-[0_0_15px_rgba(0,0,0,0.8)] hover:shadow-[0_0_20px_rgba(255,0,127,0.2)] flex flex-col justify-between group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF007F]" />
                Filamen &amp; Spul
              </span>
              <div className="w-8 h-8 rounded-lg bg-[#FF007F]/10 border border-[#FF007F]/30 flex items-center justify-center text-[#FF007F] group-hover:scale-110 transition-transform">
                <Layers className="w-4 h-4" />
              </div>
            </div>

            <div className="my-3">
              <p className="text-3xl font-black font-mono tracking-tight text-white">
                {telemetry ? `${telemetry.inventory.totalWeightKg} kg` : "128 Spool"}
              </p>
              <div className="flex items-center gap-2 mt-1 font-mono text-[11px]">
                <span className="text-[#FF007F] font-bold">128 Spul aktif</span>
                <span className="text-zinc-700">|</span>
                <span className="text-zinc-400">Rak A1–D4</span>
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-900 flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-500 text-[11px]">Status Stok</span>
              <Link href="/inventory" className="text-[#FF007F] hover:underline font-bold flex items-center gap-1">
                <span>Kelola</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Card 2: Fleet Printers Status */}
          <div className="rounded-xl p-5 bg-[#080808] border border-zinc-800 hover:border-[#00F0FF]/60 transition-all duration-300 shadow-[0_0_15px_rgba(0,0,0,0.8)] hover:shadow-[0_0_20px_rgba(0,240,255,0.2)] flex flex-col justify-between group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF]" />
                Armada Mesin
              </span>
              <div className="w-8 h-8 rounded-lg bg-[#00F0FF]/10 border border-[#00F0FF]/30 flex items-center justify-center text-[#00F0FF] group-hover:scale-110 transition-transform">
                <Printer className="w-4 h-4" />
              </div>
            </div>

            <div className="my-3">
              <div className="flex items-baseline justify-between">
                <p className="text-3xl font-black font-mono tracking-tight text-white">
                  {telemetry ? `${telemetry.printers.online} / ${telemetry.printers.total}` : "3 / 3"}
                </p>
                <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded bg-[#00FF66]/10 text-[#00FF66] border border-[#00FF66]/30">
                  ONLINE
                </span>
              </div>
              <p className="text-[11px] font-mono text-zinc-400 mt-1">
                Creality Hi + Bambu Lab
              </p>
            </div>

            <div className="pt-3 border-t border-zinc-900 flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-500 text-[11px]">Sedang Cetak: {telemetry?.printers.printing ?? 1} unit</span>
              <Link href="/printers" className="text-[#00F0FF] hover:underline font-bold flex items-center gap-1">
                <span>Telemetri</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Card 3: Active Orders */}
          <div className="rounded-xl p-5 bg-[#080808] border border-zinc-800 hover:border-[#FFE600]/60 transition-all duration-300 shadow-[0_0_15px_rgba(0,0,0,0.8)] hover:shadow-[0_0_20px_rgba(255,230,0,0.2)] flex flex-col justify-between group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FFE600]" />
                Pesanan &amp; Antrean
              </span>
              <div className="w-8 h-8 rounded-lg bg-[#FFE600]/10 border border-[#FFE600]/30 flex items-center justify-center text-[#FFE600] group-hover:scale-110 transition-transform">
                <Clock className="w-4 h-4" />
              </div>
            </div>

            <div className="my-3">
              <p className="text-3xl font-black font-mono tracking-tight text-white">
                {telemetry ? `${telemetry.orders.total}` : "69"} <span className="text-base font-normal text-zinc-500">Antrean</span>
              </p>
              <div className="flex items-center gap-2 mt-1 font-mono text-[11px]">
                <span className="text-[#00FF66] font-bold">{telemetry ? telemetry.orders.completed : 58} Selesai</span>
                <span className="text-zinc-700">|</span>
                <span className="text-[#FFE600] font-bold">{telemetry ? telemetry.orders.pending : 11} Pending</span>
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-900 flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-500 text-[11px]">Siklus Cetak</span>
              <Link href="/orders" className="text-[#FFE600] hover:underline font-bold flex items-center gap-1">
                <span>Rincian</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Card 4: Ledger & Profit */}
          <div className="rounded-xl p-5 bg-[#080808] border border-zinc-800 hover:border-[#00FF66]/60 transition-all duration-300 shadow-[0_0_15px_rgba(0,0,0,0.8)] hover:shadow-[0_0_20px_rgba(0,255,102,0.2)] flex flex-col justify-between group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00FF66]" />
                Kas &amp; Laba Bersih
              </span>
              <div className="w-8 h-8 rounded-lg bg-[#00FF66]/10 border border-[#00FF66]/30 flex items-center justify-center text-[#00FF66] group-hover:scale-110 transition-transform">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>

            <div className="my-3">
              <p className="text-3xl font-black font-mono tracking-tight text-white">
                {telemetry ? `Rp ${(telemetry.finance.netProfit / 1_000_000).toFixed(1)}M` : "474 Catatan"}
              </p>
              <p className="text-[11px] font-mono text-zinc-400 mt-1">
                Shopee + Tokopedia Ledger
              </p>
            </div>

            <div className="pt-3 border-t border-zinc-900 flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-500 text-[11px]">Buku Kas Transaksi</span>
              <Link href="/transactions" className="text-[#00FF66] hover:underline font-bold flex items-center gap-1">
                <span>Buka Ledger</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

        </section>

        {/* ==================================================================== */}
        {/* FILTER CATEGORY STRIP (CYBERPUNK NEON PILLS)                         */}
        {/* ==================================================================== */}
        <section className="flex flex-wrap items-center justify-between gap-4 pt-2 font-mono">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 mr-2 flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#00F0FF]" />
              <span>FILTER MODUL:</span>
            </span>

            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                    activeCategory === cat
                      ? "bg-[#00F0FF] text-black shadow-[0_0_15px_rgba(0,240,255,0.5)] font-black"
                      : "bg-[#0a0a0a] text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-700"
                  }`}
                >
                  {cat === "all" ? "SEMUA MODUL" : cat}
                </button>
              ))}
            </div>
          </div>

          <div className="text-xs text-zinc-500">
            TERPASANG: {filteredApps.length} APLIKASI
          </div>
        </section>

        {/* ==================================================================== */}
        {/* APPLICATIONS SUITE (OLED PLATES & NEON HIGHLIGHTS)                   */}
        {/* ==================================================================== */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredApps.map((app) => {
            const isAvailable = app.status === "active";

            return (
              <div
                key={app.id}
                className="rounded-2xl bg-[#080808] border border-zinc-800/90 hover:border-[#00F0FF]/60 transition-all duration-300 p-6 sm:p-7 flex flex-col justify-between shadow-[0_0_20px_rgba(0,0,0,0.9)] hover:shadow-[0_0_25px_rgba(0,240,255,0.15)] relative overflow-hidden group"
              >
                {/* Subtle Neon Line along top */}
                <div
                  className="absolute top-0 left-0 right-0 h-[2px] opacity-70 group-hover:opacity-100 transition-opacity"
                  style={{ backgroundColor: app.color }}
                />

                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 shadow-lg"
                        style={{
                          backgroundColor: `${app.color}15`,
                          border: `1px solid ${app.color}40`,
                        }}
                      >
                        {app.icon}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-xl font-black text-white tracking-tight uppercase font-mono">
                            {app.name}
                          </h2>
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
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded bg-[#FFE600]/10 text-[#FFE600] border border-[#FFE600]/30 shrink-0 font-mono uppercase tracking-wider">
                        R&amp;D
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded bg-[#00FF66]/10 text-[#00FF66] border border-[#00FF66]/30 shrink-0 font-mono uppercase tracking-wider">
                        ONLINE
                      </span>
                    )}
                  </div>

                  {/* App Description */}
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    {app.description}
                  </p>

                  {/* Stats chips */}
                  {app.stats && app.stats.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1 font-mono">
                      {app.stats.map((s, idx) => (
                        <div
                          key={idx}
                          className="px-2.5 py-1 rounded-md bg-[#000000] border border-zinc-800 text-[11px] flex items-center gap-1.5"
                        >
                          <span className="text-zinc-500">{s.label}:</span>
                          <span className="font-bold text-zinc-200">{s.value}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Submenu Grid */}
                  <div className="space-y-2 pt-3 font-mono">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                      SUB-MODUL &amp; ENDPOINT ({app.menu.length})
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {app.menu.map((menuItem, idx) => (
                        <Link
                          key={idx}
                          href={isAvailable ? menuItem.href : "#"}
                          className={`p-2.5 rounded-lg border transition-all flex items-center justify-between text-xs group/item ${
                            isAvailable
                              ? "bg-[#000000] hover:bg-[#121212] border-zinc-800 hover:border-[#00F0FF]/50 cursor-pointer"
                              : "bg-[#000000]/40 border-zinc-900 opacity-40 cursor-not-allowed"
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-sm shrink-0">{menuItem.icon}</span>
                            <span className="font-semibold text-zinc-300 group-hover/item:text-[#00F0FF] truncate">
                              {menuItem.name}
                            </span>
                          </div>

                          {menuItem.badge && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-zinc-900 text-zinc-400 shrink-0 border border-zinc-800">
                              {menuItem.badge}
                            </span>
                          )}
                        </Link>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Footer Action */}
                <div className="mt-6 pt-4 border-t border-zinc-900 flex items-center justify-between font-mono">
                  <span className="text-[11px] text-zinc-500">
                    KATEGORI: <strong className="text-zinc-300 font-bold">{app.category}</strong>
                  </span>

                  {isAvailable ? (
                    <Link
                      href={app.href}
                      className="px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider text-white transition-all shadow-md flex items-center gap-1.5 hover:brightness-110 active:scale-95"
                      style={{ backgroundColor: app.color }}
                    >
                      <span>Buka {app.name}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  ) : (
                    <span className="text-[11px] text-zinc-600 italic">
                      [ DALAM PENGEMBANGAN ]
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </section>

      </main>

      {/* Cyber Footer */}
      <footer className="border-t border-zinc-900 py-6 text-center text-xs text-zinc-500 mt-12 font-mono">
        © 2026 GOOCANAN · GooOS OLED Cyberpunk Sandbox · True Black #000000 Engine
      </footer>
    </div>
  );
}
