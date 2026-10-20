"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { GooNavbar } from "@/components/GooNavbar";
import {
  Printer,
  Wrench,
  Calendar,
  Clock,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Layers,
  Disc,
  Flame,
  Check,
  X,
  ShieldCheck,
  Sparkles,
  Boxes,
  HelpCircle,
  Gauge,
} from "lucide-react";

interface MaintenanceItem {
  id: string;
  title: string;
  frequency: string;
  lastCompleted?: string | null;
  done: boolean;
}

interface PartItem {
  id: string;
  name: string;
  category: string;
  partCategory?: string | null;
  printerId?: string | null;
  condition?: string | null;
  quantity: number;
  price: number;
  purchaseDate?: string | null;
  notes?: string | null;
  productLink?: string | null;
}

interface ToolItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  price: number;
  purchaseDate?: string | null;
  notes?: string | null;
  productLink?: string | null;
  size?: string | null;
}

interface PrinterAsset {
  id: string;
  name: string;
  model: string;
  status: string;
  purchasePrice: number;
  purchaseDate: string | null;
  serialNumber: string | null;
  buildVolume: string | null;
  nozzleInstalled: string | null;
  bedPlateInstalled: string | null;
  maintenanceIntervalDays: number;
  lastMaintenanceDate: string | null;
  nextMaintenanceDate: string | null;
  maintenanceChecklist: MaintenanceItem[];
  notes: string | null;
  parts: PartItem[];
  totalPartsCount: number;
  totalPartsValue: number;
  maintenanceStatus: "ok" | "due_soon" | "overdue";
}

// Calculate age formatted: "2 Thn 3 Bln" or "10 Bln"
function formatAge(dateStr?: string | Date | null): string {
  if (!dateStr) return "-";
  const start = new Date(dateStr);
  const now = new Date();
  if (isNaN(start.getTime())) return "-";

  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();
  let days = now.getDate() - start.getDate();

  if (days < 0) {
    months -= 1;
    const prevMonthDays = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
    days += prevMonthDays;
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const parts = [];
  if (years > 0) parts.push(`${years} Tahun`);
  if (months > 0) parts.push(`${months} Bulan`);
  if (years === 0 && months === 0) parts.push(`${Math.max(1, days)} Hari`);
  return parts.join(" ") || "Baru";
}

// Friendly Part Category Label & Icon
function getPartCategoryMeta(cat?: string | null) {
  switch (cat) {
    case "bed_sheet":
      return { label: "Bed Sheet / Build Plate", icon: Disc, color: "text-amber-400 bg-amber-500/10 border-amber-500/20" };
    case "nozzle":
      return { label: "Nozzle & Tip", icon: Flame, color: "text-rose-400 bg-rose-500/10 border-rose-500/20" };
    case "hotend_extruder":
      return { label: "Hotend & Extruder", icon: Layers, color: "text-purple-400 bg-purple-500/10 border-purple-500/20" };
    case "belts_motion":
      return { label: "Belt & Motion", icon: Gauge, color: "text-blue-400 bg-blue-500/10 border-blue-500/20" };
    case "electronics":
      return { label: "Elektronik & Fans", icon: Wrench, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" };
    case "lubricant_consumable":
      return { label: "Pelumas / Maintenance", icon: Sparkles, color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" };
    default:
      return { label: "Suku Cadang Lainnya", icon: Boxes, color: "text-slate-400 bg-slate-800 border-slate-700" };
  }
}

export default function PrintersFleetPage() {
  const [activeTab, setActiveTab] = useState<"fleet" | "tools" | "maintenance">("fleet");
  const [printers, setPrinters] = useState<PrinterAsset[]>([]);
  const [generalParts, setGeneralParts] = useState<PartItem[]>([]);
  const [tools, setTools] = useState<ToolItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Modals
  const [showPrinterModal, setShowPrinterModal] = useState(false);
  const [editingPrinter, setEditingPrinter] = useState<PrinterAsset | null>(null);
  const [showPartModal, setShowPartModal] = useState(false);
  const [targetPrinterId, setTargetPrinterId] = useState<string>("");
  const [targetItemType, setTargetItemType] = useState<"part" | "tool">("part");

  // Printer Form State
  const [printerForm, setPrinterForm] = useState({
    name: "",
    model: "",
    purchasePrice: "",
    purchaseDate: new Date().toISOString().split("T")[0],
    serialNumber: "",
    buildVolume: "220 x 220 x 250 mm",
    nozzleInstalled: "0.4mm Standard",
    bedPlateInstalled: "Textured PEI Plate",
    maintenanceIntervalDays: "30",
    notes: "",
  });

  // Part / Tool Form State
  const [partForm, setPartForm] = useState({
    name: "",
    type: "part" as "part" | "tool",
    printerId: "",
    partCategory: "bed_sheet",
    condition: "new",
    quantity: "1",
    price: "",
    purchaseDate: new Date().toISOString().split("T")[0],
    notes: "",
    productLink: "",
  });

  const [search, setSearch] = useState("");

  const triggerSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3500);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [printerRes, toolRes] = await Promise.all([
        fetch("/api/flow/printers"),
        fetch("/api/flow/assets?category=tool"),
      ]);
      const pJson = await printerRes.json();
      const tJson = await toolRes.json();

      if (pJson.success) {
        setPrinters(pJson.data || []);
        setGeneralParts(pJson.generalParts || []);
      } else {
        setError(pJson.error || "Gagal memuat data armada printer");
      }

      if (tJson.success) {
        setTools(tJson.data || []);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Fleet Summary Calculations
  const totalFleetValue = useMemo(() => {
    return printers.reduce((acc, p) => acc + (p.purchasePrice || 0), 0);
  }, [printers]);

  const totalPartsValue = useMemo(() => {
    const printerPartsVal = printers.reduce((acc, p) => acc + (p.totalPartsValue || 0), 0);
    const genPartsVal = generalParts.reduce((acc, p) => acc + (p.price || 0) * (p.quantity || 1), 0);
    return printerPartsVal + genPartsVal;
  }, [printers, generalParts]);

  const totalToolsValue = useMemo(() => {
    return tools.reduce((acc, t) => acc + (t.price || 0) * (t.quantity || 1), 0);
  }, [tools]);

  const totalWorkshopAssets = totalFleetValue + totalPartsValue + totalToolsValue;

  // Handle open add / edit printer
  const handleOpenPrinterModal = (p?: PrinterAsset) => {
    if (p) {
      setEditingPrinter(p);
      setPrinterForm({
        name: p.name,
        model: p.model,
        purchasePrice: String(p.purchasePrice || 0),
        purchaseDate: p.purchaseDate ? new Date(p.purchaseDate).toISOString().split("T")[0] : "",
        serialNumber: p.serialNumber || "",
        buildVolume: p.buildVolume || "220 x 220 x 250 mm",
        nozzleInstalled: p.nozzleInstalled || "0.4mm Standard",
        bedPlateInstalled: p.bedPlateInstalled || "Textured PEI Plate",
        maintenanceIntervalDays: String(p.maintenanceIntervalDays || 30),
        notes: p.notes || "",
      });
    } else {
      setEditingPrinter(null);
      setPrinterForm({
        name: "",
        model: "",
        purchasePrice: "",
        purchaseDate: new Date().toISOString().split("T")[0],
        serialNumber: "",
        buildVolume: "220 x 220 x 250 mm",
        nozzleInstalled: "0.4mm Standard",
        bedPlateInstalled: "Textured PEI Plate",
        maintenanceIntervalDays: "30",
        notes: "",
      });
    }
    setShowPrinterModal(true);
  };

  // Submit Printer (POST / PATCH)
  const handleSubmitPrinter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!printerForm.name || !printerForm.model) {
      alert("Nama dan tipe model printer wajib diisi!");
      return;
    }

    try {
      const payload = {
        name: printerForm.name,
        model: printerForm.model,
        purchasePrice: parseFloat(printerForm.purchasePrice) || 0,
        purchaseDate: printerForm.purchaseDate,
        serialNumber: printerForm.serialNumber,
        buildVolume: printerForm.buildVolume,
        nozzleInstalled: printerForm.nozzleInstalled,
        bedPlateInstalled: printerForm.bedPlateInstalled,
        maintenanceIntervalDays: parseInt(printerForm.maintenanceIntervalDays) || 30,
        notes: printerForm.notes,
      };

      if (editingPrinter) {
        const res = await fetch(`/api/flow/printers/${editingPrinter.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error || "Gagal mengupdate printer");
        triggerSuccess(`Printer ${payload.name} berhasil diperbarui!`);
      } else {
        const res = await fetch("/api/flow/printers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error || "Gagal menambah printer");
        triggerSuccess(`Printer baru ${payload.name} berhasil didaftarkan!`);
      }

      setShowPrinterModal(false);
      loadData();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  // Open Part / Tool Modal
  const handleOpenPartModal = (type: "part" | "tool", defaultPrinterId?: string) => {
    setTargetItemType(type);
    setPartForm({
      name: "",
      type,
      printerId: defaultPrinterId || printers[0]?.id || "",
      partCategory: "bed_sheet",
      condition: "new",
      quantity: "1",
      price: "",
      purchaseDate: new Date().toISOString().split("T")[0],
      notes: "",
      productLink: "",
    });
    setShowPartModal(true);
  };

  // Submit Part or Tool
  const handleSubmitPart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partForm.name) {
      alert("Nama item wajib diisi!");
      return;
    }

    try {
      const payload = {
        name: partForm.name,
        category: partForm.type === "part" ? "part" : "tool",
        partCategory: partForm.type === "part" ? partForm.partCategory : undefined,
        printerId: partForm.type === "part" ? partForm.printerId : undefined,
        condition: partForm.condition,
        quantity: parseInt(partForm.quantity) || 1,
        price: parseFloat(partForm.price) || 0,
        purchaseDate: partForm.purchaseDate,
        notes: partForm.notes,
        productLink: partForm.productLink,
      };

      const res = await fetch("/api/flow/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Gagal menyimpan data aset");

      triggerSuccess(
        `${partForm.type === "part" ? "Suku cadang" : "Peralatan"} ${partForm.name} berhasil disimpan!`
      );
      setShowPartModal(false);
      loadData();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  // Toggle Maintenance Checklist Item
  const handleToggleChecklist = async (printer: PrinterAsset, checklistItemId: string) => {
    const currentList = printer.maintenanceChecklist || [];
    const updatedList = currentList.map((item) => {
      if (item.id === checklistItemId) {
        return {
          ...item,
          done: !item.done,
          lastCompleted: !item.done ? new Date().toISOString().split("T")[0] : (item.lastCompleted || ""),
        };
      }
      return item;
    });

    try {
      const res = await fetch(`/api/flow/printers/${printer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          maintenanceChecklist: updatedList,
          lastMaintenanceDate: new Date().toISOString(),
        }),
      });
      const json = await res.json();
      if (json.success) {
        setPrinters((prev) =>
          prev.map((p) => (p.id === printer.id ? { ...p, maintenanceChecklist: updatedList } : p))
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Reset / Complete all checklist items
  const handleCompleteAllMaintenance = async (printer: PrinterAsset) => {
    const today = new Date().toISOString().split("T")[0];
    const currentList = printer.maintenanceChecklist || [];
    const updatedList = currentList.map((item) => ({
      ...item,
      done: true,
      lastCompleted: today,
    }));

    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + (printer.maintenanceIntervalDays || 30));

    try {
      const res = await fetch(`/api/flow/printers/${printer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          maintenanceChecklist: updatedList,
          lastMaintenanceDate: new Date().toISOString(),
          nextMaintenanceDate: nextDate.toISOString(),
        }),
      });
      const json = await res.json();
      if (json.success) {
        triggerSuccess(`Servis & Checklist berkala ${printer.name} dicatat selesai!`);
        loadData();
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <GooNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Success Alert */}
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

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                Fleet &amp; Workshop
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {printers.length} Printer • {tools.length} Tools Terdaftar
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
              Armada 3D Printer &amp; Workshop Tools
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Harga beli printer, tanggal beli, kalkulator umur dinamis, suku cadang per mesin,
              jadwal checklist servis preventif, serta inventaris perkakas workshop.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <button
              onClick={() => handleOpenPartModal("part")}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
            >
              <Wrench className="w-3.5 h-3.5 text-rose-400" />
              <span>+ Sparepart</span>
            </button>
            <button
              onClick={() => handleOpenPartModal("tool")}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
            >
              <Boxes className="w-3.5 h-3.5 text-amber-400" />
              <span>+ Tool Workshop</span>
            </button>
            <button
              onClick={() => handleOpenPrinterModal()}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-rose-600/30"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tambah Printer</span>
            </button>
          </div>
        </div>

        {/* Metrics Overview Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/60 p-4 rounded-3xl border border-slate-800 shadow-xl space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Nilai Mesin Printer</span>
              <Printer className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-xl sm:text-2xl font-black text-white font-mono">
              Rp {totalFleetValue.toLocaleString()}
            </p>
            <p className="text-[11px] text-purple-400 font-medium">
              {printers.length} Unit Mesin Cetak Aktif
            </p>
          </div>

          <div className="bg-slate-900/60 p-4 rounded-3xl border border-slate-800 shadow-xl space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Nilai Suku Cadang</span>
              <Wrench className="w-4 h-4 text-rose-400" />
            </div>
            <p className="text-xl sm:text-2xl font-black text-white font-mono">
              Rp {totalPartsValue.toLocaleString()}
            </p>
            <p className="text-[11px] text-rose-400 font-medium">
              {printers.reduce((acc, p) => acc + p.totalPartsCount, 0) + generalParts.length} Suku
              Cadang Dimiliki
            </p>
          </div>

          <div className="bg-slate-900/60 p-4 rounded-3xl border border-slate-800 shadow-xl space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Nilai Peralatan / Tools</span>
              <Boxes className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-xl sm:text-2xl font-black text-white font-mono">
              Rp {totalToolsValue.toLocaleString()}
            </p>
            <p className="text-[11px] text-amber-400 font-medium">
              {tools.length} Peralatan Bengkel Terdata
            </p>
          </div>

          <div className="bg-slate-900/60 p-4 rounded-3xl border border-slate-800 shadow-xl space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Total Nilai Aset Fleet</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
              Rp {totalWorkshopAssets.toLocaleString()}
            </p>
            <p className="text-[11px] text-slate-400 font-medium">Investasi Mesin &amp; Workshop</p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <button
            onClick={() => setActiveTab("fleet")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "fleet"
                ? "bg-rose-600 text-white shadow-lg shadow-rose-600/30"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Armada Printer &amp; Sparepart ({printers.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("tools")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "tools"
                ? "bg-rose-600 text-white shadow-lg shadow-rose-600/30"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>Peralatan Workshop ({tools.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("maintenance")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "maintenance"
                ? "bg-rose-600 text-white shadow-lg shadow-rose-600/30"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Jadwal &amp; Checklist Maintenance</span>
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20 bg-slate-900/40 rounded-3xl border border-slate-800 text-slate-400 text-sm">
            Memuat data armada mesin dan inventaris suku cadang...
          </div>
        ) : error ? (
          <div className="text-center py-8 bg-rose-950/40 text-rose-300 border border-rose-800 rounded-3xl text-sm">
            {error}
          </div>
        ) : (
          <>
            {/* ══════════════════════════════════════════ */}
            {/* TAB 1: FLEET & SPAREPARTS                 */}
            {/* ══════════════════════════════════════════ */}
            {activeTab === "fleet" && (
              <div className="space-y-6">
                {printers.map((printer) => {
                  const ageStr = formatAge(printer.purchaseDate);

                  // Group spare parts for this printer
                  const partsByCat = {
                    bed_sheet: printer.parts.filter((p) => p.partCategory === "bed_sheet"),
                    nozzle: printer.parts.filter((p) => p.partCategory === "nozzle"),
                    hotend_extruder: printer.parts.filter(
                      (p) => p.partCategory === "hotend_extruder"
                    ),
                    belts_motion: printer.parts.filter((p) => p.partCategory === "belts_motion"),
                    electronics: printer.parts.filter((p) => p.partCategory === "electronics"),
                    lubricant_consumable: printer.parts.filter(
                      (p) => p.partCategory === "lubricant_consumable"
                    ),
                    other: printer.parts.filter(
                      (p) =>
                        !p.partCategory ||
                        !["bed_sheet", "nozzle", "hotend_extruder", "belts_motion", "electronics", "lubricant_consumable"].includes(p.partCategory)
                    ),
                  };

                  return (
                    <div
                      key={printer.id}
                      className="bg-slate-900/70 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl hover:border-slate-700 transition-all"
                    >
                      {/* Printer Machine Header Banner */}
                      <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600/30 to-rose-600/20 border border-purple-500/30 flex items-center justify-center text-3xl shadow-inner">
                              🖨️
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h2 className="text-xl font-black text-white">{printer.name}</h2>
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                                  {printer.status || "Operasional"}
                                </span>
                              </div>
                              <p className="text-xs text-slate-400 font-mono mt-0.5">
                                Model: <span className="text-slate-200">{printer.model}</span> • SN:{" "}
                                <span className="text-slate-400">{printer.serialNumber || "-"}</span>
                              </p>
                              {printer.notes && (
                                <p className="text-[11px] text-slate-400 mt-1 italic">
                                  &ldquo;{printer.notes}&rdquo;
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleOpenPartModal("part", printer.id)}
                              className="px-3.5 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-300 text-xs font-bold transition-all flex items-center gap-1.5"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Tambah Part Mesin Ini</span>
                            </button>
                            <button
                              onClick={() => handleOpenPrinterModal(printer)}
                              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all flex items-center gap-1.5"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>Edit Info Mesin</span>
                            </button>
                          </div>
                        </div>

                        {/* Financial, Age & Specs Row */}
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-5 pt-4 border-t border-slate-800/80 text-xs">
                          <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800/80">
                            <span className="text-slate-400 text-[10px] block font-bold uppercase tracking-wider">
                              Harga Beli
                            </span>
                            <span className="font-mono font-bold text-white text-sm">
                              Rp {printer.purchasePrice ? printer.purchasePrice.toLocaleString() : "-"}
                            </span>
                          </div>

                          <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800/80">
                            <span className="text-slate-400 text-[10px] block font-bold uppercase tracking-wider">
                              Tanggal Beli
                            </span>
                            <span className="font-mono font-bold text-white text-sm">
                              {printer.purchaseDate
                                ? new Date(printer.purchaseDate).toLocaleDateString("id-ID", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  })
                                : "-"}
                            </span>
                          </div>

                          <div className="bg-slate-950/80 p-3 rounded-2xl border border-purple-500/30 bg-purple-950/10">
                            <span className="text-purple-300 text-[10px] block font-bold uppercase tracking-wider">
                              Umur Printer (Dinamis)
                            </span>
                            <span className="font-bold text-purple-200 text-sm">{ageStr}</span>
                          </div>

                          <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800/80">
                            <span className="text-slate-400 text-[10px] block font-bold uppercase tracking-wider">
                              Build Volume
                            </span>
                            <span className="font-mono text-slate-200 text-xs">
                              {printer.buildVolume || "180 x 180 x 180 mm"}
                            </span>
                          </div>

                          <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800/80">
                            <span className="text-slate-400 text-[10px] block font-bold uppercase tracking-wider">
                              Nozzle &amp; Bed Terpasang
                            </span>
                            <span className="text-slate-200 text-xs block truncate font-medium">
                              {printer.nozzleInstalled || "0.4mm"} • {printer.bedPlateInstalled || "PEI"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Spareparts Section Grouped */}
                      <div className="p-5 sm:p-6 space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                              <Wrench className="w-4 h-4 text-rose-400" />
                              <span>Suku Cadang &amp; Parts Yang Dimiliki ({printer.parts.length} Item)</span>
                            </h3>
                            <p className="text-[11px] text-slate-400">
                              Dikelompokkan rapi per bagian (Bed Sheet, Nozzle, Extruder, dll.) dengan status kepemilikan.
                            </p>
                          </div>
                          <span className="text-xs font-mono font-bold text-slate-300 bg-slate-950 px-3 py-1 rounded-xl border border-slate-800">
                            Total: Rp {printer.totalPartsValue.toLocaleString()}
                          </span>
                        </div>

                        {printer.parts.length === 0 ? (
                          <div className="p-6 text-center rounded-2xl border border-dashed border-slate-800 text-slate-400 text-xs">
                            Belum ada suku cadang terhubung ke printer ini. Klik tombol &ldquo;Tambah Part Mesin Ini&rdquo; atau catat pengeluaran di Buku Kas.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {printer.parts.map((part) => {
                              const meta = getPartCategoryMeta(part.partCategory);
                              const IconComponent = meta.icon;
                              const isInstalled = part.condition === "in_use";

                              return (
                                <div
                                  key={part.id}
                                  className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition-all space-y-2 flex flex-col justify-between"
                                >
                                  <div>
                                    <div className="flex items-center justify-between gap-2">
                                      <span
                                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold border flex items-center gap-1 ${meta.color}`}
                                      >
                                        <IconComponent className="w-3 h-3" />
                                        <span>{meta.label}</span>
                                      </span>
                                      <span
                                        className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${
                                          isInstalled
                                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                            : "bg-slate-800 text-slate-400 border border-slate-700"
                                        }`}
                                      >
                                        {isInstalled ? "Terpasang" : "Cadangan"}
                                      </span>
                                    </div>
                                    <h4 className="font-bold text-white text-xs mt-2 leading-tight">
                                      {part.name}
                                    </h4>
                                  </div>

                                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                                    <span>
                                      {part.quantity} unit • Rp {Math.round(part.price || 0).toLocaleString()}
                                    </span>
                                    {part.purchaseDate && (
                                      <span className="text-[10px] text-slate-400">
                                        Beli: {new Date(part.purchaseDate).toLocaleDateString("id-ID", { month: "short", year: "2-digit" })}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Maintenance Preview Footer */}
                      <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-3">
                          <ShieldCheck className="w-4 h-4 text-emerald-400" />
                          <div>
                            <span className="font-bold text-white">Jadwal Perawatan Berkala: </span>
                            <span className="text-slate-400 font-mono">
                              Setiap {printer.maintenanceIntervalDays || 30} Hari • Terakhir servis:{" "}
                              {printer.lastMaintenanceDate
                                ? new Date(printer.lastMaintenanceDate).toLocaleDateString("id-ID")
                                : "-"}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => setActiveTab("maintenance")}
                          className="text-rose-400 hover:text-rose-300 font-bold hover:underline flex items-center gap-1"
                        >
                          <span>Buka Checklist Servis Mesin Ini &rarr;</span>
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* General Parts (Not assigned to specific machine) */}
                {generalParts.length > 0 && (
                  <div className="bg-slate-900/60 rounded-3xl border border-slate-800 p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                          <Wrench className="w-4 h-4 text-slate-400" />
                          <span>Sparepart &amp; Consumables Umum ({generalParts.length} Item)</span>
                        </h3>
                        <p className="text-[11px] text-slate-400">
                          Suku cadang bersama / consumable yang tidak terikat pada satu printer spesifik.
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {generalParts.map((part) => (
                        <div
                          key={part.id}
                          className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-xs space-y-1.5"
                        >
                          <div className="font-bold text-white leading-tight">{part.name}</div>
                          <div className="flex justify-between items-center text-slate-400 font-mono text-[11px] pt-1 border-t border-slate-800">
                            <span>{part.quantity} unit</span>
                            <span className="font-bold text-emerald-400">
                              Rp {Math.round(part.price || 0).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ══════════════════════════════════════════ */}
            {/* TAB 2: WORKSHOP TOOLS                      */}
            {/* ══════════════════════════════════════════ */}
            {activeTab === "tools" && (
              <div className="bg-slate-900/60 rounded-3xl border border-slate-800 overflow-hidden shadow-xl space-y-4 p-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Boxes className="w-4 h-4 text-amber-400" />
                      <span>Daftar Tools &amp; Peralatan Workshop 3D Printing</span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Seluruh peralatan pendukung (Filament Dryer, Glue Stick, Caliper, Sander, Cutting Mat, dll.)
                      lengkap dengan harga beli, tanggal beli, dan umur pakai alat.
                    </p>
                  </div>
                  <button
                    onClick={() => handleOpenPartModal("tool")}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-rose-600/20"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Tambah Tool Baru</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider font-mono">
                      <tr>
                        <th className="py-3 px-4">Nama Peralatan / Tool</th>
                        <th className="py-3 px-4">Harga Beli</th>
                        <th className="py-3 px-4">Tanggal Beli</th>
                        <th className="py-3 px-4">Umur Alat</th>
                        <th className="py-3 px-4">Jumlah Stok</th>
                        <th className="py-3 px-4">Catatan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {tools.map((t) => {
                        const ageStr = formatAge(t.purchaseDate);
                        return (
                          <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="py-3.5 px-4 font-bold text-white">
                              <div className="flex items-center gap-2">
                                <span className="p-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                  🛠️
                                </span>
                                <div>
                                  <p>{t.name}</p>
                                  {t.productLink && (
                                    <a
                                      href={t.productLink}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-[10px] text-rose-400 hover:underline flex items-center gap-1 font-mono"
                                    >
                                      <span>Link Toko</span>
                                      <ExternalLink className="w-2.5 h-2.5" />
                                    </a>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 font-mono font-bold text-slate-200">
                              Rp {Math.round(t.price || 0).toLocaleString()}
                            </td>
                            <td className="py-3.5 px-4 font-mono text-slate-400">
                              {t.purchaseDate
                                ? new Date(t.purchaseDate).toLocaleDateString("id-ID", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  })
                                : "-"}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/20 font-mono">
                                {ageStr}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                              {t.quantity} unit
                            </td>
                            <td className="py-3.5 px-4 text-slate-400 text-[11px] max-w-xs truncate">
                              {t.notes || "-"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════ */}
            {/* TAB 3: MAINTENANCE CHECKLIST              */}
            {/* ══════════════════════════════════════════ */}
            {activeTab === "maintenance" && (
              <div className="space-y-6">
                <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <div>
                      <p className="font-bold text-white">SOP &amp; Jadwal Perawatan Preventif 3D Printer</p>
                      <p className="text-slate-400 text-[11px]">
                        Lakukan pengecekan rutin untuk menjamin presisi first-layer, keawetan linear rod, dan kebersihan nozzle.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {printers.map((printer) => {
                    const checklist = printer.maintenanceChecklist || [];
                    const completedCount = checklist.filter((i) => i.done).length;
                    const percent =
                      checklist.length > 0 ? Math.round((completedCount / checklist.length) * 100) : 100;

                    return (
                      <div
                        key={printer.id}
                        className="bg-slate-900/70 rounded-3xl border border-slate-800 p-6 space-y-5 shadow-xl"
                      >
                        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                          <div>
                            <h3 className="font-black text-lg text-white">{printer.name}</h3>
                            <p className="text-xs text-slate-400 font-mono">{printer.model}</p>
                          </div>
                          <button
                            onClick={() => handleCompleteAllMaintenance(printer)}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition-all flex items-center gap-1.5"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Tandai Semua Selesai</span>
                          </button>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs text-slate-300 font-medium font-mono">
                            <span>Status Kesiapan Servis</span>
                            <span className="text-emerald-400">
                              {completedCount}/{checklist.length} Tugas ({percent}%)
                            </span>
                          </div>
                          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                            <div
                              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>

                        {/* Checklist items */}
                        <div className="space-y-2.5">
                          {checklist.map((item) => (
                            <div
                              key={item.id}
                              onClick={() => handleToggleChecklist(printer, item.id)}
                              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                                item.done
                                  ? "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                                  : "bg-rose-950/20 border-rose-800/50 hover:border-rose-700"
                              }`}
                            >
                              <div
                                className={`w-5 h-5 rounded-lg border mt-0.5 flex items-center justify-center transition-all ${
                                  item.done
                                    ? "bg-emerald-500 border-emerald-400 text-slate-950"
                                    : "border-slate-600 bg-slate-900"
                                }`}
                              >
                                {item.done && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                              </div>
                              <div className="flex-1">
                                <p
                                  className={`text-xs font-bold leading-snug ${
                                    item.done ? "text-slate-300" : "text-white"
                                  }`}
                                >
                                  {item.title}
                                </p>
                                <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400 font-mono">
                                  <span>Frekuensi: {item.frequency}</span>
                                  <span>•</span>
                                  <span>Terakhir: {item.lastCompleted || "-"}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* ══════════════════════════════════════════ */}
      {/* MODAL: ADD / EDIT PRINTER                  */}
      {/* ══════════════════════════════════════════ */}
      {showPrinterModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-white">
                    {editingPrinter ? "Edit Mesin Printer" : "Tambah Mesin Printer Baru"}
                  </h3>
                  <p className="text-[11px] text-slate-400">Pencatatan aset armada 3D printer</p>
                </div>
              </div>
              <button
                onClick={() => setShowPrinterModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitPrinter} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Nama Printer <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Bambulab A1 mini"
                    value={printerForm.name}
                    onChange={(e) => setPrinterForm((prev) => ({ ...prev, name: e.target.value }))}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Model Mesin <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="A1 mini / HI COMBO"
                    value={printerForm.model}
                    onChange={(e) => setPrinterForm((prev) => ({ ...prev, model: e.target.value }))}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Harga Beli (Rp)
                  </label>
                  <input
                    type="number"
                    placeholder="4856400"
                    value={printerForm.purchasePrice}
                    onChange={(e) =>
                      setPrinterForm((prev) => ({ ...prev, purchasePrice: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Tanggal Beli
                  </label>
                  <input
                    type="date"
                    value={printerForm.purchaseDate}
                    onChange={(e) =>
                      setPrinterForm((prev) => ({ ...prev, purchaseDate: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Build Volume
                  </label>
                  <input
                    type="text"
                    placeholder="180 x 180 x 180 mm"
                    value={printerForm.buildVolume}
                    onChange={(e) =>
                      setPrinterForm((prev) => ({ ...prev, buildVolume: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Nomor Seri (Serial No)
                  </label>
                  <input
                    type="text"
                    placeholder="03099A441300084"
                    value={printerForm.serialNumber}
                    onChange={(e) =>
                      setPrinterForm((prev) => ({ ...prev, serialNumber: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Nozzle Terpasang
                  </label>
                  <input
                    type="text"
                    placeholder="0.4mm Stainless Steel"
                    value={printerForm.nozzleInstalled}
                    onChange={(e) =>
                      setPrinterForm((prev) => ({ ...prev, nozzleInstalled: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Bed Plate Terpasang
                  </label>
                  <input
                    type="text"
                    placeholder="Textured PEI Plate"
                    value={printerForm.bedPlateInstalled}
                    onChange={(e) =>
                      setPrinterForm((prev) => ({ ...prev, bedPlateInstalled: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Interval Perawatan (Hari)
                </label>
                <input
                  type="number"
                  placeholder="30"
                  value={printerForm.maintenanceIntervalDays}
                  onChange={(e) =>
                    setPrinterForm((prev) => ({
                      ...prev,
                      maintenanceIntervalDays: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Catatan Tambahan
                </label>
                <textarea
                  rows={2}
                  placeholder="Keterangan kondisi mesin, aksesoris terpasang, dll..."
                  value={printerForm.notes}
                  onChange={(e) => setPrinterForm((prev) => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPrinterModal(false)}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/30"
                >
                  {editingPrinter ? "Simpan Perubahan" : "Daftarkan Printer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════ */}
      {/* MODAL: ADD SPAREPART / WORKSHOP TOOL       */}
      {/* ══════════════════════════════════════════ */}
      {showPartModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-white">
                    {partForm.type === "part" ? "Tambah Suku Cadang Printer" : "Tambah Peralatan Workshop"}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {partForm.type === "part"
                      ? "Pencatatan suku cadang yang dimiliki per mesin printer"
                      : "Pencatatan perkakas bengkel & alat pendukung produksi"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPartModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitPart} className="space-y-3.5">
              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-2xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setPartForm((prev) => ({ ...prev, type: "part" }))}
                  className={`py-2 text-xs font-bold rounded-xl transition-all ${
                    partForm.type === "part"
                      ? "bg-rose-600 text-white shadow-md"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  ⚙️ Suku Cadang Printer
                </button>
                <button
                  type="button"
                  onClick={() => setPartForm((prev) => ({ ...prev, type: "tool" }))}
                  className={`py-2 text-xs font-bold rounded-xl transition-all ${
                    partForm.type === "tool"
                      ? "bg-amber-600 text-white shadow-md"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  🛠️ Alat / Tool Workshop
                </button>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Nama Barang <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder={
                    partForm.type === "part"
                      ? "Contoh: BTT PEI Plate, Nozzle 0.4mm Hardened"
                      : "Contoh: Creality Space Pi Dryer, Caliper Digital"
                  }
                  value={partForm.name}
                  onChange={(e) => setPartForm((prev) => ({ ...prev, name: e.target.value }))}
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              {partForm.type === "part" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Printer Terkait <span className="text-rose-400">*</span>
                    </label>
                    <select
                      value={partForm.printerId}
                      onChange={(e) => setPartForm((prev) => ({ ...prev, printerId: e.target.value }))}
                      required
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                    >
                      <option value="">-- Pilih Printer --</option>
                      {printers.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Kelompok Suku Cadang <span className="text-rose-400">*</span>
                    </label>
                    <select
                      value={partForm.partCategory}
                      onChange={(e) =>
                        setPartForm((prev) => ({ ...prev, partCategory: e.target.value }))
                      }
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                    >
                      <option value="bed_sheet">Bed Sheet / Build Plate</option>
                      <option value="nozzle">Nozzle &amp; Tip</option>
                      <option value="hotend_extruder">Hotend &amp; Extruder Parts</option>
                      <option value="belts_motion">Belt &amp; Linear Rods</option>
                      <option value="electronics">Elektronik &amp; Kipas</option>
                      <option value="lubricant_consumable">Pelumas / Consumable</option>
                      <option value="other">Lainnya</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Harga Beli Satuan (Rp)
                  </label>
                  <input
                    type="number"
                    placeholder="150000"
                    value={partForm.price}
                    onChange={(e) => setPartForm((prev) => ({ ...prev, price: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Jumlah (Qty)
                  </label>
                  <input
                    type="number"
                    value={partForm.quantity}
                    onChange={(e) => setPartForm((prev) => ({ ...prev, quantity: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Tanggal Pembelian
                  </label>
                  <input
                    type="date"
                    value={partForm.purchaseDate}
                    onChange={(e) =>
                      setPartForm((prev) => ({ ...prev, purchaseDate: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Status / Kondisi
                  </label>
                  <select
                    value={partForm.condition}
                    onChange={(e) =>
                      setPartForm((prev) => ({ ...prev, condition: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="new">Baru (Stok Cadangan)</option>
                    <option value="in_use">Sedang Terpasang</option>
                    <option value="backup">Backup Darurat</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Link Produk (Opsional)
                </label>
                <input
                  type="url"
                  placeholder="https://tokopedia.com/..."
                  value={partForm.productLink}
                  onChange={(e) =>
                    setPartForm((prev) => ({ ...prev, productLink: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPartModal(false)}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30"
                >
                  Simpan Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
