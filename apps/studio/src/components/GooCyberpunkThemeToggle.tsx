"use client";

import { useState, useEffect } from "react";
import { Zap, Moon, Sparkles } from "lucide-react";

export function GooCyberpunkThemeToggle() {
  const [isCyberpunk, setIsCyberpunk] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("goo-oled-cyberpunk");
    // Default to true or check saved preference
    const enabled = saved === "true" || saved === null; // enable by default for this testing session!
    setIsCyberpunk(enabled);
    if (enabled) {
      document.documentElement.classList.add("theme-oled-cyberpunk");
    } else {
      document.documentElement.classList.remove("theme-oled-cyberpunk");
    }
  }, []);

  const toggleTheme = () => {
    const nextState = !isCyberpunk;
    setIsCyberpunk(nextState);
    localStorage.setItem("goo-oled-cyberpunk", String(nextState));

    if (nextState) {
      document.documentElement.classList.add("theme-oled-cyberpunk");
    } else {
      document.documentElement.classList.remove("theme-oled-cyberpunk");
    }
  };

  if (!mounted) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50">
      <button
        onClick={toggleTheme}
        aria-label="Toggle OLED Cyberpunk Mode"
        className={`group flex items-center gap-2 px-3.5 py-2 rounded-full font-mono text-xs font-bold transition-all duration-300 shadow-2xl backdrop-blur-md border ${
          isCyberpunk
            ? "bg-black/90 text-[#00F0FF] border-[#00F0FF]/60 shadow-[0_0_20px_rgba(0,240,255,0.4)] hover:shadow-[0_0_25px_rgba(0,240,255,0.6)]"
            : "bg-slate-900/90 text-slate-300 border-slate-700 hover:border-slate-500 hover:text-white"
        }`}
      >
        <span
          className={`flex h-2 w-2 rounded-full ${
            isCyberpunk ? "bg-[#00FF66] animate-ping" : "bg-slate-500"
          }`}
        />
        <span className="flex items-center gap-1.5">
          <Zap
            className={`w-3.5 h-3.5 ${
              isCyberpunk ? "text-[#00F0FF] fill-[#00F0FF]" : "text-amber-400"
            }`}
          />
          <span>{isCyberpunk ? "OLED CYBERPUNK: ON" : "OLED CYBERPUNK: OFF"}</span>
        </span>
      </button>
    </div>
  );
}
