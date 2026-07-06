import { formatTime } from '../hooks/useRoundTimer'

interface TimerProps {
  elapsed: number
  running: boolean
}

export function Timer({ elapsed, running }: TimerProps) {
  return (
    <div className={`timer${running ? ' timer--running' : ''}`}>
      <span className="timer__label">Time</span>
      <span className="timer__value">{formatTime(elapsed)}</span>
    </div>
  )
}
