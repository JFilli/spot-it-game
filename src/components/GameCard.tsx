import { getSymbol } from '../game/symbols'
import type { CardData } from '../game/types'

interface GameCardProps {
  card: CardData
  label: string
  selectedSlot: number | null
  wrongSlot: number | null
  disabled: boolean
  onSymbolTap: (symbolId: string, slot: number) => void
}

export function GameCard({ card, label, selectedSlot, wrongSlot, disabled, onSymbolTap }: GameCardProps) {
  const slots = Array.from({ length: 9 }, (_, slot) => {
    const placement = card.placements.find((p) => p.slot === slot)
    return { slot, placement }
  })

  return (
    <div className="game-card">
      <div className="game-card__label">{label}</div>
      <div className="game-card__grid">
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
                <span
                  className="game-card__symbol"
                  style={{
                    transform: `rotate(${placement.rotation}deg) scale(${placement.scale})`,
                  }}
                >
                  {getSymbol(placement.symbolId).emoji}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
