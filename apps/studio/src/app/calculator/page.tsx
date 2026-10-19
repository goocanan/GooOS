"use client";

import { useState } from "react";
import Link from "next/link";
import { GooNavbar } from "@/components/GooNavbar";

export default function PricingCalculatorPage() {
  // Parameters
  const [weightGrams, setWeightGrams] = useState(45);
  const [printHours, setPrintHours] = useState(2.5);
  const [filamentPricePerKg, setFilamentPricePerKg] = useState(180000); // Rp 180,000/kg
  const [electricityTariff, setElectricityTariff] = useState(1500); // Rp 1500/kWh
  const [printerPowerWatt, setPrinterPowerWatt] = useState(150); // 150 W
  const [operatorRatePerHour, setOperatorRatePerHour] = useState(25000); // Rp 25k/hour
  const [operatorMinutes, setOperatorMinutes] = useState(10); // prep & post-processing
  const [machineCost, setMachineCost] = useState(5000000); // Rp 5,000,000 printer
  const [paybackMonths, setPaybackMonths] = useState(12);
  const [monthlyHours, setMonthlyHours] = useState(150);
  const [marginPercent, setMarginPercent] = useState(50); // 50%
  const [copied, setCopied] = useState(false);

  // Calculations
  const materialCost = (weightGrams / 1000) * filamentPricePerKg;
  const kwhUsed = (printerPowerWatt / 1000) * printHours;
  const electricityCost = kwhUsed * electricityTariff;
  const depreciationPerHour = machineCost / (paybackMonths * monthlyHours);
  const machineCostForJob = depreciationPerHour * printHours;
  const laborCost = (operatorMinutes / 60) * operatorRatePerHour;

  const totalCost = materialCost + electricityCost + machineCostForJob + laborCost;
  const finalPrice = totalCost * (1 + marginPercent / 100);
  const netProfit = finalPrice - totalCost;

  const handleCopyQuote = () => {
    const text = `📋 Estimasi Biaya Cetak 3D:\n• Berat: ${weightGrams}g\n• Durasi: ${printHours} jam\n• Modal Dasar (COGS): Rp ${Math.round(totalCost).toLocaleString()}\n• Harga Rekomendasi: Rp ${Math.round(finalPrice).toLocaleString()}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <GooNavbar />

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
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
            Simulasi biaya akurat yang memperhitungkan harga bahan filamen, tarif listrik PLN, depresiasi keausan printer, upah operator, dan target margin keuntungan.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Input Parameters Form */}
          <div className="lg:col-span-7 bg-slate-900/60 p-6 rounded-3xl border border-slate-800 shadow-xl space-y-5">
            <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Parameter Job &amp; Biaya Produksi
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Berat Model (gram)
                </label>
                <input
                  type="number"
                  value={weightGrams}
                  onChange={(e) => setWeightGrams(Number(e.target.value))}
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
                  onChange={(e) => setPrintHours(Number(e.target.value))}
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
                  onChange={(e) => setFilamentPricePerKg(Number(e.target.value))}
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
                  onChange={(e) => setMarginPercent(Number(e.target.value))}
                  className="w-full px-4 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-indigo-400 font-bold font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>
            </div>

            <div className="border-t border-slate-800 pt-4 space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Overhead &amp; Depresiasi Alat
              </h3>
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
                <p className="text-4xl font-black mt-1 text-white font-mono">
                  Rp {Math.round(finalPrice).toLocaleString()}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Margin Keuntungan:{" "}
                  <span className="text-emerald-400 font-semibold font-mono">
                    Rp {Math.round(netProfit).toLocaleString()}
                  </span>{" "}
                  ({marginPercent}%)
                </p>
              </div>

              <div className="border-t border-slate-800/80 pt-4 space-y-3 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400">Biaya Bahan ({weightGrams}g):</span>
                  <span className="font-mono text-white">Rp {Math.round(materialCost).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400">Biaya Listrik ({kwhUsed.toFixed(2)} kWh):</span>
                  <span className="font-mono text-white">Rp {Math.round(electricityCost).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400">Depresiasi Mesin Printer:</span>
                  <span className="font-mono text-white">Rp {Math.round(machineCostForJob).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400">Upah Kerja Operator:</span>
                  <span className="font-mono text-white">Rp {Math.round(laborCost).toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-slate-800 font-bold text-white">
                  <span>Total Modal Dasar (COGS):</span>
                  <span className="font-mono text-indigo-400 text-sm">
                    Rp {Math.round(totalCost).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-8">
              <button
                onClick={handleCopyQuote}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl text-xs transition-colors shadow-lg shadow-indigo-600/30"
              >
                {copied ? "✓ Kutipan Harga Tersalin!" : "📋 Salin Rincian Penawaran Klien"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
