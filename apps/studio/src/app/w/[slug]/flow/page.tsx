"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

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
  const params = useParams();
  const slug = params.slug as string;

  const [stats, setStats] = useState<FlowStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        const res = await fetch(`/api/workspaces/${slug}/flow/stats`);
        const json = await res.json();
        if (json.success) {
          setStats(json.data);
        } else {
          setError(json.error || "Failed to load flow stats");
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, [slug]);

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400 max-w-7xl mx-auto">
        <div className="animate-spin text-3xl mb-3">⚡</div>
        <p className="text-sm font-medium">Connecting to 3D Flow Command Center...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl text-sm">
          {error || "Unable to load telemetry"}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 rounded-2xl text-white shadow-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase tracking-wider">
              3DFlow Operations
            </span>
            <span className="text-xs text-slate-400 font-mono">Farm Status: Online</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">3D Flow &bull; Operations Hub</h1>
          <p className="text-xs text-slate-300">
            Precision telemetry, material consumption, printer farm load, and financial performance.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/w/${slug}/calculator`}
            className="px-4 py-2 rounded-xl bg-goo-600 hover:bg-goo-700 text-white font-semibold text-xs transition-colors shadow-sm"
          >
            + Calculate Quote
          </Link>
          <Link
            href={`/w/${slug}/orders`}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-xs transition-colors border border-white/10"
          >
            Manage Orders &rarr;
          </Link>
        </div>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Filament Stock */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold uppercase tracking-wider">Filament Stock</span>
            <span className="text-lg">🧵</span>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 font-mono">
            {stats.inventory.totalWeightKg} <span className="text-sm font-normal text-slate-500 font-sans">kg</span>
          </p>
          <div className="flex justify-between items-center text-[11px] pt-1 border-t border-slate-100">
            <span className="text-slate-500">{stats.inventory.totalSpools} Spools Available</span>
            <span className="font-semibold text-goo-700">Rp {stats.inventory.totalValue.toLocaleString()}</span>
          </div>
        </div>

        {/* Printer Farm */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold uppercase tracking-wider">3D Farm Fleet</span>
            <span className="text-lg">🖨️</span>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 font-mono">
            {stats.printers.printing} <span className="text-sm font-normal text-slate-500 font-sans">/ {stats.printers.total} Active</span>
          </p>
          <div className="flex justify-between items-center text-[11px] pt-1 border-t border-slate-100">
            <span className="text-emerald-600 font-medium">&bull; {stats.printers.online} Online</span>
            <Link href={`/w/${slug}/printers`} className="text-goo-600 hover:underline">View Fleet &rarr;</Link>
          </div>
        </div>

        {/* Orders in Production */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold uppercase tracking-wider">Production Queue</span>
            <span className="text-lg">📋</span>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 font-mono">
            {stats.orders.pending + stats.orders.inProgress} <span className="text-sm font-normal text-slate-500 font-sans">Jobs</span>
          </p>
          <div className="flex justify-between items-center text-[11px] pt-1 border-t border-slate-100">
            <span className="text-slate-500">{stats.orders.completed} Completed</span>
            <span className="font-medium text-slate-700">{stats.orders.total} Total Orders</span>
          </div>
        </div>

        {/* Net Profit */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold uppercase tracking-wider">Net Flow Profit</span>
            <span className="text-lg">💳</span>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 font-mono">
            Rp {(stats.finance.netProfit / 1000000).toFixed(1)}M
          </p>
          <div className="flex justify-between items-center text-[11px] pt-1 border-t border-slate-100">
            <span className="text-emerald-600 font-medium">Income: Rp {(stats.finance.totalIncome / 1000000).toFixed(1)}M</span>
            <Link href={`/w/${slug}/transactions`} className="text-goo-600 hover:underline">Ledger &rarr;</Link>
          </div>
        </div>
      </div>

      {/* Middle Row: Low Stock Alerts + Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Low Stock Spools Alert */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Low Stock Spools ({stats.inventory.lowStockCount})
              </h2>
            </div>
            <Link href={`/w/${slug}/inventory`} className="text-xs text-goo-600 hover:underline font-semibold">
              Restock &rarr;
            </Link>
          </div>

          {stats.inventory.lowStockList.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-6 text-center">
              All filamen stocks are above the warning threshold.
            </p>
          ) : (
            <div className="space-y-2.5">
              {stats.inventory.lowStockList.map((spool) => (
                <div
                  key={spool.id}
                  className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/60 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-4 h-4 rounded-full border border-amber-300 shadow-inner flex-shrink-0"
                      style={{ backgroundColor: spool.colorHex || "#f59e0b" }}
                    />
                    <div>
                      <p className="font-bold text-slate-900 leading-tight">
                        {spool.brand} {spool.materialType}
                      </p>
                      <p className="text-[11px] text-slate-500 font-mono">{spool.color} &bull; {spool.sku}</p>
                    </div>
                  </div>
                  <span className="font-bold font-mono text-amber-700 bg-amber-100 px-2.5 py-1 rounded-lg">
                    {spool.currentWeight}g left
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Orders List */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Recent Production Orders
            </h2>
            <Link href={`/w/${slug}/orders`} className="text-xs text-goo-600 hover:underline font-semibold">
              View All Orders &rarr;
            </Link>
          </div>

          <div className="space-y-2">
            {stats.orders.recent.map((order) => (
              <div
                key={order.id}
                className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-300 transition-colors flex items-center justify-between text-xs"
              >
                <div className="space-y-0.5 max-w-[60%]">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-400 text-[10px]">{order.orderNumber}</span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-blue-100 text-blue-700 capitalize">
                      {order.status}
                    </span>
                  </div>
                  <p className="font-bold text-slate-900 truncate">{order.modelName}</p>
                  <p className="text-[11px] text-slate-500">Client: {order.clientName}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900 text-sm font-mono">
                    Rp {order.price ? order.price.toLocaleString() : "0"}
                  </p>
                  <p className="text-[10px] text-slate-400">
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
          href={`/w/${slug}/products`}
          className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-goo-400 hover:shadow-md transition-all block group"
        >
          <span className="text-2xl mb-2 block">🏷️</span>
          <p className="font-bold text-slate-900 text-sm group-hover:text-goo-600">Product Catalog</p>
          <p className="text-xs text-slate-500 mt-1">{stats.productsCount} Priced Models</p>
        </Link>
        <Link
          href={`/w/${slug}/transactions`}
          className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-goo-400 hover:shadow-md transition-all block group"
        >
          <span className="text-2xl mb-2 block">💳</span>
          <p className="font-bold text-slate-900 text-sm group-hover:text-goo-600">Financial Ledger</p>
          <p className="text-xs text-slate-500 mt-1">Income &bull; Expenses &bull; Shopee</p>
        </Link>
        <Link
          href={`/w/${slug}/projects`}
          className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-goo-400 hover:shadow-md transition-all block group"
        >
          <span className="text-2xl mb-2 block">📦</span>
          <p className="font-bold text-slate-900 text-sm group-hover:text-goo-600">3D Projects (Studio)</p>
          <p className="text-xs text-slate-500 mt-1">Multi-part STL &bull; Durations</p>
        </Link>
        <Link
          href={`/w/${slug}/cad`}
          className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-goo-400 hover:shadow-md transition-all block group"
        >
          <span className="text-2xl mb-2 block">📐</span>
          <p className="font-bold text-slate-900 text-sm group-hover:text-goo-600">GooPrint CAD</p>
          <p className="text-xs text-slate-500 mt-1">AI 3D &bull; Gridfinity &bull; Slicer</p>
        </Link>
      </div>
    </div>
  );
}
