import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { generateRound } from '../game/cardEngine'
import { clearPlayProgress, loadPlayProgress, savePlayProgress } from '../game/playProgress'
import { PRACTICE_CODE, isPracticeCode } from '../game/practice'
import { recordSoloFinish } from '../game/soloScores'
import { TOTAL_ROUNDS } from '../game/types'
import { RoundBoard } from '../components/RoundBoard'
import { GameRules } from '../components/GameRules'
import { GameFinishSummary } from '../components/GameFinishSummary'
import { QuitConfirm } from '../components/QuitConfirm'
import { Timer } from '../components/Timer'
import { formatTime } from '../hooks/useRoundTimer'
import { useGameRoom } from '../hooks/useGameRoom'

type Phase = 'playing' | 'summary' | 'finished'

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
  const [showQuitConfirm, setShowQuitConfirm] = useState(false)
  const [quitting, setQuitting] = useState(false)
  const roundStartedAtRef = useRef(Date.now())
  const initializedRef = useRef(false)

  const round = useMemo(() => {
    if (!room?.seed) return null
    return generateRound(room.seed, roundIndex, room.gridSize)
  }, [room?.seed, room?.gridSize, roundIndex])

  const totalSoFar = times.reduce((sum, t) => sum + t, 0)
  const soloGridSize = room?.gridSize ?? 3

  const goToSoloHub = useCallback(() => {
    navigate('/', { state: { screen: 'solo', gridSize: soloGridSize } })
  }, [navigate, soloGridSize])

  const confirmQuit = useCallback(async () => {
    if (!code || !playerId || quitting) return
    setQuitting(true)
    try {
      if (isSolo) {
        clearPlayProgress(code, playerId)
        goToSoloHub()
        return
      }
      await quitGame()
      navigate(`/lobby/${code}`)
    } finally {
      setQuitting(false)
      setShowQuitConfirm(false)
    }
  }, [code, playerId, quitting, isSolo, quitGame, navigate, goToSoloHub])

  const requestQuit = useCallback(() => {
    setShowQuitConfirm(true)
  }, [])

  const returnFromRules = useCallback(() => {
    if (!code) {
      navigate('/')
      return
    }
    if (isSolo) {
      goToSoloHub()
    } else {
      navigate(`/lobby/${code}`)
    }
  }, [code, isSolo, navigate, goToSoloHub])

  useEffect(() => {
    if (!code || !playerId || !room || loading) return
    if (initializedRef.current) return
    initializedRef.current = true

    if (currentPlayer?.done || currentPlayer?.quit) {
      clearPlayProgress(code, playerId)
      if (code === PRACTICE_CODE) {
        navigate('/', { state: { screen: 'solo', gridSize: room.gridSize } })
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

  const leaveAfterFinish = useCallback(() => {
    if (isSolo) {
      goToSoloHub()
    } else if (code) {
      navigate(`/lobby/${code}`)
    }
  }, [isSolo, goToSoloHub, code, navigate])

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
          recordSoloFinish(room?.gridSize ?? 3, total)
        }
        setPhase('finished')
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
    [times, roundIndex, submitTimes, code, playerId, room?.gridSize],
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

  const quitConfirmDialog = showQuitConfirm ? (
    <QuitConfirm
      isMultiplayer={!isSolo}
      quitting={quitting}
      onCancel={() => setShowQuitConfirm(false)}
      onConfirm={confirmQuit}
    />
  ) : null

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
        <GameRules gridSize={room.gridSize} onStart={startGame} onReturn={returnFromRules} />
        {quitConfirmDialog}
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
            onClick={requestQuit}
          >
            Quit
          </button>
        </div>
      </header>

      <p className="play__hint">Tap the match on both cards</p>

      <div className="play__board-wrap">
        <RoundBoard
          round={round}
          gridSize={room.gridSize}
          active={phase === 'playing' && timerRunning}
          startTime={roundStartedAtRef.current}
          onComplete={handleRoundComplete}
        />
      </div>

      {phase === 'summary' && (
        <div className="overlay">
          <div className="overlay__card">
            <h2>Round {roundIndex + 1} complete!</h2>
            <p>Time: <strong>{formatTime(lastRoundTime)}</strong></p>
            <p>Running total: <strong>{formatTime(totalSoFar)}</strong></p>
            <button type="button" className="btn btn--primary" onClick={nextRound}>
              Next Round
            </button>
          </div>
        </div>
      )}

      {phase === 'finished' && (
        <GameFinishSummary
          seed={room.seed}
          gridSize={room.gridSize}
          times={times}
          isSolo={isSolo}
          onContinue={leaveAfterFinish}
        />
      )}

      {quitConfirmDialog}
    </div>
  )
}
