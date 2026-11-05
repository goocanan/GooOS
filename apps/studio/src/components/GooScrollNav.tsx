"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { ChevronUp, ChevronDown } from "lucide-react";

export function GooScrollNav() {
  const [mounted, setMounted] = useState(false);
  const [isScrollable, setIsScrollable] = useState(false);
  const [isNearTop, setIsNearTop] = useState(true);
  const [isNearBottom, setIsNearBottom] = useState(false);
  const [scrollPercent, setScrollPercent] = useState(0);
  const pathname = usePathname();

  const updateScrollState = useCallback(() => {
    if (typeof window === "undefined") return;

    const scrollTop =
      window.scrollY ||
      document.documentElement.scrollTop ||
      document.body.scrollTop ||
      0;

    const scrollHeight = Math.max(
      document.documentElement.scrollHeight,
      document.body.scrollHeight,
      0
    );

    const clientHeight =
      window.innerHeight || document.documentElement.clientHeight || 0;

    const maxScroll = Math.max(0, scrollHeight - clientHeight);
    const hasScroll = maxScroll > 80;

    setIsScrollable(hasScroll);
    setScrollPercent(
      maxScroll > 0 ? Math.min(100, Math.max(0, Math.round((scrollTop / maxScroll) * 100))) : 0
    );
    setIsNearTop(scrollTop < 80);
    setIsNearBottom(scrollTop >= maxScroll - 80);
  }, []);

  useEffect(() => {
    setMounted(true);
    updateScrollState();

    const onScroll = () => {
      updateScrollState();
    };

    const onResize = () => {
      updateScrollState();
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });

    // Watch dynamic height changes (e.g. data loaded via fetch)
    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && document.body) {
      observer = new ResizeObserver(() => {
        updateScrollState();
      });
      observer.observe(document.body);
    }

    // Small delay to recheck after DOM finishes settling
    const timer = setTimeout(updateScrollState, 400);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      if (observer) observer.disconnect();
      clearTimeout(timer);
    };
  }, [pathname, updateScrollState]);

  const scrollToTop = () => {
    try {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "smooth",
      });
    } catch {
      window.scrollTo(0, 0);
    }
  };

  const scrollToBottom = () => {
    try {
      const scrollHeight = Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight,
        window.innerHeight
      );
      window.scrollTo({
        top: scrollHeight,
        left: 0,
        behavior: "smooth",
      });
    } catch {
      window.scrollTo(0, 999999);
    }
  };

  if (!mounted || !isScrollable) {
    return null;
  }

  return (
    <aside
      aria-label="Navigasi Scroll Halaman"
      className="fixed right-3.5 sm:right-6 bottom-20 md:bottom-8 z-40 flex flex-col items-center bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl p-1 gap-1 select-none animate-in fade-in zoom-in-95 duration-200 hover:border-slate-600 transition-all"
    >
      {/* Scroll to Top Button */}
      <button
        type="button"
        onClick={scrollToTop}
        disabled={isNearTop}
        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all ${
          isNearTop
            ? "text-slate-600 opacity-30 cursor-not-allowed"
            : "text-slate-300 hover:text-white hover:bg-rose-600 active:scale-95 shadow-sm"
        }`}
        title={isNearTop ? "Sudah di paling atas" : "Scroll ke Paling Atas"}
        aria-label="Scroll ke atas"
      >
        <ChevronUp className="w-5 h-5 stroke-[2.5]" />
      </button>

      {/* Progress & Divider */}
      <div className="flex flex-col items-center justify-center px-1 py-0.5 pointer-events-none">
        <span
          className="text-[9px] font-mono font-bold leading-none text-slate-400"
          title={`Posisi scroll: ${scrollPercent}%`}
        >
          {scrollPercent}%
        </span>
        <div className="w-4 h-[1px] bg-slate-800 mt-1" />
      </div>

      {/* Scroll to Bottom Button */}
      <button
        type="button"
        onClick={scrollToBottom}
        disabled={isNearBottom}
        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all ${
          isNearBottom
            ? "text-slate-600 opacity-30 cursor-not-allowed"
            : "text-slate-300 hover:text-white hover:bg-rose-600 active:scale-95 shadow-sm"
        }`}
        title={isNearBottom ? "Sudah di paling bawah" : "Scroll ke Paling Bawah"}
        aria-label="Scroll ke bawah"
      >
        <ChevronDown className="w-5 h-5 stroke-[2.5]" />
      </button>
    </aside>
  );
}
