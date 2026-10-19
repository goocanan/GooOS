"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { GooNavbar } from "@/components/GooNavbar";

interface FlowStats {
  inventory: {
    totalSpools: number;
    totalWeightKg: number;
    totalValue: number;
    lowStockCount: number;
    emptyCount: number;
    lowStockList: Array<{
      id: string;
      sku: string;
      brand: string;
      color: string;
      colorHex: string | null;
      currentWeight: number;
      materialType: string;
    }>;
  };
  printers: {
    total: number;
    online: number;
    printing: number;
  };
  orders: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    recent: Array<{
      id: string;
      orderNumber: string;
      modelName: string;
      clientName: string;
      status: string;
      price: number;
      createdAt: string;
    }>;
  };
  finance: {
    totalIncome: number;
    totalExpense: number;
    netProfit: number;
  };
  productsCount: number;
}

export default function FlowHubPage() {
  const [stats, setStats] = useState<FlowStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        const res = await fetch("/api/flow/stats");
        const json = await res.json();
        if (json.success) {
          setStats(json.data);
        } else {
          setError(json.error || "Gagal memuat telemetri 3DFlow");
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <GooNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-8">
        {loading ? (
          <div className="p-16 text-center text-slate-400">
            <div className="animate-spin text-4xl mb-4">⚡</div>
            <p className="text-sm font-medium">Menghubungkan ke 3DFlow Operations Center...</p>
          </div>
        ) : error || !stats ? (
          <div className="bg-rose-950/40 border border-rose-800 text-rose-300 p-6 rounded-2xl text-sm">
            {error || "Tidak dapat memuat telemetri"}
          </div>
        ) : (
          <>
            {/* Top Banner */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-rose-950/60 via-slate-900 to-indigo-950/60 p-6 rounded-3xl border border-rose-500/20 text-white shadow-xl">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase tracking-wider">
                    3DFlow Hub
                  </span>
                  <span className="text-xs text-slate-400 font-mono">Farm Telemetry: Online</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                  3D Flow &bull; Operations Hub
                </h1>
                <p className="text-xs text-slate-300">
                  Precision telemetry, konsumsi material filamen, beban armada printer, dan performa buku kas keuangan.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href="/calculator"
                  className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors shadow-md shadow-rose-600/30"
                >
                  + Hitung Kalkulasi Harga
                </Link>
                <Link
                  href="/orders"
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs transition-colors border border-slate-700"
                >
                  Kelola Pesanan &rarr;
                </Link>
              </div>
            </div>

            {/* Primary KPI Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Filament Stock */}
              <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 shadow-md space-y-2">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span className="font-semibold uppercase tracking-wider">Stok Filamen</span>
                  <span className="text-lg">🧵</span>
                </div>
                <p className="text-3xl font-black text-white font-mono">
                  {stats.inventory.totalWeightKg} <span className="text-sm font-normal text-slate-400 font-sans">kg</span>
                </p>
                <div className="flex justify-between items-center text-[11px] pt-2 border-t border-slate-800">
                  <span className="text-slate-400">{stats.inventory.totalSpools} Spul Terdaftar</span>
                  <span className="font-semibold text-rose-400 font-mono">
                    Rp {stats.inventory.totalValue.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Printer Farm */}
              <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 shadow-md space-y-2">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span className="font-semibold uppercase tracking-wider">Armada 3D Farm</span>
                  <span className="text-lg">🖨️</span>
                </div>
                <p className="text-3xl font-black text-white font-mono">
                  {stats.printers.printing} <span className="text-sm font-normal text-slate-400 font-sans">/ {stats.printers.total} Aktif</span>
                </p>
                <div className="flex justify-between items-center text-[11px] pt-2 border-t border-slate-800">
                  <span className="text-emerald-400 font-medium">&bull; {stats.printers.online} Online</span>
                  <Link href="/printers" className="text-rose-400 hover:underline">
                    Lihat Armada &rarr;
                  </Link>
                </div>
              </div>

              {/* Orders in Production */}
              <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 shadow-md space-y-2">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span className="font-semibold uppercase tracking-wider">Antrean Produksi</span>
                  <span className="text-lg">📋</span>
                </div>
                <p className="text-3xl font-black text-white font-mono">
                  {stats.orders.pending + stats.orders.inProgress} <span className="text-sm font-normal text-slate-400 font-sans">Jobs</span>
                </p>
                <div className="flex justify-between items-center text-[11px] pt-2 border-t border-slate-800">
                  <span className="text-slate-400">{stats.orders.completed} Selesai</span>
                  <span className="font-medium text-slate-300 font-mono">{stats.orders.total} Total Pesanan</span>
                </div>
              </div>

              {/* Net Profit */}
              <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 shadow-md space-y-2">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span className="font-semibold uppercase tracking-wider">Laba Bersih Flow</span>
                  <span className="text-lg">💳</span>
                </div>
                <p className="text-3xl font-black text-white font-mono">
                  Rp {(stats.finance.netProfit / 1000000).toFixed(1)}M
                </p>
                <div className="flex justify-between items-center text-[11px] pt-2 border-t border-slate-800">
                  <span className="text-emerald-400 font-medium">
                    Masuk: Rp {(stats.finance.totalIncome / 1000000).toFixed(1)}M
                  </span>
                  <Link href="/transactions" className="text-rose-400 hover:underline">
                    Buku Kas &rarr;
                  </Link>
                </div>
              </div>
            </div>

            {/* Middle Row: Low Stock Alerts + Recent Orders */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Low Stock Spools Alert */}
              <div className="lg:col-span-5 bg-slate-900/60 p-6 rounded-3xl border border-slate-800 shadow-md space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                    <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                      Spul Menipis ({stats.inventory.lowStockCount})
                    </h2>
                  </div>
                  <Link href="/inventory" className="text-xs text-rose-400 hover:underline font-semibold">
                    Restock &rarr;
                  </Link>
                </div>

                {stats.inventory.lowStockList.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-6 text-center">
                    Semua stok filamen aman di atas batas peringatan.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {stats.inventory.lowStockList.map((spool) => (
                      <div
                        key={spool.id}
                        className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/20 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-4 h-4 rounded-full border border-amber-400/50 flex-shrink-0"
                            style={{ backgroundColor: spool.colorHex || "#f59e0b" }}
                          />
                          <div>
                            <p className="font-bold text-slate-200 leading-tight">
                              {spool.brand} {spool.materialType}
                            </p>
                            <p className="text-[11px] text-slate-400 font-mono">
                              {spool.color} &bull; {spool.sku}
                            </p>
                          </div>
                        </div>
                        <span className="font-bold font-mono text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                          {spool.currentWeight}g sisa
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Orders List */}
              <div className="lg:col-span-7 bg-slate-900/60 p-6 rounded-3xl border border-slate-800 shadow-md space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                    Pesanan Produksi Terbaru
                  </h2>
                  <Link href="/orders" className="text-xs text-rose-400 hover:underline font-semibold">
                    Semua Pesanan ({stats.orders.total}) &rarr;
                  </Link>
                </div>

                <div className="space-y-2">
                  {stats.orders.recent.map((order) => (
                    <div
                      key={order.id}
                      className="p-3.5 rounded-2xl bg-slate-950/50 border border-slate-800/80 hover:border-slate-700 transition-colors flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5 max-w-[60%]">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-400 text-[10px]">{order.orderNumber}</span>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 capitalize">
                            {order.status}
                          </span>
                        </div>
                        <p className="font-bold text-slate-100 truncate">{order.modelName}</p>
                        <p className="text-[11px] text-slate-400">Klien: {order.clientName}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-rose-400 text-sm font-mono">
                          Rp {order.price ? order.price.toLocaleString() : "0"}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Navigation Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Link
                href="/products"
                className="p-5 bg-slate-900/60 rounded-2xl border border-slate-800 hover:border-rose-500/40 hover:bg-slate-900/80 transition-all block group shadow-md"
              >
                <span className="text-2xl mb-2 block">🏷️</span>
                <p className="font-bold text-slate-200 text-sm group-hover:text-rose-400">Katalog Produk 3D</p>
                <p className="text-xs text-slate-400 mt-1">{stats.productsCount} Model Siap Cetak</p>
              </Link>
              <Link
                href="/transactions"
                className="p-5 bg-slate-900/60 rounded-2xl border border-slate-800 hover:border-rose-500/40 hover:bg-slate-900/80 transition-all block group shadow-md"
              >
                <span className="text-2xl mb-2 block">💳</span>
                <p className="font-bold text-slate-200 text-sm group-hover:text-rose-400">Buku Kas &amp; Finansial</p>
                <p className="text-xs text-slate-400 mt-1">474 Transaksi Shopee &amp; Tokopedia</p>
              </Link>
              <Link
                href="/projects"
                className="p-5 bg-slate-900/60 rounded-2xl border border-slate-800 hover:border-indigo-500/40 hover:bg-slate-900/80 transition-all block group shadow-md"
              >
                <span className="text-2xl mb-2 block">📦</span>
                <p className="font-bold text-slate-200 text-sm group-hover:text-indigo-400">Proyek 3D (GOO-Studio)</p>
                <p className="text-xs text-slate-400 mt-1">14 Proyek &bull; 265 File Part STL</p>
              </Link>
              <Link
                href="/cad"
                className="p-5 bg-slate-900/60 rounded-2xl border border-slate-800 hover:border-cyan-500/40 hover:bg-slate-900/80 transition-all block group shadow-md"
              >
                <span className="text-2xl mb-2 block">📐</span>
                <p className="font-bold text-slate-200 text-sm group-hover:text-cyan-400">GooPrint CAD Studio</p>
                <p className="text-xs text-slate-400 mt-1">Parametric 3D &bull; Slicer Bridge</p>
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
