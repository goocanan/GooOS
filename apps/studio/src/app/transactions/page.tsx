"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { GooNavbar } from "@/components/GooNavbar";

interface Transaction {
  id: string;
  description: string;
  category: string;
  type: string; // income | expense
  amount: number;
  quantity: number;
  date: string;
  orderId: string | null;
  batchId: string | null;
}

interface Summary {
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
}

export default function TransactionsLedgerPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<Summary>({ totalIncome: 0, totalExpense: 0, netProfit: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadTransactions() {
      try {
        setLoading(true);
        const res = await fetch("/api/flow/transactions");
        const json = await res.json();
        if (json.success) {
          setTransactions(json.data);
          setSummary(json.summary);
        } else {
          setError(json.error || "Gagal memuat catatan transaksi");
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadTransactions();
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((t) => t.category && set.add(t.category));
    return ["all", ...Array.from(set)];
  }, [transactions]);

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      const matchType = typeFilter === "all" || t.type === typeFilter;
      const matchCat = categoryFilter === "all" || t.category === categoryFilter;
      const matchSearch =
        search === "" ||
        t.description.toLowerCase().includes(search.toLowerCase()) ||
        (t.category && t.category.toLowerCase().includes(search.toLowerCase()));
      return matchType && matchCat && matchSearch;
    });
  }, [transactions, typeFilter, categoryFilter, search]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <GooNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                3DFlow Ledger
              </span>
              <span className="text-xs text-slate-400 font-mono">474 Transaksi Riil</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
              Buku Kas &amp; Riwayat Transaksi Finansial
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Catatan pembukuan lengkap pemasukan dari pesanan Shopee, Tokopedia, cetak langsung, serta pengeluaran bahan &amp; operasional farm.
            </p>
          </div>
          <div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 font-mono">
              {transactions.length} Baris Catatan
            </span>
          </div>
        </div>

        {/* Summary KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 shadow-md">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Pemasukan (Inflow)</p>
            <p className="text-2xl font-black text-emerald-400 mt-1 font-mono">
              + Rp {summary.totalIncome.toLocaleString()}
            </p>
          </div>
          <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 shadow-md">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Pengeluaran (Outflow)</p>
            <p className="text-2xl font-black text-rose-400 mt-1 font-mono">
              - Rp {summary.totalExpense.toLocaleString()}
            </p>
          </div>
          <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 shadow-md">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Laba Bersih Operasional</p>
            <p className="text-2xl font-black text-white mt-1 font-mono">
              Rp {summary.netProfit.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-md">
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Cari transaksi berdasarkan deskripsi atau kategori..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
              {["all", "income", "expense"].map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize transition-colors ${
                    typeFilter === t
                      ? "bg-rose-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {t === "all" ? "Semua" : t === "income" ? "Pemasukan" : "Pengeluaran"}
                </button>
              ))}
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-800 bg-slate-950 text-slate-200 focus:outline-none"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  Kategori: {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Transactions Table */}
        {loading ? (
          <div className="text-center py-20 bg-slate-900/40 rounded-2xl border border-slate-800 text-slate-400 text-sm">
            Memuat buku kas keuangan...
          </div>
        ) : error ? (
          <div className="p-6 bg-rose-950/40 text-rose-300 rounded-2xl border border-rose-800 text-sm">
            {error}
          </div>
        ) : (
          <div className="bg-slate-900/60 rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Tanggal</th>
                    <th className="py-3 px-4">Deskripsi</th>
                    <th className="py-3 px-4">Kategori</th>
                    <th className="py-3 px-4">Tipe</th>
                    <th className="py-3 px-4 text-right">Nominal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filtered.map((t) => {
                    const isIncome = t.type === "income";
                    return (
                      <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-mono text-slate-400">
                          {new Date(t.date).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 font-medium text-white max-w-md truncate">
                          {t.description}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300 capitalize">
                            {t.category}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isIncome
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                            }`}
                          >
                            {isIncome ? "Pemasukan" : "Pengeluaran"}
                          </span>
                        </td>
                        <td
                          className={`py-3 px-4 text-right font-mono font-bold ${
                            isIncome ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {isIncome ? "+" : "-"} Rp {Math.round(t.amount).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
