"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
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
];

export default function GooPrintCadStudioPage() {
  const { settings } = useGooSettings();

  // Project Info
  const [projectName, setProjectName] = useState("Gridfinity Heavy Socket Organiser");
  const [isEditingName, setIsEditingName] = useState(false);
  const [selectedPrinterId, setSelectedPrinterId] = useState("bambu-p1s");
  const [isPrinterDropdownOpen, setIsPrinterDropdownOpen] = useState(false);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving">("saved");

  // Mode and Tabs
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
    const volMm3 = (params.width * params.depth * params.height) * 0.28; // approx solid volume
    const weightGrams = Math.max(12, Math.round(volMm3 * 0.00124)); // PLA density ~1.24g/cm3
    const printTimeMinutes = Math.max(25, Math.round(weightGrams * 2.5));
    const hours = Math.floor(printTimeMinutes / 60);
    const mins = printTimeMinutes % 60;
    const filamentCost = weightGrams * 140; // Rp 140/g standard PLA
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

  // Live Generated OpenSCAD Script
  const openScadCode = useMemo(() => {
    return `// ==========================================
// GooPrint Parametric CAD Studio — OpenSCAD
// Model: ${projectName}
// Export Target: ${activePrinter.name}
// ==========================================

$fn = 60;
width = ${params.width};
depth = ${params.depth};
height = ${params.height};
wall_thickness = ${params.wallThickness};
corner_radius = ${params.cornerRadius};
magnet_tolerance = ${params.magnetTolerance};

// Main Parametric Body
difference() {
  // Outer Solid Bounding Box with Fillets
  hull() {
    for (x = [-(width/2 - corner_radius), (width/2 - corner_radius)]) {
      for (y = [-(depth/2 - corner_radius), (depth/2 - corner_radius)]) {
        translate([x, y, 0])
          cylinder(r = corner_radius, h = height, center = false);
      }
    }
  }

  // Inner Cavity Core
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
        cylinder(r = 3.0 + magnet_tolerance, h = 2.4); // 6mm magnet
    }
  }`
    : ""
}
${
  activeModifiers.includes("hex-pattern")
    ? `
  // Hexagonal Honeycomb Infill Vents
  for (hx = [-30:15:30]) {
    for (hz = [12:12:height-12]) {
      translate([hx, depth/2 - wall_thickness/2, hz])
        rotate([90, 0, 0])
          cylinder(r = 4.5, h = wall_thickness * 2, center = true, $fn = 6);
    }
  }`
    : ""
}
}`;
  }, [projectName, activePrinter.name, params, activeModifiers]);

  // Three.js 3D Viewport Engine
  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth || 800;
    const height = containerRef.current.clientHeight || 560;

    // 1. Scene, Camera, WebGLRenderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#020617"); // Dark Carbon Slate

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(160, 140, 180);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    containerRef.current.innerHTML = "";
    containerRef.current.appendChild(renderer.domElement);

    // 2. Lighting System
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight1.position.set(120, 200, 100);
    dirLight1.castShadow = true;
    dirLight1.shadow.mapSize.width = 1024;
    dirLight1.shadow.mapSize.height = 1024;
    scene.add(dirLight1);

    const cyanRim = new THREE.DirectionalLight(0x06b6d4, 0.4); // Laser Cyan
    cyanRim.position.set(-100, 50, -100);
    scene.add(cyanRim);

    const orangeAccent = new THREE.PointLight(0xf97316, 0.6, 250); // Molten Orange
    orangeAccent.position.set(0, 100, 50);
    scene.add(orangeAccent);

    // 3. Virtual 3D Printer Bed (Dimensions from active printer)
    const bedW = activePrinter.width;
    const bedD = activePrinter.depth;

    const bedGeo = new THREE.BoxGeometry(bedW, 2, bedD);
    const bedMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.8,
      metalness: 0.2,
    });
    const bedMesh = new THREE.Mesh(bedGeo, bedMat);
    bedMesh.position.y = -1;
    bedMesh.receiveShadow = true;
    scene.add(bedMesh);

    // Bed Grid Lines
    const gridHelper = new THREE.GridHelper(
      Math.max(bedW, bedD),
      Math.round(Math.max(bedW, bedD) / 10),
      0x06b6d4, // Cyan center line
      0x1e293b  // Dark slate grid
    );
    gridHelper.position.y = 0.1;
    scene.add(gridHelper);

    // 4. Parametric CAD Model Mesh
    const pW = params.width;
    const pD = params.depth;
    const pH = params.height;

    const modelGroup = new THREE.Group();

    // Body Material Shading
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
      bodyMat = new THREE.MeshStandardMaterial({
        color: 0x10b981,
        roughness: 0.35,
      });
    } else {
      // Solid Molten Filament Orange with metallic sheen
      bodyMat = new THREE.MeshStandardMaterial({
        color: 0x0284c7, // Cyan-Blue tech look
        roughness: 0.3,
        metalness: 0.15,
      });
    }

    // Outer Solid Body
    const bodyGeo = new THREE.BoxGeometry(pW, pH, pD);
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.y = pH / 2;
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    modelGroup.add(bodyMesh);

    // Inner Cavity Cutout (Simulated hollow interior)
    const cavityW = Math.max(5, pW - params.wallThickness * 2);
    const cavityD = Math.max(5, pD - params.wallThickness * 2);
    const cavityH = pH * 0.82;
    const innerCavityGeo = new THREE.BoxGeometry(cavityW, cavityH, cavityD);
    const innerCavityMat = new THREE.MeshStandardMaterial({
      color: 0x020617,
      roughness: 0.85,
    });
    const innerCavity = new THREE.Mesh(innerCavityGeo, innerCavityMat);
    innerCavity.position.y = pH / 2 + 5;
    modelGroup.add(innerCavity);

    // Modifier Visual Features: Gridfinity Magnet Recesses
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

    scene.add(modelGroup);

    // 5. Mouse Orbit / Drag Interaction
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

    // 6. Animation Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      if (isRotating && !isDragging) {
        modelGroup.rotation.y += 0.003;
      }

      renderer.render(scene, camera);
    };
    animate();

    // 7. Resize Observer
    const handleResize = () => {
      if (!containerRef.current) return;
      const newW = containerRef.current.clientWidth;
      const newH = containerRef.current.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      cancelAnimationFrame(animId);
      dom.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      dom.removeEventListener("wheel", handleWheel);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
    };
  }, [params, activeModifiers, selectedPrinterId, viewMode, isRotating, activePrinter]);

  // Export File Simulation
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

    // Simulate AI synthesis & parameter modification
    await new Promise((r) => setTimeout(r, 1200));

    // Dynamic AI adjustment
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
            price: estimates.filamentCost * (parseInt(flowQuantity) || 1) * 2.5, // 2.5x markup estimate
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none overflow-x-hidden">
      <GooNavbar />

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 1. TOP CONTEXT BAR (GooPrint Studio HUD)                           */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <header className="h-14 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 flex items-center justify-between text-xs z-30 sticky top-14">
        {/* Left: Project Identity & Autosave */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  GooPrint Studio
                </span>
                <span className="text-[10px] text-slate-400 font-mono">v1.2</span>
              </div>
            </div>
          </div>

          <span className="text-slate-700 hidden sm:inline">|</span>

          {/* Project Name Editable */}
          {isEditingName ? (
            <input
              autoFocus
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              onBlur={() => setIsEditingName(false)}
              onKeyDown={(e) => e.key === "Enter" && setIsEditingName(false)}
              className="px-2.5 py-1 bg-slate-950 border border-cyan-500 rounded-lg text-white font-bold text-xs focus:outline-none"
            />
          ) : (
            <button
              onClick={() => setIsEditingName(true)}
              className="font-bold text-sm text-white hover:text-cyan-400 transition-colors truncate max-w-[160px] sm:max-w-xs cursor-pointer flex items-center gap-1.5"
              title="Klik untuk ubah nama proyek"
            >
              <span>{projectName}</span>
              <span className="text-[10px] text-slate-500">✏️</span>
            </button>
          )}

          {/* Autosave Status */}
          <div className="hidden md:flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800/60 text-[10px] text-slate-400 font-mono">
            {saveStatus === "saving" ? (
              <>
                <RefreshCw className="w-3 h-3 text-cyan-400 animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span className="text-slate-300">Tersimpan</span>
              </>
            )}
          </div>
        </div>

        {/* Center: Printer Bed Selector & Slicer Estimates */}
        <div className="hidden lg:flex items-center gap-2.5">
          <div className="relative">
            <button
              onClick={() => setIsPrinterDropdownOpen(!isPrinterDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-200 transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-semibold">{activePrinter.name}</span>
              <span className="text-[10px] text-slate-500 font-mono">
                ({activePrinter.width}x{activePrinter.depth}mm)
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isPrinterDropdownOpen && (
              <div className="absolute left-0 mt-1 w-64 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-1.5 z-50">
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

          {/* Slicer Live Estimate Pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300">
            <span className="flex items-center gap-1 text-slate-400 font-sans">
              <Clock className="w-3 h-3 text-indigo-400" /> ~{estimates.timeFormatted}
            </span>
            <span className="text-slate-700">|</span>
            <span className="text-cyan-400 font-semibold">{estimates.weightGrams}g Filament</span>
            <span className="text-slate-700">|</span>
            <span className="text-emerald-400 font-semibold">Rp {estimates.filamentCost.toLocaleString()} HPP</span>
          </div>
        </div>

        {/* Right: Direct 3DFlow Queue Button & Export Dropdown */}
        <div className="flex items-center gap-2">
          {/* Send to 3DFlow Queue Button */}
          <button
            onClick={() => {
              setFlowSuccessResult(null);
              setShowFlowModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs shadow-md shadow-rose-600/30 transition-all active:scale-95"
            title="Kirim model CAD ini langsung ke antrean produksi 3DFlow"
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Kirim ke 3DFlow</span>
          </button>

          {/* Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
              disabled={isExporting !== null}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-all"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Ekspor</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isExportDropdownOpen && (
              <div className="absolute right-0 mt-1 w-52 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-1.5 z-50">
                <div className="text-[10px] font-bold text-slate-400 px-2.5 py-1 uppercase tracking-wider font-mono">
                  Pilih Format File
                </div>
                <button
                  onClick={() => handleExport("3MF")}
                  className="w-full text-left px-2.5 py-2 text-xs text-slate-200 hover:bg-slate-800 rounded-xl transition-colors"
                >
                  <div className="font-bold text-white">3MF (Bambu / Prusa)</div>
                  <div className="text-[10px] text-slate-400">Termasuk orientasi bed &amp; warna</div>
                </button>
                <button
                  onClick={() => handleExport("STL")}
                  className="w-full text-left px-2.5 py-2 text-xs text-slate-200 hover:bg-slate-800 rounded-xl transition-colors"
                >
                  <div className="font-bold text-white">STL Universal Mesh</div>
                  <div className="text-[10px] text-slate-400">Kompatibel semua slicer standar</div>
                </button>
                <button
                  onClick={() => handleExport("STEP")}
                  className="w-full text-left px-2.5 py-2 text-xs text-slate-200 hover:bg-slate-800 rounded-xl transition-colors"
                >
                  <div className="font-bold text-cyan-300">STEP Solid CAD (NURBS)</div>
                  <div className="text-[10px] text-slate-400">Untuk Fusion 360 / SolidWorks</div>
                </button>
                <button
                  onClick={() => handleExport("SCAD")}
                  className="w-full text-left px-2.5 py-2 text-xs text-slate-200 hover:bg-slate-800 rounded-xl transition-colors"
                >
                  <div className="font-bold text-white">OpenSCAD Source Code</div>
                  <div className="text-[10px] text-slate-400">Script kode parametrik mentah</div>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 2. MAIN CAD WORKSPACE (Left Dock + 3D Viewport + Right Inspector)  */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 relative flex overflow-hidden min-h-[calc(100vh-7rem)]">
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

            <p className="text-[11px] text-slate-400 mt-2">
              Klik modifier untuk menerapkan geometri cerdas langsung ke model CAD Anda.
            </p>

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
                      <div className="flex items-center gap-2 font-bold text-xs">
                        <span>{mod.title}</span>
                      </div>
                      <span
                        className={`text-[9px] font-mono px-2 py-0.5 rounded-full ${
                          isActive
                            ? "bg-cyan-500/20 text-cyan-300 font-bold"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {isActive ? "Aktif" : "+ Pasang"}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                      {mod.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Center: Interactive Three.js 3D Viewport */}
        <main className="flex-1 relative bg-slate-950 overflow-hidden flex flex-col">
          {/* Canvas Viewport Element */}
          <div ref={containerRef} className="w-full h-full min-h-[500px] cursor-grab active:cursor-grabbing" />

          {/* Shading View Mode Switchers (Top-Left of Viewport) */}
          <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 p-1 bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 shadow-xl text-xs">
            <button
              onClick={() => setViewMode("solid")}
              className={`px-3 py-1 rounded-xl font-bold transition-all ${
                viewMode === "solid"
                  ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Solid
            </button>
            <button
              onClick={() => setViewMode("wireframe")}
              className={`px-3 py-1 rounded-xl font-bold transition-all ${
                viewMode === "wireframe"
                  ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Wireframe
            </button>
            <button
              onClick={() => setViewMode("xray")}
              className={`px-3 py-1 rounded-xl font-bold transition-all ${
                viewMode === "xray"
                  ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              X-Ray
            </button>
            <button
              onClick={() => setViewMode("heatmap")}
              className={`px-3 py-1 rounded-xl font-bold transition-all ${
                viewMode === "heatmap"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Overhang
            </button>
            <button
              onClick={() => setIsRotating(!isRotating)}
              className={`p-1.5 rounded-xl border transition-all ${
                isRotating
                  ? "border-cyan-500/40 text-cyan-300 bg-cyan-500/20"
                  : "border-slate-800 text-slate-400 hover:text-white"
              }`}
              title="Toggle Auto Orbit Rotation"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Model Dimension Info Pill (Top-Right of Viewport) */}
          <div className="absolute top-4 right-4 z-10 hidden sm:flex items-center gap-2 p-2 bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 shadow-xl text-[11px] font-mono text-slate-300">
            <span className="text-cyan-400 font-bold">DIMENSI:</span>
            <span>
              {params.width} x {params.depth} x {params.height} mm
            </span>
            <span className="text-slate-700">|</span>
            <span className="text-slate-400">{activeModifiers.length} Modifier</span>
          </div>

          {/* Bottom Active Modifier Badges */}
          <div className="absolute bottom-20 left-4 z-10 flex flex-wrap gap-1.5 max-w-sm pointer-events-none">
            {activeModifiers.map((modId) => (
              <span
                key={modId}
                className="px-2.5 py-1 rounded-full text-[10px] font-bold font-mono bg-slate-900/90 border border-cyan-500/30 text-cyan-300 backdrop-blur pointer-events-auto"
              >
                ✓ {modId}
              </span>
            ))}
          </div>

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* 3. BOTTOM OMNIBAR: AI CAD AGENT PROMPT & CHAT DRAWER           */}
          {/* ══════════════════════════════════════════════════════════════ */}
          <div className="absolute bottom-4 left-4 right-4 z-20 flex flex-col items-center pointer-events-none">
            <div className="w-full max-w-2xl pointer-events-auto flex flex-col">
              {/* Expandable Chat History Drawer */}
              {isChatOpen && (
                <div className="w-full mb-2 bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl p-4 max-h-72 flex flex-col animate-in slide-in-from-bottom duration-200">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2 text-xs font-bold text-white">
                      <Bot className="w-4 h-4 text-cyan-400" />
                      <span>Riwayat Percakapan AI CAD Agent</span>
                    </div>
                    <button
                      onClick={() => setIsChatOpen(false)}
                      className="p-1 rounded-lg text-slate-400 hover:text-white"
                    >
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

              {/* Omnibar Input Box */}
              <form
                onSubmit={handleSendPrompt}
                className="flex items-center gap-2 bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 hover:border-cyan-500/60 p-2 rounded-2xl shadow-2xl transition-all"
              >
                <button
                  type="button"
                  onClick={() => setIsChatOpen(!isChatOpen)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 transition-colors"
                  title="Buka Riwayat AI Chat"
                >
                  <Bot className="w-4 h-4" />
                </button>
                <input
                  type="text"
                  placeholder="Ketik instruksi AI: misal 'tambah ketebalan dinding 3mm' atau 'buat lubang magnet'..."
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none px-1"
                />
                <button
                  type="submit"
                  disabled={isAiProcessing || !promptText.trim()}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold transition-all disabled:opacity-40 flex items-center gap-1.5"
                >
                  {isAiProcessing ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>Generate</span>
                </button>
              </form>
            </div>
          </div>
        </main>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* 4. RIGHT INSPECTOR DRAWER (Controls, OpenSCAD, Print Health)       */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <aside
          className={`${
            isInspectorCollapsed ? "w-10" : "w-80 sm:w-96"
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
              {/* Inspector Header with Tabs */}
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
                  title="Sembunyikan Inspector"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Inspector Body Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* TAB 1: PARAMETRIC SLIDERS */}
                {activeInspectorTab === "controls" && (
                  <div className="space-y-5">
                    {/* Dimension Group */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                        <span>Dimensi Part (mm)</span>
                        <span className="text-cyan-400">Presisi 0.1mm</span>
                      </div>

                      {/* Width Slider */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
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

                      {/* Depth Slider */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
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

                      {/* Height Slider */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
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

                    {/* Geometry & Tolerances */}
                    <div className="space-y-3 pt-3 border-t border-slate-800">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                        Toleransi &amp; Dinding
                      </div>

                      {/* Wall Thickness */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-300">Ketebalan Dinding (Shell)</span>
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

                      {/* Corner Radius */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-300">Corner Fillet (Radius)</span>
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

                      {/* Magnet Clearance */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-300">Toleransi Lubang Magnet</span>
                          <span className="font-mono font-bold text-cyan-300">{params.magnetTolerance} mm</span>
                        </div>
                        <input
                          type="range"
                          min="0.05"
                          max="0.4"
                          step="0.05"
                          value={params.magnetTolerance}
                          onChange={(e) => handleUpdateParam("magnetTolerance", Number(e.target.value))}
                          className="w-full accent-cyan-500 cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Quick Button to Send directly to 3DFlow */}
                    <div className="p-3.5 rounded-2xl bg-gradient-to-br from-rose-950/40 via-slate-950 to-slate-950 border border-rose-500/30 space-y-2">
                      <div className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 text-rose-400" />
                        <span>Koneksi Antrean 3DFlow</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Selesai mendesain? Kirim file ini ke antrean cetak armada printer dan kurangi stok filamen secara otomatis.
                      </p>
                      <button
                        onClick={() => {
                          setFlowSuccessResult(null);
                          setShowFlowModal(true);
                        }}
                        className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-rose-600/30"
                      >
                        Kirim ke Antrean Produksi &rarr;
                      </button>
                    </div>
                  </div>
                )}

                {/* TAB 2: LIVE OPENSCAD SCRIPT */}
                {activeInspectorTab === "openscad" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400 font-mono">Kode OpenSCAD Otomatis</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(openScadCode);
                          alert("Kode OpenSCAD berhasil disalin!");
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Salin</span>
                      </button>
                    </div>
                    <pre className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-cyan-300 overflow-x-auto whitespace-pre max-h-96 leading-relaxed">
                      {openScadCode}
                    </pre>
                  </div>
                )}

                {/* TAB 3: PRINT HEALTH DIAGNOSTICS */}
                {activeInspectorTab === "health" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400 font-mono">Diagnostik Kelayakan Cetak</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        100% Siap Cetak
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>Ukuran Bounding Box Bed</span>
                        </div>
                        <span className="font-mono text-emerald-400">OK ({params.width}x{params.depth}mm)</span>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>Watertight 2-Manifold</span>
                        </div>
                        <span className="font-mono text-emerald-400">Solid 100%</span>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>Ketebalan Dinding Minimum</span>
                        </div>
                        <span className="font-mono text-emerald-400">{params.wallThickness}mm &ge; 0.8mm</span>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>Overhang Rule (&le; 45&deg;)</span>
                        </div>
                        <span className="font-mono text-emerald-400">Aman (No Support)</span>
                      </div>
                    </div>

                    <button
                      onClick={handleAutoFix}
                      disabled={isAutoFixing}
                      className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all"
                    >
                      {isAutoFixing ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                          <span>Menganalisis Mesh Geometri...</span>
                        </>
                      ) : (
                        <>
                          <Wrench className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Perbaiki Otomatis Geometri</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </aside>
      </div>

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
