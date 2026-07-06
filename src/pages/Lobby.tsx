import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { BackButton } from '../components/BackButton'
import { useGameRoom } from '../hooks/useGameRoom'
import { finishedPlayers, totalTime } from '../game/room'
import { formatTime } from '../hooks/useRoundTimer'
import { isSupabaseConfigured } from '../lib/supabase'
import { copyInviteLink } from '../lib/share'
import { loadSavedName, savePlayerName } from '../lib/playerName'

export function Lobby() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const { room, playerId, currentPlayer, loading, error, joinRoom } = useGameRoom(code)
  const [shareFeedback, setShareFeedback] = useState<string | null>(null)
  const [joinName, setJoinName] = useState(loadSavedName())
  const [joining, setJoining] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)

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
    const url = `${window.location.origin}/join/${room.code}`
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

  const shareUrl = `${window.location.origin}/join/${room.code}`
  const alreadyFinished = currentPlayer?.done ?? false
  const ranked = finishedPlayers(room)
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

      <div className="lobby__share">
        <p>Invite friends with this link:</p>
        <code className="lobby__link">{shareUrl}</code>
        <button type="button" className="btn btn--secondary" onClick={handleCopyLink}>
          Copy Invite Link
        </button>
        {shareFeedback && <p className="lobby__share-feedback">{shareFeedback}</p>}
      </div>

      {ranked.length > 0 && (
        <section className="lobby__standings">
          <h2 className="lobby__standings-title">Leaderboard</h2>
          <ol className="lobby__standings-list">
            {ranked.map((player, index) => {
              const playerTotal = totalTime(player.times)
              const isYou = player.id === playerId
              const isFirst = index === 0
              return (
                <li
                  key={player.id}
                  className={`lobby__standing${isYou ? ' lobby__standing--you' : ''}${isFirst ? ' lobby__standing--first' : ''}`}
                >
                  <span className="lobby__standing-rank">{index + 1}</span>
                  <span className="lobby__standing-name">
                    {player.name}
                    {isYou && <span className="lobby__you">You</span>}
                  </span>
                  <span className="lobby__standing-time">
                    {playerTotal !== null ? formatTime(playerTotal) : '—'}
                  </span>
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

      {alreadyFinished && currentPlayer?.times && (
        <div className="lobby__your-rounds">
          <h3>Your round times</h3>
          <ul>
            {currentPlayer.times.map((t, i) => (
              <li key={i}>
                Round {i + 1}: {formatTime(t)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {!alreadyFinished && (
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
