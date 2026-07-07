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

export function getSoloBestTimes(gridSize: GridSize): number[] {
  return loadRaw(gridSize).sort((a, b) => a - b).slice(0, 3)
}

export function recordSoloFinish(gridSize: GridSize, totalMs: number): number[] {
  const updated = [...loadRaw(gridSize), totalMs].sort((a, b) => a - b).slice(0, 3)
  writeStorage(`${storageKeys.soloBests}-${gridSize}`, JSON.stringify(updated))
  return updated
}
