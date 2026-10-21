"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as THREE from "three";
import { Evaluator, Brush, SUBTRACTION, ADDITION } from "three-bvh-csg";
import { STLExporter } from "three/examples/jsm/exporters/STLExporter.js";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import fontData from "@/lib/fonts/helvetiker_bold.json";
import {
  ChevronLeft,
  ChevronDown,
  Upload,
  Download,
  RotateCw,
  Sparkles,
  Heart,
  Star,
  Camera,
  Smile,
  Music,
  Sun,
  Coffee,
  Check,
  Plus,
  Trash2,
  Crown,
  Type,
  Flame,
  Cloud,
  Moon,
  Gift,
  PawPrint,
  Palmtree,
  Gem,
  Ghost as GhostIcon,
  Home,
  Castle,
  Mountain,
  Tent,
  TreePine,
  Ribbon,
  Layers,
  Eye,
  Maximize2,
  Info,
  X,
  ExternalLink,
  Printer,
  CheckCircle2,
  Zap,
  Move,
  CornerUpLeft,
  CornerUpRight,
  AlignVerticalJustifyCenter,
  Copy,
  RotateCcw,
  Palette,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Types & Interfaces
// ─────────────────────────────────────────────────────────────────────────────
type FrameSize = "mini" | "square" | "wide";
type BackplateType = "plain" | "stand" | "magnet";
type CanvasViewMode = "front" | "back" | "3d";
type IconCategory = "halloween" | "travel" | "basics" | "decor";

interface BaseAssetItem {
  id: string;
  x: number; // offset in mm from frame center (X: -width/2 to +width/2)
  y: number; // offset in mm from frame center (Y: -depth/2 to +depth/2)
  rotation: number; // in degrees (0 - 360)
  scale: number; // multiplier (0.5 to 3.0)
}

interface TextAssetItem extends BaseAssetItem {
  type: "text";
  content: string;
  font: "handwriting" | "modern" | "serif" | "mono";
  style: "embossed" | "engraved";
  color: string;
  fontSize: number; // base font size in mm
}

interface IconAssetItem extends BaseAssetItem {
  type: "icon";
  iconId: string;
  color: string; // graphic fill color
  hasDieCut: boolean; // die-cut sticker outline contour (like MakerLab stickers)
  size: number; // base size in mm
}

type AssetItem = TextAssetItem | IconAssetItem;

// ─────────────────────────────────────────────────────────────────────────────
// Specifications per Real Instant Film Standard
// ─────────────────────────────────────────────────────────────────────────────
const POLAROID_SPECS = {
  mini: {
    id: "mini",
    name: "instax mini",
    label: "MINI",
    width: 57.8,
    depth: 89.8,
    height: 2.8,
    windowW: 46.0,
    windowH: 62.0,
    pocketW: 54.5,
    pocketH: 86.5,
    topMargin: 5.0,
    chinHeight: 18.5,
    weight: "24g",
    printTime: "34m",
    filmDesc: "Instax Mini 54×86 mm",
  },
  square: {
    id: "square",
    name: "instax square",
    label: "SQUARE",
    width: 85.8,
    depth: 89.8,
    height: 2.8,
    windowW: 62.0,
    windowH: 62.0,
    pocketW: 72.5,
    pocketH: 86.5,
    topMargin: 5.0,
    chinHeight: 18.5,
    weight: "32g",
    printTime: "44m",
    filmDesc: "Instax Square 72×86 mm",
  },
  wide: {
    id: "wide",
    name: "instax wide",
    label: "WIDE",
    width: 121.8,
    depth: 89.8,
    height: 2.8,
    windowW: 99.0,
    windowH: 62.0,
    pocketW: 108.5,
    pocketH: 86.5,
    topMargin: 5.0,
    chinHeight: 18.5,
    weight: "42g",
    printTime: "58m",
    filmDesc: "Instax Wide 108×86 mm",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Vector Graphics & Die-Cut Sticker Library
// ─────────────────────────────────────────────────────────────────────────────
interface StickerMeta {
  id: string;
  name: string;
  category: IconCategory;
  defaultColor: string;
  renderSvg: (color: string) => React.ReactNode;
}

const STICKER_LIBRARY: StickerMeta[] = [
  // Halloween / Spooky (Matching Screenshots 1 & 2)
  {
    id: "witch-hat",
    name: "Topi Penyihir (Witch Hat)",
    category: "halloween",
    defaultColor: "#111111",
    renderSvg: (c) => (
      <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
        {/* Brim */}
        <ellipse cx="50" cy="74" rx="42" ry="14" fill={c} transform="rotate(-6 50 74)" />
        {/* Hat Cone */}
        <path
          d="M 28 72 C 34 56 46 36 68 18 C 76 12 85 14 84 20 C 78 30 70 42 66 54 C 64 62 64 68 64 72 Z"
          fill={c}
        />
        {/* Ribbon Band */}
        <path
          d="M 32 68 Q 48 76 64 67 Q 63 62 62 61 Q 48 70 34 62 Z"
          fill="#FFFFFF"
          opacity="0.95"
        />
      </svg>
    ),
  },
  {
    id: "skull",
    name: "Tengkorak (Skull)",
    category: "halloween",
    defaultColor: "#FFFFFF",
    renderSvg: (c) => (
      <svg viewBox="0 0 100 100" className="w-full h-full" fill={c}>
        {/* Cranium */}
        <path d="M 20 48 C 20 25 32 14 50 14 C 68 14 80 25 80 48 C 80 62 72 68 68 72 L 68 82 C 68 85 64 88 50 88 C 36 88 32 85 32 82 L 32 72 C 28 68 20 62 20 48 Z" />
        {/* Eye Sockets */}
        <ellipse cx="38" cy="48" rx="8" ry="11" fill="#0A0A0A" transform="rotate(8 38 48)" />
        <ellipse cx="62" cy="48" rx="8" ry="11" fill="#0A0A0A" transform="rotate(-8 62 48)" />
        {/* Nose Cavity */}
        <polygon points="50,60 45,70 55,70" fill="#0A0A0A" />
        {/* Teeth Grooves */}
        <rect x="42" y="78" width="3" height="7" rx="1" fill="#0A0A0A" />
        <rect x="49" y="78" width="3" height="7" rx="1" fill="#0A0A0A" />
        <rect x="56" y="78" width="3" height="7" rx="1" fill="#0A0A0A" />
      </svg>
    ),
  },
  {
    id: "pumpkin",
    name: "Labu Jack-o'-Lantern",
    category: "halloween",
    defaultColor: "#D9532F",
    renderSvg: (c) => (
      <svg viewBox="0 0 100 100" className="w-full h-full" fill={c}>
        {/* Stem */}
        <path d="M 47 16 C 46 8 54 6 56 6 C 58 12 55 16 53 18 Z" fill="#2E7D32" />
        {/* Pumpkin Body */}
        <ellipse cx="50" cy="56" rx="42" ry="32" fill={c} />
        <ellipse cx="50" cy="56" rx="30" ry="32" fill={c} />
        {/* Carved Eyes */}
        <polygon points="34,44 26,52 42,52" fill="#1A1A1A" />
        <polygon points="66,44 58,52 74,52" fill="#1A1A1A" />
        {/* Carved Nose */}
        <polygon points="50,56 46,62 54,62" fill="#1A1A1A" />
        {/* Carved Jagged Smile */}
        <path
          d="M 28 66 L 36 74 L 44 68 L 50 74 L 56 68 L 64 74 L 72 66 L 68 76 L 58 72 L 50 78 L 42 72 L 32 76 Z"
          fill="#1A1A1A"
        />
      </svg>
    ),
  },
  {
    id: "bat",
    name: "Kelelawar (Bat)",
    category: "halloween",
    defaultColor: "#D9532F",
    renderSvg: (c) => (
      <svg viewBox="0 0 100 60" className="w-full h-full" fill={c}>
        <path d="M 50 20 C 53 14 56 12 58 16 C 66 12 80 14 96 28 C 88 34 82 32 78 38 C 72 40 68 46 64 48 C 58 44 54 46 50 52 C 46 46 42 44 36 48 C 32 46 28 40 22 38 C 18 32 12 34 4 28 C 20 14 34 12 42 16 C 44 12 47 14 50 20 Z" />
      </svg>
    ),
  },
  {
    id: "spider-web",
    name: "Jaring Laba-laba",
    category: "halloween",
    defaultColor: "#D9532F",
    renderSvg: (c) => (
      <svg viewBox="0 0 100 100" className="w-full h-full" stroke={c} strokeWidth="3" fill="none">
        <path d="M 50 50 L 95 10 M 50 50 L 98 50 M 50 50 L 85 85 M 50 50 L 50 98 M 50 50 L 15 85 M 50 50 L 2 50 M 50 50 L 5 10 M 50 50 L 50 2" />
        <path d="M 65 37 Q 72 50 65 63 Q 50 72 37 65 Q 28 50 37 37 Q 50 28 65 37 Z" />
        <path d="M 80 24 Q 90 50 80 76 Q 50 90 24 80 Q 10 50 24 24 Q 50 10 80 24 Z" />
      </svg>
    ),
  },
  {
    id: "spooky-tree",
    name: "Pohon Menyeramkan",
    category: "halloween",
    defaultColor: "#D9532F",
    renderSvg: (c) => (
      <svg viewBox="0 0 100 100" className="w-full h-full" fill={c}>
        <path d="M 44 94 L 46 64 C 42 60 36 54 26 56 C 28 50 36 48 38 46 C 30 42 22 42 16 44 C 20 38 30 38 36 38 C 32 30 24 26 18 24 C 28 22 36 28 42 32 C 40 22 36 14 32 8 C 42 14 44 24 46 28 C 50 18 52 10 56 6 C 58 14 56 22 54 28 C 62 18 68 14 78 12 C 70 20 64 26 60 34 C 70 28 78 28 86 30 C 76 36 68 38 64 42 C 74 44 82 46 88 52 C 78 52 70 48 64 52 C 68 58 74 62 78 68 L 56 66 L 56 94 Z" />
      </svg>
    ),
  },
  {
    id: "cute-ghost",
    name: "Hantu Imut (Ghost)",
    category: "halloween",
    defaultColor: "#FFFFFF",
    renderSvg: (c) => (
      <svg viewBox="0 0 100 100" className="w-full h-full" fill={c}>
        <path d="M 24 50 C 24 26 34 16 50 16 C 66 16 76 26 76 50 C 76 68 78 80 78 86 C 70 82 64 88 58 84 C 52 80 46 86 40 82 C 34 86 28 82 22 86 C 22 80 24 68 24 50 Z" />
        <circle cx="42" cy="44" r="3.5" fill="#111111" />
        <circle cx="58" cy="44" r="3.5" fill="#111111" />
        <path d="M 46 54 Q 50 58 54 54" stroke="#111111" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      </svg>
    ),
  },

  // Travel / City (Matching Screenshot 3)
  {
    id: "camera",
    name: "Kamera Vintage",
    category: "travel",
    defaultColor: "#111111",
    renderSvg: (c) => (
      <svg viewBox="0 0 100 80" className="w-full h-full" fill="none" stroke={c} strokeWidth="6" strokeLinejoin="round">
        <rect x="8" y="20" width="84" height="54" rx="10" fill={c === "#FFFFFF" ? "#111111" : "#FFFFFF"} />
        <path d="M 32 20 L 38 10 L 62 10 L 68 20 Z" fill={c} />
        <circle cx="50" cy="47" r="16" fill={c === "#FFFFFF" ? "#00C2FF" : "#111111"} />
        <circle cx="50" cy="47" r="8" fill="#FFFFFF" />
        <circle cx="76" cy="32" r="4" fill={c} />
      </svg>
    ),
  },
  {
    id: "stars-cluster",
    name: "Bintang Tiga (Stars Cluster)",
    category: "travel",
    defaultColor: "#D9532F",
    renderSvg: (c) => (
      <svg viewBox="0 0 100 70" className="w-full h-full" fill={c}>
        {/* Center Main Star (Red/Primary) */}
        <polygon points="50,4 56,22 75,22 60,34 66,52 50,40 34,52 40,34 25,22 44,22" fill={c} />
        {/* Left Secondary Star (Blue) */}
        <polygon points="20,24 24,36 37,36 26,44 30,56 20,48 10,56 14,44 3,36 16,36" fill="#0284C7" />
        {/* Right Secondary Star (Blue) */}
        <polygon points="80,24 84,36 97,36 86,44 90,56 80,48 70,56 74,44 63,36 76,36" fill="#0284C7" />
      </svg>
    ),
  },
  {
    id: "location-pin",
    name: "Pin Lokasi (Maps Pin)",
    category: "travel",
    defaultColor: "#0284C7",
    renderSvg: (c) => (
      <svg viewBox="0 0 100 100" className="w-full h-full" fill={c}>
        <path d="M 50 8 C 30 8 16 22 16 42 C 16 62 44 88 50 94 C 56 88 84 62 84 42 C 84 22 70 8 50 8 Z M 50 54 C 42 54 36 48 36 40 C 36 32 42 26 50 26 C 58 26 64 32 64 40 C 64 48 58 54 50 54 Z" />
      </svg>
    ),
  },
  {
    id: "colosseum",
    name: "Gedung Arsitektur / Colosseum",
    category: "travel",
    defaultColor: "#111111",
    renderSvg: (c) => (
      <svg viewBox="0 0 100 75" className="w-full h-full" fill={c}>
        {/* Base */}
        <rect x="6" y="66" width="88" height="6" rx="2" />
        {/* Roof Dome */}
        <path d="M 12 36 C 12 16 30 8 50 8 C 70 8 88 16 88 36 Z" />
        {/* Arches Tier 1 */}
        <rect x="14" y="38" width="72" height="12" />
        {/* Arches Tier 2 */}
        <rect x="10" y="52" width="80" height="12" />
        {/* Arch cutouts */}
        <rect x="18" y="42" width="10" height="8" rx="3" fill="#FFFFFF" />
        <rect x="34" y="42" width="10" height="8" rx="3" fill="#FFFFFF" />
        <rect x="50" y="42" width="10" height="8" rx="3" fill="#FFFFFF" />
        <rect x="66" y="42" width="10" height="8" rx="3" fill="#FFFFFF" />

        <rect x="16" y="56" width="12" height="10" rx="4" fill="#FFFFFF" />
        <rect x="34" y="56" width="12" height="10" rx="4" fill="#FFFFFF" />
        <rect x="52" y="56" width="12" height="10" rx="4" fill="#FFFFFF" />
        <rect x="70" y="56" width="12" height="10" rx="4" fill="#FFFFFF" />
      </svg>
    ),
  },

  // Basics
  {
    id: "heart",
    name: "Hati (Heart)",
    category: "basics",
    defaultColor: "#E11D48",
    renderSvg: (c) => (
      <svg viewBox="0 0 100 100" className="w-full h-full" fill={c}>
        <path d="M 50 85 C 15 60 4 38 16 22 C 28 8 44 14 50 26 C 56 14 72 8 84 22 C 96 38 85 60 50 85 Z" />
      </svg>
    ),
  },
  {
    id: "star",
    name: "Bintang Emas (Star)",
    category: "basics",
    defaultColor: "#F59E0B",
    renderSvg: (c) => (
      <svg viewBox="0 0 100 100" className="w-full h-full" fill={c}>
        <polygon points="50,5 64,34 96,38 72,60 78,92 50,76 22,92 28,60 4,38 36,34" />
      </svg>
    ),
  },
  {
    id: "sparkles",
    name: "Kilau (Sparkles)",
    category: "basics",
    defaultColor: "#00C2FF",
    renderSvg: (c) => (
      <svg viewBox="0 0 100 100" className="w-full h-full" fill={c}>
        <path d="M 50 6 Q 50 50 94 50 Q 50 50 50 94 Q 50 50 6 50 Q 50 50 50 6 Z" />
        <path d="M 76 16 Q 76 34 94 34 Q 76 34 76 52 Q 76 34 58 34 Q 76 34 76 16 Z" />
      </svg>
    ),
  },
  {
    id: "flame",
    name: "Api (Flame)",
    category: "basics",
    defaultColor: "#E86020",
    renderSvg: (c) => (
      <svg viewBox="0 0 100 100" className="w-full h-full" fill={c}>
        <path d="M 50 4 C 54 24 74 38 74 60 C 74 78 62 94 48 94 C 32 94 20 80 20 64 C 20 44 38 34 40 22 C 34 32 30 42 34 54 C 38 46 44 40 48 30 Z" />
      </svg>
    ),
  },
];

// Helper to construct 3D shapes for ExtrudeGeometry
function createSticker3DShape(iconId: string, size: number): THREE.Shape {
  const shape = new THREE.Shape();
  const s = size * 0.1;

  switch (iconId) {
    case "witch-hat": {
      shape.moveTo(-s * 4, -s * 2);
      shape.lineTo(s * 4, -s * 2);
      shape.quadraticCurveTo(s * 3.5, 0, s * 1.5, s * 4);
      shape.quadraticCurveTo(s * 3.5, s * 5, s * 2, s * 6);
      shape.quadraticCurveTo(s * 0.5, s * 4, -s * 1.5, s * 0.5);
      shape.lineTo(-s * 4, -s * 2);
      return shape;
    }
    case "skull": {
      shape.absarc(0, s * 1.5, s * 3, 0, Math.PI * 2, false);
      return shape;
    }
    case "pumpkin": {
      shape.absellipse(0, 0, s * 4, s * 3.2, 0, Math.PI * 2, false);
      return shape;
    }
    case "camera": {
      shape.moveTo(-s * 4, -s * 2.5);
      shape.lineTo(s * 4, -s * 2.5);
      shape.lineTo(s * 4, s * 2.5);
      shape.lineTo(s * 2, s * 2.5);
      shape.lineTo(s * 1.2, s * 3.8);
      shape.lineTo(-s * 1.2, s * 3.8);
      shape.lineTo(-s * 2, s * 2.5);
      shape.lineTo(-s * 4, s * 2.5);
      shape.closePath();
      return shape;
    }
    case "stars-cluster":
    case "star": {
      const points = 5;
      const outerR = size * 0.5;
      const innerR = size * 0.22;
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
    default: {
      shape.absarc(0, 0, size * 0.45, 0, Math.PI * 2, false);
      return shape;
    }
  }
}

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

// ─────────────────────────────────────────────────────────────────────────────
// Main Page Component
// ─────────────────────────────────────────────────────────────────────────────
export default function PolaroidGeneratorPage() {
  const router = useRouter();

  // State: Core Specs
  const [frameSize, setFrameSize] = useState<FrameSize>("mini");
  const [backplate, setBackplate] = useState<BackplateType>("plain");
  const [frameColor, setFrameColor] = useState<string>("#FFFFFF");
  const [edgeColor, setEdgeColor] = useState<string>("#111111");

  // State: Photo Upload
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State: Assets & Interactive Selection
  const [activeLayout, setActiveLayout] = useState<"blank" | "template1" | "template2" | "template3">("template3");
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>("sticker-hat");
  const [activeCategory, setActiveCategory] = useState<IconCategory>("halloween");

  // State: Canvas & View Controls
  const [viewMode, setViewMode] = useState<CanvasViewMode>("front");
  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const [language, setLanguage] = useState<"en" | "id">("id");

  // State: Export & Modal
  const [isExporting, setIsExporting] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // References
  const containerRef = useRef<HTMLDivElement>(null);
  const frameContainerRef = useRef<HTMLDivElement>(null);
  const threeRendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const singleFrameMeshRef = useRef<THREE.Mesh | null>(null);
  const fullExportGroupRef = useRef<THREE.Group | null>(null);

  // Current Specification
  const specs = POLAROID_SPECS[frameSize];

  // Visual Canvas Display Dimensions
  const frameVisualHeight = 460; // px height on screen
  const scaleFactor = frameVisualHeight / specs.depth; // px per mm
  const frameVisualWidth = Math.round(specs.width * scaleFactor);

  const winCenterY = specs.depth / 2 - specs.topMargin - specs.windowH / 2;
  const chinCenterY = -specs.depth / 2 + specs.chinHeight / 2;

  // ─────────────────────────────────────────────────────────────────────────
  // Pre-configured Templates Matching User's 3 Reference Screenshots
  // ─────────────────────────────────────────────────────────────────────────
  const applyTemplate = useCallback((templateId: "blank" | "template1" | "template2" | "template3") => {
    setActiveLayout(templateId);

    if (templateId === "blank") {
      setAssets([]);
      setSelectedAssetId(null);
      setFrameColor("#FFFFFF");
      setEdgeColor("#111111");
    } else if (templateId === "template1") {
      // Image 3: "New York Travel"
      setFrameColor("#FFFFFF");
      setEdgeColor("#111111");
      const items: AssetItem[] = [
        {
          id: "sticker-camera",
          type: "icon",
          iconId: "camera",
          color: "#111111",
          hasDieCut: true,
          size: 14,
          x: specs.width / 2 - 10,
          y: specs.depth / 2 - 8,
          rotation: 0,
          scale: 1.15,
        },
        {
          id: "sticker-stars",
          type: "icon",
          iconId: "stars-cluster",
          color: "#D9532F",
          hasDieCut: true,
          size: 16,
          x: 0,
          y: winCenterY - specs.windowH / 2 + 1, // overlapping photo bottom
          rotation: 0,
          scale: 1.1,
        },
        {
          id: "sticker-pin",
          type: "icon",
          iconId: "location-pin",
          color: "#0284C7",
          hasDieCut: false,
          size: 9,
          x: -specs.width / 2 + 11,
          y: chinCenterY - 1,
          rotation: 0,
          scale: 1.0,
        },
        {
          id: "text-city",
          type: "text",
          content: "New York",
          font: "modern",
          style: "embossed",
          color: "#0B1D3A",
          fontSize: 4.8,
          x: 4,
          y: chinCenterY + 1.5,
          rotation: 0,
          scale: 1.0,
        },
        {
          id: "text-date",
          type: "text",
          content: "JUL 18 · 2026",
          font: "mono",
          style: "embossed",
          color: "#7E8899",
          fontSize: 3.0,
          x: 4,
          y: chinCenterY - 4.5,
          rotation: 0,
          scale: 0.95,
        },
      ];
      setAssets(items);
      setSelectedAssetId(items[0]?.id || null);
    } else if (templateId === "template2") {
      // Image 2: "Halloween Spooky Party"
      setFrameColor("#141414");
      setEdgeColor("#D9532F");
      const items: AssetItem[] = [
        {
          id: "text-alex",
          type: "text",
          content: "Alex",
          font: "modern",
          style: "embossed",
          color: "#D9532F",
          fontSize: 4.6,
          x: -specs.width / 2 + 12,
          y: specs.depth / 2 - 8,
          rotation: 0,
          scale: 1.0,
        },
        {
          id: "sticker-bat",
          type: "icon",
          iconId: "bat",
          color: "#D9532F",
          hasDieCut: true,
          size: 13,
          x: -specs.width / 2 + 12,
          y: specs.depth / 2 - 14,
          rotation: 0,
          scale: 1.0,
        },
        {
          id: "sticker-web",
          type: "icon",
          iconId: "spider-web",
          color: "#D9532F",
          hasDieCut: true,
          size: 14,
          x: specs.width / 2 - 10,
          y: specs.depth / 2 - 10,
          rotation: 0,
          scale: 1.1,
        },
        {
          id: "sticker-skull-hw",
          type: "icon",
          iconId: "skull",
          color: "#FFFFFF",
          hasDieCut: true,
          size: 13,
          x: -specs.width / 2 + 11,
          y: winCenterY - specs.windowH / 2 + 2,
          rotation: 0,
          scale: 1.0,
        },
        {
          id: "sticker-pumpkin",
          type: "icon",
          iconId: "pumpkin",
          color: "#D9532F",
          hasDieCut: true,
          size: 17,
          x: -specs.width / 2 + 13,
          y: chinCenterY - 2,
          rotation: 0,
          scale: 1.15,
        },
        {
          id: "sticker-tree",
          type: "icon",
          iconId: "spooky-tree",
          color: "#D9532F",
          hasDieCut: true,
          size: 14,
          x: specs.width / 2 - 10,
          y: winCenterY - specs.windowH / 2 + 2,
          rotation: 0,
          scale: 1.05,
        },
        {
          id: "text-party-1",
          type: "text",
          content: "Halloween",
          font: "modern",
          style: "embossed",
          color: "#D9532F",
          fontSize: 3.8,
          x: 10,
          y: chinCenterY + 1.5,
          rotation: 0,
          scale: 1.0,
        },
        {
          id: "sticker-ghost",
          type: "icon",
          iconId: "cute-ghost",
          color: "#FFFFFF",
          hasDieCut: true,
          size: 8,
          x: 0,
          y: chinCenterY - 4,
          rotation: 0,
          scale: 0.9,
        },
        {
          id: "text-party-2",
          type: "text",
          content: "Party",
          font: "modern",
          style: "embossed",
          color: "#D9532F",
          fontSize: 4.8,
          x: 14,
          y: chinCenterY - 4.5,
          rotation: 0,
          scale: 1.0,
        },
      ];
      setAssets(items);
      setSelectedAssetId(items[0]?.id || null);
    } else if (templateId === "template3") {
      // Image 1: "Witch Hat & Skull Border Die-Cut"
      setFrameColor("#FFFFFF");
      setEdgeColor("#111111");
      const items: AssetItem[] = [
        {
          id: "sticker-hat",
          type: "icon",
          iconId: "witch-hat",
          color: "#111111",
          hasDieCut: true,
          size: 19,
          x: specs.width / 2 - 13,
          y: winCenterY + specs.windowH / 2 - 8, // overlapping top-right photo corner
          rotation: 0,
          scale: 1.25,
        },
        {
          id: "sticker-skull",
          type: "icon",
          iconId: "skull",
          color: "#111111",
          hasDieCut: true,
          size: 15,
          x: -specs.width / 2 + 12,
          y: winCenterY - specs.windowH / 2 + 2, // overlapping bottom-left photo corner
          rotation: 0,
          scale: 1.15,
        },
        {
          id: "sticker-colosseum",
          type: "icon",
          iconId: "colosseum",
          color: "#111111",
          hasDieCut: true,
          size: 18,
          x: 11,
          y: winCenterY - specs.windowH / 2 - 1, // overlapping bottom-right photo corner
          rotation: 0,
          scale: 1.1,
        },
      ];
      setAssets(items);
      setSelectedAssetId(items[0]?.id || null);
    }
  }, [specs, winCenterY, chinCenterY]);

  // Initial load
  useEffect(() => {
    applyTemplate("template3");
  }, [applyTemplate]);

  // Selected item
  const selectedAsset = assets.find((a) => a.id === selectedAssetId) || null;

  // ─────────────────────────────────────────────────────────────────────────
  // Handlers: Asset CRUD
  // ─────────────────────────────────────────────────────────────────────────
  const handleAddText = () => {
    const newText: TextAssetItem = {
      id: "text-" + Date.now(),
      type: "text",
      content: "MEMORIES",
      font: "modern",
      style: "embossed",
      color: frameColor === "#141414" || frameColor === "#070E1E" ? "#00C2FF" : "#111111",
      fontSize: 4.2,
      x: 0,
      y: chinCenterY,
      rotation: 0,
      scale: 1.0,
    };
    setAssets((prev) => [...prev, newText]);
    setSelectedAssetId(newText.id);
  };

  const handleAddSticker = (stickerId: string) => {
    const meta = STICKER_LIBRARY.find((s) => s.id === stickerId);
    const newSticker: IconAssetItem = {
      id: "sticker-" + Date.now(),
      type: "icon",
      iconId: stickerId,
      color: meta ? meta.defaultColor : "#111111",
      hasDieCut: true,
      size: 15,
      x: specs.width / 2 - 12,
      y: specs.depth / 2 - 12,
      rotation: 0,
      scale: 1.1,
    };
    setAssets((prev) => [...prev, newSticker]);
    setSelectedAssetId(newSticker.id);
  };

  const handleRemoveAsset = (id: string) => {
    setAssets((prev) => prev.filter((a) => a.id !== id));
    if (selectedAssetId === id) setSelectedAssetId(null);
  };

  const handleDuplicateAsset = (id: string) => {
    const src = assets.find((a) => a.id === id);
    if (!src) return;
    const clone: AssetItem = {
      ...src,
      id: `${src.type}-${Date.now()}`,
      x: Math.min(specs.width / 2 - 6, src.x + 4),
      y: Math.max(-specs.depth / 2 + 6, src.y - 4),
    };
    setAssets((prev) => [...prev, clone]);
    setSelectedAssetId(clone.id);
  };

  const handleUpdateAsset = (id: string, updates: Partial<AssetItem>) => {
    setAssets((prev) =>
      prev.map((a) => (a.id === id ? ({ ...a, ...updates } as AssetItem) : a))
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Transform Gizmo Handling: Drag, Scale, Rotate
  // ─────────────────────────────────────────────────────────────────────────
  const activeTransform = useRef<{
    mode: "move" | "rotate" | "scale-corner" | "stretch-x" | "stretch-y";
    assetId: string;
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
    initialScale: number;
    initialRotation: number;
    centerScreenX: number;
    centerScreenY: number;
  } | null>(null);

  const startTransform = (
    mode: "move" | "rotate" | "scale-corner" | "stretch-x" | "stretch-y",
    id: string,
    e: React.MouseEvent | React.TouchEvent
  ) => {
    e.stopPropagation();
    setSelectedAssetId(id);

    const clientX = "touches" in e && e.touches[0] ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = "touches" in e && e.touches[0] ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    const target = assets.find((a) => a.id === id);
    if (!target) return;

    // Get frame container bounding rect
    const frameRect = frameContainerRef.current?.getBoundingClientRect();
    const frameLeft = frameRect ? frameRect.left : 0;
    const frameTop = frameRect ? frameRect.top : 0;

    const centerScreenX = frameLeft + frameVisualWidth / 2 + target.x * scaleFactor;
    const centerScreenY = frameTop + frameVisualHeight / 2 - target.y * scaleFactor;

    activeTransform.current = {
      mode,
      assetId: id,
      startX: clientX,
      startY: clientY,
      initialX: target.x,
      initialY: target.y,
      initialScale: target.scale || 1.0,
      initialRotation: target.rotation || 0,
      centerScreenX,
      centerScreenY,
    };

    const onMove = (moveEvent: MouseEvent | TouchEvent) => {
      if (!activeTransform.current) return;
      const t = activeTransform.current;

      const curX = "touches" in moveEvent && moveEvent.touches[0] ? moveEvent.touches[0].clientX : (moveEvent as MouseEvent).clientX;
      const curY = "touches" in moveEvent && moveEvent.touches[0] ? moveEvent.touches[0].clientY : (moveEvent as MouseEvent).clientY;

      if (t.mode === "move") {
        const deltaX_mm = (curX - t.startX) / scaleFactor;
        const deltaY_mm = -(curY - t.startY) / scaleFactor;

        const newX = Math.max(-specs.width / 2 + 2, Math.min(specs.width / 2 - 2, t.initialX + deltaX_mm));
        const newY = Math.max(-specs.depth / 2 + 2, Math.min(specs.depth / 2 - 2, t.initialY + deltaY_mm));

        setAssets((prev) =>
          prev.map((a) => (a.id === t.assetId ? { ...a, x: Number(newX.toFixed(2)), y: Number(newY.toFixed(2)) } : a))
        );
      } else if (t.mode === "rotate") {
        const dx = curX - t.centerScreenX;
        const dy = curY - t.centerScreenY;
        const angleRad = Math.atan2(dy, dx);
        const angleDeg = Math.round(THREE.MathUtils.radToDeg(angleRad) + 90);
        const normalized = (angleDeg % 360 + 360) % 360;

        setAssets((prev) =>
          prev.map((a) => (a.id === t.assetId ? { ...a, rotation: normalized } : a))
        );
      } else if (t.mode === "scale-corner") {
        const initialDist = Math.hypot(t.startX - t.centerScreenX, t.startY - t.centerScreenY);
        const curDist = Math.hypot(curX - t.centerScreenX, curY - t.centerScreenY);
        if (initialDist > 0) {
          const ratio = curDist / initialDist;
          const newScale = Math.max(0.4, Math.min(3.0, Number((t.initialScale * ratio).toFixed(2))));
          setAssets((prev) =>
            prev.map((a) => (a.id === t.assetId ? { ...a, scale: newScale } : a))
          );
        }
      }
    };

    const onEnd = () => {
      activeTransform.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onEnd);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onEnd);
    window.addEventListener("touchmove", onMove);
    window.addEventListener("touchend", onEnd);
  };

  // Keyboard Nudge & Delete Handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedAssetId) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const step = e.shiftKey ? 2.0 : 0.5;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setAssets((prev) =>
          prev.map((a) => (a.id === selectedAssetId ? { ...a, x: Math.max(-specs.width / 2 + 2, a.x - step) } : a))
        );
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setAssets((prev) =>
          prev.map((a) => (a.id === selectedAssetId ? { ...a, x: Math.min(specs.width / 2 - 2, a.x + step) } : a))
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setAssets((prev) =>
          prev.map((a) => (a.id === selectedAssetId ? { ...a, y: Math.min(specs.depth / 2 - 2, a.y + step) } : a))
        );
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setAssets((prev) =>
          prev.map((a) => (a.id === selectedAssetId ? { ...a, y: Math.max(-specs.depth / 2 + 2, a.y - step) } : a))
        );
      } else if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        handleRemoveAsset(selectedAssetId);
      } else if (e.key === "Escape") {
        setSelectedAssetId(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedAssetId, specs]);

  // ─────────────────────────────────────────────────────────────────────────
  // 3D Engine: Construct Manifold Model & Render Scene
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (viewMode !== "3d" || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 800;
    const height = containerRef.current.clientHeight || 560;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#040914");

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1500);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    containerRef.current.innerHTML = "";
    containerRef.current.appendChild(renderer.domElement);
    threeRendererRef.current = renderer;

    // Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x0a192f, 0.95);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
    keyLight.position.set(90, 160, 110);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.bias = -0.0002;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x00c2ff, 1.2);
    fillLight.position.set(-100, 80, -70);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.0);
    rimLight.position.set(0, 120, -140);
    scene.add(rimLight);

    const grid = new THREE.GridHelper(260, 26, 0x00c2ff, 0x1e293b);
    grid.position.y = -0.1;
    scene.add(grid);

    // Geometry Generation
    const pW = specs.width;
    const pD = specs.depth;
    const pH = specs.height;
    const winW = specs.windowW;
    const winH = specs.windowH;

    const evaluator = new Evaluator();
    evaluator.useGroups = false;

    // Outer Solid Rounded Frame
    const outerShape = createRoundedRectShape(pW, pD, 3.8);
    const outerGeo = new THREE.ExtrudeGeometry(outerShape, {
      depth: pH,
      bevelEnabled: true,
      bevelSegments: 3,
      bevelSize: 0.5,
      bevelThickness: 0.5,
      curveSegments: 16,
    });
    const frameBrush = new Brush(outerGeo);
    frameBrush.updateMatrixWorld();

    // Recessed Window Aperture Cut
    const winShape = createRoundedRectShape(winW, winH, 1.5);
    const winGeo = new THREE.ExtrudeGeometry(winShape, {
      depth: 2.2,
      bevelEnabled: true,
      bevelSegments: 2,
      bevelSize: 0.4,
      bevelThickness: 0.4,
      curveSegments: 12,
    });
    const winBrush = new Brush(winGeo);
    winBrush.position.set(0, winCenterY, pH - 1.2);
    winBrush.updateMatrixWorld();

    let frameResult = evaluator.evaluate(frameBrush, winBrush, SUBTRACTION);

    // Internal Photo Slot Pocket
    const slotW = specs.pocketW;
    const slotH = pD + 4;
    const slotGeo = new THREE.BoxGeometry(slotW, slotH, 1.2);
    const slotBrush = new Brush(slotGeo);
    slotBrush.position.set(0, winCenterY + slotH / 2 - winH / 2 - 2, 1.1);
    slotBrush.updateMatrixWorld();

    frameResult = evaluator.evaluate(frameResult, slotBrush, SUBTRACTION);

    // Magnet Holes (if backplate === "magnet")
    if (backplate === "magnet") {
      const magX = pW / 2 - 10;
      const magY = pD / 2 - 12;
      for (const mx of [-magX, magX]) {
        for (const my of [magY, chinCenterY]) {
          const magGeo = new THREE.CylinderGeometry(5.1, 5.1, 2.2, 24);
          magGeo.rotateX(Math.PI / 2);
          const magBrush = new Brush(magGeo);
          magBrush.position.set(mx, my, 0.9);
          magBrush.updateMatrixWorld();
          frameResult = evaluator.evaluate(frameResult, magBrush, SUBTRACTION);
        }
      }
    }

    // Process Movable Text & Sticker Assets in 3D
    const fontLoader = new FontLoader();
    const font = fontLoader.parse(fontData);

    for (const asset of assets) {
      if (asset.type === "text" && asset.content) {
        const clean = asset.content.replace(/[^a-zA-Z0-9\s\-_!.,']/g, "").toUpperCase();
        if (clean.length > 0) {
          const textGeo = new TextGeometry(clean, {
            font,
            size: (asset.fontSize || 4.0) * (asset.scale || 1.0),
            depth: 0.6,
            curveSegments: 4,
            bevelEnabled: false,
          });
          textGeo.computeBoundingBox();
          const tw = textGeo.boundingBox ? textGeo.boundingBox.max.x - textGeo.boundingBox.min.x : 20;
          const th = textGeo.boundingBox ? textGeo.boundingBox.max.y - textGeo.boundingBox.min.y : 4;

          const textBrush = new Brush(textGeo);
          textBrush.position.set(asset.x - tw / 2, asset.y - th / 2, pH);
          if (asset.rotation) {
            textBrush.rotation.z = THREE.MathUtils.degToRad(asset.rotation);
          }
          textBrush.updateMatrixWorld();

          if (asset.style === "engraved") {
            textBrush.position.z = pH - 0.3;
            textBrush.updateMatrixWorld();
            frameResult = evaluator.evaluate(frameResult, textBrush, SUBTRACTION);
          } else {
            frameResult = evaluator.evaluate(frameResult, textBrush, ADDITION);
          }
        }
      } else if (asset.type === "icon") {
        const stickerSize = (asset.size || 15) * (asset.scale || 1.0);

        // Extrude Die-Cut Base Outline if hasDieCut
        if (asset.hasDieCut) {
          const baseShape = createSticker3DShape(asset.iconId, stickerSize * 1.15);
          const baseGeo = new THREE.ExtrudeGeometry(baseShape, { depth: 0.6, bevelEnabled: false });
          const baseBrush = new Brush(baseGeo);
          baseBrush.position.set(asset.x, asset.y, pH);
          if (asset.rotation) {
            baseBrush.rotation.z = THREE.MathUtils.degToRad(asset.rotation);
          }
          baseBrush.updateMatrixWorld();
          frameResult = evaluator.evaluate(frameResult, baseBrush, ADDITION);
        }

        // Extrude Graphic Silhouette on top
        const iconShape = createSticker3DShape(asset.iconId, stickerSize * 0.95);
        const iconGeo = new THREE.ExtrudeGeometry(iconShape, { depth: 0.5, bevelEnabled: false });
        const iconBrush = new Brush(iconGeo);
        const iconZ = asset.hasDieCut ? pH + 0.6 : pH;
        iconBrush.position.set(asset.x, asset.y, iconZ);
        if (asset.rotation) {
          iconBrush.rotation.z = THREE.MathUtils.degToRad(asset.rotation);
        }
        iconBrush.updateMatrixWorld();
        frameResult = evaluator.evaluate(frameResult, iconBrush, ADDITION);
      }
    }

    // Frame Material
    const frameMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(frameColor),
      roughness: 0.36,
      metalness: 0.08,
    });
    frameResult.material = frameMat;
    frameResult.castShadow = true;
    frameResult.receiveShadow = true;

    singleFrameMeshRef.current = frameResult;

    const printableGroup = new THREE.Group();
    printableGroup.add(frameResult);
    fullExportGroupRef.current = printableGroup;

    // Companion Stand Base (if backplate === "stand")
    let standMesh: THREE.Mesh | null = null;
    const standW = Math.max(50, pW * 0.75);
    const standD = 38;
    const standH = 14;

    if (backplate === "stand") {
      const standShape = createRoundedRectShape(standW, standD, 3.0);
      const standGeo = new THREE.ExtrudeGeometry(standShape, { depth: standH, bevelEnabled: true, bevelSize: 0.6, bevelThickness: 0.6 });
      const standBrush = new Brush(standGeo);
      standBrush.position.set(0, 0, standH / 2);
      standBrush.updateMatrixWorld();

      const slotCutterGeo = new THREE.BoxGeometry(pW + 2, 4.0, standH + 4);
      slotCutterGeo.rotateX(-THREE.MathUtils.degToRad(14));
      const slotCutterBrush = new Brush(slotCutterGeo);
      slotCutterBrush.position.set(0, -2, standH / 2 + 3);
      slotCutterBrush.updateMatrixWorld();

      const standResult = evaluator.evaluate(standBrush, slotCutterBrush, SUBTRACTION);
      standResult.material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(edgeColor === "#00C2FF" ? 0x0284c7 : 0x0f172a),
        roughness: 0.35,
        metalness: 0.15,
      });
      standResult.castShadow = true;
      standMesh = standResult;
      printableGroup.add(standMesh);
    }

    // Display Scene Group
    const displaySceneGroup = new THREE.Group();

    if (backplate === "stand" && standMesh) {
      const tilt = THREE.MathUtils.degToRad(14);
      const displayFrame = frameResult.clone(true);
      displayFrame.rotation.x = tilt;
      displayFrame.position.set(0, standH * 0.7, 0);
      displaySceneGroup.add(displayFrame);

      const displayStand = standMesh.clone(true);
      displayStand.position.set(0, 0, 0);
      displaySceneGroup.add(displayStand);
    } else {
      const displayFrame = frameResult.clone(true);
      displayFrame.rotation.x = -Math.PI / 2;
      displayFrame.position.set(0, pH / 2, 0);
      displaySceneGroup.add(displayFrame);
    }

    displaySceneGroup.rotation.y = THREE.MathUtils.degToRad(rotationAngle);
    scene.add(displaySceneGroup);

    // Camera Navigation
    let isDragging = false;
    let isPanning = false;
    let prevMouse = { x: 0, y: 0 };
    const currentAngle = { theta: 0.75, phi: 0.55, radius: Math.max(160, pW * 1.5) };
    const currentLookAt = new THREE.Vector3(0, backplate === "stand" ? 18 : 5, 0);

    const updateCamera = () => {
      currentAngle.phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, currentAngle.phi));
      camera.position.x = currentLookAt.x + currentAngle.radius * Math.sin(currentAngle.phi) * Math.sin(currentAngle.theta);
      camera.position.y = currentLookAt.y + currentAngle.radius * Math.cos(currentAngle.phi);
      camera.position.z = currentLookAt.z + currentAngle.radius * Math.sin(currentAngle.phi) * Math.cos(currentAngle.theta);
      camera.lookAt(currentLookAt);
    };
    updateCamera();

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 2 || e.shiftKey) isPanning = true;
      else if (e.button === 0) isDragging = true;
      prevMouse = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - prevMouse.x;
      const dy = e.clientY - prevMouse.y;
      prevMouse = { x: e.clientX, y: e.clientY };

      if (isDragging) {
        currentAngle.theta -= dx * 0.008;
        currentAngle.phi -= dy * 0.008;
        updateCamera();
      } else if (isPanning) {
        const factor = currentAngle.radius * 0.0012;
        currentLookAt.x -= dx * factor * Math.cos(currentAngle.theta);
        currentLookAt.z += dx * factor * Math.sin(currentAngle.theta);
        currentLookAt.y += dy * factor;
        updateCamera();
      }
    };

    const handleMouseUp = () => {
      isDragging = false;
      isPanning = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      currentAngle.radius = Math.max(70, Math.min(450, currentAngle.radius + e.deltaY * 0.18));
      updateCamera();
    };

    const domEl = renderer.domElement;
    domEl.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    domEl.addEventListener("wheel", handleWheel, { passive: false });
    domEl.addEventListener("contextmenu", (e) => e.preventDefault());

    let reqId: number;
    const animate = () => {
      reqId = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(reqId);
      domEl.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      domEl.removeEventListener("wheel", handleWheel);
      if (threeRendererRef.current) {
        threeRendererRef.current.dispose();
      }
    };
  }, [viewMode, frameSize, backplate, frameColor, edgeColor, assets, rotationAngle, specs, winCenterY, chinCenterY]);

  // ─────────────────────────────────────────────────────────────────────────
  // Export STL Functionality
  // ─────────────────────────────────────────────────────────────────────────
  const handleExportSTL = () => {
    try {
      setIsExporting(true);

      let targetObj: THREE.Object3D | null = fullExportGroupRef.current || singleFrameMeshRef.current;

      if (!targetObj) {
        const geo = new THREE.BoxGeometry(specs.width, specs.depth, specs.height);
        const mat = new THREE.MeshStandardMaterial({ color: 0xffffff });
        targetObj = new THREE.Mesh(geo, mat);
      }

      const exporter = new STLExporter();
      const stlData = exporter.parse(targetObj, { binary: true });
      const blob = new Blob([stlData], { type: "application/octet-stream" });
      const url = URL.createObjectURL(blob);

      const filename = `polaroid_${frameSize}_frame_${Date.now()}.stl`;
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportNotice(`File ${filename} berhasil diekspor & siap dicetak!`);
      setShowExportModal(true);
    } catch (err: any) {
      alert("Gagal mengekspor file STL: " + (err?.message || err));
    } finally {
      setIsExporting(false);
    }
  };

  // Die-cut outline color for stickers based on current frame color
  const dieCutOutlineColor = frameColor === "#141414" || frameColor === "#070E1E" ? "#141414" : "#FFFFFF";

  return (
    <div className="h-screen flex flex-col bg-[#020817] font-sans antialiased text-slate-100 select-none overflow-hidden">
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* GOOOS TOP HEADER BAR */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <header className="h-14 px-5 border-b border-cyan-500/20 bg-[#040914]/95 backdrop-blur-md flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-cyan-400 transition"
          >
            <ChevronLeft className="w-4 h-4 text-cyan-400" />
            <span>Polaroid Frame Generator</span>
          </Link>

          <div className="h-4 w-[1px] bg-slate-800 mx-1" />

          {/* GooOS Official Shield Badge & Generator Title */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400 via-blue-500 to-blue-700 text-slate-950 flex items-center justify-center font-black text-xs shadow-[0_0_12px_rgba(0,194,255,0.4)]">
              +
            </div>
            <div className="flex items-center gap-2">
              <span className="font-black text-sm text-white tracking-tight">
                Polaroid Frame Generator
              </span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-bold uppercase tracking-wider">
                GooOS CAD
              </span>
            </div>
          </div>
        </div>

        {/* Right Header Badges */}
        <div className="flex items-center gap-3">
          {/* Energy / Tokens Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/90 border border-cyan-500/25 text-xs font-medium text-slate-200 shadow-[0_0_10px_rgba(0,194,255,0.1)]">
            <Zap className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400" />
            <span className="font-mono font-bold text-white">148</span>
            <div className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-[10px] font-bold border border-cyan-500/40">
              G
            </div>
          </div>

          {/* Upgrade Pill */}
          <button className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-black shadow-[0_0_15px_rgba(0,194,255,0.35)] transition active:scale-95">
            <span>Upgrade</span>
            <Crown className="w-3.5 h-3.5 fill-current" />
          </button>

          {/* Language Dropdown */}
          <div className="relative">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as any)}
              className="appearance-none bg-slate-900/80 border border-slate-700/80 rounded-full text-xs font-medium text-slate-300 py-1 pl-3 pr-7 focus:outline-none focus:border-cyan-400 cursor-pointer shadow-xs"
            >
              <option value="id">Bahasa Indonesia</option>
              <option value="en">English</option>
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2.5 top-2 pointer-events-none" />
          </div>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* WORKSPACE: LEFT SETTINGS PANEL + RIGHT MAIN CANVAS */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT SETTINGS SIDEBAR (GooOS Dark Slate Palette) */}
        <aside className="w-[380px] bg-[#070D1A] border-r border-slate-800/80 flex flex-col shrink-0 overflow-y-auto p-4 space-y-4">
          {/* SECTION 1: Frame Specs */}
          <div className="bg-[#0B1528] rounded-xl border border-cyan-500/15 p-3.5 shadow-sm space-y-3 hover:border-cyan-500/30 transition">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-cyan-400 text-slate-950 text-xs font-black flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(0,194,255,0.4)]">
                1
              </span>
              <span className="font-bold text-sm text-white">Frame Specs</span>
            </div>

            {/* Size Switcher */}
            <div>
              <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Ukuran Frame (Film Size)</label>
              <div className="flex items-center gap-2">
                {(["mini", "square", "wide"] as FrameSize[]).map((sz) => {
                  const isSelected = frameSize === sz;
                  return (
                    <button
                      key={sz}
                      onClick={() => setFrameSize(sz)}
                      className={`flex-1 py-1.5 px-2 rounded-full text-xs font-black uppercase transition tracking-wider border ${
                        isSelected
                          ? "border-cyan-400 text-cyan-300 bg-cyan-500/15 shadow-[0_0_12px_rgba(0,194,255,0.25)]"
                          : "border-slate-800 bg-slate-900/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                      }`}
                    >
                      {POLAROID_SPECS[sz].label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Backplate Switcher */}
            <div>
              <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Tipe Dudukan Belakang (Backplate)</label>
              <div className="flex items-center gap-2">
                {[
                  { id: "plain", label: "Plain" },
                  { id: "stand", label: "Stand 👑" },
                  { id: "magnet", label: "Magnet 👑" },
                ].map((bp) => {
                  const isSelected = backplate === bp.id;
                  return (
                    <button
                      key={bp.id}
                      onClick={() => setBackplate(bp.id as any)}
                      className={`flex-1 py-1.5 px-1.5 rounded-full text-xs font-semibold transition border ${
                        isSelected
                          ? "border-cyan-400 text-cyan-300 bg-cyan-500/15 shadow-[0_0_12px_rgba(0,194,255,0.25)]"
                          : "border-slate-800 bg-slate-900/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                      }`}
                    >
                      {bp.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Color & Edge Pickers */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <span className="text-xs text-slate-300 font-medium">Bodi Frame</span>
                <button
                  onClick={() => setFrameColor(frameColor === "#FFFFFF" ? "#141414" : frameColor === "#141414" ? "#FAF0D7" : "#FFFFFF")}
                  style={{ backgroundColor: frameColor }}
                  className="w-5 h-5 rounded-full border border-slate-500 shadow-sm transition hover:scale-110"
                  title="Klik untuk ubah warna bodi frame"
                />
              </div>

              <div className="flex items-center gap-2.5">
                <span className="text-xs text-slate-300 font-medium">Garis Tepi (Edge)</span>
                <button
                  onClick={() => setEdgeColor(edgeColor === "#111111" ? "#D9532F" : edgeColor === "#D9532F" ? "#00C2FF" : "#111111")}
                  style={{ backgroundColor: edgeColor }}
                  className="w-5 h-5 rounded-full border border-cyan-400/60 shadow-[0_0_8px_rgba(0,194,255,0.4)] transition hover:scale-110"
                  title="Klik untuk ubah aksen tepi/chamfer"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: Upload Photo */}
          <div className="bg-[#0B1528] rounded-xl border border-cyan-500/15 p-3.5 shadow-sm space-y-2.5 hover:border-cyan-500/30 transition">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-cyan-400 text-slate-950 text-xs font-black flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(0,194,255,0.4)]">
                2
              </span>
              <span className="font-bold text-sm text-white">Upload Photo</span>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    if (event.target?.result) setPhotoUrl(event.target.result as string);
                  };
                  reader.readAsDataURL(file);
                }
              }}
              accept="image/*"
              className="hidden"
            />

            {photoUrl ? (
              <div className="relative rounded-lg overflow-hidden border border-cyan-500/30 bg-slate-900/80 p-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img src={photoUrl} alt="Uploaded" className="w-10 h-10 object-cover rounded-md border border-cyan-500/40" />
                  <span className="text-xs font-medium text-cyan-300 truncate max-w-[170px]">Foto terpasang</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[11px] font-semibold text-slate-300 hover:text-white px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded transition"
                  >
                    Ganti
                  </button>
                  <button
                    onClick={() => {
                      setPhotoUrl(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="p-1 text-rose-400 hover:bg-rose-500/10 rounded transition"
                    title="Hapus foto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="h-20 rounded-lg border border-dashed border-cyan-500/30 bg-slate-900/50 hover:bg-slate-900/80 hover:border-cyan-400 transition cursor-pointer flex flex-col items-center justify-center gap-1 text-slate-400 group"
              >
                <Upload className="w-5 h-5 text-cyan-400 group-hover:-translate-y-0.5 transition" />
                <span className="text-[11px] font-medium text-slate-300">Klik untuk upload foto Anda</span>
              </div>
            )}
          </div>

          {/* SECTION 3: Templates (Matching Screenshots 1, 2, 3) */}
          <div className="bg-[#0B1528] rounded-xl border border-cyan-500/15 p-3.5 shadow-sm space-y-2.5 hover:border-cyan-500/30 transition">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-cyan-400 text-slate-950 text-xs font-black flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(0,194,255,0.4)]">
                3
              </span>
              <span className="font-bold text-sm text-white">Preset Template Nyata</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {/* Template 3: Witch Hat (Image 1) */}
              <div
                onClick={() => applyTemplate("template3")}
                className={`p-2 rounded-lg border-2 cursor-pointer transition flex flex-col items-center text-center ${
                  activeLayout === "template3"
                    ? "border-cyan-400 bg-cyan-950/30 shadow-[0_0_12px_rgba(0,194,255,0.2)]"
                    : "border-slate-800 bg-slate-900/60 hover:border-slate-700"
                }`}
              >
                <div className="w-10 h-14 bg-white border border-slate-600 rounded-sm shadow-xs flex flex-col items-center p-1 justify-between relative overflow-hidden">
                  <div className="w-full h-8 bg-slate-200 rounded-xs" />
                  <span className="text-[9px] absolute top-1 right-1">🎩</span>
                  <span className="text-[8px] absolute bottom-1 left-1">💀</span>
                </div>
                <span className="text-[10px] font-bold text-slate-200 mt-1.5 leading-tight">Witch & Skull</span>
              </div>

              {/* Template 2: Halloween Spooky Party (Image 2) */}
              <div
                onClick={() => applyTemplate("template2")}
                className={`p-2 rounded-lg border-2 cursor-pointer transition flex flex-col items-center text-center ${
                  activeLayout === "template2"
                    ? "border-cyan-400 bg-cyan-950/30 shadow-[0_0_12px_rgba(0,194,255,0.2)]"
                    : "border-slate-800 bg-slate-900/60 hover:border-slate-700"
                }`}
              >
                <div className="w-10 h-14 bg-[#141414] border border-[#D9532F] rounded-sm shadow-xs flex flex-col items-center p-1 justify-between relative overflow-hidden">
                  <div className="w-full h-8 bg-slate-800 rounded-xs" />
                  <span className="text-[9px] absolute bottom-1 left-1">🎃</span>
                  <span className="text-[8px] absolute top-1 right-1">🕸️</span>
                </div>
                <span className="text-[10px] font-bold text-slate-200 mt-1.5 leading-tight">Halloween</span>
              </div>

              {/* Template 1: New York Travel (Image 3) */}
              <div
                onClick={() => applyTemplate("template1")}
                className={`p-2 rounded-lg border-2 cursor-pointer transition flex flex-col items-center text-center ${
                  activeLayout === "template1"
                    ? "border-cyan-400 bg-cyan-950/30 shadow-[0_0_12px_rgba(0,194,255,0.2)]"
                    : "border-slate-800 bg-slate-900/60 hover:border-slate-700"
                }`}
              >
                <div className="w-10 h-14 bg-white border border-slate-600 rounded-sm shadow-xs flex flex-col items-center p-1 justify-between relative overflow-hidden">
                  <div className="w-full h-8 bg-sky-100 rounded-xs" />
                  <span className="text-[9px] absolute top-1 right-1">📷</span>
                  <span className="text-[8px] absolute bottom-1 text-center font-bold text-[#0284C7] leading-none">★ NY ★</span>
                </div>
                <span className="text-[10px] font-bold text-slate-200 mt-1.5 leading-tight">New York</span>
              </div>
            </div>
          </div>

          {/* SECTION 4: Assets (Stickers & Movable Texts) */}
          <div className="bg-[#0B1528] rounded-xl border border-cyan-500/15 p-3.5 shadow-sm space-y-3 hover:border-cyan-500/30 transition">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-cyan-400 text-slate-950 text-xs font-black flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(0,194,255,0.4)]">
                  4
                </span>
                <span className="font-bold text-sm text-white">Sticker & Teks Bebas</span>
              </div>
              <span className="text-[10px] text-cyan-400 font-mono">Bisa dipindah & di-scale</span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleAddText}
                className="flex-1 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 hover:border-cyan-400 text-xs font-bold flex items-center justify-center gap-1 shadow-xs transition active:scale-95"
              >
                <span>+ Teks</span>
                <Crown className="w-3 h-3 text-amber-400 fill-amber-400" />
              </button>

              <button
                onClick={() => handleAddSticker("witch-hat")}
                className="flex-1 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-cyan-400 text-xs font-bold flex items-center justify-center gap-1 shadow-xs transition active:scale-95"
              >
                <span>+ Sticker</span>
              </button>
            </div>

            {/* Selected Asset Contextual Controls */}
            {selectedAsset && (
              <div className="p-2.5 rounded-lg bg-cyan-950/20 border border-cyan-500/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
                    <Move className="w-3.5 h-3.5 text-cyan-400" />
                    <span>
                      {selectedAsset.type === "text" ? `Teks: "${(selectedAsset as TextAssetItem).content}"` : `Sticker: ${(selectedAsset as IconAssetItem).iconId}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDuplicateAsset(selectedAsset.id)}
                      className="p-1 text-slate-400 hover:text-cyan-300 rounded hover:bg-slate-800"
                      title="Duplikat Aset"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleRemoveAsset(selectedAsset.id)}
                      className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800"
                      title="Hapus Aset"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Specific controls for Text */}
                {selectedAsset.type === "text" && (
                  <div className="space-y-2 pt-1 border-t border-slate-800">
                    <input
                      type="text"
                      value={(selectedAsset as TextAssetItem).content}
                      onChange={(e) => handleUpdateAsset(selectedAsset.id, { content: e.target.value })}
                      placeholder="Ketik teks..."
                      className="w-full text-xs px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-md text-white focus:outline-none focus:border-cyan-400"
                    />

                    <div className="flex items-center gap-2">
                      <select
                        value={(selectedAsset as TextAssetItem).font}
                        onChange={(e) => handleUpdateAsset(selectedAsset.id, { font: e.target.value as any })}
                        className="flex-1 text-[11px] bg-slate-950 border border-slate-700 rounded text-slate-300 px-1.5 py-1"
                      >
                        <option value="modern">Modern Bold</option>
                        <option value="handwriting">Handwriting</option>
                        <option value="serif">Classic Serif</option>
                        <option value="mono">Monospace</option>
                      </select>

                      <input
                        type="color"
                        value={(selectedAsset as TextAssetItem).color || "#FFFFFF"}
                        onChange={(e) => handleUpdateAsset(selectedAsset.id, { color: e.target.value })}
                        className="w-7 h-7 rounded border border-slate-700 cursor-pointer bg-transparent"
                        title="Warna Teks"
                      />
                    </div>
                  </div>
                )}

                {/* Specific controls for Sticker */}
                {selectedAsset.type === "icon" && (
                  <div className="space-y-2 pt-1 border-t border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-300 font-medium">Outline Die-Cut (Kontur Pinggiran):</span>
                      <button
                        onClick={() =>
                          handleUpdateAsset(selectedAsset.id, {
                            hasDieCut: !(selectedAsset as IconAssetItem).hasDieCut,
                          })
                        }
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                          (selectedAsset as IconAssetItem).hasDieCut
                            ? "bg-cyan-500 text-slate-950"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {(selectedAsset as IconAssetItem).hasDieCut ? "Aktif (Sticker)" : "Murni (Tanpa Kontur)"}
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-300 font-medium">Warna Gambar:</span>
                      <div className="flex items-center gap-1.5">
                        {["#111111", "#FFFFFF", "#D9532F", "#0284C7", "#00C2FF", "#E86020"].map((c) => (
                          <button
                            key={c}
                            onClick={() => handleUpdateAsset(selectedAsset.id, { color: c })}
                            style={{ backgroundColor: c }}
                            className={`w-4 h-4 rounded-full border transition ${
                              (selectedAsset as IconAssetItem).color === c ? "border-cyan-400 scale-125" : "border-slate-600"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Scale & Rotate Sliders */}
                <div className="space-y-1.5 pt-1 border-t border-slate-800 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Skala Ukuran: {selectedAsset.scale || 1.0}x</span>
                    <input
                      type="range"
                      min="0.5"
                      max="2.5"
                      step="0.05"
                      value={selectedAsset.scale || 1.0}
                      onChange={(e) => handleUpdateAsset(selectedAsset.id, { scale: parseFloat(e.target.value) })}
                      className="w-28 accent-cyan-400"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Rotasi: {selectedAsset.rotation || 0}°</span>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      step="5"
                      value={selectedAsset.rotation || 0}
                      onChange={(e) => handleUpdateAsset(selectedAsset.id, { rotation: parseInt(e.target.value) })}
                      className="w-28 accent-cyan-400"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Sticker Catalog Grid */}
            <div className="pt-2">
              <span className="text-[11px] font-bold text-slate-300 block mb-1.5">
                Katalog Die-Cut Sticker (Klik untuk menambahkan):
              </span>
              <div className="grid grid-cols-4 gap-2 pt-1 max-h-52 overflow-y-auto scrollbar-thin">
                {STICKER_LIBRARY.map((stk) => (
                  <button
                    key={stk.id}
                    onClick={() => handleAddSticker(stk.id)}
                    title={stk.name}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-cyan-950/60 border border-slate-700/80 hover:border-cyan-400 flex flex-col items-center justify-center gap-1 transition active:scale-95 group"
                  >
                    <div className="w-8 h-8 flex items-center justify-center p-0.5">
                      {stk.renderSvg(stk.defaultColor)}
                    </div>
                    <span className="text-[9px] text-slate-400 truncate w-full text-center">
                      {stk.name.split(" ")[0]}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* ───────────────────────────────────────────────────────────────── */}
        {/* RIGHT MAIN CANVAS AREA (GooOS Cyber Canvas) */}
        {/* ───────────────────────────────────────────────────────────────── */}
        <main
          className="flex-1 relative overflow-hidden flex flex-col justify-between"
          style={{
            backgroundColor: "#040914",
            backgroundImage: "radial-gradient(rgba(0, 194, 255, 0.18) 1.2px, transparent 1.2px)",
            backgroundSize: "22px 22px",
          }}
          onClick={() => setSelectedAssetId(null)}
        >
          {/* FLOATING TOP BAR: View Switcher (Left) + Export Button (Right) */}
          <div className="p-5 flex items-start justify-between pointer-events-none z-10">
            {/* View Switcher Pills */}
            <div className="pointer-events-auto flex flex-col items-start">
              <div className="flex items-center gap-1 p-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-cyan-500/25 shadow-lg">
                {[
                  { id: "front", label: "Front" },
                  { id: "back", label: "Back" },
                  { id: "3d", label: "3D" },
                ].map((vm) => {
                  const isActive = viewMode === vm.id;
                  return (
                    <button
                      key={vm.id}
                      onClick={() => setViewMode(vm.id as any)}
                      className={`px-3.5 py-1 rounded-full text-xs font-bold transition ${
                        isActive
                          ? "bg-cyan-400 text-slate-950 shadow-[0_0_12px_rgba(0,194,255,0.4)]"
                          : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                      }`}
                    >
                      {vm.label}
                    </button>
                  );
                })}

                <button
                  onClick={() => setRotationAngle((prev) => (prev + 90) % 360)}
                  className="px-2.5 py-1 rounded-full text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 flex items-center gap-1 transition"
                  title="Rotate frame 90 degrees"
                >
                  <RotateCw className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Rotate</span>
                </button>
              </div>

              {/* Helper Guide Text Matching Screenshot 1 */}
              <div className="text-[11px] text-slate-400/80 font-medium leading-tight mt-2 select-none space-y-0.5">
                <p>Click to select · arrows to nudge · Delete to remove</p>
                <p>Scale corners, stretch edges</p>
                <p>Right-click for more</p>
              </div>
            </div>

            {/* Export Button (GooOS Electric Cyan Gradient) */}
            <div className="pointer-events-auto">
              <button
                onClick={handleExportSTL}
                disabled={isExporting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 hover:from-cyan-300 hover:to-blue-500 active:scale-95 text-slate-950 font-black text-sm shadow-[0_0_20px_rgba(0,194,255,0.45)] hover:shadow-[0_0_25px_rgba(0,194,255,0.6)] transition cursor-pointer"
              >
                <Download className="w-4 h-4 stroke-[2.5]" />
                <span>{isExporting ? "Membuat STL..." : "Export"}</span>
              </button>
            </div>
          </div>

          {/* CENTER VIEWPORT: 2D Front / 2D Back / 3D Canvas */}
          <div className="flex-1 flex items-center justify-center p-4 relative">
            {viewMode === "front" && (
              <div
                className="transition-all duration-300 flex items-center justify-center"
                style={{
                  transform: `rotate(${rotationAngle}deg)`,
                }}
              >
                {/* 2D Realistic Polaroid Frame Canvas with Draggable Sticker Layer */}
                <div
                  ref={frameContainerRef}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    width: `${frameVisualWidth}px`,
                    height: `${frameVisualHeight}px`,
                    backgroundColor: frameColor,
                    borderColor: edgeColor,
                    boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 25px rgba(0, 194, 255, 0.15)",
                  }}
                  className="rounded-xl border-[2.5px] relative select-none overflow-hidden transition-all"
                >
                  {/* Photo Area Recess with Inner Shadow */}
                  <div
                    style={{
                      position: "absolute",
                      left: "50%",
                      top: `${specs.topMargin * scaleFactor}px`,
                      transform: "translateX(-50%)",
                      width: `${specs.windowW * scaleFactor}px`,
                      height: `${specs.windowH * scaleFactor}px`,
                      backgroundColor: frameColor === "#141414" || frameColor === "#070E1E" ? "#1E1E1E" : "#E2DDD3",
                      boxShadow: "inset 0 3px 8px rgba(0,0,0,0.35)",
                    }}
                    className="rounded-md overflow-hidden flex items-center justify-center border border-slate-700/20 pointer-events-none"
                  >
                    {photoUrl ? (
                      <img src={photoUrl} alt="Photo Area" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-slate-500 text-sm font-medium tracking-wide">
                        Photo area
                      </span>
                    )}
                  </div>

                  {/* Movable Elements Layer with Transform Gizmo (Handles, Bounding Box, Scale, Rotate) */}
                  {assets.map((asset) => {
                    const screenX = frameVisualWidth / 2 + asset.x * scaleFactor;
                    const screenY = frameVisualHeight / 2 - asset.y * scaleFactor;
                    const isSelected = selectedAssetId === asset.id;

                    if (asset.type === "text") {
                      return (
                        <div
                          key={asset.id}
                          onMouseDown={(e) => startTransform("move", asset.id, e)}
                          onTouchStart={(e) => startTransform("move", asset.id, e)}
                          style={{
                            position: "absolute",
                            left: `${screenX}px`,
                            top: `${screenY}px`,
                            transform: `translate(-50%, -50%) rotate(${asset.rotation || 0}deg) scale(${asset.scale || 1.0})`,
                            zIndex: isSelected ? 40 : 20,
                          }}
                          className={`cursor-move select-none p-1 transition-shadow ${
                            isSelected ? "ring-2 ring-cyan-400 rounded bg-cyan-950/40" : "hover:ring-1 hover:ring-cyan-500/50"
                          }`}
                        >
                          <span
                            style={{
                              fontFamily:
                                asset.font === "handwriting"
                                  ? "cursive"
                                  : asset.font === "mono"
                                  ? "monospace"
                                  : asset.font === "serif"
                                  ? "serif"
                                  : "sans-serif",
                              color: asset.color,
                              fontSize: `${(asset.fontSize || 4.2) * scaleFactor * 0.75}px`,
                              textShadow:
                                asset.style === "embossed"
                                  ? "1px 1px 0px rgba(255,255,255,0.7), -1px -1px 0px rgba(0,0,0,0.15)"
                                  : "none",
                            }}
                            className="font-black whitespace-nowrap tracking-wide block select-none"
                          >
                            {asset.content}
                          </span>

                          {/* Transform Gizmo when selected */}
                          {isSelected && (
                            <div className="absolute -top-3 -right-2 bg-cyan-400 text-slate-950 rounded-full p-0.5 shadow-sm pointer-events-none">
                              <Move className="w-2.5 h-2.5" />
                            </div>
                          )}
                        </div>
                      );
                    }

                    if (asset.type === "icon") {
                      const meta = STICKER_LIBRARY.find((s) => s.id === asset.iconId);
                      const basePx = Math.round((asset.size || 15) * scaleFactor * (asset.scale || 1.0));

                      return (
                        <div
                          key={asset.id}
                          onMouseDown={(e) => startTransform("move", asset.id, e)}
                          onTouchStart={(e) => startTransform("move", asset.id, e)}
                          style={{
                            position: "absolute",
                            left: `${screenX}px`,
                            top: `${screenY}px`,
                            width: `${basePx}px`,
                            height: `${basePx}px`,
                            transform: `translate(-50%, -50%) rotate(${asset.rotation || 0}deg)`,
                            zIndex: isSelected ? 40 : 25,
                          }}
                          className="cursor-move select-none flex items-center justify-center relative group"
                        >
                          {/* Sticker Graphic with Die-Cut Outline matching Screenshots */}
                          <div
                            style={{
                              filter: asset.hasDieCut
                                ? `drop-shadow(3px 0 0 ${dieCutOutlineColor}) drop-shadow(-3px 0 0 ${dieCutOutlineColor}) drop-shadow(0 3px 0 ${dieCutOutlineColor}) drop-shadow(0 -3px 0 ${dieCutOutlineColor}) drop-shadow(2px 2px 0 ${dieCutOutlineColor}) drop-shadow(-2px -2px 0 ${dieCutOutlineColor}) drop-shadow(2px -2px 0 ${dieCutOutlineColor}) drop-shadow(-2px 2px 0 ${dieCutOutlineColor}) drop-shadow(0 4px 6px rgba(0,0,0,0.22))`
                                : "none",
                            }}
                            className="w-full h-full flex items-center justify-center pointer-events-none"
                          >
                            {meta ? meta.renderSvg(asset.color) : <Star className="w-full h-full" />}
                          </div>

                          {/* ─────────────────────────────────────────────────────────── */}
                          {/* TRANSFORM GIZMO OVERLAY (MATCHING SCREENSHOT 1) */}
                          {/* ─────────────────────────────────────────────────────────── */}
                          {isSelected && (
                            <div className="absolute inset-0 border-[1.5px] border-amber-400/90 pointer-events-auto">
                              {/* 4 Corner Scale Handles */}
                              <div
                                onMouseDown={(e) => startTransform("scale-corner", asset.id, e)}
                                onTouchStart={(e) => startTransform("scale-corner", asset.id, e)}
                                className="absolute -top-1.5 -left-1.5 w-3 h-3 rounded-full bg-white border-2 border-amber-500 cursor-nwse-resize shadow-xs"
                              />
                              <div
                                onMouseDown={(e) => startTransform("scale-corner", asset.id, e)}
                                onTouchStart={(e) => startTransform("scale-corner", asset.id, e)}
                                className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-white border-2 border-amber-500 cursor-nesw-resize shadow-xs"
                              />
                              <div
                                onMouseDown={(e) => startTransform("scale-corner", asset.id, e)}
                                onTouchStart={(e) => startTransform("scale-corner", asset.id, e)}
                                className="absolute -bottom-1.5 -left-1.5 w-3 h-3 rounded-full bg-white border-2 border-amber-500 cursor-nesw-resize shadow-xs"
                              />
                              <div
                                onMouseDown={(e) => startTransform("scale-corner", asset.id, e)}
                                onTouchStart={(e) => startTransform("scale-corner", asset.id, e)}
                                className="absolute -bottom-1.5 -right-1.5 w-3 h-3 rounded-full bg-white border-2 border-amber-500 cursor-nwse-resize shadow-xs"
                              />

                              {/* Top Stem & Rotation Handle */}
                              <div
                                onMouseDown={(e) => startTransform("rotate", asset.id, e)}
                                onTouchStart={(e) => startTransform("rotate", asset.id, e)}
                                className="absolute -top-6 left-1/2 -translate-x-1/2 flex flex-col items-center cursor-grab active:cursor-grabbing group/rot"
                                title="Putar Sticker"
                              >
                                <div className="w-3.5 h-3.5 rounded-full bg-amber-500 border border-white shadow-xs group-hover/rot:scale-125 transition" />
                                <div className="w-[1.5px] h-2.5 bg-amber-500" />
                              </div>

                              {/* Bottom Flip / Center Handle */}
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUpdateAsset(asset.id, { rotation: (asset.rotation + 180) % 360 });
                                }}
                                className="absolute -bottom-5 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-amber-500/80 border border-white text-[8px] flex items-center justify-center text-white cursor-pointer hover:scale-125 transition"
                                title="Balik 180°"
                              >
                                ◧
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    }

                    return null;
                  })}
                </div>
              </div>
            )}

            {viewMode === "back" && (
              <div
                className="transition-all duration-300 flex items-center justify-center"
                style={{
                  transform: `rotate(${rotationAngle}deg)`,
                }}
              >
                {/* 2D Backplate View */}
                <div
                  style={{
                    width: `${frameVisualWidth}px`,
                    height: `${frameVisualHeight}px`,
                    backgroundColor: frameColor,
                    borderColor: edgeColor,
                    boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.7)",
                  }}
                  className="rounded-xl border-[2.5px] p-5 flex flex-col justify-between relative select-none"
                >
                  {/* Photo Slot Insertion Guide */}
                  <div className="w-full flex flex-col items-center gap-1 border-b border-dashed border-slate-700/60 pb-3">
                    <div className="w-3/4 h-2 bg-slate-800/80 rounded-full" />
                    <span className="text-[10px] text-cyan-400 font-mono">↓ Insert Photo Slot</span>
                  </div>

                  {/* Magnet Holes or Stand Bracket preview */}
                  <div className="flex-1 flex flex-col items-center justify-center gap-4">
                    {backplate === "magnet" && (
                      <div className="w-full flex justify-between px-4">
                        <div className="w-7 h-7 rounded-full border-2 border-cyan-400 bg-slate-800 flex items-center justify-center text-[9px] font-mono text-cyan-300">
                          10mm
                        </div>
                        <div className="w-7 h-7 rounded-full border-2 border-cyan-400 bg-slate-800 flex items-center justify-center text-[9px] font-mono text-cyan-300">
                          10mm
                        </div>
                      </div>
                    )}

                    {backplate === "stand" && (
                      <div className="w-36 h-10 rounded-lg border border-cyan-500/40 bg-slate-900/90 flex items-center justify-center text-[10px] text-cyan-300 font-bold">
                        Stand Socket (14° Tilt)
                      </div>
                    )}

                    <span className="text-xs text-slate-500 font-mono uppercase tracking-widest">
                      GooOS CAD Studio
                    </span>
                  </div>

                  <div className="text-center text-[10px] text-slate-500 font-mono">
                    {specs.name} · {specs.filmDesc}
                  </div>
                </div>
              </div>
            )}

            {viewMode === "3d" && (
              <div
                ref={containerRef}
                className="w-full h-full absolute inset-0 cursor-grab active:cursor-grabbing"
              />
            )}
          </div>

          {/* BOTTOM STATUS BAR */}
          <div className="px-5 py-2.5 flex items-center justify-between text-xs font-mono select-none z-10 pointer-events-none border-t border-cyan-500/10 bg-[#040914]/80 backdrop-blur-xs">
            <div className="text-cyan-400/90 font-bold">
              {specs.name} · {specs.width.toFixed(1)}×{specs.depth.toFixed(1)}×2.80 mm · Aset {assets.length} item
            </div>
            <div className="pointer-events-auto flex items-center gap-3 text-[11px] text-slate-400">
              <span>Estimasi Berat: ~{specs.weight}</span>
              <span>•</span>
              <span>Waktu Cetak: ~{specs.printTime}</span>
              <span>•</span>
              <span className="text-cyan-400">PLA+ Standard</span>
            </div>
          </div>
        </main>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* EXPORT CONFIRMATION MODAL */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#0B1528] rounded-2xl max-w-md w-full p-6 shadow-[0_0_50px_rgba(0,194,255,0.25)] border border-cyan-500/30 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-cyan-400">
                <CheckCircle2 className="w-6 h-6" />
                <h3 className="font-black text-base text-white">Model STL Siap Dicetak!</h3>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              File model 3D STL berpresisi tinggi telah berhasil dibuat dan diunduh. Semua teks dan die-cut sticker yang Anda geser telah disatukan secara solid (*manifold mesh*) dan siap langsung dicetak pada Bambu Studio, OrcaSlicer, atau PrusaSlicer.
            </p>

            <div className="bg-[#070E1E] rounded-xl p-3.5 border border-slate-800 space-y-2 text-xs text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Format:</span>
                <span className="font-bold text-white uppercase">{specs.name} ({specs.width}×{specs.depth} mm)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Dudukan:</span>
                <span className="font-bold text-cyan-300 capitalize">{backplate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Aset Kustom:</span>
                <span className="font-bold text-cyan-300">{assets.length} item diposisikan</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Estimasi Filament:</span>
                <span className="font-bold text-white">{specs.weight} PLA</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Estimasi Waktu:</span>
                <span className="font-bold text-white">{specs.printTime}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleExportSTL}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 transition shadow-[0_0_15px_rgba(0,194,255,0.35)]"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Ulang STL</span>
              </button>
              <button
                onClick={() => setShowExportModal(false)}
                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition"
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
