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
        <p className="rules__grid-note">{gridSizeLabel(gridSize)} cards · {TOTAL_ROUNDS} rounds</p>
        <ul className="rules__list">
          <li>Two cards appear — exactly one symbol matches on both cards.</li>
          <li>Tap the matching symbol on each card to complete the round.</li>
          <li>You play <strong>{TOTAL_ROUNDS} rounds</strong> — lowest total time wins!</li>
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
