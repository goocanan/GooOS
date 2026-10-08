import type {
  ActivityDTO,
  AnalyticsDTO,
  AssetDTO,
  BrandDTO,
  CampaignDTO,
  CommentDTO,
  ContentDTO,
  DashboardDTO,
  HashtagDTO,
  IdeaDTO,
  MemberDTO,
  NotificationDTO,
  ReportDTO,
  ScriptDTO,
  SearchResultDTO,
  SessionDTO,
  UserDTO,
  WorkspaceDTO,
} from '@gooos/shared/types'
import type {
  AssetKind,
  CampaignStatus,
  CommentKind,
  ContentStatus,
  PlatformId,
  Priority,
  Role,
} from '@gooos/shared/enums'

/**
 * Typed API client.
 *
 * Requests go to `/api/*` on the same origin; Vite proxies that to the Fastify
 * server (see vite.config.ts). Auth is a httpOnly cookie set by Better Auth, so
 * there is no token to manage here.
 */

const BASE = import.meta.env.VITE_API_URL ?? ''

export class ApiError extends Error {
  status: number
  code: string
  details?: unknown
  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message)
    this.status = status
    this.code = code
    this.details = details
  }
}

let workspaceHeader: string | null = null
export function setActiveWorkspace(id: string | null) {
  workspaceHeader = id
}

type Query = Record<string, string | number | boolean | string[] | undefined | null>

function buildUrl(path: string, query?: Query) {
  const url = `${BASE}${path}`
  if (!query) return url
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue
    if (Array.isArray(value)) {
      if (!value.length) continue
      params.set(key, value.join(','))
    } else {
      params.set(key, String(value))
    }
  }
  const qs = params.toString()
  return qs ? `${url}?${qs}` : url
}

async function request<T>(
  path: string,
  init: RequestInit & { query?: Query } = {},
): Promise<T> {
  const headers: Record<string, string> = {
    ...((init.headers as Record<string, string>) ?? {}),
  }
  if (workspaceHeader) headers['x-workspace-id'] = workspaceHeader
  if (init.body && !(init.body instanceof FormData)) {
    headers['content-type'] = 'application/json'
  }

  const res = await fetch(buildUrl(path, init.query), {
    ...init,
    headers,
    credentials: 'include',
  })

  if (res.status === 204) return undefined as T

  const text = await res.text()
  let body: unknown = null
  if (text) {
    try {
      body = JSON.parse(text)
    } catch {
      body = text
    }
  }

  if (!res.ok) {
    const err = (body as { error?: { code?: string; message?: string; details?: unknown } })?.error
    throw new ApiError(
      res.status,
      err?.code ?? 'ERROR',
      err?.message ?? `Request failed with ${res.status}`,
      err?.details,
    )
  }

  return body as T
}

const get = <T,>(path: string, query?: Query) => request<T>(path, { method: 'GET', query })
const post = <T,>(path: string, body?: unknown) =>
  request<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) })
const patch = <T,>(path: string, body?: unknown) =>
  request<T>(path, { method: 'PATCH', body: JSON.stringify(body) })
const put = <T,>(path: string, body?: unknown) =>
  request<T>(path, { method: 'PUT', body: JSON.stringify(body) })
const del = <T,>(path: string) => request<T>(path, { method: 'DELETE' })

// ---------------------------------------------------------------------------

export interface Paginated<T> {
  data: T[]
  total: number
  limit: number
  offset: number
  hasMore: boolean
}

export interface ContentDetailResponse {
  content: ContentDTO
  comments: CommentDTO[]
  approvals: {
    id: string
    contentId: string
    reviewerId: string
    decision: 'approved' | 'changes_requested' | 'rejected'
    note: string | null
    timestampSec: number | null
    createdAt: string
  }[]
  analytics: AnalyticsDTO[]
  versions: { id: string; version: number; title: string; createdBy: string; createdAt: string }[]
  script: ScriptDTO | null
  assets: AssetDTO[]
}

export interface ContentListQuery {
  q?: string
  status?: ContentStatus[]
  platform?: PlatformId[]
  brandId?: string[]
  campaignId?: string[]
  creatorId?: string[]
  priority?: Priority[]
  archived?: boolean
  sort?: 'updated' | 'created' | 'deadline' | 'priority' | 'title'
  limit?: number
  offset?: number
}

export interface CreateContentPayload {
  title: string
  description?: string
  type: PlatformId
  status?: ContentStatus
  priority?: Priority
  brandId?: string
  campaignId?: string | null
  creatorId?: string
  reviewerId?: string | null
  tags?: string[]
  deadline?: string | null
  thumbnailColor?: string
  platforms?: {
    platform: PlatformId
    caption?: string
    hashtags?: string[]
    mediaAssetIds?: string[]
    scheduledAt?: string | null
    publishedAt?: string | null
  }[]
  cta?: string
  notes?: string
  brief?: Record<string, unknown>
  productionProgress?: number
  ideaSource?: string
}

export const api = {
  health: () => get<{ ok: boolean; db: string; ai: string; time: string }>('/api/health'),

  // -- auth / session ----------------------------------------------------
  session: () => get<SessionDTO>('/api/session'),
  switchWorkspace: (workspaceId: string) =>
    post<{ workspace: WorkspaceDTO }>('/api/session/workspace', { workspaceId }),
  signIn: (email: string, password: string) =>
    request<{ user: UserDTO }>('/api/auth/sign-in/email', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  signUp: (body: { name: string; email: string; password: string; workspaceName?: string }) =>
    request<{ user: UserDTO }>('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  signOut: () => request<unknown>('/api/auth/sign-out', { method: 'POST' }),

  // -- workspaces / team -------------------------------------------------
  workspaces: () => get<{ data: WorkspaceDTO[] }>('/api/workspaces'),
  createWorkspace: (body: { name: string; slug?: string }) =>
    post<{ workspace: WorkspaceDTO }>('/api/workspaces', body),
  updateWorkspace: (id: string, body: Partial<WorkspaceDTO>) =>
    patch<{ workspace: WorkspaceDTO }>(`/api/workspaces/${id}`, body),
  team: () => get<{ data: MemberDTO[] }>('/api/team'),
  inviteMember: (body: { email: string; role: Role; name?: string }) =>
    post<{ member: MemberDTO }>('/api/team/invite', body),
  updateMember: (userId: string, body: { role?: Role; active?: boolean }) =>
    patch<{ ok: boolean }>(`/api/team/${userId}`, body),
  removeMember: (userId: string) => del<{ ok: boolean }>(`/api/team/${userId}`),

  // -- brands -------------------------------------------------------------
  brands: () => get<{ data: BrandDTO[] }>('/api/brands'),
  createBrand: (body: Partial<BrandDTO>) => post<{ brand: BrandDTO }>('/api/brands', body),
  updateBrand: (id: string, body: Partial<BrandDTO>) =>
    patch<{ brand: BrandDTO }>(`/api/brands/${id}`, body),

  // -- campaigns ----------------------------------------------------------
  campaigns: () => get<{ data: CampaignDTO[] }>('/api/campaigns'),
  campaign: (id: string) =>
    get<{ campaign: CampaignDTO; contents: ContentDTO[] }>(`/api/campaigns/${id}`),
  createCampaign: (body: Record<string, unknown>) =>
    post<{ campaign: CampaignDTO }>('/api/campaigns', body),
  updateCampaign: (id: string, body: Record<string, unknown>) =>
    patch<{ campaign: CampaignDTO }>(`/api/campaigns/${id}`, body),
  deleteCampaign: (id: string) => del<{ ok: boolean }>(`/api/campaigns/${id}`),
  attachContentToCampaign: (id: string, contentId: string) =>
    post<{ ok: boolean }>(`/api/campaigns/${id}/contents`, { contentId }),

  // -- content ------------------------------------------------------------
  listContent: (query: ContentListQuery = {}) =>
    get<Paginated<ContentDTO>>('/api/content', query as Query),
  content: (id: string) => get<ContentDetailResponse>(`/api/content/${id}`),
  boardCounts: () => get<{ counts: { status: ContentStatus; count: number }[] }>('/api/content/board'),
  calendar: (from: string, to: string, extra: Query = {}) =>
    get<{
      data: {
        contentId: string
        platform: PlatformId
        scheduledAt: string | null
        publishedAt: string | null
        content: ContentDTO
      }[]
    }>('/api/content/calendar', { from, to, ...extra }),
  createContent: (body: CreateContentPayload) => post<{ content: ContentDTO }>('/api/content', body),
  updateContent: (id: string, body: Partial<CreateContentPayload>) =>
    patch<{ content: ContentDTO }>(`/api/content/${id}`, body),
  moveContent: (id: string, status: ContentStatus, productionProgress?: number) =>
    post<{ content: ContentDTO }>(`/api/content/${id}/move`, { status, productionProgress }),
  deleteContent: (id: string) => del<{ ok: boolean }>(`/api/content/${id}`),
  duplicateContent: (id: string) => post<{ content: ContentDTO }>(`/api/content/${id}/duplicate`),
  bulkContent: (body: {
    ids: string[]
    action: 'archive' | 'delete' | 'move' | 'assign' | 'tag' | 'campaign'
    status?: ContentStatus
    creatorId?: string
    campaignId?: string
    tags?: string[]
  }) => post<{ ok: boolean; affected: number }>('/api/content/bulk', body),
  schedule: (
    id: string,
    body: { platform?: PlatformId; scheduledAt: string; timezone?: string; mode?: 'schedule' | 'copy_publish' },
  ) =>
    post<{ content: ContentDTO; copyPayload: Record<string, unknown> }>(
      `/api/content/${id}/schedule`,
      body,
    ),
  approve: (
    id: string,
    body: { decision: 'approved' | 'changes_requested' | 'rejected'; note?: string; timestampSec?: number },
  ) => post<{ content: ContentDTO; decision: string }>(`/api/content/${id}/approve`, body),

  // -- comments -----------------------------------------------------------
  addComment: (
    contentId: string,
    body: { body: string; timestampSec?: number; kind?: CommentKind },
  ) => post<{ comment: CommentDTO }>(`/api/content/${contentId}/comments`, body),
  updateComment: (id: string, body: { resolved?: boolean; body?: string }) =>
    patch<{ comment: CommentDTO }>(`/api/comments/${id}`, body),

  // -- scripts ------------------------------------------------------------
  scripts: () => get<{ data: ScriptDTO[] }>('/api/scripts'),
  createScript: (body: { contentId: string; title: string; blocks: unknown[] }) =>
    post<{ script: ScriptDTO }>('/api/scripts', body),
  updateScript: (id: string, body: { title?: string; blocks?: unknown[]; bumpVersion?: boolean }) =>
    patch<{ script: ScriptDTO }>(`/api/scripts/${id}`, body),

  // -- assets -------------------------------------------------------------
  assets: (query: { q?: string; folder?: string; kind?: AssetKind | AssetKind[]; limit?: number } = {}) =>
    get<{ data: AssetDTO[]; total: number; folders: { name: string; count: number; color: string }[] }>(
      '/api/assets',
      query as Query,
    ),
  asset: (id: string) => get<{ asset: AssetDTO }>(`/api/assets/${id}`),
  uploadAssets: (files: FileList | File[], meta: { folder?: string; tags?: string; brandId?: string } = {}) => {
    const form = new FormData()
    if (meta.folder) form.append('folder', meta.folder)
    if (meta.tags) form.append('tags', meta.tags)
    if (meta.brandId) form.append('brandId', meta.brandId)
    for (const f of Array.from(files)) form.append('file', f)
    return request<{ data: AssetDTO[] }>('/api/assets/upload', { method: 'POST', body: form })
  },
  updateAsset: (id: string, body: { name?: string; folder?: string; tags?: string[] }) =>
    patch<{ asset: AssetDTO }>(`/api/assets/${id}`, body),
  deleteAsset: (id: string) => del<{ ok: boolean }>(`/api/assets/${id}`),
  createFolder: (name: string) => post<{ folder: { id: string; name: string; count: number } }>('/api/assets/folders', { name }),

  // -- ideas --------------------------------------------------------------
  ideas: () => get<{ data: IdeaDTO[] }>('/api/ideas'),
  createIdea: (body: Record<string, unknown>) => post<{ idea: IdeaDTO }>('/api/ideas', body),
  updateIdea: (id: string, body: Record<string, unknown>) =>
    patch<{ idea: IdeaDTO }>(`/api/ideas/${id}`, body),
  voteIdea: (id: string, delta: number) => post<{ idea: IdeaDTO }>(`/api/ideas/${id}/vote`, { delta }),
  deleteIdea: (id: string) => del<{ ok: boolean }>(`/api/ideas/${id}`),
  convertIdea: (id: string, body: { platform?: PlatformId; assigneeId?: string } = {}) =>
    post<{ contentId: string; ref: number }>(`/api/ideas/${id}/convert`, body),

  // -- analytics / aggregates --------------------------------------------
  analytics: (query: { from?: string; to?: string; contentId?: string } = {}) =>
    get<{ data: AnalyticsDTO[] }>('/api/analytics', query as Query),
  upsertContentAnalytics: (
    contentId: string,
    rows: {
      platform: PlatformId
      views: number
      likes: number
      comments: number
      shares: number
      saves: number
      watchTimeMin: number
      ctr: number
      followersGained: number
    }[],
  ) => put<{ data: AnalyticsDTO[] }>(`/api/content/${contentId}/analytics`, { rows }),
  dashboard: (range: '7' | '14' | '30' | '90' = '14') =>
    get<DashboardDTO>('/api/dashboard', { range }),
  monthlyReport: (month?: string) => get<ReportDTO>('/api/reports/monthly', { month }),

  // -- cross-cutting ------------------------------------------------------
  search: (q: string, type = 'all') =>
    get<{ data: SearchResultDTO[] }>('/api/search', { q, type }),
  notifications: (unread?: boolean) =>
    get<{ data: NotificationDTO[]; unread: number }>('/api/notifications', { unread }),
  readNotification: (id: string, read = true) =>
    patch<{ ok: boolean }>(`/api/notifications/${id}`, { read }),
  readAllNotifications: () => post<{ ok: boolean }>('/api/notifications/read-all'),
  activity: (limit = 20) => get<{ data: ActivityDTO[] }>('/api/activity', { limit }),
  hashtags: () => get<{ data: HashtagDTO[] }>('/api/hashtags'),
  createHashtag: (tag: string, group?: string) => post<{ hashtag: HashtagDTO }>('/api/hashtags', { tag, group }),

  // -- AI -----------------------------------------------------------------
  ai: (body: {
    tool: 'idea' | 'hook' | 'script' | 'caption' | 'repurpose' | 'score' | 'plan'
    prompt: string
    platform?: PlatformId
    brandId?: string
    contentId?: string
    duration?: number
  }) =>
    post<{
      id: string
      tool: string
      prompt: string
      output: string
      model: string
      creditsUsed: number
      at: string
    }>('/api/ai/generate', body),
  aiRuns: () => get<{ data: { id: string; tool: string; prompt: string; output: string; model: string; creditsUsed: number; at: string }[] }>('/api/ai/runs'),
}

/** True when a 401 means "not signed in" rather than a real failure. */
export function isUnauthorized(err: unknown): boolean {
  return err instanceof ApiError && err.status === 401
}

export type { CampaignStatus, ContentStatus, PlatformId, Priority, Role }