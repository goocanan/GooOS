import type {
  AssetKind,
  CampaignStatus,
  ContentStatus,
  PlatformId,
  Plan,
  Priority,
  Role,
} from './enums'

/**
 * Row shapes returned by the API. These are the database entities with
 * snake_case keys flattened to camelCase and JSON columns parsed.
 */

export interface UserDTO {
  id: string
  name: string
  email: string
  image: string | null
  title: string | null
  active: boolean
  createdAt: string
  /**
   * Deterministic avatar colour. Not stored server-side: the API derives it
   * from the user id so the same person looks the same everywhere.
   */
  avatarColor?: string
}

export interface WorkspaceDTO {
  id: string
  name: string
  slug: string
  plan: Plan
  contentUsage: number
  contentLimit: number
  storageUsedMb: number
  storageLimitMb: number
  seats: number
  seatLimit: number
  role: Role
  createdAt: string
}

export interface MemberDTO extends UserDTO {
  role: Role
  joinedAt: string
}

export interface BrandSocialDTO {
  platform: PlatformId
  handle: string
}

export interface BrandGuidelinesDTO {
  tone: string
  primaryColor: string
  secondaryColor: string
  keywords: string[]
  doList: string[]
  dontList: string[]
  fonts: string
}

export interface BrandDTO {
  id: string
  workspaceId: string
  name: string
  description: string
  website: string
  logoText: string
  color: string
  industry: string
  audience: string
  socials: BrandSocialDTO[]
  guidelines: BrandGuidelinesDTO
  createdAt: string
}

export interface CampaignDTO {
  id: string
  workspaceId: string
  brandId: string
  name: string
  goal: string
  start: string
  end: string
  status: CampaignStatus
  color: string
  budget: number | null
  contentCount: number
  publishedCount: number
  createdAt: string
}

export interface ContentBriefDTO {
  objective: string
  audience: string
  topic: string
  hook: string
  keyMessage: string
  cta: string
  reference: string[]
  expectedDuration: string
}

export interface PlatformVariantDTO {
  platform: PlatformId
  caption: string
  hashtags: string[]
  mediaAssetIds: string[]
  scheduledAt: string | null
  publishedAt: string | null
}

export interface ContentDTO {
  id: string
  ref: number
  workspaceId: string
  brandId: string
  campaignId: string | null
  title: string
  description: string
  type: PlatformId
  status: ContentStatus
  priority: Priority
  ownerId: string
  creatorId: string
  reviewerId: string | null
  tags: string[]
  dueDate: string | null
  deadline: string | null
  scheduledAt: string | null
  publishedAt: string | null
  thumbnailColor: string
  platforms: PlatformVariantDTO[]
  cta: string
  notes: string
  brief: ContentBriefDTO
  scriptId: string | null
  assetIds: string[]
  createdAt: string
  updatedAt: string
  ideaSource: string | null
  productionProgress: number
  version: number
}

export interface ScriptBlockDTO {
  id: string
  kind: 'hook' | 'intro' | 'body' | 'broll' | 'voiceover' | 'cta'
  heading: string
  body: string
}

export interface ScriptDTO {
  id: string
  workspaceId: string
  contentId: string
  title: string
  version: number
  blocks: ScriptBlockDTO[]
  updatedAt: string
}

export interface AssetDTO {
  id: string
  workspaceId: string
  folder: string
  name: string
  kind: AssetKind
  ext: string
  sizeKb: number
  resolution: string | null
  durationSec: number | null
  uploadedAt: string
  uploaderId: string
  tags: string[]
  brandId: string | null
  campaignId: string | null
  storageKey: string
  usedByContentIds: string[]
  color: string
  url: string
}

export interface CommentDTO {
  id: string
  contentId: string
  authorId: string
  body: string
  timestampSec: number | null
  createdAt: string
  resolved: boolean
  kind: 'comment' | 'change_request' | 'approval'
}

export interface ApprovalDTO {
  id: string
  contentId: string
  reviewerId: string
  decision: 'approved' | 'changes_requested' | 'rejected'
  note: string | null
  timestampSec: number | null
  createdAt: string
}

export interface AnalyticsDTO {
  contentId: string
  platform: PlatformId
  views: number
  likes: number
  comments: number
  shares: number
  saves: number
  watchTimeMin: number
  ctr: number
  followersGained: number
  capturedAt: string
}

export interface IdeaDTO {
  id: string
  workspaceId: string
  title: string
  description: string
  reference: string
  platform: PlatformId
  tags: string[]
  priority: Priority
  createdBy: string
  createdAt: string
  convertedContentId: string | null
  votes: number
}

export interface HashtagDTO {
  id: string
  tag: string
  usage: number
  reach: number
  engagement: number
  group: string
}

export interface ActivityDTO {
  id: string
  workspaceId: string
  actorId: string
  verb: string
  target: string
  targetId: string | null
  kind: 'create' | 'edit' | 'assign' | 'upload' | 'review' | 'publish' | 'delete'
  at: string
}

export interface NotificationDTO {
  id: string
  kind: 'task' | 'approval' | 'schedule' | 'publish' | 'insight'
  title: string
  body: string
  href: string
  read: boolean
  at: string
}

export interface PlatformAccountDTO {
  id: string
  platform: PlatformId
  handle: string
  accountType: string
  connected: boolean
  followers: number
  externalId: string | null
}

export interface AiRunDTO {
  id: string
  tool: string
  prompt: string
  output: string
  model: string
  creditsUsed: number
  at: string
}

// ---------------------------------------------------------------------------
// Aggregate / report shapes
// ---------------------------------------------------------------------------

export interface DashboardDTO {
  greeting: { name: string; period: string }
  totals: {
    content: number
    active: number
    published: number
    archived: number
    ideas: number
    review: number
    scheduled: number
    views: number
    likes: number
    comments: number
    shares: number
    saves: number
    engagementRate: number
    followersGained: number
    watchTimeMin: number
  }
  pipeline: { status: ContentStatus; label: string; count: number; color: string }[]
  byStatus: { status: ContentStatus; count: number }[]
  byPlatform: { platform: PlatformId; views: number; engagementRate: number; contentCount: number }[]
  series: { date: string; views: number; engagement: number; followers: number }[]
  topContent: { id: string; ref: number; title: string; views: number; engagementRate: number; platform: PlatformId }[]
  needsAttention: {
    id: string
    ref: number
    title: string
    status: ContentStatus
    deadline: string | null
    creatorId: string
    daysRemaining: number | null
  }[]
  week: { date: string; items: { id: string; title: string; at: string; status: ContentStatus }[] }[]
}

export interface ReportDTO {
  month: string
  generatedAt: string
  summary: {
    contentPublished: number
    totalContent: number
    totalViews: number
    engagementRate: number
    followersGained: number
  }
  topContent: { id: string; ref: number; title: string; views: number; engagementRate: number }[]
  platformPerformance: { platform: PlatformId; views: number; engagementRate: number; contentCount: number }[]
  byTopic: { topic: string; views: number }[]
  campaigns: { id: string; name: string; goal: string; contentCount: number; publishedCount: number; color: string }[]
  byStatus: { status: ContentStatus; count: number }[]
}

export interface SearchResultDTO {
  id: string
  type: 'content' | 'asset' | 'campaign' | 'idea' | 'script'
  title: string
  subtitle: string
  href: string
  color: string
}

// ---------------------------------------------------------------------------
// Envelope
// ---------------------------------------------------------------------------

export interface Paginated<T> {
  data: T[]
  total: number
  limit: number
  offset: number
  hasMore: boolean
}

export interface ApiError {
  error: {
    code: string
    message: string
    details?: unknown
  }
}

export interface SessionDTO {
  user: UserDTO
  workspaces: WorkspaceDTO[]
  activeWorkspaceId: string | null
  members: MemberDTO[]
}