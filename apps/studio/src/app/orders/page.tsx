"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { GooNavbar } from "@/components/GooNavbar";
import {
  Plus,
  Minus,
  Trash2,
  Edit2,
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
  Lock,
  Unlock,
  RotateCcw,
  BookOpen,
  ChevronDown,
  ChevronUp,
  FolderPlus,
  ArrowRight,
  ExternalLink,
  SlidersHorizontal,
  LayoutGrid,
  List,
  Package2,
  Share2,
} from "lucide-react";

// ============================================================================
// 3DFLOW PRICING ENGINE & HELPERS
// ============================================================================
const getLayerUnitPrice = (layerHeight: string | number, materialType: string = "PLA") => {
  const num = Number(layerHeight);
  const mat = String(materialType || "PLA").toUpperCase();

  if (mat.includes("PETG")) {
    if (num <= 0.12) return 1900;
    if (num <= 0.22) return 1100;
    return 1000;
  }
  if (mat.includes("TPU")) {
    if (num <= 0.12) return 2500;
    if (num <= 0.22) return 2200;
    return 2000;
  }
  if (num <= 0.12) return 1800;
  if (num <= 0.22) return 1000;
  return 800;
};

const getBasePrintPrice = (weight: number, time: number, rateGr = 400, rateHr = 3000) =>
  Number(weight) * rateGr + Number(time) * rateHr;

const getMarketplaceUnits = (basePrice: number) => {
  const numeric = Number(basePrice || 0);
  if (numeric <= 0) return 0;
  return Math.max(1, Math.round(numeric / 1000));
};

const getLayerAdjustedPrice = (
  weight: number,
  time: number,
  qtyOrder: number,
  layerHeight: string | number,
  rateGr = 400,
  rateHr = 3000,
  materialType = "PLA"
) => {
  const basePrice = getBasePrintPrice(weight, time, rateGr, rateHr);
  const units = getMarketplaceUnits(basePrice);
  return units * getLayerUnitPrice(layerHeight, materialType) * Number(qtyOrder || 1);
};

const formatIDR = (val: number) => "Rp " + Math.round(val || 0).toLocaleString("id-ID");

// ============================================================================
// TYPES
// ============================================================================
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

interface SpoolItem {
  id: string;
  brand: string;
  materialType: string;
  color: string;
  currentWeight: number;
  pricePerGram: number;
}

interface ProductItem {
  id: string;
  name: string;
  sku: string | null;
  category: string | null;
  modelWeight: number;
  printingTime: number;
  finalPrice: number | null;
  manualPrice: number | null;
  qtyPart: number | null;
  infill: string | null;
  layerHeight: string | null;
  imageUrl: string | null;
  description: string | null;
}

interface BasketItem {
  id: number;
  modelName: string;
  weight: number;
  time: number;
  qtyOrder: number;
  qtyPart: number;
  infill: string;
  layerHeight: string;
  materialType: string;
  materialColor: string;
  selectedSpoolId: string | null;
  price: number;
  isLocked: boolean;
  dueDate: string;
  source: string;
  modelImageUrl: string | null;
}

// Source Configuration
const SOURCE_CONFIG: Record<
  string,
  { label: string; color: string; Icon: any }
> = {
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
  direct: {
    label: "Direct Sale",
    color: "text-sky-400 bg-sky-500/10 border-sky-500/20",
    Icon: User,
  },
  whatsapp: {
    label: "WhatsApp",
    color: "text-teal-400 bg-teal-500/10 border-teal-500/20",
    Icon: MessageCircle,
  },
};

const ORDER_STATUS: Record<
  string,
  { label: string; colorClass: string; selectClass: string }
> = {
  pending: {
    label: "Pending",
    colorClass: "text-amber-400 border-amber-400/30 bg-amber-500/10",
    selectClass: "text-amber-400 border-amber-500/30",
  },
  queued: {
    label: "Queued",
    colorClass: "text-slate-300 border-slate-700 bg-slate-800/40",
    selectClass: "text-slate-300 border-slate-700",
  },
  printing: {
    label: "Printing",
    colorClass: "text-blue-400 border-blue-400/30 bg-blue-500/10",
    selectClass: "text-blue-400 border-blue-500/30",
  },
  printed: {
    label: "Printed",
    colorClass: "text-indigo-400 border-indigo-400/30 bg-indigo-500/10",
    selectClass: "text-indigo-400 border-indigo-500/30",
  },
  completed: {
    label: "Completed",
    colorClass: "text-emerald-400 border-emerald-400/30 bg-emerald-500/10",
    selectClass: "text-emerald-400 border-emerald-500/30",
  },
  shipped: {
    label: "Shipped",
    colorClass: "text-purple-400 border-purple-400/30 bg-purple-500/10",
    selectClass: "text-purple-400 border-purple-500/30",
  },
  failed: {
    label: "Failed",
    colorClass: "text-rose-400 border-rose-400/30 bg-rose-500/10",
    selectClass: "text-rose-400 border-rose-500/30",
  },
  cancelled: {
    label: "Cancelled",
    colorClass: "text-slate-500 border-slate-800 bg-slate-900/40",
    selectClass: "text-slate-500 border-slate-800",
  },
};

export default function OrdersPage() {
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [orders, setOrders] = useState<Order[]>([]);
  const [spools, setSpools] = useState<SpoolItem[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [exportOrder, setExportOrder] = useState<any | null>(null);
  const [incomeModal, setIncomeModal] = useState<{
    open: boolean;
    type: "single" | "batch";
    id: string | null;
    status: string;
    initialValue: number;
    income: number | string;
  }>({
    open: false,
    type: "single",
    id: null,
    status: "",
    initialValue: 0,
    income: 0,
  });

  // Calculator Form state
  const [modelName, setModelName] = useState("");
  const [clientName, setClientName] = useState("");
  const [source, setSource] = useState("direct");
  const [selectedMaterialType, setSelectedMaterialType] = useState("PLA");
  const [selectedSpoolId, setSelectedSpoolId] = useState<string | null>(null);
  const [materialColor, setMaterialColor] = useState("Black");
  const [qtyPart, setQtyPart] = useState(1);
  const [qtyOrder, setQtyOrder] = useState(1);
  const [weight, setWeight] = useState(125);
  const [time, setTime] = useState(4.5);
  const [infill, setInfill] = useState("15");
  const [layerHeight, setLayerHeight] = useState("0.20");
  const [dueDate, setDueDate] = useState("");
  const [modelImageUrl, setModelImageUrl] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(true);
  const [manualPrice, setManualPrice] = useState<number>(0);
  const [basket, setBasket] = useState<BasketItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch all data
  async function loadData() {
    try {
      setLoading(true);
      const [ordersRes, inventoryRes, productsRes] = await Promise.all([
        fetch("/api/flow/orders"),
        fetch("/api/flow/inventory"),
        fetch("/api/flow/products"),
      ]);

      const [ordersJson, inventoryJson, productsJson] = await Promise.all([
        ordersRes.json(),
        inventoryRes.json(),
        productsRes.json(),
      ]);

      if (ordersJson.success) setOrders(ordersJson.data);
      if (inventoryJson.success) setSpools(inventoryJson.data);
      if (productsJson.success) setProducts(productsJson.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Filter Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const s = search.toLowerCase();
      const matchSearch =
        search === "" ||
        o.orderNumber.toLowerCase().includes(s) ||
        o.clientName.toLowerCase().includes(s) ||
        o.modelName.toLowerCase().includes(s) ||
        (o.materialType && o.materialType.toLowerCase().includes(s));

      const matchStatus = statusFilter === "all" || o.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [orders, search, statusFilter]);

  // Group by Batch / Single Order (Identik dengan 3DFlow)
  const groups = useMemo(() => {
    const groupedData = filteredOrders.reduce<
      Record<string, { id: string; isBatch: boolean; orders: Order[] }>
    >((acc, order) => {
      const key = order.batchId || `single-${order.id}`;
      if (!acc[key]) acc[key] = { id: key, isBatch: !!order.batchId, orders: [] };
      acc[key]!.orders.push(order);
      return acc;
    }, {});

    return Object.values(groupedData).sort((a, b) => {
      const dateA = new Date(a.orders[0]?.createdAt || 0).getTime();
      const dateB = new Date(b.orders[0]?.createdAt || 0).getTime();
      return dateB - dateA;
    });
  }, [filteredOrders]);

  const activeOrdersCount = orders.filter(
    (o) => o.status !== "completed" && o.status !== "cancelled"
  ).length;
  const newOrdersCount = orders.filter((o) => o.status === "pending").length;

  // Handle Order Status Change (with Income modal when completed)
  const handleStatusChange = async (
    id: string,
    status: string,
    isBatch = false,
    ordersInBatch: Order[] = []
  ) => {
    if (status === "completed") {
      const totalPrice = isBatch
        ? ordersInBatch.reduce((sum, o) => sum + (o.price || 0), 0)
        : ordersInBatch[0]?.price || 0;

      setIncomeModal({
        open: true,
        type: isBatch ? "batch" : "single",
        id: id,
        status: status,
        initialValue: totalPrice,
        income: totalPrice,
      });
      return;
    }

    try {
      if (isBatch) {
        const res = await fetch(`/api/flow/orders/batch/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error);
      } else {
        const res = await fetch(`/api/flow/orders/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error);
      }

      showToast(`Status diperbarui ke "${ORDER_STATUS[status]?.label || status}"`);
      loadData();
    } catch (err: any) {
      alert("Gagal memperbarui status: " + err.message);
    }
  };

  // Submit Completed Income to Financial Transactions
  const handleIncomeSubmit = async () => {
    try {
      if (incomeModal.type === "batch" && incomeModal.id) {
        const res = await fetch(`/api/flow/orders/batch/${incomeModal.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "completed",
            totalIncome: Number(incomeModal.income),
          }),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error);
      } else if (incomeModal.id) {
        const res = await fetch(`/api/flow/orders/${incomeModal.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "completed",
            income: Number(incomeModal.income),
          }),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error);
      }

      showToast("Pesanan selesai & pemasukan berhasil dicatat ke Buku Kas!");
      setIncomeModal({ ...incomeModal, open: false });
      loadData();
    } catch (err: any) {
      alert("Gagal menyelesaikan pesanan: " + err.message);
    }
  };

  // Delete Order
  const handleDeleteOrder = async (id: string, orderNumber: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus pesanan #${orderNumber}?`)) return;

    try {
      const res = await fetch(`/api/flow/orders/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      showToast(`Pesanan #${orderNumber} berhasil dihapus.`);
      loadData();
    } catch (err: any) {
      alert("Gagal menghapus pesanan: " + err.message);
    }
  };

  // Copy Order to Product Catalog
  const handleCopyToCatalog = async (order: Order) => {
    try {
      const calcWeight =
        order.weight ||
        (order.items && order.items[0]
          ? order.items[0].weightUsed / (order.quantity || 1)
          : 125);
      const calcTime = order.time || 4.5;

      const payload = {
        name: order.modelName || "Unnamed Product",
        sku: null,
        imageUrl: order.modelImageUrl || null,
        modelWeight: Number(calcWeight),
        printingTime: Number(calcTime),
        finalPrice: order.price || 0,
        manualPrice: order.price || null,
        qtyPart: order.qtyPart || 1,
        infill: String(order.infill || "15").replace("%", ""),
        layerHeight: order.layerHeight || "0.20",
        category: order.materialType || "General",
        notes: `Copied from Order #${order.orderNumber}`,
      };

      const res = await fetch("/api/flow/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error);

      showToast(`✅ "${order.modelName}" berhasil disalin ke Katalog Produk!`);
      loadData();
    } catch (err: any) {
      alert("Gagal menyalin ke katalog: " + err.message);
    }
  };

  // Open Calculator prefilled with Order
  const openCalculatorWithOrder = (order: Order) => {
    setEditingOrder(order);
    setModelName(order.modelName || "");
    setClientName(order.clientName || "");
    setSource(order.source || "direct");
    setSelectedMaterialType(order.materialType || "PLA");
    setMaterialColor(order.materialColor || "Black");
    setQtyOrder(order.quantity || 1);
    setQtyPart(order.qtyPart || 1);
    setWeight(order.weight || 125);
    setTime(order.time || 4.5);
    setInfill(String(order.infill || "15").replace("%", ""));
    setLayerHeight(order.layerHeight || "0.20");
    setDueDate(order.dueDate ? order.dueDate.split("T")[0] || "" : "");
    setModelImageUrl(order.modelImageUrl || null);
    setIsLocked(false);
    setManualPrice(order.price || 0);
    setBasket([]);
    setIsCalculatorOpen(true);
  };

  // Open Fresh Calculator
  const openFreshCalculator = () => {
    setEditingOrder(null);
    setModelName("");
    setClientName("");
    setSource("direct");
    setSelectedMaterialType("PLA");
    setSelectedSpoolId(spools[0]?.id || null);
    setMaterialColor("Black");
    setQtyPart(1);
    setQtyOrder(1);
    setWeight(125);
    setTime(4.5);
    setInfill("15");
    setLayerHeight("0.20");
    setDueDate("");
    setModelImageUrl(null);
    setIsLocked(true);
    setManualPrice(0);
    setBasket([]);
    setIsCalculatorOpen(true);
  };

  // Calculator Auto Pricing
  const retailRateGr = 400;
  const retailRateHr = 3000;
  const autoRetailPrice = getLayerAdjustedPrice(
    weight,
    time,
    qtyOrder,
    layerHeight,
    retailRateGr,
    retailRateHr,
    selectedMaterialType
  );
  const activeSellingPrice = isLocked ? autoRetailPrice : manualPrice;

  // Submit Order from Calculator
  const handleFinalSubmitOrder = async () => {
    if (!clientName.trim()) {
      alert("Silakan masukkan Nama Klien / Pembeli terlebih dahulu!");
      return;
    }

    const itemsToSave =
      basket.length > 0
        ? basket
        : [
            {
              id: Date.now(),
              modelName,
              weight: Number(weight),
              time: Number(time),
              qtyOrder: Number(qtyOrder),
              qtyPart: Number(qtyPart),
              infill,
              layerHeight,
              materialType: selectedMaterialType,
              materialColor: materialColor || "Black",
              selectedSpoolId,
              price: activeSellingPrice,
              isLocked,
              dueDate,
              source,
              modelImageUrl,
            },
          ];

    if (!itemsToSave[0]?.modelName.trim()) {
      alert("Silakan masukkan Nama Model terlebih dahulu!");
      return;
    }

    try {
      setIsSubmitting(true);
      const generatedBatchId =
        basket.length > 0
          ? `BATCH-${Math.random().toString(36).substring(7).toUpperCase()}`
          : undefined;

      for (const item of itemsToSave) {
        const spool = spools.find((s) => s.id === item.selectedSpoolId);
        const spoolCost = spool?.pricePerGram || 150;
        const totalWeightUsed = item.weight * item.qtyOrder;

        const payload = {
          modelName: item.modelName,
          clientName: clientName.trim(),
          source: item.source || source || "direct",
          batchId: generatedBatchId || null,
          price: item.price,
          modelImageUrl: item.modelImageUrl || null,
          materialType: item.materialType,
          materialColor: item.materialColor,
          quantity: item.qtyOrder,
          qtyPart: item.qtyPart,
          infill: item.infill ? `${item.infill}%` : "15%",
          layerHeight: String(item.layerHeight),
          weight: Number(item.weight),
          time: Number(item.time),
          dueDate: item.dueDate || null,
          items: item.selectedSpoolId
            ? [
                {
                  inventoryId: item.selectedSpoolId,
                  weightUsed: totalWeightUsed,
                  cost: totalWeightUsed * spoolCost,
                },
              ]
            : [],
        };

        const res = await fetch("/api/flow/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const json = await res.json();
        if (!json.success) throw new Error(json.error || "Gagal menyimpan pesanan");
      }

      showToast(
        basket.length > 0
          ? `Batch berisi ${basket.length} model berhasil ditambahkan ke antrean!`
          : `Pesanan "${itemsToSave[0]?.modelName}" berhasil ditambahkan!`
      );
      setIsCalculatorOpen(false);
      await loadData();
    } catch (err: any) {
      alert("Terjadi kesalahan: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <GooNavbar />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[300] bg-emerald-500 text-slate-950 font-bold py-3 px-6 rounded-2xl shadow-2xl flex items-center gap-2 animate-in slide-in-from-top-4 duration-300">
          <Check className="w-5 h-5 stroke-[3]" />
          <span className="text-sm">{toastMessage}</span>
        </div>
      )}

      {/* Income Input Modal (Identik dengan 3DFlow) */}
      {incomeModal.open && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 w-full max-w-sm rounded-3xl border border-slate-700 shadow-2xl p-6 animate-in zoom-in-95 duration-200 text-slate-100 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <DollarSign className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-white">Konfirmasi Pemasukan</h3>
                <p className="text-xs text-slate-400">
                  {incomeModal.type === "batch"
                    ? "Input nilai pemasukan riil untuk Batch ini"
                    : "Input nilai pemasukan riil untuk Pesanan ini"}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Harga Jual Referensi
                </label>
                <div className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-300 font-mono font-bold">
                  {formatIDR(incomeModal.initialValue)}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">
                  Pemasukan Bersih Riil (Setelah Fee Marketplace / Ongkir)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-400 font-bold font-mono">
                    Rp
                  </span>
                  <input
                    type="number"
                    autoFocus
                    value={incomeModal.income}
                    onChange={(e) =>
                      setIncomeModal({ ...incomeModal, income: e.target.value })
                    }
                    onKeyDown={(e) => e.key === "Enter" && handleIncomeSubmit()}
                    className="w-full bg-slate-950 border border-rose-500/40 rounded-xl py-3.5 pl-12 pr-4 font-mono font-bold text-lg text-white outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all"
                  />
                </div>
                <p className="text-[10px] text-slate-500 italic">
                  Nominal ini yang akan dicatat otomatis ke Buku Kas sebagai Inflow riil.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIncomeModal({ ...incomeModal, open: false })}
                  className="flex-1 py-3 rounded-xl font-bold text-xs text-slate-400 bg-slate-800/60 hover:bg-slate-800 transition-all border border-slate-700"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleIncomeSubmit}
                  className="flex-[2] py-3 rounded-xl font-bold text-xs text-white bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-600/30 transition-all active:scale-95"
                >
                  Selesaikan &amp; Catat Kas
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header Bar */}
      <div className="bg-slate-900/50 border-b border-slate-800 px-4 sm:px-6 py-5">
        <div className="max-w-7xl mx-auto w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Pesanan &amp; Antrean Produksi
              </h1>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono">
                {orders.length} Antrean
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              {activeOrdersCount} Sedang Berjalan • {newOrdersCount} Menunggu Konfirmasi
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setViewMode("cards")}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === "cards" ? "bg-rose-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
                }`}
                title="Tampilan Card 3DFlow"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === "table" ? "bg-rose-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
                }`}
                title="Tampilan Tabel Ringkas"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={openFreshCalculator}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ Tambah Pesanan</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3 bg-slate-900/50 p-3.5 rounded-2xl border border-slate-800 shadow-md">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Cari berdasarkan no pesanan, klien, model, atau material..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
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
                        ? "bg-rose-600 text-white shadow-sm"
                        : "bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Orders Loading / Error / Empty / Render */}
            {loading ? (
              <div className="text-center py-24 bg-slate-900/40 rounded-3xl border border-slate-800 text-slate-400 text-sm animate-pulse flex flex-col items-center justify-center gap-3">
                <Printer className="w-8 h-8 text-rose-500 animate-bounce" />
                <span>Memuat data antrean pesanan 3DFlow...</span>
              </div>
            ) : error ? (
              <div className="p-6 bg-rose-950/40 text-rose-300 rounded-3xl border border-rose-800 text-sm">
                {error}
              </div>
            ) : groups.length === 0 ? (
              <div className="py-20 text-center text-slate-500 border border-dashed border-slate-800 rounded-3xl bg-slate-900/30">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-30 text-slate-400" />
                <p className="text-base font-bold text-slate-300">Tidak ada pesanan yang cocok</p>
                <p className="text-xs text-slate-500 mt-1">
                  Gunakan tombol "+ Tambah Pesanan" untuk membuat pesanan cetak 3D baru.
                </p>
              </div>
            ) : viewMode === "cards" ? (
              /* CARD VIEW FORMAT 3DFLOW */
              <div className="space-y-6">
                {groups.map((group) => {
                  const isBatch = group.isBatch;
                  const firstOrder = group.orders[0];
                  if (!firstOrder) return null;

                  const batchPrice = group.orders.reduce((sum, o) => sum + (o.price || 0), 0);
                  const batchCost = group.orders.reduce(
                    (sum, o) =>
                      sum + (o.items ? o.items.reduce((s, it) => s + (it.cost || 0), 0) : 0),
                    0
                  );
                  const currentBatchStatus = group.orders.every(
                    (o) => o.status === group.orders[0]?.status
                  )
                    ? group.orders[0]?.status || "pending"
                    : "mixed";

                  return (
                    <div
                      key={group.id}
                      className={`${
                        isBatch
                          ? "bg-slate-900/50 border border-slate-800/80 p-2 sm:p-3 rounded-3xl space-y-3"
                          : ""
                      }`}
                    >
                      {/* Batch Header Bar */}
                      {isBatch && (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-3 py-2 gap-3 border-b border-slate-800/60 pb-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
                              <Package2 className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="text-xs font-black uppercase tracking-widest text-rose-400">
                                {group.id}
                              </h4>
                              <p className="text-[10px] text-slate-400 font-bold">
                                {group.orders.length} Model • Klien: {firstOrder.clientName}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="text-right flex gap-3">
                              <div>
                                <p className="text-[9px] font-bold text-slate-500 uppercase">
                                  Biaya Modal
                                </p>
                                <p className="text-xs font-bold text-slate-400 font-mono">
                                  {formatIDR(batchCost)}
                                </p>
                              </div>
                              <div>
                                <p className="text-[9px] font-bold text-slate-500 uppercase">
                                  Total Batch
                                </p>
                                <p className="text-sm font-black text-rose-400 font-mono">
                                  {formatIDR(batchPrice)}
                                </p>
                              </div>
                            </div>

                            <button
                              onClick={() => setExportOrder(group)}
                              className="h-8 w-8 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-700 transition-all shadow-sm"
                              title="Salin Rincian Quote Batch"
                            >
                              <FileText className="w-4 h-4" />
                            </button>

                            <select
                              value={currentBatchStatus === "mixed" ? "pending" : currentBatchStatus}
                              onChange={(e) =>
                                handleStatusChange(group.id, e.target.value, true, group.orders)
                              }
                              className={`text-[10px] px-2.5 py-1.5 rounded-xl font-bold uppercase border bg-slate-950 cursor-pointer outline-none transition-all ${
                                ORDER_STATUS[currentBatchStatus]?.selectClass ||
                                "text-slate-400 border-slate-700"
                              }`}
                            >
                              <option value="pending">Pending</option>
                              <option value="queued">Queued</option>
                              <option value="printing">Printing</option>
                              <option value="printed">Printed</option>
                              <option value="completed">Completed</option>
                              <option value="shipped">Shipped</option>
                              <option value="failed">Failed</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </div>
                        </div>
                      )}

                      {/* Orders Cards Grid / Stack */}
                      <div className="flex flex-col gap-4">
                        {group.orders.map((order) => {
                          const sourceKey = order.source ? order.source.toLowerCase() : "direct";
                          const sourceConfig = SOURCE_CONFIG[sourceKey] || SOURCE_CONFIG.direct!;
                          const SourceIcon = sourceConfig.Icon;
                          const orderCost = order.items
                            ? order.items.reduce((s, it) => s + (it.cost || 0), 0)
                            : 0;

                          return (
                            <div
                              key={order.id}
                              className={`bg-slate-900/80 rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-xl group hover:border-rose-500/40 transition-all relative overflow-hidden ${
                                isBatch ? "border-slate-800/40 shadow-none bg-slate-950/60" : ""
                              }`}
                            >
                              {/* Card Header */}
                              <div className="flex justify-between items-start mb-3 relative z-10">
                                <div>
                                  <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest block mb-0.5">
                                    No. Pesanan
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-mono font-bold text-white">
                                      #{order.orderNumber}
                                    </span>
                                    <span
                                      className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${sourceConfig.color}`}
                                    >
                                      <SourceIcon className="w-2.5 h-2.5" />
                                      {sourceConfig.label}
                                    </span>
                                  </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center gap-1.5">
                                  {!isBatch && (
                                    <button
                                      onClick={() => setExportOrder(order)}
                                      className="h-8 w-8 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-700 transition-all shadow-sm"
                                      title="Review & Salin Quote WA"
                                    >
                                      <FileText className="w-3.5 h-3.5" />
                                    </button>
                                  )}

                                  <button
                                    onClick={() => handleCopyToCatalog(order)}
                                    className="h-8 w-8 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-emerald-400 hover:border-emerald-500/40 transition-all shadow-sm"
                                    title="Salin ke Katalog Produk"
                                  >
                                    <FolderPlus className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    onClick={() => openCalculatorWithOrder(order)}
                                    className="h-8 w-8 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-rose-400 hover:border-rose-500/40 transition-all shadow-sm"
                                    title="Edit di Calculator"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    onClick={() => handleDeleteOrder(order.id, order.orderNumber)}
                                    className="h-8 w-8 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-rose-400 hover:border-rose-500/40 transition-all shadow-sm"
                                    title="Hapus Pesanan"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Card Body */}
                              <div className="flex gap-4 mb-4 relative z-10">
                                <div className="h-20 w-20 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                                  {order.modelImageUrl ? (
                                    <img
                                      src={order.modelImageUrl}
                                      alt={order.modelName}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <Printer className="w-8 h-8 text-slate-600 opacity-60" />
                                  )}
                                </div>

                                <div className="flex-1 min-w-0">
                                  <h3 className="font-bold text-base text-white truncate group-hover:text-rose-300 transition-colors">
                                    {order.modelName}
                                  </h3>
                                  {!isBatch && (
                                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                      <User className="w-3 h-3 text-slate-500" />
                                      <span>{order.clientName}</span>
                                    </p>
                                  )}

                                  {/* Print Specs Badges */}
                                  <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1.5 text-[11px] font-mono">
                                    <div className="flex items-center gap-1 text-slate-300">
                                      <Layers className="w-3.5 h-3.5 text-slate-500" />
                                      <span>{order.layerHeight || "0.20"}mm</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-slate-300">
                                      <span className="text-slate-500 text-xs">#</span>
                                      <span>
                                        {String(order.infill || "15").includes("%")
                                          ? order.infill
                                          : `${order.infill || "15"}%`}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1 text-slate-300 font-bold">
                                      <span>x{order.quantity || 1}</span>
                                      {order.qtyPart > 1 && (
                                        <span className="text-slate-400 text-[10px]">
                                          ({order.qtyPart} parts)
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1 text-amber-300 uppercase">
                                      <span>
                                        {order.materialType || "PLA"}{" "}
                                        {order.materialColor ? `(${order.materialColor})` : ""}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1 text-slate-300">
                                      <Scale className="w-3.5 h-3.5 text-slate-500" />
                                      <span>
                                        {order.weight ||
                                          (order.items && order.items[0]
                                            ? (
                                                order.items[0].weightUsed / (order.quantity || 1)
                                              ).toFixed(1)
                                            : "125")}
                                        g
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1 text-slate-300">
                                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                                      <span>{order.time || "4.5"}h</span>
                                    </div>
                                    {order.dueDate && (
                                      <div className="flex items-center gap-1 text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 text-[10px] font-bold">
                                        <Calendar className="w-3 h-3 text-rose-400" />
                                        <span>
                                          Due:{" "}
                                          {new Date(order.dueDate).toLocaleDateString("id-ID")}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Card Footer */}
                              <div className="pt-3 border-t border-slate-800/80 flex justify-between items-center relative z-10">
                                <div>
                                  <select
                                    value={order.status}
                                    onChange={(e) =>
                                      handleStatusChange(order.id, e.target.value, false, [order])
                                    }
                                    className={`text-[10px] px-3 py-1.5 rounded-xl font-bold uppercase border bg-slate-950 cursor-pointer outline-none transition-all ${
                                      ORDER_STATUS[order.status]?.selectClass ||
                                      "text-slate-400 border-slate-700"
                                    }`}
                                  >
                                    <option value="pending">Pending</option>
                                    <option value="queued">Queued</option>
                                    <option value="printing">Printing</option>
                                    <option value="printed">Printed</option>
                                    <option value="completed">Completed</option>
                                    <option value="shipped">Shipped</option>
                                    <option value="failed">Failed</option>
                                    <option value="cancelled">Cancelled</option>
                                  </select>
                                </div>

                                <div className="flex items-end gap-3 text-right">
                                  {orderCost > 0 && (
                                    <div>
                                      <p className="text-[9px] font-bold text-slate-500 uppercase">
                                        Biaya Modal
                                      </p>
                                      <span className="font-mono text-xs text-slate-400 font-bold">
                                        {formatIDR(orderCost)}
                                      </span>
                                    </div>
                                  )}
                                  <div>
                                    <p className="text-[9px] font-bold text-slate-500 uppercase">
                                      Harga Jual
                                    </p>
                                    <span className="font-mono text-lg font-black text-rose-400">
                                      {formatIDR(order.price)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* TABULAR VIEW */
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
                      {filteredOrders.map((order) => {
                        const sourceKey = order.source ? order.source.toLowerCase() : "direct";
                        const sourceConfig = SOURCE_CONFIG[sourceKey] || SOURCE_CONFIG.direct!;
                        const SourceIcon = sourceConfig.Icon;

                        return (
                          <tr key={order.id} className="hover:bg-slate-800/30 transition-colors">
                            <td className="py-3.5 px-4 font-mono font-bold text-white text-sm">
                              #{order.orderNumber}
                            </td>
                            <td className="py-3.5 px-4">
                              <p className="font-bold text-white text-sm">{order.modelName}</p>
                              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                                {order.materialType || "PLA"} • {order.layerHeight || "0.20"}mm •{" "}
                                {order.infill || "15%"}
                              </p>
                            </td>
                            <td className="py-3.5 px-4">
                              <p className="font-semibold text-slate-200">{order.clientName}</p>
                              <span
                                className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border mt-0.5 ${sourceConfig.color}`}
                              >
                                <SourceIcon className="w-2.5 h-2.5" />
                                {sourceConfig.label}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-mono font-bold text-white">
                              {order.quantity} pcs
                            </td>
                            <td className="py-3.5 px-4 font-mono font-bold text-rose-400 text-sm">
                              {formatIDR(order.price)}
                            </td>
                            <td className="py-3.5 px-4">
                              <select
                                value={order.status}
                                onChange={(e) =>
                                  handleStatusChange(order.id, e.target.value, false, [order])
                                }
                                className={`text-[11px] px-2.5 py-1 rounded-xl font-bold uppercase border bg-slate-950 cursor-pointer outline-none ${
                                  ORDER_STATUS[order.status]?.selectClass ||
                                  "text-slate-400 border-slate-700"
                                }`}
                              >
                                <option value="pending">Pending</option>
                                <option value="queued">Queued</option>
                                <option value="printing">Printing</option>
                                <option value="printed">Printed</option>
                                <option value="completed">Completed</option>
                                <option value="shipped">Shipped</option>
                                <option value="failed">Failed</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setExportOrder(order)}
                                  className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
                                  title="Salin Quote WA"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => openCalculatorWithOrder(order)}
                                  className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
                                  title="Edit di Calculator"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteOrder(order.id, order.orderNumber)}
                                  className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-rose-400"
                                  title="Hapus Pesanan"
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

      {/* ==================================================================== */}
      {/* ORDER EXPORT MODAL (Review & Salin WhatsApp Quotation)               */}
      {/* Identik dengan OrderExportModal.jsx pada 3DFlow                     */}
      {/* ==================================================================== */}
      {exportOrder && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 text-slate-100 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Review &amp; Copy Quotation</h3>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {exportOrder.isBatch
                      ? `Batch #${exportOrder.id}`
                      : `#${exportOrder.orderNumber} - ${exportOrder.modelName}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setExportOrder(null)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-950 p-4 rounded-2xl border border-slate-800 font-mono text-xs text-slate-300 whitespace-pre-wrap select-all leading-relaxed shadow-inner">
              {(() => {
                if (exportOrder.isBatch) {
                  const oList = exportOrder.orders || [];
                  const batchId = exportOrder.id;
                  const cName = oList[0]?.clientName || "Valued Customer";
                  const bPrice = oList.reduce((sum: number, o: Order) => sum + (o.price || 0), 0);

                  let totalUnits = 0;
                  const specs = oList
                    .map((o: Order, idx: number) => {
                      const w =
                        o.weight ||
                        (o.items && o.items[0]
                          ? o.items[0].weightUsed / (o.quantity || 1)
                          : 125);
                      const t = o.time || 4.5;
                      const q = o.quantity || 1;
                      const inf = o.infill || "15%";
                      return `${idx + 1}. *[${o.modelName}]* (${o.qtyPart || 1} pcs) (x${q} SET)
• Bahan  : ${o.materialType || "PLA"} ${o.materialColor ? `(${o.materialColor})` : ""}
• Layer  : ${o.layerHeight || "0.20"}mm
• Infill : ${String(inf).includes("%") ? inf : `${inf}%`}
• Berat  : ${w} gram/pcs (Total: ${w * q} gram)
• Durasi : ${t} jam/pcs (Total: ${t * q} jam)`;
                    })
                    .join("\n\n");

                  const costDetails = oList
                    .map((o: Order) => {
                      const w =
                        o.weight ||
                        (o.items && o.items[0]
                          ? o.items[0].weightUsed / (o.quantity || 1)
                          : 125);
                      const t = o.time || 4.5;
                      const q = o.quantity || 1;
                      const lh = o.layerHeight || "0.20";
                      const baseP = getBasePrintPrice(w, t, 400, 3000);
                      const u = getMarketplaceUnits(baseP) * q;
                      const unitP = getLayerUnitPrice(lh, o.materialType || "PLA");
                      totalUnits += u;
                      return `• *${o.modelName}* (${lh}mm): ${u} unit x Rp ${unitP.toLocaleString(
                        "id-ID"
                      )} ➜ *Rp ${Math.round(o.price).toLocaleString("id-ID")}*`;
                    })
                    .join("\n");

                  return `📦 *BATCH ORDER CONFIRMATION*
*Batch ID: [${batchId}]*
*Client  : ${cName}*
------------------------------------------

🛠 *SPESIFIKASI BATCH*
${specs}

💰 *RINCIAN BIAYA BATCH*
${costDetails}
------------------------------------------
*TOTAL AKHIR BATCH : Rp ${Math.round(bPrice).toLocaleString("id-ID")}*
*TOTAL UNIT MARKETPLACE : ${totalUnits} UNIT*

🛒 *PROSEDUR ORDER MARKETPLACE:*
1. Buka produk Custom 3D Print di toko kami.
2. Masukkan total ${totalUnits} Unit ke keranjang.
3. Cantumkan catatan *QUOTATION BATCH #${batchId}*.
------------------------------------------
Terima kasih telah mencetak di GOOCANAN 3DFlow!`;
                } else {
                  const o = exportOrder;
                  const w =
                    o.weight ||
                    (o.items && o.items[0]
                      ? o.items[0].weightUsed / (o.quantity || 1)
                      : 125);
                  const t = o.time || 4.5;
                  const q = o.quantity || 1;
                  const lh = o.layerHeight || "0.20";
                  const baseP = getBasePrintPrice(w, t, 400, 3000);
                  const units = getMarketplaceUnits(baseP) * q;
                  const unitP = getLayerUnitPrice(lh, o.materialType || "PLA");

                  return `📦 *ORDER CONFIRMATION #${o.orderNumber}*
*Klien: ${o.clientName}*
------------------------------------------

*[${o.modelName}]* (${o.qtyPart || 1} pcs) (x${q} SET)
• Bahan      : ${o.materialType || "PLA"} ${o.materialColor ? `(${o.materialColor})` : ""}
• Layer      : ${lh}mm
• Infill     : ${o.infill || "15%"}
• Berat      : ${w * q} gram
• Waktu      : ${t * q} jam
• Marketplace: ${units} Unit (@ Rp ${unitP.toLocaleString("id-ID")}/unit)
------------------------------------------
*TOTAL HARGA : Rp ${Math.round(o.price).toLocaleString("id-ID")}*
*ORDER UNIT  : ${units} UNITS*

🛒 *PROSEDUR PEMBAYARAN MARKETPLACE:*
1. Buka etalase produk Custom 3D Print di Shopee / Tokopedia.
2. Pilih varian Layer ${lh}mm.
3. Masukkan jumlah *${units} Unit* ke keranjang.
4. Cantumkan catatan order *#${o.orderNumber}*.
------------------------------------------
Terima kasih telah mencetak di GOOCANAN 3DFlow!`;
                }
              })()}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setExportOrder(null)}
                className="flex-1 py-3 rounded-xl font-bold text-xs text-slate-400 bg-slate-800/60 hover:bg-slate-800 transition-all border border-slate-700"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => {
                  const textEl = document.querySelector(".select-all");
                  if (textEl) {
                    navigator.clipboard.writeText(textEl.textContent || "");
                    showToast("Quotation WhatsApp berhasil disalin ke clipboard!");
                    setExportOrder(null);
                  }
                }}
                className="flex-[2] py-3 rounded-xl font-bold text-xs text-white bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-600/30 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Copy className="w-4 h-4" />
                <span>Salin ke Clipboard</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 3DFLOW SLICING & COMMERCIAL ORDER CREATOR DRAWER / MODAL             */}
      {/* ==================================================================== */}
      {isCalculatorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <header className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    {editingOrder ? "Edit Pesanan Cetak 3D" : "Tambah Pesanan Cetak 3D"}
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      3DFlow Engine
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Kalkulator Slicing, Formula Retail Market, &amp; Generator Antrean Produksi
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsCalculatorOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </header>

            {/* Scrollable Form Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
              {/* Batch counter indicator */}
              {basket.length > 0 && (
                <div className="flex justify-between items-center bg-rose-500/10 border border-rose-500/20 p-3 rounded-2xl text-xs">
                  <span className="text-rose-300 font-semibold flex items-center gap-2">
                    <Package className="w-4 h-4 text-rose-400" />
                    Batch Multi-Model Aktif: <strong>{basket.length} Model</strong>
                  </span>
                  <span className="font-mono font-bold text-rose-400">
                    Total Batch: {formatIDR(basket.reduce((s, it) => s + it.price, 0))}
                  </span>
                </div>
              )}

              {/* Client & Order Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Nama Klien / Pembeli *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Budi Santoso"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Nama Model / File 3D *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Holder HP V2"
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Sumber Pesanan
                  </label>
                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="direct">Direct Sale (Penjualan Langsung)</option>
                    <option value="tokopedia">Tokopedia</option>
                    <option value="shopee">Shopee</option>
                    <option value="whatsapp">WhatsApp</option>
                  </select>
                </div>
              </div>

              {/* Filament & Material Selection */}
              <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
                    <Layers className="w-4 h-4" /> Material &amp; Spul Inventaris
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold mb-1">
                      Tipe Material
                    </label>
                    <select
                      value={selectedMaterialType}
                      onChange={(e) => setSelectedMaterialType(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="PLA">PLA</option>
                      <option value="PLA+">PLA+</option>
                      <option value="PETG">PETG</option>
                      <option value="ABS">ABS</option>
                      <option value="TPU">TPU</option>
                      <option value="ASA">ASA</option>
                      <option value="PC">PC</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold mb-1">
                      Warna Filament
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Black / Putih"
                      value={materialColor}
                      onChange={(e) => setMaterialColor(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold mb-1">
                      Pilih Spul dari Stok
                    </label>
                    <select
                      value={selectedSpoolId || ""}
                      onChange={(e) => setSelectedSpoolId(e.target.value || null)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="">(Tanpa kaitkan ke inventaris)</option>
                      {spools.map((spool) => (
                        <option key={spool.id} value={spool.id}>
                          {spool.brand} {spool.materialType} {spool.color} (Sisa:{" "}
                          {Math.round(spool.currentWeight)}g)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Slicing Parameters */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Berat Slicing (gram)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={weight}
                    onChange={(e) => setWeight(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Durasi Cetak (jam)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={time}
                    onChange={(e) => setTime(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Layer Height (mm)
                  </label>
                  <select
                    value={layerHeight}
                    onChange={(e) => setLayerHeight(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="0.10">0.10mm (Super Fine)</option>
                    <option value="0.16">0.16mm (Fine)</option>
                    <option value="0.20">0.20mm (Standard)</option>
                    <option value="0.28">0.28mm (Draft)</option>
                    <option value="0.40">0.40mm (Coarse)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Infill Kepadatan (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={infill}
                    onChange={(e) => setInfill(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              {/* Quantity & Deadlines */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Jumlah Pesanan (Qty SET)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={qtyOrder}
                    onChange={(e) => setQtyOrder(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Qty Parts per Model
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={qtyPart}
                    onChange={(e) => setQtyPart(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Target Selesai (Due Date)
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              {/* Pricing & Commercial Calculations */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Total Harga Jual (Komersial)
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-2xl font-black font-mono text-rose-400">
                      {formatIDR(activeSellingPrice)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsLocked(!isLocked)}
                      className="p-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                      title={isLocked ? "Buka Kunci untuk Edit Manual" : "Kunci Formula Otomatis"}
                    >
                      {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5 text-amber-400" />}
                    </button>
                  </div>
                </div>

                {!isLocked && (
                  <div className="w-full sm:w-48">
                    <label className="block text-[10px] text-amber-400 font-bold mb-1">
                      Harga Manual (Override)
                    </label>
                    <input
                      type="number"
                      value={manualPrice}
                      onChange={(e) => setManualPrice(Number(e.target.value))}
                      className="w-full px-3 py-1.5 text-xs font-mono rounded-xl bg-slate-900 border border-amber-500/40 text-white focus:outline-none"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <footer className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setIsCalculatorOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white text-xs font-bold"
              >
                Batal
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleFinalSubmitOrder}
                className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition-all active:scale-95 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <span>Menyimpan...</span>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>{editingOrder ? "Simpan Perubahan" : "Tambahkan ke Antrean Produksi"}</span>
                  </>
                )}
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
