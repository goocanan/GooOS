"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { GooNavbar } from "@/components/GooNavbar";
import {
  Plus,
  Boxes,
  X,
  CheckCircle2,
  Check,
  ExternalLink,
  Layers,
  Package,
  Sparkles,
} from "lucide-react";

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
  purchaseDate?: string | null;
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
  purchaseDate?: string | null;
}

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<"filament" | "equipment">("filament");
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [search, setSearch] = useState("");
  const [selectedMaterial, setSelectedMaterial] = useState("all");
  const [stockStatus, setStockStatus] = useState<"all" | "in_stock" | "low" | "empty">("all");

  // Modals state
  const [showFilamentModal, setShowFilamentModal] = useState(false);
  const [showPackagingModal, setShowPackagingModal] = useState(false);

  // Filament Form
  const [filamentForm, setFilamentForm] = useState({
    brand: "eSUN",
    materialType: "PLA+",
    color: "Black",
    colorHex: "#111827",
    initialWeight: "1000",
    currentWeight: "1000",
    price: "150000",
    purchaseDate: new Date().toISOString().split("T")[0],
    productLink: "",
    lowStockThreshold: "100",
  });
  const [syncFilamentTx, setSyncFilamentTx] = useState(true);

  // Packaging Form
  const [packagingForm, setPackagingForm] = useState({
    name: "",
    category: "packing" as "packing" | "production",
    size: "",
    quantity: "20",
    price: "1500",
    purchaseDate: new Date().toISOString().split("T")[0],
    notes: "",
    productLink: "",
  });
  const [syncPackagingTx, setSyncPackagingTx] = useState(true);

  const triggerSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3500);
  };

  const loadData = async () => {
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
  };

  useEffect(() => {
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
      if (stockStatus === "in_stock")
        matchStock = item.currentWeight > (item.lowStockThreshold || 100);
      if (stockStatus === "low")
        matchStock =
          item.currentWeight <= (item.lowStockThreshold || 100) && item.currentWeight > 0;
      if (stockStatus === "empty") matchStock = item.currentWeight <= 0;

      return matchSearch && matchMaterial && matchStock;
    });
  }, [items, search, selectedMaterial, stockStatus]);

  const packagingAssets = useMemo(() => {
    return assets.filter(
      (a) =>
        a.category?.toLowerCase() === "packing" ||
        a.category?.toLowerCase() === "packaging" ||
        a.category?.toLowerCase() === "production"
    );
  }, [assets]);

  const filteredAssets = useMemo(() => {
    return packagingAssets.filter(
      (a) =>
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

  // Submit Filament
  const handleSubmitFilament = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!filamentForm.brand || !filamentForm.materialType || !filamentForm.color) {
      alert("Brand, material, dan nama warna wajib diisi!");
      return;
    }

    try {
      const payload = {
        brand: filamentForm.brand,
        materialType: filamentForm.materialType,
        color: filamentForm.color,
        colorHex: filamentForm.colorHex,
        initialWeight: parseFloat(filamentForm.initialWeight) || 1000,
        currentWeight: parseFloat(filamentForm.currentWeight) || 1000,
        price: parseFloat(filamentForm.price) || 0,
        purchaseDate: filamentForm.purchaseDate,
        productLink: filamentForm.productLink || null,
        lowStockThreshold: parseInt(filamentForm.lowStockThreshold) || 100,
        syncTransaction: syncFilamentTx,
      };

      const res = await fetch("/api/flow/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Gagal menambah spul filamen");

      triggerSuccess(
        `Spul ${payload.brand} ${payload.materialType} (${payload.color}) berhasil ditambahkan${
          syncFilamentTx && payload.price > 0 ? " dan otomatis tercatat di Buku Kas!" : "!"
        }`
      );
      setShowFilamentModal(false);
      loadData();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  // Submit Packaging
  const handleSubmitPackaging = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!packagingForm.name) {
      alert("Nama barang kemasan / produksi wajib diisi!");
      return;
    }

    try {
      const numPrice = parseFloat(packagingForm.price) || 0;
      const numQty = parseInt(packagingForm.quantity) || 1;
      const payload = {
        name: packagingForm.name,
        category: packagingForm.category,
        size: packagingForm.size || null,
        quantity: numQty,
        price: numPrice,
        purchaseDate: packagingForm.purchaseDate,
        notes: packagingForm.notes || null,
        productLink: packagingForm.productLink || null,
        syncTransaction: syncPackagingTx,
      };

      const res = await fetch("/api/flow/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Gagal menyimpan aset kemasan");

      triggerSuccess(
        `Aset ${payload.name} berhasil disimpan${
          syncPackagingTx && numPrice > 0 ? " dan otomatis tercatat di Buku Kas!" : "!"
        }`
      );
      setShowPackagingModal(false);
      loadData();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <GooNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Success Alert Banner */}
        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="font-semibold">{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg("")} className="text-emerald-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                Inventaris &amp; Stok
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {items.length} Spul • {packagingAssets.length} Aset Kemasan
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
              Inventaris Spul Filamen &amp; Aset
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Pemantauan stok spul filamen (gauge gramasi real-time), kardus packaging, dan perlengkapan produksi.
              Semua penambahan baru otomatis tersinkron ke Buku Kas &amp; Transaksi.
            </p>
          </div>

          {/* Action Buttons & Subtabs */}
          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
            <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800 shadow-md">
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

            <button
              onClick={() => setShowPackagingModal(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Boxes className="w-3.5 h-3.5 text-amber-400" />
              <span>+ Aset Kemasan</span>
            </button>
            <button
              onClick={() => setShowFilamentModal(true)}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-rose-600/30"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tambah Filamen</span>
            </button>
          </div>
        </div>

        {activeTab === "filament" ? (
          <>
            {/* Metrics Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div
                onClick={() => setStockStatus("all")}
                className={`p-4 rounded-3xl border cursor-pointer transition-all ${
                  stockStatus === "all"
                    ? "bg-rose-950/20 border-rose-500/40"
                    : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                }`}
              >
                <span className="text-slate-400 text-xs font-bold">Total Spul</span>
                <p className="text-2xl font-black text-white mt-1 font-mono">{totalSpools}</p>
                <span className="text-[10px] text-slate-400">Total Berat: {totalWeightKg} kg</span>
              </div>

              <div
                onClick={() => setStockStatus("in_stock")}
                className={`p-4 rounded-3xl border cursor-pointer transition-all ${
                  stockStatus === "in_stock"
                    ? "bg-emerald-950/20 border-emerald-500/40"
                    : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                }`}
              >
                <span className="text-emerald-400 text-xs font-bold">Stok Cukup</span>
                <p className="text-2xl font-black text-emerald-400 mt-1 font-mono">
                  {totalSpools - lowStockCount - emptyCount}
                </p>
                <span className="text-[10px] text-slate-400">&gt; 100g sisa</span>
              </div>

              <div
                onClick={() => setStockStatus("low")}
                className={`p-4 rounded-3xl border cursor-pointer transition-all ${
                  stockStatus === "low"
                    ? "bg-amber-950/20 border-amber-500/40"
                    : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                }`}
              >
                <span className="text-amber-400 text-xs font-bold">Menipis (Low)</span>
                <p className="text-2xl font-black text-amber-400 mt-1 font-mono">{lowStockCount}</p>
                <span className="text-[10px] text-slate-400">&le; 100g tersisa</span>
              </div>

              <div
                onClick={() => setStockStatus("empty")}
                className={`p-4 rounded-3xl border cursor-pointer transition-all ${
                  stockStatus === "empty"
                    ? "bg-rose-950/20 border-rose-500/40"
                    : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                }`}
              >
                <span className="text-rose-400 text-xs font-bold">Habis (0g)</span>
                <p className="text-2xl font-black text-rose-400 mt-1 font-mono">{emptyCount}</p>
                <span className="text-[10px] text-slate-400">Perlu restock</span>
              </div>
            </div>

            {/* Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Cari SKU, brand, warna filamen..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs rounded-xl bg-slate-900/80 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                {materials.map((mat) => (
                  <button
                    key={mat}
                    onClick={() => setSelectedMaterial(mat)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all uppercase ${
                      selectedMaterial === mat
                        ? "bg-rose-600 text-white shadow-md shadow-rose-600/30"
                        : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                    }`}
                  >
                    {mat}
                  </button>
                ))}
              </div>
            </div>

            {/* Spool Cards Grid */}
            {loading ? (
              <div className="text-center py-20 bg-slate-900/40 rounded-3xl border border-slate-800 text-slate-400 text-sm">
                Memuat data inventaris spul filamen...
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-dashed border-slate-800 text-slate-400 text-xs">
                Tidak ada spul filamen yang cocok dengan filter. Klik &ldquo;+ Tambah Filamen&rdquo; untuk mendaftarkan spul baru.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredItems.map((item) => {
                  const percent = Math.min(
                    100,
                    Math.round(((item.currentWeight || 0) / (item.initialWeight || 1000)) * 100)
                  );
                  const isLow =
                    item.currentWeight <= (item.lowStockThreshold || 100) && item.currentWeight > 0;
                  const isEmpty = item.currentWeight <= 0;

                  return (
                    <div
                      key={item.id}
                      className="bg-slate-900/60 rounded-3xl border border-slate-800 p-4 shadow-xl hover:border-slate-700 transition-all space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold border border-slate-700">
                            {item.brand}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                              isEmpty
                                ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                : isLow
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            }`}
                          >
                            {isEmpty ? "Habis" : isLow ? "Menipis" : "Ready"}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-full border border-white/20 shadow-md flex-shrink-0"
                            style={{ backgroundColor: item.colorHex || "#3b82f6" }}
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
                          {item.pricePerGram > 0 && <span>Rp{Math.round(item.pricePerGram)}/g</span>}
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
                  {filteredAssets.length} Aset Kemasan
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider font-mono">
                    <tr>
                      <th className="py-3 px-4">Nama Aset Kemasan</th>
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
                        <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                          {asset.quantity} unit
                        </td>
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

      {/* ══════════════════════════════════════════ */}
      {/* MODAL: TAMBAH SPUL FILAMEN BARU            */}
      {/* ══════════════════════════════════════════ */}
      {showFilamentModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-white">Tambah Spul Filamen Baru</h3>
                  <p className="text-[11px] text-slate-400">
                    Pencatatan inventaris filamen dengan sinkronisasi Buku Kas
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowFilamentModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitFilament} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Brand / Merk <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="eSUN / Sunlu / Bambu Lab"
                    value={filamentForm.brand}
                    onChange={(e) =>
                      setFilamentForm((prev) => ({ ...prev, brand: e.target.value }))
                    }
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Jenis Material <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={filamentForm.materialType}
                    onChange={(e) =>
                      setFilamentForm((prev) => ({ ...prev, materialType: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="PLA">PLA</option>
                    <option value="PLA+">PLA+</option>
                    <option value="PLA Matte">PLA Matte</option>
                    <option value="PETG">PETG</option>
                    <option value="ABS">ABS</option>
                    <option value="TPU">TPU</option>
                    <option value="ASA">ASA</option>
                    <option value="PC">PC</option>
                    <option value="Wood">Wood</option>
                    <option value="Nylon">Nylon (PA)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Nama Warna <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Black, Jade White, Grey"
                    value={filamentForm.color}
                    onChange={(e) =>
                      setFilamentForm((prev) => ({ ...prev, color: e.target.value }))
                    }
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Color Hex
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={filamentForm.colorHex}
                      onChange={(e) =>
                        setFilamentForm((prev) => ({ ...prev, colorHex: e.target.value }))
                      }
                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                    />
                    <input
                      type="text"
                      value={filamentForm.colorHex}
                      onChange={(e) =>
                        setFilamentForm((prev) => ({ ...prev, colorHex: e.target.value }))
                      }
                      className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 font-mono text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Berat Awal Spul (Gram)
                  </label>
                  <input
                    type="number"
                    placeholder="1000"
                    value={filamentForm.initialWeight}
                    onChange={(e) =>
                      setFilamentForm((prev) => ({
                        ...prev,
                        initialWeight: e.target.value,
                        currentWeight: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Berat Sekarang (Gram)
                  </label>
                  <input
                    type="number"
                    placeholder="1000"
                    value={filamentForm.currentWeight}
                    onChange={(e) =>
                      setFilamentForm((prev) => ({ ...prev, currentWeight: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Harga Beli Spul (Rp) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="150000"
                    value={filamentForm.price}
                    onChange={(e) =>
                      setFilamentForm((prev) => ({ ...prev, price: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Tanggal Beli
                  </label>
                  <input
                    type="date"
                    value={filamentForm.purchaseDate}
                    onChange={(e) =>
                      setFilamentForm((prev) => ({ ...prev, purchaseDate: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Link Toko / Produk (Opsional)
                </label>
                <input
                  type="url"
                  placeholder="https://tokopedia.com/..."
                  value={filamentForm.productLink}
                  onChange={(e) =>
                    setFilamentForm((prev) => ({ ...prev, productLink: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              {/* Auto sync to Transactions checkbox */}
              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-xs">
                <input
                  type="checkbox"
                  id="syncFilamentTx"
                  checked={syncFilamentTx}
                  onChange={(e) => setSyncFilamentTx(e.target.checked)}
                  className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 bg-slate-900 border-slate-700 cursor-pointer"
                />
                <label htmlFor="syncFilamentTx" className="text-slate-300 cursor-pointer select-none">
                  Otomatis catat pengeluaran di <strong>Buku Kas &amp; Transaksi</strong> (Rp{" "}
                  {Number(filamentForm.price || 0).toLocaleString()})
                </label>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowFilamentModal(false)}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30"
                >
                  Simpan Spul Filamen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════ */}
      {/* MODAL: TAMBAH ASET KEMASAN / PRODUKSI      */}
      {/* ══════════════════════════════════════════ */}
      {showPackagingModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                  <Boxes className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-white">Tambah Aset Kemasan &amp; Packaging</h3>
                  <p className="text-[11px] text-slate-400">
                    Pencatatan kardus, mail wrap, zip pouch &amp; otomatis masuk Buku Kas
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPackagingModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitPackaging} className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Kategori Aset <span className="text-rose-400">*</span>
                </label>
                <select
                  value={packagingForm.category}
                  onChange={(e) =>
                    setPackagingForm((prev) => ({
                      ...prev,
                      category: e.target.value as "packing" | "production",
                    }))
                  }
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="packing">Kemasan (Packaging / Kardus / Mailer / Pouch)</option>
                  <option value="production">Perlengkapan Produksi (Production Supplies)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Nama Barang <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Cardboard 20X15X10, Mail Wrap 30X50 HD"
                  value={packagingForm.name}
                  onChange={(e) =>
                    setPackagingForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Ukuran / Dimensi
                  </label>
                  <input
                    type="text"
                    placeholder="20X15X10 cm"
                    value={packagingForm.size}
                    onChange={(e) =>
                      setPackagingForm((prev) => ({ ...prev, size: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Jumlah Unit (Qty)
                  </label>
                  <input
                    type="number"
                    value={packagingForm.quantity}
                    onChange={(e) =>
                      setPackagingForm((prev) => ({ ...prev, quantity: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Harga Satuan (Rp)
                  </label>
                  <input
                    type="number"
                    placeholder="1500"
                    value={packagingForm.price}
                    onChange={(e) =>
                      setPackagingForm((prev) => ({ ...prev, price: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Tanggal Beli
                  </label>
                  <input
                    type="date"
                    value={packagingForm.purchaseDate}
                    onChange={(e) =>
                      setPackagingForm((prev) => ({ ...prev, purchaseDate: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Catatan / Link Produk
                </label>
                <input
                  type="text"
                  placeholder="Keterangan toko / link pembelian..."
                  value={packagingForm.notes}
                  onChange={(e) =>
                    setPackagingForm((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Auto sync to Transactions checkbox */}
              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-xs">
                <input
                  type="checkbox"
                  id="syncPackagingTx"
                  checked={syncPackagingTx}
                  onChange={(e) => setSyncPackagingTx(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 bg-slate-900 border-slate-700 cursor-pointer"
                />
                <label htmlFor="syncPackagingTx" className="text-slate-300 cursor-pointer select-none">
                  Otomatis catat pengeluaran di <strong>Buku Kas &amp; Transaksi</strong> (Total: Rp{" "}
                  {(
                    (Number(packagingForm.price) || 0) * (Number(packagingForm.quantity) || 1)
                  ).toLocaleString()}
                  )
                </label>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPackagingModal(false)}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/30"
                >
                  Simpan Aset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
