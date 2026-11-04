/**
 * Filament SKU, Grouping, Brands and Color Utilities for Goocanan GooOS 3DFlow
 */

export interface CommonFilamentColor {
  name: string;      // English name e.g. "Black", "White"
  hex: string;       // Hex e.g. "#111827"
  labelIndo: string; // Indonesian label e.g. "Hitam"
}

export const COMMON_FILAMENT_BRANDS: string[] = [
  "eSUN",
  "Sunlu",
  "Bambu Lab",
  "Polymaker",
  "KREAfil",
  "Prusament",
  "Creality",
  "Kingroon",
  "Anycubic",
  "Flashforge",
  "Elegoo",
  "Overture",
  "Jayo",
  "Eryone",
];

export const COMMON_FILAMENT_COLORS: CommonFilamentColor[] = [
  { name: "Black", hex: "#111827", labelIndo: "Hitam" },
  { name: "White", hex: "#f8fafc", labelIndo: "Putih" },
  { name: "Grey", hex: "#64748b", labelIndo: "Abu-abu" },
  { name: "Red", hex: "#ef4444", labelIndo: "Merah" },
  { name: "Blue", hex: "#3b82f6", labelIndo: "Biru" },
  { name: "Green", hex: "#10b981", labelIndo: "Hijau" },
  { name: "Yellow", hex: "#eab308", labelIndo: "Kuning" },
  { name: "Orange", hex: "#f97316", labelIndo: "Oranye" },
  { name: "Purple", hex: "#8b5cf6", labelIndo: "Ungu" },
  { name: "Pink", hex: "#ec4899", labelIndo: "Pink / Merah Muda" },
  { name: "Brown", hex: "#78350f", labelIndo: "Cokelat" },
  { name: "Cyan", hex: "#06b6d4", labelIndo: "Cyan / Biru Muda" },
  { name: "Gold", hex: "#d97706", labelIndo: "Emas / Gold" },
  { name: "Silver", hex: "#94a3b8", labelIndo: "Perak / Silver" },
  { name: "Clear", hex: "#e2e8f0", labelIndo: "Transparan / Bening" },
];

/**
 * Standardized Sequential SKU Generator
 * Format: [BRAND_CODE]-[MATERIAL]-[COLOR_CODE]-[SEQ_3DIGITS]
 * Example: ESUN-PLA-BLK-001, SUNLU-PETG-WHT-002
 */
export function generateSpoolSku(
  brand: string,
  materialType: string,
  color: string,
  seq: number
): string {
  const b = (brand || "GEN")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .substring(0, 5) || "GEN";

  const m = (materialType || "PLA")
    .toUpperCase()
    .replace(/\+/g, "P")
    .replace(/[^A-Z0-9]/g, "")
    .substring(0, 4) || "PLA";

  const c = (color || "DEF")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .substring(0, 3) || "DEF";

  const s = String(seq).padStart(3, "0");
  return `${b}-${m}-${c}-${s}`;
}

export function getFilamentGroupKey(
  brand: string,
  materialType: string,
  color: string
): string {
  const b = (brand || "Generic").trim().toUpperCase();
  const m = (materialType || "PLA").trim().toUpperCase();
  const c = (color || "Black").trim().toUpperCase();
  return `${b}|${m}|${c}`;
}
