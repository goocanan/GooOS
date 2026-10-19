"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { GOO_APPS, GooApp } from "@/config/apps.config";
import { GooNavbar } from "@/components/GooNavbar";

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

export default function GooOSDashboard() {
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

  const filteredApps =
    activeCategory === "all"
      ? GOO_APPS
      : GOO_APPS.filter((a) => a.category.toLowerCase() === activeCategory.toLowerCase());

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <GooNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-10">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-indigo-950/40 border border-slate-800 p-8 sm:p-10 shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -z-10" />
          <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl -z-10" />

          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>GooOS Universal Operating Hub</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              Aplikasi Utama &amp; Pusat Kendali{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-indigo-300 to-cyan-300">
                GooOS
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
              Satu portal terpadu untuk mengakses seluruh aplikasi produksi:{" "}
              <strong className="text-rose-300 font-semibold">3DFlow</strong> (operasi manufaktur &amp; armada printer),{" "}
              <strong className="text-indigo-300 font-semibold">GOO-Studio</strong> (desain proyek &amp; batching bed), dan{" "}
              <strong className="text-cyan-300 font-semibold">GooPrint</strong> (CAD studio parametrik).
            </p>
          </div>

          {/* Quick Metrics Strip */}
          <div className="mt-8 pt-8 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-950/60 backdrop-blur rounded-2xl p-4 border border-slate-800">
              <span className="text-xs text-slate-400 font-medium">🧵 Total Filamen</span>
              <p className="text-2xl font-black text-white font-mono mt-1">
                {telemetry ? `${telemetry.inventory.totalWeightKg} kg` : "128 Spool"}
              </p>
              <span className="text-[11px] text-emerald-400">128 Spul aktif di inventaris</span>
            </div>

            <div className="bg-slate-950/60 backdrop-blur rounded-2xl p-4 border border-slate-800">
              <span className="text-xs text-slate-400 font-medium">🖨️ Armada Printer</span>
              <p className="text-2xl font-black text-white font-mono mt-1">
                {telemetry ? `${telemetry.printers.online} / ${telemetry.printers.total}` : "3 Mesin"}
              </p>
              <span className="text-[11px] text-emerald-400">Creality &amp; Bambu Lab</span>
            </div>

            <div className="bg-slate-950/60 backdrop-blur rounded-2xl p-4 border border-slate-800">
              <span className="text-xs text-slate-400 font-medium">📦 Produk &amp; Parts</span>
              <p className="text-2xl font-black text-white font-mono mt-1">
                {telemetry ? `${telemetry.productsCount} Produk` : "40 Produk"}
              </p>
              <span className="text-[11px] text-indigo-400">265 Komponen STL siap cetak</span>
            </div>

            <div className="bg-slate-950/60 backdrop-blur rounded-2xl p-4 border border-slate-800">
              <span className="text-xs text-slate-400 font-medium">💳 Buku Kas Transaksi</span>
              <p className="text-2xl font-black text-white font-mono mt-1">
                {telemetry ? `Rp ${(telemetry.finance.netProfit / 1_000_000).toFixed(1)}M` : "474 Catatan"}
              </p>
              <span className="text-[11px] text-emerald-400">Shopee &amp; Tokopedia ledger</span>
            </div>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-2">
              Kategori:
            </span>
            {["all", "Manufacturing", "Design & CAD", "E-Commerce", "Intelligence"].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activeCategory === cat
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                    : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
                }`}
              >
                {cat === "all" ? "Semua Aplikasi" : cat}
              </button>
            ))}
          </div>

          <div className="text-xs text-slate-500 font-mono">
            Modul Terdaftar: {GOO_APPS.length} Aplikasi
          </div>
        </div>

        {/* Applications Suite Grid */}
        <div className="space-y-8" id="apps">
          {filteredApps.map((app) => (
            <AppCard key={app.id} app={app} />
          ))}
        </div>

        {/* Extensibility & Developer Banner */}
        <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-900/30 p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Arsitektur Modular
              </span>
              <span className="text-xs text-slate-400 font-mono">apps.config.ts Ready</span>
            </div>
            <h3 className="text-lg font-bold text-white">Ingin Menambahkan Aplikasi Baru ke GooOS?</h3>
            <p className="text-xs text-slate-400 max-w-xl">
              Sistem GooOS dirancang sepenuhnya modular. Cukup daftarkan nama, icon, deskripsi, dan rute menu aplikasi di berkas konfigurasi, maka aplikasi baru akan otomatis tampil sebagai kartu ekosistem di dashboard ini.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/cad"
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
            >
              Uji Coba CAD Studio &rarr;
            </Link>
            <Link
              href="/flow"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20"
            >
              Masuk ke 3DFlow Hub &rarr;
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        © 2026 GOOCANAN · GooOS Universal Platform · Unified Operations, Design &amp; Manufacturing
      </footer>
    </div>
  );
}

function AppCard({ app }: { app: GooApp }) {
  const isAvailable = app.status === "active";

  return (
    <div
      className={`rounded-3xl border border-slate-800/90 bg-slate-900/40 hover:bg-slate-900/60 transition-all overflow-hidden ${
        app.borderHover
      } shadow-xl`}
    >
      {/* App Header Bar */}
      <div className={`p-6 sm:p-8 bg-gradient-to-r ${app.gradient} border-b border-slate-800/60`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-lg shrink-0"
              style={{ backgroundColor: `${app.color}25`, borderColor: `${app.color}50` }}
            >
              {app.icon}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-2xl font-black text-white tracking-tight">{app.name}</h2>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider"
                  style={{
                    backgroundColor: `${app.color}20`,
                    color: app.color,
                    borderColor: `${app.color}40`,
                  }}
                >
                  {app.version}
                </span>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                  {app.category}
                </span>
                {app.status === "coming_soon" && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Akan Datang
                  </span>
                )}
              </div>
              <p className="text-xs font-medium text-slate-300">{app.tagline}</p>
              <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">{app.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto">
            {isAvailable ? (
              <Link
                href={app.href}
                className="px-5 py-2.5 rounded-xl font-bold text-xs text-white transition-all shadow-md flex items-center gap-2 hover:opacity-90"
                style={{ backgroundColor: app.color }}
              >
                <span>Buka {app.name}</span>
                <span>&rarr;</span>
              </Link>
            ) : (
              <span className="px-4 py-2 rounded-xl bg-slate-800/80 text-slate-400 text-xs font-medium border border-slate-700">
                Dalam Pengembangan
              </span>
            )}
          </div>
        </div>

        {/* Stats strip if present */}
        {app.stats && app.stats.length > 0 && (
          <div className="mt-5 flex items-center gap-3 flex-wrap">
            {app.stats.map((s, idx) => (
              <div
                key={idx}
                className="px-3 py-1 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs flex items-center gap-2"
              >
                <span className="text-slate-400 font-mono text-[11px]">{s.label}:</span>
                <span className="font-bold text-slate-100 font-mono text-[11px]">{s.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submenus Grid */}
      <div className="p-6 sm:p-8">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
          <span>Opsi &amp; Fitur Menu {app.name}</span>
          <span className="text-[10px] text-slate-500 font-normal">({app.menu.length} Modul)</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {app.menu.map((menuItem, idx) => (
            <Link
              key={idx}
              href={isAvailable ? menuItem.href : "#"}
              className={`group flex items-start gap-3.5 p-4 rounded-2xl border transition-all ${
                isAvailable
                  ? "bg-slate-900/60 hover:bg-slate-800/70 border-slate-800 hover:border-slate-700 hover:shadow-md cursor-pointer"
                  : "bg-slate-900/20 border-slate-800/40 opacity-60 cursor-not-allowed"
              }`}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 group-hover:scale-105 transition-transform"
                style={{ backgroundColor: `${app.color}20` }}
              >
                {menuItem.icon}
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <h5 className="text-xs font-bold text-slate-100 group-hover:text-white transition-colors">
                    {menuItem.name}
                  </h5>
                  {menuItem.badge && (
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700/60 shrink-0">
                      {menuItem.badge}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                  {menuItem.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
