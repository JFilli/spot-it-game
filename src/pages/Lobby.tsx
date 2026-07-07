import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { BackButton } from '../components/BackButton'
import { useGameRoom } from '../hooks/useGameRoom'
import { finishedPlayers, quitPlayers, hasCompletedGame, totalTime } from '../game/room'
import { formatTime } from '../hooks/useRoundTimer'
import { isSupabaseConfigured } from '../lib/supabase'
import { copyInviteLink } from '../lib/share'
import { joinUrl, isVercelDeploymentUrl, publicGameUrl } from '../lib/brand'
import { loadSavedName, savePlayerName } from '../lib/playerName'
import { gridSizeLabel } from '../game/types'
import type { LobbyPlayer } from '../game/types'
import { RoundBreakdown } from '../components/RoundBreakdown'

export function Lobby() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const { room, playerId, currentPlayer, loading, error, joinRoom } = useGameRoom(code)
  const [shareFeedback, setShareFeedback] = useState<string | null>(null)
  const [joinName, setJoinName] = useState(loadSavedName())
  const [joining, setJoining] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null)

  const togglePlayerBreakdown = (player: LobbyPlayer) => {
    if (!player.times?.length) return
    setExpandedPlayerId((current) => (current === player.id ? null : player.id))
  }

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

  const handleCopyLink = async () => {
    if (!room) return
    const url = joinUrl(room.code)
    const copied = await copyInviteLink(url)
    setShareFeedback(copied ? 'Link copied!' : 'Could not copy — try again')
    setTimeout(() => setShareFeedback(null), 2500)
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
        <p className="error">Game not found.</p>
      </div>
    )
  }

  if (!playerId) {
    return (
      <div className="page lobby">
        <h1>Join Game</h1>
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
          {joining ? 'Joining…' : 'Join Game'}
        </button>
        {joinError && <p className="error">{joinError}</p>}
      </div>
    )
  }

  const shareUrl = joinUrl(room.code)
  const onDeploymentUrl = isVercelDeploymentUrl(window.location.origin)
  const hasCompleted = currentPlayer ? hasCompletedGame(currentPlayer) : false
  const hasQuit = Boolean(currentPlayer?.quit)
  const canViewLeaderboard = hasCompleted || hasQuit
  const ranked = finishedPlayers(room)
  const quitters = quitPlayers(room)
  const leader = ranked[0]

  return (
    <div className="page lobby">
      <BackButton label="Title Screen" />
      <h1>Game Lobby</h1>

      {!isSupabaseConfigured && (
        <p className="lobby__local-warning">
          Local mode — only works on this browser. Set up online play to challenge friends on their phones.
        </p>
      )}

      <p className="lobby__grid-size">{gridSizeLabel(room.gridSize)} grid</p>

      <div className="lobby__share">
        <p>Invite friends with this link:</p>
        {onDeploymentUrl && (
          <p className="lobby__preview-note">
            Friends should use the link below ({publicGameUrl()}). Open that URL yourself to play — preview pages require a Vercel login.
          </p>
        )}
        <code className="lobby__link">{shareUrl}</code>
        <button type="button" className="btn btn--secondary" onClick={handleCopyLink}>
          Copy Invite Link
        </button>
        {shareFeedback && <p className="lobby__share-feedback">{shareFeedback}</p>}
      </div>

      {canViewLeaderboard && (ranked.length > 0 || quitters.length > 0) && (
        <section className="lobby__standings">
          <h2 className="lobby__standings-title">Leaderboard</h2>
          <p className="lobby__standings-hint">
            {hasQuit && ranked.length === 0
              ? 'Waiting for players to finish…'
              : 'Tap a name to see round-by-round times'}
          </p>
          <ol className="lobby__standings-list">
            {ranked.map((player, index) => {
              const playerTotal = totalTime(player.times)
              const isYou = player.id === playerId
              const isFirst = index === 0
              const isExpanded = expandedPlayerId === player.id
              return (
                <li
                  key={player.id}
                  className={`lobby__standing-item${isYou ? ' lobby__standing-item--you' : ''}${isFirst ? ' lobby__standing-item--first' : ''}${isExpanded ? ' lobby__standing-item--expanded' : ''}`}
                >
                  <div className="lobby__standing">
                    <span className="lobby__standing-rank">{index + 1}</span>
                    <button
                      type="button"
                      className="lobby__standing-name"
                      onClick={() => togglePlayerBreakdown(player)}
                      aria-expanded={isExpanded}
                    >
                      {player.name}
                      {isYou && <span className="lobby__you">You</span>}
                    </button>
                    <span className="lobby__standing-time">
                      {playerTotal !== null ? formatTime(playerTotal) : '—'}
                    </span>
                  </div>
                  {isExpanded && player.times && (
                    <RoundBreakdown seed={room.seed} gridSize={room.gridSize} times={player.times} />
                  )}
                </li>
              )
            })}
            {quitters.map((player) => {
              const isYou = player.id === playerId
              return (
                <li
                  key={player.id}
                  className={`lobby__standing-item lobby__standing-item--quit${isYou ? ' lobby__standing-item--you' : ''}`}
                >
                  <div className="lobby__standing">
                    <span className="lobby__standing-rank">—</span>
                    <span className="lobby__standing-name lobby__standing-name--static">
                      {player.name}
                      {isYou && <span className="lobby__you">You</span>}
                    </span>
                    <span className="lobby__standing-quit">Quit</span>
                  </div>
                </li>
              )
            })}
          </ol>
          {leader && ranked.length > 1 && (
            <p className="lobby__leader-note">
              <strong>{leader.name}</strong> is in the lead!
            </p>
          )}
        </section>
      )}

      {hasQuit && (
        <p className="lobby__quit-note">
          You quit this game.{ranked.length > 0 ? ' You can still follow the leaderboard below.' : ''}
        </p>
      )}

      {!hasCompleted && !hasQuit && (
        <>
          <p className="lobby__waiting">Share the link — friends can join and play on their own time.</p>
          <button type="button" className="btn btn--primary" onClick={() => navigate(`/play/${code}`)}>
            Begin Game
          </button>
        </>
      )}
    </div>
  )
}
