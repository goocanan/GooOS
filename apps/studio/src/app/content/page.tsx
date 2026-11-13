"use client";

import React, { useState, useEffect } from "react";
import { GooNavbar } from "@/components/GooNavbar";
import {
  loadPlannerState,
  savePlannerState,
  resetPlannerState,
  promoteIdeaToContent,
  exportStateToJson,
  exportPostsToCsv,
  importStateFromJson,
  ContentPlannerState,
  getInitialState,
} from "@/lib/content-planner/storage";
import {
  Content,
  Post,
  Idea,
  PlatformType,
  PostStatus,
  MetricSnapshot,
  ScoringConfig,
  IdeaStatus,
} from "@/lib/content-planner/types";

// Sub-components
import { DashboardTab } from "@/components/content-planner/DashboardTab";
import { PipelineTab } from "@/components/content-planner/PipelineTab";
import { BankIdeTab } from "@/components/content-planner/BankIdeTab";
import { PerformaTab } from "@/components/content-planner/PerformaTab";
import { PlatformTrackerTab } from "@/components/content-planner/PlatformTrackerTab";
import { LibraryTab } from "@/components/content-planner/LibraryTab";
import { PillarsTab } from "@/components/content-planner/PillarsTab";
import { SettingsTab } from "@/components/content-planner/SettingsTab";

// Modals
import { MetricModal } from "@/components/content-planner/MetricModal";
import { PromoteModal } from "@/components/content-planner/PromoteModal";
import { ContentDetailModal } from "@/components/content-planner/ContentDetailModal";

import {
  LayoutDashboard,
  Kanban,
  Lightbulb,
  TrendingUp,
  Share2,
  BookOpen,
  Layers,
  Settings,
  Plus,
  Sparkles,
  Zap,
} from "lucide-react";

export default function ContentPlannerPage() {
  const [mounted, setMounted] = useState(false);
  const [state, setState] = useState<ContentPlannerState>(getInitialState);
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  // Modal states
  const [metricModalOpen, setMetricModalOpen] = useState(false);
  const [selectedPostForMetric, setSelectedPostForMetric] = useState<Post | null>(null);

  const [promoteModalOpen, setPromoteModalOpen] = useState(false);
  const [selectedIdeaForPromote, setSelectedIdeaForPromote] = useState<Idea | null>(null);

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedPostForDetail, setSelectedPostForDetail] = useState<Post | null>(null);
  const [selectedContentForDetail, setSelectedContentForDetail] = useState<Content | null>(null);

  // Quick toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    setMounted(true);
    const loaded = loadPlannerState();
    setState(loaded);
  }, []);

  const updateStateAndSave = (nextState: ContentPlannerState) => {
    setState(nextState);
    savePlannerState(nextState);
  };

  // Handlers
  const handleAddIdea = (newIdea: Omit<Idea, "id" | "created_at">) => {
    const created: Idea = {
      ...newIdea,
      id: `idea_${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    const nextState = {
      ...state,
      ideas: [created, ...state.ideas],
    };
    updateStateAndSave(nextState);
    showToast("Ide berhasil ditambahkan ke RAW Inbox!");
  };

  const handleUpdateIdeaStatus = (id: string, status: IdeaStatus) => {
    const updated = state.ideas.map((i) =>
      i.id === id ? { ...i, status } : i
    );
    updateStateAndSave({ ...state, ideas: updated });
    showToast(`Status ide diperbarui menjadi "${status}"`);
  };

  const handleDeleteIdea = (id: string) => {
    const updated = state.ideas.filter((i) => i.id !== id);
    updateStateAndSave({ ...state, ideas: updated });
    showToast("Ide dihapus.");
  };

  const handlePromoteIdea = (
    ideaId: string,
    platforms: PlatformType[],
    code: string
  ) => {
    const res = promoteIdeaToContent(state, ideaId, platforms, code);
    setState(res.nextState);
    showToast(`Ide berhasil dipromosikan menjadi Konten [${code}] dengan ${platforms.length} postingan!`);
    setActiveTab("pipeline");
  };

  const handleUpdatePostStatus = (postId: string, status: PostStatus) => {
    const updatedPosts = state.posts.map((p) =>
      p.id === postId
        ? {
            ...p,
            status,
            posted_at: status === "Posted" && !p.posted_at ? new Date().toISOString().substring(0, 10) : p.posted_at,
          }
        : p
    );
    updateStateAndSave({ ...state, posts: updatedPosts });
  };

  const handleSaveSnapshot = (postId: string, snapshot: MetricSnapshot) => {
    const updatedPosts = state.posts.map((p) => {
      if (p.id !== postId) return p;
      // Filter existing snapshot of same window if present, then append
      const otherSnaps = p.snapshots.filter((s) => s.window !== snapshot.window);
      return {
        ...p,
        snapshots: [...otherSnaps, snapshot],
        status: p.status === "Idea" || p.status === "Script" ? "Posted" : p.status,
      };
    });
    updateStateAndSave({ ...state, posts: updatedPosts });
    showToast("Metrik snapshot berhasil disimpan & skor terkalibrasi!");
  };

  const handleUpdateContent = (updatedContent: Content) => {
    const updated = state.contents.map((c) =>
      c.id === updatedContent.id ? updatedContent : c
    );
    updateStateAndSave({ ...state, contents: updated });
    showToast("Brief konten berhasil diperbarui!");
  };

  const handleUpdatePost = (updatedPost: Post) => {
    const updated = state.posts.map((p) =>
      p.id === updatedPost.id ? updatedPost : p
    );
    updateStateAndSave({ ...state, posts: updated });
    showToast("Postingan berhasil diperbarui!");
  };

  const handleUpdateAccountFollowers = (
    accountId: string,
    currentFollowers: number
  ) => {
    const updated = state.accounts.map((a) =>
      a.id === accountId ? { ...a, followers_current: currentFollowers } : a
    );
    updateStateAndSave({ ...state, accounts: updated });
    showToast("Jumlah follower berhasil diperbarui!");
  };

  const handleUpdateConfig = (newConfig: ScoringConfig) => {
    updateStateAndSave({ ...state, config: newConfig });
    showToast(`Mode scoring diperbarui ke: ${newConfig.mode.toUpperCase()}`);
  };

  // Export handlers
  const handleExportJson = () => {
    const jsonStr = exportStateToJson(state);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `goocanan_content_planner_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Backup JSON berhasil diunduh!");
  };

  const handleExportCsv = () => {
    const csvStr = exportPostsToCsv(state);
    const blob = new Blob([csvStr], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `goocanan_posts_metrics_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Ekspor CSV postingan berhasil diunduh!");
  };

  const handleImportJson = (jsonString: string) => {
    const imported = importStateFromJson(jsonString);
    setState(imported);
    showToast("Dataset berhasil diimpor!");
  };

  const handleResetFactory = () => {
    const initial = resetPlannerState();
    setState(initial);
    showToast("Dataset dikembalikan ke data awal James (11 Konten, 31 Postingan).");
  };

  const openMetricModalForPost = (post: Post) => {
    const parent = state.contents.find((c) => c.id === post.content_id) || null;
    setSelectedPostForMetric(post);
    setSelectedContentForDetail(parent);
    setMetricModalOpen(true);
  };

  const openDetailModalForPost = (post: Post, content: Content) => {
    setSelectedPostForDetail(post);
    setSelectedContentForDetail(content);
    setDetailModalOpen(true);
  };

  const openPromoteModalForIdea = (idea: Idea) => {
    setSelectedIdeaForPromote(idea);
    setPromoteModalOpen(true);
  };

  const handleCreateNewContentDirectly = () => {
    const newContentId = `content_${Date.now()}`;
    const code = `C${state.contents.length + 1}`;
    const newContent: Content = {
      id: newContentId,
      code,
      title: "Konten Baru Tanpa Ide Bank",
      category: "Fidget & Sensory",
      cta_goal: "Follow & Komentar",
      target_product: "Produk 3D Print",
      brief: {
        hook: "Hook kalimat pembuka...",
        script_structure: "Hook (0-3s) -> Demonstrasi -> CTA",
        caption: "Deskripsi caption konten...",
        cta_text: "Komentar di bawah jika mau file STL / produk jadinya!",
      },
      policy_checklist: {
        no_weapon_likeness: true,
        safe_for_all_ages: true,
        platform_guidelines_compliant: true,
        clear_3d_printed_disclaimer: true,
      },
      created_at: new Date().toISOString(),
    };

    const newPost: Post = {
      id: `post_${Date.now()}`,
      content_id: newContentId,
      account_id: state.accounts[0]?.id || "acc_tiktok",
      platform: "tiktok",
      format: "reels_tiktok_shorts",
      status: "Script",
      snapshots: [],
    };

    updateStateAndSave({
      ...state,
      contents: [newContent, ...state.contents],
      posts: [newPost, ...state.posts],
    });

    openDetailModalForPost(newPost, newContent);
    showToast(`Konten master [${code}] berhasil dibuat!`);
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="text-xs text-slate-400 font-mono animate-pulse">
          Memuat Content Planner GOOCANAN...
        </div>
      </div>
    );
  }

  const rawIdeasCount = state.ideas.filter((i) => i.status === "raw").length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30">
      <GooNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-6 pb-20 space-y-6">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-base">
                🎬
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold tracking-tight text-slate-100">
                    Content Planner &amp; Performance Tracker
                  </h1>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
                    GOOCANAN Suite
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Bank Ide, Pipeline Produksi Multi-Platform, Input Metrik (&lt;60s), &amp; Engine Penilaian Terkalibrasi
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                setActiveTab("bank_ide");
                window.scrollTo({ top: 120, behavior: "smooth" });
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> + RAW Ide Baru
            </button>

            <button
              onClick={handleCreateNewContentDirectly}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all"
            >
              <Plus className="w-4 h-4" /> + Konten Master
            </button>
          </div>
        </div>

        {/* Tab Navigation Pill Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-800/60 text-xs scrollbar-none">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`px-3.5 py-2 rounded-xl font-medium flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === "dashboard"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-semibold"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
          </button>

          <button
            onClick={() => setActiveTab("pipeline")}
            className={`px-3.5 py-2 rounded-xl font-medium flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === "pipeline"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-semibold"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
            }`}
          >
            <Kanban className="w-3.5 h-3.5" /> Pipeline Produksi
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 font-mono">
              {state.posts.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("bank_ide")}
            className={`px-3.5 py-2 rounded-xl font-medium flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === "bank_ide"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-semibold"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5" /> Bank Ide &amp; RAW
            {rawIdeasCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 font-mono">
                {rawIdeasCount} RAW
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("performa")}
            className={`px-3.5 py-2 rounded-xl font-medium flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === "performa"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-semibold"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" /> Performa &amp; Metrik
          </button>

          <button
            onClick={() => setActiveTab("tracker")}
            className={`px-3.5 py-2 rounded-xl font-medium flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === "tracker"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-semibold"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
            }`}
          >
            <Share2 className="w-3.5 h-3.5" /> Tracker Platform
          </button>

          <button
            onClick={() => setActiveTab("library")}
            className={`px-3.5 py-2 rounded-xl font-medium flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === "library"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-semibold"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" /> Library &amp; Prompt
          </button>

          <button
            onClick={() => setActiveTab("pillars")}
            className={`px-3.5 py-2 rounded-xl font-medium flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === "pillars"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-semibold"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Content Pillar
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={`px-3.5 py-2 rounded-xl font-medium flex items-center gap-2 transition-all whitespace-nowrap ml-auto ${
              activeTab === "settings"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-semibold"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
            }`}
          >
            <Settings className="w-3.5 h-3.5" /> Pengaturan &amp; Engine
          </button>
        </div>

        {/* Tab Contents */}
        {activeTab === "dashboard" && (
          <DashboardTab
            contents={state.contents}
            posts={state.posts}
            accounts={state.accounts}
            config={state.config}
            salesAttributions={state.salesAttributions}
            monthlySales={state.monthlySales}
            onOpenMetricModal={openMetricModalForPost}
            onOpenDetailModal={openDetailModalForPost}
            onSwitchTab={setActiveTab}
          />
        )}

        {activeTab === "pipeline" && (
          <PipelineTab
            contents={state.contents}
            posts={state.posts}
            onUpdatePostStatus={handleUpdatePostStatus}
            onOpenDetailModal={openDetailModalForPost}
            onOpenMetricModal={openMetricModalForPost}
            onNewContent={handleCreateNewContentDirectly}
          />
        )}

        {activeTab === "bank_ide" && (
          <BankIdeTab
            ideas={state.ideas}
            onAddIdea={handleAddIdea}
            onUpdateIdeaStatus={handleUpdateIdeaStatus}
            onDeleteIdea={handleDeleteIdea}
            onOpenPromoteModal={openPromoteModalForIdea}
          />
        )}

        {activeTab === "performa" && (
          <PerformaTab
            contents={state.contents}
            posts={state.posts}
            config={state.config}
            salesAttributions={state.salesAttributions}
            monthlySales={state.monthlySales}
            onOpenMetricModal={openMetricModalForPost}
            onOpenDetailModal={openDetailModalForPost}
          />
        )}

        {activeTab === "tracker" && (
          <PlatformTrackerTab
            accounts={state.accounts}
            posts={state.posts}
            onUpdateAccountFollowers={handleUpdateAccountFollowers}
          />
        )}

        {activeTab === "library" && (
          <LibraryTab libraryItems={state.libraryItems} />
        )}

        {activeTab === "pillars" && (
          <PillarsTab profile={state.pillarProfile} />
        )}

        {activeTab === "settings" && (
          <SettingsTab
            config={state.config}
            onUpdateConfig={handleUpdateConfig}
            onExportJson={handleExportJson}
            onExportCsv={handleExportCsv}
            onImportJson={handleImportJson}
            onResetFactory={handleResetFactory}
          />
        )}
      </main>

      {/* Modals */}
      <MetricModal
        isOpen={metricModalOpen}
        onClose={() => setMetricModalOpen(false)}
        post={selectedPostForMetric}
        content={selectedContentForDetail}
        config={state.config}
        allPosts={state.posts}
        onSaveSnapshot={handleSaveSnapshot}
      />

      <PromoteModal
        isOpen={promoteModalOpen}
        onClose={() => setPromoteModalOpen(false)}
        idea={selectedIdeaForPromote}
        onPromote={handlePromoteIdea}
      />

      <ContentDetailModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        post={selectedPostForDetail}
        content={selectedContentForDetail}
        onUpdateContent={handleUpdateContent}
        onUpdatePost={handleUpdatePost}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-slate-900 border border-indigo-500/40 text-slate-100 text-xs font-medium shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom-2">
          <Zap className="w-3.5 h-3.5 text-indigo-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
