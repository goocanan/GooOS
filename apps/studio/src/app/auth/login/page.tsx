"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/auth-client";
import { GooAppIcon } from "@/components/GooLogo";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"owner" | "demo">("owner");

  async function handleOwnerSignIn() {
    setIsLoading(true);
    setError("");
    try {
      const result = await signIn.email({
        email: "admin@goocanan.com",
        password: "admin12345",
      });

      if (result.error) {
        setError(result.error.message ?? "Gagal masuk ke akun owner/admin");
        setIsLoading(false);
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Terjadi kesalahan saat masuk ke akun owner.");
      setIsLoading(false);
    }
  }

  async function handleDemoSignIn() {
    setIsLoading(true);
    setError("");
    try {
      const result = await signIn.email({
        email: "demo@goocanan.com",
        password: "demouser123",
      });

      if (result.error) {
        setError(result.error.message ?? "Failed to sign in to demo account");
        setIsLoading(false);
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Something went wrong with demo sign in.");
      setIsLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const result = await signIn.email({
        email,
        password,
      });

      if (result.error) {
        setError(result.error.message ?? "Invalid email or password");
        setIsLoading(false);
        return;
      }

      router.push("/dashboard");
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-goo-50 via-white to-goo-100 px-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <GooAppIcon variant="gradient" size={56} priority={true} />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Sign in to Goo<span className="text-cyan-600">OS</span>
          </h1>
          <p className="text-sm text-slate-500">Operating System for Your Content &amp; 3D Studio</p>
        </div>

        {/* Tabs for Quick Sign-In */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 p-1 bg-slate-200/80 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab("owner")}
              className={`py-1.5 px-3 rounded-lg transition flex items-center justify-center gap-1.5 ${
                activeTab === "owner"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>👑</span>
              <span>Owner / Admin</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("demo")}
              className={`py-1.5 px-3 rounded-lg transition flex items-center justify-center gap-1.5 ${
                activeTab === "demo"
                  ? "bg-white text-amber-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>👀</span>
              <span>Akun Demo</span>
            </button>
          </div>

          {activeTab === "owner" ? (
            /* Quick Owner Sign-in Banner */
            <div className="rounded-2xl border-2 border-emerald-500/80 bg-gradient-to-br from-emerald-50 to-teal-50/60 p-4 shadow-sm space-y-3 animate-in fade-in duration-200">
              <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold text-sm shadow-sm">
                  👑
                </span>
                <div className="space-y-0.5">
                  <h2 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                    Akun Owner &amp; Admin · Akses Penuh
                  </h2>
                  <p className="text-xs text-emerald-800 leading-snug">
                    Akses penuh ke seluruh data 40+ produk, 70+ pesanan, 128 spul filamen, kas &amp; bebas tambah/edit/hapus data.
                  </p>
                </div>
              </div>

              <div className="bg-white/90 rounded-xl p-2.5 border border-emerald-200/80 font-mono text-[11px] text-slate-700 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">Email:</span>
                  <span className="font-semibold text-slate-900">admin@goocanan.com</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">Password:</span>
                  <span className="font-semibold text-slate-900">admin12345</span>
                </div>
                <div className="flex justify-between pt-0.5 border-t border-emerald-100 text-[10px]">
                  <span className="text-slate-400 font-sans">Izin Akses:</span>
                  <span className="text-emerald-700 font-sans font-medium">Owner (Akses Penuh Kelola Studio &amp; Farm)</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleOwnerSignIn}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-2.5 text-xs shadow-md shadow-emerald-600/20 active:scale-[0.99] transition disabled:opacity-50 cursor-pointer"
              >
                <span>{isLoading ? "Masuk ke Akun Owner..." : "Masuk Cepat sebagai Owner / Admin"}</span>
                <span>&rarr;</span>
              </button>
            </div>
          ) : (
            /* Quick Demo Account Sign-in Banner */
            <div className="rounded-2xl border-2 border-amber-400/80 bg-gradient-to-br from-amber-50 to-orange-50/60 p-4 shadow-sm space-y-3 animate-in fade-in duration-200">
              <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white font-bold text-sm shadow-sm">
                  👀
                </span>
                <div className="space-y-0.5">
                  <h2 className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                    Akun Demo · Mode Hanya Baca
                  </h2>
                  <p className="text-xs text-amber-800 leading-snug">
                    Jelajahi seluruh data demo 70+ pesanan, 128 spul filamen, armada printer &amp; kas tanpa perlu registrasi.
                  </p>
                </div>
              </div>

              <div className="bg-white/90 rounded-xl p-2.5 border border-amber-200/80 font-mono text-[11px] text-slate-700 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">Email:</span>
                  <span className="font-semibold text-slate-900">demo@goocanan.com</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">Password:</span>
                  <span className="font-semibold text-slate-900">demouser123</span>
                </div>
                <div className="flex justify-between pt-0.5 border-t border-amber-100 text-[10px]">
                  <span className="text-slate-400 font-sans">Izin Akses:</span>
                  <span className="text-amber-700 font-sans font-medium">Hanya Lihat (Tidak bisa input baru)</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDemoSignIn}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold py-2.5 text-xs shadow-md shadow-orange-500/20 active:scale-[0.99] transition disabled:opacity-50 cursor-pointer"
              >
                <span>{isLoading ? "Masuk ke Akun Demo..." : "Masuk Cepat sebagai Akun Demo"}</span>
                <span>&rarr;</span>
              </button>
            </div>
          )}
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-2 text-slate-400">atau login dengan akun reguler</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              required
              placeholder="admin@goocanan.com"
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-goo-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              type="password"
              name="password"
              required
              placeholder="••••••••"
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-goo-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-goo-600 text-white font-semibold py-2.5 hover:bg-goo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-2 text-slate-400">or continue with</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google
          </button>
          <button className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            GitHub
          </button>
        </div>

        <p className="text-center text-sm text-slate-500">
          Don&apos;t have an account?{" "}
          <Link href="/auth/register" className="text-goo-600 font-medium hover:underline">
            Get started
          </Link>
        </p>
      </div>
    </div>
  );
}
