"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { GooNavbar } from "@/components/GooNavbar";
import { FilamentBrandLogo } from "@/components/FilamentBrandLogo";
import { useGooSettings, SpoolTareWeight } from "@/hooks/use-goo-settings";
import {
  generateSpoolSku,
  getFilamentGroupKey,
  COMMON_FILAMENT_BRANDS,
  COMMON_FILAMENT_COLORS,
} from "@/lib/filament-sku";
import {
  Plus,
  Search,
  Boxes,
  X,
  CheckCircle2,
  Check,
  ExternalLink,
  Layers,
  Package,
  Sparkles,
  Flame,
  Scale,
  Edit2,
  Trash2,
  Settings,
  RotateCcw,
  Sliders,
  Info,
  Clock,
  Calendar,
  Printer,
  ScanLine,
  Camera,
  LayoutGrid,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// Standard Code 128 (Subset B) SVG Barcode Generator
function SpoolBarcodeSvg({
  value,
  height = 42,
  showText = false,
}: {
  value: string;
  height?: number;
  showText?: boolean;
}) {
  const patterns = [
    "212222","222122","222221","121223","121322","131222","122213","122312","132212","221213",
    "221312","231212","112232","122132","122231","113222","123122","123221","223211","221132",
    "221231","213212","223112","312131","311222","321122","321221","312212","322112","322211",
    "212123","212321","232121","111323","131123","131321","112313","132113","132311","211313",
    "231113","231311","112133","112331","132131","113123","113321","133121","313121","211331",
    "231131","213113","213311","213131","311123","311321","331121","312113","312311","332111",
    "314111","221411","431111","111224","111422","121124","121421","141122","141221","112214",
    "112412","122114","122411","142112","142211","241211","221114","413111","241112","134111",
    "111242","121142","121241","114212","124112","124211","411212","421112","421211","212141",
    "214121","412121","111143","111341","131141","114113","114311","411113","411311","113141",
    "114131","311141","411131","211412","211214","211232","2331112"
  ];
  const START_B = 104;
  const STOP = 106;

  const str = String(value || "SKU").trim();
  const codes: number[] = [START_B];
  let checksum = START_B;

  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i) - 32;
    const validCode = code >= 0 && code <= 95 ? code : 0;
    codes.push(validCode);
    checksum += validCode * (i + 1);
  }
  codes.push(checksum % 103);
  codes.push(STOP);

  let barString = "";
  for (const c of codes) {
    barString += patterns[c] || "212222";
  }

  const rects: { x: number; w: number }[] = [];
  let currentX = 10;
  for (let i = 0; i < barString.length; i++) {
    const width = parseInt(barString.charAt(i) || "1", 10) * 1.5;
    if (i % 2 === 0) {
      rects.push({ x: currentX, w: width });
    }
    currentX += width;
  }
  const totalWidth = currentX + 10;

  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox={`0 0 ${totalWidth} ${height}`}
        className="w-full max-w-[220px] h-auto overflow-visible"
        shapeRendering="crispEdges"
      >
        <rect width="100%" height="100%" fill="white" />
        {rects.map((r, idx) => (
          <rect key={idx} x={r.x} y={0} width={r.w} height={height} fill="#000000" />
        ))}
      </svg>
      {showText && (
        <span className="font-mono text-[11px] font-black text-slate-950 tracking-wider mt-0.5">
          {str}
        </span>
      )}
    </div>
  );
}

interface InventoryItem {
  id: string;
  sku: string;
  brand: string;
  type: string | null;
  version: string | null;
  materialType: string;
  color: string;
  colorHex: string | null;
  currentWeight: number;
  initialWeight: number;
  pricePerGram: number;
  lowStockThreshold: number;
  productLink: string | null;
  purchaseDate?: string | null;
  createdAt?: string | null;
  updatedAt: string;
}

// Calculate dynamic filament age: "3 Bln 12 Hari" or "1 Thn 2 Bln"
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
  if (years > 0) parts.push(`${years} Thn`);
  if (months > 0) parts.push(`${months} Bln`);
  if (years === 0 && months === 0) parts.push(`${Math.max(1, days)} Hari`);
  return parts.join(" ") || "Hari ini";
}

function formatDateIndo(dateStr?: string | Date | null): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function isLightColorHex(hex?: string | null): boolean {
  if (!hex) return false;
  let clean = hex.replace("#", "").trim();
  if (clean.length === 3) {
    const c0 = clean.charAt(0);
    const c1 = clean.charAt(1);
    const c2 = clean.charAt(2);
    clean = `${c0}${c0}${c1}${c1}${c2}${c2}`;
  }
  if (clean.length < 6) return false;
  const r = parseInt(clean.substring(0, 2), 16) || 0;
  const g = parseInt(clean.substring(2, 4), 16) || 0;
  const b = parseInt(clean.substring(4, 6), 16) || 0;
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 155;
}

interface AssetItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  price: number;
  notes: string | null;
  productLink: string | null;
  size: string | null;
  purchaseDate?: string | null;
}

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<"filament" | "equipment">("filament");

  useEffect(() => {
    try {
      const savedTab = localStorage.getItem("gooos_inventory_tab");
      if (savedTab === "filament" || savedTab === "equipment") {
        setActiveTab(savedTab);
      }
    } catch (e) {}
  }, []);

  const handleSelectTab = (tab: "filament" | "equipment") => {
    setActiveTab(tab);
    try {
      localStorage.setItem("gooos_inventory_tab", tab);
    } catch (e) {}
  };
  const { settings } = useGooSettings();

  // Helper untuk mencocokkan bobot kosong spul dari merk
  const getMatchedTare = (brand: string): SpoolTareWeight => {
    const fallback: SpoolTareWeight = { id: "std", brand: "Generic", type: "Standard", emptyWeight: 200 };
    if (!settings.spoolWeights || settings.spoolWeights.length === 0) {
      return fallback;
    }
    const b = (brand || "").toLowerCase().trim();
    const found = settings.spoolWeights.find(
      (s) => b.includes(s.brand.toLowerCase().trim()) || s.brand.toLowerCase().trim().includes(b)
    );
    return found || settings.spoolWeights[0] || fallback;
  };

  // Quick Tare Scale Assistant Modal
  const [weighModalItem, setWeighModalItem] = useState<InventoryItem | null>(null);
  const [scaleGrossWeight, setScaleGrossWeight] = useState<string>("");
  const [selectedTareWeight, setSelectedTareWeight] = useState<number>(200);
  const [customTareInput, setCustomTareInput] = useState<string>("");
  const [isSubmittingWeight, setIsSubmittingWeight] = useState(false);

  // Edit Filament Modal
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [editForm, setEditForm] = useState({
    brand: "",
    materialType: "",
    color: "",
    colorHex: "#111827",
    currentWeight: "1000",
    initialWeight: "1000",
    price: "150000",
    purchaseDate: new Date().toISOString().split("T")[0],
    lowStockThreshold: "100",
    productLink: "",
  });
  const [editGrossScale, setEditGrossScale] = useState<string>("");
  const [editSpoolTare, setEditSpoolTare] = useState<number>(200);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Add Filament Spool Tare deduction assistant
  const [addGrossScale, setAddGrossScale] = useState<string>("");
  const [addSpoolTare, setAddSpoolTare] = useState<number>(220);

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Persistent Search & Material Filters
  const [search, setSearch] = useState(() => {
    if (typeof window !== "undefined") {
      try { return localStorage.getItem("gooos_inventory_search") || ""; } catch (e) {}
    }
    return "";
  });

  const handleSetSearch = (val: string) => {
    setSearch(val);
    try { localStorage.setItem("gooos_inventory_search", val); } catch (e) {}
  };

  const [selectedMaterial, setSelectedMaterial] = useState(() => {
    if (typeof window !== "undefined") {
      try { return localStorage.getItem("gooos_inventory_material") || "all"; } catch (e) {}
    }
    return "all";
  });

  const handleSetSelectedMaterial = (val: string) => {
    setSelectedMaterial(val);
    try { localStorage.setItem("gooos_inventory_material", val); } catch (e) {}
  };

  const [selectedBrand, setSelectedBrand] = useState(() => {
    if (typeof window !== "undefined") {
      try { return localStorage.getItem("gooos_inventory_brand") || "all"; } catch (e) {}
    }
    return "all";
  });

  const handleSetSelectedBrand = (val: string) => {
    setSelectedBrand(val);
    try { localStorage.setItem("gooos_inventory_brand", val); } catch (e) {}
  };

  // View mode (Grouped by Brand/Type/Color vs Flat List)
  const [viewMode, setViewMode] = useState<"grouped" | "list">(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("gooos_inventory_view_mode");
        if (saved === "grouped" || saved === "list") return saved;
      } catch (e) {}
    }
    return "grouped";
  });

  const handleSetViewMode = (mode: "grouped" | "list") => {
    setViewMode(mode);
    try {
      localStorage.setItem("gooos_inventory_view_mode", mode);
    } catch (e) {}
  };

  // Expanded group keys in accordion
  const [openGroupKeys, setOpenGroupKeys] = useState<Set<string>>(new Set());

  const toggleGroupOpen = (key: string) => {
    setOpenGroupKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Barcode & SKU Sticker Print State
  const [barcodeStickerSpool, setBarcodeStickerSpool] = useState<any | null>(null);

  // Barcode Scanner Modal State
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [barcodeInputText, setBarcodeInputText] = useState("");
  const [scannedSpool, setScannedSpool] = useState<any | null>(null);
  const [scanWeightMode, setScanWeightMode] = useState<"gross" | "net">("gross");
  const [scanWeightInput, setScanWeightInput] = useState("");
  const [isUpdatingScanWeight, setIsUpdatingScanWeight] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (e: any) {
      alert("Tidak dapat mengakses kamera: " + e.message);
    }
  };

  const handleBarcodeSearch = (code: string) => {
    const q = code.trim().toLowerCase();
    if (!q) return;
    const found = items.find(
      (it) =>
        (it.sku && it.sku.toLowerCase() === q) ||
        it.id.toLowerCase() === q ||
        it.id.toLowerCase().includes(q)
    );
    if (found) {
      setScannedSpool(found);
      const tare = getMatchedTare(found.brand).emptyWeight;
      setScanWeightInput(String(Math.round(found.currentWeight + tare)));
      setScanWeightMode("gross");
    } else {
      alert(`Spool dengan SKU / Barcode "${code}" tidak ditemukan di inventaris!`);
    }
  };

  // Camera BarcodeDetector Loop
  useEffect(() => {
    let animId: number;
    if (isScannerOpen && isCameraActive && videoRef.current) {
      if (typeof window !== "undefined" && "BarcodeDetector" in window) {
        const detector = new (window as any).BarcodeDetector({
          formats: ["code_128", "code_39", "ean_13", "qr_code"],
        });
        const detectFrame = async () => {
          if (videoRef.current && videoRef.current.readyState === 4) {
            try {
              const barcodes = await detector.detect(videoRef.current);
              if (barcodes.length > 0) {
                const rawVal = barcodes[0].rawValue;
                if (rawVal) {
                  handleBarcodeSearch(rawVal);
                  stopCamera();
                  return;
                }
              }
            } catch (err) {}
          }
          animId = requestAnimationFrame(detectFrame);
        };
        animId = requestAnimationFrame(detectFrame);
      }
    }
    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [isScannerOpen, isCameraActive]);

  const handleScanWeightSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannedSpool) return;
    try {
      setIsUpdatingScanWeight(true);
      const tare = getMatchedTare(scannedSpool.brand).emptyWeight;
      const numInput = Number(scanWeightInput) || 0;
      const newNetWeight = scanWeightMode === "gross" ? Math.max(0, numInput - tare) : numInput;

      const res = await fetch(`/api/flow/inventory/${scannedSpool.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentWeight: newNetWeight }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Gagal update berat");

      setItems((prev) =>
        prev.map((it) => (it.id === scannedSpool.id ? { ...it, currentWeight: newNetWeight } : it))
      );
      triggerSuccess(
        `✓ Stok ${scannedSpool.sku || scannedSpool.brand} berhasil diperbarui: ${newNetWeight}g!`
      );
      setScannedSpool((prev: any) => ({ ...prev, currentWeight: newNetWeight }));
      setBarcodeInputText("");
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsUpdatingScanWeight(false);
    }
  };

  // Stock status filter: defaults to "in_stock" (Stok Cukup / Siap Cetak) with localStorage persistence
  const [stockStatus, setStockStatus] = useState<"all" | "in_stock" | "low" | "empty">(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("gooos_inventory_stock_status");
        if (saved && ["all", "in_stock", "low", "empty"].includes(saved)) {
          return saved as "all" | "in_stock" | "low" | "empty";
        }
      } catch (e) {}
    }
    return "in_stock"; // Default: Stok Cukup
  });

  const handleSetStockStatus = (status: "all" | "in_stock" | "low" | "empty") => {
    setStockStatus(status);
    try {
      localStorage.setItem("gooos_inventory_stock_status", status);
    } catch (e) {}
  };

  // Modals state
  const [showFilamentModal, setShowFilamentModal] = useState(false);
  const [showPackagingModal, setShowPackagingModal] = useState(false);

  // Filament Form
  const [filamentForm, setFilamentForm] = useState({
    brand: "eSUN",
    materialType: "PLA+",
    color: "Black",
    colorHex: "#111827",
    initialWeight: "1000",
    currentWeight: "1000",
    price: "150000",
    purchaseDate: new Date().toISOString().split("T")[0],
    productLink: "",
    lowStockThreshold: "100",
  });
  const [syncFilamentTx, setSyncFilamentTx] = useState(true);

  // Packaging Form
  const [packagingForm, setPackagingForm] = useState({
    name: "",
    category: "packing" as "packing" | "production",
    size: "",
    quantity: "20",
    price: "1500",
    purchaseDate: new Date().toISOString().split("T")[0],
    notes: "",
    productLink: "",
  });
  const [syncPackagingTx, setSyncPackagingTx] = useState(true);

  const triggerSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3500);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [invRes, astRes] = await Promise.all([
        fetch("/api/flow/inventory"),
        fetch("/api/flow/assets"),
      ]);
      const invJson = await invRes.json();
      const astJson = await astRes.json();

      if (invJson.success) setItems(invJson.data);
      if (astJson.success) setAssets(astJson.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const materials = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => i.materialType && set.add(i.materialType));
    return ["all", ...Array.from(set)];
  }, [items]);

  const brandsWithCounts = useMemo(() => {
    const map = new Map<string, number>();
    items.forEach((item) => {
      const b = (item.brand || "Generic").trim();
      map.set(b, (map.get(b) || 0) + 1);
    });
    const sorted = Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
    return [
      { name: "all", label: "Semua Merek", count: items.length },
      ...sorted.map(([name, count]) => ({ name, label: name, count })),
    ];
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchSearch =
        search === "" ||
        item.sku.toLowerCase().includes(search.toLowerCase()) ||
        item.brand.toLowerCase().includes(search.toLowerCase()) ||
        item.color.toLowerCase().includes(search.toLowerCase());
      const matchMaterial =
        selectedMaterial === "all" || item.materialType === selectedMaterial;
      const matchBrand =
        selectedBrand === "all" ||
        item.brand?.trim().toLowerCase() === selectedBrand.trim().toLowerCase();

      let matchStock = true;
      if (stockStatus === "in_stock")
        matchStock = item.currentWeight > (item.lowStockThreshold || 100);
      if (stockStatus === "low")
        matchStock =
          item.currentWeight <= (item.lowStockThreshold || 100) && item.currentWeight > 0;
      if (stockStatus === "empty") matchStock = item.currentWeight <= 0;

      return matchSearch && matchMaterial && matchBrand && matchStock;
    });
  }, [items, search, selectedMaterial, selectedBrand, stockStatus]);

  // Grouping by Brand + MaterialType + Color with sequential SKU
  const groupedFilaments = useMemo(() => {
    const groupsMap = new Map<
      string,
      {
        key: string;
        brand: string;
        materialType: string;
        color: string;
        colorHex: string | null;
        skuPrefix: string;
        spools: (InventoryItem & { sequenceNum: number; generatedSku: string })[];
      }
    >();

    const sortedItems = [...items].sort((a, b) => {
      const dateA = new Date(a.purchaseDate || a.createdAt || 0).getTime();
      const dateB = new Date(b.purchaseDate || b.createdAt || 0).getTime();
      return dateA - dateB;
    });

    sortedItems.forEach((item) => {
      const key = getFilamentGroupKey(item.brand, item.materialType, item.color);
      if (!groupsMap.has(key)) {
        const skuPrefix = `${(item.brand || "GEN").toUpperCase().replace(/[^A-Z0-9]/g, "").substring(0, 5)}-${(item.materialType || "PLA").toUpperCase().replace(/\+/g, "P").replace(/[^A-Z0-9]/g, "").substring(0, 4)}-${(item.color || "BLK").toUpperCase().replace(/[^A-Z0-9]/g, "").substring(0, 3)}`;
        groupsMap.set(key, {
          key,
          brand: item.brand,
          materialType: item.materialType,
          color: item.color,
          colorHex: item.colorHex,
          skuPrefix,
          spools: [],
        });
      }

      const group = groupsMap.get(key)!;
      const sequenceNum = group.spools.length + 1;
      const generatedSku = item.sku && /-[0-9]{3}$/.test(item.sku)
        ? item.sku
        : generateSpoolSku(item.brand, item.materialType, item.color, sequenceNum);

      group.spools.push({
        ...item,
        sequenceNum,
        generatedSku,
      });
    });

    const result: Array<{
      key: string;
      brand: string;
      materialType: string;
      color: string;
      colorHex: string | null;
      skuPrefix: string;
      spools: (InventoryItem & { sequenceNum: number; generatedSku: string })[];
      totalSpools: number;
      totalCurrentWeight: number;
      totalInitialWeight: number;
      percent: number;
      hasReady: boolean;
      hasLow: boolean;
      isAllEmpty: boolean;
    }> = [];

    groupsMap.forEach((group) => {
      const matchSearch =
        search === "" ||
        group.brand.toLowerCase().includes(search.toLowerCase()) ||
        group.color.toLowerCase().includes(search.toLowerCase()) ||
        group.materialType.toLowerCase().includes(search.toLowerCase()) ||
        group.skuPrefix.toLowerCase().includes(search.toLowerCase()) ||
        group.spools.some((s) => s.generatedSku.toLowerCase().includes(search.toLowerCase()));

      const matchMaterial =
        selectedMaterial === "all" || group.materialType === selectedMaterial;

      const matchBrand =
        selectedBrand === "all" ||
        group.brand.trim().toLowerCase() === selectedBrand.trim().toLowerCase();

      if (!matchSearch || !matchMaterial || !matchBrand) return;

      const matchingSpools = group.spools.filter((spool) => {
        if (stockStatus === "all") return true;
        if (stockStatus === "in_stock") return spool.currentWeight > (spool.lowStockThreshold || 100);
        if (stockStatus === "low") return spool.currentWeight <= (spool.lowStockThreshold || 100) && spool.currentWeight > 0;
        if (stockStatus === "empty") return spool.currentWeight <= 0;
        return true;
      });

      if (matchingSpools.length === 0) return;

      const totalCurrentWeight = matchingSpools.reduce((sum, s) => sum + (s.currentWeight || 0), 0);
      const totalInitialWeight = matchingSpools.reduce((sum, s) => sum + (s.initialWeight || 1000), 0);
      const percent = Math.min(100, Math.round((totalCurrentWeight / (totalInitialWeight || 1)) * 100));

      const hasReady = matchingSpools.some((s) => s.currentWeight > (s.lowStockThreshold || 100));
      const hasLow = matchingSpools.some((s) => s.currentWeight <= (s.lowStockThreshold || 100) && spoolWeightIsLow(s));
      const isAllEmpty = matchingSpools.every((s) => s.currentWeight <= 0);

      result.push({
        ...group,
        spools: matchingSpools,
        totalSpools: matchingSpools.length,
        totalCurrentWeight,
        totalInitialWeight,
        percent,
        hasReady,
        hasLow,
        isAllEmpty,
      });
    });

    return result;
  }, [items, search, selectedMaterial, selectedBrand, stockStatus]);

  function spoolWeightIsLow(s: InventoryItem) {
    return s.currentWeight <= (s.lowStockThreshold || 100) && s.currentWeight > 0;
  }

  // Auto-expand all groups on first load
  useEffect(() => {
    if (groupedFilaments.length > 0 && openGroupKeys.size === 0) {
      setOpenGroupKeys(new Set(groupedFilaments.map((g) => g.key)));
    }
  }, [groupedFilaments]);

  const packagingAssets = useMemo(() => {
    return assets.filter(
      (a) =>
        a.category?.toLowerCase() === "packing" ||
        a.category?.toLowerCase() === "packaging" ||
        a.category?.toLowerCase() === "production"
    );
  }, [assets]);

  const filteredAssets = useMemo(() => {
    return packagingAssets.filter(
      (a) =>
        search === "" ||
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        (a.size && a.size.toLowerCase().includes(search.toLowerCase()))
    );
  }, [packagingAssets, search]);

  // Overall Filament Valuation & Weight Analytics
  const filamentStats = useMemo(() => {
    let totalInitialWeightG = 0;
    let totalCurrentWeightG = 0;
    let totalCostInitial = 0;
    let totalValueRemaining = 0;

    items.forEach((item) => {
      const initW = item.initialWeight || 1000;
      const currW = item.currentWeight || 0;
      const ppg = item.pricePerGram || 135;
      totalInitialWeightG += initW;
      totalCurrentWeightG += currW;
      totalCostInitial += initW * ppg;
      totalValueRemaining += currW * ppg;
    });

    const totalUsedWeightG = Math.max(0, totalInitialWeightG - totalCurrentWeightG);
    const totalCostUsed = Math.max(0, totalCostInitial - totalValueRemaining);

    const usedPercent = totalInitialWeightG > 0 ? (totalUsedWeightG / totalInitialWeightG) * 100 : 0;
    const remainingPercent = totalInitialWeightG > 0 ? (totalCurrentWeightG / totalInitialWeightG) * 100 : 0;

    return {
      totalSpools: items.length,
      // Total Initial Purchases
      totalInitialWeightKg: (totalInitialWeightG / 1000).toFixed(2),
      totalCostInitial: Math.round(totalCostInitial),
      // Used / Printed
      totalUsedWeightKg: (totalUsedWeightG / 1000).toFixed(2),
      totalCostUsed: Math.round(totalCostUsed),
      usedPercent: usedPercent.toFixed(1),
      // Remaining Stock
      totalRemainingWeightKg: (totalCurrentWeightG / 1000).toFixed(2),
      totalValueRemaining: Math.round(totalValueRemaining),
      remainingPercent: remainingPercent.toFixed(1),
    };
  }, [items]);

  const totalSpools = items.length;
  const lowStockCount = items.filter(
    (i) => i.currentWeight <= (i.lowStockThreshold || 100) && i.currentWeight > 0
  ).length;
  const emptyCount = items.filter((i) => i.currentWeight <= 0).length;
  const totalWeightKg = (
    items.reduce((acc, i) => acc + (i.currentWeight || 0), 0) / 1000
  ).toFixed(1);

  // Submit Filament
  const handleSubmitFilament = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!filamentForm.brand || !filamentForm.materialType || !filamentForm.color) {
      alert("Brand, material, dan nama warna wajib diisi!");
      return;
    }

    try {
      const payload = {
        brand: filamentForm.brand,
        materialType: filamentForm.materialType,
        color: filamentForm.color,
        colorHex: filamentForm.colorHex,
        initialWeight: parseFloat(filamentForm.initialWeight) || 1000,
        currentWeight: parseFloat(filamentForm.currentWeight) || 1000,
        price: parseFloat(filamentForm.price) || 0,
        purchaseDate: filamentForm.purchaseDate,
        productLink: filamentForm.productLink || null,
        lowStockThreshold: parseInt(filamentForm.lowStockThreshold) || 100,
        syncTransaction: syncFilamentTx,
      };

      const res = await fetch("/api/flow/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Gagal menambah spul filamen");

      // Persist newly entered brand in localStorage for future transactions & spools
      try {
        const brandTrimmed = filamentForm.brand.trim();
        if (brandTrimmed) {
          const raw = localStorage.getItem("gooos_filament_brands");
          const arr: string[] = raw ? JSON.parse(raw) : [];
          if (!COMMON_FILAMENT_BRANDS.some((b) => b.toLowerCase() === brandTrimmed.toLowerCase()) &&
              !arr.some((b) => b.toLowerCase() === brandTrimmed.toLowerCase())) {
            arr.push(brandTrimmed);
            localStorage.setItem("gooos_filament_brands", JSON.stringify(arr));
          }
        }
      } catch (e) {}

      triggerSuccess(
        `Spul ${payload.brand} ${payload.materialType} (${payload.color}) berhasil ditambahkan${
          syncFilamentTx && payload.price > 0 ? " dan otomatis tercatat di Buku Kas!" : "!"
        }`
      );
      setShowFilamentModal(false);
      loadData();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  // Submit Packaging
  const handleSubmitPackaging = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!packagingForm.name) {
      alert("Nama barang kemasan / produksi wajib diisi!");
      return;
    }

    try {
      const numPrice = parseFloat(packagingForm.price) || 0;
      const numQty = parseInt(packagingForm.quantity) || 1;
      const payload = {
        name: packagingForm.name,
        category: packagingForm.category,
        size: packagingForm.size || null,
        quantity: numQty,
        price: numPrice,
        purchaseDate: packagingForm.purchaseDate,
        notes: packagingForm.notes || null,
        productLink: packagingForm.productLink || null,
        syncTransaction: syncPackagingTx,
      };

      const res = await fetch("/api/flow/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Gagal menyimpan aset kemasan");

      triggerSuccess(
        `Aset ${payload.name} berhasil disimpan${
          syncPackagingTx && numPrice > 0 ? " dan otomatis tercatat di Buku Kas!" : "!"
        }`
      );
      setShowPackagingModal(false);
      loadData();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  // ⚖️ Open Quick Tare Weigh Modal
  const handleOpenWeighModal = (item: InventoryItem) => {
    const matched = getMatchedTare(item.brand);
    const tare = matched ? matched.emptyWeight : 200;
    setSelectedTareWeight(tare);
    setWeighModalItem(item);
    setScaleGrossWeight(String(Math.round((item.currentWeight || 0) + tare)));
    setCustomTareInput("");
  };

  // ⚖️ Save Weighed Weight from Scale
  const handleSaveWeighedWeight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weighModalItem) return;
    try {
      setIsSubmittingWeight(true);
      const effectiveTare =
        selectedTareWeight === -1 ? Number(customTareInput) || 0 : selectedTareWeight;
      const netWeight = Math.max(0, (Number(scaleGrossWeight) || 0) - effectiveTare);

      const res = await fetch(`/api/flow/inventory/${weighModalItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentWeight: netWeight }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Gagal mengupdate berat filamen");

      setItems((prev) =>
        prev.map((i) =>
          i.id === weighModalItem.id ? { ...i, currentWeight: netWeight } : i
        )
      );
      triggerSuccess(
        `✓ Sisa berat ${weighModalItem.brand} ${weighModalItem.color} berhasil diupdate: ${netWeight}g (Timbangan ${scaleGrossWeight}g - Spul ${effectiveTare}g)!`
      );
      setWeighModalItem(null);
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsSubmittingWeight(false);
    }
  };

  // ✏️ Open Edit Modal
  const handleOpenEditModal = (item: InventoryItem) => {
    setEditingItem(item);
    const matched = getMatchedTare(item.brand);
    const tare = matched ? matched.emptyWeight : 200;
    setEditSpoolTare(tare);
    setEditGrossScale(String(Math.round((item.currentWeight || 0) + tare)));
    setEditForm({
      brand: item.brand,
      materialType: item.materialType,
      color: item.color,
      colorHex: item.colorHex || "#111827",
      currentWeight: String(item.currentWeight),
      initialWeight: String(item.initialWeight),
      price: String(Math.round((item.pricePerGram || 0) * (item.initialWeight || 1000))),
      purchaseDate: item.purchaseDate
        ? new Date(item.purchaseDate).toISOString().split("T")[0]
        : (item.createdAt ? new Date(item.createdAt).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]),
      lowStockThreshold: String(item.lowStockThreshold || 100),
      productLink: item.productLink || "",
    });
  };

  // ✏️ Save Edit Filament
  const handleSaveEditFilament = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    try {
      setIsSubmittingEdit(true);
      const initialW = parseFloat(editForm.initialWeight) || 1000;
      const priceTotal = parseFloat(editForm.price) || 0;
      const ppg = initialW > 0 ? priceTotal / initialW : 0;

      const res = await fetch(`/api/flow/inventory/${editingItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand: editForm.brand,
          materialType: editForm.materialType,
          color: editForm.color,
          colorHex: editForm.colorHex,
          currentWeight: parseFloat(editForm.currentWeight) || 0,
          initialWeight: initialW,
          pricePerGram: ppg,
          lowStockThreshold: parseInt(editForm.lowStockThreshold) || 100,
          productLink: editForm.productLink || null,
          purchaseDate: editForm.purchaseDate,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Gagal mengupdate spul");

      triggerSuccess(`✓ Data spul ${editForm.brand} ${editForm.color} berhasil diperbarui!`);
      setEditingItem(null);
      loadData();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // 🗑️ Delete Filament
  const handleDeleteFilament = async (item: InventoryItem) => {
    if (
      !window.confirm(
        `Apakah Anda yakin ingin menghapus spul filamen ${item.brand} ${item.materialType} (${item.color})?`
      )
    ) {
      return;
    }
    try {
      const res = await fetch(`/api/flow/inventory/${item.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Gagal menghapus spul");

      triggerSuccess(`Spul filamen ${item.brand} ${item.color} berhasil dihapus.`);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <GooNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6 overflow-x-hidden">
        {/* Success Alert Banner */}
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

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                Inventaris &amp; Stok
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {items.length} Spul • {packagingAssets.length} Aset Kemasan
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
              Inventaris Spul Filamen &amp; Aset
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Pemantauan stok spul filamen (gauge gramasi real-time), kardus packaging, dan perlengkapan produksi.
              Semua penambahan baru otomatis tersinkron ke Buku Kas &amp; Transaksi.
            </p>
          </div>

          {/* Action Buttons & Subtabs */}
          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
            <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800 shadow-md">
              <button
                onClick={() => handleSelectTab("filament")}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                  activeTab === "filament"
                    ? "bg-rose-600 text-white shadow-md shadow-rose-600/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                🧵 Spul Filamen ({items.length})
              </button>
              <button
                onClick={() => handleSelectTab("equipment")}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                  activeTab === "equipment"
                    ? "bg-rose-600 text-white shadow-md shadow-rose-600/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                📦 Aset Packaging ({packagingAssets.length})
              </button>
            </div>

            <Link
              href="/settings?tab=gooflow"
              className="px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white flex items-center gap-1.5 transition-all shadow-sm"
              title="Kelola Master Bobot Spul Kosong (Tare Weights)"
            >
              <Scale className="w-3.5 h-3.5 text-rose-400" />
              <span>Master Bobot Spul ({settings.spoolWeights?.length || 5})</span>
            </Link>
            <button
              onClick={() => {
                setIsScannerOpen(true);
                setScannedSpool(null);
                setBarcodeInputText("");
              }}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-rose-300 border border-rose-500/30 hover:border-rose-500/50 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
              title="Scan Barcode Spul Filamen & Update Berat Cepat"
            >
              <ScanLine className="w-4 h-4 text-rose-400" />
              <span>Scan Barcode</span>
            </button>
            <button
              onClick={() => setShowPackagingModal(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Boxes className="w-3.5 h-3.5 text-amber-400" />
              <span>+ Aset Kemasan</span>
            </button>
            <button
              onClick={() => setShowFilamentModal(true)}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-rose-600/30"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tambah Filamen</span>
            </button>
          </div>
        </div>

        {activeTab === "filament" ? (
          <>
            {/* ══════════════════════════════════════════════════════════════════ */}
            {/* RINGKASAN ANALISIS PEMBELIAN, PENGGUNAAN & SISA FILAMEN            */}
            {/* ══════════════════════════════════════════════════════════════════ */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 rounded-3xl border border-slate-800 p-5 sm:p-6 shadow-2xl space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1 font-mono">
                      <Sparkles className="w-3 h-3 text-indigo-400" />
                      <span>Analisis Pembelian &amp; Nilai Aset Filamen</span>
                    </span>
                    <span className="text-xs text-slate-400 font-mono">Real-time Valuation</span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-black text-white tracking-tight mt-1">
                    Ringkasan Filamen: Pembelian, Pemakaian, &amp; Sisa Stok
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Statistik komparasi berat fisik (kg) dan nilai modal (biaya beli awal, terpakai cetak, serta nilai aset sisa di rak).
                  </p>
                </div>

                <div className="flex items-center gap-2 bg-slate-950 px-3.5 py-2 rounded-2xl border border-slate-800/80 text-xs font-mono self-start sm:self-auto">
                  <span className="text-slate-400">Terpakai:</span>
                  <span className="font-bold text-rose-400">{filamentStats.usedPercent}%</span>
                  <span className="text-slate-600">/</span>
                  <span className="text-slate-400">Sisa:</span>
                  <span className="font-bold text-emerald-400">{filamentStats.remainingPercent}%</span>
                </div>
              </div>

              {/* 3 Main Valuation Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Card 1: Total Pembelian */}
                <div className="bg-slate-950/70 rounded-2xl p-4 border border-indigo-500/30 relative overflow-hidden space-y-3 group hover:border-indigo-500/50 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5 uppercase tracking-wider font-mono">
                      <Package className="w-4 h-4 text-indigo-400" />
                      <span>Total Pernah Dibeli</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-mono">
                      {filamentStats.totalSpools} Spul
                    </span>
                  </div>

                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl sm:text-3xl font-black text-white font-mono">
                        {filamentStats.totalInitialWeightKg}
                      </span>
                      <span className="text-sm font-bold text-slate-400 font-mono">kg</span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      ({Math.round(parseFloat(filamentStats.totalInitialWeightKg) * 1000).toLocaleString()} Gram Pembelian)
                    </p>
                  </div>

                  <div className="pt-2.5 border-t border-slate-800/80 flex justify-between items-center text-xs">
                    <span className="text-slate-400">Total Biaya Beli:</span>
                    <span className="font-black text-indigo-300 font-mono text-sm">
                      Rp {filamentStats.totalCostInitial.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Card 2: Filamen Terpakai */}
                <div className="bg-slate-950/70 rounded-2xl p-4 border border-rose-500/30 relative overflow-hidden space-y-3 group hover:border-rose-500/50 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5 uppercase tracking-wider font-mono">
                      <Flame className="w-4 h-4 text-rose-400" />
                      <span>Filamen Telah Terpakai</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/10 text-rose-300 border border-rose-500/20 font-mono">
                      {filamentStats.usedPercent}% Volume
                    </span>
                  </div>

                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl sm:text-3xl font-black text-rose-400 font-mono">
                        {filamentStats.totalUsedWeightKg}
                      </span>
                      <span className="text-sm font-bold text-slate-400 font-mono">kg</span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      ({Math.round(parseFloat(filamentStats.totalUsedWeightKg) * 1000).toLocaleString()} Gram Dicetak)
                    </p>
                  </div>

                  <div className="pt-2.5 border-t border-slate-800/80 flex justify-between items-center text-xs">
                    <span className="text-slate-400">Biaya Filamen Terpakai:</span>
                    <span className="font-black text-rose-400 font-mono text-sm">
                      Rp {filamentStats.totalCostUsed.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Card 3: Sisa Stok Filamen */}
                <div className="bg-slate-950/70 rounded-2xl p-4 border border-emerald-500/30 relative overflow-hidden space-y-3 group hover:border-emerald-500/50 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5 uppercase tracking-wider font-mono">
                      <Layers className="w-4 h-4 text-emerald-400" />
                      <span>Sisa Stok Tersedia</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-mono">
                      {filamentStats.remainingPercent}% Sisa
                    </span>
                  </div>

                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
                        {filamentStats.totalRemainingWeightKg}
                      </span>
                      <span className="text-sm font-bold text-slate-400 font-mono">kg</span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      ({Math.round(parseFloat(filamentStats.totalRemainingWeightKg) * 1000).toLocaleString()} Gram di Rak)
                    </p>
                  </div>

                  <div className="pt-2.5 border-t border-slate-800/80 flex justify-between items-center text-xs">
                    <span className="text-slate-400">Nilai Aset Stok Sisa:</span>
                    <span className="font-black text-emerald-400 font-mono text-sm">
                      Rp {filamentStats.totalValueRemaining.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Visual Split Ratio Bar */}
              <div className="space-y-1.5 pt-1">
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-[11px] font-mono">
                  <span className="text-rose-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                    Terpakai: <strong>{filamentStats.totalUsedWeightKg} kg</strong> (Rp {filamentStats.totalCostUsed.toLocaleString()})
                  </span>
                  <span className="text-emerald-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                    Sisa di Rak: <strong>{filamentStats.totalRemainingWeightKg} kg</strong> (Rp {filamentStats.totalValueRemaining.toLocaleString()})
                  </span>
                </div>
                <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800 flex shadow-inner">
                  <div
                    className="bg-gradient-to-r from-rose-600 to-rose-500 h-full transition-all"
                    style={{ width: `${filamentStats.usedPercent}%` }}
                    title={`Terpakai: ${filamentStats.usedPercent}%`}
                  />
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all"
                    style={{ width: `${filamentStats.remainingPercent}%` }}
                    title={`Sisa: ${filamentStats.remainingPercent}%`}
                  />
                </div>
              </div>
            </div>

            {/* Metrics Row (Status Filter) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div
                onClick={() => handleSetStockStatus("all")}
                className={`p-4 rounded-3xl border cursor-pointer transition-all ${
                  stockStatus === "all"
                    ? "bg-rose-950/20 border-rose-500/40 ring-1 ring-rose-500/30"
                    : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-xs font-bold">Total Spul</span>
                  {stockStatus === "all" && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300">
                      Aktif
                    </span>
                  )}
                </div>
                <p className="text-2xl font-black text-white mt-1 font-mono">{totalSpools}</p>
                <span className="text-[10px] text-slate-400">Total Berat: {totalWeightKg} kg</span>
              </div>

              <div
                onClick={() => handleSetStockStatus("in_stock")}
                className={`p-4 rounded-3xl border cursor-pointer transition-all relative overflow-hidden ${
                  stockStatus === "in_stock"
                    ? "bg-emerald-950/30 border-emerald-500 ring-2 ring-emerald-500/30 shadow-lg shadow-emerald-950/50"
                    : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-emerald-400 text-xs font-bold flex items-center gap-1.5">
                    <span>Stok Cukup</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Default
                    </span>
                  </span>
                  {stockStatus === "in_stock" && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                      Aktif
                    </span>
                  )}
                </div>
                <p className="text-2xl font-black text-emerald-400 mt-1 font-mono">
                  {totalSpools - lowStockCount - emptyCount}
                </p>
                <span className="text-[10px] text-slate-400">&gt; 100g sisa (Siap Cetak)</span>
              </div>

              <div
                onClick={() => handleSetStockStatus("low")}
                className={`p-4 rounded-3xl border cursor-pointer transition-all ${
                  stockStatus === "low"
                    ? "bg-amber-950/20 border-amber-500/40 ring-1 ring-amber-500/30"
                    : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-amber-400 text-xs font-bold">Menipis (Low)</span>
                  {stockStatus === "low" && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
                      Aktif
                    </span>
                  )}
                </div>
                <p className="text-2xl font-black text-amber-400 mt-1 font-mono">{lowStockCount}</p>
                <span className="text-[10px] text-slate-400">&le; 100g tersisa</span>
              </div>

              <div
                onClick={() => handleSetStockStatus("empty")}
                className={`p-4 rounded-3xl border cursor-pointer transition-all ${
                  stockStatus === "empty"
                    ? "bg-rose-950/20 border-rose-500/40 ring-1 ring-rose-500/30"
                    : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-rose-400 text-xs font-bold">Habis (0g)</span>
                  {stockStatus === "empty" && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300">
                      Aktif
                    </span>
                  )}
                </div>
                <p className="text-2xl font-black text-rose-400 mt-1 font-mono">{emptyCount}</p>
                <span className="text-[10px] text-slate-400">Perlu restock</span>
              </div>
            </div>

            {/* Filter & Inventory Control Card */}
            <div className="bg-slate-900/70 rounded-3xl border border-slate-800 p-4 sm:p-5 space-y-4 shadow-xl">
              {/* Row 1: Search Bar & View Mode Toggle */}
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Cari SKU, merek, warna, tipe filamen..."
                    value={search}
                    onChange={(e) => handleSetSearch(e.target.value)}
                    className="w-full pl-10 pr-9 py-2.5 text-xs rounded-2xl bg-slate-950/80 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-all"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => handleSetSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
                      title="Hapus pencarian"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* View Mode Toggle: Grouped vs Flat List */}
                <div className="flex items-center bg-slate-950 p-1 rounded-2xl border border-slate-800 shrink-0 self-start sm:self-auto shadow-inner">
                  <button
                    type="button"
                    onClick={() => handleSetViewMode("grouped")}
                    className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
                      viewMode === "grouped"
                        ? "bg-rose-600 text-white shadow-md shadow-rose-600/30"
                        : "text-slate-400 hover:text-white"
                    }`}
                    title="Kelompokkan spul berdasarkan Brand + Tipe + Warna"
                  >
                    <Boxes className="w-3.5 h-3.5" />
                    <span>Dikelompokkan</span>
                    <span className="text-[10px] opacity-80 font-mono">({groupedFilaments.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetViewMode("list")}
                    className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
                      viewMode === "list"
                        ? "bg-rose-600 text-white shadow-md shadow-rose-600/30"
                        : "text-slate-400 hover:text-white"
                    }`}
                    title="Tampilan daftar semua spul individual"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>Semua Spul</span>
                    <span className="text-[10px] opacity-80 font-mono">({filteredItems.length})</span>
                  </button>
                </div>
              </div>

              {/* Row 2: Material Tabs */}
              <div className="pt-2 border-t border-slate-800/70 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-slate-400 uppercase tracking-wider text-[11px]">
                    <Layers className="w-3.5 h-3.5 text-rose-500" />
                    <span>Material:</span>
                  </div>
                  {selectedMaterial !== "all" && (
                    <button
                      type="button"
                      onClick={() => handleSetSelectedMaterial("all")}
                      className="text-[11px] font-bold text-rose-400 hover:text-rose-300 hover:underline"
                    >
                      Tampilkan Semua Material
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                  {materials.map((mat) => (
                    <button
                      key={mat}
                      type="button"
                      onClick={() => handleSetSelectedMaterial(mat)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all uppercase shrink-0 ${
                        selectedMaterial === mat
                          ? "bg-rose-600 text-white shadow-md shadow-rose-600/30 ring-1 ring-rose-500"
                          : "bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800/80 border border-slate-800"
                      }`}
                    >
                      {mat === "all" ? "Semua Material" : mat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Row 3: Brand Grouping Tabs */}
              <div className="pt-2 border-t border-slate-800/70 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-slate-400 uppercase tracking-wider text-[11px]">
                    <Sparkles className="w-3.5 h-3.5 text-rose-500" />
                    <span>Merek Filamen:</span>
                  </div>
                  {selectedBrand !== "all" && (
                    <button
                      type="button"
                      onClick={() => handleSetSelectedBrand("all")}
                      className="text-[11px] font-bold text-rose-400 hover:text-rose-300 hover:underline"
                    >
                      Tampilkan Semua Merek
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                  {brandsWithCounts.map((b) => {
                    const isSelected = selectedBrand.toLowerCase() === b.name.toLowerCase();
                    return (
                      <button
                        key={b.name}
                        type="button"
                        onClick={() => handleSetSelectedBrand(b.name)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all flex items-center gap-2 shrink-0 ${
                          isSelected
                            ? "bg-rose-600 text-white shadow-md shadow-rose-600/30 ring-1 ring-rose-500"
                            : "bg-slate-950 text-slate-300 hover:text-white hover:bg-slate-800/80 border border-slate-800"
                        }`}
                      >
                        <span>{b.label}</span>
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                            isSelected ? "bg-white/20 text-white" : "bg-slate-800 text-slate-400"
                          }`}
                        >
                          {b.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Row 4: Active Filter Summary & Reset All */}
              {(stockStatus !== "all" || selectedMaterial !== "all" || selectedBrand !== "all" || search !== "") && (
                <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2.5 text-xs bg-slate-950/40 -mx-4 -mb-4 sm:-mx-5 sm:-mb-5 p-3 sm:px-5 rounded-b-3xl">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-slate-400 font-semibold text-[11px] flex items-center gap-1">
                      <Sliders className="w-3.5 h-3.5 text-rose-500" />
                      <span>Filter Aktif:</span>
                    </span>

                    {stockStatus !== "all" && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-800/90 text-slate-200 border border-slate-700">
                        <span>
                          {stockStatus === "in_stock"
                            ? "Stok Cukup (>100g)"
                            : stockStatus === "low"
                            ? "Menipis (≤100g)"
                            : "Habis (0g)"}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleSetStockStatus("all")}
                          className="text-slate-400 hover:text-rose-400 font-black ml-0.5"
                          title="Hapus filter status"
                        >
                          ×
                        </button>
                      </span>
                    )}

                    {selectedMaterial !== "all" && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-800/90 text-slate-200 border border-slate-700">
                        <span>Material: {selectedMaterial}</span>
                        <button
                          type="button"
                          onClick={() => handleSetSelectedMaterial("all")}
                          className="text-slate-400 hover:text-rose-400 font-black ml-0.5"
                          title="Hapus filter material"
                        >
                          ×
                        </button>
                      </span>
                    )}

                    {selectedBrand !== "all" && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-800/90 text-slate-200 border border-slate-700">
                        <span>Merek: {selectedBrand}</span>
                        <button
                          type="button"
                          onClick={() => handleSetSelectedBrand("all")}
                          className="text-slate-400 hover:text-rose-400 font-black ml-0.5"
                          title="Hapus filter merek"
                        >
                          ×
                        </button>
                      </span>
                    )}

                    {search && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-800/90 text-slate-200 border border-slate-700">
                        <span>Cari: &ldquo;{search}&rdquo;</span>
                        <button
                          type="button"
                          onClick={() => handleSetSearch("")}
                          className="text-slate-400 hover:text-rose-400 font-black ml-0.5"
                          title="Hapus filter pencarian"
                        >
                          ×
                        </button>
                      </span>
                    )}

                    <span className="text-[11px] text-slate-400 font-mono ml-1">
                      (Ditemukan {filteredItems.length} dari {items.length} spul)
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      handleSetStockStatus("all");
                      handleSetSelectedMaterial("all");
                      handleSetSelectedBrand("all");
                      handleSetSearch("");
                    }}
                    className="text-xs font-bold text-rose-400 hover:text-rose-300 hover:underline ml-auto"
                  >
                    Reset Semua Filter
                  </button>
                </div>
              )}
            </div>

            {/* Spool Cards Grid or Grouped Accordion */}
            {loading ? (
              <div className="text-center py-20 bg-slate-900/40 rounded-3xl border border-slate-800 text-slate-400 text-sm">
                Memuat data inventaris spul filamen...
              </div>
            ) : viewMode === "grouped" ? (
              groupedFilaments.length === 0 ? (
                <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-dashed border-slate-800 text-slate-400 text-xs">
                  Tidak ada spul filamen yang cocok dengan filter. Klik &ldquo;+ Tambah Filamen&rdquo; untuk mendaftarkan spul baru.
                </div>
              ) : (
                <div className="space-y-4">
                  {groupedFilaments.map((group) => {
                    const isOpen = openGroupKeys.has(group.key);
                    const isLight = isLightColorHex(group.colorHex);
                    return (
                      <div
                        key={group.key}
                        className="rounded-3xl border overflow-hidden shadow-xl hover:border-slate-600/60 transition-all"
                        style={{
                          backgroundColor: "#090d16",
                          borderColor: group.colorHex ? `${group.colorHex}45` : "#1e293b",
                        }}
                      >
                        {/* Group Header Banner (Full Filament Color) */}
                        <div
                          onClick={() => toggleGroupOpen(group.key)}
                          className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:brightness-95 transition-all select-none"
                          style={{
                            backgroundColor: group.colorHex || "#1e293b",
                            boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.25), 0 2px 8px rgba(0, 0, 0, 0.15)",
                          }}
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            {/* Logo Merk (Always crisp on its white card) */}
                            <FilamentBrandLogo brand={group.brand} size="md" />

                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  className={`text-base sm:text-lg font-black tracking-tight ${
                                    isLight ? "text-slate-950" : "text-white"
                                  }`}
                                >
                                  {group.materialType} • {group.color}
                                </span>
                                <span
                                  className={`text-[11px] font-mono px-2 py-0.5 rounded-md font-bold ${
                                    isLight
                                      ? "text-slate-950 bg-black/15 border border-black/25"
                                      : "text-white bg-black/40 border border-white/20 backdrop-blur-sm"
                                  }`}
                                >
                                  SKU: {group.skuPrefix}-XXX
                                </span>
                              </div>
                              <p
                                className={`text-xs mt-1 flex items-center gap-2 flex-wrap font-medium ${
                                  isLight ? "text-slate-800" : "text-white/85"
                                }`}
                              >
                                <span className={`font-black ${isLight ? "text-slate-950" : "text-white"}`}>
                                  {group.brand}
                                </span>
                                <span className="opacity-60">•</span>
                                <span>
                                  Total Spul:{" "}
                                  <strong className={`font-mono font-bold ${isLight ? "text-slate-950" : "text-white"}`}>
                                    {group.totalSpools} Spul
                                  </strong>
                                </span>
                                <span className="opacity-60">•</span>
                                <span>
                                  Sisa Bersih:{" "}
                                  <strong
                                    className={`font-mono font-black ${
                                      isLight ? "text-emerald-950" : "text-emerald-300"
                                    }`}
                                  >
                                    {group.totalCurrentWeight.toLocaleString()}g
                                  </strong>{" "}
                                  <span className="opacity-75">/ {group.totalInitialWeight.toLocaleString()}g</span>
                                </span>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 self-end md:self-auto shrink-0">
                            {/* Mini Stock Progress */}
                            <div className="w-32 hidden sm:block space-y-1">
                              <div
                                className={`flex justify-between text-[10px] font-mono font-bold ${
                                  isLight ? "text-slate-900" : "text-white/90"
                                }`}
                              >
                                <span>Stok Sisa</span>
                                <span>{group.percent}%</span>
                              </div>
                              <div
                                className={`w-full h-2 rounded-full overflow-hidden ${
                                  isLight ? "bg-black/20 border border-black/15" : "bg-black/40 border border-white/20"
                                }`}
                              >
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    group.isAllEmpty ? "bg-rose-500" : group.hasLow ? "bg-amber-400" : "bg-emerald-500"
                                  }`}
                                  style={{ width: `${group.percent}%` }}
                                />
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                                  isLight
                                    ? group.isAllEmpty
                                      ? "bg-rose-600 text-white shadow-sm border border-rose-700"
                                      : group.hasLow
                                      ? "bg-amber-600 text-white shadow-sm border border-amber-700"
                                      : "bg-emerald-600 text-white shadow-sm border border-emerald-700"
                                    : group.isAllEmpty
                                    ? "bg-rose-500/30 text-rose-200 border border-rose-400/40 backdrop-blur-sm"
                                    : group.hasLow
                                    ? "bg-amber-500/30 text-amber-200 border border-amber-400/40 backdrop-blur-sm"
                                    : "bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 backdrop-blur-sm"
                                }`}
                              >
                                {group.isAllEmpty ? "Semua Habis" : group.hasLow ? "Ada Menipis" : "Ready"}
                              </span>
                              <div
                                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                                  isLight
                                    ? "bg-black/15 text-slate-950 hover:bg-black/25"
                                    : "bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm"
                                }`}
                              >
                                {isOpen ? <ChevronUp className="w-4 h-4 stroke-[2.5]" /> : <ChevronDown className="w-4 h-4 stroke-[2.5]" />}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Group Spools Subgrid Accordion Body */}
                        {isOpen && (
                          <div className="border-t border-slate-800/80 p-4 sm:p-5 bg-slate-950/70">
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                              {group.spools.map((spool) => {
                                const percent = Math.min(
                                  100,
                                  Math.round(((spool.currentWeight || 0) / (spool.initialWeight || 1000)) * 100)
                                );
                                const isLow =
                                  spool.currentWeight <= (spool.lowStockThreshold || 100) && spool.currentWeight > 0;
                                const isEmpty = spool.currentWeight <= 0;
                                const matchedTare = getMatchedTare(spool.brand);
                                const tareWeight = matchedTare.emptyWeight;
                                const effectiveDate = spool.purchaseDate || spool.createdAt || spool.updatedAt;
                                const ageFormatted = formatAge(effectiveDate);
                                const purchaseDateFormatted = formatDateIndo(effectiveDate);

                                return (
                                  <div
                                    key={spool.id}
                                    className="bg-slate-900/80 rounded-2xl border border-slate-800 p-3.5 shadow-lg space-y-3 flex flex-col justify-between hover:border-slate-700 transition-all"
                                  >
                                    <div className="space-y-2">
                                      <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                                          #Spul {spool.sequenceNum} • Seri {String(spool.sequenceNum).padStart(3, "0")}
                                        </span>
                                        <span
                                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                            isEmpty
                                              ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                              : isLow
                                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                              : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                          }`}
                                        >
                                          {isEmpty ? "Habis" : isLow ? "Menipis" : "Ready"}
                                        </span>
                                      </div>

                                      <div className="flex items-center gap-2.5">
                                        <FilamentBrandLogo brand={spool.brand} size="sm" />
                                        <div className="min-w-0">
                                          <p className="font-mono font-black text-xs text-white truncate">
                                            {spool.sku || spool.generatedSku}
                                          </p>
                                          <p className="text-[11px] text-slate-400 truncate">
                                            {spool.materialType} • {spool.color}
                                          </p>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Weight Gauge */}
                                    <div className="space-y-2 pt-2 border-t border-slate-800">
                                      <div className="flex justify-between items-baseline text-xs">
                                        <span className="font-bold font-mono text-white text-sm">
                                          {spool.currentWeight}g
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-mono">
                                          / {spool.initialWeight}g ({percent}%)
                                        </span>
                                      </div>
                                      <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
                                        <div
                                          className={`h-full rounded-full transition-all ${
                                            isEmpty ? "bg-rose-500" : isLow ? "bg-amber-500" : "bg-emerald-500"
                                          }`}
                                          style={{ width: `${percent}%` }}
                                        />
                                      </div>

                                      {/* Age & Tare */}
                                      <div className="text-[10px] text-slate-400 space-y-0.5 bg-slate-950/60 p-2 rounded-xl border border-slate-800/80 font-mono">
                                        <div className="flex justify-between">
                                          <span>Umur:</span>
                                          <span className="text-indigo-300 font-bold">{ageFormatted}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span>Tare Spul:</span>
                                          <span className="text-rose-300 font-bold">-{tareWeight}g ({matchedTare.brand})</span>
                                        </div>
                                      </div>

                                      {/* Buttons */}
                                      <div className="grid grid-cols-2 gap-1.5 pt-1">
                                        <button
                                          type="button"
                                          onClick={() => handleOpenWeighModal(spool)}
                                          className="px-2 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-300 font-bold text-[11px] flex items-center justify-center gap-1 transition-all"
                                          title="Timbang & Tare"
                                        >
                                          <Scale className="w-3 h-3" />
                                          <span>Timbang</span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setBarcodeStickerSpool(spool)}
                                          className="px-2 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 font-bold text-[11px] flex items-center justify-center gap-1 transition-all"
                                          title="Print Stiker Barcode & SKU Thermal"
                                        >
                                          <Printer className="w-3 h-3" />
                                          <span>Stiker</span>
                                        </button>
                                      </div>

                                      <div className="flex items-center gap-1.5">
                                        <button
                                          type="button"
                                          onClick={() => handleOpenEditModal(spool)}
                                          className="flex-1 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold flex items-center justify-center gap-1"
                                        >
                                          <Edit2 className="w-3 h-3" />
                                          <span>Edit</span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteFilament(spool)}
                                          className="p-1 rounded-lg bg-slate-800/60 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-dashed border-slate-800 text-slate-400 text-xs">
                Tidak ada spul filamen yang cocok dengan filter. Klik &ldquo;+ Tambah Filamen&rdquo; untuk mendaftarkan spul baru.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredItems.map((item) => {
                  const percent = Math.min(
                    100,
                    Math.round(((item.currentWeight || 0) / (item.initialWeight || 1000)) * 100)
                  );
                  const isLow =
                    item.currentWeight <= (item.lowStockThreshold || 100) && item.currentWeight > 0;
                  const isEmpty = item.currentWeight <= 0;
                  const matchedTare = getMatchedTare(item.brand);
                  const tareWeight = matchedTare.emptyWeight;
                  const effectiveDate = item.purchaseDate || item.createdAt || item.updatedAt;
                  const ageFormatted = formatAge(effectiveDate);
                  const purchaseDateFormatted = formatDateIndo(effectiveDate);

                  return (
                    <div
                      key={item.id}
                      className="bg-slate-900/60 rounded-3xl border border-slate-800 p-4 shadow-xl hover:border-slate-700 transition-all space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold border border-slate-700">
                            {item.brand}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                              isEmpty
                                ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                : isLow
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            }`}
                          >
                            {isEmpty ? "Habis" : isLow ? "Menipis" : "Ready"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <FilamentBrandLogo brand={item.brand} size="sm" />
                          <div
                            className="w-8 h-8 rounded-full border border-white/20 shadow-md shrink-0"
                            style={{ backgroundColor: item.colorHex || "#3b82f6" }}
                          />
                          <div className="min-w-0">
                            <h3 className="font-bold text-sm text-white leading-tight truncate">
                              {item.materialType}
                            </h3>
                            <p className="text-xs text-slate-400 font-medium truncate">{item.color}</p>
                          </div>
                        </div>
                      </div>

                      {/* Weight Gauge & Progress */}
                      <div className="space-y-2.5 pt-3 border-t border-slate-800">
                        <div className="flex justify-between items-baseline text-xs">
                          <span className="font-bold font-mono text-base text-white">
                            {item.currentWeight}g
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            / {item.initialWeight}g ({percent}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isEmpty ? "bg-rose-500" : isLow ? "bg-amber-500" : "bg-emerald-500"
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                          <span>SKU: {item.sku}</span>
                          {item.pricePerGram > 0 && <span>Rp{Math.round(item.pricePerGram)}/g</span>}
                        </div>

                        {/* Umur Tiap Filament Badge */}
                        <div className="flex items-center justify-between text-[11px] bg-slate-950/70 px-2.5 py-1.5 rounded-xl border border-slate-800/80">
                          <span className="flex items-center gap-1.5 text-slate-400">
                            <Clock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                            <span>Umur Filamen:</span>
                          </span>
                          <span
                            className="font-mono font-bold text-indigo-300 flex items-center gap-1"
                            title={`Tanggal Pembelian: ${purchaseDateFormatted}`}
                          >
                            <span>{ageFormatted}</span>
                            <span className="text-[10px] text-slate-500 font-normal">({purchaseDateFormatted})</span>
                          </span>
                        </div>

                        {/* Spool Tare Information Badge */}
                        <div className="flex items-center justify-between text-[11px] text-slate-400 bg-slate-950/70 px-2.5 py-1.5 rounded-xl border border-slate-800/80">
                          <span className="flex items-center gap-1.5 text-slate-400">
                            <Scale className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                            <span>Bobot Spul Kosong:</span>
                          </span>
                          <span className="font-mono font-bold text-rose-300">
                            -{tareWeight}g ({matchedTare.brand})
                          </span>
                        </div>

                        {/* Card Action Buttons */}
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleOpenWeighModal(item)}
                            className="px-2.5 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95"
                            title="Timbang di timbangan digital & kurangi berat spul otomatis"
                          >
                            <Scale className="w-3.5 h-3.5" />
                            <span>Timbang &amp; Tare</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setBarcodeStickerSpool(item)}
                            className="px-2.5 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95"
                            title="Print Stiker Barcode & SKU Thermal"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Stiker SKU</span>
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(item)}
                            className="flex-1 px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-1 transition-all"
                            title="Edit data filamen"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteFilament(item)}
                            className="p-2 rounded-xl bg-slate-800/50 hover:bg-rose-500/15 border border-slate-700/50 hover:border-rose-500/30 text-slate-400 hover:text-rose-400 transition-all"
                            title="Hapus spul dari inventaris"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          /* Equipment & Packaging Assets Tab */
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-slate-900/80 border border-slate-800 rounded-2xl text-xs text-slate-300">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">🖨️</span>
                <div>
                  <p className="font-semibold text-white">Workshop &amp; Tools Telah Dipisahkan</p>
                  <p className="text-slate-400 text-[11px]">
                    Alat pendukung (tools/drybox/glue stick) &amp; suku cadang printer kini dikelola di halaman Armada 3D Printer.
                  </p>
                </div>
              </div>
              <Link
                href="/printers"
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-600/20 whitespace-nowrap self-end sm:self-auto"
              >
                Lihat Fleet &amp; Workshop &rarr;
              </Link>
            </div>

            <div className="bg-slate-900/60 rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
              <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                <input
                  type="text"
                  placeholder="Cari kardus packaging, mail wrap, zip pouch..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="max-w-md w-full px-4 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none"
                />
                <span className="text-xs text-slate-400 font-medium">
                  {filteredAssets.length} Aset Kemasan
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider font-mono">
                    <tr>
                      <th className="py-3 px-4">Nama Aset Kemasan</th>
                      <th className="py-3 px-4">Kategori</th>
                      <th className="py-3 px-4">Ukuran / Dimensi</th>
                      <th className="py-3 px-4">Stok Unit</th>
                      <th className="py-3 px-4">Biaya Satuan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredAssets.map((asset) => (
                      <tr key={asset.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-bold text-white">{asset.name}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300 capitalize">
                            {asset.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400 font-mono">{asset.size || "-"}</td>
                        <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                          {asset.quantity} unit
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-300">
                          Rp {Math.round(asset.price || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ══════════════════════════════════════════ */}
      {/* MODAL: TAMBAH SPUL FILAMEN BARU            */}
      {/* ══════════════════════════════════════════ */}
      {showFilamentModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-white">Tambah Spul Filamen Baru</h3>
                  <p className="text-[11px] text-slate-400">
                    Pencatatan inventaris filamen dengan sinkronisasi Buku Kas
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowFilamentModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitFilament} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Brand / Merk <span className="text-rose-400">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    {filamentForm.brand ? (
                      <FilamentBrandLogo brand={filamentForm.brand} size="sm" />
                    ) : null}
                    <input
                      type="text"
                      list="inventory-brands-list"
                      placeholder="eSUN / Sunlu / Bambu Lab / KREAfil"
                      value={filamentForm.brand}
                      onChange={(e) =>
                        setFilamentForm((prev) => ({ ...prev, brand: e.target.value }))
                      }
                      required
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                  <datalist id="inventory-brands-list">
                    {COMMON_FILAMENT_BRANDS.map((b) => (
                      <option key={b} value={b} />
                    ))}
                  </datalist>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {["eSUN", "Sunlu", "Bambu Lab", "Polymaker", "KREAfil", "Prusament", "Creality", "Elegoo", "Kingroon"].map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setFilamentForm((prev) => ({ ...prev, brand: b }))}
                        className={`px-2 py-0.5 rounded text-[9px] font-semibold border transition-all ${
                          filamentForm.brand.toLowerCase() === b.toLowerCase()
                            ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                            : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Jenis Material <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={filamentForm.materialType}
                    onChange={(e) =>
                      setFilamentForm((prev) => ({ ...prev, materialType: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="PLA">PLA</option>
                    <option value="PLA+">PLA+</option>
                    <option value="PLA Matte">PLA Matte</option>
                    <option value="PETG">PETG</option>
                    <option value="ABS">ABS</option>
                    <option value="TPU">TPU</option>
                    <option value="ASA">ASA</option>
                    <option value="PC">PC</option>
                    <option value="Wood">Wood</option>
                    <option value="Nylon">Nylon (PA)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Nama Warna <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Black, Jade White, Grey"
                    value={filamentForm.color}
                    onChange={(e) =>
                      setFilamentForm((prev) => ({ ...prev, color: e.target.value }))
                    }
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Color Hex
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={filamentForm.colorHex}
                      onChange={(e) =>
                        setFilamentForm((prev) => ({ ...prev, colorHex: e.target.value }))
                      }
                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                    />
                    <input
                      type="text"
                      value={filamentForm.colorHex}
                      onChange={(e) =>
                        setFilamentForm((prev) => ({ ...prev, colorHex: e.target.value }))
                      }
                      className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 font-mono text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Berat Awal Spul (Gram)
                  </label>
                  <input
                    type="number"
                    placeholder="1000"
                    value={filamentForm.initialWeight}
                    onChange={(e) =>
                      setFilamentForm((prev) => ({
                        ...prev,
                        initialWeight: e.target.value,
                        currentWeight: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Berat Sekarang (Gram)
                  </label>
                  <input
                    type="number"
                    placeholder="1000"
                    value={filamentForm.currentWeight}
                    onChange={(e) =>
                      setFilamentForm((prev) => ({ ...prev, currentWeight: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              {/* Asisten Timbangan Tare Spul di Tambah Filamen */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5 font-mono">
                    <Scale className="w-3.5 h-3.5" />
                    <span>Asisten Timbangan &amp; Potong Bobot Spul</span>
                  </span>
                  <span className="text-[9px] text-slate-500 font-mono">Hitung Netto Otomatis</span>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">
                      Pilih Spul / Tare Kosong
                    </label>
                    <select
                      value={addSpoolTare}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setAddSpoolTare(val);
                        if (addGrossScale) {
                          const gross = Number(addGrossScale) || 0;
                          const net = Math.max(0, gross - val);
                          setFilamentForm((prev) => ({
                            ...prev,
                            initialWeight: String(net),
                            currentWeight: String(net),
                          }));
                        }
                      }}
                      className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-slate-900 border border-slate-800 text-white"
                    >
                      {settings.spoolWeights?.map((sp) => (
                        <option key={sp.id} value={sp.emptyWeight}>
                          {sp.brand} {sp.type} (-{sp.emptyWeight}g)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">
                      Angka Timbangan (Kotor)
                    </label>
                    <input
                      type="number"
                      placeholder="Contoh: 1220 (g)"
                      value={addGrossScale}
                      onChange={(e) => {
                        const grossStr = e.target.value;
                        setAddGrossScale(grossStr);
                        if (grossStr) {
                          const net = Math.max(0, (Number(grossStr) || 0) - addSpoolTare);
                          setFilamentForm((prev) => ({
                            ...prev,
                            initialWeight: String(net),
                            currentWeight: String(net),
                          }));
                        }
                      }}
                      className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-slate-900 border border-slate-800 text-white font-mono"
                    />
                  </div>
                </div>
                {addGrossScale && (
                  <div className="text-[11px] text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 flex items-center justify-between">
                    <span>Hasil Berat Bersih (Netto):</span>
                    <span className="font-mono font-bold">
                      {addGrossScale}g - {addSpoolTare}g = {Math.max(0, Number(addGrossScale) - addSpoolTare)}g
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Harga Beli Spul (Rp) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="150000"
                    value={filamentForm.price}
                    onChange={(e) =>
                      setFilamentForm((prev) => ({ ...prev, price: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Tanggal Beli
                  </label>
                  <input
                    type="date"
                    value={filamentForm.purchaseDate}
                    onChange={(e) =>
                      setFilamentForm((prev) => ({ ...prev, purchaseDate: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Link Toko / Produk (Opsional)
                </label>
                <input
                  type="url"
                  placeholder="https://tokopedia.com/..."
                  value={filamentForm.productLink}
                  onChange={(e) =>
                    setFilamentForm((prev) => ({ ...prev, productLink: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              {/* Auto sync to Transactions checkbox */}
              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-xs">
                <input
                  type="checkbox"
                  id="syncFilamentTx"
                  checked={syncFilamentTx}
                  onChange={(e) => setSyncFilamentTx(e.target.checked)}
                  className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 bg-slate-900 border-slate-700 cursor-pointer"
                />
                <label htmlFor="syncFilamentTx" className="text-slate-300 cursor-pointer select-none">
                  Otomatis catat pengeluaran di <strong>Buku Kas &amp; Transaksi</strong> (Rp{" "}
                  {Number(filamentForm.price || 0).toLocaleString()})
                </label>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowFilamentModal(false)}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30"
                >
                  Simpan Spul Filamen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════ */}
      {/* MODAL: TAMBAH ASET KEMASAN / PRODUKSI      */}
      {/* ══════════════════════════════════════════ */}
      {showPackagingModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                  <Boxes className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-white">Tambah Aset Kemasan &amp; Packaging</h3>
                  <p className="text-[11px] text-slate-400">
                    Pencatatan kardus, mail wrap, zip pouch &amp; otomatis masuk Buku Kas
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPackagingModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitPackaging} className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Kategori Aset <span className="text-rose-400">*</span>
                </label>
                <select
                  value={packagingForm.category}
                  onChange={(e) =>
                    setPackagingForm((prev) => ({
                      ...prev,
                      category: e.target.value as "packing" | "production",
                    }))
                  }
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="packing">Kemasan (Packaging / Kardus / Mailer / Pouch)</option>
                  <option value="production">Perlengkapan Produksi (Production Supplies)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Nama Barang <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Cardboard 20X15X10, Mail Wrap 30X50 HD"
                  value={packagingForm.name}
                  onChange={(e) =>
                    setPackagingForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Ukuran / Dimensi
                  </label>
                  <input
                    type="text"
                    placeholder="20X15X10 cm"
                    value={packagingForm.size}
                    onChange={(e) =>
                      setPackagingForm((prev) => ({ ...prev, size: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Jumlah Unit (Qty)
                  </label>
                  <input
                    type="number"
                    value={packagingForm.quantity}
                    onChange={(e) =>
                      setPackagingForm((prev) => ({ ...prev, quantity: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Harga Satuan (Rp)
                  </label>
                  <input
                    type="number"
                    placeholder="1500"
                    value={packagingForm.price}
                    onChange={(e) =>
                      setPackagingForm((prev) => ({ ...prev, price: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Tanggal Beli
                  </label>
                  <input
                    type="date"
                    value={packagingForm.purchaseDate}
                    onChange={(e) =>
                      setPackagingForm((prev) => ({ ...prev, purchaseDate: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Catatan / Link Produk
                </label>
                <input
                  type="text"
                  placeholder="Keterangan toko / link pembelian..."
                  value={packagingForm.notes}
                  onChange={(e) =>
                    setPackagingForm((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Auto sync to Transactions checkbox */}
              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-xs">
                <input
                  type="checkbox"
                  id="syncPackagingTx"
                  checked={syncPackagingTx}
                  onChange={(e) => setSyncPackagingTx(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 bg-slate-900 border-slate-700 cursor-pointer"
                />
                <label htmlFor="syncPackagingTx" className="text-slate-300 cursor-pointer select-none">
                  Otomatis catat pengeluaran di <strong>Buku Kas &amp; Transaksi</strong> (Total: Rp{" "}
                  {(
                    (Number(packagingForm.price) || 0) * (Number(packagingForm.quantity) || 1)
                  ).toLocaleString()}
                  )
                </label>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPackagingModal(false)}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/30"
                >
                  Simpan Aset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* MODAL: ASISTEN TIMBANGAN & POTONG BERAT SPUL (QUICK WEIGH & TARE)  */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {weighModalItem && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-5 text-slate-100 animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-white">Timbang &amp; Potong Berat Spul</h3>
                  <p className="text-[11px] text-slate-400">
                    Kalkulasi sisa filamen murni dari timbangan digital
                  </p>
                </div>
              </div>
              <button
                onClick={() => setWeighModalItem(null)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Spool Info Bar */}
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-7 h-7 rounded-full border border-white/20 shadow-sm shrink-0"
                  style={{ backgroundColor: weighModalItem.colorHex || "#3b82f6" }}
                />
                <div>
                  <div className="text-xs font-bold text-white leading-tight">
                    {weighModalItem.brand} {weighModalItem.materialType}
                  </div>
                  <div className="text-[10px] text-slate-400">{weighModalItem.color} • SKU: {weighModalItem.sku}</div>
                </div>
              </div>
              <div className="text-right font-mono">
                <div className="text-[10px] text-slate-500 uppercase">Saat Ini</div>
                <div className="text-xs font-bold text-slate-300">{weighModalItem.currentWeight}g</div>
              </div>
            </div>

            <form onSubmit={handleSaveWeighedWeight} className="space-y-4">
              {/* Step 1: Input Gross Scale Weight */}
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1 flex items-center justify-between">
                  <span>1. Angka Timbangan Digital (Berat Kotor)</span>
                  <span className="text-[10px] text-rose-400 font-normal">Spul + Filamen</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="1"
                    min="0"
                    placeholder="Contoh: 680"
                    value={scaleGrossWeight}
                    onChange={(e) => setScaleGrossWeight(e.target.value)}
                    required
                    autoFocus
                    className="w-full px-4 py-3 text-base rounded-2xl bg-slate-950 border border-slate-800 text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                  />
                  <span className="absolute right-4 top-3.5 text-xs font-mono font-bold text-slate-500">
                    gram
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Letakkan spul langsung di atas timbangan digital dan ketik angka totalnya di atas.
                </p>
              </div>

              {/* Step 2: Select Spool Tare */}
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1 flex items-center justify-between">
                  <span>2. Pilih Bobot Kosong Spul (Tare Weight)</span>
                  <Link
                    href="/settings?tab=gooflow"
                    className="text-[10px] text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <span>Kelola Master</span>
                  </Link>
                </label>
                <select
                  value={selectedTareWeight}
                  onChange={(e) => setSelectedTareWeight(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                >
                  {settings.spoolWeights?.map((sp) => (
                    <option key={sp.id} value={sp.emptyWeight}>
                      {sp.brand} {sp.type} (-{sp.emptyWeight}g tare)
                    </option>
                  ))}
                  <option value={-1}>⚙️ Input Manual Berat Tare Spul Lainnya...</option>
                </select>

                {selectedTareWeight === -1 && (
                  <div className="mt-2">
                    <input
                      type="number"
                      placeholder="Masukkan bobot tare manual (gram)"
                      value={customTareInput}
                      onChange={(e) => setCustomTareInput(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                    />
                  </div>
                )}
              </div>

              {/* Live Calculation Result Box */}
              {(() => {
                const effectiveTare =
                  selectedTareWeight === -1 ? Number(customTareInput) || 0 : selectedTareWeight;
                const gross = Number(scaleGrossWeight) || 0;
                const net = Math.max(0, gross - effectiveTare);
                const initW = weighModalItem.initialWeight || 1000;
                const pct = Math.min(100, Math.round((net / initW) * 100));

                return (
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-950/30 via-slate-950 to-slate-950 border border-rose-500/30 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Formula Potongan:</span>
                      <span className="font-mono text-slate-300">
                        {gross}g (Kotor) - {effectiveTare}g (Spul)
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between pt-1 border-t border-slate-800/80">
                      <div>
                        <div className="text-[10px] uppercase font-bold tracking-wider text-rose-400 font-mono">
                          Sisa Berat Bersih (Netto)
                        </div>
                        <div className="text-2xl font-black text-white font-mono mt-0.5">
                          {net} <span className="text-sm font-normal text-slate-400">gram</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {pct}% Tersisa
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setWeighModalItem(null)}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingWeight}
                  className="px-5 py-2.5 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {isSubmittingWeight ? "Menyimpan..." : "Simpan Sisa Berat"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* MODAL: EDIT DATA SPUL FILAMEN                              */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {editingItem && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-white">Edit Data Spul Filamen</h3>
                  <p className="text-[11px] text-slate-400">
                    Ubah gramasi, warna, harga, atau potong berat timbangan
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditFilament} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Brand / Merk <span className="text-rose-400">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    {editForm.brand ? (
                      <FilamentBrandLogo brand={editForm.brand} size="sm" />
                    ) : null}
                    <input
                      type="text"
                      list="edit-inventory-brands-list"
                      value={editForm.brand}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, brand: e.target.value }))}
                      required
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <datalist id="edit-inventory-brands-list">
                    {COMMON_FILAMENT_BRANDS.map((b) => (
                      <option key={b} value={b} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Jenis Material <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={editForm.materialType}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, materialType: e.target.value }))}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Nama Warna <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={editForm.color}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, color: e.target.value }))}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Color Hex
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={editForm.colorHex}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, colorHex: e.target.value }))}
                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                    />
                    <input
                      type="text"
                      value={editForm.colorHex}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, colorHex: e.target.value }))}
                      className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 font-mono text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Asisten Timbangan Tare di Form Edit */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5 font-mono">
                    <Scale className="w-3.5 h-3.5" />
                    <span>Asisten Timbangan &amp; Potong Bobot Spul</span>
                  </span>
                  <span className="text-[9px] text-slate-500 font-mono">Hitung Netto</span>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">
                      Pilih Tare Spul Kosong
                    </label>
                    <select
                      value={editSpoolTare}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setEditSpoolTare(val);
                        if (editGrossScale) {
                          const gross = Number(editGrossScale) || 0;
                          const net = Math.max(0, gross - val);
                          setEditForm((prev) => ({ ...prev, currentWeight: String(net) }));
                        }
                      }}
                      className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-slate-900 border border-slate-800 text-white"
                    >
                      {settings.spoolWeights?.map((sp) => (
                        <option key={sp.id} value={sp.emptyWeight}>
                          {sp.brand} {sp.type} (-{sp.emptyWeight}g)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">
                      Angka Timbangan (Kotor)
                    </label>
                    <input
                      type="number"
                      placeholder="Contoh: 680"
                      value={editGrossScale}
                      onChange={(e) => {
                        const grossStr = e.target.value;
                        setEditGrossScale(grossStr);
                        if (grossStr) {
                          const net = Math.max(0, (Number(grossStr) || 0) - editSpoolTare);
                          setEditForm((prev) => ({ ...prev, currentWeight: String(net) }));
                        }
                      }}
                      className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-slate-900 border border-slate-800 text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Berat Awal Spul (Gram)
                  </label>
                  <input
                    type="number"
                    value={editForm.initialWeight}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, initialWeight: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Sisa Berat Sekarang (Gram Bersih)
                  </label>
                  <input
                    type="number"
                    value={editForm.currentWeight}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, currentWeight: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white font-mono font-bold text-rose-300 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Harga Pembelian Spul (Rp)
                  </label>
                  <input
                    type="number"
                    value={editForm.price}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, price: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Tanggal Beli / Diterima
                  </label>
                  <input
                    type="date"
                    value={editForm.purchaseDate}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, purchaseDate: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Threshold Stok Rendah (Gram)
                  </label>
                  <input
                    type="number"
                    value={editForm.lowStockThreshold}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, lowStockThreshold: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Link Toko / Marketplace (Opsional)
                  </label>
                  <input
                    type="url"
                    value={editForm.productLink}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, productLink: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSubmittingEdit ? "Menyimpan..." : "Simpan Perubahan"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* MODAL: PRINT STIKER BARCODE & SKU (THERMAL STICKER)               */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {barcodeStickerSpool && (
        <div className="fixed inset-0 z-[220] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-white">Cetak Stiker Barcode Spul</h3>
                  <p className="text-[11px] text-slate-400">
                    Label Barcode Code 128 &amp; SKU Spul Filamen
                  </p>
                </div>
              </div>
              <button
                onClick={() => setBarcodeStickerSpool(null)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Printable Thermal Sticker Preview */}
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex justify-center">
              <div
                id="thermal-spool-sticker"
                className="w-[280px] bg-white text-slate-950 p-4 rounded-xl shadow-lg border border-slate-300 flex flex-col items-center justify-between select-none font-sans"
              >
                {/* Header Sticker */}
                <div className="w-full flex justify-between items-center border-b border-slate-300 pb-1.5 mb-2">
                  <div className="text-left">
                    <span className="font-black text-[12px] tracking-tight block text-slate-950">
                      GOOCANAN GOOFLOW
                    </span>
                    <span className="text-[8px] text-slate-600 block">FILAMENT INVENTORY</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-mono font-bold bg-slate-200 px-1.5 py-0.5 rounded text-slate-800">
                      {barcodeStickerSpool.materialType}
                    </span>
                  </div>
                </div>

                {/* Spool Info */}
                <div className="w-full text-center space-y-0.5 mb-2">
                  <div className="font-black text-[13px] text-slate-900 leading-tight">
                    {barcodeStickerSpool.brand} • {barcodeStickerSpool.color}
                  </div>
                  <div className="text-[9px] text-slate-600 font-mono">
                    Berat Awal: {barcodeStickerSpool.initialWeight || 1000}g • Tare Spul: -{getMatchedTare(barcodeStickerSpool.brand).emptyWeight}g
                  </div>
                </div>

                {/* Barcode SVG */}
                <div className="w-full flex flex-col items-center justify-center py-1">
                  <SpoolBarcodeSvg
                    value={barcodeStickerSpool.sku || barcodeStickerSpool.generatedSku || "SPOOL-001"}
                    height={48}
                    showText={true}
                  />
                </div>

                {/* Footer Sticker */}
                <div className="w-full flex justify-between items-center border-t border-slate-300 pt-1.5 mt-2 text-[8px] text-slate-600 font-mono">
                  <span>Tgl: {formatDateIndo(barcodeStickerSpool.purchaseDate || barcodeStickerSpool.createdAt)}</span>
                  <span>ID: {(barcodeStickerSpool.id || "").slice(0, 8)}</span>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 text-center">
              Stiker kompatibel dengan printer label thermal (50x30mm, 60x40mm, atau A4 Sticker Sheet).
            </p>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setBarcodeStickerSpool(null)}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-800 text-slate-300 hover:text-white"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => {
                  const printContents = document.getElementById("thermal-spool-sticker")?.innerHTML;
                  if (!printContents) return;
                  const printWindow = window.open("", "_blank");
                  if (printWindow) {
                    printWindow.document.write(`
                      <html>
                        <head>
                          <title>Print Label - ${barcodeStickerSpool.sku || "Filament"}</title>
                          <style>
                            @page { size: auto; margin: 4mm; }
                            body { font-family: monospace, sans-serif; margin: 0; padding: 10px; display: flex; justify-content: center; align-items: center; }
                            .print-box { width: 60mm; border: 1px solid #000; padding: 3mm; box-sizing: border-box; text-align: center; }
                            svg { max-width: 100%; height: auto; }
                          </style>
                        </head>
                        <body>
                          <div class="print-box">
                            ${printContents}
                          </div>
                          <script>
                            window.onload = function() {
                              window.print();
                              window.close();
                            };
                          </script>
                        </body>
                      </html>
                    `);
                    printWindow.document.close();
                  }
                }}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Stiker</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* MODAL: BARCODE SCANNER & UPDATE BERAT CEPAT                       */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {isScannerOpen && (
        <div className="fixed inset-0 z-[220] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
                  <ScanLine className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-white">Barcode Scanner Spul Filamen</h3>
                  <p className="text-[11px] text-slate-400">
                    Scan label barcode untuk melihat data spul dan update sisa gramasi
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  stopCamera();
                  setIsScannerOpen(false);
                }}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Input Barcode / Gun Scanner */}
            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    autoFocus
                    placeholder="Scan dengan Barcode Gun atau ketik SKU..."
                    value={barcodeInputText}
                    onChange={(e) => setBarcodeInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleBarcodeSearch(barcodeInputText);
                      }
                    }}
                    className="w-full px-4 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                  {barcodeInputText && (
                    <button
                      onClick={() => setBarcodeInputText("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleBarcodeSearch(barcodeInputText)}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-700 text-white shrink-0"
                >
                  Cari SKU
                </button>
              </div>

              {/* Camera Scanner Toggle */}
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-rose-400" />
                    <span>Scan via Kamera HP / Webcam</span>
                  </span>
                  {!isCameraActive ? (
                    <button
                      type="button"
                      onClick={startCamera}
                      className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                    >
                      Nyalakan Kamera
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-rose-300 rounded-lg text-xs font-bold transition-all"
                    >
                      Matikan Kamera
                    </button>
                  )}
                </div>

                {isCameraActive && (
                  <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-slate-700 flex items-center justify-center">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-8 border-2 border-dashed border-rose-500/80 rounded-xl pointer-events-none flex items-center justify-center">
                      <span className="text-[10px] bg-black/60 px-2 py-1 rounded text-rose-300 font-mono">
                        Arahkan Barcode ke Dalam Kotak
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Scanned Spool Detail & Weight Updater */}
            {scannedSpool && (
              <div className="p-4 bg-slate-950 rounded-2xl border border-rose-500/30 space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-xl border border-white/20 shrink-0"
                      style={{ backgroundColor: scannedSpool.colorHex || "#3b82f6" }}
                    />
                    <div>
                      <h4 className="font-bold text-sm text-white">
                        {scannedSpool.brand} {scannedSpool.materialType} • {scannedSpool.color}
                      </h4>
                      <p className="text-xs font-mono text-rose-400 font-bold">
                        SKU: {scannedSpool.sku || scannedSpool.generatedSku || scannedSpool.id}
                      </p>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-xs text-slate-400 block">Stok Saat Ini:</span>
                    <span className="text-sm font-bold text-emerald-400">
                      {scannedSpool.currentWeight}g
                    </span>
                  </div>
                </div>

                <form onSubmit={handleScanWeightSubmit} className="space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <label className="font-bold text-slate-300">Update Berat Filamen:</label>
                      <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                        <button
                          type="button"
                          onClick={() => setScanWeightMode("gross")}
                          className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                            scanWeightMode === "gross" ? "bg-rose-600 text-white" : "text-slate-400"
                          }`}
                        >
                          Berat Timbangan (Kotor)
                        </button>
                        <button
                          type="button"
                          onClick={() => setScanWeightMode("net")}
                          className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                            scanWeightMode === "net" ? "bg-rose-600 text-white" : "text-slate-400"
                          }`}
                        >
                          Berat Bersih (Netto)
                        </button>
                      </div>
                    </div>

                    <div className="relative">
                      <input
                        type="number"
                        required
                        value={scanWeightInput}
                        onChange={(e) => setScanWeightInput(e.target.value)}
                        placeholder="Contoh: 680"
                        className="w-full px-4 py-2.5 text-base font-mono font-bold rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400">
                        gram
                      </span>
                    </div>

                    {scanWeightMode === "gross" && (
                      <p className="text-[11px] text-slate-400 flex items-center justify-between">
                        <span>Tare Spul: -{getMatchedTare(scannedSpool.brand).emptyWeight}g ({getMatchedTare(scannedSpool.brand).brand})</span>
                        <span className="font-bold text-emerald-400 font-mono">
                          Netto Bersih: {Math.max(0, (Number(scanWeightInput) || 0) - getMatchedTare(scannedSpool.brand).emptyWeight)}g
                        </span>
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isUpdatingScanWeight}
                    className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/30 flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isUpdatingScanWeight ? "Menyimpan..." : "Update Stok Berat Spul"}</span>
                  </button>
                </form>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  setIsScannerOpen(false);
                }}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-800 text-slate-300 hover:text-white"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
