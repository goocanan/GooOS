/**
 * Enum-like constant tables shared by the API (validation + DB check constraints)
 * and the web app (labels, colours). Values must match PRD sections 9, 10 and 5.
 */

// ---------------------------------------------------------------------------
// Content type (PRD §9)
// ---------------------------------------------------------------------------

export const PLATFORM_IDS = [
  'tiktok',
  'instagram_post',
  'instagram_reel',
  'instagram_story',
  'youtube',
  'youtube_short',
  'facebook_post',
  'facebook_reel',
  'x',
  'linkedin',
  'blog',
  'ads',
] as const

export type PlatformId = (typeof PLATFORM_IDS)[number]

// ---------------------------------------------------------------------------
// Content status (PRD §10)
// ---------------------------------------------------------------------------

export const CONTENT_STATUSES = [
  'idea',
  'planned',
  'script',
  'production',
  'editing',
  'review',
  'approved',
  'scheduled',
  'published',
  'archived',
] as const

export type ContentStatus = (typeof CONTENT_STATUSES)[number]

/** Default forward workflow order. Advancing a card walks this list. */
export const WORKFLOW_ORDER: ContentStatus[] = [
  'idea',
  'planned',
  'script',
  'production',
  'editing',
  'review',
  'approved',
  'scheduled',
  'published',
  'archived',
]

/** Statuses that mean "still moving" for dashboards and WIP limits. */
export const ACTIVE_STATUSES: ContentStatus[] = [
  'script',
  'production',
  'editing',
  'review',
  'approved',
  'scheduled',
]

export function nextStatus(status: ContentStatus): ContentStatus | null {
  const i = WORKFLOW_ORDER.indexOf(status)
  if (i === -1 || i === WORKFLOW_ORDER.length - 1) return null
  return WORKFLOW_ORDER[i + 1]!
}

// ---------------------------------------------------------------------------
// Priority
// ---------------------------------------------------------------------------

export const PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const
export type Priority = (typeof PRIORITIES)[number]

// ---------------------------------------------------------------------------
// Roles (PRD §5) with a coarse permission tier for authorisation checks.
// ---------------------------------------------------------------------------

export const ROLES = ['owner', 'admin', 'manager', 'creator', 'reviewer', 'client'] as const
export type Role = (typeof ROLES)[number]

/**
 * Coarse permission tiers. The DB stores the role; authorisation compares tiers
 * so a creator can never outrank a manager. Fine-grained per-route rules live
 * in apps/api/src/plugins/rbac.ts.
 */
export const ROLE_TIER: Record<Role, number> = {
  owner: 100,
  admin: 90,
  manager: 60,
  reviewer: 40,
  creator: 30,
  client: 10,
}

export function canManage(role: Role) {
  return ROLE_TIER[role] >= ROLE_TIER.manager
}

export function canReview(role: Role) {
  return ['owner', 'admin', 'manager', 'reviewer', 'client'].includes(role)
}

// ---------------------------------------------------------------------------
// Support enums
// ---------------------------------------------------------------------------

export const ASSET_KINDS = ['image', 'video', 'audio', 'document', 'model'] as const
export type AssetKind = (typeof ASSET_KINDS)[number]

export const CAMPAIGN_STATUSES = ['planning', 'active', 'completed'] as const
export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number]

export const COMMENT_KINDS = ['comment', 'change_request', 'approval'] as const
export type CommentKind = (typeof COMMENT_KINDS)[number]

export const APPROVAL_DECISIONS = ['approved', 'changes_requested', 'rejected'] as const
export type ApprovalDecision = (typeof APPROVAL_DECISIONS)[number]

export const NOTIFICATION_KINDS = ['task', 'approval', 'schedule', 'publish', 'insight'] as const
export type NotificationKind = (typeof NOTIFICATION_KINDS)[number]

export const ACTIVITY_KINDS = [
  'create',
  'edit',
  'assign',
  'upload',
  'review',
  'publish',
  'delete',
] as const
export type ActivityKind = (typeof ACTIVITY_KINDS)[number]

export const PLANS = ['free', 'creator', 'pro', 'agency'] as const
export type Plan = (typeof PLANS)[number]

// ---------------------------------------------------------------------------
// Display metadata - mirrors the values the web app renders today.
// ---------------------------------------------------------------------------

export interface PlatformMeta {
  id: PlatformId
  label: string
  short: string
  color: string
  maxCaption: number
}

export const PLATFORM_META: Record<PlatformId, PlatformMeta> = {
  tiktok: { id: 'tiktok', label: 'TikTok', short: 'TT', color: '#22d3ee', maxCaption: 2200 },
  instagram_post: { id: 'instagram_post', label: 'Instagram Post', short: 'IG', color: '#f472b6', maxCaption: 2200 },
  instagram_reel: { id: 'instagram_reel', label: 'Instagram Reel', short: 'IGR', color: '#e879f9', maxCaption: 2200 },
  instagram_story: { id: 'instagram_story', label: 'Instagram Story', short: 'IGS', color: '#fb7185', maxCaption: 0 },
  youtube: { id: 'youtube', label: 'YouTube Video', short: 'YT', color: '#f87171', maxCaption: 5000 },
  youtube_short: { id: 'youtube_short', label: 'YouTube Short', short: 'YTS', color: '#fb923c', maxCaption: 1000 },
  facebook_post: { id: 'facebook_post', label: 'Facebook Post', short: 'FB', color: '#60a5fa', maxCaption: 63206 },
  facebook_reel: { id: 'facebook_reel', label: 'Facebook Reel', short: 'FBR', color: '#38bdf8', maxCaption: 2000 },
  x: { id: 'x', label: 'X / Twitter', short: 'X', color: '#94a3b8', maxCaption: 280 },
  linkedin: { id: 'linkedin', label: 'LinkedIn', short: 'LI', color: '#38bdf8', maxCaption: 3000 },
  blog: { id: 'blog', label: 'Blog', short: 'BL', color: '#a3e635', maxCaption: 40000 },
  ads: { id: 'ads', label: 'Advertisement', short: 'AD', color: '#facc15', maxCaption: 5000 },
}

export const STATUS_META: Record<ContentStatus, { label: string; color: string }> = {
  idea: { label: 'Idea', color: '#94a3b8' },
  planned: { label: 'Planned', color: '#818cf8' },
  script: { label: 'Script', color: '#a78bfa' },
  production: { label: 'Production', color: '#f59e0b' },
  editing: { label: 'Editing', color: '#fb923c' },
  review: { label: 'Review', color: '#38bdf8' },
  approved: { label: 'Approved', color: '#34d399' },
  scheduled: { label: 'Scheduled', color: '#2dd4bf' },
  published: { label: 'Published', color: '#22c55e' },
  archived: { label: 'Archived', color: '#64748b' },
}

export const PRIORITY_META: Record<Priority, { label: string; color: string }> = {
  low: { label: 'Low', color: '#64748b' },
  medium: { label: 'Medium', color: '#38bdf8' },
  high: { label: 'High', color: '#f59e0b' },
  urgent: { label: 'Urgent', color: '#ef4444' },
}

export const ROLE_LABEL: Record<Role, string> = {
  owner: 'Owner',
  admin: 'Admin',
  manager: 'Manager',
  creator: 'Creator',
  reviewer: 'Reviewer',
  client: 'Client',
}

export const ROLE_COLOR: Record<Role, string> = {
  owner: '#d4af37',
  admin: '#a78bfa',
  manager: '#38bdf8',
  creator: '#34d399',
  reviewer: '#f59e0b',
  client: '#fb923c',
}