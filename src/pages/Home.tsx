import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useGameRoom } from '../hooks/useGameRoom'
import { PRACTICE_CODE, startPracticeSession } from '../game/practice'
import { getSoloBestTime } from '../game/soloScores'
import { formatTime } from '../hooks/useRoundTimer'
import { loadSavedName, savePlayerName } from '../lib/playerName'
import { APP_DISPLAY_NAME } from '../lib/brand'
import { GRID_OPTIONS, gridSizeLabel, type GridSize } from '../game/types'

type Screen = 'name' | 'mode' | 'grid' | 'solo'
type PendingMode = 'solo' | 'multiplayer' | 'race' | null

export function Home() {
  const navigate = useNavigate()
  const location = useLocation()
  const { createRoom } = useGameRoom(undefined)
  const [name, setName] = useState(loadSavedName)
  const [screen, setScreen] = useState<Screen>(loadSavedName() ? 'mode' : 'name')
  const [pendingMode, setPendingMode] = useState<PendingMode>(null)
  const [selectedGridSize, setSelectedGridSize] = useState<GridSize>(3)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [soloBest, setSoloBest] = useState<number | null>(null)

  useEffect(() => {
    const state = location.state as {
      screen?: Screen
      gridSize?: GridSize
      pendingMode?: PendingMode
    } | null
    if (state?.screen === 'solo') {
      const grid = state.gridSize ?? 3
      setSelectedGridSize(grid)
      setSoloBest(getSoloBestTime(grid))
      setPendingMode('solo')
      setScreen('solo')
      navigate('.', { replace: true, state: null })
      return
    }
    if (state?.screen === 'grid') {
      setPendingMode(state.pendingMode ?? null)
      setScreen('grid')
      navigate('.', { replace: true, state: null })
    }
  }, [location.state, navigate])

  const handleContinue = () => {
    if (!name.trim()) return
    savePlayerName(name.trim())
    setError(null)
    setScreen('mode')
  }

  const chooseMode = (mode: PendingMode) => {
    setPendingMode(mode)
    setScreen('grid')
    setError(null)
  }

  const chooseGridSize = async (gridSize: GridSize) => {
    setSelectedGridSize(gridSize)
    if (pendingMode === 'solo') {
      setSoloBest(getSoloBestTime(gridSize))
      setScreen('solo')
      return
    }
    if (pendingMode === 'multiplayer' || pendingMode === 'race') {
      setBusy(true)
      setError(null)
      try {
        const code = await createRoom(name.trim(), gridSize, pendingMode === 'race' ? 'race' : 'async')
        navigate(pendingMode === 'race' ? `/race/${code}` : `/lobby/${code}`)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create game')
      } finally {
        setBusy(false)
      }
    }
  }

  const startPractice = () => {
    const query = startPracticeSession(name.trim(), selectedGridSize)
    navigate(`/play/${PRACTICE_CODE}${query}`)
  }

  return (
    <div className="page home">
      <header className="home__hero">
        <h1>{APP_DISPLAY_NAME}</h1>
        <p>Find the matching symbol on both cards. Lowest total time wins!</p>
      </header>

      {screen === 'name' && (
        <div className="home__form">
          <h2>What&apos;s your name?</h2>
          <label className="field">
            Your name
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              maxLength={20}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && name.trim() && handleContinue()}
            />
          </label>
          <button type="button" className="btn btn--primary" disabled={!name.trim()} onClick={handleContinue}>
            Continue
          </button>
        </div>
      )}

      {screen === 'mode' && (
        <div className="home__mode">
          <p className="home__greeting">
            Hi, <strong>{name}</strong>
            <button type="button" className="home__change-name" onClick={() => setScreen('name')}>
              Change
            </button>
          </p>
          <h2 className="home__mode-question">How do you want to play?</h2>
          <button type="button" className="btn btn--primary" onClick={() => chooseMode('solo')}>
            Solo
          </button>
          <button type="button" className="btn btn--secondary" onClick={() => chooseMode('race')}>
            1v1 Race
          </button>
          <button type="button" className="btn btn--ghost" onClick={() => chooseMode('multiplayer')}>
            Time Trial Multiplayer
          </button>
          <p className="home__mode-hint">Race = live head-to-head. Time Trial = play at your own pace.</p>
        </div>
      )}

      {screen === 'grid' && (
        <div className="home__grid">
          <button
            type="button"
            className="back-button"
            onClick={() => {
              setPendingMode(null)
              setScreen('mode')
            }}
          >
            ← Back
          </button>
          <div className="home__grid-header">
            <h2>Choose grid size</h2>
            <button
              type="button"
              className="btn btn--ghost home__leaderboard-btn"
              onClick={() => navigate('/leaderboard', { state: { from: 'grid', pendingMode } })}
            >
              Leaderboard
            </button>
          </div>
          <p className="home__grid-hint">How many symbols per card?</p>
          <div className="grid-size-picker">
            {GRID_OPTIONS.map((size) => (
              <button
                key={size}
                type="button"
                className="grid-size-picker__option"
                disabled={busy}
                onClick={() => chooseGridSize(size)}
              >
                <span className="grid-size-picker__label">{gridSizeLabel(size)}</span>
                <span className="grid-size-picker__meta">{size * size} symbols</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {screen === 'solo' && (
        <div className="home__solo">
          <button
            type="button"
            className="back-button"
            onClick={() => {
              setPendingMode('solo')
              setScreen('grid')
            }}
          >
            ← Back
          </button>
          <div className="home__solo-header">
            <h2>Solo · {gridSizeLabel(selectedGridSize)}</h2>
            <button
              type="button"
              className="btn btn--ghost home__leaderboard-btn"
              onClick={() =>
                navigate(`/leaderboard?grid=${selectedGridSize}`, {
                  state: { from: 'solo', gridSize: selectedGridSize },
                })
              }
            >
              Leaderboard
            </button>
          </div>
          <section className="solo-bests">
            <h3 className="solo-bests__title">Personal Best</h3>
            <p className={`solo-bests__best${soloBest === null ? ' solo-bests__best--empty' : ''}`}>
              {soloBest !== null ? formatTime(soloBest) : '—'}
            </p>
          </section>
          <button type="button" className="btn btn--primary" onClick={startPractice}>
            Start New Game
          </button>
        </div>
      )}

      {error && <p className="error">{error}</p>}
    </div>
  )
}
