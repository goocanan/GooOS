"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { GooNavbar } from "@/components/GooNavbar";
import {
  Plus,
  Trash2,
  Eye,
  Search,
  Package,
  User,
  Clock,
  Calendar,
  Layers,
  Scale,
  Printer,
  Copy,
  Check,
  X,
  Store,
  ShoppingBag,
  MessageCircle,
  AlertTriangle,
  FileText,
  DollarSign,
  Sparkles,
} from "lucide-react";

interface OrderItem {
  id: string;
  orderId: string;
  inventoryId?: string | null;
  weightUsed: number;
  cost: number;
}

interface Order {
  id: string;
  workspaceId?: string;
  userId?: string;
  orderNumber: string;
  modelName: string;
  clientName: string;
  status: string;
  progress: number;
  price: number;
  source: string;
  materialType: string | null;
  materialColor: string | null;
  quantity: number;
  qtyPart: number;
  infill: string | null;
  layerHeight: string | null;
  weight: number | null;
  time: number | null;
  dueDate: string | null;
  modelImageUrl?: string | null;
  batchId?: string | null;
  errorMessage?: string | null;
  createdAt: string;
  items?: OrderItem[];
}

const ORDER_STATUS: Record<
  string,
  { label: string; badge: string; text: string; bg: string }
> = {
  pending: {
    label: "Pending",
    badge: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    text: "text-amber-400",
    bg: "bg-amber-500",
  },
  queued: {
    label: "Queued",
    badge: "bg-slate-700/40 text-slate-300 border-slate-600/40",
    text: "text-slate-400",
    bg: "bg-slate-500",
  },
  printing: {
    label: "Printing",
    badge: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    text: "text-blue-400",
    bg: "bg-blue-500",
  },
  printed: {
    label: "Printed",
    badge: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
    text: "text-indigo-400",
    bg: "bg-indigo-500",
  },
  completed: {
    label: "Completed",
    badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    text: "text-emerald-400",
    bg: "bg-emerald-500",
  },
  shipped: {
    label: "Shipped",
    badge: "bg-purple-500/15 text-purple-300 border-purple-500/30",
    text: "text-purple-400",
    bg: "bg-purple-500",
  },
  failed: {
    label: "Failed",
    badge: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    text: "text-rose-400",
    bg: "bg-rose-500",
  },
  cancelled: {
    label: "Cancelled",
    badge: "bg-slate-800 text-slate-500 border-slate-700",
    text: "text-slate-500",
    bg: "bg-slate-600",
  },
};

interface SourceInfo {
  label: string;
  color: string;
  Icon: any;
}

const DEFAULT_SOURCE: SourceInfo = {
  label: "Direct",
  color: "text-rose-400 bg-rose-500/10 border-rose-500/20",
  Icon: User,
};

const SOURCE_CONFIG: Record<string, SourceInfo> = {
  tokopedia: {
    label: "Tokopedia",
    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    Icon: Store,
  },
  shopee: {
    label: "Shopee",
    color: "text-orange-400 bg-orange-500/10 border-orange-500/20",
    Icon: ShoppingBag,
  },
  whatsapp: {
    label: "WhatsApp",
    color: "text-teal-400 bg-teal-500/10 border-teal-500/20",
    Icon: MessageCircle,
  },
  direct: DEFAULT_SOURCE,
};

const formatIDR = (val: number) => "Rp " + (val || 0).toLocaleString("id-ID");

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [deleteConfirmOrder, setDeleteConfirmOrder] = useState<Order | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedQuote, setCopiedQuote] = useState(false);

  // Create Form State
  const [form, setForm] = useState({
    orderNumber: "",
    modelName: "",
    clientName: "",
    source: "direct",
    materialType: "PLA",
    materialColor: "Hitam",
    quantity: 1,
    qtyPart: 1,
    layerHeight: "0.20",
    infill: "15%",
    weight: 120,
    time: 4.5,
    price: 75000,
    status: "pending",
    dueDate: "",
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

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

  useEffect(() => {
    loadOrders();
  }, []);

  // Set default order number on open modal
  const openCreateModal = () => {
    let maxNum = 1000;
    for (const o of orders) {
      const m = o.orderNumber.match(/\d+/);
      if (m) {
        const n = parseInt(m[0], 10);
        if (n > maxNum) maxNum = n;
      }
    }
    setForm({
      orderNumber: `#3DF-${maxNum + 1}`,
      modelName: "",
      clientName: "",
      source: "direct",
      materialType: "PLA",
      materialColor: "Hitam",
      quantity: 1,
      qtyPart: 1,
      layerHeight: "0.20",
      infill: "15%",
      weight: 120,
      time: 4.5,
      price: 75000,
      status: "pending",
      dueDate: "",
    });
    setIsCreateOpen(true);
  };

  // Submit Create Order
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.modelName.trim() || !form.clientName.trim()) {
      alert("Nama Model dan Nama Klien wajib diisi!");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/flow/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json.success) {
        setIsCreateOpen(false);
        showToast(`Pesanan ${json.data.orderNumber} berhasil ditambahkan!`);
        await loadOrders();
      } else {
        alert("Gagal menambahkan pesanan: " + json.error);
      }
    } catch (err: any) {
      alert("Terjadi kesalahan: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Quick Status Change
  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/flow/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (json.success) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        );
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: newStatus });
        }
        showToast(`Status diubah menjadi "${ORDER_STATUS[newStatus]?.label || newStatus}"`);
      } else {
        alert("Gagal memperbarui status: " + json.error);
      }
    } catch (err: any) {
      alert("Gagal memperbarui status: " + err.message);
    }
  };

  // Delete Order
  const handleDeleteSubmit = async () => {
    if (!deleteConfirmOrder) return;
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/flow/orders/${deleteConfirmOrder.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        setOrders((prev) => prev.filter((o) => o.id !== deleteConfirmOrder.id));
        if (selectedOrder?.id === deleteConfirmOrder.id) {
          setSelectedOrder(null);
        }
        showToast(`Pesanan ${deleteConfirmOrder.orderNumber} telah dihapus.`);
        setDeleteConfirmOrder(null);
      } else {
        alert("Gagal menghapus pesanan: " + json.error);
      }
    } catch (err: any) {
      alert("Gagal menghapus pesanan: " + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  // Copy WhatsApp Template
  const handleCopyQuote = (order: Order) => {
    const text = `*KONFIRMASI PESANAN 3D PRINTING - 3DFLOW*
---------------------------------------
*No. Pesanan:* ${order.orderNumber}
*Nama Klien:* ${order.clientName}
*Model 3D:* ${order.modelName}
*Spesifikasi Cetak:*
- Material: ${order.materialType || "PLA"} (${order.materialColor || "Default"})
- Layer Height: ${order.layerHeight || "0.20"} mm
- Infill: ${order.infill || "15%"}
- Jumlah: ${order.quantity} pcs ${order.qtyPart > 1 ? `(${order.qtyPart} parts)` : ""}
- Estimasi Berat: ${order.weight || 120} gram
- Estimasi Waktu: ${order.time || 4.5} jam
*Target Selesai:* ${order.dueDate ? new Date(order.dueDate).toLocaleDateString("id-ID") : "Sesuai Antrean"}
*Total Biaya:* ${formatIDR(order.price)}
*Status:* ${ORDER_STATUS[order.status]?.label || order.status}
---------------------------------------
Terima kasih telah mencetak di studio kami!`;

    navigator.clipboard.writeText(text);
    setCopiedQuote(true);
    setTimeout(() => setCopiedQuote(false), 2500);
    showToast("Template WhatsApp berhasil disalin ke clipboard!");
  };

  // Filtering
  const filtered = orders.filter((o) => {
    const matchesSearch =
      search === "" ||
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.clientName.toLowerCase().includes(search.toLowerCase()) ||
      o.modelName.toLowerCase().includes(search.toLowerCase()) ||
      (o.materialType && o.materialType.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === "all" || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalRevenue = orders.reduce((acc, o) => acc + (o.price || 0), 0);
  const activeOrdersCount = orders.filter(
    (o) => o.status !== "completed" && o.status !== "cancelled"
  ).length;
  const completedOrdersCount = orders.filter((o) => o.status === "completed").length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <GooNavbar />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] bg-emerald-500 text-slate-950 font-bold py-2.5 px-6 rounded-2xl shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-200">
          <Check className="w-5 h-5 text-slate-950 stroke-[3]" />
          <span className="text-sm">{toastMessage}</span>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1.5">
                <Printer className="w-3.5 h-3.5" />
                3DFlow Production
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {orders.length} Pesanan Terdaftar
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Pesanan Cetak 3D &amp; Antrean Produksi
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Kelola pesanan klien, parameter spesifikasi slicing cetak 3D, status produksi mesin,
              serta riwayat omzet secara terpusat di GooOS.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={openCreateModal}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-rose-500/20 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              Tambah Pesanan
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 shadow-md">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>Total Pesanan</span>
              <Package className="w-4 h-4 text-slate-500" />
            </div>
            <p className="text-xl sm:text-2xl font-black text-white font-mono mt-2">
              {orders.length}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">Semua riwayat pesanan</p>
          </div>

          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 shadow-md">
            <div className="flex items-center justify-between text-blue-400 text-xs font-semibold">
              <span>Pesanan Aktif</span>
              <Clock className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-xl sm:text-2xl font-black text-blue-400 font-mono mt-2">
              {activeOrdersCount}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">Sedang dalam antrean/cetak</p>
          </div>

          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 shadow-md">
            <div className="flex items-center justify-between text-emerald-400 text-xs font-semibold">
              <span>Pesanan Selesai</span>
              <Check className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-xl sm:text-2xl font-black text-emerald-400 font-mono mt-2">
              {completedOrdersCount}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">Cetak berhasil &amp; lunas</p>
          </div>

          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 shadow-md">
            <div className="flex items-center justify-between text-rose-400 text-xs font-semibold">
              <span>Total Omzet</span>
              <DollarSign className="w-4 h-4 text-rose-400" />
            </div>
            <p className="text-lg sm:text-xl font-black text-rose-400 font-mono mt-2 truncate">
              {formatIDR(totalRevenue)}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">Nilai transaksi keseluruhan</p>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Cari berdasarkan nomor pesanan (#3DF-...), nama klien, model, atau material..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500/50"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {[
              { id: "all", label: "Semua" },
              { id: "pending", label: "Pending" },
              { id: "queued", label: "Queued" },
              { id: "printing", label: "Printing" },
              { id: "completed", label: "Completed" },
              { id: "shipped", label: "Shipped" },
              { id: "failed", label: "Failed" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  statusFilter === tab.id
                    ? "bg-rose-500 text-white shadow-sm"
                    : "bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Orders Table */}
        {loading ? (
          <div className="text-center py-20 bg-slate-900/40 rounded-3xl border border-slate-800 text-slate-400 text-sm animate-pulse">
            <Printer className="w-8 h-8 mx-auto mb-2 text-slate-600 animate-bounce" />
            Memuat data antrean pesanan cetak...
          </div>
        ) : error ? (
          <div className="text-center py-8 bg-rose-950/40 text-rose-300 border border-rose-800 rounded-3xl text-sm">
            {error}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-slate-800 text-slate-400">
            <Package className="w-12 h-12 mx-auto mb-3 text-slate-600" />
            <h3 className="font-bold text-base text-white">Tidak ada pesanan yang sesuai</h3>
            <p className="text-xs text-slate-500 mt-1">
              Coba sesuaikan kata kunci pencarian atau ubah tab filter status.
            </p>
          </div>
        ) : (
          <div className="bg-slate-900/60 rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">No. Order</th>
                    <th className="py-3.5 px-4">Model &amp; Spesifikasi</th>
                    <th className="py-3.5 px-4">Klien &amp; Sumber</th>
                    <th className="py-3.5 px-4">Qty</th>
                    <th className="py-3.5 px-4">Harga Order</th>
                    <th className="py-3.5 px-4">Status Produksi</th>
                    <th className="py-3.5 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {filtered.map((order) => {
                    const sourceKey = order.source ? order.source.toLowerCase() : "direct";
                    const sourceInfo: SourceInfo = SOURCE_CONFIG[sourceKey] || DEFAULT_SOURCE;
                    const SourceIcon = sourceInfo.Icon;

                    return (
                      <tr
                        key={order.id}
                        className="hover:bg-slate-800/30 transition-colors group"
                      >
                        {/* Order Number */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col">
                            <span className="font-mono font-bold text-white text-sm">
                              {order.orderNumber}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {new Date(order.createdAt).toLocaleDateString("id-ID", {
                                day: "2-digit",
                                month: "short",
                              })}
                            </span>
                          </div>
                        </td>

                        {/* Model & Specs */}
                        <td className="py-3.5 px-4">
                          <div>
                            <p className="font-bold text-white text-sm group-hover:text-rose-400 transition-colors">
                              {order.modelName}
                            </p>
                            <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400 font-mono">
                              <span className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300">
                                {order.materialType || "PLA"} • {order.materialColor || "Default"}
                              </span>
                              <span>{order.layerHeight || "0.20"}mm</span>
                              <span>•</span>
                              <span>{order.infill || "15%"}</span>
                            </div>
                          </div>
                        </td>

                        {/* Client & Source */}
                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-slate-200">{order.clientName}</p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span
                              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase border ${sourceInfo.color}`}
                            >
                              <SourceIcon className="w-2.5 h-2.5" />
                              {sourceInfo.label}
                            </span>
                          </div>
                        </td>

                        {/* Quantity */}
                        <td className="py-3.5 px-4">
                          <span className="font-mono font-bold text-white text-sm">
                            {order.quantity} pcs
                          </span>
                          {order.qtyPart > 1 && (
                            <p className="text-[10px] text-slate-500 font-mono">
                              {order.qtyPart} parts/pc
                            </p>
                          )}
                        </td>

                        {/* Price */}
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-rose-400 font-mono text-sm">
                            {formatIDR(order.price)}
                          </span>
                        </td>

                        {/* Status Dropdown */}
                        <td className="py-3.5 px-4">
                          <select
                            value={order.status}
                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                            className={`text-[11px] px-2.5 py-1 rounded-xl font-bold uppercase border bg-slate-950 cursor-pointer outline-none transition-all ${
                              ORDER_STATUS[order.status]?.badge ||
                              "bg-slate-800 text-slate-300 border-slate-700"
                            }`}
                          >
                            <option value="pending" className="bg-slate-900 text-amber-400">
                              Pending
                            </option>
                            <option value="queued" className="bg-slate-900 text-slate-300">
                              Queued
                            </option>
                            <option value="printing" className="bg-slate-900 text-blue-400">
                              Printing
                            </option>
                            <option value="printed" className="bg-slate-900 text-indigo-400">
                              Printed
                            </option>
                            <option value="completed" className="bg-slate-900 text-emerald-400">
                              Completed
                            </option>
                            <option value="shipped" className="bg-slate-900 text-purple-400">
                              Shipped
                            </option>
                            <option value="failed" className="bg-slate-900 text-rose-400">
                              Failed
                            </option>
                            <option value="cancelled" className="bg-slate-900 text-slate-500">
                              Cancelled
                            </option>
                          </select>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedOrder(order)}
                              title="Lihat Detail Pesanan"
                              className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-all shadow-sm"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmOrder(order)}
                              title="Hapus Pesanan"
                              className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/40 transition-all shadow-sm"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* ======================================================== */}
      {/* MODAL: TAMBAH PESANAN (CREATE ORDER)                    */}
      {/* ======================================================== */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
                  <Plus className="w-5 h-5 stroke-[3]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Tambah Pesanan Cetak 3D</h2>
                  <p className="text-xs text-slate-400">
                    Input detail pesanan baru ke antrean produksi 3DFlow GooOS
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {/* Row 1: Order No & Klien */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    Nomor Pesanan (Auto / Kustom)
                  </label>
                  <input
                    type="text"
                    required
                    value={form.orderNumber}
                    onChange={(e) => setForm({ ...form, orderNumber: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    Nama Klien / Pembeli <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Budi Santoso / PT Kreasi"
                    value={form.clientName}
                    onChange={(e) => setForm({ ...form, clientName: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Row 2: Model Name & Sumber */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    Nama Model 3D <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Mechanical Gearbox V2 / Articulated Dragon"
                    value={form.modelName}
                    onChange={(e) => setForm({ ...form, modelName: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    Sumber Pesanan
                  </label>
                  <select
                    value={form.source}
                    onChange={(e) => setForm({ ...form, source: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
                  >
                    <option value="direct">Direct (Langsung)</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="shopee">Shopee</option>
                    <option value="tokopedia">Tokopedia</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Material & Color & Quantity */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    Tipe Material
                  </label>
                  <select
                    value={form.materialType}
                    onChange={(e) => setForm({ ...form, materialType: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
                  >
                    <option value="PLA">PLA</option>
                    <option value="PETG">PETG</option>
                    <option value="ABS">ABS</option>
                    <option value="TPU">TPU (Flex)</option>
                    <option value="ASA">ASA</option>
                    <option value="Resin">Resin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    Warna Filamen
                  </label>
                  <input
                    type="text"
                    value={form.materialColor}
                    onChange={(e) => setForm({ ...form, materialColor: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    Quantity (Pcs)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.quantity}
                    onChange={(e) =>
                      setForm({ ...form, quantity: Math.max(1, parseInt(e.target.value) || 1) })
                    }
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    Part / Unit
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.qtyPart}
                    onChange={(e) =>
                      setForm({ ...form, qtyPart: Math.max(1, parseInt(e.target.value) || 1) })
                    }
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Row 4: Slicing specs (Layer height, Infill, Weight, Time) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    Layer Height (mm)
                  </label>
                  <input
                    type="text"
                    placeholder="0.20"
                    value={form.layerHeight}
                    onChange={(e) => setForm({ ...form, layerHeight: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    Infill (%)
                  </label>
                  <input
                    type="text"
                    placeholder="15%"
                    value={form.infill}
                    onChange={(e) => setForm({ ...form, infill: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    Estimasi Berat (g)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.weight}
                    onChange={(e) =>
                      setForm({ ...form, weight: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    Estimasi Waktu (Jam)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.time}
                    onChange={(e) =>
                      setForm({ ...form, time: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Row 5: Price, Status, Due Date */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    Harga Jual / Nilai Order (Rp) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={form.price}
                    onChange={(e) =>
                      setForm({ ...form, price: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-rose-400 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    Status Awal
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="queued">Queued</option>
                    <option value="printing">Printing</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    Target Selesai / Deadline
                  </label>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-rose-500/20 active:scale-95 transition-all"
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan Pesanan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: DETAIL PESANAN (VIEW ORDER DETAILS)               */}
      {/* ======================================================== */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-black text-white">
                      {selectedOrder.orderNumber}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                        ORDER_STATUS[selectedOrder.status]?.badge || ""
                      }`}
                    >
                      {ORDER_STATUS[selectedOrder.status]?.label || selectedOrder.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Dibuat pada {new Date(selectedOrder.createdAt).toLocaleString("id-ID")}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Model & Client Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Box 1: Info Klien */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Informasi Klien &amp; Saluran
                </span>
                <p className="text-base font-bold text-white">{selectedOrder.clientName}</p>
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs text-slate-400">Sumber:</span>
                  <span className="text-xs font-semibold capitalize text-slate-200">
                    {selectedOrder.source || "Direct"}
                  </span>
                </div>
                {selectedOrder.dueDate && (
                  <div className="flex items-center gap-2 pt-1 text-xs text-amber-400">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      Target: {new Date(selectedOrder.dueDate).toLocaleDateString("id-ID")}
                    </span>
                  </div>
                )}
              </div>

              {/* Box 2: Finansial */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Nilai &amp; Biaya Transaksi
                </span>
                <p className="text-2xl font-black font-mono text-rose-400">
                  {formatIDR(selectedOrder.price)}
                </p>
                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <span>Estimasi Biaya Filamen:</span>
                  <span className="font-mono text-slate-300 font-bold">
                    {formatIDR(
                      selectedOrder.items && selectedOrder.items.length > 0
                        ? selectedOrder.items.reduce((s, it) => s + (it.cost || 0), 0)
                        : Math.round(((selectedOrder.weight || 120) * 150000) / 1000)
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Specifications Card */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Spesifikasi Teknis 3D Print
              </span>

              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-white">{selectedOrder.modelName}</h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    {selectedOrder.materialType || "PLA"} • {selectedOrder.materialColor || "Default"}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400">Jumlah Cetak</span>
                  <p className="text-xl font-black text-white font-mono">
                    {selectedOrder.quantity} pcs
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-800/80">
                <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/60">
                  <span className="text-[10px] text-slate-500 block">Layer Height</span>
                  <span className="text-xs font-mono font-bold text-slate-200">
                    {selectedOrder.layerHeight || "0.20"} mm
                  </span>
                </div>
                <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/60">
                  <span className="text-[10px] text-slate-500 block">Infill Density</span>
                  <span className="text-xs font-mono font-bold text-slate-200">
                    {selectedOrder.infill || "15%"}
                  </span>
                </div>
                <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/60">
                  <span className="text-[10px] text-slate-500 block">Estimasi Berat</span>
                  <span className="text-xs font-mono font-bold text-slate-200">
                    {selectedOrder.weight || 120} gram
                  </span>
                </div>
                <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/60">
                  <span className="text-[10px] text-slate-500 block">Estimasi Waktu</span>
                  <span className="text-xs font-mono font-bold text-slate-200">
                    {selectedOrder.time || 4.5} jam
                  </span>
                </div>
              </div>

              {selectedOrder.qtyPart > 1 && (
                <div className="text-xs text-slate-400 font-mono bg-slate-900/40 p-2.5 rounded-xl border border-slate-800/40">
                  📦 Model terdiri dari{" "}
                  <strong className="text-white">{selectedOrder.qtyPart} komponen</strong> per unit
                  (Total part diproduksi: {selectedOrder.quantity * selectedOrder.qtyPart} parts).
                </div>
              )}
            </div>

            {/* Quick Status Control */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Ubah Status Antrean Langsung
              </span>
              <div className="flex flex-wrap gap-2 pt-1">
                {[
                  "pending",
                  "queued",
                  "printing",
                  "printed",
                  "completed",
                  "shipped",
                  "failed",
                  "cancelled",
                ].map((st) => (
                  <button
                    key={st}
                    onClick={() => handleStatusChange(selectedOrder.id, st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all border ${
                      selectedOrder.status === st
                        ? ORDER_STATUS[st]?.badge || "bg-rose-500 text-white"
                        : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800"
                    }`}
                  >
                    {ORDER_STATUS[st]?.label || st}
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => handleCopyQuote(selectedOrder)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                {copiedQuote ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-400" />
                    <span>Salin Format WhatsApp</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => {
                    const ord = selectedOrder;
                    setSelectedOrder(null);
                    setDeleteConfirmOrder(ord);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-semibold text-xs flex items-center gap-1.5 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  Hapus Pesanan
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-all"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: KONFIRMASI HAPUS PESANAN                         */}
      {/* ======================================================== */}
      {deleteConfirmOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30 mx-auto">
              <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-white">Hapus Pesanan Cetak 3D?</h3>
              <p className="text-xs text-slate-400">
                Apakah Anda yakin ingin menghapus pesanan{" "}
                <strong className="text-white">{deleteConfirmOrder.orderNumber}</strong> (
                {deleteConfirmOrder.modelName})? Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmOrder(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-all"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteSubmit}
                className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-rose-500/20"
              >
                {isDeleting ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
