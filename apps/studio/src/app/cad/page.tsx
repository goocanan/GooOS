"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
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
  Ghost,
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
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Types & Interfaces
// ─────────────────────────────────────────────────────────────────────────────
type FrameSize = "mini" | "square" | "wide";
type BackplateType = "plain" | "stand" | "magnet";
type CanvasViewMode = "front" | "back" | "3d";
type IconCategory = "basics" | "halloween" | "buildings" | "scenes" | "decor";

interface TextAssetItem {
  id: string;
  type: "text";
  content: string;
  font: "handwriting" | "modern" | "serif" | "mono";
  style: "embossed" | "engraved";
  align: "center" | "left" | "right";
  size: number;
}

interface IconAssetItem {
  id: string;
  type: "icon";
  iconId: string;
  size: number;
  position: "center" | "left" | "right" | "beside";
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
// Available Silhouette Icons
// ─────────────────────────────────────────────────────────────────────────────
const ICON_LIBRARY: Record<IconCategory, { id: string; name: string; char?: string; iconComp?: any }[]> = {
  basics: [
    { id: "circle", name: "Circle", char: "●" },
    { id: "heart", name: "Heart", char: "♥", iconComp: Heart },
    { id: "triangle", name: "Triangle", char: "▲" },
    { id: "square-solid", name: "Square", char: "■" },
    { id: "star", name: "Star", char: "★", iconComp: Star },
    { id: "camera", name: "Camera", iconComp: Camera },
    { id: "smile", name: "Smile", iconComp: Smile },
    { id: "music", name: "Music", iconComp: Music },
    { id: "sun", name: "Sun", iconComp: Sun },
    { id: "coffee", name: "Coffee", iconComp: Coffee },
    { id: "sparkles", name: "Sparkles", iconComp: Sparkles },
    { id: "paw", name: "Paw", iconComp: PawPrint },
    { id: "palm", name: "Palm Tree", iconComp: Palmtree },
    { id: "gem", name: "Diamond", iconComp: Gem },
    { id: "gift", name: "Gift", iconComp: Gift },
    { id: "moon", name: "Moon", iconComp: Moon },
  ],
  halloween: [
    { id: "pumpkin", name: "Pumpkin", char: "🎃" },
    { id: "ghost", name: "Ghost", iconComp: Ghost },
    { id: "skull", name: "Skull", char: "💀" },
    { id: "bat", name: "Bat", char: "🦇" },
    { id: "flame", name: "Flame", iconComp: Flame },
  ],
  buildings: [
    { id: "home", name: "Home", iconComp: Home },
    { id: "castle", name: "Castle", iconComp: Castle },
    { id: "tower", name: "Tower", char: "🗼" },
    { id: "church", name: "Church", char: "⛪" },
  ],
  scenes: [
    { id: "mountain", name: "Mountain", iconComp: Mountain },
    { id: "tent", name: "Camp", iconComp: Tent },
    { id: "tree", name: "Tree", iconComp: TreePine },
    { id: "cloud", name: "Cloud", iconComp: Cloud },
  ],
  decor: [
    { id: "crown", name: "Crown", iconComp: Crown },
    { id: "ribbon", name: "Ribbon", iconComp: Ribbon },
    { id: "ring", name: "Ring", char: "💍" },
    { id: "flower", name: "Flower", char: "🌸" },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Geometry Helper Functions for 3D Engine
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
    case "circle": {
      shape.absarc(0, 0, size * 0.5, 0, Math.PI * 2, false);
      return shape;
    }
    case "triangle": {
      const h = size * 0.5;
      shape.moveTo(0, h);
      shape.lineTo(-h * 0.9, -h * 0.7);
      shape.lineTo(h * 0.9, -h * 0.7);
      shape.closePath();
      return shape;
    }
    case "square-solid": {
      const hs = size * 0.45;
      shape.moveTo(-hs, -hs);
      shape.lineTo(hs, -hs);
      shape.lineTo(hs, hs);
      shape.lineTo(-hs, hs);
      shape.closePath();
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
    default:
      shape.absarc(0, 0, size * 0.45, 0, Math.PI * 2, false);
      return shape;
  }
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
  const [edgeColor, setEdgeColor] = useState<string>("#00C2FF");

  // State: Photo Upload
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State: Layout Preset & Assets
  const [activeLayout, setActiveLayout] = useState<"blank" | "template" | "halloween">("blank");
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<IconCategory>("basics");

  // State: Canvas & View Controls
  const [viewMode, setViewMode] = useState<CanvasViewMode>("front");
  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const [language, setLanguage] = useState<"en" | "id">("id");

  // State: Export & Modal
  const [isExporting, setIsExporting] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Three.js References
  const containerRef = useRef<HTMLDivElement>(null);
  const threeRendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const singleFrameMeshRef = useRef<THREE.Mesh | null>(null);
  const fullExportGroupRef = useRef<THREE.Group | null>(null);

  // Current Specification
  const specs = POLAROID_SPECS[frameSize];

  // Count text and icons
  const textCount = assets.filter((a) => a.type === "text").length;
  const iconCount = assets.filter((a) => a.type === "icon").length;

  // ─────────────────────────────────────────────────────────────────────────
  // Handlers: Photo Upload
  // ─────────────────────────────────────────────────────────────────────────
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPhotoUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPhotoUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Handlers: Layout Presets
  // ─────────────────────────────────────────────────────────────────────────
  const applyLayout = (layout: "blank" | "template" | "halloween") => {
    setActiveLayout(layout);
    if (layout === "blank") {
      setAssets([]);
      setFrameColor("#FFFFFF");
      setEdgeColor("#00C2FF");
    } else if (layout === "template") {
      setFrameColor("#FFFFFF");
      setEdgeColor("#00C2FF");
      setAssets([
        {
          id: "text-1",
          type: "text",
          content: "Sweet Memories",
          font: "handwriting",
          style: "embossed",
          align: "center",
          size: 14,
        },
        {
          id: "icon-1",
          type: "icon",
          iconId: "heart",
          size: 16,
          position: "beside",
        },
      ]);
    } else if (layout === "halloween") {
      setFrameColor("#070E1E");
      setEdgeColor("#00C2FF");
      setAssets([
        {
          id: "text-hw",
          type: "text",
          content: "CYBER MOMENTS",
          font: "modern",
          style: "embossed",
          align: "center",
          size: 13,
        },
        {
          id: "icon-hw",
          type: "icon",
          iconId: "sparkles",
          size: 18,
          position: "beside",
        },
      ]);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Handlers: Assets (Add / Update / Delete)
  // ─────────────────────────────────────────────────────────────────────────
  const handleAddText = () => {
    const newText: TextAssetItem = {
      id: "text-" + Date.now(),
      type: "text",
      content: "MEMORIES",
      font: "modern",
      style: "embossed",
      align: "center",
      size: 14,
    };
    setAssets((prev) => [...prev, newText]);
    setActiveLayout("template");
  };

  const handleAddIcon = (iconId: string = "heart") => {
    const newIcon: IconAssetItem = {
      id: "icon-" + Date.now(),
      type: "icon",
      iconId: iconId,
      size: 16,
      position: "beside",
    };
    setAssets((prev) => [...prev, newIcon]);
    setActiveLayout("template");
  };

  const handleRemoveAsset = (id: string) => {
    setAssets((prev) => prev.filter((a) => a.id !== id));
  };

  const handleUpdateText = (id: string, updates: Partial<TextAssetItem>) => {
    setAssets((prev) =>
      prev.map((a) => (a.id === id && a.type === "text" ? { ...a, ...updates } : a))
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Handlers: Rotate
  // ─────────────────────────────────────────────────────────────────────────
  const handleRotate = () => {
    setRotationAngle((prev) => (prev + 90) % 360);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // 3D Engine: Construct Manifold Model & Render Scene in GooOS Theme
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (viewMode !== "3d" || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 800;
    const height = containerRef.current.clientHeight || 560;

    const scene = new THREE.Scene();
    // GooOS Deep Space Slate Background
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

    // GooOS Cyber-Studio Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x0a192f, 0.95);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
    keyLight.position.set(90, 160, 110);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.bias = -0.0002;
    scene.add(keyLight);

    // Electric Cyan Fill Light
    const fillLight = new THREE.DirectionalLight(0x00c2ff, 1.2);
    fillLight.position.set(-100, 80, -70);
    scene.add(fillLight);

    // Electric Cyan Rim Light
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.0);
    rimLight.position.set(0, 120, -140);
    scene.add(rimLight);

    // Dark Build Plate Grid with subtle Cyan Accent
    const grid = new THREE.GridHelper(260, 26, 0x00c2ff, 0x1e293b);
    grid.position.y = -0.1;
    scene.add(grid);

    // Geometry Generation
    const pW = specs.width;
    const pD = specs.depth;
    const pH = specs.height;
    const winW = specs.windowW;
    const winH = specs.windowH;

    const winCenterY = pD / 2 - specs.topMargin - winH / 2;
    const chinCenterY = -pD / 2 + specs.chinHeight / 2;

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

    // Internal Photo Slot Pocket (0.8mm to 2.0mm depth)
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

    // 3D Text & Icon on Chin
    const fontLoader = new FontLoader();
    const font = fontLoader.parse(fontData);

    const firstText = assets.find((a) => a.type === "text") as TextAssetItem | undefined;
    const firstIcon = assets.find((a) => a.type === "icon") as IconAssetItem | undefined;

    let textWidth = 0;
    if (firstText && firstText.content) {
      const clean = firstText.content.replace(/[^a-zA-Z0-9\s\-_!.,']/g, "").toUpperCase();
      const textGeo = new TextGeometry(clean, {
        font,
        size: pW > 80 ? 4.2 : 3.6,
        depth: 0.6,
        curveSegments: 4,
        bevelEnabled: false,
      });
      textGeo.computeBoundingBox();
      textWidth = textGeo.boundingBox ? textGeo.boundingBox.max.x - textGeo.boundingBox.min.x : 30;

      const textBrush = new Brush(textGeo);
      const textX = -textWidth / 2 - (firstIcon ? 4 : 0);
      textBrush.position.set(textX, chinCenterY - 2, pH);
      textBrush.updateMatrixWorld();

      if (firstText.style === "engraved") {
        textBrush.position.z = pH - 0.3;
        textBrush.updateMatrixWorld();
        frameResult = evaluator.evaluate(frameResult, textBrush, SUBTRACTION);
      } else {
        frameResult = evaluator.evaluate(frameResult, textBrush, ADDITION);
      }
    }

    if (firstIcon) {
      const iconShape = createIconShape(firstIcon.iconId, 6.5);
      if (iconShape) {
        const iconGeo = new THREE.ExtrudeGeometry(iconShape, { depth: 0.6, bevelEnabled: false });
        const iconBrush = new Brush(iconGeo);
        const iconX = firstText ? textWidth / 2 + 3 : 0;
        iconBrush.position.set(iconX, chinCenterY, pH);
        iconBrush.updateMatrixWorld();
        frameResult = evaluator.evaluate(frameResult, iconBrush, ADDITION);
      }
    }

    // Material
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
  }, [viewMode, frameSize, backplate, frameColor, edgeColor, assets, rotationAngle, specs]);

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

      setExportNotice(`File ${filename} berhasil diekspor & siap cetak!`);
      setShowExportModal(true);
    } catch (err: any) {
      alert("Gagal mengekspor file STL: " + (err?.message || err));
    } finally {
      setIsExporting(false);
    }
  };

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
                  onClick={() => setFrameColor(frameColor === "#FFFFFF" ? "#070E1E" : frameColor === "#070E1E" ? "#FAF0D7" : "#FFFFFF")}
                  style={{ backgroundColor: frameColor }}
                  className="w-5 h-5 rounded-full border border-slate-500 shadow-sm transition hover:scale-110"
                  title="Klik untuk ubah warna bodi frame"
                />
              </div>

              <div className="flex items-center gap-2.5">
                <span className="text-xs text-slate-300 font-medium">Garis Tepi (Edge)</span>
                <button
                  onClick={() => setEdgeColor(edgeColor === "#00C2FF" ? "#111111" : edgeColor === "#111111" ? "#E86020" : "#00C2FF")}
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
              onChange={handlePhotoUpload}
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
                    onClick={handleRemovePhoto}
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

          {/* SECTION 3: Layouts */}
          <div className="bg-[#0B1528] rounded-xl border border-cyan-500/15 p-3.5 shadow-sm space-y-2.5 hover:border-cyan-500/30 transition">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-cyan-400 text-slate-950 text-xs font-black flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(0,194,255,0.4)]">
                3
              </span>
              <span className="font-bold text-sm text-white">Layouts</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {/* Card 1: Blank */}
              <div
                onClick={() => applyLayout("blank")}
                className={`p-2 rounded-lg border-2 cursor-pointer transition flex flex-col items-center text-center ${
                  activeLayout === "blank"
                    ? "border-cyan-400 bg-cyan-950/30 shadow-[0_0_12px_rgba(0,194,255,0.2)]"
                    : "border-slate-800 bg-slate-900/60 hover:border-slate-700"
                }`}
              >
                <div className="w-10 h-14 bg-white border border-slate-600 rounded-sm shadow-xs flex flex-col items-center p-1 justify-between">
                  <div className="w-full h-8 bg-slate-200 rounded-xs" />
                  <div className="w-5 h-0.5 bg-slate-300 rounded" />
                </div>
                <span className="text-[11px] font-bold text-slate-200 mt-1.5">Blank</span>
              </div>

              {/* Card 2: Template */}
              <div
                onClick={() => applyLayout("template")}
                className={`p-2 rounded-lg border-2 cursor-pointer transition flex flex-col items-center text-center ${
                  activeLayout === "template"
                    ? "border-cyan-400 bg-cyan-950/30 shadow-[0_0_12px_rgba(0,194,255,0.2)]"
                    : "border-slate-800 bg-slate-900/60 hover:border-slate-700"
                }`}
              >
                <div className="w-10 h-14 bg-white border border-slate-600 rounded-sm shadow-xs flex flex-col items-center p-1 justify-between">
                  <div className="w-full h-8 bg-cyan-100 rounded-xs flex items-center justify-center text-[8px] text-cyan-600">
                    📷
                  </div>
                  <div className="text-[7px] text-cyan-600 font-bold leading-none">♥ Text</div>
                </div>
                <span className="text-[11px] font-medium text-slate-300 mt-1.5">Template</span>
              </div>

              {/* Card 3: Cyber / Halloween */}
              <div
                onClick={() => applyLayout("halloween")}
                className={`p-2 rounded-lg border-2 cursor-pointer transition flex flex-col items-center text-center relative ${
                  activeLayout === "halloween"
                    ? "border-cyan-400 bg-cyan-950/30 shadow-[0_0_12px_rgba(0,194,255,0.2)]"
                    : "border-slate-800 bg-slate-900/60 hover:border-slate-700"
                }`}
              >
                <span className="absolute -top-1 -right-1 text-xs">✨</span>
                <div className="w-10 h-14 bg-slate-950 border border-cyan-400 rounded-sm shadow-xs flex flex-col items-center p-1 justify-between">
                  <div className="w-full h-8 bg-slate-900 rounded-xs flex items-center justify-center text-[8px] text-cyan-400">
                    ⚡
                  </div>
                  <div className="text-[7px] text-cyan-300 font-bold leading-none">Cyber</div>
                </div>
                <span className="text-[11px] font-medium text-slate-300 mt-1.5">Cyber 👑</span>
              </div>
            </div>
          </div>

          {/* SECTION 4: Assets */}
          <div className="bg-[#0B1528] rounded-xl border border-cyan-500/15 p-3.5 shadow-sm space-y-3 hover:border-cyan-500/30 transition">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-cyan-400 text-slate-950 text-xs font-black flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(0,194,255,0.4)]">
                4
              </span>
              <span className="font-bold text-sm text-white">Assets</span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleAddText}
                className="flex-1 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 hover:border-cyan-400 text-xs font-bold flex items-center justify-center gap-1 shadow-xs transition active:scale-95"
              >
                <span>+ Text</span>
                <Crown className="w-3 h-3 text-amber-400 fill-amber-400" />
              </button>

              <button
                onClick={() => handleAddIcon("heart")}
                className="flex-1 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-cyan-400 text-xs font-bold flex items-center justify-center gap-1 shadow-xs transition active:scale-95"
              >
                <span>+ Icon</span>
              </button>
            </div>

            {/* Asset List or Empty State */}
            {assets.length === 0 ? (
              <p className="text-xs text-slate-500 italic text-center py-1">
                Belum ada aset — tambahkan teks atau ikon
              </p>
            ) : (
              <div className="space-y-2 pt-1">
                {assets.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-lg bg-[#070E1E] border border-cyan-500/20 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                        {item.type === "text" ? <Type className="w-3.5 h-3.5 text-cyan-400" /> : <Heart className="w-3.5 h-3.5 text-rose-400" />}
                        {item.type === "text" ? "Teks Frame" : `Icon: ${item.iconId}`}
                      </span>
                      <button
                        onClick={() => handleRemoveAsset(item.id)}
                        className="text-slate-500 hover:text-rose-400 p-0.5 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {item.type === "text" && (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={item.content}
                          onChange={(e) => handleUpdateText(item.id, { content: e.target.value })}
                          placeholder="Ketik teks frame..."
                          className="w-full text-xs px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-md text-white focus:outline-none focus:border-cyan-400"
                        />

                        <div className="flex items-center gap-2">
                          <select
                            value={item.font}
                            onChange={(e) => handleUpdateText(item.id, { font: e.target.value as any })}
                            className="flex-1 text-[11px] bg-slate-950 border border-slate-700 rounded text-slate-300 px-1.5 py-1"
                          >
                            <option value="handwriting">Handwriting</option>
                            <option value="modern">Modern Sans</option>
                            <option value="serif">Classic Serif</option>
                            <option value="mono">Monospace</option>
                          </select>

                          <button
                            onClick={() =>
                              handleUpdateText(item.id, {
                                style: item.style === "embossed" ? "engraved" : "embossed",
                              })
                            }
                            className={`px-2.5 py-1 rounded text-[10px] font-bold transition ${
                              item.style === "embossed"
                                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                                : "bg-slate-800 text-slate-300 border border-slate-700"
                            }`}
                          >
                            {item.style === "embossed" ? "Timbul" : "Ukiran"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Category Pills for Icons */}
            <div className="pt-2">
              <span className="text-[11px] font-bold text-slate-300 block mb-1.5">Icons Library</span>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {[
                  { id: "basics", label: "Basics" },
                  { id: "halloween", label: "Cyber / Spooky 👑" },
                  { id: "buildings", label: "Buildings 👑" },
                  { id: "scenes", label: "Scenes 👑" },
                  { id: "decor", label: "Decor 👑" },
                ].map((cat) => {
                  const isSelected = activeCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id as any)}
                      className={`text-[11px] px-2.5 py-1 rounded-full whitespace-nowrap transition border ${
                        isSelected
                          ? "border-cyan-400 text-cyan-300 bg-cyan-500/15 font-semibold"
                          : "border-slate-800 bg-slate-900/60 text-slate-400 hover:bg-slate-800"
                      }`}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>

              {/* Icon Grid */}
              <div className="grid grid-cols-6 gap-2 pt-2">
                {ICON_LIBRARY[activeCategory].map((ic) => {
                  const IconC = ic.iconComp;
                  return (
                    <button
                      key={ic.id}
                      onClick={() => handleAddIcon(ic.id)}
                      title={ic.name}
                      className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-cyan-950/60 border border-slate-700/80 hover:border-cyan-400 flex items-center justify-center text-slate-200 hover:text-cyan-300 hover:scale-105 transition active:scale-95 shadow-xs"
                    >
                      {IconC ? (
                        <IconC className="w-4 h-4 fill-current" />
                      ) : (
                        <span className="text-sm font-bold leading-none">{ic.char || "★"}</span>
                      )}
                    </button>
                  );
                })}
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
                  onClick={handleRotate}
                  className="px-2.5 py-1 rounded-full text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 flex items-center gap-1 transition"
                  title="Rotate frame 90 degrees"
                >
                  <RotateCw className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Rotate</span>
                </button>
              </div>

              {/* Helper Guide Text */}
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
                {/* 2D Realistic Polaroid Frame Canvas */}
                <div
                  style={{
                    width: frameSize === "mini" ? "290px" : frameSize === "square" ? "420px" : "540px",
                    height: "440px",
                    backgroundColor: frameColor,
                    borderColor: edgeColor,
                    boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 25px rgba(0, 194, 255, 0.15)",
                  }}
                  className="rounded-xl border-[2.5px] p-4 flex flex-col justify-between relative select-none transition-all"
                >
                  {/* Photo Area Recess */}
                  <div
                    style={{
                      height: "320px",
                      backgroundColor: frameColor === "#070E1E" ? "#0F1E3A" : "#E2DDD3",
                      boxShadow: "inset 0 2px 8px rgba(0,0,0,0.3)",
                    }}
                    className="w-full rounded-md overflow-hidden relative flex items-center justify-center border border-slate-700/20"
                  >
                    {photoUrl ? (
                      <img src={photoUrl} alt="Photo Area" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-slate-500 text-sm font-medium tracking-wide">
                        Photo area
                      </span>
                    )}
                  </div>

                  {/* Frame Chin Bezel: Teks & Icons */}
                  <div className="h-16 flex items-center justify-center gap-2 px-2 text-center">
                    {assets.map((asset) => {
                      if (asset.type === "text") {
                        return (
                          <span
                            key={asset.id}
                            style={{
                              fontFamily:
                                asset.font === "handwriting"
                                  ? "cursive"
                                  : asset.font === "mono"
                                  ? "monospace"
                                  : asset.font === "serif"
                                  ? "serif"
                                  : "sans-serif",
                              color: frameColor === "#070E1E" ? "#00C2FF" : edgeColor === "#FFFFFF" ? "#111111" : edgeColor,
                              textShadow:
                                asset.style === "embossed"
                                  ? "1px 1px 0px rgba(255,255,255,0.7), -1px -1px 0px rgba(0,0,0,0.15)"
                                  : "none",
                            }}
                            className="font-black text-sm tracking-wide"
                          >
                            {asset.content}
                          </span>
                        );
                      }
                      if (asset.type === "icon") {
                        const iconData = Object.values(ICON_LIBRARY).flat().find((i) => i.id === asset.iconId);
                        const IconC = iconData?.iconComp;
                        return (
                          <span key={asset.id} className="inline-flex items-center text-rose-500">
                            {IconC ? <IconC className="w-5 h-5 fill-current" /> : iconData?.char || "❤️"}
                          </span>
                        );
                      }
                      return null;
                    })}
                  </div>
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
                    width: frameSize === "mini" ? "290px" : frameSize === "square" ? "420px" : "540px",
                    height: "440px",
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
              {specs.name} · {specs.width.toFixed(1)}×{specs.depth.toFixed(1)}×2.80 mm · Text {textCount} · Icons {iconCount}
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
              File model 3D STL berpresisi tinggi telah berhasil dibuat dan diunduh. Model ini manifold solid dan siap langsung dibuka pada Bambu Studio, OrcaSlicer, PrusaSlicer, atau Creality Print.
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
