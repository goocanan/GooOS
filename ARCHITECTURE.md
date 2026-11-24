# GooOS — Operating System for Your Content & Production Workflow

**Versi:** 0.1.0-beta  
**Status:** Monorepo Architecture Unified & Production-Ready  
**Tech Stack:** Next.js 15 (App Router) + TypeScript 5.9 + Tailwind CSS 4 + Drizzle ORM + PostgreSQL + Better Auth + Turborepo

---

## 📁 Struktur Monorepo

```
gooos/
├── apps/
│   └── studio/                             # Main Application: GooOS Studio & Flow Farm
│       ├── src/
│       │   ├── app/                        # Next.js App Router
│       │   │   ├── layout.tsx              # Root layout + providers + theme engine
│       │   │   ├── globals.css             # Tailwind 4 CSS + OLED Cyberpunk Theme
│       │   │   ├── page.tsx                # Studio Landing & redirect
│       │   │   ├── dashboard/              # Studio overview dashboard
│       │   │   ├── content/                # Content Planner & Performance Tracker
│       │   │   │                           # (Pillars, Pipeline, Ideas Bank, Analytics)
│       │   │   ├── flow/                   # 3D Print Farm Overview & Telemetry
│       │   │   ├── orders/                 # Order Management, Quotations, & Batching
│       │   │   ├── inventory/              # Filament Spool Inventory & SKU Barcodes
│       │   │   ├── products/               # 3D Product Catalog, Parts & Pricing
│       │   │   ├── printers/               # 3D Printer Fleet, Maintenance & Status
│       │   │   ├── transactions/           # Farm Financials, HPP & Marketplace Fees
│       │   │   ├── calculator/             # 3D Print Cost & COGS Simulator
│       │   │   ├── batching/               # Build Plate Batching & Production Queue
│       │   │   ├── cad/                    # GooPrint CAD Hub & 3D Viewer
│       │   │   │   └── polaroid/           # 3D Lithophane & Customizer Engine
│       │   │   ├── settings/               # Farm Parameters & Studio Defaults
│       │   │   ├── account/                # User Profile & Account Settings
│       │   │   ├── auth/                   # Authentication (Login & Register)
│       │   │   └── api/                    # Backend API Route Handlers
│       │   │       ├── auth/[...all]/      # Better Auth handler
│       │   │       ├── flow/               # Flow Farm CRUD endpoints (orders, spools,
│       │   │       │                       # products, printers, transactions, uploads)
│       │   │       ├── health/             # Health check endpoint
│       │   │       └── workspaces/         # Workspace management API
│       │   ├── components/                 # Presentation & UI Components
│       │   │   ├── GooNavbar.tsx           # Unified full-height left navigation sidebar
│       │   │   ├── GooScrollNav.tsx        # Scroll-to-top / quick navigation
│       │   │   ├── GooSplashLoader.tsx     # Animated bootloader
│       │   │   ├── PwaInstaller.tsx        # PWA installation banner
│       │   │   ├── DemoNoticeBanner.tsx    # Demo mode indicator & guard modals
│       │   │   ├── FilamentBrandLogo.tsx   # Verified filament brand SVG logos
│       │   │   ├── GooCyberpunkThemeToggle # OLED / Cyberpunk theme switcher
│       │   │   └── content-planner/        # Modular Content Planner tabs & modals
│       │   ├── hooks/                      # Custom React Hooks
│       │   │   ├── use-goo-settings.ts     # Studio & Farm parameters sync (localStorage)
│       │   │   └── use-demo-mode.ts        # Client-side demo mode & read-only guard
│       │   └── lib/                        # Domain Engines, Utilities & Security
│       │       ├── flow/
│       │       │   └── pricing.ts          # Core Flow Pricing & Real COGS (HPP) Engine
│       │       ├── content-planner/        # Content Planner storage, metrics, & types
│       │       ├── access-guard.ts         # User session & tenant isolation guard
│       │       ├── demo-guard.ts           # Server-side mutation blocker for demo mode
│       │       ├── demo-data.ts            # Realistic demo dataset for sandbox
│       │       ├── filament-sku.ts         # Auto-generated filament SKU generator
│       │       └── product-sku.ts          # Auto-generated product SKU generator
│       ├── .eslintrc.json                  # Next.js ESLint configuration
│       ├── next.config.ts                  # Next.js compiler & experimental config
│       ├── tailwind.config.ts              # Tailwind CSS brand configuration
│       ├── tsconfig.json                   # TypeScript config extending @gooos/config
│       └── package.json
│
├── packages/
│   ├── config/                             # Shared TypeScript & Tooling Config
│   │   ├── typescript/
│   │   │   ├── base.json                   # Strict ES2022 compiler configuration
│   │   │   ├── nextjs.json                 # Next.js DOM & JSX preservations
│   │   │   └── react-library.json          # React library compiler configuration
│   │   └── package.json
│   │
│   ├── db/                                 # Drizzle ORM + PostgreSQL Schema
│   │   ├── src/
│   │   │   ├── schema/
│   │   │   │   ├── index.ts                # Core schema (Workspaces, Users, Content)
│   │   │   │   └── flow.ts                 # GooFlow schema (Farm, Fleet, Orders, Spools)
│   │   │   ├── index.ts                    # Drizzle client export
│   │   │   ├── seed.ts                     # Database seeding script
│   │   │   └── migrate_fleet.ts            # Database migration utilities
│   │   ├── drizzle.config.ts               # Drizzle Kit config
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── auth/                               # Better Auth Package
│       ├── src/
│       │   └── index.ts                    # Better Auth provider & adapters
│       ├── tsconfig.json
│       └── package.json
│
├── design-system/                          # Design Tokens & UI Specs
│   ├── studio-bento/                       # Bento grid design tokens & guidelines
│   └── studio-oled-cyberpunk/              # Cyberpunk OLED high-contrast design tokens
│
├── pnpm-workspace.yaml                     # pnpm Monorepo configuration
├── turbo.json                              # Turborepo task pipeline (build, lint, dev)
├── package.json                            # Monorepo root scripts & dev dependencies
└── README.md
```

---

## 🏛️ Pola Arsitektur Utama (Architecture Patterns)

### 1. Layered Monorepo Architecture
Arsitektur GooOS memisahkan tanggung jawab kode ke dalam 5 lapisan yang terisolasi dengan rapi:
- **Presentation Layer (`apps/studio/src/app` & `components/`):** React 19 Client & Server Components, bertanggung jawab pada visual, interaksi pengguna, dan responsive layouts.
- **Domain Logic Layer (`apps/studio/src/lib/`):** Engine kalkulasi bisnis murni yang tidak bergantung pada framework UI (contoh: `@/lib/flow/pricing.ts` untuk HPP/COGS dan `@/lib/content-planner/` untuk scoring performa).
- **Security & Authorization Layer (`access-guard.ts` & `demo-guard.ts`):** Memastikan isolasi data multi-tenant berdasarkan `userId`/`workspaceId` dan memblokir mutasi berbahaya pada mode demo/tamu.
- **API & Integration Layer (`apps/studio/src/app/api/`):** RESTful Next.js Route Handlers yang memvalidasi request dan mendelegasikan query ke ORM.
- **Data Persistence Layer (`packages/db`):** Drizzle ORM dengan PostgreSQL, tipe skema terpusat, migrasi terkelola, dan relasi kuat.

### 2. Centralized Pricing & COGS Engine (`@/lib/flow/pricing.ts`)
Seluruh kalkulasi finansial 3D print farm dipusatkan pada satu modul terpadu untuk mencegah inkonsistensi harga:
- `normalizeQuotationMaterialName`: Standardisasi nama bahan cetak untuk quotation pelanggan.
- `getLayerUnitPrice`: Penentuan tarif jasa cetak berdasarkan ketebalan layer (fine/standard/draft) dan material (PLA, PETG, TPU).
- `getBasePrintPrice`: Rumus dasar kombinasi berat bahan (gram) dan durasi cetak (jam).
- `getMarketplaceUnits`: Konversi harga ke unit kelipatan Rp 1.000 untuk etalase marketplace (Tokopedia/Shopee).
- `getLayerAdjustedPrice`: Perhitungan akhir harga jual disesuaikan dengan layer height dan kuantitas order.
- `formatIDR`: Standardisasi tampilan mata uang Rupiah (`Rp 150.000`).

### 3. Modular Subcomponent Pattern
Untuk menghindari file halaman monolitik (seperti pada modul legacy), setiap fitur kompleks dipecah menjadi modul-modul independen (seperti yang telah diimplementasikan pada `content/page.tsx`):
- Tab komponen terisolasi (`DashboardTab`, `PipelineTab`, `BankIdeTab`, dll.)
- Modal dialog mandiri (`MetricModal`, `PromoteModal`, `ContentDetailModal`)
- Penyimpanan status terpisah (`storage.ts`)

---

## 🗄️ Database Schema

### A. Core & Identity
- **users** — Akun pengguna, profil, OAuth provider, dan sesi.
- **workspaces** — Ruang kerja multi-tenant (GOOCANAN 3D, KSM, Personal).
- **workspace_members** — Akses berbasis peran (owner, admin, manager, creator, reviewer, client).
- **brands** — Profil identitas visual brand per workspace (logo, palet warna, guidelines).

### B. Content Creation Pipeline
- **content** — Rekaman konten utama (siklus hidup: idea → script → production → published).
- **content_versions** — Riwayat revisi dan draf konten.
- **content_platforms** — Penyesuaian multi-platform (TikTok, IG Reel, YouTube Shorts).
- **scripts** — Naskah video (hook, intro, body, scenes, CTA).
- **comments** — Diskusi kolaboratif antartim.
- **approvals** — Alur persetujuan bertingkat per reviewer.
- **ideas** — Bank ide kreatif dan backlog konten.
- **campaigns** — Pengelompokan kampanye tematik.
- **hashtags & hashtag_groups** — Manajemen tagar dan metrik performa.
- **analytics** — Statistik harian konten (views, likes, CTR, engagement).

### C. GooFlow 3D Print Farm & Fleet
- **flow_inventory** — Stok spool filamen (SKU, brand, material, warna, sisa berat, harga modal per gram).
- **flow_inventory_transactions** — Log audit keluar/masuk filamen (pemakaian order vs restock).
- **flow_printers** — Armada mesin 3D printer (model, status operasional, jam terbang, nozzle, telemetry).
- **flow_products** — Katalog produk cetak 3D dengan varian bahan dan formula harga.
- **flow_orders** — Pesanan produksi pelanggan (nomor pesanan, status, HPP riil, harga jual, jadwal).
- **flow_order_items** — Rincian item part dan pemakaian filamen per order.
- **flow_batches** — Batch antrean produksi untuk optimasi print plate.
- **flow_parts** — Part 3D individual yang diasosiasikan dengan project atau batch.
- **flow_assets** — File 3D (STL, 3MF, OBJ, G-code) dan spare parts mesin.
- **flow_transactions** — Rekam keuangan farm (biaya listrik, spare part, fee marketplace 7%, laba bersih).
- **flow_settings** — Parameter operasional farm (tarif listrik PLN, depresiasi mesin, fee marketplace, dsb).

---

## 🎨 UI Architecture & Design System

- **Unified Navigation Sidebar (`GooNavbar.tsx`):** Navigasi vertikal penuh (full-height left sidebar) dengan app switcher, badge status realtime, dan menu profil terpadu di bagian bawah.
- **Theme Engine (`globals.css`):**
  - **GooOS Classic:** Slate-950 dark theme dengan aksen Goo Purple (`#9333ea`) dan Indigo.
  - **OLED Cyberpunk (`theme-oled-cyberpunk`):** Pure black surfaces (`#000000`), cyan neons (`#00F0FF`), acid green accents (`#00FF66`), dan high-contrast borders.
- **Responsive & PWA Ready:** Mendukung instalasi aplikasi mandiri melalui Service Worker dan `PwaInstaller.tsx`.

---

## 🛠️ Verification & Pipeline Commands

```bash
# 1. Jalankan development server dengan Turbo watch mode
pnpm dev

# 2. Build production semua packages dan apps
pnpm turbo build

# 3. Jalankan ESLint linter terpusat
pnpm turbo lint

# 4. Format seluruh codebase dengan Prettier
pnpm format

# 5. Database operations (Drizzle Kit)
pnpm db:generate    # Generate file migrasi dari skema
pnpm db:push        # Push skema langsung ke PostgreSQL dev
pnpm db:seed        # Seed demo data
```

---

Built with precision for **GooOS & GOOCANAN Production Workflow**.  
**Precision in Every Layer • Precision in Every Workflow**
