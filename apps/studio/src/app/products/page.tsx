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
} from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================
interface ComponentItem {
  id: string;
  name: string;
  selectedMaterialId?: string | null;
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
  packagingCost?: number;
  taxRate?: number;
  marginPercent?: number;
  manualPrice?: number | null;
  modelWeight?: number;
  printingTime?: number;
  qtyPart?: number;
  finalPrice?: number;
  suggestedPrice?: number;
  profit?: number;
  materialCost?: number;
  energyCost?: number;
  wearCost?: number;
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
  brand: string;
  materialType: string;
  color: string;
  pricePerGram: number;
}

const formatIDR = (val: number) => "Rp " + Math.round(val || 0).toLocaleString("id-ID");

export default function ProductCatalogPage() {
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
      if (invJson.success) setMaterials(invJson.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Categories list
  const categories = useMemo(() => {
    const list = new Set<string>();
    products.forEach((p) => p.category && list.add(p.category));
    return ["All", ...Array.from(list).sort()];
  }, [products]);

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
    modelWeight: 100,
    printingTime: 3.5,
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
    packagingCost: 0,
    taxRate: 0,
    marginPercent: 60,
    manualPrice: 0,
  });

  // Pricing formula for option
  const calculateOptionCosts = (option: ProductOption) => {
    if (!option) return null;

    const electricityPriceKwh = 1500;
    const printerPowerKw = 150 / 1000;
    const wearCostPerHour = 500;
    const packagingCost = Number(option.packagingCost || 0);

    let sumMatCost = 0;
    let sumEnergyCost = 0;
    let sumWearCost = 0;
    let sumItemBaseCost = 0;
    let sumWeight = 0;
    let sumTime = 0;
    let sumQty = 0;

    const itemsCalculated = (option.items || []).map((item) => {
      const mat = materials.find((m) => m.id === item.selectedMaterialId) || materials[0];
      const pricePerGram = mat?.pricePerGram || 150;
      const qty = Math.max(1, Number(item.qtyPart || 1));
      const w = Number(item.modelWeight || 0);
      const t = Number(item.printingTime || 0);

      const lineWeight = w * qty;
      const lineTime = t * qty;
      const lineMatCost = lineWeight * pricePerGram;
      const lineEnergyCost = printerPowerKw * lineTime * electricityPriceKwh;
      const lineWearCost = lineTime * wearCostPerHour;
      const lineBaseCost = lineMatCost + lineEnergyCost + lineWearCost;

      sumWeight += lineWeight;
      sumTime += lineTime;
      sumQty += qty;
      sumMatCost += lineMatCost;
      sumEnergyCost += lineEnergyCost;
      sumWearCost += lineWearCost;
      sumItemBaseCost += lineBaseCost;

      return {
        ...item,
        lineWeight,
        lineTime,
        lineBaseCost,
        matName: mat ? `${mat.brand} ${mat.materialType} ${mat.color}` : "PLA",
      };
    });

    const totalBaseCost = sumItemBaseCost + packagingCost;
    const taxRate = Math.max(0, Number(option.taxRate || 0));
    const marginPct = Math.min(99, Math.max(0, Number(option.marginPercent ?? 60)));

    const combinedPct = marginPct + taxRate;
    const factor = combinedPct < 99 ? 1 - combinedPct / 100 : 1 - marginPct / 100;
    const suggestedPrice = factor > 0 ? totalBaseCost / factor : totalBaseCost * 2;

    const manualPrice = Number(option.manualPrice) > 0 ? Number(option.manualPrice) : 0;
    const actualPrice = manualPrice > 0 ? manualPrice : suggestedPrice;

    const taxAmount = actualPrice * (taxRate / 100);
    const netRevenue = actualPrice - taxAmount;
    const profit = netRevenue - totalBaseCost;
    const margin = actualPrice > 0 ? (profit / actualPrice) * 100 : 0;

    return {
      materialCost: sumMatCost,
      energyCost: sumEnergyCost,
      wearCost: sumWearCost,
      baseCost: totalBaseCost,
      suggestedPrice,
      actualPrice,
      taxRate,
      taxAmount,
      netRevenue,
      profit,
      margin,
      totalWeight: sumWeight,
      totalTime: sumTime,
      totalQty: sumQty,
      itemsCalculated,
    };
  };

  const currentOption =
    formData.options[activeOptionIndex] || formData.options[0] || null;
  const currentOptionCosts = currentOption ? calculateOptionCosts(currentOption) : null;

  // Open Add Product Modal
  const openCreateModal = () => {
    setEditingProduct(null);
    setActiveOptionIndex(0);
    setFormData({
      name: "",
      sku: `PROD-${Math.random().toString(36).substring(7).toUpperCase()}`,
      category: "General",
      imageUrl: "",
      description: "",
      referenceLink: "",
      link1: "",
      link2: "",
      notes: "",
      options: [createDefaultOption("opt-1", "Opsi 1", "")],
    });
    setIsModalOpen(true);
  };

  // Open Edit Product Modal
  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setActiveOptionIndex(0);

    let resolvedOptions: ProductOption[] = [];
    if (product.options && Array.isArray(product.options) && product.options.length > 0) {
      resolvedOptions = product.options.map((opt, idx) => ({
        id: opt.id || `opt-${idx + 1}`,
        name: opt.name || `Opsi ${idx + 1}`,
        sku: opt.sku || (idx === 0 ? product.sku : ""),
        pricingMode: opt.pricingMode || "total_modal",
        items:
          opt.items && Array.isArray(opt.items) && opt.items.length > 0
            ? opt.items
            : [
                {
                  id: `item-${Date.now()}-1`,
                  name: opt.name || "Item 1",
                  modelWeight: opt.modelWeight || product.modelWeight || 100,
                  printingTime: opt.printingTime || product.printingTime || 3.5,
                  selectedMaterialId:
                    product.selectedMaterialId || materials[0]?.id || null,
                  qtyPart: opt.qtyPart || product.qtyPart || 1,
                  infill: product.infill || "15",
                  layerHeight: product.layerHeight || "0.20",
                },
              ],
        packagingCost: opt.packagingCost || product.packagingCost || 0,
        taxRate: opt.taxRate || product.taxRate || 0,
        marginPercent: opt.marginPercent ?? product.marginPercent ?? 60,
        manualPrice: opt.manualPrice || product.manualPrice || 0,
      }));
    } else {
      const rawItems =
        product.items && Array.isArray(product.items) && product.items.length > 0
          ? product.items
          : [
              {
                id: "item-1",
                name: product.name || "Item 1",
                modelWeight: product.modelWeight || 100,
                printingTime: product.printingTime || 3.5,
                selectedMaterialId: product.selectedMaterialId || materials[0]?.id || null,
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
          packagingCost: product.packagingCost || 0,
          taxRate: product.taxRate || 0,
          marginPercent: product.marginPercent ?? 60,
          manualPrice: product.manualPrice || 0,
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
    const newSku = `${formData.sku || "OPT"}-${nextNum}`;

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
      packagingCost: currentOpt?.packagingCost ?? 0,
      taxRate: currentOpt?.taxRate ?? 0,
      marginPercent: currentOpt?.marginPercent ?? 60,
      manualPrice: currentOpt?.manualPrice ?? 0,
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
          packagingCost: Number(opt.packagingCost) || 0,
          taxRate: Number(opt.taxRate) || 0,
          marginPercent: Math.round(Number(costs?.margin ?? opt.marginPercent ?? 60)),
          manualPrice: Number(opt.manualPrice) > 0 ? Number(opt.manualPrice) : null,
          modelWeight: Number(optWeight),
          printingTime: Number(optTime),
          qtyPart: Number(optQty),
          materialCost: Number(costs?.materialCost) || 0,
          energyCost: Number(costs?.energyCost) || 0,
          wearCost: Number(costs?.wearCost) || 0,
          finalPrice: Number(costs?.actualPrice) || 0,
          suggestedPrice: Number(costs?.suggestedPrice) || 0,
          profit: Number(costs?.profit) || 0,
        };
      });

      const defaultOpt = processedOptions[0];

      const payload = {
        name: formData.name.trim(),
        sku: defaultOpt?.sku || formData.sku.trim() || null,
        imageUrl: formData.imageUrl.trim() || null,
        description: formData.description.trim() || null,
        notes: formData.notes.trim() || null,
        referenceLink: formData.referenceLink.trim() || null,
        link1: formData.link1.trim() || null,
        link2: formData.link2.trim() || null,
        category: formData.category.trim() || "General",
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
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Tambah Produk Baru</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
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

        {/* Product Cards List (Identik dengan 3DFlow) */}
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

        return (
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
            onClick={() => setSelectedProductDetail(null)}
          >
            <div
              className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-3xl p-5 sm:p-6 shadow-2xl max-h-[92vh] overflow-y-auto space-y-5 animate-in zoom-in-95 duration-200 text-slate-100"
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

              {/* Pricing & Summary Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">
                    Harga Jual Final
                  </span>
                  <span className="text-lg font-black font-mono text-rose-400">
                    {formatIDR(activeDetailOption.finalPrice ?? selectedProductDetail.finalPrice ?? 0)}
                  </span>
                </div>

                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">
                    Total Berat
                  </span>
                  <span className="text-lg font-black font-mono text-white">
                    {activeDetailOption.modelWeight || selectedProductDetail.modelWeight || 0}g
                  </span>
                </div>

                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">
                    Durasi Cetak
                  </span>
                  <span className="text-lg font-black font-mono text-white">
                    {activeDetailOption.printingTime || selectedProductDetail.printingTime || 0}h
                  </span>
                </div>

                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">
                    Margin Target
                  </span>
                  <span className="text-lg font-black font-mono text-emerald-400">
                    {activeDetailOption.marginPercent ?? selectedProductDetail.marginPercent ?? 60}%
                  </span>
                </div>
              </div>

              {/* COGS Detailed Breakdown */}
              <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                  Rincian Biaya Pokok Produksi (COGS)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Modal Bahan</span>
                    <span className="font-mono font-bold text-slate-200">
                      {formatIDR(activeDetailOption.materialCost ?? selectedProductDetail.materialCost ?? 0)}
                    </span>
                  </div>
                  <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Biaya Listrik</span>
                    <span className="font-mono font-bold text-slate-200">
                      {formatIDR(activeDetailOption.energyCost ?? selectedProductDetail.energyCost ?? 0)}
                    </span>
                  </div>
                  <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Biaya Aus Mesin</span>
                    <span className="font-mono font-bold text-slate-200">
                      {formatIDR(activeDetailOption.wearCost ?? selectedProductDetail.wearCost ?? 0)}
                    </span>
                  </div>
                  <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Pengemasan</span>
                    <span className="font-mono font-bold text-slate-200">
                      {formatIDR(activeDetailOption.packagingCost ?? selectedProductDetail.packagingCost ?? 0)}
                    </span>
                  </div>
                </div>
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
          <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-5 animate-in zoom-in-95 duration-200 text-slate-100">
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
                    Format COGS komersial dan varian multi-item 3DFlow
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
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    SKU Utama
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: HLD-01"
                    value={formData.sku}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, sku: e.target.value }))
                    }
                    className="w-full px-3.5 py-2 text-xs font-mono rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              {/* Category, Image & Links */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Kategori
                  </label>
                  <input
                    type="text"
                    placeholder="General / Aksesoris"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, category: e.target.value }))
                    }
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
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
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                        SKU Opsi
                      </label>
                      <input
                        type="text"
                        value={currentOption.sku || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData((prev) => {
                            const next = [...prev.options];
                            next[activeOptionIndex] = { ...next[activeOptionIndex]!, sku: val };
                            return { ...prev, options: next };
                          });
                        }}
                        className="w-full px-3 py-1.5 text-xs font-mono rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Components List for Active Option */}
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-300 uppercase">
                        Komponen Part ({currentOption.items.length})
                      </span>
                      <button
                        type="button"
                        onClick={handleAddItem}
                        className="text-[10px] font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Tambah Part</span>
                      </button>
                    </div>

                    <div className="space-y-2">
                      {currentOption.items.map((item, itIdx) => (
                        <div
                          key={item.id || itIdx}
                          className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 grid grid-cols-2 sm:grid-cols-6 gap-2 items-center"
                        >
                          <div className="sm:col-span-2">
                            <input
                              type="text"
                              placeholder="Nama Komponen"
                              value={item.name}
                              onChange={(e) =>
                                handleItemChange(itIdx, "name", e.target.value)
                              }
                              className="w-full px-2.5 py-1 text-xs rounded-lg bg-slate-950 border border-slate-800 text-white"
                            />
                          </div>

                          <div>
                            <input
                              type="number"
                              min="1"
                              placeholder="Berat (g)"
                              value={item.modelWeight}
                              onChange={(e) =>
                                handleItemChange(itIdx, "modelWeight", Number(e.target.value))
                              }
                              className="w-full px-2 py-1 text-xs font-mono rounded-lg bg-slate-950 border border-slate-800 text-white"
                              title="Berat (gram)"
                            />
                          </div>

                          <div>
                            <input
                              type="number"
                              step="0.1"
                              min="0.1"
                              placeholder="Waktu (h)"
                              value={item.printingTime}
                              onChange={(e) =>
                                handleItemChange(itIdx, "printingTime", Number(e.target.value))
                              }
                              className="w-full px-2 py-1 text-xs font-mono rounded-lg bg-slate-950 border border-slate-800 text-white"
                              title="Durasi (jam)"
                            />
                          </div>

                          <div>
                            <input
                              type="number"
                              min="1"
                              placeholder="Qty"
                              value={item.qtyPart}
                              onChange={(e) =>
                                handleItemChange(itIdx, "qtyPart", Number(e.target.value))
                              }
                              className="w-full px-2 py-1 text-xs font-mono rounded-lg bg-slate-950 border border-slate-800 text-white"
                              title="Jumlah Part"
                            />
                          </div>

                          <div className="flex justify-end">
                            {currentOption.items.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(itIdx)}
                                className="p-1 text-slate-500 hover:text-rose-400"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Packaging, Tax, Margin & Manual Override */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-800">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                        Biaya Packing (Rp)
                      </label>
                      <input
                        type="number"
                        value={currentOption.packagingCost || 0}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setFormData((prev) => {
                            const next = [...prev.options];
                            next[activeOptionIndex] = {
                              ...next[activeOptionIndex]!,
                              packagingCost: val,
                            };
                            return { ...prev, options: next };
                          });
                        }}
                        className="w-full px-2.5 py-1 text-xs font-mono rounded-lg bg-slate-900 border border-slate-800 text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                        Pajak / Fee (%)
                      </label>
                      <input
                        type="number"
                        value={currentOption.taxRate || 0}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setFormData((prev) => {
                            const next = [...prev.options];
                            next[activeOptionIndex] = {
                              ...next[activeOptionIndex]!,
                              taxRate: val,
                            };
                            return { ...prev, options: next };
                          });
                        }}
                        className="w-full px-2.5 py-1 text-xs font-mono rounded-lg bg-slate-900 border border-slate-800 text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                        Target Margin (%)
                      </label>
                      <input
                        type="number"
                        value={currentOption.marginPercent ?? 60}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setFormData((prev) => {
                            const next = [...prev.options];
                            next[activeOptionIndex] = {
                              ...next[activeOptionIndex]!,
                              marginPercent: val,
                            };
                            return { ...prev, options: next };
                          });
                        }}
                        className="w-full px-2.5 py-1 text-xs font-mono rounded-lg bg-slate-900 border border-slate-800 text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-amber-400 uppercase mb-1">
                        Harga Manual (Rp)
                      </label>
                      <input
                        type="number"
                        placeholder="Auto"
                        value={currentOption.manualPrice || ""}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setFormData((prev) => {
                            const next = [...prev.options];
                            next[activeOptionIndex] = {
                              ...next[activeOptionIndex]!,
                              manualPrice: val > 0 ? val : null,
                            };
                            return { ...prev, options: next };
                          });
                        }}
                        className="w-full px-2.5 py-1 text-xs font-mono rounded-lg bg-slate-900 border border-amber-500/30 text-white"
                      />
                    </div>
                  </div>

                  {/* Realtime Calculation Summary */}
                  {currentOptionCosts && (
                    <div className="bg-slate-900 p-3 rounded-xl border border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase">
                          Biaya Modal Total
                        </span>
                        <span className="font-mono font-bold text-slate-300">
                          {formatIDR(currentOptionCosts.baseCost)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase">
                          Harga Jual Efektif
                        </span>
                        <span className="font-mono font-bold text-rose-400 text-sm">
                          {formatIDR(currentOptionCosts.actualPrice)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase">
                          Estimasi Laba Bersih
                        </span>
                        <span className="font-mono font-bold text-emerald-400">
                          {formatIDR(currentOptionCosts.profit)} ({Math.round(currentOptionCosts.margin)}%)
                        </span>
                      </div>
                    </div>
                  )}
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
    </div>
  );
}
