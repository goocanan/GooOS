/**
 * DEMO SAMPLE DATA STORE
 * 
 * Provides isolated, realistic, and curated sample data for Demo mode (guest/read-only visitors).
 * This guarantees that:
 * 1. Demo visitors see a realistic, functional 3D printing studio workflow.
 * 2. 0% of the Owner's live production database (real orders, customer names, actual financial transactions,
 *    and real filament stock) is exposed to demo accounts.
 */

export interface DemoProduct {
  id: string;
  name: string;
  sku: string;
  category: string;
  description: string;
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
  pricingMode: string;
  qtyPart: number;
  infill: string;
  layerHeight: string;
  notes: string | null;
  referenceLink: string | null;
  link1: string | null;
  link2: string | null;
  selectedMaterialId: string | null;
  items: any[];
  options: any[];
  createdAt: string;
  updatedAt: string;
}

export interface DemoOrderItem {
  id: string;
  orderId: string;
  inventoryId?: string | null;
  weightUsed: number;
  cost: number;
}

export interface DemoOrder {
  id: string;
  orderNumber: string;
  modelName: string;
  sku: string;
  clientName: string;
  status: "pending" | "queued" | "printing" | "completed" | "cancelled";
  progress: number;
  price: number;
  source: string;
  materialType: string;
  materialColor: string;
  quantity: number;
  qtyPart: number;
  infill: string;
  layerHeight: string;
  weight: number;
  time: number;
  dueDate: string;
  modelImageUrl?: string | null;
  batchId?: string | null;
  errorMessage?: string | null;
  createdAt: string;
  updatedAt: string;
  items?: DemoOrderItem[];
}

export interface DemoInventoryItem {
  id: string;
  sku: string;
  brand: string;
  type?: string;
  version?: string;
  materialType: string;
  color: string;
  colorHex: string;
  currentWeight: number;
  initialWeight: number;
  pricePerGram: number;
  imageUrl?: string | null;
  productLink?: string | null;
  lowStockThreshold: number;
  purchaseDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DemoPrinter {
  id: string;
  name: string;
  model: string;
  status: "printing" | "idle" | "offline" | "maintenance";
  purchasePrice: number;
  serialNumber: string;
  buildVolume: string;
  nozzleInstalled: string;
  bedPlateInstalled: string;
  maintenanceIntervalDays: number;
  nozzleTemp: number;
  bedTemp: number;
  printProgress: number;
  currentJob: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DemoTransaction {
  id: string;
  description: string;
  category: string;
  type: "income" | "expense";
  amount: number;
  quantity: number;
  date: string;
  orderId?: string | null;
  inventoryId?: string | null;
  printerId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DemoAsset {
  id: string;
  name: string;
  category: string;
  partCategory?: string | null;
  condition: string;
  quantity: number;
  initialQuantity: number;
  price: number;
  notes?: string | null;
  productLink?: string | null;
  type?: string | null;
  size?: string | null;
  printerId?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// SAMPLE DATA DEFINITIONS
// ============================================================================

function formatDemoDate(offsetDays: number = 0): string {
  const d = new Date(Date.now() + 86400000 * offsetDays);
  return d.toISOString().slice(0, 10);
}

export const DEMO_PRODUCTS: DemoProduct[] = [
  {
    id: "demo_prd_1",
    name: "Articulated Crystal Dragon",
    sku: "SMPL-DRG-CRY",
    category: "Toys & Figures",
    description: "Model naga kristal fleksibel artikulasi penuh. Cocok untuk display dan koleksi figur 3D.",
    imageUrl: null,
    modelWeight: 145,
    printingTime: 5.5,
    materialCost: 25375,
    energyCost: 2475,
    wearCost: 5500,
    packagingCost: 8000,
    taxRate: 7,
    finalPrice: 125000,
    marginPercent: 60,
    manualPrice: 125000,
    pricingMode: "total_modal",
    qtyPart: 1,
    infill: "15% Gyroid",
    layerHeight: "0.20mm Standard",
    notes: "Rekomendasi print bed bertipe PEI bertekstur untuk daya rekat optimal tanpa brim.",
    referenceLink: "https://makerworld.com",
    link1: null,
    link2: null,
    selectedMaterialId: "demo_inv_4",
    items: [
      {
        id: "demo_c1",
        name: "Badan Naga Kristal",
        modelWeight: 145,
        printingTime: 5.5,
        qtyPart: 1,
        infill: "15%",
        layerHeight: "0.20mm",
        selectedMaterialId: "demo_inv_4",
      },
    ],
    options: [
      {
        id: "demo_opt_1",
        name: "Silk Rainbow PLA",
        sku: "SMPL-DRG-CRY-SRB",
        pricingMode: "total_modal",
        manualPrice: 125000,
        finalPrice: 125000,
        modelWeight: 145,
        printingTime: 5.5,
        qtyPart: 1,
        items: [
          {
            id: "demo_c1",
            name: "Badan Naga Kristal",
            modelWeight: 145,
            printingTime: 5.5,
            qtyPart: 1,
            infill: "15%",
            layerHeight: "0.20mm",
          },
        ],
      },
      {
        id: "demo_opt_2",
        name: "Dual-Color Gold-Purple",
        sku: "SMPL-DRG-CRY-DGP",
        pricingMode: "total_modal",
        manualPrice: 135000,
        finalPrice: 135000,
        modelWeight: 145,
        printingTime: 5.5,
        qtyPart: 1,
        items: [
          {
            id: "demo_c2",
            name: "Badan Naga Kristal (Dual Tone)",
            modelWeight: 145,
            printingTime: 5.5,
            qtyPart: 1,
            infill: "15%",
            layerHeight: "0.20mm",
          },
        ],
      },
    ],
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: "demo_prd_2",
    name: "Geometric Hexagon Planter Pot",
    sku: "SMPL-HEX-PLT",
    category: "Home Decor",
    description: "Pot tanaman mini sukulen dengan desain heksagonal modern dan lubang drainase air.",
    imageUrl: null,
    modelWeight: 85,
    printingTime: 3.2,
    materialCost: 16150,
    energyCost: 1440,
    wearCost: 3200,
    packagingCost: 6000,
    taxRate: 7,
    finalPrice: 65000,
    marginPercent: 55,
    manualPrice: 65000,
    pricingMode: "total_modal",
    qtyPart: 2,
    infill: "20% Grid",
    layerHeight: "0.20mm Standard",
    notes: "Gunakan PETG agar tahan air dan paparan sinar matahari outdoor.",
    referenceLink: null,
    link1: null,
    link2: null,
    selectedMaterialId: "demo_inv_3",
    items: [
      {
        id: "demo_c21",
        name: "Pot Heksagonal Utama",
        modelWeight: 65,
        printingTime: 2.4,
        qtyPart: 1,
        infill: "20%",
        layerHeight: "0.20mm",
      },
      {
        id: "demo_c22",
        name: "Tatakan Tray Drainase",
        modelWeight: 20,
        printingTime: 0.8,
        qtyPart: 1,
        infill: "20%",
        layerHeight: "0.20mm",
      },
    ],
    options: [
      {
        id: "demo_opt_21",
        name: "White PETG + Tray",
        sku: "SMPL-HEX-PLT-WHT",
        pricingMode: "total_modal",
        manualPrice: 65000,
        finalPrice: 65000,
        modelWeight: 85,
        printingTime: 3.2,
        qtyPart: 2,
        items: [
          { id: "demo_c21", name: "Pot Heksagonal Utama", modelWeight: 65, printingTime: 2.4, qtyPart: 1 },
          { id: "demo_c22", name: "Tatakan Tray Drainase", modelWeight: 20, printingTime: 0.8, qtyPart: 1 },
        ],
      },
    ],
    createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "demo_prd_3",
    name: "Modular Desk Cable Organizer (Set of 3)",
    sku: "SMPL-CBL-MOD",
    category: "Utility & Tools",
    description: "Klip pengatur kabel meja fleksibel modular untuk kabel USB, Type-C, dan charger laptop.",
    imageUrl: null,
    modelWeight: 45,
    printingTime: 1.8,
    materialCost: 7875,
    energyCost: 810,
    wearCost: 1800,
    packagingCost: 4000,
    taxRate: 7,
    finalPrice: 35000,
    marginPercent: 50,
    manualPrice: 35000,
    pricingMode: "total_modal",
    qtyPart: 3,
    infill: "100% Solid",
    layerHeight: "0.16mm High Quality",
    notes: "Dianjurkan mencetak dengan TPU 95A agar lentur dan tidak merusak kabel.",
    referenceLink: null,
    link1: null,
    link2: null,
    selectedMaterialId: "demo_inv_5",
    items: [
      {
        id: "demo_c31",
        name: "Cable Clip Holder",
        modelWeight: 45,
        printingTime: 1.8,
        qtyPart: 3,
        infill: "100%",
        layerHeight: "0.16mm",
      },
    ],
    options: [
      {
        id: "demo_opt_31",
        name: "TPU 95A Matte Black (Set isi 3)",
        sku: "SMPL-CBL-MOD-BLK",
        pricingMode: "total_modal",
        manualPrice: 35000,
        finalPrice: 35000,
        modelWeight: 45,
        printingTime: 1.8,
        qtyPart: 3,
        items: [{ id: "demo_c31", name: "Cable Clip Holder", modelWeight: 45, printingTime: 1.8, qtyPart: 3 }],
      },
    ],
    createdAt: new Date(Date.now() - 86400000 * 12).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: "demo_prd_4",
    name: "Adjustable Phone & Tablet Stand",
    sku: "SMPL-STD-PHN",
    category: "Accessories",
    description: "Stand smartphone lipat dengan 4 sudut kemiringan ergonomis untuk meja kerja atau studio.",
    imageUrl: null,
    modelWeight: 65,
    printingTime: 2.5,
    materialCost: 11375,
    energyCost: 1125,
    wearCost: 2500,
    packagingCost: 5000,
    taxRate: 7,
    finalPrice: 45000,
    marginPercent: 55,
    manualPrice: 45000,
    pricingMode: "total_modal",
    qtyPart: 2,
    infill: "25% Gyroid",
    layerHeight: "0.20mm Standard",
    notes: "Desain tanpa baut, menggunakan sistem engsel print-in-place.",
    referenceLink: null,
    link1: null,
    link2: null,
    selectedMaterialId: "demo_inv_2",
    items: [
      {
        id: "demo_c41",
        name: "Base & Folding Arm",
        modelWeight: 65,
        printingTime: 2.5,
        qtyPart: 1,
        infill: "25%",
        layerHeight: "0.20mm",
      },
    ],
    options: [
      {
        id: "demo_opt_41",
        name: "Solid Black PLA+",
        sku: "SMPL-STD-PHN-BLK",
        pricingMode: "total_modal",
        manualPrice: 45000,
        finalPrice: 45000,
        modelWeight: 65,
        printingTime: 2.5,
        qtyPart: 1,
        items: [{ id: "demo_c41", name: "Base & Folding Arm", modelWeight: 65, printingTime: 2.5, qtyPart: 1 }],
      },
    ],
    createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
];

export const DEMO_ORDERS: DemoOrder[] = [
  {
    id: "demo_ord_1",
    orderNumber: "ORD-2026-DEMO-001",
    modelName: "Articulated Crystal Dragon",
    sku: "SMPL-DRG-CRY-SRB",
    clientName: "Budi Santoso (Demo)",
    status: "completed",
    progress: 100,
    price: 125000,
    source: "tokopedia",
    materialType: "PLA Silk",
    materialColor: "Rainbow",
    quantity: 1,
    qtyPart: 1,
    infill: "15%",
    layerHeight: "0.20mm",
    weight: 145,
    time: 5.5,
    dueDate: formatDemoDate(-1),
    modelImageUrl: null,
    batchId: null,
    errorMessage: null,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    items: [
      {
        id: "demo_oi_1",
        orderId: "demo_ord_1",
        inventoryId: "demo_inv_4",
        weightUsed: 145,
        cost: 34800,
      },
    ],
  },
  {
    id: "demo_ord_2",
    orderNumber: "ORD-2026-DEMO-002",
    modelName: "Geometric Hexagon Planter Pot",
    sku: "SMPL-HEX-PLT-WHT",
    clientName: "Studio Animasi Kreatif (Demo)",
    status: "printing",
    progress: 68,
    price: 195000,
    source: "direct",
    materialType: "PETG",
    materialColor: "Cold White",
    quantity: 3,
    qtyPart: 2,
    infill: "20%",
    layerHeight: "0.20mm",
    weight: 255,
    time: 9.6,
    dueDate: formatDemoDate(1),
    modelImageUrl: null,
    batchId: "demo_batch_1",
    errorMessage: null,
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    updatedAt: new Date().toISOString(),
    items: [
      {
        id: "demo_oi_2",
        orderId: "demo_ord_2",
        inventoryId: "demo_inv_1",
        weightUsed: 255,
        cost: 44625,
      },
    ],
  },
  {
    id: "demo_ord_3",
    orderNumber: "ORD-2026-DEMO-003",
    modelName: "Adjustable Phone & Tablet Stand",
    sku: "SMPL-STD-PHN-BLK",
    clientName: "Dina Rahmawati (Demo)",
    status: "queued",
    progress: 0,
    price: 45000,
    source: "shopee",
    materialType: "PLA+",
    materialColor: "Solid Black",
    quantity: 1,
    qtyPart: 1,
    infill: "25%",
    layerHeight: "0.20mm",
    weight: 65,
    time: 2.5,
    dueDate: formatDemoDate(2),
    modelImageUrl: null,
    batchId: null,
    errorMessage: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    items: [
      {
        id: "demo_oi_3",
        orderId: "demo_ord_3",
        inventoryId: "demo_inv_2",
        weightUsed: 65,
        cost: 11375,
      },
    ],
  },
  {
    id: "demo_ord_4",
    orderNumber: "ORD-2026-DEMO-004",
    modelName: "Modular Desk Cable Organizer (Set of 3)",
    sku: "SMPL-CBL-MOD-BLK",
    clientName: "Toko Kado Unik (Demo)",
    status: "pending",
    progress: 0,
    price: 70000,
    source: "direct",
    materialType: "TPU 95A",
    materialColor: "Matte Black",
    quantity: 2,
    qtyPart: 3,
    infill: "100%",
    layerHeight: "0.16mm",
    weight: 90,
    time: 3.6,
    dueDate: formatDemoDate(3),
    modelImageUrl: null,
    batchId: null,
    errorMessage: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    items: [
      {
        id: "demo_oi_4",
        orderId: "demo_ord_4",
        inventoryId: "demo_inv_5",
        weightUsed: 90,
        cost: 25200,
      },
    ],
  },
];

export const DEMO_INVENTORY: DemoInventoryItem[] = [
  {
    id: "demo_inv_1",
    sku: "SPL-ESUN-PLA-WHT",
    brand: "eSUN",
    type: "Filament 1.75mm",
    version: "Standard Spool",
    materialType: "PLA+",
    color: "Cold White",
    colorHex: "#f8fafc",
    currentWeight: 750,
    initialWeight: 1000,
    pricePerGram: 175,
    imageUrl: null,
    productLink: "https://esun3d.com",
    lowStockThreshold: 150,
    purchaseDate: new Date(Date.now() - 86400000 * 20).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: "demo_inv_2",
    sku: "SPL-ESUN-PLA-BLK",
    brand: "eSUN",
    type: "Filament 1.75mm",
    version: "Standard Spool",
    materialType: "PLA+",
    color: "Solid Black",
    colorHex: "#0f172a",
    currentWeight: 420,
    initialWeight: 1000,
    pricePerGram: 175,
    imageUrl: null,
    productLink: "https://esun3d.com",
    lowStockThreshold: 150,
    purchaseDate: new Date(Date.now() - 86400000 * 25).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 25).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "demo_inv_3",
    sku: "SPL-SNLU-PET-GRY",
    brand: "Sunlu",
    type: "Filament 1.75mm",
    version: "PETG High Strength",
    materialType: "PETG",
    color: "Light Grey",
    colorHex: "#94a3b8",
    currentWeight: 880,
    initialWeight: 1000,
    pricePerGram: 190,
    imageUrl: null,
    productLink: "https://sunlu.com",
    lowStockThreshold: 150,
    purchaseDate: new Date(Date.now() - 86400000 * 15).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: "demo_inv_4",
    sku: "SPL-ERYN-SLK-RNB",
    brand: "Eryone",
    type: "Filament 1.75mm",
    version: "Silk Multi-Color",
    materialType: "PLA Silk",
    color: "Rainbow",
    colorHex: "#ec4899",
    currentWeight: 90,
    initialWeight: 1000,
    pricePerGram: 240,
    imageUrl: null,
    productLink: "https://eryone3d.com",
    lowStockThreshold: 150,
    purchaseDate: new Date(Date.now() - 86400000 * 30).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: "demo_inv_5",
    sku: "SPL-OVRT-TPU-RED",
    brand: "Overture",
    type: "Filament 1.75mm",
    version: "Flexible 95A",
    materialType: "TPU 95A",
    color: "Signal Red",
    colorHex: "#ef4444",
    currentWeight: 650,
    initialWeight: 1000,
    pricePerGram: 280,
    imageUrl: null,
    productLink: "https://overture3d.com",
    lowStockThreshold: 150,
    purchaseDate: new Date(Date.now() - 86400000 * 10).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
];

export const DEMO_PRINTERS: DemoPrinter[] = [
  {
    id: "demo_prt_1",
    name: "Bambu Lab X1-Carbon #01 (Demo)",
    model: "Bambu Lab X1-Carbon Combo",
    status: "printing",
    purchasePrice: 24000000,
    serialNumber: "00M00A381900123",
    buildVolume: "256x256x256 mm",
    nozzleInstalled: "0.4mm Hardened Steel",
    bedPlateInstalled: "Textured PEI Plate",
    maintenanceIntervalDays: 30,
    nozzleTemp: 220,
    bedTemp: 65,
    printProgress: 68,
    currentJob: "ORD-2026-DEMO-002 - Geometric Hexagon Planter Pot",
    errorMessage: null,
    createdAt: new Date(Date.now() - 86400000 * 60).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "demo_prt_2",
    name: "Bambu Lab P1S #02 (Demo)",
    model: "Bambu Lab P1S",
    status: "idle",
    purchasePrice: 12500000,
    serialNumber: "01P00B491200456",
    buildVolume: "256x256x256 mm",
    nozzleInstalled: "0.4mm Stainless Steel",
    bedPlateInstalled: "Smooth PEI Plate",
    maintenanceIntervalDays: 30,
    nozzleTemp: 26,
    bedTemp: 25,
    printProgress: 0,
    currentJob: null,
    errorMessage: null,
    createdAt: new Date(Date.now() - 86400000 * 45).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "demo_prt_3",
    name: "Creality K1 Max #03 (Demo)",
    model: "Creality K1 Max",
    status: "idle",
    purchasePrice: 11000000,
    serialNumber: "K1M99182300789",
    buildVolume: "300x300x300 mm",
    nozzleInstalled: "0.4mm Copper Alloy",
    bedPlateInstalled: "Flexible Spring Steel",
    maintenanceIntervalDays: 30,
    nozzleTemp: 25,
    bedTemp: 24,
    printProgress: 0,
    currentJob: null,
    errorMessage: null,
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const DEMO_TRANSACTIONS: DemoTransaction[] = [
  {
    id: "demo_tx_1",
    description: "Pembayaran Pesanan ORD-2026-DEMO-001 (Budi Santoso - Tokopedia)",
    category: "order",
    type: "income",
    amount: 125000,
    quantity: 1,
    date: new Date(Date.now() - 86400000 * 1).toISOString(),
    orderId: "demo_ord_1",
    inventoryId: null,
    printerId: null,
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: "demo_tx_2",
    description: "Down Payment 100% Pesanan ORD-2026-DEMO-002 (Studio Animasi Kreatif)",
    category: "order",
    type: "income",
    amount: 195000,
    quantity: 3,
    date: new Date(Date.now() - 86400000 * 2).toISOString(),
    orderId: "demo_ord_2",
    inventoryId: null,
    printerId: null,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "demo_tx_3",
    description: "Pelunasan Pesanan ORD-2026-DEMO-004 (Toko Kado Unik)",
    category: "order",
    type: "income",
    amount: 70000,
    quantity: 2,
    date: new Date(Date.now() - 86400000 * 3).toISOString(),
    orderId: "demo_ord_4",
    inventoryId: null,
    printerId: null,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: "demo_tx_4",
    description: "Restock Spul eSUN PLA+ Cold White (1 Roll 1kg)",
    category: "filament",
    type: "expense",
    amount: 175000,
    quantity: 1,
    date: new Date(Date.now() - 86400000 * 5).toISOString(),
    orderId: null,
    inventoryId: "demo_inv_1",
    printerId: null,
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: "demo_tx_5",
    description: "Restock Spul Sunlu PETG Light Grey (1 Roll 1kg)",
    category: "filament",
    type: "expense",
    amount: 190000,
    quantity: 1,
    date: new Date(Date.now() - 86400000 * 7).toISOString(),
    orderId: null,
    inventoryId: "demo_inv_3",
    printerId: null,
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
  },
  {
    id: "demo_tx_6",
    description: "Pembelian Kardus Box Packaging & Bubble Wrap",
    category: "packaging",
    type: "expense",
    amount: 45000,
    quantity: 1,
    date: new Date(Date.now() - 86400000 * 10).toISOString(),
    orderId: null,
    inventoryId: null,
    printerId: null,
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 10).toISOString(),
  },
];

export const DEMO_ASSETS: DemoAsset[] = [
  {
    id: "demo_ast_1",
    name: "Hardened Steel Nozzle 0.4mm (Bambu)",
    category: "part",
    partCategory: "nozzle",
    condition: "new",
    quantity: 2,
    initialQuantity: 2,
    price: 185000,
    notes: "Spare part nozzle untuk filamen abrasive (CF / Glow)",
    productLink: "https://bambulab.com",
    type: "0.4mm",
    size: "0.4mm",
    printerId: "demo_prt_1",
    createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: "demo_ast_2",
    name: "Textured PEI Build Plate 256x256mm",
    category: "part",
    partCategory: "buildplate",
    condition: "good",
    quantity: 1,
    initialQuantity: 1,
    price: 250000,
    notes: "Double sided textured PEI sheet",
    productLink: "https://bambulab.com",
    type: "PEI Plate",
    size: "256x256",
    printerId: "demo_prt_2",
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 10).toISOString(),
  },
];

export const DEMO_PROJECTS = [
  {
    id: "demo_prj_1",
    name: "Proyek Miniatur Studio 2026 (Demo)",
    status: "in_progress",
    priority: "high",
    notes: "Rangkaian produk pajangan meja dan koleksi untuk promosi katalog online.",
    image: null,
    createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    parts: [],
  },
];

export const DEMO_BATCHES = [
  {
    id: "demo_batch_1",
    material: "PETG",
    color: "Cold White",
    totalWeight: 255,
    spoolId: "demo_inv_1",
    bedPlate: "Textured PEI Plate",
    bedWidth: 256,
    bedDepth: 256,
    status: "printing",
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const DEMO_SETTINGS = {
  id: "demo_settings",
  electricityCostPerKwh: 1500,
  printerPowerWatt: 150,
  operatorCostPerHour: 25000,
  defaultMarginPercent: 55,
  investmentCostTotal: 15000000,
  investmentPaybackMonths: 12,
  monthlyPrintHours: 180,
  lowStockThreshold: 150,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

/**
 * Returns aggregated stats calculated dynamically from Demo Sample Data
 */
export function getDemoStats() {
  const totalWeightKg =
    DEMO_INVENTORY.reduce((acc, s) => acc + (s.currentWeight || 0), 0) / 1000;
  const totalInventoryValue = DEMO_INVENTORY.reduce(
    (acc, s) => acc + (s.currentWeight || 0) * (s.pricePerGram || 0),
    0
  );
  const lowStockSpools = DEMO_INVENTORY.filter(
    (s) => s.currentWeight <= (s.lowStockThreshold || 150) && s.currentWeight > 0
  );

  const onlinePrinters = DEMO_PRINTERS.filter((p) => p.status !== "offline");
  const printingPrinters = DEMO_PRINTERS.filter((p) => p.status === "printing");

  const pendingOrders = DEMO_ORDERS.filter(
    (o) => o.status === "pending" || o.status === "queued"
  );
  const inProgressOrders = DEMO_ORDERS.filter((o) => o.status === "printing");
  const completedOrders = DEMO_ORDERS.filter((o) => o.status === "completed");

  const totalIncome = DEMO_TRANSACTIONS.filter((t) => t.type === "income").reduce(
    (acc, t) => acc + (t.amount || 0),
    0
  );
  const totalExpense = DEMO_TRANSACTIONS.filter((t) => t.type === "expense").reduce(
    (acc, t) => acc + (t.amount || 0),
    0
  );
  const netProfit = totalIncome - totalExpense;

  return {
    inventory: {
      totalSpools: DEMO_INVENTORY.length,
      totalWeightKg: Number(totalWeightKg.toFixed(2)),
      totalValue: Math.round(totalInventoryValue),
      lowStockCount: lowStockSpools.length,
    },
    printers: {
      total: DEMO_PRINTERS.length,
      online: onlinePrinters.length,
      printing: printingPrinters.length,
    },
    orders: {
      total: DEMO_ORDERS.length,
      pending: pendingOrders.length,
      printing: inProgressOrders.length,
      completed: completedOrders.length,
    },
    finance: {
      totalIncome: Math.round(totalIncome),
      totalExpense: Math.round(totalExpense),
      netProfit: Math.round(netProfit),
    },
    productsCount: DEMO_PRODUCTS.length,
    isDemo: true,
  };
}
