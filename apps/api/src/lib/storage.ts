import { createHash, randomUUID } from 'node:crypto'
import { mkdir, readFile, unlink, writeFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { env } from '../config/env'
import { ApiError } from './errors'

/**
 * Local filesystem storage - a stand-in for S3/Supabase Storage (PRD section 16).
 *
 * The interface is intentionally tiny (put/get/delete) so swapping in an S3
 * driver means implementing this class and changing one import. Object keys
 * follow the same convention S3 would use: workspace/<id>/<yyyy-mm>/<uuid>.<ext>
 */

const ROOT = env.storageDir

export class LocalStorage {
  private ensureRoot() {
    mkdir(ROOT, { recursive: true })
  }

  /** Rejects path traversal before touching the filesystem. */
  private resolveKey(key: string) {
    const normalized = path
      .normalize(key)
      .replace(/^([/\\])+/, '')
      .replace(/\\/g, '/')
    if (normalized.includes('..')) throw ApiError.badRequest('Invalid storage key')
    const full = path.resolve(ROOT, normalized)
    if (!full.startsWith(ROOT)) throw ApiError.badRequest('Invalid storage key')
    return { full, relative: normalized }
  }

  async put(key: string, data: Buffer): Promise<{ key: string; size: number }> {
    this.ensureRoot()
    const { full, relative } = this.resolveKey(key)
    await mkdir(path.dirname(full), { recursive: true })
    await writeFile(full, data)
    return { key: relative, size: data.byteLength }
  }

  async get(key: string): Promise<Buffer> {
    const { full } = this.resolveKey(key)
    try {
      return await readFile(full)
    } catch {
      throw ApiError.notFound('File')
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const { full } = this.resolveKey(key)
      await stat(full)
      return true
    } catch {
      return false
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const { full } = this.resolveKey(key)
      await unlink(full)
    } catch {
      // Already gone - deleting is idempotent by design.
    }
  }

  async size(key: string): Promise<number> {
    const { full } = this.resolveKey(key)
    try {
      const s = await stat(full)
      return s.size
    } catch {
      return 0
    }
  }
}

export const storage = new LocalStorage()

const MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  webm: 'video/webm',
  wav: 'audio/wav',
  mp3: 'audio/mpeg',
  m4a: 'audio/mp4',
  pdf: 'application/pdf',
  zip: 'application/zip',
  stl: 'model/stl',
  '3mf': 'model/3mf',
  obj: 'model/obj',
  glb: 'model/gltf-binary',
  gltf: 'model/gltf+json',
  txt: 'text/plain',
  json: 'application/json',
}

export function mimeFor(ext: string): string {
  return MIME[ext.toLowerCase()] ?? 'application/octet-stream'
}

/** Builds a collision-free object key scoped to the workspace and month. */
export function buildKey(workspaceId: string, filename: string): string {
  const ext = (filename.split('.').pop() ?? 'bin').toLowerCase()
  const now = new Date()
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const hash = createHash('sha1').update(`${filename}:${randomUUID()}`).digest('hex').slice(0, 12)
  return `${workspaceId}/${month}/${hash}.${ext}`
}

const IMAGE_EXT = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'])
const VIDEO_EXT = new Set(['mp4', 'mov', 'webm'])
const AUDIO_EXT = new Set(['wav', 'mp3', 'm4a'])
const MODEL_EXT = new Set(['stl', '3mf', 'obj', 'glb', 'gltf', 'zip'])

export type AssetKind = 'image' | 'video' | 'audio' | 'document' | 'model'

export function kindFor(ext: string): AssetKind {
  const e = ext.toLowerCase()
  if (IMAGE_EXT.has(e)) return 'image'
  if (VIDEO_EXT.has(e)) return 'video'
  if (AUDIO_EXT.has(e)) return 'audio'
  if (MODEL_EXT.has(e)) return 'model'
  return 'document'
}

/** Formats bytes for the API response. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(1)} KB`
  const mb = kb / 1024
  if (mb < 1024) return `${mb.toFixed(1)} MB`
  return `${(mb / 1024).toFixed(2)} GB`
}