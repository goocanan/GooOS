/**
 * GooOS / GooFlow Core Pricing & Production Cost Calculation Engine
 * Centralized business logic for 3D Print Farm operations, pricing quotes, and real COGS (HPP).
 */

import type { LayerPricingConfig } from "@/hooks/use-goo-settings";

export type { LayerPricingConfig };

export interface FarmSettingsPricingContext {
  retailPricePerGram?: number;
  retailPricePerHour?: number;
  electricityCostPerKwh?: number;
  printerPowerWatt?: number;
  wearCostPerHour?: number;
  operatorCostPerHour?: number;
  operatorMinutesPerJob?: number;
  defaultMarketplaceFeePercent?: number;
  layerPricing?: LayerPricingConfig;
  [key: string]: any;
}

/**
 * Currency formatter for Indonesian Rupiah
 */
export const formatIDR = (val: number): string =>
  "Rp " + Math.round(val || 0).toLocaleString("id-ID");

/**
 * Standardize material names for quotation and customer-facing views
 */
export const normalizeQuotationMaterialName = (mat?: string | null): string => {
  const m = String(mat || "PLA").trim();
  if (m.toUpperCase().includes("PLA")) {
    return "PLA+";
  }
  return m;
};

/**
 * Get unit price per marketplace unit based on layer height and material type
 */
export const getLayerUnitPrice = (
  layerHeight: string | number,
  materialType: string = "PLA",
  layerPricing?: LayerPricingConfig
): number => {
  const num = Number(layerHeight);
  const mat = String(materialType || "PLA").toUpperCase();

  if (mat.includes("PETG")) {
    if (num <= 0.12) return layerPricing?.petg?.fine ?? 1900;
    if (num <= 0.22) return layerPricing?.petg?.standard ?? 1100;
    return layerPricing?.petg?.draft ?? 1000;
  }
  if (mat.includes("TPU")) {
    if (num <= 0.12) return layerPricing?.tpu?.fine ?? 2500;
    if (num <= 0.22) return layerPricing?.tpu?.standard ?? 2200;
    return layerPricing?.tpu?.draft ?? 2000;
  }
  // PLA / PLA+ / Default
  if (num <= 0.12) return layerPricing?.pla?.fine ?? 1800;
  if (num <= 0.22) return layerPricing?.pla?.standard ?? 1000;
  return layerPricing?.pla?.draft ?? 800;
};

/**
 * Calculate base print price from weight (grams) and printing duration (hours)
 */
export const getBasePrintPrice = (
  weight: number,
  time: number,
  rateGr = 400,
  rateHr = 3000
): number => Number(weight) * rateGr + Number(time) * rateHr;

/**
 * Convert base price to marketplace quantity units (each unit = Rp 1,000)
 */
export const getMarketplaceUnits = (basePrice: number): number => {
  const numeric = Number(basePrice || 0);
  if (numeric <= 0) return 0;
  return Math.max(1, Math.round(numeric / 1000));
};

/**
 * Calculate layer-adjusted marketplace selling price
 */
export const getLayerAdjustedPrice = (
  weight: number,
  time: number,
  qtyOrder: number,
  layerHeight: string | number,
  rateGr = 400,
  rateHr = 3000,
  materialType = "PLA",
  layerPricing?: LayerPricingConfig
): number => {
  const basePrice = getBasePrintPrice(weight, time, rateGr, rateHr);
  const units = getMarketplaceUnits(basePrice);
  return (
    units *
    getLayerUnitPrice(layerHeight, materialType, layerPricing) *
    Number(qtyOrder || 1)
  );
};
