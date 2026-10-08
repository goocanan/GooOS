import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { api, ApiError, isUnauthorized, setActiveWorkspace, type ContentDetailResponse } from './api'
import type {
  ActivityDTO,
  AnalyticsDTO,
  AssetDTO,
  BrandDTO,
  CampaignDTO,
  CommentDTO,
  ContentDTO,
  HashtagDTO,
  IdeaDTO,
  MemberDTO,
  NotificationDTO,
  ScriptDTO,
  UserDTO,
  WorkspaceDTO,
} from '@gooos/shared/types'
import type {
  AssetKind,
  CampaignStatus,
  CommentKind,
  ContentStatus,
  PlatformId,
  PlatformMeta,
  Priority,
  Role,
} from '@gooos/shared/enums'
import { PLATFORM_META } from '@gooos/shared/enums'

const PLATFORMS = Object.values(PLATFORM_META)
import { hashColor, uid } from './utils'

/**
 * Application store backed by the GooOS API.
 *
 * Design note: the reducer keeps the same DTO shapes the API returns, so the
 * page components are unchanged from the prototype. Mutations are applied
 * optimistically and reconciled with the server response, which keeps drag and
 * drop feeling instant while the database stays the source of truth.
 */

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

export interface AppState {
  status: 'loading' | 'authenticated' | 'anonymous' | 'error'
  bootError: string | null
  hydrated: boolean
  currentUserId: string
  currentWorkspaceId: string
  workspaces: WorkspaceDTO[]
  users: UserDTO[]
  members: MemberDTO[]
  brands: BrandDTO[]
  campaigns: CampaignDTO[]
  contents: ContentDTO[]
  scripts: ScriptDTO[]
  assets: AssetDTO[]
  assetFolders: { name: string; count: number; color: string }[]
  comments: CommentDTO[]
  ideas: IdeaDTO[]
  hashtags: HashtagDTO[]
  analytics: AnalyticsDTO[]
  notifications: NotificationDTO[]
  activity: ActivityDTO[]
  aiRuns: { id: string; tool: string; prompt: string; output: string; model: string; creditsUsed: number; at: string }[]
  /** Last content detail fetched, keyed by id. */
  detail: Record<string, ContentDetailResponse>
}

const EMPTY: AppState = {
  status: 'loading',
  bootError: null,
  hydrated: false,
  currentUserId: '',
  currentWorkspaceId: '',
  workspaces: [],
  users: [],
  members: [],
  brands: [],
  campaigns: [],
  contents: [],
  scripts: [],
  assets: [],
  assetFolders: [],
  comments: [],
  ideas: [],
  hashtags: [],
  analytics: [],
  notifications: [],
  activity: [],
  aiRuns: [],
  detail: {},
}

function initialState(): AppState {
  return { ...EMPTY }
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

type Action =
  | { type: 'boot:loading' }
  | { type: 'boot:anonymous' }
  | { type: 'boot:error'; message: string }
  | { type: 'boot:authenticated'; payload: Partial<AppState> }
  | { type: 'setContents'; contents: ContentDTO[] }
  | { type: 'upsertContent'; content: ContentDTO }
  | { type: 'removeContent'; id: string }
  | { type: 'setBrands'; brands: BrandDTO[] }
  | { type: 'upsertBrand'; brand: BrandDTO }
  | { type: 'setCampaigns'; campaigns: CampaignDTO[] }
  | { type: 'upsertCampaign'; campaign: CampaignDTO }
  | { type: 'removeCampaign'; id: string }
  | { type: 'setAssets'; assets: AssetDTO[]; folders?: AppState['assetFolders'] }
  | { type: 'upsertAsset'; asset: AssetDTO }
  | { type: 'removeAsset'; id: string }
  | { type: 'setIdeas'; ideas: IdeaDTO[] }
  | { type: 'upsertIdea'; idea: IdeaDTO }
  | { type: 'removeIdea'; id: string }
  | { type: 'setScripts'; scripts: ScriptDTO[] }
  | { type: 'upsertScript'; script: ScriptDTO }
  | { type: 'setComments'; comments: CommentDTO[] }
  | { type: 'upsertComment'; comment: CommentDTO }
  | { type: 'updateComment'; id: string; patch: Partial<CommentDTO> }
  | { type: 'setAnalytics'; rows: AnalyticsDTO[] }
  | { type: 'setNotifications'; rows: NotificationDTO[] }
  | { type: 'markNotification'; id: string; read: boolean }
  | { type: 'markAllNotifications' }
  | { type: 'setActivity'; rows: ActivityDTO[] }
  | { type: 'setHashtags'; rows: HashtagDTO[] }
  | { type: 'setAiRuns'; rows: AppState['aiRuns'] }
  | { type: 'setMembers'; members: MemberDTO[] }
  | { type: 'setDetail'; id: string; detail: ContentDetailResponse }
  | { type: 'setWorkspace'; workspaceId: string }
  | { type: 'updateMember'; userId: string; patch: Partial<MemberDTO> }
  | { type: 'updateUser'; userId: string; patch: Partial<UserDTO> }
  | { type: 'updateWorkspaceLocal'; id: string; patch: Partial<WorkspaceDTO> }
  | { type: 'reset' }

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'boot:loading':
      return { ...state, status: 'loading', bootError: null }
    case 'boot:anonymous':
      return { ...state, status: 'anonymous', hydrated: true }
    case 'boot:error':
      return { ...state, status: 'error', bootError: action.message, hydrated: true }
    case 'boot:authenticated':
      return { ...state, ...action.payload, status: 'authenticated', hydrated: true, bootError: null }
    case 'setContents':
      return { ...state, contents: action.contents }
    case 'upsertContent': {
      const exists = state.contents.some((c) => c.id === action.content.id)
      return {
        ...state,
        contents: exists
          ? state.contents.map((c) => (c.id === action.content.id ? action.content : c))
          : [action.content, ...state.contents],
      }
    }
    case 'removeContent':
      return { ...state, contents: state.contents.filter((c) => c.id !== action.id) }
    case 'setBrands':
      return { ...state, brands: action.brands }
    case 'upsertBrand':
      return {
        ...state,
        brands: state.brands.some((b) => b.id === action.brand.id)
          ? state.brands.map((b) => (b.id === action.brand.id ? action.brand : b))
          : [action.brand, ...state.brands],
      }
    case 'setCampaigns':
      return { ...state, campaigns: action.campaigns }
    case 'upsertCampaign':
      return {
        ...state,
        campaigns: state.campaigns.some((c) => c.id === action.campaign.id)
          ? state.campaigns.map((c) => (c.id === action.campaign.id ? action.campaign : c))
          : [action.campaign, ...state.campaigns],
      }
    case 'removeCampaign':
      return { ...state, campaigns: state.campaigns.filter((c) => c.id !== action.id) }
    case 'setAssets':
      return { ...state, assets: action.assets, assetFolders: action.folders ?? state.assetFolders }
    case 'upsertAsset':
      return {
        ...state,
        assets: state.assets.some((a) => a.id === action.asset.id)
          ? state.assets.map((a) => (a.id === action.asset.id ? action.asset : a))
          : [action.asset, ...state.assets],
      }
    case 'removeAsset':
      return { ...state, assets: state.assets.filter((a) => a.id !== action.id) }
    case 'setIdeas':
      return { ...state, ideas: action.ideas }
    case 'upsertIdea':
      return {
        ...state,
        ideas: state.ideas.some((i) => i.id === action.idea.id)
          ? state.ideas.map((i) => (i.id === action.idea.id ? action.idea : i))
          : [action.idea, ...state.ideas],
      }
    case 'removeIdea':
      return { ...state, ideas: state.ideas.filter((i) => i.id !== action.id) }
    case 'setScripts':
      return { ...state, scripts: action.scripts }
    case 'upsertScript':
      return {
        ...state,
        scripts: state.scripts.some((s) => s.id === action.script.id)
          ? state.scripts.map((s) => (s.id === action.script.id ? action.script : s))
          : [action.script, ...state.scripts],
      }
    case 'setComments':
      return { ...state, comments: action.comments }
    case 'upsertComment':
      return { ...state, comments: [action.comment, ...state.comments.filter((c) => c.id !== action.comment.id)] }
    case 'updateComment':
      return {
        ...state,
        comments: state.comments.map((c) => (c.id === action.id ? { ...c, ...action.patch } : c)),
      }
    case 'setAnalytics':
      return { ...state, analytics: action.rows }
    case 'setNotifications':
      return { ...state, notifications: action.rows }
    case 'markNotification':
      return {
        ...state,
        notifications: state.notifications.map((n) => (n.id === action.id ? { ...n, read: action.read } : n)),
      }
    case 'markAllNotifications':
      return { ...state, notifications: state.notifications.map((n) => ({ ...n, read: true })) }
    case 'setActivity':
      return { ...state, activity: action.rows }
    case 'setHashtags':
      return { ...state, hashtags: action.rows }
    case 'setAiRuns':
      return { ...state, aiRuns: action.rows }
    case 'setMembers':
      return { ...state, members: action.members }
    case 'setDetail':
      return { ...state, detail: { ...state.detail, [action.id]: action.detail } }
    case 'setWorkspace':
      return { ...state, currentWorkspaceId: action.workspaceId }
    case 'updateMember':
      return {
        ...state,
        members: state.members.map((m) => (m.id === action.userId ? { ...m, ...action.patch } : m)),
        users: state.users.map((u) => (u.id === action.userId ? { ...u, ...action.patch } : u)),
      }
    case 'updateUser':
      return { ...state, users: state.users.map((u) => (u.id === action.userId ? { ...u, ...action.patch } : u)) }
    case 'updateWorkspaceLocal':
      return {
        ...state,
        workspaces: state.workspaces.map((w) => (w.id === action.id ? { ...w, ...action.patch } : w)),
      }
    case 'reset':
      return { ...EMPTY, status: 'anonymous', hydrated: true }
    default:
      return state
  }
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

export type ToastTone = 'success' | 'info' | 'warn' | 'danger'
export interface Toast {
  id: string
  message: string
  tone: ToastTone
}

interface StoreValue {
  state: AppState
  dispatch: React.Dispatch<Action>
  /** Command surface the pages call. All calls hit the API. */
  actions: Actions
  currentUser: UserDTO & { role?: Role }
  currentWorkspace: WorkspaceDTO
  workspaceBrands: BrandDTO[]
  workspaceContents: ContentDTO[]
  workspaceAssets: AssetDTO[]
  workspaceCampaigns: CampaignDTO[]
  workspaceScripts: ScriptDTO[]
  userById: (id?: string | null) => (UserDTO & { role?: Role }) | undefined
  platformMeta: (p: PlatformId) => PlatformMeta
  switchWorkspace: (id: string) => Promise<void>
  toast: (message: string, tone?: ToastTone) => void
  toasts: Toast[]
  dismissToast: (id: string) => void
  signIn: (email: string, password: string) => Promise<void>
  signUp: (input: { name: string; email: string; password: string; workspaceName?: string }) => Promise<void>
  signOut: () => Promise<void>
  refreshWorkspace: () => Promise<void>
  refreshContent: (id: string) => Promise<ContentDetailResponse>
}

const StoreContext = createContext<StoreValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState)
  const [toasts, setToasts] = useState<Toast[]>([])
  const booting = useRef(false)

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback(
    (message: string, tone: ToastTone = 'success') => {
      const id = uid('t')
      setToasts((prev) => [{ id, message, tone }, ...prev].slice(0, 4))
      window.setTimeout(() => dismissToast(id), 3800)
    },
    [dismissToast],
  )

  /** Turns any thrown API error into a readable toast. */
  const reportError = useCallback(
    (err: unknown, fallback: string) => {
      if (err instanceof ApiError && err.status === 403) {
        toast(err.message, 'warn')
        return
      }
      const message = err instanceof Error ? err.message : fallback
      toast(message || fallback, 'danger')
    },
    [toast],
  )

  // -- data loading -------------------------------------------------------

  const loadWorkspace = useCallback(async () => {
    const [contentsRes, brandsRes, campaignsRes, assetsRes, ideasRes, scriptsRes, teamRes, notificationsRes, activityRes] =
      await Promise.all([
        api.listContent({ limit: 200 }),
        api.brands(),
        api.campaigns(),
        api.assets({ limit: 200 }),
        api.ideas(),
        api.scripts(),
        api.team(),
        api.notifications(),
        api.activity(30),
      ])

    dispatch({ type: 'setContents', contents: contentsRes.data })
    dispatch({ type: 'setBrands', brands: brandsRes.data })
    dispatch({ type: 'setCampaigns', campaigns: campaignsRes.data })
    dispatch({ type: 'setAssets', assets: assetsRes.data, folders: assetsRes.folders })
    dispatch({ type: 'setIdeas', ideas: ideasRes.data })
    dispatch({ type: 'setScripts', scripts: scriptsRes.data })
    dispatch({ type: 'setMembers', members: teamRes.data })
    dispatch({ type: 'setNotifications', rows: notificationsRes.data })
    dispatch({ type: 'setActivity', rows: activityRes.data })

    // Analytics and hashtags are secondary: a failure must not block boot.
    void api
      .analytics()
      .then((r) => dispatch({ type: 'setAnalytics', rows: r.data }))
      .catch(() => undefined)
    void api
      .hashtags()
      .then((r) => dispatch({ type: 'setHashtags', rows: r.data }))
      .catch(() => undefined)
  }, [])

  const boot = useCallback(async () => {
    if (booting.current) return
    booting.current = true
    dispatch({ type: 'boot:loading' })
    try {
      const session = await api.session()
      const workspaceId = session.activeWorkspaceId ?? session.workspaces[0]?.id ?? ''
      if (!workspaceId) {
        dispatch({ type: 'boot:anonymous' })
        return
      }
      setActiveWorkspace(workspaceId)
      dispatch({
        type: 'boot:authenticated',
        payload: {
          currentUserId: session.user?.id ?? '',
          currentWorkspaceId: workspaceId,
          workspaces: session.workspaces,
          users: session.members.map((m) => ({
            id: m.id,
            name: m.name,
            email: m.email,
            image: m.image,
            title: m.title,
            active: m.active,
            createdAt: m.createdAt,
          })),
          members: session.members,
        },
      })
      await loadWorkspace()
    } catch (err) {
      if (isUnauthorized(err)) {
        setActiveWorkspace(null)
        dispatch({ type: 'boot:anonymous' })
      } else {
        dispatch({
          type: 'boot:error',
          message: err instanceof Error ? err.message : 'Could not reach the GooOS API',
        })
      }
    } finally {
      booting.current = false
    }
  }, [loadWorkspace])

  useEffect(() => {
    void boot()
  }, [boot])

  // -- auth ---------------------------------------------------------------

  const signIn = useCallback(
    async (email: string, password: string) => {
      dispatch({ type: 'boot:loading' })
      await api.signIn(email, password)
      booting.current = false
      await boot()
    },
    [boot],
  )

  const signUp = useCallback(
    async (input: { name: string; email: string; password: string; workspaceName?: string }) => {
      dispatch({ type: 'boot:loading' })
      await api.signUp(input)
      booting.current = false
      await boot()
    },
    [boot],
  )

  const signOut = useCallback(async () => {
    try {
      await api.signOut()
    } catch {
      // The session may already be gone; clear local state regardless.
    }
    setActiveWorkspace(null)
    dispatch({ type: 'reset' })
    booting.current = false
  }, [])

  const switchWorkspace = useCallback(
    async (workspaceId: string) => {
      setActiveWorkspace(workspaceId)
      dispatch({ type: 'setWorkspace', workspaceId })
      dispatch({ type: 'boot:loading' })
      try {
        await loadWorkspace()
        dispatch({ type: 'boot:authenticated', payload: { currentWorkspaceId: workspaceId } })
      } catch (err) {
        reportError(err, 'Could not load that workspace')
      }
    },
    [loadWorkspace, reportError],
  )

  const refreshWorkspace = useCallback(async () => {
    await loadWorkspace()
  }, [loadWorkspace])

  const refreshContent = useCallback(async (id: string) => {
    const detail = await api.content(id)
    dispatch({ type: 'setDetail', id, detail })
    dispatch({ type: 'upsertContent', content: detail.content })
    dispatch({ type: 'setComments', comments: detail.comments })
    dispatch({ type: 'upsertScript', script: detail.script ?? ({ id: '', contentId: id } as ScriptDTO) })
    return detail
  }, [])

  // -- mutations ----------------------------------------------------------

  const actions = useMemo<Actions>(
    () => ({
      // -- content
      async createContent(input: CreateContentInput) {
        const res = await api.createContent(input)
        dispatch({ type: 'upsertContent', content: res.content })
        return res.content
      },
      async updateContent(id: string, patch: Record<string, unknown>) {
        const res = await api.updateContent(id, patch)
        dispatch({ type: 'upsertContent', content: res.content })
        return res.content
      },
      async moveContent(id: string, status: ContentStatus, productionProgress?: number) {
        const res = await api.moveContent(id, status, productionProgress)
        dispatch({ type: 'upsertContent', content: res.content })
        return res.content
      },
      async deleteContent(id: string) {
        await api.deleteContent(id)
        dispatch({ type: 'removeContent', id })
      },
      async duplicateContent(id: string) {
        const res = await api.duplicateContent(id)
        dispatch({ type: 'upsertContent', content: res.content })
        return res.content
      },
      async bulkContent(input: {
        ids: string[]
        action: 'archive' | 'delete' | 'move' | 'assign' | 'tag' | 'campaign'
        status?: ContentStatus
        creatorId?: string
        tags?: string[]
      }) {
        await api.bulkContent(input)
        if (input.action === 'delete') {
          input.ids.forEach((id) => dispatch({ type: 'removeContent', id }))
        } else {
          await loadWorkspace()
        }
      },
      async schedule(
        id: string,
        input: { platform?: PlatformId; scheduledAt: string; timezone?: string; mode?: 'schedule' | 'copy_publish' },
      ) {
        const res = await api.schedule(id, input)
        dispatch({ type: 'upsertContent', content: res.content })
        return res.copyPayload
      },

      // -- comments + approvals
      async addComment(contentId: string, body: string, timestampSec?: number, kind: CommentKind = 'comment') {
        const res = await api.addComment(contentId, { body, timestampSec, kind })
        dispatch({ type: 'upsertComment', comment: res.comment })
        if (kind === 'change_request') {
          const detail = await api.content(contentId).catch(() => null)
          if (detail) dispatch({ type: 'upsertContent', content: detail.content })
        }
        return res.comment
      },
      async updateComment(id: string, patch: { resolved?: boolean; body?: string }) {
        const res = await api.updateComment(id, patch)
        dispatch({ type: 'updateComment', id, patch: res.comment })
      },
      async approve(
        id: string,
        decision: 'approved' | 'changes_requested' | 'rejected',
        note?: string,
        timestampSec?: number,
      ) {
        const res = await api.approve(id, { decision, note, timestampSec })
        dispatch({ type: 'upsertContent', content: res.content })
        const detail = await api.content(id).catch(() => null)
        if (detail) dispatch({ type: 'setComments', comments: detail.comments })
        return res.content
      },

      // -- ideas
      async createIdea(input: Record<string, unknown>) {
        const res = await api.createIdea(input)
        dispatch({ type: 'upsertIdea', idea: res.idea })
        return res.idea
      },
      async voteIdea(id: string, delta: number) {
        const res = await api.voteIdea(id, delta)
        dispatch({ type: 'upsertIdea', idea: res.idea })
      },
      async deleteIdea(id: string) {
        await api.deleteIdea(id)
        dispatch({ type: 'removeIdea', id })
      },
      async convertIdea(id: string, body?: { platform?: PlatformId; assigneeId?: string }) {
        const res = await api.convertIdea(id, body)
        const content = await api.content(res.contentId)
        dispatch({ type: 'upsertContent', content: content.content })
        const ideas = await api.ideas()
        dispatch({ type: 'setIdeas', ideas: ideas.data })
        return content.content
      },

      // -- scripts
      async createScript(input: { contentId: string; title: string; blocks: unknown[] }) {
        const res = await api.createScript(input)
        dispatch({ type: 'upsertScript', script: res.script })
        return res.script
      },
      async updateScript(id: string, patch: { title?: string; blocks?: unknown[]; bumpVersion?: boolean }) {
        const res = await api.updateScript(id, patch)
        dispatch({ type: 'upsertScript', script: res.script })
        return res.script
      },

      // -- assets
      async uploadAssets(files: FileList | File[], meta: { folder?: string; tags?: string } = {}) {
        const res = await api.uploadAssets(files, meta)
        res.data.forEach((a) => dispatch({ type: 'upsertAsset', asset: a }))
        const listing = await api.assets({ limit: 200 })
        dispatch({ type: 'setAssets', assets: listing.data, folders: listing.folders })
        return res.data
      },
      async updateAsset(id: string, patch: { name?: string; folder?: string; tags?: string[] }) {
        const res = await api.updateAsset(id, patch)
        dispatch({ type: 'upsertAsset', asset: res.asset })
      },
      async deleteAsset(id: string) {
        await api.deleteAsset(id)
        dispatch({ type: 'removeAsset', id })
      },
      async createFolder(name: string) {
        await api.createFolder(name)
      },

      // -- brands
      async createBrand(input: Partial<BrandDTO>) {
        const res = await api.createBrand(input)
        dispatch({ type: 'upsertBrand', brand: res.brand })
        return res.brand
      },
      async updateBrand(id: string, patch: Partial<BrandDTO>) {
        const res = await api.updateBrand(id, patch)
        dispatch({ type: 'upsertBrand', brand: res.brand })
        return res.brand
      },

      // -- campaigns
      async createCampaign(input: Record<string, unknown>) {
        const res = await api.createCampaign(input)
        dispatch({ type: 'upsertCampaign', campaign: res.campaign })
        return res.campaign
      },
      async updateCampaign(id: string, patch: Record<string, unknown>) {
        const res = await api.updateCampaign(id, patch)
        dispatch({ type: 'upsertCampaign', campaign: res.campaign })
        return res.campaign
      },
      async deleteCampaign(id: string) {
        await api.deleteCampaign(id)
        dispatch({ type: 'removeCampaign', id })
      },
      async attachContentToCampaign(campaignId: string, contentId: string) {
        await api.attachContentToCampaign(campaignId, contentId)
        await loadWorkspace()
      },

      // -- analytics
      async saveContentAnalytics(
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
      ) {
        const res = await api.upsertContentAnalytics(contentId, rows)
        dispatch({ type: 'setAnalytics', rows: res.data })
      },

      // -- notifications
      async readNotification(id: string, read = true) {
        await api.readNotification(id, read)
        dispatch({ type: 'markNotification', id, read })
      },
      async readAllNotifications() {
        await api.readAllNotifications()
        dispatch({ type: 'markAllNotifications' })
      },

      // -- team
      async inviteMember(input: { email: string; role: Role; name?: string }) {
        await api.inviteMember(input)
        const team = await api.team()
        dispatch({ type: 'setMembers', members: team.data })
      },
      async updateMember(userId: string, patch: { role?: Role; active?: boolean }) {
        await api.updateMember(userId, patch)
        dispatch({ type: 'updateMember', userId, patch })
      },

      // -- workspace
      async updateWorkspace(id: string, patch: Partial<WorkspaceDTO>) {
        const res = await api.updateWorkspace(id, patch)
        dispatch({ type: 'updateWorkspaceLocal', id, patch: res.workspace })
      },

      // -- hashtags + ai
      async createHashtag(tag: string, group?: string) {
        const res = await api.createHashtag(tag, group)
        dispatch({ type: 'setHashtags', rows: [res.hashtag, ...state.hashtags] })
        return res.hashtag
      },
      async generate(input: {
        tool: 'idea' | 'hook' | 'script' | 'caption' | 'repurpose' | 'score' | 'plan'
        prompt: string
        platform?: PlatformId
        brandId?: string
        contentId?: string
        duration?: number
      }) {
        const res = await api.ai(input)
        dispatch({
          type: 'setAiRuns',
          rows: [
            {
              id: res.id,
              tool: res.tool,
              prompt: res.prompt,
              output: res.output,
              model: res.model,
              creditsUsed: res.creditsUsed,
              at: res.at,
            },
            ...state.aiRuns,
          ].slice(0, 40),
        })
        return res
      },
      async loadAiRuns() {
        const res = await api.aiRuns()
        dispatch({ type: 'setAiRuns', rows: res.data })
      },

      // -- activity
      async loadActivity() {
        const res = await api.activity(30)
        dispatch({ type: 'setActivity', rows: res.data })
      },
    }),
    [loadWorkspace, state.hashtags, state.aiRuns],
  )

  const value = useMemo<StoreValue>(() => {
    const wsId = state.currentWorkspaceId
    const memberById = new Map(state.members.map((m) => [m.id, m]))
    const userById = (id?: string | null) => {
      if (!id) return undefined
      const member = memberById.get(id)
      const base =
        member ??
        state.users.find((u) => u.id === id) ??
        undefined
      if (!base) return undefined
      // Avatar colours are derived, not stored, so every surface agrees.
      return { ...base, avatarColor: base.avatarColor ?? hashColor(base.id, 52, 45) }
    }

    return {
      state,
      dispatch,
      actions,
      currentUser:
        userById(state.currentUserId) ??
        (state.users[0] ?? { id: '', name: 'Guest', email: '', image: null, title: null, active: false, createdAt: '' }),
      currentWorkspace:
        state.workspaces.find((w) => w.id === wsId) ??
        (state.workspaces[0] ?? {
          id: '',
          name: 'No workspace',
          slug: '',
          plan: 'free' as const,
          contentUsage: 0,
          contentLimit: 0,
          storageUsedMb: 0,
          storageLimitMb: 0,
          seats: 0,
          seatLimit: 0,
          role: 'creator' as Role,
          createdAt: '',
        }),
      workspaceBrands: state.brands,
      workspaceContents: state.contents,
      workspaceAssets: state.assets,
      workspaceCampaigns: state.campaigns,
      workspaceScripts: state.scripts,
      userById,
      platformMeta: (p: PlatformId) => PLATFORM_META[p] ?? PLATFORMS[0]!,
      switchWorkspace,
      toast,
      toasts,
      dismissToast,
      signIn,
      signUp,
      signOut,
      refreshWorkspace,
      refreshContent,
    }
  }, [state, actions, toast, toasts, dismissToast, signIn, signUp, signOut, refreshWorkspace, refreshContent, switchWorkspace])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

// ---------------------------------------------------------------------------
// Command surface
// ---------------------------------------------------------------------------

export interface CreateContentInput {
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
    scheduledAt?: string | null
  }[]
  cta?: string
  notes?: string
  brief?: Record<string, unknown>
  productionProgress?: number
  ideaSource?: string
}

export interface Actions {
  createContent(input: CreateContentInput): Promise<ContentDTO>
  updateContent(id: string, patch: Record<string, unknown>): Promise<ContentDTO>
  moveContent(id: string, status: ContentStatus, productionProgress?: number): Promise<ContentDTO>
  deleteContent(id: string): Promise<void>
  duplicateContent(id: string): Promise<ContentDTO>
  bulkContent(input: {
    ids: string[]
    action: 'archive' | 'delete' | 'move' | 'assign' | 'tag' | 'campaign'
    status?: ContentStatus
    creatorId?: string
    tags?: string[]
  }): Promise<void>
  schedule(
    id: string,
    input: { platform?: PlatformId; scheduledAt: string; timezone?: string; mode?: 'schedule' | 'copy_publish' },
  ): Promise<Record<string, unknown>>

  addComment(contentId: string, body: string, timestampSec?: number, kind?: CommentKind): Promise<CommentDTO>
  updateComment(id: string, patch: { resolved?: boolean; body?: string }): Promise<void>
  approve(
    id: string,
    decision: 'approved' | 'changes_requested' | 'rejected',
    note?: string,
    timestampSec?: number,
  ): Promise<ContentDTO>

  createIdea(input: Record<string, unknown>): Promise<IdeaDTO>
  voteIdea(id: string, delta: number): Promise<void>
  deleteIdea(id: string): Promise<void>
  convertIdea(id: string, body?: { platform?: PlatformId; assigneeId?: string }): Promise<ContentDTO>

  createScript(input: { contentId: string; title: string; blocks: unknown[] }): Promise<ScriptDTO>
  updateScript(id: string, patch: { title?: string; blocks?: unknown[]; bumpVersion?: boolean }): Promise<ScriptDTO>

  uploadAssets(files: FileList | File[], meta?: { folder?: string; tags?: string }): Promise<AssetDTO[]>
  updateAsset(id: string, patch: { name?: string; folder?: string; tags?: string[] }): Promise<void>
  deleteAsset(id: string): Promise<void>
  createFolder(name: string): Promise<void>

  createBrand(input: Partial<BrandDTO>): Promise<BrandDTO>
  updateBrand(id: string, patch: Partial<BrandDTO>): Promise<BrandDTO>

  createCampaign(input: Record<string, unknown>): Promise<CampaignDTO>
  updateCampaign(id: string, patch: Record<string, unknown>): Promise<CampaignDTO>
  deleteCampaign(id: string): Promise<void>
  attachContentToCampaign(campaignId: string, contentId: string): Promise<void>

  saveContentAnalytics(
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
  ): Promise<void>

  readNotification(id: string, read?: boolean): Promise<void>
  readAllNotifications(): Promise<void>

  inviteMember(input: { email: string; role: Role; name?: string }): Promise<void>
  updateMember(userId: string, patch: { role?: Role; active?: boolean }): Promise<void>

  updateWorkspace(id: string, patch: Partial<WorkspaceDTO>): Promise<void>

  createHashtag(tag: string, group?: string): Promise<HashtagDTO>
  generate(input: {
    tool: 'idea' | 'hook' | 'script' | 'caption' | 'repurpose' | 'score' | 'plan'
    prompt: string
    platform?: PlatformId
    brandId?: string
    contentId?: string
    duration?: number
  }): Promise<{ output: string; model: string; creditsUsed: number }>
  loadAiRuns(): Promise<void>
  loadActivity(): Promise<void>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>')
  return ctx
}

export type { AssetKind, CampaignStatus, CommentKind, ContentStatus, PlatformId, Priority, Role }

/** Shared error-toast helper for page-level try/catch blocks. */
export function reportErrorHelper(toast: (m: string, t?: ToastTone) => void) {
  return (err: unknown, fallback: string) => {
    if (err instanceof ApiError && err.status === 403) {
      toast(err.message, 'warn')
      return
    }
    toast(err instanceof Error && err.message ? err.message : fallback, 'danger')
  }
}