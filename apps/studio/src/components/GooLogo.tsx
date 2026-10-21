"use client";

import React from "react";
import Image from "next/image";

export type GooLogoLayout = "horizontal" | "vertical" | "symbol" | "wordmark" | "app-icon";
export type GooIconVariant = "gradient" | "dark" | "light" | "simple";
export type GooLogoSize = "xs" | "sm" | "md" | "lg" | "xl" | number;

export interface GooLogoProps {
  layout?: GooLogoLayout;
  iconVariant?: GooIconVariant;
  size?: GooLogoSize;
  className?: string;
  showStudioBadge?: boolean;
  priority?: boolean;
}

interface SizeConfig {
  icon: number;
  text: string;
  sub: string;
}

const DEFAULT_SIZE: SizeConfig = { icon: 34, text: "text-base", sub: "text-[10px]" };

const SIZE_MAP: Record<"xs" | "sm" | "md" | "lg" | "xl", SizeConfig> = {
  xs: { icon: 20, text: "text-xs", sub: "text-[8px]" },
  sm: { icon: 26, text: "text-sm", sub: "text-[9px]" },
  md: { icon: 34, text: "text-base", sub: "text-[10px]" },
  lg: { icon: 48, text: "text-xl", sub: "text-xs" },
  xl: { icon: 72, text: "text-3xl", sub: "text-sm" },
};

function getSizeConfig(size?: GooLogoSize): SizeConfig {
  if (typeof size === "string" && size in SIZE_MAP) {
    return SIZE_MAP[size as keyof typeof SIZE_MAP];
  }
  return DEFAULT_SIZE;
}

export function GooAppIcon({
  variant = "gradient",
  size = 36,
  className = "",
  priority = false,
}: {
  variant?: GooIconVariant;
  size?: number;
  className?: string;
  priority?: boolean;
}) {
  const iconSrc = `/brand/app_icon_${variant}.png`;

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 rounded-2xl select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src={iconSrc}
        alt="GooOS App Icon"
        width={size * 2}
        height={size * 2}
        className="w-full h-full object-contain drop-shadow-md rounded-[22%]"
        priority={priority}
      />
    </div>
  );
}

export function GooSymbol({
  size = 34,
  className = "",
  priority = false,
}: {
  size?: number;
  className?: string;
  priority?: boolean;
}) {
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${className}`}
      style={{ width: size, height: size * (210 / 245) }}
    >
      <Image
        src="/brand/symbol_transparent.png"
        alt="GooOS Symbol"
        width={size * 2}
        height={Math.round(size * 2 * (210 / 245))}
        className="w-full h-full object-contain"
        priority={priority}
      />
    </div>
  );
}

export function GooWordmark({
  size = "md",
  className = "",
  theme = "dark",
}: {
  size?: GooLogoSize;
  className?: string;
  theme?: "dark" | "light";
}) {
  const sizeConfig = getSizeConfig(size);

  return (
    <span className={`inline-flex items-baseline font-black tracking-tight select-none ${sizeConfig.text} ${className}`}>
      <span className={theme === "light" ? "text-[#0A192F]" : "text-white"}>Goo</span>
      <span className="text-[#00C2FF] font-black">OS</span>
    </span>
  );
}

export function GooLogo({
  layout = "horizontal",
  iconVariant = "gradient",
  size = "md",
  className = "",
  showStudioBadge = false,
  priority = false,
}: GooLogoProps) {
  const isNumeric = typeof size === "number";
  const sizeConfig = getSizeConfig(size);
  const iconPx = isNumeric ? size : sizeConfig.icon;

  if (layout === "app-icon") {
    return <GooAppIcon variant={iconVariant} size={iconPx} className={className} priority={priority} />;
  }

  if (layout === "symbol") {
    return <GooSymbol size={iconPx} className={className} priority={priority} />;
  }

  if (layout === "wordmark") {
    return <GooWordmark size={size} className={className} />;
  }

  if (layout === "vertical") {
    return (
      <div className={`flex flex-col items-center text-center gap-3 select-none ${className}`}>
        <GooAppIcon variant={iconVariant} size={iconPx * 1.5} priority={priority} />
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1.5">
            <span className={`font-black tracking-tight text-white ${sizeConfig.text}`}>
              Goo<span className="text-[#00C2FF]">OS</span>
            </span>
            {showStudioBadge && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/25 uppercase tracking-widest font-mono">
                Studio
              </span>
            )}
          </div>
          <span className={`text-slate-400 font-mono -mt-0.5 ${sizeConfig.sub}`}>
            Unified Platform
          </span>
        </div>
      </div>
    );
  }

  // Default: Horizontal
  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <GooAppIcon variant={iconVariant} size={iconPx} priority={priority} />
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span className={`font-black tracking-tight text-white ${sizeConfig.text}`}>
            Goo<span className="text-[#00C2FF]">OS</span>
          </span>
          {showStudioBadge && (
            <span className="hidden sm:inline text-[9px] font-bold px-1.5 py-0.2 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/25 uppercase tracking-widest font-mono">
              Studio
            </span>
          )}
        </div>
        <span className={`hidden sm:inline text-slate-400 font-mono -mt-0.5 ${sizeConfig.sub}`}>
          Platform
        </span>
      </div>
    </div>
  );
}
