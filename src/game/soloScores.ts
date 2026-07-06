const SOLO_BEST_KEY = 'spot-it-solo-bests'
const MAX_BESTS = 3

function loadRaw(): number[] {
  try {
    const raw = localStorage.getItem(SOLO_BEST_KEY)
    return raw ? (JSON.parse(raw) as number[]) : []
  } catch {
    return []
  }
}

export function getSoloBestTimes(): number[] {
  return loadRaw().sort((a, b) => a - b).slice(0, MAX_BESTS)
}

export function recordSoloFinish(totalMs: number): number[] {
  const updated = [...loadRaw(), totalMs].sort((a, b) => a - b).slice(0, MAX_BESTS)
  localStorage.setItem(SOLO_BEST_KEY, JSON.stringify(updated))
  return updated
}
