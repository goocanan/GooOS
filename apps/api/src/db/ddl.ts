/**
 * Schema bootstrap for the embedded PGlite database.
 *
 * Rather than requiring `drizzle-kit push` (which needs a running server for
 * remote Postgres), the table DDL lives here as plain Postgres SQL. It is
 * idempotent, so running it on every boot is safe. `drizzle-kit generate`
 * still works for producing versioned migrations to commit.
 */

export const DDL = `
-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE "role" AS ENUM ('owner','admin','manager','creator','reviewer','client');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "plan" AS ENUM ('free','creator','pro','agency');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "platform" AS ENUM ('tiktok','instagram_post','instagram_reel','instagram_story','youtube','youtube_short','facebook_post','facebook_reel','x','linkedin','blog','ads');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "content_status" AS ENUM ('idea','planned','script','production','editing','review','approved','scheduled','published','archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "priority" AS ENUM ('low','medium','high','urgent');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "asset_kind" AS ENUM ('image','video','audio','document','model');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "campaign_status" AS ENUM ('planning','active','completed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "comment_kind" AS ENUM ('comment','change_request','approval');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "approval_decision" AS ENUM ('approved','changes_requested','rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "notification_kind" AS ENUM ('task','approval','schedule','publish','insight');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "activity_kind" AS ENUM ('create','edit','assign','upload','review','publish','delete');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- Auth
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "users" (
  "id" text PRIMARY KEY,
  "name" text NOT NULL,
  "email" text NOT NULL,
  "email_verified" boolean NOT NULL DEFAULT false,
  "image" text,
  "title" text,
  "active" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_idx" ON "users" ("email");

CREATE TABLE IF NOT EXISTS "sessions" (
  "id" text PRIMARY KEY,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "token" text NOT NULL,
  "expires_at" timestamptz NOT NULL,
  "ip_address" text,
  "user_agent" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "sessions_token_idx" ON "sessions" ("token");
CREATE INDEX IF NOT EXISTS "sessions_user_idx" ON "sessions" ("user_id");

CREATE TABLE IF NOT EXISTS "accounts" (
  "id" text PRIMARY KEY,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "account_id" text NOT NULL,
  "provider_id" text NOT NULL,
  "access_token" text,
  "refresh_token" text,
  "id_token" text,
  "access_token_expires_at" timestamptz,
  "refresh_token_expires_at" timestamptz,
  "scope" text,
  "password" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "accounts_user_idx" ON "accounts" ("user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "accounts_provider_account_idx" ON "accounts" ("provider_id","account_id");

CREATE TABLE IF NOT EXISTS "verifications" (
  "id" text PRIMARY KEY,
  "identifier" text NOT NULL,
  "value" text NOT NULL,
  "expires_at" timestamptz NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "verifications_identifier_idx" ON "verifications" ("identifier");

-- ---------------------------------------------------------------------------
-- Workspace
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "workspaces" (
  "id" text PRIMARY KEY,
  "name" text NOT NULL,
  "slug" text NOT NULL,
  "plan" plan NOT NULL DEFAULT 'free',
  "content_usage" integer NOT NULL DEFAULT 0,
  "content_limit" integer NOT NULL DEFAULT 30,
  "storage_used_kb" integer NOT NULL DEFAULT 0,
  "storage_limit_mb" integer NOT NULL DEFAULT 1024,
  "seats" integer NOT NULL DEFAULT 1,
  "seat_limit" integer NOT NULL DEFAULT 1,
  "timezone" text NOT NULL DEFAULT 'Asia/Jakarta',
  "language" text NOT NULL DEFAULT 'id-ID',
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "workspaces_slug_idx" ON "workspaces" ("slug");

CREATE TABLE IF NOT EXISTS "workspace_members" (
  "workspace_id" text NOT NULL REFERENCES "workspaces"("id") ON DELETE CASCADE,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "role" role NOT NULL DEFAULT 'creator',
  "joined_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("workspace_id","user_id")
);
CREATE INDEX IF NOT EXISTS "members_user_idx" ON "workspace_members" ("user_id");

-- ---------------------------------------------------------------------------
-- Brand
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "brands" (
  "id" text PRIMARY KEY,
  "workspace_id" text NOT NULL REFERENCES "workspaces"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "description" text NOT NULL DEFAULT '',
  "website" text NOT NULL DEFAULT '',
  "logo_text" text NOT NULL DEFAULT '',
  "color" text NOT NULL DEFAULT '#b81e51',
  "industry" text NOT NULL DEFAULT '',
  "audience" text NOT NULL DEFAULT '',
  "socials" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "guidelines" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "brands_workspace_idx" ON "brands" ("workspace_id");

-- ---------------------------------------------------------------------------
-- Campaign
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "campaigns" (
  "id" text PRIMARY KEY,
  "workspace_id" text NOT NULL REFERENCES "workspaces"("id") ON DELETE CASCADE,
  "brand_id" text NOT NULL REFERENCES "brands"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "goal" text NOT NULL DEFAULT 'Awareness',
  "start" timestamptz NOT NULL,
  "end" timestamptz NOT NULL,
  "status" campaign_status NOT NULL DEFAULT 'planning',
  "color" text NOT NULL DEFAULT '#b81e51',
  "budget" numeric(14,2),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "campaigns_workspace_idx" ON "campaigns" ("workspace_id");
CREATE INDEX IF NOT EXISTS "campaigns_brand_idx" ON "campaigns" ("brand_id");

-- ---------------------------------------------------------------------------
-- Ideas
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "ideas" (
  "id" text PRIMARY KEY,
  "workspace_id" text NOT NULL REFERENCES "workspaces"("id") ON DELETE CASCADE,
  "title" text NOT NULL,
  "description" text NOT NULL DEFAULT '',
  "reference" text NOT NULL DEFAULT '',
  "platform" platform NOT NULL DEFAULT 'tiktok',
  "tags" text[] NOT NULL DEFAULT '{}',
  "priority" priority NOT NULL DEFAULT 'medium',
  "created_by" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "votes" integer NOT NULL DEFAULT 1,
  "converted_content_id" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "ideas_workspace_idx" ON "ideas" ("workspace_id");
CREATE INDEX IF NOT EXISTS "ideas_converted_idx" ON "ideas" ("converted_content_id");

-- ---------------------------------------------------------------------------
-- Assets (declared before contents so content_assets can reference it)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "asset_folders" (
  "id" text PRIMARY KEY,
  "workspace_id" text NOT NULL REFERENCES "workspaces"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "color" text,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "asset_folders_unique_idx" ON "asset_folders" ("workspace_id","name");

CREATE TABLE IF NOT EXISTS "assets" (
  "id" text PRIMARY KEY,
  "workspace_id" text NOT NULL REFERENCES "workspaces"("id") ON DELETE CASCADE,
  "folder" text NOT NULL DEFAULT 'Unsorted',
  "name" text NOT NULL,
  "kind" asset_kind NOT NULL,
  "ext" text NOT NULL,
  "size_kb" integer NOT NULL DEFAULT 0,
  "resolution" text,
  "duration_sec" real,
  "uploaded_by" text NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
  "tags" text[] NOT NULL DEFAULT '{}',
  "brand_id" text REFERENCES "brands"("id") ON DELETE SET NULL,
  "campaign_id" text REFERENCES "campaigns"("id") ON DELETE SET NULL,
  "storage_key" text NOT NULL,
  "color" text NOT NULL DEFAULT '#38bdf8',
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "assets_workspace_folder_idx" ON "assets" ("workspace_id","folder");
CREATE INDEX IF NOT EXISTS "assets_kind_idx" ON "assets" ("kind");
CREATE INDEX IF NOT EXISTS "assets_tags_idx" ON "assets" USING gin ("tags");

-- ---------------------------------------------------------------------------
-- Content
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "contents" (
  "id" text PRIMARY KEY,
  "ref" integer NOT NULL,
  "workspace_id" text NOT NULL REFERENCES "workspaces"("id") ON DELETE CASCADE,
  "brand_id" text NOT NULL REFERENCES "brands"("id") ON DELETE RESTRICT,
  "campaign_id" text REFERENCES "campaigns"("id") ON DELETE SET NULL,
  "title" text NOT NULL,
  "description" text NOT NULL DEFAULT '',
  "type" platform NOT NULL,
  "status" content_status NOT NULL DEFAULT 'idea',
  "priority" priority NOT NULL DEFAULT 'medium',
  "owner_id" text NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
  "creator_id" text NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
  "reviewer_id" text REFERENCES "users"("id") ON DELETE SET NULL,
  "tags" text[] NOT NULL DEFAULT '{}',
  "due_date" timestamptz,
  "deadline" timestamptz,
  "thumbnail_color" text NOT NULL DEFAULT '#8b1e3f',
  "cta" text NOT NULL DEFAULT '',
  "notes" text NOT NULL DEFAULT '',
  "brief" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "production_progress" integer NOT NULL DEFAULT 0,
  "idea_source" text,
  "version" integer NOT NULL DEFAULT 1,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "contents_ref_idx" ON "contents" ("workspace_id","ref");
CREATE INDEX IF NOT EXISTS "contents_workspace_status_idx" ON "contents" ("workspace_id","status");
CREATE INDEX IF NOT EXISTS "contents_campaign_idx" ON "contents" ("campaign_id");
CREATE INDEX IF NOT EXISTS "contents_creator_idx" ON "contents" ("creator_id");
CREATE INDEX IF NOT EXISTS "contents_deadline_idx" ON "contents" ("deadline");
CREATE INDEX IF NOT EXISTS "contents_tags_idx" ON "contents" USING gin ("tags");

CREATE TABLE IF NOT EXISTS "content_platforms" (
  "id" text PRIMARY KEY,
  "content_id" text NOT NULL REFERENCES "contents"("id") ON DELETE CASCADE,
  "platform" platform NOT NULL,
  "caption" text NOT NULL DEFAULT '',
  "hashtags" text[] NOT NULL DEFAULT '{}',
  "scheduled_at" timestamptz,
  "published_at" timestamptz,
  "primary_date" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "content_platforms_unique_idx" ON "content_platforms" ("content_id","platform");
CREATE INDEX IF NOT EXISTS "content_platforms_date_idx" ON "content_platforms" ("primary_date");
CREATE INDEX IF NOT EXISTS "content_platforms_scheduled_idx" ON "content_platforms" ("scheduled_at");

CREATE TABLE IF NOT EXISTS "content_assets" (
  "content_id" text NOT NULL REFERENCES "contents"("id") ON DELETE CASCADE,
  "asset_id" text NOT NULL REFERENCES "assets"("id") ON DELETE CASCADE,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("content_id","asset_id")
);
CREATE INDEX IF NOT EXISTS "content_assets_asset_idx" ON "content_assets" ("asset_id");

CREATE TABLE IF NOT EXISTS "content_versions" (
  "id" text PRIMARY KEY,
  "content_id" text NOT NULL REFERENCES "contents"("id") ON DELETE CASCADE,
  "version" integer NOT NULL,
  "title" text NOT NULL,
  "snapshot" jsonb NOT NULL,
  "created_by" text NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "content_versions_unique_idx" ON "content_versions" ("content_id","version");

-- ---------------------------------------------------------------------------
-- Scripts
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "scripts" (
  "id" text PRIMARY KEY,
  "workspace_id" text NOT NULL REFERENCES "workspaces"("id") ON DELETE CASCADE,
  "content_id" text NOT NULL REFERENCES "contents"("id") ON DELETE CASCADE,
  "title" text NOT NULL,
  "version" integer NOT NULL DEFAULT 1,
  "blocks" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "scripts_content_idx" ON "scripts" ("content_id");
CREATE INDEX IF NOT EXISTS "scripts_workspace_idx" ON "scripts" ("workspace_id");

CREATE TABLE IF NOT EXISTS "script_versions" (
  "id" text PRIMARY KEY,
  "script_id" text NOT NULL REFERENCES "scripts"("id") ON DELETE CASCADE,
  "version" integer NOT NULL,
  "blocks" jsonb NOT NULL,
  "created_by" text NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "script_versions_unique_idx" ON "script_versions" ("script_id","version");

-- ---------------------------------------------------------------------------
-- Comments and approvals
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "comments" (
  "id" text PRIMARY KEY,
  "content_id" text NOT NULL REFERENCES "contents"("id") ON DELETE CASCADE,
  "author_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "body" text NOT NULL,
  "timestamp_sec" integer,
  "kind" comment_kind NOT NULL DEFAULT 'comment',
  "resolved" boolean NOT NULL DEFAULT false,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "comments_content_idx" ON "comments" ("content_id");
CREATE INDEX IF NOT EXISTS "comments_resolved_idx" ON "comments" ("resolved");

CREATE TABLE IF NOT EXISTS "approvals" (
  "id" text PRIMARY KEY,
  "content_id" text NOT NULL REFERENCES "contents"("id") ON DELETE CASCADE,
  "reviewer_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "decision" approval_decision NOT NULL,
  "note" text,
  "timestamp_sec" integer,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "approvals_content_idx" ON "approvals" ("content_id");
CREATE INDEX IF NOT EXISTS "approvals_reviewer_idx" ON "approvals" ("reviewer_id");

-- ---------------------------------------------------------------------------
-- Scheduling
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "scheduled_posts" (
  "id" text PRIMARY KEY,
  "content_id" text NOT NULL REFERENCES "contents"("id") ON DELETE CASCADE,
  "platform_id" platform NOT NULL,
  "scheduled_at" timestamptz NOT NULL,
  "timezone" text NOT NULL DEFAULT 'Asia/Jakarta',
  "status" text NOT NULL DEFAULT 'scheduled',
  "mode" text NOT NULL DEFAULT 'schedule',
  "published_at" timestamptz,
  "attempts" integer NOT NULL DEFAULT 0,
  "last_error" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "scheduled_posts_at_idx" ON "scheduled_posts" ("scheduled_at");
CREATE INDEX IF NOT EXISTS "scheduled_posts_status_idx" ON "scheduled_posts" ("status");
CREATE UNIQUE INDEX IF NOT EXISTS "scheduled_posts_content_platform_idx" ON "scheduled_posts" ("content_id","platform_id");

CREATE TABLE IF NOT EXISTS "calendar_events" (
  "id" text PRIMARY KEY,
  "workspace_id" text NOT NULL REFERENCES "workspaces"("id") ON DELETE CASCADE,
  "content_id" text REFERENCES "contents"("id") ON DELETE CASCADE,
  "kind" text NOT NULL DEFAULT 'publish',
  "title" text NOT NULL,
  "description" text NOT NULL DEFAULT '',
  "starts_at" timestamptz NOT NULL,
  "ends_at" timestamptz,
  "all_day" boolean NOT NULL DEFAULT false,
  "created_by" text REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "calendar_events_starts_idx" ON "calendar_events" ("starts_at");

CREATE TABLE IF NOT EXISTS "platform_accounts" (
  "id" text PRIMARY KEY,
  "workspace_id" text NOT NULL REFERENCES "workspaces"("id") ON DELETE CASCADE,
  "platform" platform NOT NULL,
  "handle" text NOT NULL,
  "account_type" text NOT NULL DEFAULT 'Business',
  "connected" boolean NOT NULL DEFAULT false,
  "followers" integer NOT NULL DEFAULT 0,
  "external_id" text,
  "access_token_encrypted" text,
  "refresh_token_encrypted" text,
  "last_synced_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "platform_accounts_unique_idx" ON "platform_accounts" ("workspace_id","platform","handle");

-- ---------------------------------------------------------------------------
-- Analytics
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "analytics" (
  "id" text PRIMARY KEY,
  "workspace_id" text NOT NULL REFERENCES "workspaces"("id") ON DELETE CASCADE,
  "content_id" text NOT NULL REFERENCES "contents"("id") ON DELETE CASCADE,
  "platform" platform NOT NULL,
  "views" bigint NOT NULL DEFAULT 0,
  "likes" bigint NOT NULL DEFAULT 0,
  "comments" bigint NOT NULL DEFAULT 0,
  "shares" bigint NOT NULL DEFAULT 0,
  "saves" bigint NOT NULL DEFAULT 0,
  "watch_time_min" integer NOT NULL DEFAULT 0,
  "ctr" real NOT NULL DEFAULT 0,
  "followers_gained" integer NOT NULL DEFAULT 0,
  "captured_at" timestamptz NOT NULL DEFAULT now(),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "analytics_unique_idx" ON "analytics" ("content_id","platform");
CREATE INDEX IF NOT EXISTS "analytics_workspace_idx" ON "analytics" ("workspace_id");
CREATE INDEX IF NOT EXISTS "analytics_captured_idx" ON "analytics" ("captured_at");

CREATE TABLE IF NOT EXISTS "analytics_daily" (
  "id" text PRIMARY KEY,
  "workspace_id" text NOT NULL REFERENCES "workspaces"("id") ON DELETE CASCADE,
  "date" text NOT NULL,
  "platform" platform NOT NULL,
  "content_id" text REFERENCES "contents"("id") ON DELETE CASCADE,
  "views" bigint NOT NULL DEFAULT 0,
  "likes" bigint NOT NULL DEFAULT 0,
  "comments" bigint NOT NULL DEFAULT 0,
  "shares" bigint NOT NULL DEFAULT 0,
  "saves" bigint NOT NULL DEFAULT 0,
  "followers_gained" integer NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX IF NOT EXISTS "analytics_daily_unique_idx" ON "analytics_daily" ("workspace_id","date","platform","content_id");
CREATE INDEX IF NOT EXISTS "analytics_daily_date_idx" ON "analytics_daily" ("date");

-- ---------------------------------------------------------------------------
-- Hashtags
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "hashtag_groups" (
  "id" text PRIMARY KEY,
  "workspace_id" text NOT NULL REFERENCES "workspaces"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "color" text,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "hashtag_groups_unique_idx" ON "hashtag_groups" ("workspace_id","name");

CREATE TABLE IF NOT EXISTS "hashtags" (
  "id" text PRIMARY KEY,
  "workspace_id" text NOT NULL REFERENCES "workspaces"("id") ON DELETE CASCADE,
  "tag" text NOT NULL,
  "group_id" text REFERENCES "hashtag_groups"("id") ON DELETE SET NULL,
  "usage" integer NOT NULL DEFAULT 0,
  "reach" bigint NOT NULL DEFAULT 0,
  "engagement" real NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "hashtags_unique_idx" ON "hashtags" ("workspace_id","tag");

-- ---------------------------------------------------------------------------
-- Notifications, tasks, AI, audit
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "notifications" (
  "id" text PRIMARY KEY,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "workspace_id" text NOT NULL REFERENCES "workspaces"("id") ON DELETE CASCADE,
  "kind" notification_kind NOT NULL,
  "title" text NOT NULL,
  "body" text NOT NULL DEFAULT '',
  "href" text NOT NULL DEFAULT '/',
  "read" boolean NOT NULL DEFAULT false,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "notifications_user_read_idx" ON "notifications" ("user_id","read");

CREATE TABLE IF NOT EXISTS "tasks" (
  "id" text PRIMARY KEY,
  "workspace_id" text NOT NULL REFERENCES "workspaces"("id") ON DELETE CASCADE,
  "content_id" text REFERENCES "contents"("id") ON DELETE CASCADE,
  "assignee_id" text REFERENCES "users"("id") ON DELETE CASCADE,
  "title" text NOT NULL,
  "due_at" timestamptz,
  "done_at" timestamptz,
  "created_by" text REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "tasks_assignee_due_idx" ON "tasks" ("assignee_id","due_at");

CREATE TABLE IF NOT EXISTS "ai_generations" (
  "id" text PRIMARY KEY,
  "workspace_id" text NOT NULL REFERENCES "workspaces"("id") ON DELETE CASCADE,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "tool" text NOT NULL,
  "prompt" text NOT NULL,
  "output" text NOT NULL,
  "model" text NOT NULL,
  "credits_used" integer NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "ai_generations_workspace_idx" ON "ai_generations" ("workspace_id","created_at");

CREATE TABLE IF NOT EXISTS "activity_logs" (
  "id" text PRIMARY KEY,
  "workspace_id" text NOT NULL REFERENCES "workspaces"("id") ON DELETE CASCADE,
  "actor_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "verb" text NOT NULL,
  "target" text NOT NULL,
  "target_id" text,
  "kind" activity_kind NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "activity_logs_workspace_idx" ON "activity_logs" ("workspace_id","created_at");
CREATE INDEX IF NOT EXISTS "activity_logs_target_idx" ON "activity_logs" ("target_id");
`