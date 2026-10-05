"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

type ContentType =
  | "tiktok"
  | "instagram_post"
  | "instagram_reel"
  | "instagram_story"
  | "youtube_video"
  | "youtube_short"
  | "facebook_post"
  | "facebook_reel"
  | "x_twitter"
  | "linkedin"
  | "blog"
  | "advertisement";

type ContentStatus =
  | "idea"
  | "planned"
  | "script"
  | "production"
  | "editing"
  | "review"
  | "approved"
  | "scheduled"
  | "published"
  | "archived";

type Priority = "low" | "medium" | "high" | "urgent";

interface ContentItem {
  id: string;
  title: string;
  description: string | null;
  type: ContentType;
  status: ContentStatus;
  priority: Priority;
  tags: string[];
  deadline: string | null;
  scheduledAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  brandName: string | null;
}

const STATUS_COLORS: Record<ContentStatus, string> = {
  idea: "bg-slate-100 text-slate-700",
  planned: "bg-violet-100 text-violet-700",
  script: "bg-blue-100 text-blue-700",
  production: "bg-amber-100 text-amber-700",
  editing: "bg-orange-100 text-orange-700",
  review: "bg-cyan-100 text-cyan-700",
  approved: "bg-emerald-100 text-emerald-700",
  scheduled: "bg-indigo-100 text-indigo-700",
  published: "bg-green-100 text-green-700",
  archived: "bg-gray-100 text-gray-600",
};

const PRIORITY_BADGES: Record<Priority, string> = {
  low: "bg-slate-100 text-slate-600",
  medium: "bg-blue-50 text-blue-600",
  high: "bg-orange-50 text-orange-600",
  urgent: "bg-red-50 text-red-600",
};

const TYPE_LABELS: Record<ContentType, string> = {
  tiktok: "TikTok",
  instagram_post: "IG Post",
  instagram_reel: "IG Reel",
  instagram_story: "IG Story",
  youtube_video: "YouTube",
  youtube_short: "YouTube Short",
  facebook_post: "FB Post",
  facebook_reel: "FB Reel",
  x_twitter: "X/Twitter",
  linkedin: "LinkedIn",
  blog: "Blog",
  advertisement: "Ad",
};

export default function ContentListPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType, setFilterType] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchContent = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "20");
      if (filterStatus) params.set("status", filterStatus);
      if (filterType) params.set("type", filterType);
      if (searchQuery) params.set("search", searchQuery);

      const res = await fetch(`/api/workspaces/${slug}/content?${params}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setItems(data.content || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load content");
    } finally {
      setLoading(false);
    }
  }, [slug, page, filterStatus, filterType, searchQuery]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Content</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage all your content across platforms
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-goo-600 text-white rounded-lg text-sm font-medium hover:bg-goo-700 transition-colors"
        >
          + New Content
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder="Search content..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(1);
          }}
          className="flex-1 min-w-0 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-goo-500 focus:border-transparent"
        />
        <select
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-goo-500"
        >
          <option value="">All Statuses</option>
          <option value="idea">Idea</option>
          <option value="planned">Planned</option>
          <option value="script">Script</option>
          <option value="production">Production</option>
          <option value="editing">Editing</option>
          <option value="review">Review</option>
          <option value="approved">Approved</option>
          <option value="scheduled">Scheduled</option>
          <option value="published">Published</option>
        </select>
        <select
          value={filterType}
          onChange={(e) => {
            setFilterType(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-goo-500"
        >
          <option value="">All Types</option>
          <option value="tiktok">TikTok</option>
          <option value="instagram_post">Instagram Post</option>
          <option value="instagram_reel">Instagram Reel</option>
          <option value="youtube_video">YouTube Video</option>
          <option value="youtube_short">YouTube Short</option>
          <option value="facebook_post">Facebook Post</option>
          <option value="x_twitter">X/Twitter</option>
          <option value="blog">Blog</option>
        </select>
      </div>

      {/* Error state */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
          <button
            onClick={fetchContent}
            className="ml-3 underline font-medium"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && !items.length && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-slate-200 bg-white p-5 animate-pulse">
              <div className="h-4 w-48 bg-slate-100 rounded mb-3" />
              <div className="h-3 w-72 bg-slate-50 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !items.length && !error && (
        <div className="text-center py-16">
          <div className="text-4xl mb-4">📝</div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No content yet</h3>
          <p className="text-slate-500 mb-4">
            Create your first piece of content to get started.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-goo-600 text-white rounded-lg text-sm font-medium hover:bg-goo-700"
          >
            + New Content
          </button>
        </div>
      )}

      {/* Content list */}
      <div className="space-y-3">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/w/${slug}/content/${item.id}`}
            className="block rounded-xl border border-slate-200 bg-white p-5 hover:shadow-md hover:border-slate-300 transition-all"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="font-semibold text-slate-900 truncate">
                    {item.title}
                  </h3>
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[item.status]}`}>
                    {item.status.replace("_", " ")}
                  </span>
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${PRIORITY_BADGES[item.priority]}`}>
                    {item.priority}
                  </span>
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {TYPE_LABELS[item.type]}
                  </span>
                </div>
                {item.description && (
                  <p className="text-sm text-slate-500 line-clamp-2 mt-1">
                    {item.description}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                  <span>Updated {new Date(item.updatedAt).toLocaleDateString()}</span>
                  {item.deadline && (
                    <span className="text-amber-600">
                      Deadline {new Date(item.deadline).toLocaleDateString()}
                    </span>
                  )}
                  {item.tags && item.tags.length > 0 && (
                    <span className="flex gap-1">
                      {item.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="bg-slate-50 px-1.5 py-0.5 rounded text-slate-500">
                          #{tag}
                        </span>
                      ))}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-slate-400 text-sm shrink-0">→</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>
          <span className="text-sm text-slate-500">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateContentModal
          slug={slug}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchContent();
          }}
        />
      )}
    </div>
  );
}

function CreateContentModal({
  slug,
  onClose,
  onSuccess,
}: {
  slug: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<ContentType>("tiktok");
  const [priority, setPriority] = useState<Priority>("medium");
  const [tags, setTags] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/workspaces/${slug}/content`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || null,
          type,
          priority,
          tags: tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create content");
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">New Content</h2>
          <p className="text-sm text-slate-500 mt-1">Create a new piece of content</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="e.g., Video: PLA vs PETG comparison"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-goo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Brief description of the content..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-goo-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Type *
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as ContentType)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-goo-500"
              >
                <option value="tiktok">TikTok</option>
                <option value="instagram_post">Instagram Post</option>
                <option value="instagram_reel">Instagram Reel</option>
                <option value="instagram_story">Instagram Story</option>
                <option value="youtube_video">YouTube Video</option>
                <option value="youtube_short">YouTube Short</option>
                <option value="facebook_post">Facebook Post</option>
                <option value="facebook_reel">Facebook Reel</option>
                <option value="x_twitter">X/Twitter</option>
                <option value="linkedin">LinkedIn</option>
                <option value="blog">Blog</option>
                <option value="advertisement">Advertisement</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-goo-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="3dprinting, tutorial, goocanan"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-goo-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !title}
              className="px-4 py-2 bg-goo-600 text-white rounded-lg text-sm font-medium hover:bg-goo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating..." : "Create Content"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
