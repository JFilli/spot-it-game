import { PRACTICE_CODE } from './practice'
import { totalTime } from './room'

export interface LobbyHistoryEntry {
  code: string
  playerName: string
  lastVisited: number
  playerCount: number
  yourTimeMs: number
}

const HISTORY_KEY = 'spot-it-lobby-history'
const MAX_HISTORY = 20

function loadHistoryRaw(): LobbyHistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    return raw ? (JSON.parse(raw) as LobbyHistoryEntry[]) : []
  } catch {
    return []
  }
}

export function getLobbyHistory(): LobbyHistoryEntry[] {
  return loadHistoryRaw()
    .filter((e) => e.code !== PRACTICE_CODE && e.yourTimeMs > 0)
    .sort((a, b) => b.lastVisited - a.lastVisited)
}

export function recordLobbyFinish(
  code: string,
  playerName: string,
  times: number[],
  playerCount: number,
) {
  if (code === PRACTICE_CODE) return

  const yourTimeMs = totalTime(times)
  if (yourTimeMs === null) return

  const history = loadHistoryRaw()
  const entry: LobbyHistoryEntry = {
    code: code.toUpperCase(),
    playerName,
    lastVisited: Date.now(),
    playerCount,
    yourTimeMs,
  }

  const updated = [entry, ...history.filter((e) => e.code !== entry.code)].slice(0, MAX_HISTORY)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated))
}

export function removeLobbyFromHistory(code: string) {
  const updated = loadHistoryRaw().filter((e) => e.code !== code.toUpperCase())
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated))
}
