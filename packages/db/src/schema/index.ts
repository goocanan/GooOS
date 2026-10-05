import {
  pgTable,
  uuid,
  text,
  varchar,
  timestamp,
  boolean,
  integer,
  jsonb,
  pgEnum,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ──────────────────────────────────────────────
// ENUMS
// ──────────────────────────────────────────────

export const userRoleEnum = pgEnum("user_role", [
  "owner",
  "admin",
  "manager",
  "creator",
  "reviewer",
  "client",
]);

export const contentTypeEnum = pgEnum("content_type", [
  "tiktok",
  "instagram_post",
  "instagram_reel",
  "instagram_story",
  "youtube_video",
  "youtube_short",
  "facebook_post",
  "facebook_reel",
  "x_twitter",
  "linkedin",
  "blog",
  "advertisement",
]);

export const contentStatusEnum = pgEnum("content_status", [
  "idea",
  "planned",
  "script",
  "production",
  "editing",
  "review",
  "approved",
  "scheduled",
  "published",
  "archived",
]);

export const priorityEnum = pgEnum("priority", [
  "low",
  "medium",
  "high",
  "urgent",
]);

export const approvalStatusEnum = pgEnum("approval_status", [
  "pending",
  "approved",
  "rejected",
  "changes_requested",
]);

export const campaignGoalEnum = pgEnum("campaign_goal", [
  "awareness",
  "engagement",
  "conversion",
  "retention",
  "product_launch",
  "branding",
]);

export const notificationTypeEnum = pgEnum("notification_type", [
  "task",
  "approval",
  "schedule",
  "publishing",
  "comment",
  "system",
]);

export const assetTypeEnum = pgEnum("asset_type", [
  "image",
  "video",
  "gif",
  "document",
  "stl",
  "3mf",
  "zip",
  "other",
]);

// ──────────────────────────────────────────────
// USERS & AUTH
// ──────────────────────────────────────────────

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    avatarUrl: text("avatar_url"),
    passwordHash: text("password_hash"),
    emailVerified: boolean("email_verified").default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("users_email_idx").on(table.email),
  ],
);

export const usersRelations = relations(users, ({ many }) => ({
  workspaceMemberships: many(workspaceMembers),
  ownedContent: many(content, { relationName: "contentOwner" }),
  createdContent: many(content, { relationName: "contentCreator" }),
  comments: many(comments),
  approvals: many(approvals),
  notifications: many(notifications),
  oauthAccounts: many(oauthAccounts),
  sessions: many(sessions),
}));

export const oauthAccounts = pgTable(
  "oauth_accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: varchar("provider", { length: 50 }).notNull(), // google, github, etc.
    providerAccountId: varchar("provider_account_id", { length: 255 }).notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("oauth_accounts_provider_idx").on(table.provider, table.providerAccountId),
  ],
);

export const oauthAccountsRelations = relations(oauthAccounts, ({ one }) => ({
  user: one(users, {
    fields: [oauthAccounts.userId],
    references: [users.id],
  }),
}));

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

// ──────────────────────────────────────────────
// WORKSPACES
// ──────────────────────────────────────────────

export const workspaces = pgTable(
  "workspaces",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 100 }).notNull().unique(),
    description: text("description"),
    logoUrl: text("logo_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("workspaces_slug_idx").on(table.slug),
  ],
);

export const workspacesRelations = relations(workspaces, ({ many }) => ({
  members: many(workspaceMembers),
  brands: many(brands),
  content: many(content),
  campaigns: many(campaigns),
  assets: many(assets),
  assetFolders: many(assetFolders),
  hashtags: many(hashtags),
  hashtagGroups: many(hashtagGroups),
  platformAccounts: many(platformAccounts),
  scheduledPosts: many(scheduledPosts),
  notifications: many(notifications),
  activityLogs: many(activityLogs),
}));

export const workspaceMembers = pgTable(
  "workspace_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: userRoleEnum("role").default("creator").notNull(),
    invitedAt: timestamp("invited_at", { withTimezone: true }),
    joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex("workspace_members_unique_idx").on(table.workspaceId, table.userId),
  ],
);

export const workspaceMembersRelations = relations(workspaceMembers, ({ one }) => ({
  workspace: one(workspaces, { fields: [workspaceMembers.workspaceId], references: [workspaces.id] }),
  user: one(users, { fields: [workspaceMembers.userId], references: [users.id] }),
}));

// ──────────────────────────────────────────────
// BRANDS
// ──────────────────────────────────────────────

export const brands = pgTable(
  "brands",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 100 }).notNull(),
    logoUrl: text("logo_url"),
    description: text("description"),
    website: text("website"),
    instagram: varchar("instagram", { length: 255 }),
    tiktok: varchar("tiktok", { length: 255 }),
    youtube: varchar("youtube", { length: 255 }),
    facebook: varchar("facebook", { length: 255 }),
    primaryColor: varchar("primary_color", { length: 7 }),
    secondaryColor: varchar("secondary_color", { length: 7 }),
    font: varchar("font", { length: 255 }),
    toneOfVoice: text("tone_of_voice"),
    targetAudience: text("target_audience"),
    industry: varchar("industry", { length: 255 }),
    keywords: jsonb("keywords").$type<string[]>(),
    guidelines: jsonb("guidelines").$type<Record<string, string>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("brands_workspace_slug_idx").on(table.workspaceId, table.slug),
  ],
);

export const brandsRelations = relations(brands, ({ one, many }) => ({
  workspace: one(workspaces, { fields: [brands.workspaceId], references: [workspaces.id] }),
  content: many(content),
}));

// ──────────────────────────────────────────────
// CAMPAIGNS
// ──────────────────────────────────────────────

export const campaigns = pgTable("campaigns", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  goal: campaignGoalEnum("goal"),
  startDate: timestamp("start_date", { withTimezone: true }),
  endDate: timestamp("end_date", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const campaignsRelations = relations(campaigns, ({ one, many }) => ({
  workspace: one(workspaces, { fields: [campaigns.workspaceId], references: [workspaces.id] }),
  content: many(content),
}));

// ──────────────────────────────────────────────
// CONTENT
// ──────────────────────────────────────────────

export const content = pgTable(
  "content",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    brandId: uuid("brand_id").references(() => brands.id, { onDelete: "set null" }),
    campaignId: uuid("campaign_id").references(() => campaigns.id, { onDelete: "set null" }),

    title: varchar("title", { length: 500 }).notNull(),
    description: text("description"),

    type: contentTypeEnum("type").notNull(),
    status: contentStatusEnum("status").default("idea").notNull(),
    priority: priorityEnum("priority").default("medium"),

    ownerId: uuid("owner_id").references(() => users.id, { onDelete: "set null" }),
    creatorId: uuid("creator_id").references(() => users.id, { onDelete: "set null" }),
    reviewerId: uuid("reviewer_id").references(() => users.id, { onDelete: "set null" }),

    tags: jsonb("tags").$type<string[]>().default([]),

    deadline: timestamp("deadline", { withTimezone: true }),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
    publishedAt: timestamp("published_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("content_workspace_idx").on(table.workspaceId),
    index("content_status_idx").on(table.status),
    index("content_type_idx").on(table.type),
    index("content_brand_idx").on(table.brandId),
    index("content_owner_idx").on(table.ownerId),
    index("content_scheduled_idx").on(table.scheduledAt),
  ],
);

export const contentRelations = relations(content, ({ one, many }) => ({
  workspace: one(workspaces, { fields: [content.workspaceId], references: [workspaces.id] }),
  brand: one(brands, { fields: [content.brandId], references: [brands.id] }),
  campaign: one(campaigns, { fields: [content.campaignId], references: [campaigns.id] }),
  owner: one(users, { fields: [content.ownerId], references: [users.id], relationName: "contentOwner" }),
  creator: one(users, { fields: [content.creatorId], references: [users.id], relationName: "contentCreator" }),
  reviewer: one(users, { fields: [content.reviewerId], references: [users.id] }),
  versions: many(contentVersions),
  platforms: many(contentPlatforms),
  scripts: many(scripts),
  assets: many(contentAssets),
  comments: many(comments),
  approvals: many(approvals),
  analytics: many(analytics),
}));

// ──────────────────────────────────────────────
// CONTENT VERSIONS
// ──────────────────────────────────────────────

export const contentVersions = pgTable("content_versions", {
  id: uuid("id").primaryKey().defaultRandom(),
  contentId: uuid("content_id")
    .notNull()
    .references(() => content.id, { onDelete: "cascade" }),
  version: integer("version").notNull(),
  title: varchar("title", { length: 500 }),
  description: text("description"),
  hook: text("hook"),
  intro: text("intro"),
  body: text("body"),
  cta: text("cta"),
  caption: text("caption"),
  hashtags: jsonb("hashtags").$type<string[]>(),
  notes: text("notes"),
  isCurrent: boolean("is_current").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  createdById: uuid("created_by_id").references(() => users.id, { onDelete: "set null" }),
});

export const contentVersionsRelations = relations(contentVersions, ({ one }) => ({
  content: one(content, { fields: [contentVersions.contentId], references: [content.id] }),
  createdBy: one(users, { fields: [contentVersions.createdById], references: [users.id] }),
}));

// ──────────────────────────────────────────────
// CONTENT PLATFORMS (multi-platform per content)
// ──────────────────────────────────────────────

export const contentPlatforms = pgTable(
  "content_platforms",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    contentId: uuid("content_id")
      .notNull()
      .references(() => content.id, { onDelete: "cascade" }),
    type: contentTypeEnum("type").notNull(),
    caption: text("caption"),
    hashtags: jsonb("hashtags").$type<string[]>(),
    mediaUrls: jsonb("media_urls").$type<string[]>(),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    platformPostId: varchar("platform_post_id", { length: 255 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("content_platforms_content_idx").on(table.contentId),
  ],
);

export const contentPlatformsRelations = relations(contentPlatforms, ({ one }) => ({
  content: one(content, { fields: [contentPlatforms.contentId], references: [content.id] }),
}));

// ──────────────────────────────────────────────
// SCRIPTS
// ──────────────────────────────────────────────

export const scripts = pgTable("scripts", {
  id: uuid("id").primaryKey().defaultRandom(),
  contentId: uuid("content_id")
    .notNull()
    .references(() => content.id, { onDelete: "cascade" }),
  version: integer("version").notNull(),
  hook: text("hook"),
  intro: text("intro"),
  body: text("body"),
  cta: text("cta"),
  scenes: jsonb("scenes").$type<
    Array<{
      timestamp?: string;
      type: "scene" | "b-roll" | "voiceover" | "text";
      content: string;
      notes?: string;
    }>
  >(),
  isCurrent: boolean("is_current").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const scriptsRelations = relations(scripts, ({ one }) => ({
  content: one(content, { fields: [scripts.contentId], references: [content.id] }),
}));

// ──────────────────────────────────────────────
// ASSETS
// ──────────────────────────────────────────────

export const assetFolders = pgTable("asset_folders", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  parentId: uuid("parent_id"),
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const assetFoldersRelations = relations(assetFolders, ({ one, many }) => ({
  parent: one(assetFolders, {
    fields: [assetFolders.parentId],
    references: [assetFolders.id],
    relationName: "folderHierarchy",
  }),
  children: many(assetFolders, { relationName: "folderHierarchy" }),
  workspace: one(workspaces, { fields: [assetFolders.workspaceId], references: [workspaces.id] }),
  assets: many(assets),
}));

export const assets = pgTable(
  "assets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    folderId: uuid("folder_id").references(() => assetFolders.id, { onDelete: "set null" }),
    name: varchar("name", { length: 500 }).notNull(),
    type: assetTypeEnum("type").notNull(),
    size: integer("size").notNull(), // bytes
    mimeType: varchar("mime_type", { length: 100 }),
    url: text("url").notNull(),
    thumbnailUrl: text("thumbnail_url"),
    resolution: varchar("resolution", { length: 50 }),
    duration: integer("duration"), // seconds for video
    tags: jsonb("tags").$type<string[]>().default([]),
    brandId: uuid("brand_id").references(() => brands.id, { onDelete: "set null" }),
    campaignId: uuid("campaign_id").references(() => campaigns.id, { onDelete: "set null" }),
    uploadedById: uuid("uploaded_by_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("assets_workspace_idx").on(table.workspaceId),
    index("assets_folder_idx").on(table.folderId),
    index("assets_type_idx").on(table.type),
  ],
);

export const assetsRelations = relations(assets, ({ one, many }) => ({
  workspace: one(workspaces, { fields: [assets.workspaceId], references: [workspaces.id] }),
  folder: one(assetFolders, { fields: [assets.folderId], references: [assetFolders.id] }),
  brand: one(brands, { fields: [assets.brandId], references: [brands.id] }),
  campaign: one(campaigns, { fields: [assets.campaignId], references: [campaigns.id] }),
  uploadedBy: one(users, { fields: [assets.uploadedById], references: [users.id] }),
  contentLinks: many(contentAssets),
}));

export const contentAssets = pgTable(
  "content_assets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    contentId: uuid("content_id")
      .notNull()
      .references(() => content.id, { onDelete: "cascade" }),
    assetId: uuid("asset_id")
      .notNull()
      .references(() => assets.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 50 }), // thumbnail, main, b-roll, document, etc.
    addedAt: timestamp("added_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("content_assets_unique_idx").on(table.contentId, table.assetId, table.role),
  ],
);

export const contentAssetsRelations = relations(contentAssets, ({ one }) => ({
  content: one(content, { fields: [contentAssets.contentId], references: [content.id] }),
  asset: one(assets, { fields: [contentAssets.assetId], references: [assets.id] }),
}));

// ──────────────────────────────────────────────
// COMMENTS
// ──────────────────────────────────────────────

export const comments = pgTable(
  "comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    contentId: uuid("content_id")
      .notNull()
      .references(() => content.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    parentCommentId: uuid("parent_comment_id"),
    body: text("body").notNull(),
    timestamp: varchar("timestamp", { length: 20 }), // e.g. "00:07" for video timestamp comments
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("comments_content_idx").on(table.contentId),
  ],
);

export const commentsRelations = relations(comments, ({ one, many }) => ({
  content: one(content, { fields: [comments.contentId], references: [content.id] }),
  user: one(users, { fields: [comments.userId], references: [users.id] }),
  parent: one(comments, {
    fields: [comments.parentCommentId],
    references: [comments.id],
    relationName: "commentReplies",
  }),
  replies: many(comments, { relationName: "commentReplies" }),
}));

// ──────────────────────────────────────────────
// APPROVALS
// ──────────────────────────────────────────────

export const approvals = pgTable(
  "approvals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    contentId: uuid("content_id")
      .notNull()
      .references(() => content.id, { onDelete: "cascade" }),
    reviewerId: uuid("reviewer_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: approvalStatusEnum("status").default("pending").notNull(),
    reason: text("reason"),
    timestamp: varchar("timestamp", { length: 20 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("approvals_content_idx").on(table.contentId),
  ],
);

export const approvalsRelations = relations(approvals, ({ one }) => ({
  content: one(content, { fields: [approvals.contentId], references: [content.id] }),
  reviewer: one(users, { fields: [approvals.reviewerId], references: [users.id] }),
}));

// ──────────────────────────────────────────────
// HASHTAGS
// ──────────────────────────────────────────────

export const hashtags = pgTable("hashtags", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  tag: varchar("tag", { length: 255 }).notNull(),
  usageCount: integer("usage_count").default(0),
  estimatedReach: integer("estimated_reach"),
  avgEngagement: integer("avg_engagement"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const hashtagsRelations = relations(hashtags, ({ one, many }) => ({
  workspace: one(workspaces, { fields: [hashtags.workspaceId], references: [workspaces.id] }),
  groups: many(hashtagGroupItems),
}));

export const hashtagGroups = pgTable("hashtag_groups", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const hashtagGroupsRelations = relations(hashtagGroups, ({ one, many }) => ({
  workspace: one(workspaces, { fields: [hashtagGroups.workspaceId], references: [workspaces.id] }),
  items: many(hashtagGroupItems),
}));

export const hashtagGroupItems = pgTable("hashtag_group_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  groupId: uuid("group_id")
    .notNull()
    .references(() => hashtagGroups.id, { onDelete: "cascade" }),
  hashtagId: uuid("hashtag_id")
    .notNull()
    .references(() => hashtags.id, { onDelete: "cascade" }),
});

export const hashtagGroupItemsRelations = relations(hashtagGroupItems, ({ one }) => ({
  group: one(hashtagGroups, { fields: [hashtagGroupItems.groupId], references: [hashtagGroups.id] }),
  hashtag: one(hashtags, { fields: [hashtagGroupItems.hashtagId], references: [hashtags.id] }),
}));

// ──────────────────────────────────────────────
// PLATFORM ACCOUNTS
// ──────────────────────────────────────────────

export const platformAccounts = pgTable("platform_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  platform: varchar("platform", { length: 50 }).notNull(), // tiktok, instagram, youtube, etc.
  accountId: varchar("account_id", { length: 255 }).notNull(),
  username: varchar("username", { length: 255 }),
  displayName: varchar("display_name", { length: 255 }),
  avatarUrl: text("avatar_url"),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  tokenExpiresAt: timestamp("token_expires_at", { withTimezone: true }),
  connectedAt: timestamp("connected_at", { withTimezone: true }).defaultNow().notNull(),
});

export const platformAccountsRelations = relations(platformAccounts, ({ one }) => ({
  workspace: one(workspaces, { fields: [platformAccounts.workspaceId], references: [workspaces.id] }),
}));

// ──────────────────────────────────────────────
// SCHEDULED POSTS
// ──────────────────────────────────────────────

export const scheduledPosts = pgTable("scheduled_posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  contentId: uuid("content_id")
    .notNull()
    .references(() => content.id, { onDelete: "cascade" }),
  platformAccountId: uuid("platform_account_id")
    .notNull()
    .references(() => platformAccounts.id, { onDelete: "cascade" }),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
  timezone: varchar("timezone", { length: 50 }).default("Asia/Jakarta"),
  status: varchar("status", { length: 50 }).default("scheduled"), // scheduled, publishing, published, failed
  platformPostId: varchar("platform_post_id", { length: 255 }),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  error: text("error"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const scheduledPostsRelations = relations(scheduledPosts, ({ one }) => ({
  workspace: one(workspaces, { fields: [scheduledPosts.workspaceId], references: [workspaces.id] }),
  content: one(content, { fields: [scheduledPosts.contentId], references: [content.id] }),
  platformAccount: one(platformAccounts, { fields: [scheduledPosts.platformAccountId], references: [platformAccounts.id] }),
}));

// ──────────────────────────────────────────────
// ANALYTICS
// ──────────────────────────────────────────────

export const analytics = pgTable(
  "analytics",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    contentId: uuid("content_id")
      .notNull()
      .references(() => content.id, { onDelete: "cascade" }),
    platform: contentTypeEnum("platform").notNull(),
    date: timestamp("date", { withTimezone: true }).notNull(),
    views: integer("views").default(0),
    likes: integer("likes").default(0),
    comments: integer("comments").default(0),
    shares: integer("shares").default(0),
    saves: integer("saves").default(0),
    watchTime: integer("watch_time").default(0), // seconds
    ctr: integer("ctr"), // basis points (1 = 0.01%)
    engagementRate: integer("engagement_rate"), // basis points
    followersGained: integer("followers_gained").default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("analytics_content_idx").on(table.contentId),
    index("analytics_date_idx").on(table.date),
  ],
);

export const analyticsRelations = relations(analytics, ({ one }) => ({
  content: one(content, { fields: [analytics.contentId], references: [content.id] }),
}));

// ──────────────────────────────────────────────
// IDEAS
// ──────────────────────────────────────────────

export const ideas = pgTable("ideas", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  reference: text("reference"),
  platform: contentTypeEnum("platform"),
  tags: jsonb("tags").$type<string[]>().default([]),
  priority: priorityEnum("priority").default("medium"),
  convertedToContentId: uuid("converted_to_content_id").references(() => content.id, { onDelete: "set null" }),
  createdById: uuid("created_by_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const ideasRelations = relations(ideas, ({ one }) => ({
  workspace: one(workspaces, { fields: [ideas.workspaceId], references: [workspaces.id] }),
  convertedContent: one(content, { fields: [ideas.convertedToContentId], references: [content.id] }),
  createdBy: one(users, { fields: [ideas.createdById], references: [users.id] }),
}));

// ──────────────────────────────────────────────
// NOTIFICATIONS
// ──────────────────────────────────────────────

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: notificationTypeEnum("type").notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    body: text("body"),
    link: text("link"),
    read: boolean("read").default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("notifications_user_idx").on(table.userId),
    index("notifications_read_idx").on(table.read),
  ],
);

export const notificationsRelations = relations(notifications, ({ one }) => ({
  workspace: one(workspaces, { fields: [notifications.workspaceId], references: [workspaces.id] }),
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));

// ──────────────────────────────────────────────
// ACTIVITY LOG
// ──────────────────────────────────────────────

export const activityLogs = pgTable(
  "activity_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    action: varchar("action", { length: 255 }).notNull(),
    entity: varchar("entity", { length: 100 }), // content, asset, campaign, etc.
    entityId: uuid("entity_id"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("activity_logs_workspace_idx").on(table.workspaceId),
    index("activity_logs_entity_idx").on(table.entity, table.entityId),
  ],
);

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  workspace: one(workspaces, { fields: [activityLogs.workspaceId], references: [workspaces.id] }),
  user: one(users, { fields: [activityLogs.userId], references: [users.id] }),
}));

// ──────────────────────────────────────────────
// AI GENERATIONS
// ──────────────────────────────────────────────

export const aiGenerations = pgTable("ai_generations", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 50 }).notNull(), // idea, hook, script, caption, repurpose, score
  input: jsonb("input").notNull(),
  output: jsonb("output").notNull(),
  model: varchar("model", { length: 100 }),
  tokensUsed: integer("tokens_used"),
  contentId: uuid("content_id").references(() => content.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const aiGenerationsRelations = relations(aiGenerations, ({ one }) => ({
  workspace: one(workspaces, { fields: [aiGenerations.workspaceId], references: [workspaces.id] }),
  user: one(users, { fields: [aiGenerations.userId], references: [users.id] }),
  content: one(content, { fields: [aiGenerations.contentId], references: [content.id] }),
}));

// ──────────────────────────────────────────────
// WEBHOOKS
// ──────────────────────────────────────────────

export const webhooks = pgTable("webhooks", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  url: text("url").notNull(),
  events: jsonb("events").notNull(),
  secret: text("secret"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const webhooksRelations = relations(webhooks, ({ one }) => ({
  workspace: one(workspaces, { fields: [webhooks.workspaceId], references: [workspaces.id] }),
}));

// ──────────────────────────────────────────────
// AUTOMATION RULES
// ──────────────────────────────────────────────

export const automationRules = pgTable("automation_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  trigger: varchar("trigger", { length: 100 }).notNull(),
  conditions: jsonb("conditions"),
  actions: jsonb("actions").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const automationRulesRelations = relations(automationRules, ({ one }) => ({
  workspace: one(workspaces, { fields: [automationRules.workspaceId], references: [workspaces.id] }),
}));

// ──────────────────────────────────────────────
// BETTER AUTH (Account & Verification)
// ──────────────────────────────────────────────

export const account = pgTable(
  "account",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accountProvider: varchar("account_provider", { length: 255 }).notNull(),
    providerAccountId: varchar("provider_account_id", { length: 255 }).notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
  },
);

export const verification = pgTable(
  "verification",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    identifier: varchar("identifier", { length: 255 }).notNull(),
    value: varchar("value", { length: 255 }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
);
