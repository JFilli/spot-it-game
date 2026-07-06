import { useCallback, useEffect, useRef, useState } from 'react'
import type { RoundData } from '../game/types'
import { GameCard } from './GameCard'

interface RoundBoardProps {
  round: RoundData
  onComplete: (timeMs: number) => void
  active: boolean
  startTime: number
}

function symbolAtSlot(round: RoundData, card: 'A' | 'B', slot: number): string | null {
  const placements = card === 'A' ? round.cardA.placements : round.cardB.placements
  return placements.find((p) => p.slot === slot)?.symbolId ?? null
}

export function RoundBoard({ round, onComplete, active, startTime }: RoundBoardProps) {
  const [selectedA, setSelectedA] = useState<number | null>(null)
  const [selectedB, setSelectedB] = useState<number | null>(null)
  const [wrongA, setWrongA] = useState<number | null>(null)
  const [wrongB, setWrongB] = useState<number | null>(null)
  const [completed, setCompleted] = useState(false)
  const validatingRef = useRef(false)

  useEffect(() => {
    setSelectedA(null)
    setSelectedB(null)
    setWrongA(null)
    setWrongB(null)
    setCompleted(false)
    validatingRef.current = false
  }, [round])

  const handleTap = useCallback(
    (card: 'A' | 'B', _symbolId: string, slot: number) => {
      if (!active || completed || validatingRef.current) return

      if (card === 'A') {
        setSelectedA((current) => (current === slot ? null : slot))
        setWrongA(null)
      } else {
        setSelectedB((current) => (current === slot ? null : slot))
        setWrongB(null)
      }
    },
    [active, completed],
  )

  useEffect(() => {
    if (!active || completed || validatingRef.current) return
    if (selectedA === null || selectedB === null) return

    const symbolA = symbolAtSlot(round, 'A', selectedA)
    const symbolB = symbolAtSlot(round, 'B', selectedB)
    const isCorrect =
      symbolA === round.matchSymbol && symbolB === round.matchSymbol

    if (isCorrect) {
      setCompleted(true)
      onComplete(Date.now() - startTime)
      return
    }

    validatingRef.current = true
    setWrongA(selectedA)
    setWrongB(selectedB)
    const timer = setTimeout(() => {
      setWrongA(null)
      setWrongB(null)
      setSelectedA(null)
      setSelectedB(null)
      validatingRef.current = false
    }, 450)

    return () => clearTimeout(timer)
  }, [selectedA, selectedB, active, completed, round, onComplete, startTime])

  const locked = !active || completed

  return (
    <div className="round-board">
      <GameCard
        card={round.cardA}
        label="Card A"
        selectedSlot={selectedA}
        wrongSlot={wrongA}
        disabled={locked}
        onSymbolTap={(symbolId, slot) => handleTap('A', symbolId, slot)}
      />
      <GameCard
        card={round.cardB}
        label="Card B"
        selectedSlot={selectedB}
        wrongSlot={wrongB}
        disabled={locked}
        onSymbolTap={(symbolId, slot) => handleTap('B', symbolId, slot)}
      />
    </div>
  )
}
