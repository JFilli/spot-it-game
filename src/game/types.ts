export interface SymbolPlacement {
  symbolId: string
  slot: number
  rotation: number
  scale: number
}

export interface CardData {
  placements: SymbolPlacement[]
}

export interface RoundData {
  cardA: CardData
  cardB: CardData
  matchSymbol: string
}

export interface LobbyPlayer {
  id: string
  name: string
  times: number[] | null
  done: boolean
  quit?: boolean
}

export interface GameRoom {
  code: string
  seed: string
  gridSize: GridSize
  players: LobbyPlayer[]
}

export const TOTAL_ROUNDS = 5
export const MAX_PLAYERS = 10

export const GRID_OPTIONS = [2, 3, 4, 5] as const
export type GridSize = (typeof GRID_OPTIONS)[number]

export function symbolsPerCard(gridSize: GridSize): number {
  return gridSize * gridSize
}

export function symbolsNeededPerRound(gridSize: GridSize): number {
  return symbolsPerCard(gridSize) * 2 - 1
}

export function gridSizeLabel(gridSize: GridSize): string {
  return `${gridSize}×${gridSize}`
}
