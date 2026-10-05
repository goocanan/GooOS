"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";

interface Generation {
  id: string;
  type: string;
  input: Record<string, any>;
  output: Record<string, any>;
  tokensUsed: number;
  createdAt: string;
}

const GENERATION_TYPES = [
  { id: "idea", label: "Content Ideas", icon: "💡", description: "Generate fresh content concepts" },
  { id: "caption", label: "Captions", icon: "📝", description: "Write engaging social media captions" },
  { id: "script", label: "Scripts", icon: "🎬", description: "Draft video or audio scripts" },
  { id: "repurpose", label: "Repurpose", icon: "♻️", description: "Adapt content for different platforms" },
  { id: "score", label: "Content Score", icon: "📊", description: "Analyze content performance potential" },
];

export default function AIAssistantPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [generating, setGenerating] = useState(false);
  const [selectedType, setSelectedType] = useState<string>("idea");
  const [filter, setFilter] = useState<string>("all");
  const [formData, setFormData] = useState({
    prompt: "",
    platform: "instagram",
    tone: "casual",
  });

  const fetchGenerations = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/workspaces/${slug}/ai/generate?limit=50`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setGenerations(data.generations || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load generations");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchGenerations();
  }, [fetchGenerations]);

  const handleGenerate = async () => {
    if (!formData.prompt.trim() && selectedType !== "score") return;

    setGenerating(true);
    setError("");
    try {
      const res = await fetch(`/api/workspaces/${slug}/ai/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: selectedType,
          ...formData,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to generate");
      }

      const data = await res.json();
      setGenerations((prev) => [data.generation, ...prev]);
      setFormData({ prompt: "", platform: "instagram", tone: "casual" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const filteredGenerations =
    filter === "all" ? generations : generations.filter((g) => g.type === filter);

  const typeInfo = GENERATION_TYPES.find((t) => t.id === selectedType);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-1/4 bg-slate-100 rounded" />
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-24 bg-slate-50 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">AI Assistant</h1>
        <p className="text-sm text-slate-500 mt-1">Generate content ideas, captions, scripts, and more</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Type selector */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {GENERATION_TYPES.map((type) => (
          <button
            key={type.id}
            onClick={() => setSelectedType(type.id)}
            className={`p-4 rounded-lg border-2 transition-all text-center ${
              selectedType === type.id
                ? "border-goo-500 bg-goo-50"
                : "border-slate-200 hover:border-slate-300 bg-white"
            }`}
          >
            <div className="text-2xl mb-2">{type.icon}</div>
            <p className="font-semibold text-sm text-slate-900">{type.label}</p>
            <p className="text-[11px] text-slate-500 mt-1">{type.description}</p>
          </button>
        ))}
      </div>

      {/* Generation form */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          {typeInfo?.label}
        </h2>

        <div className="space-y-4">
          {selectedType !== "score" && (
            <textarea
              placeholder="Describe what you want to generate... (e.g., 'funny tech tips about productivity')"
              value={formData.prompt}
              onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-goo-500 resize-none"
            />
          )}

          <div className="grid grid-cols-2 gap-3">
            {selectedType === "caption" && (
              <>
                <select
                  value={formData.platform}
                  onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                  className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-goo-500"
                >
                  <option value="instagram">Instagram</option>
                  <option value="tiktok">TikTok</option>
                  <option value="twitter">Twitter/X</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="facebook">Facebook</option>
                </select>
                <select
                  value={formData.tone}
                  onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
                  className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-goo-500"
                >
                  <option value="casual">Casual & Fun</option>
                  <option value="professional">Professional</option>
                  <option value="inspirational">Inspirational</option>
                  <option value="educational">Educational</option>
                </select>
              </>
            )}
            {selectedType === "script" && (
              <select
                value={formData.platform}
                onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-goo-500 col-span-2"
              >
                <option value="youtube">YouTube Video</option>
                <option value="tiktok">TikTok/Shorts</option>
                <option value="podcast">Podcast</option>
                <option value="webinar">Webinar</option>
              </select>
            )}
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating || (!formData.prompt.trim() && selectedType !== "score")}
            className="w-full px-4 py-3 bg-goo-600 text-white rounded-lg font-medium hover:bg-goo-700 disabled:opacity-50 transition-colors"
          >
            {generating ? "Generating..." : `Generate ${typeInfo?.label}`}
          </button>
        </div>
      </div>

      {/* Generations history */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Generation History</h2>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-goo-500"
          >
            <option value="all">All types</option>
            <option value="idea">Ideas</option>
            <option value="caption">Captions</option>
            <option value="script">Scripts</option>
            <option value="repurpose">Repurpose</option>
            <option value="score">Scores</option>
          </select>
        </div>

        <div className="space-y-3">
          {filteredGenerations.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-lg">
              <p className="text-slate-400">No generations yet</p>
              <p className="text-xs text-slate-400 mt-1">Create your first generation above</p>
            </div>
          ) : (
            filteredGenerations.map((gen) => (
              <div key={gen.id} className="bg-white rounded-lg border border-slate-200 p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 capitalize">
                      {gen.type.replace(/_/g, " ")}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {new Date(gen.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-slate-500">
                    {gen.tokensUsed} tokens
                  </span>
                </div>

                {gen.input.prompt && (
                  <p className="text-sm text-slate-600 mb-3 p-2 bg-slate-50 rounded italic">
                    "{gen.input.prompt}"
                  </p>
                )}

                <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-700 whitespace-pre-wrap max-h-40 overflow-y-auto">
                  {typeof gen.output.text === "string" ? gen.output.text : JSON.stringify(gen.output)}
                </div>

                <div className="flex gap-2 mt-3">
                  <button className="text-xs text-goo-600 hover:underline">📋 Copy</button>
                  <button className="text-xs text-goo-600 hover:underline">💾 Save to Draft</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
