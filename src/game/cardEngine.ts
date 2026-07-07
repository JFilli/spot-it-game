import { SYMBOLS } from './symbols'
import type { CardData, GridSize, RoundData, SymbolPlacement } from './types'
import { symbolsNeededPerRound, symbolsPerCard } from './types'

function hashString(str: string): number {
  let hash = 2166136261
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function mulberry32(seed: number) {
  return function next() {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function seededRandom(key: string) {
  return mulberry32(hashString(key))
}

function shuffle<T>(items: T[], rng: () => number): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function pickUnique(count: number, rng: () => number): string[] {
  const pool = shuffle(SYMBOLS.map((s) => s.id), rng)
  return pool.slice(0, count)
}

function randomScale(rng: () => number): number {
  const tier = rng()
  if (tier < 0.22) return 0.42 + rng() * 0.22
  if (tier < 0.58) return 0.72 + rng() * 0.38
  return 1.05 + rng() * 0.55
}

function buildCard(symbolIds: string[], gridSize: GridSize, rng: () => number): CardData {
  const cellCount = symbolsPerCard(gridSize)
  const slots = shuffle(Array.from({ length: cellCount }, (_, i) => i), rng)
  const placements: SymbolPlacement[] = symbolIds.map((symbolId, index) => ({
    symbolId,
    slot: slots[index],
    rotation: Math.floor(rng() * 360),
    scale: randomScale(rng),
  }))
  return { placements }
}

export function generateRound(seed: string, roundIndex: number, gridSize: GridSize): RoundData {
  const perCard = symbolsPerCard(gridSize)
  const poolSize = symbolsNeededPerRound(gridSize)
  const rng = seededRandom(`${seed}-${roundIndex}-${gridSize}`)
  const symbols = pickUnique(poolSize, rng)
  const matchSymbol = symbols[0]
  const cardA = buildCard([matchSymbol, ...symbols.slice(1, perCard)], gridSize, rng)
  const cardB = buildCard([matchSymbol, ...symbols.slice(perCard, poolSize)], gridSize, rng)
  return { cardA, cardB, matchSymbol }
}

export function generateGameSeed(): string {
  return crypto.randomUUID()
}

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  const rng = seededRandom(crypto.randomUUID())
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(rng() * chars.length)]
  }
  return code
}
