"use client";

import { useDemoMode } from "@/hooks/use-demo-mode";
import { signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Lock, X, ArrowRight, Sparkles, ShieldAlert } from "lucide-react";

export function DemoNoticeBanner() {
  const { isDemo, isLimited, isOwner, quotaInfo, session } = useDemoMode();
  const router = useRouter();

  if (isOwner) return null;

  async function handleLogout() {
    try {
      await signOut();
    } catch {}
    router.push("/auth/login");
  }

  // Banner for Demo user
  if (isDemo) {
    return (
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 border-b border-amber-500/30 text-amber-200 px-4 py-2 text-xs flex items-center justify-between gap-3 shadow-inner">
        <div className="flex items-center gap-2.5 max-w-4xl">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40">
            <Lock className="w-3 h-3" />
          </span>
          <p className="leading-tight">
            <strong className="text-amber-300 font-semibold uppercase tracking-wide mr-1.5">
              Mode Demo (Data Sampel):
            </strong>
            Anda sedang melihat simulasi data contoh (produk, pesanan, inventaris, dan printer sampel). Seluruh data riil akun Owner terlindungi secara privat. Fitur <strong className="text-rose-300">tambah &amp; ubah data dinonaktifkan</strong> pada akun demo.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleLogout}
            className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-[11px] font-medium transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span>Ganti Akun</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  }

  // Banner for Limited Member
  if (isLimited) {
    const used = quotaInfo?.used ?? 0;
    const max = quotaInfo?.max ?? 5;
    const remaining = quotaInfo?.remaining ?? (max - used);

    return (
      <div className="bg-gradient-to-r from-cyan-950 via-slate-900 to-cyan-950 border-b border-cyan-500/30 text-cyan-200 px-4 py-2 text-xs flex items-center justify-between gap-3 shadow-inner">
        <div className="flex items-center gap-2.5 max-w-4xl">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
            <Sparkles className="w-3 h-3" />
          </span>
          <p className="leading-tight">
            <strong className="text-cyan-300 font-semibold uppercase tracking-wide mr-1.5">
              Akun Baru (Akses Terbatas):
            </strong>
            Anda dapat melihat seluruh data studio &amp; memiliki kuota uji coba menambahkan{" "}
            <span className="font-mono text-white font-bold bg-cyan-500/20 px-1.5 py-0.5 rounded border border-cyan-500/40">
              {used} dari {max} data
            </span>{" "}
            ({remaining > 0 ? `${remaining} sisa slot` : "kuota habis"}). Hubungi Owner untuk akses operasional penuh.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-mono bg-cyan-500/15 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/30">
            Trial Mode
          </span>
        </div>
      </div>
    );
  }

  return null;
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
  const { isDemo, isLimited, quotaInfo } = useDemoMode();
  const router = useRouter();

  if (!isOpen) return null;

  async function handleSwitchAccount() {
    try {
      await signOut();
    } catch {}
    router.push("/auth/login");
  }

  const isQuotaIssue = isLimited || actionName.toLowerCase().includes("kuota");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-amber-500/40 p-6 shadow-2xl text-slate-100 space-y-5 animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
              isQuotaIssue
                ? "bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 shadow-cyan-500/10"
                : "bg-amber-500/15 border border-amber-500/30 text-amber-400 shadow-amber-500/10"
            }`}
          >
            {isQuotaIssue ? (
              <Sparkles className="w-6 h-6 stroke-[2.2]" />
            ) : (
              <Lock className="w-6 h-6 stroke-[2.2]" />
            )}
          </div>
          <div className="space-y-1">
            <span
              className={`text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded border ${
                isQuotaIssue
                  ? "text-cyan-400 bg-cyan-500/15 border-cyan-500/30"
                  : "text-amber-400 bg-amber-500/15 border-amber-500/30"
              }`}
            >
              {isQuotaIssue ? "Batas Kuota Tercapai" : "Akses Dibatasi · Read-Only"}
            </span>
            <h3 className="text-base font-bold text-white">
              {isQuotaIssue
                ? "Kuota Penambahan Data Habis"
                : "Tidak Dapat Menginput Data Baru"}
            </h3>
          </div>
        </div>

        <div className="bg-slate-950/70 rounded-xl p-3.5 border border-slate-800 space-y-2 text-xs">
          <p className="text-slate-300">
            Informasi:{" "}
            <strong className="text-rose-400 font-semibold">{actionName}</strong>
          </p>
          {isQuotaIssue ? (
            <p className="text-slate-400 leading-relaxed">
              Akun baru Anda berada pada <strong>Akses Terbatas</strong> dengan kuota penambahan maksimal{" "}
              <strong className="text-cyan-300">{quotaInfo?.max ?? 5} data</strong>. Untuk menambah data tanpa batas serta mengelola armada dan keuangan, hubungi Administrator atau Owner Goocanan.
            </p>
          ) : (
            <p className="text-slate-400 leading-relaxed">
              Akun ini adalah <strong className="text-amber-300">Akun Demo (Hanya Lihat)</strong>. Untuk menjaga integritas data contoh bersama, penyimpanan data baru dibatasi di akun ini.
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition cursor-pointer"
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={handleSwitchAccount}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white text-xs font-bold transition shadow-md shadow-rose-600/20 cursor-pointer"
          >
            Masuk dengan Akun Lain
          </button>
        </div>
      </div>
    </div>
  );
}
