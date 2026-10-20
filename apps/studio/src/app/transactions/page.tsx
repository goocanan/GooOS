"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { GooNavbar } from "@/components/GooNavbar";
import {
  Plus,
  Trash2,
  Edit2,
  Search,
  Package,
  User,
  Calendar,
  Layers,
  Printer,
  ShoppingBag,
  Store,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Wrench,
  Cpu,
  Box,
  MoreHorizontal,
  X,
  Check,
  AlertCircle,
  Clock,
  Sparkles,
} from "lucide-react";

interface Transaction {
  id: string;
  description: string;
  category: string;
  type: string; // income | expense
  amount: number;
  quantity: number;
  date: string;
  orderId?: string | null;
  inventoryId?: string | null;
  printerId?: string | null;
  partCategory?: string | null;
  batchId?: string | null;
  productLink?: string | null;
  colorHex?: string | null;
  materialType?: string | null;
  size?: string | null;
}

interface Summary {
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
}

export default function TransactionsLedgerPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [printersList, setPrintersList] = useState<Array<{ id: string; name: string; model: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters state (mirroring 3DFlow)
  const [timeRange, setTimeRange] = useState<string>("month"); // 'day' | 'week' | 'month' | 'quarter' | 'year' | 'all'
  const [selectedTab, setSelectedTab] = useState<string>("current");
  const [typeFilter, setTypeFilter] = useState<string>("all"); // 'all' | 'income' | 'expense'
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [search, setSearch] = useState<string>("");

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // Form Data state for Add / Edit
  const [formData, setFormData] = useState({
    transactionType: "expense", // 'expense' | 'income' | 'restock'
    category: "filament",
    description: "",
    amount: "",
    quantity: "1",
    date: new Date().toISOString().split("T")[0],
    brand: "",
    model: "",
    materialType: "PLA",
    color: "",
    colorHex: "#3b82f6",
    initialWeight: "1000",
    size: "",
    productLink: "",
    printerId: "",
    partCategory: "bed_sheet",
    condition: "new",
  });

  // Fetch all transactions
  const loadTransactions = async () => {
    try {
      setLoading(true);
      const [res, printersRes] = await Promise.all([
        fetch("/api/flow/transactions"),
        fetch("/api/flow/printers"),
      ]);
      const json = await res.json();
      const pJson = await printersRes.json();
      if (json.success) {
        setTransactions(json.data);
      } else {
        setError(json.error || "Gagal memuat catatan transaksi");
      }
      if (pJson.success && pJson.data) {
        setPrintersList(pJson.data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  // Show temporary success banner
  const triggerSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3500);
  };

  // Generate dynamic period tabs (identical to 3DFlow)
  const tabs = useMemo(() => {
    if (timeRange === "all") return [];
    const generated: { id: string; label: string; date: Date }[] = [
      { id: "current", label: "Periode Ini", date: new Date() },
    ];
    const now = new Date();

    for (let i = 1; i <= 24; i++) {
      const d = new Date(now);
      let label = "";
      let id = "";

      if (timeRange === "month") {
        d.setMonth(now.getMonth() - i);
        label = d.toLocaleDateString("id-ID", { month: "short", year: "2-digit" });
        id = `${d.getFullYear()}-${d.getMonth()}`;
      } else if (timeRange === "year") {
        d.setFullYear(now.getFullYear() - i);
        label = d.getFullYear().toString();
        id = d.getFullYear().toString();
      } else if (timeRange === "day") {
        d.setDate(now.getDate() - i);
        label = d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
        id = d.toDateString();
      } else if (timeRange === "week") {
        d.setDate(now.getDate() - i * 7);
        label = `Minggu -${i}`;
        id = `week-${i}`;
      } else if (timeRange === "quarter") {
        d.setMonth(now.getMonth() - i * 3);
        const q = Math.floor(d.getMonth() / 3) + 1;
        label = `Q${q} ${d.getFullYear().toString().slice(-2)}`;
        id = `q${q}-${d.getFullYear()}`;
      }

      if (label) {
        generated.push({ id, label, date: new Date(d) });
      }
    }
    return generated;
  }, [timeRange]);

  // Reset selectedTab when timeRange changes
  useEffect(() => {
    setSelectedTab("current");
  }, [timeRange]);

  // Auto-generate description for specialized categories in form
  useEffect(() => {
    if (editingTx) return;

    const isFilament =
      formData.category === "filament" || formData.transactionType === "restock";
    const isPrinter = formData.category === "printer";
    const isPackaging = formData.category === "packaging";

    if (isFilament) {
      const parts: string[] = [];
      if (formData.transactionType === "restock") parts.push("Restock:");
      if (formData.brand) parts.push(formData.brand);
      if (formData.materialType) parts.push(formData.materialType);
      if (formData.color) parts.push(formData.color);

      if (parts.length > 0) {
        setFormData((prev) => ({ ...prev, description: parts.join(" ") }));
      }
    } else if (isPrinter) {
      const parts: string[] = [];
      if (formData.brand) parts.push(formData.brand);
      if (formData.model) parts.push(formData.model);

      if (parts.length > 0) {
        let finalDesc = parts.join(" ");
        if (parseInt(formData.quantity) > 1) {
          finalDesc += ` (x${formData.quantity})`;
        }
        setFormData((prev) => ({ ...prev, description: finalDesc }));
      }
    } else if (isPackaging) {
      const parts: string[] = [];
      if (formData.size) parts.push(formData.size);
      if (parts.length > 0) {
        setFormData((prev) => ({ ...prev, description: `Packaging: ${parts.join(" ")}` }));
      }
    }
  }, [
    formData.brand,
    formData.model,
    formData.materialType,
    formData.color,
    formData.category,
    formData.transactionType,
    formData.size,
    formData.quantity,
    editingTx,
  ]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    return transactions.filter((tx) => {
      // Type filter
      if (typeFilter !== "all" && tx.type !== typeFilter) return false;

      // Category filter
      if (categoryFilter !== "all" && tx.category !== categoryFilter) return false;

      // Search
      if (search.trim()) {
        const s = search.toLowerCase();
        const descMatch = tx.description?.toLowerCase().includes(s);
        const catMatch = tx.category?.toLowerCase().includes(s);
        if (!descMatch && !catMatch) return false;
      }

      // Time filter
      if (timeRange === "all") return true;

      const txDate = new Date(tx.date);
      const refDate =
        selectedTab === "current"
          ? now
          : tabs.find((t) => t.id === selectedTab)?.date || now;

      if (timeRange === "day") {
        return txDate.toDateString() === refDate.toDateString();
      }
      if (timeRange === "week") {
        const weekEnd = new Date(refDate);
        const weekStart = new Date(refDate);
        weekStart.setDate(refDate.getDate() - 7);
        return txDate >= weekStart && txDate <= weekEnd;
      }
      if (timeRange === "month") {
        return (
          txDate.getMonth() === refDate.getMonth() &&
          txDate.getFullYear() === refDate.getFullYear()
        );
      }
      if (timeRange === "quarter") {
        const qRef = Math.floor(refDate.getMonth() / 3);
        const qTx = Math.floor(txDate.getMonth() / 3);
        return qRef === qTx && txDate.getFullYear() === refDate.getFullYear();
      }
      if (timeRange === "year") {
        return txDate.getFullYear() === refDate.getFullYear();
      }

      return true;
    });
  }, [transactions, typeFilter, categoryFilter, search, timeRange, selectedTab, tabs]);

  // All-time balance (from all 473 transactions)
  const allTimeBalance = useMemo(() => {
    return transactions.reduce((acc, tx) => {
      return tx.type === "income" ? acc + tx.amount : acc - tx.amount;
    }, 0);
  }, [transactions]);

  // Reactive summary for the currently selected period
  const periodSummary = useMemo(() => {
    return filteredTransactions.reduce(
      (acc, tx) => {
        if (tx.type === "income") {
          acc.inflow += tx.amount;
        } else {
          acc.outflow += tx.amount;
        }
        return acc;
      },
      { inflow: 0, outflow: 0 }
    );
  }, [filteredTransactions]);

  const periodProfit = periodSummary.inflow - periodSummary.outflow;

  // Grouped transactions
  const groupedTransactions = useMemo(() => {
    const grouped: Record<
      string,
      { label: string; items: Transaction[]; sum: number }
    > = {};

    const sorted = [...filteredTransactions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    sorted.forEach((tx) => {
      const date = new Date(tx.date);
      let groupKey = "";
      let groupLabel = "";

      if (timeRange === "all" || timeRange === "year" || timeRange === "quarter") {
        // Group by Month
        groupKey = `${date.getFullYear()}-${date.getMonth()}`;
        groupLabel = date.toLocaleDateString("id-ID", {
          month: "long",
          year: "numeric",
        });
      } else {
        // Group by Day
        groupKey = date.toDateString();
        groupLabel = date.toLocaleDateString("id-ID", {
          weekday: "long",
          day: "numeric",
          month: "short",
          year: "numeric",
        });
      }

      if (!grouped[groupKey]) {
        grouped[groupKey] = { label: groupLabel, items: [], sum: 0 };
      }
      grouped[groupKey]!.items.push(tx);
      grouped[groupKey]!.sum += tx.type === "income" ? tx.amount : -tx.amount;
    });

    return grouped;
  }, [filteredTransactions, timeRange]);

  // Category Icon & Label mapping
  const getCategoryInfo = (category: string) => {
    switch (category) {
      case "tokopedia":
        return {
          label: "Tokopedia",
          icon: <Store className="w-4 h-4 text-emerald-400" />,
          colorClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        };
      case "shopee":
        return {
          label: "Shopee",
          icon: <ShoppingBag className="w-4 h-4 text-orange-400" />,
          colorClass: "bg-orange-500/10 text-orange-400 border-orange-500/20",
        };
      case "direct":
        return {
          label: "Direct Sale",
          icon: <User className="w-4 h-4 text-sky-400" />,
          colorClass: "bg-sky-500/10 text-sky-400 border-sky-500/20",
        };
      case "filament":
        return {
          label: "Filament",
          icon: <Layers className="w-4 h-4 text-amber-400" />,
          colorClass: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        };
      case "printer":
        return {
          label: "Printer 3D",
          icon: <Printer className="w-4 h-4 text-purple-400" />,
          colorClass: "bg-purple-500/10 text-purple-400 border-purple-500/20",
        };
      case "tools":
        return {
          label: "Alat & Tools",
          icon: <Wrench className="w-4 h-4 text-cyan-400" />,
          colorClass: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
        };
      case "production_stuff":
        return {
          label: "Produksi",
          icon: <Box className="w-4 h-4 text-blue-400" />,
          colorClass: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        };
      case "packaging":
        return {
          label: "Packaging",
          icon: <Package className="w-4 h-4 text-yellow-400" />,
          colorClass: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
        };
      case "parts":
        return {
          label: "Spare Parts",
          icon: <Cpu className="w-4 h-4 text-indigo-400" />,
          colorClass: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
        };
      default:
        return {
          label: category || "Lainnya",
          icon: <Wallet className="w-4 h-4 text-slate-400" />,
          colorClass: "bg-slate-800 text-slate-300 border-slate-700",
        };
    }
  };

  // Submit Add / Edit Form
  const handleSubmitTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description.trim()) {
      alert("Deskripsi transaksi wajib diisi!");
      return;
    }
    const numAmount = parseFloat(formData.amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert("Masukkan nominal transaksi yang valid!");
      return;
    }

    if (formData.category === "parts" && !formData.printerId) {
      alert("Wajib memilih mesin printer untuk transaksi suku cadang (sparepart)!");
      return;
    }

    try {
      setIsSubmitting(true);
      const isRestock = formData.transactionType === "restock";
      const payload = {
        description: formData.description,
        type:
          isRestock
            ? "expense"
            : formData.transactionType === "income"
            ? "income"
            : "expense",
        category: formData.category,
        amount: numAmount,
        quantity: parseInt(formData.quantity) || 1,
        date: formData.date ? new Date(formData.date).toISOString() : new Date().toISOString(),
        materialType: isRestock || formData.category === "filament" ? formData.materialType : undefined,
        colorHex: isRestock || formData.category === "filament" ? formData.colorHex : undefined,
        productLink: formData.productLink || undefined,
        size: formData.size || undefined,
        printerId:
          formData.category === "parts" || formData.category === "printer"
            ? formData.printerId
            : undefined,
        partCategory: formData.category === "parts" ? formData.partCategory : undefined,
        condition: formData.category === "parts" ? formData.condition : undefined,
      };

      if (editingTx) {
        const res = await fetch(`/api/flow/transactions/${editingTx.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error || "Gagal memperbarui transaksi");
        triggerSuccess("Transaksi berhasil diperbarui!");
      } else {
        const res = await fetch("/api/flow/transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error || "Gagal menambahkan transaksi");
        triggerSuccess("Transaksi baru berhasil dicatat!");
      }

      setShowAddModal(false);
      setEditingTx(null);
      setSelectedTx(null);
      loadTransactions();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete transaction
  const handleDeleteTransaction = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus catatan transaksi ini?")) return;

    try {
      setIsDeleting(true);
      const res = await fetch(`/api/flow/transactions/${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Gagal menghapus transaksi");
      triggerSuccess("Transaksi berhasil dihapus.");
      setSelectedTx(null);
      loadTransactions();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  // Open Edit Form
  const openEditModal = (tx: Transaction) => {
    setEditingTx(tx);
    setFormData({
      transactionType: tx.type === "income" ? "income" : "expense",
      category: tx.category || "other",
      description: tx.description,
      amount: String(tx.amount),
      quantity: String(tx.quantity || 1),
      date: tx.date ? new Date(tx.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      brand: "",
      model: "",
      materialType: tx.materialType || "PLA",
      color: "",
      colorHex: tx.colorHex || "#3b82f6",
      initialWeight: "1000",
      size: tx.size || "",
      productLink: tx.productLink || "",
      printerId: tx.printerId || "",
      partCategory: tx.partCategory || "bed_sheet",
      condition: "new",
    });
    setSelectedTx(null);
    setShowAddModal(true);
  };

  const openCreateModal = () => {
    setEditingTx(null);
    setFormData({
      transactionType: "expense",
      category: "filament",
      description: "",
      amount: "",
      quantity: "1",
      date: new Date().toISOString().split("T")[0],
      brand: "eSUN",
      model: "",
      materialType: "PLA+",
      color: "Black",
      colorHex: "#1e293b",
      initialWeight: "1000",
      size: "",
      productLink: "",
      printerId: printersList[0]?.id || "",
      partCategory: "bed_sheet",
      condition: "new",
    });
    setShowAddModal(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <GooNavbar />

      {/* Toast Notification */}
      {successMsg && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[300] bg-emerald-500 text-white font-bold py-3 px-6 rounded-2xl shadow-2xl flex items-center gap-2 animate-in slide-in-from-top-4 duration-300">
          <Check className="w-5 h-5" />
          <span>{successMsg}</span>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse"></span>
                3DFlow Ledger
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {transactions.length} Transaksi Riil
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1.5">
              Buku Kas &amp; Riwayat Transaksi Finansial
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Catatan pembukuan pemasukan pesanan (Shopee, Tokopedia, Cetak Langsung) &amp; pengeluaran operasional farm (Filament, Printer, Tools).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Transaksi</span>
            </button>
          </div>
        </div>

        {/* KPI Financial Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: All-Time Total Cash Balance */}
          <div className="bg-slate-900/70 p-5 rounded-2xl border border-slate-800 shadow-md relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Saldo Kas All-Time
                </span>
                <Wallet className="w-4 h-4 text-slate-400" />
              </div>
              <p
                className={`text-2xl font-black font-mono mt-2 ${
                  allTimeBalance >= 0 ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {allTimeBalance >= 0 ? "+" : ""} Rp {Math.round(allTimeBalance).toLocaleString()}
              </p>
            </div>
            <p className="text-[10px] text-slate-500 mt-2">
              Akumulasi dari seluruh {transactions.length} transaksi kas
            </p>
          </div>

          {/* Card 2: Period Inflow */}
          <div className="bg-slate-900/70 p-5 rounded-2xl border border-slate-800 shadow-md relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Total Pemasukan (Inflow)
                </span>
                <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-black text-emerald-400 font-mono mt-2">
                + Rp {Math.round(periodSummary.inflow).toLocaleString()}
              </p>
            </div>
            <p className="text-[10px] text-slate-500 mt-2">
              {timeRange === "all" ? "Seluruh Waktu" : `Sesuai rentang: ${timeRange}`}
            </p>
          </div>

          {/* Card 3: Period Outflow */}
          <div className="bg-slate-900/70 p-5 rounded-2xl border border-slate-800 shadow-md relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Total Pengeluaran (Outflow)
                </span>
                <ArrowUpRight className="w-4 h-4 text-rose-400" />
              </div>
              <p className="text-2xl font-black text-rose-400 font-mono mt-2">
                - Rp {Math.round(periodSummary.outflow).toLocaleString()}
              </p>
            </div>
            <p className="text-[10px] text-slate-500 mt-2">
              Bahan, printer, alat &amp; operasional
            </p>
          </div>

          {/* Card 4: Net Operational Profit */}
          <div className="bg-slate-900/70 p-5 rounded-2xl border border-slate-800 shadow-md relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Laba Bersih Periode
                </span>
                <Sparkles className="w-4 h-4 text-amber-400" />
              </div>
              <p
                className={`text-2xl font-black font-mono mt-2 ${
                  periodProfit >= 0 ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {periodProfit >= 0 ? "+" : ""} Rp {Math.round(periodProfit).toLocaleString()}
              </p>
            </div>
            <p className="text-[10px] text-slate-500 mt-2">
              Inflow dikurangi Outflow periode terpilih
            </p>
          </div>
        </div>

        {/* Time Range Filter Bar & Dynamic Tabs */}
        <div className="space-y-3 bg-slate-900/50 p-4 rounded-2xl border border-slate-800 shadow-md">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-rose-400" /> Rentang Waktu:
              </span>
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                {[
                  { id: "month", label: "Bulanan" },
                  { id: "all", label: "Semua Waktu" },
                  { id: "day", label: "Harian" },
                  { id: "week", label: "Mingguan" },
                  { id: "quarter", label: "Kuartal" },
                  { id: "year", label: "Tahunan" },
                ].map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setTimeRange(r.id)}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                      timeRange === r.id
                        ? "bg-rose-600 text-white shadow-sm"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Total items badge */}
            <div className="text-xs font-mono text-slate-400">
              Menampilkan{" "}
              <span className="font-bold text-white">
                {filteredTransactions.length}
              </span>{" "}
              transaksi
            </div>
          </div>

          {/* Dynamic Tabs (Identical to 3DFlow) */}
          {tabs.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none border-t border-slate-800/60">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all border ${
                    selectedTab === tab.id
                      ? "bg-rose-600/30 border-rose-500 text-white shadow-sm"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Search & Category Filter Controls */}
        <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-md">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Cari transaksi berdasarkan deskripsi atau kategori..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
            />
          </div>

          {/* Tipe & Kategori Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Tipe Filter Buttons */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
              {[
                { id: "all", label: "Semua Tipe" },
                { id: "income", label: "Pemasukan" },
                { id: "expense", label: "Pengeluaran" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTypeFilter(t.id)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                    typeFilter === t.id
                      ? "bg-slate-800 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Category Dropdown */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-800 bg-slate-950 text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/30"
            >
              <option value="all">Semua Kategori</option>
              <optgroup label="Pemasukan">
                <option value="tokopedia">Tokopedia</option>
                <option value="shopee">Shopee</option>
                <option value="direct">Direct Sale</option>
              </optgroup>
              <optgroup label="Pengeluaran">
                <option value="filament">Filament &amp; Bahan</option>
                <option value="printer">Printer &amp; Mesin</option>
                <option value="production_stuff">Perlengkapan Produksi</option>
                <option value="tools">Alat &amp; Perkakas</option>
                <option value="parts">Suku Cadang (Parts)</option>
                <option value="packaging">Kemasan (Packaging)</option>
                <option value="other">Lain-lain</option>
              </optgroup>
            </select>
          </div>
        </div>

        {/* Transactions Grouped List */}
        {loading ? (
          <div className="text-center py-24 bg-slate-900/40 rounded-3xl border border-slate-800 text-slate-400 text-sm animate-pulse flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
            <span>Memuat buku kas dan transaksi keuangan...</span>
          </div>
        ) : error ? (
          <div className="p-6 bg-rose-950/40 text-rose-300 rounded-3xl border border-rose-800 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="py-20 text-center text-slate-500 border border-dashed border-slate-800 rounded-3xl bg-slate-900/30 font-sans">
            <Wallet className="w-12 h-12 mx-auto mb-3 opacity-30 text-slate-400" />
            <p className="text-base font-bold text-slate-300">Tidak ada transaksi yang cocok</p>
            <p className="text-xs text-slate-500 mt-1">
              Coba sesuaikan filter pencarian, rentang waktu, atau tab periode.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.keys(groupedTransactions).map((key) => {
              const group = groupedTransactions[key];
              if (!group) return null;
              return (
                <div
                  key={key}
                  className="bg-slate-900/60 rounded-3xl border border-slate-800 overflow-hidden shadow-xl"
                >
                  {/* Group Header */}
                  <div className="px-5 py-3 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <h2 className="text-xs font-black uppercase tracking-wider text-slate-300">
                        {group.label}
                      </h2>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                        {group.items.length} item
                      </span>
                    </div>

                    <span
                      className={`text-xs font-black font-mono px-2.5 py-1 rounded-full ${
                        group.sum >= 0
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      }`}
                    >
                      {group.sum >= 0 ? "+" : ""} Rp {Math.round(group.sum).toLocaleString()}
                    </span>
                  </div>

                  {/* Group Items List */}
                  <div className="divide-y divide-slate-800/50">
                    {group.items.map((tx) => {
                      const isIncome = tx.type === "income";
                      const catInfo = getCategoryInfo(tx.category);

                      return (
                        <div
                          key={tx.id}
                          onClick={() => setSelectedTx(tx)}
                          className="p-4 hover:bg-slate-800/40 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            {/* Category Icon Badge */}
                            <div className="w-10 h-10 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0 shadow-inner group-hover:border-slate-700 transition-colors">
                              {catInfo.icon}
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-sm text-white truncate max-w-md group-hover:text-rose-300 transition-colors">
                                  {tx.description}
                                </h4>
                                {tx.colorHex && (
                                  <span
                                    className="w-3 h-3 rounded-full border border-white/20 shrink-0 inline-block shadow-sm"
                                    style={{ backgroundColor: tx.colorHex }}
                                    title={`Warna: ${tx.colorHex}`}
                                  />
                                )}
                              </div>

                              <div className="flex flex-wrap items-center gap-2 mt-1">
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${catInfo.colorClass}`}
                                >
                                  {catInfo.label}
                                </span>

                                {tx.quantity && tx.quantity > 1 && (
                                  <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                                    x{tx.quantity}
                                  </span>
                                )}

                                <span className="text-[10px] text-slate-400 font-mono">
                                  {new Date(tx.date).toLocaleTimeString("id-ID", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                            <span
                              className={`font-mono text-sm font-black ${
                                isIncome ? "text-emerald-400" : "text-rose-400"
                              }`}
                            >
                              {isIncome ? "+" : "-"} Rp {Math.round(tx.amount).toLocaleString()}
                            </span>

                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditModal(tx);
                                }}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                                title="Edit Transaksi"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteTransaction(tx.id);
                                }}
                                className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 hover:text-rose-200 border border-rose-800/40"
                                title="Hapus Transaksi"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
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
        )}
      </main>

      {/* Transaction Detail Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center">
                  {getCategoryInfo(selectedTx.category).icon}
                </div>
                <div>
                  <h3 className="font-black text-lg text-white">Detail Transaksi</h3>
                  <p className="text-[10px] text-slate-400 font-mono">
                    ID: {selectedTx.id.slice(0, 18)}...
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTx(null)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Deskripsi:</span>
                  <span className="font-bold text-white text-right">{selectedTx.description}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Tipe Transaksi:</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded-full ${
                      selectedTx.type === "income"
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-rose-500/20 text-rose-400"
                    }`}
                  >
                    {selectedTx.type === "income" ? "Pemasukan (Inflow)" : "Pengeluaran (Outflow)"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Kategori:</span>
                  <span className="font-bold text-white capitalize">{selectedTx.category}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Nominal:</span>
                  <span
                    className={`font-black font-mono text-base ${
                      selectedTx.type === "income" ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    Rp {Math.round(selectedTx.amount).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Jumlah (Qty):</span>
                  <span className="font-mono text-white">{selectedTx.quantity || 1}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Tanggal Transaksi:</span>
                  <span className="font-mono text-white">
                    {new Date(selectedTx.date).toLocaleString("id-ID")}
                  </span>
                </div>
                {selectedTx.materialType && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Material Filament:</span>
                    <span className="font-bold text-amber-400">{selectedTx.materialType}</span>
                  </div>
                )}
                {selectedTx.printerId && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Printer Terkait:</span>
                    <span className="font-bold text-rose-400">
                      {printersList.find((p) => p.id === selectedTx.printerId)?.name || "Printer 3D"}
                    </span>
                  </div>
                )}
                {selectedTx.partCategory && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Kelompok Suku Cadang:</span>
                    <span className="font-mono text-slate-200 capitalize">
                      {selectedTx.partCategory.replace("_", " ")}
                    </span>
                  </div>
                )}
                {selectedTx.colorHex && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Warna Hex:</span>
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-white/20 inline-block shadow-sm"
                        style={{ backgroundColor: selectedTx.colorHex }}
                      />
                      <span className="font-mono text-slate-300">{selectedTx.colorHex}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => handleDeleteTransaction(selectedTx.id)}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 text-xs font-bold transition-all flex items-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? "Menghapus..." : "Hapus Transaksi"}</span>
              </button>
              <button
                onClick={() => openEditModal(selectedTx)}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition-all flex items-center gap-2"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Transaksi</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Transaction Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-5 animate-in zoom-in-95 duration-200 text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-600/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-white">
                    {editingTx ? "Edit Catatan Transaksi" : "Tambah Transaksi Baru"}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Form pencatatan kas terintegrasi format 3DFlow
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitTransaction} className="space-y-4">
              {/* Type Switcher */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Tipe Transaksi
                </label>
                <div className="grid grid-cols-3 gap-2 bg-slate-950 p-1 rounded-2xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        transactionType: "expense",
                        category: "filament",
                      }));
                    }}
                    className={`py-2 text-xs font-bold rounded-xl transition-all ${
                      formData.transactionType === "expense"
                        ? "bg-rose-600 text-white shadow-md"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Pengeluaran
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        transactionType: "income",
                        category: "tokopedia",
                      }));
                    }}
                    className={`py-2 text-xs font-bold rounded-xl transition-all ${
                      formData.transactionType === "income"
                        ? "bg-emerald-600 text-white shadow-md"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Pemasukan
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        transactionType: "restock",
                        category: "filament",
                      }));
                    }}
                    className={`py-2 text-xs font-bold rounded-xl transition-all ${
                      formData.transactionType === "restock"
                        ? "bg-amber-600 text-white shadow-md"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Restock Filament
                  </button>
                </div>
              </div>

              {/* Category Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Kategori
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, category: e.target.value }))
                  }
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  {formData.transactionType === "income" ? (
                    <>
                      <option value="tokopedia">Tokopedia</option>
                      <option value="shopee">Shopee</option>
                      <option value="direct">Direct Sale (Penjualan Langsung)</option>
                      <option value="other">Pemasukan Lainnya</option>
                    </>
                  ) : (
                    <>
                      <option value="filament">Filament &amp; Bahan Cetak</option>
                      <option value="printer">Printer 3D &amp; Equipment</option>
                      <option value="production_stuff">Perlengkapan Produksi</option>
                      <option value="tools">Alat &amp; Perkakas</option>
                      <option value="parts">Suku Cadang (Parts / Nozzle)</option>
                      <option value="packaging">Kemasan (Packaging / Box)</option>
                      <option value="other">Pengeluaran Lainnya</option>
                    </>
                  )}
                </select>
              </div>

              {/* Specialized Filament Fields */}
              {(formData.category === "filament" || formData.transactionType === "restock") && (
                <div className="bg-slate-950/80 p-4 rounded-2xl border border-amber-500/30 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                    <Layers className="w-3.5 h-3.5" />
                    <span>Spesifikasi Filament</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold mb-1">
                        Brand / Merk
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: eSUN, Sunlu, Bambu Lab"
                        value={formData.brand}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, brand: e.target.value }))
                        }
                        className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold mb-1">
                        Material
                      </label>
                      <select
                        value={formData.materialType}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, materialType: e.target.value }))
                        }
                        className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-amber-500"
                      >
                        <option value="PLA">PLA</option>
                        <option value="PLA+">PLA+</option>
                        <option value="PETG">PETG</option>
                        <option value="ABS">ABS</option>
                        <option value="TPU">TPU</option>
                        <option value="ASA">ASA</option>
                        <option value="PC">PC</option>
                        <option value="Wood">Wood</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold mb-1">
                        Nama Warna
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Black, White, Red"
                        value={formData.color}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, color: e.target.value }))
                        }
                        className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold mb-1">
                        Color Hex
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={formData.colorHex}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, colorHex: e.target.value }))
                          }
                          className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                        />
                        <input
                          type="text"
                          value={formData.colorHex}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, colorHex: e.target.value }))
                          }
                          className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 font-mono text-white focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Specialized Printer Fields */}
              {formData.category === "printer" && (
                <div className="bg-slate-950/80 p-4 rounded-2xl border border-purple-500/30 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-purple-400">
                    <Printer className="w-3.5 h-3.5" />
                    <span>Spesifikasi Printer 3D</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold mb-1">
                        Brand / Pabrikan
                      </label>
                      <input
                        type="text"
                        placeholder="Bambulab / Creality"
                        value={formData.brand}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, brand: e.target.value }))
                        }
                        className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold mb-1">
                        Model Printer
                      </label>
                      <input
                        type="text"
                        placeholder="A1 mini / HI COMBO"
                        value={formData.model}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, model: e.target.value }))
                        }
                        className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Specialized Parts / Sparepart Fields */}
              {formData.category === "parts" && (
                <div className="bg-slate-950/80 p-4 rounded-2xl border border-rose-500/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400">
                      <Wrench className="w-3.5 h-3.5" />
                      <span>Spesifikasi Suku Cadang (Wajib Pilih Mesin)</span>
                    </div>
                    <span className="text-[10px] font-mono text-rose-300 bg-rose-500/20 px-2 py-0.5 rounded border border-rose-500/30">
                      Sinkron ke Fleet
                    </span>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-300 font-bold mb-1">
                      Bagian Printer Mana? <span className="text-rose-400">*</span>
                    </label>
                    <select
                      value={formData.printerId}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, printerId: e.target.value }))
                      }
                      required
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                    >
                      <option value="">-- Pilih Mesin Printer Terkait --</option>
                      {printersList.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.model})
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Sparepart ini akan langsung masuk ke inventaris armada printer yang dipilih.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-slate-300 font-bold mb-1">
                        Kelompok Sparepart <span className="text-rose-400">*</span>
                      </label>
                      <select
                        value={formData.partCategory}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, partCategory: e.target.value }))
                        }
                        className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-rose-500"
                      >
                        <option value="bed_sheet">Bed Sheet / Build Plate</option>
                        <option value="nozzle">Nozzle / Hotend Tip</option>
                        <option value="hotend_extruder">Hotend, Extruder, Heatbreak &amp; Sock</option>
                        <option value="belts_motion">Belt, Pulley &amp; Linear Rods</option>
                        <option value="electronics">Elektronik, Fans &amp; Stepper</option>
                        <option value="lubricant_consumable">Pelumas &amp; Consumables Mesin</option>
                        <option value="other">Aksesoris &amp; Suku Cadang Lain</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-300 font-bold mb-1">
                        Status Penggunaan
                      </label>
                      <select
                        value={formData.condition}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, condition: e.target.value }))
                        }
                        className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-rose-500"
                      >
                        <option value="new">Baru (Stok Cadangan)</option>
                        <option value="in_use">Langsung Terpasang</option>
                        <option value="backup">Backup Darurat</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Deskripsi Transaksi
                </label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Penjualan pesanan Shopee #1234 atau eSUN PLA+ Black"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              {/* Amount & Quantity & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Nominal (Rp)
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="Contoh: 150000"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, amount: e.target.value }))
                    }
                    className="w-full px-3.5 py-2.5 text-xs font-mono rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Jumlah (Qty)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, quantity: e.target.value }))
                    }
                    className="w-full px-3.5 py-2.5 text-xs font-mono rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Tanggal
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, date: e.target.value }))
                    }
                    className="w-full px-3.5 py-2.5 text-xs font-mono rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white text-xs font-bold transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 active:scale-95 transition-all flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <span>Menyimpan...</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{editingTx ? "Simpan Perubahan" : "Simpan Transaksi"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
