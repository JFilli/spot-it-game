import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useGameRoom } from '../hooks/useGameRoom'
import { PRACTICE_CODE, startPracticeSession } from '../game/practice'
import { getSoloBestTimes } from '../game/soloScores'
import { OnlineStatus } from '../components/OnlineStatus'
import { formatTime } from '../hooks/useRoundTimer'
import { loadSavedName, savePlayerName } from '../lib/playerName'
import { APP_DISPLAY_NAME } from '../lib/brand'

type Screen = 'name' | 'mode' | 'solo'

const RANK_LABELS = ['1st', '2nd', '3rd']

export function Home() {
  const navigate = useNavigate()
  const location = useLocation()
  const { createRoom } = useGameRoom(undefined)
  const [name, setName] = useState(loadSavedName)
  const [screen, setScreen] = useState<Screen>(loadSavedName() ? 'mode' : 'name')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [soloBests, setSoloBests] = useState(getSoloBestTimes)

  useEffect(() => {
    const nextScreen = (location.state as { screen?: Screen } | null)?.screen
    if (nextScreen === 'solo') {
      setSoloBests(getSoloBestTimes())
      setScreen('solo')
      navigate('.', { replace: true, state: null })
    }
  }, [location.state, navigate])

  const handleContinue = () => {
    if (!name.trim()) return
    savePlayerName(name.trim())
    setError(null)
    setScreen('mode')
  }

  const openSolo = () => {
    setSoloBests(getSoloBestTimes())
    setScreen('solo')
  }

  const startPractice = () => {
    const query = startPracticeSession(name.trim())
    navigate(`/play/${PRACTICE_CODE}${query}`)
  }

  const handleMultiplayer = async () => {
    setBusy(true)
    setError(null)
    try {
      const code = await createRoom(name.trim())
      navigate(`/lobby/${code}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create game')
    } finally {
      setBusy(false)
    }
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
          <h2 className="home__mode-question">Solo or Multiplayer?</h2>
          <button type="button" className="btn btn--primary" onClick={openSolo}>
            Solo
          </button>
          <button type="button" className="btn btn--secondary" disabled={busy} onClick={handleMultiplayer}>
            {busy ? 'Creating…' : 'Multiplayer'}
          </button>
          <OnlineStatus />
        </div>
      )}

      {screen === 'solo' && (
        <div className="home__solo">
          <button type="button" className="back-button" onClick={() => setScreen('mode')}>
            ← Back
          </button>
          <h2>Solo</h2>
          <section className="solo-bests">
            <h3 className="solo-bests__title">Personal Bests</h3>
            <ol className="solo-bests__list">
              {RANK_LABELS.map((label, index) => {
                const time = soloBests[index]
                return (
                  <li key={label} className={`solo-bests__item${time !== undefined ? '' : ' solo-bests__item--empty'}`}>
                    <span className="solo-bests__rank">{label}</span>
                    <span className="solo-bests__time">{time !== undefined ? formatTime(time) : '—'}</span>
                  </li>
                )
              })}
            </ol>
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
