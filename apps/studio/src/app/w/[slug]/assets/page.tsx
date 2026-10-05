"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";

type AssetType = "image" | "video" | "gif" | "document" | "stl" | "3mf" | "zip" | "other";

interface AssetItem {
  id: string;
  name: string;
  type: AssetType;
  size: number;
  mimeType: string | null;
  url: string;
  thumbnailUrl: string | null;
  resolution: string | null;
  duration: number | null;
  tags: string[];
  createdAt: string;
  brandName: string | null;
}

const TYPE_ICONS: Record<AssetType, string> = {
  image: "🖼️",
  video: "🎬",
  gif: "🎞️",
  document: "📄",
  stl: "🧊",
  "3mf": "🧊",
  zip: "📦",
  other: "📎",
};

const TYPE_BG: Record<AssetType, string> = {
  image: "bg-pink-50 border-pink-200",
  video: "bg-blue-50 border-blue-200",
  gif: "bg-purple-50 border-purple-200",
  document: "bg-amber-50 border-amber-200",
  stl: "bg-cyan-50 border-cyan-200",
  "3mf": "bg-teal-50 border-teal-200",
  zip: "bg-slate-50 border-slate-200",
  other: "bg-gray-50 border-gray-200",
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function AssetsPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filterType, setFilterType] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/workspaces/${slug}/assets`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setAssets(data.assets || []);
    } catch (err) {
      console.error("Assets fetch error:", err);
      // Show placeholder data for demo
      setAssets([]);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  // Filter assets
  const filtered = assets.filter((asset) => {
    if (filterType && asset.type !== filterType) return false;
    if (searchQuery && !asset.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Stats
  const totalSize = assets.reduce((sum, a) => sum + a.size, 0);
  const typeCounts = assets.reduce(
    (acc, a) => {
      acc[a.type] = (acc[a.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Assets</h1>
          <p className="text-sm text-slate-500 mt-1">
            {assets.length} files · {formatBytes(totalSize)} total
          </p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-goo-600 text-white rounded-lg text-sm font-medium hover:bg-goo-700 transition-colors"
        >
          ↑ Upload Asset
        </button>
      </div>

      {/* Filters & View Toggle */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder="Search assets..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 min-w-0 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-goo-500"
        />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-goo-500"
        >
          <option value="">All Types</option>
          <option value="image">Images</option>
          <option value="video">Videos</option>
          <option value="document">Documents</option>
          <option value="stl">STL Files</option>
          <option value="3mf">3MF Files</option>
          <option value="gif">GIFs</option>
          <option value="zip">Archives</option>
        </select>
        <div className="flex rounded-lg border border-slate-200 overflow-hidden">
          <button
            onClick={() => setViewMode("grid")}
            className={`px-3 py-2 text-sm font-medium ${
              viewMode === "grid"
                ? "bg-goo-50 text-goo-700"
                : "bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            ▦ Grid
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`px-3 py-2 text-sm font-medium ${
              viewMode === "list"
                ? "bg-goo-50 text-goo-700"
                : "bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            ☰ List
          </button>
        </div>
      </div>

      {/* Type summary chips */}
      {Object.keys(typeCounts).length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {Object.entries(typeCounts).map(([type, count]) => (
            <button
              key={type}
              onClick={() => setFilterType(filterType === type ? "" : type)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                filterType === type
                  ? TYPE_BG[type as AssetType] || "bg-slate-100 border-slate-200"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {TYPE_ICONS[type as AssetType] || "📎"} {type} ({count})
            </button>
          ))}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-slate-200 bg-white p-3 animate-pulse">
              <div className="aspect-square bg-slate-100 rounded-lg mb-3" />
              <div className="h-3 w-3/4 bg-slate-100 rounded" />
              <div className="h-2 w-1/2 bg-slate-50 rounded mt-2" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !assets.length && (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">📁</div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No assets yet</h3>
          <p className="text-slate-500 mb-6 max-w-sm mx-auto">
            Upload your first asset — images, videos, STL files for 3D printing, or any document.
          </p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-5 py-2.5 bg-goo-600 text-white rounded-lg text-sm font-medium hover:bg-goo-700"
          >
            ↑ Upload Asset
          </button>
        </div>
      )}

      {/* Filtered empty */}
      {!loading && assets.length > 0 && !filtered.length && (
        <div className="text-center py-12">
          <p className="text-slate-500">No assets match your filters.</p>
          <button
            onClick={() => {
              setFilterType("");
              setSearchQuery("");
            }}
            className="mt-3 text-sm text-goo-600 hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Grid view */}
      {!loading && viewMode === "grid" && filtered.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map((asset) => (
            <div
              key={asset.id}
              className={`rounded-xl border p-3 hover:shadow-md transition-shadow cursor-pointer ${
                TYPE_BG[asset.type] || "bg-white border-slate-200"
              }`}
            >
              {/* Thumbnail area */}
              <div className="aspect-square rounded-lg bg-white/60 border border-slate-200/60 flex items-center justify-center mb-3 overflow-hidden">
                {asset.thumbnailUrl ? (
                  <img
                    src={asset.thumbnailUrl}
                    alt={asset.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl">{TYPE_ICONS[asset.type]}</span>
                )}
              </div>
              <p className="text-sm font-medium text-slate-900 truncate" title={asset.name}>
                {asset.name}
              </p>
              <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                <span>{formatBytes(asset.size)}</span>
                {asset.duration && <span>{formatDuration(asset.duration)}</span>}
                {asset.resolution && <span>{asset.resolution}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List view */}
      {!loading && viewMode === "list" && filtered.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3 font-medium text-slate-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Type</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Size</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Added</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((asset) => (
                <tr key={asset.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span>{TYPE_ICONS[asset.type]}</span>
                      <span className="font-medium text-slate-900 truncate max-w-[250px]">
                        {asset.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500 uppercase text-xs">{asset.type}</td>
                  <td className="px-4 py-3 text-slate-500">{formatBytes(asset.size)}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(asset.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadAssetModal
          slug={slug}
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            setShowUploadModal(false);
            fetchAssets();
          }}
        />
      )}
    </div>
  );
}

function UploadAssetModal({
  slug,
  onClose,
  onSuccess,
}: {
  slug: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const dropped = Array.from(e.dataTransfer.files);
    setFiles((prev) => [...prev, ...dropped]);
  };

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUpload = async () => {
    if (!files.length) return;
    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      files.forEach((f) => formData.append("files", f));

      const res = await fetch(`/api/workspaces/${slug}/assets`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Upload failed");
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">Upload Assets</h2>
          <p className="text-sm text-slate-500 mt-1">
            Drag & drop files or click to browse. Supports images, videos, STL, 3MF, and documents.
          </p>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Drop zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              dragActive
                ? "border-goo-500 bg-goo-50"
                : "border-slate-300 hover:border-slate-400"
            }`}
          >
            <div className="text-3xl mb-2">📁</div>
            <p className="text-sm text-slate-600 mb-2">
              Drop files here or{" "}
              <label className="text-goo-600 hover:underline cursor-pointer">
                browse
                <input
                  type="file"
                  multiple
                  onChange={handleSelect}
                  className="hidden"
                  accept="image/*,video/*,.stl,.3mf,.gif,.zip,.pdf,.doc,.docx,.xls,.xlsx"
                />
              </label>
            </p>
            <p className="text-xs text-slate-400">Max 50MB per file</p>
          </div>

          {/* File list */}
          {files.length > 0 && (
            <div className="mt-4 space-y-2 max-h-40 overflow-y-auto">
              {files.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg"
                >
                  <span className="text-sm text-slate-700 truncate max-w-[300px]">
                    {f.name}
                  </span>
                  <button
                    onClick={() => removeFile(i)}
                    className="text-slate-400 hover:text-red-500 text-sm ml-2"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={uploading || !files.length}
            className="px-4 py-2 bg-goo-600 text-white rounded-lg text-sm font-medium hover:bg-goo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? "Uploading..." : `Upload ${files.length} file${files.length > 1 ? "s" : ""}`}
          </button>
        </div>
      </div>
    </div>
  );
}
