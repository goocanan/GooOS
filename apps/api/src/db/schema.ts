import {
  pgTable,
  text,
  integer,
  bigint,
  boolean,
  timestamp,
  jsonb,
  numeric,
  real,
  pgEnum,
  uniqueIndex,
  index,
  primaryKey,
} from 'drizzle-orm/pg-core'
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
  ACTIVITY_KINDS,
} from '@gooos/shared/enums'

/**
 * Schema for PRD section 36.
 *
 * Enums are created as real Postgres enums so the database rejects invalid
 * values even if a caller bypasses Zod validation. Tables that Better Auth
 * manages are included as plain definitions - Better Auth's Drizzle adapter
 * reads and writes them with these exact column names.
 */

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const roleEnum = pgEnum('role', ROLES)
export const planEnum = pgEnum('plan', PLANS)
export const platformEnum = pgEnum('platform', PLATFORM_IDS)
export const contentStatusEnum = pgEnum('content_status', CONTENT_STATUSES)
export const priorityEnum = pgEnum('priority', PRIORITIES)
export const assetKindEnum = pgEnum('asset_kind', ASSET_KINDS)
export const campaignStatusEnum = pgEnum('campaign_status', CAMPAIGN_STATUSES)
export const commentKindEnum = pgEnum('comment_kind', COMMENT_KINDS)
export const approvalDecisionEnum = pgEnum('approval_decision', APPROVAL_DECISIONS)
export const notificationKindEnum = pgEnum('notification_kind', NOTIFICATION_KINDS)
export const activityKindEnum = pgEnum('activity_kind', ACTIVITY_KINDS)

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}

// ---------------------------------------------------------------------------
// Auth tables (Better Auth managed)
// ---------------------------------------------------------------------------

export const users = pgTable(
  'users',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull(),
    emailVerified: boolean('email_verified').notNull().default(false),
    image: text('image'),
    /** GooOS-specific profile fields. */
    title: text('title'),
    active: boolean('active').notNull().default(true),
    ...timestamps,
  },
  (t) => [uniqueIndex('users_email_idx').on(t.email)],
)

export const sessions = pgTable(
  'sessions',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    token: text('token').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('sessions_token_idx').on(t.token), index('sessions_user_idx').on(t.userId)],
)

export const accounts = pgTable(
  'accounts',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
    scope: text('scope'),
    password: text('password'),
    ...timestamps,
  },
  (t) => [
    index('accounts_user_idx').on(t.userId),
    uniqueIndex('accounts_provider_account_idx').on(t.providerId, t.accountId),
  ],
)

export const verifications = pgTable(
  'verifications',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('verifications_identifier_idx').on(t.identifier)],
)

// ---------------------------------------------------------------------------
// Workspace (PRD section 6)
// ---------------------------------------------------------------------------

export const workspaces = pgTable(
  'workspaces',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    plan: planEnum('plan').notNull().default('free'),
    contentUsage: integer('content_usage').notNull().default(0),
    contentLimit: integer('content_limit').notNull().default(30),
    storageUsedKb: integer('storage_used_kb').notNull().default(0),
    storageLimitMb: integer('storage_limit_mb').notNull().default(1024),
    seats: integer('seats').notNull().default(1),
    seatLimit: integer('seat_limit').notNull().default(1),
    timezone: text('timezone').notNull().default('Asia/Jakarta'),
    language: text('language').notNull().default('id-ID'),
    ...timestamps,
  },
  (t) => [uniqueIndex('workspaces_slug_idx').on(t.slug)],
)

export const workspaceMembers = pgTable(
  'workspace_members',
  {
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: roleEnum('role').notNull().default('creator'),
    joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.workspaceId, t.userId] }), index('members_user_idx').on(t.userId)],
)

// ---------------------------------------------------------------------------
// Brand (PRD section 7)
// ---------------------------------------------------------------------------

export const brands = pgTable(
  'brands',
  {
    id: text('id').primaryKey(),
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description').notNull().default(''),
    website: text('website').notNull().default(''),
    logoText: text('logo_text').notNull().default(''),
    color: text('color').notNull().default('#b81e51'),
    industry: text('industry').notNull().default(''),
    audience: text('audience').notNull().default(''),
    socials: jsonb('socials').$type<{ platform: string; handle: string }[]>().notNull().default([]),
    guidelines: jsonb('guidelines').$type<{
      tone: string
      primaryColor: string
      secondaryColor: string
      keywords: string[]
      doList: string[]
      dontList: string[]
      fonts: string
    }>().notNull(),
    ...timestamps,
  },
  (t) => [index('brands_workspace_idx').on(t.workspaceId)],
)

// ---------------------------------------------------------------------------
// Campaign (PRD section 21)
// ---------------------------------------------------------------------------

export const campaigns = pgTable(
  'campaigns',
  {
    id: text('id').primaryKey(),
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    brandId: text('brand_id')
      .notNull()
      .references(() => brands.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    goal: text('goal').notNull().default('Awareness'),
    start: timestamp('start', { withTimezone: true }).notNull(),
    end: timestamp('end', { withTimezone: true }).notNull(),
    status: campaignStatusEnum('status').notNull().default('planning'),
    color: text('color').notNull().default('#b81e51'),
    budget: numeric('budget', { precision: 14, scale: 2 }),
    ...timestamps,
  },
  (t) => [index('campaigns_workspace_idx').on(t.workspaceId), index('campaigns_brand_idx').on(t.brandId)],
)

// ---------------------------------------------------------------------------
// Ideas (PRD section 13)
// ---------------------------------------------------------------------------

export const ideas = pgTable(
  'ideas',
  {
    id: text('id').primaryKey(),
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description').notNull().default(''),
    reference: text('reference').notNull().default(''),
    platform: platformEnum('platform').notNull().default('tiktok'),
    tags: text('tags').array().notNull().default([]),
    priority: priorityEnum('priority').notNull().default('medium'),
    createdBy: text('created_by')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    votes: integer('votes').notNull().default(1),
    convertedContentId: text('converted_content_id'),
    ...timestamps,
  },
  (t) => [index('ideas_workspace_idx').on(t.workspaceId), index('ideas_converted_idx').on(t.convertedContentId)],
)

// ---------------------------------------------------------------------------
// Content (PRD sections 8 and 24)
// ---------------------------------------------------------------------------

export const contents = pgTable(
  'contents',
  {
    id: text('id').primaryKey(),
    /** Human-facing reference like #1024. */
    ref: integer('ref').notNull(),
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    brandId: text('brand_id')
      .notNull()
      .references(() => brands.id, { onDelete: 'restrict' }),
    campaignId: text('campaign_id').references(() => campaigns.id, { onDelete: 'set null' }),
    title: text('title').notNull(),
    description: text('description').notNull().default(''),
    type: platformEnum('type').notNull(),
    status: contentStatusEnum('status').notNull().default('idea'),
    priority: priorityEnum('priority').notNull().default('medium'),
    ownerId: text('owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    creatorId: text('creator_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    reviewerId: text('reviewer_id').references(() => users.id, { onDelete: 'set null' }),
    tags: text('tags').array().notNull().default([]),
    dueDate: timestamp('due_date', { withTimezone: true }),
    deadline: timestamp('deadline', { withTimezone: true }),
    thumbnailColor: text('thumbnail_color').notNull().default('#8b1e3f'),
    cta: text('cta').notNull().default(''),
    notes: text('notes').notNull().default(''),
    brief: jsonb('brief').$type<{
      objective: string
      audience: string
      topic: string
      hook: string
      keyMessage: string
      cta: string
      reference: string[]
      expectedDuration: string
    }>().notNull(),
    productionProgress: integer('production_progress').notNull().default(0),
    ideaSource: text('idea_source'),
    /** Monotonic counter for optimistic concurrency and version history. */
    version: integer('version').notNull().default(1),
    ...timestamps,
  },
  (t) => [
    uniqueIndex('contents_ref_idx').on(t.workspaceId, t.ref),
    index('contents_workspace_status_idx').on(t.workspaceId, t.status),
    index('contents_campaign_idx').on(t.campaignId),
    index('contents_creator_idx').on(t.creatorId),
    index('contents_deadline_idx').on(t.deadline),
  ],
)

/** Per-platform caption, hashtags, media, schedule (PRD section 24). */
export const contentPlatforms = pgTable(
  'content_platforms',
  {
    id: text('id').primaryKey(),
    contentId: text('content_id')
      .notNull()
      .references(() => contents.id, { onDelete: 'cascade' }),
    platform: platformEnum('platform').notNull(),
    caption: text('caption').notNull().default(''),
    hashtags: text('hashtags').array().notNull().default([]),
    scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    /** Denormalised for fast calendar queries: earliest scheduled timestamp. */
    primaryDate: timestamp('primary_date', { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex('content_platforms_unique_idx').on(t.contentId, t.platform),
    index('content_platforms_date_idx').on(t.primaryDate),
    index('content_platforms_scheduled_idx').on(t.scheduledAt),
  ],
)

/** Asset to content association, many-to-many (PRD section 18). */
export const contentAssets = pgTable(
  'content_assets',
  {
    contentId: text('content_id')
      .notNull()
      .references(() => contents.id, { onDelete: 'cascade' }),
    assetId: text('asset_id')
      .notNull()
      .references(() => assets.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.contentId, t.assetId] }),
    index('content_assets_asset_idx').on(t.assetId),
  ],
)

/** Immutable snapshot of a content row on every meaningful change (PRD §18). */
export const contentVersions = pgTable(
  'content_versions',
  {
    id: text('id').primaryKey(),
    contentId: text('content_id')
      .notNull()
      .references(() => contents.id, { onDelete: 'cascade' }),
    version: integer('version').notNull(),
    title: text('title').notNull(),
    snapshot: jsonb('snapshot').$type<Record<string, unknown>>().notNull(),
    createdBy: text('created_by')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('content_versions_unique_idx').on(t.contentId, t.version)],
)

// ---------------------------------------------------------------------------
// Scripts (PRD sections 15 and 18)
// ---------------------------------------------------------------------------

export const scripts = pgTable(
  'scripts',
  {
    id: text('id').primaryKey(),
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    contentId: text('content_id')
      .notNull()
      .references(() => contents.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    version: integer('version').notNull().default(1),
    blocks: jsonb('blocks').$type<
      { id?: string; kind: 'hook' | 'intro' | 'body' | 'broll' | 'voiceover' | 'cta'; heading?: string; body?: string }[]
    >().notNull().default([]),
    ...timestamps,
  },
  (t) => [uniqueIndex('scripts_content_idx').on(t.contentId), index('scripts_workspace_idx').on(t.workspaceId)],
)

export const scriptVersions = pgTable(
  'script_versions',
  {
    id: text('id').primaryKey(),
    scriptId: text('script_id')
      .notNull()
      .references(() => scripts.id, { onDelete: 'cascade' }),
    version: integer('version').notNull(),
    blocks: jsonb('blocks').$type<Record<string, unknown>[]>().notNull(),
    createdBy: text('created_by')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('script_versions_unique_idx').on(t.scriptId, t.version)],
)

// ---------------------------------------------------------------------------
// Assets (PRD sections 16 and 17)
// ---------------------------------------------------------------------------

export const assetFolders = pgTable(
  'asset_folders',
  {
    id: text('id').primaryKey(),
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    color: text('color'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('asset_folders_unique_idx').on(t.workspaceId, t.name)],
)

export const assets = pgTable(
  'assets',
  {
    id: text('id').primaryKey(),
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    folder: text('folder').notNull().default('Unsorted'),
    name: text('name').notNull(),
    kind: assetKindEnum('kind').notNull(),
    ext: text('ext').notNull(),
    sizeKb: integer('size_kb').notNull().default(0),
    resolution: text('resolution'),
    durationSec: real('duration_sec'),
    uploadedBy: text('uploaded_by')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    tags: text('tags').array().notNull().default([]),
    brandId: text('brand_id').references(() => brands.id, { onDelete: 'set null' }),
    campaignId: text('campaign_id').references(() => campaigns.id, { onDelete: 'set null' }),
    /** Object key in S3, or the relative path in local storage. */
    storageKey: text('storage_key').notNull(),
    color: text('color').notNull().default('#38bdf8'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('assets_workspace_folder_idx').on(t.workspaceId, t.folder),
    index('assets_kind_idx').on(t.kind),
    index('assets_tags_idx').on(t.tags),
  ],
)

// ---------------------------------------------------------------------------
// Comments and approvals (PRD sections 19 and 20)
// ---------------------------------------------------------------------------

export const comments = pgTable(
  'comments',
  {
    id: text('id').primaryKey(),
    contentId: text('content_id')
      .notNull()
      .references(() => contents.id, { onDelete: 'cascade' }),
    authorId: text('author_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    body: text('body').notNull(),
    /** Video-style review timestamp in seconds. */
    timestampSec: integer('timestamp_sec'),
    kind: commentKindEnum('kind').notNull().default('comment'),
    resolved: boolean('resolved').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('comments_content_idx').on(t.contentId), index('comments_resolved_idx').on(t.resolved)],
)

export const approvals = pgTable(
  'approvals',
  {
    id: text('id').primaryKey(),
    contentId: text('content_id')
      .notNull()
      .references(() => contents.id, { onDelete: 'cascade' }),
    reviewerId: text('reviewer_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    decision: approvalDecisionEnum('decision').notNull(),
    note: text('note'),
    timestampSec: integer('timestamp_sec'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('approvals_content_idx').on(t.contentId), index('approvals_reviewer_idx').on(t.reviewerId)],
)

// ---------------------------------------------------------------------------
// Scheduling (PRD sections 25 and 26)
// ---------------------------------------------------------------------------

export const scheduledPosts = pgTable(
  'scheduled_posts',
  {
    id: text('id').primaryKey(),
    contentId: text('content_id')
      .notNull()
      .references(() => contents.id, { onDelete: 'cascade' }),
    platformId: platformEnum('platform_id').notNull(),
    scheduledAt: timestamp('scheduled_at', { withTimezone: true }).notNull(),
    timezone: text('timezone').notNull().default('Asia/Jakarta'),
    status: text('status').notNull().default('scheduled'),
    /** 'schedule' = queued for the publishing worker, 'copy_publish' = manual. */
    mode: text('mode').notNull().default('schedule'),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    attempts: integer('attempts').notNull().default(0),
    lastError: text('last_error'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('scheduled_posts_at_idx').on(t.scheduledAt),
    index('scheduled_posts_status_idx').on(t.status),
    uniqueIndex('scheduled_posts_content_platform_idx').on(t.contentId, t.platformId),
  ],
)

/** Blocks reserved for native calendar events and reminders. */
export const calendarEvents = pgTable(
  'calendar_events',
  {
    id: text('id').primaryKey(),
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    contentId: text('content_id').references(() => contents.id, { onDelete: 'cascade' }),
    kind: text('kind').notNull().default('publish'),
    title: text('title').notNull(),
    description: text('description').notNull().default(''),
    startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
    endsAt: timestamp('ends_at', { withTimezone: true }),
    allDay: boolean('all_day').notNull().default(false),
    createdBy: text('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('calendar_events_starts_idx').on(t.startsAt)],
)

export const platformAccounts = pgTable(
  'platform_accounts',
  {
    id: text('id').primaryKey(),
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    platform: platformEnum('platform').notNull(),
    handle: text('handle').notNull(),
    accountType: text('account_type').notNull().default('Business'),
    connected: boolean('connected').notNull().default(false),
    followers: integer('followers').notNull().default(0),
    externalId: text('external_id'),
    /** Encrypted refresh token; never returned by the API in plaintext. */
    accessTokenEncrypted: text('access_token_encrypted'),
    refreshTokenEncrypted: text('refresh_token_encrypted'),
    lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('platform_accounts_unique_idx').on(t.workspaceId, t.platform, t.handle)],
)

// ---------------------------------------------------------------------------
// Analytics (PRD sections 29 and 30)
// ---------------------------------------------------------------------------

export const analytics = pgTable(
  'analytics',
  {
    id: text('id').primaryKey(),
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    contentId: text('content_id')
      .notNull()
      .references(() => contents.id, { onDelete: 'cascade' }),
    platform: platformEnum('platform').notNull(),
    views: bigint('views', { mode: 'number' }).notNull().default(0),
    likes: bigint('likes', { mode: 'number' }).notNull().default(0),
    comments: bigint('comments', { mode: 'number' }).notNull().default(0),
    shares: bigint('shares', { mode: 'number' }).notNull().default(0),
    saves: bigint('saves', { mode: 'number' }).notNull().default(0),
    watchTimeMin: integer('watch_time_min').notNull().default(0),
    ctr: real('ctr').notNull().default(0),
    followersGained: integer('followers_gained').notNull().default(0),
    capturedAt: timestamp('captured_at', { withTimezone: true }).notNull().defaultNow(),
    ...timestamps,
  },
  (t) => [
    uniqueIndex('analytics_unique_idx').on(t.contentId, t.platform),
    index('analytics_workspace_idx').on(t.workspaceId),
    index('analytics_captured_idx').on(t.capturedAt),
  ],
)

/** Pre-aggregated daily rollup so dashboards do not scan every row. */
export const analyticsDaily = pgTable(
  'analytics_daily',
  {
    id: text('id').primaryKey(),
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    date: text('date').notNull(),
    platform: platformEnum('platform').notNull(),
    contentId: text('content_id').references(() => contents.id, { onDelete: 'cascade' }),
    views: bigint('views', { mode: 'number' }).notNull().default(0),
    likes: bigint('likes', { mode: 'number' }).notNull().default(0),
    comments: bigint('comments', { mode: 'number' }).notNull().default(0),
    shares: bigint('shares', { mode: 'number' }).notNull().default(0),
    saves: bigint('saves', { mode: 'number' }).notNull().default(0),
    followersGained: integer('followers_gained').notNull().default(0),
  },
  (t) => [
    uniqueIndex('analytics_daily_unique_idx').on(t.workspaceId, t.date, t.platform, t.contentId),
    index('analytics_daily_date_idx').on(t.date),
  ],
)

// ---------------------------------------------------------------------------
// Hashtags (PRD section 22)
// ---------------------------------------------------------------------------

export const hashtagGroups = pgTable(
  'hashtag_groups',
  {
    id: text('id').primaryKey(),
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    color: text('color'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('hashtag_groups_unique_idx').on(t.workspaceId, t.name)],
)

export const hashtags = pgTable(
  'hashtags',
  {
    id: text('id').primaryKey(),
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    tag: text('tag').notNull(),
    groupId: text('group_id').references(() => hashtagGroups.id, { onDelete: 'set null' }),
    usage: integer('usage').notNull().default(0),
    reach: bigint('reach', { mode: 'number' }).notNull().default(0),
    engagement: real('engagement').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('hashtags_unique_idx').on(t.workspaceId, t.tag)],
)

// ---------------------------------------------------------------------------
// Notifications, tasks, AI, audit (PRD sections 32, 27, 39)
// ---------------------------------------------------------------------------

export const notifications = pgTable(
  'notifications',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    kind: notificationKindEnum('kind').notNull(),
    title: text('title').notNull(),
    body: text('body').notNull().default(''),
    href: text('href').notNull().default('/'),
    read: boolean('read').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('notifications_user_read_idx').on(t.userId, t.read)],
)

/** Deadline reminders generated by the daily scheduler (PRD section 32). */
export const tasks = pgTable(
  'tasks',
  {
    id: text('id').primaryKey(),
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    contentId: text('content_id').references(() => contents.id, { onDelete: 'cascade' }),
    assigneeId: text('assignee_id').references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    dueAt: timestamp('due_at', { withTimezone: true }),
    doneAt: timestamp('done_at', { withTimezone: true }),
    createdBy: text('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('tasks_assignee_due_idx').on(t.assigneeId, t.dueAt)],
)

export const aiGenerations = pgTable(
  'ai_generations',
  {
    id: text('id').primaryKey(),
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tool: text('tool').notNull(),
    prompt: text('prompt').notNull(),
    output: text('output').notNull(),
    model: text('model').notNull(),
    creditsUsed: integer('credits_used').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('ai_generations_workspace_idx').on(t.workspaceId, t.createdAt)],
)

export const activityLogs = pgTable(
  'activity_logs',
  {
    id: text('id').primaryKey(),
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    actorId: text('actor_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    verb: text('verb').notNull(),
    target: text('target').notNull(),
    targetId: text('target_id'),
    kind: activityKindEnum('kind').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('activity_logs_workspace_idx').on(t.workspaceId, t.createdAt),
    index('activity_logs_target_idx').on(t.targetId),
  ],
)