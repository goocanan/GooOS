import type { ZodTypeAny, z } from 'zod'
import { ApiError } from './errors'

/**
 * Zod helpers that throw the shared ApiError shape instead of leaking a
 * library-specific error. Fastify handlers stay free of try/catch noise.
 */

export function parse<S extends ZodTypeAny>(schema: S, value: unknown): z.infer<S> {
  const result = schema.safeParse(value)
  if (result.success) return result.data
  throw ApiError.validation('Request validation failed', formatIssues(result.error))
}

export function parseOr<S extends ZodTypeAny>(schema: S, value: unknown, fallback: z.infer<S>) {
  const result = schema.safeParse(value)
  return result.success ? result.data : fallback
}

type Issue = { path: string; message: string; code: string }

function formatIssues(error: z.ZodError): Issue[] {
  return error.issues.map((i) => ({
    path: i.path.join('.') || '(root)',
    message: i.message,
    code: i.code,
  }))
}

/** Normalises a repeated query param into an array regardless of encoding. */
export function toArray<T>(value: T | T[] | undefined | null): T[] {
  if (value == null) return []
  return Array.isArray(value) ? value : [value]
}