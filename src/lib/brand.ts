export const APP_DISPLAY_NAME = 'Quicker Clicker!'
export const APP_NAME = 'Quicker Clicker'
export const APP_SLUG = 'quickerclicker'

/** Use the live site URL in the browser so shared links always work. */
export function appOrigin(): string {
  if (typeof window !== 'undefined') return window.location.origin
  const configured = import.meta.env.VITE_APP_ORIGIN
  if (configured) return configured.replace(/\/$/, '')
  return 'https://quickerclicker.vercel.app'
}

export function joinUrl(roomCode: string): string {
  return `${appOrigin()}/join/${roomCode.toUpperCase()}`
}
