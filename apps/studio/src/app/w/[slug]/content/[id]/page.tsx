"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type ContentStatus =
  | "idea" | "planned" | "script" | "production" | "editing"
  | "review" | "approved" | "scheduled" | "published" | "archived";

interface ContentDetail {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: ContentStatus;
  priority: string;
  tags: string[];
  deadline: string | null;
  scheduledAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  brandId: string | null;
  ownerId: string | null;
}

interface Comment {
  id: string;
  body: string;
  userId: string;
  createdAt: string;
}

interface Approval {
  id: string;
  status: string;
  reason: string | null;
  reviewerId: string;
  createdAt: string;
}

interface LinkedAsset {
  id: string;
  name: string;
  type: string;
  url: string;
  thumbnailUrl: string | null;
  size: number;
  role: string | null;
}

const STATUS_OPTIONS: ContentStatus[] = [
  "idea", "planned", "script", "production", "editing",
  "review", "approved", "scheduled", "published", "archived",
];

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

export default function ContentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const contentId = params.id as string;

  const [content, setContent] = useState<ContentDetail | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [assets, setAssets] = useState<LinkedAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"details" | "comments" | "assets" | "approvals">("details");
  const [newComment, setNewComment] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/workspaces/${slug}/content/${contentId}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setContent(data.content);
      setComments(data.comments || []);
      setApprovals(data.approvals || []);
      setAssets(data.assets || []);
      setEditTitle(data.content?.title || "");
      setEditDescription(data.content?.description || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load content");
    } finally {
      setLoading(false);
    }
  }, [slug, contentId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleStatusChange = async (newStatus: ContentStatus) => {
    if (!content) return;
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/workspaces/${slug}/content/${contentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update status");
      }
      const data = await res.json();
      setContent(data.content);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!content) return;
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/workspaces/${slug}/content/${contentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle, description: editDescription }),
      });
      if (!res.ok) throw new Error("Failed to save");
      const data = await res.json();
      setContent(data.content);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    setPostingComment(true);
    try {
      const res = await fetch(`/api/workspaces/${slug}/content/${contentId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: newComment }),
      });
      if (!res.ok) throw new Error("Failed to add comment");
      const data = await res.json();
      setComments((prev) => [...prev, data.comment]);
      setNewComment("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add comment");
    } finally {
      setPostingComment(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure? This action cannot be undone.")) return;
    try {
      const res = await fetch(`/api/workspaces/${slug}/content/${contentId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      router.push(`/w/${slug}/content`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-1/3 bg-slate-100 rounded" />
          <div className="h-4 w-1/2 bg-slate-50 rounded" />
          <div className="h-32 bg-slate-50 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error && !content) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="p-6 bg-red-50 border border-red-200 rounded-xl">
          <h3 className="font-semibold text-red-700">Error</h3>
          <p className="text-sm text-red-600 mt-1">{error}</p>
          <Link
            href={`/w/${slug}/content`}
            className="mt-3 inline-block text-sm text-goo-600 hover:underline"
          >
            ← Back to content list
          </Link>
        </div>
      </div>
    );
  }

  if (!content) return null;

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
        <Link href={`/w/${slug}/content`} className="hover:text-slate-900">
          ← Content
        </Link>
        <span>/</span>
        <span className="text-slate-700 truncate">{content.title}</span>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        {editing ? (
          <div className="space-y-3">
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-lg font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-goo-500"
            />
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-goo-500 resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={handleSaveEdit}
                disabled={updatingStatus}
                className="px-3 py-1.5 bg-goo-600 text-white rounded-lg text-sm font-medium hover:bg-goo-700 disabled:opacity-50"
              >
                Save
              </button>
              <button
                onClick={() => setEditing(false)}
                className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-bold text-slate-900">{content.title}</h1>
                {content.description && (
                  <p className="text-sm text-slate-600 mt-2">{content.description}</p>
                )}
              </div>
              <button
                onClick={() => setEditing(true)}
                className="text-sm text-goo-600 hover:underline shrink-0"
              >
                ✎ Edit
              </button>
            </div>

            {/* Status badges */}
            <div className="flex items-center gap-2 mt-4 flex-wrap">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[content.status]}`}>
                {content.status.replace("_", " ")}
              </span>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 capitalize">
                {content.priority} priority
              </span>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase">
                {content.type.replace("_", " ")}
              </span>
              {content.tags && content.tags.length > 0 && (
                content.tags.map((tag) => (
                  <span key={tag} className="text-xs bg-slate-50 text-slate-500 px-2 py-0.5 rounded">
                    #{tag}
                  </span>
                ))
              )}
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100">
              <MetaItem label="Created" value={new Date(content.createdAt).toLocaleDateString()} />
              <MetaItem label="Updated" value={new Date(content.updatedAt).toLocaleDateString()} />
              <MetaItem
                label="Deadline"
                value={content.deadline ? new Date(content.deadline).toLocaleDateString() : "—"}
              />
              <MetaItem
                label="Scheduled"
                value={content.scheduledAt ? new Date(content.scheduledAt).toLocaleDateString() : "—"}
              />
            </div>
          </>
        )}
      </div>

      {/* Status pipeline */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Pipeline Status</h2>
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {STATUS_OPTIONS.map((status, idx) => (
            <div key={status} className="flex items-center shrink-0">
              <button
                onClick={() => handleStatusChange(status)}
                disabled={updatingStatus}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                  content.status === status
                    ? STATUS_COLORS[status]
                    : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                }`}
              >
                {status.replace("_", " ")}
              </button>
              {idx < STATUS_OPTIONS.length - 1 && (
                <span className="text-slate-300 mx-0.5">→</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="flex border-b border-slate-200">
          {(["details", "comments", "assets", "approvals"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-goo-500 text-goo-700"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === "comments" && comments.length > 0 && (
                <span className="ml-1.5 text-xs bg-slate-100 px-1.5 py-0.5 rounded-full">
                  {comments.length}
                </span>
              )}
              {tab === "assets" && assets.length > 0 && (
                <span className="ml-1.5 text-xs bg-slate-100 px-1.5 py-0.5 rounded-full">
                  {assets.length}
                </span>
              )}
              {tab === "approvals" && approvals.length > 0 && (
                <span className="ml-1.5 text-xs bg-slate-100 px-1.5 py-0.5 rounded-full">
                  {approvals.length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Details Tab */}
          {activeTab === "details" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-2">Description</h3>
                <p className="text-sm text-slate-600">
                  {content.description || "No description added yet."}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {content.tags && content.tags.length > 0 ? (
                    content.tags.map((tag) => (
                      <span key={tag} className="text-xs bg-slate-50 text-slate-600 px-2 py-1 rounded">
                        #{tag}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-slate-400">No tags</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Comments Tab */}
          {activeTab === "comments" && (
            <div className="space-y-4">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                  placeholder="Add a comment..."
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-goo-500"
                />
                <button
                  onClick={handleAddComment}
                  disabled={postingComment || !newComment.trim()}
                  className="px-4 py-2 bg-goo-600 text-white rounded-lg text-sm font-medium hover:bg-goo-700 disabled:opacity-50"
                >
                  {postingComment ? "..." : "Post"}
                </button>
              </div>
              <div className="space-y-3">
                {comments.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">No comments yet</p>
                ) : (
                  comments.map((c) => (
                    <div key={c.id} className="flex gap-3 p-3 bg-slate-50 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-goo-100 flex items-center justify-center text-goo-700 text-xs font-bold shrink-0">
                        U
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-slate-700">{c.body}</p>
                        <p className="text-xs text-slate-400 mt-1">
                          {new Date(c.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Assets Tab */}
          {activeTab === "assets" && (
            <div className="space-y-4">
              {assets.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">
                  No assets linked to this content
                </p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {assets.map((a) => (
                    <div key={a.id} className="rounded-lg border border-slate-200 p-3">
                      <div className="aspect-square bg-slate-50 rounded mb-2 flex items-center justify-center">
                        {a.thumbnailUrl ? (
                          <img src={a.thumbnailUrl} alt={a.name} className="w-full h-full object-cover rounded" />
                        ) : (
                          <span className="text-2xl">📎</span>
                        )}
                      </div>
                      <p className="text-xs font-medium text-slate-700 truncate">{a.name}</p>
                      {a.role && (
                        <p className="text-[10px] text-slate-400 mt-0.5">Role: {a.role}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Approvals Tab */}
          {activeTab === "approvals" && (
            <div className="space-y-3">
              {approvals.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">
                  No approval requests yet
                </p>
              ) : (
                approvals.map((a) => (
                  <div key={a.id} className="p-3 border border-slate-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${
                        a.status === "approved" ? "bg-emerald-100 text-emerald-700" :
                        a.status === "rejected" ? "bg-red-100 text-red-700" :
                        a.status === "changes_requested" ? "bg-amber-100 text-amber-700" :
                        "bg-slate-100 text-slate-600"
                      }`}>
                        {a.status.replace("_", " ")}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(a.createdAt).toLocaleString()}
                      </span>
                    </div>
                    {a.reason && <p className="text-sm text-slate-600 mt-2">{a.reason}</p>}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Danger zone */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={handleDelete}
          className="px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg"
        >
          🗑 Delete Content
        </button>
      </div>
    </div>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">{label}</p>
      <p className="text-sm text-slate-700 mt-0.5">{value}</p>
    </div>
  );
}
