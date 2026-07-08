export const APP_DISPLAY_NAME = 'Quicker Clicker!'
export const APP_NAME = 'Quicker Clicker'
export const APP_SLUG = 'quickerclicker'

/** Stable public URL — invite links must use this, not Vercel preview/deployment URLs. */
export const PRODUCTION_ORIGIN = `https://${APP_SLUG}.vercel.app`

function configuredOrigin(): string | null {
  const configured = import.meta.env.VITE_APP_ORIGIN
  return configured ? configured.replace(/\/$/, '') : null
}

export function isVercelDeploymentUrl(origin: string): boolean {
  try {
    const { hostname } = new URL(origin)
    if (!hostname.endsWith('.vercel.app')) return false
    return hostname !== `${APP_SLUG}.vercel.app`
  } catch {
    return false
  }
}

/** Origin for invite links — always the public production domain on Vercel. */
export function appOrigin(): string {
  const canonical = configuredOrigin() ?? PRODUCTION_ORIGIN

  if (typeof window !== 'undefined') {
    const current = window.location.origin
    if (current.includes('localhost') || current.includes('127.0.0.1')) return current
    if (current.endsWith('.vercel.app')) return canonical
    return current
  }

  return canonical
}

export function joinUrl(roomCode: string): string {
  return `${appOrigin()}/join/${roomCode.toUpperCase()}`
}

export function raceJoinUrl(roomCode: string): string {
  return `${appOrigin()}/race/${roomCode.toUpperCase()}`
}

export function publicGameUrl(): string {
  return configuredOrigin() ?? PRODUCTION_ORIGIN
}
