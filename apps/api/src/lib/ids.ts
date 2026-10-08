import { randomUUID } from 'node:crypto'

/** Short, sortable-ish, URL-safe identifier: `pfx_ab12cd34`. */
export function id(prefix: string): string {
  return `${prefix}_${randomUUID().replace(/-/g, '').slice(0, 20)}`
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

/** Appends -2, -3 ... until `exists(candidate)` returns false. */
export async function uniqueSlug(base: string, exists: (s: string) => Promise<boolean>) {
  const root = slugify(base) || 'workspace'
  if (!(await exists(root))) return root
  for (let i = 2; i < 100; i++) {
    const candidate = `${root}-${i}`
    if (!(await exists(candidate))) return candidate
  }
  return `${root}-${Date.now().toString(36)}`
}

/** Deterministic pseudo-random generator, used by the mock AI provider. */
export function seeded(seed: string) {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return () => {
    h += 0x6d2b79f5
    let t = h
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function hashColor(seed: string, sat = 55, light = 52) {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360
  return `hsl(${h} ${sat}% ${light}%)`
}

/** Stable hex colour for placeholder thumbnails. */
export function hexFromString(seed: string): string {
  const huePalette = ['#8b1e3f', '#b81e51', '#d23a67', '#a98a26', '#38bdf8', '#34d399', '#a78bfa', '#f59e0b']
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 997
  return huePalette[h % huePalette.length]!
}