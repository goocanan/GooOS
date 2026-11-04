"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { GooNavbar } from "@/components/GooNavbar";
import { useGooSettings } from "@/hooks/use-goo-settings";
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
  TrendingUp,
  Zap,
  Wrench,
  Boxes,
  ArrowLeft,
  CheckCircle2,
  Info,
} from "lucide-react";

// ============================================================================
// 3DFLOW PRICING ENGINE & HELPERS
// ============================================================================
const normalizeQuotationMaterialName = (mat?: string | null): string => {
  const m = String(mat || "PLA").trim();
  if (m.toUpperCase().includes("PLA")) {
    return "PLA+";
  }
  return m;
};

const getLayerUnitPrice = (
  layerHeight: string | number,
  materialType: string = "PLA",
  layerPricing?: any
) => {
  const num = Number(layerHeight);
  const mat = String(materialType || "PLA").toUpperCase();

  if (mat.includes("PETG")) {
    if (num <= 0.12) return layerPricing?.petg?.fine ?? 1900;
    if (num <= 0.22) return layerPricing?.petg?.standard ?? 1100;
    return layerPricing?.petg?.draft ?? 1000;
  }
  if (mat.includes("TPU")) {
    if (num <= 0.12) return layerPricing?.tpu?.fine ?? 2500;
    if (num <= 0.22) return layerPricing?.tpu?.standard ?? 2200;
    return layerPricing?.tpu?.draft ?? 2000;
  }
  // PLA / PLA+ / Default
  if (num <= 0.12) return layerPricing?.pla?.fine ?? 1800;
  if (num <= 0.22) return layerPricing?.pla?.standard ?? 1000;
  return layerPricing?.pla?.draft ?? 800;
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
  materialType = "PLA",
  layerPricing?: any
) => {
  const basePrice = getBasePrintPrice(weight, time, rateGr, rateHr);
  const units = getMarketplaceUnits(basePrice);
  return units * getLayerUnitPrice(layerHeight, materialType, layerPricing) * Number(qtyOrder || 1);
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
  sku?: string | null;
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
  const { settings } = useGooSettings();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("gooos_orders_filter");
      if (saved) setStatusFilter(saved);
    } catch (e) {}
  }, []);

  const handleSetStatusFilter = (st: string) => {
    setStatusFilter(st);
    try { localStorage.setItem("gooos_orders_filter", st); } catch (e) {}
  };
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Saved Clients & Autocomplete
  const [savedClients, setSavedClients] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("gooos_saved_clients");
      if (stored) {
        setSavedClients(JSON.parse(stored));
      }
    } catch (e) {}
  }, []);

  const saveClientName = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSavedClients((prev) => {
      const updated = Array.from(new Set([trimmed, ...prev])).slice(0, 50);
      try {
        localStorage.setItem("gooos_saved_clients", JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  // Print Order Slip state
  const [printOrderData, setPrintOrderData] = useState<{ isBatch: boolean; data: any } | null>(null);

  const formatOrderDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  // Modals state
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [exportOrder, setExportOrder] = useState<any | null>(null);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [activeCatalogCategory, setActiveCatalogCategory] = useState("Semua");
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [copiedQuote, setCopiedQuote] = useState(false);
  const [copiedBasketItemId, setCopiedBasketItemId] = useState<number | null>(null);
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

      if (ordersJson.success) {
        setOrders(ordersJson.data);
        const existingNames = ordersJson.data
          .map((o: Order) => o.clientName?.trim())
          .filter(Boolean);
        if (existingNames.length > 0) {
          setSavedClients((prev) => {
            const merged = Array.from(new Set([...prev, ...existingNames])).slice(0, 50);
            try { localStorage.setItem("gooos_saved_clients", JSON.stringify(merged)); } catch (e) {}
            return merged;
          });
        }
      }
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

  // Catalog Categories & Product Selection
  const catalogCategories = useMemo(() => {
    return [
      "Semua",
      ...Array.from(
        new Set(products.map((p) => p.category || "General").filter(Boolean))
      ),
    ];
  }, [products]);

  const handleSelectProduct = (product: ProductItem) => {
    setModelName(product.name);
    setWeight(product.modelWeight || 125);
    setTime(product.printingTime || 4.5);
    setModelImageUrl(product.imageUrl || null);
    if (product.qtyPart) setQtyPart(product.qtyPart);
    if (product.infill) setInfill(String(product.infill).replace("%", ""));
    if (product.layerHeight) setLayerHeight(product.layerHeight);

    if (product.manualPrice && Number(product.manualPrice) > 0) {
      setManualPrice(Number(product.manualPrice) * qtyOrder);
      setIsLocked(false);
    } else if (product.finalPrice && Number(product.finalPrice) > 0) {
      setManualPrice(Number(product.finalPrice) * qtyOrder);
      setIsLocked(false);
    } else {
      setIsLocked(true);
    }

    setIsCatalogOpen(false);
    showToast(`Produk "${product.name}" berhasil dimuat ke form!`);
  };

  const handleSelectMaterialType = (matId: string) => {
    setSelectedMaterialType(matId);
    const searchMat = matId.replace("95", "").toUpperCase();
    const matchingSpool = spools.find(
      (s) =>
        s.materialType.toUpperCase().includes(searchMat) &&
        (s.currentWeight || 0) > 0
    );
    if (matchingSpool) {
      setSelectedSpoolId(matchingSpool.id);
      if (matchingSpool.color && !materialColor) {
        setMaterialColor(matchingSpool.color);
      }
    }
  };

  const handleAddQtyOrder = (newQty: number) => {
    const validQty = Math.max(1, newQty);
    if (!isLocked && manualPrice > 0) {
      setManualPrice(Math.round((manualPrice / qtyOrder) * validQty));
    }
    setQtyOrder(validQty);
  };

  const handleAddModelToBatch = () => {
    if (!modelName.trim()) {
      alert("Silakan masukkan Nama Model terlebih dahulu!");
      return;
    }
    const item: BasketItem = {
      id: Date.now(),
      modelName: modelName.trim(),
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
    };
    if (clientName.trim()) {
      saveClientName(clientName);
    }
    setBasket((prev) => [...prev, item]);
    // Reset for next model
    setModelName("");
    setWeight(125);
    setTime(4.5);
    setQtyOrder(1);
    setQtyPart(1);
    setModelImageUrl(null);
    setIsLocked(true);
    showToast(`Model "${item.modelName}" berhasil ditambahkan ke Batch!`);
  };

  const handleRemoveFromBasket = (id: number) => {
    setBasket((prev) => prev.filter((it) => it.id !== id));
  };

  const handleCopyBasketItemToForm = (item: BasketItem) => {
    setModelName(item.modelName || "");
    setWeight(item.weight || 125);
    setTime(item.time || 4.5);
    setQtyOrder(item.qtyOrder || 1);
    setQtyPart(item.qtyPart || 1);
    setInfill(item.infill || "15");
    setLayerHeight(item.layerHeight || "0.20");
    setSelectedMaterialType(item.materialType || "PLA");
    setMaterialColor(item.materialColor || "Black");
    setSelectedSpoolId(item.selectedSpoolId);
    setModelImageUrl(item.modelImageUrl || null);
    setSource(item.source || "direct");
    setDueDate(item.dueDate || "");
    setIsLocked(item.isLocked);
    if (!item.isLocked) {
      setManualPrice(item.price);
    }
    setCopiedBasketItemId(item.id);
    setTimeout(() => setCopiedBasketItemId(null), 1800);
    showToast(`Model "${item.modelName}" disalin kembali ke form!`);
  };

  // Calculator Auto Pricing (from Centralized Settings)
  const retailRateGr = settings.retailPricePerGram || 400;
  const retailRateHr = settings.retailPricePerHour || 3000;
  const basePrintPrice = getBasePrintPrice(weight, time, retailRateGr, retailRateHr);
  const currentUnitsPerSet = getMarketplaceUnits(basePrintPrice);
  const currentTotalUnits = currentUnitsPerSet * Number(qtyOrder || 1);
  const currentLayerUnitPrice = getLayerUnitPrice(layerHeight, selectedMaterialType);
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

  // Live Cost Calculations (matching 3DFlow cost analysis)
  const selectedSpool = spools.find((s) => s.id === selectedSpoolId);
  const spoolCostPerGram = selectedSpool?.pricePerGram || 150;
  const electricityRate = settings.electricityCostPerKwh || 1500;
  const printerWatt = settings.printerPowerWatt || 150;
  const wearRate = (settings as any).wearCostPerHour || 500;

  const materialCost = Math.round(Number(weight) * spoolCostPerGram * Number(qtyOrder));
  const energyCost = Math.round((printerWatt / 1000) * Number(time) * electricityRate * Number(qtyOrder));
  const wearCost = Math.round(Number(time) * wearRate * Number(qtyOrder));
  const totalProductionCost = materialCost + energyCost + wearCost;
  const netProfit = activeSellingPrice - totalProductionCost;
  const efficiencyMargin = activeSellingPrice > 0 ? Math.round((netProfit / activeSellingPrice) * 100) : 0;

  // Copy Quotation to Clipboard (Exact 3DFlow WhatsApp / Marketplace Format)
  const copyQuoteToClipboard = () => {
    const idr = new Intl.NumberFormat("id-ID");
    const shopeeLink = (settings as any).shopeeLink || "https://shopee.co.id/goocanan";
    const tokopediaLink = (settings as any).tokopediaLink || "https://tokopedia.com/goocanan";
    const batchId = Math.random().toString(36).substring(7).toUpperCase();

    const formatItem = (item: any, index: number) => {
      const materialName = normalizeQuotationMaterialName(item.materialType);
      const setPriceRaw = (item.weight * retailRateGr) + (item.time * retailRateHr);
      const unitsPerSet = getMarketplaceUnits(setPriceRaw);
      const totalUnits = unitsPerSet * (item.qtyOrder || 1);
      const layerUnitPrice = getLayerUnitPrice(item.layerHeight, item.materialType, settings.layerPricing);
      const subtotal = item.isLocked === false && item.price ? item.price : totalUnits * layerUnitPrice;
      const infillDisplay = String(item.infill).includes("%") ? item.infill : `${item.infill}%`;

      return `${index >= 0 ? `${index + 1}. ` : ""}*[${item.modelName || "Model"}] (${item.qtyPart || 1}pcs) (x${item.qtyOrder || 1} SET)*
   • Spesifikasi   : ${materialName}, ${item.materialColor || "-"}, Layer ${item.layerHeight}mm, Infill ${infillDisplay}
   • Qty Part*Order: ${item.qtyPart || 1} pcs * ${item.qtyOrder || 1} SET = ${(item.qtyPart || 1) * (item.qtyOrder || 1)} pcs
   • Weight*Order  : ${item.weight}g * ${item.qtyOrder || 1} SET = ${item.weight * (item.qtyOrder || 1)}g
   • Time*Order    : ${item.time} H * ${item.qtyOrder || 1} SET = ${item.time * (item.qtyOrder || 1)} H
   • Marketplace   : ${unitsPerSet} Units * ${item.qtyOrder || 1} SET = ${totalUnits} Units
   • Harga Opsi    : ${materialName} Layer ${item.layerHeight}mm @ Rp ${idr.format(layerUnitPrice)}/unit
   • Subtotal      : ${totalUnits} Units * Rp ${idr.format(layerUnitPrice)} = Rp ${idr.format(subtotal)}`;
    };

    if (basket.length > 0) {
      const totalQty = basket.reduce((sum, item) => sum + (item.qtyPart * item.qtyOrder), 0);
      const totalWeight = basket.reduce((sum, item) => sum + (item.weight * item.qtyOrder), 0);
      const grandTotal = basket.reduce((sum, item) => {
        const upr = (item.weight * retailRateGr) + (item.time * retailRateHr);
        const units = getMarketplaceUnits(upr) * item.qtyOrder;
        const layerPrice = getLayerUnitPrice(item.layerHeight, item.materialType, settings.layerPricing);
        return sum + (item.isLocked === false && item.price ? item.price : units * layerPrice);
      }, 0);
      const totalUnits = basket.reduce((sum, item) => {
        const basePrice = (item.weight * retailRateGr) + (item.time * retailRateHr);
        return sum + (getMarketplaceUnits(basePrice) * item.qtyOrder);
      }, 0);

      const text = `📦 *QUOTATION BATCH #${batchId}*
Client: *${clientName || "Valued Customer"}*
------------------------------------------

${basket.map((item, i) => formatItem(item, i)).join("\n\n")}

------------------------------------------
📊 *BATCH TOTALS*
• Total Models : ${basket.length}
• Total Qty    : ${totalQty} pcs
• Total Weight : ${totalWeight} gram
*GRAND TOTAL   : Rp ${idr.format(grandTotal)}*
*ORDER UNIT    : ${totalUnits} UNITS*

🛒 *PROSEDUR PEMBAYARAN (MARKETPLACE)*
1. Pilih produk *Custom 3D Print* di toko kami.
2. Masukkan rincian varian ke dalam keranjang belanja:
${basket.map((item, idx) => `   - Model ${idx + 1} (${item.modelName || "Model"}): Pilih Varian Bahan ${normalizeQuotationMaterialName(item.materialType)} & Layer ${item.layerHeight}mm -> Masukkan ${getMarketplaceUnits((item.weight * retailRateGr) + (item.time * retailRateHr)) * (item.qtyOrder || 1)} Unit (@ Rp ${idr.format(getLayerUnitPrice(item.layerHeight, item.materialType, settings.layerPricing))}/unit)`).join("\n")}
   👉 *Total Keranjang: ${totalUnits} UNIT*
3. Cantumkan catatan/note QUOTATION BATCH #${batchId} pada pesanan.
4. Lanjutkan checkout dan konfirmasi pesanan.

🔗 *Link Order:*
• Tokopedia: ${tokopediaLink}
• Shopee   : ${shopeeLink}

------------------------------------------
_Terima kasih telah memesan di GOOCANAN!_`;

      navigator.clipboard.writeText(text);
    } else {
      const currentItem = {
        modelName,
        weight,
        time,
        qtyOrder,
        qtyPart,
        infill,
        layerHeight,
        materialColor,
        materialType: selectedMaterialType,
        price: activeSellingPrice,
        isLocked,
      };
      const quoteContent = formatItem(currentItem, -1).split("\n").slice(1).join("\n");
      const setPriceRaw = (weight * retailRateGr) + (time * retailRateHr);
      const units = getMarketplaceUnits(setPriceRaw) * qtyOrder;
      const subtotal = activeSellingPrice;
      const normalizedMat = normalizeQuotationMaterialName(selectedMaterialType);
      const unitP = getLayerUnitPrice(layerHeight, selectedMaterialType, settings.layerPricing);

      const text = `📦 *ORDER CONFIRMATION #${batchId}*
Client: *${clientName || "Valued Customer"}*
------------------------------------------

*[${modelName || "Model"}] (${qtyPart}pcs) (x${qtyOrder} SET)*
${quoteContent}

------------------------------------------
*GRAND TOTAL : Rp ${idr.format(subtotal)}*
*ORDER UNIT  : ${units} UNITS*

🛒 *PROSEDUR PEMBAYARAN (MARKETPLACE)*
1. Pilih produk *Custom 3D Print* di etalase toko kami.
2. Tentukan pilihan varian:
   👉 *Varian Bahan : ${normalizedMat}*
   👉 *Varian Layer : Layer ${layerHeight}mm*
3. Masukkan jumlah order sebanyak *${units} Unit* ke keranjang belanja.
   (Tarif: ${units} unit x Rp ${idr.format(unitP)}/unit = Rp ${idr.format(subtotal)})
4. Cantumkan catatan/note: *ORDER #${batchId}*
5. Lanjutkan proses pembayaran.

🔗 *Link Order:*
• Tokopedia: ${tokopediaLink}
• Shopee   : ${shopeeLink}

------------------------------------------
_Terima kasih telah memesan di GOOCANAN!_`;

      navigator.clipboard.writeText(text);
    }

    setCopiedQuote(true);
    setTimeout(() => setCopiedQuote(false), 2000);
    showToast("Quotation berhasil disalin ke clipboard!");
  };

  // Submit Order from Calculator (Supports both Update & Create Single/Batch)
  const handleFinalSubmitOrder = async () => {
    if (!clientName.trim()) {
      alert("Silakan masukkan Nama Klien / Pembeli terlebih dahulu!");
      return;
    }
    saveClientName(clientName);

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

      if (editingOrder?.id && basket.length === 0) {
        // Update existing order via PATCH
        const item = itemsToSave[0]!;
        const patchPayload = {
          modelName: item.modelName,
          clientName: clientName.trim(),
          source: item.source || source || "direct",
          price: item.price,
          modelImageUrl: item.modelImageUrl || null,
          materialType: item.materialType,
          materialColor: item.materialColor,
          quantity: item.qtyOrder,
          qtyPart: item.qtyPart,
          infill: item.infill ? (String(item.infill).includes("%") ? item.infill : `${item.infill}%`) : "15%",
          layerHeight: String(item.layerHeight),
          weight: Number(item.weight),
          time: Number(item.time),
          dueDate: item.dueDate || null,
        };

        const res = await fetch(`/api/flow/orders/${editingOrder.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patchPayload),
        });

        const json = await res.json();
        if (!json.success) throw new Error(json.error || "Gagal memperbarui pesanan");

        showToast(`Pesanan #${editingOrder.orderNumber} berhasil diperbarui!`);
      } else {
        // Create new order(s) via POST
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
            infill: item.infill ? (String(item.infill).includes("%") ? item.infill : `${item.infill}%`) : "15%",
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
      }

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
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6 overflow-x-hidden">
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
                    onClick={() => handleSetStatusFilter(tab.id)}
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
                                {group.orders.length} Model • Klien: {firstOrder.clientName} • Masuk: {formatOrderDate(firstOrder.createdAt)}
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

                            <button
                              onClick={() => setPrintOrderData({ isBatch: true, data: group })}
                              className="h-8 w-8 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-700 transition-all shadow-sm"
                              title="Print Slip Batch Pesanan (SPK)"
                            >
                              <Printer className="w-4 h-4" />
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
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest block">
                                      No. Pesanan
                                    </span>
                                    <span className="text-[10px] text-slate-500 font-mono">
                                      • Masuk: {formatOrderDate(order.createdAt)}
                                    </span>
                                  </div>
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
                                    <>
                                      <button
                                        onClick={() => setExportOrder(order)}
                                        className="h-8 w-8 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-700 transition-all shadow-sm"
                                        title="Review & Salin Quote WA"
                                      >
                                        <FileText className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => setPrintOrderData({ isBatch: false, data: order })}
                                        className="h-8 w-8 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-700 transition-all shadow-sm"
                                        title="Print Slip Pesanan (SPK)"
                                      >
                                        <Printer className="w-3.5 h-3.5" />
                                      </button>
                                    </>
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
                              <div>#{order.orderNumber}</div>
                              <div className="text-[10px] text-slate-400 font-mono font-normal mt-0.5">
                                {formatOrderDate(order.createdAt)}
                              </div>
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
                                  onClick={() => setPrintOrderData({ isBatch: false, data: order })}
                                  className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
                                  title="Print Slip Pesanan (SPK)"
                                >
                                  <Printer className="w-3.5 h-3.5" />
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
                      const mat = normalizeQuotationMaterialName(o.materialType);
                      return `${idx + 1}. *[${o.modelName}]* (${o.qtyPart || 1} pcs) (x${q} SET)
• Bahan  : ${mat} ${o.materialColor ? `(${o.materialColor})` : ""}
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
                      const unitP = getLayerUnitPrice(lh, o.materialType || "PLA", settings.layerPricing);
                      const mat = normalizeQuotationMaterialName(o.materialType);
                      totalUnits += u;
                      return `• *${o.modelName}* (${mat} - ${lh}mm): ${u} unit x Rp ${unitP.toLocaleString(
                        "id-ID"
                      )} ➜ *Rp ${Math.round(o.price).toLocaleString("id-ID")}*`;
                    })
                    .join("\n");

                  return `📦 *QUOTATION BATCH #${batchId}*
*Client  : ${cName}*
------------------------------------------

🛠 *SPESIFIKASI BATCH PRODUKSI*
${specs}

💰 *RINCIAN BIAYA & HARGA VARIAN*
${costDetails}
------------------------------------------
*TOTAL AKHIR BATCH : Rp ${Math.round(bPrice).toLocaleString("id-ID")}*
*TOTAL UNIT MARKETPLACE : ${totalUnits} UNIT*

🛒 *CARA & PROSEDUR ORDER MARKETPLACE (Shopee / Tokopedia):*
1. Buka etalase produk *Custom 3D Print* di toko kami.
2. Masukkan rincian varian untuk setiap model ke dalam keranjang:
${oList.map((o: Order, idx: number) => {
  const mat = normalizeQuotationMaterialName(o.materialType);
  const lh = o.layerHeight || "0.20";
  const w = o.weight || (o.items && o.items[0] ? o.items[0].weightUsed / (o.quantity || 1) : 125);
  const t = o.time || 4.5;
  const q = o.quantity || 1;
  const u = getMarketplaceUnits(getBasePrintPrice(w, t, 400, 3000)) * q;
  const up = getLayerUnitPrice(lh, o.materialType || "PLA", settings.layerPricing);
  return `   - Model ${idx + 1} (${o.modelName}): Pilih Bahan *${mat}* & Layer *${lh}mm* ➜ Masukkan *${u} Unit* (@ Rp ${up.toLocaleString("id-ID")}/unit)`;
}).join("\n")}
   👉 *Total Keseluruhan Keranjang: ${totalUnits} UNIT*
3. Cantumkan catatan/note pesanan: *QUOTATION BATCH #${batchId}*
4. Lanjutkan proses checkout & pembayaran.
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
                  const unitP = getLayerUnitPrice(lh, o.materialType || "PLA", settings.layerPricing);
                  const mat = normalizeQuotationMaterialName(o.materialType);

                  return `📦 *ORDER CONFIRMATION #${o.orderNumber}*
*Klien: ${o.clientName}*
------------------------------------------

*[${o.modelName}]* (${o.qtyPart || 1} pcs) (x${q} SET)
• Bahan      : ${mat} ${o.materialColor ? `(${o.materialColor})` : ""}
• Layer      : ${lh}mm
• Infill     : ${o.infill || "15%"}
• Berat      : ${w * q} gram
• Waktu      : ${t * q} jam
• Marketplace: ${units} Unit (@ Rp ${unitP.toLocaleString("id-ID")}/unit)
------------------------------------------
*TOTAL HARGA : Rp ${Math.round(o.price).toLocaleString("id-ID")}*
*ORDER UNIT  : ${units} UNITS*

🛒 *CARA & PROSEDUR PEMBAYARAN MARKETPLACE:*
1. Buka etalase produk *Custom 3D Print* di Shopee / Tokopedia.
2. Tentukan pilihan varian:
   👉 *Varian Bahan : ${mat}*
   👉 *Varian Layer : Layer ${lh}mm*
3. Masukkan jumlah *${units} Unit* ke keranjang (@ Rp ${unitP.toLocaleString("id-ID")}/unit).
4. Cantumkan catatan order: *#${o.orderNumber}*.
5. Selesaikan checkout dan pembayaran.
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
      {/* PRODUCTION WORK ORDER PRINT SLIP MODAL (SPK)                         */}
      {/* ==================================================================== */}
      {printOrderData && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 text-slate-100 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 print:hidden">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Print Slip Pesanan Produksi (SPK)</h3>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {printOrderData.isBatch
                      ? `Batch #${printOrderData.data.id}`
                      : `#${printOrderData.data.orderNumber} - ${printOrderData.data.modelName}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPrintOrderData(null)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Printable Slip Paper Preview */}
            <div
              id="printable-spk-slip"
              className="flex-1 overflow-y-auto bg-white text-slate-950 p-6 sm:p-8 rounded-2xl font-sans text-xs border border-slate-200 shadow-inner space-y-5 print:p-0 print:border-none print:shadow-none"
            >
              {/* Slip Header */}
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-lg tracking-wider text-slate-950 uppercase">
                      GOOCANAN 3DFLOW
                    </span>
                    <span className="text-[10px] bg-slate-900 text-white font-mono px-2 py-0.5 rounded font-bold">
                      SPK PRODUKSI
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5 font-medium">
                    Additive Manufacturing &amp; Farm Job Ticket
                  </p>
                </div>
                <div className="text-right font-mono">
                  <div className="text-sm font-black text-slate-950">
                    {printOrderData.isBatch
                      ? `BATCH #${printOrderData.data.id}`
                      : `#${printOrderData.data.orderNumber}`}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Tgl Masuk: {formatOrderDate(
                      printOrderData.isBatch
                        ? printOrderData.data.orders?.[0]?.createdAt
                        : printOrderData.data.createdAt
                    )}
                  </div>
                </div>
              </div>

              {/* Order Meta Header */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-slate-100 rounded-xl text-[11px] border border-slate-200">
                <div>
                  <span className="text-slate-500 block text-[10px] font-semibold uppercase">Nama Klien / Pembeli</span>
                  <span className="font-bold text-slate-900 text-xs">
                    {printOrderData.isBatch
                      ? printOrderData.data.orders?.[0]?.clientName || "Valued Customer"
                      : printOrderData.data.clientName || "Valued Customer"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] font-semibold uppercase">Sumber Pesanan</span>
                  <span className="font-bold text-slate-900 uppercase text-xs">
                    {printOrderData.isBatch
                      ? printOrderData.data.orders?.[0]?.source || "Direct"
                      : printOrderData.data.source || "Direct"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] font-semibold uppercase">Total Tagihan</span>
                  <span className="font-bold text-slate-900 font-mono text-xs">
                    Rp {Math.round(
                      printOrderData.isBatch
                        ? printOrderData.data.orders?.reduce((sum: number, o: Order) => sum + (o.price || 0), 0)
                        : printOrderData.data.price || 0
                    ).toLocaleString("id-ID")}
                  </span>
                </div>
              </div>

              {/* Products Table */}
              <div>
                <h4 className="font-bold text-[11px] uppercase tracking-wider text-slate-800 mb-2">
                  Daftar Produk &amp; Parameter Cetak
                </h4>
                <div className="border border-slate-300 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-[11px] divide-y divide-slate-200">
                    <thead className="bg-slate-100 font-bold text-slate-700">
                      <tr>
                        <th className="py-2 px-3">No</th>
                        <th className="py-2 px-3">Produk / Model</th>
                        <th className="py-2 px-3">Qty</th>
                        <th className="py-2 px-3">Material &amp; Warna</th>
                        <th className="py-2 px-3">SKU Filament</th>
                        <th className="py-2 px-3">Layer / Infill</th>
                        <th className="py-2 px-3 text-right">Berat &amp; Waktu</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {(printOrderData.isBatch ? printOrderData.data.orders : [printOrderData.data]).map(
                        (item: any, idx: number) => {
                          const w = item.weight || (item.items?.[0] ? item.items[0].weightUsed / (item.quantity || 1) : 125);
                          const t = item.time || 4.5;
                          const q = item.quantity || 1;
                          const qPart = item.qtyPart || 1;
                          const matchedSpool = spools.find((s) => s.id === item.items?.[0]?.inventoryId);
                          const filamentSku =
                            item.filamentSku ||
                            matchedSpool?.sku ||
                            `${(item.materialType || "PLA").toUpperCase().replace(/\+/g, "P")}-${(item.materialColor || "BLK").substring(0, 3).toUpperCase()}-001`;

                          return (
                            <tr key={item.id || idx}>
                              <td className="py-2.5 px-3 font-mono font-bold">{idx + 1}</td>
                              <td className="py-2.5 px-3">
                                <div className="font-bold text-slate-900">{item.modelName}</div>
                                {item.orderNumber && (
                                  <div className="text-[10px] text-slate-500 font-mono">#{item.orderNumber}</div>
                                )}
                              </td>
                              <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                                {q} SET ({q * qPart} pcs)
                              </td>
                              <td className="py-2.5 px-3">
                                <span className="font-semibold">{normalizeQuotationMaterialName(item.materialType)}</span>
                                <span className="text-slate-500 block text-[10px]">{item.materialColor || "Default"}</span>
                              </td>
                              <td className="py-2.5 px-3 font-mono font-bold text-slate-800 text-[10px]">
                                <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-300">
                                  {filamentSku}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 font-mono text-[10px]">
                                <div>{item.layerHeight || "0.20"}mm</div>
                                <div className="text-slate-500">{item.infill || "15%"}</div>
                              </td>
                              <td className="py-2.5 px-3 font-mono text-right text-[10px]">
                                <div className="font-bold text-slate-900">{w * q}g</div>
                                <div className="text-slate-500">{t * q} jam</div>
                              </td>
                            </tr>
                          );
                        }
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* QC / SOP Checklist */}
              <div className="pt-2 border-t border-slate-200">
                <span className="font-bold text-[11px] uppercase tracking-wider text-slate-800 block mb-2">
                  Checklist Tahapan Produksi &amp; Quality Control:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px]">
                  <div className="flex items-center gap-2 border border-slate-300 p-2 rounded-lg">
                    <span className="w-4 h-4 border border-slate-400 rounded inline-block" />
                    <span>1. Slicing Model (.gcode)</span>
                  </div>
                  <div className="flex items-center gap-2 border border-slate-300 p-2 rounded-lg">
                    <span className="w-4 h-4 border border-slate-400 rounded inline-block" />
                    <span>2. Pasang Spool Filament</span>
                  </div>
                  <div className="flex items-center gap-2 border border-slate-300 p-2 rounded-lg">
                    <span className="w-4 h-4 border border-slate-400 rounded inline-block" />
                    <span>3. Kalibrasi First Layer Bed</span>
                  </div>
                  <div className="flex items-center gap-2 border border-slate-300 p-2 rounded-lg">
                    <span className="w-4 h-4 border border-slate-400 rounded inline-block" />
                    <span>4. Lepas &amp; Support Clean</span>
                  </div>
                  <div className="flex items-center gap-2 border border-slate-300 p-2 rounded-lg">
                    <span className="w-4 h-4 border border-slate-400 rounded inline-block" />
                    <span>5. QC Fisik &amp; Dimensi OK</span>
                  </div>
                  <div className="flex items-center gap-2 border border-slate-300 p-2 rounded-lg">
                    <span className="w-4 h-4 border border-slate-400 rounded inline-block" />
                    <span>6. Packing Box &amp; Resi</span>
                  </div>
                </div>
              </div>

              {/* Signatures & Notes */}
              <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-200 text-[10px]">
                <div>
                  <span className="text-slate-500 font-semibold block uppercase">Catatan Operator / Farm:</span>
                  <div className="h-14 border border-dashed border-slate-300 rounded-lg mt-1 p-2 text-slate-400 italic">
                    Tulis catatan khusus pengerjaan di sini...
                  </div>
                </div>
                <div className="flex flex-col justify-between text-right">
                  <span className="text-slate-500 font-semibold uppercase">Petugas Cetak / QC:</span>
                  <div className="pt-8">
                    <span className="font-bold border-t border-slate-400 px-8 inline-block text-slate-800">
                      Operator Farm Goocanan
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3 pt-2 print:hidden">
              <button
                type="button"
                onClick={() => setPrintOrderData(null)}
                className="flex-1 py-3 rounded-xl font-bold text-xs text-slate-400 bg-slate-800/60 hover:bg-slate-800 transition-all border border-slate-700"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="flex-[2] py-3 rounded-xl font-bold text-xs text-white bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-600/30 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Slip Pesanan (Print / PDF)</span>
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
                    {editingOrder ? "Edit Pesanan Cetak 3D" : "Kalkulator Pesanan Cetak 3D"}
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
                  onClick={copyQuoteToClipboard}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    copiedQuote
                      ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30"
                      : "bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                  }`}
                  title="Salin Rincian Quotation untuk WhatsApp / Marketplace"
                >
                  {copiedQuote ? (
                    <Check className="w-4 h-4 stroke-[3]" />
                  ) : (
                    <Share2 className="w-4 h-4" />
                  )}
                  <span>{copiedQuote ? "Tersalin!" : "Bagikan Rincian"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setWeight(125);
                    setTime(4.5);
                    setQtyOrder(1);
                    setQtyPart(1);
                    setInfill("15");
                    setLayerHeight("0.20");
                    setModelName("");
                    setClientName("");
                    setModelImageUrl(null);
                    setIsLocked(true);
                    setManualPrice(0);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800/80 hover:bg-slate-700 text-rose-400 transition-all"
                  title="Reset form kalkulator"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsCalculatorOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all ml-1"
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

              {/* Client & Model Name with Catalog Browser */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Nama Model / File 3D *</span>
                    <button
                      type="button"
                      onClick={() => setIsCatalogOpen(true)}
                      className="text-[11px] text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1 transition"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Pilih dari Katalog</span>
                    </button>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Holder HP V2 / Mini Planter"
                      value={modelName}
                      onChange={(e) => setModelName(e.target.value)}
                      className="w-full px-3.5 py-3 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-rose-500 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setIsCatalogOpen(true)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 hover:scale-110 transition"
                      title="Buka Katalog Produk 3D"
                    >
                      <BookOpen className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Nama Klien / Pembeli *
                    </label>
                    {savedClients.length > 0 && (
                      <span className="text-[10px] text-slate-500 font-mono">
                        {savedClients.length} tersimpan
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    list="client-suggestions-list"
                    placeholder="Contoh: Budi Santoso / Direct Customer"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full px-3.5 py-3 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                  <datalist id="client-suggestions-list">
                    {savedClients.map((client) => (
                      <option key={client} value={client} />
                    ))}
                  </datalist>

                  {/* Quick selection pills for recent clients */}
                  {!clientName && savedClients.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <span className="text-[10px] text-slate-500">Pilih cepat:</span>
                      {savedClients.slice(0, 4).map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setClientName(c)}
                          className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-[10px] text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Order Source Selector */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Sumber Pesanan (Channel)
                </label>
                <div className="grid grid-cols-3 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
                  {[
                    { id: "direct", label: "Direct Sale", icon: User },
                    { id: "tokopedia", label: "Tokopedia", icon: Store },
                    { id: "shopee", label: "Shopee", icon: ShoppingBag },
                  ].map((src) => {
                    const Icon = src.icon;
                    const isSelected = source === src.id;
                    return (
                      <button
                        key={src.id}
                        type="button"
                        onClick={() => setSource(src.id)}
                        className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                          isSelected
                            ? src.id === "tokopedia"
                              ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30"
                              : src.id === "shopee"
                              ? "bg-orange-600 text-white shadow-lg shadow-orange-600/30"
                              : "bg-rose-600 text-white shadow-lg shadow-rose-600/30"
                            : "text-slate-400 hover:text-white hover:bg-slate-900"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{src.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Material Details (Cards + Spool Selection) */}
              <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5 uppercase tracking-wider">
                    <Layers className="w-4 h-4" /> Rincian Material &amp; Spul Filamen
                  </span>
                </div>

                {/* Material Type Cards */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                    Tipe Material Cetak
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {[
                      { id: "PLA", label: "PLA / PLA+", desc: "Rp 800 - 1.800/u" },
                      { id: "PETG", label: "PETG", desc: "Rp 1.000 - 1.900/u" },
                      { id: "TPU95", label: "TPU95", desc: "Rp 2.000 - 2.500/u" },
                    ].map((mat) => {
                      const isSelected =
                        selectedMaterialType === mat.id ||
                        (mat.id === "PLA" && selectedMaterialType === "PLA+");
                      return (
                        <button
                          key={mat.id}
                          type="button"
                          onClick={() => handleSelectMaterialType(mat.id)}
                          className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                            isSelected
                              ? "bg-rose-500/15 border-rose-500 text-rose-300 ring-2 ring-rose-500/20 shadow-md"
                              : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                          }`}
                        >
                          <div className="flex items-center justify-between w-full mb-1">
                            <span className={`text-xs font-bold ${isSelected ? "text-rose-400" : "text-slate-200"}`}>
                              {mat.label}
                            </span>
                            {isSelected && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-rose-400" />
                            )}
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 font-semibold">
                            {mat.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Spool Dropdown & Color Input */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold mb-1 uppercase">
                      Pilih Spul dari Stok Inventaris
                    </label>
                    <select
                      value={selectedSpoolId || ""}
                      onChange={(e) => {
                        const sId = e.target.value || null;
                        setSelectedSpoolId(sId);
                        const match = spools.find((sp) => sp.id === sId);
                        if (match?.color) setMaterialColor(match.color);
                      }}
                      className="w-full px-3 py-2.5 text-xs rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-rose-500"
                    >
                      <option value="">(Tanpa kaitkan ke inventaris spul)</option>
                      {spools
                        .filter((s) => (s.currentWeight || 0) > 0)
                        .map((spool) => (
                          <option key={spool.id} value={spool.id}>
                            {spool.brand} {spool.materialType} {spool.color} — Sisa: {Math.round(spool.currentWeight)}g (@ Rp {Math.round(spool.pricePerGram || 150)}/g)
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold mb-1 uppercase">
                      Warna / Varian Filament
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Black / White / Glow"
                      value={materialColor}
                      onChange={(e) => setMaterialColor(e.target.value)}
                      className="w-full px-3 py-2.5 text-xs rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>
              </div>

              {/* Order Context (Qty Parts & Due Date) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Konteks Pesanan
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">
                      Qty Parts per Model (Komponen)
                    </label>
                    <div className="grid grid-cols-3 bg-slate-950 border border-slate-800 rounded-xl p-1">
                      <button
                        type="button"
                        onClick={() => setQtyPart((q) => Math.max(1, q - 1))}
                        className="h-9 flex items-center justify-center rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={qtyPart}
                        onChange={(e) => setQtyPart(Math.max(1, Number(e.target.value)))}
                        className="w-full bg-transparent text-center font-bold text-base outline-none text-white font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setQtyPart((q) => q + 1)}
                        className="h-9 flex items-center justify-center rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">
                      Target Selesai (Due Date)
                    </label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-xs font-mono text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>
              </div>

              {/* Slicing Weight & Time Steppers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Berat Slicing per Model (gram)
                  </label>
                  <div className="relative flex items-center">
                    <button
                      type="button"
                      onClick={() => setWeight((w) => Math.max(1, w - 5))}
                      className="absolute left-1.5 w-8 h-8 flex items-center justify-center rounded-lg bg-slate-900 text-slate-400 hover:text-white border border-slate-800 shadow-sm z-10 transition"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={weight}
                      onChange={(e) => setWeight(Math.max(1, Number(e.target.value)))}
                      className="w-full bg-slate-950 border border-slate-800 text-center font-bold text-lg py-3 rounded-xl outline-none text-white font-mono focus:border-rose-500"
                    />
                    <button
                      type="button"
                      onClick={() => setWeight((w) => w + 5)}
                      className="absolute right-1.5 w-8 h-8 flex items-center justify-center rounded-lg bg-slate-900 text-slate-400 hover:text-white border border-slate-800 shadow-sm z-10 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Durasi Cetak per Model (jam)
                  </label>
                  <div className="relative flex items-center">
                    <Clock className="w-4 h-4 absolute left-3.5 text-slate-500" />
                    <input
                      type="number"
                      step="0.5"
                      min="0.1"
                      value={time}
                      onChange={(e) => setTime(Math.max(0.1, Number(e.target.value)))}
                      className="w-full bg-slate-950 border border-slate-800 text-right font-bold text-lg py-3 px-4 rounded-xl outline-none text-white font-mono focus:border-rose-500"
                    />
                  </div>
                </div>
              </div>

              {/* Quantity Order (SET) & Infill */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Jumlah Pesanan (Qty SET)
                  </label>
                  <div className="grid grid-cols-3 bg-slate-950 border border-slate-800 rounded-xl p-1">
                    <button
                      type="button"
                      onClick={() => handleAddQtyOrder(qtyOrder - 1)}
                      className="h-9 flex items-center justify-center rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={qtyOrder}
                      onChange={(e) => handleAddQtyOrder(Number(e.target.value))}
                      className="w-full bg-transparent text-center font-bold text-base outline-none text-white font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddQtyOrder(qtyOrder + 1)}
                      className="h-9 flex items-center justify-center rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Kepadatan Infill (%)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="15"
                      value={infill}
                      onChange={(e) => setInfill(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-center font-bold text-base text-white font-mono focus:outline-none focus:border-rose-500"
                    />
                    {!infill.includes("%") && (
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                        %
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Layer Height Selection Cards */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Pilih Ketebalan Layer (Layer Height)
                  </label>
                  <span className="text-[11px] font-mono text-rose-400 font-bold">
                    {currentTotalUnits} Unit Total ({currentUnitsPerSet} unit/set)
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
                        className={`p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                          isSelected
                            ? "bg-rose-500/15 border-rose-500 text-rose-300 ring-2 ring-rose-500/20 shadow-md"
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <span className={`text-xs font-bold ${isSelected ? "text-rose-400" : "text-white"}`}>
                            {val}mm
                          </span>
                          <span
                            className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                              isSelected ? "bg-rose-500 text-white" : "bg-slate-800 text-slate-400"
                            }`}
                          >
                            @ Rp {unitPrice.toLocaleString("id-ID")}
                          </span>
                        </div>
                        <div className="mt-1 flex flex-col">
                          <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">
                            Total
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

              {/* Live Cost Analysis Breakdown */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Analisis Biaya Produksi Internal (COGS)
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-950 rounded-2xl p-3.5 border border-slate-800 flex flex-col items-center">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">
                      Material
                    </span>
                    <span className="text-sm font-bold font-mono text-slate-200">
                      {formatIDR(materialCost)}
                    </span>
                  </div>
                  <div className="bg-slate-950 rounded-2xl p-3.5 border border-slate-800 flex flex-col items-center">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">
                      Energi Listrik
                    </span>
                    <span className="text-sm font-bold font-mono text-slate-200">
                      {formatIDR(energyCost)}
                    </span>
                  </div>
                  <div className="bg-slate-950 rounded-2xl p-3.5 border border-slate-800 flex flex-col items-center">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">
                      Wear Mesin
                    </span>
                    <span className="text-sm font-bold font-mono text-slate-200">
                      {formatIDR(wearCost)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Hero Selling Price Section */}
              <div className="bg-gradient-to-r from-rose-600 to-rose-700 rounded-3xl p-6 shadow-xl shadow-rose-600/20 relative overflow-hidden text-white border border-rose-400/20">
                <div className="absolute top-2 right-2 p-2 opacity-15 pointer-events-none">
                  <DollarSign className="w-24 h-24" />
                </div>
                <div className="relative z-10 space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/80">
                    Total Harga Jual ({qtyOrder}x SET)
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight">
                      {formatIDR(activeSellingPrice)}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/20 mt-2">
                    <span className="text-[10px] font-bold text-white/90 bg-white/15 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      Tarif Retail: Rp {retailRateGr}/g + Rp {retailRateHr}/h
                    </span>
                    <span className="text-[10px] font-bold text-white/90 bg-white/15 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      Order Unit: {currentTotalUnits}
                    </span>
                    <span className="text-[10px] font-bold text-white/90 bg-white/15 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      {layerHeight}mm @ Rp {currentLayerUnitPrice.toLocaleString("id-ID")}/unit
                    </span>
                  </div>
                </div>
              </div>

              {/* Selling Price Override */}
              <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex items-center justify-center h-6 w-6 rounded-full ${
                        isLocked
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-amber-500/20 text-amber-400"
                      }`}
                    >
                      {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                    </div>
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Override Harga Jual Manual
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsLocked(true);
                      setManualPrice(autoRetailPrice);
                    }}
                    className="flex items-center gap-1.5 text-[10px] font-bold text-rose-400 uppercase bg-rose-500/10 px-3 py-1.5 rounded-lg hover:bg-rose-500/20 transition-all active:scale-95"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Formula Retail</span>
                  </button>
                </div>

                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-base font-mono">
                    Rp
                  </span>
                  <input
                    type="number"
                    step="1000"
                    value={activeSellingPrice}
                    onChange={(e) => {
                      setManualPrice(Number(e.target.value));
                      if (isLocked) setIsLocked(false);
                    }}
                    className={`w-full bg-slate-900 border rounded-xl py-3.5 pl-12 pr-4 font-mono font-bold text-xl outline-none transition-all ${
                      isLocked
                        ? "border-slate-800 text-slate-400"
                        : "border-rose-500 ring-2 ring-rose-500/20 text-rose-400"
                    }`}
                  />
                  {!isLocked && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <span className="text-[10px] font-bold text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 rounded-full uppercase tracking-tight">
                        Manual Mode
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Add Model to Batch Button */}
              <button
                type="button"
                onClick={handleAddModelToBatch}
                className="w-full py-3.5 border-2 border-rose-500/50 border-dashed rounded-2xl text-rose-400 font-bold text-xs hover:bg-rose-500/10 hover:border-rose-400 transition-all flex items-center justify-center gap-2"
              >
                <FolderPlus className="w-4 h-4" />
                <span>+ Tambah Model ke Batch (Multi-Model Order)</span>
              </button>

              {/* Batch Items List */}
              {basket.length > 0 && (
                <section className="space-y-3 pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Daftar Model dalam Batch ({basket.length} Item)
                    </h3>
                    <span className="text-xs font-bold text-rose-400 font-mono">
                      Total: {formatIDR(basket.reduce((sum, item) => sum + item.price, 0))}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {basket.map((item) => (
                      <div
                        key={item.id}
                        className="bg-slate-950 border border-slate-800 rounded-2xl p-3 flex items-center justify-between shadow-sm hover:border-slate-700 transition"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                            {item.modelImageUrl ? (
                              <img src={item.modelImageUrl} className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-5 h-5 text-rose-400" />
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white truncate max-w-[150px] sm:max-w-xs">
                              {item.modelName}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              {item.qtyOrder} SET &bull; {item.qtyPart * item.qtyOrder} pcs &bull; {item.weight * item.qtyOrder}g &bull; {item.time * item.qtyOrder}h
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <span className="text-xs font-bold font-mono text-rose-400">
                            {formatIDR(item.price)}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleCopyBasketItemToForm(item)}
                            title="Salin parameter kembali ke form"
                            className={`p-1.5 rounded-lg transition ${
                              copiedBasketItemId === item.id
                                ? "bg-emerald-500/20 text-emerald-400"
                                : "bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white"
                            }`}
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRemoveFromBasket(item.id)}
                            title="Hapus dari batch"
                            className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Profit Analysis Collapsible Section */}
              <section className="border-t border-slate-800 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAnalysis(!showAnalysis)}
                  className={`w-full flex items-center justify-between p-4 bg-slate-950 rounded-2xl border transition-all ${
                    showAnalysis ? "border-rose-500/60 shadow-lg shadow-rose-500/5" : "border-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-8 w-8 rounded-xl flex items-center justify-center ${
                        showAnalysis ? "bg-rose-600 text-white" : "bg-slate-900 text-slate-400"
                      }`}
                    >
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">
                        Analisis Keuntungan &amp; Margin
                      </p>
                      <p className="text-xs font-bold text-emerald-400 font-mono">
                        Net Profit: +{formatIDR(netProfit)}
                      </p>
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${
                      showAnalysis ? "rotate-180 text-rose-400" : ""
                    }`}
                  />
                </button>

                {showAnalysis && (
                  <div className="mt-2 space-y-3 p-4 bg-slate-950/80 rounded-2xl border border-slate-800 animate-in fade-in slide-in-from-top-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                          Total Biaya Produksi
                        </p>
                        <p className="text-sm font-bold text-rose-400 font-mono">
                          {formatIDR(totalProductionCost)}
                        </p>
                      </div>
                      <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                          Margin Efisiensi
                        </p>
                        <div className="flex items-baseline gap-1">
                          <p className="text-sm font-bold text-emerald-400 font-mono">
                            {efficiencyMargin}%
                          </p>
                          <p className="text-[8px] italic text-slate-500">dari harga retail</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-800">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Komponen Biaya Material</span>
                        <span className="font-mono text-slate-200">{formatIDR(materialCost)}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Komponen Listrik &amp; Wear Mesin</span>
                        <span className="font-mono text-slate-200">{formatIDR(energyCost + wearCost)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </section>
            </div>

            {/* Footer Actions */}
            <footer className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setIsCalculatorOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white text-xs font-bold transition"
              >
                Batal
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleFinalSubmitOrder}
                className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Menyimpan...</span>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>
                      {editingOrder && basket.length === 0
                        ? "Simpan Perubahan Pesanan"
                        : basket.length > 0
                        ? `Tambahkan Antrean Batch (${basket.length} Model)`
                        : "Tambahkan ke Antrean Pesanan"}
                    </span>
                  </>
                )}
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* PRODUCT CATALOG SLIDE-OVER DRAWER (MATCHING 3DFLOW)                  */}
      {/* ==================================================================== */}
      {isCatalogOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-end bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="bg-slate-900 border-l border-slate-800 w-full max-w-md h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="p-5 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-950">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-rose-400" />
                  <span>Katalog Produk Siap Cetak</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Pilih model 3D untuk mengisi berat, durasi, part &amp; harga otomatis
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCatalogOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </header>

            {/* Category Filter Tabs */}
            <div className="p-3 border-b border-slate-800 flex overflow-x-auto gap-1.5 shrink-0 bg-slate-950/60 no-scrollbar">
              {catalogCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCatalogCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    activeCatalogCategory === cat
                      ? "bg-rose-600 text-white shadow-md shadow-rose-600/30"
                      : "bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Products List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {products
                .filter(
                  (p) =>
                    activeCatalogCategory === "Semua" ||
                    (p.category || "General") === activeCatalogCategory
                )
                .map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => handleSelectProduct(product)}
                    className="w-full bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-rose-500/50 rounded-2xl p-3.5 flex gap-3 text-left transition-all active:scale-[0.98] group"
                  >
                    <div className="h-16 w-16 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-6 h-6 text-slate-600 group-hover:text-rose-400 transition" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-xs text-white uppercase truncate group-hover:text-rose-300 transition">
                          {product.name}
                        </h4>
                        <div className="flex items-center gap-2.5 mt-1 text-[10px] font-mono text-slate-400">
                          <span>{product.modelWeight}g</span>
                          <span>&bull;</span>
                          <span>{product.printingTime}h</span>
                          <span>&bull;</span>
                          <span className="text-amber-400 font-bold">
                            {product.qtyPart || 1} pcs
                          </span>
                        </div>
                      </div>
                      <p className="text-rose-400 font-bold text-xs font-mono mt-1">
                        {formatIDR(product.finalPrice || product.manualPrice || 0)}
                      </p>
                    </div>
                    <div className="self-center text-slate-500 group-hover:text-rose-400 transition">
                      <Plus className="w-5 h-5" />
                    </div>
                  </button>
                ))}

              {products.length === 0 && (
                <div className="text-center py-16 text-slate-500 text-xs">
                  Belum ada produk di Katalog Produk 3DFlow.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button (FAB) - Matching 3DFlow */}
      <button
        type="button"
        onClick={openFreshCalculator}
        className="fixed bottom-6 right-6 w-14 h-14 bg-rose-600 hover:bg-rose-500 text-white rounded-full flex items-center justify-center shadow-2xl shadow-rose-600/50 active:scale-90 hover:scale-105 transition-all z-40 group"
        title="Tambah Pesanan Baru (3DFlow)"
      >
        <Plus className="w-7 h-7 stroke-[2.5] group-hover:rotate-90 transition-transform duration-200" />
      </button>
    </div>
  );
}
