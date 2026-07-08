import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { generateRound } from '../game/cardEngine'
import { getRaceWins, raceMatchWinnerId } from '../game/room'
import { RACE_RESULT_MS, RACE_WINS_NEEDED, gridSizeLabel } from '../game/types'
import { RoundBoard } from '../components/RoundBoard'
import { useGameRoom } from '../hooks/useGameRoom'

export function RacePlay() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const {
    room,
    playerId,
    playerName,
    loading,
    beginRacePlaying,
    claimRaceRound,
    advanceRaceRound,
    rematchRace,
    quitGame,
  } = useGameRoom(code)

  const [countdownLeft, setCountdownLeft] = useState(0)
  const [claiming, setClaiming] = useState(false)
  const [quitting, setQuitting] = useState(false)
  const advancedRoundRef = useRef<number | null>(null)
  const startedPlayingRef = useRef<number | null>(null)

  const race = room?.race ?? null
  const opponent = room?.players.find((p) => p.id !== playerId) ?? null
  const myWins = playerId && race ? getRaceWins(race, playerId) : 0
  const theirWins = opponent && race ? getRaceWins(race, opponent.id) : 0
  const matchWinnerId = raceMatchWinnerId(race)
  const roundWinner = room?.players.find((p) => p.id === race?.roundWinnerId) ?? null

  const round = useMemo(() => {
    if (!room?.seed || !race) return null
    return generateRound(room.seed, race.roundIndex, room.gridSize)
  }, [room?.seed, room?.gridSize, race?.roundIndex])

  useEffect(() => {
    if (!room) return
    if (room.mode !== 'race') {
      navigate(`/lobby/${room.code}`, { replace: true })
      return
    }
    if (!playerId) {
      navigate(`/race/${room.code}`, { replace: true })
      return
    }
    if (race?.status === 'lobby') {
      navigate(`/race/${room.code}`, { replace: true })
    }
  }, [room, playerId, race?.status, navigate])

  useEffect(() => {
    if (!race || race.status !== 'countdown' || !race.countdownEndsAt) {
      setCountdownLeft(0)
      return
    }

    const tick = () => {
      const left = Math.max(0, race.countdownEndsAt! - Date.now())
      setCountdownLeft(left)
      if (left <= 0 && startedPlayingRef.current !== race.roundIndex) {
        startedPlayingRef.current = race.roundIndex
        void beginRacePlaying()
      }
    }

    tick()
    const id = window.setInterval(tick, 100)
    return () => window.clearInterval(id)
  }, [race?.status, race?.countdownEndsAt, race?.roundIndex, beginRacePlaying])

  useEffect(() => {
    if (!race || race.status !== 'round_result') return
    if (advancedRoundRef.current === race.roundIndex) return

    const timer = window.setTimeout(() => {
      advancedRoundRef.current = race.roundIndex
      void advanceRaceRound()
    }, RACE_RESULT_MS)

    return () => window.clearTimeout(timer)
  }, [race?.status, race?.roundIndex, race?.roundWinnerId, advanceRaceRound])

  const handleFoundMatch = async () => {
    if (claiming || race?.status !== 'playing') return
    setClaiming(true)
    try {
      await claimRaceRound()
    } finally {
      setClaiming(false)
    }
  }

  const handleQuit = async () => {
    if (quitting) return
    setQuitting(true)
    try {
      await quitGame()
      if (code) navigate(`/race/${code}`)
    } finally {
      setQuitting(false)
    }
  }

  const handleRematch = async () => {
    await rematchRace()
    if (code) navigate(`/race/${code}`)
  }

  if (loading || !room || !race || !round) {
    return (
      <div className="page play">
        <p>Loading race…</p>
      </div>
    )
  }

  const countdownSeconds = Math.max(1, Math.ceil(countdownLeft / 1000))
  const iWonMatch = matchWinnerId === playerId
  const theyWonMatch = Boolean(matchWinnerId && matchWinnerId !== playerId)
  const opponentWonRound = Boolean(roundWinner && roundWinner.id !== playerId)
  const matchDecided = Boolean(matchWinnerId)
  const revealAnswer = opponentWonRound && race.status === 'round_result'
  const showBoard = race.status === 'playing' || race.status === 'round_result'

  return (
    <div className="page play race-play">
      <header className="play__header">
        <div className="play__meta">
          <span className="play__round">
            Race · Round {race.roundIndex + 1} · {gridSizeLabel(room.gridSize)}
          </span>
          <span className="play__player">{playerName}</span>
        </div>
        <div className="play__header-actions">
          <div className="race-score">
            <span className="race-score__you">{myWins}</span>
            <span className="race-score__sep">–</span>
            <span className="race-score__them">{theirWins}</span>
          </div>
          <button type="button" className="play__quit-header" disabled={quitting} onClick={handleQuit}>
            Quit
          </button>
        </div>
      </header>

      <p className="play__hint">
        First to find the match wins the round · First to {RACE_WINS_NEEDED} wins the match
      </p>
      <p className="race-play__vs">
        You vs {opponent?.name ?? '…'}
      </p>

      {showBoard ? (
        <div className="play__board-wrap">
          <RoundBoard
            round={round}
            gridSize={room.gridSize}
            active={race.status === 'playing' && !claiming}
            startTime={race.roundStartedAt ?? Date.now()}
            revealMatch={revealAnswer}
            onComplete={() => {
              void handleFoundMatch()
            }}
          />
        </div>
      ) : (
        <div className="race-board-placeholder" aria-hidden />
      )}

      {race.status === 'countdown' && (
        <div className="overlay">
          <div className="overlay__card">
            <h2>Get ready!</h2>
            <p className="race-countdown">{countdownLeft > 0 ? countdownSeconds : 'Go!'}</p>
            <p>Same cards for both players</p>
          </div>
        </div>
      )}

      {race.status === 'round_result' && roundWinner && opponentWonRound && (
        <div className="race-result-banner" role="status">
          <strong>{roundWinner.name} won the round!</strong>
          <span>Score {myWins}–{theirWins}</span>
        </div>
      )}

      {race.status === 'round_result' && roundWinner && !opponentWonRound && (
        <div className="overlay">
          <div className="overlay__card">
            <h2>You won the round!</h2>
            <p className="race-score-line">
              Score: {myWins} – {theirWins}
            </p>
            <p>{matchDecided ? 'Match over…' : 'Next round starting…'}</p>
          </div>
        </div>
      )}

      {race.status === 'finished' && (
        <div className="overlay">
          <div className="overlay__card">
            <h2>
              {iWonMatch ? 'You won the race!' : theyWonMatch ? `${opponent?.name ?? 'Opponent'} won the race!` : 'Race over'}
            </h2>
            <p className="race-score-line">
              Final: {myWins} – {theirWins}
            </p>
            <button type="button" className="btn btn--primary" onClick={handleRematch}>
              Rematch
            </button>
            <button type="button" className="btn btn--ghost" onClick={() => navigate(`/race/${code}`)}>
              Back to Lobby
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
