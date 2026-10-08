import { z } from 'zod'
import {
  APPROVAL_DECISIONS,
  ASSET_KINDS,
  CAMPAIGN_STATUSES,
  COMMENT_KINDS,
  CONTENT_STATUSES,
  NOTIFICATION_KINDS,
  PLANS,
  PLATFORM_IDS,
  PRIORITIES,
  ROLES,
} from './enums'

/**
 * Zod schemas for request bodies, query strings and the AI generation contract.
 * The API validates every write with these; the web app reuses them for
 * optimistic client-side checks.
 */

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

export const idSchema = z.string().min(1).max(64)
export const dateSchema = z.string().datetime({ offset: true }).or(z.string().datetime())

/** Accepts an ISO string or epoch millis and normalises to ISO. */
export const dateInput = z
  .union([z.string(), z.number()])
  .transform((v) => (typeof v === 'number' ? new Date(v) : new Date(v)))
  .refine((d) => !Number.isNaN(d.getTime()), { message: 'Invalid date' })

export const optionalDateInput = dateInput.optional().nullable()

// ---------------------------------------------------------------------------
// Auth (PRD §38)
// ---------------------------------------------------------------------------

export const signUpSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(200),
  workspaceName: z.string().min(2).max(80).optional(),
})

export const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(200),
})

// ---------------------------------------------------------------------------
// Workspace + membership (PRD §6)
// ---------------------------------------------------------------------------

export const createWorkspaceSchema = z.object({
  name: z.string().min(2).max(80),
  slug: z
    .string()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9-]+$/, 'slug must be lowercase alphanumeric with dashes')
    .optional(),
  plan: z.enum(PLANS).optional(),
})

export const updateWorkspaceSchema = createWorkspaceSchema.partial().extend({
  contentLimit: z.number().int().positive().optional(),
  storageLimitMb: z.number().int().positive().optional(),
  seatLimit: z.number().int().positive().optional(),
})

export const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(ROLES),
  name: z.string().min(2).max(80).optional(),
})

export const updateMemberSchema = z.object({
  role: z.enum(ROLES).optional(),
  active: z.boolean().optional(),
})

// ---------------------------------------------------------------------------
// Brand (PRD §7)
// ---------------------------------------------------------------------------

export const brandGuidelinesSchema = z.object({
  tone: z.string().max(500).default(''),
  primaryColor: z.string().max(32).default('#8B1E3F'),
  secondaryColor: z.string().max(32).default('#D4AF37'),
  keywords: z.array(z.string().max(60)).max(30).default([]),
  doList: z.array(z.string().max(300)).max(30).default([]),
  dontList: z.array(z.string().max(300)).max(30).default([]),
  fonts: z.string().max(200).default('Inter'),
})

export const createBrandSchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().max(2000).default(''),
  website: z.string().max(300).default(''),
  logoText: z.string().max(8).default(''),
  color: z.string().max(32).default('#b81e51'),
  industry: z.string().max(200).default(''),
  audience: z.string().max(500).default(''),
  socials: z
    .array(z.object({ platform: z.enum(PLATFORM_IDS), handle: z.string().max(120) }))
    .max(20)
    .default([]),
  guidelines: brandGuidelinesSchema.default(brandGuidelinesSchema.parse({})),
})

export const updateBrandSchema = createBrandSchema.partial()

// ---------------------------------------------------------------------------
// Campaign (PRD §21)
// ---------------------------------------------------------------------------

export const createCampaignSchema = z.object({
  brandId: idSchema,
  name: z.string().min(2).max(120),
  goal: z.string().max(200).default('Awareness'),
  start: dateInput,
  end: dateInput,
  status: z.enum(CAMPAIGN_STATUSES).default('planning'),
  color: z.string().max(32).default('#b81e51'),
  budget: z.number().nonnegative().optional(),
})

export const updateCampaignSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  goal: z.string().max(200).optional(),
  start: dateInput.optional(),
  end: dateInput.optional(),
  status: z.enum(CAMPAIGN_STATUSES).optional(),
  color: z.string().max(32).optional(),
  budget: z.number().nonnegative().nullable().optional(),
})

// ---------------------------------------------------------------------------
// Content (PRD §8, §24)
// ---------------------------------------------------------------------------

export const platformVariantSchema = z.object({
  platform: z.enum(PLATFORM_IDS),
  caption: z.string().max(50_000).default(''),
  hashtags: z.array(z.string().max(80)).max(60).default([]),
  mediaAssetIds: z.array(idSchema).max(20).default([]),
  scheduledAt: optionalDateInput,
  publishedAt: optionalDateInput,
})

export const contentBriefSchema = z.object({
  objective: z.string().max(120).default('Awareness'),
  audience: z.string().max(500).default(''),
  topic: z.string().max(200).default(''),
  hook: z.string().max(1000).default(''),
  keyMessage: z.string().max(4000).default(''),
  cta: z.string().max(1000).default(''),
  reference: z.array(z.string().max(1000)).max(20).default([]),
  expectedDuration: z.string().max(60).default(''),
})

export const createContentSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(4000).default(''),
  type: z.enum(PLATFORM_IDS),
  status: z.enum(CONTENT_STATUSES).default('idea'),
  priority: z.enum(PRIORITIES).default('medium'),
  brandId: idSchema.optional(),
  campaignId: idSchema.optional().nullable(),
  creatorId: idSchema.optional(),
  reviewerId: idSchema.optional().nullable(),
  tags: z.array(z.string().max(60)).max(30).default([]),
  deadline: optionalDateInput,
  thumbnailColor: z.string().max(32).optional(),
  platforms: z.array(platformVariantSchema).max(12).default([]),
  cta: z.string().max(1000).default(''),
  notes: z.string().max(10_000).default(''),
  brief: contentBriefSchema.default(contentBriefSchema.parse({})),
  productionProgress: z.number().min(0).max(100).default(0),
  ideaSource: z.string().max(300).optional(),
})

export const updateContentSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  description: z.string().max(4000).optional(),
  type: z.enum(PLATFORM_IDS).optional(),
  status: z.enum(CONTENT_STATUSES).optional(),
  priority: z.enum(PRIORITIES).optional(),
  brandId: idSchema.optional(),
  campaignId: idSchema.optional().nullable(),
  creatorId: idSchema.optional(),
  reviewerId: idSchema.optional().nullable(),
  tags: z.array(z.string().max(60)).max(30).optional(),
  deadline: optionalDateInput,
  scheduledAt: optionalDateInput,
  publishedAt: optionalDateInput,
  platforms: z.array(platformVariantSchema).max(12).optional(),
  cta: z.string().max(1000).optional(),
  notes: z.string().max(10_000).optional(),
  brief: contentBriefSchema.partial().optional(),
  productionProgress: z.number().min(0).max(100).optional(),
})

/** PRD §11 - board drag & drop endpoint. */
export const moveContentSchema = z.object({
  status: z.enum(CONTENT_STATUSES),
  productionProgress: z.number().min(0).max(100).optional(),
  /** Only allow moving to these platforms; used by "convert idea to content". */
  position: z.number().optional(),
})

export const listContentQuery = z.object({
  q: z.string().max(200).optional(),
  status: z
    .union([z.enum(CONTENT_STATUSES), z.array(z.enum(CONTENT_STATUSES))])
    .optional(),
  platform: z
    .union([z.enum(PLATFORM_IDS), z.array(z.enum(PLATFORM_IDS))])
    .optional(),
  brandId: z.union([idSchema, z.array(idSchema)]).optional(),
  campaignId: z.union([idSchema, z.array(idSchema)]).optional(),
  creatorId: z.union([idSchema, z.array(idSchema)]).optional(),
  priority: z.union([z.enum(PRIORITIES), z.array(z.enum(PRIORITIES))]).optional(),
  assigneeId: z.string().optional(),
  dueBefore: dateInput.optional(),
  dueAfter: dateInput.optional(),
  scheduledFrom: dateInput.optional(),
  scheduledTo: dateInput.optional(),
  archived: z.coerce.boolean().optional(),
  sort: z.enum(['updated', 'deadline', 'priority', 'title', 'created']).default('updated'),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
})

export const bulkActionSchema = z.object({
  ids: z.array(idSchema).min(1).max(200),
  action: z.enum(['archive', 'delete', 'move', 'assign', 'tag', 'campaign']),
  status: z.enum(CONTENT_STATUSES).optional(),
  creatorId: z.string().optional(),
  campaignId: z.string().optional(),
  tags: z.array(z.string().max(60)).optional(),
})

// ---------------------------------------------------------------------------
// Ideas (PRD §13)
// ---------------------------------------------------------------------------

export const createIdeaSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(4000).default(''),
  reference: z.string().max(1000).default(''),
  platform: z.enum(PLATFORM_IDS).default('tiktok'),
  tags: z.array(z.string().max(60)).max(20).default([]),
  priority: z.enum(PRIORITIES).default('medium'),
})

export const convertIdeaSchema = z.object({
  platform: z.enum(PLATFORM_IDS).optional(),
  assigneeId: z.string().optional(),
  deadline: optionalDateInput,
})

// ---------------------------------------------------------------------------
// Scripts (PRD §15, §18)
// ---------------------------------------------------------------------------

export const scriptBlockSchema = z.object({
  id: z.string().max(64).optional(),
  kind: z.enum(['hook', 'intro', 'body', 'broll', 'voiceover', 'cta']),
  heading: z.string().max(120).default(''),
  body: z.string().max(20_000).default(''),
})

export const createScriptSchema = z.object({
  contentId: idSchema,
  title: z.string().min(1).max(200),
  blocks: z.array(scriptBlockSchema).max(60).default([]),
})

export const updateScriptSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  blocks: z.array(scriptBlockSchema).max(60).optional(),
  /** Set to false to save in place; true bumps the version and snapshots. */
  bumpVersion: z.boolean().default(false),
})

// ---------------------------------------------------------------------------
// Assets (PRD §16)
// ---------------------------------------------------------------------------

export const assetQuery = z.object({
  q: z.string().max(200).optional(),
  folder: z.string().max(120).optional(),
  kind: z.union([z.enum(ASSET_KINDS), z.array(z.enum(ASSET_KINDS))]).optional(),
  campaignId: z.string().optional(),
  brandId: z.string().optional(),
  tag: z.string().max(60).optional(),
  contentId: z.string().optional(),
  sort: z.enum(['uploaded', 'name', 'size']).default('uploaded'),
  limit: z.coerce.number().int().min(1).max(200).default(100),
  offset: z.coerce.number().int().min(0).default(0),
})

export const updateAssetSchema = z.object({
  name: z.string().min(1).max(260).optional(),
  folder: z.string().max(120).optional(),
  tags: z.array(z.string().max(60)).max(40).optional(),
  brandId: z.string().optional().nullable(),
  campaignId: z.string().optional().nullable(),
})

export const createFolderSchema = z.object({
  name: z.string().min(1).max(120),
  color: z.string().max(32).optional(),
})

// ---------------------------------------------------------------------------
// Comments + approvals (PRD §19, §20)
// ---------------------------------------------------------------------------

export const createCommentSchema = z.object({
  body: z.string().min(1).max(5000),
  timestampSec: z.number().min(0).max(86_400).optional(),
  kind: z.enum(COMMENT_KINDS).default('comment'),
})

export const updateCommentSchema = z.object({
  resolved: z.boolean().optional(),
  body: z.string().min(1).max(5000).optional(),
})

export const approvalSchema = z.object({
  decision: z.enum(APPROVAL_DECISIONS),
  note: z.string().max(2000).optional(),
  timestampSec: z.number().min(0).max(86_400).optional(),
})

// ---------------------------------------------------------------------------
// Scheduling (PRD §25)
// ---------------------------------------------------------------------------

export const scheduleSchema = z.object({
  platform: z.enum(PLATFORM_IDS).optional(),
  scheduledAt: dateInput,
  timezone: z.string().max(80).default('Asia/Jakarta'),
  /** Copy & publish payload instead of an API call (PRD §26). */
  mode: z.enum(['schedule', 'copy_publish']).default('schedule'),
})

export const calendarQuery = z.object({
  from: dateInput,
  to: dateInput,
  platform: z.union([z.enum(PLATFORM_IDS), z.array(z.enum(PLATFORM_IDS))]).optional(),
  status: z.union([z.enum(CONTENT_STATUSES), z.array(z.enum(CONTENT_STATUSES))]).optional(),
  brandId: z.string().optional(),
  campaignId: z.string().optional(),
  creatorId: z.string().optional(),
})

// ---------------------------------------------------------------------------
// Analytics (PRD §29, §30)
// ---------------------------------------------------------------------------

export const analyticsQuery = z.object({
  from: dateInput.optional(),
  to: dateInput.optional(),
  platform: z.union([z.enum(PLATFORM_IDS), z.array(z.enum(PLATFORM_IDS))]).optional(),
  campaignId: z.string().optional(),
  brandId: z.string().optional(),
  contentId: z.string().optional(),
  groupBy: z.enum(['day', 'platform', 'content', 'campaign']).default('day'),
})

export const upsertAnalyticsSchema = z.object({
  platform: z.enum(PLATFORM_IDS),
  views: z.number().int().nonnegative().default(0),
  likes: z.number().int().nonnegative().default(0),
  comments: z.number().int().nonnegative().default(0),
  shares: z.number().int().nonnegative().default(0),
  saves: z.number().int().nonnegative().default(0),
  watchTimeMin: z.number().nonnegative().default(0),
  ctr: z.number().min(0).max(1).default(0),
  followersGained: z.number().int().nonnegative().default(0),
  capturedAt: dateInput.optional(),
})

export const bulkAnalyticsSchema = z.object({
  rows: z.array(upsertAnalyticsSchema).min(1).max(200),
})

// ---------------------------------------------------------------------------
// Hashtags (PRD §22)
// ---------------------------------------------------------------------------

export const createHashtagSchema = z.object({
  tag: z
    .string()
    .min(1)
    .max(60)
    .transform((v) => (v.startsWith('#') ? v : `#${v}`)),
  group: z.string().max(60).default('Baru'),
})

// ---------------------------------------------------------------------------
// Notifications (PRD §32)
// ---------------------------------------------------------------------------

export const listNotificationsQuery = z.object({
  unread: z.coerce.boolean().optional(),
  kind: z.union([z.enum(NOTIFICATION_KINDS), z.array(z.enum(NOTIFICATION_KINDS))]).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
  offset: z.coerce.number().int().min(0).default(0),
})

// ---------------------------------------------------------------------------
// Search (PRD §33)
// ---------------------------------------------------------------------------

export const searchQuery = z.object({
  q: z.string().min(1).max(200),
  type: z.enum(['all', 'content', 'assets', 'campaigns', 'ideas', 'scripts']).default('all'),
  limit: z.coerce.number().int().min(1).max(50).default(14),
})

// ---------------------------------------------------------------------------
// Reports (PRD §31)
// ---------------------------------------------------------------------------

export const reportQuery = z.object({
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/, 'month must be YYYY-MM')
    .optional(),
  format: z.enum(['json', 'csv', 'markdown']).default('json'),
})

// ---------------------------------------------------------------------------
// AI assistant (PRD §27, §28)
// ---------------------------------------------------------------------------

export const AI_TOOLS = [
  'idea',
  'hook',
  'script',
  'caption',
  'repurpose',
  'score',
  'plan',
] as const
export type AiTool = (typeof AI_TOOLS)[number]

export const aiGenerateSchema = z.object({
  tool: z.enum(AI_TOOLS),
  prompt: z.string().min(2).max(2000),
  platform: z.enum(PLATFORM_IDS).optional(),
  brandId: z.string().optional(),
  contentId: z.string().optional(),
  duration: z.number().int().min(5).max(3600).optional(),
  temperature: z.number().min(0).max(2).optional(),
})

export const AiGenerationResult = z.object({
  tool: z.enum(AI_TOOLS),
  prompt: z.string(),
  output: z.string(),
  model: z.string(),
  creditsUsed: z.number().int(),
  at: z.string(),
})
export type AiGenerationResult = z.infer<typeof AiGenerationResult>

// ---------------------------------------------------------------------------
// Dashboard aggregates (PRD §34)
// ---------------------------------------------------------------------------

export const dashboardQuery = z.object({
  range: z.enum(['7', '14', '30', '90']).default('14'),
})

// ---------------------------------------------------------------------------
// Type inference helpers
// ---------------------------------------------------------------------------

export type SignUpInput = z.infer<typeof signUpSchema>
export type SignInInput = z.infer<typeof signInSchema>
export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>
export type CreateBrandInput = z.infer<typeof createBrandSchema>
export type UpdateBrandInput = z.infer<typeof updateBrandSchema>
export type CreateCampaignInput = z.infer<typeof createCampaignSchema>
export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>
export type CreateContentInput = z.infer<typeof createContentSchema>
export type UpdateContentInput = z.infer<typeof updateContentSchema>
export type MoveContentInput = z.infer<typeof moveContentSchema>
export type BulkActionInput = z.infer<typeof bulkActionSchema>
export type CreateIdeaInput = z.infer<typeof createIdeaSchema>
export type CreateScriptInput = z.infer<typeof createScriptSchema>
export type UpdateScriptInput = z.infer<typeof updateScriptSchema>
export type CreateCommentInput = z.infer<typeof createCommentSchema>
export type ApprovalInput = z.infer<typeof approvalSchema>
export type ScheduleInput = z.infer<typeof scheduleSchema>
export type UpsertAnalyticsInput = z.infer<typeof upsertAnalyticsSchema>
export type AiGenerateInput = z.infer<typeof aiGenerateSchema>
export type ListContentQueryInput = z.infer<typeof listContentQuery>
export type CalendarQueryInput = z.infer<typeof calendarQuery>
export type SearchQueryInput = z.infer<typeof searchQuery>