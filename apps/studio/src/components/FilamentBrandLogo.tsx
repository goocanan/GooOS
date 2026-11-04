"use client";

import React, { useState, useEffect } from "react";

export type FilamentBrandLogoSize = "sm" | "md" | "lg" | number;

interface FilamentBrandLogoProps {
  brand?: string | null;
  size?: FilamentBrandLogoSize;
  className?: string;
  showTooltip?: boolean;
}

export function FilamentBrandLogo({
  brand,
  size = "md",
  className = "",
  showTooltip = true,
}: FilamentBrandLogoProps) {
  const brandName = (brand || "Generic").trim();
  const brandLower = brandName.toLowerCase();
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [brandName]);

  const dim =
    typeof size === "number"
      ? { width: Math.round(size * 1.55), height: size }
      : size === "sm"
      ? { width: 48, height: 28 }
      : size === "lg"
      ? { width: 80, height: 48 }
      : { width: 64, height: 40 }; // md default

  const roundedClass = size === "sm" ? "rounded-xl" : "rounded-2xl";

  // Helper to render official image logo with graceful vector fallback
  const renderImageBadge = (
    src: string,
    alt: string,
    bgColor: string,
    borderColor: string,
    titleText: string,
    fallback: () => React.ReactNode,
    extraImgClass: string = ""
  ) => {
    if (imgFailed) {
      return fallback();
    }
    return (
      <div
        className={`w-full h-full ${roundedClass} flex items-center justify-center p-1.5 border shadow-sm relative overflow-hidden transition-transform duration-200 hover:scale-[1.02] ${bgColor} ${borderColor}`}
        title={showTooltip ? titleText : undefined}
      >
        <img
          src={src}
          alt={alt}
          className={`max-h-full max-w-full object-contain select-none ${extraImgClass}`}
          onError={() => setImgFailed(true)}
          draggable={false}
        />
      </div>
    );
  };

  // Fallback Vectors / Glyphs
  const fallbackKreafil = () => (
    <div
      className={`w-full h-full ${roundedClass} flex flex-col items-center justify-center p-1 border shadow-md relative overflow-hidden bg-white border-slate-200/90`}
      title={showTooltip ? "KREAfil Filament" : undefined}
    >
      <div className="flex items-baseline tracking-tighter">
        <span className="text-[11px] font-black text-black font-sans tracking-widest">KREA</span>
        <span className="text-[12px] font-black text-red-600 font-sans tracking-tight">fil</span>
      </div>
    </div>
  );

  const fallbackBambu = () => (
    <div
      className={`w-full h-full ${roundedClass} flex flex-col items-center justify-center p-1 border shadow-md relative overflow-hidden bg-[#02200d] border-emerald-500/40`}
      title={showTooltip ? "Bambu Lab Filament" : undefined}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 via-transparent to-emerald-500/10 pointer-events-none" />
      <svg viewBox="0 0 40 40" className="w-full h-full max-w-[28px] max-h-[28px]">
        <rect x="7" y="14" width="5" height="18" rx="2" fill="#00AE42" transform="rotate(-15 9.5 23)" />
        <rect x="14" y="9" width="5.5" height="23" rx="2" fill="#00AE42" transform="rotate(-15 16.75 20.5)" />
        <rect x="22" y="9" width="5.5" height="23" rx="2" fill="#00AE42" transform="rotate(-15 24.75 20.5)" />
        <rect x="30" y="14" width="5" height="18" rx="2" fill="#00AE42" transform="rotate(-15 32.5 23)" />
      </svg>
      <span className="text-[6.5px] font-black tracking-tighter text-emerald-300 font-sans uppercase -mt-0.5">
        BAMBU
      </span>
    </div>
  );

  const fallbackSunlu = () => (
    <div
      className={`w-full h-full ${roundedClass} flex flex-col items-center justify-center p-1 border shadow-md relative overflow-hidden bg-white border-slate-200/90`}
      title={showTooltip ? "SUNLU Filament" : undefined}
    >
      <span className="text-[11px] font-black tracking-widest text-[#009fb2] font-sans">
        SUNLU
      </span>
    </div>
  );

  const fallbackPolymaker = () => (
    <div
      className={`w-full h-full ${roundedClass} flex flex-col items-center justify-center p-1 border shadow-md relative overflow-hidden bg-white border-slate-200/90`}
      title={showTooltip ? "PolyMaker 3D" : undefined}
    >
      <span className="text-[9px] font-black tracking-wider text-[#00b8c4] font-sans lowercase">
        polymaker
      </span>
    </div>
  );

  const fallbackPrusament = () => (
    <div
      className={`w-full h-full ${roundedClass} flex flex-col items-center justify-center p-1 border shadow-md relative overflow-hidden bg-black border-white/20`}
      title={showTooltip ? "Prusament" : undefined}
    >
      <span className="text-[8px] font-black tracking-widest text-white font-sans uppercase">
        PRUSAMENT
      </span>
    </div>
  );

  // Render specific brand SVG or image badge
  const renderBrandContent = () => {
    // 1. KREAfil (Official Image)
    if (brandLower.includes("krea") || brandLower.includes("kreafil")) {
      return renderImageBadge(
        "/brands/filament/kreafil.png",
        "KREAfil",
        "bg-white",
        "border-slate-200/90",
        "KREAfil Filament",
        fallbackKreafil
      );
    }

    // 2. Bambu Lab (Official Image)
    if (brandLower.includes("bambu")) {
      return renderImageBadge(
        "/brands/filament/bambulab.png",
        "Bambu Lab",
        "bg-white",
        "border-slate-200/90",
        "Bambu Lab Filament",
        fallbackBambu
      );
    }

    // 3. SUNLU (Official Image)
    if (brandLower.includes("sunlu")) {
      return renderImageBadge(
        "/brands/filament/sunlu.png",
        "SUNLU",
        "bg-white",
        "border-slate-200/90",
        "SUNLU 3D Filament",
        fallbackSunlu
      );
    }

    // 4. Polymaker (Official Image)
    if (brandLower.includes("poly") || brandLower.includes("polymaker")) {
      return renderImageBadge(
        "/brands/filament/polymaker.png",
        "PolyMaker",
        "bg-white",
        "border-slate-200/90",
        "PolyMaker 3D Filament",
        fallbackPolymaker
      );
    }

    // 5. Prusament (Official Image)
    if (brandLower.includes("prusa") || brandLower.includes("prusament")) {
      return renderImageBadge(
        "/brands/filament/prusament.png",
        "PRUSAMENT",
        "bg-black",
        "border-white/20",
        "Prusament by Josef Prusa",
        fallbackPrusament
      );
    }

    // 6. eSUN
    if (brandLower.includes("esun")) {
      return (
        <div
          className={`w-full h-full ${roundedClass} flex flex-col items-center justify-center p-1 border shadow-md relative overflow-hidden`}
          style={{
            backgroundColor: "#03231d",
            borderColor: "rgba(16, 185, 129, 0.4)",
          }}
          title={showTooltip ? "eSUN 3D Filament" : undefined}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-transparent to-teal-500/10 pointer-events-none" />
          <svg viewBox="0 0 48 48" className="w-full h-full max-w-[26px] max-h-[26px]">
            <circle cx="24" cy="24" r="20" fill="none" stroke="#10b981" strokeWidth="2.5" strokeDasharray="95 30" />
            <path
              d="M15 25 C15 18, 28 17, 28 22 C28 26, 17 26, 17 29 C17 32, 33 32, 33 27"
              fill="none"
              stroke="#34d399"
              strokeWidth="3.2"
              strokeLinecap="round"
            />
            <circle cx="24" cy="17" r="2.5" fill="#6ee7b7" />
          </svg>
          <span className="text-[7px] font-black tracking-tighter text-emerald-300 font-sans uppercase -mt-0.5">
            eSUN
          </span>
        </div>
      );
    }

    // 7. Creality
    if (brandLower.includes("creality")) {
      return (
        <div
          className={`w-full h-full ${roundedClass} flex flex-col items-center justify-center p-1 border shadow-md relative overflow-hidden`}
          style={{
            backgroundColor: "#02162e",
            borderColor: "rgba(56, 189, 248, 0.45)",
          }}
          title={showTooltip ? "Creality 3D" : undefined}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-sky-500/20 via-transparent to-blue-500/10 pointer-events-none" />
          <svg viewBox="0 0 44 44" className="w-full h-full max-w-[26px] max-h-[26px]">
            <polygon points="22,6 36,15 36,29 22,38 8,29 8,15" fill="none" stroke="#38bdf8" strokeWidth="2.5" />
            <polyline points="22,6 22,38" fill="none" stroke="#0ea5e9" strokeWidth="2" />
            <polyline points="36,15 22,24 8,15" fill="none" stroke="#0ea5e9" strokeWidth="2" />
            <polyline points="36,29 22,24 8,29" fill="none" stroke="#0ea5e9" strokeWidth="2" />
          </svg>
          <span className="text-[6.5px] font-black tracking-tighter text-sky-300 font-sans uppercase -mt-0.5">
            CREALITY
          </span>
        </div>
      );
    }

    // 8. Kingroon
    if (brandLower.includes("kingroon")) {
      return (
        <div
          className={`w-full h-full ${roundedClass} flex flex-col items-center justify-center p-1 border shadow-md relative overflow-hidden`}
          style={{
            backgroundColor: "#290505",
            borderColor: "rgba(239, 68, 68, 0.45)",
          }}
          title={showTooltip ? "Kingroon 3D" : undefined}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-rose-500/20 via-transparent to-red-500/10 pointer-events-none" />
          <svg viewBox="0 0 44 44" className="w-full h-full max-w-[26px] max-h-[26px]">
            <polygon points="10,29 10,17 17,23 22,12 27,23 34,17 34,29" fill="#ef4444" stroke="#fca5a5" strokeWidth="1.5" />
            <circle cx="10" cy="15" r="2" fill="#fbbf24" />
            <circle cx="22" cy="10" r="2" fill="#fbbf24" />
            <circle cx="34" cy="15" r="2" fill="#fbbf24" />
            <rect x="10" y="30" width="24" height="3" rx="1.5" fill="#fbbf24" />
          </svg>
          <span className="text-[6.5px] font-black tracking-tighter text-rose-300 font-sans uppercase -mt-0.5">
            KINGROON
          </span>
        </div>
      );
    }

    // 9. Anycubic
    if (brandLower.includes("anycubic")) {
      return (
        <div
          className={`w-full h-full ${roundedClass} flex flex-col items-center justify-center p-1 border shadow-md relative overflow-hidden`}
          style={{
            backgroundColor: "#03142e",
            borderColor: "rgba(59, 130, 246, 0.45)",
          }}
          title={showTooltip ? "Anycubic" : undefined}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-transparent to-cyan-500/10 pointer-events-none" />
          <svg viewBox="0 0 44 44" className="w-full h-full max-w-[26px] max-h-[26px]">
            <path d="M22 8 L35 15 L22 22 L9 15 Z" fill="#60a5fa" />
            <path d="M9 16 L22 23 L22 36 L9 29 Z" fill="#2563eb" />
            <path d="M22 23 L35 16 L35 29 L22 36 Z" fill="#1d4ed8" />
          </svg>
          <span className="text-[6.5px] font-black tracking-tighter text-blue-300 font-sans uppercase -mt-0.5">
            ANYCUBIC
          </span>
        </div>
      );
    }

    // 10. Elegoo
    if (brandLower.includes("elegoo")) {
      return (
        <div
          className={`w-full h-full ${roundedClass} flex flex-col items-center justify-center p-1 border shadow-md relative overflow-hidden`}
          style={{
            backgroundColor: "#0d1a33",
            borderColor: "rgba(96, 165, 250, 0.45)",
          }}
          title={showTooltip ? "ELEGOO" : undefined}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-transparent to-sky-500/10 pointer-events-none" />
          <svg viewBox="0 0 44 44" className="w-full h-full max-w-[26px] max-h-[26px]">
            <ellipse cx="22" cy="22" rx="16" ry="7" fill="none" stroke="#60a5fa" strokeWidth="2.5" transform="rotate(-25 22 22)" />
            <circle cx="22" cy="22" r="7" fill="#3b82f6" />
          </svg>
          <span className="text-[6.5px] font-black tracking-tighter text-blue-300 font-sans uppercase -mt-0.5">
            ELEGOO
          </span>
        </div>
      );
    }

    // 11. Flashforge
    if (brandLower.includes("flashforge")) {
      return (
        <div
          className={`w-full h-full ${roundedClass} flex flex-col items-center justify-center p-1 border shadow-md relative overflow-hidden`}
          style={{
            backgroundColor: "#0f172a",
            borderColor: "rgba(59, 130, 246, 0.45)",
          }}
          title={showTooltip ? "Flashforge" : undefined}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-transparent to-blue-500/10 pointer-events-none" />
          <svg viewBox="0 0 44 44" className="w-full h-full max-w-[26px] max-h-[26px]">
            <polygon points="12,10 32,10 26,18 18,18 16,24 24,24 20,32 10,32" fill="#3b82f6" />
          </svg>
          <span className="text-[6px] font-black tracking-tighter text-blue-300 font-sans uppercase -mt-0.5">
            FLASHFORGE
          </span>
        </div>
      );
    }

    // Default: Generic / Custom Spool Badge
    const initials = brandName
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 3)
      .toUpperCase();

    return (
      <div
        className={`w-full h-full ${roundedClass} flex flex-col items-center justify-center p-1 border shadow-md relative overflow-hidden bg-slate-900 border-slate-700/80`}
        title={showTooltip ? brandName : undefined}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-slate-700/20 via-transparent to-slate-900/60 pointer-events-none" />
        <svg viewBox="0 0 44 44" className="w-full h-full max-w-[22px] max-h-[22px]">
          <ellipse cx="22" cy="15" rx="14" ry="5" fill="none" stroke="#94a3b8" strokeWidth="2.2" />
          <ellipse cx="22" cy="29" rx="14" ry="5" fill="none" stroke="#64748b" strokeWidth="2.2" />
          <line x1="8" y1="15" x2="8" y2="29" stroke="#94a3b8" strokeWidth="2.2" />
          <line x1="36" y1="15" x2="36" y2="29" stroke="#94a3b8" strokeWidth="2.2" />
          <ellipse cx="22" cy="22" rx="7" ry="2.5" fill="#f43f5e" />
        </svg>
        <span className="text-[7px] font-black tracking-wider text-slate-300 font-mono uppercase truncate max-w-[42px]">
          {initials || "GEN"}
        </span>
      </div>
    );
  };

  return (
    <div
      className={`shrink-0 select-none ${className}`}
      style={{ width: dim.width, height: dim.height }}
    >
      {renderBrandContent()}
    </div>
  );
}
