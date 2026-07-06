export interface PlayProgress {
  roundIndex: number
  times: number[]
  phase: 'playing' | 'summary'
  roundStartedAt: number
  lastRoundTime: number
}

function storageKey(code: string, playerId: string): string {
  return `spot-it-play-${code.toUpperCase()}-${playerId}`
}

export function loadPlayProgress(code: string, playerId: string): PlayProgress | null {
  try {
    const raw = localStorage.getItem(storageKey(code, playerId))
    if (!raw) return null
    return JSON.parse(raw) as PlayProgress
  } catch {
    return null
  }
}

export function savePlayProgress(code: string, playerId: string, progress: PlayProgress): void {
  localStorage.setItem(storageKey(code, playerId), JSON.stringify(progress))
}

export function clearPlayProgress(code: string, playerId: string): void {
  localStorage.removeItem(storageKey(code, playerId))
}
