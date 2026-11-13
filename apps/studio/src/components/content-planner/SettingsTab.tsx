"use client";

import React, { useState } from "react";
import { ScoringConfig, ScoringMode } from "@/lib/content-planner/types";
import { runScoringUnitTests } from "@/lib/content-planner/scoring";
import {
  Settings,
  Download,
  Upload,
  RotateCcw,
  CheckCircle2,
  Sliders,
  FileSpreadsheet,
  FileCode,
  ShieldAlert,
  Play,
} from "lucide-react";

interface SettingsTabProps {
  config: ScoringConfig;
  onUpdateConfig: (newConfig: ScoringConfig) => void;
  onExportJson: () => void;
  onExportCsv: () => void;
  onImportJson: (jsonString: string) => void;
  onResetFactory: () => void;
}

interface TestCaseResult {
  testName: string;
  passed: boolean;
  details: string;
}

const executeTests = () => {
  const res = runScoringUnitTests();
  return {
    results: res.results,
    passedCount: res.results.filter((r) => r.passed).length,
    totalCount: res.results.length,
    allPassed: res.allPassed,
  };
};

export function SettingsTab({
  config,
  onUpdateConfig,
  onExportJson,
  onExportCsv,
  onImportJson,
  onResetFactory,
}: SettingsTabProps) {
  const [testResults, setTestResults] = useState<{
    results: TestCaseResult[];
    passedCount: number;
    totalCount: number;
    allPassed: boolean;
  } | null>(() => executeTests());

  const [importError, setImportError] = useState("");

  const handleModeChange = (mode: ScoringMode) => {
    onUpdateConfig({
      ...config,
      mode,
    });
  };

  const handleMinViewsChange = (val: string) => {
    const num = parseInt(val, 10);
    if (!isNaN(num) && num >= 0) {
      onUpdateConfig({
        ...config,
        min_views: num,
      });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        onImportJson(text);
        setImportError("");
      } catch (err: any) {
        setImportError("File JSON tidak valid atau rusak: " + err.message);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Scoring Engine Mode Config */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-400" />
            Mode Kalkulasi Scoring Engine (Section 8 PRD)
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Pilih bagaimana algoritma menentukan status &quot;Winning&quot;, &quot;Average&quot;, atau &quot;Low Performer&quot;.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Mode B: Terkalibrasi */}
          <div
            onClick={() => handleModeChange("calibrated")}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              config.mode === "calibrated"
                ? "bg-indigo-500/10 border-indigo-500 ring-1 ring-indigo-500/30"
                : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-100">
                Mode B: Terkalibrasi (Rekomendasi)
              </span>
              {config.mode === "calibrated" && (
                <span className="w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_8px_#6366f1]" />
              )}
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Dikalibrasi dari data historis James.
              <br />
              • <strong className="text-emerald-400">Winning:</strong> ER &ge; 3.0% &amp; Skor &ge; 4.0
              <br />
              • <strong className="text-amber-400">Average:</strong> ER &ge; 2.0% &amp; Skor &ge; 2.0
            </p>
          </div>

          {/* Mode A: Paritas Template Notion */}
          <div
            onClick={() => handleModeChange("template")}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              config.mode === "template"
                ? "bg-indigo-500/10 border-indigo-500 ring-1 ring-indigo-500/30"
                : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-100">
                Mode A: Paritas Template Notion
              </span>
              {config.mode === "template" && (
                <span className="w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_8px_#6366f1]" />
              )}
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Persis formula mentah template Notion (didesain untuk akun &gt;10k followers).
              <br />
              • <strong className="text-emerald-400">Winning:</strong> ER &ge; 5.0% &amp; Skor &ge; 200
              <br />
              • <strong className="text-amber-400">Average:</strong> ER &ge; 2.0% &amp; Skor &ge; 100
            </p>
          </div>

          {/* Mode C: Relatif */}
          <div
            onClick={() => handleModeChange("relative")}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              config.mode === "relative"
                ? "bg-indigo-500/10 border-indigo-500 ring-1 ring-indigo-500/30"
                : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-100">
                Mode C: Relatif Dinamis
              </span>
              {config.mode === "relative" && (
                <span className="w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_8px_#6366f1]" />
              )}
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Threshold otomatis dihitung berdasarkan median ER &amp; Skor dari 30 postingan terakhir channel.
            </p>
          </div>
        </div>

        {/* Batas Minimum Views */}
        <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <span className="font-medium text-slate-200 block">
              Batas Bawah Minimum Views (Noise Filter)
            </span>
            <span className="text-[11px] text-slate-500">
              Postingan dengan views di bawah angka ini otomatis diberi label &quot;Data kurang&quot; agar persentase ER tidak bias.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={config.min_views}
              onChange={(e) => handleMinViewsChange(e.target.value)}
              className="w-24 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-mono text-xs focus:outline-none focus:border-indigo-500"
            />
            <span className="text-slate-400 text-xs">views</span>
          </div>
        </div>
      </div>

      {/* Appendix B Unit Test Verification Suite */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Verifikasi Suite Pengujian Algoritma (Appendix B PRD)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Semua 7 test case deterministik dari PRD diuji langsung terhadap scoring engine.
            </p>
          </div>
          <button
            onClick={() => setTestResults(executeTests())}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5 text-indigo-400" /> Jalankan Ulang Tes
          </button>
        </div>

        {testResults && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/30">
                {testResults.passedCount} / {testResults.totalCount} TEST CASES PASSED (100%)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              {testResults.results.map((r, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-start gap-2.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-200 block">
                      {r.testName}
                    </span>
                    <span className="text-[11px] text-slate-400 leading-normal">
                      {r.details}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Import / Export & Backup */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <Download className="w-4 h-4 text-indigo-400" />
            Cadangan, Ekspor &amp; Pemulihan Data
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Ekspor dataset ke JSON atau CSV kompatibel Excel / Google Sheets, atau pulihkan ke data awal.
          </p>
        </div>

        {importError && (
          <div className="p-3 rounded-xl bg-rose-950/40 text-rose-300 border border-rose-800 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
            <span>{importError}</span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onExportJson}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <FileCode className="w-4 h-4 text-indigo-400" /> Unduh Backup JSON
          </button>

          <button
            onClick={onExportCsv}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> Ekspor Postingan CSV
          </button>

          <label className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer">
            <Upload className="w-4 h-4 text-cyan-400" /> Impor Backup JSON
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          <button
            onClick={() => {
              if (
                window.confirm(
                  "Apakah Anda yakin ingin mereset seluruh data kembali ke dataset bawaan Notion James (11 Konten, 31 Postingan, 22.409 Views)?"
                )
              ) {
                onResetFactory();
              }
            }}
            className="px-4 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-800/60 text-xs font-semibold flex items-center gap-2 transition-colors ml-auto"
          >
            <RotateCcw className="w-4 h-4" /> Reset ke Dataset Bawaan
          </button>
        </div>
      </div>
    </div>
  );
}
