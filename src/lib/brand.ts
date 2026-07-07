export const APP_DISPLAY_NAME = 'Quicker Clicker!'
export const APP_NAME = 'Quicker Clicker'
export const APP_SLUG = 'quickerclicker'

/** Invite links use the same origin as the page you're on — the URL that actually loads the game. */
export function appOrigin(): string {
  if (typeof window !== 'undefined') return window.location.origin
  const configured = import.meta.env.VITE_APP_ORIGIN
  if (configured) return configured.replace(/\/$/, '')
  return `https://${APP_SLUG}.vercel.app`
}

export function joinUrl(roomCode: string): string {
  return `${appOrigin()}/join/${roomCode.toUpperCase()}`
}
