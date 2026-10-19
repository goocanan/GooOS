"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { GooNavbar } from "@/components/GooNavbar";

interface Order {
  id: string;
  orderNumber: string;
  modelName: string;
  clientName: string;
  status: string;
  progress: number;
  price: number;
  materialType: string | null;
  materialColor: string | null;
  quantity: number;
  dueDate: string | null;
  createdAt: string;
}

const ORDER_STATUS: Record<string, string> = {
  pending: "bg-slate-800 text-slate-300 border-slate-700",
  queued: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  printing: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  completed: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  shipped: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  failed: "bg-rose-500/20 text-rose-300 border-rose-500/30",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadOrders() {
      try {
        setLoading(true);
        const res = await fetch("/api/flow/orders");
        const json = await res.json();
        if (json.success) {
          setOrders(json.data);
        } else {
          setError(json.error || "Gagal memuat pesanan cetak");
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, []);

  const filtered = orders.filter(
    (o) =>
      search === "" ||
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.clientName.toLowerCase().includes(search.toLowerCase()) ||
      o.modelName.toLowerCase().includes(search.toLowerCase())
  );

  const totalRevenue = orders.reduce((acc, o) => acc + (o.price || 0), 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <GooNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                3DFlow Production
              </span>
              <span className="text-xs text-slate-400 font-mono">69 Pesanan Klien</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
              Pesanan Cetak 3D &amp; Antrean Produksi
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Tracking pesanan cetak dari klien, status antrean cetak, tanggal deadline pengiriman, dan nilai transaksi order.
            </p>
          </div>
          <div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 font-mono">
              {orders.length} Pesanan (Rp {totalRevenue.toLocaleString()})
            </span>
          </div>
        </div>

        {/* Search */}
        <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 shadow-md">
          <input
            type="text"
            placeholder="Cari berdasarkan nomor pesanan (#3DF-...), nama klien, atau nama model 3D..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
          />
        </div>

        {/* Orders Table */}
        {loading ? (
          <div className="text-center py-20 bg-slate-900/40 rounded-3xl border border-slate-800 text-slate-400 text-sm">
            Memuat pesanan cetak 3D...
          </div>
        ) : error ? (
          <div className="text-center py-8 bg-rose-950/40 text-rose-300 border border-rose-800 rounded-3xl text-sm">
            {error}
          </div>
        ) : (
          <div className="bg-slate-900/60 rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">No. Order</th>
                    <th className="py-3 px-4">Model &amp; Material</th>
                    <th className="py-3 px-4">Nama Klien</th>
                    <th className="py-3 px-4">Qty</th>
                    <th className="py-3 px-4">Harga Order</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filtered.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-white">
                        {order.orderNumber}
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-bold text-white">{order.modelName}</p>
                          <p className="text-[11px] text-slate-400 font-mono">
                            {order.materialType || "PLA"} &bull; {order.materialColor || "Default"}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-300">{order.clientName}</td>
                      <td className="py-3 px-4 font-mono font-bold text-white">{order.quantity}</td>
                      <td className="py-3 px-4 font-semibold text-rose-400 font-mono">
                        Rp {order.price ? order.price.toLocaleString() : "0"}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize border ${
                            ORDER_STATUS[order.status] || "bg-slate-800 text-slate-300 border-slate-700"
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
