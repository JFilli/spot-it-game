import { getSymbol } from '../game/symbols'
import type { CardData, GridSize } from '../game/types'
import { symbolsPerCard } from '../game/types'

interface GameCardProps {
  card: CardData
  gridSize: GridSize
  label: string
  selectedSlot: number | null
  wrongSlot: number | null
  disabled: boolean
  onSymbolTap: (symbolId: string, slot: number) => void
}

export function GameCard({ card, gridSize, label, selectedSlot, wrongSlot, disabled, onSymbolTap }: GameCardProps) {
  const cellCount = symbolsPerCard(gridSize)
  const slots = Array.from({ length: cellCount }, (_, slot) => {
    const placement = card.placements.find((p) => p.slot === slot)
    return { slot, placement }
  })

  return (
    <div className={`game-card${gridSize >= 4 ? ` game-card--grid-${gridSize}` : ''}`}>
      <div className="game-card__label">{label}</div>
      <div
        className="game-card__grid"
        style={{
          gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
          gridTemplateRows: `repeat(${gridSize}, 1fr)`,
        }}
      >
        {slots.map(({ slot, placement }) => {
          const isSelected = selectedSlot === slot
          const isWrong = wrongSlot === slot
          return (
            <button
              key={slot}
              type="button"
              className={`game-card__cell${isSelected ? ' game-card__cell--selected' : ''}${isWrong ? ' game-card__cell--wrong' : ''}`}
              disabled={disabled || !placement}
              onClick={() => placement && onSymbolTap(placement.symbolId, slot)}
              aria-label={placement ? getSymbol(placement.symbolId).label : 'Empty'}
            >
              {placement && (
                <span className="game-card__symbol-stage">
                  <span
                    className="game-card__symbol"
                    style={{
                      transform: `rotate(${placement.rotation}deg) scale(${placement.scale})`,
                    }}
                  >
                    {getSymbol(placement.symbolId).emoji}
                  </span>
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
