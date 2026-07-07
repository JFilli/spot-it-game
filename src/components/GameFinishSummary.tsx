import { RoundBreakdown } from './RoundBreakdown'
import type { GridSize } from '../game/types'
import { formatTime } from '../hooks/useRoundTimer'

interface GameFinishSummaryProps {
  seed: string
  gridSize: GridSize
  times: number[]
  isSolo: boolean
  onContinue: () => void
}

export function GameFinishSummary({ seed, gridSize, times, isSolo, onContinue }: GameFinishSummaryProps) {
  const total = times.reduce((sum, timeMs) => sum + timeMs, 0)

  return (
    <div className="overlay">
      <div className="overlay__card overlay__card--finish">
        <h2>Game complete!</h2>
        <p className="finish-summary__total">
          Total time: <strong>{formatTime(total)}</strong>
        </p>
        <RoundBreakdown seed={seed} gridSize={gridSize} times={times} />
        <button type="button" className="btn btn--primary" onClick={onContinue}>
          {isSolo ? 'Back to Solo' : 'View Leaderboard'}
        </button>
      </div>
    </div>
  )
}
