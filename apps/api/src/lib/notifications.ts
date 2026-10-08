import { db, schema } from '../db/client'
import { id } from '../lib/ids'
import type { NotificationKind } from '@gooos/shared/enums'

/**
 * In-app notifications (PRD section 32).
 *
 * Email / WhatsApp / Telegram delivery is a V2 concern; the notification rows
 * are the source of truth and any channel worker reads from them.
 */

export interface NotifyInput {
  workspaceId: string
  userId: string
  kind: NotificationKind
  title: string
  body?: string
  href?: string
}

export async function notify(input: NotifyInput) {
  await db().insert(schema.notifications).values({
    id: id('n'),
    workspaceId: input.workspaceId,
    userId: input.userId,
    kind: input.kind,
    title: input.title,
    body: input.body ?? '',
    href: input.href ?? '/',
    read: false,
  })
}

/** Fan-out to several members, skipping the actor to avoid self-notification. */
export async function notifyMany(inputs: NotifyInput[]) {
  const seen = new Set<string>()
  const rows = inputs
    .filter((n) => {
      const key = `${n.userId}:${n.kind}:${n.title}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .map((n) => ({
      id: id('n'),
      workspaceId: n.workspaceId,
      userId: n.userId,
      kind: n.kind,
      title: n.title,
      body: n.body ?? '',
      href: n.href ?? '/',
      read: false,
    }))
  if (!rows.length) return
  await db().insert(schema.notifications).values(rows)
}

/**
 * Notifies the workspace managers (plus the assigned reviewer) about content
 * entering review. Used by the board drag-drop and the content PATCH route.
 */
export async function notifyReviewers(input: {
  workspaceId: string
  contentId: string
  ref: number
  title: string
  actorId: string
  reviewerId?: string | null
}) {
  const database = db()
  const managers = await database.query.workspaceMembers.findMany({
    where: (m, { inArray }) => inArray(m.role, ['owner', 'admin', 'manager']),
    columns: { userId: true },
  })

  const recipients = new Set<string>(managers.map((m) => m.userId))
  if (input.reviewerId) recipients.add(input.reviewerId)
  recipients.delete(input.actorId)

  await notifyMany(
    [...recipients].map((userId) => ({
      workspaceId: input.workspaceId,
      userId,
      kind: 'approval' as const,
      title: `Content #${input.ref} needs approval`,
      body: input.title,
      href: `/content/${input.contentId}`,
    })),
  )
}

/** Deadline reminder for content inside the warning window. */
export async function notifyDeadline(input: {
  workspaceId: string
  contentId: string
  ref: number
  deadline: Date
  creatorId: string
}) {
  const hoursLeft = (input.deadline.getTime() - Date.now()) / 3_600_000
  if (hoursLeft > 48 || hoursLeft < -24) return
  const label = hoursLeft < 0 ? 'is overdue' : hoursLeft < 24 ? 'is due tomorrow' : 'is due soon'
  await notify({
    workspaceId: input.workspaceId,
    userId: input.creatorId,
    kind: 'task',
    title: `Content #${input.ref} ${label}`,
    body: new Date(input.deadline).toISOString(),
    href: `/content/${input.contentId}`,
  })
}