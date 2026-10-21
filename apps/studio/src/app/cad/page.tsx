"use client";

import React, { useState, useEffect, useRef, useMemo, Suspense } from "react";
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
    height: 2.5,
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
    height: 2.5,
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
    height: 2.5,
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
  const [edgeColor, setEdgeColor] = useState<string>("#111111");

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
  const [language, setLanguage] = useState<"en" | "id">("en");

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
      setEdgeColor("#111111");
    } else if (layout === "template") {
      setFrameColor("#FFFFFF");
      setEdgeColor("#111111");
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
      setFrameColor("#1A1A1A");
      setEdgeColor("#E86020");
      setAssets([
        {
          id: "text-hw",
          type: "text",
          content: "SPOOKY NIGHT",
          font: "modern",
          style: "embossed",
          align: "center",
          size: 13,
        },
        {
          id: "icon-hw",
          type: "icon",
          iconId: "pumpkin",
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
  // 3D Engine: Construct Manifold Model & Render Scene
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (viewMode !== "3d" || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 800;
    const height = containerRef.current.clientHeight || 560;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#FAF7F2");

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1500);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    containerRef.current.innerHTML = "";
    containerRef.current.appendChild(renderer.domElement);
    threeRendererRef.current = renderer;

    // Lighting
    const hemiLight = new THREE.HemisphereLight(0xfffbf5, 0xe2ded4, 0.9);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(90, 160, 110);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.bias = -0.0002;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xedf2f7, 0.85);
    fillLight.position.set(-100, 80, -70);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffedd5, 0.6);
    rimLight.position.set(0, 120, -140);
    scene.add(rimLight);

    // Build Plate Grid
    const grid = new THREE.GridHelper(260, 26, 0xd4cdc3, 0xeae4db);
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
      roughness: 0.38,
      metalness: 0.05,
    });
    frameResult.material = frameMat;
    frameResult.castShadow = true;
    frameResult.receiveShadow = true;

    // Reference for 1-click STL export
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
        color: new THREE.Color(edgeColor === "#111111" ? "#222222" : edgeColor),
        roughness: 0.35,
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

      setExportNotice(`File ${filename} berhasil diunduh!`);
      setShowExportModal(true);
    } catch (err: any) {
      alert("Gagal mengekspor file STL: " + (err?.message || err));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#FAF7F2] font-sans antialiased text-[#2D2A26] select-none overflow-hidden">
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TOP HEADER */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <header className="h-14 px-5 border-b border-[#EAE4D9] bg-[#FAF7F2] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-xs font-semibold text-neutral-600 hover:text-black transition"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Polaroid Frame Generator</span>
          </Link>

          <div className="h-4 w-[1px] bg-neutral-300 mx-1" />

          {/* Generator Badge & Title */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-[#C84A31] text-white flex items-center justify-center font-bold text-xs shadow-xs">
              +
            </div>
            <span className="font-bold text-sm text-neutral-900 tracking-tight">
              Polaroid Frame Generator
            </span>
          </div>
        </div>

        {/* Right Header Badges */}
        <div className="flex items-center gap-2.5">
          {/* Energy / Tokens Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-[#E4DDD2] text-xs font-medium text-neutral-700 shadow-2xs">
            <span className="text-amber-500 font-bold">🧪</span>
            <span className="font-mono font-bold text-neutral-900">148</span>
            <div className="w-4 h-4 rounded-full bg-neutral-200 text-neutral-600 flex items-center justify-center text-[10px] font-bold">
              U
            </div>
          </div>

          {/* Upgrade Pill */}
          <button className="flex items-center gap-1 px-3.5 py-1 rounded-full bg-[#E89519] hover:bg-[#D58310] text-white text-xs font-bold shadow-xs transition active:scale-95">
            Upgrade
          </button>

          {/* Language Dropdown */}
          <div className="relative">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as any)}
              className="appearance-none bg-white border border-[#E4DDD2] rounded-full text-xs font-medium text-neutral-700 py-1 pl-3 pr-7 focus:outline-none cursor-pointer shadow-2xs"
            >
              <option value="en">English</option>
              <option value="id">Bahasa Indonesia</option>
            </select>
            <ChevronDown className="w-3 h-3 text-neutral-400 absolute right-2.5 top-2 pointer-events-none" />
          </div>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* WORKSPACE: LEFT SETTINGS PANEL + RIGHT MAIN CANVAS */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT SETTINGS SIDEBAR */}
        <aside className="w-[370px] bg-[#FAF8F5] border-r border-[#EAE4D9] flex flex-col shrink-0 overflow-y-auto p-4 space-y-4">
          {/* SECTION 1: Frame Specs */}
          <div className="bg-white rounded-xl border border-[#ECE6DC] p-3.5 shadow-2xs space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#C84A31] text-white text-xs font-bold flex items-center justify-center shrink-0">
                1
              </span>
              <span className="font-bold text-sm text-neutral-900">Frame Specs</span>
            </div>

            {/* Size Switcher */}
            <div>
              <label className="text-[11px] font-medium text-neutral-500 mb-1 block">Size</label>
              <div className="flex items-center gap-2">
                {(["mini", "square", "wide"] as FrameSize[]).map((sz) => {
                  const isSelected = frameSize === sz;
                  return (
                    <button
                      key={sz}
                      onClick={() => setFrameSize(sz)}
                      className={`flex-1 py-1.5 px-2 rounded-full text-xs font-bold uppercase transition tracking-wider border ${
                        isSelected
                          ? "border-[#C84A31] text-[#C84A31] bg-[#FFF5F2] shadow-2xs"
                          : "border-transparent bg-[#F0EBE1] text-neutral-600 hover:bg-[#EAE4D6]"
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
              <label className="text-[11px] font-medium text-neutral-500 mb-1 block">Backplate</label>
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
                      className={`flex-1 py-1.5 px-1.5 rounded-full text-xs font-medium transition border ${
                        isSelected
                          ? "border-[#C84A31] text-[#C84A31] bg-[#FFF5F2] font-semibold shadow-2xs"
                          : "border-transparent bg-[#F0EBE1] text-neutral-600 hover:bg-[#EAE4D6]"
                      }`}
                    >
                      {bp.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Color & Edge Pickers */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-600 font-medium">Color</span>
                <button
                  onClick={() => setFrameColor(frameColor === "#FFFFFF" ? "#FAF0D7" : frameColor === "#FAF0D7" ? "#1A1A1A" : "#FFFFFF")}
                  style={{ backgroundColor: frameColor }}
                  className="w-5 h-5 rounded-full border border-neutral-300 shadow-2xs transition hover:scale-110"
                  title="Click to toggle frame color"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-600 font-medium">Edge</span>
                <button
                  onClick={() => setEdgeColor(edgeColor === "#111111" ? "#E86020" : edgeColor === "#E86020" ? "#00C2FF" : "#111111")}
                  style={{ backgroundColor: edgeColor }}
                  className="w-5 h-5 rounded-full border border-neutral-400 shadow-2xs transition hover:scale-110"
                  title="Click to toggle edge stroke color"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: Upload Photo */}
          <div className="bg-white rounded-xl border border-[#ECE6DC] p-3.5 shadow-2xs space-y-2.5">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#C84A31] text-white text-xs font-bold flex items-center justify-center shrink-0">
                2
              </span>
              <span className="font-bold text-sm text-neutral-900">Upload Photo</span>
            </div>

            {/* Upload Area */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePhotoUpload}
              accept="image/*"
              className="hidden"
            />

            {photoUrl ? (
              <div className="relative rounded-lg overflow-hidden border border-neutral-200 bg-neutral-50 p-2 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img src={photoUrl} alt="Uploaded" className="w-10 h-10 object-cover rounded-md border" />
                  <span className="text-xs font-medium text-neutral-700 truncate max-w-[170px]">Foto terpasang</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[11px] font-semibold text-neutral-600 hover:text-black px-2 py-1 bg-neutral-200/60 rounded"
                  >
                    Ganti
                  </button>
                  <button
                    onClick={handleRemovePhoto}
                    className="p-1 text-red-500 hover:bg-red-50 rounded"
                    title="Hapus foto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="h-20 rounded-lg border border-dashed border-[#D5CEC2] bg-[#F4EFE7] hover:bg-[#EBE4D8] transition cursor-pointer flex flex-col items-center justify-center gap-1 text-neutral-500 group"
              >
                <Upload className="w-5 h-5 text-neutral-500 group-hover:-translate-y-0.5 transition" />
                <span className="text-[11px] font-medium text-neutral-600">Klik untuk upload foto</span>
              </div>
            )}
          </div>

          {/* SECTION 3: Layouts */}
          <div className="bg-white rounded-xl border border-[#ECE6DC] p-3.5 shadow-2xs space-y-2.5">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#C84A31] text-white text-xs font-bold flex items-center justify-center shrink-0">
                3
              </span>
              <span className="font-bold text-sm text-neutral-900">Layouts</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {/* Card 1: Blank */}
              <div
                onClick={() => applyLayout("blank")}
                className={`p-2 rounded-lg border-2 cursor-pointer transition flex flex-col items-center text-center ${
                  activeLayout === "blank"
                    ? "border-[#C84A31] bg-[#FFF8F6] shadow-2xs"
                    : "border-neutral-200 bg-white hover:border-neutral-300"
                }`}
              >
                <div className="w-10 h-14 bg-white border border-neutral-300 rounded-sm shadow-xs flex flex-col items-center p-1 justify-between">
                  <div className="w-full h-8 bg-neutral-200/70 rounded-xs" />
                  <div className="w-5 h-0.5 bg-neutral-300 rounded" />
                </div>
                <span className="text-[11px] font-bold text-neutral-800 mt-1.5">Blank</span>
              </div>

              {/* Card 2: Template */}
              <div
                onClick={() => applyLayout("template")}
                className={`p-2 rounded-lg border-2 cursor-pointer transition flex flex-col items-center text-center ${
                  activeLayout === "template"
                    ? "border-[#C84A31] bg-[#FFF8F6] shadow-2xs"
                    : "border-neutral-200 bg-white hover:border-neutral-300"
                }`}
              >
                <div className="w-10 h-14 bg-white border border-neutral-300 rounded-sm shadow-xs flex flex-col items-center p-1 justify-between">
                  <div className="w-full h-8 bg-sky-100 rounded-xs flex items-center justify-center text-[8px] text-sky-400">
                    📷
                  </div>
                  <div className="text-[7px] text-rose-500 font-bold leading-none">♥ Text</div>
                </div>
                <span className="text-[11px] font-medium text-neutral-700 mt-1.5">Template</span>
              </div>

              {/* Card 3: Halloween */}
              <div
                onClick={() => applyLayout("halloween")}
                className={`p-2 rounded-lg border-2 cursor-pointer transition flex flex-col items-center text-center relative ${
                  activeLayout === "halloween"
                    ? "border-[#C84A31] bg-[#FFF8F6] shadow-2xs"
                    : "border-neutral-200 bg-white hover:border-neutral-300"
                }`}
              >
                <span className="absolute -top-1 -right-1 text-xs">🎁</span>
                <div className="w-10 h-14 bg-neutral-900 border border-orange-500 rounded-sm shadow-xs flex flex-col items-center p-1 justify-between">
                  <div className="w-full h-8 bg-neutral-800 rounded-xs flex items-center justify-center text-[8px]">
                    🎃
                  </div>
                  <div className="text-[7px] text-orange-400 font-bold leading-none">Spooky</div>
                </div>
                <span className="text-[11px] font-medium text-neutral-700 mt-1.5">Halloween</span>
              </div>
            </div>
          </div>

          {/* SECTION 4: Assets */}
          <div className="bg-white rounded-xl border border-[#ECE6DC] p-3.5 shadow-2xs space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#C84A31] text-white text-xs font-bold flex items-center justify-center shrink-0">
                4
              </span>
              <span className="font-bold text-sm text-neutral-900">Assets</span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleAddText}
                className="flex-1 py-1.5 rounded-full bg-[#F0EBE1] hover:bg-[#E6E0D4] text-neutral-800 text-xs font-bold flex items-center justify-center gap-1 shadow-2xs transition active:scale-95"
              >
                <span>+ Text</span>
                <span className="text-amber-500 text-[10px]">👑</span>
              </button>

              <button
                onClick={() => handleAddIcon("heart")}
                className="flex-1 py-1.5 rounded-full bg-[#F0EBE1] hover:bg-[#E6E0D4] text-neutral-800 text-xs font-bold flex items-center justify-center gap-1 shadow-2xs transition active:scale-95"
              >
                <span>+ Icon</span>
              </button>
            </div>

            {/* Asset List or Empty State */}
            {assets.length === 0 ? (
              <p className="text-xs text-neutral-400 italic text-center py-1">
                No assets yet — add text or an icon
              </p>
            ) : (
              <div className="space-y-2 pt-1">
                {assets.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-lg bg-[#FAF7F2] border border-[#EAE4D9] space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                        {item.type === "text" ? <Type className="w-3.5 h-3.5 text-[#C84A31]" /> : <Heart className="w-3.5 h-3.5 text-[#C84A31]" />}
                        {item.type === "text" ? "Teks Frame" : `Icon: ${item.iconId}`}
                      </span>
                      <button
                        onClick={() => handleRemoveAsset(item.id)}
                        className="text-neutral-400 hover:text-red-500 p-0.5"
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
                          className="w-full text-xs px-2.5 py-1.5 bg-white border border-[#D5CEC2] rounded-md focus:outline-none focus:border-[#C84A31]"
                        />

                        <div className="flex items-center gap-2">
                          <select
                            value={item.font}
                            onChange={(e) => handleUpdateText(item.id, { font: e.target.value as any })}
                            className="flex-1 text-[11px] bg-white border border-[#D5CEC2] rounded px-1.5 py-1"
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
                            className={`px-2 py-1 rounded text-[10px] font-bold ${
                              item.style === "embossed"
                                ? "bg-amber-100 text-amber-800 border border-amber-300"
                                : "bg-neutral-200 text-neutral-700"
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
              <span className="text-[11px] font-bold text-neutral-600 block mb-1.5">Icons</span>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {[
                  { id: "basics", label: "Basics" },
                  { id: "halloween", label: "Halloween 👑" },
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
                          ? "border-[#C84A31] text-[#C84A31] bg-[#FFF5F2] font-semibold"
                          : "border-transparent bg-[#F0EBE1] text-neutral-600 hover:bg-[#EAE4D6]"
                      }`}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>

              {/* Silhouette Icon Grid */}
              <div className="grid grid-cols-6 gap-2 pt-2">
                {ICON_LIBRARY[activeCategory].map((ic) => {
                  const IconC = ic.iconComp;
                  return (
                    <button
                      key={ic.id}
                      onClick={() => handleAddIcon(ic.id)}
                      title={ic.name}
                      className="w-8 h-8 rounded-lg bg-[#FAF7F2] hover:bg-[#EAE4D6] border border-[#E0D9CD] flex items-center justify-center text-neutral-800 hover:scale-105 transition active:scale-95 shadow-2xs"
                    >
                      {IconC ? (
                        <IconC className="w-4 h-4 text-neutral-800 fill-current" />
                      ) : (
                        <span className="text-sm font-bold text-neutral-800 leading-none">{ic.char || "★"}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </aside>

        {/* ───────────────────────────────────────────────────────────────── */}
        {/* RIGHT MAIN CANVAS AREA */}
        {/* ───────────────────────────────────────────────────────────────── */}
        <main
          className="flex-1 relative overflow-hidden flex flex-col justify-between"
          style={{
            backgroundColor: "#FAF7F2",
            backgroundImage: "radial-gradient(#D5CEC2 1.3px, transparent 1.3px)",
            backgroundSize: "20px 20px",
          }}
        >
          {/* FLOATING TOP BAR: View Switcher (Left) + Export Button (Right) */}
          <div className="p-5 flex items-start justify-between pointer-events-none z-10">
            {/* View Switcher Pills */}
            <div className="pointer-events-auto flex flex-col items-start">
              <div className="flex items-center gap-1 p-1 rounded-full bg-[#EFEAE2]/90 backdrop-blur-md border border-[#DFD8CC] shadow-sm">
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
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                        isActive
                          ? "bg-[#C84A31] text-white shadow-xs"
                          : "text-neutral-600 hover:text-black hover:bg-neutral-200/50"
                      }`}
                    >
                      {vm.label}
                    </button>
                  );
                })}

                <button
                  onClick={handleRotate}
                  className="px-2.5 py-1 rounded-full text-xs font-semibold text-neutral-700 hover:bg-neutral-200/50 flex items-center gap-1 transition"
                  title="Rotate frame 90 degrees"
                >
                  <RotateCw className="w-3.5 h-3.5 text-neutral-600" />
                  <span>Rotate</span>
                </button>
              </div>

              {/* Helper Guide Text */}
              <div className="text-[11px] text-[#8C8477] font-medium leading-tight mt-2 select-none space-y-0.5">
                <p>Click to select · arrows to nudge · Delete to remove</p>
                <p>Scale corners, stretch edges</p>
                <p>Right-click for more</p>
              </div>
            </div>

            {/* Export Button */}
            <div className="pointer-events-auto">
              <button
                onClick={handleExportSTL}
                disabled={isExporting}
                className="flex items-center gap-2 px-5 py-2 rounded-full bg-[#C84A31] hover:bg-[#B33E27] active:scale-95 text-white font-bold text-sm shadow-md hover:shadow-lg transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
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
                {/* 2D Realistic Polaroid Frame Canvas matching Screenshot */}
                <div
                  style={{
                    width: frameSize === "mini" ? "290px" : frameSize === "square" ? "420px" : "540px",
                    height: "440px",
                    backgroundColor: frameColor,
                    borderColor: edgeColor,
                    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.22), 0 0 0 1px rgba(0, 0, 0, 0.06)",
                  }}
                  className="rounded-xl border-[2.5px] p-4 flex flex-col justify-between relative select-none transition-all"
                >
                  {/* Photo Area Recess */}
                  <div
                    style={{
                      height: "320px",
                      backgroundColor: "#E8E4DC",
                      boxShadow: "inset 0 2px 6px rgba(0,0,0,0.18)",
                    }}
                    className="w-full rounded-md overflow-hidden relative flex items-center justify-center"
                  >
                    {photoUrl ? (
                      <img src={photoUrl} alt="Photo Area" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[#8C8477] text-sm font-medium tracking-wide">
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
                              color: edgeColor === "#FFFFFF" ? "#111111" : edgeColor,
                              textShadow:
                                asset.style === "embossed"
                                  ? "1px 1px 0px rgba(255,255,255,0.7), -1px -1px 0px rgba(0,0,0,0.15)"
                                  : "none",
                            }}
                            className="font-bold text-sm tracking-wide"
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
                    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.22)",
                  }}
                  className="rounded-xl border-[2.5px] p-5 flex flex-col justify-between relative select-none"
                >
                  {/* Photo Slot Insertion Guide */}
                  <div className="w-full flex flex-col items-center gap-1 border-b border-dashed border-neutral-300 pb-3">
                    <div className="w-3/4 h-2 bg-neutral-200 rounded-full" />
                    <span className="text-[10px] text-neutral-400 font-mono">↓ Insert Photo Slot</span>
                  </div>

                  {/* Magnet Holes or Stand Bracket preview */}
                  <div className="flex-1 flex flex-col items-center justify-center gap-4">
                    {backplate === "magnet" && (
                      <div className="w-full flex justify-between px-4">
                        <div className="w-6 h-6 rounded-full border-2 border-neutral-400 bg-neutral-200 flex items-center justify-center text-[9px] font-mono text-neutral-500">
                          10mm
                        </div>
                        <div className="w-6 h-6 rounded-full border-2 border-neutral-400 bg-neutral-200 flex items-center justify-center text-[9px] font-mono text-neutral-500">
                          10mm
                        </div>
                      </div>
                    )}

                    {backplate === "stand" && (
                      <div className="w-32 h-10 rounded-lg border border-neutral-300 bg-neutral-100 flex items-center justify-center text-[10px] text-neutral-600 font-medium">
                        Stand Socket (14° Tilt)
                      </div>
                    )}

                    <span className="text-xs text-neutral-400 font-mono uppercase tracking-widest">
                      GooOS MakerLab
                    </span>
                  </div>

                  <div className="text-center text-[10px] text-neutral-400 font-mono">
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

          {/* BOTTOM STATUS BAR (Matching Screenshot bottom-left: 'instax mini · 57.8×89.8×2.00 mm · Text 0 · Icons 0') */}
          <div className="px-5 py-2.5 flex items-center justify-between text-xs text-[#8C8477] font-mono select-none z-10 pointer-events-none">
            <div>
              {specs.name} · {specs.width.toFixed(1)}×{specs.depth.toFixed(1)}×2.00 mm · Text {textCount} · Icons {iconCount}
            </div>
            <div className="pointer-events-auto flex items-center gap-3 text-[11px]">
              <span>Weight: ~{specs.weight}</span>
              <span>•</span>
              <span>Time: ~{specs.printTime}</span>
            </div>
          </div>
        </main>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* EXPORT CONFIRMATION MODAL */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-neutral-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-600">
                <CheckCircle2 className="w-6 h-6" />
                <h3 className="font-bold text-base text-neutral-900">Model STL Siap Dicetak!</h3>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-neutral-400 hover:text-black p-1 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-neutral-600">
              File model 3D STL berhasil diunduh. Model ini sudah dioptimalkan (manifold solid) dan siap langsung dibuka di Bambu Studio, OrcaSlicer, PrusaSlicer, atau Cura.
            </p>

            <div className="bg-neutral-50 rounded-xl p-3 border border-neutral-200 space-y-1.5 text-xs text-neutral-700">
              <div className="flex justify-between">
                <span className="text-neutral-500">Format:</span>
                <span className="font-bold uppercase">{specs.name} ({specs.width}×{specs.depth} mm)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Backplate:</span>
                <span className="font-bold capitalize">{backplate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Estimasi Berat:</span>
                <span className="font-bold">{specs.weight} PLA</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Estimasi Waktu Cetak:</span>
                <span className="font-bold">{specs.printTime}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleExportSTL}
                className="flex-1 py-2 rounded-xl bg-[#C84A31] hover:bg-[#B33E27] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Ulang STL</span>
              </button>
              <button
                onClick={() => setShowExportModal(false)}
                className="py-2 px-4 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold text-xs transition"
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
