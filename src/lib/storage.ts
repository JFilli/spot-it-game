import { APP_SLUG } from './brand'

const LEGACY_SLUG = 'spot-it'

export const storageKeys = {
  session: `${APP_SLUG}-session`,
  playerName: `${APP_SLUG}-player-name`,
  room: (code: string) => `${APP_SLUG}-room-${code.toUpperCase()}`,
  play: (code: string, playerId: string) => `${APP_SLUG}-play-${code.toUpperCase()}-${playerId}`,
  soloBests: `${APP_SLUG}-solo-bests`,
  devicePlayerId: `${APP_SLUG}-device-player-id`,
}

function legacyKey(key: string): string {
  return key.replace(APP_SLUG, LEGACY_SLUG)
}

export function readStorage(key: string): string | null {
  const value = localStorage.getItem(key)
  if (value !== null) return value

  const migrated = localStorage.getItem(legacyKey(key))
  if (migrated !== null) {
    localStorage.setItem(key, migrated)
    localStorage.removeItem(legacyKey(key))
    return migrated
  }

  return null
}

export function writeStorage(key: string, value: string): void {
  localStorage.setItem(key, value)
}

export function removeStorage(key: string): void {
  localStorage.removeItem(key)
  localStorage.removeItem(legacyKey(key))
}
