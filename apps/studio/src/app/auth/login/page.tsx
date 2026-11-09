"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/auth-client";
import { GooAppIcon } from "@/components/GooLogo";
import { Eye, EyeOff, Lock, ArrowRight, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function handleDemoSignIn() {
    setIsLoading(true);
    setError("");
    try {
      const result = await signIn.email({
        email: "demo@goocanan.com",
        password: "demouser123",
      });

      if (result.error) {
        setError(result.error.message ?? "Gagal masuk ke akun demo");
        setIsLoading(false);
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Terjadi kesalahan saat masuk ke akun demo.");
      setIsLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const email = (formData.get("email") as string)?.trim().toLowerCase();
    const password = formData.get("password") as string;

    if (!email || !password) {
      setError("Silakan isi email dan password Anda.");
      setIsLoading(false);
      return;
    }

    try {
      const result = await signIn.email({
        email,
        password,
      });

      if (result.error) {
        setError("Email atau password tidak sesuai. Silakan periksa kembali.");
        setIsLoading(false);
        return;
      }

      router.push("/dashboard");
    } catch (err) {
      setError("Terjadi kesalahan saat proses masuk. Silakan coba beberapa saat lagi.");
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
            Sign in to Goo<span className="text-cyan-400">OS</span>
          </h1>
          <p className="text-xs text-slate-400">
            Operating System for Your Content &amp; 3D Print Studio
          </p>
        </div>

        {/* Demo Quick Banner for Guests (Read-Only) */}
        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-950/40 via-slate-900/90 to-amber-950/20 p-4 shadow-lg backdrop-blur-sm space-y-3">
          <div className="flex items-start gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 text-sm shadow-sm">
              👀
            </span>
            <div className="space-y-0.5">
              <h2 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                Akun Demo · Mode Hanya Baca
              </h2>
              <p className="text-[11px] text-amber-200/80 leading-relaxed">
                Khusus pengunjung yang ingin menjelajahi antarmuka dan melihat sampel data pesanan &amp; inventaris tanpa login.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDemoSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 font-semibold py-2 text-xs shadow-sm active:scale-[0.99] transition disabled:opacity-50 cursor-pointer"
          >
            <span>{isLoading ? "Memproses..." : "Masuk sebagai Akun Demo"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-slate-900 px-3 text-slate-500 uppercase tracking-wider text-[10px] font-mono">
              atau masuk dengan akun Anda
            </span>
          </div>
        </div>

        {/* Secure Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 px-3.5 py-2.5 text-xs text-rose-300 flex items-start gap-2 animate-in fade-in duration-150">
              <span className="text-rose-400 font-bold shrink-0 mt-0.5">⚠️</span>
              <span>{error}</span>
            </div>
          )}

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
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Password
              </label>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
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

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-bold py-2.5 text-xs shadow-lg shadow-rose-600/20 active:scale-[0.99] transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>{isLoading ? "Memeriksa kredensial..." : "Masuk ke Akun"}</span>
          </button>
        </form>

        {/* Footer Link to Register */}
        <div className="pt-2 text-center text-xs text-slate-400 space-y-2">
          <p>
            Belum punya akun?{" "}
            <Link
              href="/auth/register"
              className="text-rose-400 font-semibold hover:text-rose-300 underline decoration-rose-400/40 underline-offset-4 transition"
            >
              Daftar Akun Baru (Akses Terbatas)
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
