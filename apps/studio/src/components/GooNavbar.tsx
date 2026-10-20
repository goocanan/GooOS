"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { GOO_APPS } from "@/config/apps.config";
import {
  Menu,
  X,
  ChevronDown,
  LayoutDashboard,
  Printer,
  Package,
  Layers,
  CreditCard,
  Calculator,
  FileCode,
  FolderKanban,
  Boxes,
  Activity,
  Sparkles,
  Settings,
} from "lucide-react";

const FLOW_SUBMENUS = [
  {
    name: "Pesanan Cetak 3D",
    href: "/orders",
    icon: "📋",
    badge: "69 Orders",
    desc: "Antrean pesanan, deadline klien, & detail cetak",
  },
  {
    name: "Inventaris Filamen & Aset",
    href: "/inventory",
    icon: "🧵",
    badge: "128 Spool",
    desc: "Stok spul, gramasi sisa, & kemasan",
  },
  {
    name: "Armada Mesin Printer",
    href: "/printers",
    icon: "🖨️",
    badge: "3 Mesin",
    desc: "Monitoring status Creality & Bambu Lab",
  },
  {
    name: "Katalog Produk 3D",
    href: "/products",
    icon: "📦",
    badge: "40 Models",
    desc: "Daftar model siap cetak, COGS, & harga",
  },
  {
    name: "Buku Kas & Transaksi",
    href: "/transactions",
    icon: "💳",
    badge: "Ledger",
    desc: "Catatan arus kas pemasukan & pengeluaran",
  },
  {
    name: "Flow Hub Telemetri",
    href: "/flow",
    icon: "⚡",
    badge: "Live KPI",
    desc: "Ringkasan performa farm produksi",
  },
  {
    name: "Pengaturan 3DFlow",
    href: "/settings?tab=3dflow",
    icon: "⚙️",
    badge: "Config",
    desc: "Tarif listrik, daya printer, upah, & retail rate",
  },
];

const STUDIO_SUBMENUS = [
  {
    name: "Proyek & Komponen STL",
    href: "/projects",
    icon: "📁",
    badge: "265 Parts",
    desc: "Manajemen file desain & rincian part",
  },
  {
    name: "Smart Batching Bed",
    href: "/batching",
    icon: "🧩",
    badge: "7 Plates",
    desc: "Nesting multi-part pelat cetak massal",
  },
  {
    name: "Kalkulator Biaya Cetak",
    href: "/calculator",
    icon: "🧮",
    badge: "Simulator",
    desc: "Simulasi biaya filamen, listrik, & margin",
  },
  {
    name: "Pengaturan GOO-Studio",
    href: "/settings?tab=goo-studio",
    icon: "⚙️",
    badge: "Config",
    desc: "Parameter biaya operator, margin, & batching",
  },
];

const GOOPRINT_NAV_ITEMS = [
  {
    name: "3D CAD Studio",
    href: "/cad?tab=studio",
    icon: "💻",
    badge: "WebCAD",
    desc: "Ruang kerja pemodelan parametrik 3D real-time dengan editor visual",
  },
  {
    name: "Generator Perkakas",
    href: "/cad?tab=generators",
    icon: "🪄",
    badge: "AutoCAD",
    desc: "Generator Gridfinity, Foto-ke-Figurin, Peta Topografi, & Enclosure",
  },
  {
    name: "Kalkulator Kalibrasi & Slicer",
    href: "/cad?tab=calculators",
    icon: "⚙️",
    badge: "Kalibrasi",
    desc: "Kalibrasi E-Steps, Flow Rate, HPP cetak, & Margin Penjual",
  },
  {
    name: "Library Template Siap Cetak",
    href: "/cad?tab=templates",
    icon: "📦",
    badge: "Presets",
    desc: "Koleksi part siap pakai: Bin, Dudukan Kamera, Hanger Meja, Box",
  },
  {
    name: "Pengaturan GooPrint",
    href: "/settings?tab=gooprint",
    icon: "⚙️",
    badge: "Config",
    desc: "Konfigurasi grid CAD, toleransi default, kerapatan mesh, & slicer",
  },
];

export function GooNavbar() {
  const pathname = usePathname();
  const [appsOpen, setAppsOpen] = useState(false);
  const [flowOpen, setFlowOpen] = useState(false);
  const [studioOpen, setStudioOpen] = useState(false);
  const [cadOpen, setCadOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Close all menus on route change
  useEffect(() => {
    setAppsOpen(false);
    setFlowOpen(false);
    setStudioOpen(false);
    setCadOpen(false);
    setMobileDrawerOpen(false);
  }, [pathname]);

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setAppsOpen(false);
        setFlowOpen(false);
        setStudioOpen(false);
        setCadOpen(false);
        setMobileDrawerOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Determine active states
  const isFlowActive =
    pathname.startsWith("/flow") ||
    pathname.startsWith("/inventory") ||
    pathname.startsWith("/products") ||
    pathname.startsWith("/transactions") ||
    pathname.startsWith("/printers") ||
    pathname.startsWith("/orders");

  const isStudioActive =
    pathname.startsWith("/projects") ||
    pathname.startsWith("/batching") ||
    pathname.startsWith("/calculator");

  const isCadActive = pathname.startsWith("/cad");
  const isDashboardActive = pathname === "/dashboard" || pathname === "/";
  const isSettingsActive = pathname.startsWith("/settings");

  const currentApp = (() => {
    if (isFlowActive) return GOO_APPS.find((a) => a.id === "3dflow");
    if (isStudioActive) return GOO_APPS.find((a) => a.id === "goo-studio");
    if (isCadActive) return GOO_APPS.find((a) => a.id === "gooprint");
    return null;
  })();

  return (
    <>
      <header className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/90 text-white select-none">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
          
          {/* ========================================================= */}
          {/* LEFT: BRAND & APP HUB SWITCHER                            */}
          {/* ========================================================= */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-2 group">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-rose-500 via-indigo-600 to-cyan-400 p-0.5 shadow-md shadow-rose-500/10 group-hover:scale-105 transition-transform">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center font-black text-transparent bg-clip-text bg-gradient-to-tr from-rose-400 to-cyan-300 text-sm sm:text-base">
                  G
                </div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  <span className="font-extrabold tracking-tight text-white text-sm sm:text-base">
                    GooOS
                  </span>
                  <span className="hidden xl:inline text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-500/15 text-rose-300 border border-rose-500/20 uppercase tracking-widest">
                    Studio
                  </span>
                </div>
                <span className="hidden xl:inline text-[9px] text-slate-400 font-mono -mt-0.5">
                  Platform
                </span>
              </div>
            </Link>

            {/* App Hub Dropdown Trigger */}
            <div className="relative">
              <button
                onClick={() => {
                  setAppsOpen(!appsOpen);
                  setFlowOpen(false);
                  setStudioOpen(false);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-xs text-slate-200 transition-colors shadow-sm"
                title="Pilih Aplikasi GooOS"
              >
                <span className="text-xs sm:text-sm">{currentApp ? currentApp.icon : "⚡"}</span>
                <span className="font-semibold text-slate-100 max-w-[85px] sm:max-w-[120px] truncate text-[11px] sm:text-xs">
                  {currentApp ? currentApp.name : "App Hub"}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
              </button>

              {/* App Hub Menu Popup */}
              {appsOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setAppsOpen(false)} />
                  <div className="absolute left-0 mt-2 w-72 sm:w-80 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                      GooOS Application Suite
                    </div>
                    {GOO_APPS.map((app) => (
                      <Link
                        key={app.id}
                        href={app.href}
                        onClick={() => setAppsOpen(false)}
                        className={`flex items-start gap-3 p-2.5 rounded-xl transition-all ${
                          currentApp?.id === app.id
                            ? "bg-slate-800 border border-slate-700"
                            : "hover:bg-slate-800/60"
                        }`}
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0 mt-0.5"
                          style={{ backgroundColor: `${app.color}25` }}
                        >
                          {app.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-100">{app.name}</span>
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                              {app.version}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 line-clamp-1">{app.tagline}</p>
                        </div>
                      </Link>
                    ))}
                    <div className="pt-2 border-t border-slate-800">
                      <Link
                        href="/dashboard"
                        onClick={() => setAppsOpen(false)}
                        className="block text-center py-2 text-xs font-semibold text-rose-400 hover:text-rose-300 rounded-lg hover:bg-rose-500/10 transition-colors"
                      >
                        Buka Dashboard Universal &rarr;
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ========================================================= */}
          {/* CENTER: DESKTOP & NARROW DESKTOP SMART NAVIGATION         */}
          {/* Fits comfortably on screens >= 768px (md:)                */}
          {/* ========================================================= */}
          <nav className="hidden md:flex items-center gap-1 sm:gap-1.5 text-xs font-medium text-slate-400">
            {/* 1. Dashboard Link */}
            <Link
              href="/dashboard"
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                isDashboardActive
                  ? "bg-slate-900 text-white font-bold border border-slate-800"
                  : "hover:text-slate-100 hover:bg-slate-900/60"
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </Link>

            {/* 2. 3DFlow Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setFlowOpen(!flowOpen);
                  setStudioOpen(false);
                  setAppsOpen(false);
                }}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                  isFlowActive
                    ? "bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30"
                    : "hover:text-slate-100 hover:bg-slate-900/60"
                }`}
              >
                <span>⚡ 3DFlow</span>
                <ChevronDown
                  className={`w-3 h-3 transition-transform ${flowOpen ? "rotate-180" : ""}`}
                />
              </button>

              {flowOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setFlowOpen(false)} />
                  <div className="absolute left-0 mt-2 w-72 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-1.5 text-[10px] font-bold text-rose-400 uppercase tracking-wider border-b border-slate-800 flex items-center justify-between">
                      <span>Menu 3DFlow Produksi</span>
                      <span className="text-[9px] font-mono text-slate-500">Additive Farm</span>
                    </div>
                    {FLOW_SUBMENUS.map((menu) => (
                      <Link
                        key={menu.href}
                        href={menu.href}
                        onClick={() => setFlowOpen(false)}
                        className={`flex items-start gap-2.5 p-2 rounded-xl transition-all ${
                          pathname === menu.href
                            ? "bg-rose-500/15 border border-rose-500/30 text-rose-200"
                            : "hover:bg-slate-800/70 text-slate-300"
                        }`}
                      >
                        <span className="text-base shrink-0 mt-0.5">{menu.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-white">{menu.name}</span>
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-950 border border-slate-800 text-slate-400">
                              {menu.badge}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 line-clamp-1">{menu.desc}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* 3. GOO-Studio Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setStudioOpen(!studioOpen);
                  setFlowOpen(false);
                  setAppsOpen(false);
                }}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                  isStudioActive
                    ? "bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30"
                    : "hover:text-slate-100 hover:bg-slate-900/60"
                }`}
              >
                <span>📐 GOO-Studio</span>
                <ChevronDown
                  className={`w-3 h-3 transition-transform ${studioOpen ? "rotate-180" : ""}`}
                />
              </button>

              {studioOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setStudioOpen(false)} />
                  <div className="absolute left-0 mt-2 w-72 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-1.5 text-[10px] font-bold text-indigo-400 uppercase tracking-wider border-b border-slate-800 flex items-center justify-between">
                      <span>Menu GOO-Studio Desain</span>
                      <span className="text-[9px] font-mono text-slate-500">CAD & Batching</span>
                    </div>
                    {STUDIO_SUBMENUS.map((menu) => (
                      <Link
                        key={menu.href}
                        href={menu.href}
                        onClick={() => setStudioOpen(false)}
                        className={`flex items-start gap-2.5 p-2 rounded-xl transition-all ${
                          pathname === menu.href
                            ? "bg-indigo-500/15 border border-indigo-500/30 text-indigo-200"
                            : "hover:bg-slate-800/70 text-slate-300"
                        }`}
                      >
                        <span className="text-base shrink-0 mt-0.5">{menu.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-white">{menu.name}</span>
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-950 border border-slate-800 text-slate-400">
                              {menu.badge}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 line-clamp-1">{menu.desc}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* 4. GooPrint Menu with Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setCadOpen(!cadOpen);
                  setFlowOpen(false);
                  setStudioOpen(false);
                  setAppsOpen(false);
                }}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                  isCadActive
                    ? "bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30"
                    : "hover:text-slate-100 hover:bg-slate-900/60"
                }`}
              >
                <span>🎨 GooPrint</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {cadOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setCadOpen(false)}
                  />
                  <div className="absolute left-0 mt-2 w-80 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-slate-800 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 space-y-1">
                    <div className="px-3 py-1.5 text-[10px] font-bold text-cyan-400 uppercase tracking-wider border-b border-slate-800/80 mb-1 flex items-center justify-between">
                      <span>Menu &amp; Modul GooPrint</span>
                      <span className="font-mono text-slate-500">v1.2</span>
                    </div>

                    {GOOPRINT_NAV_ITEMS.map((menu) => (
                      <Link
                        key={menu.name}
                        href={menu.href}
                        onClick={() => setCadOpen(false)}
                        className={`flex items-start gap-3 p-2.5 rounded-xl transition-all ${
                          pathname === menu.href.split("?")[0] && (!menu.href.includes("tab=") || pathname === menu.href)
                            ? "bg-cyan-500/15 border border-cyan-500/30 text-cyan-200"
                            : "hover:bg-slate-800/70 text-slate-300"
                        }`}
                      >
                        <span className="text-base shrink-0 mt-0.5">{menu.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-white">{menu.name}</span>
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-950 border border-slate-800 text-slate-400">
                              {menu.badge}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 line-clamp-1">{menu.desc}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>
          </nav>

          {/* ========================================================= */}
          {/* RIGHT: TELEMETRY BADGE, PROFILE & MOBILE HAMBURGER        */}
          {/* ========================================================= */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Live Farm Telemetry Pill (Desktop Full) */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>3 Printers Live</span>
            </div>

            {/* Compact Telemetry Pill (Medium screens) */}
            <div
              className="hidden md:flex lg:hidden items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono"
              title="3 Mesin Printer Aktif"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>3 Mesin</span>
            </div>

            {/* Settings Quick Link */}
            <Link
              href="/settings"
              className={`p-2 rounded-xl border transition-all ${
                isSettingsActive
                  ? "bg-rose-500/20 text-rose-300 border-rose-500/30 shadow-md shadow-rose-500/10"
                  : "bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border-slate-800"
              }`}
              title="Pengaturan Terpadu Studio & Aplikasi (GooOS)"
            >
              <Settings className="w-4 h-4" />
            </Link>

            {/* Operator Avatar */}
            <Link
              href="/dashboard"
              className="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-sm hover:ring-2 hover:ring-rose-400 transition-all shrink-0"
              title="GooOS Operator"
            >
              GO
            </Link>

            {/* Mobile Hamburger Button (< 768px) */}
            <button
              onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
              className="md:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors"
              aria-label="Toggle Mobile Navigation"
            >
              {mobileDrawerOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================= */}
      {/* MOBILE DRAWER / SLIDE-OVER SHEET (< 768px)                */}
      {/* ========================================================= */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setMobileDrawerOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative z-50 w-full max-w-sm ml-auto h-full bg-slate-950 border-l border-slate-800 shadow-2xl flex flex-col p-5 overflow-y-auto space-y-5 animate-in slide-in-from-right duration-250">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-rose-500 to-indigo-600 p-0.5">
                  <div className="w-full h-full bg-slate-950 rounded-[6px] flex items-center justify-center font-black text-rose-400 text-xs">
                    G
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Menu Navigasi GooOS</h3>
                  <p className="text-[10px] text-slate-400 font-mono">Platform Terpadu Studio</p>
                </div>
              </div>
              <button
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Links Grid */}
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/dashboard"
                onClick={() => setMobileDrawerOpen(false)}
                className={`flex items-center gap-2.5 p-3 rounded-xl font-bold text-xs border ${
                  isDashboardActive
                    ? "bg-slate-900 text-white border-slate-700"
                    : "bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-900"
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Dashboard</span>
              </Link>
              <Link
                href="/settings"
                onClick={() => setMobileDrawerOpen(false)}
                className={`flex items-center gap-2.5 p-3 rounded-xl font-bold text-xs border ${
                  isSettingsActive
                    ? "bg-purple-500/20 text-purple-200 border-purple-500/40"
                    : "bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-900"
                }`}
              >
                <Settings className="w-4 h-4 text-purple-400 shrink-0" />
                <span>Pengaturan</span>
              </Link>
            </div>

            {/* Section 1: 3DFlow */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-rose-400 uppercase tracking-wider px-1">
                <span>⚡ 3DFlow (Produksi Cetak)</span>
                <span className="text-[9px] font-mono text-slate-500">6 Modul</span>
              </div>
              <div className="grid grid-cols-1 gap-1">
                {FLOW_SUBMENUS.map((menu) => (
                  <Link
                    key={menu.href}
                    href={menu.href}
                    onClick={() => setMobileDrawerOpen(false)}
                    className={`flex items-center justify-between p-2.5 rounded-xl text-xs transition-all ${
                      pathname === menu.href
                        ? "bg-rose-500/15 border border-rose-500/30 text-rose-200 font-bold"
                        : "hover:bg-slate-900 text-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">{menu.icon}</span>
                      <span>{menu.name}</span>
                    </div>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                      {menu.badge}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Section 2: GOO-Studio */}
            <div className="space-y-1.5 pt-2 border-t border-slate-900">
              <div className="flex items-center justify-between text-[11px] font-bold text-indigo-400 uppercase tracking-wider px-1">
                <span>📐 GOO-Studio (Desain & Batch)</span>
                <span className="text-[9px] font-mono text-slate-500">3 Modul</span>
              </div>
              <div className="grid grid-cols-1 gap-1">
                {STUDIO_SUBMENUS.map((menu) => (
                  <Link
                    key={menu.href}
                    href={menu.href}
                    onClick={() => setMobileDrawerOpen(false)}
                    className={`flex items-center justify-between p-2.5 rounded-xl text-xs transition-all ${
                      pathname === menu.href
                        ? "bg-indigo-500/15 border border-indigo-500/30 text-indigo-200 font-bold"
                        : "hover:bg-slate-900 text-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">{menu.icon}</span>
                      <span>{menu.name}</span>
                    </div>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                      {menu.badge}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Section 3: GooPrint */}
            <div className="space-y-1.5 pt-2 border-t border-slate-900">
              <div className="flex items-center justify-between text-[11px] font-bold text-cyan-400 uppercase tracking-wider px-1">
                <span>🎨 GooPrint (CAD &amp; Tools)</span>
                <span className="text-[9px] font-mono text-slate-500">{GOOPRINT_NAV_ITEMS.length} Modul</span>
              </div>
              <div className="grid grid-cols-1 gap-1">
                {GOOPRINT_NAV_ITEMS.map((menu) => (
                  <Link
                    key={menu.name}
                    href={menu.href}
                    onClick={() => setMobileDrawerOpen(false)}
                    className="flex items-center justify-between p-2.5 rounded-xl text-xs hover:bg-slate-900 text-slate-300 transition-all"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">{menu.icon}</span>
                      <span>{menu.name}</span>
                    </div>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                      {menu.badge}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Drawer Footer Telemetry Status */}
            <div className="mt-auto pt-4 border-t border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs font-mono text-slate-400">
                <span className="flex items-center gap-2 text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Farm Live
                </span>
                <span>3 Mesin Online</span>
              </div>
              <p className="text-[10px] text-center text-slate-600">
                GooOS v2.4 • Production Cloud Suite
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MOBILE BOTTOM NAVIGATION BAR (< 768px / md:hidden)        */}
      {/* Persistent floating thumb bar for mobile devices          */}
      {/* ========================================================= */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/90 shadow-2xl px-2 py-1.5 safe-area-pb">
        <div className="grid grid-cols-5 gap-1 max-w-md mx-auto items-center">
          {/* 1. Dashboard */}
          <Link
            href="/dashboard"
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all ${
              isDashboardActive
                ? "text-rose-400 font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <LayoutDashboard className="w-4 h-4 mb-0.5" />
            <span className="text-[10px] font-medium leading-none">Home</span>
            {isDashboardActive && (
              <span className="w-1 h-1 rounded-full bg-rose-400 mt-1 shadow-[0_0_6px_#f43f5e]" />
            )}
          </Link>

          {/* 2. Pesanan (Orders) */}
          <Link
            href="/orders"
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all ${
              pathname === "/orders"
                ? "text-rose-400 font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span className="text-sm leading-none mb-0.5">📋</span>
            <span className="text-[10px] font-medium leading-none">Pesanan</span>
            {pathname === "/orders" && (
              <span className="w-1 h-1 rounded-full bg-rose-400 mt-1 shadow-[0_0_6px_#f43f5e]" />
            )}
          </Link>

          {/* 3. Inventaris (Stok) */}
          <Link
            href="/inventory"
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all ${
              pathname === "/inventory"
                ? "text-rose-400 font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span className="text-sm leading-none mb-0.5">🧵</span>
            <span className="text-[10px] font-medium leading-none">Inventaris</span>
            {pathname === "/inventory" && (
              <span className="w-1 h-1 rounded-full bg-rose-400 mt-1 shadow-[0_0_6px_#f43f5e]" />
            )}
          </Link>

          {/* 4. Batching Bed */}
          <Link
            href="/batching"
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all ${
              pathname === "/batching" || pathname === "/projects"
                ? "text-indigo-400 font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span className="text-sm leading-none mb-0.5">🧩</span>
            <span className="text-[10px] font-medium leading-none">Batching</span>
            {(pathname === "/batching" || pathname === "/projects") && (
              <span className="w-1 h-1 rounded-full bg-indigo-400 mt-1 shadow-[0_0_6px_#6366f1]" />
            )}
          </Link>

          {/* 5. Menu Drawer Toggle */}
          <button
            onClick={() => setMobileDrawerOpen(true)}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all ${
              mobileDrawerOpen
                ? "text-rose-400 font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Menu className="w-4 h-4 mb-0.5" />
            <span className="text-[10px] font-medium leading-none">Menu</span>
            {mobileDrawerOpen && (
              <span className="w-1 h-1 rounded-full bg-rose-400 mt-1 shadow-[0_0_6px_#f43f5e]" />
            )}
          </button>
        </div>
      </nav>

      {/* Spacing for mobile bottom navigation bar so no content gets covered */}
      <div className="h-14 md:hidden pointer-events-none" aria-hidden="true" />
    </>
  );
}
