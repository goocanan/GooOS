/**
 * Domain types for the web app.
 *
 * Re-exported from @gooos/shared so the SPA and the API can never drift:
 * the DTOs the API returns are the exact types the pages consume. The short
 * aliases below keep page code readable.
 */

export * from '@gooos/shared/enums'
export type * from '@gooos/shared/types'

export {
  PLATFORM_META,
  STATUS_META,
  PRIORITY_META,
  ROLE_LABEL,
  ROLE_COLOR,
} from '@gooos/shared/enums'

import { PLATFORM_META, type PlatformId } from '@gooos/shared/enums'
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
  ScriptBlockDTO,
  UserDTO,
  WorkspaceDTO,
} from '@gooos/shared/types'

export type PlatformMeta = (typeof PLATFORM_META)[PlatformId]

// -- short aliases used across the page components -------------------------
export type Platform = PlatformId
export type Content = ContentDTO
export type User = UserDTO
export type Member = MemberDTO
export type Workspace = WorkspaceDTO
export type Brand = BrandDTO
export type Campaign = CampaignDTO
export type Asset = AssetDTO
export type Script = ScriptDTO
export type Comment = CommentDTO
export type Idea = IdeaDTO
export type Hashtag = HashtagDTO
export type Analytics = AnalyticsDTO
export type Activity = ActivityDTO
export type Notification = NotificationDTO
export type Approval = import('@gooos/shared/enums').ApprovalDecision

/** Ordered platform list, handy for iteration in pickers. */
export const PLATFORM_LIST = Object.values(PLATFORM_META)

/** Alias kept because most pages iterate platforms rather than look them up. */
export const PLATFORMS = PLATFORM_LIST

/** Default forward workflow order (PRD section 10). */
export { WORKFLOW_ORDER as STATUS_ORDER } from '@gooos/shared/enums'

/** AI Content Score breakdown (PRD section 28). */
export interface AIScore {
  total?: number
  hookClarity: number
  ctaClarity: number
  readability: number
  platformFit: number
  advice?: string[]
}

export type ScriptBlock = ScriptBlockDTO
