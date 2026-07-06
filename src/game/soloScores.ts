import { storageKeys, readStorage, writeStorage } from '../lib/storage'

function loadRaw(): number[] {
  try {
    const raw = readStorage(storageKeys.soloBests)
    return raw ? (JSON.parse(raw) as number[]) : []
  } catch {
    return []
  }
}

export function getSoloBestTimes(): number[] {
  return loadRaw().sort((a, b) => a - b).slice(0, 3)
}

export function recordSoloFinish(totalMs: number): number[] {
  const updated = [...loadRaw(), totalMs].sort((a, b) => a - b).slice(0, 3)
  writeStorage(storageKeys.soloBests, JSON.stringify(updated))
  return updated
}
