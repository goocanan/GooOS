"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import * as THREE from "three";
import { STLExporter } from "three/examples/jsm/exporters/STLExporter.js";
import { GooNavbar } from "@/components/GooNavbar";
import {
  Sparkles,
  Camera,
  Box,
  Sliders,
  Settings,
  Download,
  RotateCw,
  Plus,
  ArrowRight,
  Printer,
  Layers,
  Wrench,
  CheckCircle2,
  Copy,
  ExternalLink,
  ChevronRight,
  Maximize2,
  HelpCircle,
  FileCode,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// PARAMETRIC BOX GENERATOR THREE.JS CANVAS
// ─────────────────────────────────────────────────────────────────────────────
interface BoxParams {
  width: number;
  depth: number;
  height: number;
  wallThickness: number;
  lidType: "none" | "snap" | "slide";
  color: string;
}

function ParametricBoxCanvas({
  params,
  onExportSTL,
}: {
  params: BoxParams;
  onExportSTL: (mesh: THREE.Group, filename: string) => void;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const groupRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight || 360;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x090d16);

    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 1000);
    camera.position.set(params.width * 1.5, params.height * 2, params.depth * 2);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight1.position.set(100, 200, 100);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x38bdf8, 0.6);
    dirLight2.position.set(-100, -50, -100);
    scene.add(dirLight2);

    // Grid Floor
    const grid = new THREE.GridHelper(300, 30, 0x1e293b, 0x0f172a);
    grid.position.y = 0;
    scene.add(grid);

    // Box Group
    const boxGroup = new THREE.Group();
    groupRef.current = boxGroup;
    scene.add(boxGroup);

    // Build Box Mesh
    const { width: w, depth: d, height: h, wallThickness: t, color } = params;
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      roughness: 0.35,
      metalness: 0.1,
    });

    const innerMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(color).multiplyScalar(0.7),
      roughness: 0.5,
      metalness: 0.1,
    });

    // Outer Base
    const baseGeo = new THREE.BoxGeometry(w, t, d);
    const baseMesh = new THREE.Mesh(baseGeo, material);
    baseMesh.position.set(0, t / 2, 0);
    boxGroup.add(baseMesh);

    // Walls
    const wallH = h - t;
    // Front Wall
    const frontGeo = new THREE.BoxGeometry(w, wallH, t);
    const frontMesh = new THREE.Mesh(frontGeo, material);
    frontMesh.position.set(0, t + wallH / 2, d / 2 - t / 2);
    boxGroup.add(frontMesh);

    // Back Wall
    const backGeo = new THREE.BoxGeometry(w, wallH, t);
    const backMesh = new THREE.Mesh(backGeo, material);
    backMesh.position.set(0, t + wallH / 2, -d / 2 + t / 2);
    boxGroup.add(backMesh);

    // Left Wall
    const sideGeo = new THREE.BoxGeometry(t, wallH, d - 2 * t);
    const leftMesh = new THREE.Mesh(sideGeo, material);
    leftMesh.position.set(-w / 2 + t / 2, t + wallH / 2, 0);
    boxGroup.add(leftMesh);

    // Right Wall
    const rightMesh = new THREE.Mesh(sideGeo, material);
    rightMesh.position.set(w / 2 - t / 2, t + wallH / 2, 0);
    boxGroup.add(rightMesh);

    // Optional Lid
    if (params.lidType !== "none") {
      const lidGeo = new THREE.BoxGeometry(w + 1, t * 1.2, d + 1);
      const lidMesh = new THREE.Mesh(lidGeo, innerMat);
      lidMesh.position.set(0, h + (t * 1.2) / 2 + 10, 0); // elevated for display
      boxGroup.add(lidMesh);
    }

    camera.lookAt(0, h / 2, 0);

    let isDragging = false;
    let prevMousePos = { x: 0, y: 0 };

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging || !boxGroup) return;
      const deltaX = e.clientX - prevMousePos.x;
      const deltaY = e.clientY - prevMousePos.y;
      boxGroup.rotation.y += deltaX * 0.01;
      boxGroup.rotation.x += deltaY * 0.01;
      prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    container.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (!isDragging) {
        boxGroup.rotation.y += 0.003;
      }
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight || 360;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      container.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
    };
  }, [params]);

  const handleDownload = () => {
    if (groupRef.current) {
      onExportSTL(groupRef.current, `Parametric_Box_${params.width}x${params.depth}x${params.height}mm.stl`);
    }
  };

  return (
    <div className="relative w-full h-[360px] rounded-2xl overflow-hidden border border-slate-800 bg-slate-950/80">
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
      <div className="absolute bottom-3 right-3 flex items-center gap-2">
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export STL ({params.width}x{params.depth}x{params.height}mm)</span>
        </button>
      </div>
      <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300 font-mono">
        📐 Drag mouse untuk putar 3D
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN CAD HUB PAGE COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
function CadHubContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "overview";
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  // Parametric Box State
  const [boxParams, setBoxParams] = useState<BoxParams>({
    width: 80,
    depth: 60,
    height: 40,
    wallThickness: 2.0,
    lidType: "snap",
    color: "#06b6d4",
  });

  // Calibration Calculators State
  const [eStepsCurrent, setEStepsCurrent] = useState<number>(93.0);
  const [eStepsExtrudeTarget, setEStepsExtrudeTarget] = useState<number>(100);
  const [eStepsExtrudeActual, setEStepsExtrudeActual] = useState<number>(95);
  const calculatedESteps =
    eStepsExtrudeActual > 0
      ? Number(((eStepsCurrent * eStepsExtrudeTarget) / eStepsExtrudeActual).toFixed(2))
      : eStepsCurrent;

  const [calWallExpected, setCalWallExpected] = useState<number>(0.8);
  const [calWallMeasured, setCalWallMeasured] = useState<number>(0.84);
  const calculatedFlowMultiplier =
    calWallMeasured > 0
      ? Number(((calWallExpected / calWallMeasured) * 100).toFixed(1))
      : 100;

  const [copiedGcode, setCopiedGcode] = useState(false);

  // STL Exporter function
  const exportSTL = (group: THREE.Group, filename: string) => {
    const exporter = new STLExporter();
    const result = exporter.parse(group, { binary: true });
    const blob = new Blob([result], { type: "application/octet-stream" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <GooNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Hub Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-cyan-950/40 border border-slate-800 p-6 sm:p-10 shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -z-10" />
          <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -z-10" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span>GooPrint Cloud CAD &amp; Rapid Prototyping</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
                GooPrint{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-300">
                  CAD Studio
                </span>
              </h1>

              <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
                Platform pemodelan parametrik teknis 3D langsung di browser. Buat bingkai foto polaroid kustom,
                kotak kompartemen Gridfinity, kalibrasi slicer cetak, dan ekspor instan file mesh STL siap cetak.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap md:flex-col gap-2.5 shrink-0">
              <Link
                href="/cad/polaroid"
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 hover:to-sky-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span>Buka Polaroid Generator</span>
              </Link>
              <Link
                href="/settings?tab=gooprint"
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-medium transition-colors"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Pengaturan CAD</span>
              </Link>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="mt-8 pt-6 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto scrollbar-none">
            {[
              { id: "overview", label: "Overview & Modul", icon: Layers },
              { id: "parametric", label: "Generator Parametrik Box", icon: Box },
              { id: "calculators", label: "Kalkulator Kalibrasi Slicer", icon: Sliders },
              { id: "templates", label: "Library Presets & Panduan", icon: Wrench },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    isActive
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/10"
                      : "text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* TAB 1: OVERVIEW & SHOWCASE */}
        {/* ───────────────────────────────────────────────────────────── */}
        {activeTab === "overview" && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Featured Hero Card: Polaroid Generator */}
            <div className="group relative overflow-hidden rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 transition-all p-6 sm:p-8">
              <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl -z-10 group-hover:bg-cyan-500/15 transition-colors" />

              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-4 max-w-2xl">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/15 text-cyan-300 text-[11px] font-semibold">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generator Populer #1</span>
                  </div>

                  <div>
                    <h3 className="text-2xl font-bold text-white group-hover:text-cyan-300 transition-colors">
                      Polaroid Frame Generator 3D
                    </h3>
                    <p className="text-slate-400 text-sm mt-1 leading-relaxed">
                      Kustomisasi bingkai foto Polaroid instan ukuran Mini (54×86mm), Square (72×86mm), dan Wide (108×86mm).
                      Tambahkan ukiran teks timbul (emboss) atau grafir (engrave), dekorasi ikon 3D, lubang gantungan kunci,
                      hingga stand pajangan meja magnetik secara real-time.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs font-mono text-slate-400">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800">📸 Mini / Square / Wide</span>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800">🔤 Emboss &amp; Engrave</span>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800">📐 Three.js CSG Boolean</span>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800">⚡ Direct Binary STL</span>
                  </div>
                </div>

                <div className="shrink-0 flex flex-col sm:flex-row lg:flex-col gap-3">
                  <Link
                    href="/cad/polaroid"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-sm shadow-xl shadow-cyan-500/25 transition-all group-hover:scale-105 cursor-pointer"
                  >
                    <span>Buka Polaroid Studio</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Sub-tools Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1: Parametric Box */}
              <div
                onClick={() => setActiveTab("parametric")}
                className="group cursor-pointer rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 p-6 space-y-4 transition-all hover:bg-slate-900/90"
              >
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                  <Box className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                    Parametric Box Generator
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Buat kotak penyimpanan kustom dengan input panjang, lebar, tinggi, dan ketebalan dinding. Lengkap dengan tutup snap-fit.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-400">
                  <span>Mulai Desain Kotak</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Card 2: Calibration Calculators */}
              <div
                onClick={() => setActiveTab("calculators")}
                className="group cursor-pointer rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 p-6 space-y-4 transition-all hover:bg-slate-900/90"
              >
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                  <Sliders className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
                    Kalkulator Kalibrasi Mesin
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Hitung akurasi E-Steps ekstruder, kalibrasi flow rate filament, dan rumus kompensasi penyusutan (shrinkage factor) material.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400">
                  <span>Buka Alat Kalibrasi</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Card 3: Templates & Guidelines */}
              <div
                onClick={() => setActiveTab("templates")}
                className="group cursor-pointer rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 p-6 space-y-4 transition-all hover:bg-slate-900/90"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                  <Wrench className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                    Standar Desain &amp; Gridfinity
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Panduan toleransi clearance cetak (0.15mm - 0.4mm), standar lubang baut M2-M5, dan modul Gridfinity 42mm.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                  <span>Lihat Panduan Toleransi</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────── */}
        {/* TAB 2: PARAMETRIC BOX GENERATOR */}
        {/* ───────────────────────────────────────────────────────────── */}
        {activeTab === "parametric" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">Generator Kotak Parametrik 3D</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Atur ukuran millimeter sesuai kebutuhan part Anda dan dapatkan file STL instan siap cetak.
                </p>
              </div>
              <button
                onClick={() =>
                  setBoxParams({
                    width: 80,
                    depth: 60,
                    height: 40,
                    wallThickness: 2.0,
                    lidType: "snap",
                    color: "#06b6d4",
                  })
                }
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Reset Parameter</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: 3D Canvas Preview */}
              <div className="lg:col-span-7">
                <ParametricBoxCanvas params={boxParams} onExportSTL={exportSTL} />
              </div>

              {/* Right Column: Controls */}
              <div className="lg:col-span-5 rounded-2xl bg-slate-900/80 border border-slate-800 p-6 space-y-5">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  <span>Dimensi &amp; Parameter Kotak (mm)</span>
                </h4>

                {/* Width */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Lebar (X)</span>
                    <span className="font-mono font-bold text-cyan-400">{boxParams.width} mm</span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="200"
                    step="5"
                    value={boxParams.width}
                    onChange={(e) => setBoxParams({ ...boxParams, width: Number(e.target.value) })}
                    className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Depth */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Panjang (Y)</span>
                    <span className="font-mono font-bold text-cyan-400">{boxParams.depth} mm</span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="200"
                    step="5"
                    value={boxParams.depth}
                    onChange={(e) => setBoxParams({ ...boxParams, depth: Number(e.target.value) })}
                    className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Height */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Tinggi (Z)</span>
                    <span className="font-mono font-bold text-cyan-400">{boxParams.height} mm</span>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="150"
                    step="5"
                    value={boxParams.height}
                    onChange={(e) => setBoxParams({ ...boxParams, height: Number(e.target.value) })}
                    className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Wall Thickness */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Ketebalan Dinding</span>
                    <span className="font-mono font-bold text-cyan-400">{boxParams.wallThickness} mm</span>
                  </div>
                  <input
                    type="range"
                    min="1.2"
                    max="5.0"
                    step="0.4"
                    value={boxParams.wallThickness}
                    onChange={(e) =>
                      setBoxParams({ ...boxParams, wallThickness: Number(e.target.value) })
                    }
                    className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-[10px] text-slate-500">
                    Rekomendasi: Kelipatan nozzle 0.4mm (1.6mm = 4 keliling, 2.0mm = 5 keliling)
                  </span>
                </div>

                {/* Lid Type */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <label className="text-xs text-slate-400">Tipe Tutup (Lid)</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "none", label: "Tanpa Tutup" },
                      { id: "snap", label: "Snap-Fit" },
                      { id: "slide", label: "Sliding" },
                    ].map((lid) => (
                      <button
                        key={lid.id}
                        onClick={() => setBoxParams({ ...boxParams, lidType: lid.id as any })}
                        className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                          boxParams.lidType === lid.id
                            ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                        }`}
                      >
                        {lid.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Estimate weight & volume */}
                <div className="pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                    <span className="text-slate-500 text-[10px]">Perkiraan Volume</span>
                    <p className="font-mono font-bold text-slate-200 mt-0.5">
                      {Math.round((boxParams.width * boxParams.depth * boxParams.height) / 1000)} cm³
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                    <span className="text-slate-500 text-[10px]">Estimasi Berat PLA</span>
                    <p className="font-mono font-bold text-cyan-400 mt-0.5">
                      ~
                      {Math.round(
                        (((boxParams.width * boxParams.depth +
                          2 * boxParams.width * boxParams.height +
                          2 * boxParams.depth * boxParams.height) *
                          boxParams.wallThickness) /
                          1000) *
                          1.24 *
                          0.4
                      )}{" "}
                      gram
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────── */}
        {/* TAB 3: CALIBRATION CALCULATORS */}
        {/* ───────────────────────────────────────────────────────────── */}
        {activeTab === "calculators" && (
          <div className="space-y-8 animate-in fade-in duration-200">
            <div>
              <h3 className="text-xl font-bold text-white">Kalkulator Kalibrasi Printer 3D</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Hitung nilai kompensasi presisi untuk firmware Klipper / Marlin dan Slicer OrcaSlicer/BambuStudio.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Calculator 1: E-Steps Tuning */}
              <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-bold text-white flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-cyan-400" />
                    <span>Kalibrasi E-Steps Extruder</span>
                  </h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/10 text-cyan-300">
                    M92 E...
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  Ukur 120mm filamen dari extruder. Perintahkan printer mengekstrusi 100mm. Ukur sisa filamen untuk mendapatkan panjang aktual.
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-400">Nilai E-Steps Saat Ini (steps/mm)</label>
                    <input
                      type="number"
                      value={eStepsCurrent}
                      onChange={(e) => setEStepsCurrent(Number(e.target.value))}
                      className="mt-1 w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-sm focus:border-cyan-500 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-400">Target Ekstrusi (mm)</label>
                      <input
                        type="number"
                        value={eStepsExtrudeTarget}
                        onChange={(e) => setEStepsExtrudeTarget(Number(e.target.value))}
                        className="mt-1 w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-sm focus:border-cyan-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400">Hasil Aktual Keluar (mm)</label>
                      <input
                        type="number"
                        value={eStepsExtrudeActual}
                        onChange={(e) => setEStepsExtrudeActual(Number(e.target.value))}
                        className="mt-1 w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-sm focus:border-cyan-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Result Box */}
                <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-cyan-300">Nilai E-Steps Baru:</span>
                    <p className="text-2xl font-black font-mono text-white mt-0.5">{calculatedESteps}</p>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`M92 E${calculatedESteps}\nM500`);
                      setCopiedGcode(true);
                      setTimeout(() => setCopiedGcode(false), 2000);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
                  >
                    {copiedGcode ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedGcode ? "Tersalin!" : "Copy G-Code"}</span>
                  </button>
                </div>
              </div>

              {/* Calculator 2: Flow Rate Multiplier */}
              <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-bold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-400" />
                    <span>Kalibrasi Flow Rate / Extrusion Multiplier</span>
                  </h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/10 text-indigo-300">
                    Slicer Flow %
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  Cetak kubus hollow 2 dinding (misal 2 × 0.40 = 0.80mm). Ukur dengan kaliper digital di 4 sisi dan masukkan rata-ratanya.
                </p>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-400">Target Dinding Slicer (mm)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={calWallExpected}
                        onChange={(e) => setCalWallExpected(Number(e.target.value))}
                        className="mt-1 w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-sm focus:border-indigo-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400">Hasil Ukur Kaliper (mm)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={calWallMeasured}
                        onChange={(e) => setCalWallMeasured(Number(e.target.value))}
                        className="mt-1 w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-sm focus:border-indigo-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Result Box */}
                <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-indigo-300">Rekomendasi Flow Rate:</span>
                    <p className="text-2xl font-black font-mono text-white mt-0.5">
                      {calculatedFlowMultiplier}%
                    </p>
                  </div>
                  <span className="text-xs text-slate-400">
                    {calculatedFlowMultiplier < 100 ? "Over-extruding (dikurangi)" : "Under-extruding (ditambah)"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────── */}
        {/* TAB 4: TEMPLATES & DESIGN GUIDELINES */}
        {/* ───────────────────────────────────────────────────────────── */}
        {activeTab === "templates" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h3 className="text-xl font-bold text-white">Standar Desain &amp; Panduan Toleransi 3D Printing</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Gunakan acuan toleransi berikut saat membuat model teknis dan part perakitan.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Guideline 1: Fits */}
              <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 space-y-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Toleransi Pasangan (Fit Clearance)</span>
                </h4>
                <ul className="space-y-2 text-xs text-slate-400">
                  <li className="flex justify-between py-1 border-b border-slate-800">
                    <span>Press Fit (Ketat / Ketuk):</span>
                    <span className="font-mono text-emerald-300 font-bold">0.10 - 0.15 mm</span>
                  </li>
                  <li className="flex justify-between py-1 border-b border-slate-800">
                    <span>Snap Fit (Klip Pengunci):</span>
                    <span className="font-mono text-emerald-300 font-bold">0.20 - 0.25 mm</span>
                  </li>
                  <li className="flex justify-between py-1 border-b border-slate-800">
                    <span>Sliding Fit (Geser Lancar):</span>
                    <span className="font-mono text-emerald-300 font-bold">0.30 - 0.40 mm</span>
                  </li>
                  <li className="flex justify-between py-1">
                    <span>Rotating / Hinges (Engsel):</span>
                    <span className="font-mono text-emerald-300 font-bold">0.40 - 0.50 mm</span>
                  </li>
                </ul>
              </div>

              {/* Guideline 2: Fasteners & Heat Inserts */}
              <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 space-y-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-cyan-400" />
                  <span>Lubang Baut &amp; Heat Insert (M2 - M5)</span>
                </h4>
                <ul className="space-y-2 text-xs text-slate-400">
                  <li className="flex justify-between py-1 border-b border-slate-800">
                    <span>M3 Clearance Hole (Baut Lewat):</span>
                    <span className="font-mono text-cyan-300 font-bold">Ø 3.2 - 3.4 mm</span>
                  </li>
                  <li className="flex justify-between py-1 border-b border-slate-800">
                    <span>M3 Heat-Set Brass Insert:</span>
                    <span className="font-mono text-cyan-300 font-bold">Ø 4.0 - 4.2 mm</span>
                  </li>
                  <li className="flex justify-between py-1 border-b border-slate-800">
                    <span>M4 Clearance Hole:</span>
                    <span className="font-mono text-cyan-300 font-bold">Ø 4.3 - 4.5 mm</span>
                  </li>
                  <li className="flex justify-between py-1">
                    <span>M5 Clearance Hole:</span>
                    <span className="font-mono text-cyan-300 font-bold">Ø 5.3 - 5.5 mm</span>
                  </li>
                </ul>
              </div>

              {/* Guideline 3: Gridfinity Specs */}
              <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 space-y-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Box className="w-4 h-4 text-indigo-400" />
                  <span>Spesifikasi Standar Gridfinity</span>
                </h4>
                <ul className="space-y-2 text-xs text-slate-400">
                  <li className="flex justify-between py-1 border-b border-slate-800">
                    <span>Grid Pitch (1 Unit X/Y):</span>
                    <span className="font-mono text-indigo-300 font-bold">42.0 mm</span>
                  </li>
                  <li className="flex justify-between py-1 border-b border-slate-800">
                    <span>Tinggi Satuan (1U Z):</span>
                    <span className="font-mono text-indigo-300 font-bold">7.0 mm</span>
                  </li>
                  <li className="flex justify-between py-1 border-b border-slate-800">
                    <span>Radius Sudut (Corner R):</span>
                    <span className="font-mono text-indigo-300 font-bold">4.0 mm</span>
                  </li>
                  <li className="flex justify-between py-1">
                    <span>Lubang Magnet Bawah:</span>
                    <span className="font-mono text-indigo-300 font-bold">Ø 6.5 × 2.4 mm</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function CadHubPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
          <div className="flex items-center gap-3 text-cyan-400 font-mono text-sm">
            <span className="w-3 h-3 rounded-full bg-cyan-400 animate-ping" />
            <span>Memuat GooPrint Studio Hub...</span>
          </div>
        </div>
      }
    >
      <CadHubContent />
    </Suspense>
  );
}
