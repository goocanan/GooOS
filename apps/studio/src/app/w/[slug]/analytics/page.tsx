"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";

interface AnalyticsData {
  range: string;
  contentStats: {
    total: number;
    published: number;
    inReview: number;
    approved: number;
    draft: number;
    idea: number;
  };
  typeStats: { type: string; count: number }[];
  platformMetrics: {
    platform: string;
    totalViews: string;
    totalLikes: string;
    totalComments: string;
    totalShares: string;
    totalSaves: string;
    avgCtr: string;
    avgEngagement: string;
    followersGained: string;
  }[];
  totals: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
    saves: number;
    followersGained: number;
  };
  approvalStats: {
    total: number;
    approved: number;
    rejected: number;
    pending: number;
    changesRequested: number;
  };
  memberActivity: { userName: string; actionCount: number }[];
  brandCount: number;
  assetCount: number;
  aiGenerations: number;
  aiTokensUsed: number;
}

const PLATFORM_COLORS: Record<string, string> = {
  instagram: "#E1306C",
  tiktok: "#000000",
  youtube: "#FF0000",
  twitter: "#1DA1F2",
  facebook: "#1877F2",
  linkedin: "#0A66C2",
};

export default function AnalyticsPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [range, setRange] = useState("30d");

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/workspaces/${slug}/analytics?range=${range}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, [slug, range]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-1/4 bg-slate-100 rounded" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-slate-50 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      </div>
    );
  }

  const d = data!;
  const engagementRate = d.totals.views > 0
    ? ((d.totals.likes + d.totals.comments + d.totals.shares + d.totals.saves) / d.totals.views * 100).toFixed(2)
    : "0.00";

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
          <p className="text-sm text-slate-500 mt-1">Content performance & team insights</p>
        </div>
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
          {["7d", "30d", "90d"].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                range === r ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {r === "7d" ? "7 days" : r === "30d" ? "30 days" : "90 days"}
            </button>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <KpiCard label="Total Views" value={d.totals.views.toLocaleString()} icon="👁️" trend={+2.5} />
        <KpiCard label="Engagement Rate" value={`${engagementRate}%`} icon="📈" trend={+1.2} />
        <KpiCard label="Followers Gained" value={`+${d.totals.followersGained}`} icon="👤" trend={+0.8} />
        <KpiCard label="Content Published" value={d.contentStats.published.toString()} icon="✅" trend={+0.5} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Platform metrics */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Platform Performance</h2>
          {d.platformMetrics.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              No platform data yet. Connect social accounts to track metrics.
            </div>
          ) : (
            <div className="space-y-3">
              {d.platformMetrics.map((pm) => {
                const color = PLATFORM_COLORS[pm.platform] || "#64748b";
                const views = Number(pm.totalViews);
                const engagement = views > 0
                  ? ((Number(pm.totalLikes) + Number(pm.totalComments) + Number(pm.totalShares)) / views * 100).toFixed(1)
                  : "0.0";
                return (
                  <div key={pm.platform} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ background: color }} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-slate-900 capitalize">{pm.platform}</p>
                      <div className="flex gap-4 text-xs text-slate-500 mt-0.5">
                        <span>{views.toLocaleString()} views</span>
                        <span>{Number(pm.totalLikes).toLocaleString()} likes</span>
                        <span>{engagement}% eng.</span>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-emerald-600">+{pm.followersGained}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Content status breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Content Pipeline</h2>
          <div className="space-y-3">
            {[
              { label: "Ideas", value: d.contentStats.idea, color: "bg-slate-400" },
              { label: "Drafts", value: d.contentStats.draft, color: "bg-blue-400" },
              { label: "In Review", value: d.contentStats.inReview, color: "bg-amber-400" },
              { label: "Approved", value: d.contentStats.approved, color: "bg-emerald-400" },
              { label: "Published", value: d.contentStats.published, color: "bg-violet-400" },
            ].map((s) => {
              const pct = d.contentStats.total > 0 ? (s.value / d.contentStats.total) * 100 : 0;
              return (
                <div key={s.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-slate-600">{s.label}</span>
                    <span className="text-sm font-medium text-slate-900">{s.value}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${s.color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-sm text-slate-500">
              Total: <span className="font-semibold text-slate-900">{d.contentStats.total}</span> items
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Approval stats */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Approvals</h2>
          <div className="grid grid-cols-2 gap-3">
            <StatBox label="Pending" value={d.approvalStats.pending} color="text-amber-600" />
            <StatBox label="Approved" value={d.approvalStats.approved} color="text-emerald-600" />
            <StatBox label="Rejected" value={d.approvalStats.rejected} color="text-red-600" />
            <StatBox label="Changes" value={d.approvalStats.changesRequested} color="text-blue-600" />
          </div>
        </div>

        {/* Content types */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Content Types</h2>
          {d.typeStats.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">No content yet</p>
          ) : (
            <div className="space-y-2">
              {d.typeStats.map((t) => (
                <div key={t.type} className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 capitalize">{t.type}</span>
                  <span className="text-sm font-medium text-slate-900">{t.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick stats */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Workspace</h2>
          <div className="space-y-2">
            <Row label="Brands" value={d.brandCount} />
            <Row label="Assets" value={d.assetCount} />
            <Row label="AI Generations" value={d.aiGenerations} />
            <Row label="AI Tokens Used" value={d.aiTokensUsed} />
          </div>
        </div>
      </div>

      {/* Top contributors */}
      {d.memberActivity.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 mt-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Top Contributors (last {range})</h2>
          <div className="space-y-3">
            {d.memberActivity.map((m, i) => {
              const maxCount = d.memberActivity[0]?.actionCount || 1;
              const pct = (m.actionCount / maxCount) * 100;
              return (
                <div key={m.userName || `user-${i}`} className="flex items-center gap-3">
                  <span className="text-sm text-slate-400 w-4">{i + 1}.</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-slate-900">{m.userName || "Unknown"}</span>
                      <span className="text-xs text-slate-500">{m.actionCount} actions</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-goo-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function KpiCard({ label, value, icon, trend }: { label: string; value: string; icon: string; trend: number }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        <span className={`text-xs font-medium ${trend >= 0 ? "text-emerald-600" : "text-red-600"}`}>
          {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}%
        </span>
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500 mt-1">{label}</p>
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-slate-50 rounded-lg p-3 text-center">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-slate-500 mt-1">{label}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-slate-600">{label}</span>
      <span className="text-sm font-medium text-slate-900">{value.toLocaleString()}</span>
    </div>
  );
}
