"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { GooNavbar } from "@/components/GooNavbar";

interface Product {
  id: string;
  name: string;
  sku: string | null;
  imageUrl: string | null;
  modelWeight: number;
  printingTime: number;
  materialCost: number;
  energyCost: number;
  wearCost: number;
  packagingCost: number;
  taxRate: number;
  finalPrice: number;
  marginPercent: number;
  manualPrice: number | null;
  category: string | null;
  description: string | null;
  infill: string | null;
  layerHeight: string | null;
  productLink: string | null;
  createdAt: string;
}

export default function ProductCatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    async function loadProducts() {
      try {
        setLoading(true);
        const res = await fetch("/api/flow/products");
        const json = await res.json();
        if (json.success) {
          setProducts(json.data);
          if (json.data.length > 0) setSelectedProduct(json.data[0]);
        } else {
          setError(json.error || "Gagal memuat katalog produk");
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => p.category && set.add(p.category));
    return ["All", ...Array.from(set)];
  }, [products]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        search === "" ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(search.toLowerCase())) ||
        (p.description && p.description.toLowerCase().includes(search.toLowerCase()));
      const matchCat = selectedCategory === "All" || p.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [products, search, selectedCategory]);

  const handleCopy = (prod: Product) => {
    const text = `📦 ${prod.name}\nSKU: ${prod.sku || "-"}\nBerat: ${prod.modelWeight}g\nDurasi Cetak: ${prod.printingTime} jam\nHarga: Rp ${Math.round(prod.finalPrice).toLocaleString()}`;
    navigator.clipboard.writeText(text);
    setCopiedId(prod.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <GooNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                3DFlow Catalog
              </span>
              <span className="text-xs text-slate-400 font-mono">40 Model Terstandar</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
              Katalog Produk 3D &amp; COGS Pricing
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Model 3D standar siap produksi dengan kalkulasi modal bahan, biaya listrik, depresiasi mesin, dan rekomendasi margin profit.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20 font-mono">
              {products.length} Model Aktif
            </span>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-md">
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Cari produk berdasarkan judul, SKU, atau catatan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
            />
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap ${
                  selectedCategory === cat
                    ? "bg-rose-600 text-white shadow-sm"
                    : "bg-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Main Split View */}
        {loading ? (
          <div className="text-center py-20 bg-slate-900/40 rounded-2xl border border-slate-800 text-slate-400 text-sm">
            Memuat katalog produk 3D...
          </div>
        ) : error ? (
          <div className="p-6 bg-rose-950/40 text-rose-300 rounded-2xl border border-rose-800 text-sm">
            {error}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Products Grid */}
            <div className="lg:col-span-7 space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filtered.map((prod) => {
                  const isSelected = selectedProduct?.id === prod.id;
                  return (
                    <div
                      key={prod.id}
                      onClick={() => setSelectedProduct(prod)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all text-left ${
                        isSelected
                          ? "bg-slate-900 border-rose-500 shadow-md ring-1 ring-rose-500/30"
                          : "bg-slate-900/60 border-slate-800 hover:border-slate-700 shadow-sm"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-mono text-[10px] text-slate-400 uppercase">
                          {prod.sku || "PROD"}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">
                          {prod.category || "General"}
                        </span>
                      </div>

                      <h3 className="font-bold text-sm text-white mt-1 line-clamp-1">
                        {prod.name}
                      </h3>

                      <div className="flex items-center gap-3 mt-3 text-xs text-slate-400 font-mono">
                        <span>⚖️ {prod.modelWeight}g</span>
                        <span>⏱️ {prod.printingTime} jam</span>
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-800">
                        <span className="text-xs text-slate-400">Harga Jual</span>
                        <span className="font-bold text-rose-400 text-sm font-mono">
                          Rp {Math.round(prod.finalPrice).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected Product Detail Panel */}
            <div className="lg:col-span-5">
              {selectedProduct ? (
                <div className="bg-slate-900/80 rounded-3xl border border-slate-800 p-6 shadow-xl space-y-6 sticky top-24">
                  <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                    <div>
                      <span className="text-xs font-mono text-slate-400">{selectedProduct.sku}</span>
                      <h2 className="text-lg font-bold text-white mt-0.5">{selectedProduct.name}</h2>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        {selectedProduct.category || "General"}
                      </span>
                    </div>
                    <button
                      onClick={() => handleCopy(selectedProduct)}
                      className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-colors"
                    >
                      {copiedId === selectedProduct.id ? "✓ Tersalin!" : "📋 Salin Spek"}
                    </button>
                  </div>

                  {/* Final Price Card */}
                  <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-rose-950/60 p-5 rounded-2xl border border-rose-500/20 text-white flex justify-between items-center shadow-md">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider">Rekomendasi Harga Jual</p>
                      <p className="text-2xl font-black mt-0.5 font-mono text-rose-400">
                        Rp {Math.round(selectedProduct.finalPrice).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                        {selectedProduct.marginPercent}% Margin
                      </span>
                    </div>
                  </div>

                  {/* Technical Specifications */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Spesifikasi Slicer &amp; Produksi
                    </h3>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                        <span className="text-slate-500 block text-[10px]">Berat Filamen</span>
                        <span className="font-bold text-white font-mono">{selectedProduct.modelWeight} gram</span>
                      </div>
                      <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                        <span className="text-slate-500 block text-[10px]">Durasi Print</span>
                        <span className="font-bold text-white font-mono">{selectedProduct.printingTime} jam</span>
                      </div>
                      <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                        <span className="text-slate-500 block text-[10px]">Infill Density</span>
                        <span className="font-bold text-white font-mono">{selectedProduct.infill || "15%"}</span>
                      </div>
                      <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                        <span className="text-slate-500 block text-[10px]">Layer Height</span>
                        <span className="font-bold text-white font-mono">{selectedProduct.layerHeight || "0.20 mm"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Cost Breakdown */}
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Rincian Biaya Modal (COGS)
                    </h3>
                    <div className="space-y-2 text-xs text-slate-300">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Biaya Bahan Filamen:</span>
                        <span className="font-mono text-white font-semibold">
                          Rp {Math.round(selectedProduct.materialCost).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Biaya Listrik &amp; Power:</span>
                        <span className="font-mono text-white font-semibold">
                          Rp {Math.round(selectedProduct.energyCost).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Depresiasi &amp; Keausan Mesin:</span>
                        <span className="font-mono text-white font-semibold">
                          Rp {Math.round(selectedProduct.wearCost).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Kardus &amp; Packaging:</span>
                        <span className="font-mono text-white font-semibold">
                          Rp {Math.round(selectedProduct.packagingCost).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-20 bg-slate-900/40 rounded-3xl border border-slate-800 text-slate-400 text-sm">
                  Pilih produk untuk melihat rincian kalkulasi teknis.
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
