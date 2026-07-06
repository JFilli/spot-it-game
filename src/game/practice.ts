import { generateGameSeed } from './cardEngine'
import { createLobbyPlayer } from './room'
import type { GameRoom } from './types'

export const PRACTICE_CODE = 'PRACTICE'

export function createPracticeRoom(playerName: string): GameRoom {
  return {
    code: PRACTICE_CODE,
    seed: generateGameSeed(),
    players: [createLobbyPlayer(playerName)],
  }
}

export function savePracticeRoom(room: GameRoom, playerId: string, playerName: string) {
  localStorage.setItem(`spot-it-room-${PRACTICE_CODE}`, JSON.stringify(room))
  localStorage.setItem(
    'spot-it-session',
    JSON.stringify({ code: PRACTICE_CODE, playerId, playerName }),
  )
}

export function clearPracticeRoom() {
  localStorage.removeItem(`spot-it-room-${PRACTICE_CODE}`)
}

export function startPracticeSession(playerName: string): string {
  const player = createLobbyPlayer(playerName)
  const room: GameRoom = {
    code: PRACTICE_CODE,
    seed: generateGameSeed(),
    players: [player],
  }
  savePracticeRoom(room, player.id, playerName)
  return `?attempt=${Date.now()}`
}
