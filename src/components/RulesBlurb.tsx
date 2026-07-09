import { RACE_WINS_NEEDED, TOTAL_ROUNDS, gridSizeLabel, type GridSize } from '../game/types'

interface RulesBlurbProps {
  mode: 'time_trial' | 'race'
  gridSize: GridSize
}

export function RulesBlurb({ mode, gridSize }: RulesBlurbProps) {
  return (
    <section className="lobby__rules">
      <h2 className="lobby__standings-title">How to play</h2>
      <p className="rules__grid-note">
        {gridSizeLabel(gridSize)}
        {mode === 'race' ? ` · Best of ${RACE_WINS_NEEDED * 2 - 1}` : ` · ${TOTAL_ROUNDS} rounds`}
      </p>
      <ul className="rules__list lobby__rules-list">
        <li>Two cards appear — exactly one symbol matches on both cards.</li>
        {mode === 'time_trial' ? (
          <>
            <li>Tap the matching symbol on each card to complete the round.</li>
            <li>
              You play <strong>{TOTAL_ROUNDS} rounds</strong> — lowest total time wins!
            </li>
          </>
        ) : (
          <>
            <li>Tap the match on both cards first to win the round.</li>
            <li>
              First to <strong>{RACE_WINS_NEEDED} round wins</strong> wins the match!
            </li>
          </>
        )}
      </ul>
    </section>
  )
}
