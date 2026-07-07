import { generateGameSeed } from './cardEngine'
import { createLobbyPlayer } from './room'
import type { GridSize } from './types'
import { storageKeys, writeStorage, removeStorage } from '../lib/storage'
import type { GameRoom } from './types'

export const PRACTICE_CODE = 'PRACTICE'

export function isPracticeCode(code: string): boolean {
  return code.toUpperCase() === PRACTICE_CODE
}

export function createPracticeRoom(playerName: string, gridSize: GridSize): GameRoom {
  return {
    code: PRACTICE_CODE,
    seed: generateGameSeed(),
    gridSize,
    players: [createLobbyPlayer(playerName)],
  }
}

export function savePracticeRoom(room: GameRoom, playerId: string, playerName: string) {
  writeStorage(storageKeys.room(PRACTICE_CODE), JSON.stringify(room))
  writeStorage(storageKeys.session, JSON.stringify({ code: PRACTICE_CODE, playerId, playerName }))
}

export function clearPracticeRoom() {
  removeStorage(storageKeys.room(PRACTICE_CODE))
}

export function startPracticeSession(playerName: string, gridSize: GridSize): string {
  const player = createLobbyPlayer(playerName)
  const room: GameRoom = {
    code: PRACTICE_CODE,
    seed: generateGameSeed(),
    gridSize,
    players: [player],
  }
  savePracticeRoom(room, player.id, playerName)
  return `?attempt=${Date.now()}`
}
