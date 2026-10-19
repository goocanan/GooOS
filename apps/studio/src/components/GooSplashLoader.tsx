"use client";

import { useEffect, useState } from "react";

const BOOT_STEPS = [
  { progress: 20, message: "Memulai GooOS Kernel & Core Runtime..." },
  { progress: 50, message: "Sinkronisasi Supabase Database & Storage..." },
  { progress: 80, message: "Memuat Modul 3DFlow, GOO-Studio & GooPrint..." },
  { progress: 100, message: "Sistem Siap. Membuka Antarmuka GooOS..." },
];

export function GooSplashLoader() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(true);
  const [stepIndex, setStepIndex] = useState(0);
  const [progress, setProgress] = useState(10);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Check if splash was already shown recently in this tab session
    const hasLoaded = sessionStorage.getItem("gooos_booted");
    const speed = hasLoaded ? 0.4 : 1; // Faster if already loaded in session

    const timer1 = setTimeout(() => {
      setStepIndex(1);
      setProgress(45);
    }, 350 * speed);

    const timer2 = setTimeout(() => {
      setStepIndex(2);
      setProgress(78);
    }, 750 * speed);

    const timer3 = setTimeout(() => {
      setStepIndex(3);
      setProgress(100);
    }, 1150 * speed);

    const timer4 = setTimeout(() => {
      setFadeOut(true);
      sessionStorage.setItem("gooos_booted", "true");
    }, 1450 * speed);

    const timer5 = setTimeout(() => {
      setVisible(false);
    }, 1850 * speed);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timer5);
    };
  }, []);

  if (!mounted || !visible) return null;

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950 transition-opacity duration-500 ease-out select-none ${
        fadeOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Background Ambient Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-rose-500/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-violet-600/20 rounded-full blur-[100px] pointer-events-none" />

      {/* Center Branding & Tech Ring */}
      <div className="relative flex flex-col items-center max-w-sm w-full px-6">
        {/* Animated Rings & Logo Emblem */}
        <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
          {/* Outer Pulsing Glow */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-rose-500/30 via-violet-500/30 to-amber-500/30 blur-lg animate-pulse" />

          {/* Rotating Dashed Tech Ring */}
          <div className="absolute -inset-2 rounded-3xl border border-rose-500/20 border-dashed animate-spin [animation-duration:12s]" />

          {/* Inner Hex-like Box */}
          <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-700/80 shadow-2xl flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-rose-500/10 via-transparent to-violet-500/20" />
            
            {/* GooOS Monogram Logo */}
            <div className="relative flex items-center justify-center">
              <span className="text-3xl font-black tracking-tighter bg-gradient-to-br from-white via-rose-300 to-violet-400 bg-clip-text text-transparent drop-shadow-md">
                G
              </span>
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping absolute -top-1 -right-2" />
            </div>
          </div>
        </div>

        {/* Title & Tagline */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-900/90 border border-slate-800 text-[10px] font-mono text-slate-400 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>GooOS Platform v2.4</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Goo<span className="bg-gradient-to-r from-rose-400 to-violet-400 bg-clip-text text-transparent">OS</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Unified Operating System for Studio &amp; 3D Production
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-full space-y-2">
          <div className="relative w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-rose-500 via-violet-500 to-cyan-400 transition-all duration-300 ease-out rounded-full shadow-[0_0_12px_rgba(244,63,94,0.6)]"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Status Message & Percentage */}
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1">
            <span className="truncate pr-2 text-slate-300">
              {BOOT_STEPS[stepIndex]?.message || "Memuat sistem..."}
            </span>
            <span className="font-bold text-rose-400 shrink-0">
              {progress}%
            </span>
          </div>
        </div>

        {/* Bottom Platform Modules Tag */}
        <div className="mt-8 flex items-center gap-2 text-[10px] font-mono text-slate-500">
          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800/80">3DFlow</span>
          <span>•</span>
          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800/80">GOO-Studio</span>
          <span>•</span>
          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800/80">GooPrint</span>
        </div>
      </div>
    </div>
  );
}
