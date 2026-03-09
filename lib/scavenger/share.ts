import type { HuntDefinition } from './types'

// Lightweight base64url helpers so we can pass a complete hunt definition
// in a single URL segment without a backend.

function toBase64Url(input: string): string {
  if (typeof window !== 'undefined' && typeof window.btoa === 'function') {
    return window
      .btoa(input)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '')
  }
  // Node/test environment
  return Buffer.from(input, 'utf-8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

function fromBase64Url(input: string): string {
  const padded = padBase64(input.replace(/-/g, '+').replace(/_/g, '/'))
  if (typeof window !== 'undefined' && typeof window.atob === 'function') {
    return window.atob(padded)
  }
  // Node/test environment
  return Buffer.from(padded, 'base64').toString('utf-8')
}

function padBase64(value: string): string {
  const remainder = value.length % 4
  if (remainder === 0) return value
  return value + '='.repeat(4 - remainder)
}

export function encodeHuntShareCode(hunt: HuntDefinition): string {
  const minimal = {
    id: hunt.id,
    config: hunt.config,
    summary: hunt.summary,
    stops: hunt.stops,
  }
  const json = JSON.stringify(minimal)
  return toBase64Url(json)
}

export function decodeHuntShareCode(code: string): HuntDefinition {
  const json = fromBase64Url(code)
  const parsed = JSON.parse(json)

  const nowIso = new Date().toISOString()

  const hunt: HuntDefinition = {
    id: parsed.id,
    config: parsed.config,
    summary: parsed.summary,
    stops: parsed.stops,
    status: 'published',
    createdAt: nowIso,
    updatedAt: nowIso,
    safetyChecklist: [],
  }

  return hunt
}

