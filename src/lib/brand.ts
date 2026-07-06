export const APP_DISPLAY_NAME = 'Quicker Clicker!'
export const APP_NAME = 'Quicker Clicker'
export const APP_SLUG = 'quickerclicker'

/** Public site origin — set VITE_APP_ORIGIN in Vercel to https://quickerclicker.vercel.app */
export function appOrigin(): string {
  const configured = import.meta.env.VITE_APP_ORIGIN
  if (configured) return configured.replace(/\/$/, '')
  if (typeof window !== 'undefined') return window.location.origin
  return 'https://quickerclicker.vercel.app'
}

export function joinUrl(roomCode: string): string {
  return `${appOrigin()}/join/${roomCode}`
}
