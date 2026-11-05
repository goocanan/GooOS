"use client";

import React from "react";
import {
  BAMBULAB_LOGO,
  KREAFIL_LOGO,
  PRUSAMENT_LOGO,
  SUNLU_LOGO,
  POLYMAKER_LOGO,
  ELEGOO_LOGO,
  ESUN_LOGO,
  CREALITY_LOGO,
} from "@/lib/brand-logos-data";

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

  const dim =
    typeof size === "number"
      ? { width: Math.round(size * 2.2), height: size }
      : size === "sm"
      ? { width: 54, height: 26 }
      : size === "lg"
      ? { width: 108, height: 42 }
      : { width: 80, height: 34 }; // md default

  const roundedClass = size === "sm" ? "rounded-lg" : "rounded-xl";

  const cardBaseClass = `w-full h-full ${roundedClass} flex items-center justify-center px-1.5 py-0.5 border shadow-sm relative overflow-hidden transition-transform duration-200 hover:scale-[1.02]`;

  const renderBrandContent = () => {
    // 1. KREAfil (Official Uploaded Logo via direct Data URI)
    if (brandLower.includes("krea") || brandLower.includes("kreafil")) {
      return (
        <div
          className={`${cardBaseClass} bg-white border-slate-200/90`}
          title={showTooltip ? "KREAfil Filament" : undefined}
        >
          <img
            src={KREAFIL_LOGO}
            alt="KREAfil"
            className="max-h-full max-w-full object-contain select-none"
            draggable={false}
          />
        </div>
      );
    }

    // 2. Bambu Lab (Official Uploaded Logo via direct Data URI)
    if (brandLower.includes("bambu")) {
      return (
        <div
          className={`${cardBaseClass} bg-white border-slate-200/90`}
          title={showTooltip ? "Bambu Lab Filament" : undefined}
        >
          <img
            src={BAMBULAB_LOGO}
            alt="Bambu Lab"
            className="max-h-full max-w-full object-contain select-none"
            draggable={false}
          />
        </div>
      );
    }

    // 3. SUNLU (Official Uploaded Logo via direct Data URI)
    if (brandLower.includes("sunlu")) {
      return (
        <div
          className={`${cardBaseClass} bg-white border-slate-200/90`}
          title={showTooltip ? "SUNLU 3D Filament" : undefined}
        >
          <img
            src={SUNLU_LOGO}
            alt="SUNLU"
            className="max-h-full max-w-full object-contain select-none"
            draggable={false}
          />
        </div>
      );
    }

    // 4. Polymaker (Official Uploaded Logo via direct Data URI)
    if (brandLower.includes("poly") || brandLower.includes("polymaker")) {
      return (
        <div
          className={`${cardBaseClass} bg-white border-slate-200/90`}
          title={showTooltip ? "PolyMaker 3D Filament" : undefined}
        >
          <img
            src={POLYMAKER_LOGO}
            alt="PolyMaker"
            className="max-h-full max-w-full object-contain select-none"
            draggable={false}
          />
        </div>
      );
    }

    // 5. Prusament (Official Uploaded Logo via direct Data URI)
    if (brandLower.includes("prusa") || brandLower.includes("prusament")) {
      return (
        <div
          className={`${cardBaseClass} bg-black border-white/20`}
          title={showTooltip ? "Prusament by Josef Prusa" : undefined}
        >
          <img
            src={PRUSAMENT_LOGO}
            alt="PRUSAMENT"
            className="max-h-full max-w-full object-contain select-none"
            draggable={false}
          />
        </div>
      );
    }

    // 6. eSUN (Official Uploaded Logo via direct Data URI)
    if (brandLower.includes("esun") || brandLower.includes("e-sun") || brandLower.includes("e sun")) {
      return (
        <div
          className={`${cardBaseClass} bg-white border-slate-200/90`}
          title={showTooltip ? "eSUN 3D Filament" : undefined}
        >
          <img
            src={ESUN_LOGO}
            alt="eSUN"
            className="max-h-full max-w-full object-contain select-none"
            draggable={false}
          />
        </div>
      );
    }

    // 7. Creality (Official Uploaded Logo via direct Data URI)
    if (brandLower.includes("creality")) {
      return (
        <div
          className={`${cardBaseClass} bg-white border-slate-200/90`}
          title={showTooltip ? "Creality 3D" : undefined}
        >
          <img
            src={CREALITY_LOGO}
            alt="Creality"
            className="max-h-full max-w-full object-contain select-none"
            draggable={false}
          />
        </div>
      );
    }

    // 8. Elegoo (Official Uploaded Logo via direct Data URI)
    if (brandLower.includes("elegoo")) {
      return (
        <div
          className={`${cardBaseClass} bg-white border-slate-200/90`}
          title={showTooltip ? "ELEGOO 3D" : undefined}
        >
          <img
            src={ELEGOO_LOGO}
            alt="ELEGOO"
            className="max-h-full max-w-full object-contain select-none"
            draggable={false}
          />
        </div>
      );
    }

    // 9. Kingroon
    if (brandLower.includes("kingroon")) {
      return (
        <div
          className={`${cardBaseClass} bg-white border-slate-200/90`}
          title={showTooltip ? "Kingroon 3D" : undefined}
        >
          <span className="text-[9.5px] font-black text-[#dc2626] font-sans tracking-widest uppercase select-none">
            KINGROON
          </span>
        </div>
      );
    }

    // 10. Anycubic
    if (brandLower.includes("anycubic")) {
      return (
        <div
          className={`${cardBaseClass} bg-white border-slate-200/90`}
          title={showTooltip ? "Anycubic 3D" : undefined}
        >
          <span className="text-[9.5px] font-black text-[#1d4ed8] font-sans tracking-widest uppercase select-none">
            ANYCUBIC
          </span>
        </div>
      );
    }

    // 11. Flashforge
    if (brandLower.includes("flashforge")) {
      return (
        <div
          className={`${cardBaseClass} bg-white border-slate-200/90`}
          title={showTooltip ? "Flashforge 3D" : undefined}
        >
          <span className="text-[8.5px] font-black text-[#4338ca] font-sans tracking-wider uppercase select-none">
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
