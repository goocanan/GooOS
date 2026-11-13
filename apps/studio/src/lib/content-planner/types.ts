// =============================================================================
// CONTENT PLANNER & PERFORMANCE TRACKER - DATA TYPES & INTERFACES
// Defined strictly per PRD v0.1 (13 Nov 2026 - GOOCANAN Suite)
// =============================================================================

export type PlatformType =
  | "tiktok"
  | "instagram"
  | "facebook"
  | "youtube_shorts"
  | "youtube_video"
  | "threads"
  | "x";

export type PostFormat =
  | "reels_tiktok_shorts"
  | "youtube_video"
  | "ig_carousel"
  | "ig_post"
  | "facebook_reels"
  | "threads_post"
  | "x_post";

export type IdeaStatus = "raw" | "banked" | "in_use" | "dropped";

export type PostStatus =
  | "Idea"
  | "Script"
  | "Shoot"
  | "Edit"
  | "Scheduled"
  | "Posted"
  | "Archived";

export type SnapshotWindow = "24h" | "7d" | "30d" | "manual";

export type ScoringMode = "calibrated" | "template" | "relative";

export type PerformanceLabel =
  | "Winning"
  | "Average"
  | "Low Performer"
  | "Belum tayang"
  | "Belum ada data"
  | "Data kurang";

export interface Account {
  id: string;
  platform: PlatformType;
  handle: string;
  name: string;
  channel_group: string; // e.g. "YouTube Goocanan" shared by YouTube Video and Shorts
  followers_start: number;
  followers_current: number;
  total_views: number;
  completed_posts: number;
  status: "active" | "inactive" | "archived";
}

export interface Idea {
  id: string;
  title: string;
  status: IdeaStatus;
  tags: string[];
  category: string;
  cta_goal: string;
  format?: string;
  duration?: string;
  priority: "low" | "medium" | "high";
  reference_url?: string;
  notes?: string;
  created_at: string;
}

export interface PolicyChecklist {
  no_weapon_likeness: boolean; // Mainan mirip senjata dicek
  safe_for_all_ages: boolean;
  platform_guidelines_compliant: boolean;
  clear_3d_printed_disclaimer: boolean;
}

export interface Content {
  id: string;
  code: string; // Short unique tracking code (e.g. FS24, KH01) for marketplace attribution
  title: string;
  idea_id?: string;
  pillar_id?: string;
  category: string;
  cta_goal: string;
  target_product?: string;
  brief: {
    hook: string;
    script_structure: string; // Hook -> Value -> CTA
    caption: string;
    cta_text: string;
    reference_url?: string;
    thumbnail_concept?: string;
  };
  policy_checklist: PolicyChecklist;
  created_at: string;
}

export interface MetricSnapshot {
  id: string;
  post_id: string;
  captured_at: string;
  window: SnapshotWindow;
  views: number;
  likes: number;
  comments: number;
  saves: number;
  shares: number;
  followers_gain: number;
  notes?: string;
}

export interface Post {
  id: string;
  content_id: string;
  account_id: string;
  platform: PlatformType;
  format: PostFormat;
  status: PostStatus;
  scheduled_at?: string;
  posted_at?: string;
  post_url?: string;
  caption?: string;
  cta_text?: string;
  snapshots: MetricSnapshot[];
  selected_snapshot_window?: SnapshotWindow; // default 7d
  sales_generated?: number; // Rp
  archived?: boolean;
}

export interface SalesAttribution {
  id: string;
  post_id?: string;
  content_id: string;
  content_code: string;
  sale_month: string; // YYYY-MM
  sales_rp: number;
  orders: number;
  method: "kode" | "manual" | "tautan";
  marketplace: "Tokopedia" | "Shopee" | "WhatsApp" | "Direct";
  notes?: string;
  created_at: string;
}

export interface MonthlySales {
  month: string; // YYYY-MM
  total_sales_rp: number;
  source: string;
}

export type LibraryType =
  | "hook"
  | "caption"
  | "cta"
  | "copy_formula"
  | "ai_prompt"
  | "canva_template"
  | "stock_video";

export interface LibraryItem {
  id: string;
  type: LibraryType;
  category: string;
  title: string;
  body: string; // Supports [placeholder] inside square brackets
  url?: string;
  tags: string[];
  favorite?: boolean;
}

export interface PillarItem {
  id: string;
  name: string;
  description: string;
  color: string;
  sub_topics: string[];
}

export interface PillarProfile {
  audience: {
    age_range: string;
    gender: string;
    occupation: string;
    pain_points: string;
    aspirations: string;
  };
  offer: {
    account_type: string;
    product_service: string;
    value_proposition: string;
  };
  goals: string[]; // max 2
  pillars: PillarItem[];
}

export interface ScoringWeights {
  likes: number; // default 0.2
  comments: number; // default 0.25
  shares: number; // default 0.25
  saves: number; // default 0.3
  followers: number; // default 2.0
}

export interface ScoringThresholds {
  win: { er: number; score: number };
  avg: { er: number; score: number };
}

export interface ScoringConfig {
  mode: ScoringMode;
  weights: ScoringWeights;
  thresholds: {
    calibrated: ScoringThresholds;
    template: ScoringThresholds;
  };
  min_views: number; // default 100
  baseline_n: number; // default 30
  snapshot_window: SnapshotWindow; // default 7d
}
