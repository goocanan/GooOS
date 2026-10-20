"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { GooNavbar } from "@/components/GooNavbar";
import { useGooSettings } from "@/hooks/use-goo-settings";
import { Settings, Save, CheckCircle2, RotateCcw, Copy } from "lucide-react";

export default function PricingCalculatorPage() {
  const { settings, updateSettings, isLoaded } = useGooSettings();

  // Job-specific Parameters (Persisted in localStorage)
  const [weightGrams, setWeightGrams] = useState(45);
  const [printHours, setPrintHours] = useState(2.5);
  const [filamentPricePerKg, setFilamentPricePerKg] = useState(180000); // Rp 180,000/kg
  const [marginPercent, setMarginPercent] = useState(50); // 50%

  // Studio Overhead & Machine Parameters (Synced with useGooSettings)
  const [electricityTariff, setElectricityTariff] = useState(1500); // Rp 1500/kWh
  const [printerPowerWatt, setPrinterPowerWatt] = useState(150); // 150 W
  const [operatorRatePerHour, setOperatorRatePerHour] = useState(25000); // Rp 25k/hour
  const [operatorMinutes, setOperatorMinutes] = useState(10); // prep & post-processing
  const [machineCost, setMachineCost] = useState(5000000); // Rp 5,000,000 printer
  const [paybackMonths, setPaybackMonths] = useState(12);
  const [monthlyHours, setMonthlyHours] = useState(150);

  const [copied, setCopied] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  // 1. Load Job Parameters from LocalStorage on Mount
  useEffect(() => {
    try {
      const savedJob = localStorage.getItem("gooos_calc_job");
      if (savedJob) {
        const parsed = JSON.parse(savedJob);
        if (parsed.weightGrams !== undefined) setWeightGrams(Number(parsed.weightGrams));
        if (parsed.printHours !== undefined) setPrintHours(Number(parsed.printHours));
        if (parsed.filamentPricePerKg !== undefined) setFilamentPricePerKg(Number(parsed.filamentPricePerKg));
        if (parsed.marginPercent !== undefined) setMarginPercent(Number(parsed.marginPercent));
      }
    } catch (e) {
      console.error("Error reading calc job cache:", e);
    }
  }, []);

  // 2. Synchronize Overhead from useGooSettings
  useEffect(() => {
    if (isLoaded) {
      setElectricityTariff(settings.electricityCostPerKwh);
      setPrinterPowerWatt(settings.printerPowerWatt);
      setOperatorRatePerHour(settings.operatorCostPerHour);
      setOperatorMinutes(settings.operatorMinutesPerJob);
      setMachineCost(settings.investmentCostTotal);
      setPaybackMonths(settings.investmentPaybackMonths);
      setMonthlyHours(settings.monthlyPrintHours);
      if (settings.defaultMarginPercent && !localStorage.getItem("gooos_calc_job")) {
        setMarginPercent(settings.defaultMarginPercent);
      }
    }
  }, [isLoaded, settings]);

  // 3. Auto-save Job Parameters to LocalStorage
  const handleJobParamChange = (key: string, val: number) => {
    try {
      const savedJob = localStorage.getItem("gooos_calc_job");
      const current = savedJob ? JSON.parse(savedJob) : {};
      const updated = {
        weightGrams: key === "weightGrams" ? val : weightGrams,
        printHours: key === "printHours" ? val : printHours,
        filamentPricePerKg: key === "filamentPricePerKg" ? val : filamentPricePerKg,
        marginPercent: key === "marginPercent" ? val : marginPercent,
      };
      localStorage.setItem("gooos_calc_job", JSON.stringify(updated));
    } catch (e) {
      console.error("Failed saving job param to cache:", e);
    }
  };

  // Save current overhead as new Studio Default
  const handleSaveAsStudioDefaults = () => {
    updateSettings({
      electricityCostPerKwh: electricityTariff,
      printerPowerWatt: printerPowerWatt,
      operatorCostPerHour: operatorRatePerHour,
      operatorMinutesPerJob: operatorMinutes,
      investmentCostTotal: machineCost,
      investmentPaybackMonths: paybackMonths,
      monthlyPrintHours: monthlyHours,
      defaultMarginPercent: marginPercent,
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  // Calculations
  const materialCost = (weightGrams / 1000) * filamentPricePerKg;
  const kwhUsed = (printerPowerWatt / 1000) * printHours;
  const electricityCost = kwhUsed * electricityTariff;
  const depreciationPerHour = machineCost / ((paybackMonths || 1) * (monthlyHours || 1));
  const machineCostForJob = depreciationPerHour * printHours;
  const laborCost = (operatorMinutes / 60) * operatorRatePerHour;

  const totalCost = materialCost + electricityCost + machineCostForJob + laborCost;
  const finalPrice = totalCost * (1 + marginPercent / 100);
  const netProfit = finalPrice - totalCost;

  const handleCopyQuote = () => {
    const text = `📋 Estimasi Biaya Cetak 3D:\n• Berat: ${weightGrams}g\n• Durasi: ${printHours} jam\n• Modal Dasar (COGS): Rp ${Math.round(totalCost).toLocaleString("id-ID")}\n• Rekomendasi Harga Jual: Rp ${Math.round(finalPrice).toLocaleString("id-ID")}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <GooNavbar />

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                GOO-Studio Calculator
              </span>
              <span className="text-xs text-slate-400 font-mono">COGS &amp; Margin Simulator</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
              Kalkulator Biaya Cetak 3D &amp; Harga Jual
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Simulasi biaya akurat yang memperhitungkan harga bahan filamen, tarif listrik PLN, depresiasi keausan printer, upah operator, dan target margin keuntungan. (Nilai tersimpan permanen)
            </p>
          </div>

          <Link
            href="/settings?tab=goo-studio"
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold self-start sm:self-auto transition-colors"
          >
            <Settings className="w-3.5 h-3.5 text-indigo-400" />
            <span>Pengaturan Biaya Studio</span>
          </Link>
        </div>

        {savedNotice && (
          <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>Nilai overhead berhasil disimpan permanen sebagai standar Studio di database!</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Input Parameters Form */}
          <div className="lg:col-span-7 bg-slate-900/60 p-6 rounded-3xl border border-slate-800 shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Parameter Job &amp; Biaya Produksi
              </h2>
              <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                ● Auto-Persisted
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Berat Model (gram)
                </label>
                <input
                  type="number"
                  value={weightGrams}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setWeightGrams(v);
                    handleJobParamChange("weightGrams", v);
                  }}
                  className="w-full px-4 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Durasi Cetak (jam)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={printHours}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setPrintHours(v);
                    handleJobParamChange("printHours", v);
                  }}
                  className="w-full px-4 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Harga Spul Filamen / kg (Rp)
                </label>
                <input
                  type="number"
                  step="5000"
                  value={filamentPricePerKg}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setFilamentPricePerKg(v);
                    handleJobParamChange("filamentPricePerKg", v);
                  }}
                  className="w-full px-4 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Target Margin Profit (%)
                </label>
                <input
                  type="number"
                  value={marginPercent}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setMarginPercent(v);
                    handleJobParamChange("marginPercent", v);
                  }}
                  className="w-full px-4 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-indigo-400 font-bold font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>
            </div>

            <div className="border-t border-slate-800 pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Overhead &amp; Depresiasi Alat
                </h3>
                <button
                  type="button"
                  onClick={handleSaveAsStudioDefaults}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 hover:underline"
                >
                  <Save className="w-3 h-3" />
                  <span>Jadikan Standar Studio</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">
                    Tarif Listrik (Rp/kWh)
                  </label>
                  <input
                    type="number"
                    value={electricityTariff}
                    onChange={(e) => setElectricityTariff(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">
                    Daya Mesin Printer (Watt)
                  </label>
                  <input
                    type="number"
                    value={printerPowerWatt}
                    onChange={(e) => setPrinterPowerWatt(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">
                    Waktu Operator (Menit)
                  </label>
                  <input
                    type="number"
                    value={operatorMinutes}
                    onChange={(e) => setOperatorMinutes(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">
                    Harga Pembelian Mesin (Rp)
                  </label>
                  <input
                    type="number"
                    value={machineCost}
                    onChange={(e) => setMachineCost(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Calculation Result Card */}
          <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/80 text-white p-6 rounded-3xl border border-indigo-500/20 shadow-2xl flex flex-col justify-between">
            <div className="space-y-6">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-indigo-400 font-bold">
                  Rekomendasi Harga Jual (Quote)
                </span>
                <div className="text-3xl sm:text-4xl font-black text-white font-mono mt-1">
                  Rp {Math.round(finalPrice).toLocaleString("id-ID")}
                </div>
                <div className="text-xs text-indigo-300/80 mt-1 flex items-center gap-1.5">
                  <span>Estimasi Laba Bersih:</span>
                  <span className="font-bold font-mono text-emerald-400">
                    +Rp {Math.round(netProfit).toLocaleString("id-ID")} ({marginPercent}%)
                  </span>
                </div>
              </div>

              {/* Cost Breakdown */}
              <div className="space-y-2 border-t border-slate-800 pt-4 text-xs font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>Modal Filamen ({weightGrams}g):</span>
                  <span className="text-slate-200">Rp {Math.round(materialCost).toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Listrik ({printHours} jam @ {printerPowerWatt}W):</span>
                  <span className="text-slate-200">Rp {Math.round(electricityCost).toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Depresiasi Mesin ({printHours} jam):</span>
                  <span className="text-slate-200">Rp {Math.round(machineCostForJob).toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Upah Teknisi ({operatorMinutes} mnt):</span>
                  <span className="text-slate-200">Rp {Math.round(laborCost).toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between text-slate-200 font-bold border-t border-slate-800 pt-2">
                  <span>Total HPP / COGS:</span>
                  <span className="text-indigo-400">Rp {Math.round(totalCost).toLocaleString("id-ID")}</span>
                </div>
              </div>
            </div>

            <div className="pt-6 space-y-3">
              <button
                onClick={handleCopyQuote}
                className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all active:scale-[0.98]"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    <span>Quote Berhasil Disalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Salin Rincian Penawaran</span>
                  </>
                )}
              </button>

              <div className="text-[10px] text-center text-slate-500">
                *Nilai kalkulator otomatis tersimpan di memori browser Anda
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
