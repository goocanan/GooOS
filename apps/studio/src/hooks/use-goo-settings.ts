"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface SpoolTareWeight {
  id: string;
  brand: string;
  type: string;
  emptyWeight: number; // grams
}

export interface GooSettings {
  // 🌐 GooOS System
  studioName: string;
  ownerName: string;
  ownerEmail: string;
  currency: "IDR (Rp)" | "USD ($)";
  language: "id" | "en";
  telemetryRefreshInterval: number; // seconds
  audioAlerts: boolean;

  // ⚡ 3DFlow (Farm & Produksi)
  electricityCostPerKwh: number; // Rp / kWh
  printerPowerWatt: number; // Watt
  wearCostPerHour: number; // Rp / jam
  retailPricePerGram: number; // Rp / gram
  retailPricePerHour: number; // Rp / jam
  lowStockThreshold: number; // gram
  tokopediaLink: string;
  shopeeLink: string;
  spoolWeights: SpoolTareWeight[];

  // 📐 GOO-Studio (Desain & Batching)
  operatorCostPerHour: number; // Rp / jam
  operatorMinutesPerJob: number; // menit
  investmentCostTotal: number; // Rp printer
  investmentPaybackMonths: number; // bulan
  monthlyPrintHours: number; // jam
  defaultMarginPercent: number; // %
  batchBedMargin: number; // mm
  batchPartSpacing: number; // mm

  // 🎨 GooPrint (CAD Studio)
  cadUnits: "mm" | "cm" | "inch";
  cadGridVisible: boolean;
  cadGridSnap: boolean;
  cadShading: "pbr" | "wireframe" | "matcap";
  cadExportTolerance: "fine" | "standard" | "coarse";
  cadAutoRotate: boolean;
}

export const DEFAULT_GOO_SETTINGS: GooSettings = {
  // GooOS System
  studioName: "Goocanan 3D Lab & Studio",
  ownerName: "Admin Studio",
  ownerEmail: "studio@goocanan.com",
  currency: "IDR (Rp)",
  language: "id",
  telemetryRefreshInterval: 10,
  audioAlerts: true,

  // 3DFlow
  electricityCostPerKwh: 1500,
  printerPowerWatt: 150,
  wearCostPerHour: 500,
  retailPricePerGram: 400,
  retailPricePerHour: 3000,
  lowStockThreshold: 200,
  tokopediaLink: "https://tokopedia.com/goocanan",
  shopeeLink: "https://shopee.co.id/goocanan",
  spoolWeights: [
    { id: "spool-1", brand: "eSun", type: "Plastic", emptyWeight: 220 },
    { id: "spool-2", brand: "Sunlu", type: "Plastic", emptyWeight: 140 },
    { id: "spool-3", brand: "Bambu Lab", type: "Reusable High-Temp", emptyWeight: 250 },
    { id: "spool-4", brand: "Polymaker", type: "Cardboard", emptyWeight: 180 },
    { id: "spool-5", brand: "Creality", type: "Plastic", emptyWeight: 210 },
  ],

  // GOO-Studio
  operatorCostPerHour: 25000,
  operatorMinutesPerJob: 10,
  investmentCostTotal: 5000000,
  investmentPaybackMonths: 12,
  monthlyPrintHours: 150,
  defaultMarginPercent: 50,
  batchBedMargin: 10,
  batchPartSpacing: 5,

  // GooPrint
  cadUnits: "mm",
  cadGridVisible: true,
  cadGridSnap: true,
  cadShading: "pbr",
  cadExportTolerance: "fine",
  cadAutoRotate: false,
};

const STORAGE_KEY = "gooos_settings";
const LEGACY_DFLOW_KEY = "dflow_settings";

export function useGooSettings() {
  const [settings, setSettings] = useState<GooSettings>(DEFAULT_GOO_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Initial Load from LocalStorage + Server DB
  useEffect(() => {
    try {
      let initial = { ...DEFAULT_GOO_SETTINGS };

      // Cek localStorage GooOS
      const savedGoo = localStorage.getItem(STORAGE_KEY);
      if (savedGoo) {
        try {
          const parsed = JSON.parse(savedGoo);
          initial = { ...initial, ...parsed };
        } catch (e) {
          console.error("GooSettings parse error:", e);
        }
      }

      // Cek legacy 3DFlow settings untuk backward compatibility
      const savedLegacy = localStorage.getItem(LEGACY_DFLOW_KEY);
      if (savedLegacy) {
        try {
          const legacy = JSON.parse(savedLegacy);
          if (legacy.electricityPrice) initial.electricityCostPerKwh = Number(legacy.electricityPrice);
          if (legacy.printerPowerWatt) initial.printerPowerWatt = Number(legacy.printerPowerWatt);
          if (legacy.wearCostPerHour) initial.wearCostPerHour = Number(legacy.wearCostPerHour);
          if (legacy.retailPricePerGram) initial.retailPricePerGram = Number(legacy.retailPricePerGram);
          if (legacy.retailPricePerHour) initial.retailPricePerHour = Number(legacy.retailPricePerHour);
          if (legacy.tokopediaLink) initial.tokopediaLink = legacy.tokopediaLink;
          if (legacy.shopeeLink) initial.shopeeLink = legacy.shopeeLink;
          if (Array.isArray(legacy.spoolWeights) && legacy.spoolWeights.length > 0) {
            initial.spoolWeights = legacy.spoolWeights;
          }
        } catch (e) {
          console.error("Legacy 3DFlow parse error:", e);
        }
      }

      setSettings(initial);
      setIsLoaded(true);

      // Sinkronkan dengan data database Supabase secara asynchronous
      fetch("/api/flow/settings")
        .then((res) => (res.ok ? res.json() : null))
        .then((json) => {
          if (json?.success && json.data) {
            const dbData = json.data;
            setSettings((prev) => {
              const merged: GooSettings = {
                ...prev,
                electricityCostPerKwh: dbData.electricityCostPerKwh ?? prev.electricityCostPerKwh,
                printerPowerWatt: dbData.printerPowerWatt ?? prev.printerPowerWatt,
                operatorCostPerHour: dbData.operatorCostPerHour ?? prev.operatorCostPerHour,
                defaultMarginPercent: dbData.defaultMarginPercent ?? prev.defaultMarginPercent,
                investmentCostTotal: dbData.investmentCostTotal ?? prev.investmentCostTotal,
                investmentPaybackMonths: dbData.investmentPaybackMonths ?? prev.investmentPaybackMonths,
                monthlyPrintHours: dbData.monthlyPrintHours ?? prev.monthlyPrintHours,
                lowStockThreshold: dbData.lowStockThreshold ?? prev.lowStockThreshold,
              };
              localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
              return merged;
            });
          }
        })
        .catch((err) => {
          console.warn("Could not sync settings from DB:", err);
        });
    } catch (e) {
      console.error("useGooSettings init error:", e);
      setIsLoaded(true);
    }
  }, []);

  // 2. Listen to cross-component settings updates
  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<GooSettings>;
      if (customEvent.detail) {
        setSettings(customEvent.detail);
      }
    };
    window.addEventListener("gooos_settings_changed", handleUpdate);
    return () => window.removeEventListener("gooos_settings_changed", handleUpdate);
  }, []);

  // 3. Update Settings function with Debounced DB Sync
  const updateSettings = useCallback(
    (partial: Partial<GooSettings>) => {
      setSettings((prev) => {
        const next: GooSettings = { ...prev, ...partial };

        // Save immediately to localStorage
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));

          // Also write back to legacy dflow_settings so older 3DFlow components stay synced
          const dflowFormat = {
            electricityPrice: next.electricityCostPerKwh,
            printerPowerWatt: next.printerPowerWatt,
            wearCostPerHour: next.wearCostPerHour,
            retailPricePerGram: next.retailPricePerGram,
            retailPricePerHour: next.retailPricePerHour,
            tokopediaLink: next.tokopediaLink,
            shopeeLink: next.shopeeLink,
            spoolWeights: next.spoolWeights,
          };
          localStorage.setItem(LEGACY_DFLOW_KEY, JSON.stringify(dflowFormat));
        } catch (err) {
          console.error("Failed saving to localStorage:", err);
        }

        // Notify other components immediately
        window.dispatchEvent(
          new CustomEvent("gooos_settings_changed", { detail: next })
        );

        // Debounce DB sync to avoid spamming the database
        setIsSyncing(true);
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
        debounceTimerRef.current = setTimeout(async () => {
          try {
            await fetch("/api/flow/settings", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                electricityCostPerKwh: next.electricityCostPerKwh,
                printerPowerWatt: next.printerPowerWatt,
                operatorCostPerHour: next.operatorCostPerHour,
                defaultMarginPercent: next.defaultMarginPercent,
                investmentCostTotal: next.investmentCostTotal,
                investmentPaybackMonths: next.investmentPaybackMonths,
                monthlyPrintHours: next.monthlyPrintHours,
                lowStockThreshold: next.lowStockThreshold,
              }),
            });
            setLastSaved(new Date());
          } catch (err) {
            console.error("Failed syncing settings to DB:", err);
          } finally {
            setIsSyncing(false);
          }
        }, 500);

        return next;
      });
    },
    []
  );

  // Reset to default settings
  const resetToDefaults = useCallback(() => {
    updateSettings(DEFAULT_GOO_SETTINGS);
  }, [updateSettings]);

  return {
    settings,
    isLoaded,
    isSyncing,
    lastSaved,
    updateSettings,
    resetToDefaults,
  };
}
