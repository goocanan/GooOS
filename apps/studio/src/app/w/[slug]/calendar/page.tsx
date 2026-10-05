"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";

interface ContentItem {
  id: string;
  title: string;
  type: string;
  status: string;
  priority: string;
  scheduledAt: string | null;
  deadline: string | null;
  tags: string[];
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const TYPE_COLORS: Record<string, string> = {
  tiktok: "bg-rose-100 text-rose-700 border-rose-200",
  instagram_post: "bg-pink-100 text-pink-700 border-pink-200",
  instagram_reel: "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200",
  instagram_story: "bg-purple-100 text-purple-700 border-purple-200",
  youtube_video: "bg-red-100 text-red-700 border-red-200",
  youtube_short: "bg-orange-100 text-orange-700 border-orange-200",
  facebook_post: "bg-blue-100 text-blue-700 border-blue-200",
  facebook_reel: "bg-cyan-100 text-cyan-700 border-cyan-200",
  x_twitter: "bg-slate-100 text-slate-700 border-slate-200",
  linkedin: "bg-sky-100 text-sky-700 border-sky-200",
  blog: "bg-emerald-100 text-emerald-700 border-emerald-200",
  advertisement: "bg-amber-100 text-amber-700 border-amber-200",
};

const TYPE_LABELS: Record<string, string> = {
  tiktok: "TikTok",
  instagram_post: "IG Post",
  instagram_reel: "IG Reel",
  instagram_story: "IG Story",
  youtube_video: "YouTube",
  youtube_short: "YT Short",
  facebook_post: "FB Post",
  facebook_reel: "FB Reel",
  x_twitter: "X",
  linkedin: "LinkedIn",
  blog: "Blog",
  advertisement: "Ad",
};

export default function CalendarPage() {
  const params = useParams();
  const slug = params.slug as string;

  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchContent = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/workspaces/${slug}/content?limit=200`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setItems(data.content || []);
    } catch (err) {
      console.error("Calendar fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  // Calculate calendar grid
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const goToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
  };

  // Group items by scheduled date or deadline
  const getItemsForDate = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return items.filter((item) => {
      if (item.scheduledAt) {
        const d = new Date(item.scheduledAt);
        const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        return dStr === dateStr;
      }
      if (item.deadline) {
        const d = new Date(item.deadline);
        const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        return dStr === dateStr;
      }
      return false;
    });
  };

  const isToday = (day: number) =>
    day === today.getDate() &&
    currentMonth === today.getMonth() &&
    currentYear === today.getFullYear();

  // Build calendar cells
  const cells: Array<{ day: number; type: "prev" | "current" | "next" }> = [];

  // Previous month days
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({ day: daysInPrevMonth - i, type: "prev" });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, type: "current" });
  }

  // Next month days (fill to 42 cells = 6 rows)
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    cells.push({ day: d, type: "next" });
  }

  // Stats
  const scheduledCount = items.filter((i) => i.scheduledAt).length;
  const deadlineCount = items.filter((i) => i.deadline).length;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Content Calendar</h1>
          <p className="text-sm text-slate-500 mt-1">
            {scheduledCount} scheduled · {deadlineCount} with deadlines
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
          >
            ←
          </button>
          <button
            onClick={goToday}
            className="px-3 py-1.5 text-sm font-medium text-goo-700 bg-goo-50 rounded-lg hover:bg-goo-100"
          >
            Today
          </button>
          <button
            onClick={nextMonth}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
          >
            →
          </button>
          <span className="ml-2 text-lg font-semibold text-slate-900 min-w-[180px] text-center">
            {MONTHS[currentMonth]} {currentYear}
          </span>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-slate-200">
          {DAYS.map((day) => (
            <div
              key={day}
              className="px-2 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar cells */}
        <div className="grid grid-cols-7">
          {cells.map((cell, idx) => {
            const dayItems = cell.type === "current" ? getItemsForDate(cell.day) : [];
            return (
              <div
                key={idx}
                className={`min-h-[120px] border-b border-r border-slate-100 p-1.5 ${
                  cell.type !== "current" ? "bg-slate-50/50" : ""
                } ${isToday(cell.day) && cell.type === "current" ? "bg-goo-50/30" : ""}`}
              >
                <div
                  className={`text-xs font-medium mb-1 px-1 ${
                    cell.type !== "current"
                      ? "text-slate-300"
                      : isToday(cell.day)
                        ? "text-goo-700 font-bold"
                        : "text-slate-600"
                  }`}
                >
                  {cell.day}
                  {isToday(cell.day) && cell.type === "current" && (
                    <span className="ml-1 inline-block w-1.5 h-1.5 bg-goo-500 rounded-full" />
                  )}
                </div>
                <div className="space-y-0.5">
                  {dayItems.slice(0, 3).map((item) => (
                    <a
                      key={item.id}
                      href={`/w/${slug}/content/${item.id}`}
                      className={`block text-[10px] px-1 py-0.5 rounded truncate border ${
                        TYPE_COLORS[item.type] || "bg-slate-100 text-slate-600 border-slate-200"
                      }`}
                      title={item.title}
                    >
                      {TYPE_LABELS[item.type] || item.type}: {item.title}
                    </a>
                  ))}
                  {dayItems.length > 3 && (
                    <div className="text-[9px] text-slate-400 px-1">
                      +{dayItems.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-2">
        {Object.entries(TYPE_LABELS).map(([key, label]) => (
          <span
            key={key}
            className={`text-[10px] px-2 py-0.5 rounded-full border ${
              TYPE_COLORS[key] || "bg-slate-100 text-slate-600 border-slate-200"
            }`}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
