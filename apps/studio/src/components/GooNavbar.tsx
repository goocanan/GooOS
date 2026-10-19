"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { GOO_APPS } from "@/config/apps.config";

export function GooNavbar() {
  const pathname = usePathname();
  const [appsOpen, setAppsOpen] = useState(false);

  // Determine which app is currently active based on pathname
  const currentApp = (() => {
    if (
      pathname.startsWith("/flow") ||
      pathname.startsWith("/inventory") ||
      pathname.startsWith("/products") ||
      pathname.startsWith("/transactions") ||
      pathname.startsWith("/printers") ||
      pathname.startsWith("/orders")
    ) {
      return GOO_APPS.find((a) => a.id === "3dflow");
    }
    if (
      pathname.startsWith("/projects") ||
      pathname.startsWith("/batching") ||
      pathname.startsWith("/calculator")
    ) {
      return GOO_APPS.find((a) => a.id === "goo-studio");
    }
    if (pathname.startsWith("/cad")) {
      return GOO_APPS.find((a) => a.id === "gooprint");
    }
    return null;
  })();

  return (
    <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand & App Launcher */}
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 via-indigo-600 to-cyan-500 p-0.5 shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center font-black text-transparent bg-clip-text bg-gradient-to-tr from-rose-400 to-cyan-300 text-base">
                G
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold tracking-tight text-white text-base">GooOS</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-widest">
                  Studio
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono -mt-0.5">Unified Platform</span>
            </div>
          </Link>

          {/* App Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setAppsOpen(!appsOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-200 transition-colors"
            >
              <span className="text-sm">{currentApp ? currentApp.icon : "⚡"}</span>
              <span className="font-semibold text-slate-100">{currentApp ? currentApp.name : "App Hub"}</span>
              <span className="text-slate-500 text-[10px]">▼</span>
            </button>

            {appsOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setAppsOpen(false)} />
                <div className="absolute left-0 mt-2 w-72 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50 space-y-1">
                  <div className="px-3 py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800/80">
                    GooOS Application Suite
                  </div>
                  {GOO_APPS.map((app) => (
                    <Link
                      key={app.id}
                      href={app.href}
                      onClick={() => setAppsOpen(false)}
                      className={`flex items-start gap-3 p-2.5 rounded-xl transition-all ${
                        currentApp?.id === app.id
                          ? "bg-slate-800/80 border border-slate-700"
                          : "hover:bg-slate-800/50"
                      } ${app.status === "coming_soon" ? "opacity-60 cursor-not-allowed" : ""}`}
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
                  <div className="pt-2 border-t border-slate-800/80">
                    <Link
                      href="/dashboard#apps"
                      onClick={() => setAppsOpen(false)}
                      className="block text-center py-2 text-xs font-semibold text-indigo-400 hover:text-indigo-300 rounded-lg hover:bg-indigo-500/10 transition-colors"
                    >
                      Lihat Semua Menu & Tambah Aplikasi &rarr;
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Quick App Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 text-xs font-medium text-slate-400">
          <Link
            href="/dashboard"
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              pathname === "/dashboard" || pathname === "/"
                ? "bg-slate-900 text-white font-semibold"
                : "hover:text-slate-200 hover:bg-slate-900/50"
            }`}
          >
            Dashboard
          </Link>
          <span className="text-slate-800">|</span>
          <Link
            href="/flow"
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              pathname === "/flow" ? "bg-rose-500/20 text-rose-300 font-semibold" : "hover:text-slate-200"
            }`}
          >
            ⚡ 3DFlow
          </Link>
          <Link
            href="/inventory"
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              pathname === "/inventory" ? "bg-rose-500/20 text-rose-300 font-semibold" : "hover:text-slate-200"
            }`}
          >
            Inventaris
          </Link>
          <Link
            href="/products"
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              pathname === "/products" ? "bg-rose-500/20 text-rose-300 font-semibold" : "hover:text-slate-200"
            }`}
          >
            Produk 3D
          </Link>
          <Link
            href="/transactions"
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              pathname === "/transactions" ? "bg-rose-500/20 text-rose-300 font-semibold" : "hover:text-slate-200"
            }`}
          >
            Buku Kas
          </Link>
          <span className="text-slate-800">|</span>
          <Link
            href="/projects"
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              pathname === "/projects" ? "bg-indigo-500/20 text-indigo-300 font-semibold" : "hover:text-slate-200"
            }`}
          >
            📐 GOO-Studio
          </Link>
          <Link
            href="/batching"
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              pathname === "/batching" ? "bg-indigo-500/20 text-indigo-300 font-semibold" : "hover:text-slate-200"
            }`}
          >
            Batching
          </Link>
          <Link
            href="/calculator"
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              pathname === "/calculator" ? "bg-indigo-500/20 text-indigo-300 font-semibold" : "hover:text-slate-200"
            }`}
          >
            Kalkulator
          </Link>
          <span className="text-slate-800">|</span>
          <Link
            href="/cad"
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              pathname === "/cad" ? "bg-cyan-500/20 text-cyan-300 font-semibold" : "hover:text-slate-200"
            }`}
          >
            🎨 GooPrint
          </Link>
        </nav>

        {/* Live Farm Telemetry Pill & User Badge */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Farm Live: 3 Printers</span>
          </div>

          <Link
            href="/dashboard"
            className="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-sm hover:ring-2 hover:ring-indigo-400 transition-all"
            title="GooOS Operator"
          >
            JW
          </Link>
        </div>
      </div>
    </header>
  );
}
