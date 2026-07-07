import { roundMatchEmoji } from '../game/roundDisplay'
import type { GridSize } from '../game/types'
import { formatTime } from '../hooks/useRoundTimer'

interface RoundBreakdownProps {
  seed: string
  gridSize: GridSize
  times: number[]
}

export function RoundBreakdown({ seed, gridSize, times }: RoundBreakdownProps) {
  return (
    <ul className="round-breakdown">
      {times.map((timeMs, roundIndex) => (
        <li key={roundIndex}>
          <span className="round-breakdown__emoji" aria-hidden>
            {roundMatchEmoji(seed, roundIndex, gridSize)}
          </span>
          <span className="round-breakdown__label">Round {roundIndex + 1}</span>
          <span className="round-breakdown__time">{formatTime(timeMs)}</span>
        </li>
      ))}
    </ul>
  )
}
