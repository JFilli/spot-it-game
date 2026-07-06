const NAME_KEY = 'spot-it-player-name'

export function loadSavedName(): string {
  try {
    const saved = localStorage.getItem(NAME_KEY)
    if (saved) return saved
    const raw = localStorage.getItem('spot-it-session')
    if (!raw) return ''
    const session = JSON.parse(raw) as { playerName?: string }
    return session.playerName ?? ''
  } catch {
    return ''
  }
}

export function savePlayerName(name: string) {
  localStorage.setItem(NAME_KEY, name)
}
