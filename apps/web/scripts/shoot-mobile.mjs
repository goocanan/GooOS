// Screenshots the mobile layout at handset size, for visual review.
// Usage: BASE_URL=... SESSION_TOKEN=... COOKIE_NAME=... node scripts/shoot-mobile.mjs
import { spawn } from 'node:child_process'
import { writeFileSync, mkdirSync } from 'node:fs'
import path from 'node:path'

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const BASE = process.env.BASE_URL ?? 'http://localhost:4102'
const TOKEN = process.env.SESSION_TOKEN
const COOKIE_NAME = process.env.COOKIE_NAME ?? '__Secure-gooos.session_token'
const OUT = path.resolve(import.meta.dirname, '../../.screens')

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

mkdirSync(OUT, { recursive: true })

const edge = spawn(
  EDGE,
  ['--headless=new', '--disable-gpu', '--no-first-run', '--remote-debugging-port=9334', 'about:blank'],
  { stdio: 'ignore' },
)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const targets = await waitForCdp(9334)
const page = targets.find((t) => t.type === 'page')
const ws = new WebSocket(page.webSocketDebuggerUrl)
await new Promise((res, rej) => {
  ws.addEventListener('open', res, { once: true })
  ws.addEventListener('error', rej, { once: true })
})

let id = 0
const pending = new Map()
ws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data)
  if (m.id && pending.has(m.id)) {
    pending.get(m.id)(m)
    pending.delete(m.id)
  }
})
const send = (method, params = {}) =>
  new Promise((res) => {
    const n = ++id
    pending.set(n, res)
    ws.send(JSON.stringify({ id: n, method, params }))
  })

await send('Network.enable')
await send('Network.setCookie', {
  name: COOKIE_NAME,
  value: TOKEN,
  domain: 'localhost',
  path: '/',
  secure: false,
  httpOnly: true,
})
await send('Page.enable')
await send('Emulation.setDeviceMetricsOverride', {
  width: 390,
  height: 844,
  deviceScaleFactor: 2,
  mobile: true,
})
await send('Emulation.setUserAgentOverride', {
  userAgent:
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36',
})

const shots = process.env.SHOTS
  ? JSON.parse(process.env.SHOTS)
  : [
      { url: '/', name: 'home' },
      { url: '/board', name: 'board' },
      { url: '/settings', name: 'settings' },
      { url: '/analytics', name: 'analytics' },
    ]

for (const shot of shots) {
  await send('Page.navigate', { url: `${BASE}${shot.url}` })
  await sleep(6000)
  const { result } = await send('Page.captureScreenshot', { format: 'png' })
  const file = path.join(OUT, `${shot.name}.png`)
  writeFileSync(file, Buffer.from(result.data, 'base64'))
  console.log('wrote', file)
}

ws.close()
edge.kill()