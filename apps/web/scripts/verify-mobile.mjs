// Verifies the mobile navigation actually renders for a signed-in user at phone
// width: the bottom bar, the "more" sheet, and the hidden desktop sidebar.
//
// Cookie is injected into the Edge profile via CDP because --dump-headless
// cannot carry one on the command line.
import { spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const BASE = process.env.BASE_URL ?? 'http://localhost:4102'
const COOKIE = process.env.SESSION_TOKEN
const COOKIE_NAME = process.env.COOKIE_NAME ?? '__Secure-gooos.session_token'

if (!COOKIE) {
  console.error('SESSION_TOKEN is required')
  process.exit(1)
}

const edge = spawn(
  EDGE,
  [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--remote-debugging-port=9333',
    '--window-size=390,844',
    'about:blank',
  ],
  { stdio: 'ignore' },
)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/** Polls the DevTools endpoint until Edge has actually opened the port. */
async function waitForCdp(port, timeoutMs = 20000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`)
      if (res.ok) return res.json()
    } catch {
      // Not listening yet.
    }
    await new Promise((r) => setTimeout(r, 400))
  }
  throw new Error(`DevTools endpoint on :${port} never became ready`)
}

let failures = 0
function check(name, ok, detail = '') {
  console.log(`${ok ? 'pass' : 'FAIL'}  ${name}${detail ? '  ' + detail : ''}`)
  if (!ok) failures++
}

try {
  const targets = await waitForCdp(9333)
  const page = targets.find((t) => t.type === 'page')
  if (!page) throw new Error('no CDP page target')

  const ws = new WebSocket(page.webSocketDebuggerUrl)
  await new Promise((res, rej) => {
    ws.addEventListener('open', res, { once: true })
    ws.addEventListener('error', rej, { once: true })
  })

  let id = 0
  const pending = new Map()
  ws.addEventListener('message', (e) => {
    const msg = JSON.parse(e.data)
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg)
      pending.delete(msg.id)
    }
  })
  const send = (method, params = {}) =>
    new Promise((res) => {
      const n = ++id
      pending.set(n, res)
      ws.send(JSON.stringify({ id: n, method, params }))
    })

  // Install the session cookie for the origin.
  await send('Network.enable')
  // The cookie name carries a __Secure- prefix in production only; dev serves
  // over plain http so Better Auth drops the prefix and sets secure=false.
  await send('Network.setCookie', {
    name: COOKIE_NAME,
    value: COOKIE,
    domain: 'localhost',
    path: '/',
    // Must stay false over plain http; the browser only sends a Secure cookie
    // on a secure origin, and localhost http is not one.
    secure: false,
    httpOnly: true,
  })

  await send('Page.enable')
  // --window-size alone does not move innerWidth in headless; the metrics
  // override is what actually emulates a handset viewport.
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2.625,
    mobile: true,
  })
  await send('Emulation.setUserAgentOverride', {
    userAgent:
      'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36',
  })
  await send('Page.navigate', { url: `${BASE}/` })
  await sleep(7000)

  const { result } = await send('Runtime.evaluate', {
    expression: `JSON.stringify({
      bottomBar: !!Array.from(document.querySelectorAll('nav')).find(n => n.textContent.includes('Lainnya')),
      lainnya: document.body.innerText.includes('Lainnya'),
      moreBtn: !!document.querySelector('[aria-label="Menu lainnya"]'),
      // Assert on the sidebar element's box, not on its text: "GOOCANAN" also
      // appears in placeholders and on Settings, so a text match would pass or
      // fail for the wrong reason. offsetParent is null for display:none.
      sidebarVisible: (() => {
        const el = document.querySelector('aside') || document.querySelector('[data-sidebar]')
        return !!el && el.offsetParent !== null
      })(),
      // Confirms the bottom bar respects the Android gesture pill.
      safeArea: (() => {
        const n = Array.from(document.querySelectorAll('nav')).find(x => x.textContent.includes('Lainnya'))
        return n ? getComputedStyle(n).paddingBottom : null
      })(),
      // Nav links must be react-router links, not raw anchors: an <a href>
      // causes a full page reload, which throws away the SPA session.
      navAnchors: Array.from(document.querySelectorAll('nav a')).filter(a => !a.getAttribute('href')?.startsWith('/')).length,
      loginForm: !!document.querySelector('input[type=password]'),
      width: window.innerWidth,
      navCount: document.querySelectorAll('nav').length
    })`,
    returnByValue: true,
  })
  const dom = JSON.parse(result.result.value)

  console.log('DOM:', JSON.stringify(dom, null, 2))
  check('signed in (no password field)', !dom.loginForm)
  check('bottom nav renders', dom.bottomBar)
  check('"Lainnya" visible', dom.lainnya)
  check('more button has aria-label', dom.moreBtn)
  check('desktop sidebar hidden at 390px', !dom.sidebarVisible)
  check('bottom bar uses safe-area inset', !!dom.safeArea && dom.safeArea !== '0px', dom.safeArea)
  check('no raw href anchors in nav', dom.navAnchors === 0)
  check('viewport is phone width', dom.width >= 360 && dom.width <= 430, `${dom.width}px`)

  // Open the more sheet and confirm the previously-unreachable routes appear.
  await send('Runtime.evaluate', {
    expression: `document.querySelector('[aria-label="Menu lainnya"]').click()`,
  })
  await sleep(900)
  const { result: r2 } = await send('Runtime.evaluate', {
    expression: `JSON.stringify({
      dialog: !!document.querySelector('[role=dialog]'),
      text: document.querySelector('[role=dialog]')?.innerText ?? '',
      links: Array.from(document.querySelectorAll('[role=dialog] a')).map(a => a.getAttribute('href'))
    })`,
    returnByValue: true,
  })
  const sheet = JSON.parse(r2.result.value)
  console.log('sheet links:', sheet.links)
  check('more sheet opens', sheet.dialog)
  for (const route of ['/settings', '/team', '/assets', '/campaigns', '/scripts', '/content', '/reports', '/ai']) {
    check(`sheet exposes ${route}`, sheet.links.includes(route))
  }

  // Service worker registration is the actual PWA requirement.
  const { result: r3 } = await send('Runtime.evaluate', {
    expression: `navigator.serviceWorker.getRegistrations().then(r => JSON.stringify(r.map(x => x.active?.scriptURL ?? x.installing?.scriptURL)))`,
    awaitPromise: true,
    returnByValue: true,
  })
  console.log('SW registrations:', r3.result.value)
  check('service worker registered', r3.result.value.includes('sw.js'))

  ws.close()
} catch (err) {
  console.error('ERROR', err)
  failures++
} finally {
  edge.kill()
}

console.log(failures === 0 ? '\nALL PASS' : `\n${failures} FAILED`)
process.exit(failures === 0 ? 0 : 1)