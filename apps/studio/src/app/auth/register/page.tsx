"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signUp } from "@/lib/auth-client";
import { GooAppIcon } from "@/components/GooLogo";
import { Eye, EyeOff, Lock, UserPlus, Info, ShieldCheck } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const name = (formData.get("name") as string)?.trim();
    const email = (formData.get("email") as string)?.trim().toLowerCase();
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (!name || !email || !password) {
      setError("Semua field wajib diisi.");
      setIsLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("Password minimal harus 8 karakter.");
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Konfirmasi password tidak cocok.");
      setIsLoading(false);
      return;
    }

    try {
      const result = await signUp.email({
        email,
        password,
        name,
      });

      if (result.error) {
        setError(result.error.message ?? "Pendaftaran gagal. Silakan coba kembali.");
        setIsLoading(false);
        return;
      }

      // Successfully registered with limited access; redirect to dashboard
      router.push("/dashboard");
    } catch (err) {
      setError("Terjadi kesalahan saat pendaftaran. Silakan coba beberapa saat lagi.");
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-6 py-12 text-slate-100">
      <div className="w-full max-w-sm space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-3">
            <GooAppIcon variant="gradient" size={60} priority={true} />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Daftar Akun Baru Goo<span className="text-cyan-400">OS</span>
          </h1>
          <p className="text-xs text-slate-400">
            Platform Terpadu Manajemen Konten, Batching &amp; Cetak 3D
          </p>
        </div>

        {/* Limited Access Notice Card */}
        <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-950/30 via-slate-900/90 to-blue-950/20 p-4 shadow-lg backdrop-blur-sm space-y-2">
          <div className="flex items-start gap-2.5">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs">
              <Info className="w-3.5 h-3.5" />
            </span>
            <div className="space-y-1">
              <h2 className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                Ketentuan Akses Akun Baru
              </h2>
              <p className="text-[11px] text-cyan-100/80 leading-relaxed">
                Akun yang baru didaftarkan memiliki <strong>Akses Terbatas (Mode Uji Coba)</strong>. Anda dapat melihat seluruh katalog &amp; mencoba menambahkan hingga <strong>5 data pesanan/produk baru</strong>. Untuk akses operasional penuh tanpa batas, hubungi Administrator.
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 px-3.5 py-2.5 text-xs text-rose-300 flex items-start gap-2 animate-in fade-in duration-150">
              <span className="text-rose-400 font-bold shrink-0 mt-0.5">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Nama Lengkap
            </label>
            <input
              type="text"
              name="name"
              required
              placeholder="Contoh: Budi Santoso"
              className="w-full rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Alamat Email
            </label>
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              placeholder="nama@email.com"
              className="w-full rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Password (Min. 8 Karakter)
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="Minimal 8 karakter"
                className="w-full rounded-xl border border-slate-800 bg-slate-900/90 pl-3.5 pr-10 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500 transition font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                title={showPassword ? "Sembunyikan password" : "Lihat password"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Ulangi Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              name="confirmPassword"
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="Ketik ulang password"
              className="w-full rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500 transition font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-bold py-2.5 text-xs shadow-lg shadow-rose-600/20 active:scale-[0.99] transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>{isLoading ? "Mendaftarkan akun..." : "Buat Akun Baru"}</span>
          </button>
        </form>

        {/* Footer Link to Login */}
        <div className="pt-2 text-center text-xs text-slate-400 space-y-2">
          <p>
            Sudah memiliki akun?{" "}
            <Link
              href="/auth/login"
              className="text-rose-400 font-semibold hover:text-rose-300 underline decoration-rose-400/40 underline-offset-4 transition"
            >
              Masuk di sini
            </Link>
          </p>
          <div className="text-[10px] text-slate-600 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3 h-3 text-slate-500" />
            <span>Koneksi aman terenkripsi Better Auth &amp; Scrypt</span>
          </div>
        </div>
      </div>
    </div>
  );
}
