"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

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
  const params = useParams();
  const slug = params.slug as string;

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
        const res = await fetch(`/api/workspaces/${slug}/flow/products`);
        const json = await res.json();
        if (json.success) {
          setProducts(json.data);
          if (json.data.length > 0) setSelectedProduct(json.data[0]);
        } else {
          setError(json.error || "Failed to load products");
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, [slug]);

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
    const text = `📦 ${prod.name}\nSKU: ${prod.sku || "-"}\nWeight: ${prod.modelWeight}g\nPrint Time: ${prod.printingTime}h\nPrice: Rp ${Math.round(prod.finalPrice).toLocaleString()}`;
    navigator.clipboard.writeText(text);
    setCopiedId(prod.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            3D Product Catalog
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Standardized 3D models with pre-calculated COGS, filament consumption, machine wear, and selling prices.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-goo-50 text-goo-700 border border-goo-200">
            {products.length} Models in Catalog
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search products by title, SKU, or notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-goo-500/20 focus:border-goo-500"
          />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                selectedCategory === cat
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Split View */}
      {loading ? (
        <div className="text-center py-20 bg-white rounded-xl border border-slate-200 text-slate-400 text-sm">
          Loading 3D product catalog...
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-50 text-rose-700 rounded-xl border border-rose-200 text-sm">
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
                    className={`p-4 rounded-xl border cursor-pointer transition-all bg-white text-left ${
                      isSelected
                        ? "border-goo-500 shadow-md ring-2 ring-goo-500/20"
                        : "border-slate-200 hover:border-slate-300 shadow-sm"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-mono text-[10px] text-slate-400 uppercase">
                        {prod.sku || "PROD"}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                        {prod.category || "General"}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-slate-900 mt-1 line-clamp-1">
                      {prod.name}
                    </h3>

                    <div className="flex items-center gap-3 mt-3 text-xs text-slate-500">
                      <span>⚖️ {prod.modelWeight}g</span>
                      <span>⏱️ {prod.printingTime}h</span>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100">
                      <span className="text-xs text-slate-400">Retail Price</span>
                      <span className="font-bold text-slate-900 text-sm font-mono">
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
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6 sticky top-6">
                <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-xs font-mono text-slate-400">{selectedProduct.sku}</span>
                    <h2 className="text-lg font-bold text-slate-900 mt-0.5">{selectedProduct.name}</h2>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-goo-50 text-goo-700">
                      {selectedProduct.category || "General"}
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopy(selectedProduct)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium hover:bg-slate-50 transition-colors"
                  >
                    {copiedId === selectedProduct.id ? "✓ Copied!" : "📋 Copy"}
                  </button>
                </div>

                {/* Final Price Card */}
                <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-4 rounded-xl text-white flex justify-between items-center">
                  <div>
                    <p className="text-[11px] text-slate-300 uppercase tracking-wider">Recommended Price</p>
                    <p className="text-2xl font-black mt-0.5 font-mono">
                      Rp {Math.round(selectedProduct.finalPrice).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {selectedProduct.marginPercent}% Margin
                    </span>
                  </div>
                </div>

                {/* Technical Specifications */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Print Specifications
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="text-slate-400 block text-[10px]">Filament Weight</span>
                      <span className="font-bold text-slate-800">{selectedProduct.modelWeight} grams</span>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="text-slate-400 block text-[10px]">Print Duration</span>
                      <span className="font-bold text-slate-800">{selectedProduct.printingTime} hours</span>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="text-slate-400 block text-[10px]">Infill Density</span>
                      <span className="font-bold text-slate-800">{selectedProduct.infill || "15%"}</span>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="text-slate-400 block text-[10px]">Layer Height</span>
                      <span className="font-bold text-slate-800">{selectedProduct.layerHeight || "0.20 mm"}</span>
                    </div>
                  </div>
                </div>

                {/* Cost Breakdown */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    COGS Breakdown
                  </h3>
                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span>Filament Cost:</span>
                      <span className="font-mono text-slate-900 font-semibold">
                        Rp {Math.round(selectedProduct.materialCost).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Electricity &amp; Power:</span>
                      <span className="font-mono text-slate-900 font-semibold">
                        Rp {Math.round(selectedProduct.energyCost).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Machine Wear &amp; Depreciation:</span>
                      <span className="font-mono text-slate-900 font-semibold">
                        Rp {Math.round(selectedProduct.wearCost).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Packaging Materials:</span>
                      <span className="font-mono text-slate-900 font-semibold">
                        Rp {Math.round(selectedProduct.packagingCost).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 text-slate-400 text-sm">
                Select a product to view technical breakdown.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
