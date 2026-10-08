/**
 * Typed API errors. Every handler throws one of these; the global error
 * handler turns them into the shared `ApiError` envelope.
 */

export class ApiError extends Error {
  readonly statusCode: number
  readonly code: string
  readonly details?: unknown

  constructor(statusCode: number, code: string, message: string, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.code = code
    this.details = details
  }

  static badRequest(message: string, details?: unknown) {
    return new ApiError(400, 'BAD_REQUEST', message, details)
  }

  static validation(message: string, details?: unknown) {
    return new ApiError(422, 'VALIDATION_ERROR', message, details)
  }

  static unauthorized(message = 'Authentication required') {
    return new ApiError(401, 'UNAUTHORIZED', message)
  }

  static forbidden(message = 'You do not have permission to perform this action') {
    return new ApiError(403, 'FORBIDDEN', message)
  }

  static notFound(resource = 'Resource') {
    return new ApiError(404, 'NOT_FOUND', `${resource} not found`)
  }

  static conflict(message: string, details?: unknown) {
    return new ApiError(409, 'CONFLICT', message, details)
  }

  static tooManyRequests(message = 'Too many requests') {
    return new ApiError(429, 'RATE_LIMITED', message)
  }

  static internal(message = 'Internal server error', details?: unknown) {
    return new ApiError(500, 'INTERNAL_ERROR', message, details)
  }
}

/** Postgres unique-violation. */
export function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code?: string }).code === '23505'
  )
}

/** Postgres foreign-key violation. */
export function isForeignKeyViolation(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code?: string }).code === '23503'
  )
}