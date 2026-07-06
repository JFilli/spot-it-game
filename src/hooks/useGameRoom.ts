import { useCallback, useEffect, useState } from 'react'
import { generateGameSeed, generateRoomCode } from '../game/cardEngine'
import { createLobbyPlayer,
  findPlayer,
  findPlayerByName,
  isRoomFull,
  normalizeRoom,
} from '../game/room'
import { recordLobbyFinish } from '../game/lobbyHistory'
import { isPracticeCode } from '../game/practice'
import { getSupabase, isSupabaseConfigured } from '../lib/supabase'
import type { GameRoom } from '../game/types'
import { MAX_PLAYERS } from '../game/types'

const STORAGE_KEY = 'spot-it-session'

interface StoredSession {
  code: string
  playerId: string
  playerName: string
}

function loadSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const session = JSON.parse(raw) as StoredSession & { playerSlot?: number }
    if (session.playerId) return session as StoredSession
    return null
  } catch {
    return null
  }
}

function saveSession(session: StoredSession) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

function loadLocalRoom(code: string): GameRoom | null {
  try {
    const raw = localStorage.getItem(`spot-it-room-${code.toUpperCase()}`)
    if (!raw) return null
    return normalizeRoom(JSON.parse(raw) as Record<string, unknown>)
  } catch {
    return null
  }
}

function saveLocalRoom(room: GameRoom) {
  localStorage.setItem(`spot-it-room-${room.code}`, JSON.stringify(room))
}

export function clearSession() {
  localStorage.removeItem(STORAGE_KEY)
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
      }, 1000)
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
    }, 3000)

    return () => {
      clearInterval(interval)
      supabase!.removeChannel(channel)
    }
  }, [code, supabase, fetchRoom])

  const createRoom = useCallback(
    async (name: string) => {
      const newCode = generateRoomCode()
      const seed = generateGameSeed()
      const host = createLobbyPlayer(name)
      const newRoom: GameRoom = { code: newCode, seed, players: [host] }

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
        .insert({ code: newCode, seed, players: newRoom.players })
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

      const applyJoin = (roomData: GameRoom): StoredSession => {
        const existing = findPlayerByName(roomData, name)
        if (existing) {
          return { code: upper, playerId: existing.id, playerName: name }
        }
        if (isRoomFull(roomData)) {
          throw new Error(`This lobby is full (${MAX_PLAYERS} players max)`)
        }
        const player = createLobbyPlayer(name)
        roomData.players.push(player)
        return { code: upper, playerId: player.id, playerName: name }
      }

      if (!isSupabaseConfigured) {
        const roomData = loadLocalRoom(upper)
        if (!roomData) throw new Error('Game not found')
        const session = applyJoin(roomData)
        saveLocalRoom(roomData)
        saveSession(session)
        setPlayerId(session.playerId)
        setPlayerName(name)
        setRoom({ ...roomData })
        return
      }

      const existing = await supabase!.from('game_rooms').select('*').eq('code', upper).maybeSingle()
      if (existing.error) throw existing.error
      if (!existing.data) throw new Error('Game not found')

      const roomData = normalizeRoom(existing.data as Record<string, unknown>)
      if (!roomData) throw new Error('Game not found')

      const existingPlayer = findPlayerByName(roomData, name)
      if (existingPlayer) {
        const session = { code: upper, playerId: existingPlayer.id, playerName: name }
        saveSession(session)
        setPlayerId(existingPlayer.id)
        setPlayerName(name)
        setRoom(roomData)
        return
      }

      if (isRoomFull(roomData)) {
        throw new Error(`This lobby is full (${MAX_PLAYERS} players max)`)
      }

      const player = createLobbyPlayer(name)
      const updatedPlayers = [...roomData.players, player]
      const { data, error: updateError } = await supabase!
        .from('game_rooms')
        .update({ players: updatedPlayers })
        .eq('code', upper)
        .select()
        .single()

      if (updateError) throw updateError
      const session = { code: upper, playerId: player.id, playerName: name }
      saveSession(session)
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
        saveLocalRoom(roomData)
        setRoom({ ...roomData, players: [...roomData.players] })
        if (!isPracticeCode(upper)) {
          recordLobbyFinish(upper, player.name, times, roomData.players.length)
        }
        return
      }

      const roomData = await fetchRoom()
      if (!roomData) return
      const updatedPlayers = roomData.players.map((p) =>
        p.id === playerId ? { ...p, times, done: true } : p,
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
      const player = updated?.players.find((p) => p.id === playerId)
      if (updated && player) {
        recordLobbyFinish(upper, player.name, times, updated.players.length)
      }
    },
    [supabase, code, playerId, fetchRoom],
  )

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
    setPlayerName,
  }
}
