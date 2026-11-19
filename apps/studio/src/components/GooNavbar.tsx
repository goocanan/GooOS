"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { GOO_APPS } from "@/config/apps.config";
import { GooLogo } from "@/components/GooLogo";
import { useDemoMode } from "@/hooks/use-demo-mode";
import { DemoNoticeBanner } from "@/components/DemoNoticeBanner";
import { signOut, signIn } from "@/lib/auth-client";
import {
  Menu,
  X,
  ChevronUp,
  ChevronDown,
  LayoutDashboard,
  Printer,
  Package,
  Layers,
  CreditCard,
  Calculator,
  FolderKanban,
  Boxes,
  Sparkles,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  LogIn,
  User as UserIcon,
  ShieldCheck,
  ArrowRight,
  Camera,
  Box,
  Sliders,
  Wrench,
  CheckCircle2,
  Lock,
} from "lucide-react";

// ============================================================================
// NAVIGATION MENU DEFINITIONS
// ============================================================================

const FLOW_SUBMENUS = [
  {
    name: "Pesanan Cetak 3D",
    href: "/orders",
    icon: "📋",
    badge: "Antrean",
    desc: "Antrean pesanan, deadline klien, & detail cetak",
  },
  {
    name: "Inventaris Filamen",
    href: "/inventory",
    icon: "🧵",
    badge: "Spool",
    desc: "Stok spul, gramasi sisa, & kemasan",
  },
  {
    name: "Armada Mesin Printer",
    href: "/printers",
    icon: "🖨️",
    badge: "Armada",
    desc: "Monitoring status Creality & Bambu Lab",
  },
  {
    name: "Katalog Produk 3D",
    href: "/products",
    icon: "📦",
    badge: "Katalog",
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
];

const STUDIO_SUBMENUS = [
  {
    name: "Proyek & Komponen STL",
    href: "/projects",
    icon: "📁",
    badge: "Proyek",
    desc: "Manajemen file desain & rincian part",
  },
  {
    name: "Smart Batching Bed",
    href: "/batching",
    icon: "🧩",
    badge: "Nesting",
    desc: "Nesting multi-part pelat cetak massal",
  },
  {
    name: "Content & Performance",
    href: "/content",
    icon: "🎬",
    badge: "Planner",
    desc: "Bank ide, kanban pipeline, metrik & scoring",
  },
  {
    name: "Kalkulator Biaya Cetak",
    href: "/calculator",
    icon: "🧮",
    badge: "Simulator",
    desc: "Simulasi biaya filamen, listrik, & margin",
  },
];

const GOOPRINT_NAV_ITEMS = [
  {
    name: "CAD Studio Hub",
    href: "/cad",
    icon: "🎨",
    badge: "CAD Hub",
    desc: "Pusat pemodelan parametrik & kalibrasi cetak",
  },
  {
    name: "Polaroid Frame Generator",
    href: "/cad/polaroid",
    icon: "🖼️",
    badge: "Populer",
    desc: "Generator Frame Foto Polaroid Mini, Square & Wide 3D",
  },
  {
    name: "Generator Parametrik Box",
    href: "/cad?tab=parametric",
    icon: "🪄",
    badge: "Box 3D",
    desc: "Generator Gridfinity & Kotak Kompartemen Custom",
  },
  {
    name: "Kalkulator Kalibrasi Slicer",
    href: "/cad?tab=calculators",
    icon: "⚙️",
    badge: "Tuning",
    desc: "Kalibrasi E-Steps, Flow Rate, & Shrinkage",
  },
  {
    name: "Library Template Presets",
    href: "/cad?tab=templates",
    icon: "📦",
    badge: "Presets",
    desc: "Koleksi part standar: Gridfinity & Baut M2-M5",
  },
];

const DASHBOARD_NAV_ITEMS = [
  {
    name: "Dashboard Universal",
    href: "/dashboard",
    icon: "📊",
    badge: "Hub",
    desc: "Pusat metrik telemetri & portal operasional",
  },
  {
    name: "GooFlow Produksi",
    href: "/orders",
    icon: "⚡",
    badge: "Farm",
    desc: "Antrean pesanan, armada printer, & inventaris",
  },
  {
    name: "GOO-Studio Desain",
    href: "/projects",
    icon: "📐",
    badge: "Design",
    desc: "Desain proyek 3D, batching bed, & kalkulator",
  },
  {
    name: "GooPrint CAD Studio",
    href: "/cad",
    icon: "🎨",
    badge: "CAD",
    desc: "Generator frame Polaroid & pemodelan parametrik",
  },
];

export function GooNavbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { isDemo, user, isOwner, isLimited, quotaInfo } = useDemoMode();

  // Navigation states
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [appsDropdownOpen, setAppsDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [isSwitchingDemo, setIsSwitchingDemo] = useState(false);

  // Close menus on route change or Escape
  useEffect(() => {
    setAppsDropdownOpen(false);
    setUserDropdownOpen(false);
    setMobileDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setAppsDropdownOpen(false);
        setUserDropdownOpen(false);
        setMobileDrawerOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Initialize sidebar collapse state from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("gooos_sidebar_collapsed");
      if (saved !== null) {
        setIsSidebarCollapsed(saved === "true");
      }
    } catch {}
  }, []);

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("gooos_sidebar_collapsed", String(next));
      } catch {}
      return next;
    });
  };

  // Synchronize CSS variable and body class for full sidebar layout
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.body.classList.add("has-goo-sidebar");
      document.body.classList.add("has-goo-mobile-nav");
      document.documentElement.style.setProperty(
        "--goo-sidebar-w",
        isSidebarCollapsed ? "4.5rem" : "16rem"
      );
      document.documentElement.style.setProperty("--goo-header-h", "0px");
    }
  }, [isSidebarCollapsed]);

  // Determine active app & module states
  const isSettings = pathname.startsWith("/settings");

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
    pathname.startsWith("/calculator") ||
    pathname.startsWith("/content");

  const isCadActive = pathname.startsWith("/cad");
  const isDashboardActive = pathname === "/dashboard" || pathname === "/";

  const currentApp = (() => {
    if (isFlowActive) return GOO_APPS.find((a) => a.id === "3dflow") || { id: "3dflow", name: "GooFlow", icon: "⚡", color: "#f43f5e", href: "/orders" };
    if (isStudioActive) return GOO_APPS.find((a) => a.id === "goo-studio") || { id: "goo-studio", name: "GOO-Studio", icon: "📐", color: "#6366f1", href: "/projects" };
    if (isCadActive) return GOO_APPS.find((a) => a.id === "gooprint") || { id: "gooprint", name: "GooPrint", icon: "🎨", color: "#06b6d4", href: "/cad" };
    return { id: "dashboard", name: "Dashboard", icon: "📊", color: "#10b981", href: "/dashboard" };
  })();

  const activeSubmenus = (() => {
    if (isFlowActive) return FLOW_SUBMENUS;
    if (isStudioActive) return STUDIO_SUBMENUS;
    if (isCadActive) return GOOPRINT_NAV_ITEMS;
    return DASHBOARD_NAV_ITEMS;
  })();

  const handleQuickDemoSwitch = async () => {
    setIsSwitchingDemo(true);
    try {
      const res = await signIn.email({
        email: "demo@goocanan.com",
        password: "demouser123",
      });
      if (res.error) {
        alert(res.error.message || "Gagal masuk ke akun demo.");
      } else {
        setUserDropdownOpen(false);
        window.location.reload();
      }
    } catch {
      alert("Gagal beralih ke akun demo.");
    } finally {
      setIsSwitchingDemo(false);
    }
  };

  return (
    <>
      {/* ========================================================= */}
      {/* 1. SLIM MOBILE TOP BAR (Only visible on screens < 768px)  */}
      {/* ========================================================= */}
      <header className="flex md:hidden fixed top-0 left-0 right-0 h-14 bg-slate-950/95 backdrop-blur-xl border-b border-slate-800/80 z-40 px-4 items-center justify-between select-none shadow-md">
        <Link href="/dashboard" className="flex items-center gap-2" title="GooOS Dashboard">
          <GooLogo layout="horizontal" iconVariant="gradient" size="sm" showStudioBadge={true} priority={true} />
        </Link>
        <button
          onClick={() => setMobileDrawerOpen(true)}
          className="p-2 rounded-xl text-slate-300 hover:text-white bg-slate-900 border border-slate-800 transition-colors"
          title="Buka Navigasi"
        >
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {/* ========================================================= */}
      {/* 2. UNIFIED DESKTOP LEFT SIDEBAR (Permanently on desktop)   */}
      {/* ========================================================= */}
      <aside
        className={`hidden md:flex fixed top-0 bottom-0 left-0 z-40 bg-slate-950/98 backdrop-blur-2xl border-r border-slate-800/80 flex-col justify-between transition-all duration-200 select-none shadow-xl shadow-black/40 ${
          isSidebarCollapsed ? "w-[4.5rem]" : "w-64"
        }`}
      >
        {/* ───────────────────────────────────────────────────────── */}
        {/* TOP SECTION: BRAND LOGO & SINGLE COLLAPSE BUTTON         */}
        {/* ───────────────────────────────────────────────────────── */}
        <div className="h-16 px-3 flex items-center border-b border-slate-800/80 shrink-0">
          {!isSidebarCollapsed ? (
            <div className="w-full flex items-center justify-between gap-2">
              {/* Logo GooOS (Klik menuju ke dashboard) */}
              <Link
                href="/dashboard"
                className="flex items-center gap-2 group transition-transform hover:scale-[1.02] min-w-0 flex-1"
                title="Menuju ke Dashboard GooOS"
              >
                <GooLogo layout="horizontal" iconVariant="gradient" size="md" showStudioBadge={true} priority={true} />
              </Link>

              {/* Satu-satunya tombol persempit di bagian atas */}
              <button
                type="button"
                onClick={toggleSidebarCollapse}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 border border-transparent hover:border-slate-700 transition shrink-0 cursor-pointer"
                title="Persempit Navigasi"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center justify-center gap-1.5 py-1">
              {/* Logo GooOS tanpa teks saat dipersempit */}
              <Link
                href="/dashboard"
                className="group transition-transform hover:scale-110 flex items-center justify-center"
                title="Menuju ke Dashboard GooOS"
              >
                <GooLogo layout="symbol" iconVariant="gradient" size="md" priority={true} />
              </Link>

              {/* Tombol perlebar di bawah logo */}
              <button
                type="button"
                onClick={toggleSidebarCollapse}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition cursor-pointer"
                title="Perlebar Navigasi"
              >
                <PanelLeftOpen className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* ───────────────────────────────────────────────────────── */}
        {/* MIDDLE SECTION: SCROLLABLE SUBMENUS & NAVIGATION LINKS    */}
        {/* ───────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-1 scrollbar-none">
          {/* Active Module Header */}
          {!isSidebarCollapsed ? (
            <div className="px-2.5 py-1 mb-1 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <span className="truncate">{currentApp.name}</span>
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: currentApp.color }} />
            </div>
          ) : (
            <div className="w-full border-b border-slate-800/60 pb-1 mb-1 flex justify-center">
              <span className="text-xs">{currentApp.icon}</span>
            </div>
          )}

          {/* Submenu Item Links */}
          {activeSubmenus.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href.includes("?") && pathname === item.href.split("?")[0]);

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all group ${
                  isActive
                    ? isFlowActive
                      ? "bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30 shadow-md shadow-rose-500/10"
                      : isStudioActive
                      ? "bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30 shadow-md shadow-indigo-500/10"
                      : isCadActive
                      ? "bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30 shadow-md shadow-cyan-500/10"
                      : "bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 shadow-md shadow-emerald-500/10"
                    : "text-slate-400 hover:text-white hover:bg-slate-900/80 border border-transparent"
                } ${isSidebarCollapsed ? "justify-center px-2 py-2.5" : ""}`}
                title={item.name}
              >
                <span className="text-base shrink-0 group-hover:scale-110 transition-transform">
                  {item.icon}
                </span>

                {!isSidebarCollapsed && (
                  <div className="flex-1 min-w-0 flex items-center justify-between gap-1">
                    <span className="truncate">{item.name}</span>
                    {item.badge && (
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800/80 text-slate-400 shrink-0">
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </Link>
            );
          })}
        </div>

        {/* ───────────────────────────────────────────────────────── */}
        {/* BOTTOM SECTION: APP SWITCHER, SETTINGS, & USER ACCOUNT    */}
        {/* ───────────────────────────────────────────────────────── */}
        <div className="p-2.5 border-t border-slate-800/80 space-y-1.5 shrink-0 bg-slate-950/70">
          {/* 1. OPSI PILIHAN APLIKASI (Tepat di atas Setting GooOS) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setAppsDropdownOpen(!appsDropdownOpen);
                setUserDropdownOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${
                appsDropdownOpen
                  ? "bg-slate-800 border-slate-700 text-white"
                  : "bg-slate-900/80 hover:bg-slate-800 border-slate-800/90 text-slate-300 hover:text-white"
              } ${isSidebarCollapsed ? "justify-center px-2" : "justify-between"}`}
              title="Ganti Aplikasi GooOS"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-base shrink-0">{currentApp.icon}</span>
                {!isSidebarCollapsed && (
                  <span className="truncate font-bold text-slate-100">{currentApp.name}</span>
                )}
              </div>
              {!isSidebarCollapsed && (
                <ChevronUp className={`w-3.5 h-3.5 text-slate-400 transition-transform ${appsDropdownOpen ? "rotate-180" : ""}`} />
              )}
            </button>

            {/* Popup Pilihan Aplikasi (Membuka ke atas) */}
            {appsDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setAppsDropdownOpen(false)} />
                <div className="absolute left-0 bottom-full mb-2 w-64 rounded-2xl bg-slate-900/98 backdrop-blur-2xl border border-slate-800 shadow-2xl p-2 z-50 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800/80 flex items-center justify-between">
                    <span>Pilih Aplikasi GooOS</span>
                    <span className="text-[9px] font-mono text-slate-500">Suite</span>
                  </div>

                  {/* Dashboard Tab */}
                  <Link
                    href="/dashboard"
                    onClick={() => setAppsDropdownOpen(false)}
                    className={`flex items-center gap-2.5 p-2 rounded-xl text-xs transition-all ${
                      isDashboardActive
                        ? "bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30"
                        : "hover:bg-slate-800 text-slate-300"
                    }`}
                  >
                    <span className="text-base">📊</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-white">Dashboard</div>
                      <div className="text-[10px] text-slate-400 truncate">Pusat kendali universal</div>
                    </div>
                  </Link>

                  {/* GooFlow */}
                  <Link
                    href="/orders"
                    onClick={() => setAppsDropdownOpen(false)}
                    className={`flex items-center gap-2.5 p-2 rounded-xl text-xs transition-all ${
                      isFlowActive
                        ? "bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30"
                        : "hover:bg-slate-800 text-slate-300"
                    }`}
                  >
                    <span className="text-base">⚡</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-white">GooFlow</div>
                      <div className="text-[10px] text-slate-400 truncate">Pesanan, mesin, & inventaris</div>
                    </div>
                  </Link>

                  {/* GOO-Studio */}
                  <Link
                    href="/projects"
                    onClick={() => setAppsDropdownOpen(false)}
                    className={`flex items-center gap-2.5 p-2 rounded-xl text-xs transition-all ${
                      isStudioActive
                        ? "bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30"
                        : "hover:bg-slate-800 text-slate-300"
                    }`}
                  >
                    <span className="text-base">📐</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-white">GOO-Studio</div>
                      <div className="text-[10px] text-slate-400 truncate">Proyek STL & batching bed</div>
                    </div>
                  </Link>

                  {/* GooPrint */}
                  <Link
                    href="/cad"
                    onClick={() => setAppsDropdownOpen(false)}
                    className={`flex items-center gap-2.5 p-2 rounded-xl text-xs transition-all ${
                      isCadActive
                        ? "bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30"
                        : "hover:bg-slate-800 text-slate-300"
                    }`}
                  >
                    <span className="text-base">🎨</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-white">GooPrint</div>
                      <div className="text-[10px] text-slate-400 truncate">CAD studio & polaroid generator</div>
                    </div>
                  </Link>
                </div>
              </>
            )}
          </div>

          {/* 2. SETTING GOOOS (Tepat di bawah Pilihan Aplikasi) */}
          <Link
            href="/settings"
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${
              isSettings
                ? "bg-slate-800 text-white border-slate-700 shadow-sm"
                : "bg-transparent hover:bg-slate-900 border-transparent text-slate-400 hover:text-slate-200"
            } ${isSidebarCollapsed ? "justify-center px-2" : ""}`}
            title="Pengaturan GooOS"
          >
            <Settings className="w-4 h-4 text-slate-400 group-hover:text-white shrink-0" />
            {!isSidebarCollapsed && <span>Pengaturan GooOS</span>}
          </Link>

          {/* 3. MENU AKUN (Dipojok kiri bawah) */}
          <div className="relative pt-1 border-t border-slate-800/80">
            {user ? (
              <button
                type="button"
                onClick={() => {
                  setUserDropdownOpen(!userDropdownOpen);
                  setAppsDropdownOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 p-1.5 rounded-xl transition-all cursor-pointer ${
                  userDropdownOpen ? "bg-slate-800/90" : "hover:bg-slate-900"
                } ${isSidebarCollapsed ? "justify-center" : "justify-between"}`}
                title="Akun Pengguna"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-rose-500 via-indigo-500 to-cyan-400 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm">
                    {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                  </div>
                  {!isSidebarCollapsed && (
                    <div className="text-left min-w-0">
                      <div className="text-xs font-bold text-white truncate leading-tight">
                        {user.name || "Pengguna"}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate font-mono">
                        {isOwner ? "👑 Owner" : isDemo ? "🧪 Demo" : "Member"}
                      </div>
                    </div>
                  )}
                </div>
                {!isSidebarCollapsed && (
                  <ChevronUp className={`w-3.5 h-3.5 text-slate-400 transition-transform ${userDropdownOpen ? "rotate-180" : ""}`} />
                )}
              </button>
            ) : (
              <Link
                href="/auth/login"
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 shadow-md transition ${
                  isSidebarCollapsed ? "justify-center px-2" : "justify-center"
                }`}
                title="Masuk ke Akun"
              >
                <LogIn className="w-4 h-4 shrink-0" />
                {!isSidebarCollapsed && <span>Masuk Akun</span>}
              </Link>
            )}

            {/* Popup Menu Akun (Membuka ke atas) */}
            {userDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setUserDropdownOpen(false)} />
                <div className="absolute left-0 bottom-full mb-2 w-64 rounded-2xl bg-slate-900/98 backdrop-blur-2xl border border-slate-800 shadow-2xl p-3 z-50 space-y-2 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-500 via-indigo-500 to-cyan-400 text-white font-bold text-xs flex items-center justify-center shrink-0">
                      {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">{user?.name}</div>
                      <div className="text-[10px] text-slate-400 truncate">{user?.email}</div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Link
                      href="/settings"
                      onClick={() => setUserDropdownOpen(false)}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition"
                    >
                      <Settings className="w-3.5 h-3.5 text-slate-400" />
                      <span>Pengaturan Profil</span>
                    </Link>

                    <button
                      onClick={async () => {
                        setUserDropdownOpen(false);
                        try {
                          await signOut();
                        } catch {}
                        router.push("/auth/login");
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-bold text-rose-300 hover:text-rose-200 hover:bg-rose-500/15 transition cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5 text-rose-400" />
                      <span>Keluar (Sign Out)</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* 3. MOBILE RESPONSIVE DRAWER (< 768px)                     */}
      {/* ========================================================= */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden animate-in fade-in duration-200">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setMobileDrawerOpen(false)} />
          <div className="fixed top-0 bottom-0 left-0 w-72 bg-slate-950 border-r border-slate-800 p-4 flex flex-col justify-between z-50 animate-in slide-in-from-left duration-200">
            {/* Header Drawer */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <Link
                  href="/dashboard"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="flex items-center gap-2"
                >
                  <GooLogo layout="horizontal" iconVariant="gradient" size="sm" showStudioBadge={true} priority={true} />
                </Link>
                <button
                  onClick={() => setMobileDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* App Switcher Strip in Drawer */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-1">
                  Aplikasi Utama
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { name: "Dashboard", href: "/dashboard", icon: "📊", active: isDashboardActive },
                    { name: "GooFlow", href: "/orders", icon: "⚡", active: isFlowActive },
                    { name: "GOO-Studio", href: "/projects", icon: "📐", active: isStudioActive },
                    { name: "GooPrint", href: "/cad", icon: "🎨", active: isCadActive },
                  ].map((app) => (
                    <Link
                      key={app.name}
                      href={app.href}
                      onClick={() => setMobileDrawerOpen(false)}
                      className={`flex items-center gap-2 p-2 rounded-xl text-xs font-semibold border transition ${
                        app.active
                          ? "bg-slate-800 border-slate-700 text-white"
                          : "bg-slate-900/60 border-slate-800/80 text-slate-400 hover:text-white"
                      }`}
                    >
                      <span>{app.icon}</span>
                      <span>{app.name}</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Submenus in Drawer */}
              <div className="space-y-1 pt-2 border-t border-slate-900 max-h-[45vh] overflow-y-auto scrollbar-none">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-1">
                  Menu {currentApp.name}
                </span>
                {activeSubmenus.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileDrawerOpen(false)}
                    className="flex items-center justify-between p-2 rounded-xl text-xs text-slate-300 hover:bg-slate-900 transition"
                  >
                    <div className="flex items-center gap-2">
                      <span>{item.icon}</span>
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </div>

            {/* Bottom Section in Drawer */}
            <div className="pt-3 border-t border-slate-800/80 space-y-2">
              <Link
                href="/settings"
                onClick={() => setMobileDrawerOpen(false)}
                className="w-full flex items-center gap-2 p-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-900"
              >
                <Settings className="w-4 h-4 text-slate-400" />
                <span>Pengaturan GooOS</span>
              </Link>

              {user ? (
                <button
                  onClick={async () => {
                    setMobileDrawerOpen(false);
                    try {
                      await signOut();
                    } catch {}
                    router.push("/auth/login");
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-xl text-xs font-bold text-rose-300 bg-rose-500/10 border border-rose-500/20"
                >
                  <span>Keluar dari Akun</span>
                  <LogOut className="w-4 h-4 text-rose-400" />
                </button>
              ) : (
                <Link
                  href="/auth/login"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-rose-600 to-indigo-600 shadow-md"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Masuk Akun</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
