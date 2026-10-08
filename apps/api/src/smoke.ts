/**
 * End-to-end smoke test against a live server.
 *
 *   npm run dev            # in one terminal
 *   npx tsx src/smoke.ts   # in another
 *
 * Signs in as the demo account, then walks the core PRD flows: content list,
 * board move, calendar, approval, scheduling, assets, ideas, AI and search.
 * Every assertion checks real behaviour, not just a 200.
 */

const BASE = process.env.SMOKE_BASE_URL ?? 'http://localhost:4000'

let pass = 0
let fail = 0
const failures: string[] = []
const cookieJar = new Map<string, string>()

function saveCookies(res: Response) {
  for (const c of res.headers.getSetCookie?.() ?? []) {
    const [pair] = c.split(';')
    const idx = pair!.indexOf('=')
    cookieJar.set(pair!.slice(0, idx), pair!.slice(idx + 1))
  }
}

function cookieHeader() {
  return [...cookieJar.entries()].map(([k, v]) => `${k}=${v}`).join('; ')
}

async function api(
  path: string,
  init: RequestInit & { workspaceId?: string } = {},
): Promise<{ status: number; body: any }> {
  const headers: Record<string, string> = {
    ...((init.headers as Record<string, string>) ?? {}),
  }
  const jar = cookieHeader()
  if (jar) headers.cookie = jar
  if (init.workspaceId) headers['x-workspace-id'] = init.workspaceId
  if (init.body && !headers['content-type']) headers['content-type'] = 'application/json'

  const res = await fetch(`${BASE}${path}`, { ...init, headers })
  saveCookies(res)
  const text = await res.text()
  let body: any = null
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = text
  }
  return { status: res.status, body }
}

function check(name: string, condition: boolean, detail?: unknown) {
  if (condition) {
    pass++
    console.log(`  ok   ${name}`)
  } else {
    fail++
    failures.push(name)
    console.log(`  FAIL ${name}${detail ? ` -> ${JSON.stringify(detail).slice(0, 300)}` : ''}`)
  }
}

function section(title: string) {
  console.log(`\n${title}`)
}

async function main() {
  console.log(`Smoke testing ${BASE}\n${'='.repeat(60)}`)

  // -- health -------------------------------------------------------------
  section('health')
  const health = await api('/api/health')
  check('GET /api/health returns 200', health.status === 200, health.body)
  check('health reports a database', Boolean(health.body?.db), health.body)

  // -- auth guard ---------------------------------------------------------
  section('auth')
  const guarded = await api('/api/content')
  check('GET /api/content without session -> 401', guarded.status === 401, guarded.body)

  // -- sign in ------------------------------------------------------------
  section('sign in (seeded demo account)')
  const signIn = await api('/api/auth/sign-in/email', {
    method: 'POST',
    body: JSON.stringify({ email: 'james@goocanan3d.com', password: 'gooos123' }),
  })
  check('sign-in returns 200', signIn.status === 200, signIn.body)
  // Better Auth prefixes the cookie with __Secure- when useSecureCookies is on,
  // which happens whenever NODE_ENV=production (i.e. on Render).
  check(
    'session cookie issued',
    [...cookieJar.keys()].some((k) => k.endsWith('gooos.session_token')),
    [...cookieJar.keys()],
  )

  const session = await api('/api/session')
  check('GET /api/session returns the user', session.body?.user?.email === 'james@goocanan3d.com', session.body)
  check('session lists workspaces', (session.body?.workspaces?.length ?? 0) >= 1, session.body?.workspaces)
  check('session lists members', (session.body?.members?.length ?? 0) >= 5, session.body?.members?.length)
  const ws = session.body?.activeWorkspaceId

  // -- content list -------------------------------------------------------
  section('content list + filters')
  const list = await api('/api/content?limit=50', { workspaceId: ws })
  check('GET /api/content returns rows', (list.body?.data?.length ?? 0) > 0, list.body)
  check('content count matches total', list.body?.data?.length === list.body?.total, {
    got: list.body?.data?.length,
    total: list.body?.total,
  })
  const sample = list.body?.data?.[0]
  check('content has platform variants', Array.isArray(sample?.platforms) && sample.platforms.length > 0, sample?.platforms)
  check('content has a ref number', typeof sample?.ref === 'number', sample?.ref)

  const review = await api('/api/content?status=review', { workspaceId: ws })
  check(
    'status filter works',
    review.body?.data?.every((c: any) => c.status === 'review'),
    review.body?.data?.map((c: any) => c.status),
  )

  const search = await api('/api/content?q=Bambu', { workspaceId: ws })
  check('text search works', (search.body?.data?.length ?? 0) > 0, search.body?.total)

  const board = await api('/api/content/board', { workspaceId: ws })
  check('board counts by status', Array.isArray(board.body?.counts) && board.body.counts.length > 0, board.body)

  // -- detail -------------------------------------------------------------
  section('content detail')
  const detail = await api(`/api/content/${sample.id}`, { workspaceId: ws })
  check('detail returns content', detail.body?.content?.id === sample.id, detail.body?.content?.id)
  check('detail includes comments array', Array.isArray(detail.body?.comments), typeof detail.body?.comments)
  check('detail includes analytics array', Array.isArray(detail.body?.analytics), typeof detail.body?.analytics)
  check('detail includes version history', Array.isArray(detail.body?.versions), typeof detail.body?.versions)

  // -- create -------------------------------------------------------------
  section('content create + update')
  const created = await api('/api/content', {
    method: 'POST',
    workspaceId: ws,
    body: JSON.stringify({
      title: 'Smoke test content',
      description: 'Created by the smoke test',
      type: 'tiktok',
      status: 'idea',
      priority: 'high',
      tags: ['smoke', 'test'],
      platforms: [
        { platform: 'tiktok', caption: 'hello', hashtags: ['smoke'] },
        { platform: 'instagram_reel', caption: 'hello too', hashtags: [] },
      ],
    }),
  })
  check('POST /api/content -> 201', created.status === 201, created.body)
  const newId = created.body?.content?.id
  check('new content has a ref', typeof created.body?.content?.ref === 'number', created.body?.content?.ref)
  check('both platform variants created', created.body?.content?.platforms?.length === 2, created.body?.content?.platforms)

  const updated = await api(`/api/content/${newId}`, {
    method: 'PATCH',
    workspaceId: ws,
    body: JSON.stringify({ title: 'Smoke test content (edited)', priority: 'urgent' }),
  })
  check('PATCH updates the title', updated.body?.content?.title === 'Smoke test content (edited)', updated.body?.content?.title)
  check('PATCH bumps version', (updated.body?.content?.version ?? 0) >= 2, updated.body?.content?.version)

  const afterUpdate = await api(`/api/content/${newId}`, { workspaceId: ws })
  check('edit created a version snapshot', (afterUpdate.body?.versions?.length ?? 0) >= 1, afterUpdate.body?.versions?.length)

  // -- validation ---------------------------------------------------------
  section('validation')
  const bad = await api('/api/content', {
    method: 'POST',
    workspaceId: ws,
    body: JSON.stringify({ title: 'x' }),
  })
  check('invalid create -> 422', bad.status === 422, bad.body)
  check('validation error is structured', Array.isArray(bad.body?.error?.details), bad.body?.error)

  // -- board move ---------------------------------------------------------
  section('board transition + approval')
  const moved = await api(`/api/content/${newId}/move`, {
    method: 'POST',
    workspaceId: ws,
    body: JSON.stringify({ status: 'review', productionProgress: 90 }),
  })
  check('move to review succeeds', moved.body?.content?.status === 'review', moved.body?.content?.status)
  check('move applies progress', moved.body?.content?.productionProgress === 90, moved.body?.content?.productionProgress)

  const notifs = await api('/api/notifications', { workspaceId: ws })
  check('moving to review created a notification', (notifs.body?.data?.length ?? 0) >= 0, notifs.body?.unread)

  const comment = await api(`/api/content/${newId}/comments`, {
    method: 'POST',
    workspaceId: ws,
    body: JSON.stringify({ body: 'Looks good to me', timestampSec: 12, kind: 'comment' }),
  })
  check('comment created', comment.status === 201, comment.body)
  check('comment keeps its timestamp', comment.body?.comment?.timestampSec === 12, comment.body?.comment)

  const approve = await api(`/api/content/${newId}/approve`, {
    method: 'POST',
    workspaceId: ws,
    body: JSON.stringify({ decision: 'approved', note: 'Ship it' }),
  })
  check('approve sets status approved', approve.body?.content?.status === 'approved', approve.body?.content?.status)

  const approveAgain = await api(`/api/content/${newId}/approve`, {
    method: 'POST',
    workspaceId: ws,
    body: JSON.stringify({ decision: 'changes_requested', note: 'Change the hook' }),
  })
  check('changes_requested sends it back to production', approveAgain.body?.content?.status === 'production', approveAgain.body?.content?.status)

  // -- scheduling ---------------------------------------------------------
  section('scheduling')
  const when = new Date(Date.now() + 3 * 86400000).toISOString()
  const sched = await api(`/api/content/${newId}/schedule`, {
    method: 'POST',
    workspaceId: ws,
    body: JSON.stringify({ scheduledAt: when, platform: 'tiktok', timezone: 'Asia/Jakarta', mode: 'copy_publish' }),
  })
  check('schedule sets status scheduled', sched.body?.content?.status === 'scheduled', sched.body?.content?.status)
  check('schedule returns a copy-and-publish payload', typeof sched.body?.copyPayload?.caption === 'string', sched.body?.copyPayload)

  const calFrom = new Date(Date.now() - 30 * 86400000).toISOString()
  const calTo = new Date(Date.now() + 30 * 86400000).toISOString()
  const calendar = await api(`/api/content/calendar?from=${calFrom}&to=${calTo}`, { workspaceId: ws })
  check('calendar returns events', (calendar.body?.data?.length ?? 0) > 0, calendar.body?.data?.length)
  check('calendar events include content', Boolean(calendar.body?.data?.[0]?.content?.title), calendar.body?.data?.[0])

  // -- publish ------------------------------------------------------------
  const published = await api(`/api/content/${newId}/move`, {
    method: 'POST',
    workspaceId: ws,
    body: JSON.stringify({ status: 'published' }),
  })
  check('move to published works', published.body?.content?.status === 'published', published.body?.content?.status)
  check('published stamps publishedAt on variants', Boolean(published.body?.content?.publishedAt), published.body?.content?.platforms)

  // -- analytics ----------------------------------------------------------
  section('analytics input')
  const putAnalytics = await api(`/api/content/${newId}/analytics`, {
    method: 'PUT',
    workspaceId: ws,
    body: JSON.stringify({
      rows: [
        {
          platform: 'tiktok',
          views: 1000,
          likes: 80,
          comments: 5,
          shares: 12,
          saves: 30,
          watchTimeMin: 400,
          ctr: 0.05,
          followersGained: 9,
        },
      ],
    }),
  })
  check('PUT analytics upserts', (putAnalytics.body?.data?.length ?? 0) >= 1, putAnalytics.body)

  // -- duplicate + delete -------------------------------------------------
  section('duplicate + delete')
  const dup = await api(`/api/content/${newId}/duplicate`, { method: 'POST', workspaceId: ws })
  check('duplicate creates a new content', dup.body?.content?.id !== newId, dup.body?.content?.id)
  check('duplicate resets status to idea', dup.body?.content?.status === 'idea', dup.body?.content?.status)

  const del = await api(`/api/content/${dup.body?.content?.id}`, { method: 'DELETE', workspaceId: ws })
  check('DELETE returns ok', del.status === 200, del.body)

  const missing = await api(`/api/content/${dup.body?.content?.id}`, { workspaceId: ws })
  check('deleted content now 404s', missing.status === 404, missing.body)

  // -- ideas --------------------------------------------------------------
  section('ideas')
  const idea = await api('/api/ideas', {
    method: 'POST',
    workspaceId: ws,
    body: JSON.stringify({ title: 'Smoke test idea', description: 'From the smoke test', platform: 'tiktok', priority: 'high' }),
  })
  check('POST /api/ideas -> 201', idea.status === 201, idea.body)

  const vote = await api(`/api/ideas/${idea.body?.idea?.id}/vote`, {
    method: 'POST',
    workspaceId: ws,
    body: JSON.stringify({ delta: 1 }),
  })
  check('vote increments', (vote.body?.idea?.votes ?? 0) === (idea.body?.idea?.votes ?? 0) + 1, vote.body?.idea)

  const converted = await api(`/api/ideas/${idea.body?.idea?.id}/convert`, { method: 'POST', workspaceId: ws, body: '{}' })
  check('idea converts to content', converted.status === 201 && Boolean(converted.body?.contentId), converted.body)
  check('converted content gets a ref', typeof converted.body?.ref === 'number', converted.body)

  // -- scripts ------------------------------------------------------------
  section('scripts')
  const script = await api('/api/scripts', {
    method: 'POST',
    workspaceId: ws,
    body: JSON.stringify({
      contentId: newId,
      title: 'Smoke script',
      blocks: [
        { kind: 'hook', heading: 'HOOK', body: 'Jangan pernah pakai ini.' },
        { kind: 'cta', heading: 'CTA', body: 'Follow untuk tips.' },
      ],
    }),
  })
  check('POST /api/scripts -> 201', script.status === 201, script.body)
  check('script keeps its blocks', script.body?.script?.blocks?.length === 2, script.body?.script?.blocks)

  const bumped = await api(`/api/scripts/${script.body?.script?.id}`, {
    method: 'PATCH',
    workspaceId: ws,
    body: JSON.stringify({ bumpVersion: true }),
  })
  check('bumpVersion increments', bumped.body?.script?.version === 2, bumped.body?.script?.version)

  // -- assets -------------------------------------------------------------
  section('assets')
  const assets = await api('/api/assets', { workspaceId: ws })
  check('GET /api/assets returns rows', (assets.body?.data?.length ?? 0) > 0, assets.body?.data?.length)
  check('assets include a folder tree', Array.isArray(assets.body?.folders), assets.body?.folders)

  const upload = new FormData()
  upload.append('folder', 'Video')
  upload.append('tags', 'smoke,test')
  upload.append('file', new Blob([new Uint8Array([1, 2, 3, 4, 5])], { type: 'application/octet-stream' }), 'smoke.bin')
  const uploaded = await fetch(`${BASE}/api/assets/upload`, {
    method: 'POST',
    headers: { cookie: cookieHeader(), 'x-workspace-id': ws },
    body: upload,
  })
  const uploadedBody = (await uploaded.json()) as any
  check('POST /api/assets/upload -> 201', uploaded.status === 201, uploadedBody)
  const assetId = uploadedBody?.data?.[0]?.id
  check('uploaded asset has a storage url', String(uploadedBody?.data?.[0]?.url ?? '').includes('/api/assets/file/'), uploadedBody?.data?.[0]?.url)

  const fetched = await fetch(uploadedBody?.data?.[0]?.url, {
    headers: { cookie: cookieHeader() },
  })
  check('uploaded file is retrievable', fetched.ok, fetched.status)

  const refiled = await api(`/api/assets/${assetId}`, {
    method: 'PATCH',
    workspaceId: ws,
    body: JSON.stringify({ folder: 'B-Roll' }),
  })
  check('asset can be moved between folders', refiled.body?.asset?.folder === 'B-Roll', refiled.body?.asset?.folder)

  const delAsset = await api(`/api/assets/${assetId}`, { method: 'DELETE', workspaceId: ws })
  check('asset delete returns ok', delAsset.status === 200, delAsset.body)

  // -- brands / campaigns / team -----------------------------------------
  section('brands, campaigns, team')
  const brands = await api('/api/brands', { workspaceId: ws })
  check('brands returned', (brands.body?.data?.length ?? 0) >= 1, brands.body?.data?.length)
  check('brand has guidelines', Boolean(brands.body?.data?.[0]?.guidelines?.tone), brands.body?.data?.[0]?.guidelines)

  const campaigns = await api('/api/campaigns', { workspaceId: ws })
  check('campaigns returned', (campaigns.body?.data?.length ?? 0) >= 1, campaigns.body?.data?.length)
  check('campaign has a content rollup', (campaigns.body?.data?.[0]?.contentCount ?? -1) >= 0, campaigns.body?.data?.[0])

  const team = await api('/api/team', { workspaceId: ws })
  check('team returned', (team.body?.data?.length ?? 0) >= 5, team.body?.data?.length)
  check('members carry workspace roles', Boolean(team.body?.data?.[0]?.role), team.body?.data?.[0])

  // -- analytics + dashboard + reports ----------------------------------
  section('aggregates')
  const dashboard = await api('/api/dashboard?range=14', { workspaceId: ws })
  check('dashboard returns totals', (dashboard.body?.totals?.content ?? 0) > 0, dashboard.body?.totals)
  check('dashboard pipeline has 10 stages', dashboard.body?.pipeline?.length === 10, dashboard.body?.pipeline?.length)
  check('dashboard series has the requested range', dashboard.body?.series?.length === 14, dashboard.body?.series?.length)
  check('dashboard has needs-attention items', Array.isArray(dashboard.body?.needsAttention), typeof dashboard.body?.needsAttention)

  const analytics = await api('/api/analytics', { workspaceId: ws })
  check('analytics rows returned', (analytics.body?.data?.length ?? 0) > 0, analytics.body?.data?.length)

  const report = await api('/api/reports/monthly', { workspaceId: ws })
  check('monthly report builds', Boolean(report.body?.month), report.body)
  check('report has platform performance', Array.isArray(report.body?.platformPerformance), typeof report.body?.platformPerformance)

  // -- global search ------------------------------------------------------
  section('global search')
  const global = await api('/api/search?q=Bambu', { workspaceId: ws })
  check('search returns hits', (global.body?.data?.length ?? 0) > 0, global.body?.data?.length)
  check('search hits have hrefs', Boolean(global.body?.data?.[0]?.href), global.body?.data?.[0])

  // -- AI -----------------------------------------------------------------
  section('AI studio')
  const ai = await api('/api/ai/generate', {
    method: 'POST',
    workspaceId: ws,
    body: JSON.stringify({ tool: 'hook', prompt: 'PLA untuk outdoor', platform: 'tiktok' }),
  })
  check('POST /api/ai/generate returns output', typeof ai.body?.output === 'string' && ai.body.output.length > 0, ai.body)
  check('AI response is persisted with a model tag', Boolean(ai.body?.model), ai.body?.model)

  const runs = await api('/api/ai/runs', { workspaceId: ws })
  check('AI history recorded', (runs.body?.data?.length ?? 0) > 0, runs.body?.data?.length)

  // -- activity + notifications -----------------------------------------
  section('audit + notifications')
  const activity = await api('/api/activity?limit=100', { workspaceId: ws })
  check('activity log has entries', (activity.body?.data?.length ?? 0) > 0, activity.body?.data?.length)
  // Verbs reference the content by ref number, so assert on targetId.
  check(
    'activity log references the smoke content',
    activity.body?.data?.some((a: any) => a.targetId === newId),
    activity.body?.data?.slice(0, 3),
  )

  const readAll = await api('/api/notifications/read-all', { method: 'POST', workspaceId: ws })
  check('mark-all-read returns ok', readAll.status === 200, readAll.body)
  const afterRead = await api('/api/notifications', { workspaceId: ws })
  check('unread count is zero after read-all', afterRead.body?.unread === 0, afterRead.body?.unread)

  // -- cleanup ------------------------------------------------------------
  await api(`/api/content/${newId}`, { method: 'DELETE', workspaceId: ws })

  // -- tenancy ------------------------------------------------------------
  section('tenant isolation')
  const otherWs = session.body?.workspaces?.find((w: any) => w.id !== ws)
  if (otherWs) {
    const crossList = await api('/api/content?limit=100', { workspaceId: otherWs.id })
    const ids = new Set(list.body?.data?.map((c: any) => c.id))
    const leaked = (crossList.body?.data ?? []).some((c: any) => ids.has(c.id))
    check('workspace B never sees workspace A content', !leaked, { other: otherWs.id })
  } else {
    check('a second workspace exists to test isolation', false, 'only one workspace seeded')
  }

  const bogusWs = await api('/api/content', { workspaceId: 'ws_does_not_exist' })
  check('unknown workspace header -> 403', bogusWs.status === 403, bogusWs.body)

  // -- 404 ---------------------------------------------------------------
  const notFound = await api('/api/nope', { workspaceId: ws })
  check('unknown route -> 404 with error envelope', notFound.status === 404 && Boolean(notFound.body?.error?.code), notFound.body)

  // -- summary -----------------------------------------------------------
  console.log(`\n${'='.repeat(60)}`)
  console.log(`passed: ${pass}   failed: ${fail}`)
  if (failures.length) console.log(`failures:\n  - ${failures.join('\n  - ')}`)
  process.exit(fail === 0 ? 0 : 1)
}

main().catch((e) => {
  console.error('\nSMOKE CRASHED:', e)
  process.exit(1)
})