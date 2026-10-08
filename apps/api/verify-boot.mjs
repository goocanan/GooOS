/**
 * Integration check for the web app's boot path.
 *
 * The SPA is a browser app, so this script reproduces exactly what
 * `StoreProvider.boot()` + `loadWorkspace()` do in the browser: sign in, then
 * fire the same parallel request set, then touch the fields each page reads.
 * It catches shape drift between the API and the client that `tsc` cannot,
 * because the DTO types are shared rather than inferred from the wire.
 *
 *   node verify-boot.mjs
 */
const BASE = process.env.BASE ?? 'http://localhost:4000'

const jar = new Map()
function saveCookies(res) {
  for (const c of res.headers.getSetCookie?.() ?? []) {
    const [pair] = c.split(';')
    const i = pair.indexOf('=')
    jar.set(pair.slice(0, i), pair.slice(i + 1))
  }
}
const cookie = () => [...jar].map(([k, v]) => `${k}=${v}`).join('; ')

async function call(path, init = {}) {
  const headers = { ...(init.headers ?? {}) }
  const c = cookie()
  if (c) headers.cookie = c
  if (init.workspaceId) headers['x-workspace-id'] = init.workspaceId
  if (init.body) headers['content-type'] = 'application/json'
  const res = await fetch(`${BASE}${path}`, { ...init, headers })
  saveCookies(res)
  const text = await res.text()
  let body = null
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = text
  }
  return { status: res.status, body }
}

let pass = 0
const failures = []
function check(name, ok, detail) {
  if (ok) {
    pass++
    console.log(`  ok   ${name}`)
  } else {
    failures.push(name)
    console.log(`  FAIL ${name}${detail !== undefined ? ` -> ${JSON.stringify(detail).slice(0, 220)}` : ''}`)
  }
}
const has = (obj, ...keys) => keys.every((k) => obj != null && Object.prototype.hasOwnProperty.call(obj, k))

async function main() {
  console.log(`Verifying the web app's boot sequence against ${BASE}\n${'='.repeat(60)}\n`)

  console.log('sign in')
  const signIn = await call('/api/auth/sign-in/email', {
    method: 'POST',
    body: JSON.stringify({ email: 'james@goocanan3d.com', password: 'gooos123' }),
  })
  check('sign-in succeeds', signIn.status === 200, signIn.body)
  check('session cookie stored', jar.has('gooos.session_token'), [...jar.keys()])

  const session = await call('/api/session')
  check('GET /api/session -> 200', session.status === 200, session.body)
  check('session.user has the fields Login.tsx renders', has(session.body?.user, 'id', 'name', 'email', 'image', 'title', 'active'), session.body?.user)
  check('session.workspaces is a list', Array.isArray(session.body?.workspaces) && session.body.workspaces.length > 0, session.body?.workspaces)
  check(
    'workspace has the usage fields the sidebar renders',
    has(session.body?.workspaces?.[0], 'id', 'name', 'slug', 'plan', 'contentUsage', 'contentLimit', 'storageUsedMb', 'storageLimitMb', 'seats', 'seatLimit', 'role'),
    session.body?.workspaces?.[0],
  )
  check('session.members carry workspace roles', session.body?.members?.every((m) => typeof m.role === 'string'), session.body?.members?.[0])

  const ws = session.body.activeWorkspaceId
  check('activeWorkspaceId present', Boolean(ws), ws)

  console.log('\nloadWorkspace(): the parallel request set')
  const [contents, brands, campaigns, assets, ideas, scripts, team, notifications, activity, analytics, hashtags] =
    await Promise.all([
      call('/api/content?limit=200', { workspaceId: ws }),
      call('/api/brands', { workspaceId: ws }),
      call('/api/campaigns', { workspaceId: ws }),
      call('/api/assets?limit=200', { workspaceId: ws }),
      call('/api/ideas', { workspaceId: ws }),
      call('/api/scripts', { workspaceId: ws }),
      call('/api/team', { workspaceId: ws }),
      call('/api/notifications', { workspaceId: ws }),
      call('/api/activity?limit=30', { workspaceId: ws }),
      call('/api/analytics', { workspaceId: ws }),
      call('/api/hashtags', { workspaceId: ws }),
    ])

  check('all eleven requests return 200', [contents, brands, campaigns, assets, ideas, scripts, team, notifications, activity, analytics, hashtags].every((r) => r.status === 200), {
    statuses: [contents, brands, campaigns, assets, ideas, scripts, team, notifications, activity, analytics, hashtags].map((r) => r.status),
  })

  console.log('\nshapes the pages index into')
  const c0 = contents.body?.data?.[0]
  check(
    'ContentDTO has every field ContentCard/ContentDetail read',
    has(c0, 'id', 'ref', 'title', 'description', 'type', 'status', 'priority', 'ownerId', 'creatorId', 'reviewerId', 'tags', 'deadline', 'dueDate', 'thumbnailColor', 'platforms', 'cta', 'notes', 'brief', 'scriptId', 'assetIds', 'createdAt', 'updatedAt', 'ideaSource', 'productionProgress', 'version'),
    c0 ? Object.keys(c0) : null,
  )
  check('ContentDTO.platforms[] has caption + hashtags', has(c0?.platforms?.[0], 'platform', 'caption', 'hashtags', 'scheduledAt', 'publishedAt'), c0?.platforms?.[0])
  check('ContentDTO.brief is fully populated (no undefined fields)', has(c0?.brief, 'objective', 'audience', 'topic', 'hook', 'keyMessage', 'cta', 'reference', 'expectedDuration'), c0?.brief)

  check('BrandDTO has the guidelines sub-fields Settings reads', has(brands.body?.data?.[0], 'id', 'name', 'description', 'logoText', 'color', 'industry', 'audience', 'socials', 'guidelines') && has(brands.body?.data?.[0]?.guidelines, 'tone', 'primaryColor', 'secondaryColor', 'keywords', 'doList', 'dontList', 'fonts'), brands.body?.data?.[0]?.guidelines)

  check('CampaignDTO uses the denormalised rollup', has(campaigns.body?.data?.[0], 'id', 'name', 'goal', 'start', 'end', 'status', 'color', 'budget', 'contentCount', 'publishedCount'), campaigns.body?.data?.[0])

  check('AssetDTO.url is served by the API', String(assets.body?.data?.[0]?.url ?? '').includes('/api/assets/file/'), assets.body?.data?.[0]?.url)
  check('assets response includes the folder tree', Array.isArray(assets.body?.folders), assets.body?.folders)

  check('IdeaDTO has votes + convertedContentId', has(ideas.body?.data?.[0], 'id', 'title', 'description', 'platform', 'tags', 'priority', 'createdBy', 'votes', 'convertedContentId'), ideas.body?.data?.[0])

  check('NotificationDTO has kind/title/href/read', has(notifications.body?.data?.[0], 'id', 'kind', 'title', 'body', 'href', 'read', 'at'), notifications.body?.data?.[0])
  check('notifications response carries the unread count', typeof notifications.body?.unread === 'number', notifications.body?.unread)

  check('ActivityDTO has verb/target/kind/at', has(activity.body?.data?.[0], 'id', 'actorId', 'verb', 'target', 'kind', 'at'), activity.body?.data?.[0])

  console.log('\nper-page endpoints')
  const dashboard = await call('/api/dashboard?range=14', { workspaceId: ws })
  check('DashboardDTO.totals populated', (dashboard.body?.totals?.content ?? 0) > 0, dashboard.body?.totals)
  check('DashboardDTO has all ten pipeline stages', dashboard.body?.pipeline?.length === 10, dashboard.body?.pipeline?.length)
  check('DashboardDTO.series has 14 points', dashboard.body?.series?.length === 14, dashboard.body?.series?.length)
  check('DashboardDTO.needsAttention present', Array.isArray(dashboard.body?.needsAttention), typeof dashboard.body?.needsAttention)
  check('DashboardDTO.week present', Array.isArray(dashboard.body?.week), typeof dashboard.body?.week)

  const sample = contents.body?.data?.[0]
  const detail = await call(`/api/content/${sample.id}`, { workspaceId: ws })
  check('content detail -> 200', detail.status === 200, detail.body)
  check('detail includes comments for the review tab', Array.isArray(detail.body?.comments), typeof detail.body?.comments)
  check('detail includes analytics for the metrics tab', Array.isArray(detail.body?.analytics), typeof detail.body?.analytics)
  check('detail includes the script for the script tab', 'script' in (detail.body ?? {}), Object.keys(detail.body ?? {}))
  check('detail includes assets for the assets tab', Array.isArray(detail.body?.assets), typeof detail.body?.assets)
  check('detail includes versions for the history tab', Array.isArray(detail.body?.versions), typeof detail.body?.versions)

  const calFrom = new Date(Date.now() - 21 * 86400000).toISOString()
  const calTo = new Date(Date.now() + 60 * 86400000).toISOString()
  const calendar = await call(`/api/content/calendar?from=${calFrom}&to=${calTo}`, { workspaceId: ws })
  check('calendar -> 200', calendar.status === 200, calendar.body)
  check('calendar events carry the nested content row', Boolean(calendar.body?.data?.[0]?.content?.title), calendar.body?.data?.[0])

  const report = await call('/api/reports/monthly', { workspaceId: ws })
  check('monthly report builds', Boolean(report.body?.month) && Array.isArray(report.body?.platformPerformance), report.body?.month)
  check('report campaigns use the denormalised rollup', report.body?.campaigns?.every((c) => typeof c.contentCount === 'number'), report.body?.campaigns?.[0])

  const search = await call('/api/search?q=Bambu', { workspaceId: ws })
  check('search returns hits with hrefs', (search.body?.data?.length ?? 0) > 0 && Boolean(search.body?.data?.[0]?.href), search.body?.data?.[0])

  console.log('\nwrite paths the store exposes')
  const created = await call('/api/content', {
    method: 'POST',
    workspaceId: ws,
    body: JSON.stringify({ title: 'Boot verification content', type: 'tiktok', status: 'idea', priority: 'high' }),
  })
  check('POST /api/content -> 201', created.status === 201, created.body)
  const id = created.body?.content?.id

  const moved = await call(`/api/content/${id}/move`, { method: 'POST', workspaceId: ws, body: JSON.stringify({ status: 'production', productionProgress: 40 }) })
  check('POST move applies status and progress', moved.body?.content?.status === 'production' && moved.body?.content?.productionProgress === 40, moved.body?.content)

  const scheduled = await call(`/api/content/${id}/schedule`, {
    method: 'POST',
    workspaceId: ws,
    body: JSON.stringify({ scheduledAt: new Date(Date.now() + 2 * 86400000).toISOString(), mode: 'copy_publish' }),
  })
  // The caption is legitimately empty here (nothing written yet), so assert on
  // the key's presence rather than truthiness.
  check(
    'POST schedule returns a copy-publish payload',
    has(scheduled.body?.copyPayload, 'platform', 'scheduledAt', 'timezone', 'title', 'caption', 'hashtags', 'instructions'),
    scheduled.body?.copyPayload,
  )

  const script = await call('/api/scripts', { method: 'POST', workspaceId: ws, body: JSON.stringify({ contentId: id, title: 'Boot script', blocks: [{ kind: 'hook', heading: 'HOOK', body: 'test' }] }) })
  check('POST /api/scripts -> 201', script.status === 201, script.body)

  const scored = await call('/api/ai/generate', { method: 'POST', workspaceId: ws, body: JSON.stringify({ tool: 'score', prompt: sample.title, contentId: id }) })
  check('AI score tool returns parseable JSON', (() => {
    try {
      const s = scored.body?.output?.indexOf('{')
      const e = scored.body?.output?.lastIndexOf('}')
      const p = JSON.parse(scored.body.output.slice(s, e + 1))
      return typeof p.hookClarity === 'number'
    } catch {
      return false
    }
  })(), String(scored.body?.output ?? '').slice(0, 160))

  await call(`/api/content/${id}`, { method: 'DELETE', workspaceId: ws })
  const gone = await call(`/api/content/${id}`, { workspaceId: ws })
  check('DELETE then GET -> 404', gone.status === 404, gone.body)

  console.log(`\n${'='.repeat(60)}\npassed: ${pass}   failed: ${failures.length}`)
  if (failures.length) {
    console.log(`failures:\n  - ${failures.join('\n  - ')}`)
    process.exit(1)
  }
  process.exit(0)
}

main().catch((e) => {
  console.error('\nVERIFICATION CRASHED:', e)
  process.exit(1)
})
