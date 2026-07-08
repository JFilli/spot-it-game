import { useCallback, useEffect, useState } from 'react'
import { generateGameSeed, generateRoomCode } from '../game/cardEngine'
import {
  bothPlayersReady,
  createLobbyPlayer,
  findPlayer,
  isRoomFull,
  normalizeRoom,
  raceMatchWinnerId,
} from '../game/room'
import { clearPlayProgress } from '../game/playProgress'
import { isPracticeCode } from '../game/practice'
import { getSupabase, isSupabaseConfigured } from '../lib/supabase'
import { storageKeys, readStorage, writeStorage, removeStorage } from '../lib/storage'
import type { GameRoom, GridSize, RaceState, RoomMode } from '../game/types'
import {
  MAX_PLAYERS,
  RACE_COUNTDOWN_MS,
  RACE_MAX_PLAYERS,
  RACE_WINS_NEEDED,
  createEmptyRaceState,
} from '../game/types'

interface StoredSession {
  code: string
  playerId: string
  playerName: string
}

function loadSession(): StoredSession | null {
  try {
    const raw = readStorage(storageKeys.session)
    if (!raw) return null
    const session = JSON.parse(raw) as StoredSession & { playerSlot?: number }
    if (session.playerId) return session as StoredSession
    return null
  } catch {
    return null
  }
}

function saveSession(session: StoredSession) {
  writeStorage(storageKeys.session, JSON.stringify(session))
}

function loadLocalRoom(code: string): GameRoom | null {
  try {
    const raw = readStorage(storageKeys.room(code))
    if (!raw) return null
    return normalizeRoom(JSON.parse(raw) as Record<string, unknown>)
  } catch {
    return null
  }
}

function saveLocalRoom(room: GameRoom) {
  writeStorage(storageKeys.room(room.code), JSON.stringify(room))
}

function toDbPayload(room: GameRoom) {
  return {
    seed: room.seed,
    grid_size: room.gridSize,
    mode: room.mode,
    players: room.players,
    race: room.race,
  }
}

export function clearSession() {
  removeStorage(storageKeys.session)
}

export function useGameRoom(code: string | undefined) {
  const [room, setRoom] = useState<GameRoom | null>(null)
  const [playerId, setPlayerId] = useState<string | null>(null)
  const [playerName, setPlayerName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = getSupabase()
  const currentPlayer = room && playerId ? findPlayer(room, playerId) : undefined

  const fetchRoom = useCallback(async () => {
    if (!code) return null
    if (isPracticeCode(code) || !isSupabaseConfigured) {
      return loadLocalRoom(code)
    }
    const { data, error: fetchError } = await supabase!
      .from('game_rooms')
      .select('*')
      .eq('code', code.toUpperCase())
      .maybeSingle()
    if (fetchError) throw fetchError
    if (!data) return null
    return normalizeRoom(data as Record<string, unknown>)
  }, [code, supabase])

  const persistRoom = useCallback(
    async (nextRoom: GameRoom) => {
      if (!isSupabaseConfigured) {
        saveLocalRoom(nextRoom)
        setRoom({ ...nextRoom, players: [...nextRoom.players], race: nextRoom.race ? { ...nextRoom.race } : null })
        return nextRoom
      }

      const { data, error: updateError } = await supabase!
        .from('game_rooms')
        .update(toDbPayload(nextRoom))
        .eq('code', nextRoom.code.toUpperCase())
        .select()
        .single()

      if (updateError) throw updateError
      const updated = normalizeRoom(data as Record<string, unknown>)
      setRoom(updated)
      return updated
    },
    [supabase],
  )

  useEffect(() => {
    if (!code) {
      setLoading(false)
      return
    }

    const session = loadSession()
    if (session?.code === code.toUpperCase()) {
      setPlayerId(session.playerId)
      setPlayerName(session.playerName)
    }

    fetchRoom()
      .then((data) => {
        setRoom(data)
        setLoading(false)
      })
      .catch((err: Error) => {
        setError(err.message)
        setLoading(false)
      })
  }, [code, fetchRoom])

  useEffect(() => {
    if (!code) return

    if (isPracticeCode(code) || !isSupabaseConfigured) {
      const interval = setInterval(() => {
        const data = loadLocalRoom(code)
        if (data) setRoom(data)
      }, 500)
      return () => clearInterval(interval)
    }

    const channel = supabase!
      .channel(`room-${code}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'game_rooms', filter: `code=eq.${code.toUpperCase()}` },
        (payload) => {
          const normalized = normalizeRoom(payload.new as Record<string, unknown>)
          if (normalized) setRoom(normalized)
        },
      )
      .subscribe()

    const interval = setInterval(() => {
      fetchRoom().then((data) => {
        if (data) setRoom(data)
      })
    }, 1500)

    return () => {
      clearInterval(interval)
      supabase!.removeChannel(channel)
    }
  }, [code, supabase, fetchRoom])

  const createRoom = useCallback(
    async (name: string, gridSize: GridSize, mode: RoomMode = 'async') => {
      const newCode = generateRoomCode()
      const seed = generateGameSeed()
      const host = createLobbyPlayer(name)
      const newRoom: GameRoom = {
        code: newCode,
        seed,
        gridSize,
        mode,
        players: [host],
        race: mode === 'race' ? createEmptyRaceState() : null,
      }

      if (!isSupabaseConfigured) {
        saveLocalRoom(newRoom)
        const session = { code: newCode, playerId: host.id, playerName: name }
        saveSession(session)
        setPlayerId(host.id)
        setPlayerName(name)
        setRoom(newRoom)
        return newCode
      }

      const { data, error: createError } = await supabase!
        .from('game_rooms')
        .insert({
          code: newCode,
          seed,
          grid_size: gridSize,
          mode,
          players: newRoom.players,
          race: newRoom.race,
        })
        .select()
        .single()

      if (createError) throw createError
      const session = { code: newCode, playerId: host.id, playerName: name }
      saveSession(session)
      setPlayerId(host.id)
      setPlayerName(name)
      setRoom(normalizeRoom(data as Record<string, unknown>))
      return newCode
    },
    [supabase],
  )

  const joinRoom = useCallback(
    async (joinCode: string, name: string) => {
      const upper = joinCode.toUpperCase()

      const loadRoomData = async (): Promise<GameRoom> => {
        if (!isSupabaseConfigured) {
          const roomData = loadLocalRoom(upper)
          if (!roomData) throw new Error('Game not found')
          return roomData
        }
        const existing = await supabase!.from('game_rooms').select('*').eq('code', upper).maybeSingle()
        if (existing.error) throw existing.error
        if (!existing.data) throw new Error('Game not found')
        const roomData = normalizeRoom(existing.data as Record<string, unknown>)
        if (!roomData) throw new Error('Game not found')
        return roomData
      }

      const session = loadSession()
      if (session?.code === upper && session.playerId) {
        const roomData = await loadRoomData()
        const returning = findPlayer(roomData, session.playerId)
        if (returning) {
          saveSession(session)
          setPlayerId(session.playerId)
          setPlayerName(session.playerName)
          setRoom(roomData)
          return
        }
      }

      const roomData = await loadRoomData()
      if (isRoomFull(roomData)) {
        const cap = roomData.mode === 'race' ? RACE_MAX_PLAYERS : MAX_PLAYERS
        throw new Error(
          roomData.mode === 'race'
            ? 'This race is full (2 players max)'
            : `This lobby is full (${cap} players max)`,
        )
      }

      const player = createLobbyPlayer(name)
      roomData.players = [...roomData.players, player]
      if (roomData.mode === 'race' && roomData.race) {
        roomData.race = {
          ...roomData.race,
          readyIds: roomData.race.readyIds.filter((id) => id !== player.id),
        }
      }

      if (!isSupabaseConfigured) {
        const newSession = { code: upper, playerId: player.id, playerName: name }
        saveLocalRoom(roomData)
        saveSession(newSession)
        setPlayerId(player.id)
        setPlayerName(name)
        setRoom({ ...roomData })
        return
      }

      const { data, error: updateError } = await supabase!
        .from('game_rooms')
        .update(toDbPayload(roomData))
        .eq('code', upper)
        .select()
        .single()

      if (updateError) throw updateError
      const newSession = { code: upper, playerId: player.id, playerName: name }
      saveSession(newSession)
      setPlayerId(player.id)
      setPlayerName(name)
      setRoom(normalizeRoom(data as Record<string, unknown>))
    },
    [supabase],
  )

  const submitTimes = useCallback(
    async (times: number[]) => {
      if (!code || !playerId) return
      const upper = code.toUpperCase()

      if (isPracticeCode(upper) || !isSupabaseConfigured) {
        const roomData = loadLocalRoom(upper)
        if (!roomData) return
        const player = findPlayer(roomData, playerId)
        if (!player) return
        player.times = times
        player.done = true
        player.quit = false
        saveLocalRoom(roomData)
        setRoom({ ...roomData, players: [...roomData.players] })
        return
      }

      const roomData = await fetchRoom()
      if (!roomData) return
      const updatedPlayers = roomData.players.map((p) =>
        p.id === playerId ? { ...p, times, done: true, quit: false } : p,
      )

      const { data, error: updateError } = await supabase!
        .from('game_rooms')
        .update({ players: updatedPlayers })
        .eq('code', upper)
        .select()
        .single()

      if (updateError) throw updateError
      const updated = normalizeRoom(data as Record<string, unknown>)
      setRoom(updated)
    },
    [supabase, code, playerId, fetchRoom],
  )

  const quitGame = useCallback(async () => {
    if (!code || !playerId) return
    const upper = code.toUpperCase()
    if (isPracticeCode(upper)) return

    clearPlayProgress(upper, playerId)

    if (!isSupabaseConfigured) {
      const roomData = loadLocalRoom(upper)
      if (!roomData) return
      const player = findPlayer(roomData, playerId)
      if (!player) return
      player.quit = true
      player.done = true
      player.times = null
      if (roomData.mode === 'race' && roomData.race && roomData.race.status !== 'finished') {
        roomData.race = { ...roomData.race, status: 'finished' }
      }
      saveLocalRoom(roomData)
      setRoom({ ...roomData, players: [...roomData.players] })
      return
    }

    const roomData = await fetchRoom()
    if (!roomData) return
    const updatedPlayers = roomData.players.map((p) =>
      p.id === playerId ? { ...p, quit: true, done: true, times: null } : p,
    )
    const nextRoom: GameRoom = {
      ...roomData,
      players: updatedPlayers,
      race:
        roomData.mode === 'race' && roomData.race && roomData.race.status !== 'finished'
          ? { ...roomData.race, status: 'finished' }
          : roomData.race,
    }

    await persistRoom(nextRoom)
  }, [code, playerId, fetchRoom, persistRoom])

  const setRaceReady = useCallback(async () => {
    if (!code || !playerId) return
    const roomData = await fetchRoom()
    if (!roomData?.race || roomData.mode !== 'race') return
    if (roomData.race.status !== 'lobby' && roomData.race.status !== 'finished') return

    const readyIds = roomData.race.readyIds.includes(playerId)
      ? roomData.race.readyIds
      : [...roomData.race.readyIds, playerId]

    let race: RaceState = {
      ...roomData.race,
      status: 'lobby',
      readyIds,
      roundWinnerId: null,
    }

    const tentative: GameRoom = { ...roomData, race }
    if (bothPlayersReady(tentative)) {
      race = {
        ...race,
        status: 'countdown',
        roundIndex: 0,
        wins: Object.fromEntries(roomData.players.map((p) => [p.id, 0])),
        countdownEndsAt: Date.now() + RACE_COUNTDOWN_MS,
        roundStartedAt: null,
        roundWinnerId: null,
      }
    }

    await persistRoom({ ...roomData, race })
  }, [code, playerId, fetchRoom, persistRoom])

  const beginRacePlaying = useCallback(async () => {
    if (!code) return
    const roomData = await fetchRoom()
    if (!roomData?.race || roomData.race.status !== 'countdown') return
    if (roomData.race.countdownEndsAt && Date.now() < roomData.race.countdownEndsAt) return

    await persistRoom({
      ...roomData,
      race: {
        ...roomData.race,
        status: 'playing',
        countdownEndsAt: null,
        roundStartedAt: Date.now(),
        roundWinnerId: null,
      },
    })
  }, [code, fetchRoom, persistRoom])

  const claimRaceRound = useCallback(async () => {
    if (!code || !playerId) return false
    const roomData = await fetchRoom()
    if (!roomData?.race || roomData.race.status !== 'playing') return false
    if (roomData.race.roundWinnerId) return false

    const wins = { ...roomData.race.wins }
    wins[playerId] = (wins[playerId] ?? 0) + 1
    const matchOver = wins[playerId] >= RACE_WINS_NEEDED

    const race: RaceState = {
      ...roomData.race,
      wins,
      roundWinnerId: playerId,
      status: matchOver ? 'finished' : 'round_result',
      readyIds: matchOver ? [] : roomData.race.readyIds,
    }

    await persistRoom({ ...roomData, race })
    return true
  }, [code, playerId, fetchRoom, persistRoom])

  const advanceRaceRound = useCallback(async () => {
    if (!code) return
    const roomData = await fetchRoom()
    if (!roomData?.race || roomData.race.status !== 'round_result') return
    if (raceMatchWinnerId(roomData.race)) return

    await persistRoom({
      ...roomData,
      race: {
        ...roomData.race,
        status: 'countdown',
        roundIndex: roomData.race.roundIndex + 1,
        roundWinnerId: null,
        countdownEndsAt: Date.now() + RACE_COUNTDOWN_MS,
        roundStartedAt: null,
      },
    })
  }, [code, fetchRoom, persistRoom])

  const rematchRace = useCallback(async () => {
    if (!code || !playerId) return
    const roomData = await fetchRoom()
    if (!roomData?.race || roomData.mode !== 'race') return

    const wins = Object.fromEntries(roomData.players.map((p) => [p.id, 0]))
    await persistRoom({
      ...roomData,
      players: roomData.players.map((p) => ({ ...p, quit: false, done: false, times: null })),
      race: {
        ...createEmptyRaceState(),
        wins,
        readyIds: [playerId],
      },
      seed: generateGameSeed(),
    })
  }, [code, playerId, fetchRoom, persistRoom])

  return {
    room,
    playerId,
    playerName,
    currentPlayer,
    loading,
    error,
    createRoom,
    joinRoom,
    submitTimes,
    quitGame,
    setRaceReady,
    beginRacePlaying,
    claimRaceRound,
    advanceRaceRound,
    rematchRace,
    setPlayerName,
  }
}
