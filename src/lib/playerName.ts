import { storageKeys, readStorage, writeStorage } from './storage'

export function loadSavedName(): string {
  try {
    const saved = readStorage(storageKeys.playerName)
    if (saved) return saved

    const raw = readStorage(storageKeys.session)
    if (!raw) return ''
    const session = JSON.parse(raw) as { playerName?: string }
    return session.playerName ?? ''
  } catch {
    return ''
  }
}

export function savePlayerName(name: string) {
  writeStorage(storageKeys.playerName, name)
}
