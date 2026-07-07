import { APP_DISPLAY_NAME } from '../lib/brand'
import { TOTAL_ROUNDS, gridSizeLabel, type GridSize } from '../game/types'

interface GameRulesProps {
  gridSize: GridSize
  onStart: () => void
  onReturn: () => void
}

export function GameRules({ gridSize, onStart, onReturn }: GameRulesProps) {
  return (
    <div className="rules-screen">
      <div className="rules-screen__card">
        <h2>How to play</h2>
        <p className="rules__intro">Welcome to {APP_DISPLAY_NAME}</p>
        <p className="rules__grid-note">{gridSizeLabel(gridSize)} cards · {TOTAL_ROUNDS} rounds</p>
        <ul className="rules__list">
          <li>Two cards appear — each has symbols in different sizes and rotations.</li>
          <li>Exactly <strong>one symbol</strong> matches on both cards.</li>
          <li>Tap the match on <strong>Card A</strong>, then tap the same match on <strong>Card B</strong>.</li>
          <li>Wrong picks turn red — keep trying until you find the pair.</li>
          <li>You play <strong>{TOTAL_ROUNDS} rounds</strong>. The timer runs until you find each match.</li>
          <li><strong>Lowest total time wins.</strong> In solo, try to beat your personal best!</li>
        </ul>
        <button type="button" className="btn btn--primary" onClick={onStart}>
          Let&apos;s Go!
        </button>
        <button type="button" className="btn btn--ghost" onClick={onReturn}>
          Return
        </button>
      </div>
    </div>
  )
}
