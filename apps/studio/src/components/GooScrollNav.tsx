"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import { ChevronUp, ChevronDown } from "lucide-react";

export function GooScrollNav() {
  const [mounted, setMounted] = useState(false);
  const [scrollDirection, setScrollDirection] = useState<"up" | "down" | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [scrollPercent, setScrollPercent] = useState(0);

  const lastScrollYRef = useRef(0);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isHoveredRef = useRef(false);
  const pathname = usePathname();

  const handleScroll = useCallback(() => {
    if (typeof window === "undefined") return;

    const currentScrollY =
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

    // If page is not scrollable, do not show anything
    if (maxScroll <= 80) {
      setIsVisible(false);
      setScrollDirection(null);
      return;
    }

    const percent = maxScroll > 0 ? Math.min(100, Math.max(0, Math.round((currentScrollY / maxScroll) * 100))) : 0;
    setScrollPercent(percent);

    const diff = currentScrollY - lastScrollYRef.current;
    const isNearTop = currentScrollY <= 60;
    const isNearBottom = currentScrollY >= maxScroll - 60;

    // Detect significant scroll direction (threshold of 4px to avoid micro-jitter)
    if (Math.abs(diff) >= 4) {
      if (diff > 0) {
        // Scrolling DOWN -> show only Scroll to Bottom (unless already at bottom)
        if (!isNearBottom) {
          setScrollDirection("down");
          setIsVisible(true);
        } else {
          setIsVisible(false);
        }
      } else {
        // Scrolling UP -> show only Scroll to Top (unless already at top)
        if (!isNearTop) {
          setScrollDirection("up");
          setIsVisible(true);
        } else {
          setIsVisible(false);
        }
      }

      // Reset auto-hide timer (fade out after 2.5s of inactivity if not hovered)
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
      hideTimeoutRef.current = setTimeout(() => {
        if (!isHoveredRef.current) {
          setIsVisible(false);
        }
      }, 2500);
    }

    lastScrollYRef.current = currentScrollY;
  }, []);

  useEffect(() => {
    setMounted(true);
    lastScrollYRef.current = window.scrollY || 0;

    const onScroll = () => {
      handleScroll();
    };

    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, [pathname, handleScroll]);

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
    // Gently hide after clicking
    setTimeout(() => setIsVisible(false), 300);
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
    // Gently hide after clicking
    setTimeout(() => setIsVisible(false), 300);
  };

  if (!mounted || !scrollDirection) {
    return null;
  }

  const isUp = scrollDirection === "up";

  return (
    <aside
      aria-label="Navigasi Arah Scroll Halaman"
      onMouseEnter={() => {
        isHoveredRef.current = true;
        if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
      }}
      onMouseLeave={() => {
        isHoveredRef.current = false;
        if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = setTimeout(() => {
          setIsVisible(false);
        }, 1500);
      }}
      className={`fixed right-3.5 sm:right-6 bottom-20 md:bottom-8 z-40 select-none transition-all duration-300 ease-out transform ${
        isVisible
          ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
          : "opacity-0 translate-y-3 scale-90 pointer-events-none"
      }`}
    >
      {isUp ? (
        // Only Scroll to Top button when scrolling up
        <button
          type="button"
          onClick={scrollToTop}
          className="group flex items-center gap-1.5 px-3 py-2.5 sm:px-3.5 sm:py-3 rounded-2xl bg-slate-900/95 hover:bg-rose-600 text-slate-200 hover:text-white border border-slate-700/80 hover:border-rose-500 backdrop-blur-xl shadow-2xl transition-all active:scale-95 hover:scale-105"
          title="Scroll ke Paling Atas"
          aria-label="Scroll ke atas"
        >
          <ChevronUp className="w-5 h-5 stroke-[2.5] group-hover:-translate-y-0.5 transition-transform" />
          <span className="text-xs font-bold hidden sm:inline">Ke Atas</span>
          <span className="text-[10px] font-mono opacity-70 group-hover:opacity-100">
            {scrollPercent}%
          </span>
        </button>
      ) : (
        // Only Scroll to Bottom button when scrolling down
        <button
          type="button"
          onClick={scrollToBottom}
          className="group flex items-center gap-1.5 px-3 py-2.5 sm:px-3.5 sm:py-3 rounded-2xl bg-slate-900/95 hover:bg-rose-600 text-slate-200 hover:text-white border border-slate-700/80 hover:border-rose-500 backdrop-blur-xl shadow-2xl transition-all active:scale-95 hover:scale-105"
          title="Scroll ke Paling Bawah"
          aria-label="Scroll ke bawah"
        >
          <ChevronDown className="w-5 h-5 stroke-[2.5] group-hover:translate-y-0.5 transition-transform" />
          <span className="text-xs font-bold hidden sm:inline">Ke Bawah</span>
          <span className="text-[10px] font-mono opacity-70 group-hover:opacity-100">
            {scrollPercent}%
          </span>
        </button>
      )}
    </aside>
  );
}
