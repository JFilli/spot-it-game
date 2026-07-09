import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { BackButton } from '../components/BackButton'
import { RulesBlurb } from '../components/RulesBlurb'
import { useGameRoom } from '../hooks/useGameRoom'
import { bothPlayersReady, getRaceWins } from '../game/room'
import { isSupabaseConfigured } from '../lib/supabase'
import { canNativeShare, shareInviteLink } from '../lib/share'
import { isVercelDeploymentUrl, publicGameUrl, raceJoinUrl } from '../lib/brand'
import { loadSavedName, savePlayerName } from '../lib/playerName'
import { RACE_MAX_PLAYERS, RACE_WINS_NEEDED, gridSizeLabel } from '../game/types'

export function RaceLobby() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const { room, playerId, currentPlayer, loading, error, joinRoom, setRaceReady } = useGameRoom(code)
  const [shareFeedback, setShareFeedback] = useState<string | null>(null)
  const [joinName, setJoinName] = useState(loadSavedName())
  const [joining, setJoining] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)
  const [readyBusy, setReadyBusy] = useState(false)

  useEffect(() => {
    if (!room?.race || !playerId) return
    if (room.race.status === 'countdown' || room.race.status === 'playing' || room.race.status === 'round_result') {
      navigate(`/race/${room.code}/play`, { replace: true })
    }
  }, [room, playerId, navigate])

  const handleJoinLobby = async () => {
    if (!code || !joinName.trim()) return
    setJoining(true)
    setJoinError(null)
    try {
      savePlayerName(joinName.trim())
      await joinRoom(code, joinName.trim())
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : 'Could not join')
    } finally {
      setJoining(false)
    }
  }

  const handleShareInvite = async () => {
    if (!room) return
    const url = raceJoinUrl(room.code)
    const result = await shareInviteLink(url)
    if (result === 'shared') {
      setShareFeedback('Link copied! Pick who to invite.')
    } else if (result === 'copied') {
      setShareFeedback('Link copied!')
    } else if (result === 'failed') {
      setShareFeedback('Could not share — try again')
    }
    if (result !== 'cancelled') {
      setTimeout(() => setShareFeedback(null), 2500)
    }
  }

  const handleReady = async () => {
    setReadyBusy(true)
    try {
      await setRaceReady()
    } finally {
      setReadyBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="page lobby">
        <p>Loading…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page lobby">
        <p className="error">{error}</p>
      </div>
    )
  }

  if (!room) {
    return (
      <div className="page lobby">
        <p className="error">Race not found.</p>
      </div>
    )
  }

  if (room.mode !== 'race') {
    return (
      <div className="page lobby">
        <p className="error">This lobby is a time-trial game, not a race.</p>
        <button type="button" className="btn btn--primary" onClick={() => navigate(`/lobby/${room.code}`)}>
          Go to Lobby
        </button>
      </div>
    )
  }

  if (!playerId) {
    return (
      <div className="page lobby">
        <h1>Join Race</h1>
        <p className="lobby__waiting">1v1 best of {RACE_WINS_NEEDED * 2 - 1} · first to {RACE_WINS_NEEDED} wins</p>
        <RulesBlurb mode="race" gridSize={room.gridSize} />
        <label className="field">
          Your name
          <input
            type="text"
            value={joinName}
            onChange={(e) => setJoinName(e.target.value)}
            placeholder="Enter your name"
            maxLength={20}
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && joinName.trim() && handleJoinLobby()}
          />
        </label>
        <button type="button" className="btn btn--primary" disabled={joining || !joinName.trim()} onClick={handleJoinLobby}>
          {joining ? 'Joining…' : 'Join Race'}
        </button>
        {joinError && <p className="error">{joinError}</p>}
      </div>
    )
  }

  const shareUrl = raceJoinUrl(room.code)
  const onDeploymentUrl = isVercelDeploymentUrl(window.location.origin)
  const race = room.race
  const iAmReady = Boolean(playerId && race?.readyIds.includes(playerId))
  const waitingForOpponent = room.players.length < RACE_MAX_PLAYERS
  const readyToStart = bothPlayersReady(room)

  return (
    <div className="page lobby">
      <BackButton label="Title Screen" />
      <h1>1v1 Race</h1>
      <p className="lobby__grid-size">{gridSizeLabel(room.gridSize)} · Best of {RACE_WINS_NEEDED * 2 - 1}</p>

      <RulesBlurb mode="race" gridSize={room.gridSize} />

      {!isSupabaseConfigured && (
        <p className="lobby__local-warning">
          Local mode — open this same link on another browser/profile on this device for a second player.
        </p>
      )}

      <div className="lobby__share">
        <p>Invite one friend:</p>
        {onDeploymentUrl && (
          <p className="lobby__preview-note">
            Friends should use {publicGameUrl()}. Preview URLs often require a Vercel login.
          </p>
        )}
        <code className="lobby__link">{shareUrl}</code>
        <button type="button" className="btn btn--secondary" onClick={handleShareInvite}>
          {canNativeShare() ? 'Invite Friend' : 'Copy Invite Link'}
        </button>
        {shareFeedback && <p className="lobby__share-feedback">{shareFeedback}</p>}
      </div>

      <section className="race-players">
        <h2 className="lobby__standings-title">Players</h2>
        <ul className="race-players__list">
          {room.players.map((player) => {
            const isYou = player.id === playerId
            const ready = race?.readyIds.includes(player.id)
            return (
              <li key={player.id} className={`race-players__item${isYou ? ' race-players__item--you' : ''}`}>
                <span>
                  {player.name}
                  {isYou && <span className="lobby__you">You</span>}
                </span>
                <span className={ready ? 'race-players__ready' : 'race-players__waiting'}>
                  {ready ? 'Ready' : 'Waiting'}
                </span>
              </li>
            )
          })}
          {waitingForOpponent && (
            <li className="race-players__item race-players__item--empty">Waiting for opponent…</li>
          )}
        </ul>
      </section>

      {race?.status === 'finished' && (
        <p className="lobby__waiting">
          Match over.
          {raceMatchLabel(room, playerId)}
        </p>
      )}

      {!waitingForOpponent && !readyToStart && !iAmReady && (
        <button type="button" className="btn btn--primary" disabled={readyBusy} onClick={handleReady}>
          {readyBusy ? 'Getting ready…' : 'Ready'}
        </button>
      )}

      {iAmReady && !readyToStart && (
        <p className="lobby__waiting">Ready! Waiting for your opponent…</p>
      )}

      {readyToStart && (
        <p className="lobby__waiting">Both ready — race starting…</p>
      )}

      {currentPlayer?.quit && <p className="lobby__quit-note">You left this race.</p>}
    </div>
  )
}

function raceMatchLabel(room: NonNullable<ReturnType<typeof useGameRoom>['room']>, playerId: string | null) {
  if (!room || !playerId || !room.race) return null
  const me = room.players.find((p) => p.id === playerId)
  const opponent = room.players.find((p) => p.id !== playerId)
  if (!me || !opponent) return null
  const myWins = getRaceWins(room.race, me.id)
  const theirWins = getRaceWins(room.race, opponent.id)
  if (myWins > theirWins) return ` You won ${myWins}–${theirWins}.`
  if (theirWins > myWins) return ` ${opponent.name} won ${theirWins}–${myWins}.`
  return null
}
