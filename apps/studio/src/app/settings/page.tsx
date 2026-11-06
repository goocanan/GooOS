"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { GooNavbar } from "@/components/GooNavbar";
import { useDemoMode } from "@/hooks/use-demo-mode";
import { signOut, signIn } from "@/lib/auth-client";
import {
  useGooSettings,
  SpoolTareWeight,
  DEFAULT_GOO_SETTINGS,
} from "@/hooks/use-goo-settings";
import {
  Settings,
  Zap,
  Sliders,
  Compass,
  Globe,
  Save,
  RotateCcw,
  Download,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Plus,
  Trash2,
  Store,
  Layers,
  Scale,
  DollarSign,
  Cpu,
  Clock,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  User,
  LogOut,
  LogIn,
  Lock,
  ShieldAlert,
  Key,
  Check,
  Copy,
  ArrowRight,
  Shield,
  BadgeCheck,
} from "lucide-react";

type SettingsTab = "gooflow" | "3dflow" | "goo-studio" | "gooprint" | "system" | "account";

function SettingsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const rawTab = searchParams.get("tab");
  const initialTab = (rawTab === "3dflow" ? "gooflow" : rawTab) as SettingsTab || "gooflow";
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);

  const {
    settings,
    isLoaded,
    isSyncing,
    lastSaved,
    updateSettings,
    resetToDefaults,
  } = useGooSettings();

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New spool tare weight inline form
  const [newBrand, setNewBrand] = useState("");
  const [newType, setNewType] = useState("Plastic");
  const [newWeight, setNewWeight] = useState(200);
  const [showAddSpool, setShowAddSpool] = useState(false);

  const { isDemo, user, session, isPending: isSessionPending } = useDemoMode();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSwitchingDemo, setIsSwitchingDemo] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Sync tab with URL search parameter
  useEffect(() => {
    const raw = searchParams.get("tab");
    const tabParam = (raw === "3dflow" ? "gooflow" : raw) as SettingsTab;
    if (
      tabParam &&
      ["gooflow", "3dflow", "goo-studio", "gooprint", "system", "account"].includes(tabParam)
    ) {
      setActiveTab(tabParam === "3dflow" ? "gooflow" : tabParam);
    }
  }, [searchParams]);

  const handleCopy = (text: string, label: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(label);
      showToast(`${label} disalin ke clipboard.`);
      setTimeout(() => setCopiedKey(null), 2500);
    }
  };

  const handleLogout = async () => {
    if (window.confirm("Apakah Anda yakin ingin keluar (logout) dari akun saat ini?")) {
      setIsLoggingOut(true);
      try {
        await signOut();
        showToast("Berhasil keluar dari akun GooOS.");
        router.push("/auth/login");
      } catch {
        router.push("/auth/login");
      } finally {
        setIsLoggingOut(false);
      }
    }
  };

  const handleQuickDemoSwitch = async () => {
    setIsSwitchingDemo(true);
    try {
      const res = await signIn.email({
        email: "demo@goocanan.com",
        password: "demouser123",
      });
      if (res.error) {
        showToast(res.error.message || "Gagal masuk ke akun demo.");
      } else {
        showToast("Berhasil beralih ke Akun Demo (Mode Hanya Baca).");
        window.location.reload();
      }
    } catch {
      showToast("Gagal beralih ke akun demo.");
    } finally {
      setIsSwitchingDemo(false);
    }
  };

  const handleTabChange = (tab: SettingsTab) => {
    setActiveTab(tab);
    router.replace(`/settings?tab=${tab}`, { scroll: false });
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleReset = () => {
    if (
      window.confirm(
        "Apakah Anda yakin ingin mengembalikan seluruh pengaturan ke nilai default pabrik?"
      )
    ) {
      resetToDefaults();
      showToast("Pengaturan berhasil direset ke default pabrik.");
    }
  };

  const handleExportBackup = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(settings, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute(
      "download",
      `gooos-settings-backup-${new Date().toISOString().split("T")[0]}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast("File backup JSON berhasil diunduh.");
  };

  const handleAddSpoolWeight = () => {
    if (!newBrand.trim()) return;
    const newItem: SpoolTareWeight = {
      id: "spool-" + Date.now(),
      brand: newBrand.trim(),
      type: newType,
      emptyWeight: Number(newWeight) || 200,
    };
    updateSettings({
      spoolWeights: [...(settings.spoolWeights || []), newItem],
    });
    setNewBrand("");
    setNewWeight(200);
    setShowAddSpool(false);
    showToast(`Master bobot spul ${newItem.brand} berhasil ditambahkan.`);
  };

  const handleDeleteSpoolWeight = (id: string) => {
    updateSettings({
      spoolWeights: settings.spoolWeights.filter((s) => s.id !== id),
    });
    showToast("Master bobot spul dihapus.");
  };

  // Calculations for preview
  const machineDepreciationPerHour =
    settings.investmentCostTotal /
    (settings.investmentPaybackMonths * settings.monthlyPrintHours || 1);

  if (!isLoaded) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-rose-500 border-t-transparent animate-spin" />
          <p className="text-xs text-slate-400 font-mono">Memuat Pengaturan Terpadu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <GooNavbar />

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6 overflow-x-hidden">
        {/* ========================================================= */}
        {/* HEADER & AUTO-SYNC STATUS                                 */}
        {/* ========================================================= */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/20 uppercase tracking-widest">
                GooOS Hub
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Pusat Konfigurasi Ekosistem
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1 flex items-center gap-2.5">
              <span>⚙️ Pengaturan Studio &amp; Aplikasi</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl">
              Konfigurasi terpusat untuk biaya cetak GooFlow, kalkulator GOO-Studio, viewport CAD GooPrint, serta preferensi cloud sistem GooOS. Perubahan tersimpan otomatis.
            </p>
          </div>

          {/* Sync Pill & Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            {isSyncing ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Menyimpan ke Cloud...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono shadow-[0_0_12px_rgba(16,185,129,0.15)]">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>AUTO SYNCED (Tersimpan)</span>
              </div>
            )}

            <button
              onClick={handleExportBackup}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs transition-colors"
              title="Unduh Backup File JSON"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={handleReset}
              className="p-2 rounded-xl bg-slate-900 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/30 text-slate-400 hover:text-rose-400 text-xs transition-colors"
              title="Kembalikan ke Default Pabrik"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Toast Notification */}
        {toastMessage && (
          <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* ========================================================= */}
        {/* TABS NAVIGATION                                           */}
        {/* ========================================================= */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-900/80 border border-slate-800 overflow-x-auto scrollbar-none max-w-full touch-pan-x">
          <button
            onClick={() => handleTabChange("gooflow")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "gooflow" || activeTab === "3dflow"
                ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-lg shadow-rose-500/10"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <span>⚡ GooFlow (Farm &amp; Biaya Cetak)</span>
          </button>

          <button
            onClick={() => handleTabChange("goo-studio")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "goo-studio"
                ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-lg shadow-indigo-500/10"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <span>📐 GOO-Studio (Kalkulator &amp; Batch)</span>
          </button>

          <button
            onClick={() => handleTabChange("gooprint")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "gooprint"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-lg shadow-cyan-500/10"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <span>🎨 GooPrint (CAD Studio)</span>
          </button>

          <button
            onClick={() => handleTabChange("system")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "system"
                ? "bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-lg shadow-purple-500/10"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <span>🌐 GooOS System (Sistem &amp; Cloud)</span>
          </button>

          <button
            onClick={() => handleTabChange("account")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "account"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-lg shadow-emerald-500/10"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <User className="w-3.5 h-3.5 text-emerald-400" />
            <span>👤 Akun &amp; Sesi Pengguna</span>
          </button>
        </div>

        {/* ========================================================= */}
        {/* TAB 1: GOOFLOW SETTINGS                                   */}
        {/* ========================================================= */}
        {(activeTab === "gooflow" || activeTab === "3dflow") && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Section 1: Parameter Energi & Keausan Mesin */}
            <div className="bg-slate-900/60 p-5 sm:p-6 rounded-3xl border border-slate-800 space-y-4">
              <div className="flex items-center gap-2 text-rose-400">
                <Zap className="w-4 h-4" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-rose-300">
                  Konfigurasi Energi Listrik &amp; Keausan Mesin (GooFlow)
                </h2>
              </div>
              <p className="text-xs text-slate-400">
                Parameter dasar ini otomatis digunakan saat menghitung estimasi biaya dasar per jam cetak pada seluruh pesanan dan katalog produk.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Tarif Listrik PLN (Rp / kWh)
                  </label>
                  <input
                    type="number"
                    value={settings.electricityCostPerKwh}
                    onChange={(e) =>
                      updateSettings({ electricityCostPerKwh: Number(e.target.value) })
                    }
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Standar B1/R1 PLN: Rp 1.444 - Rp 1.500</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Daya Printer Rata-rata (Watt)
                  </label>
                  <input
                    type="number"
                    value={settings.printerPowerWatt}
                    onChange={(e) =>
                      updateSettings({ printerPowerWatt: Number(e.target.value) })
                    }
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Creality Hi / Bambu Lab rata-rata: 120-180W</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Biaya Keausan Printer / Jam (Rp)
                  </label>
                  <input
                    type="number"
                    value={settings.wearCostPerHour}
                    onChange={(e) =>
                      updateSettings({ wearCostPerHour: Number(e.target.value) })
                    }
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Cadangan pergantian nozzle, belt, pelumas</p>
                </div>
              </div>
            </div>

            {/* Section 2: Tarif Jasa Cetak Retail (Pricing Engine) */}
            <div className="bg-slate-900/60 p-5 sm:p-6 rounded-3xl border border-slate-800 space-y-4">
              <div className="flex items-center gap-2 text-rose-400">
                <DollarSign className="w-4 h-4" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-rose-300">
                  Tarif Penjualan Jasa Cetak Retail (Marketplace &amp; Direct)
                </h2>
              </div>
              <p className="text-xs text-slate-400">
                Digunakan oleh modul Pesanan &amp; Antrean Produksi untuk kalkulasi otomatis harga jual customer berbasis gramasi &amp; durasi cetak.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Tarif Retail per Gram (Rp / gr)
                  </label>
                  <input
                    type="number"
                    value={settings.retailPricePerGram}
                    onChange={(e) =>
                      updateSettings({ retailPricePerGram: Number(e.target.value) })
                    }
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-rose-500/30 text-rose-300 font-bold font-mono text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Standar market 3D print: Rp 350 - Rp 600/gr</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Tarif Retail per Jam Cetak (Rp / jam)
                  </label>
                  <input
                    type="number"
                    value={settings.retailPricePerHour}
                    onChange={(e) =>
                      updateSettings({ retailPricePerHour: Number(e.target.value) })
                    }
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-rose-500/30 text-rose-300 font-bold font-mono text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Standar market: Rp 2.500 - Rp 5.000/jam</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Batas Peringatan Stok Rendah (gram)
                  </label>
                  <input
                    type="number"
                    value={settings.lowStockThreshold}
                    onChange={(e) =>
                      updateSettings({ lowStockThreshold: Number(e.target.value) })
                    }
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Badge merah di Inventaris jika sisa &lt; nilai ini</p>
                </div>
              </div>
            </div>

            {/* Section 2.5: Tarif Layer Height per Opsi Material */}
            <div className="bg-slate-900/60 p-5 sm:p-6 rounded-3xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-rose-400">
                  <Layers className="w-4 h-4" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-rose-300">
                    Tarif Layer Height per Opsi Material (Marketplace Rate)
                  </h2>
                </div>
                <span className="text-[10px] font-mono text-slate-500">
                  Harga Rp / Unit Pesanan
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Atur tarif harga per unit marketplace (Shopee / Tokopedia) untuk setiap varian bahan (PLA, PETG, TPU) berdasarkan resolusi layer height. Perubahan ini langsung sinkron ke kalkulator pesanan dan generator quotation WA.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                {/* PLA Rates */}
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-rose-500/30 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-xs font-black text-rose-400">PLA / PLA+</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 font-mono">Bahan Utama</span>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1 font-semibold">Fine (≤ 0.12mm)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs text-slate-500 font-mono">Rp</span>
                      <input
                        type="number"
                        value={settings.layerPricing?.pla?.fine ?? 1800}
                        onChange={(e) => updateSettings({
                          layerPricing: {
                            ...settings.layerPricing,
                            pla: { ...settings.layerPricing?.pla, fine: Number(e.target.value) }
                          }
                        })}
                        className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-rose-300 font-mono font-bold text-xs focus:outline-none focus:border-rose-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1 font-semibold">Standard (0.16 - 0.22mm)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs text-slate-500 font-mono">Rp</span>
                      <input
                        type="number"
                        value={settings.layerPricing?.pla?.standard ?? 1000}
                        onChange={(e) => updateSettings({
                          layerPricing: {
                            ...settings.layerPricing,
                            pla: { ...settings.layerPricing?.pla, standard: Number(e.target.value) }
                          }
                        })}
                        className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-rose-300 font-mono font-bold text-xs focus:outline-none focus:border-rose-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1 font-semibold">Draft (≥ 0.28mm)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs text-slate-500 font-mono">Rp</span>
                      <input
                        type="number"
                        value={settings.layerPricing?.pla?.draft ?? 800}
                        onChange={(e) => updateSettings({
                          layerPricing: {
                            ...settings.layerPricing,
                            pla: { ...settings.layerPricing?.pla, draft: Number(e.target.value) }
                          }
                        })}
                        className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-rose-300 font-mono font-bold text-xs focus:outline-none focus:border-rose-500"
                      />
                    </div>
                  </div>
                </div>

                {/* PETG Rates */}
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-amber-500/30 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-xs font-black text-amber-400">PETG</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 font-mono">Tahan Panas</span>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1 font-semibold">Fine (≤ 0.12mm)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs text-slate-500 font-mono">Rp</span>
                      <input
                        type="number"
                        value={settings.layerPricing?.petg?.fine ?? 1900}
                        onChange={(e) => updateSettings({
                          layerPricing: {
                            ...settings.layerPricing,
                            petg: { ...settings.layerPricing?.petg, fine: Number(e.target.value) }
                          }
                        })}
                        className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-amber-300 font-mono font-bold text-xs focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1 font-semibold">Standard (0.16 - 0.22mm)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs text-slate-500 font-mono">Rp</span>
                      <input
                        type="number"
                        value={settings.layerPricing?.petg?.standard ?? 1100}
                        onChange={(e) => updateSettings({
                          layerPricing: {
                            ...settings.layerPricing,
                            petg: { ...settings.layerPricing?.petg, standard: Number(e.target.value) }
                          }
                        })}
                        className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-amber-300 font-mono font-bold text-xs focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1 font-semibold">Draft (≥ 0.28mm)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs text-slate-500 font-mono">Rp</span>
                      <input
                        type="number"
                        value={settings.layerPricing?.petg?.draft ?? 1000}
                        onChange={(e) => updateSettings({
                          layerPricing: {
                            ...settings.layerPricing,
                            petg: { ...settings.layerPricing?.petg, draft: Number(e.target.value) }
                          }
                        })}
                        className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-amber-300 font-mono font-bold text-xs focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>

                {/* TPU Rates */}
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-emerald-500/30 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-xs font-black text-emerald-400">TPU (Flex)</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 font-mono">Elastis/Karet</span>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1 font-semibold">Fine (≤ 0.12mm)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs text-slate-500 font-mono">Rp</span>
                      <input
                        type="number"
                        value={settings.layerPricing?.tpu?.fine ?? 2500}
                        onChange={(e) => updateSettings({
                          layerPricing: {
                            ...settings.layerPricing,
                            tpu: { ...settings.layerPricing?.tpu, fine: Number(e.target.value) }
                          }
                        })}
                        className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-emerald-300 font-mono font-bold text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1 font-semibold">Standard (0.16 - 0.22mm)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs text-slate-500 font-mono">Rp</span>
                      <input
                        type="number"
                        value={settings.layerPricing?.tpu?.standard ?? 2200}
                        onChange={(e) => updateSettings({
                          layerPricing: {
                            ...settings.layerPricing,
                            tpu: { ...settings.layerPricing?.tpu, standard: Number(e.target.value) }
                          }
                        })}
                        className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-emerald-300 font-mono font-bold text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1 font-semibold">Draft (≥ 0.28mm)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs text-slate-500 font-mono">Rp</span>
                      <input
                        type="number"
                        value={settings.layerPricing?.tpu?.draft ?? 2000}
                        onChange={(e) => updateSettings({
                          layerPricing: {
                            ...settings.layerPricing,
                            tpu: { ...settings.layerPricing?.tpu, draft: Number(e.target.value) }
                          }
                        })}
                        className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-emerald-300 font-mono font-bold text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Link Toko Marketplace */}
            <div className="bg-slate-900/60 p-5 sm:p-6 rounded-3xl border border-slate-800 space-y-4">
              <div className="flex items-center gap-2 text-rose-400">
                <Store className="w-4 h-4" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-rose-300">
                  Tautan Etalase Toko Marketplace
                </h2>
              </div>
              <p className="text-xs text-slate-400">
                Link toko ini digunakan untuk tombol pintas checkout dan bagikan penawaran kepada klien di Pesanan.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Link Toko Tokopedia
                  </label>
                  <input
                    type="url"
                    value={settings.tokopediaLink}
                    onChange={(e) => updateSettings({ tokopediaLink: e.target.value })}
                    placeholder="https://tokopedia.com/..."
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Link Toko Shopee
                  </label>
                  <input
                    type="url"
                    value={settings.shopeeLink}
                    onChange={(e) => updateSettings({ shopeeLink: e.target.value })}
                    placeholder="https://shopee.co.id/..."
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Master Bobot Spul Kosong (Spool Tare Weight) */}
            <div className="bg-slate-900/60 p-5 sm:p-6 rounded-3xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-rose-400">
                  <Scale className="w-4 h-4" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-rose-300">
                    Master Bobot Kosong Spul Filamen (Tare Weight)
                  </h2>
                </div>
                <button
                  onClick={() => setShowAddSpool(!showAddSpool)}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Merk Spul</span>
                </button>
              </div>
              <p className="text-xs text-slate-400">
                Bobot tare spul kosong saat ditimbang di timbangan digital. Sistem menguranginya dari berat total timbangan untuk mengetahui sisa gramasi murni filamen secara presisi.
              </p>

              {showAddSpool && (
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 animate-in fade-in duration-150">
                  <div className="text-xs font-bold text-slate-200">Tambah Referensi Spul Baru</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      placeholder="Nama Brand (misal: Anycubic)"
                      value={newBrand}
                      onChange={(e) => setNewBrand(e.target.value)}
                      className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                    />
                    <select
                      value={newType}
                      onChange={(e) => setNewType(e.target.value)}
                      className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                    >
                      <option value="Plastic">Plastic (Plastik)</option>
                      <option value="Cardboard">Cardboard (Kardus Ramah Lingkungan)</option>
                      <option value="Reusable High-Temp">Reusable / MasterSpool</option>
                    </select>
                    <input
                      type="number"
                      placeholder="Bobot Kosong (gram)"
                      value={newWeight}
                      onChange={(e) => setNewWeight(Number(e.target.value))}
                      className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white font-mono"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      onClick={() => setShowAddSpool(false)}
                      className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
                    >
                      Batal
                    </button>
                    <button
                      onClick={handleAddSpoolWeight}
                      className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
                    >
                      Simpan Spul
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {settings.spoolWeights?.map((spool) => (
                  <div
                    key={spool.id}
                    className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between group hover:border-slate-700 transition-all"
                  >
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>🧵 {spool.brand}</span>
                        <span className="text-[10px] font-normal px-1.5 py-0.2 rounded bg-slate-900 text-slate-400 border border-slate-800">
                          {spool.type}
                        </span>
                      </div>
                      <div className="text-xs font-mono font-bold text-rose-400 mt-1">
                        {spool.emptyWeight} gram tare
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteSpoolWeight(spool.id)}
                      className="p-1.5 rounded-lg text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 transition-colors opacity-0 group-hover:opacity-100"
                      title="Hapus referensi ini"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: GOO-STUDIO SETTINGS                                */}
        {/* ========================================================= */}
        {activeTab === "goo-studio" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Section 1: Upah Operator & Waktu Kerja */}
            <div className="bg-slate-900/60 p-5 sm:p-6 rounded-3xl border border-slate-800 space-y-4">
              <div className="flex items-center gap-2 text-indigo-400">
                <Clock className="w-4 h-4" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                  Upah Operator &amp; Durasi Persiapan Job
                </h2>
              </div>
              <p className="text-xs text-slate-400">
                Kalkulasi upah teknisi untuk proses slicing, pembersihan bed, pelepasan support, dan inspeksi QC akhir.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Upah Standar Operator per Jam (Rp / jam)
                  </label>
                  <input
                    type="number"
                    value={settings.operatorCostPerHour}
                    onChange={(e) =>
                      updateSettings({ operatorCostPerHour: Number(e.target.value) })
                    }
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Standar workshop 3D: Rp 20.000 - Rp 35.000/jam</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Estimasi Durasi Kerja Operator per Job (menit)
                  </label>
                  <input
                    type="number"
                    value={settings.operatorMinutesPerJob}
                    onChange={(e) =>
                      updateSettings({ operatorMinutesPerJob: Number(e.target.value) })
                    }
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Rata-rata 10 menit (bed prep + post-processing)</p>
                </div>
              </div>
            </div>

            {/* Section 2: Amortisasi Mesin & Investasi */}
            <div className="bg-slate-900/60 p-5 sm:p-6 rounded-3xl border border-slate-800 space-y-4">
              <div className="flex items-center gap-2 text-indigo-400">
                <Cpu className="w-4 h-4" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                  Amortisasi Modal Mesin &amp; Depresiasi Alat
                </h2>
              </div>
              <p className="text-xs text-slate-400">
                Simulasi pemulihan modal pembelian mesin printer agar terakumulasi kembali dari setiap jam cetak yang berjalan.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Nilai Beli Mesin Printer (Rp)
                  </label>
                  <input
                    type="number"
                    value={settings.investmentCostTotal}
                    onChange={(e) =>
                      updateSettings({ investmentCostTotal: Number(e.target.value) })
                    }
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Target Periode Payback (Bulan)
                  </label>
                  <input
                    type="number"
                    value={settings.investmentPaybackMonths}
                    onChange={(e) =>
                      updateSettings({ investmentPaybackMonths: Number(e.target.value) })
                    }
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Standar ROI: 12 - 24 bulan</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Estimasi Jam Cetak per Bulan (Jam)
                  </label>
                  <input
                    type="number"
                    value={settings.monthlyPrintHours}
                    onChange={(e) =>
                      updateSettings({ monthlyPrintHours: Number(e.target.value) })
                    }
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Misal 5 jam/hari × 30 hari = 150 jam</p>
                </div>
              </div>

              {/* Real-time Calculation Result Box */}
              <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-2">
                <div className="flex items-center gap-2">
                  <span className="text-indigo-400 font-bold text-xs">📊 Nilai Depresiasi Mesin per Jam:</span>
                  <span className="text-xs text-slate-400">
                    (Nilai Investasi / [Bulan × Jam])
                  </span>
                </div>
                <div className="text-base font-bold font-mono text-indigo-300">
                  Rp {Math.round(machineDepreciationPerHour).toLocaleString("id-ID")} / jam
                </div>
              </div>
            </div>

            {/* Section 3: Target Margin & Batching Nesting */}
            <div className="bg-slate-900/60 p-5 sm:p-6 rounded-3xl border border-slate-800 space-y-4">
              <div className="flex items-center gap-2 text-indigo-400">
                <Layers className="w-4 h-4" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                  Target Margin Keuntungan &amp; Smart Batching Bed
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Target Margin Keuntungan Default (%)
                  </label>
                  <input
                    type="number"
                    value={settings.defaultMarginPercent}
                    onChange={(e) =>
                      updateSettings({ defaultMarginPercent: Number(e.target.value) })
                    }
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-indigo-500/30 text-indigo-300 font-bold font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Digunakan pada kalkulator harga jual</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Margin Tepi Bed Plate (mm)
                  </label>
                  <input
                    type="number"
                    value={settings.batchBedMargin}
                    onChange={(e) =>
                      updateSettings({ batchBedMargin: Number(e.target.value) })
                    }
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Jarak aman part dari pinggir bed</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Jarak Antar Part Nesting (mm)
                  </label>
                  <input
                    type="number"
                    value={settings.batchPartSpacing}
                    onChange={(e) =>
                      updateSettings({ batchPartSpacing: Number(e.target.value) })
                    }
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Jarak celah antar part cetak massal</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: GOOPRINT (CAD) SETTINGS                            */}
        {/* ========================================================= */}
        {activeTab === "gooprint" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-slate-900/60 p-5 sm:p-6 rounded-3xl border border-slate-800 space-y-4">
              <div className="flex items-center gap-2 text-cyan-400">
                <Compass className="w-4 h-4" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                  Konfigurasi CAD 3D Viewport &amp; Satuan Geometri
                </h2>
              </div>
              <p className="text-xs text-slate-400">
                Pengaturan tampilan ruang kerja 3D Canvas, grid koordinat, dan presisi pembentukan jaring segitiga (*mesh tessellation*) saat model diekspor ke format STL.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Satuan Ukuran Desain CAD
                  </label>
                  <select
                    value={settings.cadUnits}
                    onChange={(e) =>
                      updateSettings({ cadUnits: e.target.value as any })
                    }
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                  >
                    <option value="mm">Milimeter (mm) - Standar Manufaktur 3D</option>
                    <option value="cm">Sentimeter (cm)</option>
                    <option value="inch">Inci (inch / Imperial)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Mode Shading Tampilan Objek
                  </label>
                  <select
                    value={settings.cadShading}
                    onChange={(e) =>
                      updateSettings({ cadShading: e.target.value as any })
                    }
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                  >
                    <option value="pbr">PBR Realistic (Material Berpijar &amp; Bayangan Halus)</option>
                    <option value="matcap">MatCap Studio (Pencahayaan Tekstur Flat Clay)</option>
                    <option value="wireframe">Wireframe (Kerangka Segitiga Edge)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Toleransi Kerapatan Mesh STL (Export Resolution)
                  </label>
                  <select
                    value={settings.cadExportTolerance}
                    onChange={(e) =>
                      updateSettings({ cadExportTolerance: e.target.value as any })
                    }
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                  >
                    <option value="fine">Fine (0.01mm - Kurva Sangat Halus)</option>
                    <option value="standard">Standard (0.05mm - Seimbang)</option>
                    <option value="coarse">Coarse (0.1mm - File Ringan)</option>
                  </select>
                </div>

                <div className="space-y-3 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.cadGridVisible}
                      onChange={(e) =>
                        updateSettings({ cadGridVisible: e.target.checked })
                      }
                      className="rounded bg-slate-950 border-slate-800 text-cyan-500 focus:ring-0"
                    />
                    <span className="text-xs text-slate-300">Tampilkan Grid Koordinat di Viewport</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.cadGridSnap}
                      onChange={(e) =>
                        updateSettings({ cadGridSnap: e.target.checked })
                      }
                      className="rounded bg-slate-950 border-slate-800 text-cyan-500 focus:ring-0"
                    />
                    <span className="text-xs text-slate-300">Aktifkan Snap-to-Grid saat Memindahkan Objek</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.cadAutoRotate}
                      onChange={(e) =>
                        updateSettings({ cadAutoRotate: e.target.checked })
                      }
                      className="rounded bg-slate-950 border-slate-800 text-cyan-500 focus:ring-0"
                    />
                    <span className="text-xs text-slate-300">Auto-Rotate Orbit Kamera saat Diam (Turntable)</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: GOOOS SYSTEM SETTINGS                              */}
        {/* ========================================================= */}
        {activeTab === "system" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Section 1: Profil Studio */}
            <div className="bg-slate-900/60 p-5 sm:p-6 rounded-3xl border border-slate-800 space-y-4">
              <div className="flex items-center gap-2 text-purple-400">
                <Globe className="w-4 h-4" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-purple-300">
                  Profil Workshop &amp; Identitas Studio
                </h2>
              </div>
              <p className="text-xs text-slate-400">
                Identitas ini dicantumkan pada kop penawaran invoice pesanan dan metadata sistem GooOS.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Nama Studio / Workshop
                  </label>
                  <input
                    type="text"
                    value={settings.studioName}
                    onChange={(e) => updateSettings({ studioName: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Nama Pengelola / Operator
                  </label>
                  <input
                    type="text"
                    value={settings.ownerName}
                    onChange={(e) => updateSettings({ ownerName: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Email Kontak Studio
                  </label>
                  <input
                    type="email"
                    value={settings.ownerEmail}
                    onChange={(e) => updateSettings({ ownerEmail: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Preferensi Lokalisasi & Suara */}
            <div className="bg-slate-900/60 p-5 sm:p-6 rounded-3xl border border-slate-800 space-y-4">
              <div className="flex items-center gap-2 text-purple-400">
                <Sliders className="w-4 h-4" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-purple-300">
                  Preferensi Format &amp; Telemetri Sistem
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Mata Uang Acuan
                  </label>
                  <select
                    value={settings.currency}
                    onChange={(e) =>
                      updateSettings({ currency: e.target.value as any })
                    }
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-bold text-purple-300"
                  >
                    <option value="IDR (Rp)">IDR (Rupiah Indonesia - Rp)</option>
                    <option value="USD ($)">USD (US Dollar - $)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Bahasa Antarmuka
                  </label>
                  <select
                    value={settings.language}
                    onChange={(e) =>
                      updateSettings({ language: e.target.value as any })
                    }
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                  >
                    <option value="id">Bahasa Indonesia</option>
                    <option value="en">English (US)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Interval Polling Telemetri (Detik)
                  </label>
                  <input
                    type="number"
                    value={settings.telemetryRefreshInterval}
                    onChange={(e) =>
                      updateSettings({
                        telemetryRefreshInterval: Number(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Refresh status printer di navbar</p>
                </div>
              </div>
            </div>

            {/* Section 3: Cloud & Local Storage Diagnostics */}
            <div className="bg-slate-900/60 p-5 sm:p-6 rounded-3xl border border-slate-800 space-y-4">
              <div className="flex items-center gap-2 text-purple-400">
                <ShieldCheck className="w-4 h-4" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-purple-300">
                  Status Cloud Supabase &amp; Penyimpanan Browser
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Koneksi Database Supabase:</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1.5 font-mono">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      Terkoneksi (PostgreSQL)
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Sinkronisasi Terakhir:</span>
                    <span className="text-slate-200 font-mono text-[11px]">
                      {lastSaved ? lastSaved.toLocaleTimeString("id-ID") : "Aktif"}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Penyimpanan Cache Offline:</span>
                    <span className="text-emerald-400 font-bold font-mono">
                      LocalStorage OK
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Arsitektur Suite:</span>
                    <span className="text-slate-200 font-mono text-[11px]">
                      GooOS Unified v2.4
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap gap-3">
                <button
                  onClick={() => {
                    localStorage.removeItem("gooos_settings");
                    localStorage.removeItem("dflow_settings");
                    resetToDefaults();
                    showToast("Cache browser dibersihkan dan diinisialisasi ulang.");
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-950 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/30 text-slate-300 hover:text-rose-400 text-xs font-medium transition-colors"
                >
                  Bersihkan Cache Browser &amp; Reset Storage
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: AKUN & SESI PENGGUNA (ACCOUNT & SESSION)           */}
        {/* ========================================================= */}
        {activeTab === "account" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Section 1: Profil & Status Akun */}
            <div className="bg-slate-900/60 p-5 sm:p-6 rounded-3xl border border-slate-800 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold text-white shadow-xl shrink-0 ${
                      isDemo
                        ? "bg-gradient-to-tr from-amber-600 to-rose-600 ring-2 ring-amber-400/80 shadow-amber-500/20"
                        : user
                        ? "bg-gradient-to-tr from-rose-500 to-indigo-600 ring-2 ring-indigo-400/50 shadow-indigo-500/20"
                        : "bg-slate-800 text-slate-400 border border-slate-700"
                    }`}
                  >
                    {isDemo
                      ? "DM"
                      : user?.name
                      ? user.name.slice(0, 2).toUpperCase()
                      : "GO"}
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg font-black text-white">
                        {user?.name || (isDemo ? "Akun Demo GooOS" : "Pengguna Tamu (Belum Login)")}
                      </h2>
                      {isDemo ? (
                        <span className="text-[10px] font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/40 flex items-center gap-1">
                          <Lock className="w-3 h-3 text-amber-400" />
                          HANYA BACA (READ-ONLY)
                        </span>
                      ) : user ? (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/40 flex items-center gap-1">
                          <BadgeCheck className="w-3 h-3 text-emerald-400" />
                          AKUN UTAMA / ADMIN
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
                          BELUM LOGIN
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 font-mono">
                      {user?.email || (isDemo ? "demo@goocanan.com" : "Sesi publik tanpa autentikasi")}
                    </p>
                  </div>
                </div>

                {/* Sesi status pill */}
                <div className="flex items-center gap-2">
                  <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        user ? "bg-emerald-400 animate-pulse" : "bg-slate-500"
                      }`}
                    />
                    <span>{user ? "Sesi Terhubung" : "Sesi Tamu"}</span>
                  </div>
                </div>
              </div>

              {/* Grid Info Rinci Akun */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1">
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                    Tingkat Akses
                  </span>
                  <p className="text-sm font-bold text-white flex items-center gap-1.5">
                    {isDemo ? (
                      <span className="text-amber-300">Akses Eksplorasi Demo</span>
                    ) : user ? (
                      <span className="text-emerald-300">Akses Penuh (Full Read/Write)</span>
                    ) : (
                      <span className="text-slate-400">Tamu Terbatas</span>
                    )}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {isDemo
                      ? "Bisa melihat semua data 70+ pesanan & spul, tidak bisa input baru."
                      : user
                      ? "Berwenang mengubah konfigurasi, menambah pesanan & armada."
                      : "Harap login untuk menyimpan perubahan data."}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1">
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                    Workspace Farm
                  </span>
                  <p className="text-sm font-bold text-white truncate">
                    GooOS Production Fleet
                  </p>
                  <p className="text-[11px] font-mono text-slate-500 truncate">
                    ID: ws_3817e3eb6c344c4da519
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1">
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                    Sistem Autentikasi
                  </span>
                  <p className="text-sm font-bold text-cyan-300">
                    Better-Auth (Secure Cookie)
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Tersinkronisasi dengan Database PostgreSQL Supabase
                  </p>
                </div>
              </div>

              {/* Action Buttons: Logout, Ganti Akun, Beralih Demo */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                {user ? (
                  <>
                    <button
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 hover:text-rose-200 text-xs font-bold transition shadow-sm"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>{isLoggingOut ? "Sedang Keluar..." : "Keluar dari Akun (Logout)"}</span>
                    </button>

                    <Link
                      href="/auth/login"
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition"
                    >
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                      <span>Ganti Akun / Login Ulang</span>
                    </Link>

                    {!isDemo ? (
                      <button
                        onClick={handleQuickDemoSwitch}
                        disabled={isSwitchingDemo}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-bold transition"
                      >
                        <Lock className="w-4 h-4 text-amber-400" />
                        <span>
                          {isSwitchingDemo
                            ? "Memproses..."
                            : "Beralih ke Akun Demo (Hanya Baca)"}
                        </span>
                      </button>
                    ) : (
                      <Link
                        href="/auth/login"
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-300 text-xs font-bold transition"
                      >
                        <ShieldCheck className="w-4 h-4 text-indigo-400" />
                        <span>Masuk ke Akun Utama / Administrator</span>
                      </Link>
                    )}
                  </>
                ) : (
                  <>
                    <Link
                      href="/auth/login"
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white text-xs font-bold shadow-lg shadow-rose-500/20 transition hover:scale-[1.02]"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>Masuk ke Akun (Login)</span>
                    </Link>

                    <button
                      onClick={handleQuickDemoSwitch}
                      disabled={isSwitchingDemo}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-bold transition"
                    >
                      <Lock className="w-4 h-4 text-amber-400" />
                      <span>
                        {isSwitchingDemo
                          ? "Memproses..."
                          : "Masuk 1-Click sebagai Akun Demo"}
                      </span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Section 2: Matriks Hak Akses (Akses Penuh vs Mode Demo) */}
            <div className="bg-slate-900/60 p-5 sm:p-6 rounded-3xl border border-slate-800 space-y-4">
              <div className="flex items-center gap-2 text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                  Matriks Hak Akses &amp; Perlindungan Data
                </h3>
              </div>
              <p className="text-xs text-slate-400">
                GooOS menerapkan sistem pembatasan ganda (Client UI Guard &amp; Server API 403 Block) pada Akun Demo agar data produksi asli tidak dapat dimanipulasi atau dihapus secara sengaja maupun tidak sengaja.
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-800 text-[11px] text-slate-400 uppercase font-mono">
                      <th className="py-2.5 px-3">Modul &amp; Fungsi GooOS</th>
                      <th className="py-2.5 px-3 text-center">Akun Demo (Read-Only)</th>
                      <th className="py-2.5 px-3 text-center">Akun Admin (Full Access)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    <tr>
                      <td className="py-2.5 px-3 font-medium text-slate-200">
                        📊 Universal Dashboard &amp; Telemetri Farm
                      </td>
                      <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">
                        ✅ Akses Penuh
                      </td>
                      <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">
                        ✅ Akses Penuh
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-medium text-slate-200">
                        📋 Melihat Daftar 70+ Pesanan Cetak 3D
                      </td>
                      <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">
                        ✅ Akses Penuh
                      </td>
                      <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">
                        ✅ Akses Penuh
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-medium text-slate-200">
                        ➕ Menambah, Mengedit, atau Menghapus Pesanan
                      </td>
                      <td className="py-2.5 px-3 text-center text-rose-400 font-semibold flex items-center justify-center gap-1">
                        <Lock className="w-3 h-3" />
                        <span>Diblokir (403)</span>
                      </td>
                      <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">
                        ✅ Diizinkan
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-medium text-slate-200">
                        🧵 Melihat Stok 128 Spul Filamen &amp; Sisa Gramasi
                      </td>
                      <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">
                        ✅ Akses Penuh
                      </td>
                      <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">
                        ✅ Akses Penuh
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-medium text-slate-200">
                        ➕ Tambah Spul Baru &amp; Perbarui Berat Filamen
                      </td>
                      <td className="py-2.5 px-3 text-center text-rose-400 font-semibold flex items-center justify-center gap-1">
                        <Lock className="w-3 h-3" />
                        <span>Diblokir (403)</span>
                      </td>
                      <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">
                        ✅ Diizinkan
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-medium text-slate-200">
                        🖨️ Melihat Armada Mesin Printer (Creality &amp; Bambu)
                      </td>
                      <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">
                        ✅ Akses Penuh
                      </td>
                      <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">
                        ✅ Akses Penuh
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-medium text-slate-200">
                        📦 Katalog Model Produk 3D &amp; COGS
                      </td>
                      <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">
                        ✅ Akses Penuh
                      </td>
                      <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">
                        ✅ Akses Penuh
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-medium text-slate-200">
                        💳 Buku Kas Arus Transaksi &amp; Ledger
                      </td>
                      <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">
                        ✅ Akses Penuh
                      </td>
                      <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">
                        ✅ Akses Penuh
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-medium text-slate-200">
                        🎨 GooPrint CAD Studio &amp; Generator Frame
                      </td>
                      <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">
                        ✅ Akses Bebas
                      </td>
                      <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">
                        ✅ Akses Bebas
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 3: Informasi Kredensial Akun Demo */}
            <div className="bg-gradient-to-br from-amber-500/10 via-slate-900/60 to-slate-900/60 p-5 sm:p-6 rounded-3xl border border-amber-500/30 space-y-4">
              <div className="flex items-center gap-2 text-amber-300">
                <Key className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider">
                  Kredensial Publik Akun Demo
                </h3>
              </div>
              <p className="text-xs text-slate-300">
                Kredensial ini dapat dibagikan kepada calon mitra, klien, atau audiens presentasi untuk melihat kapabilitas GooOS secara langsung tanpa risiko data produksi terhapus atau tertimpa.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                      Email Demo
                    </span>
                    <span className="font-mono text-xs text-white font-semibold">
                      demo@goocanan.com
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopy("demo@goocanan.com", "Email Demo")}
                    className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition"
                    title="Salin Email"
                  >
                    {copiedKey === "Email Demo" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                      Password Demo
                    </span>
                    <span className="font-mono text-xs text-white font-semibold">
                      demouser123
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopy("demouser123", "Password Demo")}
                    className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition"
                    title="Salin Password"
                  >
                    {copiedKey === "Password Demo" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
          <div className="text-xs font-mono text-slate-400">Memuat Pengaturan GooOS...</div>
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}
