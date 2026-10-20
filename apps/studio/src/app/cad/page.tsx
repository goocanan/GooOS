"use client";

import React, { useState, useEffect, useRef, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import * as THREE from "three";
import { GooNavbar } from "@/components/GooNavbar";
import { useGooSettings } from "@/hooks/use-goo-settings";
import {
  Layers,
  Sparkles,
  Printer,
  Clock,
  Download,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Sliders,
  Code2,
  HeartPulse,
  Send,
  Bot,
  User,
  RotateCcw,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Settings,
  Eye,
  CheckCircle,
  CheckCircle2,
  RefreshCw,
  Wrench,
  Palette,
  FileCode,
  X,
  Plus,
  Check,
  Grid3X3,
  Boxes,
  Hexagon,
  Type,
  Magnet,
  Puzzle,
  Copy,
  Maximize2,
  CheckSquare,
  Scale,
  Flame,
  Camera,
  Map,
  Calculator,
  Compass,
  Package,
  Heart,
  Star,
  Smile,
  Music,
  Sun,
  Coffee,
  Image,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Frame,
} from "lucide-react";

// Printer Presets for Virtual Bed Dimensions
interface PrinterPreset {
  id: string;
  name: string;
  width: number;
  depth: number;
  height: number;
  brand: string;
}

const DEFAULT_PRINTER: PrinterPreset = {
  id: "bambu-p1s",
  name: "Bambu Lab P1S / X1C",
  width: 256,
  depth: 256,
  height: 256,
  brand: "Bambu Lab",
};

const PRINTER_PRESETS: PrinterPreset[] = [
  DEFAULT_PRINTER,
  { id: "bambu-a1-mini", name: "Bambu Lab A1 Mini", width: 180, depth: 180, height: 180, brand: "Bambu Lab" },
  { id: "prusa-mk4", name: "Original Prusa MK4", width: 250, depth: 210, height: 220, brand: "Prusa" },
  { id: "creality-k1", name: "Creality K1 / Ender 3", width: 220, depth: 220, height: 250, brand: "Creality" },
  { id: "voron-24", name: "Voron 2.4 (350mm)", width: 350, depth: 350, height: 350, brand: "Voron" },
];

// Modular Modifiers Library
interface ModifierItem {
  id: string;
  title: string;
  category: string;
  description: string;
  iconName: string;
}

const MODIFIERS_LIBRARY: ModifierItem[] = [
  {
    id: "gridfinity-base",
    title: "Gridfinity 42mm Base",
    category: "Workshop Storage",
    description: "Dudukan snap magnetik standard Gridfinity 42mm pada bagian dasar part.",
    iconName: "Grid3X3",
  },
  {
    id: "hex-pattern",
    title: "Hex Honeycomb Cutouts",
    category: "Weight Reduction",
    description: "Lubang ventilasi heksagonal untuk hemat berat filamen hingga 35%.",
    iconName: "Hexagon",
  },
  {
    id: "magnet-recess",
    title: "Pocket Magnet 6x2mm",
    category: "Hardware",
    description: "Kantong melingkar presisi untuk magnet silinder neodymium 6x2mm.",
    iconName: "Magnet",
  },
  {
    id: "flexi-joint",
    title: "Flexi Articulated Joint",
    category: "Mechanisms",
    description: "Sambungan engsel cetak langsung (print-in-place) tanpa rakit.",
    iconName: "Boxes",
  },
  {
    id: "puzzle-lock",
    title: "Dovetail Puzzle Joint",
    category: "Assembly",
    description: "Kunci pasang interlocking untuk menyambung objek berukuran melebihi bed printer.",
    iconName: "Puzzle",
  },
  {
    id: "text-emboss",
    title: "Emboss Text Label",
    category: "Personalization",
    description: "Label tulisan timbul atau cekung parametrik di dinding luar.",
    iconName: "Type",
  },
  {
    id: "polaroid-slot",
    title: "Slot Foto Polaroid & Magnet",
    category: "Display & Decor",
    description: "Slot geser foto polaroid 1.2mm dengan kantong magnet neodymium dan dudukan kickstand.",
    iconName: "Camera",
  },
];

// Ready-to-Print Functional CAD Templates
interface CadTemplateItem {
  id: string;
  name: string;
  category: string;
  description: string;
  dimensions: string;
  estimatedWeight: string;
  estimatedTime: string;
  icon: string;
  params: {
    width: number;
    depth: number;
    height: number;
    wallThickness: number;
    cornerRadius: number;
    infillDensity: number;
    magnetTolerance: number;
  };
  modifiers: string[];
}

const READY_TEMPLATES: CadTemplateItem[] = [
  {
    id: "polaroid-standard-memories",
    name: "Frame Polaroid Standard 'Sweet Memories'",
    category: "Photo & Decor",
    description: "Frame foto polaroid klasik format 88x107mm dengan teks timbul 'Sweet Memories ❤️', slot foto atas, dan dudukan meja / kulkas.",
    dimensions: "88 x 107 x 4.5 mm",
    estimatedWeight: "32g",
    estimatedTime: "48m",
    icon: "🖼️",
    params: { width: 88, depth: 107, height: 4.5, wallThickness: 2.0, cornerRadius: 4.0, infillDensity: 20, magnetTolerance: 0.15 },
    modifiers: ["text-emboss", "magnet-recess", "polaroid-slot"],
  },
  {
    id: "polaroid-wide-summertrip",
    name: "Frame Polaroid Wide 'Summer Trip' Dual-Tone",
    category: "Photo & Decor",
    description: "Frame foto polaroid format wide panorama 122x96mm dengan teks 'SUMMER ROADTRIP 🌴', 4 lubang magnet, dan slot foto atas.",
    dimensions: "122 x 96 x 4.5 mm",
    estimatedWeight: "42g",
    estimatedTime: "1j 05m",
    icon: "🏝️",
    params: { width: 122, depth: 96, height: 4.5, wallThickness: 2.0, cornerRadius: 4.0, infillDensity: 20, magnetTolerance: 0.15 },
    modifiers: ["text-emboss", "magnet-recess", "polaroid-slot"],
  },
  {
    id: "gridfinity-bin-3x2",
    name: "Gridfinity Socket Organiser 3x2",
    category: "Workshop Storage",
    description: "Wadah modular Gridfinity 3x2 unit dengan 6 lubang magnet 6x2mm di dasar dan scooping lip.",
    dimensions: "126 x 84 x 45 mm",
    estimatedWeight: "64g",
    estimatedTime: "2j 45m",
    icon: "🧰",
    params: { width: 126, depth: 84, height: 45, wallThickness: 2.4, cornerRadius: 4.0, infillDensity: 20, magnetTolerance: 0.15 },
    modifiers: ["gridfinity-base", "magnet-recess"],
  },
  {
    id: "gopro-bracket-m3",
    name: "Dudukan Kamera GoPro Universal",
    category: "Mounts & Brackets",
    description: "Bracket adapter action cam dengan 3-prong interlocking mount dan lubang sekrup knurled M3.",
    dimensions: "60 x 45 x 35 mm",
    estimatedWeight: "28g",
    estimatedTime: "1j 15m",
    icon: "📷",
    params: { width: 60, depth: 45, height: 35, wallThickness: 3.2, cornerRadius: 3.0, infillDensity: 35, magnetTolerance: 0.15 },
    modifiers: ["flexi-joint"],
  },
  {
    id: "desk-headphone-clamp",
    name: "Gantungan Headphone Meja (Clamp 25mm)",
    category: "Desk Accessories",
    description: "Hanger headphone kokoh dengan penjepit meja tebal 20-30mm dan alur kabel tersembunyi.",
    dimensions: "85 x 65 x 90 mm",
    estimatedWeight: "75g",
    estimatedTime: "3j 10m",
    icon: "🎧",
    params: { width: 85, depth: 65, height: 90, wallThickness: 3.5, cornerRadius: 5.0, infillDensity: 30, magnetTolerance: 0.15 },
    modifiers: ["puzzle-lock"],
  },
  {
    id: "battery-dispenser-aa",
    name: "Dispenser Baterai AA Slide (8 Slot)",
    category: "Organizers",
    description: "Rak gravitasi penyimpanan baterai AA dengan pengeluaran otomatis saat satu diambil.",
    dimensions: "110 x 55 x 75 mm",
    estimatedWeight: "58g",
    estimatedTime: "2j 20m",
    icon: "🔋",
    params: { width: 110, depth: 55, height: 75, wallThickness: 2.0, cornerRadius: 2.5, infillDensity: 20, magnetTolerance: 0.15 },
    modifiers: ["hex-pattern"],
  },
  {
    id: "cable-organizer-clip",
    name: "Cable Management Clip Holder",
    category: "Cable Routing",
    description: "Klip perata kabel meja USB-C / HDMI dengan jalur snap-fit dan dasar isolasi tape.",
    dimensions: "45 x 30 x 18 mm",
    estimatedWeight: "14g",
    estimatedTime: "35m",
    icon: "🔌",
    params: { width: 45, depth: 30, height: 18, wallThickness: 2.0, cornerRadius: 3.0, infillDensity: 25, magnetTolerance: 0.15 },
    modifiers: ["flexi-joint"],
  },
  {
    id: "filament-dust-filter",
    name: "Housing Filter Busa Debu Filamen 1.75mm",
    category: "3D Print Utilities",
    description: "Kotak penjepit busa pembersih debu filamen sebelum masuk ke tabung bowden extruder.",
    dimensions: "35 x 35 x 30 mm",
    estimatedWeight: "18g",
    estimatedTime: "45m",
    icon: "🧹",
    params: { width: 35, depth: 35, height: 30, wallThickness: 2.2, cornerRadius: 4.0, infillDensity: 25, magnetTolerance: 0.15 },
    modifiers: ["puzzle-lock"],
  },
  {
    id: "articulated-dragon-toy",
    name: "Articulated Flexi Dragon Toy",
    category: "Articulated Toys",
    description: "Naga artikulasi print-in-place tanpa perakitan, fleksibel meliuk langsung dari build plate.",
    dimensions: "160 x 50 x 25 mm",
    estimatedWeight: "52g",
    estimatedTime: "2j 30m",
    icon: "🐉",
    params: { width: 160, depth: 50, height: 25, wallThickness: 2.6, cornerRadius: 2.0, infillDensity: 20, magnetTolerance: 0.15 },
    modifiers: ["flexi-joint"],
  },
  {
    id: "electronic-enclosure-box",
    name: "Enclosure Casing Elektronik & Sensor",
    category: "Hardware Enclosures",
    description: "Kotak box enclosure proyek mikrokontroler dengan tiang sekrup M3 dan lubang kabel.",
    dimensions: "100 x 70 x 40 mm",
    estimatedWeight: "65g",
    estimatedTime: "2j 40m",
    icon: "📦",
    params: { width: 100, depth: 70, height: 40, wallThickness: 2.5, cornerRadius: 3.5, infillDensity: 25, magnetTolerance: 0.15 },
    modifiers: ["hex-pattern"],
  },
];

type CadMainTab = "studio" | "generators" | "calculators" | "templates";

function CadStudioContent() {
  const searchParams = useSearchParams();
  const [mainTab, setMainTab] = useState<CadMainTab>("studio");

  // Sync tab with URL search parameter (?tab=generators / ?tab=calculators / ?tab=templates)
  useEffect(() => {
    const tabParam = searchParams.get("tab") as CadMainTab;
    if (tabParam && ["studio", "generators", "calculators", "templates"].includes(tabParam)) {
      setMainTab(tabParam);
    }
  }, [searchParams]);

  // Project Info
  const [projectName, setProjectName] = useState("Gridfinity Heavy Socket Organiser");
  const [isEditingName, setIsEditingName] = useState(false);
  const [selectedPrinterId, setSelectedPrinterId] = useState("bambu-p1s");
  const [isPrinterDropdownOpen, setIsPrinterDropdownOpen] = useState(false);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving">("saved");

  // Studio Mode and Tabs
  const [activeDockMode, setActiveDockMode] = useState<"cad" | "sculpt" | "modifiers" | "multicolor" | "gcode">("cad");
  const [isModifiersFlyoutOpen, setIsModifiersFlyoutOpen] = useState(false);
  const [activeInspectorTab, setActiveInspectorTab] = useState<"controls" | "openscad" | "health">("controls");
  const [isInspectorCollapsed, setIsInspectorCollapsed] = useState(false);

  // 3D Viewport Controls
  const [viewMode, setViewMode] = useState<"solid" | "wireframe" | "xray" | "heatmap">("solid");
  const [isRotating, setIsRotating] = useState(true);

  // Parametric Dimensions State
  const [params, setParams] = useState({
    width: 126,
    depth: 84,
    height: 45,
    wallThickness: 2.4,
    cornerRadius: 4.0,
    infillDensity: 20,
    magnetTolerance: 0.15,
  });

  // Active Modifiers Stack
  const [activeModifiers, setActiveModifiers] = useState<string[]>(["gridfinity-base", "magnet-recess"]);

  // State for Polaroid Photo Frame Generator (MakerLab)
  const [polaroidFormat, setPolaroidFormat] = useState<"standard" | "square" | "wide">("standard");
  const [polaroidText, setPolaroidText] = useState("Sweet Memories");
  const [polaroidFont, setPolaroidFont] = useState<"handwriting" | "modern" | "serif" | "mono">("handwriting");
  const [polaroidIcon, setPolaroidIcon] = useState<string>("heart");
  const [polaroidIconPos, setPolaroidIconPos] = useState<"beside" | "corner" | "none">("beside");
  const [polaroidStyle, setPolaroidStyle] = useState<"embossed" | "engraved" | "dual-color">("embossed");
  const [polaroidMount, setPolaroidMount] = useState<"both" | "stand" | "magnet" | "plain">("both");
  const [polaroidColor, setPolaroidColor] = useState<string>("white");
  const [polaroidThickness, setPolaroidThickness] = useState<number>(4.5);
  const [polaroidTextAlign, setPolaroidTextAlign] = useState<"center" | "left" | "right">("center");

  // Polaroid Dimensions and Specs Calculator
  const polaroidSpecs = useMemo(() => {
    if (polaroidFormat === "square") {
      return {
        width: 88,
        depth: 100,
        height: polaroidThickness,
        windowW: 72,
        windowH: 72,
        bottomBorder: 22,
        sideBorder: 8,
        topBorder: 6,
        name: "Polaroid Square (1:1)",
        photoCompat: "Instax Square (72x86mm) / Polaroid Go",
        weight: "34g",
        time: "50m",
      };
    }
    if (polaroidFormat === "wide") {
      return {
        width: 122,
        depth: 96,
        height: polaroidThickness,
        windowW: 106,
        windowH: 68,
        bottomBorder: 22,
        sideBorder: 8,
        topBorder: 6,
        name: "Polaroid Wide (Landscape)",
        photoCompat: "Instax Wide (108x86mm) / Landscape 4x6",
        weight: "42g",
        time: "1j 05m",
      };
    }
    // Default: standard
    return {
      width: 88,
      depth: 107,
      height: polaroidThickness,
      windowW: 77,
      windowH: 79,
      bottomBorder: 22,
      sideBorder: 5.5,
      topBorder: 6,
      name: "Polaroid Standard (Classic)",
      photoCompat: "Polaroid 600 / i-Type / Instax Mini",
      weight: "32g",
      time: "48m",
    };
  }, [polaroidFormat, polaroidThickness]);

  const getIconChar = (iconId: string) => {
    switch (iconId) {
      case "heart": return "❤️";
      case "camera": return "📷";
      case "star": return "⭐";
      case "smile": return "😊";
      case "music": return "🎵";
      case "sun": return "☀️";
      case "coffee": return "☕";
      case "mountain": return "🏔️";
      case "sparkles": return "✨";
      case "ring": return "💍";
      case "palm": return "🌴";
      case "paw": return "🐾";
      default: return "";
    }
  };

  const loadPolaroidTemplate1 = () => {
    setPolaroidFormat("standard");
    setPolaroidText("Sweet Memories");
    setPolaroidIcon("heart");
    setPolaroidIconPos("beside");
    setPolaroidFont("handwriting");
    setPolaroidStyle("embossed");
    setPolaroidMount("both");
    setPolaroidColor("white");
    setPolaroidThickness(4.5);
    setPolaroidTextAlign("center");
  };

  const loadPolaroidTemplate2 = () => {
    setPolaroidFormat("wide");
    setPolaroidText("SUMMER ROADTRIP");
    setPolaroidIcon("palm");
    setPolaroidIconPos("beside");
    setPolaroidFont("mono");
    setPolaroidStyle("dual-color");
    setPolaroidMount("magnet");
    setPolaroidColor("black");
    setPolaroidThickness(4.5);
    setPolaroidTextAlign("center");
  };

  const handleLoadPolaroidToStudio = () => {
    handleLoadTemplate({
      id: `polaroid_${polaroidFormat}_${Date.now()}`,
      name: `Frame Polaroid ${polaroidFormat === "standard" ? "Standard" : polaroidFormat === "square" ? "Square" : "Wide"} — ${polaroidText || "Custom"}`,
      category: "Photo & Decor",
      description: `Frame foto polaroid format ${polaroidFormat} (${polaroidSpecs.width}x${polaroidSpecs.depth}mm) dengan teks "${polaroidText}"`,
      dimensions: `${polaroidSpecs.width} x ${polaroidSpecs.depth} x ${polaroidSpecs.height} mm`,
      estimatedWeight: polaroidSpecs.weight,
      estimatedTime: polaroidSpecs.time,
      icon: "🖼️",
      params: {
        width: polaroidSpecs.width,
        depth: polaroidSpecs.depth,
        height: polaroidSpecs.height,
        wallThickness: 2.0,
        cornerRadius: 4.0,
        infillDensity: 20,
        magnetTolerance: 0.15,
      },
      modifiers: ["text-emboss", "magnet-recess", "polaroid-slot"],
    });
  };

  // AI Omnibar & Chat Drawer
  const [promptText, setPromptText] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [chatHistory, setChatHistory] = useState([
    {
      id: "c1",
      sender: "user" as const,
      time: "10:02 AM",
      text: "Buatkan bin Gridfinity ukuran 3x2 dengan lubang magnet di dasar dan dinding tebal 2.4mm untuk menampung mata obeng heavy duty.",
    },
    {
      id: "c2",
      sender: "ai" as const,
      time: "10:03 AM",
      text: "AI CAD Agent: Model Gridfinity 3x2 (126x84x45mm) berhasil digenerate dengan 6 titik magnet recess dan toleransi clearance 0.15mm.",
    },
  ]);

  // Health Diagnostics
  const [autoFixCount, setAutoFixCount] = useState(0);
  const [isAutoFixing, setIsAutoFixing] = useState(false);

  // 3DFlow Direct Injection Modal
  const [showFlowModal, setShowFlowModal] = useState(false);
  const [flowPrinters, setFlowPrinters] = useState<any[]>([]);
  const [flowFilaments, setFlowFilaments] = useState<any[]>([]);
  const [selectedFlowPrinter, setSelectedFlowPrinter] = useState("");
  const [selectedFlowFilament, setSelectedFlowFilament] = useState("");
  const [flowClientName, setFlowClientName] = useState("Internal Workshop GooPrint");
  const [flowQuantity, setFlowQuantity] = useState("1");
  const [isSubmittingToFlow, setIsSubmittingToFlow] = useState(false);
  const [flowSuccessResult, setFlowSuccessResult] = useState<{ orderNumber: string; id: string } | null>(null);

  // Three.js References
  const containerRef = useRef<HTMLDivElement>(null);

  const activePrinter: PrinterPreset =
    PRINTER_PRESETS.find((p) => p.id === selectedPrinterId) || DEFAULT_PRINTER;

  // Calculated Slicer Estimates
  const estimates = useMemo(() => {
    const volMm3 = (params.width * params.depth * params.height) * 0.28;
    const weightGrams = Math.max(12, Math.round(volMm3 * 0.00124));
    const printTimeMinutes = Math.max(25, Math.round(weightGrams * 2.5));
    const hours = Math.floor(printTimeMinutes / 60);
    const mins = printTimeMinutes % 60;
    const filamentCost = weightGrams * 140;
    return {
      weightGrams,
      timeFormatted: `${hours}j ${mins}m`,
      filamentCost: Math.round(filamentCost),
    };
  }, [params]);

  // Fetch 3DFlow Printers & Filament for Integration
  useEffect(() => {
    async function fetchFlowData() {
      try {
        const [pRes, fRes] = await Promise.all([
          fetch("/api/flow/printers"),
          fetch("/api/flow/inventory"),
        ]);
        const pJson = await pRes.json();
        const fJson = await fRes.json();
        if (pJson.success && Array.isArray(pJson.data)) {
          setFlowPrinters(pJson.data);
          if (pJson.data.length > 0) setSelectedFlowPrinter(pJson.data[0].id);
        }
        if (fJson.success && Array.isArray(fJson.data)) {
          setFlowFilaments(fJson.data);
          if (fJson.data.length > 0) setSelectedFlowFilament(fJson.data[0].id);
        }
      } catch (e) {
        console.error("Error fetching 3DFlow data:", e);
      }
    }
    fetchFlowData();
  }, []);

  // Update Param with auto-save simulation
  const handleUpdateParam = (key: keyof typeof params, value: number) => {
    setSaveStatus("saving");
    setParams((prev) => ({ ...prev, [key]: value }));
    setTimeout(() => {
      setSaveStatus("saved");
    }, 350);
  };

  // Toggle Modifier
  const handleToggleModifier = (modId: string) => {
    setActiveModifiers((prev) =>
      prev.includes(modId) ? prev.filter((m) => m !== modId) : [...prev, modId]
    );
  };

  // Load a Template directly into the 3D Studio
  const handleLoadTemplate = (tpl: CadTemplateItem) => {
    setProjectName(tpl.name);
    setParams(tpl.params);
    setActiveModifiers(tpl.modifiers);
    if (tpl.id === "polaroid-standard-memories") {
      setPolaroidFormat("standard");
      setPolaroidText("Sweet Memories");
      setPolaroidIcon("heart");
      setPolaroidIconPos("beside");
      setPolaroidFont("handwriting");
      setPolaroidStyle("embossed");
      setPolaroidMount("both");
      setPolaroidColor("white");
    } else if (tpl.id === "polaroid-wide-summertrip") {
      setPolaroidFormat("wide");
      setPolaroidText("SUMMER ROADTRIP");
      setPolaroidIcon("palm");
      setPolaroidIconPos("beside");
      setPolaroidFont("mono");
      setPolaroidStyle("dual-color");
      setPolaroidMount("magnet");
      setPolaroidColor("black");
    }
    setMainTab("studio");
  };

  // Live Generated OpenSCAD Script
  const openScadCode = useMemo(() => {
    const isPolaroid =
      activeModifiers.includes("polaroid-slot") ||
      projectName.toLowerCase().includes("polaroid");

    if (isPolaroid) {
      const windowW = Math.round(params.width * 0.86);
      const windowD = Math.round(params.depth * 0.70);
      const windowOffsetY = (params.depth / 2) - (windowD / 2) - 6;
      const safeText = polaroidText.replace(/"/g, '\\"');

      return `// ==========================================
// GooPrint Parametric CAD Studio — OpenSCAD
// Model: ${projectName}
// Target: ${activePrinter.name}
// Tipe: Frame Polaroid Photo Parametrik (MakerLab)
// Format: ${polaroidFormat.toUpperCase()} (${params.width}x${params.depth}x${params.height}mm)
// ==========================================

$fn = 60;
frame_width = ${params.width};
frame_length = ${params.depth};
frame_height = ${params.height};
corner_radius = ${params.cornerRadius};
window_width = ${windowW};
window_length = ${windowD};
window_offset_y = ${windowOffsetY.toFixed(1)};
caption_text = "${safeText}";

module rounded_plate(w, l, h, r) {
  hull() {
    for (x = [-(w/2 - r), (w/2 - r)]) {
      for (y = [-(l/2 - r), (l/2 - r)]) {
        translate([x, y, 0])
          cylinder(r = r, h = h, center = false);
      }
    }
  }
}

difference() {
  union() {
    // 1. Badan Dasar Frame Polaroid
    rounded_plate(frame_width, frame_length, frame_height, corner_radius);
    
    // 2. Teks Timbul (Emboss) pada Margin Bawah Frame
    ${polaroidStyle === "embossed" || polaroidStyle === "dual-color" ? `
    translate([0, -(frame_length/2 - 11), frame_height]) {
      linear_extrude(height = 0.8)
        text(caption_text, size = 5.2, font = "Liberation Sans:style=Bold", halign = "center", valign = "center");
    }` : ""}
  }

  // 3. Jendela Aperture Foto (Depan Cekung Bevel)
  translate([0, window_offset_y, frame_height - 2.0]) {
    hull() {
      for (x = [-(window_width/2 - 2), (window_width/2 - 2)]) {
        for (y = [-(window_length/2 - 2), (window_length/2 - 2)]) {
          translate([x, y, 0])
            cylinder(r = 2, h = 3, center = false);
        }
      }
    }
  }

  // 4. Rongga Slot Masuk Kertas Foto Polaroid (Tebal 1.2mm)
  translate([0, window_offset_y + 4, 1.2]) {
    cube([window_width + 4, window_length + 12, 1.2], center = true);
  }

  // 5. Celah Masuk Foto dari Atas (Top Slot)
  translate([0, frame_length/2, 1.2]) {
    cube([window_width + 4, 10, 1.2], center = true);
  }

  ${polaroidStyle === "engraved" ? `
  // 6. Ukiran Cekung (Engraved/Debossed Text)
  translate([0, -(frame_length/2 - 11), frame_height - 0.8]) {
    linear_extrude(height = 1.0)
      text(caption_text, size = 5.2, font = "Liberation Sans:style=Bold", halign = "center", valign = "center");
  }` : ""}

  ${polaroidMount === "both" || polaroidMount === "magnet" ? `
  // 7. Lubang Magnet Neodymium Silinder 6x2mm di Belakang
  for (mx = [-24, 24]) {
    for (my = [window_offset_y, -(frame_length/2 - 11)]) {
      translate([mx, my, -0.1])
        cylinder(r = 3.0 + ${params.magnetTolerance}, h = 2.2);
    }
  }` : ""}
}`;
    }

    return `// ==========================================
// GooPrint Parametric CAD Studio — OpenSCAD
// Model: ${projectName}
// Target: ${activePrinter.name}
// ==========================================

$fn = 60;
width = ${params.width};
depth = ${params.depth};
height = ${params.height};
wall_thickness = ${params.wallThickness};
corner_radius = ${params.cornerRadius};
magnet_tolerance = ${params.magnetTolerance};

difference() {
  hull() {
    for (x = [-(width/2 - corner_radius), (width/2 - corner_radius)]) {
      for (y = [-(depth/2 - corner_radius), (depth/2 - corner_radius)]) {
        translate([x, y, 0])
          cylinder(r = corner_radius, h = height, center = false);
      }
    }
  }

  translate([0, 0, wall_thickness])
    hull() {
      for (x = [-((width - wall_thickness*2)/2 - corner_radius), ((width - wall_thickness*2)/2 - corner_radius)]) {
        for (y = [-((depth - wall_thickness*2)/2 - corner_radius), ((depth - wall_thickness*2)/2 - corner_radius)]) {
          translate([x, y, 0])
            cylinder(r = max(0.5, corner_radius - 1), h = height, center = false);
        }
      }
    }
${
  activeModifiers.includes("gridfinity-base")
    ? `
  // Gridfinity 42mm Magnet Recesses (Bottom)
  for (gx = [-42, 0, 42]) {
    for (gy = [-21, 21]) {
      translate([gx, gy, -0.1])
        cylinder(r = 3.0 + magnet_tolerance, h = 2.4);
    }
  }`
    : ""
}
}`;
  }, [projectName, activePrinter.name, params, activeModifiers, polaroidText, polaroidFormat, polaroidStyle, polaroidMount]);

  // Three.js 3D Viewport Engine
  useEffect(() => {
    if (mainTab !== "studio" || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 800;
    const height = containerRef.current.clientHeight || 560;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#020617");

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(160, 140, 180);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    containerRef.current.innerHTML = "";
    containerRef.current.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight1.position.set(120, 200, 100);
    dirLight1.castShadow = true;
    scene.add(dirLight1);

    const cyanRim = new THREE.DirectionalLight(0x06b6d4, 0.4);
    cyanRim.position.set(-100, 50, -100);
    scene.add(cyanRim);

    // Bed plate
    const bedW = activePrinter.width;
    const bedD = activePrinter.depth;

    const bedGeo = new THREE.BoxGeometry(bedW, 2, bedD);
    const bedMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });
    const bedMesh = new THREE.Mesh(bedGeo, bedMat);
    bedMesh.position.y = -1;
    bedMesh.receiveShadow = true;
    scene.add(bedMesh);

    const gridHelper = new THREE.GridHelper(
      Math.max(bedW, bedD),
      Math.round(Math.max(bedW, bedD) / 10),
      0x06b6d4,
      0x1e293b
    );
    gridHelper.position.y = 0.1;
    scene.add(gridHelper);

    // Model Group
    const pW = params.width;
    const pD = params.depth;
    const pH = params.height;

    const modelGroup = new THREE.Group();

    const isPolaroid =
      activeModifiers.includes("polaroid-slot") ||
      projectName.toLowerCase().includes("polaroid");

    if (isPolaroid) {
      // Polaroid 3D Frame Rendering (MakerLab)
      const frameColorHex =
        polaroidColor === "black"
          ? 0x1e293b
          : polaroidColor === "pink"
          ? 0xf472b6
          : polaroidColor === "green"
          ? 0x34d399
          : polaroidColor === "cream"
          ? 0xfef08a
          : 0xf8fafc;

      const frameMat =
        viewMode === "wireframe"
          ? new THREE.MeshBasicMaterial({ color: 0x06b6d4, wireframe: true })
          : new THREE.MeshStandardMaterial({
              color: frameColorHex,
              roughness: 0.35,
              metalness: 0.05,
            });

      // 1. Outer Frame Plate
      const frameGeo = new THREE.BoxGeometry(pW, pH, pD);
      const frameMesh = new THREE.Mesh(frameGeo, frameMat);
      frameMesh.position.y = pH / 2;
      frameMesh.castShadow = true;
      frameMesh.receiveShadow = true;
      modelGroup.add(frameMesh);

      // 2. Photo Window Cavity Recess (Top Section)
      const windowW = Math.round(pW * 0.86);
      const windowD = Math.round(pD * 0.70);
      const windowCenterZ = -((pD / 2) - 6 - windowD / 2);

      const recessGeo = new THREE.BoxGeometry(windowW, 2.0, windowD);
      const recessMat = new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.9 });
      const recessMesh = new THREE.Mesh(recessGeo, recessMat);
      recessMesh.position.set(0, pH - 0.5, windowCenterZ);
      modelGroup.add(recessMesh);

      // 3. Simulated Glossy Photo Print Surface
      const photoGeo = new THREE.PlaneGeometry(windowW - 1.5, windowD - 1.5);
      const photoMat = new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        roughness: 0.2,
        metalness: 0.1,
      });
      const photoMesh = new THREE.Mesh(photoGeo, photoMat);
      photoMesh.rotation.x = -Math.PI / 2;
      photoMesh.position.set(0, pH - 0.45, windowCenterZ);
      modelGroup.add(photoMesh);

      // 4. Bottom Margin: High-Res Dynamic Canvas Texture for Custom Text & Icon
      const bottomCenterZ = (pD / 2) - 11;
      const textCanvas = document.createElement("canvas");
      textCanvas.width = 512;
      textCanvas.height = 128;
      const ctx = textCanvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = polaroidColor === "black" ? "#1e293b" : "#f8fafc";
        ctx.fillRect(0, 0, 512, 128);

        const iconSymbol = getIconChar(polaroidIcon);
        const fontClass =
          polaroidFont === "handwriting"
            ? "italic 32px 'Brush Script MT', cursive, serif"
            : polaroidFont === "mono"
            ? "bold 28px monospace"
            : polaroidFont === "serif"
            ? "bold 30px 'Times New Roman', serif"
            : "bold 30px sans-serif";

        ctx.font = fontClass;
        ctx.fillStyle =
          polaroidColor === "black"
            ? "#f8fafc"
            : polaroidStyle === "dual-color"
            ? "#0284c7"
            : "#0f172a";

        ctx.textAlign =
          polaroidTextAlign === "left"
            ? "left"
            : polaroidTextAlign === "right"
            ? "right"
            : "center";
        ctx.textBaseline = "middle";

        const textX =
          polaroidTextAlign === "left"
            ? 36
            : polaroidTextAlign === "right"
            ? 476
            : 256;

        const fullLabel =
          polaroidIconPos === "beside" && iconSymbol
            ? `${polaroidText} ${iconSymbol}`
            : polaroidText;

        ctx.fillText(fullLabel, textX, 64);

        if (polaroidIconPos === "corner" && iconSymbol) {
          ctx.font = "28px sans-serif";
          ctx.textAlign = "right";
          ctx.fillText(iconSymbol, 480, 64);
        }
      }

      const textTexture = new THREE.CanvasTexture(textCanvas);
      const textPlaneGeo = new THREE.PlaneGeometry(pW * 0.86, 14);
      const textPlaneMat = new THREE.MeshBasicMaterial({
        map: textTexture,
        transparent: true,
      });
      const textPlaneMesh = new THREE.Mesh(textPlaneGeo, textPlaneMat);
      textPlaneMesh.rotation.x = -Math.PI / 2;
      textPlaneMesh.position.set(0, pH + 0.05, bottomCenterZ);
      modelGroup.add(textPlaneMesh);

      // 5. Back Neodymium Magnet Pockets (6x2mm)
      if (
        activeModifiers.includes("magnet-recess") ||
        polaroidMount === "both" ||
        polaroidMount === "magnet"
      ) {
        for (const mx of [-24, 24]) {
          for (const my of [windowCenterZ, bottomCenterZ]) {
            const magGeo = new THREE.CylinderGeometry(3.1, 3.1, 2.2, 24);
            const magMat = new THREE.MeshStandardMaterial({
              color: 0x334155,
              metalness: 0.8,
              roughness: 0.2,
            });
            const mag = new THREE.Mesh(magGeo, magMat);
            mag.position.set(mx, 1.1, my);
            modelGroup.add(mag);
          }
        }
      }

      // 6. Back Kickstand Desktop Wedge (if enabled)
      if (polaroidMount === "both" || polaroidMount === "stand") {
        const standGeo = new THREE.BoxGeometry(18, 2.4, 34);
        const standMat = new THREE.MeshStandardMaterial({ color: frameColorHex, roughness: 0.4 });
        const standMesh = new THREE.Mesh(standGeo, standMat);
        standMesh.position.set(0, 1.1, 0);
        standMesh.rotation.x = 0.35;
        modelGroup.add(standMesh);
      }
    } else {
      // Standard Container / Gridfinity 3D Geometry
      let bodyMat: THREE.Material;
      if (viewMode === "wireframe") {
        bodyMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4, wireframe: true });
      } else if (viewMode === "xray") {
        bodyMat = new THREE.MeshPhysicalMaterial({
          color: 0x06b6d4,
          transparent: true,
          opacity: 0.4,
          roughness: 0.1,
          transmission: 0.85,
        });
      } else if (viewMode === "heatmap") {
        bodyMat = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.35 });
      } else {
        bodyMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3, metalness: 0.15 });
      }

      const bodyGeo = new THREE.BoxGeometry(pW, pH, pD);
      const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
      bodyMesh.position.y = pH / 2;
      bodyMesh.castShadow = true;
      bodyMesh.receiveShadow = true;
      modelGroup.add(bodyMesh);

      const cavityW = Math.max(5, pW - params.wallThickness * 2);
      const cavityD = Math.max(5, pD - params.wallThickness * 2);
      const cavityH = pH * 0.82;
      const innerCavityGeo = new THREE.BoxGeometry(cavityW, cavityH, cavityD);
      const innerCavityMat = new THREE.MeshStandardMaterial({ color: 0x020617, roughness: 0.85 });
      const innerCavity = new THREE.Mesh(innerCavityGeo, innerCavityMat);
      innerCavity.position.y = pH / 2 + 5;
      modelGroup.add(innerCavity);

      if (activeModifiers.includes("gridfinity-base")) {
        for (let x = -1; x <= 1; x++) {
          for (let z = -0.5; z <= 0.5; z++) {
            const slotGeo = new THREE.CylinderGeometry(3.1, 3.1, 2.4, 24);
            const slotMat = new THREE.MeshStandardMaterial({ color: 0x0f172a });
            const slot = new THREE.Mesh(slotGeo, slotMat);
            slot.position.set(x * 42, 1.2, z * 42);
            modelGroup.add(slot);
          }
        }
      }
    }

    scene.add(modelGroup);

    // Mouse controls
    let isDragging = false;
    let prevMousePos = { x: 0, y: 0 };
    let cameraAngle = { theta: 0.8, phi: 0.65, radius: Math.max(220, pW * 1.5) };

    const updateCameraPos = () => {
      camera.position.x =
        cameraAngle.radius * Math.sin(cameraAngle.phi) * Math.sin(cameraAngle.theta);
      camera.position.y = cameraAngle.radius * Math.cos(cameraAngle.phi);
      camera.position.z =
        cameraAngle.radius * Math.sin(cameraAngle.phi) * Math.cos(cameraAngle.theta);
      camera.lookAt(0, pH / 3, 0);
    };
    updateCameraPos();

    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMousePos.x;
      const deltaY = e.clientY - prevMousePos.y;
      cameraAngle.theta -= deltaX * 0.008;
      cameraAngle.phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, cameraAngle.phi - deltaY * 0.008));
      updateCameraPos();
      prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      cameraAngle.radius = Math.max(80, Math.min(600, cameraAngle.radius + e.deltaY * 0.25));
      updateCameraPos();
    };

    const dom = containerRef.current;
    dom.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    dom.addEventListener("wheel", handleWheel, { passive: false });

    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (isRotating && !isDragging) {
        modelGroup.rotation.y += 0.003;
      }
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!containerRef.current) return;
      const newW = containerRef.current.clientWidth;
      const newH = containerRef.current.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animId);
      dom.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      dom.removeEventListener("wheel", handleWheel);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
    };
  }, [
    mainTab,
    params,
    activeModifiers,
    selectedPrinterId,
    viewMode,
    isRotating,
    activePrinter,
    projectName,
    polaroidText,
    polaroidIcon,
    polaroidIconPos,
    polaroidColor,
    polaroidMount,
    polaroidFont,
    polaroidStyle,
    polaroidTextAlign,
  ]);

  // Export File
  const handleExport = async (format: "3MF" | "STL" | "STEP" | "SCAD") => {
    setIsExporting(format);
    await new Promise((r) => setTimeout(r, 700));
    setIsExporting(null);
    setIsExportDropdownOpen(false);

    const element = document.createElement("a");
    const file = new Blob([openScadCode], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `${projectName.toLowerCase().replace(/\s+/g, "_")}.${format.toLowerCase()}`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // AI Prompt Send Action
  const handleSendPrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptText.trim() || isAiProcessing) return;

    const userMsg = promptText;
    setPromptText("");
    setIsAiProcessing(true);

    setChatHistory((prev) => [
      ...prev,
      {
        id: `u_${Date.now()}`,
        sender: "user",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        text: userMsg,
      },
    ]);

    await new Promise((r) => setTimeout(r, 1200));

    if (userMsg.toLowerCase().includes("tebal") || userMsg.toLowerCase().includes("wall")) {
      setParams((p) => ({ ...p, wallThickness: 3.2 }));
    }
    if (userMsg.toLowerCase().includes("tinggi") || userMsg.toLowerCase().includes("height")) {
      setParams((p) => ({ ...p, height: 60 }));
    }
    if (userMsg.toLowerCase().includes("gridfinity")) {
      if (!activeModifiers.includes("gridfinity-base")) {
        setActiveModifiers((m) => [...m, "gridfinity-base"]);
      }
    }

    setChatHistory((prev) => [
      ...prev,
      {
        id: `ai_${Date.now()}`,
        sender: "ai",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        text: `AI CAD Engine berhasil menyesuaikan parameter: "${userMsg}". Model 3D dan kalkulasi geometri telah diperbarui.`,
      },
    ]);

    setIsAiProcessing(false);
  };

  // Auto-Fix Health Diagnostics
  const handleAutoFix = async () => {
    setIsAutoFixing(true);
    await new Promise((r) => setTimeout(r, 900));
    setAutoFixCount((prev) => prev + 1);
    setIsAutoFixing(false);
  };

  // Submit directly to 3DFlow Queue
  const handleSubmitToFlow = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmittingToFlow(true);
      const chosenPrinter = flowPrinters.find((p) => p.id === selectedFlowPrinter);
      const chosenFilament = flowFilaments.find((f) => f.id === selectedFlowFilament);

      const payload = {
        clientName: flowClientName || "Internal Workshop",
        sourceChannel: "GooPrint CAD Studio",
        status: "queued",
        notes: `CAD Model: ${projectName} (${params.width}x${params.depth}x${params.height}mm). Modifiers: ${activeModifiers.join(", ") || "None"}`,
        items: [
          {
            modelName: `${projectName} (CAD)`,
            quantity: parseInt(flowQuantity) || 1,
            material: chosenFilament ? `${chosenFilament.brand} ${chosenFilament.materialType}` : "PLA+",
            color: chosenFilament ? chosenFilament.color : "Black",
            printerId: chosenPrinter ? chosenPrinter.id : null,
            weightGrams: estimates.weightGrams,
            price: estimates.filamentCost * (parseInt(flowQuantity) || 1) * 2.5,
          },
        ],
      };

      const res = await fetch("/api/flow/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Gagal mengirim ke antrean 3DFlow");

      setFlowSuccessResult({
        orderNumber: json.data?.orderNumber || "#3DF-CAD",
        id: json.data?.id || "",
      });
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsSubmittingToFlow(false);
    }
  };

  // State for Interactive Calculators Tab
  const [eStepCurrent, setEStepCurrent] = useState(415.0);
  const [eStepTarget, setEStepTarget] = useState(100.0);
  const [eStepActual, setEStepActual] = useState(94.2);
  const [eStepCopied, setEStepCopied] = useState(false);
  const newESteps = (eStepCurrent * eStepTarget) / (eStepActual || 1);

  const [flowWallMeasured, setFlowWallMeasured] = useState(0.84);
  const [flowWallTarget, setFlowWallTarget] = useState(0.80);
  const calculatedFlowRate = ((flowWallTarget / (flowWallMeasured || 0.8)) * 100).toFixed(1);

  const [costWeightGrams, setCostWeightGrams] = useState(120);
  const [costSpoolPrice, setCostSpoolPrice] = useState(150000);
  const [costHours, setCostHours] = useState(4.5);
  const [costPowerWatt, setCostPowerWatt] = useState(130);
  const calcFilamentCost = (costWeightGrams * (costSpoolPrice / 1000));
  const calcElecCost = ((costPowerWatt * costHours) / 1000) * 1444; // Rp 1444 per kWh
  const calcTotalHpp = calcFilamentCost + calcElecCost + 5000; // Depresiasi

  const [sellPrice, setSellPrice] = useState(85000);
  const [platformFeePercent, setPlatformFeePercent] = useState(6.5);
  const [packingCost, setPackingCost] = useState(3000);
  const netSellerProfit = sellPrice - (sellPrice * (platformFeePercent / 100)) - calcTotalHpp - packingCost;

  // State for Interactive Gridfinity Generator Tab
  const [gfGridX, setGfGridX] = useState(3);
  const [gfGridY, setGfGridY] = useState(2);
  const [gfHeightU, setGfHeightU] = useState(6); // 1U = 7mm, standard 6U = 42mm
  const [gfMagnets, setGfMagnets] = useState(true);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none overflow-x-hidden">
      <GooNavbar />

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* GOOPRINT NAVIGATION HEADER & SUB-TABS (Studio / Generators / Calcs) */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 sticky top-16 z-30 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Sub-tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setMainTab("studio")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              mainTab === "studio"
                ? "bg-cyan-600 text-white shadow-lg shadow-cyan-600/30"
                : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>💻 3D CAD Studio</span>
          </button>

          <button
            onClick={() => setMainTab("generators")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              mainTab === "generators"
                ? "bg-cyan-600 text-white shadow-lg shadow-cyan-600/30"
                : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            <Wrench className="w-3.5 h-3.5 text-amber-400" />
            <span>🪄 Generator Perkakas (5)</span>
          </button>

          <button
            onClick={() => setMainTab("calculators")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              mainTab === "calculators"
                ? "bg-cyan-600 text-white shadow-lg shadow-cyan-600/30"
                : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            <Scale className="w-3.5 h-3.5 text-emerald-400" />
            <span>⚙️ Kalkulator Slicer &amp; Kalibrasi (4)</span>
          </button>

          <button
            onClick={() => setMainTab("templates")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              mainTab === "templates"
                ? "bg-cyan-600 text-white shadow-lg shadow-cyan-600/30"
                : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            <Boxes className="w-3.5 h-3.5 text-indigo-400" />
            <span>📦 Template Siap Cetak (10)</span>
          </button>
        </div>

        {/* Right: Actions & Config */}
        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          <button
            onClick={() => {
              setFlowSuccessResult(null);
              setShowFlowModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs shadow-md shadow-rose-600/30 transition-all cursor-pointer"
            title="Kirim model CAD langsung ke antrean produksi 3DFlow"
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Kirim ke 3DFlow</span>
          </button>

          <Link
            href="/settings?tab=gooprint"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all"
            title="Pengaturan CAD GooPrint"
          >
            <Settings className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Pengaturan</span>
          </Link>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* TAB 1: 💻 3D CAD STUDIO WORKSPACE (Three.js WebGL + 5-Zone HUD)    */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {mainTab === "studio" && (
        <div className="flex-1 flex flex-col">
          {/* Studio Top Context Subbar */}
          <header className="h-12 bg-slate-950/90 border-b border-slate-800/80 px-4 flex items-center justify-between text-xs z-20">
            {/* Project Name & Save */}
            <div className="flex items-center gap-3">
              {isEditingName ? (
                <input
                  autoFocus
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  onBlur={() => setIsEditingName(false)}
                  onKeyDown={(e) => e.key === "Enter" && setIsEditingName(false)}
                  className="px-2.5 py-0.5 bg-slate-900 border border-cyan-500 rounded-lg text-white font-bold text-xs focus:outline-none"
                />
              ) : (
                <button
                  onClick={() => setIsEditingName(true)}
                  className="font-bold text-white hover:text-cyan-400 transition-colors flex items-center gap-1.5 truncate max-w-xs"
                >
                  <span>{projectName}</span>
                  <span className="text-[10px] text-slate-500">✏️</span>
                </button>
              )}

              <div className="hidden sm:flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                {saveStatus === "saving" ? (
                  <>
                    <RefreshCw className="w-3 h-3 text-cyan-400 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>Tersimpan</span>
                  </>
                )}
              </div>
            </div>

            {/* Printer Bed & Estimates */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <button
                  onClick={() => setIsPrinterDropdownOpen(!isPrinterDropdownOpen)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="font-semibold text-xs">{activePrinter.name}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {isPrinterDropdownOpen && (
                  <div className="absolute right-0 mt-1 w-64 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-1.5 z-50">
                    <div className="text-[10px] font-bold text-slate-400 px-2.5 py-1 uppercase tracking-wider font-mono">
                      Ukuran Bed Printer Virtual
                    </div>
                    {PRINTER_PRESETS.map((printer) => (
                      <button
                        key={printer.id}
                        onClick={() => {
                          setSelectedPrinterId(printer.id);
                          setIsPrinterDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left transition-colors ${
                          printer.id === selectedPrinterId
                            ? "bg-cyan-500/15 text-cyan-300 font-bold border border-cyan-500/30"
                            : "text-slate-300 hover:bg-slate-800"
                        }`}
                      >
                        <div>
                          <div className="text-xs">{printer.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {printer.width} x {printer.depth} x {printer.height} mm
                          </div>
                        </div>
                        {printer.id === selectedPrinterId && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Export Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
                  disabled={isExporting !== null}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs border border-slate-800 transition-all"
                >
                  <Download className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Ekspor</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {isExportDropdownOpen && (
                  <div className="absolute right-0 mt-1 w-48 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-1.5 z-50">
                    <button
                      onClick={() => handleExport("3MF")}
                      className="w-full text-left px-2.5 py-1.5 text-xs text-white hover:bg-slate-800 rounded-xl"
                    >
                      3MF (Bambu/Prusa)
                    </button>
                    <button
                      onClick={() => handleExport("STL")}
                      className="w-full text-left px-2.5 py-1.5 text-xs text-white hover:bg-slate-800 rounded-xl"
                    >
                      STL Universal Mesh
                    </button>
                    <button
                      onClick={() => handleExport("STEP")}
                      className="w-full text-left px-2.5 py-1.5 text-xs text-cyan-300 hover:bg-slate-800 rounded-xl"
                    >
                      STEP Solid CAD
                    </button>
                    <button
                      onClick={() => handleExport("SCAD")}
                      className="w-full text-left px-2.5 py-1.5 text-xs text-slate-300 hover:bg-slate-800 rounded-xl"
                    >
                      OpenSCAD Script
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* 3D Viewport + Left Dock + Right Inspector */}
          <div className="flex-1 relative flex overflow-hidden min-h-[calc(100vh-10rem)]">
            {/* Left Modular Dock */}
            <aside className="w-14 bg-slate-900/90 backdrop-blur-md border-r border-slate-800 flex flex-col items-center py-3 justify-between z-20 shrink-0">
              <div className="flex flex-col items-center gap-2">
                {[
                  { id: "cad", label: "Parametric CAD", icon: <Wrench className="w-4 h-4" /> },
                  { id: "sculpt", label: "Sculpt AI", icon: <Sparkles className="w-4 h-4" /> },
                  { id: "modifiers", label: "Modular Modifiers", icon: <Puzzle className="w-4 h-4" /> },
                  { id: "multicolor", label: "AMS Paint", icon: <Palette className="w-4 h-4" /> },
                  { id: "gcode", label: "Slicer Preview", icon: <FileCode className="w-4 h-4" /> },
                ].map((m) => {
                  const isActive = activeDockMode === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => {
                        setActiveDockMode(m.id as any);
                        if (m.id === "modifiers") setIsModifiersFlyoutOpen(true);
                      }}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                        isActive
                          ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-lg shadow-cyan-500/20"
                          : "text-slate-400 hover:text-white hover:bg-slate-800"
                      }`}
                      title={m.label}
                    >
                      {m.icon}
                    </button>
                  );
                })}
              </div>

              <Link
                href="/settings?tab=gooprint"
                className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Pengaturan CAD GooPrint"
              >
                <Settings className="w-4 h-4" />
              </Link>
            </aside>

            {/* Flyout Modifiers Drawer */}
            {isModifiersFlyoutOpen && (
              <div className="absolute top-0 left-14 bottom-0 w-80 bg-slate-900/95 backdrop-blur-2xl border-r border-slate-800 shadow-2xl p-4 z-40 flex flex-col overflow-y-auto animate-in slide-in-from-left duration-200">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Puzzle className="w-4 h-4 text-cyan-400" />
                    <h3 className="font-bold text-sm text-white">Library Modular Modifiers</h3>
                  </div>
                  <button
                    onClick={() => setIsModifiersFlyoutOpen(false)}
                    className="w-6 h-6 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-2.5 mt-4">
                  {MODIFIERS_LIBRARY.map((mod) => {
                    const isActive = activeModifiers.includes(mod.id);
                    return (
                      <div
                        key={mod.id}
                        onClick={() => handleToggleModifier(mod.id)}
                        className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                          isActive
                            ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-200 shadow-md shadow-cyan-500/10"
                            : "bg-slate-950/80 border-slate-800 hover:border-slate-700 text-slate-300"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <span className="font-bold text-xs">{mod.title}</span>
                          <span
                            className={`text-[9px] font-mono px-2 py-0.5 rounded-full ${
                              isActive ? "bg-cyan-500/20 text-cyan-300 font-bold" : "bg-slate-800 text-slate-400"
                            }`}
                          >
                            {isActive ? "Aktif" : "+ Pasang"}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">{mod.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3D Viewport Canvas */}
            <main className="flex-1 relative bg-slate-950 overflow-hidden flex flex-col">
              <div ref={containerRef} className="w-full h-full min-h-[480px] cursor-grab active:cursor-grabbing" />

              {/* Shading View Mode Controls */}
              <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 p-1 bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 shadow-xl text-xs">
                <button
                  onClick={() => setViewMode("solid")}
                  className={`px-3 py-1 rounded-xl font-bold transition-all ${
                    viewMode === "solid" ? "bg-cyan-600 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Solid
                </button>
                <button
                  onClick={() => setViewMode("wireframe")}
                  className={`px-3 py-1 rounded-xl font-bold transition-all ${
                    viewMode === "wireframe" ? "bg-cyan-600 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Wireframe
                </button>
                <button
                  onClick={() => setViewMode("xray")}
                  className={`px-3 py-1 rounded-xl font-bold transition-all ${
                    viewMode === "xray" ? "bg-cyan-600 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  X-Ray
                </button>
                <button
                  onClick={() => setViewMode("heatmap")}
                  className={`px-3 py-1 rounded-xl font-bold transition-all ${
                    viewMode === "heatmap" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Overhang
                </button>
                <button
                  onClick={() => setIsRotating(!isRotating)}
                  className={`p-1.5 rounded-xl border transition-all ${
                    isRotating ? "border-cyan-500/40 text-cyan-300 bg-cyan-500/20" : "border-slate-800 text-slate-400 hover:text-white"
                  }`}
                  title="Toggle Auto Rotation"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Bottom Omnibar (AI Prompt) */}
              <div className="absolute bottom-4 left-4 right-4 z-20 flex flex-col items-center pointer-events-none">
                <div className="w-full max-w-xl pointer-events-auto flex flex-col">
                  {/* Chat Drawer */}
                  {isChatOpen && (
                    <div className="w-full mb-2 bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl p-4 max-h-60 flex flex-col animate-in slide-in-from-bottom duration-200">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                        <div className="flex items-center gap-2 text-xs font-bold text-white">
                          <Bot className="w-4 h-4 text-cyan-400" />
                          <span>Riwayat Percakapan AI CAD Agent</span>
                        </div>
                        <button onClick={() => setIsChatOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-white">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="flex-1 overflow-y-auto py-2 space-y-2 text-xs">
                        {chatHistory.map((msg) => (
                          <div
                            key={msg.id}
                            className={`p-2.5 rounded-2xl ${
                              msg.sender === "user"
                                ? "bg-slate-800/80 text-white ml-6 text-right"
                                : "bg-cyan-950/40 border border-cyan-500/20 text-cyan-200 mr-6"
                            }`}
                          >
                            <div className="text-[10px] text-slate-500 font-mono mb-0.5">
                              {msg.sender === "user" ? "Maker" : "AI Agent"} • {msg.time}
                            </div>
                            <p className="text-xs leading-relaxed">{msg.text}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Input Form */}
                  <form
                    onSubmit={handleSendPrompt}
                    className="flex items-center gap-2 bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 hover:border-cyan-500/60 p-2 rounded-2xl shadow-2xl transition-all"
                  >
                    <button
                      type="button"
                      onClick={() => setIsChatOpen(!isChatOpen)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 transition-colors"
                      title="Riwayat Percakapan AI"
                    >
                      <Bot className="w-4 h-4" />
                    </button>
                    <input
                      type="text"
                      placeholder="Instruksi AI: misal 'tambah ketebalan dinding 3mm' atau 'buat lubang magnet'..."
                      value={promptText}
                      onChange={(e) => setPromptText(e.target.value)}
                      className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none px-1"
                    />
                    <button
                      type="submit"
                      disabled={isAiProcessing || !promptText.trim()}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold transition-all disabled:opacity-40 flex items-center gap-1.5"
                    >
                      {isAiProcessing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      <span>Generate</span>
                    </button>
                  </form>
                </div>
              </div>
            </main>

            {/* Right Inspector Drawer */}
            <aside
              className={`${
                isInspectorCollapsed ? "w-10" : "w-80"
              } bg-slate-900/95 backdrop-blur-2xl border-l border-slate-800 flex flex-col z-20 transition-all duration-200 shrink-0 select-none`}
            >
              {isInspectorCollapsed ? (
                <div className="p-2 flex flex-col items-center">
                  <button
                    onClick={() => setIsInspectorCollapsed(false)}
                    className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                    title="Buka Inspector"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="p-3 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800/80">
                      <button
                        onClick={() => setActiveInspectorTab("controls")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          activeInspectorTab === "controls"
                            ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/30"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        Sliders
                      </button>
                      <button
                        onClick={() => setActiveInspectorTab("openscad")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          activeInspectorTab === "openscad"
                            ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/30"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        OpenSCAD
                      </button>
                      <button
                        onClick={() => setActiveInspectorTab("health")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                          activeInspectorTab === "health"
                            ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/30"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        <span>Health</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      </button>
                    </div>

                    <button
                      onClick={() => setIsInspectorCollapsed(true)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {/* Controls */}
                    {activeInspectorTab === "controls" && (
                      <div className="space-y-4 text-xs">
                        <div className="space-y-3">
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                            Dimensi Part (mm)
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-slate-300">Lebar (Width / X)</span>
                              <span className="font-mono font-bold text-cyan-300">{params.width} mm</span>
                            </div>
                            <input
                              type="range"
                              min="40"
                              max={activePrinter.width}
                              step="1"
                              value={params.width}
                              onChange={(e) => handleUpdateParam("width", Number(e.target.value))}
                              className="w-full accent-cyan-500 cursor-pointer"
                            />
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-slate-300">Panjang (Depth / Y)</span>
                              <span className="font-mono font-bold text-cyan-300">{params.depth} mm</span>
                            </div>
                            <input
                              type="range"
                              min="40"
                              max={activePrinter.depth}
                              step="1"
                              value={params.depth}
                              onChange={(e) => handleUpdateParam("depth", Number(e.target.value))}
                              className="w-full accent-cyan-500 cursor-pointer"
                            />
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-slate-300">Tinggi (Height / Z)</span>
                              <span className="font-mono font-bold text-cyan-300">{params.height} mm</span>
                            </div>
                            <input
                              type="range"
                              min="15"
                              max="180"
                              step="1"
                              value={params.height}
                              onChange={(e) => handleUpdateParam("height", Number(e.target.value))}
                              className="w-full accent-cyan-500 cursor-pointer"
                            />
                          </div>
                        </div>

                        <div className="space-y-3 pt-3 border-t border-slate-800">
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                            Dinding &amp; Toleransi
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-slate-300">Tebal Dinding (Shell)</span>
                              <span className="font-mono font-bold text-cyan-300">{params.wallThickness} mm</span>
                            </div>
                            <input
                              type="range"
                              min="1.2"
                              max="6.0"
                              step="0.2"
                              value={params.wallThickness}
                              onChange={(e) => handleUpdateParam("wallThickness", Number(e.target.value))}
                              className="w-full accent-cyan-500 cursor-pointer"
                            />
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-slate-300">Corner Fillet</span>
                              <span className="font-mono font-bold text-cyan-300">{params.cornerRadius} mm</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="16"
                              step="0.5"
                              value={params.cornerRadius}
                              onChange={(e) => handleUpdateParam("cornerRadius", Number(e.target.value))}
                              className="w-full accent-cyan-500 cursor-pointer"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* OpenSCAD */}
                    {activeInspectorTab === "openscad" && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-400 font-mono">Kode OpenSCAD</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(openScadCode);
                              alert("Kode OpenSCAD disalin!");
                            }}
                            className="px-2 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs font-mono flex items-center gap-1"
                          >
                            <Copy className="w-3 h-3" />
                            <span>Salin</span>
                          </button>
                        </div>
                        <pre className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-cyan-300 overflow-x-auto whitespace-pre max-h-96">
                          {openScadCode}
                        </pre>
                      </div>
                    )}

                    {/* Health */}
                    {activeInspectorTab === "health" && (
                      <div className="space-y-3 text-xs">
                        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                          <span>Bounding Box</span>
                          <span className="text-emerald-400 font-mono">OK</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                          <span>Watertight 2-Manifold</span>
                          <span className="text-emerald-400 font-mono">100% Solid</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                          <span>Ketebalan Dinding</span>
                          <span className="text-emerald-400 font-mono">&ge; 1.2mm</span>
                        </div>
                        <button
                          onClick={handleAutoFix}
                          disabled={isAutoFixing}
                          className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-1.5"
                        >
                          {isAutoFixing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Wrench className="w-3.5 h-3.5" />}
                          <span>Perbaiki Otomatis Geometri</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </aside>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* TAB 2: 🪄 GENERATOR PERKAKAS & MODULAR PART BUILDERS               */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {mainTab === "generators" && (
        <main className="max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-8 animate-in fade-in duration-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                Bento Generator Hub
              </span>
              <span className="text-xs text-slate-400">5 Modul Parametrik Otomatis</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
              Generator Perkakas &amp; Part Parametrik Otomatis
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Hasilkan model 3D siap cetak instan berdasarkan input spesifikasi teknis tanpa perlu menggambar dari nol.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 0. Flagship MakerLab Generator: Polaroid Photo Frame Builder */}
            <div className="col-span-1 lg:col-span-2 p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-cyan-500/40 hover:border-cyan-500/70 transition-all shadow-2xl relative overflow-hidden space-y-6">
              {/* Background Glow */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Header Bar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5 relative z-10">
                <div className="flex items-start sm:items-center gap-4">
                  <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-cyan-600 via-indigo-600 to-purple-600 p-0.5 shadow-lg shadow-cyan-600/20 shrink-0">
                    <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-cyan-400">
                      <Frame className="w-6 h-6" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono">
                        MakerLab Parametric Studio
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                        FDM &amp; Multi-Color Ready
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
                      Generator Frame Foto Polaroid Parametrik
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Kustomisasi bingkai foto polaroid dengan editan teks timbul/ukir, ornamen icon, slot foto geser atas 1.2mm, serta dudukan meja &amp; magnet kulkas.
                    </p>
                  </div>
                </div>

                {/* 2 Example Template Presets Quick-Load Buttons */}
                <div className="flex items-center gap-2 self-start md:self-auto shrink-0 flex-wrap">
                  <button
                    onClick={loadPolaroidTemplate1}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-xs font-semibold text-slate-200 border border-slate-700 transition-all cursor-pointer shadow-sm"
                    title="Muat contoh preset Template 1: Standard 'Sweet Memories'"
                  >
                    <span>🖼️</span>
                    <span>Template 1: Standard &apos;Memories&apos; ❤️</span>
                  </button>
                  <button
                    onClick={loadPolaroidTemplate2}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-xs font-semibold text-slate-200 border border-slate-700 transition-all cursor-pointer shadow-sm"
                    title="Muat contoh preset Template 2: Wide 'Summer Roadtrip'"
                  >
                    <span>🏝️</span>
                    <span>Template 2: Wide &apos;Summer Trip&apos; 🌴</span>
                  </button>
                </div>
              </div>

              {/* Main Body Split: Left Controls (7 cols) + Right Live Preview & CTA (5 cols) */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 relative z-10">
                {/* LEFT CONTROLS (7 cols) */}
                <div className="xl:col-span-7 space-y-5">
                  {/* 1. Format / Rasio Polaroid */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                      <span>1. Format &amp; Rasio Aspek Polaroid</span>
                      <span className="text-[10px] text-cyan-400 lowercase font-normal font-mono">
                        pilih rasio foto
                      </span>
                    </label>
                    <div className="grid grid-cols-3 gap-2.5 mt-2">
                      <button
                        type="button"
                        onClick={() => setPolaroidFormat("standard")}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                          polaroidFormat === "standard"
                            ? "bg-cyan-500/15 border-cyan-500 text-white shadow-lg shadow-cyan-500/20"
                            : "bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black">Standard</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-300">
                            3:4
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 font-mono">88 x 107 mm</p>
                        <p className="text-[10px] text-slate-500 mt-0.5 truncate">Polaroid 600 / Instax Mini</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPolaroidFormat("square")}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                          polaroidFormat === "square"
                            ? "bg-cyan-500/15 border-cyan-500 text-white shadow-lg shadow-cyan-500/20"
                            : "bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black">Square</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-300">
                            1:1
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 font-mono">88 x 100 mm</p>
                        <p className="text-[10px] text-slate-500 mt-0.5 truncate">Instax Sq / Polaroid Go</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPolaroidFormat("wide")}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                          polaroidFormat === "wide"
                            ? "bg-cyan-500/15 border-cyan-500 text-white shadow-lg shadow-cyan-500/20"
                            : "bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black">Wide</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-300">
                            16:9
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 font-mono">122 x 96 mm</p>
                        <p className="text-[10px] text-slate-500 mt-0.5 truncate">Instax Wide / Panorama</p>
                      </button>
                    </div>
                  </div>

                  {/* 2. Editan Tulisan Teks pada Frame */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Type className="w-3.5 h-3.5 text-cyan-400" />
                        <span>2. Editan Teks Frame (Margin Bawah)</span>
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {polaroidText.length}/28 karakter
                      </span>
                    </label>

                    <div className="relative">
                      <input
                        type="text"
                        maxLength={28}
                        value={polaroidText}
                        onChange={(e) => setPolaroidText(e.target.value)}
                        placeholder="Contoh: Sweet Memories, Forever, Bali 2026..."
                        className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-cyan-500 focus:outline-none transition-all font-semibold"
                      />
                      {polaroidText && (
                        <button
                          type="button"
                          onClick={() => setPolaroidText("")}
                          className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 text-xs cursor-pointer"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* Quick Suggestion Chips */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5">
                      <span className="text-[10px] text-slate-500 shrink-0">Ide teks:</span>
                      {[
                        "Sweet Memories",
                        "Forever & Always",
                        "Summer Trip",
                        "Best Friends",
                        "Little Sunshine",
                        "Nanomind & Co",
                      ].map((chip) => (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => setPolaroidText(chip)}
                          className="px-2 py-0.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-[10px] text-slate-300 whitespace-nowrap transition-all cursor-pointer"
                        >
                          {chip}
                        </button>
                      ))}
                    </div>

                    {/* Typography & Alignment Controls */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Tipografi Font</label>
                        <select
                          value={polaroidFont}
                          onChange={(e: any) => setPolaroidFont(e.target.value)}
                          className="w-full mt-1 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                        >
                          <option value="handwriting">Tulisan Tangan (Cursive Brush)</option>
                          <option value="modern">Modern Sans-Serif Minimalis</option>
                          <option value="serif">Klasik Serif Elegan</option>
                          <option value="mono">Retro Monospace / Typewriter</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Perataan Teks</label>
                        <div className="grid grid-cols-3 gap-1.5 mt-1">
                          <button
                            type="button"
                            onClick={() => setPolaroidTextAlign("left")}
                            className={`py-1.5 rounded-xl border flex items-center justify-center cursor-pointer transition-all ${
                              polaroidTextAlign === "left"
                                ? "bg-cyan-600 text-white border-cyan-500"
                                : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                            }`}
                            title="Rata Kiri"
                          >
                            <AlignLeft className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setPolaroidTextAlign("center")}
                            className={`py-1.5 rounded-xl border flex items-center justify-center cursor-pointer transition-all ${
                              polaroidTextAlign === "center"
                                ? "bg-cyan-600 text-white border-cyan-500"
                                : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                            }`}
                            title="Rata Tengah"
                          >
                            <AlignCenter className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setPolaroidTextAlign("right")}
                            className={`py-1.5 rounded-xl border flex items-center justify-center cursor-pointer transition-all ${
                              polaroidTextAlign === "right"
                                ? "bg-cyan-600 text-white border-cyan-500"
                                : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                            }`}
                            title="Rata Kanan"
                          >
                            <AlignRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 3. Editan Icon & Ornamen Dekoratif */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>3. Pilihan Icon Ornamen Dekoratif</span>
                      </span>
                      <span className="text-[10px] text-cyan-400 font-mono">
                        {getIconChar(polaroidIcon)} Terpilih
                      </span>
                    </label>

                    {/* 12 Icon Chips */}
                    <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
                      {[
                        { id: "heart", label: "❤️", name: "Heart" },
                        { id: "camera", label: "📷", name: "Camera" },
                        { id: "star", label: "⭐", name: "Star" },
                        { id: "smile", label: "😊", name: "Smile" },
                        { id: "music", label: "🎵", name: "Music" },
                        { id: "sun", label: "☀️", name: "Sun" },
                        { id: "coffee", label: "☕", name: "Coffee" },
                        { id: "mountain", label: "🏔️", name: "Mountain" },
                        { id: "sparkles", label: "✨", name: "Sparkles" },
                        { id: "ring", label: "💍", name: "Ring" },
                        { id: "palm", label: "🌴", name: "Palm" },
                        { id: "paw", label: "🐾", name: "Paw" },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setPolaroidIcon(item.id)}
                          className={`h-9 rounded-xl border flex items-center justify-center text-sm transition-all cursor-pointer ${
                            polaroidIcon === item.id
                              ? "bg-amber-500/20 border-amber-500 text-amber-300 scale-105 shadow-md shadow-amber-500/20"
                              : "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900"
                          }`}
                          title={item.name}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>

                    {/* Icon Position Options */}
                    <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
                      <button
                        type="button"
                        onClick={() => setPolaroidIconPos("beside")}
                        className={`py-1.5 px-2 rounded-xl border text-center transition-all cursor-pointer ${
                          polaroidIconPos === "beside"
                            ? "bg-cyan-500/20 border-cyan-500 text-cyan-300 font-bold"
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                        }`}
                      >
                        Samping Teks
                      </button>
                      <button
                        type="button"
                        onClick={() => setPolaroidIconPos("corner")}
                        className={`py-1.5 px-2 rounded-xl border text-center transition-all cursor-pointer ${
                          polaroidIconPos === "corner"
                            ? "bg-cyan-500/20 border-cyan-500 text-cyan-300 font-bold"
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                        }`}
                      >
                        Sudut Kanan
                      </button>
                      <button
                        type="button"
                        onClick={() => setPolaroidIconPos("none")}
                        className={`py-1.5 px-2 rounded-xl border text-center transition-all cursor-pointer ${
                          polaroidIconPos === "none"
                            ? "bg-cyan-500/20 border-cyan-500 text-cyan-300 font-bold"
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                        }`}
                      >
                        Tanpa Icon
                      </button>
                    </div>
                  </div>

                  {/* 4. Gaya Ukiran & Metode Cetak */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase">
                        Gaya Ukiran Teks
                      </label>
                      <select
                        value={polaroidStyle}
                        onChange={(e: any) => setPolaroidStyle(e.target.value)}
                        className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-semibold"
                      >
                        <option value="embossed">Timbul (Embossed +0.8mm)</option>
                        <option value="engraved">Cekung (Debossed -0.8mm)</option>
                        <option value="dual-color">Dual-Color (Filament Swap)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase">
                        Dudukan &amp; Pemasangan
                      </label>
                      <select
                        value={polaroidMount}
                        onChange={(e: any) => setPolaroidMount(e.target.value)}
                        className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-semibold"
                      >
                        <option value="both">Meja + Magnet Kulkas (Dual)</option>
                        <option value="magnet">Hanya Magnet Kulkas (6x2mm)</option>
                        <option value="stand">Hanya Dudukan Meja (Kickstand)</option>
                        <option value="plain">Polos / Gantungan Dinding</option>
                      </select>
                    </div>
                  </div>

                  {/* 5. Tebal Frame & Warna Simulasi Filamen */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 bg-slate-950 rounded-2xl border border-slate-800/80">
                    <div>
                      <div className="flex items-center justify-between text-xs">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Ketebalan Frame</label>
                        <span className="font-mono font-bold text-cyan-400">{polaroidThickness} mm</span>
                      </div>
                      <input
                        type="range"
                        min={3.5}
                        max={6.0}
                        step={0.1}
                        value={polaroidThickness}
                        onChange={(e) => setPolaroidThickness(Number(e.target.value))}
                        className="w-full mt-2 accent-cyan-500 cursor-pointer"
                      />
                      <div className="flex justify-between text-[9px] text-slate-500 font-mono mt-0.5">
                        <span>3.5mm (Slim)</span>
                        <span>4.5mm (Ideal)</span>
                        <span>6.0mm (Rigid)</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block">
                        Warna Simulasi Filamen
                      </label>
                      <div className="flex items-center gap-2 mt-2">
                        {[
                          { id: "white", bg: "bg-slate-100", name: "Putih Klasik" },
                          { id: "black", bg: "bg-slate-900 border border-slate-700", name: "Hitam Obsidian" },
                          { id: "pink", bg: "bg-pink-400", name: "Pastel Pink" },
                          { id: "green", bg: "bg-emerald-400", name: "Sage Mint" },
                          { id: "cream", bg: "bg-amber-100", name: "Vintage Cream" },
                        ].map((col) => (
                          <button
                            key={col.id}
                            type="button"
                            onClick={() => setPolaroidColor(col.id)}
                            className={`w-7 h-7 rounded-full ${col.bg} transition-all cursor-pointer ${
                              polaroidColor === col.id
                                ? "ring-2 ring-cyan-500 scale-110 shadow-md"
                                : "opacity-70 hover:opacity-100"
                            }`}
                            title={col.name}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] text-slate-500 mt-1.5 block capitalize">
                        {polaroidColor === "white" ? "Putih Polaroid Standar" : polaroidColor}
                      </span>
                    </div>
                  </div>
                </div>

                {/* RIGHT LIVE PREVIEW & INSTANT CTA (5 cols) */}
                <div className="xl:col-span-5 flex flex-col justify-between space-y-5 bg-slate-950/80 p-5 sm:p-6 rounded-3xl border border-slate-800">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-bold text-white uppercase tracking-wider">
                          Live MakerLab Preview
                        </span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-cyan-300">
                        {polaroidSpecs.name}
                      </span>
                    </div>

                    {/* Realistic MakerLab Simulated Polaroid Frame */}
                    <div className="flex items-center justify-center p-4 bg-slate-900/60 rounded-2xl border border-slate-800/80 min-h-[300px]">
                      <div
                        className={`transition-all duration-300 flex flex-col justify-between p-3 rounded-xl shadow-2xl relative select-none ${
                          polaroidFormat === "wide"
                            ? "w-full max-w-[320px] aspect-[122/96]"
                            : polaroidFormat === "square"
                            ? "w-full max-w-[270px] aspect-[88/100]"
                            : "w-full max-w-[260px] aspect-[88/107]"
                        }`}
                        style={{
                          backgroundColor:
                            polaroidColor === "black"
                              ? "#1e293b"
                              : polaroidColor === "pink"
                              ? "#fbcfe8"
                              : polaroidColor === "green"
                              ? "#bbf7d0"
                              : polaroidColor === "cream"
                              ? "#fef3c7"
                              : "#f8fafc",
                          color: polaroidColor === "black" ? "#f8fafc" : "#0f172a",
                          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.4)",
                        }}
                      >
                        {/* Top Slide Slot Indicator */}
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-slate-950/90 text-[8px] font-mono text-cyan-300 border border-cyan-500/40 shadow-sm">
                          ⬆️ Slot Foto 1.2mm
                        </div>

                        {/* Photo Aperture Window */}
                        <div className="flex-1 rounded-sm overflow-hidden relative border border-black/20 shadow-inner bg-gradient-to-tr from-sky-900 via-indigo-900 to-amber-700 flex flex-col items-center justify-center text-center p-3 text-white">
                          <div className="absolute inset-0 bg-black/20" />
                          <div className="relative z-10 space-y-1">
                            <Camera className="w-8 h-8 mx-auto text-white/80 drop-shadow" />
                            <p className="text-[10px] font-bold text-white/90 drop-shadow">
                              Area Foto ({polaroidSpecs.windowW}x{polaroidSpecs.windowH}mm)
                            </p>
                            <p className="text-[9px] text-white/70">
                              {polaroidSpecs.photoCompat}
                            </p>
                          </div>
                        </div>

                        {/* Bottom Wide Margin with Live Custom Text & Icon */}
                        <div className="pt-3 pb-1 px-1">
                          <div
                            className={`flex items-center gap-1.5 transition-all ${
                              polaroidTextAlign === "left"
                                ? "justify-start"
                                : polaroidTextAlign === "right"
                                ? "justify-end"
                                : "justify-center"
                            } ${
                              polaroidFont === "handwriting"
                                ? "italic font-serif tracking-wider text-base"
                                : polaroidFont === "mono"
                                ? "font-mono font-bold uppercase tracking-tight text-xs"
                                : polaroidFont === "serif"
                                ? "font-serif font-bold text-sm"
                                : "font-sans font-black text-sm"
                            }`}
                            style={{
                              color:
                                polaroidColor === "black"
                                  ? "#f8fafc"
                                  : polaroidStyle === "dual-color"
                                  ? "#0284c7"
                                  : "#0f172a",
                              textShadow:
                                polaroidStyle === "embossed"
                                  ? "0 1px 1px rgba(0,0,0,0.4), 0 -1px 0 rgba(255,255,255,0.8)"
                                  : polaroidStyle === "engraved"
                                  ? "0 -1px 1px rgba(0,0,0,0.7), 0 1px 0 rgba(255,255,255,0.4)"
                                  : "none",
                            }}
                          >
                            <span>{polaroidText || "Polaroid Frame"}</span>
                            {polaroidIconPos === "beside" && polaroidIcon && (
                              <span className="text-sm not-italic inline-block ml-0.5">
                                {getIconChar(polaroidIcon)}
                              </span>
                            )}
                          </div>

                          {polaroidIconPos === "corner" && polaroidIcon && (
                            <div className="flex justify-end -mt-3.5 pr-0.5">
                              <span className="text-xs not-italic">
                                {getIconChar(polaroidIcon)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Technical Specifications Readout */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                      <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-[9px] text-slate-500 block uppercase font-bold">Ukuran Luar</span>
                        <span className="font-mono font-bold text-white text-[11px]">
                          {polaroidSpecs.width}x{polaroidSpecs.depth}mm
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-[9px] text-slate-500 block uppercase font-bold">Jendela Foto</span>
                        <span className="font-mono font-bold text-cyan-300 text-[11px]">
                          {polaroidSpecs.windowW}x{polaroidSpecs.windowH}mm
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-[9px] text-slate-500 block uppercase font-bold">Estimasi Berat</span>
                        <span className="font-mono font-bold text-emerald-300 text-[11px]">
                          {polaroidSpecs.weight}
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-[9px] text-slate-500 block uppercase font-bold">Waktu Cetak</span>
                        <span className="font-mono font-bold text-amber-300 text-[11px]">
                          {polaroidSpecs.time}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Primary & Secondary Action CTAs */}
                  <div className="space-y-2 pt-2">
                    <button
                      onClick={handleLoadPolaroidToStudio}
                      className="w-full py-3 bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-black rounded-2xl text-xs sm:text-sm transition-all shadow-xl shadow-cyan-600/30 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Buka &amp; Render di 3D Studio &rarr;</span>
                    </button>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <button
                        onClick={() => handleExport("SCAD")}
                        className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold border border-slate-800 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Ekspor .SCAD</span>
                      </button>
                      <button
                        onClick={() => {
                          setFlowSuccessResult(null);
                          setShowFlowModal(true);
                        }}
                        className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold border border-slate-800 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Flame className="w-3.5 h-3.5 text-rose-400" />
                        <span>Kirim 3DFlow</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 1. Interactive Gridfinity Generator Builder */}
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 transition-all space-y-5 flex flex-col justify-between shadow-xl">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center text-xl">
                    <Grid3X3 className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono">
                    Standar 42mm
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-black text-white">Gridfinity Storage Organiser Builder</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Generator wadah modular meja bengkel dengan slot magnet 6x2mm dan scooping lip untuk baut kecil.
                  </p>
                </div>

                {/* Interactive Controls for Gridfinity */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 bg-slate-950 rounded-2xl border border-slate-800/80 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Kolom (X)</label>
                    <select
                      value={gfGridX}
                      onChange={(e) => setGfGridX(Number(e.target.value))}
                      className="w-full mt-1 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono"
                    >
                      {[1, 2, 3, 4, 5].map((n) => (
                        <option key={n} value={n}>{n} Unit ({n * 42}mm)</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Baris (Y)</label>
                    <select
                      value={gfGridY}
                      onChange={(e) => setGfGridY(Number(e.target.value))}
                      className="w-full mt-1 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono"
                    >
                      {[1, 2, 3, 4, 5].map((n) => (
                        <option key={n} value={n}>{n} Unit ({n * 42}mm)</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Tinggi (U)</label>
                    <select
                      value={gfHeightU}
                      onChange={(e) => setGfHeightU(Number(e.target.value))}
                      className="w-full mt-1 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono"
                    >
                      {[2, 3, 4, 6, 8, 10, 12].map((u) => (
                        <option key={u} value={u}>{u}U ({u * 7}mm)</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-300 px-1 font-mono">
                  <span>Ukuran Total Part:</span>
                  <span className="font-bold text-cyan-300">
                    {gfGridX * 42} x {gfGridY * 42} x {gfHeightU * 7} mm
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => {
                    handleLoadTemplate({
                      id: `gf_${gfGridX}x${gfGridY}`,
                      name: `Gridfinity Bin ${gfGridX}x${gfGridY} (${gfHeightU}U)`,
                      category: "Workshop Storage",
                      description: `Wadah Gridfinity ${gfGridX}x${gfGridY} unit (${gfHeightU * 7}mm tinggi)`,
                      dimensions: `${gfGridX * 42} x ${gfGridY * 42} x ${gfHeightU * 7} mm`,
                      estimatedWeight: `${Math.round(gfGridX * gfGridY * gfHeightU * 2.2)}g`,
                      estimatedTime: `${Math.round(gfGridX * gfGridY * 0.8)}j`,
                      icon: "🧰",
                      params: {
                        width: gfGridX * 42,
                        depth: gfGridY * 42,
                        height: gfHeightU * 7,
                        wallThickness: 2.0,
                        cornerRadius: 3.5,
                        infillDensity: 20,
                        magnetTolerance: 0.15,
                      },
                      modifiers: ["gridfinity-base", "magnet-recess"],
                    });
                  }}
                  className="w-full py-2.5 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white font-bold rounded-2xl text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Layers className="w-4 h-4" />
                  <span>Buka &amp; Render di 3D Studio &rarr;</span>
                </button>
              </div>
            </div>

            {/* 2. Foto ke Figurin 3D */}
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-purple-500/40 transition-all space-y-5 flex flex-col justify-between shadow-xl">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center text-xl">
                    <Camera className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono">
                    AI Vision
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-black text-white">Foto ke Figurin &amp; Relief 3D</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Ubah foto tampak depan menjadi patung mini atau lithophane 3D dengan base penyangga print-in-place.
                  </p>
                </div>

                <div className="p-6 border-2 border-dashed border-slate-800 rounded-2xl text-center space-y-2 hover:border-purple-500/40 transition-colors cursor-pointer bg-slate-950/60">
                  <Camera className="w-8 h-8 text-purple-400 mx-auto" />
                  <p className="text-xs font-semibold text-slate-300">Tarik &amp; lepas foto atau klik untuk upload</p>
                  <p className="text-[10px] text-slate-500">Mendukung format JPG, PNG, WEBP (Maks 15MB)</p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => {
                    handleLoadTemplate({
                      id: "figurine_sculpt",
                      name: "AI Sculpt Relief Figurine",
                      category: "Figurines",
                      description: "Figurin 3D relief dengan alas duduk optimal",
                      dimensions: "70 x 70 x 110 mm",
                      estimatedWeight: "68g",
                      estimatedTime: "3j 15m",
                      icon: "📸",
                      params: { width: 70, depth: 70, height: 110, wallThickness: 2.8, cornerRadius: 4.0, infillDensity: 20, magnetTolerance: 0.15 },
                      modifiers: ["flexi-joint"],
                    });
                  }}
                  className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-2xl text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Contoh Figurin &rarr;</span>
                </button>
              </div>
            </div>

            {/* 3. Topografi & Peta Kontur 3D */}
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 transition-all space-y-5 flex flex-col justify-between shadow-xl">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-xl">
                    <Map className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                    Terrain GIS
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-black text-white">Topografi Relief &amp; Peta Gunung 3D</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Konversi data kontur elevasi satelit bumi menjadi relief miniatur bertingkat siap cetak di printer FDM.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-950 rounded-2xl border border-slate-800/80 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Lokasi / Landmark</label>
                    <input
                      type="text"
                      defaultValue="Gunung Bromo &amp; Semeru"
                      className="w-full mt-1 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Skala Elevasi</label>
                    <select className="w-full mt-1 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white">
                      <option>1.5x (Realistis)</option>
                      <option>2.0x (Eksagerasi Artistik)</option>
                      <option>3.0x (Dramatis)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => {
                    handleLoadTemplate({
                      id: "topo_bromo",
                      name: "Topographic Mountain Planter",
                      category: "Terrain Relief",
                      description: "Peta kontur 3D bertingkat Gunung Bromo",
                      dimensions: "140 x 140 x 50 mm",
                      estimatedWeight: "95g",
                      estimatedTime: "4j 20m",
                      icon: "🏔️",
                      params: { width: 140, depth: 140, height: 50, wallThickness: 3.0, cornerRadius: 6.0, infillDensity: 15, magnetTolerance: 0.15 },
                      modifiers: ["puzzle-lock"],
                    });
                  }}
                  className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-2xl text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Map className="w-4 h-4" />
                  <span>Muat Relief Topografi &rarr;</span>
                </button>
              </div>
            </div>

            {/* 4. Enclosure & Gear Parametric Generator */}
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 transition-all space-y-5 flex flex-col justify-between shadow-xl">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center text-xl">
                    <Compass className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
                    Mechanical CAD
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-black text-white">Roda Gigi &amp; Box Casing Elektronik</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Generator roda gigi metrik BOSL2, dudukan motor stepper NEMA 17, dan box casing mikrokontroler.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-950 rounded-2xl border border-slate-800/80 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Tipe Komponen</label>
                    <select className="w-full mt-1 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white">
                      <option>Enclosure Box Mikrokontroler</option>
                      <option>Involute Spur Gear (Roda Gigi)</option>
                      <option>NEMA 17 Motor Mount</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Sekrup Standar</label>
                    <select className="w-full mt-1 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white">
                      <option>M3 (3.2mm Hole)</option>
                      <option>M4 (4.2mm Hole)</option>
                      <option>M5 (5.2mm Hole)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => {
                    handleLoadTemplate({
                      id: "enclosure_box",
                      name: "Parametric Electronics Enclosure Box",
                      category: "Enclosure",
                      description: "Casing box elektronik dengan tiang sekrup M3",
                      dimensions: "115 x 75 x 38 mm",
                      estimatedWeight: "62g",
                      estimatedTime: "2j 30m",
                      icon: "📦",
                      params: { width: 115, depth: 75, height: 38, wallThickness: 2.6, cornerRadius: 3.5, infillDensity: 25, magnetTolerance: 0.15 },
                      modifiers: ["hex-pattern"],
                    });
                  }}
                  className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-2xl text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Wrench className="w-4 h-4" />
                  <span>Buka di Studio &rarr;</span>
                </button>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* TAB 3: ⚙️ KALKULATOR KALIBRASI & SLICER (E-Steps, Flow, HPP)        */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {mainTab === "calculators" && (
        <main className="max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-8 animate-in fade-in duration-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                Slicer &amp; Hardware Toolset
              </span>
              <span className="text-xs text-slate-400">4 Simulator Presisi</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
              Kalkulator Kalibrasi Printer &amp; Simulasi HPP
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Hitung kalibrasi langkah motor ekstrusi (E-Steps), flow rate kompensasi toleransi, serta rincian biaya modal cetak dan profit margin.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 1. E-Steps Calibration */}
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-brand/20 text-orange-400 border border-orange-500/30 flex items-center justify-center">
                    <Calculator className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">Kalibrasi E-Steps Extruder Motor</h3>
                    <p className="text-[11px] text-slate-400">Kompensasi dorongan filamen motor extruder</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-400 text-[11px]">Nilai E-Steps Saat Ini (Steps/mm)</label>
                  <input
                    type="number"
                    value={eStepCurrent}
                    onChange={(e) => setEStepCurrent(parseFloat(e.target.value) || 0)}
                    className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl font-mono text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 text-[11px]">Target Ekstrusi (mm)</label>
                    <input
                      type="number"
                      value={eStepTarget}
                      onChange={(e) => setEStepTarget(parseFloat(e.target.value) || 0)}
                      className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl font-mono text-white"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 text-[11px]">Hasil Terukur Aktual (mm)</label>
                    <input
                      type="number"
                      value={eStepActual}
                      onChange={(e) => setEStepActual(parseFloat(e.target.value) || 0)}
                      className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl font-mono text-white"
                    />
                  </div>
                </div>

                <div className="p-4 bg-slate-950 rounded-2xl border border-orange-500/30 flex items-center justify-between mt-2">
                  <div>
                    <span className="text-[10px] text-slate-400 font-mono uppercase">Nilai E-Steps Baru</span>
                    <div className="text-2xl font-black text-orange-400 font-mono">
                      {newESteps.toFixed(2)} <span className="text-xs text-slate-400 font-normal">steps/mm</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`M92 E${newESteps.toFixed(2)}`);
                      setEStepCopied(true);
                      setTimeout(() => setEStepCopied(false), 2000);
                    }}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-mono font-bold text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {eStepCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>Salin G-Code (M92)</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 2. Flow Rate (Extrusion Multiplier) */}
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
                    <Scale className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">Flow Rate (Extrusion Multiplier)</h3>
                    <p className="text-[11px] text-slate-400">Kalibrasi ketebalan dinding kubus single-wall</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 text-[11px]">Tebal Target di Slicer (mm)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={flowWallTarget}
                      onChange={(e) => setFlowWallTarget(parseFloat(e.target.value) || 0)}
                      className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl font-mono text-white"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 text-[11px]">Tebal Terukur Kaliper (mm)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={flowWallMeasured}
                      onChange={(e) => setFlowWallMeasured(parseFloat(e.target.value) || 0)}
                      className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl font-mono text-white"
                    />
                  </div>
                </div>

                <div className="p-4 bg-slate-950 rounded-2xl border border-cyan-500/30 flex items-center justify-between mt-2">
                  <div>
                    <span className="text-[10px] text-slate-400 font-mono uppercase">Flow Rate Rekomendasi</span>
                    <div className="text-2xl font-black text-cyan-400 font-mono">
                      {calculatedFlowRate}% <span className="text-xs text-slate-400 font-normal">(Multiplier: {(parseFloat(calculatedFlowRate)/100).toFixed(2)})</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Kalkulator Biaya Cetak 3D & HPP */}
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                    <Flame className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">Kalkulator HPP Modal Cetak 3D</h3>
                    <p className="text-[11px] text-slate-400">Filamen, daya listrik mesin, &amp; penyusutan part</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-slate-400 text-[11px]">Berat Model (Gram)</label>
                  <input
                    type="number"
                    value={costWeightGrams}
                    onChange={(e) => setCostWeightGrams(parseFloat(e.target.value) || 0)}
                    className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl font-mono text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 text-[11px]">Harga Spul Filamen 1kg (Rp)</label>
                  <input
                    type="number"
                    value={costSpoolPrice}
                    onChange={(e) => setCostSpoolPrice(parseFloat(e.target.value) || 0)}
                    className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl font-mono text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 text-[11px]">Durasi Cetak (Jam)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={costHours}
                    onChange={(e) => setCostHours(parseFloat(e.target.value) || 0)}
                    className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl font-mono text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 text-[11px]">Daya Rata-Rata Printer (Watt)</label>
                  <input
                    type="number"
                    value={costPowerWatt}
                    onChange={(e) => setCostPowerWatt(parseFloat(e.target.value) || 0)}
                    className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl font-mono text-white"
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-950 rounded-2xl border border-emerald-500/30 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-mono uppercase">Total HPP Produksi</span>
                  <div className="text-2xl font-black text-emerald-400 font-mono">
                    Rp {Math.round(calcTotalHpp).toLocaleString()}
                  </div>
                </div>
                <div className="text-right text-[11px] text-slate-400 font-mono">
                  <div>Filamen: Rp {Math.round(calcFilamentCost).toLocaleString()}</div>
                  <div>Listrik: Rp {Math.round(calcElecCost).toLocaleString()}</div>
                </div>
              </div>
            </div>

            {/* 4. Margin Tokopedia / Shopee / Etsy */}
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
                    <Scale className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">Analisis Margin Penjualan Online</h3>
                    <p className="text-[11px] text-slate-400">Komisi marketplace, kardus packing &amp; profit bersih</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-slate-400 text-[11px]">Harga Jual Produk (Rp)</label>
                  <input
                    type="number"
                    value={sellPrice}
                    onChange={(e) => setSellPrice(parseFloat(e.target.value) || 0)}
                    className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl font-mono text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 text-[11px]">Fee Marketplace (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={platformFeePercent}
                    onChange={(e) => setPlatformFeePercent(parseFloat(e.target.value) || 0)}
                    className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl font-mono text-white"
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-950 rounded-2xl border border-purple-500/30 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-mono uppercase">Profit Bersih Penjual</span>
                  <div className="text-2xl font-black text-purple-400 font-mono">
                    Rp {Math.round(netSellerProfit).toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-purple-500/20 text-purple-300">
                    {((netSellerProfit / (sellPrice || 1)) * 100).toFixed(1)}% Margin
                  </span>
                </div>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* TAB 4: 📦 TEMPLATE SIAP CETAK (8 Functional Maker Templates)       */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {mainTab === "templates" && (
        <main className="max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-8 animate-in fade-in duration-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                Preset Library
              </span>
              <span className="text-xs text-slate-400">8 Template Teruji Print-Ready</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
              Katalog Template Desain CAD Siap Cetak
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Pilih template fungsional di bawah ini untuk langsung memuat dan mengedit ukurannya di kanvas 3D Studio.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {READY_TEMPLATES.map((tpl) => (
              <div
                key={tpl.id}
                className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/40 transition-all flex flex-col justify-between space-y-4 shadow-xl group"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <span className="text-2xl">{tpl.icon}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-950 text-slate-400 border border-slate-800">
                      {tpl.category}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-white group-hover:text-indigo-300 transition-colors">
                      {tpl.name}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {tpl.description}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1 text-[11px] font-mono">
                    <div className="flex justify-between text-slate-300">
                      <span>Dimensi:</span>
                      <span className="text-cyan-400 font-bold">{tpl.dimensions}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Filamen: {tpl.estimatedWeight}</span>
                      <span>Waktu: ~{tpl.estimatedTime}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleLoadTemplate(tpl)}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Buka &amp; Edit di 3D Studio &rarr;</span>
                </button>
              </div>
            ))}
          </div>
        </main>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 5. MODAL: KIRIM LANGSUNG KE ANTREAN PRODUKSI 3DFLOW                 */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {showFlowModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-slate-100">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-white">Kirim ke Antrean Produksi 3DFlow</h3>
                  <p className="text-[11px] text-slate-400">
                    Jembatan otomatis dari GooPrint CAD ke mesin armada &amp; pesanan cetak
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowFlowModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Success State Notification */}
            {flowSuccessResult ? (
              <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-3 text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <h4 className="font-black text-white text-base">Berhasil Masuk Antrean 3DFlow!</h4>
                <p className="text-xs text-slate-300">
                  Model CAD <strong>{projectName}</strong> telah berhasil didaftarkan sebagai order nomor:{" "}
                  <strong className="text-emerald-400 font-mono">{flowSuccessResult.orderNumber}</strong>
                </p>
                <div className="flex justify-center gap-2 pt-2">
                  <Link
                    href="/flow"
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-md"
                  >
                    Buka Antrean di 3DFlow &rarr;
                  </Link>
                  <button
                    onClick={() => setShowFlowModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitToFlow} className="space-y-3.5">
                {/* CAD Spec Summary Pill */}
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1 text-xs">
                  <div className="flex justify-between font-bold text-white">
                    <span>{projectName}</span>
                    <span className="font-mono text-cyan-400">
                      {params.width} x {params.depth} x {params.height} mm
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                    <span>Estimasi Berat: {estimates.weightGrams}g</span>
                    <span>Durasi: ~{estimates.timeFormatted}</span>
                    <span>HPP: Rp {estimates.filamentCost.toLocaleString()}</span>
                  </div>
                </div>

                {/* Target Printer in 3DFlow Fleet */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Pilih Mesin Printer 3DFlow <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={selectedFlowPrinter}
                    onChange={(e) => setSelectedFlowPrinter(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    {flowPrinters.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.model}) • Status: {p.status || "Ready"}
                      </option>
                    ))}
                    {flowPrinters.length === 0 && <option value="">Tidak ada mesin terdaftar</option>}
                  </select>
                </div>

                {/* Target Filament Spool from Inventory */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Pilih Spul Filamen dari Inventaris <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={selectedFlowFilament}
                    onChange={(e) => setSelectedFlowFilament(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    {flowFilaments.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.brand} {f.materialType} ({f.color}) • Sisa: {f.currentWeight}g
                      </option>
                    ))}
                    {flowFilaments.length === 0 && <option value="">Tidak ada spul inventaris</option>}
                  </select>
                </div>

                {/* Client / Order Reference */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Nama Pemesan / Klien
                    </label>
                    <input
                      type="text"
                      value={flowClientName}
                      onChange={(e) => setFlowClientName(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Jumlah Cetak (Qty)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={flowQuantity}
                      onChange={(e) => setFlowQuantity(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowFlowModal(false)}
                    className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingToFlow}
                    className="px-5 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 flex items-center gap-1.5 transition-all"
                  >
                    {isSubmittingToFlow ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Mengirim ke Antrean...</span>
                      </>
                    ) : (
                      <>
                        <Flame className="w-3.5 h-3.5" />
                        <span>Kirim ke 3DFlow Sekarang</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function GooPrintPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 text-slate-400 flex items-center justify-center">Memuat GooPrint Studio...</div>}>
      <CadStudioContent />
    </Suspense>
  );
}
