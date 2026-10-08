import type {
  AiRunDTO,
  AnalyticsDTO,
  AssetDTO,
  BrandDTO,
  CampaignDTO,
  CommentDTO,
  ContentBriefDTO,
  ContentDTO,
  HashtagDTO,
  IdeaDTO,
  MemberDTO,
  NotificationDTO,
  PlatformAccountDTO,
  ScriptBlockDTO,
  ScriptDTO,
  UserDTO,
  WorkspaceDTO,
} from '@gooos/shared/types'
import type {
  ApprovalDecision,
  AssetKind,
  CampaignStatus,
  CommentKind,
  ContentStatus,
  NotificationKind,
  PlatformId,
  Plan,
  Priority,
  Role,
} from '@gooos/shared/enums'
import type * as t from '../db/schema'
import { env } from '../config/env'

/**
 * Row -> DTO mappers.
 *
 * Two responsibilities live here so routes stay declarative:
 *   1. snake_case columns -> camelCase keys
 *   2. defaulting JSON columns so a hand-edited row can never crash a page
 */

/** Row type for a Drizzle table, inferred from its $inferSelect. */
export type Row<K extends keyof typeof t> = (typeof t)[K] extends { $inferSelect: infer R }
  ? R
  : never

const iso = (v: Date | string | null | undefined): string | null =>
  v == null ? null : (v instanceof Date ? v.toISOString() : new Date(v).toISOString())

const isoReq = (v: Date | string | null | undefined): string =>
  iso(v) ?? new Date(0).toISOString()

const emptyBrief = (): ContentBriefDTO => ({
  objective: 'Awareness',
  audience: '',
  topic: '',
  hook: '',
  keyMessage: '',
  cta: '',
  reference: [],
  expectedDuration: '',
})

export function toUserDTO(row: Row<'users'>): UserDTO {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    image: row.image,
    title: row.title,
    active: row.active,
    createdAt: isoReq(row.createdAt),
  }
}

/**
 * Members are read through a join that selects only the columns the Team page
 * shows, so this takes a structural subset rather than the full users row.
 */
export function toMemberDTO(
  row: {
    id: string
    name: string
    email: string
    image: string | null
    title: string | null
    active: boolean
    createdAt: Date | string
    role: Role
    joinedAt: Date | string
  },
): MemberDTO {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    image: row.image,
    title: row.title,
    active: row.active,
    createdAt: isoReq(row.createdAt),
    role: row.role,
    joinedAt: isoReq(row.joinedAt),
  }
}

export function toWorkspaceDTO(row: Row<'workspaces'>, role: Role): WorkspaceDTO {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    plan: row.plan as Plan,
    contentUsage: row.contentUsage,
    contentLimit: row.contentLimit,
    storageUsedMb: Math.round((row.storageUsedKb / 1024) * 10) / 10,
    storageLimitMb: row.storageLimitMb,
    seats: row.seats,
    seatLimit: row.seatLimit,
    role,
    createdAt: isoReq(row.createdAt),
  }
}

export function toBrandDTO(row: Row<'brands'>): BrandDTO {
  const g = row.guidelines ?? ({} as NonNullable<typeof row.guidelines>)
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    name: row.name,
    description: row.description,
    website: row.website,
    logoText: row.logoText,
    color: row.color,
    industry: row.industry,
    audience: row.audience,
    socials: (Array.isArray(row.socials) ? row.socials : []).map((s) => ({
      platform: s.platform as PlatformId,
      handle: s.handle,
    })),
    guidelines: {
      tone: g.tone ?? '',
      primaryColor: g.primaryColor ?? '#8B1E3F',
      secondaryColor: g.secondaryColor ?? '#D4AF37',
      keywords: g.keywords ?? [],
      doList: g.doList ?? [],
      dontList: g.dontList ?? [],
      fonts: g.fonts ?? 'Inter',
    },
    createdAt: isoReq(row.createdAt),
  }
}

export function toCampaignDTO(
  row: Row<'campaigns'>,
  rollup: { contentCount: number; publishedCount: number } = { contentCount: 0, publishedCount: 0 },
): CampaignDTO {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    brandId: row.brandId,
    name: row.name,
    goal: row.goal,
    start: isoReq(row.start),
    end: isoReq(row.end),
    status: row.status as CampaignStatus,
    color: row.color,
    budget: row.budget == null ? null : Number(row.budget),
    contentCount: rollup.contentCount,
    publishedCount: rollup.publishedCount,
    createdAt: isoReq(row.createdAt),
  }
}

export interface ContentRelations {
  platforms?: Row<'contentPlatforms'>[]
  assetIds?: string[]
  scriptId?: string | null
}

export function toContentDTO(row: Row<'contents'>, rel: ContentRelations = {}): ContentDTO {
  const platforms = (rel.platforms ?? []).map((p) => ({
    platform: p.platform as PlatformId,
    caption: p.caption,
    hashtags: p.hashtags ?? [],
    mediaAssetIds: [] as string[],
    scheduledAt: iso(p.scheduledAt),
    publishedAt: iso(p.publishedAt),
  }))

  return {
    id: row.id,
    ref: row.ref,
    workspaceId: row.workspaceId,
    brandId: row.brandId,
    campaignId: row.campaignId,
    title: row.title,
    description: row.description,
    type: row.type as PlatformId,
    status: row.status as ContentStatus,
    priority: row.priority as Priority,
    ownerId: row.ownerId,
    creatorId: row.creatorId,
    reviewerId: row.reviewerId,
    tags: row.tags ?? [],
    dueDate: iso(row.dueDate),
    deadline: iso(row.deadline),
    scheduledAt: platforms.find((p) => p.scheduledAt)?.scheduledAt ?? null,
    publishedAt: platforms.find((p) => p.publishedAt)?.publishedAt ?? null,
    thumbnailColor: row.thumbnailColor,
    platforms: platforms.length
      ? platforms
      : [
          {
            platform: row.type as PlatformId,
            caption: '',
            hashtags: [],
            mediaAssetIds: [],
            scheduledAt: null,
            publishedAt: null,
          },
        ],
    cta: row.cta,
    notes: row.notes,
    brief: { ...emptyBrief(), ...(row.brief ?? {}) },
    scriptId: rel.scriptId ?? null,
    assetIds: rel.assetIds ?? [],
    createdAt: isoReq(row.createdAt),
    updatedAt: isoReq(row.updatedAt),
    ideaSource: row.ideaSource,
    productionProgress: row.productionProgress,
    version: row.version,
  }
}

export function toScriptDTO(row: Row<'scripts'>): ScriptDTO {
  const blocks = Array.isArray(row.blocks) ? row.blocks : []
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    contentId: row.contentId,
    title: row.title,
    version: row.version,
    blocks: blocks.map(
      (b, i): ScriptBlockDTO => ({
        id: b.id ?? `blk_${i}`,
        kind: b.kind,
        heading: b.heading ?? '',
        body: b.body ?? '',
      }),
    ),
    updatedAt: isoReq(row.updatedAt),
  }
}

export function toAssetDTO(row: Row<'assets'>, usedByContentIds: string[] = []): AssetDTO {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    folder: row.folder,
    name: row.name,
    kind: row.kind as AssetKind,
    ext: row.ext,
    sizeKb: row.sizeKb,
    resolution: row.resolution,
    durationSec: row.durationSec,
    uploadedAt: isoReq(row.createdAt),
    uploaderId: row.uploadedBy,
    tags: row.tags ?? [],
    brandId: row.brandId,
    campaignId: row.campaignId,
    storageKey: row.storageKey,
    usedByContentIds,
    color: row.color,
    url: assetUrl(row.storageKey),
  }
}

/** Local storage stand-in for signed S3 URLs. */
export function assetUrl(storageKey: string): string {
  return `${env.API_PUBLIC_URL}/api/assets/file/${storageKey
    .split('/')
    .map(encodeURIComponent)
    .join('/')}`
}

export function toCommentDTO(row: Row<'comments'>): CommentDTO {
  return {
    id: row.id,
    contentId: row.contentId,
    authorId: row.authorId,
    body: row.body,
    timestampSec: row.timestampSec,
    createdAt: isoReq(row.createdAt),
    resolved: row.resolved,
    kind: row.kind as CommentKind,
  }
}

export function toAnalyticsDTO(row: Row<'analytics'>): AnalyticsDTO {
  return {
    contentId: row.contentId,
    platform: row.platform as PlatformId,
    views: Number(row.views),
    likes: Number(row.likes),
    comments: Number(row.comments),
    shares: Number(row.shares),
    saves: Number(row.saves),
    watchTimeMin: row.watchTimeMin,
    ctr: row.ctr,
    followersGained: row.followersGained,
    capturedAt: isoReq(row.capturedAt),
  }
}

export function toIdeaDTO(row: Row<'ideas'>): IdeaDTO {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    title: row.title,
    description: row.description,
    reference: row.reference,
    platform: row.platform as PlatformId,
    tags: row.tags ?? [],
    priority: row.priority as Priority,
    createdBy: row.createdBy,
    createdAt: isoReq(row.createdAt),
    convertedContentId: row.convertedContentId,
    votes: row.votes,
  }
}

export function toHashtagDTO(row: Row<'hashtags'>, group?: string | null): HashtagDTO {
  return {
    id: row.id,
    tag: row.tag,
    usage: row.usage,
    reach: Number(row.reach),
    engagement: row.engagement,
    group: group ?? 'Baru',
  }
}

export function toNotificationDTO(row: Row<'notifications'>): NotificationDTO {
  return {
    id: row.id,
    kind: row.kind as NotificationKind,
    title: row.title,
    body: row.body,
    href: row.href,
    read: row.read,
    at: isoReq(row.createdAt),
  }
}

export function toPlatformAccountDTO(row: Row<'platformAccounts'>): PlatformAccountDTO {
  return {
    id: row.id,
    platform: row.platform as PlatformId,
    handle: row.handle,
    accountType: row.accountType,
    connected: row.connected,
    followers: row.followers,
    externalId: row.externalId,
  }
}

export function toAiRunDTO(row: Row<'aiGenerations'>): AiRunDTO {
  return {
    id: row.id,
    tool: row.tool,
    prompt: row.prompt,
    output: row.output,
    model: row.model,
    creditsUsed: row.creditsUsed,
    at: isoReq(row.createdAt),
  }
}

export type { ApprovalDecision }