"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { GooNavbar } from "@/components/GooNavbar";
import { useDemoMode } from "@/hooks/use-demo-mode";
import { DemoReadOnlyModal } from "@/components/DemoNoticeBanner";
import {
  Plus,
  Trash2,
  Edit2,
  Search,
  Package,
  Clock,
  Scale,
  Layers,
  Check,
  X,
  Store,
  ShoppingBag,
  ExternalLink,
  Copy,
  Maximize2,
  ShoppingCart,
  ChevronDown,
  ChevronUp,
  Link2,
  FolderPlus,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Eye,
  Zap,
  Wrench,
  UserCheck,
  ShieldAlert,
  Coins,
  SlidersHorizontal,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  Info,
  Dices,
  Tag,
} from "lucide-react";
import { useGooSettings } from "@/hooks/use-goo-settings";
import {
  generateUniqueProductSku,
  generateNextProductOptionSku,
  isValidProductSkuFormat,
} from "@/lib/product-sku";

// ============================================================================
// TYPES
// ============================================================================
interface ComponentItem {
  id: string;
  name: string;
  selectedMaterialId?: string | null;
  customPricePerGram?: number | null;
  modelWeight: number;
  printingTime: number;
  qtyPart: number;
  infill?: string;
  layerHeight?: string;
}

interface ProductOption {
  id: string;
  name: string;
  sku?: string | null;
  pricingMode: "total_modal" | "per_item";
  items: ComponentItem[];
  
  // Tarif Penjualan Jasa Cetak Retail (Marketplace & Direct)
  retailPricePerGram?: number; // Rp / gr (default dari settings.retailPricePerGram || 400)
  retailPricePerHour?: number; // Rp / jam (default dari settings.retailPricePerHour || 3000)
  packagingCost?: number;
  hardwareCost?: number; // baut, magnet, mur, per, dll.
  
  // Commercial, Fees & Manual Override
  taxRate?: number; // marketplace admin fee % (e.g. 7% Tokopedia / 10% Shopee)
  manualPrice?: number | null; // manual price override
  marginMode?: "margin" | "markup";
  marginPercent?: number;

  // Farm Base Parameters for Real HPP / Overhead Analysis
  electricityCostPerKwh?: number;
  printerPowerWatt?: number;
  wearCostPerHour?: number;
  operatorCostPerHour?: number;
  operatorMinutes?: number;
  failureRatePercent?: number;
  
  // Computed values
  modelWeight?: number;
  printingTime?: number;
  qtyPart?: number;
  finalPrice?: number;
  suggestedPrice?: number;
  profit?: number;
  netRevenue?: number;
  taxAmount?: number;
  materialCost?: number;
  materialRetailCost?: number;
  printServiceCost?: number;
  retailSubtotal?: number;
  energyCost?: number;
  wearCost?: number;
  laborCost?: number;
  failureCost?: number;
  baseCost?: number; // Total HPP
  selectedMaterialId?: string | null;
}

interface Product {
  id: string;
  workspaceId?: string;
  userId?: string;
  name: string;
  sku: string | null;
  imageUrl: string | null;
  modelWeight: number;
  printingTime: number;
  materialCost: number;
  energyCost: number;
  wearCost: number;
  packagingCost: number;
  taxRate: number;
  finalPrice: number;
  marginPercent: number;
  manualPrice: number | null;
  category: string | null;
  description: string | null;
  notes: string | null;
  referenceLink: string | null;
  link1: string | null;
  link2: string | null;
  selectedMaterialId: string | null;
  qtyPart: number;
  infill: string | null;
  layerHeight: string | null;
  pricingMode: string | null;
  items?: ComponentItem[];
  options?: ProductOption[];
  createdAt: string;
  updatedAt: string;
}

interface Material {
  id: string;
  sku?: string;
  brand: string;
  materialType: string;
  color: string;
  colorHex?: string | null;
  pricePerGram: number;
}

const formatIDR = (val: number) => "Rp " + Math.round(val || 0).toLocaleString("id-ID");

export default function ProductCatalogPage() {
  const { settings, isLoaded: settingsLoaded } = useGooSettings();
  const { isDemo, blockDemoAction, showDemoModal, setShowDemoModal, blockedAction } = useDemoMode();

  const [products, setProducts] = useState<Product[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [activeCategoryTab, setActiveCategoryTab] = useState("All");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProductDetail, setSelectedProductDetail] = useState<Product | null>(null);
  const [detailActiveOptionIndex, setDetailActiveOptionIndex] = useState(0);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [activeLinkMenu, setActiveLinkMenu] = useState<string | null>(null);
  const [expandedProductItems, setExpandedProductItems] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdvancedParams, setShowAdvancedParams] = useState(false);

  // Category Selection & Custom Categories State
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const [customCategories, setCustomCategories] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("goo_product_categories");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {
        // ignore
      }
    }
    return [
      "General",
      "Aksesoris",
      "Dekorasi",
      "Figure & Toys",
      "Gadget & Setup",
      "Sparepart & Tool",
      "Miniatur",
      "Cosplay",
      "Prototipe",
    ];
  });

  const addCustomCategory = (newCat: string) => {
    const trimmed = newCat.trim();
    if (!trimmed) return;
    setCustomCategories((prev) => {
      const exists = prev.some((c) => c.toLowerCase() === trimmed.toLowerCase());
      if (exists) return prev;
      const next = [...prev, trimmed];
      try {
        localStorage.setItem("goo_product_categories", JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  // Close category dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(e.target as Node)
      ) {
        setIsCategoryOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Form State
  const [activeOptionIndex, setActiveOptionIndex] = useState(0);
  const [formData, setFormData] = useState<{
    name: string;
    sku: string;
    category: string;
    imageUrl: string;
    description: string;
    referenceLink: string;
    link1: string;
    link2: string;
    notes: string;
    options: ProductOption[];
  }>({
    name: "",
    sku: "",
    category: "General",
    imageUrl: "",
    description: "",
    referenceLink: "",
    link1: "",
    link2: "",
    notes: "",
    options: [],
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Fetch all products & materials
  async function loadData() {
    try {
      setLoading(true);
      const [prodRes, invRes] = await Promise.all([
        fetch("/api/flow/products"),
        fetch("/api/flow/inventory"),
      ]);

      const [prodJson, invJson] = await Promise.all([prodRes.json(), invRes.json()]);

      if (prodJson.success) setProducts(prodJson.data);
      if (invJson.success && Array.isArray(invJson.data)) {
        const mapped: Material[] = invJson.data.map((m: any) => ({
          id: m.id,
          sku: m.sku || "",
          brand: m.brand || "Generic",
          materialType: m.materialType || "PLA",
          color: m.color || "Default",
          colorHex: m.colorHex || null,
          pricePerGram:
            Number(m.pricePerGram) > 0
              ? Number(m.pricePerGram)
              : Math.round(Number(m.price || 150000) / (Number(m.initialWeight) || 1000)),
        }));
        setMaterials(mapped);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Combined list of all available categories
  const allAvailableCategories = useMemo(() => {
    const set = new Set<string>();
    customCategories.forEach((c) => c && set.add(c.trim()));
    products.forEach((p) => p.category && set.add(p.category.trim()));
    return Array.from(set).filter(Boolean).sort((a, b) => {
      if (a.toLowerCase() === "general") return -1;
      if (b.toLowerCase() === "general") return 1;
      return a.localeCompare(b);
    });
  }, [products, customCategories]);

  // Categories list for top tabs
  const categories = useMemo(() => {
    const list = new Set<string>();
    products.forEach((p) => p.category && list.add(p.category.trim()));
    customCategories.forEach((c) => c && list.add(c.trim()));
    return [
      "All",
      ...Array.from(list).sort((a, b) => {
        if (a.toLowerCase() === "general") return -1;
        if (b.toLowerCase() === "general") return 1;
        return a.localeCompare(b);
      }),
    ];
  }, [products, customCategories]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat =
        activeCategoryTab === "All" ||
        (p.category || "General").toLowerCase() === activeCategoryTab.toLowerCase();

      const s = search.toLowerCase();
      const matchSearch =
        search === "" ||
        p.name.toLowerCase().includes(s) ||
        (p.sku && p.sku.toLowerCase().includes(s)) ||
        (p.description && p.description.toLowerCase().includes(s)) ||
        (p.notes && p.notes.toLowerCase().includes(s));

      return matchCat && matchSearch;
    });
  }, [products, activeCategoryTab, search]);

  // Helper to create a default item
  const createDefaultItem = (id = `item-${Date.now()}`, name = "Item 1"): ComponentItem => ({
    id,
    name,
    selectedMaterialId: materials[0]?.id || null,
    customPricePerGram: null,
    modelWeight: 50,
    printingTime: 2.5,
    qtyPart: 1,
    infill: "15",
    layerHeight: "0.20",
  });

  // Helper to create a default option
  const createDefaultOption = (
    id = `opt-${Date.now()}`,
    name = "Opsi 1",
    sku = ""
  ): ProductOption => ({
    id,
    name,
    sku,
    pricingMode: "total_modal",
    items: [createDefaultItem(`item-${Date.now()}-1`, "Item 1")],
    retailPricePerGram: settings.retailPricePerGram || 400,
    retailPricePerHour: settings.retailPricePerHour || 3000,
    packagingCost: 2000,
    hardwareCost: 0,
    taxRate: 0,
    manualPrice: null,
    electricityCostPerKwh: settings.electricityCostPerKwh || 1500,
    printerPowerWatt: settings.printerPowerWatt || 150,
    wearCostPerHour: settings.wearCostPerHour || 500,
  });

  // Kalkulasi Harga Jual & Struktur Biaya Berbasis Tarif Penjualan Jasa Cetak Retail (Marketplace & Direct)
  const calculateOptionCosts = (option: ProductOption) => {
    if (!option) return null;

    // 1. Tarif Penjualan Jasa Cetak Retail (Marketplace & Direct) dari Pengaturan Farm
    const retailRateGram = Number(option.retailPricePerGram ?? settings.retailPricePerGram ?? 400);
    const retailRateHour = Number(option.retailPricePerHour ?? settings.retailPricePerHour ?? 3000);
    const packagingCost = Math.max(0, Number(option.packagingCost ?? 0));
    const hardwareCost = Math.max(0, Number(option.hardwareCost ?? 0));
    const packagingTotal = packagingCost + hardwareCost;
    const taxRate = Math.max(0, Number(option.taxRate ?? 0));

    // Parameter Farm Dasar (Untuk analisis Modal Produksi HPP Riil)
    const electricityPriceKwh = Number(option.electricityCostPerKwh ?? settings.electricityCostPerKwh ?? 1500);
    const printerPowerWatt = Number(option.printerPowerWatt ?? settings.printerPowerWatt ?? 150);
    const printerPowerKw = printerPowerWatt / 1000;
    const wearCostPerHour = Number(option.wearCostPerHour ?? settings.wearCostPerHour ?? 500);
    const operatorRatePerHour = Number(option.operatorCostPerHour ?? settings.operatorCostPerHour ?? 25000);
    const operatorMinutes = Math.max(0, Number(option.operatorMinutes ?? settings.operatorMinutesPerJob ?? 10));
    const failureRatePct = Math.max(0, Number(option.failureRatePercent ?? 5));

    let sumSpoolCost = 0;
    let sumEnergyCost = 0;
    let sumWearCost = 0;
    let sumWeight = 0;
    let sumTime = 0;
    let sumQty = 0;

    const itemsCalculated = (option.items || []).map((item) => {
      const mat = materials.find((m) => m.id === item.selectedMaterialId);
      const rawPricePerGram =
        Number(item.customPricePerGram) > 0
          ? Number(item.customPricePerGram)
          : mat?.pricePerGram && Number(mat.pricePerGram) > 0
          ? Number(mat.pricePerGram)
          : 150;

      const qty = Math.max(1, Number(item.qtyPart || 1));
      const w = Math.max(0, Number(item.modelWeight || 0));
      const t = Math.max(0, Number(item.printingTime || 0));

      const lineWeight = w * qty;
      const lineTime = t * qty;

      // Nilai Jasa Cetak Retail (Bahan & Mesin)
      const lineMatRetail = lineWeight * retailRateGram;
      const linePrintRetail = lineTime * retailRateHour;
      const lineRetailTotal = lineMatRetail + linePrintRetail;

      // Nilai Modal Pokok Produksi Farm (HPP Riil)
      const lineSpoolCost = lineWeight * rawPricePerGram;
      const lineEnergyCost = printerPowerKw * lineTime * electricityPriceKwh;
      const lineWearCost = lineTime * wearCostPerHour;
      const lineBaseCost = lineSpoolCost + lineEnergyCost + lineWearCost;

      sumWeight += lineWeight;
      sumTime += lineTime;
      sumQty += qty;
      sumSpoolCost += lineSpoolCost;
      sumEnergyCost += lineEnergyCost;
      sumWearCost += lineWearCost;

      return {
        ...item,
        rawPricePerGram,
        lineWeight,
        lineTime,
        lineMatRetail,
        linePrintRetail,
        lineRetailTotal,
        lineSpoolCost,
        lineEnergyCost,
        lineWearCost,
        lineBaseCost,
        matName: mat
          ? `${mat.brand} ${mat.materialType} • ${mat.color}`
          : item.customPricePerGram
          ? `Kustom (@ Rp ${item.customPricePerGram}/g)`
          : "PLA Standard (@ Rp 150/g)",
        matColorHex: mat?.colorHex || null,
        matBrand: mat?.brand || null,
      };
    });

    // 2. Nilai Jasa Cetak Retail: Bahan Baku & Biaya Cetak dikalikan Tarif Retail
    const materialRetailCost = sumWeight * retailRateGram;
    const printServiceCost = sumTime * retailRateHour;
    const retailSubtotal = materialRetailCost + printServiceCost + packagingTotal;

    // 3. Rekomendasi Harga Jual (Marketplace & Direct)
    // Jika ada fee platform marketplace, harga di-gross up agar penjual tetap menerima subtotal jasa cetak penuh
    const feeFactor = 1 - taxRate / 100;
    let suggestedPrice = feeFactor > 0.1 && taxRate > 0 ? retailSubtotal / feeFactor : retailSubtotal;
    suggestedPrice = Math.round(suggestedPrice);

    // Harga Jual Aktual: manualPrice jika diisi > 0, jika tidak gunakan suggestedPrice
    const manualPrice = Number(option.manualPrice) > 0 ? Number(option.manualPrice) : null;
    const actualPrice = manualPrice && manualPrice > 0 ? manualPrice : suggestedPrice;

    // 4. Potongan & Analisis Profitabilitas Riil
    const taxAmount = actualPrice * (taxRate / 100);
    const netRevenue = actualPrice - taxAmount;

    // Modal Pokok Produksi (HPP Riil Farm)
    const realProductionCost = sumSpoolCost + sumEnergyCost + sumWearCost + packagingTotal;
    const profit = netRevenue - realProductionCost;
    const realMargin = actualPrice > 0 ? (profit / actualPrice) * 100 : 0;
    const realMarkup = realProductionCost > 0 ? (profit / realProductionCost) * 100 : 0;

    // Breakdown persentase proporsi harga jual retail
    const costBreakdown =
      retailSubtotal > 0
        ? {
            matPct: Math.round((materialRetailCost / retailSubtotal) * 100),
            printPct: Math.round((printServiceCost / retailSubtotal) * 100),
            packPct: Math.round((packagingTotal / retailSubtotal) * 100),
            energyPct: Math.round((sumEnergyCost / (realProductionCost || 1)) * 100),
            wearPct: Math.round((sumWearCost / (realProductionCost || 1)) * 100),
            laborPct: 0,
            failurePct: 0,
            packagingPct: Math.round((packagingTotal / retailSubtotal) * 100),
          }
        : { matPct: 50, printPct: 40, packPct: 10, energyPct: 0, wearPct: 0, laborPct: 0, failurePct: 0, packagingPct: 0 };

    return {
      // Tarif Penjualan Jasa Cetak Retail (Marketplace & Direct)
      retailRateGram,
      retailRateHour,
      materialRetailCost,
      printServiceCost,
      materialCost: materialRetailCost, // mapped for backward-compatibility
      energyCost: printServiceCost,     // mapped for backward-compatibility
      wearCost: sumWearCost,
      laborCost: 0,
      failureCost: 0,
      packagingCost,
      hardwareCost,
      packagingTotal,
      retailSubtotal,
      directProductionCost: materialRetailCost + printServiceCost,
      baseCost: realProductionCost,
      totalBaseCost: realProductionCost,
      realProductionCost,
      realSpoolCost: sumSpoolCost,
      realEnergyCost: sumEnergyCost,
      realWearCost: sumWearCost,

      // Penjualan & Pajak
      suggestedPrice,
      actualPrice,
      manualPrice,
      marginMode: option.marginMode || "retail",
      marginPercent: option.marginPercent ?? 60,
      taxRate,
      taxAmount,
      netRevenue,
      grossProfit: actualPrice - realProductionCost,
      profit,
      realMargin,
      realMarkup,
      totalWeight: sumWeight,
      totalTime: sumTime,
      totalQty: sumQty,
      costBreakdown,
      itemsCalculated,
      items: itemsCalculated,
      electricityPriceKwh,
      printerPowerWatt,
      wearCostPerHour,
      operatorRatePerHour,
      operatorMinutes,
      failureRatePct,
    };
  };

  const currentOption =
    formData.options[activeOptionIndex] || formData.options[0] || null;
  const currentOptionCosts = currentOption ? calculateOptionCosts(currentOption) : null;

  // Helper to update parameter on active option
  const handleOptionParamChange = (field: string, val: any) => {
    setFormData((prev) => {
      const nextOptions = [...prev.options];
      if (!nextOptions[activeOptionIndex]) return prev;
      nextOptions[activeOptionIndex] = {
        ...nextOptions[activeOptionIndex]!,
        [field]: val,
      };
      return { ...prev, options: nextOptions };
    });
  };

  // Generate Unique SKU for Top-Level Product (Format: ABC-123)
  const handleGenerateRandomSkuTopLevel = () => {
    const existingCatalogSkus = products.flatMap((p) => [
      p.sku,
      ...(Array.isArray(p.options) ? p.options.map((o: any) => o.sku) : []),
    ]);
    const otherOptionSkus = (formData.options || []).slice(1).map((o) => o.sku);
    const newSku = generateUniqueProductSku([...existingCatalogSkus, ...otherOptionSkus]);

    setFormData((prev) => {
      const nextState = { ...prev, sku: newSku };
      if (prev.options && prev.options.length > 0 && prev.options[0]) {
        const nextOptions = [...prev.options];
        nextOptions[0] = { ...prev.options[0], sku: newSku };
        nextState.options = nextOptions;
      }
      return nextState;
    });
  };

  // Generate Unique SKU for Active Option (Format: ABC-123)
  const handleGenerateRandomOptionSku = () => {
    const existingCatalogSkus = products.flatMap((p) => [
      p.sku,
      ...(Array.isArray(p.options) ? p.options.map((o: any) => o.sku) : []),
    ]);
    const otherOptionSkus = (formData.options || [])
      .filter((_, idx) => idx !== activeOptionIndex)
      .map((o) => o.sku);
    const newSku = generateUniqueProductSku([...existingCatalogSkus, ...otherOptionSkus]);

    setFormData((prev) => {
      const next = [...prev.options];
      if (!next[activeOptionIndex]) return prev;
      next[activeOptionIndex] = { ...next[activeOptionIndex]!, sku: newSku };
      const updates: any = { options: next };
      if (activeOptionIndex === 0) {
        updates.sku = newSku;
      }
      return { ...prev, ...updates };
    });
  };

  // Open Add Product Modal
  const openCreateModal = () => {
    if (blockDemoAction("Tambah Produk Baru")) return;
    setEditingProduct(null);
    setActiveOptionIndex(0);
    setShowAdvancedParams(false);

    // Generate standard SKU with format ABC-123 (3 huruf kapital - 3 angka)
    const existingCatalogSkus = products.flatMap((p) => [
      p.sku,
      ...(Array.isArray(p.options) ? p.options.map((o: any) => o.sku) : []),
    ]);
    const newSku = generateUniqueProductSku(existingCatalogSkus);

    setFormData({
      name: "",
      sku: newSku,
      category: "General",
      imageUrl: "",
      description: "",
      referenceLink: "",
      link1: "",
      link2: "",
      notes: "",
      options: [createDefaultOption("opt-1", "Opsi 1", newSku)],
    });
    setIsModalOpen(true);
  };

  // Open Edit Product Modal
  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setActiveOptionIndex(0);
    setShowAdvancedParams(false);

    let resolvedOptions: ProductOption[] = [];
    if (product.options && Array.isArray(product.options) && product.options.length > 0) {
      resolvedOptions = product.options.map((opt, idx) => ({
        id: opt.id || `opt-${idx + 1}`,
        name: opt.name || `Opsi ${idx + 1}`,
        sku: opt.sku || (idx === 0 ? product.sku : ""),
        pricingMode: opt.pricingMode || "total_modal",
        items:
          opt.items && Array.isArray(opt.items) && opt.items.length > 0
            ? opt.items.map((it: any, itIdx: number) => ({
                id: it.id || `item-${Date.now()}-${itIdx + 1}`,
                name: it.name || `Item ${itIdx + 1}`,
                modelWeight: Number(it.modelWeight) || 0,
                printingTime: Number(it.printingTime) || 0,
                selectedMaterialId: it.selectedMaterialId || null,
                customPricePerGram: it.customPricePerGram ? Number(it.customPricePerGram) : null,
                qtyPart: Number(it.qtyPart) || 1,
                infill: it.infill || "15",
                layerHeight: it.layerHeight || "0.20",
              }))
            : [
                {
                  id: `item-${Date.now()}-1`,
                  name: opt.name || "Item 1",
                  modelWeight: opt.modelWeight || product.modelWeight || 100,
                  printingTime: opt.printingTime || product.printingTime || 3.5,
                  selectedMaterialId:
                    opt.selectedMaterialId || product.selectedMaterialId || materials[0]?.id || null,
                  customPricePerGram: null,
                  qtyPart: opt.qtyPart || product.qtyPart || 1,
                  infill: product.infill || "15",
                  layerHeight: product.layerHeight || "0.20",
                },
              ],
        electricityCostPerKwh: opt.electricityCostPerKwh ?? settings.electricityCostPerKwh ?? 1500,
        printerPowerWatt: opt.printerPowerWatt ?? settings.printerPowerWatt ?? 150,
        wearCostPerHour: opt.wearCostPerHour ?? settings.wearCostPerHour ?? 500,
        operatorCostPerHour: opt.operatorCostPerHour ?? settings.operatorCostPerHour ?? 25000,
        operatorMinutes: opt.operatorMinutes ?? settings.operatorMinutesPerJob ?? 10,
        failureRatePercent: opt.failureRatePercent ?? 5,
        packagingCost: opt.packagingCost ?? product.packagingCost ?? 2000,
        hardwareCost: opt.hardwareCost ?? 0,
        marginMode: opt.marginMode || "margin",
        taxRate: opt.taxRate || product.taxRate || 0,
        marginPercent: opt.marginPercent ?? product.marginPercent ?? 60,
        manualPrice: opt.manualPrice ?? product.manualPrice ?? null,
      }));
    } else {
      const rawItems =
        product.items && Array.isArray(product.items) && product.items.length > 0
          ? product.items.map((it: any, itIdx: number) => ({
              id: it.id || `item-${Date.now()}-${itIdx + 1}`,
              name: it.name || `Item ${itIdx + 1}`,
              modelWeight: Number(it.modelWeight) || 0,
              printingTime: Number(it.printingTime) || 0,
              selectedMaterialId: it.selectedMaterialId || null,
              customPricePerGram: it.customPricePerGram ? Number(it.customPricePerGram) : null,
              qtyPart: Number(it.qtyPart) || 1,
              infill: it.infill || "15",
              layerHeight: it.layerHeight || "0.20",
            }))
          : [
              {
                id: "item-1",
                name: product.name || "Item 1",
                modelWeight: product.modelWeight || 100,
                printingTime: product.printingTime || 3.5,
                selectedMaterialId: product.selectedMaterialId || materials[0]?.id || null,
                customPricePerGram: null,
                qtyPart: product.qtyPart || 1,
                infill: product.infill || "15",
                layerHeight: product.layerHeight || "0.20",
              },
            ];

      resolvedOptions = [
        {
          id: "opt-1",
          name: "Opsi 1",
          sku: product.sku || "",
          pricingMode: "total_modal",
          items: rawItems,
          electricityCostPerKwh: settings.electricityCostPerKwh ?? 1500,
          printerPowerWatt: settings.printerPowerWatt ?? 150,
          wearCostPerHour: settings.wearCostPerHour ?? 500,
          operatorCostPerHour: settings.operatorCostPerHour ?? 25000,
          operatorMinutes: settings.operatorMinutesPerJob ?? 10,
          failureRatePercent: 5,
          packagingCost: product.packagingCost || 2000,
          hardwareCost: 0,
          marginMode: "margin",
          taxRate: product.taxRate || 0,
          marginPercent: product.marginPercent ?? 60,
          manualPrice: product.manualPrice || null,
        },
      ];
    }

    setFormData({
      name: product.name || "",
      sku: product.sku || resolvedOptions[0]?.sku || "",
      category: product.category || "General",
      imageUrl: product.imageUrl || "",
      description: product.description || product.notes || "",
      referenceLink: product.referenceLink || "",
      notes: product.notes || "",
      link1: product.link1 || "",
      link2: product.link2 || "",
      options: resolvedOptions,
    });
    setIsModalOpen(true);
  };

  // Add Option to Form
  const handleAddOption = () => {
    const list = formData.options || [];
    const currentOpt = list[activeOptionIndex] || list[0];
    const nextNum = list.length + 1;

    // Collect all existing SKUs to avoid collision
    const existingCatalogSkus = products.flatMap((p) => [
      p.sku,
      ...(Array.isArray(p.options) ? p.options.map((o: any) => o.sku) : []),
    ]);
    const formOptionSkus = list.map((o) => o.sku);
    const allExisting = [...existingCatalogSkus, ...formOptionSkus];

    const baseSku = currentOpt?.sku || formData.sku || "";
    const newSku = baseSku
      ? generateNextProductOptionSku(baseSku, nextNum, allExisting)
      : generateUniqueProductSku(allExisting);

    const clonedItems = (currentOpt?.items || []).map((it, idx) => ({
      ...it,
      id: `item-${Date.now()}-${idx + 1}`,
    }));

    const newOption: ProductOption = {
      id: `opt-${Date.now()}`,
      name: `Opsi ${nextNum}`,
      sku: newSku,
      pricingMode: currentOpt?.pricingMode || "total_modal",
      items:
        clonedItems.length > 0
          ? clonedItems
          : [createDefaultItem(`item-${Date.now()}-1`, "Item 1")],
      electricityCostPerKwh: currentOpt?.electricityCostPerKwh ?? settings.electricityCostPerKwh ?? 1500,
      printerPowerWatt: currentOpt?.printerPowerWatt ?? settings.printerPowerWatt ?? 150,
      wearCostPerHour: currentOpt?.wearCostPerHour ?? settings.wearCostPerHour ?? 500,
      operatorCostPerHour: currentOpt?.operatorCostPerHour ?? settings.operatorCostPerHour ?? 25000,
      operatorMinutes: currentOpt?.operatorMinutes ?? settings.operatorMinutesPerJob ?? 10,
      failureRatePercent: currentOpt?.failureRatePercent ?? 5,
      packagingCost: currentOpt?.packagingCost ?? 2000,
      hardwareCost: currentOpt?.hardwareCost ?? 0,
      marginMode: currentOpt?.marginMode ?? "margin",
      taxRate: currentOpt?.taxRate ?? 0,
      marginPercent: currentOpt?.marginPercent ?? settings.defaultMarginPercent ?? 60,
      manualPrice: null,
    };

    setFormData((prev) => ({
      ...prev,
      options: [...prev.options, newOption],
    }));
    setActiveOptionIndex(list.length);
  };

  // Remove Option from Form
  const handleRemoveOption = (index: number) => {
    if (formData.options.length <= 1) return;
    setFormData((prev) => ({
      ...prev,
      options: prev.options.filter((_, idx) => idx !== index),
    }));
    setActiveOptionIndex(0);
  };

  // Update Item in Active Option
  const handleItemChange = (itemIdx: number, field: string, val: any) => {
    setFormData((prev) => {
      const nextOptions = [...prev.options];
      const opt = nextOptions[activeOptionIndex];
      if (!opt) return prev;

      const nextItems = [...opt.items];
      const targetItem = nextItems[itemIdx];
      if (!targetItem) return prev;

      nextItems[itemIdx] = {
        ...targetItem,
        [field]: val,
      };

      nextOptions[activeOptionIndex] = {
        ...opt,
        items: nextItems,
      };

      return { ...prev, options: nextOptions };
    });
  };

  // Add Item to Active Option
  const handleAddItem = () => {
    setFormData((prev) => {
      const nextOptions = [...prev.options];
      const opt = nextOptions[activeOptionIndex];
      if (!opt) return prev;

      const nextNum = opt.items.length + 1;
      const newItem = createDefaultItem(`item-${Date.now()}-${nextNum}`, `Item ${nextNum}`);

      nextOptions[activeOptionIndex] = {
        ...opt,
        items: [...opt.items, newItem],
      };

      return { ...prev, options: nextOptions };
    });
  };

  // Remove Item from Active Option
  const handleRemoveItem = (itemIdx: number) => {
    setFormData((prev) => {
      const nextOptions = [...prev.options];
      const opt = nextOptions[activeOptionIndex];
      if (!opt || opt.items.length <= 1) return prev;

      nextOptions[activeOptionIndex] = {
        ...opt,
        items: opt.items.filter((_, idx) => idx !== itemIdx),
      };

      return { ...prev, options: nextOptions };
    });
  };

  // Submit Product Form
  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (blockDemoAction(editingProduct ? "Edit Produk Katalog" : "Tambah Produk Baru")) return;
    if (!formData.name.trim()) {
      alert("Nama produk wajib diisi!");
      return;
    }

    try {
      setIsSubmitting(true);

      const processedOptions = (formData.options || []).map((opt, idx) => {
        const costs = calculateOptionCosts(opt);
        const optWeight = costs?.totalWeight || 0;
        const optTime = costs?.totalTime || 0;
        const optQty = costs?.totalQty || 1;

        return {
          id: opt.id || `opt-${idx + 1}`,
          name: (opt.name || `Opsi ${idx + 1}`).trim(),
          sku: opt.sku?.trim() || null,
          pricingMode: opt.pricingMode || "total_modal",
          items: opt.items || [],
          electricityCostPerKwh: costs?.electricityPriceKwh,
          printerPowerWatt: costs?.printerPowerWatt,
          wearCostPerHour: costs?.wearCostPerHour,
          operatorCostPerHour: costs?.operatorRatePerHour,
          operatorMinutes: costs?.operatorMinutes,
          failureRatePercent: costs?.failureRatePct,
          packagingCost: Number(opt.packagingCost) || 0,
          hardwareCost: Number(opt.hardwareCost) || 0,
          marginMode: opt.marginMode || "margin",
          marginPercent: Math.round(Number(costs?.realMargin ?? opt.marginPercent ?? 60)),
          taxRate: Number(opt.taxRate) || 0,
          manualPrice: Number(opt.manualPrice) > 0 ? Number(opt.manualPrice) : null,
          modelWeight: Number(optWeight),
          printingTime: Number(optTime),
          qtyPart: Number(optQty),
          materialCost: Number(costs?.materialCost) || 0,
          energyCost: Number(costs?.energyCost) || 0,
          wearCost: Number(costs?.wearCost) || 0,
          laborCost: Number(costs?.laborCost) || 0,
          failureCost: Number(costs?.failureCost) || 0,
          baseCost: Number(costs?.baseCost) || 0,
          finalPrice: Number(costs?.actualPrice) || 0,
          suggestedPrice: Number(costs?.suggestedPrice) || 0,
          profit: Number(costs?.profit) || 0,
          netRevenue: Number(costs?.netRevenue) || 0,
        };
      });

      const defaultOpt = processedOptions[0];
      const catToSave = formData.category.trim() || "General";
      addCustomCategory(catToSave);

      const payload = {
        name: formData.name.trim(),
        sku: defaultOpt?.sku || formData.sku.trim() || null,
        imageUrl: formData.imageUrl.trim() || null,
        description: formData.description.trim() || null,
        notes: formData.notes.trim() || null,
        referenceLink: formData.referenceLink.trim() || null,
        link1: formData.link1.trim() || null,
        link2: formData.link2.trim() || null,
        category: catToSave,
        modelWeight: defaultOpt?.modelWeight || 0,
        printingTime: defaultOpt?.printingTime || 0,
        materialCost: defaultOpt?.materialCost || 0,
        energyCost: defaultOpt?.energyCost || 0,
        wearCost: defaultOpt?.wearCost || 0,
        packagingCost: defaultOpt?.packagingCost || 0,
        taxRate: defaultOpt?.taxRate || 0,
        finalPrice: defaultOpt?.finalPrice || 0,
        marginPercent: defaultOpt?.marginPercent ?? 60,
        manualPrice: defaultOpt?.manualPrice || null,
        qtyPart: defaultOpt?.qtyPart || 1,
        pricingMode: defaultOpt?.pricingMode || "total_modal",
        items: defaultOpt?.items || [],
        options: processedOptions,
      };

      if (editingProduct) {
        const res = await fetch(`/api/flow/products/${editingProduct.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error);
        showToast("Produk berhasil diperbarui!");
      } else {
        const res = await fetch("/api/flow/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error);
        showToast("Produk baru berhasil ditambahkan!");
      }

      setIsModalOpen(false);
      setEditingProduct(null);
      loadData();
    } catch (err: any) {
      alert("Gagal menyimpan produk: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Product
  const handleDeleteProduct = async (id: string, name: string) => {
    if (blockDemoAction("Hapus Produk")) return;
    if (!confirm(`Apakah Anda yakin ingin menghapus produk "${name}"?`)) return;

    try {
      const res = await fetch(`/api/flow/products/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      showToast(`Produk "${name}" berhasil dihapus.`);
      if (selectedProductDetail?.id === id) setSelectedProductDetail(null);
      loadData();
    } catch (err: any) {
      alert("Gagal menghapus produk: " + err.message);
    }
  };

  // Copy product specs to clipboard
  const handleCopySpecs = (p: Product) => {
    const text = `📦 *${p.name}*
SKU: ${p.sku || "-"}
Kategori: ${p.category || "General"}
Berat Model: ${p.modelWeight}g
Durasi Cetak: ${p.printingTime} jam
Komponen Parts: ${p.qtyPart || 1} pcs
Harga Jual: ${formatIDR(p.finalPrice)}
${p.referenceLink ? `Ref: ${p.referenceLink}` : ""}`;

    navigator.clipboard.writeText(text);
    showToast("Spesifikasi produk berhasil disalin!");
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

      {/* Header Bar */}
      <div className="bg-slate-900/50 border-b border-slate-800 px-4 sm:px-6 py-5">
        <div className="max-w-7xl mx-auto w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Katalog Produk &amp; Pricing
              </h1>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono">
                {products.length} Model
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Daftar model 3D siap cetak dengan konfigurasi multi-opsi marketplace, multi-komponen, dan kalkulasi COGS
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 active:scale-95 transition-all shrink-0 cursor-pointer"
            title={isDemo ? "Mode Demo: Hanya Lihat" : "Tambah Produk Baru"}
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>{isDemo ? "🔒 + Tambah Produk (Demo)" : "+ Tambah Produk Baru"}</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6 overflow-x-hidden">
        {/* Category Filter & Search Bar */}
        <div className="flex flex-col md:flex-row gap-3 bg-slate-900/50 p-3.5 rounded-2xl border border-slate-800 shadow-md md:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Cari berdasarkan nama produk, SKU, atau deskripsi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <div className="flex items-center gap-1.5 shrink-0">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategoryTab(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                    activeCategoryTab === cat
                      ? "bg-rose-600 text-white border-rose-500 shadow-sm"
                      : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={openCreateModal}
              className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold whitespace-nowrap flex items-center gap-1.5 shadow-md shadow-rose-600/30 transition-all shrink-0 ml-auto"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>+ Tambah Produk</span>
            </button>
          </div>
        </div>

        {/* Product Cards List (Identik dengan GooFlow) */}
        {loading ? (
          <div className="text-center py-24 bg-slate-900/40 rounded-3xl border border-slate-800 text-slate-400 text-sm animate-pulse flex flex-col items-center justify-center gap-3">
            <Package className="w-8 h-8 text-rose-500 animate-bounce" />
            <span>Memuat katalog produk 3D...</span>
          </div>
        ) : error ? (
          <div className="p-6 bg-rose-950/40 text-rose-300 rounded-3xl border border-rose-800 text-sm">
            {error}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-20 text-center text-slate-500 border border-dashed border-slate-800 rounded-3xl bg-slate-900/30">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-30 text-slate-400" />
            <p className="text-base font-bold text-slate-300">Tidak ada produk dalam kategori ini</p>
            <p className="text-xs text-slate-500 mt-1">
              Gunakan tombol "+ Tambah Produk Baru" untuk menambahkan model baru.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredProducts.map((product) => {
              const hasMultipleItems =
                Array.isArray(product.items) && product.items.length > 1;
              const isExpanded = expandedProductItems === product.id;
              const hasMultipleOptions =
                Array.isArray(product.options) && product.options.length > 1;

              const optionPrices = hasMultipleOptions
                ? product.options!
                    .map((o) => Number(o.finalPrice || 0))
                    .filter((p) => p > 0)
                : [];
              const minPrice =
                optionPrices.length > 0 ? Math.min(...optionPrices) : product.finalPrice;
              const maxPrice =
                optionPrices.length > 0 ? Math.max(...optionPrices) : product.finalPrice;
              const hasPriceRange = optionPrices.length > 1 && minPrice !== maxPrice;

              return (
                <div
                  key={product.id}
                  onClick={() => {
                    setSelectedProductDetail(product);
                    setDetailActiveOptionIndex(0);
                  }}
                  className="bg-slate-900/80 rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-xl group hover:border-rose-500/40 transition-all cursor-pointer relative overflow-hidden"
                >
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Product Image Thumbnail */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        if (product.imageUrl) setViewingImage(product.imageUrl);
                      }}
                      className="h-24 w-24 rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shrink-0 relative group/img shadow-inner"
                    >
                      {product.imageUrl ? (
                        <>
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover transition-transform group-hover/img:scale-110"
                          />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                            <Maximize2 className="w-4 h-4 text-white" />
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-700">
                          <Package className="w-8 h-8 opacity-40" />
                        </div>
                      )}
                    </div>

                    {/* Details Main */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <div className="relative flex-1 min-w-0">
                          <h3
                            onClick={(e) => {
                              if (product.link1 || product.link2) {
                                e.stopPropagation();
                                setActiveLinkMenu(
                                  activeLinkMenu === product.id ? null : product.id
                                );
                              }
                            }}
                            className={`font-bold text-base text-white truncate pr-6 group-hover:text-rose-300 transition-colors ${
                              product.link1 || product.link2 ? "hover:underline cursor-pointer" : ""
                            }`}
                          >
                            {product.name}
                            {(product.link1 || product.link2) && (
                              <Link2 className="w-3.5 h-3.5 inline ml-1.5 opacity-60 text-rose-400" />
                            )}
                          </h3>

                          {/* Marketplace Quick Dropdown */}
                          {activeLinkMenu === product.id && (
                            <div
                              onMouseLeave={() => setActiveLinkMenu(null)}
                              onClick={(e) => e.stopPropagation()}
                              className="absolute left-0 top-full mt-2 z-50 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-1.5 min-w-[150px] animate-in fade-in"
                            >
                              {product.link1 && (
                                <a
                                  href={product.link1}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                                >
                                  <Store className="w-3.5 h-3.5" />
                                  <span>TOKOPEDIA</span>
                                </a>
                              )}
                              {product.link2 && (
                                <a
                                  href={product.link2}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-orange-400 hover:bg-orange-500/10 transition-colors"
                                >
                                  <ShoppingBag className="w-3.5 h-3.5" />
                                  <span>SHOPEE</span>
                                </a>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Top-Right Action Buttons */}
                        <div
                          className="flex items-center gap-1.5 shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => handleCopySpecs(product)}
                            className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-all shadow-sm"
                            title="Salin Spesifikasi Teks"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openEditModal(product)}
                            className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/40 transition-all shadow-sm"
                            title="Edit Produk"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id, product.name)}
                            className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/40 transition-all shadow-sm"
                            title="Hapus Produk"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Badges Row */}
                      <div className="flex flex-wrap items-center gap-2 my-2">
                        {hasMultipleOptions && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 border border-rose-500/30 text-rose-300 font-mono">
                            <Layers className="w-3 h-3" />
                            {product.options!.length} Opsi
                          </span>
                        )}

                        <span className="text-xs text-slate-500 font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                          {product.sku || "NO-SKU"}
                        </span>

                        <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-bold">
                          {product.category || "General"}
                        </span>

                        {product.referenceLink && (
                          <a
                            href={
                              product.referenceLink.startsWith("http")
                                ? product.referenceLink
                                : `https://${product.referenceLink}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300 font-mono hover:underline bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20"
                            title="Buka Model Referensi"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Model Ref</span>
                          </a>
                        )}
                      </div>

                      {/* Mini Option Pills Preview */}
                      {hasMultipleOptions && (
                        <div className="flex flex-wrap gap-1.5 mb-2.5">
                          {product.options!.map((opt, oIdx) => (
                            <span
                              key={opt.id || oIdx}
                              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] bg-slate-950 border border-slate-800 text-slate-300"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>
                              <span className="font-medium truncate max-w-[120px]">
                                {opt.name || `Opsi ${oIdx + 1}`}
                              </span>
                              {opt.sku && (
                                <span className="font-mono text-slate-500">({opt.sku})</span>
                              )}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Specs Row & Price / Cart */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
                        <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-slate-400">
                          <div className="flex items-center gap-1">
                            <Scale className="w-3.5 h-3.5 text-slate-500" />
                            <span>{product.modelWeight}g</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-500" />
                            <span>{product.printingTime}h</span>
                          </div>
                          <div className="flex items-center gap-1 text-amber-400 font-bold">
                            <span>{product.qtyPart || 1} parts</span>
                          </div>

                          {product.taxRate > 0 && (
                            <span className="text-[10px] text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                              Tax {product.taxRate}%
                            </span>
                          )}

                          {hasMultipleItems && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedProductItems(isExpanded ? null : product.id);
                              }}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 border border-rose-500/30 text-rose-300 hover:bg-rose-500/20 transition-colors"
                            >
                              <span>{product.items!.length} Komponen</span>
                              {isExpanded ? (
                                <ChevronUp className="w-3 h-3" />
                              ) : (
                                <ChevronDown className="w-3 h-3" />
                              )}
                            </button>
                          )}
                        </div>

                        <div
                          className="flex flex-wrap items-center gap-2 sm:gap-2.5 shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="text-rose-400 font-black font-mono text-base mr-1">
                            {hasPriceRange
                              ? `${formatIDR(minPrice)} - ${formatIDR(maxPrice)}`
                              : formatIDR(product.finalPrice)}
                          </span>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedProductDetail(product);
                              setDetailActiveOptionIndex(0);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-700/80 shadow-sm"
                            title="Buka Detail & Spesifikasi Produk"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-400" />
                            <span>Detail</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => openEditModal(product)}
                            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-700/80 shadow-sm"
                            title="Edit Konfigurasi Produk Ini"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-rose-400" />
                            <span>Edit</span>
                          </button>

                          <Link
                            href={`/orders?modelName=${encodeURIComponent(
                              product.name
                            )}&weight=${product.modelWeight}&time=${product.printingTime}&price=${
                              product.finalPrice
                            }`}
                            className="bg-rose-600/25 hover:bg-rose-600/40 text-rose-300 hover:text-rose-200 border border-rose-500/30 px-3 py-1.5 rounded-xl transition-all active:scale-95 flex items-center gap-1.5 text-xs font-bold shadow-sm"
                            title="Buka di Antrean Cetak & Kalkulator"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                            <span>Cetak Pesanan</span>
                          </Link>
                        </div>
                      </div>

                      {/* Expandable Multi-Item Breakdown */}
                      {hasMultipleItems && isExpanded && (
                        <div
                          className="mt-3 pt-3 border-t border-slate-800 space-y-2 animate-in fade-in"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Rincian Komponen Model ({product.items!.length})
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {product.items!.map((it, idx) => (
                              <div
                                key={it.id || idx}
                                className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs flex justify-between items-center"
                              >
                                <div>
                                  <div className="font-bold text-white truncate max-w-[180px]">
                                    {it.name || `Komponen ${idx + 1}`}
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                    {it.modelWeight}g • {it.printingTime} jam
                                  </div>
                                </div>
                                <span className="text-[10px] bg-slate-900 text-amber-400 font-mono font-bold px-2 py-0.5 rounded border border-slate-800">
                                  {it.qtyPart || 1} pcs
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ==================================================================== */}
      {/* PRODUCT DETAIL MODAL                                                 */}
      {/* ==================================================================== */}
      {selectedProductDetail && (() => {
        const fallbackOption: ProductOption = {
          id: "opt-1",
          name: selectedProductDetail.name || "Opsi 1",
          sku: selectedProductDetail.sku || "",
          pricingMode:
            (selectedProductDetail.pricingMode as "total_modal" | "per_item") ||
            "total_modal",
          items: Array.isArray(selectedProductDetail.items) ? selectedProductDetail.items : [],
          packagingCost: selectedProductDetail.packagingCost || 0,
          taxRate: selectedProductDetail.taxRate || 0,
          marginPercent: selectedProductDetail.marginPercent || 60,
          modelWeight: selectedProductDetail.modelWeight || 0,
          printingTime: selectedProductDetail.printingTime || 0,
          qtyPart: selectedProductDetail.qtyPart || 1,
          materialCost: selectedProductDetail.materialCost || 0,
          energyCost: selectedProductDetail.energyCost || 0,
          wearCost: selectedProductDetail.wearCost || 0,
          finalPrice: selectedProductDetail.finalPrice || 0,
          selectedMaterialId: selectedProductDetail.selectedMaterialId || "",
        };

        const detailOptions =
          Array.isArray(selectedProductDetail.options) &&
          selectedProductDetail.options.length > 0
            ? selectedProductDetail.options
            : [fallbackOption];

        const activeDetailOption: ProductOption =
          detailOptions[detailActiveOptionIndex] ?? detailOptions[0] ?? fallbackOption;
        const detailItems =
          Array.isArray(activeDetailOption.items) && activeDetailOption.items.length > 0
            ? activeDetailOption.items
            : Array.isArray(selectedProductDetail.items) && selectedProductDetail.items.length > 0
            ? selectedProductDetail.items
            : [
                {
                  id: "item-1",
                  name: selectedProductDetail.name || "Komponen 1",
                  selectedMaterialId: selectedProductDetail.selectedMaterialId,
                  infill: selectedProductDetail.infill || "15",
                  layerHeight: selectedProductDetail.layerHeight || "0.20",
                  modelWeight: activeDetailOption.modelWeight || selectedProductDetail.modelWeight || 0,
                  printingTime: activeDetailOption.printingTime || selectedProductDetail.printingTime || 0,
                  qtyPart: activeDetailOption.qtyPart || selectedProductDetail.qtyPart || 1,
                },
              ];

        const detailCosts = calculateOptionCosts(activeDetailOption);

        return (
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
            onClick={() => setSelectedProductDetail(null)}
          >
            <div
              className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-3xl p-5 sm:p-6 shadow-2xl max-h-[92vh] overflow-y-auto space-y-5 animate-in zoom-in-95 duration-200 text-slate-100"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center shrink-0">
                    {selectedProductDetail.imageUrl ? (
                      <img
                        src={selectedProductDetail.imageUrl}
                        alt={selectedProductDetail.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="w-6 h-6 text-slate-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-black text-lg text-white">
                      {selectedProductDetail.name}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-mono">
                      SKU: {activeDetailOption.sku || selectedProductDetail.sku || "NO-SKU"} • Kategori:{" "}
                      {selectedProductDetail.category || "General"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedProductDetail(null)}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Option Tabs */}
              {detailOptions.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1 border-b border-slate-800">
                  {detailOptions.map((opt, oIdx) => (
                    <button
                      key={opt.id || oIdx}
                      type="button"
                      onClick={() => setDetailActiveOptionIndex(oIdx)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        detailActiveOptionIndex === oIdx
                          ? "bg-rose-600 text-white shadow-sm"
                          : "bg-slate-950 text-slate-400 border border-slate-800 hover:text-white"
                      }`}
                    >
                      {opt.name || `Opsi ${oIdx + 1}`}
                    </button>
                  ))}
                </div>
              )}

              {/* Pricing & Financial Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">
                    Harga Jual Efektif
                  </span>
                  <span className="text-lg font-black font-mono text-rose-400">
                    {formatIDR(detailCosts ? detailCosts.actualPrice : (activeDetailOption.finalPrice ?? selectedProductDetail.finalPrice ?? 0))}
                  </span>
                </div>

                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">
                    Total Modal HPP
                  </span>
                  <span className="text-lg font-black font-mono text-slate-200">
                    {formatIDR(detailCosts ? detailCosts.totalBaseCost : (activeDetailOption.baseCost ?? 0))}
                  </span>
                </div>

                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">
                    Estimasi Laba Bersih
                  </span>
                  <span className="text-lg font-black font-mono text-emerald-400">
                    {formatIDR(detailCosts ? detailCosts.profit : 0)}
                  </span>
                </div>

                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">
                    Margin Bersih Riil
                  </span>
                  <span className="text-lg font-black font-mono text-emerald-400">
                    {detailCosts ? `${detailCosts.realMargin.toFixed(1)}%` : `${activeDetailOption.marginPercent ?? 60}%`}
                  </span>
                </div>
              </div>

              {/* Retail Pricing Structure (Marketplace & Direct) */}
              <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                    Struktur Tarif Penjualan Jasa Cetak Retail (Marketplace &amp; Direct)
                  </span>
                  <span className="text-[11px] font-mono font-bold text-rose-400">
                    Subtotal Jasa Cetak: {formatIDR(detailCosts ? detailCosts.retailSubtotal : (activeDetailOption.finalPrice || 0))}
                  </span>
                </div>

                {/* Multi-segment Retail Proportion Bar */}
                {detailCosts && detailCosts.retailSubtotal > 0 && (
                  <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden flex">
                    <div
                      style={{ width: `${detailCosts.costBreakdown.matPct}%` }}
                      className="bg-rose-500 h-full"
                      title={`Bahan Baku Retail: ${detailCosts.costBreakdown.matPct}%`}
                    />
                    <div
                      style={{ width: `${detailCosts.costBreakdown.printPct}%` }}
                      className="bg-amber-500 h-full"
                      title={`Biaya Cetak Retail: ${detailCosts.costBreakdown.printPct}%`}
                    />
                    <div
                      style={{ width: `${detailCosts.costBreakdown.packPct}%` }}
                      className="bg-cyan-500 h-full"
                      title={`Kemasan & Aksesoris: ${detailCosts.costBreakdown.packPct}%`}
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/80">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold mb-1">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> 1. Bahan Baku (Retail)
                      </span>
                      <span>{detailCosts?.costBreakdown?.matPct || 0}%</span>
                    </div>
                    <span className="font-mono font-bold text-slate-200 text-sm block">
                      {formatIDR(detailCosts ? detailCosts.materialRetailCost : 0)}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {detailCosts?.totalWeight || 0}g × Rp {detailCosts?.retailRateGram || 400}/g
                    </span>
                  </div>

                  <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/80">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold mb-1">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> 2. Biaya Cetak (Retail)
                      </span>
                      <span>{detailCosts?.costBreakdown?.printPct || 0}%</span>
                    </div>
                    <span className="font-mono font-bold text-slate-200 text-sm block">
                      {formatIDR(detailCosts ? detailCosts.printServiceCost : 0)}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {detailCosts?.totalTime || 0} jam × Rp {detailCosts?.retailRateHour || 3000}/jam
                    </span>
                  </div>

                  <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/80">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold mb-1">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-cyan-500 inline-block" /> 3. Kemasan &amp; Part
                      </span>
                      <span>{detailCosts?.costBreakdown?.packPct || 0}%</span>
                    </div>
                    <span className="font-mono font-bold text-slate-200 text-sm block">
                      {formatIDR(detailCosts ? detailCosts.packagingTotal : (activeDetailOption.packagingCost ?? 0))}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Box + Aksesoris
                    </span>
                  </div>

                  <div className="bg-slate-900/80 p-2.5 rounded-xl border border-rose-500/30">
                    <div className="flex items-center justify-between text-[10px] text-rose-300 font-bold mb-1">
                      <span className="flex items-center gap-1">
                        <Coins className="w-3 h-3 text-rose-400" /> Subtotal Jasa
                      </span>
                      <span className="text-emerald-400">100%</span>
                    </div>
                    <span className="font-mono font-bold text-rose-400 text-sm block">
                      {formatIDR(detailCosts ? detailCosts.retailSubtotal : 0)}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Dasar harga jual
                    </span>
                  </div>
                </div>

                {/* HPP & Net Profit Performance Note */}
                {detailCosts && (
                  <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] text-slate-400">
                    <span>
                      Modal Produksi Farm (HPP Riil): <strong className="text-slate-200 font-mono">{formatIDR(detailCosts.realProductionCost)}</strong>
                    </span>
                    <span>
                      Estimasi Laba Bersih: <strong className="text-emerald-400 font-mono">{formatIDR(detailCosts.profit)}</strong> ({detailCosts.realMargin.toFixed(1)}% margin)
                    </span>
                  </div>
                )}
              </div>

              {/* Components List */}
              {detailItems.length > 0 && (
                <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                    Komponen Parts ({detailItems.length} Bagian)
                  </span>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {detailItems.map((it, idx) => (
                      <div
                        key={it.id || idx}
                        className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs"
                      >
                        <div className="min-w-0 pr-2">
                          <p className="font-bold text-slate-200 truncate">{it.name || `Part ${idx + 1}`}</p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            {it.modelWeight || 0}g • {it.printingTime || 0} jam • infill {it.infill || "15"}%
                          </p>
                        </div>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-300 shrink-0">
                          {it.qtyPart || 1} pcs
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Description & Notes */}
              {(selectedProductDetail.description || selectedProductDetail.notes) && (
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Deskripsi / Catatan Model
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {selectedProductDetail.description || selectedProductDetail.notes}
                  </p>
                </div>
              )}

              {/* Actions Footer */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedProductDetail(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all"
                >
                  Tutup
                </button>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopySpecs(selectedProductDetail)}
                    className="px-3.5 py-2.5 rounded-xl border border-slate-800 text-slate-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin Specs</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const prodToEdit = selectedProductDetail;
                      setSelectedProductDetail(null);
                      openEditModal(prodToEdit);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-700 shadow-sm"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>Edit Produk</span>
                  </button>

                  <Link
                    href={`/orders?modelName=${encodeURIComponent(
                      detailOptions.length > 1
                        ? `${selectedProductDetail.name} (${activeDetailOption.name || `Opsi ${detailActiveOptionIndex + 1}`})`
                        : selectedProductDetail.name
                    )}&weight=${activeDetailOption.modelWeight || selectedProductDetail.modelWeight}&time=${
                      activeDetailOption.printingTime || selectedProductDetail.printingTime
                    }&price=${activeDetailOption.finalPrice || selectedProductDetail.finalPrice}`}
                    className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition-all flex items-center gap-1.5"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>Cetak Pesanan</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ==================================================================== */}
      {/* ADD / EDIT PRODUCT MODAL                                             */}
      {/* ==================================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-5 animate-in zoom-in-95 duration-200 text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-600/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-white">
                    {editingProduct ? "Edit Produk Katalog" : "Tambah Produk Baru"}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Format COGS komersial dan varian multi-item GooFlow
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitProduct} className="space-y-4">
              {/* Basic Information */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Nama Produk *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Holder HP V2 / Articulated Dragon"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                      SKU Utama
                    </label>
                    <button
                      type="button"
                      onClick={handleGenerateRandomSkuTopLevel}
                      className="text-[11px] text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1 transition-colors px-1.5 py-0.5 rounded hover:bg-rose-500/10 cursor-pointer"
                      title="Acak SKU baru dengan format 3 huruf dan 3 angka (mis. ABC-123)"
                    >
                      <Dices className="w-3.5 h-3.5" />
                      <span>Acak SKU (ABC-123)</span>
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Contoh: ABC-123"
                      value={formData.sku}
                      onChange={(e) => {
                        const val = e.target.value.toUpperCase();
                        setFormData((prev) => {
                          const nextState = { ...prev, sku: val };
                          if (prev.options && prev.options.length > 0 && prev.options[0]) {
                            const nextOptions = [...prev.options];
                            nextOptions[0] = { ...prev.options[0], sku: val };
                            nextState.options = nextOptions;
                          }
                          return nextState;
                        });
                      }}
                      className="w-full px-3.5 py-2 pr-10 text-xs font-mono uppercase tracking-wider rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                    <button
                      type="button"
                      onClick={handleGenerateRandomSkuTopLevel}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-400 p-1 transition-colors"
                      title="Acak SKU baru (ABC-123)"
                    >
                      <Dices className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
                    <span>
                      Format: 3 huruf & 3 angka (<span className="text-rose-300 font-mono font-semibold">ABC-123</span>)
                    </span>
                    {formData.sku && !isValidProductSkuFormat(formData.sku) && (
                      <span className="text-amber-400/90 font-medium text-[9px] bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                        Bukan format ABC-123
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Category, Image & Links */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Category Combobox with Dropdown & Quick Select */}
                <div ref={categoryDropdownRef} className="relative">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-rose-400" />
                      <span>Kategori</span>
                    </label>
                    <span className="text-[10px] text-slate-500">
                      Pilih dari list atau ketik baru
                    </span>
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Pilih atau ketik kategori..."
                      value={formData.category}
                      onFocus={() => setIsCategoryOpen(true)}
                      onChange={(e) => {
                        setFormData((prev) => ({ ...prev, category: e.target.value }));
                        setIsCategoryOpen(true);
                      }}
                      className="w-full px-3.5 py-2 pr-9 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                    <button
                      type="button"
                      onClick={() => setIsCategoryOpen((prev) => !prev)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 transition-colors"
                      title="Lihat daftar kategori"
                    >
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          isCategoryOpen ? "rotate-180 text-rose-400" : ""
                        }`}
                      />
                    </button>
                  </div>

                  {/* Dropdown Menu */}
                  {isCategoryOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl bg-slate-900 border border-slate-700/80 shadow-2xl p-1.5 space-y-1 max-h-56 overflow-y-auto">
                      {/* Option to create new category if typed doesn't exist */}
                      {formData.category.trim() &&
                        !allAvailableCategories.some(
                          (c) => c.toLowerCase() === formData.category.trim().toLowerCase()
                        ) && (
                          <button
                            type="button"
                            onClick={() => {
                              const newCat = formData.category.trim();
                              addCustomCategory(newCat);
                              setFormData((prev) => ({ ...prev, category: newCat }));
                              setIsCategoryOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center justify-between transition-colors cursor-pointer"
                          >
                            <span className="flex items-center gap-1.5 truncate">
                              <Plus className="w-3.5 h-3.5 flex-shrink-0" />
                              <span>Gunakan Kategori Baru: "{formData.category.trim()}"</span>
                            </span>
                            <span className="text-[10px] bg-rose-500/30 px-1.5 py-0.5 rounded text-rose-200">
                              Baru
                            </span>
                          </button>
                        )}

                      {/* Header */}
                      <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                        <span>Daftar Kategori ({allAvailableCategories.length})</span>
                      </div>

                      {/* List of existing categories matching input */}
                      {(() => {
                        const q = formData.category.trim().toLowerCase();
                        const filtered = allAvailableCategories.filter((c) =>
                          !q || c.toLowerCase().includes(q)
                        );

                        if (filtered.length === 0) {
                          return (
                            <div className="p-3 text-center text-xs text-slate-400">
                              Tidak ada kategori yang cocok. Tekan tombol di atas untuk menambahkan kategori baru.
                            </div>
                          );
                        }

                        return filtered.map((cat) => {
                          const isSelected =
                            (formData.category || "").trim().toLowerCase() ===
                            cat.toLowerCase();
                          return (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => {
                                setFormData((prev) => ({ ...prev, category: cat }));
                                setIsCategoryOpen(false);
                              }}
                              className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                                isSelected
                                  ? "bg-rose-600 text-white font-bold"
                                  : "text-slate-200 hover:bg-slate-800"
                              }`}
                            >
                              <span className="truncate">{cat}</span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-white flex-shrink-0 ml-2" />}
                            </button>
                          );
                        });
                      })()}
                    </div>
                  )}

                  {/* Quick Select Category Chips below input */}
                  <div className="mt-1.5 flex flex-wrap gap-1 max-h-16 overflow-y-auto scrollbar-none">
                    {allAvailableCategories.slice(0, 8).map((cat) => {
                      const isSelected =
                        (formData.category || "").trim().toLowerCase() ===
                        cat.toLowerCase();
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({ ...prev, category: cat }));
                            setIsCategoryOpen(false);
                          }}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-medium border transition-all cursor-pointer ${
                            isSelected
                              ? "bg-rose-600/30 text-rose-300 border-rose-500 font-bold shadow-xs"
                              : "bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700"
                          }`}
                        >
                          {cat}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    URL Gambar Produk
                  </label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={formData.imageUrl}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, imageUrl: e.target.value }))
                    }
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              {/* Reference & Marketplace Links */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Link Referensi 3D
                  </label>
                  <input
                    type="text"
                    placeholder="makerworld.com/..."
                    value={formData.referenceLink}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, referenceLink: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Link Tokopedia
                  </label>
                  <input
                    type="text"
                    placeholder="tokopedia.com/..."
                    value={formData.link1}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, link1: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Link Shopee
                  </label>
                  <input
                    type="text"
                    placeholder="shopee.co.id/..."
                    value={formData.link2}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, link2: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              {/* Option Selector Tabs */}
              <div className="pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" /> Varian / Opsi Produk
                  </span>
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="px-2.5 py-1 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-[11px] font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Tambah Opsi</span>
                  </button>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-2">
                  {formData.options.map((opt, oIdx) => (
                    <div
                      key={opt.id || oIdx}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                        activeOptionIndex === oIdx
                          ? "bg-rose-600/20 border-rose-500 text-white"
                          : "bg-slate-950 border-slate-800 text-slate-400"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setActiveOptionIndex(oIdx)}
                        className="truncate max-w-[120px]"
                      >
                        {opt.name || `Opsi ${oIdx + 1}`}
                      </button>
                      {formData.options.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(oIdx)}
                          className="hover:text-rose-400 p-0.5 ml-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Active Option Form Body */}
              {currentOption && (
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                        Nama Opsi
                      </label>
                      <input
                        type="text"
                        value={currentOption.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData((prev) => {
                            const next = [...prev.options];
                            next[activeOptionIndex] = { ...next[activeOptionIndex]!, name: val };
                            return { ...prev, options: next };
                          });
                        }}
                        className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase">
                          SKU Opsi
                        </label>
                        <div className="flex items-center gap-1.5">
                          {(() => {
                            const curSku = (currentOption.sku || "").trim().toUpperCase();
                            if (!curSku) return null;
                            const isDup = formData.options.some(
                              (o, idx) =>
                                idx !== activeOptionIndex &&
                                (o.sku || "").trim().toUpperCase() === curSku
                            );
                            if (isDup) {
                              return (
                                <span className="text-[9px] text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20 px-1 py-0.2 rounded">
                                  Duplikat!
                                </span>
                              );
                            }
                            return null;
                          })()}
                          <button
                            type="button"
                            onClick={handleGenerateRandomOptionSku}
                            className="text-[10px] text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1 transition-colors px-1 py-0.5 rounded hover:bg-rose-500/10 cursor-pointer"
                            title="Acak SKU opsi dengan format ABC-123"
                          >
                            <Dices className="w-3 h-3" />
                            <span>Acak SKU</span>
                          </button>
                        </div>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="mis. ABC-123"
                          value={currentOption.sku || ""}
                          onChange={(e) => {
                            const val = e.target.value.toUpperCase();
                            setFormData((prev) => {
                              const next = [...prev.options];
                              next[activeOptionIndex] = { ...next[activeOptionIndex]!, sku: val };
                              const updates: any = { options: next };
                              if (activeOptionIndex === 0) {
                                updates.sku = val;
                              }
                              return { ...prev, ...updates };
                            });
                          }}
                          className="w-full px-3 py-1.5 pr-8 text-xs font-mono uppercase rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                        />
                        <button
                          type="button"
                          onClick={handleGenerateRandomOptionSku}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-400 p-0.5 transition-colors"
                          title="Acak SKU opsi (ABC-123)"
                        >
                          <Dices className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Components List for Active Option */}
                  <div className="space-y-3 pt-2 border-t border-slate-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                          Komponen Part ({currentOption.items.length} Bagian)
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Pilih spul filamen dari stok atau input harga kustom per gram
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddItem}
                        className="px-2.5 py-1 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-[10px] font-bold flex items-center gap-1 transition-all"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Tambah Part</span>
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {currentOption.items.map((item, itIdx) => {
                        const selectedMat = materials.find((m) => m.id === item.selectedMaterialId);
                        const effectivePpg =
                          Number(item.customPricePerGram) > 0
                            ? Number(item.customPricePerGram)
                            : selectedMat?.pricePerGram && Number(selectedMat.pricePerGram) > 0
                            ? Number(selectedMat.pricePerGram)
                            : 150;
                        const partWeightTotal = (Number(item.modelWeight) || 0) * (Number(item.qtyPart) || 1);
                        const partMatCostTotal = partWeightTotal * effectivePpg;

                        return (
                          <div
                            key={item.id || itIdx}
                            className="bg-slate-900/90 p-3 rounded-2xl border border-slate-800 space-y-2.5"
                          >
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                              {/* Part Name */}
                              <div className="sm:col-span-4">
                                <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">
                                  Nama Bagian / Part
                                </label>
                                <input
                                  type="text"
                                  placeholder="Contoh: Bodi Utama / Tutup"
                                  value={item.name}
                                  onChange={(e) =>
                                    handleItemChange(itIdx, "name", e.target.value)
                                  }
                                  className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-rose-500"
                                />
                              </div>

                              {/* Material / Spool Selector */}
                              <div className="sm:col-span-5">
                                <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">
                                  Pilihan Spul Filamen Stok
                                </label>
                                <select
                                  value={item.selectedMaterialId || ""}
                                  onChange={(e) =>
                                    handleItemChange(
                                      itIdx,
                                      "selectedMaterialId",
                                      e.target.value ? e.target.value : null
                                    )
                                  }
                                  className="w-full px-2 py-1.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-rose-500 truncate"
                                >
                                  <option value="">
                                    Kustom (Rp {effectivePpg}/g)
                                  </option>
                                  {materials.map((m) => (
                                    <option key={m.id} value={m.id}>
                                      {m.brand} {m.materialType} • {m.color} (@ Rp {Math.round(m.pricePerGram || 150)}/g)
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* Custom Price / g if not spool */}
                              {!item.selectedMaterialId && (
                                <div className="sm:col-span-3">
                                  <label className="block text-[9px] font-bold text-amber-400 uppercase mb-0.5">
                                    Harga / Gram (Rp)
                                  </label>
                                  <input
                                    type="number"
                                    min="1"
                                    placeholder="150"
                                    value={item.customPricePerGram || ""}
                                    onChange={(e) =>
                                      handleItemChange(
                                        itIdx,
                                        "customPricePerGram",
                                        e.target.value ? Number(e.target.value) : null
                                      )
                                    }
                                    className="w-full px-2 py-1.5 text-xs font-mono rounded-xl bg-slate-950 border border-amber-500/40 text-amber-300 focus:outline-none"
                                  />
                                </div>
                              )}

                              {item.selectedMaterialId && (
                                <div className="sm:col-span-3 flex items-center gap-1.5 pt-4 text-xs font-mono text-emerald-400">
                                  <span className="w-2.5 h-2.5 rounded-full border border-white/20 inline-block shrink-0" style={{ backgroundColor: selectedMat?.colorHex || '#10b981' }} />
                                  <span className="truncate">Rp {Math.round(effectivePpg)}/g</span>
                                </div>
                              )}
                            </div>

                            {/* Weight, Duration, Qty & Subtotal Row */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 items-center bg-slate-950/60 p-2 rounded-xl border border-slate-800/60">
                              <div>
                                <span className="text-[9px] text-slate-500 font-bold block uppercase">
                                  Berat Part (gram)
                                </span>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.5"
                                  placeholder="50"
                                  value={item.modelWeight}
                                  onChange={(e) =>
                                    handleItemChange(itIdx, "modelWeight", Number(e.target.value))
                                  }
                                  className="w-full px-2 py-1 text-xs font-mono rounded-lg bg-slate-900 border border-slate-800 text-white"
                                />
                              </div>

                              <div>
                                <span className="text-[9px] text-slate-500 font-bold block uppercase">
                                  Durasi Cetak (jam)
                                </span>
                                <input
                                  type="number"
                                  step="0.1"
                                  min="0.1"
                                  placeholder="2.5"
                                  value={item.printingTime}
                                  onChange={(e) =>
                                    handleItemChange(itIdx, "printingTime", Number(e.target.value))
                                  }
                                  className="w-full px-2 py-1 text-xs font-mono rounded-lg bg-slate-900 border border-slate-800 text-white"
                                />
                              </div>

                              <div>
                                <span className="text-[9px] text-slate-500 font-bold block uppercase">
                                  Jumlah (Qty Pcs)
                                </span>
                                <input
                                  type="number"
                                  min="1"
                                  placeholder="1"
                                  value={item.qtyPart}
                                  onChange={(e) =>
                                    handleItemChange(itIdx, "qtyPart", Number(e.target.value))
                                  }
                                  className="w-full px-2 py-1 text-xs font-mono rounded-lg bg-slate-900 border border-slate-800 text-white"
                                />
                              </div>

                              <div className="flex items-center justify-between pl-1">
                                <div>
                                  <span className="text-[9px] text-slate-500 font-bold block uppercase">
                                    Subtotal Bahan
                                  </span>
                                  <span className="font-mono font-bold text-xs text-rose-300">
                                    {formatIDR(partMatCostTotal)}
                                  </span>
                                </div>
                                {currentOption.items.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveItem(itIdx)}
                                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                                    title="Hapus Bagian"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Tarif Penjualan Jasa Cetak Retail (Marketplace & Direct) */}
                  <div className="bg-slate-900/90 p-4 rounded-2xl border border-rose-500/30 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <Coins className="w-4 h-4 text-rose-400" />
                        <div>
                          <span className="text-xs font-bold text-rose-300 uppercase tracking-wider block">
                            Tarif Penjualan Jasa Cetak Retail (Marketplace &amp; Direct)
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Harga bahan baku dan biaya cetak dikalikan langsung dengan tarif retail farm
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        Formula Retail Aktif
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1">
                          Tarif Bahan per Gram (Rp/gr)
                        </label>
                        <input
                          type="number"
                          value={currentOption.retailPricePerGram ?? settings.retailPricePerGram ?? 400}
                          onChange={(e) =>
                            handleOptionParamChange("retailPricePerGram", Number(e.target.value))
                          }
                          className="w-full px-3 py-1.5 text-xs font-mono rounded-xl bg-slate-950 border border-slate-800 text-rose-300 font-bold focus:outline-none focus:border-rose-500"
                        />
                        <span className="text-[9px] text-slate-500 mt-0.5 block">
                          Default farm: Rp {settings.retailPricePerGram || 400}/gr
                        </span>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1">
                          Tarif Cetak per Jam (Rp/jam)
                        </label>
                        <input
                          type="number"
                          value={currentOption.retailPricePerHour ?? settings.retailPricePerHour ?? 3000}
                          onChange={(e) =>
                            handleOptionParamChange("retailPricePerHour", Number(e.target.value))
                          }
                          className="w-full px-3 py-1.5 text-xs font-mono rounded-xl bg-slate-950 border border-slate-800 text-rose-300 font-bold focus:outline-none focus:border-rose-500"
                        />
                        <span className="text-[9px] text-slate-500 mt-0.5 block">
                          Default farm: Rp {settings.retailPricePerHour || 3000}/jam
                        </span>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1">
                          Biaya Dus / Packing (Rp)
                        </label>
                        <input
                          type="number"
                          value={currentOption.packagingCost ?? 2000}
                          onChange={(e) =>
                            handleOptionParamChange("packagingCost", Number(e.target.value))
                          }
                          className="w-full px-3 py-1.5 text-xs font-mono rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-rose-500"
                        />
                        <span className="text-[9px] text-slate-500 mt-0.5 block">
                          Kemasan &amp; bubble
                        </span>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1">
                          Aksesoris / Hardware (Rp)
                        </label>
                        <input
                          type="number"
                          value={currentOption.hardwareCost ?? 0}
                          onChange={(e) =>
                            handleOptionParamChange("hardwareCost", Number(e.target.value))
                          }
                          className="w-full px-3 py-1.5 text-xs font-mono rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-rose-500"
                        />
                        <span className="text-[9px] text-slate-500 mt-0.5 block">
                          Baut, mur, magnet, per
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Rincian Hasil Perhitungan Jasa Cetak Retail */}
                  {currentOptionCosts && (
                    <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                          Kalkulasi Komponen Jasa Cetak Retail
                        </span>
                        <span className="text-xs font-mono font-bold text-rose-400">
                          Subtotal Jasa Cetak: {formatIDR(currentOptionCosts.retailSubtotal)}
                        </span>
                      </div>

                      {/* Multi-segment Retail Bar */}
                      <div className="h-2.5 w-full rounded-full bg-slate-950 overflow-hidden flex">
                        <div
                          style={{ width: `${currentOptionCosts.costBreakdown.matPct}%` }}
                          className="bg-rose-500 h-full transition-all"
                          title={`Bahan Baku Retail: ${currentOptionCosts.costBreakdown.matPct}%`}
                        />
                        <div
                          style={{ width: `${currentOptionCosts.costBreakdown.printPct}%` }}
                          className="bg-amber-500 h-full transition-all"
                          title={`Biaya Cetak Retail: ${currentOptionCosts.costBreakdown.printPct}%`}
                        />
                        <div
                          style={{ width: `${currentOptionCosts.costBreakdown.packPct}%` }}
                          className="bg-cyan-500 h-full transition-all"
                          title={`Kemasan & Aksesoris: ${currentOptionCosts.costBreakdown.packPct}%`}
                        />
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                        {/* 1. Bahan Baku Retail */}
                        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                          <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold mb-1">
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> 1. Bahan Baku
                            </span>
                            <span>{currentOptionCosts.costBreakdown.matPct}%</span>
                          </div>
                          <span className="font-mono font-bold text-slate-200 block text-sm">
                            {formatIDR(currentOptionCosts.materialRetailCost)}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {currentOptionCosts.totalWeight}g × Rp {currentOptionCosts.retailRateGram}/gr
                          </span>
                        </div>

                        {/* 2. Biaya Cetak Retail */}
                        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                          <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold mb-1">
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> 2. Biaya Cetak
                            </span>
                            <span>{currentOptionCosts.costBreakdown.printPct}%</span>
                          </div>
                          <span className="font-mono font-bold text-slate-200 block text-sm">
                            {formatIDR(currentOptionCosts.printServiceCost)}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {currentOptionCosts.totalTime} jam × Rp {currentOptionCosts.retailRateHour}/jam
                          </span>
                        </div>

                        {/* 3. Kemasan & Aksesoris */}
                        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                          <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold mb-1">
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-cyan-500 inline-block" /> 3. Kemasan &amp; Part
                            </span>
                            <span>{currentOptionCosts.costBreakdown.packPct}%</span>
                          </div>
                          <span className="font-mono font-bold text-slate-200 block text-sm">
                            {formatIDR(currentOptionCosts.packagingTotal)}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Box &amp; hardware
                          </span>
                        </div>

                        {/* 4. Subtotal Jasa Cetak */}
                        <div className="bg-slate-950 p-3 rounded-xl border border-rose-500/30">
                          <div className="flex items-center justify-between text-[10px] text-rose-300 font-bold mb-1">
                            <span className="flex items-center gap-1">
                              <Coins className="w-3 h-3 text-rose-400" /> Subtotal Jasa
                            </span>
                            <span className="text-emerald-400">100%</span>
                          </div>
                          <span className="font-mono font-bold text-rose-400 block text-sm">
                            {formatIDR(currentOptionCosts.retailSubtotal)}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Dasar harga jual
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Marketplace Fee & Penetapan Harga Jual Efektif */}
                  <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-3">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                      Fee Platform Marketplace &amp; Penetapan Harga Jual
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                          Fee Platform Marketplace / Pajak (%)
                        </label>
                        <input
                          type="number"
                          placeholder="0"
                          value={currentOption.taxRate ?? 0}
                          onChange={(e) =>
                            handleOptionParamChange("taxRate", Number(e.target.value))
                          }
                          className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-rose-500"
                        />
                        <span className="text-[9px] text-slate-500 mt-0.5 block">
                          Contoh: 7% Tokopedia / 10% Shopee
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">
                            Rekomendasi Harga Jual
                          </label>
                          {currentOptionCosts && (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() =>
                                  handleOptionParamChange(
                                    "manualPrice",
                                    Math.ceil(currentOptionCosts.suggestedPrice / 1000) * 1000
                                  )
                                }
                                className="text-[9px] text-rose-400 hover:text-rose-300 font-bold bg-rose-500/10 px-1.5 py-0.5 rounded"
                                title="Bulatkan ke kelipatan Rp 1.000 terdekat"
                              >
                                +1k
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleOptionParamChange(
                                    "manualPrice",
                                    Math.ceil(currentOptionCosts.suggestedPrice / 5000) * 5000
                                  )
                                }
                                className="text-[9px] text-amber-400 hover:text-amber-300 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded"
                                title="Bulatkan ke kelipatan Rp 5.000 terdekat"
                              >
                                +5k
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-slate-950 border border-slate-800 text-rose-400 font-bold text-sm">
                          {currentOptionCosts ? formatIDR(currentOptionCosts.suggestedPrice) : "Rp 0"}
                        </div>
                        <span className="text-[9px] text-slate-500 mt-0.5 block">
                          Subtotal + gross-up fee marketplace
                        </span>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-amber-400 uppercase mb-1">
                          Harga Jual Manual / Override (Rp)
                        </label>
                        <input
                          type="number"
                          placeholder="Kosong = Gunakan Rekomendasi"
                          value={currentOption.manualPrice || ""}
                          onChange={(e) =>
                            handleOptionParamChange(
                              "manualPrice",
                              Number(e.target.value) > 0 ? Number(e.target.value) : null
                            )
                          }
                          className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-slate-950 border border-amber-500/40 text-amber-300 focus:outline-none"
                        />
                        <span className="text-[9px] text-slate-500 mt-0.5 block">
                          Isi jika ingin menetapkan harga custom
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Real Financial Outcome Cards */}
                  {currentOptionCosts && (
                    <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">
                          Harga Jual Efektif
                        </span>
                        <span className="font-mono font-black text-rose-400 text-base">
                          {formatIDR(currentOptionCosts.actualPrice)}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">
                          Potongan Fee ({currentOptionCosts.taxRate}%)
                        </span>
                        <span className="font-mono font-bold text-slate-400 text-sm">
                          {formatIDR(currentOptionCosts.taxAmount)}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">
                          Modal Produksi Farm (HPP Riil)
                        </span>
                        <span className="font-mono font-bold text-slate-300 text-sm">
                          {formatIDR(currentOptionCosts.realProductionCost)}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">
                          Estimasi Laba Bersih
                        </span>
                        <span className="font-mono font-black text-emerald-400 text-base">
                          {formatIDR(currentOptionCosts.profit)}
                        </span>
                      </div>

                      <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-right">
                        <span className="text-[9px] text-slate-400 block uppercase font-bold">
                          Margin Bersih Riil
                        </span>
                        <span className="font-mono font-black text-emerald-400 text-base">
                          {currentOptionCosts.realMargin.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Optional Farm Base Parameters (Collapsible) */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAdvancedParams(!showAdvancedParams)}
                      className="text-[10px] font-bold text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors"
                    >
                      <Zap className="w-3 h-3 text-amber-500/70" />
                      <span>{showAdvancedParams ? "Sembunyikan Parameter Farm Riil ▲" : "Lihat Parameter Farm Riil (Listrik & Aus) ▼"}</span>
                    </button>

                    {showAdvancedParams && (
                      <div className="mt-2 p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 grid grid-cols-3 gap-3 text-xs animate-in fade-in duration-150">
                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">
                            Tarif Listrik PLN (Rp/kWh)
                          </label>
                          <input
                            type="number"
                            value={currentOption.electricityCostPerKwh ?? settings.electricityCostPerKwh ?? 1500}
                            onChange={(e) =>
                              handleOptionParamChange("electricityCostPerKwh", Number(e.target.value))
                            }
                            className="w-full px-2.5 py-1 text-xs font-mono rounded-lg bg-slate-900 border border-slate-800 text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">
                            Daya Printer (Watt)
                          </label>
                          <input
                            type="number"
                            value={currentOption.printerPowerWatt ?? settings.printerPowerWatt ?? 150}
                            onChange={(e) =>
                              handleOptionParamChange("printerPowerWatt", Number(e.target.value))
                            }
                            className="w-full px-2.5 py-1 text-xs font-mono rounded-lg bg-slate-900 border border-slate-800 text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">
                            Biaya Aus Mesin (Rp/jam)
                          </label>
                          <input
                            type="number"
                            value={currentOption.wearCostPerHour ?? settings.wearCostPerHour ?? 500}
                            onChange={(e) =>
                              handleOptionParamChange("wearCostPerHour", Number(e.target.value))
                            }
                            className="w-full px-2.5 py-1 text-xs font-mono rounded-lg bg-slate-900 border border-slate-800 text-white"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white text-xs font-bold"
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
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>{editingProduct ? "Simpan Perubahan" : "Simpan Produk"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* IMAGE ZOOM MODAL                                                     */}
      {/* ==================================================================== */}
      {viewingImage && (
        <div
          onClick={() => setViewingImage(null)}
          className="fixed inset-0 z-[500] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer animate-in fade-in"
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={viewingImage}
              alt="Zoomed"
              className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl"
            />
            <button
              onClick={() => setViewingImage(null)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-slate-900/80 text-white flex items-center justify-center hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Demo Read-Only Protection Modal */}
      <DemoReadOnlyModal
        isOpen={showDemoModal}
        onClose={() => setShowDemoModal(false)}
        actionName={blockedAction}
      />
    </div>
  );
}
