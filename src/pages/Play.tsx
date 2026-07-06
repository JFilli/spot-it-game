import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { generateRound } from '../game/cardEngine'
import { PRACTICE_CODE } from '../game/practice'
import { recordSoloFinish } from '../game/soloScores'
import { TOTAL_ROUNDS } from '../game/types'
import { RoundBoard } from '../components/RoundBoard'
import { Timer } from '../components/Timer'
import { formatTime } from '../hooks/useRoundTimer'
import { useGameRoom } from '../hooks/useGameRoom'

type Phase = 'playing' | 'summary'

export function Play() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const { room, playerName, submitTimes } = useGameRoom(code)

  const [roundIndex, setRoundIndex] = useState(0)
  const [times, setTimes] = useState<number[]>([])
  const [phase, setPhase] = useState<Phase>('playing')
  const [lastRoundTime, setLastRoundTime] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [timerRunning, setTimerRunning] = useState(true)
  const startTimeRef = useRef(performance.now())

  const round = useMemo(() => {
    if (!room?.seed) return null
    return generateRound(room.seed, roundIndex)
  }, [room?.seed, roundIndex])

  const totalSoFar = times.reduce((sum, t) => sum + t, 0)

  useEffect(() => {
    if (!timerRunning) return
    let frame: number
    const tick = () => {
      setElapsed(performance.now() - startTimeRef.current)
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [timerRunning, roundIndex])

  const handleRoundComplete = useCallback(
    async (timeMs: number) => {
      setTimerRunning(false)
      setLastRoundTime(timeMs)
      const newTimes = [...times, timeMs]
      setTimes(newTimes)

      if (roundIndex + 1 >= TOTAL_ROUNDS) {
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
      }
    },
    [times, roundIndex, submitTimes, navigate, code],
  )

  const nextRound = () => {
    setRoundIndex((i) => i + 1)
    startTimeRef.current = performance.now()
    setElapsed(0)
    setTimerRunning(true)
    setPhase('playing')
  }

  if (!room || !round) {
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
        <Timer elapsed={elapsed} running={timerRunning} />
      </header>

      <p className="play__hint">Select the matching symbol on both cards</p>

      <RoundBoard
        round={round}
        active={phase === 'playing' && timerRunning}
        startTime={startTimeRef.current}
        onComplete={handleRoundComplete}
      />

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
    </div>
  )
}
