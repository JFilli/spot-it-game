import { useCallback, useEffect, useRef, useState } from 'react'

export function useRoundTimer(active: boolean) {
  const [elapsed, setElapsed] = useState(0)
  const startRef = useRef<number | null>(null)
  const frameRef = useRef<number | null>(null)

  useEffect(() => {
    if (!active) {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
      return
    }

    startRef.current = performance.now() - elapsed

    const tick = () => {
      if (startRef.current !== null) {
        setElapsed(performance.now() - startRef.current)
      }
      frameRef.current = requestAnimationFrame(tick)
    }

    frameRef.current = requestAnimationFrame(tick)
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [active])

  const reset = useCallback(() => {
    setElapsed(0)
    startRef.current = null
  }, [])

  return { elapsed, reset }
}

export function formatTime(ms: number): string {
  const totalSeconds = ms / 1000
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  if (minutes > 0) {
    return `${minutes}:${seconds.toFixed(2).padStart(5, '0')}`
  }
  return `${seconds.toFixed(2)}s`
}
