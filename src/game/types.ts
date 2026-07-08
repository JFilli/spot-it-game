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

export type RoomMode = 'async' | 'race'

export type RaceStatus = 'lobby' | 'countdown' | 'playing' | 'round_result' | 'finished'

export interface RaceState {
  status: RaceStatus
  roundIndex: number
  readyIds: string[]
  wins: Record<string, number>
  roundWinnerId: string | null
  countdownEndsAt: number | null
  roundStartedAt: number | null
}

export interface GameRoom {
  code: string
  seed: string
  gridSize: GridSize
  mode: RoomMode
  players: LobbyPlayer[]
  race: RaceState | null
}

export const TOTAL_ROUNDS = 3
export const MAX_PLAYERS = 10
export const RACE_MAX_PLAYERS = 2
export const RACE_WINS_NEEDED = 2
export const RACE_COUNTDOWN_MS = 3000
export const RACE_RESULT_MS = 2800

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

export function createEmptyRaceState(): RaceState {
  return {
    status: 'lobby',
    roundIndex: 0,
    readyIds: [],
    wins: {},
    roundWinnerId: null,
    countdownEndsAt: null,
    roundStartedAt: null,
  }
}
