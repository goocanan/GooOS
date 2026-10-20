"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { GooNavbar } from "@/components/GooNavbar";

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
          fetch("/api/flow/inventory"),
          fetch("/api/flow/assets"),
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
  }, []);

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

  const packagingAssets = useMemo(() => {
    return assets.filter(
      (a) =>
        a.category?.toLowerCase() === "packing" ||
        a.category?.toLowerCase() === "packaging"
    );
  }, [assets]);

  const filteredAssets = useMemo(() => {
    return packagingAssets.filter((a) =>
      search === "" ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      (a.size && a.size.toLowerCase().includes(search.toLowerCase()))
    );
  }, [packagingAssets, search]);

  const totalSpools = items.length;
  const lowStockCount = items.filter(
    (i) => i.currentWeight <= (i.lowStockThreshold || 100) && i.currentWeight > 0
  ).length;
  const emptyCount = items.filter((i) => i.currentWeight <= 0).length;
  const totalWeightKg = (
    items.reduce((acc, i) => acc + (i.currentWeight || 0), 0) / 1000
  ).toFixed(1);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <GooNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                3DFlow &amp; GOO-Studio
              </span>
              <span className="text-xs text-slate-400 font-mono">194 Total Item</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
              Inventaris Spul Filamen &amp; Aset
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Pemantauan stok spul filamen (gauge gramasi real-time), kardus packaging, dan hardware cetak 3D.
            </p>
          </div>

          {/* Subtabs Toggle (Filament vs Equipment) */}
          <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800 self-start sm:self-auto shadow-md">
            <button
              onClick={() => setActiveTab("filament")}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === "filament"
                  ? "bg-rose-600 text-white shadow-md shadow-rose-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              🧵 Spul Filamen ({items.length})
            </button>
            <button
              onClick={() => setActiveTab("equipment")}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === "equipment"
                  ? "bg-rose-600 text-white shadow-md shadow-rose-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              📦 Aset Packaging ({packagingAssets.length})
            </button>
          </div>
        </div>

        {activeTab === "filament" ? (
          <>
            {/* Metrics Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div
                onClick={() => setStockStatus("all")}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  stockStatus === "all"
                    ? "bg-slate-900 border-rose-500 shadow-md ring-1 ring-rose-500/30"
                    : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                }`}
              >
                <p className="text-xs font-medium text-slate-400">Total Spul Terdaftar</p>
                <p className="text-2xl font-black text-white mt-1 font-mono">{totalSpools}</p>
              </div>
              <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
                <p className="text-xs font-medium text-slate-400">Total Berat Filamen</p>
                <p className="text-2xl font-black text-white mt-1 font-mono">
                  {totalWeightKg} <span className="text-sm font-normal text-slate-400 font-sans">kg</span>
                </p>
              </div>
              <div
                onClick={() => setStockStatus("low")}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  stockStatus === "low"
                    ? "bg-amber-950/40 border-amber-500 shadow-md ring-1 ring-amber-500/30"
                    : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                }`}
              >
                <p className="text-xs font-medium text-amber-400">Stok Menipis (&le;100g)</p>
                <p className="text-2xl font-black text-amber-400 mt-1 font-mono">{lowStockCount}</p>
              </div>
              <div
                onClick={() => setStockStatus("empty")}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  stockStatus === "empty"
                    ? "bg-rose-950/40 border-rose-500 shadow-md ring-1 ring-rose-500/30"
                    : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                }`}
              >
                <p className="text-xs font-medium text-rose-400">Habis / Depleted</p>
                <p className="text-2xl font-black text-rose-400 mt-1 font-mono">{emptyCount}</p>
              </div>
            </div>

            {/* Filters Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800 shadow-md">
              <div className="flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Cari berdasarkan SKU, brand, warna..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full px-4 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
                />
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {materials.map((mat) => (
                  <button
                    key={mat}
                    onClick={() => setSelectedMaterial(mat)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-xl capitalize transition-colors ${
                      selectedMaterial === mat
                        ? "bg-rose-600 text-white shadow-sm"
                        : "bg-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    {mat}
                  </button>
                ))}
              </div>
            </div>

            {/* Spool Grid */}
            {loading ? (
              <div className="text-center py-20 bg-slate-900/40 rounded-2xl border border-slate-800 text-slate-400 text-sm">
                Memuat inventaris filamen...
              </div>
            ) : error ? (
              <div className="p-6 bg-rose-950/40 text-rose-300 rounded-2xl border border-rose-800 text-sm">
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
                      className="bg-slate-900/60 rounded-2xl border border-slate-800 p-5 shadow-md hover:border-slate-700 hover:shadow-lg transition-all flex flex-col justify-between space-y-4"
                    >
                      <div>
                        {/* Top Badges */}
                        <div className="flex items-start justify-between">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold uppercase">
                            {item.brand}
                          </span>
                          {isEmpty ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                              Habis
                            </span>
                          ) : isLow ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              Menipis
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              Tersedia
                            </span>
                          )}
                        </div>

                        {/* Material & Color */}
                        <div className="flex items-center gap-3 mt-3">
                          <div
                            className="w-9 h-9 rounded-full border-2 border-slate-800 shadow-md flex-shrink-0"
                            style={{ backgroundColor: item.colorHex || "#94a3b8" }}
                          />
                          <div>
                            <h3 className="font-bold text-sm text-white leading-tight">
                              {item.materialType}
                            </h3>
                            <p className="text-xs text-slate-400 font-medium">{item.color}</p>
                          </div>
                        </div>
                      </div>

                      {/* Weight Gauge & Progress */}
                      <div className="space-y-2 pt-3 border-t border-slate-800">
                        <div className="flex justify-between items-baseline text-xs">
                          <span className="font-bold font-mono text-base text-white">
                            {item.currentWeight}g
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            / {item.initialWeight}g ({percent}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
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
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-slate-900/80 border border-slate-800 rounded-2xl text-xs text-slate-300">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">🖨️</span>
                <div>
                  <p className="font-semibold text-white">Workshop &amp; Tools Telah Dipisahkan</p>
                  <p className="text-slate-400 text-[11px]">
                    Alat pendukung (tools/drybox/glue stick) &amp; suku cadang printer kini dikelola di halaman Armada 3D Printer.
                  </p>
                </div>
              </div>
              <Link
                href="/printers"
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-600/20 whitespace-nowrap self-end sm:self-auto"
              >
                Lihat Fleet &amp; Workshop &rarr;
              </Link>
            </div>

            <div className="bg-slate-900/60 rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
              <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                <input
                  type="text"
                  placeholder="Cari kardus packaging, mail wrap, zip pouch..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="max-w-md w-full px-4 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none"
                />
                <span className="text-xs text-slate-400 font-medium">
                  {filteredAssets.length} Aset Packaging
                </span>
              </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Nama Aset</th>
                    <th className="py-3 px-4">Kategori</th>
                    <th className="py-3 px-4">Ukuran / Dimensi</th>
                    <th className="py-3 px-4">Stok Unit</th>
                    <th className="py-3 px-4">Biaya Satuan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredAssets.map((asset) => (
                    <tr key={asset.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-white">{asset.name}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300 capitalize">
                          {asset.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 font-mono">{asset.size || "-"}</td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-400">{asset.quantity}</td>
                      <td className="py-3 px-4 font-mono text-slate-300">
                        Rp {Math.round(asset.price || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        )}
      </main>
    </div>
  );
}
