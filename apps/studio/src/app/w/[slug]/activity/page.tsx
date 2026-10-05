"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";

interface ActivityLog {
  id: string;
  action: string;
  entity: string | null;
  entityId: string | null;
  metadata: Record<string, any> | null;
  createdAt: string;
  userId: string | null;
  userName: string | null;
  userAvatar: string | null;
}

const ACTION_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  member_invited: { label: "invited a new member", icon: "👋", color: "bg-emerald-50 text-emerald-700" },
  member_role_changed: { label: "changed a member's role", icon: "🔑", color: "bg-violet-50 text-violet-700" },
  member_removed: { label: "removed a member", icon: "🚪", color: "bg-red-50 text-red-700" },
  content_created: { label: "created content", icon: "✨", color: "bg-emerald-50 text-emerald-700" },
  content_updated: { label: "updated content", icon: "✏️", color: "bg-blue-50 text-blue-700" },
  content_deleted: { label: "deleted content", icon: "🗑", color: "bg-red-50 text-red-700" },
  approval_requested: { label: "requested approval", icon: "📩", color: "bg-amber-50 text-amber-700" },
  approval_granted: { label: "approved content", icon: "✅", color: "bg-emerald-50 text-emerald-700" },
  approval_rejected: { label: "rejected content", icon: "❌", color: "bg-red-50 text-red-700" },
  brand_created: { label: "created a brand", icon: "✨", color: "bg-emerald-50 text-emerald-700" },
  brand_updated: { label: "updated a brand", icon: "✏️", color: "bg-blue-50 text-blue-700" },
  asset_uploaded: { label: "uploaded an asset", icon: "📎", color: "bg-emerald-50 text-emerald-700" },
};

function getActionInfo(action: string) {
  return ACTION_LABELS[action] || { label: action.replace(/_/g, " "), icon: "📌", color: "bg-slate-50 text-slate-700" };
}

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(date).toLocaleDateString();
}

export default function ActivityPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<string>("all");

  const fetchActivity = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/workspaces/${slug}/activity?limit=50`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load activity");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  const filteredLogs = filter === "all" ? logs : logs.filter((l) => l.entity === filter);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="animate-pulse space-y-3">
          <div className="h-8 w-1/4 bg-slate-100 rounded" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-slate-50 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Activity Feed</h1>
          <p className="text-sm text-slate-500 mt-1">{logs.length} recent events</p>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-goo-500"
        >
          <option value="all">All events</option>
          <option value="workspace">Members</option>
          <option value="content">Content</option>
          <option value="approval">Approvals</option>
          <option value="brand">Brands</option>
          <option value="asset">Assets</option>
        </select>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-2">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-lg">
            <p className="text-slate-400">No activity yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Activity will appear here as your team works
            </p>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const info = getActionInfo(log.action);
            return (
              <div
                key={log.id}
                className="bg-white rounded-lg border border-slate-200 p-4 flex items-start gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-goo-100 flex items-center justify-center text-goo-700 font-bold shrink-0">
                  {(log.userName || "?").charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700">
                    <span className="font-medium text-slate-900">
                      {log.userName || "Someone"}
                    </span>{" "}
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${info.color}`}>
                      <span>{info.icon}</span>
                      {info.label}
                    </span>
                  </p>
                  <p className="text-xs text-slate-400 mt-1">{timeAgo(log.createdAt)}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}