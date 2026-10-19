"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";

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
  const params = useParams();
  const slug = params.slug as string;

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
        const res = await fetch(`/api/workspaces/${slug}/flow/transactions`);
        const json = await res.json();
        if (json.success) {
          setTransactions(json.data);
          setSummary(json.summary);
        } else {
          setError(json.error || "Failed to load transactions");
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadTransactions();
  }, [slug]);

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
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Financial Ledger &amp; Cashflow
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Complete transaction history across Shopee, Tokopedia, direct client printing, and material purchases.
          </p>
        </div>
        <div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-goo-50 text-goo-700 border border-goo-200">
            {transactions.length} Recorded Transactions
          </span>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Inflow (Income)</p>
          <p className="text-2xl font-black text-emerald-600 mt-1 font-mono">
            + Rp {summary.totalIncome.toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Outflow (Expenses)</p>
          <p className="text-2xl font-black text-rose-600 mt-1 font-mono">
            - Rp {summary.totalExpense.toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Net Studio Profit</p>
          <p className="text-2xl font-black text-slate-900 mt-1 font-mono">
            Rp {summary.netProfit.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-goo-500/20 focus:border-goo-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <div className="flex bg-slate-100 p-1 rounded-lg">
            {["all", "income", "expense"].map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1 text-xs font-semibold rounded-md capitalize transition-colors ${
                  typeFilter === t ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-white focus:outline-none"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                Category: {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      {loading ? (
        <div className="text-center py-20 bg-white rounded-xl border border-slate-200 text-slate-400 text-sm">
          Loading financial ledger...
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-50 text-rose-700 rounded-xl border border-rose-200 text-sm">
          {error}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((t) => {
                  const isIncome = t.type === "income";
                  return (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                        {new Date(t.date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-900 line-clamp-1">{t.description}</p>
                        {t.orderId && (
                          <span className="text-[10px] text-slate-400 font-mono">Ref Order: {t.orderId.slice(0, 8)}...</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 uppercase">
                          {t.category || "General"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
                            isIncome ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                          }`}
                        >
                          {t.type}
                        </span>
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-mono font-bold text-sm ${
                          isIncome ? "text-emerald-600" : "text-rose-600"
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
    </div>
  );
}
