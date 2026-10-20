"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { GooNavbar } from "@/components/GooNavbar";
import {
  Plus,
  Minus,
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
  Lock,
  Unlock,
  RotateCcw,
  BookOpen,
  ChevronDown,
  ChevronUp,
  FolderPlus,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

// ============================================================================
// 3DFLOW FORMULA ENGINE & PRICING HELPERS
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
  // Default / PLA
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
  spoolId: string;
  brand: string;
  materialType: string;
  color: string;
  currentWeight: number;
  pricePerGram: number;
  initialWeight: number;
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

const formatIDR = (val: number) => "Rp " + (val || 0).toLocaleString("id-ID");

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // External reference data from 3DFlow DB
  const [spools, setSpools] = useState<SpoolItem[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);

  // Modals & Drawers
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [selectedCatalogCategory, setSelectedCatalogCategory] = useState("All");
  const [catalogSearch, setCatalogSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [deleteConfirmOrder, setDeleteConfirmOrder] = useState<Order | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showProfitAnalysis, setShowProfitAnalysis] = useState(false);
  const [isQuoteCopied, setIsQuoteCopied] = useState(false);

  // ==========================================================================
  // 3DFLOW SLICING & COMMERCIAL CALCULATOR STATE
  // ==========================================================================
  const [modelName, setModelName] = useState("");
  const [clientName, setClientName] = useState("");
  const [source, setSource] = useState("direct");
  const [selectedMaterialType, setSelectedMaterialType] = useState("PLA");
  const [selectedSpoolId, setSelectedSpoolId] = useState<string | null>(null);
  const [materialColor, setMaterialColor] = useState("");
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

  // 3DFlow Retail Rates (Default 400 Rp/g, 3000 Rp/h)
  const retailRateGr = 400;
  const retailRateHr = 3000;

  // Auto calculated retail price
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

  // Calculations for Internal Production Cost
  const selectedSpool = spools.find((s) => s.id === selectedSpoolId);
  const spoolPricePerGram = selectedSpool?.pricePerGram || 150; // default 150 Rp/g
  const materialCost = weight * spoolPricePerGram * qtyOrder;
  const energyCost = (150 / 1000) * time * 1500 * qtyOrder; // 150 Watt, Rp 1500/kWh
  const wearCost = 500 * time * qtyOrder; // Rp 500/hour
  const totalProductionCost = materialCost + energyCost + wearCost;
  const netProfit = activeSellingPrice - totalProductionCost;
  const marginPercent =
    activeSellingPrice > 0
      ? Math.round((netProfit / activeSellingPrice) * 100)
      : 0;

  const currentBasePrice = getBasePrintPrice(weight, time, retailRateGr, retailRateHr);
  const currentUnitsPerSet = getMarketplaceUnits(currentBasePrice);
  const currentTotalUnits = currentUnitsPerSet * qtyOrder;
  const currentLayerUnitPrice = getLayerUnitPrice(layerHeight, selectedMaterialType);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load orders & reference datasets
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

  // Open 3DFlow Calculator in Fresh Create Mode
  const openCalculator = () => {
    setModelName("");
    setClientName("");
    setSource("direct");
    setSelectedMaterialType("PLA");
    setSelectedSpoolId(spools.length > 0 ? spools[0]?.id || null : null);
    setMaterialColor("Hitam");
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

  // Select Product from Catalog
  const handleSelectProduct = (product: ProductItem) => {
    setModelName(product.name);
    if (product.modelWeight) setWeight(product.modelWeight);
    if (product.printingTime) setTime(product.printingTime);
    if (product.qtyPart) setQtyPart(product.qtyPart);
    if (product.infill) setInfill(String(product.infill).replace("%", ""));
    if (product.layerHeight) setLayerHeight(String(product.layerHeight));
    if (product.imageUrl) setModelImageUrl(product.imageUrl);

    if (product.manualPrice && product.manualPrice > 0) {
      setManualPrice(product.manualPrice * qtyOrder);
      setIsLocked(false);
    } else if (product.finalPrice && product.finalPrice > 0) {
      setManualPrice(product.finalPrice * qtyOrder);
      setIsLocked(false);
    } else {
      setIsLocked(true);
    }

    setIsCatalogOpen(false);
    showToast(`Produk "${product.name}" dimuat dari Katalog!`);
  };

  // Add Item to Multi-Model Batch Basket
  const handleAddToBasket = () => {
    if (!modelName.trim()) {
      alert("Silakan masukkan Nama Model terlebih dahulu!");
      return;
    }

    const newItem: BasketItem = {
      id: Date.now(),
      modelName,
      weight: Number(weight),
      time: Number(time),
      qtyOrder: Number(qtyOrder),
      qtyPart: Number(qtyPart),
      infill,
      layerHeight,
      materialType: selectedMaterialType,
      materialColor: materialColor || "Default",
      selectedSpoolId,
      price: activeSellingPrice,
      isLocked,
      dueDate,
      source,
      modelImageUrl,
    };

    setBasket((prev) => [...prev, newItem]);

    // Reset current model form for next model
    setModelName("");
    setWeight(125);
    setTime(4.5);
    setQtyOrder(1);
    setQtyPart(1);
    setModelImageUrl(null);
    setIsLocked(true);
    showToast("Model berhasil ditambahkan ke Batch!");
  };

  // Remove Item from Basket
  const handleRemoveFromBasket = (id: number) => {
    setBasket((prev) => prev.filter((it) => it.id !== id));
  };

  // Copy WhatsApp Quotation Format (Single or Batch)
  const handleCopyQuote = () => {
    const batchId = Math.random().toString(36).substring(7).toUpperCase();

    if (basket.length > 0) {
      const totalQty = basket.reduce((s, it) => s + it.qtyPart * it.qtyOrder, 0);
      const totalWeight = basket.reduce((s, it) => s + it.weight * it.qtyOrder, 0);
      const grandTotal = basket.reduce((s, it) => s + it.price, 0);
      const totalUnits = basket.reduce((s, it) => {
        const bp = getBasePrintPrice(it.weight, it.time, retailRateGr, retailRateHr);
        return s + getMarketplaceUnits(bp) * it.qtyOrder;
      }, 0);

      const itemsText = basket
        .map((it, idx) => {
          const bp = getBasePrintPrice(it.weight, it.time, retailRateGr, retailRateHr);
          const up = getMarketplaceUnits(bp);
          const tu = up * it.qtyOrder;
          const lup = getLayerUnitPrice(it.layerHeight, it.materialType);
          return `${idx + 1}. *[${it.modelName}] (${it.qtyPart}pcs) (x${it.qtyOrder} SET)*
   • Spek: ${it.materialType}, ${it.materialColor}, ${it.layerHeight}mm, ${it.infill}%
   • Total Part: ${it.qtyPart * it.qtyOrder} pcs | Berat: ${it.weight * it.qtyOrder}g | Waktu: ${it.time * it.qtyOrder} jam
   • Order Unit: ${tu} Units (@ Rp ${lup.toLocaleString("id-ID")}/unit)
   • Subtotal: ${formatIDR(it.price)}`;
        })
        .join("\n\n");

      const text = `📦 *QUOTATION BATCH #${batchId} - 3DFLOW*
Klien: *${clientName || "Valued Customer"}*
------------------------------------------

${itemsText}

------------------------------------------
📊 *RINGKASAN BATCH*
• Total Model   : ${basket.length} Model
• Total Part    : ${totalQty} pcs
• Estimasi Berat: ${totalWeight} gram
*GRAND TOTAL    : ${formatIDR(grandTotal)}*
*ORDER UNIT     : ${totalUnits} UNITS*

🛒 *PROSEDUR ORDER MARKETPLACE (Shopee / Tokopedia):*
1. Buka produk Custom 3D Print di toko kami.
2. Masukkan total unit (${totalUnits} Unit) ke keranjang.
3. Cantumkan catatan/note *QUOTATION BATCH #${batchId}*.
------------------------------------------
Terima kasih telah mencetak di GOOCANAN 3DFlow!`;

      navigator.clipboard.writeText(text);
    } else {
      const text = `📦 *ORDER CONFIRMATION #${batchId} - 3DFLOW*
Klien: *${clientName || "Valued Customer"}*
------------------------------------------

*[${modelName || "Model 3D"}] (${qtyPart}pcs) (x${qtyOrder} SET)*
• Spek      : ${selectedMaterialType}, ${materialColor || "Default"}, ${layerHeight}mm, ${infill}%
• Qty Cetak : ${qtyPart * qtyOrder} pcs (${qtyOrder} SET)
• Berat     : ${weight * qtyOrder} gram
• Waktu     : ${time * qtyOrder} jam
• Order Unit: ${currentTotalUnits} Units (@ Rp ${currentLayerUnitPrice.toLocaleString("id-ID")}/unit)
• Target    : ${dueDate ? new Date(dueDate).toLocaleDateString("id-ID") : "Sesuai Antrean"}

------------------------------------------
*GRAND TOTAL : ${formatIDR(activeSellingPrice)}*
*ORDER UNIT  : ${currentTotalUnits} UNITS*

🛒 *PROSEDUR ORDER MARKETPLACE:*
1. Buka produk Custom 3D Print di etalase kami.
2. Pilih varian Layer ${layerHeight}mm.
3. Masukkan jumlah ${currentTotalUnits} Unit ke keranjang.
4. Cantumkan catatan *ORDER #${batchId}*.
------------------------------------------
Terima kasih telah mencetak di GOOCANAN 3DFlow!`;

      navigator.clipboard.writeText(text);
    }

    setIsQuoteCopied(true);
    setTimeout(() => setIsQuoteCopied(false), 2500);
    showToast("Quotation WhatsApp berhasil disalin ke clipboard!");
  };

  // Submit Final Orders (Single or Batch)
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
              materialColor: materialColor || "Hitam",
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
        if (!json.success) {
          throw new Error(json.error || "Gagal menyimpan pesanan");
        }
      }

      showToast(
        basket.length > 0
          ? `Batch berisi ${basket.length} model berhasil ditambahkan ke Antrean!`
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

  // Quick Status Change on Table
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
        if (selectedOrder?.id === orderId) {
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

  // Categories for Catalog Modal
  const catalogCategories = [
    "All",
    ...new Set(products.map((p) => p.category || "General").filter(Boolean)),
  ];

  const filteredCatalogProducts = products.filter((p) => {
    const matchesCategory =
      selectedCatalogCategory === "All" ||
      (p.category || "General").toLowerCase() === selectedCatalogCategory.toLowerCase();
    const matchesSearch =
      catalogSearch === "" ||
      p.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(catalogSearch.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Filter Table Orders
  const filteredOrders = orders.filter((o) => {
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
              Sistem kalkulasi slicing komersial 3DFlow: tentukan berat, waktu, layer height, dan spul
              filamen dengan formula harga retail otomatis serta generator quotation WhatsApp.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={openCalculator}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-rose-500/25 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              Tambah Pesanan (3DFlow)
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
        ) : filteredOrders.length === 0 ? (
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
                  {filteredOrders.map((order) => {
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

      {/* ==================================================================== */}
      {/* 3DFLOW SLICING & COMMERCIAL ORDER CREATOR DRAWER / MODAL             */}
      {/* Sesuai dengan sistem kalkulator komersial 3DFlow                     */}
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
                    Tambah Pesanan Cetak 3D
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      3DFlow Engine
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Kalkulator Slicing, Formula Retail Market, &amp; Generator Antrean Produksi
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyQuote}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    isQuoteCopied
                      ? "bg-emerald-500 text-slate-950 border-emerald-400"
                      : "bg-slate-800 text-slate-300 border-slate-700 hover:text-white hover:bg-slate-700"
                  }`}
                  title="Salin Rincian Quotation untuk WhatsApp / Toko Online"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{isQuoteCopied ? "Tersalin!" : "Salin Quote WA"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsCalculatorOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
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

              {/* CARD 1: Model & Klien Info */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Model Name with Catalog Picker Button */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Nama Model 3D <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Contoh: Articulated Dragon V3 / Gearbox"
                        value={modelName}
                        onChange={(e) => setModelName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-4 pr-11 text-xs text-white focus:outline-none focus:border-rose-500"
                      />
                      <button
                        type="button"
                        onClick={() => setIsCatalogOpen(true)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-rose-500/15 text-rose-400 hover:bg-rose-500/30 transition-all"
                        title="Pilih dari Katalog Produk 3DFlow"
                      >
                        <BookOpen className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Client Name */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Nama Klien / Pembeli <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Budi Santoso / PT Sinergi"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-xs text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                {/* Order Source Switcher (3DFlow style) */}
                <div className="space-y-1.5 pt-2 border-t border-slate-900">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Sumber Saluran Pesanan
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
                    {[
                      { id: "direct", label: "Direct Client", icon: User },
                      { id: "tokopedia", label: "Tokopedia", icon: Store },
                      { id: "shopee", label: "Shopee", icon: ShoppingBag },
                      { id: "whatsapp", label: "WhatsApp", icon: MessageCircle },
                    ].map((src) => {
                      const IconComponent = src.icon;
                      const isSelected = source === src.id;
                      return (
                        <button
                          key={src.id}
                          type="button"
                          onClick={() => setSource(src.id)}
                          className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all ${
                            isSelected
                              ? "bg-rose-500 text-white shadow-md shadow-rose-500/20"
                              : "text-slate-400 hover:text-white"
                          }`}
                        >
                          <IconComponent className="w-3.5 h-3.5" />
                          <span>{src.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* CARD 2: Material & Spool Inventory */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                <label className="block text-xs font-bold text-rose-400 uppercase tracking-wider">
                  Material &amp; Inventaris Filamen
                </label>

                {/* Material Type Quick Buttons */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">
                    Tipe Bahan Filamen
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "PLA", label: "PLA", desc: "Rp 800 - 1.800/unit" },
                      { id: "PETG", label: "PETG", desc: "Rp 1.000 - 1.900/unit" },
                      { id: "TPU95", label: "TPU95", desc: "Rp 2.000 - 2.500/unit" },
                    ].map((mat) => {
                      const isSelected = selectedMaterialType === mat.id;
                      return (
                        <button
                          key={mat.id}
                          type="button"
                          onClick={() => {
                            setSelectedMaterialType(mat.id);
                            // Auto pick matching spool from inventory
                            const matching = spools.find(
                              (s) =>
                                s.materialType.toUpperCase().includes(mat.id.replace("95", "")) &&
                                s.currentWeight > 0
                            );
                            if (matching) setSelectedSpoolId(matching.id);
                            setIsLocked(true);
                          }}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            isSelected
                              ? "bg-rose-500/15 border-rose-500 text-rose-300 ring-2 ring-rose-500/20"
                              : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-xs font-bold text-white">{mat.label}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-rose-400" />}
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono block">
                            {mat.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Spool selector dropdown & Color */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">
                      Pilih Spul dari Inventaris ({spools.length} Tersedia)
                    </label>
                    <select
                      value={selectedSpoolId || ""}
                      onChange={(e) => setSelectedSpoolId(e.target.value || null)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-3 text-xs text-slate-200 focus:outline-none focus:border-rose-500 font-medium"
                    >
                      <option value="">Pilih Spul Filamen...</option>
                      {spools
                        .filter((s) => s.currentWeight > 0)
                        .map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.brand} {s.materialType} ({s.color}) — {s.currentWeight}g sisa — Rp{" "}
                            {s.pricePerGram || 150}/g
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">
                      Varian Warna Filamen
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Hitam Matte / Merah Glossy"
                      value={materialColor}
                      onChange={(e) => setMaterialColor(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-xs text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>
              </div>

              {/* CARD 3: Parameter Slicing & Steppers (3DFlow Exact Layout) */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Parameter Teknis Slicing &amp; Antrean
                </label>

                {/* Row 1: Part count & Deadline */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">
                      Jumlah Komponen Part per Unit
                    </label>
                    <div className="grid grid-cols-3 bg-slate-900 border border-slate-800 rounded-xl p-1 items-center">
                      <button
                        type="button"
                        onClick={() => setQtyPart((q) => Math.max(1, q - 1))}
                        className="h-9 flex items-center justify-center rounded-lg hover:bg-slate-800 text-slate-300 transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={qtyPart}
                        onChange={(e) => setQtyPart(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full bg-transparent text-center font-bold font-mono text-base text-white outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setQtyPart((q) => q + 1)}
                        className="h-9 flex items-center justify-center rounded-lg hover:bg-slate-800 text-slate-300 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">
                      Target Selesai / Deadline
                    </label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-xs text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                {/* Row 2: Weight & Time Steppers */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">
                      Estimasi Berat Cetak (Gram)
                    </label>
                    <div className="relative flex items-center">
                      <button
                        type="button"
                        onClick={() => setWeight((w) => Math.max(1, w - 5))}
                        className="absolute left-1.5 px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 z-10"
                      >
                        -5g
                      </button>
                      <input
                        type="number"
                        step="1"
                        min="1"
                        value={weight}
                        onChange={(e) => setWeight(Math.max(1, parseFloat(e.target.value) || 1))}
                        className="w-full bg-slate-900 border border-slate-800 text-center font-mono font-bold text-lg py-3 rounded-xl text-white outline-none focus:border-rose-500"
                      />
                      <button
                        type="button"
                        onClick={() => setWeight((w) => w + 5)}
                        className="absolute right-1.5 px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 z-10"
                      >
                        +5g
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">
                      Durasi Waktu Cetak (Jam)
                    </label>
                    <div className="relative flex items-center">
                      <button
                        type="button"
                        onClick={() => setTime((t) => Math.max(0.5, t - 0.5))}
                        className="absolute left-1.5 px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 z-10"
                      >
                        -0.5h
                      </button>
                      <input
                        type="number"
                        step="0.5"
                        min="0.1"
                        value={time}
                        onChange={(e) => setTime(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
                        className="w-full bg-slate-900 border border-slate-800 text-center font-mono font-bold text-lg py-3 rounded-xl text-white outline-none focus:border-rose-500"
                      />
                      <button
                        type="button"
                        onClick={() => setTime((t) => t + 0.5)}
                        className="absolute right-1.5 px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 z-10"
                      >
                        +0.5h
                      </button>
                    </div>
                  </div>
                </div>

                {/* Row 3: Qty Order & Infill */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">
                      Jumlah Order Pesanan (SET)
                    </label>
                    <div className="grid grid-cols-3 bg-slate-900 border border-slate-800 rounded-xl p-1 items-center">
                      <button
                        type="button"
                        onClick={() => {
                          const newQ = Math.max(1, qtyOrder - 1);
                          setQtyOrder(newQ);
                          if (!isLocked) setManualPrice((p) => Math.round((p / qtyOrder) * newQ));
                        }}
                        className="h-9 flex items-center justify-center rounded-lg hover:bg-slate-800 text-slate-300 transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={qtyOrder}
                        onChange={(e) => {
                          const newQ = Math.max(1, parseInt(e.target.value) || 1);
                          setQtyOrder(newQ);
                        }}
                        className="w-full bg-transparent text-center font-bold font-mono text-base text-white outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newQ = qtyOrder + 1;
                          setQtyOrder(newQ);
                          if (!isLocked) setManualPrice((p) => Math.round((p / qtyOrder) * newQ));
                        }}
                        className="h-9 flex items-center justify-center rounded-lg hover:bg-slate-800 text-slate-300 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">
                      Infill Density (%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={infill}
                        onChange={(e) => setInfill(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-center font-mono font-bold text-white focus:outline-none focus:border-rose-500 text-base"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                        %
                      </span>
                    </div>
                  </div>
                </div>

                {/* Layer Height Selection Cards (3DFlow Exact Style) */}
                <div className="space-y-2 pt-2 border-t border-slate-900">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Pilihan Layer Height
                    </label>
                    <span className="text-[11px] font-mono text-slate-500">
                      Order Unit: <strong>{currentTotalUnits} Unit</strong> ({currentUnitsPerSet} unit/set)
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5">
                    {["0.10", "0.20", "0.40"].map((val) => {
                      const isSelected = Number(layerHeight) === Number(val);
                      const unitPrice = getLayerUnitPrice(val, selectedMaterialType);
                      const valTotalPrice = getLayerAdjustedPrice(
                        weight,
                        time,
                        qtyOrder,
                        val,
                        retailRateGr,
                        retailRateHr,
                        selectedMaterialType
                      );

                      return (
                        <button
                          key={val}
                          type="button"
                          onClick={() => {
                            setLayerHeight(val);
                            setIsLocked(true);
                          }}
                          className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                            isSelected
                              ? "bg-rose-500/15 border-rose-500 text-rose-300 ring-2 ring-rose-500/30 shadow-lg shadow-rose-500/10"
                              : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                          }`}
                        >
                          <div className="flex items-center justify-between w-full mb-1">
                            <span
                              className={`text-xs font-bold ${
                                isSelected ? "text-rose-400" : "text-white"
                              }`}
                            >
                              {val} mm
                            </span>
                            <span
                              className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                                isSelected
                                  ? "bg-rose-500 text-white font-bold"
                                  : "bg-slate-800 text-slate-400"
                              }`}
                            >
                              @ Rp {unitPrice.toLocaleString("id-ID")}/u
                            </span>
                          </div>

                          <div className="mt-1 flex flex-col">
                            <span className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold">
                              Total Auto
                            </span>
                            <span
                              className={`text-xs sm:text-sm font-black font-mono tracking-tight ${
                                isSelected ? "text-rose-400" : "text-slate-200"
                              }`}
                            >
                              {formatIDR(valTotalPrice)}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* CARD 4: Real-time Production Cost Analysis (COGS) */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
                  Estimasi Biaya Dasar Produksi (COGS)
                </span>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-950 rounded-2xl p-3 border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">
                      Filamen Material
                    </span>
                    <p className="text-sm font-mono font-bold text-slate-200 mt-1">
                      {formatIDR(materialCost)}
                    </p>
                  </div>
                  <div className="bg-slate-950 rounded-2xl p-3 border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">
                      Listrik &amp; Daya
                    </span>
                    <p className="text-sm font-mono font-bold text-slate-200 mt-1">
                      {formatIDR(energyCost)}
                    </p>
                  </div>
                  <div className="bg-slate-950 rounded-2xl p-3 border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">
                      Keausan Mesin
                    </span>
                    <p className="text-sm font-mono font-bold text-slate-200 mt-1">
                      {formatIDR(wearCost)}
                    </p>
                  </div>
                </div>
              </div>

              {/* CARD 5: Giant Retail Price Card (3DFlow Iconic Component) */}
              <div className="bg-gradient-to-br from-rose-600 via-rose-500 to-rose-700 rounded-3xl p-6 text-white shadow-xl shadow-rose-500/20 relative overflow-hidden border border-rose-400/30">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <DollarSign className="w-24 h-24 -mr-6 -mt-6" />
                </div>
                <div className="relative z-10 space-y-2">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-white/80">
                    Total Harga Jual Retail ({qtyOrder}x SET)
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white drop-shadow">
                      {formatIDR(activeSellingPrice)}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/20 mt-2 text-[10px] font-mono">
                    <span className="bg-black/25 px-2.5 py-0.5 rounded-full font-bold">
                      Formula: (Berat × Rp 400) + (Waktu × Rp 3.000)
                    </span>
                    <span className="bg-black/25 px-2.5 py-0.5 rounded-full font-bold">
                      Order Unit: {currentTotalUnits} Unit
                    </span>
                    <span className="bg-black/25 px-2.5 py-0.5 rounded-full font-bold">
                      {layerHeight}mm @ Rp {currentLayerUnitPrice.toLocaleString("id-ID")}/u
                    </span>
                  </div>
                </div>
              </div>

              {/* CARD 6: Manual Selling Price Override */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                        isLocked
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-amber-500/20 text-amber-400"
                      }`}
                    >
                      {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white uppercase tracking-wider block">
                        Kustomisasi Harga Jual (Override)
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {isLocked ? "Terkunci ke auto retail" : "Harga kustom manual aktif"}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsLocked(true);
                      setManualPrice(autoRetailPrice);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-[10px] font-bold text-rose-400 hover:bg-slate-800 transition-all"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset ke Auto Retail</span>
                  </button>
                </div>

                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold font-mono">
                    Rp
                  </span>
                  <input
                    type="number"
                    value={activeSellingPrice}
                    onChange={(e) => {
                      setManualPrice(Number(e.target.value));
                      if (isLocked) setIsLocked(false);
                    }}
                    className={`w-full bg-slate-900 border rounded-2xl py-3 pl-12 pr-4 font-mono font-bold text-xl outline-none transition-all ${
                      isLocked
                        ? "border-slate-800 text-slate-400"
                        : "border-rose-500 ring-2 ring-rose-500/20 text-rose-400"
                    }`}
                  />
                  {!isLocked && (
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase">
                      Manual
                    </span>
                  )}
                </div>
              </div>

              {/* CARD 7: Multi-Model Batch Button */}
              <button
                type="button"
                onClick={handleAddToBasket}
                className="w-full py-3.5 border-2 border-rose-500/40 border-dashed rounded-2xl text-rose-400 font-bold text-xs hover:bg-rose-500/10 transition-all flex items-center justify-center gap-2 active:scale-98"
              >
                <FolderPlus className="w-4 h-4" />
                <span>+ Tambah Model ke Batch (Multi-Model Order)</span>
              </button>

              {/* Render Batch List if any */}
              {basket.length > 0 && (
                <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                    <span>Daftar Model dalam Batch ({basket.length} Model)</span>
                    <span className="text-rose-400 font-mono">
                      {formatIDR(basket.reduce((s, it) => s + it.price, 0))}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {basket.map((it, idx) => (
                      <div
                        key={it.id}
                        className="bg-slate-900 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center text-[11px] font-bold text-slate-400">
                            {idx + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="font-bold text-white truncate">{it.modelName}</p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              {it.qtyOrder} SET • {it.qtyPart * it.qtyOrder} pcs • {it.weight}g •{" "}
                              {it.layerHeight}mm
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="font-mono font-bold text-rose-400">
                            {formatIDR(it.price)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveFromBasket(it.id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-400"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CARD 8: Profit Analysis Collapsible (3DFlow Exact Feature) */}
              <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950">
                <button
                  type="button"
                  onClick={() => setShowProfitAnalysis(!showProfitAnalysis)}
                  className="w-full flex items-center justify-between p-4 text-xs font-bold text-slate-300 hover:bg-slate-900/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span>Analisis Profit &amp; Efisiensi Margin</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      Laba Bersih: {formatIDR(netProfit)}
                    </span>
                  </div>
                  {showProfitAnalysis ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>

                {showProfitAnalysis && (
                  <div className="p-4 pt-0 space-y-3 border-t border-slate-800/80 mt-2 text-xs">
                    <div className="grid grid-cols-2 gap-3 pt-3">
                      <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">
                          Total Modal Produksi
                        </span>
                        <p className="text-sm font-mono font-bold text-rose-400 mt-1">
                          {formatIDR(totalProductionCost)}
                        </p>
                      </div>
                      <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">
                          Margin Keuntungan
                        </span>
                        <p className="text-sm font-mono font-bold text-emerald-400 mt-1">
                          {marginPercent}% dari Harga Retail
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer Submit */}
            <footer className="p-4 sm:p-5 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsCalculatorOpen(false)}
                className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
              >
                Batal
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleFinalSubmitOrder}
                className="flex-1 max-w-md py-3.5 px-6 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 disabled:opacity-50 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-500/25 active:scale-98 transition-all"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>
                  {isSubmitting
                    ? "Menyimpan ke Antrean..."
                    : basket.length > 0
                    ? `Selesaikan Batch (${basket.length} Model)`
                    : "Tambahkan ke Antrean Pesanan"}
                </span>
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* CATALOG BROWSER MODAL (3DFLOW PRODUCT CATALOG QUICK-SELECT)          */}
      {/* ==================================================================== */}
      {isCatalogOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-end bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="bg-slate-900 border-l border-slate-800 w-full max-w-md h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-250"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="p-5 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-rose-400" />
                  Katalog Model 3DFlow
                </h3>
                <p className="text-xs text-slate-400">
                  Pilih produk untuk mengisi otomatis spesifikasi slicing
                </p>
              </div>
              <button
                onClick={() => setIsCatalogOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </header>

            {/* Catalog Search & Category Tabs */}
            <div className="p-4 space-y-3 border-b border-slate-800 shrink-0">
              <input
                type="text"
                placeholder="Cari nama produk / SKU..."
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />

              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {catalogCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCatalogCategory(cat)}
                    className={`px-3 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all border ${
                      selectedCatalogCategory === cat
                        ? "bg-rose-500 text-white border-rose-500"
                        : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Catalog Items List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {filteredCatalogProducts.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  Tidak ada produk dalam katalog.
                </div>
              ) : (
                filteredCatalogProducts.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectProduct(p)}
                    className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 hover:border-rose-500/50 hover:bg-slate-800/40 text-left transition-all flex items-center gap-3 group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 overflow-hidden">
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-6 h-6 text-slate-600 group-hover:text-rose-400 transition-colors" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-xs text-white truncate group-hover:text-rose-400 transition-colors">
                        {p.name}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {p.modelWeight}g • {p.printingTime} jam • {p.layerHeight || "0.20"}mm
                      </p>
                      <p className="text-xs font-bold font-mono text-rose-400 mt-1">
                        {formatIDR(p.finalPrice || p.manualPrice || 0)}
                      </p>
                    </div>

                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-rose-400 group-hover:translate-x-1 transition-all" />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: DETAIL PESANAN (VIEW ORDER DETAILS)                           */}
      {/* ==================================================================== */}
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
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end ml-auto">
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

      {/* ==================================================================== */}
      {/* MODAL: KONFIRMASI HAPUS PESANAN                                      */}
      {/* ==================================================================== */}
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
