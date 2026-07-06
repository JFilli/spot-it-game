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
}

export interface GameRoom {
  code: string
  seed: string
  players: LobbyPlayer[]
}

export const TOTAL_ROUNDS = 5
export const MAX_PLAYERS = 10
