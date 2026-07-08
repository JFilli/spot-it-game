import type { GameRoom, LobbyPlayer, RaceState, RoomMode } from './types'
import {
  GRID_OPTIONS,
  MAX_PLAYERS,
  RACE_MAX_PLAYERS,
  RACE_WINS_NEEDED,
  TOTAL_ROUNDS,
  createEmptyRaceState,
  type GridSize,
} from './types'

function parseGridSize(raw: unknown): GridSize {
  const size = Number(raw)
  return GRID_OPTIONS.includes(size as GridSize) ? (size as GridSize) : 3
}

function parseMode(raw: unknown): RoomMode {
  return raw === 'race' ? 'race' : 'async'
}

function parseRace(raw: unknown): RaceState | null {
  if (!raw || typeof raw !== 'object') return null
  const race = raw as Partial<RaceState>
  const empty = createEmptyRaceState()
  return {
    status: race.status ?? empty.status,
    roundIndex: typeof race.roundIndex === 'number' ? race.roundIndex : empty.roundIndex,
    readyIds: Array.isArray(race.readyIds) ? race.readyIds.map(String) : empty.readyIds,
    wins: race.wins && typeof race.wins === 'object' ? race.wins : empty.wins,
    roundWinnerId: race.roundWinnerId ?? null,
    countdownEndsAt: typeof race.countdownEndsAt === 'number' ? race.countdownEndsAt : null,
    roundStartedAt: typeof race.roundStartedAt === 'number' ? race.roundStartedAt : null,
    rematchIds: Array.isArray(race.rematchIds) ? race.rematchIds.map(String) : empty.rematchIds,
    rematchDeclinedBy: race.rematchDeclinedBy ?? null,
  }
}

export function createLobbyPlayer(name: string): LobbyPlayer {
  return {
    id: crypto.randomUUID(),
    name,
    times: null,
    done: false,
    quit: false,
  }
}

export function totalTime(times: number[] | null): number | null {
  if (!times || times.length === 0) return null
  return times.reduce((sum, t) => sum + t, 0)
}

export function findPlayer(room: GameRoom, playerId: string): LobbyPlayer | undefined {
  return room.players.find((p) => p.id === playerId)
}

export function isRoomFull(room: GameRoom): boolean {
  const cap = room.mode === 'race' ? RACE_MAX_PLAYERS : MAX_PLAYERS
  return room.players.length >= cap
}

export function finishedPlayers(room: GameRoom): LobbyPlayer[] {
  return room.players
    .filter((p) => p.done && !p.quit && p.times && p.times.length >= TOTAL_ROUNDS)
    .sort((a, b) => (totalTime(a.times) ?? Infinity) - (totalTime(b.times) ?? Infinity))
    .slice(0, MAX_PLAYERS)
}

export function quitPlayers(room: GameRoom): LobbyPlayer[] {
  return room.players.filter((p) => p.quit)
}

export function hasCompletedGame(player: LobbyPlayer): boolean {
  return Boolean(player.done && !player.quit && player.times && player.times.length >= TOTAL_ROUNDS)
}

export function playingPlayers(room: GameRoom): LobbyPlayer[] {
  return room.players.filter((p) => !p.done)
}

export function allPlayersDone(room: GameRoom): boolean {
  return room.players.length > 0 && room.players.every((p) => p.done)
}

export function getLeader(room: GameRoom): LobbyPlayer | null {
  const ranked = finishedPlayers(room)
  return ranked[0] ?? null
}

export function getPlayerRank(room: GameRoom, playerId: string): number | null {
  const ranked = finishedPlayers(room)
  const index = ranked.findIndex((p) => p.id === playerId)
  return index >= 0 ? index + 1 : null
}

export function getRaceWins(race: RaceState | null, playerId: string): number {
  if (!race) return 0
  return race.wins[playerId] ?? 0
}

export function raceMatchWinnerId(race: RaceState | null): string | null {
  if (!race) return null
  for (const [playerId, wins] of Object.entries(race.wins)) {
    if (wins >= RACE_WINS_NEEDED) return playerId
  }
  return null
}

export function bothPlayersReady(room: GameRoom): boolean {
  if (!room.race || room.players.length < RACE_MAX_PLAYERS) return false
  return room.players.every((p) => room.race!.readyIds.includes(p.id))
}

/** Migrate legacy two-player room format from localStorage */
export function normalizeRoom(raw: Record<string, unknown>): GameRoom | null {
  const mode = parseMode(raw.mode)
  const race = mode === 'race' ? parseRace(raw.race) ?? createEmptyRaceState() : null

  if (Array.isArray(raw.players)) {
    const players = (raw.players as LobbyPlayer[]).map((p) => ({
      ...p,
      quit: p.quit ?? false,
    }))
    const gridSize = parseGridSize(raw.grid_size ?? raw.gridSize)
    return {
      code: String(raw.code),
      seed: String(raw.seed),
      players,
      gridSize,
      mode,
      race,
    }
  }

  const code = raw.code as string
  const seed = raw.seed as string
  if (!code || !seed) return null

  const players: LobbyPlayer[] = []

  if (raw.player1_name) {
    players.push({
      id: crypto.randomUUID(),
      name: raw.player1_name as string,
      times: (raw.player1_times as number[] | null) ?? null,
      done: Boolean(raw.player1_done),
    })
  }

  if (raw.player2_name) {
    players.push({
      id: crypto.randomUUID(),
      name: raw.player2_name as string,
      times: (raw.player2_times as number[] | null) ?? null,
      done: Boolean(raw.player2_done),
    })
  }

  return { code, seed, gridSize: 3, mode: 'async', players, race: null }
}
