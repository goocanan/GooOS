import { db, schema } from '../db/client'
import { id } from '../lib/ids'
import type { ActivityKind } from '@gooos/shared/enums'

/**
 * Audit trail (PRD section 39). Every mutating route calls log() so the
 * activity feed and the compliance view stay complete.
 */
export async function logActivity(input: {
  workspaceId: string
  actorId: string
  verb: string
  target: string
  targetId?: string | null
  kind: ActivityKind
}) {
  await db().insert(schema.activityLogs).values({
    id: id('al'),
    workspaceId: input.workspaceId,
    actorId: input.actorId,
    verb: input.verb,
    target: input.target,
    targetId: input.targetId ?? null,
    kind: input.kind,
  })
}

/**
 * Fire-and-forget variant for use inside transactions where a failure to log
 * should not roll back the primary write.
 */
export function logActivitySafe(input: Parameters<typeof logActivity>[0]) {
  return logActivity(input).catch(() => undefined)
}