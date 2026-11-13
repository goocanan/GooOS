"use client";

import React, { useState, useEffect } from "react";
import { Content, Post, PostStatus } from "@/lib/content-planner/types";
import { X, Check, Shield, FileText, Calendar, ExternalLink } from "lucide-react";

interface ContentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: Post | null;
  content: Content | null;
  onUpdateContent: (content: Content) => void;
  onUpdatePost: (post: Post) => void;
}

const POST_STATUSES: PostStatus[] = [
  "Idea",
  "Script",
  "Shoot",
  "Edit",
  "Scheduled",
  "Posted",
  "Archived",
];

export function ContentDetailModal({
  isOpen,
  onClose,
  post,
  content,
  onUpdateContent,
  onUpdatePost,
}: ContentDetailModalProps) {
  const [title, setTitle] = useState("");
  const [hook, setHook] = useState("");
  const [scriptStructure, setScriptStructure] = useState("");
  const [caption, setCaption] = useState("");
  const [ctaText, setCtaText] = useState("");
  const [postUrl, setPostUrl] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [status, setStatus] = useState<PostStatus>("Script");
  const [policyChecklist, setPolicyChecklist] = useState({
    no_weapon_likeness: true,
    safe_for_all_ages: true,
    platform_guidelines_compliant: true,
    clear_3d_printed_disclaimer: true,
  });

  useEffect(() => {
    if (content) {
      setTitle(content.title || "");
      setHook(content.brief?.hook || "");
      setScriptStructure(content.brief?.script_structure || "");
      setCaption(content.brief?.caption || "");
      setCtaText(content.brief?.cta_text || "");
      setPolicyChecklist(
        content.policy_checklist || {
          no_weapon_likeness: true,
          safe_for_all_ages: true,
          platform_guidelines_compliant: true,
          clear_3d_printed_disclaimer: true,
        }
      );
    }
    if (post) {
      setStatus(post.status);
      setPostUrl(post.post_url || "");
      setScheduledAt(post.scheduled_at || "");
    }
  }, [content, post, isOpen]);

  if (!isOpen || !content) return null;

  const handleSave = () => {
    const updatedContent: Content = {
      ...content,
      title,
      brief: {
        ...content.brief,
        hook,
        script_structure: scriptStructure,
        caption,
        cta_text: ctaText,
      },
      policy_checklist: policyChecklist,
    };
    onUpdateContent(updatedContent);

    if (post) {
      const updatedPost: Post = {
        ...post,
        status,
        post_url: postUrl.trim() || undefined,
        scheduled_at: scheduledAt || undefined,
      };
      onUpdatePost(updatedPost);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                Brief Konten & Produksi
              </span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                {content.code}
              </span>
              {post && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {post.platform}
                </span>
              )}
            </div>
            <h3 className="text-base font-semibold text-slate-100 truncate max-w-lg mt-0.5">
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Post status and schedule */}
          {post && (
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">
                  Status Tahapan Post
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as PostStatus)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
                >
                  {POST_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-medium">
                  Jadwal Tayang (Scheduled At)
                </label>
                <div className="relative">
                  <input
                    type="datetime-local"
                    value={scheduledAt ? scheduledAt.substring(0, 16) : ""}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-slate-300 mb-1 font-medium">Judul Konten</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500 text-xs"
            />
          </div>

          {/* Hook (0-3s) */}
          <div>
            <label className="block text-slate-300 mb-1 font-medium">
              Hook Kalimat Pembuka (0 - 3 Detik Pertama)
            </label>
            <input
              type="text"
              placeholder="Visual hook atau pertanyaan menarik..."
              value={hook}
              onChange={(e) => setHook(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500 text-xs"
            />
          </div>

          {/* Script structure */}
          <div>
            <label className="block text-slate-300 mb-1 font-medium">
              Struktur Script / Storyboard (Hook &rarr; Value &rarr; CTA)
            </label>
            <textarea
              rows={3}
              value={scriptStructure}
              onChange={(e) => setScriptStructure(e.target.value)}
              placeholder="Rincian alur shoot video..."
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500 text-xs leading-relaxed"
            />
          </div>

          {/* Caption & CTA */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 mb-1 font-medium">Caption Postingan</label>
              <textarea
                rows={3}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Teks caption..."
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500 text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-300 mb-1 font-medium">Teks CTA (Call to Action)</label>
              <textarea
                rows={3}
                value={ctaText}
                onChange={(e) => setCtaText(e.target.value)}
                placeholder="Ajakan komentar, link bio, klik keranjang..."
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500 text-xs"
              />
            </div>
          </div>

          {/* URL Post */}
          <div>
            <label className="block text-slate-300 mb-1 font-medium flex items-center gap-1.5">
              <span>Link URL Postingan Tayang</span>
              {postUrl && (
                <a
                  href={postUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5 text-[10px]"
                >
                  <ExternalLink className="w-2.5 h-2.5" /> Buka
                </a>
              )}
            </label>
            <input
              type="text"
              placeholder="https://www.tiktok.com/... atau https://www.instagram.com/reel/..."
              value={postUrl}
              onChange={(e) => setPostUrl(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500 text-xs font-mono"
            />
          </div>

          {/* Policy Checklist */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
              <Shield className="w-3.5 h-3.5 text-emerald-400" /> Checklist Kepatuhan Kebijakan Konten
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-slate-200">
                <input
                  type="checkbox"
                  checked={policyChecklist.no_weapon_likeness}
                  onChange={(e) =>
                    setPolicyChecklist({
                      ...policyChecklist,
                      no_weapon_likeness: e.target.checked,
                    })
                  }
                  className="rounded border-slate-700 text-indigo-600 focus:ring-0"
                />
                Bebas kemiripan senjata api / aman
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-slate-200">
                <input
                  type="checkbox"
                  checked={policyChecklist.safe_for_all_ages}
                  onChange={(e) =>
                    setPolicyChecklist({
                      ...policyChecklist,
                      safe_for_all_ages: e.target.checked,
                    })
                  }
                  className="rounded border-slate-700 text-indigo-600 focus:ring-0"
                />
                Aman untuk segala umur (PG)
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-slate-200">
                <input
                  type="checkbox"
                  checked={policyChecklist.platform_guidelines_compliant}
                  onChange={(e) =>
                    setPolicyChecklist({
                      ...policyChecklist,
                      platform_guidelines_compliant: e.target.checked,
                    })
                  }
                  className="rounded border-slate-700 text-indigo-600 focus:ring-0"
                />
                Patuh Panduan Komunitas platform
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-slate-200">
                <input
                  type="checkbox"
                  checked={policyChecklist.clear_3d_printed_disclaimer}
                  onChange={(e) =>
                    setPolicyChecklist({
                      ...policyChecklist,
                      clear_3d_printed_disclaimer: e.target.checked,
                    })
                  }
                  className="rounded border-slate-700 text-indigo-600 focus:ring-0"
                />
                Disclaimer karya 3D Printing jelas
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 text-xs font-medium"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/30"
          >
            <Check className="w-3.5 h-3.5" /> Simpan Perubahan
          </button>
        </div>
      </div>
    </div>
  );
}
