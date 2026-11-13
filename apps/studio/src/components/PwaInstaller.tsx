"use client";

import { useEffect, useState } from "react";
import { Download, X, Smartphone, Check, Share, PlusSquare } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function PwaInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [isAndroidOrMobile, setIsAndroidOrMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if dismissed previously in session
    if (sessionStorage.getItem("gooos_pwa_dismissed") === "true") {
      setDismissed(true);
    }

    // Check if running in standalone mode (already installed as PWA)
    const isStandaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes("android-app://");

    setIsStandalone(isStandaloneMode);

    // Detect Android or mobile user agent
    const ua = navigator.userAgent.toLowerCase();
    const isMobile = /android|iphone|ipad|ipod|mobile/i.test(ua);
    setIsAndroidOrMobile(isMobile);

    // Register Service Worker
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            console.log("[PWA] Service Worker registered with scope:", registration.scope);
          })
          .catch((err) => {
            console.warn("[PWA] Service Worker registration failed:", err);
          });
      });
    }

    // Capture beforeinstallprompt event (Chrome, Edge, Samsung Internet on Android)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      console.log("[PWA] GooOS successfully installed!");
      setIsInstalled(true);
      setDeferredPrompt(null);
      setTimeout(() => setIsInstalled(false), 5000);
    };

    const handleCustomTrigger = () => {
      handleInstallClick();
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    window.addEventListener("gooos:open-pwa-install", handleCustomTrigger);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("gooos:open-pwa-install", handleCustomTrigger);
    };
  }, [deferredPrompt]);

  async function handleInstallClick() {
    if (deferredPrompt) {
      // Trigger native browser install prompt dialog
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === "accepted") {
        console.log("[PWA] User accepted the installation");
        setIsInstalled(true);
      } else {
        console.log("[PWA] User dismissed the installation");
      }
      setDeferredPrompt(null);
    } else {
      // If beforeinstallprompt hasn't fired yet or browser requires manual step, open guide
      setShowGuideModal(true);
    }
  }

  function handleDismiss() {
    setDismissed(true);
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem("gooos_pwa_dismissed", "true");
    }
  }

  // Do not show banner if already running in standalone mode
  if (isStandalone) {
    return null;
  }

  return (
    <>
      {/* Toast Notification after Successful Install */}
      {isInstalled && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-950/90 border border-emerald-500/40 text-emerald-200 px-4 py-2.5 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-2.5 text-xs animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/40">
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </div>
          <span>Aplikasi GooOS berhasil dipasang ke Layar Utama perangkat Anda!</span>
        </div>
      )}

      {/* Floating Install Prompt Banner (Visible on mobile/Android or when install prompt is ready) */}
      {!dismissed && (deferredPrompt || isAndroidOrMobile) && (
        <aside
          aria-label="Instalasi Aplikasi GooOS"
          className="fixed bottom-3 left-3 right-3 sm:left-auto sm:right-6 sm:bottom-6 sm:w-96 z-40 bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/90 border border-rose-500/30 rounded-2xl p-3.5 shadow-2xl backdrop-blur-md text-white animate-in fade-in slide-in-from-bottom-5 duration-300"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-indigo-600 p-0.5 shrink-0 shadow-md">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <img src="/brand/icon-192.png" alt="GooOS" className="w-6 h-6 object-contain" />
              </div>
            </div>

            <div className="flex-1 min-w-0 pr-4">
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs font-bold text-white tracking-tight">Install GooOS di Android</h4>
                <span className="text-[9px] bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold px-1.5 py-0.2 rounded">
                  PWA
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                Pasang ke layar utama untuk akses instan satu ketukan &amp; tampilan penuh tanpa address bar browser.
              </p>
            </div>

            <button
              onClick={handleDismiss}
              aria-label="Tutup saran instalasi"
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/60 transition cursor-pointer shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-3 flex items-center gap-2 pt-2 border-t border-slate-800/80">
            <button
              onClick={handleInstallClick}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-rose-600/20 active:scale-[0.98] transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Pasang Aplikasi Sekarang</span>
            </button>
            <button
              onClick={handleDismiss}
              className="py-2 px-3 rounded-xl bg-slate-800/70 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-medium border border-slate-700/60 transition cursor-pointer"
            >
              Nanti
            </button>
          </div>
        </aside>
      )}

      {/* Manual Installation Guide Modal (for browsers or devices where beforeinstallprompt was blocked) */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="relative w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100 space-y-4">
            <button
              onClick={() => setShowGuideModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Cara Install di Android</h3>
                <p className="text-[11px] text-slate-400">Ikuti 2 langkah mudah berikut:</p>
              </div>
            </div>

            <div className="space-y-3 bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 text-xs">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-300 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <p className="text-slate-300 leading-relaxed">
                  Buka menu browser dengan mengetuk ikon <strong>titik tiga (⋮)</strong> di sudut kanan atas browser Chrome / Edge di HP Anda.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-300 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <p className="text-slate-300 leading-relaxed">
                  Pilih menu <strong className="text-white">“Tambahkan ke Layar Utama”</strong> atau <strong className="text-white">“Install Aplikasi”</strong> (Install App).
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-300 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <p className="text-slate-300 leading-relaxed">
                  Ketuk <strong>Install</strong>. Ikon GooOS akan otomatis terpasang di layar utama HP Anda layaknya aplikasi asli.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white text-xs font-bold transition shadow-md shadow-rose-600/20 cursor-pointer"
            >
              Saya Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
}
