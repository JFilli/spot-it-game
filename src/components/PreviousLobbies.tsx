import { useNavigate } from 'react-router-dom'
import { getLobbyHistory } from '../game/lobbyHistory'
import { useGameRoom } from '../hooks/useGameRoom'
import { formatTime } from '../hooks/useRoundTimer'

interface PreviousLobbiesProps {
  currentCode?: string
  showEmpty?: boolean
}

export function PreviousLobbies({ currentCode, showEmpty = false }: PreviousLobbiesProps) {
  const navigate = useNavigate()
  const { joinRoom } = useGameRoom(undefined)
  const history = getLobbyHistory().filter((e) => e.code !== currentCode?.toUpperCase())

  if (history.length === 0 && !showEmpty) return null

  const handleOpen = async (code: string, playerName: string) => {
    try {
      await joinRoom(code, playerName)
      navigate(`/lobby/${code}`)
    } catch {
      navigate(`/lobby/${code}`)
    }
  }

  return (
    <section className="previous-lobbies">
      <h2 className="previous-lobbies__title">Previous Games</h2>
      {history.length === 0 ? (
        <p className="previous-lobbies__empty">No previous games yet. Finish a game to see it here.</p>
      ) : (
        <ul className="previous-lobbies__list">
          {history.map((entry) => (
            <li key={entry.code}>
              <button
                type="button"
                className="previous-lobbies__item"
                onClick={() => handleOpen(entry.code, entry.playerName)}
              >
                <span className="previous-lobbies__code">Multiplayer game</span>
                <span className="previous-lobbies__meta">
                  Your time: {formatTime(entry.yourTimeMs)}
                  {' · '}
                  {entry.playerCount} player{entry.playerCount === 1 ? '' : 's'}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
