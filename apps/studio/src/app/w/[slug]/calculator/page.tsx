"use client";

import { useState } from "react";
import { useParams } from "next/navigation";

export default function PricingCalculatorPage() {
  const params = useParams();
  const slug = params.slug as string;

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

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          3D Printing Pricing Calculator
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Accurate cost estimation factoring material, electricity, machine depreciation, operator labor, and target profit.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Parameters Form */}
        <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Job &amp; Cost Parameters
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Model Weight (grams)
              </label>
              <input
                type="number"
                value={weightGrams}
                onChange={(e) => setWeightGrams(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-goo-500/20 focus:border-goo-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Print Duration (hours)
              </label>
              <input
                type="number"
                step="0.1"
                value={printHours}
                onChange={(e) => setPrintHours(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-goo-500/20 focus:border-goo-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Filament Cost / kg (Rp)
              </label>
              <input
                type="number"
                step="5000"
                value={filamentPricePerKg}
                onChange={(e) => setFilamentPricePerKg(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-goo-500/20 focus:border-goo-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Target Margin (%)
              </label>
              <input
                type="number"
                value={marginPercent}
                onChange={(e) => setMarginPercent(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-goo-500/20 focus:border-goo-500 font-mono font-bold text-goo-700"
              />
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 space-y-4">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Overhead &amp; Depreciations
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] text-slate-600 mb-1">
                  Electricity Rate (Rp/kWh)
                </label>
                <input
                  type="number"
                  value={electricityTariff}
                  onChange={(e) => setElectricityTariff(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-600 mb-1">
                  Printer Wattage (Watts)
                </label>
                <input
                  type="number"
                  value={printerPowerWatt}
                  onChange={(e) => setPrinterPowerWatt(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-600 mb-1">
                  Operator Labor (Minutes)
                </label>
                <input
                  type="number"
                  value={operatorMinutes}
                  onChange={(e) => setOperatorMinutes(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-600 mb-1">
                  Machine Cost (Rp)
                </label>
                <input
                  type="number"
                  value={machineCost}
                  onChange={(e) => setMachineCost(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-200 font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Calculation Result Card */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-xl shadow-lg flex flex-col justify-between">
          <div className="space-y-5">
            <div>
              <span className="text-xs uppercase tracking-wider text-goo-300 font-semibold">
                Suggested Quote Price
              </span>
              <p className="text-4xl font-extrabold mt-1 text-white">
                Rp {Math.round(finalPrice).toLocaleString()}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Net Profit: <span className="text-emerald-400 font-semibold">Rp {Math.round(netProfit).toLocaleString()}</span> ({marginPercent}% margin)
              </p>
            </div>

            <div className="border-t border-slate-700/80 pt-4 space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Material Cost ({weightGrams}g):</span>
                <span className="font-mono text-white">Rp {Math.round(materialCost).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Electricity ({kwhUsed.toFixed(2)} kWh):</span>
                <span className="font-mono text-white">Rp {Math.round(electricityCost).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Machine Depreciation:</span>
                <span className="font-mono text-white">Rp {Math.round(machineCostForJob).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Operator Labor:</span>
                <span className="font-mono text-white">Rp {Math.round(laborCost).toLocaleString()}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-700 font-semibold text-white">
                <span>Total Base Cost (COGS):</span>
                <span className="font-mono text-goo-300">Rp {Math.round(totalCost).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="pt-6">
            <button
              onClick={() => alert(`Copied Quote: Rp ${Math.round(finalPrice).toLocaleString()}`)}
              className="w-full py-2.5 bg-goo-600 hover:bg-goo-700 text-white font-semibold rounded-lg text-xs transition-colors shadow-md shadow-goo-900/40"
            >
              Copy Quote for Client
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
