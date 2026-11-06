"use client";

import { useDemoMode } from "@/hooks/use-demo-mode";
import { signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Eye, Lock, AlertCircle, X, ShieldAlert, ArrowRight } from "lucide-react";

export function DemoNoticeBanner() {
  const { isDemo, session } = useDemoMode();
  const router = useRouter();

  if (!isDemo) return null;

  async function handleLogout() {
    try {
      await signOut();
    } catch {}
    router.push("/auth/login");
  }

  return (
    <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 border-b border-amber-500/30 text-amber-200 px-4 py-2 text-xs flex items-center justify-between gap-3 shadow-inner">
      <div className="flex items-center gap-2.5 max-w-4xl">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40">
          <Lock className="w-3 h-3" />
        </span>
        <p className="leading-tight">
          <strong className="text-amber-300 font-semibold uppercase tracking-wide mr-1.5">
            Mode Demo (Hanya Baca):
          </strong>
          Anda masuk sebagai <span className="font-mono text-white underline decoration-amber-400">{session?.user?.email || "demo@goocanan.com"}</span>. Anda bebas menjelajahi seluruh data demo, namun fitur <strong className="text-rose-300">input / tambah data baru dinonaktifkan</strong>.
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleLogout}
          className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-[11px] font-medium transition-colors flex items-center gap-1"
        >
          <span>Ganti Akun</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

export function DemoReadOnlyModal({
  isOpen,
  onClose,
  actionName = "Input Data Baru",
}: {
  isOpen: boolean;
  onClose: () => void;
  actionName?: string;
}) {
  const router = useRouter();

  if (!isOpen) return null;

  async function handleSwitchAccount() {
    try {
      await signOut();
    } catch {}
    router.push("/auth/login");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-amber-500/40 p-6 shadow-2xl text-slate-100 space-y-5 animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-lg shadow-amber-500/10">
            <Lock className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-bold tracking-wider uppercase text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded border border-amber-500/30">
              Akses Dibatasi · Read-Only
            </span>
            <h3 className="text-base font-bold text-white">
              Tidak Dapat Menginput Data Baru
            </h3>
          </div>
        </div>

        <div className="bg-slate-950/70 rounded-xl p-3.5 border border-slate-800 space-y-2 text-xs">
          <p className="text-slate-300">
            Tindakan yang dicegah:{" "}
            <strong className="text-rose-400 font-semibold">{actionName}</strong>
          </p>
          <p className="text-slate-400 leading-relaxed">
            Akun ini adalah <strong className="text-amber-300">Akun Demo (Hanya Lihat)</strong> yang dilengkapi dengan data demo produksi aktif (70 pesanan, 128 spul filamen, 2 printer, 40 model katalog, dan kas transaksi).
          </p>
          <p className="text-slate-400 leading-relaxed">
            Untuk menjaga konsistensi data demo bagi semua penguji, pembuatan dan penyimpanan data baru tidak diizinkan di akun ini.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
          >
            Tutup &amp; Lanjut Jelajah
          </button>
          <button
            type="button"
            onClick={handleSwitchAccount}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white text-xs font-bold transition shadow-md shadow-rose-600/20"
          >
            Masuk dengan Akun Utama
          </button>
        </div>
      </div>
    </div>
  );
}
