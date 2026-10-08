import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Platform } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]
const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

export const monthName = (i: number) => MONTHS[i] ?? ''
export const dayName = (i: number) => DAYS[i] ?? ''

export function fmtDate(iso?: string | null, opts: { withYear?: boolean } = {}) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  const base = `${d.getDate()} ${monthName(d.getMonth())}`
  return opts.withYear === false ? base : `${base} ${d.getFullYear()}`
}

export function fmtDateShort(iso?: string | null) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function fmtTime(iso?: string | null) {
  if (!iso) return '—'
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function fmtDateTime(iso?: string | null) {
  if (!iso) return '—'
  return `${fmtDate(iso)} · ${fmtTime(iso)}`
}

export function relTime(iso: string, now = new Date()) {
  const d = new Date(iso)
  const diff = d.getTime() - now.getTime()
  const abs = Math.abs(diff)
  const mins = Math.round(abs / 60000)
  const past = diff < 0
  const fmt = (v: number, unit: string) => `${past ? '' : 'in '}${v} ${unit}${v === 1 ? '' : 's'}${past ? ' ago' : ''}`
  if (mins < 1) return 'just now'
  if (mins < 60) return fmt(mins, 'min')
  const hours = Math.round(mins / 60)
  if (hours < 24) return fmt(hours, 'hour')
  const days = Math.round(hours / 24)
  if (days < 30) return fmt(days, 'day')
  const months = Math.round(days / 30)
  if (months < 12) return fmt(months, 'month')
  return fmt(Math.round(months / 12), 'year')
}

/** Days until deadline. Negative = overdue. */
export function daysUntil(iso?: string | null, now = new Date()) {
  if (!iso) return null
  const d = new Date(iso)
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  return Math.round((target - start) / 86400000)
}

export function dueLabel(iso?: string | null, now = new Date()) {
  const n = daysUntil(iso, now)
  if (n === null) return null
  if (n === 0) return { text: 'Hari ini', tone: 'warn' as const }
  if (n === 1) return { text: 'Besok', tone: 'warn' as const }
  if (n < 0) return { text: `Terlambat ${Math.abs(n)}h`, tone: 'danger' as const }
  if (n <= 3) return { text: `${n} hari lagi`, tone: 'warn' as const }
  return { text: `${n} hari lagi`, tone: 'muted' as const }
}

const nf = new Intl.NumberFormat('id-ID')
const nfCompact = new Intl.NumberFormat('id-ID', { notation: 'compact', maximumFractionDigits: 1 })

export const num = (v: number) => nf.format(Math.round(v))
export const compact = (v: number) => nfCompact.format(v)

export function pct(v: number, digits = 1) {
  return `${(v * 100).toFixed(digits).replace('.', ',')}%`
}

export function bytes(kb: number) {
  if (kb < 1024) return `${kb} KB`
  const mb = kb / 1024
  if (mb < 1024) return `${mb.toFixed(1)} MB`
  return `${(mb / 1024).toFixed(2)} GB`
}

export function toInitials(name?: string | null): string {
  if (!name) return '?'
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0] ?? '')
    .join('')
    .toUpperCase()
}

export function duration(sec?: number | null) {
  if (!sec) return '-'
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export function platformLabel(p: Platform) {
  return p
    .split('_')
    .map((s) => s[0].toUpperCase() + s.slice(1))
    .join(' ')
}

export function uid(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`
}

/** Deterministic pseudo-random from a string seed — keeps mock data stable. */
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

/** Tiny hash → HSL used for thumbnails/avatars so nothing looks randomly off. */
export function hashColor(seed: string, sat = 55, light = 52) {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360
  return `hsl(${h} ${sat}% ${light}%)`
}

export function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]!.toUpperCase())
    .join('')
}

export function clamp(n: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, n))
}

export function toLocalInput(iso?: string | null) {
  const d = iso ? new Date(iso) : new Date()
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function startOfWeek(d: Date) {
  const r = new Date(d)
  const day = (r.getDay() + 6) % 7 // Monday = 0
  r.setDate(r.getDate() - day)
  r.setHours(0, 0, 0, 0)
  return r
}

export function addDays(d: Date, n: number) {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

export function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function groupBy<T, K extends string | number>(arr: T[], key: (item: T) => K) {
  return arr.reduce(
    (acc, item) => {
      const k = key(item)
      ;(acc[k] ||= []).push(item)
      return acc
    },
    {} as Record<K, T[]>,
  )
}

export function downloadText(filename: string, text: string, mime = 'text/plain') {
  const blob = new Blob([text], { type: `${mime};charset=utf-8;` })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function toCsv(rows: Record<string, unknown>[]) {
  if (!rows.length) return ''
  const headers = Object.keys(rows[0]!)
  const esc = (v: unknown) => {
    const s = v == null ? '' : String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  return [headers.join(','), ...rows.map((r) => headers.map((h) => esc(r[h])).join(','))].join('\n')
}

export function wordCount(s: string) {
  return s.trim() ? s.trim().split(/\s+/).length : 0
}

export function readTime(s: string) {
  const words = wordCount(s)
  return Math.max(1, Math.round(words / 200))
}