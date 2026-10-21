"use client";

import React, { useState, useEffect, useRef, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import * as THREE from "three";
import { Evaluator, Brush, SUBTRACTION, ADDITION } from "three-bvh-csg";
import { STLExporter } from "three/examples/jsm/exporters/STLExporter.js";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import fontData from "@/lib/fonts/helvetiker_bold.json";
import { GooNavbar } from "@/components/GooNavbar";
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
  EyeOff,
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
  Cpu,
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

// ─────────────────────────────────────────────────────────────────────────────
// 2D Shapes & Texture Helpers
// ─────────────────────────────────────────────────────────────────────────────

function createRoundedRectShape(w: number, d: number, r: number) {
  const shape = new THREE.Shape();
  const halfW = w / 2;
  const halfD = d / 2;
  const radius = Math.max(0.5, Math.min(r, halfW - 0.5, halfD - 0.5));

  shape.moveTo(-halfW + radius, -halfD);
  shape.lineTo(halfW - radius, -halfD);
  shape.quadraticCurveTo(halfW, -halfD, halfW, -halfD + radius);
  shape.lineTo(halfW, halfD - radius);
  shape.quadraticCurveTo(halfW, halfD, halfW - radius, halfD);
  shape.lineTo(-halfW + radius, halfD);
  shape.quadraticCurveTo(-halfW, halfD, -halfW, halfD - radius);
  shape.lineTo(-halfW, -halfD + radius);
  shape.quadraticCurveTo(-halfW, -halfD, -halfW + radius, -halfD);

  return shape;
}

function createIconShape(iconId: string, size: number): THREE.Shape | null {
  const shape = new THREE.Shape();
  const s = size * 0.12;

  switch (iconId) {
    case "heart": {
      shape.moveTo(0, s * 2);
      shape.bezierCurveTo(0, s * 3.5, -s * 3.5, s * 5, -s * 4, s * 2);
      shape.bezierCurveTo(-s * 4.5, -s * 0.5, -s * 2, -s * 3, 0, -s * 5);
      shape.bezierCurveTo(s * 2, -s * 3, s * 4.5, -s * 0.5, s * 4, s * 2);
      shape.bezierCurveTo(s * 3.5, s * 5, 0, s * 3.5, 0, s * 2);
      return shape;
    }
    case "star": {
      const points = 5;
      const outerR = size * 0.55;
      const innerR = size * 0.25;
      for (let i = 0; i < points * 2; i++) {
        const r = i % 2 === 0 ? outerR : innerR;
        const angle = (i * Math.PI) / points - Math.PI / 2;
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r;
        if (i === 0) shape.moveTo(x, y);
        else shape.lineTo(x, y);
      }
      shape.closePath();
      return shape;
    }
    case "camera": {
      const halfW = s * 3.2;
      const halfH = s * 2.2;
      shape.moveTo(-halfW, -halfH);
      shape.lineTo(halfW, -halfH);
      shape.lineTo(halfW, halfH);
      shape.lineTo(s * 1.4, halfH);
      shape.lineTo(s * 1.0, halfH + s * 1.2);
      shape.lineTo(-s * 1.0, halfH + s * 1.2);
      shape.lineTo(-s * 1.4, halfH);
      shape.lineTo(-halfW, halfH);
      shape.closePath();
      return shape;
    }
    case "sun": {
      shape.absarc(0, 0, s * 2.2, 0, Math.PI * 2, false);
      return shape;
    }
    case "palm": {
      shape.moveTo(-s * 0.6, -s * 4);
      shape.lineTo(s * 0.6, -s * 4);
      shape.quadraticCurveTo(s * 1.2, 0, s * 0.4, s * 2);
      shape.lineTo(s * 3.5, s * 3.5);
      shape.quadraticCurveTo(s * 1.5, s * 2.8, 0, s * 2.2);
      shape.lineTo(0, s * 4.5);
      shape.quadraticCurveTo(-s * 1.5, s * 2.8, -s * 3.5, s * 3.5);
      shape.lineTo(-s * 0.4, s * 2);
      shape.quadraticCurveTo(-s * 1.2, 0, -s * 0.6, -s * 4);
      shape.closePath();
      return shape;
    }
    default:
      return null;
  }
}

function createSoftContactShadowTexture() {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const grad = ctx.createRadialGradient(128, 128, 15, 128, 128, 122);
  grad.addColorStop(0, "rgba(0, 0, 0, 0.75)");
  grad.addColorStop(0.4, "rgba(0, 0, 0, 0.42)");
  grad.addColorStop(0.8, "rgba(0, 0, 0, 0.08)");
  grad.addColorStop(1, "rgba(0, 0, 0, 0)");

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function createBambuPeiTexture(widthMm: number, depthMm: number) {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.fillStyle = "#151921";
  ctx.fillRect(0, 0, 1024, 1024);

  // Micro-texture Flecks
  const imgData = ctx.getImageData(0, 0, 1024, 1024);
  const d = imgData.data;
  for (let i = 0; i < d.length; i += 4) {
    const noise = (Math.random() - 0.5) * 20;
    const isGoldSparkle = Math.random() < 0.035;
    if (isGoldSparkle) {
      d[i] = 165;
      d[i + 1] = 138;
      d[i + 2] = 82;
    } else {
      const r = d[i] ?? 0;
      const g = d[i + 1] ?? 0;
      const b = d[i + 2] ?? 0;
      d[i] = Math.min(255, Math.max(0, r + noise));
      d[i + 1] = Math.min(255, Math.max(0, g + noise));
      d[i + 2] = Math.min(255, Math.max(0, b + noise));
    }
  }
  ctx.putImageData(imgData, 0, 0);

  // Minor Grid (10mm)
  const stepMinor = 1024 / (depthMm / 10);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
  ctx.lineWidth = 1;
  for (let x = 0; x <= 1024; x += stepMinor) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 1024);
    ctx.stroke();
  }
  for (let y = 0; y <= 1024; y += stepMinor) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1024, y);
    ctx.stroke();
  }

  // Major Grid (50mm)
  const stepMajor = 1024 / (depthMm / 50);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.22)";
  ctx.lineWidth = 2;
  for (let x = 0; x <= 1024; x += stepMajor) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 1024);
    ctx.stroke();
  }
  for (let y = 0; y <= 1024; y += stepMajor) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1024, y);
    ctx.stroke();
  }

  // Center Origin Crosshair
  ctx.strokeStyle = "#06b6d4";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(512, 0);
  ctx.lineTo(512, 1024);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, 512);
  ctx.lineTo(1024, 512);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(512, 512, 42, 0, Math.PI * 2);
  ctx.stroke();

  // Border Rim
  ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
  ctx.lineWidth = 8;
  ctx.strokeRect(12, 12, 1000, 1000);

  // Signature Branding
  ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
  ctx.font = "bold 22px 'Courier New', monospace";
  ctx.fillText("BAMBU LAB / GOO-OS TEXTURED PEI", 40, 55);
  ctx.font = "16px monospace";
  ctx.fillStyle = "rgba(6, 182, 212, 0.9)";
  ctx.fillText(`${widthMm} x ${depthMm} mm • HIGH TEMP BUILD PLATE`, 40, 85);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function createInstantPhotoTexture(windowW: number, windowD: number) {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.fillStyle = "#fafaf9";
  ctx.fillRect(0, 0, 1024, 1024);

  const pMargin = 24;
  const pW = 1024 - pMargin * 2;
  const pH = 1024 - pMargin * 2;

  // Sky Sunset Gradient
  const grad = ctx.createLinearGradient(0, pMargin, 0, pMargin + pH);
  grad.addColorStop(0, "#0284c7");
  grad.addColorStop(0.3, "#38bdf8");
  grad.addColorStop(0.55, "#f59e0b");
  grad.addColorStop(0.8, "#f43f5e");
  grad.addColorStop(1.0, "#4c1d95");
  ctx.fillStyle = grad;
  ctx.fillRect(pMargin, pMargin, pW, pH);

  // Glowing Sun
  ctx.save();
  ctx.beginPath();
  ctx.arc(pMargin + pW * 0.72, pMargin + pH * 0.42, 70, 0, Math.PI * 2);
  const sunGrad = ctx.createRadialGradient(
    pMargin + pW * 0.72, pMargin + pH * 0.42, 10,
    pMargin + pW * 0.72, pMargin + pH * 0.42, 80
  );
  sunGrad.addColorStop(0, "#ffffff");
  sunGrad.addColorStop(0.4, "#fef08a");
  sunGrad.addColorStop(1, "rgba(254, 240, 138, 0)");
  ctx.fillStyle = sunGrad;
  ctx.fill();
  ctx.restore();

  // Mountain Silhouette 1
  ctx.fillStyle = "#1e1b4b";
  ctx.beginPath();
  ctx.moveTo(pMargin, pMargin + pH);
  ctx.lineTo(pMargin, pMargin + pH * 0.78);
  ctx.lineTo(pMargin + pW * 0.32, pMargin + pH * 0.52);
  ctx.lineTo(pMargin + pW * 0.62, pMargin + pH * 0.72);
  ctx.lineTo(pMargin + pW * 0.88, pMargin + pH * 0.46);
  ctx.lineTo(pMargin + pW, pMargin + pH * 0.65);
  ctx.lineTo(pMargin + pW, pMargin + pH);
  ctx.closePath();
  ctx.fill();

  // Mountain Silhouette 2
  ctx.fillStyle = "#090d16";
  ctx.beginPath();
  ctx.moveTo(pMargin, pMargin + pH);
  ctx.lineTo(pMargin, pMargin + pH * 0.86);
  ctx.lineTo(pMargin + pW * 0.2, pMargin + pH * 0.7);
  ctx.lineTo(pMargin + pW * 0.45, pMargin + pH * 0.82);
  ctx.lineTo(pMargin + pW * 0.75, pMargin + pH * 0.64);
  ctx.lineTo(pMargin + pW, pMargin + pH * 0.8);
  ctx.lineTo(pMargin + pW, pMargin + pH);
  ctx.closePath();
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

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
    dimensions: "126 x 84 x 42 mm",
    estimatedWeight: "64g",
    estimatedTime: "2j 45m",
    icon: "🧰",
    params: { width: 126, depth: 84, height: 42, wallThickness: 2.0, cornerRadius: 3.5, infillDensity: 20, magnetTolerance: 0.15 },
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
    id: "electronic-enclosure-box",
    name: "Enclosure Casing Elektronik & Sensor",
    category: "Hardware Enclosures",
    description: "Kotak box enclosure proyek mikrokontroler dengan tiang sekrup M3 dan lubang kabel.",
    dimensions: "115 x 75 x 38 mm",
    estimatedWeight: "65g",
    estimatedTime: "2j 40m",
    icon: "📦",
    params: { width: 115, depth: 75, height: 38, wallThickness: 2.5, cornerRadius: 3.5, infillDensity: 25, magnetTolerance: 0.15 },
    modifiers: ["hex-pattern"],
  },
];

type CadMainTab = "generators" | "calculators" | "templates";
type GeneratorType = "polaroid" | "gridfinity" | "figurine" | "topography" | "enclosure";

function CadStudioContent() {
  const searchParams = useSearchParams();
  const [mainTab, setMainTab] = useState<CadMainTab>("generators");
  const [activeGenerator, setActiveGenerator] = useState<GeneratorType>("polaroid");
  const [viewerMode, setViewerMode] = useState<"3d" | "2d">("3d");
  const [view2dOrientation, setView2dOrientation] = useState<"top" | "front" | "side">("top");

  // Display Mode: "display" (standing angled on desk standee) vs "bed" (flat on 3D build plate)
  const [displayOrientation, setDisplayOrientation] = useState<"display" | "bed">("display");
  const [showSamplePhoto, setShowSamplePhoto] = useState<boolean>(true);

  // Sync tab with URL search parameter
  useEffect(() => {
    const tabParam = searchParams.get("tab") as CadMainTab;
    if (tabParam && ["generators", "calculators", "templates"].includes(tabParam)) {
      setMainTab(tabParam);
    }
    const genParam = searchParams.get("gen") as GeneratorType;
    if (genParam && ["polaroid", "gridfinity", "figurine", "topography", "enclosure"].includes(genParam)) {
      setActiveGenerator(genParam);
    }
  }, [searchParams]);

  // Selected Virtual Bed Printer
  const [selectedPrinterId, setSelectedPrinterId] = useState("bambu-p1s");
  const [isPrinterDropdownOpen, setIsPrinterDropdownOpen] = useState(false);
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [showStlModal, setShowStlModal] = useState<boolean>(false);

  // 3D Viewport Controls & Camera presets
  const [isRotating, setIsRotating] = useState(true);
  const [showPlateGrid, setShowPlateGrid] = useState<boolean>(true);
  const [slicerLayerPercent, setSlicerLayerPercent] = useState<number>(100);
  const cameraPresetTriggerRef = useRef<((preset: "iso" | "top" | "front" | "back" | "reset") => void) | null>(null);

  // References to hold verified manifold CSG meshes for clean STL export
  const singleFrameMeshRef = useRef<THREE.Mesh | null>(null);
  const standBaseMeshRef = useRef<THREE.Mesh | null>(null);
  const fullExportGroupRef = useRef<THREE.Group | null>(null);

  // ─────────────────────────────────────────────────────────────────────────
  // Generator 1: Polaroid Frame Parameters
  // ─────────────────────────────────────────────────────────────────────────
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

  // Polaroid Specs
  const polaroidSpecs = useMemo(() => {
    if (polaroidFormat === "square") {
      return {
        width: 88,
        depth: 100,
        height: polaroidThickness,
        windowW: 72,
        windowH: 72,
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
        name: "Polaroid Wide (Landscape)",
        photoCompat: "Instax Wide (108x86mm) / Landscape 4x6",
        weight: "42g",
        time: "1j 05m",
      };
    }
    return {
      width: 88,
      depth: 107,
      height: polaroidThickness,
      windowW: 77,
      windowH: 79,
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

  // ─────────────────────────────────────────────────────────────────────────
  // Generator 2: Gridfinity Storage Parameters
  // ─────────────────────────────────────────────────────────────────────────
  const [gfGridX, setGfGridX] = useState(3);
  const [gfGridY, setGfGridY] = useState(2);
  const [gfHeightU, setGfHeightU] = useState(6);
  const [gfWallThickness, setGfWallThickness] = useState(2.0);
  const [gfMagnets, setGfMagnets] = useState(true);
  const [gfDividers, setGfDividers] = useState<number>(1);
  const [gfColor, setGfColor] = useState<string>("amber");

  // ─────────────────────────────────────────────────────────────────────────
  // Generator 3: Figurine & 3D Relief Parameters
  // ─────────────────────────────────────────────────────────────────────────
  const [figHeight, setFigHeight] = useState(100);
  const [figReliefDepth, setFigReliefDepth] = useState(6);
  const [figBaseShape, setFigBaseShape] = useState<"round" | "hex" | "rect">("round");
  const [figBaseInscription, setFigBaseInscription] = useState("GooPrint 3D");
  const [figColor, setFigColor] = useState<string>("purple");

  // ─────────────────────────────────────────────────────────────────────────
  // Generator 4: Topography 3D Map Parameters
  // ─────────────────────────────────────────────────────────────────────────
  const [topoLandmark, setTopoLandmark] = useState("Gunung Bromo & Semeru");
  const [topoSize, setTopoSize] = useState(140);
  const [topoHeight, setTopoHeight] = useState(45);
  const [topoLayers, setTopoLayers] = useState(24);
  const [topoColor, setTopoColor] = useState<string>("emerald");

  // ─────────────────────────────────────────────────────────────────────────
  // Generator 5: Electronics Enclosure Box Parameters
  // ─────────────────────────────────────────────────────────────────────────
  const [encLength, setEncLength] = useState(115);
  const [encWidth, setEncWidth] = useState(75);
  const [encHeight, setEncHeight] = useState(38);
  const [encWall, setEncWall] = useState(2.5);
  const [encScrew, setEncScrew] = useState<string>("M3");
  const [encVent, setEncVent] = useState(true);
  const [encColor, setEncColor] = useState<string>("cyan");

  // Unified Active Specs
  const activeModelSpecs = useMemo(() => {
    if (activeGenerator === "polaroid") {
      return {
        name: `Frame Polaroid ${polaroidFormat === "standard" ? "Standard" : polaroidFormat === "square" ? "Square" : "Wide"}`,
        dimensions: `${polaroidSpecs.width} x ${polaroidSpecs.depth} x ${polaroidSpecs.height} mm`,
        width: polaroidSpecs.width,
        depth: polaroidSpecs.depth,
        height: polaroidSpecs.height,
        weightGrams: parseInt(polaroidSpecs.weight) || 32,
        timeFormatted: polaroidSpecs.time,
        filamentCost: (parseInt(polaroidSpecs.weight) || 32) * 140,
      };
    }
    if (activeGenerator === "gridfinity") {
      const w = gfGridX * 42;
      const d = gfGridY * 42;
      const h = gfHeightU * 7;
      const weight = Math.round(gfGridX * gfGridY * gfHeightU * 2.2);
      const hours = Math.floor((weight * 2.4) / 60);
      const mins = Math.round((weight * 2.4) % 60);
      return {
        name: `Gridfinity Storage Bin ${gfGridX}x${gfGridY} (${gfHeightU}U)`,
        dimensions: `${w} x ${d} x ${h} mm`,
        width: w,
        depth: d,
        height: h,
        weightGrams: weight,
        timeFormatted: `${hours}j ${mins}m`,
        filamentCost: weight * 140,
      };
    }
    if (activeGenerator === "figurine") {
      const weight = Math.round(figHeight * 0.68);
      const hours = Math.floor((weight * 2.8) / 60);
      const mins = Math.round((weight * 2.8) % 60);
      return {
        name: `AI Figurine Sculpt & Relief (${figBaseInscription})`,
        dimensions: `70 x 70 x ${figHeight} mm`,
        width: 70,
        depth: 70,
        height: figHeight,
        weightGrams: weight,
        timeFormatted: `${hours}j ${mins}m`,
        filamentCost: weight * 140,
      };
    }
    if (activeGenerator === "topography") {
      const weight = Math.round((topoSize * topoSize * topoHeight) * 0.00014);
      const hours = Math.floor((weight * 2.6) / 60);
      const mins = Math.round((weight * 2.6) % 60);
      return {
        name: `Topografi 3D Relief — ${topoLandmark}`,
        dimensions: `${topoSize} x ${topoSize} x ${topoHeight} mm`,
        width: topoSize,
        depth: topoSize,
        height: topoHeight,
        weightGrams: weight,
        timeFormatted: `${hours}j ${mins}m`,
        filamentCost: weight * 140,
      };
    }
    // Enclosure
    const weight = Math.round((encLength * encWidth * encHeight * 0.12) * 0.00124);
    const hours = Math.floor((weight * 2.5) / 60);
    const mins = Math.round((weight * 2.5) % 60);
    return {
      name: `Parametric Enclosure Box (${encScrew})`,
      dimensions: `${encLength} x ${encWidth} x ${encHeight} mm`,
      width: encLength,
      depth: encWidth,
      height: encHeight,
      weightGrams: weight,
      timeFormatted: `${hours}j ${mins}m`,
      filamentCost: weight * 140,
    };
  }, [
    activeGenerator,
    polaroidFormat,
    polaroidSpecs,
    gfGridX,
    gfGridY,
    gfHeightU,
    figHeight,
    figBaseInscription,
    topoLandmark,
    topoSize,
    topoHeight,
    encLength,
    encWidth,
    encHeight,
    encScrew,
  ]);

  // Three.js References
  const containerRef = useRef<HTMLDivElement>(null);
  const activePrinter: PrinterPreset =
    PRINTER_PRESETS.find((p) => p.id === selectedPrinterId) || DEFAULT_PRINTER;

  // 3DFlow Modal & State
  const [showFlowModal, setShowFlowModal] = useState(false);
  const [flowPrinters, setFlowPrinters] = useState<any[]>([]);
  const [flowFilaments, setFlowFilaments] = useState<any[]>([]);
  const [selectedFlowPrinter, setSelectedFlowPrinter] = useState("");
  const [selectedFlowFilament, setSelectedFlowFilament] = useState("");
  const [flowClientName, setFlowClientName] = useState("Internal Workshop GooPrint");
  const [flowQuantity, setFlowQuantity] = useState("1");
  const [isSubmittingToFlow, setIsSubmittingToFlow] = useState(false);
  const [flowSuccessResult, setFlowSuccessResult] = useState<{ orderNumber: string; id: string } | null>(null);

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

  // OpenSCAD Script
  const openScadCode = useMemo(() => {
    if (activeGenerator === "polaroid") {
      const windowW = polaroidSpecs.windowW;
      const windowD = polaroidSpecs.windowH;
      const windowOffsetY = (polaroidSpecs.depth / 2) - (windowD / 2) - 6;
      const safeText = polaroidText.replace(/"/g, '\\"');

      return `// ==========================================
// GooPrint Parametric Polaroid Photo Frame (MakerLab)
// Format: ${polaroidFormat.toUpperCase()} (${polaroidSpecs.width}x${polaroidSpecs.depth}x${polaroidSpecs.height}mm)
// ==========================================

$fn = 60;
frame_width = ${polaroidSpecs.width};
frame_length = ${polaroidSpecs.depth};
frame_height = ${polaroidSpecs.height};
corner_radius = 4.0;
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
  translate([0, window_offset_y, frame_height - 2.2]) {
    hull() {
      for (x = [-(window_width/2 - 2), (window_width/2 - 2)]) {
        for (y = [-(window_length/2 - 2), (window_length/2 - 2)]) {
          translate([x, y, 0])
            cylinder(r = 2, h = 3.5, center = false);
        }
      }
    }
  }

  // 4. Rongga Slot Masuk Kertas Foto Polaroid (Tebal 1.4mm)
  translate([0, window_offset_y + 8, 1.9]) {
    cube([window_width + 4, window_length + 16, 1.4], center = true);
  }

  // 5. Celah Masuk Foto dari Atas (Top Slot)
  translate([0, frame_length/2, 1.9]) {
    cube([window_width + 4, 10, 1.4], center = true);
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
        cylinder(r = 3.1, h = 2.3);
    }
  }` : ""}
}`;
    }

    return `// GooPrint Mechanical Model\n$fn=50;\ncube([${activeModelSpecs.width}, ${activeModelSpecs.depth}, ${activeModelSpecs.height}], center=true);`;
  }, [
    activeGenerator,
    activeModelSpecs,
    polaroidFormat,
    polaroidSpecs,
    polaroidText,
    polaroidStyle,
    polaroidMount,
  ]);

  // Load a Template directly into the Generator
  const handleLoadTemplate = (tpl: CadTemplateItem) => {
    setMainTab("generators");
    setViewerMode("3d");

    if (tpl.id.includes("polaroid")) {
      setActiveGenerator("polaroid");
      if (tpl.id === "polaroid-standard-memories") {
        loadPolaroidTemplate1();
      } else if (tpl.id === "polaroid-wide-summertrip") {
        loadPolaroidTemplate2();
      }
    } else if (tpl.id.includes("gridfinity") || tpl.modifiers.includes("gridfinity-base")) {
      setActiveGenerator("gridfinity");
      setGfGridX(Math.max(1, Math.round(tpl.params.width / 42)));
      setGfGridY(Math.max(1, Math.round(tpl.params.depth / 42)));
      setGfHeightU(Math.max(2, Math.round(tpl.params.height / 7)));
      setGfWallThickness(tpl.params.wallThickness);
      setGfMagnets(tpl.modifiers.includes("magnet-recess"));
    } else if (tpl.id.includes("enclosure")) {
      setActiveGenerator("enclosure");
      setEncLength(tpl.params.width);
      setEncWidth(tpl.params.depth);
      setEncHeight(tpl.params.height);
      setEncWall(tpl.params.wallThickness);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // High-End Three.js 3D Viewport Engine with Boolean CSG & STLExporter
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (mainTab !== "generators" || viewerMode !== "3d" || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 800;
    const height = containerRef.current.clientHeight || 560;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#080d1a");
    scene.fog = new THREE.FogExp2(0x060913, 0.0012);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1500);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.localClippingEnabled = slicerLayerPercent < 100;

    containerRef.current.innerHTML = "";
    containerRef.current.appendChild(renderer.domElement);

    // Studio 3-Point Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x1e293b, 0.95);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff8ee, 2.3);
    keyLight.position.set(120, 220, 100);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 10;
    keyLight.shadow.camera.far = 600;
    keyLight.shadow.bias = -0.0002;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x7dd3fc, 0.9);
    fillLight.position.set(-140, 90, -90);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
    rimLight.position.set(0, 140, -180);
    scene.add(rimLight);

    // Build Plate: Textured PEI Plate
    const bedW = activePrinter.width;
    const bedD = activePrinter.depth;

    const peiTexture = showPlateGrid ? createBambuPeiTexture(bedW, bedD) : null;
    const bedGeo = new THREE.BoxGeometry(bedW, 2.5, bedD);
    const bedMat = new THREE.MeshStandardMaterial({
      map: peiTexture || undefined,
      color: peiTexture ? 0xffffff : 0x161b22,
      roughness: 0.72,
      metalness: 0.28,
    });
    const bedMesh = new THREE.Mesh(bedGeo, bedMat);
    bedMesh.position.y = -1.25;
    bedMesh.receiveShadow = true;
    scene.add(bedMesh);

    // Dimensions
    const pW = activeModelSpecs.width;
    const pD = activeModelSpecs.depth;
    const pH = activeModelSpecs.height;

    // Slicer Layer Clipping Simulation
    const totalLayers = Math.max(1, Math.round(pH / 0.2));
    const currentLayer = Math.max(1, Math.round((slicerLayerPercent / 100) * totalLayers));
    const cutHeight = currentLayer * 0.2;
    const clipPlanes = slicerLayerPercent < 100 ? [new THREE.Plane(new THREE.Vector3(0, -1, 0), cutHeight)] : [];

    // Group for Display in Three.js Scene
    const displaySceneGroup = new THREE.Group();

    // Group for Full Printable Flat Export (Frame + Stand Base)
    const printableGroup = new THREE.Group();
    fullExportGroupRef.current = printableGroup;

    // Soft Contact Shadow Plane
    const shadowTexture = createSoftContactShadowTexture();
    if (shadowTexture) {
      const shadowGeo = new THREE.PlaneGeometry(pW * 1.35, pD * 1.35);
      const shadowMat = new THREE.MeshBasicMaterial({
        map: shadowTexture,
        transparent: true,
        opacity: 0.8,
        depthWrite: false,
      });
      const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
      shadowMesh.rotation.x = -Math.PI / 2;
      shadowMesh.position.y = 0.05;
      scene.add(shadowMesh);
    }

    // Evaluator for CSG Boolean Operations
    const evaluator = new Evaluator();
    evaluator.useGroups = false;

    // ─────────────────────────────────────────────────────────────────────────
    // 1. POLAROID GENERATOR (CSG Boolean Manifold Mesh)
    // ─────────────────────────────────────────────────────────────────────────
    if (activeGenerator === "polaroid") {
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

      const frameMat = new THREE.MeshStandardMaterial({
        color: frameColorHex,
        roughness: 0.32,
        metalness: 0.04,
        clippingPlanes: clipPlanes,
      });

      const winW = polaroidSpecs.windowW;
      const winH = polaroidSpecs.windowH;
      const winCenterY = (pD / 2) - 6.0 - (winH / 2);
      const chinCenterY = -(pD / 2) + 11.0;

      // 1. Outer Solid Rounded Block (Z: 0 to pH)
      const outerShape = createRoundedRectShape(pW, pD, 4.0);
      const outerGeo = new THREE.ExtrudeGeometry(outerShape, {
        depth: pH,
        bevelEnabled: true,
        bevelSegments: 3,
        bevelSize: 0.6,
        bevelThickness: 0.6,
        curveSegments: 16,
      });
      const frameBrush = new Brush(outerGeo);
      frameBrush.updateMatrixWorld();

      // 2. Front Aperture Window Cutter (Z: 2.2 to pH + 1.5)
      const winShape = createRoundedRectShape(winW, winH, 1.8);
      const winGeo = new THREE.ExtrudeGeometry(winShape, {
        depth: 3.5,
        bevelEnabled: true,
        bevelSegments: 2,
        bevelSize: 0.5,
        bevelThickness: 0.5,
        curveSegments: 12,
      });
      const winBrush = new Brush(winGeo);
      winBrush.position.set(0, winCenterY, 2.0);
      winBrush.updateMatrixWorld();

      let frameResult = evaluator.evaluate(frameBrush, winBrush, SUBTRACTION);

      // 3. Internal Photo Pocket Slot Cutter (Z: 1.2 to 2.6)
      const slotW = winW + 4;
      const slotH = winH + 16;
      const slotGeo = new THREE.BoxGeometry(slotW, slotH, 1.4);
      const slotBrush = new Brush(slotGeo);
      slotBrush.position.set(0, winCenterY + 8, 1.9);
      slotBrush.updateMatrixWorld();

      frameResult = evaluator.evaluate(frameResult, slotBrush, SUBTRACTION);

      // 4. Rear Magnet Holes (diameter 6.2mm, depth 2.2mm)
      if (polaroidMount === "both" || polaroidMount === "magnet") {
        for (const mx of [-pW / 2 + 13, pW / 2 - 13]) {
          for (const my of [winCenterY, chinCenterY]) {
            const magHoleGeo = new THREE.CylinderGeometry(3.1, 3.1, 2.3, 20);
            magHoleGeo.rotateX(Math.PI / 2);
            const magBrush = new Brush(magHoleGeo);
            magBrush.position.set(mx, my, 1.0);
            magBrush.updateMatrixWorld();
            frameResult = evaluator.evaluate(frameResult, magBrush, SUBTRACTION);
          }
        }
      }

      // 5. 3D Text Geometry
      const fontLoader = new FontLoader();
      const font = fontLoader.parse(fontData);

      const cleanText = (polaroidText || "SWEET MEMORIES").replace(/[^a-zA-Z0-9\s\-_!.,']/g, "").toUpperCase();
      const fontSize = cleanText.length > 20 ? 3.8 : cleanText.length > 14 ? 4.5 : 5.2;

      const textGeo = new TextGeometry(cleanText, {
        font,
        size: fontSize,
        depth: 0.8,
        curveSegments: 6,
        bevelEnabled: true,
        bevelThickness: 0.1,
        bevelSize: 0.08,
        bevelSegments: 2,
      });
      textGeo.computeBoundingBox();
      const tw = textGeo.boundingBox ? textGeo.boundingBox.max.x - textGeo.boundingBox.min.x : 40;
      const th = textGeo.boundingBox ? textGeo.boundingBox.max.y - textGeo.boundingBox.min.y : 5;

      let textStartX = -tw / 2;
      if (polaroidTextAlign === "left") textStartX = -pW / 2 + 10;
      else if (polaroidTextAlign === "right") textStartX = pW / 2 - 10 - tw;

      if (polaroidIconPos === "beside" && polaroidIcon !== "none") textStartX -= 3.5;

      const textBrush = new Brush(textGeo);
      textBrush.position.set(textStartX, chinCenterY - th / 2, pH);
      textBrush.updateMatrixWorld();

      if (polaroidStyle === "engraved") {
        textBrush.position.z = pH - 0.4;
        textBrush.updateMatrixWorld();
        frameResult = evaluator.evaluate(frameResult, textBrush, SUBTRACTION);
      } else {
        frameResult = evaluator.evaluate(frameResult, textBrush, ADDITION);
      }

      // 6. 3D Extruded Icon
      const iconShape = createIconShape(polaroidIcon, 6.0);
      if (iconShape && polaroidIconPos !== "none") {
        const iconGeo = new THREE.ExtrudeGeometry(iconShape, { depth: 0.8, bevelEnabled: false });
        const iconBrush = new Brush(iconGeo);
        if (polaroidIconPos === "beside") {
          iconBrush.position.set(textStartX + tw + 6, chinCenterY, pH);
        } else {
          iconBrush.position.set(pW / 2 - 12, chinCenterY, pH);
        }
        iconBrush.updateMatrixWorld();
        frameResult = evaluator.evaluate(frameResult, iconBrush, ADDITION);
      }

      // Assign material and cast shadows
      frameResult.material = frameMat;
      frameResult.castShadow = true;
      frameResult.receiveShadow = true;

      // Save single frame mesh reference for clean 1-click STL export
      singleFrameMeshRef.current = frameResult;
      printableGroup.add(frameResult);

      // 7. Companion Desktop Stand Base (Dudukan Meja)
      let standBaseMesh: THREE.Mesh | null = null;
      if (polaroidMount === "both" || polaroidMount === "stand") {
        const standW = 55;
        const standD = 34;
        const standH = 14;

        const blockGeo = new THREE.BoxGeometry(standW, standH, standD);
        const blockBrush = new Brush(blockGeo);
        blockBrush.position.set(0, standH / 2, 0);
        blockBrush.updateMatrixWorld();

        const slotW = standW + 4;
        const slotThick = pH + 0.35; // 0.35mm tolerance for snug slide-in
        const slotDepth = 12;
        const cutterGeo = new THREE.BoxGeometry(slotW, slotDepth, slotThick);
        const cutterBrush = new Brush(cutterGeo);
        cutterBrush.position.set(0, standH - slotDepth / 2 + 1, 0);
        cutterBrush.rotation.x = -0.26; // 15 degrees tilt
        cutterBrush.updateMatrixWorld();

        standBaseMesh = evaluator.evaluate(blockBrush, cutterBrush, SUBTRACTION);
        standBaseMesh.material = frameMat;
        standBaseMesh.castShadow = true;
        standBaseMesh.receiveShadow = true;
        standBaseMeshRef.current = standBaseMesh;

        // In Bed mode, place stand beside frame on build plate
        const printableStand = standBaseMesh.clone();
        printableStand.position.set(pW / 2 + 35, 0, 0);
        printableGroup.add(printableStand);
      } else {
        standBaseMeshRef.current = null;
      }

      // 8. Display Scene Assembly
      const displayFrame = frameResult.clone(true);

      // Insert Sample Photo Plane if enabled
      if (showSamplePhoto) {
        const photoGeo = new THREE.PlaneGeometry(winW - 1.2, winH - 1.2);
        const photoTexture = createInstantPhotoTexture(winW, winH);
        const photoMat = new THREE.MeshStandardMaterial({
          map: photoTexture || undefined,
          color: photoTexture ? 0xffffff : 0x0284c7,
          roughness: 0.12,
          metalness: 0.05,
          clippingPlanes: clipPlanes,
        });
        const photoMesh = new THREE.Mesh(photoGeo, photoMat);
        photoMesh.position.set(0, winCenterY, 2.0);
        photoMesh.receiveShadow = true;
        displayFrame.add(photoMesh);
      }

      if (displayOrientation === "display") {
        // Tilted on desk inside standee base
        displayFrame.rotation.x = -0.26; // 15 degrees tilt
        displayFrame.position.set(0, pD * 0.45, 0);

        if (standBaseMesh) {
          const displayStand = standBaseMesh.clone(true);
          displayStand.position.set(0, 0, 0);
          displaySceneGroup.add(displayStand);
        }
      } else {
        // Bed mode: flat on build plate
        displayFrame.rotation.x = -Math.PI / 2;
        displayFrame.position.set(standBaseMesh ? -20 : 0, 0, 0);

        if (standBaseMesh) {
          const bedStand = standBaseMesh.clone(true);
          bedStand.position.set(pW / 2 + 15, 0, 0);
          displaySceneGroup.add(bedStand);
        }
      }

      displaySceneGroup.add(displayFrame);
    } else if (activeGenerator === "gridfinity") {
      // Gridfinity Manifold Box
      const binColorHex = gfColor === "amber" ? 0xf59e0b : gfColor === "slate" ? 0x334155 : 0x0284c7;
      const binMat = new THREE.MeshStandardMaterial({ color: binColorHex, roughness: 0.32, clippingPlanes: clipPlanes });

      const outerShape = createRoundedRectShape(pW, pD, 3.5);
      const outerGeo = new THREE.ExtrudeGeometry(outerShape, { depth: pH, bevelEnabled: true, bevelSize: 0.8, bevelThickness: 0.8 });
      const binBrush = new Brush(outerGeo);
      binBrush.updateMatrixWorld();

      const cavGeo = new THREE.BoxGeometry(pW - gfWallThickness * 2, pD - gfWallThickness * 2, pH - gfWallThickness);
      const cavBrush = new Brush(cavGeo);
      cavBrush.position.set(0, 0, gfWallThickness + (pH - gfWallThickness) / 2);
      cavBrush.updateMatrixWorld();

      const gfMesh = evaluator.evaluate(binBrush, cavBrush, SUBTRACTION);
      gfMesh.material = binMat;
      gfMesh.castShadow = true;
      singleFrameMeshRef.current = gfMesh;
      printableGroup.add(gfMesh);

      const gfDisplay = gfMesh.clone(true);
      gfDisplay.rotation.x = -Math.PI / 2;
      displaySceneGroup.add(gfDisplay);
    } else if (activeGenerator === "enclosure") {
      // Enclosure Box
      const encColorHex = encColor === "cyan" ? 0x0284c7 : encColor === "black" ? 0x1e293b : 0xe11d48;
      const boxMat = new THREE.MeshStandardMaterial({ color: encColorHex, roughness: 0.35, clippingPlanes: clipPlanes });

      const boxShape = createRoundedRectShape(pW, pD, 4.0);
      const boxGeo = new THREE.ExtrudeGeometry(boxShape, { depth: pH, bevelEnabled: true, bevelSize: 0.8, bevelThickness: 0.8 });
      const boxBrush = new Brush(boxGeo);
      boxBrush.updateMatrixWorld();

      const cavGeo = new THREE.BoxGeometry(pW - encWall * 2, pD - encWall * 2, pH - encWall);
      const cavBrush = new Brush(cavGeo);
      cavBrush.position.set(0, 0, encWall + (pH - encWall) / 2);
      cavBrush.updateMatrixWorld();

      let encMesh = evaluator.evaluate(boxBrush, cavBrush, SUBTRACTION);

      // Screw holes
      for (const sx of [-pW / 2 + 7, pW / 2 - 7]) {
        for (const sy of [-pD / 2 + 7, pD / 2 - 7]) {
          const holeGeo = new THREE.CylinderGeometry(1.6, 1.6, pH + 2, 16);
          const holeBrush = new Brush(holeGeo);
          holeBrush.position.set(sx, sy, pH / 2);
          holeBrush.updateMatrixWorld();
          encMesh = evaluator.evaluate(encMesh, holeBrush, SUBTRACTION);
        }
      }

      encMesh.material = boxMat;
      encMesh.castShadow = true;
      singleFrameMeshRef.current = encMesh;
      printableGroup.add(encMesh);

      const encDisplay = encMesh.clone(true);
      encDisplay.rotation.x = -Math.PI / 2;
      displaySceneGroup.add(encDisplay);
    } else {
      // Simple preview for other generators
      const defGeo = new THREE.BoxGeometry(pW, pH, pD);
      const defMesh = new THREE.Mesh(defGeo, new THREE.MeshStandardMaterial({ color: 0x9333ea }));
      singleFrameMeshRef.current = defMesh;
      printableGroup.add(defMesh);
      displaySceneGroup.add(defMesh.clone());
    }

    scene.add(displaySceneGroup);

    // ─────────────────────────────────────────────────────────────────────────
    // Camera Navigation: Orbit, Pan & Damping
    // ─────────────────────────────────────────────────────────────────────────
    let isDragging = false;
    let isPanning = false;
    let prevMousePos = { x: 0, y: 0 };

    const initialRadius = displayOrientation === "display" ? Math.max(160, Math.max(pW, pD) * 1.4) : Math.max(220, Math.max(pW, pD) * 1.65);
    const currentAngle = { theta: 0.85, phi: 0.65, radius: initialRadius };
    const targetAngle = { ...currentAngle };
    const currentLookAt = new THREE.Vector3(0, displayOrientation === "display" ? pD * 0.4 : pH / 3, 0);
    const targetLookAt = currentLookAt.clone();

    cameraPresetTriggerRef.current = (preset) => {
      if (preset === "top") {
        targetAngle.theta = 0;
        targetAngle.phi = 0.05;
        targetAngle.radius = Math.max(180, Math.max(pW, pD) * 1.5);
        targetLookAt.set(0, displayOrientation === "display" ? pD * 0.4 : 5, 0);
      } else if (preset === "front") {
        targetAngle.theta = 0;
        targetAngle.phi = Math.PI / 2 - 0.05;
        targetAngle.radius = Math.max(180, Math.max(pW, pD) * 1.5);
        targetLookAt.set(0, displayOrientation === "display" ? pD * 0.45 : pH / 2, 0);
      } else if (preset === "back") {
        targetAngle.theta = Math.PI;
        targetAngle.phi = 0.65;
        targetAngle.radius = Math.max(180, Math.max(pW, pD) * 1.5);
        targetLookAt.set(0, displayOrientation === "display" ? pD * 0.45 : pH / 2, 0);
      } else {
        targetAngle.theta = 0.85;
        targetAngle.phi = 0.65;
        targetAngle.radius = initialRadius;
        targetLookAt.set(0, displayOrientation === "display" ? pD * 0.4 : pH / 3, 0);
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 2 || e.shiftKey) {
        isPanning = true;
      } else if (e.button === 0) {
        isDragging = true;
      }
      prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - prevMousePos.x;
      const deltaY = e.clientY - prevMousePos.y;
      prevMousePos = { x: e.clientX, y: e.clientY };

      if (isPanning) {
        const factor = currentAngle.radius * 0.0014;
        const rightX = Math.cos(currentAngle.theta);
        const rightZ = -Math.sin(currentAngle.theta);
        targetLookAt.x -= deltaX * rightX * factor;
        targetLookAt.z -= deltaX * rightZ * factor;
        targetLookAt.y += deltaY * factor;
      } else if (isDragging) {
        targetAngle.theta -= deltaX * 0.008;
        targetAngle.phi = Math.max(0.04, Math.min(Math.PI / 2 - 0.05, targetAngle.phi - deltaY * 0.008));
      }
    };

    const handleMouseUp = () => {
      isDragging = false;
      isPanning = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      targetAngle.radius = Math.max(50, Math.min(650, targetAngle.radius + e.deltaY * 0.25));
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const dom = containerRef.current;
    dom.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    dom.addEventListener("wheel", handleWheel, { passive: false });
    dom.addEventListener("contextmenu", handleContextMenu);

    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      currentAngle.theta += (targetAngle.theta - currentAngle.theta) * 0.12;
      currentAngle.phi += (targetAngle.phi - currentAngle.phi) * 0.12;
      currentAngle.radius += (targetAngle.radius - currentAngle.radius) * 0.12;
      currentLookAt.lerp(targetLookAt, 0.12);

      if (isRotating && !isDragging && !isPanning) {
        targetAngle.theta += 0.003;
      }

      camera.position.x =
        targetLookAt.x + currentAngle.radius * Math.sin(currentAngle.phi) * Math.sin(currentAngle.theta);
      camera.position.y =
        targetLookAt.y + currentAngle.radius * Math.cos(currentAngle.phi);
      camera.position.z =
        targetLookAt.z + currentAngle.radius * Math.sin(currentAngle.phi) * Math.cos(currentAngle.theta);
      camera.lookAt(currentLookAt);

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
      dom.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
    };
  }, [
    mainTab,
    viewerMode,
    activeGenerator,
    displayOrientation,
    showSamplePhoto,
    selectedPrinterId,
    activePrinter,
    isRotating,
    showPlateGrid,
    slicerLayerPercent,
    activeModelSpecs,
    polaroidFormat,
    polaroidSpecs,
    polaroidText,
    polaroidFont,
    polaroidIcon,
    polaroidIconPos,
    polaroidStyle,
    polaroidMount,
    polaroidColor,
    polaroidThickness,
    polaroidTextAlign,
    gfGridX,
    gfGridY,
    gfHeightU,
    gfWallThickness,
    gfMagnets,
    gfDividers,
    gfColor,
    figHeight,
    figReliefDepth,
    figBaseShape,
    figBaseInscription,
    figColor,
    topoLandmark,
    topoSize,
    topoHeight,
    topoLayers,
    topoColor,
    encLength,
    encWidth,
    encHeight,
    encWall,
    encScrew,
    encColor,
  ]);

  // Authentic 100% Manifold Binary STL Exporter
  const handleDownloadStl = (target: "frame" | "stand" | "full") => {
    setIsExporting("STL");
    try {
      let exportObj: THREE.Object3D | null = null;
      let filename = activeModelSpecs.name.toLowerCase().replace(/[^a-z0-9]/g, "_");

      if (activeGenerator === "polaroid") {
        if (target === "frame" && singleFrameMeshRef.current) {
          exportObj = singleFrameMeshRef.current;
          filename += "_frame";
        } else if (target === "stand" && standBaseMeshRef.current) {
          exportObj = standBaseMeshRef.current;
          filename += "_dudukan_meja";
        } else if (fullExportGroupRef.current) {
          exportObj = fullExportGroupRef.current;
          filename += "_full_set";
        }
      } else if (singleFrameMeshRef.current) {
        exportObj = singleFrameMeshRef.current;
      }

      if (!exportObj) {
        throw new Error("Model 3D belum siap diekspor.");
      }

      const exporter = new STLExporter();
      const stlData = exporter.parse(exportObj, { binary: true });
      const blob = new Blob([stlData], { type: "application/octet-stream" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filename}.stl`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setShowStlModal(false);
    } catch (err: any) {
      alert("Gagal mengekspor STL: " + err.message);
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportScad = () => {
    const element = document.createElement("a");
    const file = new Blob([openScadCode], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `${activeModelSpecs.name.toLowerCase().replace(/[^a-z0-9]/g, "_")}.scad`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
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
        sourceChannel: "GooPrint Parametric Studio",
        status: "queued",
        notes: `Model: ${activeModelSpecs.name} (${activeModelSpecs.dimensions})`,
        items: [
          {
            modelName: `${activeModelSpecs.name} (Parametrik)`,
            quantity: parseInt(flowQuantity) || 1,
            material: chosenFilament ? `${chosenFilament.brand} ${chosenFilament.materialType}` : "PLA+",
            color: chosenFilament ? chosenFilament.color : "Black",
            printerId: chosenPrinter ? chosenPrinter.id : null,
            weightGrams: activeModelSpecs.weightGrams,
            price: activeModelSpecs.filamentCost * (parseInt(flowQuantity) || 1) * 2.5,
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
  const calcElecCost = ((costPowerWatt * costHours) / 1000) * 1444;
  const calcTotalHpp = calcFilamentCost + calcElecCost + 5000;

  const [sellPrice, setSellPrice] = useState(85000);
  const [platformFeePercent, setPlatformFeePercent] = useState(6.5);
  const [packingCost, setPackingCost] = useState(3000);
  const netSellerProfit = sellPrice - (sellPrice * (platformFeePercent / 100)) - calcTotalHpp - packingCost;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none overflow-x-hidden">
      <GooNavbar />

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* GOOPRINT NAVIGATION HEADER & MAIN SUB-TABS                         */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 sticky top-16 z-30 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Main Sub-tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setMainTab("generators")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              mainTab === "generators"
                ? "bg-cyan-600 text-white shadow-lg shadow-cyan-600/30"
                : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            <Wrench className="w-4 h-4 text-amber-400" />
            <span>🪄 Generator Perkakas 3D</span>
          </button>

          <button
            onClick={() => setMainTab("calculators")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              mainTab === "calculators"
                ? "bg-cyan-600 text-white shadow-lg shadow-cyan-600/30"
                : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            <Scale className="w-4 h-4 text-emerald-400" />
            <span>⚙️ Kalkulator Slicer &amp; Kalibrasi (4)</span>
          </button>

          <button
            onClick={() => setMainTab("templates")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              mainTab === "templates"
                ? "bg-cyan-600 text-white shadow-lg shadow-cyan-600/30"
                : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            <Boxes className="w-4 h-4 text-indigo-400" />
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
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs shadow-md shadow-rose-600/30 transition-all cursor-pointer"
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
      {/* TAB 1: 🪄 FULL-PAGE GENERATOR (Viewer di Kiri, Setting di Kanan)    */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {mainTab === "generators" && (
        <main className="flex-1 flex flex-col p-3 sm:p-5 max-w-[1720px] w-full mx-auto space-y-4">
          {/* Top Generator Selector Pills Bar */}
          <div className="bg-slate-900/90 border border-slate-800 p-2 rounded-2xl flex items-center justify-between gap-3 overflow-x-auto shadow-lg">
            <div className="flex items-center gap-2">
              {[
                { id: "polaroid" as const, name: "Frame Polaroid", icon: "🖼️", badge: "MakerLab" },
                { id: "gridfinity" as const, name: "Gridfinity Builder", icon: "🧰", badge: "42mm Grid" },
                { id: "figurine" as const, name: "Foto Figurin & Relief", icon: "📸", badge: "AI Vision" },
                { id: "topography" as const, name: "Topografi 3D", icon: "🏔️", badge: "Terrain GIS" },
                { id: "enclosure" as const, name: "Enclosure Casing", icon: "📦", badge: "Mechanical" },
              ].map((gen) => (
                <button
                  key={gen.id}
                  onClick={() => setActiveGenerator(gen.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    activeGenerator === gen.id
                      ? "bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-md shadow-cyan-600/30 scale-102"
                      : "bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800"
                  }`}
                >
                  <span className="text-base">{gen.icon}</span>
                  <span>{gen.name}</span>
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full ${activeGenerator === gen.id ? "bg-white/20 text-white" : "bg-slate-900 text-slate-500"}`}>
                    {gen.badge}
                  </span>
                </button>
              ))}
            </div>

            {/* Virtual Printer Selector Dropdown */}
            <div className="relative shrink-0 hidden md:block">
              <button
                onClick={() => setIsPrinterDropdownOpen(!isPrinterDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-semibold"
              >
                <Printer className="w-3.5 h-3.5 text-cyan-400" />
                <span>{activePrinter.name}</span>
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
                      className={`w-full text-left px-2.5 py-2 rounded-xl text-xs font-medium transition-colors flex items-center justify-between ${
                        selectedPrinterId === printer.id
                          ? "bg-cyan-500/20 text-cyan-300 font-bold"
                          : "text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      <div>
                        <div>{printer.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {printer.width} x {printer.depth} x {printer.height} mm
                        </div>
                      </div>
                      {selectedPrinterId === printer.id && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Full-Page Layout: Left 2D/3D Viewer (7 cols) + Right Settings Panel (5 cols) */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 flex-1 items-stretch">
            {/* ════════════════════════════════════════════════════════════ */}
            {/* LEFT COLUMN: 2D / 3D INTERACTIVE VIEWER (7 cols)             */}
            {/* ════════════════════════════════════════════════════════════ */}
            <div className="xl:col-span-7 flex flex-col space-y-3">
              {/* Viewer Header Controls Bar */}
              <div className="bg-slate-900/90 border border-slate-800 px-4 py-2.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-md">
                {/* 2D vs 3D View Mode Toggle */}
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    onClick={() => setViewerMode("3d")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      viewerMode === "3d"
                        ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/30"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <span>🧊</span>
                    <span>3D View</span>
                  </button>
                  <button
                    onClick={() => setViewerMode("2d")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      viewerMode === "2d"
                        ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/30"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <span>🎨</span>
                    <span>2D Blueprint</span>
                  </button>
                </div>

                {/* Polaroid Display Mode & Photo Toggle */}
                {activeGenerator === "polaroid" && viewerMode === "3d" && (
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px] font-mono">
                      <button
                        onClick={() => setDisplayOrientation("display")}
                        className={`px-2 py-1 rounded transition-colors ${
                          displayOrientation === "display" ? "bg-indigo-600 text-white font-bold" : "text-slate-400 hover:text-white"
                        }`}
                        title="Tampilkan berdiri di meja dengan dudukan stand (MakerLab display view)"
                      >
                        🖼️ Meja
                      </button>
                      <button
                        onClick={() => setDisplayOrientation("bed")}
                        className={`px-2 py-1 rounded transition-colors ${
                          displayOrientation === "bed" ? "bg-indigo-600 text-white font-bold" : "text-slate-400 hover:text-white"
                        }`}
                        title="Tampilkan rata di atas pelat cetak (Print bed view)"
                      >
                        🖨️ Bed
                      </button>
                    </div>

                    <button
                      onClick={() => setShowSamplePhoto(!showSamplePhoto)}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-mono border transition-colors cursor-pointer ${
                        showSamplePhoto
                          ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                          : "bg-slate-950 text-slate-400 border-slate-800"
                      }`}
                      title={showSamplePhoto ? "Sembunyikan contoh foto (hanya bingkai kosong)" : "Tampilkan contoh foto dalam bingkai"}
                    >
                      {showSamplePhoto ? "📸 Foto: ON" : "🔲 Foto: OFF"}
                    </button>
                  </div>
                )}

                {/* 3D Viewport Controls (Camera Presets & Rotate) */}
                {viewerMode === "3d" ? (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px] font-mono">
                      <button
                        onClick={() => cameraPresetTriggerRef.current?.("iso")}
                        className="px-2 py-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
                        title="Pandangan Isometrik 3D"
                      >
                        3D
                      </button>
                      <button
                        onClick={() => cameraPresetTriggerRef.current?.("top")}
                        className="px-2 py-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
                        title="Pandangan Atas"
                      >
                        Atas
                      </button>
                      <button
                        onClick={() => cameraPresetTriggerRef.current?.("front")}
                        className="px-2 py-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
                        title="Pandangan Depan"
                      >
                        Depan
                      </button>
                      <button
                        onClick={() => cameraPresetTriggerRef.current?.("back")}
                        className="px-2 py-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
                        title="Pandangan Belakang"
                      >
                        Belakang
                      </button>
                      <button
                        onClick={() => cameraPresetTriggerRef.current?.("reset")}
                        className="px-2 py-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
                        title="Reset Kamera"
                      >
                        Reset
                      </button>
                    </div>

                    <button
                      onClick={() => setIsRotating(!isRotating)}
                      className={`p-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                        isRotating
                          ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                          : "bg-slate-950 text-slate-400 border-slate-800"
                      }`}
                      title={isRotating ? "Jeda rotasi otomatis" : "Aktifkan rotasi otomatis"}
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isRotating ? "animate-spin" : ""}`} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px] font-mono">
                    <button
                      onClick={() => setView2dOrientation("top")}
                      className={`px-2.5 py-1 rounded transition-colors ${view2dOrientation === "top" ? "bg-cyan-600 text-white font-bold" : "text-slate-400 hover:text-white"}`}
                    >
                      Tampak Atas
                    </button>
                    <button
                      onClick={() => setView2dOrientation("front")}
                      className={`px-2.5 py-1 rounded transition-colors ${view2dOrientation === "front" ? "bg-cyan-600 text-white font-bold" : "text-slate-400 hover:text-white"}`}
                    >
                      Tampak Depan
                    </button>
                    <button
                      onClick={() => setView2dOrientation("side")}
                      className={`px-2.5 py-1 rounded transition-colors ${view2dOrientation === "side" ? "bg-cyan-600 text-white font-bold" : "text-slate-400 hover:text-white"}`}
                    >
                      Potongan Samping
                    </button>
                  </div>
                )}
              </div>

              {/* Main Viewer Stage (Three.js WebGL or 2D Blueprint) */}
              <div className="flex-1 min-h-[520px] lg:min-h-[580px] bg-[#070b14] rounded-3xl border border-slate-800 relative overflow-hidden shadow-2xl flex flex-col justify-between">
                {viewerMode === "3d" ? (
                  <>
                    {/* Three.js Canvas Container */}
                    <div ref={containerRef} className="w-full h-full absolute inset-0 cursor-grab active:cursor-grabbing" />

                    {/* Top Overlay Badge & Slicer Simulator */}
                    <div className="relative z-10 p-4 flex items-start justify-between pointer-events-none">
                      <div className="flex items-center gap-2 pointer-events-auto flex-wrap">
                        <span className="px-2.5 py-1 rounded-full bg-slate-950/80 border border-slate-800 text-[10px] font-mono text-cyan-300 shadow-md">
                          Bed: {activePrinter.name}
                        </span>
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-[10px] font-mono text-emerald-300">
                          {displayOrientation === "display" ? "Mode Pajang Meja" : "Mode Bed Cetak"}
                        </span>
                      </div>

                      {/* Slicer Layer Simulator Slider */}
                      <div className="pointer-events-auto bg-slate-950/90 border border-slate-800/90 p-2 rounded-2xl flex items-center gap-2.5 shadow-xl text-xs font-mono">
                        <Layers className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="text-[10px] text-slate-300 font-bold whitespace-nowrap">
                          Layer Cut: {slicerLayerPercent}%
                        </span>
                        <input
                          type="range"
                          min={10}
                          max={100}
                          value={slicerLayerPercent}
                          onChange={(e) => setSlicerLayerPercent(Number(e.target.value))}
                          className="w-24 accent-cyan-500 cursor-pointer"
                          title="Simulasi potongan layer irisan cetak (Bambu Studio Slicer Simulator)"
                        />
                      </div>
                    </div>

                    {/* Bottom Floating Hint Overlay */}
                    <div className="relative z-10 p-4 text-[10px] text-slate-400 font-mono flex items-center justify-between pointer-events-none">
                      <span className="bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800/60">
                        🖱️ Orbit: Drag Kiri • Pan: Drag Kanan/Shift • Zoom: Scroll
                      </span>
                      <span className="bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800/60">
                        {activeModelSpecs.dimensions}
                      </span>
                    </div>
                  </>
                ) : (
                  /* 2D Responsive Engineering Blueprint View */
                  <div className="w-full h-full flex-1 p-6 flex flex-col justify-between relative bg-slate-950/90 text-slate-200">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                        <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                          2D Parametric Drafting Blueprint ({view2dOrientation.toUpperCase()})
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-cyan-300 bg-slate-900 px-2.5 py-1 rounded-full border border-slate-800">
                        Skala 1:1 Presisi FDM
                      </span>
                    </div>

                    {/* 2D Schematic Visual per Generator */}
                    <div className="flex-1 flex items-center justify-center p-6">
                      {activeGenerator === "polaroid" && (
                        <div
                          className="flex flex-col justify-between p-3.5 rounded-2xl shadow-2xl relative border-2 border-dashed border-cyan-500/40"
                          style={{
                            width: polaroidFormat === "wide" ? "320px" : polaroidFormat === "square" ? "270px" : "260px",
                            height: polaroidFormat === "wide" ? "252px" : polaroidFormat === "square" ? "306px" : "316px",
                            backgroundColor: polaroidColor === "black" ? "#1e293b" : "#f8fafc",
                            color: polaroidColor === "black" ? "#f8fafc" : "#0f172a",
                          }}
                        >
                          <div className="text-[9px] font-mono text-center opacity-70">
                            ⬆️ Slot Geser Foto Masuk ({polaroidSpecs.windowW + 4}x1.4mm)
                          </div>

                          {/* Photo Recess Window */}
                          <div className="flex-1 rounded-lg overflow-hidden border border-black/30 bg-gradient-to-tr from-sky-800 to-amber-700 flex flex-col items-center justify-center text-white text-center p-2 relative">
                            <div className="absolute top-1 left-1 text-[8px] font-mono bg-black/50 px-1 rounded">
                              {polaroidSpecs.windowW}x{polaroidSpecs.windowH}mm
                            </div>
                            <Camera className="w-8 h-8 opacity-80" />
                            <span className="text-[10px] font-bold mt-1">Area Foto Polaroid</span>
                            <span className="text-[8px] opacity-75">{polaroidSpecs.photoCompat}</span>
                          </div>

                          {/* Caption Bar */}
                          <div
                            className={`pt-2.5 pb-1 px-1 font-bold ${
                              polaroidTextAlign === "left"
                                ? "text-left"
                                : polaroidTextAlign === "right"
                                ? "text-right"
                                : "text-center"
                            } ${
                              polaroidFont === "handwriting"
                                ? "italic font-serif text-base"
                                : polaroidFont === "mono"
                                ? "font-mono uppercase text-xs"
                                : "text-sm"
                            }`}
                            style={{
                              color: polaroidStyle === "dual-color" ? "#0284c7" : polaroidColor === "black" ? "#f8fafc" : "#0f172a",
                            }}
                          >
                            <span>{polaroidText || "Polaroid Frame"}</span>
                            {polaroidIconPos === "beside" && polaroidIcon && (
                              <span className="ml-1 text-sm not-italic">{getIconChar(polaroidIcon)}</span>
                            )}
                          </div>
                        </div>
                      )}

                      {activeGenerator === "gridfinity" && (
                        <div className="space-y-3 text-center">
                          <div
                            className="grid gap-2 p-4 rounded-2xl bg-slate-900 border-2 border-dashed border-amber-500/40 shadow-xl"
                            style={{
                              gridTemplateColumns: `repeat(${gfGridX}, 1fr)`,
                            }}
                          >
                            {Array.from({ length: gfGridX * gfGridY }).map((_, i) => (
                              <div
                                key={i}
                                className="w-20 h-20 rounded-xl bg-slate-950 border border-amber-500/50 flex flex-col items-center justify-center p-1 text-[10px] font-mono relative"
                              >
                                <span className="text-amber-400 font-bold">42 x 42 mm</span>
                                <span className="text-[9px] text-slate-500">Unit #{i + 1}</span>
                                {gfMagnets && (
                                  <div className="absolute inset-1 border border-dotted border-slate-600 rounded-lg flex items-center justify-center">
                                    <span className="text-[8px] text-cyan-300">🧲 6x2mm</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                          <div className="text-xs font-mono text-slate-400">
                            Total Ruang: {gfGridX * 42} x {gfGridY * 42} x {gfHeightU * 7} mm (Tinggi {gfHeightU}U)
                          </div>
                        </div>
                      )}

                      {activeGenerator === "figurine" && (
                        <div className="text-center space-y-4">
                          <div className="w-48 h-64 mx-auto rounded-3xl bg-slate-900 border-2 border-dashed border-purple-500/40 p-4 flex flex-col justify-between items-center">
                            <div className="text-[10px] font-mono text-purple-300">Siluet Relief ({figReliefDepth}mm Tebal)</div>
                            <Camera className="w-16 h-16 text-purple-400/80 animate-pulse" />
                            <div className="w-full py-2 rounded-xl bg-purple-600 text-white font-bold text-xs">
                              {figBaseInscription}
                            </div>
                          </div>
                          <div className="text-xs font-mono text-slate-400">
                            Alas Pedestal: {figBaseShape.toUpperCase()} • Tinggi Total: {figHeight} mm
                          </div>
                        </div>
                      )}

                      {activeGenerator === "topography" && (
                        <div className="text-center space-y-3">
                          <div className="w-60 h-60 mx-auto rounded-3xl bg-slate-900 border-2 border-dashed border-emerald-500/40 p-4 flex flex-col items-center justify-center relative">
                            <div className="absolute inset-4 rounded-full border border-emerald-500/30 flex items-center justify-center">
                              <div className="w-36 h-36 rounded-full border border-emerald-500/50 flex items-center justify-center">
                                <div className="w-20 h-20 rounded-full border-2 border-emerald-400 flex items-center justify-center bg-emerald-500/20">
                                  <span className="text-[9px] font-mono font-bold text-emerald-300">Puncak</span>
                                </div>
                              </div>
                            </div>
                            <span className="relative z-10 text-xs font-bold text-white bg-slate-950/80 px-2 py-1 rounded">
                              {topoLandmark}
                            </span>
                          </div>
                          <div className="text-xs font-mono text-slate-400">
                            Dimensi: {topoSize} x {topoSize} mm • Elevasi: {topoHeight} mm ({topoLayers} Kontur)
                          </div>
                        </div>
                      )}

                      {activeGenerator === "enclosure" && (
                        <div className="text-center space-y-3">
                          <div className="w-72 h-52 mx-auto rounded-2xl bg-slate-900 border-2 border-dashed border-cyan-500/40 p-3 flex flex-col justify-between relative">
                            <div className="flex justify-between text-[10px] text-cyan-300 font-mono">
                              <span>🔩 {encScrew} Corner Post</span>
                              <span>🔩 {encScrew} Corner Post</span>
                            </div>
                            <div className="w-full flex-1 rounded-xl border border-slate-700 bg-slate-950 flex items-center justify-center text-xs font-mono text-slate-400 m-1">
                              Rongga Internal: {encLength - encWall * 2} x {encWidth - encWall * 2} mm
                            </div>
                            <div className="flex justify-between text-[10px] text-cyan-300 font-mono">
                              <span>🔩 {encScrew} Corner Post</span>
                              <span className="text-amber-400">⚡ Port Kabel</span>
                            </div>
                          </div>
                          <div className="text-xs font-mono text-slate-400">
                            Luar: {encLength} x {encWidth} x {encHeight} mm • Dinding: {encWall} mm
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-slate-800 pt-3 flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span>Toleransi Rekayasa: ±0.15 mm</span>
                      <span>Ukuran Fisik: {activeModelSpecs.dimensions}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Viewer Action & Export Footer */}
              <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                <div className="flex items-center gap-3">
                  <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono">
                    <span className="text-slate-400">Dimensi: </span>
                    <span className="font-bold text-cyan-300">{activeModelSpecs.dimensions}</span>
                  </div>
                  <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-400">
                    <span>Berat: ~{activeModelSpecs.weightGrams}g</span>
                    <span>•</span>
                    <span>Waktu: ~{activeModelSpecs.timeFormatted}</span>
                  </div>
                </div>

                {/* Direct Action Buttons with Authentic STLExporter */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportScad}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-semibold transition-all cursor-pointer"
                    title="Unduh skrip parametrik OpenSCAD"
                  >
                    <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                    <span>.SCAD</span>
                  </button>

                  <button
                    onClick={() => {
                      if (activeGenerator === "polaroid" && (polaroidMount === "both" || polaroidMount === "stand")) {
                        setShowStlModal(true);
                      } else {
                        handleDownloadStl("frame");
                      }
                    }}
                    disabled={isExporting !== null}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md shadow-cyan-600/30 transition-all cursor-pointer"
                    title="Ekspor ke model 3D STL binary siap cetak langsung di slicer"
                  >
                    {isExporting === "STL" ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    <span>{isExporting === "STL" ? "Mengekspor..." : "Ekspor STL"}</span>
                  </button>

                  <button
                    onClick={() => {
                      setFlowSuccessResult(null);
                      setShowFlowModal(true);
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-bold shadow-md shadow-rose-600/30 transition-all cursor-pointer"
                    title="Kirim model ke armada mesin 3DFlow"
                  >
                    <Flame className="w-3.5 h-3.5" />
                    <span>Kirim 3DFlow</span>
                  </button>
                </div>
              </div>
            </div>

            {/* ════════════════════════════════════════════════════════════ */}
            {/* RIGHT COLUMN: DEDICATED SETTINGS PANEL (5 cols)              */}
            {/* ════════════════════════════════════════════════════════════ */}
            <div className="xl:col-span-5 flex flex-col space-y-5 bg-slate-900/90 p-5 sm:p-6 rounded-3xl border border-slate-800 shadow-2xl overflow-y-auto max-h-[calc(100vh-140px)]">
              {/* Generator Specific Settings */}
              {activeGenerator === "polaroid" && (
                <div className="space-y-5">
                  {/* Header & Quick Example Presets */}
                  <div className="space-y-2 border-b border-slate-800 pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🖼️</span>
                        <h2 className="text-base sm:text-lg font-black text-white">
                          Pengaturan Frame Polaroid
                        </h2>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        MakerLab Style
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Sesuaikan format bingkai foto, ukiran caption timbul, ikon, slot atas 1.4mm &amp; dudukan magnet.
                    </p>

                    {/* Quick Example Templates */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={loadPolaroidTemplate1}
                        className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-[11px] font-medium text-slate-300 transition-colors cursor-pointer"
                      >
                        ❤️ Template 1: Memories
                      </button>
                      <button
                        onClick={loadPolaroidTemplate2}
                        className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-[11px] font-medium text-slate-300 transition-colors cursor-pointer"
                      >
                        🌴 Template 2: Summer Trip
                      </button>
                    </div>
                  </div>

                  {/* 1. Format / Rasio Foto */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                      1. Format &amp; Rasio Foto
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "standard" as const, name: "Standard", dim: "88x107mm", badge: "Classic" },
                        { id: "square" as const, name: "Square", dim: "88x100mm", badge: "1:1" },
                        { id: "wide" as const, name: "Wide", dim: "122x96mm", badge: "Landscape" },
                      ].map((fmt) => (
                        <button
                          key={fmt.id}
                          type="button"
                          onClick={() => setPolaroidFormat(fmt.id)}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                            polaroidFormat === fmt.id
                              ? "bg-cyan-500/20 border-cyan-500 text-white font-bold"
                              : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                          }`}
                        >
                          <div className="text-xs">{fmt.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">{fmt.dim}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 2. Caption Text & Font Style */}
                  <div className="space-y-3 p-3.5 bg-slate-950 rounded-2xl border border-slate-800/80">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      2. Teks Timbul / Ukir Frame
                    </label>
                    <input
                      type="text"
                      maxLength={28}
                      value={polaroidText}
                      onChange={(e) => setPolaroidText(e.target.value)}
                      placeholder="Masukkan tulisan caption..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-semibold focus:outline-none focus:border-cyan-500"
                    />

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-[9px] text-slate-500 uppercase font-bold block mb-1">Gaya Font</label>
                        <select
                          value={polaroidFont}
                          onChange={(e: any) => setPolaroidFont(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-medium"
                        >
                          <option value="handwriting">Handwriting Script</option>
                          <option value="modern">Modern Sans Bold</option>
                          <option value="serif">Classic Serif</option>
                          <option value="mono">Tech Monospace</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[9px] text-slate-500 uppercase font-bold block mb-1">Rata Teks</label>
                        <div className="flex rounded-xl bg-slate-900 border border-slate-800 p-0.5">
                          <button
                            type="button"
                            onClick={() => setPolaroidTextAlign("left")}
                            className={`flex-1 py-1 rounded-lg flex items-center justify-center transition-colors ${polaroidTextAlign === "left" ? "bg-cyan-600 text-white" : "text-slate-400"}`}
                          >
                            <AlignLeft className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setPolaroidTextAlign("center")}
                            className={`flex-1 py-1 rounded-lg flex items-center justify-center transition-colors ${polaroidTextAlign === "center" ? "bg-cyan-600 text-white" : "text-slate-400"}`}
                          >
                            <AlignCenter className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setPolaroidTextAlign("right")}
                            className={`flex-1 py-1 rounded-lg flex items-center justify-center transition-colors ${polaroidTextAlign === "right" ? "bg-cyan-600 text-white" : "text-slate-400"}`}
                          >
                            <AlignRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 3. Icon Ornaments */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                      3. Ikon Ornamen Frame (3D Extruded)
                    </label>
                    <div className="grid grid-cols-6 gap-1.5 p-2 bg-slate-950 rounded-2xl border border-slate-800">
                      {[
                        { id: "heart", char: "❤️" },
                        { id: "camera", char: "📷" },
                        { id: "star", char: "⭐" },
                        { id: "smile", char: "😊" },
                        { id: "music", char: "🎵" },
                        { id: "sun", char: "☀️" },
                        { id: "coffee", char: "☕" },
                        { id: "mountain", char: "🏔️" },
                        { id: "sparkles", char: "✨" },
                        { id: "ring", char: "💍" },
                        { id: "palm", char: "🌴" },
                        { id: "paw", char: "🐾" },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setPolaroidIcon(item.id)}
                          className={`p-2 rounded-xl text-base transition-all cursor-pointer ${
                            polaroidIcon === item.id
                              ? "bg-cyan-600/30 border border-cyan-500 scale-105"
                              : "hover:bg-slate-900"
                          }`}
                        >
                          {item.char}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 4. 3D Relief Style & Mount Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                        Gaya 3D Tulisan
                      </label>
                      <select
                        value={polaroidStyle}
                        onChange={(e: any) => setPolaroidStyle(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-semibold"
                      >
                        <option value="embossed">Embossed (Timbul +0.8mm)</option>
                        <option value="engraved">Engraved (Ukir Cekung -0.8mm)</option>
                        <option value="dual-color">Dual-Color FDM (Multi-Material)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                        Dudukan &amp; Pemasangan
                      </label>
                      <select
                        value={polaroidMount}
                        onChange={(e: any) => setPolaroidMount(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-semibold"
                      >
                        <option value="both">Meja + Magnet Kulkas (Dual)</option>
                        <option value="magnet">Hanya Magnet Kulkas (6x2mm)</option>
                        <option value="stand">Hanya Dudukan Meja (Standee Base)</option>
                        <option value="plain">Polos / Gantungan Dinding</option>
                      </select>
                    </div>
                  </div>

                  {/* 5. Thickness & Filament Color */}
                  <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
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
                      className="w-full accent-cyan-500 cursor-pointer"
                    />

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">
                        Warna Filamen Frame
                      </label>
                      <div className="flex items-center gap-2">
                        {[
                          { id: "white", bg: "bg-slate-100", name: "Putih Standar" },
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
                    </div>
                  </div>
                </div>
              )}

              {activeGenerator === "gridfinity" && (
                <div className="space-y-5">
                  <div className="border-b border-slate-800 pb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🧰</span>
                      <h2 className="text-base sm:text-lg font-black text-white">
                        Gridfinity Modular Builder
                      </h2>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Generator kotak modular workshop standard 42mm dengan soket magnet 6x2mm dan scooping lip.
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-3 p-3.5 bg-slate-950 rounded-2xl border border-slate-800 text-xs">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Kolom (X)</label>
                      <select
                        value={gfGridX}
                        onChange={(e) => setGfGridX(Number(e.target.value))}
                        className="w-full mt-1 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono"
                      >
                        {[1, 2, 3, 4, 5, 6].map((n) => (
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
                        {[1, 2, 3, 4, 5, 6].map((n) => (
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

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                        Sekat Kompartemen Internal
                      </label>
                      <select
                        value={gfDividers}
                        onChange={(e) => setGfDividers(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-semibold"
                      >
                        <option value={1}>1 Kompartemen (Wadah Penuh)</option>
                        <option value={2}>2 Kompartemen (Bagi 2 Sisi)</option>
                        <option value={3}>3 Kompartemen (Bagi 3 Sisi)</option>
                        <option value={6}>6 Kompartemen (Grid 3x2)</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
                      <div>
                        <div className="font-bold text-white">Soket Magnet Dasar 6x2mm</div>
                        <div className="text-[10px] text-slate-400">4 lubang magnet per unit 42mm</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={gfMagnets}
                        onChange={(e) => setGfMagnets(e.target.checked)}
                        className="w-4 h-4 accent-amber-500 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeGenerator === "enclosure" && (
                <div className="space-y-5">
                  <div className="border-b border-slate-800 pb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">📦</span>
                      <h2 className="text-base sm:text-lg font-black text-white">
                        Enclosure Casing Box Elektronik
                      </h2>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Generator box mikrokontroler, dudukan sekrup sudut M3, dan ventilasi heksagonal.
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-3 p-3.5 bg-slate-950 rounded-2xl border border-slate-800 text-xs font-mono">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase font-sans">Panjang (X)</label>
                      <input
                        type="number"
                        value={encLength}
                        onChange={(e) => setEncLength(Number(e.target.value))}
                        className="w-full mt-1 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase font-sans">Lebar (Y)</label>
                      <input
                        type="number"
                        value={encWidth}
                        onChange={(e) => setEncWidth(Number(e.target.value))}
                        className="w-full mt-1 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase font-sans">Tinggi (Z)</label>
                      <input
                        type="number"
                        value={encHeight}
                        onChange={(e) => setEncHeight(Number(e.target.value))}
                        className="w-full mt-1 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                        Standar Sekrup Tiang Sudut
                      </label>
                      <select
                        value={encScrew}
                        onChange={(e) => setEncScrew(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-semibold"
                      >
                        <option value="M2.5">M2.5 (Lubang 2.7mm)</option>
                        <option value="M3">M3 (Lubang 3.2mm Standar)</option>
                        <option value="M4">M4 (Lubang 4.2mm Heavy Duty)</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
                      <div>
                        <div className="font-bold text-white">Lubang Kabel Samping</div>
                        <div className="text-[10px] text-slate-400">Cutout passthrough kabel 16x8mm</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={encVent}
                        onChange={(e) => setEncVent(e.target.checked)}
                        className="w-4 h-4 accent-cyan-500 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Slicer Estimations Summary Box */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 mt-auto">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                  Estimasi Slicer &amp; Biaya Cetak
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800/80">
                    <span className="text-[9px] text-slate-500 block uppercase">Filamen</span>
                    <span className="font-bold text-emerald-400">~{activeModelSpecs.weightGrams}g</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800/80">
                    <span className="text-[9px] text-slate-500 block uppercase">Durasi</span>
                    <span className="font-bold text-amber-400">{activeModelSpecs.timeFormatted}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800/80">
                    <span className="text-[9px] text-slate-500 block uppercase">Modal HPP</span>
                    <span className="font-bold text-cyan-400">Rp {activeModelSpecs.filamentCost.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* TAB 2: ⚙️ KALKULATOR KALIBRASI & SLICER (E-Steps, Flow, HPP)        */}
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
                  <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center">
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
                    className="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    {eStepCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{eStepCopied ? "Tersalin!" : "Salin M92"}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 2. Flow Rate Tuning */}
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
                    <Sliders className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">Kalibrasi Flow Rate / Ekstrusi Multiplier</h3>
                    <p className="text-[11px] text-slate-400">Ukur ketebalan 2 keliling dinding dengan mikrometer</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
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
                  <label className="text-slate-400 text-[11px]">Tebal Terukur Caliper (mm)</label>
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
                  <span className="text-[10px] text-slate-400 font-mono uppercase">Flow Rate Kompensasi</span>
                  <div className="text-2xl font-black text-cyan-400 font-mono">
                    {calculatedFlowRate}% <span className="text-xs text-slate-400 font-normal">multiplier</span>
                  </div>
                </div>
                <span className="text-xs text-slate-400 font-mono">Input ke Bambu Studio / Cura</span>
              </div>
            </div>

            {/* 3. Cost & Electricity HPP */}
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                    <Scale className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">Kalkulator HPP &amp; Biaya Listrik</h3>
                    <p className="text-[11px] text-slate-400">Biaya filamen, daya watt listrik &amp; depresiasi mesin</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-slate-400 text-[11px]">Berat Part (Gram)</label>
                  <input
                    type="number"
                    value={costWeightGrams}
                    onChange={(e) => setCostWeightGrams(parseFloat(e.target.value) || 0)}
                    className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl font-mono text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 text-[11px]">Harga Spul 1kg (Rp)</label>
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
      {/* TAB 3: 📦 TEMPLATE SIAP CETAK (10 Functional Maker Templates)      */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {mainTab === "templates" && (
        <main className="max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-8 animate-in fade-in duration-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                Preset Library
              </span>
              <span className="text-xs text-slate-400">10 Template Teruji Print-Ready</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
              Katalog Template Desain CAD Siap Cetak
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Pilih template fungsional di bawah ini untuk langsung memuat dan mengedit parameternya di Generator 3D.
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
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Buka di Generator &rarr;</span>
                </button>
              </div>
            ))}
          </div>
        </main>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* MODAL: EKSPOR STL (Komponen Bingkai / Dudukan Meja)                */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {showStlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-white">Ekspor Model 3D (.STL)</h3>
                  <p className="text-[11px] text-slate-400">Pilih komponen model yang ingin diunduh</p>
                </div>
              </div>
              <button onClick={() => setShowStlModal(false)} className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <button
                onClick={() => handleDownloadStl("frame")}
                className="w-full p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-cyan-500 hover:bg-slate-900 transition-all text-left flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <div className="font-bold text-white group-hover:text-cyan-400">🖼️ Bingkai Foto Polaroid Saja</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Model bingkai utuh (watertight) dengan slot foto 1.4mm &amp; teks timbul</div>
                </div>
                <Download className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 shrink-0" />
              </button>

              <button
                onClick={() => handleDownloadStl("stand")}
                className="w-full p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-cyan-500 hover:bg-slate-900 transition-all text-left flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <div className="font-bold text-white group-hover:text-cyan-400">📐 Dudukan Meja / Standee Saja</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Balok penyangga meja bersudut 15° (slot geser pas tanpa lem)</div>
                </div>
                <Download className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 shrink-0" />
              </button>

              <button
                onClick={() => handleDownloadStl("full")}
                className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-cyan-900/40 to-indigo-900/40 border border-cyan-500/40 hover:border-cyan-400 transition-all text-left flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <div className="font-bold text-white group-hover:text-cyan-300">📦 Set Lengkap (Bingkai + Dudukan Meja)</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Kedua komponen ditata rata di atas pelat cetak (Z=0 siap cetak)</div>
                </div>
                <Download className="w-4 h-4 text-cyan-400 shrink-0" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* MODAL: KIRIM LANGSUNG KE ANTREAN PRODUKSI 3DFLOW                 */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {showFlowModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-slate-100">
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
                className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {flowSuccessResult ? (
              <div className="py-6 text-center space-y-3">
                <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-base font-bold text-white">Pesanan Berhasil Dikirim ke 3DFlow!</h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Model telah terdaftar di dashboard antrean 3DFlow dengan nomor pesanan:{" "}
                  <span className="font-mono text-cyan-400 font-bold">{flowSuccessResult.orderNumber}</span>
                </p>
                <div className="pt-3 flex justify-center gap-2">
                  <Link
                    href="/dashboard"
                    className="px-4 py-2 text-xs font-bold rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white"
                  >
                    Buka Dashboard 3DFlow
                  </Link>
                  <button
                    onClick={() => setShowFlowModal(false)}
                    className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitToFlow} className="space-y-3.5">
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1 text-xs">
                  <div className="flex justify-between font-bold text-white">
                    <span>{activeModelSpecs.name}</span>
                    <span className="font-mono text-cyan-400">
                      {activeModelSpecs.dimensions}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                    <span>Estimasi Berat: {activeModelSpecs.weightGrams}g</span>
                    <span>Durasi: ~{activeModelSpecs.timeFormatted}</span>
                    <span>HPP: Rp {activeModelSpecs.filamentCost.toLocaleString()}</span>
                  </div>
                </div>

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
