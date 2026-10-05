"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";

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

interface ContentItem {
  id: string;
  title: string;
  type: string;
  status: ContentStatus;
  priority: string;
  tags: string[];
  updatedAt: string;
}

interface KanbanColumn {
  key: ContentStatus;
  title: string;
  color: string;
  bgColor: string;
  items: ContentItem[];
}

const COLUMNS: Omit<KanbanColumn, "items">[] = [
  { key: "idea", title: "💡 Idea", color: "text-slate-600", bgColor: "bg-slate-50" },
  { key: "planned", title: "📋 Planned", color: "text-violet-600", bgColor: "bg-violet-50" },
  { key: "script", title: "📝 Script", color: "text-blue-600", bgColor: "bg-blue-50" },
  { key: "production", title: "🎬 Production", color: "text-amber-600", bgColor: "bg-amber-50" },
  { key: "editing", title: "✂️ Editing", color: "text-orange-600", bgColor: "bg-orange-50" },
  { key: "review", title: "👀 Review", color: "text-cyan-600", bgColor: "bg-cyan-50" },
  { key: "approved", title: "✅ Approved", color: "text-emerald-600", bgColor: "bg-emerald-50" },
  { key: "scheduled", title: "📅 Scheduled", color: "text-indigo-600", bgColor: "bg-indigo-50" },
  { key: "published", title: "🚀 Published", color: "text-green-600", bgColor: "bg-green-50" },
];

const PRIORITY_DOT: Record<string, string> = {
  low: "bg-slate-300",
  medium: "bg-blue-400",
  high: "bg-orange-400",
  urgent: "bg-red-500",
};

export default function KanbanBoardPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [columns, setColumns] = useState<KanbanColumn[]>(
    COLUMNS.map((col) => ({ ...col, items: [] }))
  );
  const [loading, setLoading] = useState(true);

  const fetchContent = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/workspaces/${slug}/content?limit=100`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const items: ContentItem[] = data.content || [];

      const grouped = COLUMNS.map((col) => ({
        ...col,
        items: items.filter((item) => item.status === col.key),
      }));

      setColumns(grouped);
    } catch (err) {
      console.error("Kanban fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const totalItems = columns.reduce((sum, col) => sum + col.items.length, 0);

  return (
    <div className="max-w-full mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Kanban Board</h1>
        <p className="text-sm text-slate-500 mt-1">
          Drag content through the pipeline — {totalItems} total items
        </p>
      </div>

      {/* Kanban board */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max" style={{ minWidth: columns.length * 280 }}>
          {columns.map((col) => (
            <div
              key={col.key}
              className={`w-72 flex-shrink-0 rounded-xl border border-slate-200 ${col.bgColor} flex flex-col`}
            >
              {/* Column header */}
              <div className="p-3 border-b border-slate-200/60">
                <div className="flex items-center justify-between">
                  <h3 className={`text-sm font-semibold ${col.color}`}>
                    {col.title}
                  </h3>
                  <span className="text-xs font-medium bg-white/70 px-2 py-0.5 rounded-full text-slate-600">
                    {col.items.length}
                  </span>
                </div>
              </div>

              {/* Cards */}
              <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-280px)]">
                {loading ? (
                  Array.from({ length: 2 }).map((_, i) => (
                    <div
                      key={i}
                      className="rounded-lg bg-white/70 border border-slate-200/60 p-3 animate-pulse"
                    >
                      <div className="h-3 w-3/4 bg-slate-200 rounded mb-2" />
                      <div className="h-2 w-1/2 bg-slate-100 rounded" />
                    </div>
                  ))
                ) : col.items.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-400">
                    No items
                  </div>
                ) : (
                  col.items.map((item) => (
                    <KanbanCard key={item.id} item={item} slug={slug} />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function KanbanCard({ item, slug }: { item: ContentItem; slug: string }) {
  return (
    <a
      href={`/w/${slug}/content/${item.id}`}
      className="block rounded-lg bg-white border border-slate-200 p-3 hover:shadow-md hover:border-slate-300 transition-all cursor-pointer group"
    >
      <div className="flex items-start gap-2">
        <div
          className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${PRIORITY_DOT[item.priority] || "bg-slate-300"}`}
          title={`Priority: ${item.priority}`}
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-900 leading-snug line-clamp-2 group-hover:text-goo-700 transition-colors">
            {item.title}
          </p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">
              {item.type.replace("_", " ")}
            </span>
            {item.tags && item.tags.length > 0 && (
              <span className="text-[10px] text-slate-400">
                #{item.tags[0]}
              </span>
            )}
          </div>
        </div>
      </div>
    </a>
  );
}
