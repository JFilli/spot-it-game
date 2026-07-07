import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { generateRound } from '../game/cardEngine'
import { clearPlayProgress, loadPlayProgress, savePlayProgress } from '../game/playProgress'
import { PRACTICE_CODE, isPracticeCode } from '../game/practice'
import { recordSoloFinish } from '../game/soloScores'
import { TOTAL_ROUNDS } from '../game/types'
import { RoundBoard } from '../components/RoundBoard'
import { GameRules } from '../components/GameRules'
import { Timer } from '../components/Timer'
import { formatTime } from '../hooks/useRoundTimer'
import { useGameRoom } from '../hooks/useGameRoom'

type Phase = 'playing' | 'summary'

export function Play() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const isSolo = code ? isPracticeCode(code) : false
  const { room, playerId, playerName, currentPlayer, loading, submitTimes, quitGame } = useGameRoom(code)

  const [roundIndex, setRoundIndex] = useState(0)
  const [times, setTimes] = useState<number[]>([])
  const [phase, setPhase] = useState<Phase>('playing')
  const [lastRoundTime, setLastRoundTime] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [timerRunning, setTimerRunning] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const [showRules, setShowRules] = useState(false)
  const [quitting, setQuitting] = useState(false)
  const roundStartedAtRef = useRef(Date.now())
  const initializedRef = useRef(false)

  const round = useMemo(() => {
    if (!room?.seed) return null
    return generateRound(room.seed, roundIndex)
  }, [room?.seed, roundIndex])

  const totalSoFar = times.reduce((sum, t) => sum + t, 0)

  const handleQuit = useCallback(async () => {
    if (!code || !playerId || quitting) return
    setQuitting(true)
    try {
      if (isSolo) {
        clearPlayProgress(code, playerId)
        navigate('/', { state: { screen: 'solo' } })
        return
      }
      await quitGame()
      navigate(`/lobby/${code}`)
    } finally {
      setQuitting(false)
    }
  }, [code, playerId, quitting, isSolo, quitGame, navigate])

  useEffect(() => {
    if (!code || !playerId || !room || loading) return
    if (initializedRef.current) return
    initializedRef.current = true

    if (currentPlayer?.done || currentPlayer?.quit) {
      clearPlayProgress(code, playerId)
      if (code === PRACTICE_CODE) {
        navigate('/', { state: { screen: 'solo' } })
      } else {
        navigate(`/lobby/${code}`)
      }
      return
    }

    const saved = loadPlayProgress(code, playerId)
    if (saved) {
      setRoundIndex(saved.roundIndex)
      setTimes(saved.times)
      setPhase(saved.phase)
      setLastRoundTime(saved.lastRoundTime)
      roundStartedAtRef.current = saved.roundStartedAt
      setTimerRunning(saved.phase === 'playing')
      setShowRules(false)
      if (saved.phase === 'playing') {
        setElapsed(Date.now() - saved.roundStartedAt)
      }
    } else {
      setShowRules(true)
      setTimerRunning(false)
    }

    setHydrated(true)
  }, [code, playerId, room, loading, currentPlayer, navigate])

  const startGame = () => {
    if (!code || !playerId) return
    const now = Date.now()
    roundStartedAtRef.current = now
    setElapsed(0)
    setTimerRunning(true)
    setShowRules(false)
    savePlayProgress(code, playerId, {
      roundIndex: 0,
      times: [],
      phase: 'playing',
      roundStartedAt: now,
      lastRoundTime: 0,
    })
  }

  useEffect(() => {
    if (!timerRunning || !hydrated) return
    let frame: number
    const tick = () => {
      setElapsed(Date.now() - roundStartedAtRef.current)
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [timerRunning, hydrated, roundIndex])

  const handleRoundComplete = useCallback(
    async (timeMs: number) => {
      setTimerRunning(false)
      setLastRoundTime(timeMs)
      const newTimes = [...times, timeMs]
      setTimes(newTimes)

      if (roundIndex + 1 >= TOTAL_ROUNDS) {
        if (code && playerId) clearPlayProgress(code, playerId)
        await submitTimes(newTimes)
        if (code === PRACTICE_CODE) {
          const total = newTimes.reduce((sum, t) => sum + t, 0)
          recordSoloFinish(total)
          navigate('/', { state: { screen: 'solo' } })
        } else {
          navigate(`/lobby/${code}`)
        }
      } else {
        setPhase('summary')
        if (code && playerId) {
          savePlayProgress(code, playerId, {
            roundIndex,
            times: newTimes,
            phase: 'summary',
            roundStartedAt: roundStartedAtRef.current,
            lastRoundTime: timeMs,
          })
        }
      }
    },
    [times, roundIndex, submitTimes, navigate, code, playerId],
  )

  const nextRound = () => {
    const nextIndex = roundIndex + 1
    const now = Date.now()
    roundStartedAtRef.current = now
    setRoundIndex(nextIndex)
    setElapsed(0)
    setTimerRunning(true)
    setPhase('playing')
    if (code && playerId) {
      savePlayProgress(code, playerId, {
        roundIndex: nextIndex,
        times,
        phase: 'playing',
        roundStartedAt: now,
        lastRoundTime,
      })
    }
  }

  if (!room || !hydrated) {
    return (
      <div className="page play">
        <p>Loading game…</p>
      </div>
    )
  }

  if (showRules) {
    return (
      <div className="page play">
        <GameRules onStart={startGame} onQuit={handleQuit} quitting={quitting} />
      </div>
    )
  }

  if (!round) {
    return (
      <div className="page play">
        <p>Loading game…</p>
      </div>
    )
  }

  return (
    <div className="page play">
      <header className="play__header">
        <div className="play__meta">
          <span className="play__round">Round {roundIndex + 1} of {TOTAL_ROUNDS}</span>
          <span className="play__player">{playerName}</span>
        </div>
        <div className="play__header-actions">
          <Timer elapsed={elapsed} running={timerRunning} />
          <button
            type="button"
            className="play__quit-header"
            disabled={quitting}
            onClick={handleQuit}
          >
            {quitting ? '…' : 'Quit'}
          </button>
        </div>
      </header>

      <p className="play__hint">Tap the match on both cards</p>

      <div className="play__board-wrap">
        <RoundBoard
          round={round}
          active={phase === 'playing' && timerRunning}
          startTime={roundStartedAtRef.current}
          onComplete={handleRoundComplete}
        />
      </div>

      <button
        type="button"
        className="btn btn--ghost play__quit"
        disabled={quitting}
        onClick={handleQuit}
      >
        {quitting ? 'Quitting…' : 'Quit Game'}
      </button>

      {phase === 'summary' && (
        <div className="overlay">
          <div className="overlay__card">
            <h2>Round {roundIndex + 1} complete!</h2>
            <p>Time: <strong>{formatTime(lastRoundTime)}</strong></p>
            <p>Running total: <strong>{formatTime(totalSoFar)}</strong></p>
            <button type="button" className="btn btn--primary" onClick={nextRound}>
              Next Round
            </button>
            <button type="button" className="btn btn--ghost" disabled={quitting} onClick={handleQuit}>
              Quit Game
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
