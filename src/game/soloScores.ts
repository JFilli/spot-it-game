import type { GridSize } from '../game/types'
import { storageKeys, readStorage, writeStorage } from '../lib/storage'

function loadRaw(gridSize: GridSize): number[] {
  try {
    const raw = readStorage(`${storageKeys.soloBests}-${gridSize}`)
    return raw ? (JSON.parse(raw) as number[]) : []
  } catch {
    return []
  }
}

export function getSoloBestTime(gridSize: GridSize): number | null {
  const sorted = loadRaw(gridSize).sort((a, b) => a - b)
  return sorted[0] ?? null
}

export function recordSoloFinish(gridSize: GridSize, totalMs: number): number {
  const current = getSoloBestTime(gridSize)
  const best = current === null ? totalMs : Math.min(current, totalMs)
  writeStorage(`${storageKeys.soloBests}-${gridSize}`, JSON.stringify([best]))
  return best
}
