import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameRoom } from '../hooks/useGameRoom'
import { PRACTICE_CODE, startPracticeSession } from '../game/practice'
import { PreviousLobbies } from '../components/PreviousLobbies'
import { OnlineStatus } from '../components/OnlineStatus'
import { loadSavedName, savePlayerName } from '../lib/playerName'

type Screen = 'name' | 'menu' | 'create' | 'join'

export function Home() {
  const navigate = useNavigate()
  const { createRoom, joinRoom } = useGameRoom(undefined)
  const [name, setName] = useState(loadSavedName)
  const [joinCode, setJoinCode] = useState('')
  const [screen, setScreen] = useState<Screen>(loadSavedName() ? 'menu' : 'name')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleContinue = () => {
    if (!name.trim()) return
    savePlayerName(name.trim())
    setError(null)
    setScreen('menu')
  }

  const handleCreate = async () => {
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

  const handleJoin = async () => {
    if (!joinCode.trim()) return
    setBusy(true)
    setError(null)
    try {
      await joinRoom(joinCode.trim(), name.trim())
      navigate(`/lobby/${joinCode.trim().toUpperCase()}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join game')
    } finally {
      setBusy(false)
    }
  }

  const startPractice = () => {
    const query = startPracticeSession(name.trim())
    navigate(`/play/${PRACTICE_CODE}${query}`)
  }

  return (
    <div className="page home">
      <header className="home__hero">
        <h1>Spot It</h1>
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

      {screen === 'menu' && (
        <div className="home__menu">
          <p className="home__greeting">
            Hi, <strong>{name}</strong>
            <button type="button" className="home__change-name" onClick={() => setScreen('name')}>
              Change
            </button>
          </p>
          <button type="button" className="btn btn--primary" onClick={() => setScreen('create')}>
            Create Game
          </button>
          <button type="button" className="btn btn--secondary" onClick={() => setScreen('join')}>
            Join Game
          </button>
          <button type="button" className="btn btn--ghost" onClick={startPractice}>
            Practice Solo
          </button>
          <OnlineStatus />
          <PreviousLobbies showEmpty />
        </div>
      )}

      {screen === 'create' && (
        <div className="home__form">
          <h2>Create Game</h2>
          <p>Playing as <strong>{name}</strong></p>
          <button type="button" className="btn btn--primary" disabled={busy} onClick={handleCreate}>
            {busy ? 'Creating…' : 'Get Game Code'}
          </button>
          <button type="button" className="btn btn--ghost" onClick={() => setScreen('menu')}>
            Back
          </button>
        </div>
      )}

      {screen === 'join' && (
        <div className="home__form">
          <h2>Join Game</h2>
          <p>Playing as <strong>{name}</strong></p>
          <label className="field">
            Game code
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="ABC123"
              maxLength={6}
              autoFocus
            />
          </label>
          <button type="button" className="btn btn--primary" disabled={busy || joinCode.length < 4} onClick={handleJoin}>
            {busy ? 'Joining…' : 'Join'}
          </button>
          <button type="button" className="btn btn--ghost" onClick={() => setScreen('menu')}>
            Back
          </button>
        </div>
      )}

      {error && <p className="error">{error}</p>}
    </div>
  )
}
