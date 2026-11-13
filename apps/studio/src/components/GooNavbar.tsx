"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { GOO_APPS } from "@/config/apps.config";
import { GooLogo, GooAppIcon } from "@/components/GooLogo";
import { useDemoMode } from "@/hooks/use-demo-mode";
import { DemoNoticeBanner } from "@/components/DemoNoticeBanner";
import { signOut, signIn } from "@/lib/auth-client";
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
  PanelLeftClose,
  PanelLeftOpen,
  Lock,
  LogOut,
  LogIn,
  User as UserIcon,
  ShieldCheck,
  ArrowRight,
  Key,
  Smartphone,
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
    name: "Pengaturan GooFlow",
    href: "/settings?tab=gooflow",
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
    name: "Polaroid Frame Generator",
    href: "/cad",
    icon: "🖼️",
    badge: "Populer",
    desc: "Generator Frame Foto Polaroid Mini, Square & Wide dengan Kustomisasi Teks, Ikon, Stand & STL Export",
  },
  {
    name: "Library Generator Parametrik",
    href: "/cad",
    icon: "🪄",
    badge: "CAD Studio",
    desc: "Generator Gridfinity, Foto-ke-Figurin, Topografi Kontur, & Enclosure Elektronik",
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
  const router = useRouter();
  const pathname = usePathname();
  const { isDemo, user, isOwner, isLimited, quotaInfo } = useDemoMode();
  const [appsOpen, setAppsOpen] = useState(false);
  const [flowOpen, setFlowOpen] = useState(false);
  const [studioOpen, setStudioOpen] = useState(false);
  const [cadOpen, setCadOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [isSwitchingDemo, setIsSwitchingDemo] = useState(false);

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

  // Close all menus on route change
  useEffect(() => {
    setAppsOpen(false);
    setFlowOpen(false);
    setStudioOpen(false);
    setCadOpen(false);
    setMobileDrawerOpen(false);
    setUserDropdownOpen(false);
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
        setUserDropdownOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Dynamic settings tab detection without triggering Next.js de-opt
  const [settingsTab, setSettingsTab] = useState<string>("gooflow");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const searchTab = new URLSearchParams(window.location.search).get("tab");
      if (searchTab) {
        setSettingsTab(searchTab === "3dflow" ? "gooflow" : searchTab);
      } else {
        try {
          const last = localStorage.getItem("gooos_last_app");
          if (last) {
            setSettingsTab(
              last === "goo-studio"
                ? "goo-studio"
                : last === "gooprint"
                ? "gooprint"
                : "gooflow"
            );
          }
        } catch {}
      }
    }
  }, [pathname]);

  const isSettings = pathname.startsWith("/settings");

  // Determine active states
  const isFlowActive =
    pathname.startsWith("/flow") ||
    pathname.startsWith("/inventory") ||
    pathname.startsWith("/products") ||
    pathname.startsWith("/transactions") ||
    pathname.startsWith("/printers") ||
    pathname.startsWith("/orders") ||
    (isSettings && (settingsTab === "gooflow" || settingsTab === "3dflow" || settingsTab === "system"));

  const isStudioActive =
    pathname.startsWith("/projects") ||
    pathname.startsWith("/batching") ||
    pathname.startsWith("/calculator") ||
    (isSettings && settingsTab === "goo-studio");

  const isCadActive =
    pathname.startsWith("/cad") ||
    (isSettings && settingsTab === "gooprint");

  const isDashboardActive = pathname === "/dashboard" || pathname === "/";
  const isSettingsActive = isSettings;

  const currentApp = (() => {
    if (isFlowActive) return GOO_APPS.find((a) => a.id === "3dflow");
    if (isStudioActive) return GOO_APPS.find((a) => a.id === "goo-studio");
    if (isCadActive) return GOO_APPS.find((a) => a.id === "gooprint");
    return null;
  })();

  // Persist last active app
  useEffect(() => {
    if (currentApp?.id && typeof window !== "undefined") {
      try {
        localStorage.setItem("gooos_last_app", currentApp.id);
      } catch {}
    }
  }, [currentApp]);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

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

  // Sync body padding with sidebar and mobile nav presence
  useEffect(() => {
    if (typeof document !== "undefined") {
      if (currentApp) {
        document.body.classList.add("has-goo-sidebar");
        document.body.classList.add("has-goo-mobile-nav");
        document.documentElement.style.setProperty(
          "--goo-sidebar-w",
          isSidebarCollapsed ? "4.5rem" : "16rem"
        );
      } else {
        document.body.classList.remove("has-goo-sidebar");
        document.body.classList.remove("has-goo-mobile-nav");
        document.documentElement.style.setProperty("--goo-sidebar-w", "0px");
      }
    }
    return () => {
      if (typeof document !== "undefined") {
        document.body.classList.remove("has-goo-sidebar");
        document.body.classList.remove("has-goo-mobile-nav");
      }
    };
  }, [currentApp, isSidebarCollapsed]);

  // Dynamic measurement of top header wrapper to sync spacer & sidebar top position
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = headerRef.current;
    if (!el || typeof window === "undefined") return;

    const updateHeight = () => {
      const h = el.offsetHeight || 64;
      document.documentElement.style.setProperty("--goo-header-h", `${h}px`);
    };

    updateHeight();

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => updateHeight());
      ro.observe(el);
    }
    window.addEventListener("resize", updateHeight);

    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener("resize", updateHeight);
    };
  }, [pathname, isDemo, isLimited]);

  const flowMenuList = isDemo
    ? [
        {
          name: "Pesanan Cetak 3D",
          href: "/orders",
          icon: "📋",
          badge: "4 Sample",
          desc: "Antrean pesanan sampel & alur cetak demo",
        },
        {
          name: "Inventaris Filamen & Aset",
          href: "/inventory",
          icon: "🧵",
          badge: "5 Spool",
          desc: "Stok spul filamen sampel & gramasi",
        },
        {
          name: "Armada Mesin Printer",
          href: "/printers",
          icon: "🖨️",
          badge: "3 Mesin",
          desc: "Monitoring status mesin demo",
        },
        {
          name: "Katalog Produk 3D",
          href: "/products",
          icon: "📦",
          badge: "4 Model",
          desc: "Daftar model sampel, COGS & harga",
        },
        {
          name: "Buku Kas & Transaksi",
          href: "/transactions",
          icon: "💳",
          badge: "Demo",
          desc: "Simulasi arus kas & profit studio",
        },
        {
          name: "Flow Hub Telemetri",
          href: "/flow",
          icon: "⚡",
          badge: "Live",
          desc: "Ringkasan metrik & status studio cetak",
        },
      ]
    : FLOW_SUBMENUS;

  const activeSubmenus = (() => {
    if (isFlowActive) return flowMenuList;
    if (isStudioActive) return STUDIO_SUBMENUS;
    if (isCadActive) return GOOPRINT_NAV_ITEMS;
    return [];
  })();

  return (
    <>
      {/* ========================================================= */}
      {/* FIXED TOP NAVIGATION BAR (Permanently pinned on scroll)    */}
      {/* ========================================================= */}
      <div
        ref={headerRef}
        className="fixed top-0 left-0 right-0 z-40 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/80 shadow-md shadow-black/25 select-none"
      >
        <DemoNoticeBanner />
        <header className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4 text-white">
          
          {/* ========================================================= */}
          {/* LEFT: BRAND & APP HUB SWITCHER                            */}
          {/* ========================================================= */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Official GooOS Brand Logo */}
            <Link href="/dashboard" className="flex items-center gap-2 group transition-transform hover:scale-[1.02]">
              <GooLogo layout="horizontal" iconVariant="gradient" size="md" showStudioBadge={true} priority={true} />
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
          {/* CENTER: DESKTOP APP HUB SUITE NAVIGATION                   */}
          {/* Fits comfortably on screens >= 768px (md:)                */}
          {/* ========================================================= */}
          <nav className="hidden md:flex items-center gap-1.5 text-xs font-medium text-slate-400">
            {/* 1. Dashboard Tab */}
            <Link
              href="/dashboard"
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                isDashboardActive
                  ? "bg-slate-800 text-white font-bold border border-slate-700 shadow-sm"
                  : "hover:text-slate-100 hover:bg-slate-900/60"
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </Link>

            {/* 2. GooFlow Tab (Direct link + dropdown preview) */}
            <div className="relative flex items-center">
              <Link
                href="/orders"
                className={`pl-3 pr-1.5 py-1.5 rounded-l-xl transition-all flex items-center gap-1.5 ${
                  isFlowActive
                    ? "bg-rose-500/20 text-rose-300 font-bold border-y border-l border-rose-500/30 shadow-sm shadow-rose-500/10"
                    : "hover:text-slate-100 hover:bg-slate-900/60"
                }`}
                title="Buka GooFlow (Pesanan & Antrean Produksi)"
              >
                <span>⚡ GooFlow</span>
              </Link>
              <button
                type="button"
                onClick={() => {
                  setFlowOpen(!flowOpen);
                  setStudioOpen(false);
                  setCadOpen(false);
                  setAppsOpen(false);
                }}
                className={`pr-2 pl-1 py-1.5 rounded-r-xl transition-all flex items-center cursor-pointer ${
                  isFlowActive
                    ? "bg-rose-500/20 text-rose-300 border-y border-r border-rose-500/30"
                    : "hover:text-slate-100 hover:bg-slate-900/60"
                }`}
                title="Buka Menu Dropdown GooFlow"
              >
                <ChevronDown
                  className={`w-3 h-3 transition-transform ${flowOpen ? "rotate-180" : ""}`}
                />
              </button>

              {flowOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setFlowOpen(false)} />
                  <div className="absolute left-0 top-full mt-2 w-72 rounded-2xl bg-slate-900/98 backdrop-blur-xl border border-slate-800 shadow-2xl p-2 z-50 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-1.5 text-[10px] font-bold text-rose-400 uppercase tracking-wider border-b border-slate-800 flex items-center justify-between">
                      <span>Menu GooFlow Produksi</span>
                      <span className="text-[9px] font-mono text-slate-500">Additive Farm</span>
                    </div>
                    {flowMenuList.map((menu) => (
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

            {/* 3. GOO-Studio Tab (Direct link + dropdown preview) */}
            <div className="relative flex items-center">
              <Link
                href="/projects"
                className={`pl-3 pr-1.5 py-1.5 rounded-l-xl transition-all flex items-center gap-1.5 ${
                  isStudioActive
                    ? "bg-indigo-500/20 text-indigo-300 font-bold border-y border-l border-indigo-500/30 shadow-sm shadow-indigo-500/10"
                    : "hover:text-slate-100 hover:bg-slate-900/60"
                }`}
                title="Buka GOO-Studio (Proyek & STL)"
              >
                <span>📐 GOO-Studio</span>
              </Link>
              <button
                type="button"
                onClick={() => {
                  setStudioOpen(!studioOpen);
                  setFlowOpen(false);
                  setCadOpen(false);
                  setAppsOpen(false);
                }}
                className={`pr-2 pl-1 py-1.5 rounded-r-xl transition-all flex items-center cursor-pointer ${
                  isStudioActive
                    ? "bg-indigo-500/20 text-indigo-300 border-y border-r border-indigo-500/30"
                    : "hover:text-slate-100 hover:bg-slate-900/60"
                }`}
                title="Buka Menu Dropdown GOO-Studio"
              >
                <ChevronDown
                  className={`w-3 h-3 transition-transform ${studioOpen ? "rotate-180" : ""}`}
                />
              </button>

              {studioOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setStudioOpen(false)} />
                  <div className="absolute left-0 top-full mt-2 w-72 rounded-2xl bg-slate-900/98 backdrop-blur-xl border border-slate-800 shadow-2xl p-2 z-50 space-y-1 animate-in fade-in zoom-in-95 duration-150">
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

            {/* 4. GooPrint Tab (Direct link + dropdown preview) */}
            <div className="relative flex items-center">
              <Link
                href="/cad"
                className={`pl-3 pr-1.5 py-1.5 rounded-l-xl transition-all flex items-center gap-1.5 ${
                  isCadActive
                    ? "bg-cyan-500/20 text-cyan-300 font-bold border-y border-l border-cyan-500/30 shadow-sm shadow-cyan-500/10"
                    : "hover:text-slate-100 hover:bg-slate-900/60"
                }`}
                title="Buka GooPrint (CAD & Tools)"
              >
                <span>🎨 GooPrint</span>
              </Link>
              <button
                type="button"
                onClick={() => {
                  setCadOpen(!cadOpen);
                  setFlowOpen(false);
                  setStudioOpen(false);
                  setAppsOpen(false);
                }}
                className={`pr-2 pl-1 py-1.5 rounded-r-xl transition-all flex items-center cursor-pointer ${
                  isCadActive
                    ? "bg-cyan-500/20 text-cyan-300 border-y border-r border-cyan-500/30"
                    : "hover:text-slate-100 hover:bg-slate-900/60"
                }`}
                title="Buka Menu Dropdown GooPrint"
              >
                <ChevronDown
                  className={`w-3 h-3 transition-transform ${cadOpen ? "rotate-180" : ""}`}
                />
              </button>

              {cadOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setCadOpen(false)}
                  />
                  <div className="absolute left-0 top-full mt-2 w-80 rounded-2xl bg-slate-900/98 backdrop-blur-xl border border-slate-800 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 space-y-1">
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

            {/* Demo Indicator Pill */}
            {isDemo && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-semibold">
                <Lock className="w-3 h-3 text-amber-400" />
                <span className="hidden sm:inline">Demo (Hanya Baca)</span>
                <span className="sm:hidden">Demo</span>
              </div>
            )}

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

            {/* ========================================================= */}
            {/* GAMBAR PROFIL & MENU AKUN PENGGUNA (ALWAYS ACCESSIBLE)   */}
            {/* ========================================================= */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className={`flex items-center gap-2 p-1 sm:pr-2.5 rounded-full border transition-all cursor-pointer shadow-sm select-none ${
                  userDropdownOpen
                    ? "bg-slate-800 border-rose-500/50 ring-2 ring-rose-500/20"
                    : isDemo
                    ? "bg-amber-500/10 border-amber-500/40 hover:bg-amber-500/20 text-amber-200"
                    : user
                    ? "bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-800 text-slate-200"
                    : "bg-slate-900/90 border-slate-800 hover:border-slate-700 text-slate-300"
                }`}
                title="Menu Akun & Profil (Klik untuk membuka)"
                aria-label="Buka Menu Akun Pengguna"
              >
                {/* Gambar Profil (Avatar Picture) */}
                <div className="relative shrink-0">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-md overflow-hidden ${
                      isDemo
                        ? "bg-gradient-to-tr from-amber-600 via-orange-500 to-rose-600 ring-2 ring-amber-400"
                        : user
                        ? "bg-gradient-to-tr from-rose-500 via-purple-600 to-indigo-600 ring-2 ring-rose-400/60"
                        : "bg-slate-800 ring-2 ring-slate-700 text-slate-400"
                    }`}
                  >
                    {(user as any)?.image || (user as any)?.avatar_url ? (
                      <img
                        src={(user as any)?.image || (user as any)?.avatar_url}
                        alt={user?.name || "Profil"}
                        className="w-full h-full object-cover"
                      />
                    ) : isDemo ? (
                      <span>DM</span>
                    ) : user?.name ? (
                      <span>{user.name.slice(0, 2).toUpperCase()}</span>
                    ) : (
                      <UserIcon className="w-4 h-4 text-slate-300" />
                    )}
                  </div>

                  {/* Status Indicator Dot pada Gambar Profil */}
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-slate-950 ${
                      isDemo ? "bg-amber-400" : user ? "bg-emerald-400 animate-pulse" : "bg-slate-500"
                    }`}
                  />
                </div>

                {/* Label Teks di samping Gambar Profil */}
                <div className="hidden sm:flex flex-col min-w-0 pr-0.5 text-left">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-white leading-tight truncate max-w-[105px]">
                      {isDemo ? "Akun Demo" : user?.name || "Menu Akun"}
                    </span>
                  </div>
                  <span className="text-[9px] font-mono leading-none text-slate-400 truncate max-w-[105px]">
                    {isDemo ? "Hanya Baca" : user ? (user.email?.split("@")[0] || "Online") : "Masuk Akun"}
                  </span>
                </div>

                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 shrink-0 ${
                    userDropdownOpen ? "rotate-180 text-white" : ""
                  }`}
                />
              </button>

              {/* POPUP MENU AKUN DI GAMBAR PROFIL */}
              {userDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserDropdownOpen(false)} />
                  <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-slate-900/98 backdrop-blur-xl border border-slate-800 shadow-2xl p-3.5 z-50 space-y-3 animate-in fade-in zoom-in-95 duration-150 text-left select-none">
                    
                    {/* Header Menu Akun */}
                    <div className="border-b border-slate-800/80 pb-3 space-y-2.5">
                      <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-slate-400">
                        <span className="flex items-center gap-1.5 font-bold text-slate-200">
                          <UserIcon className="w-3.5 h-3.5 text-rose-400" />
                          <span>Menu Akun Pengguna</span>
                        </span>
                        {isDemo ? (
                          <span className="text-[9px] font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/40">
                            DEMO (HANYA BACA)
                          </span>
                        ) : isOwner ? (
                          <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/40">
                            👑 OWNER &amp; ADMIN
                          </span>
                        ) : isLimited ? (
                          <span className="text-[9px] font-bold text-cyan-300 bg-cyan-500/20 px-2 py-0.5 rounded-full border border-cyan-500/40">
                            TRIAL ({quotaInfo?.used ?? 0}/{quotaInfo?.max ?? 5} DATA)
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
                            BELUM LOGIN
                          </span>
                        )}
                      </div>

                      {/* Kartu Profil Pengguna */}
                      <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                        <div
                          className={`w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold text-white shadow-md shrink-0 overflow-hidden ${
                            isDemo
                              ? "bg-gradient-to-tr from-amber-600 via-orange-500 to-rose-600 ring-2 ring-amber-400/80"
                              : user
                              ? "bg-gradient-to-tr from-rose-500 via-purple-600 to-indigo-600 ring-2 ring-indigo-400/50"
                              : "bg-slate-800 text-slate-400"
                          }`}
                        >
                          {(user as any)?.image || (user as any)?.avatar_url ? (
                            <img
                              src={(user as any)?.image || (user as any)?.avatar_url}
                              alt={user?.name || "Profil"}
                              className="w-full h-full object-cover"
                            />
                          ) : isDemo ? (
                            <span>DM</span>
                          ) : user?.name ? (
                            <span>{user.name.slice(0, 2).toUpperCase()}</span>
                          ) : (
                            <UserIcon className="w-5 h-5 text-slate-400" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-bold text-white truncate">
                            {user?.name || (isDemo ? "Akun Demo GooOS" : "Pengunjung / Tamu")}
                          </h4>
                          <p className="text-[11px] text-slate-400 font-mono truncate">
                            {user?.email || (isDemo ? "demo@goocanan.com" : "Belum masuk akun")}
                          </p>
                          <p className="text-[10px] text-slate-500 truncate mt-0.5 font-sans">
                            Farm: GooOS Production Fleet
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Navigasi Menu Akun */}
                    <div className="space-y-1">
                      <Link
                        href="/settings?tab=account"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-emerald-300 bg-emerald-500/10 border border-emerald-500/25 hover:bg-emerald-500/20 transition group"
                      >
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                          <UserIcon className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="leading-tight flex items-center justify-between">
                            <span>Profil &amp; Menu Akun</span>
                            <span className="text-[10px] font-mono text-emerald-400/80">Tab Akun →</span>
                          </div>
                          <div className="text-[10px] text-emerald-400/70 font-normal">
                            Kelola sesi, password, &amp; hak akses
                          </div>
                        </div>
                      </Link>

                      <Link
                        href="/dashboard"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition"
                      >
                        <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                          <LayoutDashboard className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="leading-tight">Universal Dashboard</div>
                          <div className="text-[10px] text-slate-400">Pusat kendali ekosistem</div>
                        </div>
                      </Link>

                      <Link
                        href="/settings"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition"
                      >
                        <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                          <Settings className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="leading-tight">Pengaturan Studio &amp; Farm</div>
                          <div className="text-[10px] text-slate-400">Konfigurasi listrik, biaya, &amp; printer</div>
                        </div>
                      </Link>
                    </div>

                    {/* Bagian Beralih Akun (Switch Account) */}
                    <div className="border-t border-slate-800/80 pt-2.5 space-y-1.5">
                      <div className="px-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                        Beralih Akun (Switch)
                      </div>

                      {!isDemo ? (
                        <button
                          onClick={handleQuickDemoSwitch}
                          disabled={isSwitchingDemo}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 transition text-left cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span>{isSwitchingDemo ? "Beralih..." : "Beralih ke Akun Demo (Hanya Baca)"}</span>
                          </div>
                          <span className="text-[9px] font-mono bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/30">
                            1-Click
                          </span>
                        </button>
                      ) : (
                        <Link
                          href="/auth/login"
                          onClick={() => setUserDropdownOpen(false)}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/25 transition"
                        >
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                            <span>Masuk ke Akun Administrator</span>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
                        </Link>
                      )}

                      <Link
                        href="/auth/login"
                        onClick={() => setUserDropdownOpen(false)}
                        className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition"
                      >
                        <span>Ganti Akun Lain (Login Ulang)</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                      </Link>

                      <button
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          if (typeof window !== "undefined") {
                            window.dispatchEvent(new CustomEvent("gooos:open-pwa-install"));
                          }
                        }}
                        className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs text-rose-300 hover:text-white hover:bg-rose-500/15 transition cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <Smartphone className="w-3.5 h-3.5 text-rose-400" />
                          <span>Install Aplikasi (PWA)</span>
                        </div>
                        <span className="text-[9px] bg-rose-500/20 text-rose-300 px-1.5 py-0.2 rounded font-semibold border border-rose-500/30">
                          App
                        </span>
                      </button>
                    </div>

                    {/* Tombol Logout / Login */}
                    <div className="border-t border-slate-800/80 pt-2">
                      {user ? (
                        <button
                          onClick={async () => {
                            setUserDropdownOpen(false);
                            try {
                              await signOut();
                            } catch {}
                            router.push("/auth/login");
                          }}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition cursor-pointer"
                        >
                          <span>{isDemo ? "Keluar dari Akun Demo" : "Sign Out / Keluar dari Akun"}</span>
                          <LogOut className="w-4 h-4 text-rose-400" />
                        </button>
                      ) : (
                        <Link
                          href="/auth/login"
                          onClick={() => setUserDropdownOpen(false)}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-rose-500 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 shadow-md transition"
                        >
                          <LogIn className="w-4 h-4" />
                          <span>Masuk ke Akun Anda (Login)</span>
                        </Link>
                      )}
                    </div>

                  </div>
                </>
              )}
            </div>

            {/* Mobile Hamburger Button (< 768px) */}
            <button
              onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
              className="md:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors"
              aria-label="Toggle Mobile Navigation"
            >
              {mobileDrawerOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
      </header>
    </div>

    {/* Spacer placeholder to reserve exact vertical height in normal document flow */}
    <div
      style={{ height: "var(--goo-header-h, 4rem)" }}
      className="shrink-0 w-full pointer-events-none"
      aria-hidden="true"
    />

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
                <GooAppIcon size={28} variant="gradient" />
                <div>
                  <h3 className="font-bold text-sm text-white flex items-center gap-1">
                    <span>Goo</span><span className="text-[#00C2FF]">OS</span>
                    <span className="text-[9px] font-mono font-bold text-cyan-300 bg-cyan-950 px-1.5 py-0.2 rounded border border-cyan-500/30">STUDIO</span>
                  </h3>
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

            {/* Mobile Drawer User Account Card */}
            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
              {user ? (
                <>
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white shadow-sm shrink-0 ${
                        isDemo
                          ? "bg-gradient-to-tr from-amber-600 to-rose-600 ring-2 ring-amber-400/80 shadow-amber-500/30"
                          : "bg-gradient-to-tr from-rose-500 to-indigo-600 ring-2 ring-indigo-400/50"
                      }`}
                    >
                      {isDemo ? "DM" : (user.name?.slice(0, 2).toUpperCase() || "GO")}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-xs font-bold text-white truncate">
                          {user.name || (isDemo ? "Akun Demo" : "Operator")}
                        </h4>
                        {isDemo ? (
                          <span className="text-[9px] font-bold text-amber-300 bg-amber-500/20 px-1.5 py-0.2 rounded border border-amber-500/40 shrink-0">
                            DEMO
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/20 px-1.5 py-0.2 rounded border border-emerald-500/40 shrink-0">
                            ADMIN
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono truncate">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
                    <Link
                      href="/settings?tab=account"
                      onClick={() => setMobileDrawerOpen(false)}
                      className="flex-1 text-center py-1.5 px-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                    >
                      Menu Akun
                    </Link>
                    <button
                      onClick={async () => {
                        setMobileDrawerOpen(false);
                        try {
                          await signOut();
                        } catch {}
                        router.push("/auth/login");
                      }}
                      className="flex items-center justify-center gap-1 py-1.5 px-3 rounded-xl text-xs font-bold bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 transition"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Keluar</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-white">Belum Masuk Akun</h4>
                    <p className="text-[10px] text-slate-400">Masuk untuk akses fitur &amp; data</p>
                  </div>
                  <Link
                    href="/auth/login"
                    onClick={() => setMobileDrawerOpen(false)}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-rose-500 to-indigo-600 text-white shadow-md transition hover:scale-105 shrink-0"
                  >
                    Masuk
                  </Link>
                </div>
              )}
            </div>

            {/* Install PWA Mobile Shortcut */}
            <div>
              <button
                type="button"
                onClick={() => {
                  setMobileDrawerOpen(false);
                  if (typeof window !== "undefined") {
                    window.dispatchEvent(new CustomEvent("gooos:open-pwa-install"));
                  }
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-rose-500/10 via-indigo-500/10 to-rose-500/10 border border-rose-500/30 text-rose-200 hover:bg-rose-500/20 transition cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Pasang Aplikasi di Android</span>
                </div>
                <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded-full font-bold">
                  Install
                </span>
              </button>
            </div>

            {/* Quick Links Grid */}
            <div className="grid grid-cols-3 gap-2">
              <Link
                href="/dashboard"
                onClick={() => setMobileDrawerOpen(false)}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl font-bold text-xs border text-center ${
                  isDashboardActive
                    ? "bg-slate-900 text-white border-slate-700"
                    : "bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-900"
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-rose-400 mb-1" />
                <span>Dashboard</span>
              </Link>
              <Link
                href="/settings"
                onClick={() => setMobileDrawerOpen(false)}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl font-bold text-xs border text-center ${
                  isSettingsActive && settingsTab !== "account"
                    ? "bg-purple-500/20 text-purple-200 border-purple-500/40"
                    : "bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-900"
                }`}
              >
                <Settings className="w-4 h-4 text-purple-400 mb-1" />
                <span>Pengaturan</span>
              </Link>
              <Link
                href="/settings?tab=account"
                onClick={() => setMobileDrawerOpen(false)}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl font-bold text-xs border text-center ${
                  isSettingsActive && settingsTab === "account"
                    ? "bg-emerald-500/20 text-emerald-200 border-emerald-500/40"
                    : "bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-900"
                }`}
              >
                <UserIcon className="w-4 h-4 text-emerald-400 mb-1" />
                <span>Akun &amp; Sesi</span>
              </Link>
            </div>

            {/* Section 1: GooFlow */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-rose-400 uppercase tracking-wider px-1">
                <span>⚡ GooFlow (Produksi Cetak)</span>
                <span className="text-[9px] font-mono text-slate-500">6 Modul</span>
              </div>
              <div className="grid grid-cols-1 gap-1">
                {flowMenuList.map((menu) => (
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
      {/* DESKTOP APP LEFT SIDEBAR (Rendered when inside an App)    */}
      {/* ========================================================= */}
      {currentApp && (
        <aside
          className={`hidden md:flex fixed left-0 bottom-0 z-30 flex-col justify-between bg-slate-950/95 backdrop-blur-xl border-r border-slate-800/80 transition-all duration-200 select-none ${
            isSidebarCollapsed ? "w-[4.5rem]" : "w-64"
          }`}
          style={{ top: "var(--goo-header-h, 4rem)" }}
        >
          {/* Top Section: App Branding & Submenus */}
          <div className="flex flex-col flex-1 min-h-0 overflow-y-auto p-3 space-y-3 scrollbar-none">
            {/* App Header Badge & Collapse Button */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
              {!isSidebarCollapsed ? (
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-base shrink-0 shadow-sm"
                    style={{ backgroundColor: `${currentApp.color}25` }}
                  >
                    {currentApp.icon}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-xs font-bold text-white truncate leading-tight">
                      {currentApp.name}
                    </h2>
                    <span className="text-[10px] text-slate-400 font-mono truncate block">
                      {currentApp.tagline}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="mx-auto text-lg" title={currentApp.name}>
                  {currentApp.icon}
                </div>
              )}

              <button
                type="button"
                onClick={toggleSidebarCollapse}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors shrink-0"
                title={isSidebarCollapsed ? "Perlebar Sidebar" : "Persempit Sidebar"}
              >
                {isSidebarCollapsed ? (
                  <PanelLeftOpen className="w-4 h-4" />
                ) : (
                  <PanelLeftClose className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Submenu Links */}
            <nav className="space-y-1">
              {activeSubmenus.map((menu) => {
                const isActive =
                  pathname === menu.href ||
                  (menu.href.includes("?") &&
                    pathname === menu.href.split("?")[0] &&
                    (menu.href.includes("tab=")
                      ? settingsTab ===
                        new URLSearchParams(menu.href.split("?")[1]).get("tab")
                      : true));

                return (
                  <Link
                    key={menu.name}
                    href={menu.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                      isActive
                        ? isFlowActive
                          ? "bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30 shadow-md shadow-rose-500/10"
                          : isStudioActive
                          ? "bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30 shadow-md shadow-indigo-500/10"
                          : "bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30 shadow-md shadow-cyan-500/10"
                        : "text-slate-400 hover:text-slate-100 hover:bg-slate-900/60"
                    }`}
                    title={isSidebarCollapsed ? `${menu.name} (${menu.badge})` : undefined}
                  >
                    <span className="text-base shrink-0">{menu.icon}</span>
                    {!isSidebarCollapsed && (
                      <div className="flex-1 min-w-0 flex items-center justify-between">
                        <span className="truncate">{menu.name}</span>
                        {menu.badge && (
                          <span
                            className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                              isActive
                                ? "bg-slate-950/70 border border-white/10 text-white"
                                : "bg-slate-900 border border-slate-800 text-slate-500 group-hover:text-slate-300"
                            }`}
                          >
                            {menu.badge}
                          </span>
                        )}
                      </div>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Bottom Footer Section (Contextual & Clean - No Duplicates) */}
          <div className="p-3 border-t border-slate-800/80 space-y-1.5">
            {!isSidebarCollapsed ? (
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800/60 text-[11px] font-mono text-slate-400">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Farm Live
                </span>
                <span>3 Mesin Online</span>
              </div>
            ) : (
              <div
                className="flex items-center justify-center p-2 rounded-xl bg-slate-900/60 border border-slate-800/60"
                title="Farm Live: 3 Mesin Online"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
            )}

            {/* Contextual App Settings Link */}
            <Link
              href={
                isFlowActive
                  ? "/settings?tab=gooflow"
                  : isStudioActive
                  ? "/settings?tab=goo-studio"
                  : "/settings?tab=gooprint"
              }
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-colors ${
                isSettingsActive && (settingsTab === "gooflow" || settingsTab === "goo-studio" || settingsTab === "gooprint")
                  ? "bg-slate-800 text-white font-semibold"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              } ${isSidebarCollapsed ? "justify-center" : ""}`}
              title={`Pengaturan ${currentApp.name}`}
            >
              <Settings className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-white" />
              {!isSidebarCollapsed && <span className="truncate">Pengaturan {currentApp.name}</span>}
            </Link>

            {/* Sidebar Collapse Toggle Button */}
            <button
              type="button"
              onClick={toggleSidebarCollapse}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-900 transition-colors cursor-pointer ${
                isSidebarCollapsed ? "justify-center" : ""
              }`}
              title={isSidebarCollapsed ? "Perlebar Sidebar (Expand)" : "Persempit Sidebar (Collapse)"}
            >
              {isSidebarCollapsed ? (
                <PanelLeftOpen className="w-4 h-4 shrink-0 text-slate-400" />
              ) : (
                <>
                  <PanelLeftClose className="w-4 h-4 shrink-0 text-slate-400" />
                  <span className="truncate text-[11px]">Persempit Navigasi</span>
                </>
              )}
            </button>
          </div>
        </aside>
      )}

      {/* ========================================================= */}
      {/* MOBILE BOTTOM NAVIGATION BAR (< 768px / md:hidden)        */}
      {/* Dynamic Thumb Bar: Shows active app menus or Hub          */}
      {/* ========================================================= */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/90 shadow-2xl safe-area-pb touch-pan-x w-full max-w-full overflow-hidden">
        {currentApp && activeSubmenus.length > 0 ? (
          <div className="flex items-center overflow-x-auto scrollbar-none px-2 py-1.5 gap-1.5 touch-pan-x w-full max-w-full">
            {/* Quick App Switcher Icon */}
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl shrink-0 text-slate-400 hover:text-white bg-slate-900/60 border border-slate-800"
              title="Ganti Aplikasi / Menu"
            >
              <span className="text-base">{currentApp.icon}</span>
              <span className="text-[9px] font-bold text-slate-300 leading-tight">Hub</span>
            </button>

            <div className="h-6 w-[1px] bg-slate-800 shrink-0 mx-0.5" />

            {/* Dynamic Active App Menus */}
            {activeSubmenus.map((menu) => {
              const isActive =
                pathname === menu.href ||
                (menu.href.includes("?") &&
                  pathname === menu.href.split("?")[0] &&
                  (menu.href.includes("tab=")
                    ? settingsTab ===
                      new URLSearchParams(menu.href.split("?")[1]).get("tab")
                    : true));

              return (
                <Link
                  key={menu.name}
                  href={menu.href}
                  className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl shrink-0 min-w-[3.8rem] transition-all ${
                    isActive
                      ? isFlowActive
                        ? "bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30"
                        : isStudioActive
                        ? "bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30"
                        : "bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <span className="text-base leading-none mb-0.5">{menu.icon}</span>
                  <span className="text-[10px] leading-tight truncate max-w-[4.8rem]">
                    {menu.name.split(" ")[0]}
                  </span>
                  {isActive && (
                    <span
                      className={`w-1 h-1 rounded-full mt-0.5 ${
                        isFlowActive
                          ? "bg-rose-400 shadow-[0_0_6px_#f43f5e]"
                          : isStudioActive
                          ? "bg-indigo-400 shadow-[0_0_6px_#6366f1]"
                          : "bg-cyan-400 shadow-[0_0_6px_#06b6d4]"
                      }`}
                    />
                  )}
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-5 gap-1 max-w-md mx-auto items-center px-2 py-1.5">
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

            {/* 2. GooFlow */}
            <Link
              href="/orders"
              className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all ${
                isFlowActive
                  ? "text-rose-400 font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span className="text-sm leading-none mb-0.5">⚡</span>
              <span className="text-[10px] font-medium leading-none">GooFlow</span>
              {isFlowActive && (
                <span className="w-1 h-1 rounded-full bg-rose-400 mt-1 shadow-[0_0_6px_#f43f5e]" />
              )}
            </Link>

            {/* 3. GOO-Studio */}
            <Link
              href="/batching"
              className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all ${
                isStudioActive
                  ? "text-indigo-400 font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span className="text-sm leading-none mb-0.5">📐</span>
              <span className="text-[10px] font-medium leading-none">Studio</span>
              {isStudioActive && (
                <span className="w-1 h-1 rounded-full bg-indigo-400 mt-1 shadow-[0_0_6px_#6366f1]" />
              )}
            </Link>

            {/* 4. GooPrint */}
            <Link
              href="/cad"
              className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all ${
                isCadActive
                  ? "text-cyan-400 font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span className="text-sm leading-none mb-0.5">🎨</span>
              <span className="text-[10px] font-medium leading-none">GooPrint</span>
              {isCadActive && (
                <span className="w-1 h-1 rounded-full bg-cyan-400 mt-1 shadow-[0_0_6px_#06b6d4]" />
              )}
            </Link>

            {/* 5. Menu / Drawer */}
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
        )}
      </nav>

      {/* Spacing for mobile bottom navigation bar so no content gets covered */}
      <div className="h-16 md:hidden pointer-events-none" aria-hidden="true" />
    </>
  );
}
