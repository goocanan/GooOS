"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

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
  pending: "bg-slate-100 text-slate-700",
  queued: "bg-blue-100 text-blue-700",
  printing: "bg-amber-100 text-amber-700",
  completed: "bg-emerald-100 text-emerald-700",
  shipped: "bg-purple-100 text-purple-700",
  failed: "bg-rose-100 text-rose-700",
};

export default function OrdersPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadOrders() {
      try {
        setLoading(true);
        const res = await fetch(`/api/workspaces/${slug}/flow/orders`);
        const json = await res.json();
        if (json.success) {
          setOrders(json.data);
        } else {
          setError(json.error || "Failed to load orders");
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, [slug]);

  const filtered = orders.filter(
    (o) =>
      search === "" ||
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.clientName.toLowerCase().includes(search.toLowerCase()) ||
      o.modelName.toLowerCase().includes(search.toLowerCase())
  );

  const totalRevenue = orders.reduce((acc, o) => acc + (o.price || 0), 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            3D Printing Orders
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track client 3D printing orders, production statuses, delivery deadlines, and billing.
          </p>
        </div>
        <div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-goo-50 text-goo-700 border border-goo-200">
            {orders.length} Orders (Rp{totalRevenue.toLocaleString()})
          </span>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200">
        <input
          type="text"
          placeholder="Search by order number, client name, or 3D model..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-goo-500/20 focus:border-goo-500"
        />
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200 text-slate-400 text-sm">
          Loading 3D print orders...
        </div>
      ) : error ? (
        <div className="text-center py-8 bg-rose-50 text-rose-600 rounded-xl text-sm">
          {error}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Model &amp; Material</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Qty</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                      {order.orderNumber}
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-semibold text-slate-900">{order.modelName}</p>
                        <p className="text-[11px] text-slate-400">
                          {order.materialType || "PLA"} &bull; {order.materialColor || "Default"}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700">{order.clientName}</td>
                    <td className="py-3 px-4 font-mono">{order.quantity}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      Rp{order.price ? order.price.toLocaleString() : "0"}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
                          ORDER_STATUS[order.status] || "bg-slate-100 text-slate-700"
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
    </div>
  );
}
