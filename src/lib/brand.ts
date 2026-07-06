export const APP_DISPLAY_NAME = 'Quicker Clicker!'
export const APP_NAME = 'Quicker Clicker'
export const APP_SLUG = 'quickerclicker'

const DEFAULT_PRODUCTION_ORIGIN = `https://${APP_SLUG}.vercel.app`

function configuredOrigin(): string | null {
  const configured = import.meta.env.VITE_APP_ORIGIN
  return configured ? configured.replace(/\/$/, '') : null
}

/** Vercel preview/deployment URLs (with hash in hostname) don't work for friends. */
export function isVercelPreviewUrl(origin: string): boolean {
  try {
    const { hostname } = new URL(origin)
    if (!hostname.endsWith('.vercel.app')) return false
    return hostname !== `${APP_SLUG}.vercel.app`
  } catch {
    return false
  }
}

function canonicalOrigin(): string {
  return configuredOrigin() ?? DEFAULT_PRODUCTION_ORIGIN
}

/** Origin used in invite links — always the stable public URL, not a Vercel preview link. */
export function appOrigin(): string {
  if (typeof window !== 'undefined') {
    const current = window.location.origin
    if (isVercelPreviewUrl(current)) return canonicalOrigin()
    if (current.startsWith('http://localhost') || current.startsWith('http://127.0.0.1')) {
      return current
    }
    return current
  }
  return canonicalOrigin()
}

export function joinUrl(roomCode: string): string {
  return `${appOrigin()}/join/${roomCode.toUpperCase()}`
}

export function publicGameUrl(): string {
  return canonicalOrigin()
}
