"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface InventoryItem {
  id: string;
  sku: string;
  brand: string;
  type: string | null;
  version: string | null;
  materialType: string;
  color: string;
  colorHex: string | null;
  currentWeight: number;
  initialWeight: number;
  pricePerGram: number;
  lowStockThreshold: number;
  productLink: string | null;
  updatedAt: string;
}

interface AssetItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  price: number;
  notes: string | null;
  productLink: string | null;
  size: string | null;
}

export default function InventoryPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [activeTab, setActiveTab] = useState<"filament" | "equipment">("filament");
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedMaterial, setSelectedMaterial] = useState("all");
  const [stockStatus, setStockStatus] = useState<"all" | "in_stock" | "low" | "empty">("all");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [invRes, astRes] = await Promise.all([
          fetch(`/api/workspaces/${slug}/flow/inventory`),
          fetch(`/api/workspaces/${slug}/flow/assets`),
        ]);
        const invJson = await invRes.json();
        const astJson = await astRes.json();

        if (invJson.success) setItems(invJson.data);
        if (astJson.success) setAssets(astJson.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [slug]);

  const materials = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => i.materialType && set.add(i.materialType));
    return ["all", ...Array.from(set)];
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchSearch =
        search === "" ||
        item.sku.toLowerCase().includes(search.toLowerCase()) ||
        item.brand.toLowerCase().includes(search.toLowerCase()) ||
        item.color.toLowerCase().includes(search.toLowerCase());
      const matchMaterial =
        selectedMaterial === "all" || item.materialType === selectedMaterial;

      let matchStock = true;
      if (stockStatus === "in_stock") matchStock = item.currentWeight > (item.lowStockThreshold || 100);
      if (stockStatus === "low") matchStock = item.currentWeight <= (item.lowStockThreshold || 100) && item.currentWeight > 0;
      if (stockStatus === "empty") matchStock = item.currentWeight <= 0;

      return matchSearch && matchMaterial && matchStock;
    });
  }, [items, search, selectedMaterial, stockStatus]);

  const filteredAssets = useMemo(() => {
    return assets.filter((a) =>
      search === "" ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.category.toLowerCase().includes(search.toLowerCase())
    );
  }, [assets, search]);

  const totalSpools = items.length;
  const lowStockCount = items.filter(
    (i) => i.currentWeight <= (i.lowStockThreshold || 100) && i.currentWeight > 0
  ).length;
  const emptyCount = items.filter((i) => i.currentWeight <= 0).length;
  const totalWeightKg = (
    items.reduce((acc, i) => acc + (i.currentWeight || 0), 0) / 1000
  ).toFixed(1);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Inventory &amp; Material Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time tracking of filament spools, remaining weights, packaging boxes, and farm equipment.
          </p>
        </div>

        {/* Subtabs Toggle (Filament vs Equipment) */}
        <div className="flex bg-slate-200/80 p-1 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setActiveTab("filament")}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === "filament"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            🧵 Filament Spools ({items.length})
          </button>
          <button
            onClick={() => setActiveTab("equipment")}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === "equipment"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            📦 Equipment &amp; Assets ({assets.length})
          </button>
        </div>
      </div>

      {activeTab === "filament" ? (
        <>
          {/* Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div
              onClick={() => setStockStatus("all")}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                stockStatus === "all" ? "bg-white border-slate-900 shadow-sm ring-1 ring-slate-900" : "bg-white border-slate-200"
              }`}
            >
              <p className="text-xs font-medium text-slate-500">Total Filaments</p>
              <p className="text-2xl font-bold text-slate-900 mt-1 font-mono">{totalSpools}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <p className="text-xs font-medium text-slate-500">Total Stock (kg)</p>
              <p className="text-2xl font-bold text-slate-900 mt-1 font-mono">
                {totalWeightKg} <span className="text-sm font-normal text-slate-500 font-sans">kg</span>
              </p>
            </div>
            <div
              onClick={() => setStockStatus("low")}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                stockStatus === "low" ? "bg-amber-50 border-amber-500 shadow-sm ring-1 ring-amber-500" : "bg-white border-slate-200"
              }`}
            >
              <p className="text-xs font-medium text-amber-600">Low Stock (&le;100g)</p>
              <p className="text-2xl font-bold text-amber-600 mt-1 font-mono">{lowStockCount}</p>
            </div>
            <div
              onClick={() => setStockStatus("empty")}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                stockStatus === "empty" ? "bg-rose-50 border-rose-500 shadow-sm ring-1 ring-rose-500" : "bg-white border-slate-200"
              }`}
            >
              <p className="text-xs font-medium text-rose-600">Empty / Habis</p>
              <p className="text-2xl font-bold text-rose-600 mt-1 font-mono">{emptyCount}</p>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search by SKU, brand, or color..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-goo-500/20 focus:border-goo-500"
              />
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {materials.map((mat) => (
                <button
                  key={mat}
                  onClick={() => setSelectedMaterial(mat)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors ${
                    selectedMaterial === mat
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {mat}
                </button>
              ))}
            </div>
          </div>

          {/* Spool Grid / Visualizer */}
          {loading ? (
            <div className="text-center py-20 bg-white rounded-xl border border-slate-200 text-slate-400 text-sm">
              Loading filament inventory...
            </div>
          ) : error ? (
            <div className="p-6 bg-rose-50 text-rose-700 rounded-xl border border-rose-200 text-sm">
              {error}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredItems.map((item) => {
                const percent = Math.min(
                  100,
                  Math.round(((item.currentWeight || 0) / (item.initialWeight || 1000)) * 100)
                );
                const isLow = item.currentWeight <= (item.lowStockThreshold || 100) && item.currentWeight > 0;
                const isEmpty = item.currentWeight <= 0;

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-start justify-between">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold uppercase">
                          {item.brand}
                        </span>
                        {isEmpty ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                            Depleted
                          </span>
                        ) : isLow ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                            Low Stock
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                            In Stock
                          </span>
                        )}
                      </div>

                      {/* Material & Color */}
                      <div className="flex items-center gap-3 mt-3">
                        <div
                          className="w-8 h-8 rounded-full border-2 border-white shadow-md flex-shrink-0"
                          style={{ backgroundColor: item.colorHex || "#94a3b8" }}
                        />
                        <div>
                          <h3 className="font-bold text-sm text-slate-900 leading-tight">
                            {item.materialType}
                          </h3>
                          <p className="text-xs text-slate-500 font-medium">{item.color}</p>
                        </div>
                      </div>
                    </div>

                    {/* Weight Gauge & Progress */}
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <div className="flex justify-between items-baseline text-xs">
                        <span className="font-bold font-mono text-base text-slate-900">
                          {item.currentWeight}g
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          / {item.initialWeight}g ({percent}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isEmpty ? "bg-rose-500" : isLow ? "bg-amber-500" : "bg-emerald-500"
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                        <span>SKU: {item.sku}</span>
                        {item.pricePerGram > 0 && <span>Rp{item.pricePerGram}/g</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* Equipment & Packaging Assets Tab */
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center">
            <input
              type="text"
              placeholder="Search equipment, tools, cardboard boxes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-md w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none"
            />
            <span className="text-xs text-slate-500 font-medium">
              {filteredAssets.length} Equipment Items
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Asset Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Size / Dimensions</th>
                  <th className="py-3 px-4">Qty in Stock</th>
                  <th className="py-3 px-4">Unit Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAssets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{asset.name}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 capitalize">
                        {asset.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono">{asset.size || "-"}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{asset.quantity}</td>
                    <td className="py-3 px-4 font-mono text-slate-700">
                      Rp {Math.round(asset.price || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
