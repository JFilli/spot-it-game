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

function randomScale(rng: () => number, gridSize: GridSize): number {
  const tier = rng()
  let scale: number
  if (tier < 0.22) scale = 0.42 + rng() * 0.22
  else if (tier < 0.58) scale = 0.72 + rng() * 0.38
  else scale = 1.05 + rng() * 0.55

  const maxScale = gridSize >= 5 ? 1.12 : gridSize >= 4 ? 1.28 : 1.6
  return Math.min(scale, maxScale)
}

function rotatedBoundsFactor(rotationDeg: number): number {
  const rad = (rotationDeg * Math.PI) / 180
  return Math.abs(Math.cos(rad)) + Math.abs(Math.sin(rad))
}

function maxScaleForRotation(rotationDeg: number, gridSize: GridSize): number {
  const padding = gridSize >= 5 ? 0.78 : gridSize >= 4 ? 0.84 : gridSize >= 3 ? 0.88 : 0.92
  return padding / rotatedBoundsFactor(rotationDeg)
}

function choosePlacement(rng: () => number, gridSize: GridSize): { rotation: number; scale: number } {
  const scale = randomScale(rng, gridSize)

  for (let i = 0; i < 10; i++) {
    const rotation = Math.floor(rng() * 360)
    if (scale <= maxScaleForRotation(rotation, gridSize)) {
      return { rotation, scale }
    }
  }

  const orientations = Array.from({ length: 24 }, (_, index) => index * 15)
  for (const rotation of shuffle(orientations, rng)) {
    if (scale <= maxScaleForRotation(rotation, gridSize)) {
      return { rotation, scale }
    }
  }

  let bestRotation = 0
  let bestFit = 0
  for (const rotation of orientations) {
    const fit = maxScaleForRotation(rotation, gridSize)
    if (fit > bestFit) {
      bestFit = fit
      bestRotation = rotation
    }
  }

  return { rotation: bestRotation, scale: Math.min(scale, bestFit) }
}

function buildCard(symbolIds: string[], gridSize: GridSize, rng: () => number): CardData {
  const cellCount = symbolsPerCard(gridSize)
  const slots = shuffle(Array.from({ length: cellCount }, (_, i) => i), rng)
  const placements: SymbolPlacement[] = symbolIds.map((symbolId, index) => {
    const { rotation, scale } = choosePlacement(rng, gridSize)
    return {
      symbolId,
      slot: slots[index],
      rotation,
      scale,
    }
  })
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
