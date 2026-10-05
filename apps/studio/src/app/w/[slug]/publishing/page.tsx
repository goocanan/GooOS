"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";

interface PlatformAccount {
  id: string;
  platform: string;
  accountName: string;
  isConnected: boolean;
  connectedAt: string;
}

interface ScheduledPost {
  scheduled: {
    id: string;
    contentId: string;
    platformAccountId: string;
    scheduledAt: string;
    status: string;
    publishedAt?: string;
  };
  contentTitle?: string;
  platformName?: string;
}

const PLATFORMS = [
  { id: "instagram", label: "Instagram", icon: "📷", color: "#E1306C" },
  { id: "tiktok", label: "TikTok", icon: "🎵", color: "#000000" },
  { id: "youtube", label: "YouTube", icon: "🎬", color: "#FF0000" },
  { id: "twitter", label: "Twitter/X", icon: "𝕏", color: "#000000" },
  { id: "facebook", label: "Facebook", icon: "f", color: "#1877F2" },
  { id: "linkedin", label: "LinkedIn", icon: "in", color: "#0A66C2" },
];

const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-700 border-blue-200",
  publishing: "bg-amber-100 text-amber-700 border-amber-200",
  published: "bg-emerald-100 text-emerald-700 border-emerald-200",
  failed: "bg-red-100 text-red-700 border-red-200",
};

export default function PublishingPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [accounts, setAccounts] = useState<PlatformAccount[]>([]);
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState("");
  const [filter, setFilter] = useState("all");

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await fetch(`/api/workspaces/${slug}/publishing/accounts`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setAccounts(data.accounts || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load accounts");
    }
  }, [slug]);

  const fetchScheduledPosts = useCallback(async () => {
    try {
      const url = filter === "all" 
        ? `/api/workspaces/${slug}/publishing/scheduled`
        : `/api/workspaces/${slug}/publishing/scheduled?status=${filter}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setScheduledPosts(data.posts || []);
    } catch (err) {
      console.error(err);
    }
  }, [slug, filter]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchAccounts(), fetchScheduledPosts()]).finally(() => setLoading(false));
  }, [fetchAccounts, fetchScheduledPosts]);

  const handleConnectPlatform = async (platform: string) => {
    setConnecting(true);
    setError("");
    try {
      const res = await fetch(`/api/workspaces/${slug}/publishing/accounts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform,
          accountId: `${platform}_${Date.now()}`,
          accountName: `${platform} Account`,
          accessToken: "mock-oauth-token",
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to connect");
      }
      const data = await res.json();
      setAccounts((prev) => [...prev, data.account]);
      setSelectedPlatform("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async (accountId: string) => {
    if (!confirm("Disconnect this account?")) return;
    try {
      const res = await fetch(`/api/workspaces/${slug}/publishing/accounts/${accountId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed");
      setAccounts((prev) => prev.filter((a) => a.id !== accountId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to disconnect");
    }
  };

  const handlePublishNow = async (postId: string) => {
    try {
      const res = await fetch(`/api/workspaces/${slug}/publishing/scheduled/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "publish_now" }),
      });
      if (!res.ok) throw new Error("Failed");
      setScheduledPosts((prev) =>
        prev.map((p) =>
          p.scheduled.id === postId
            ? { ...p, scheduled: { ...p.scheduled, status: "published" } }
            : p
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish");
    }
  };

  const handleUnschedule = async (postId: string) => {
    if (!confirm("Unschedule this post?")) return;
    try {
      const res = await fetch(`/api/workspaces/${slug}/publishing/scheduled/${postId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed");
      setScheduledPosts((prev) => prev.filter((p) => p.scheduled.id !== postId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unschedule");
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-1/4 bg-slate-100 rounded" />
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-20 bg-slate-50 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const filteredPosts = filter === "all" ? scheduledPosts : scheduledPosts.filter((p) => p.scheduled.status === filter);

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Publishing</h1>
        <p className="text-sm text-slate-500 mt-1">Schedule & manage social media posts</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Connected accounts */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Connected Accounts</h2>
          <span className="text-xs text-slate-500">{accounts.length}/6 platforms</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {PLATFORMS.map((platform) => {
            const connected = accounts.find((a) => a.platform === platform.id);
            return (
              <div
                key={platform.id}
                className={`p-4 rounded-lg border-2 text-center transition-all cursor-pointer ${
                  connected
                    ? "border-emerald-500 bg-emerald-50"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <div className="text-3xl mb-2">{platform.icon}</div>
                <p className="text-xs font-medium text-slate-900">{platform.label}</p>
                {connected ? (
                  <div className="mt-2 space-y-1">
                    <p className="text-[10px] text-emerald-600 font-medium">Connected</p>
                    <button
                      onClick={() => handleDisconnect(connected.id)}
                      className="text-[10px] text-emerald-600 hover:underline"
                    >
                      Disconnect
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setSelectedPlatform(platform.id)}
                    disabled={connecting}
                    className="mt-2 text-[10px] text-goo-600 hover:underline disabled:opacity-50"
                  >
                    Connect
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {selectedPlatform && (
          <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-600">
                Connecting{" "}
                <span className="font-medium">
                  {PLATFORMS.find((p) => p.id === selectedPlatform)?.label}
                </span>
                ...
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleConnectPlatform(selectedPlatform)}
                  disabled={connecting}
                  className="px-3 py-1 bg-goo-600 text-white text-xs rounded font-medium hover:bg-goo-700 disabled:opacity-50"
                >
                  {connecting ? "Connecting..." : "Complete"}
                </button>
                <button
                  onClick={() => setSelectedPlatform("")}
                  className="px-3 py-1 text-slate-600 text-xs hover:bg-slate-100 rounded"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Scheduled posts */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Scheduled Posts</h2>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-goo-500"
          >
            <option value="all">All posts</option>
            <option value="scheduled">Scheduled</option>
            <option value="publishing">Publishing</option>
            <option value="published">Published</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        <div className="space-y-3">
          {filteredPosts.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-lg">
              <p className="text-slate-400">No scheduled posts</p>
              <p className="text-xs text-slate-400 mt-1">
                Create content and schedule it for publishing
              </p>
            </div>
          ) : (
            filteredPosts.map((post) => (
              <div key={post.scheduled.id} className="bg-white rounded-lg border border-slate-200 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-slate-900">{post.contentTitle || "Untitled"}</p>
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded-full border ${
                          STATUS_COLORS[post.scheduled.status]
                        }`}
                      >
                        {post.scheduled.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">→ {post.platformName || "Platform"}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      📅 {new Date(post.scheduled.scheduledAt).toLocaleString()}
                    </p>
                    {post.scheduled.publishedAt && (
                      <p className="text-xs text-emerald-600 mt-1">
                        ✓ Published: {new Date(post.scheduled.publishedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {post.scheduled.status === "scheduled" && (
                      <>
                        <button
                          onClick={() => handlePublishNow(post.scheduled.id)}
                          className="text-xs text-goo-600 hover:bg-goo-50 px-2 py-1 rounded"
                        >
                          Publish Now
                        </button>
                        <button
                          onClick={() => handleUnschedule(post.scheduled.id)}
                          className="text-xs text-red-600 hover:bg-red-50 px-2 py-1 rounded"
                        >
                          🗑
                        </button>
                      </>
                    )}
                    {post.scheduled.status !== "scheduled" && (
                      <button
                        onClick={() => handleUnschedule(post.scheduled.id)}
                        className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1 rounded"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick tip */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-700">
          💡 <span className="font-medium">Tip:</span> Connect your social media accounts above, then go to any content item to schedule it for publishing across multiple platforms.
        </p>
      </div>
    </div>
  );
}
