import { generateRound } from './cardEngine'
import { getSymbol } from './symbols'
import type { GridSize } from './types'

export function roundMatchEmoji(seed: string, roundIndex: number, gridSize: GridSize): string {
  const round = generateRound(seed, roundIndex, gridSize)
  return getSymbol(round.matchSymbol).emoji
}
