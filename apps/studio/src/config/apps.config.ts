export interface SubMenu {
  name: string;
  href: string;
  description: string;
  icon: string;
  badge?: string;
  isExternal?: boolean;
}

export interface GooApp {
  id: string;
  name: string;
  tagline: string;
  description: string;
  version: string;
  status: "active" | "beta" | "coming_soon";
  category: "Manufacturing" | "Design & CAD" | "E-Commerce" | "Intelligence";
  icon: string;
  color: string;
  accentColor: string;
  gradient: string;
  borderHover: string;
  href: string;
  stats?: {
    label: string;
    value: string;
  }[];
  menu: SubMenu[];
}

export const GOO_APPS: GooApp[] = [
  {
    id: "3dflow",
    name: "3DFlow",
    tagline: "Additive Manufacturing & Farm Operations",
    description:
      "End-to-end telemetry sistem cetak 3D, monitoring armada printer, manajemen spul filamen & aset packaging, order tracking, katalog produk, dan buku kas transaksi.",
    version: "v2.4 Pro",
    status: "active",
    category: "Manufacturing",
    icon: "⚡",
    color: "#f43f5e",
    accentColor: "rose",
    gradient: "from-rose-500/20 via-rose-500/5 to-transparent",
    borderHover: "hover:border-rose-400 hover:shadow-rose-500/10",
    href: "/flow",
    stats: [
      { label: "Spool Filamen", value: "128 Items" },
      { label: "Armada Printer", value: "3 Online" },
      { label: "Transaksi Buku Kas", value: "474 Catatan" },
    ],
    menu: [
      {
        name: "Flow Hub",
        href: "/flow",
        description: "Telemetri live armada printer, metrik KPI, & status produksi cetak",
        icon: "📊",
        badge: "Live Telemetry",
      },
      {
        name: "Inventaris Filamen & Aset",
        href: "/inventory",
        description: "128 spul filamen (gauge sisa gramasi) + 66 aset packaging & hardware",
        icon: "🧵",
        badge: "194 Total",
      },
      {
        name: "Katalog Produk 3D",
        href: "/products",
        description: "40 item produk siap cetak dengan kalkulasi COGS, margin, & durasi print",
        icon: "📦",
        badge: "40 Models",
      },
      {
        name: "Buku Kas & Transaksi",
        href: "/transactions",
        description: "474 catatan transaksi keuangan (Shopee, Tokopedia, direct client)",
        icon: "💳",
        badge: "Ledger",
      },
      {
        name: "Armada Printer",
        href: "/printers",
        description: "Monitoring status Creality Hi, Bambu Lab, temperatur nozzle & bed",
        icon: "🖨️",
        badge: "3 Active",
      },
      {
        name: "Pesanan Cetak",
        href: "/orders",
        description: "Tracking 69 antrean pesanan cetak dari draft hingga pengiriman",
        icon: "📑",
        badge: "69 Orders",
      },
    ],
  },
  {
    id: "goo-studio",
    name: "GOO-Studio",
    tagline: "Design Engineering & Smart Batching",
    description:
      "Manajemen proyek 3D, perpustakaan komponen STL part, algoritma multi-part bed plate nesting batching otomatis, dan simulasi kalkulator harga jual.",
    version: "v3.1",
    status: "active",
    category: "Design & CAD",
    icon: "📐",
    color: "#6366f1",
    accentColor: "indigo",
    gradient: "from-indigo-500/20 via-indigo-500/5 to-transparent",
    borderHover: "hover:border-indigo-400 hover:shadow-indigo-500/10",
    href: "/projects",
    stats: [
      { label: "Proyek 3D", value: "14 Proyek" },
      { label: "Komponen Part", value: "265 STL" },
      { label: "Batch Plates", value: "7 Plates" },
    ],
    menu: [
      {
        name: "Proyek & Komponen STL",
        href: "/projects",
        description: "14 proyek desain aktif dengan 265 rincian file part STL & gramasi",
        icon: "📁",
        badge: "265 Parts",
      },
      {
        name: "Smart Batching Optimizer",
        href: "/batching",
        description: "7 bed plates batching multi-part tersusun efisien untuk cetak massal",
        icon: "🧩",
        badge: "Plate Slicer",
      },
      {
        name: "Inventaris Filamen",
        href: "/inventory",
        description: "Pantau ketersediaan stok spul filamen untuk kebutuhan batching",
        icon: "🧵",
      },
      {
        name: "Kalkulator Biaya & Margin",
        href: "/calculator",
        description: "Simulasi biaya material, listrik, depresiasi alat, dan rekomendasi harga",
        icon: "🧮",
        badge: "Simulator",
      },
    ],
  },
  {
    id: "gooprint",
    name: "GooPrint",
    tagline: "Cloud CAD Studio & Rapid Prototyping",
    description:
      "Studio CAD parametrik berbasis web untuk pembuatan model teknis 3D langsung di browser, visualisasi geometri, dan integrasi slicer engine.",
    version: "v1.2",
    status: "active",
    category: "Design & CAD",
    icon: "🎨",
    color: "#06b6d4",
    accentColor: "cyan",
    gradient: "from-cyan-500/20 via-cyan-500/5 to-transparent",
    borderHover: "hover:border-cyan-400 hover:shadow-cyan-500/10",
    href: "/cad",
    stats: [
      { label: "Engine", value: "Parametric 3D" },
      { label: "Format", value: "STL / STEP / OBJ" },
      { label: "Export", value: "Instant Mesh" },
    ],
    menu: [
      {
        name: "CAD Studio Hub",
        href: "/cad",
        description: "Ruang kerja pemodelan parametrik 3D real-time dengan editor visual",
        icon: "💻",
        badge: "WebCAD",
      },
      {
        name: "Slicer Bridge & Export",
        href: "/cad",
        description: "Konektor langsung dari desain CAD ke antrean cetak 3DFlow",
        icon: "⚙️",
        badge: "G-Code Bridge",
      },
      {
        name: "Parametric Part Generator",
        href: "/cad",
        description: "Generator roda gigi, box enclosure, dan bracket otomatis dengan input ukuran",
        icon: "🪄",
        badge: "AutoCAD",
      },
    ],
  },
  {
    id: "goomarket",
    name: "GooMarket",
    tagline: "Multi-Channel Marketplace Sync",
    description:
      "Integrasi sinkronisasi pesanan dan stok otomatis ke Shopee, Tokopedia, dan TikTok Shop dengan auto-reserve inventory.",
    version: "v0.9",
    status: "coming_soon",
    category: "E-Commerce",
    icon: "🛍️",
    color: "#f59e0b",
    accentColor: "amber",
    gradient: "from-amber-500/20 via-amber-500/5 to-transparent",
    borderHover: "hover:border-amber-400 hover:shadow-amber-500/10",
    href: "#",
    stats: [
      { label: "Status", value: "Tahap R&D" },
      { label: "Kanal", value: "Shopee & Tokopedia" },
    ],
    menu: [
      {
        name: "Koneksi Toko Online",
        href: "#",
        description: "Sinkronisasi etalase toko dan reservasi stok filamen otomatis",
        icon: "🔗",
        badge: "Coming Soon",
      },
    ],
  },
  {
    id: "gooai",
    name: "GooAI Copilot",
    tagline: "Autonomous 3D Engineering Intelligence",
    description:
      "Asisten cerdas analisis orientasi cetak optimum, estimasi kemungkinan stringing/warping, serta auto-generate rekomendasi parameter slicer.",
    version: "v0.5",
    status: "coming_soon",
    category: "Intelligence",
    icon: "✨",
    color: "#8b5cf6",
    accentColor: "purple",
    gradient: "from-purple-500/20 via-purple-500/5 to-transparent",
    borderHover: "hover:border-purple-400 hover:shadow-purple-500/10",
    href: "#",
    stats: [
      { label: "Model", value: "Antigravity AI" },
      { label: "Fitur", value: "Defect Prevention" },
    ],
    menu: [
      {
        name: "AI Print Inspector",
        href: "#",
        description: "Deteksi kesalahan geometri dan orientasi model STL sebelum dicetak",
        icon: "🧠",
        badge: "Preview",
      },
    ],
  },
];
