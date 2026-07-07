import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { BackButton } from '../components/BackButton'
import { fetchSoloLeaderboard, type SoloLeaderboardEntry } from '../game/soloLeaderboard'
import { GRID_OPTIONS, gridSizeLabel, type GridSize } from '../game/types'
import { formatTime } from '../hooks/useRoundTimer'
import { getDevicePlayerId } from '../lib/devicePlayerId'
import { isSupabaseConfigured } from '../lib/supabase'

function parseGridParam(value: string | null): GridSize {
  const size = Number(value)
  return GRID_OPTIONS.includes(size as GridSize) ? (size as GridSize) : 3
}

export function SoloLeaderboard() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [gridSize, setGridSize] = useState<GridSize>(() => parseGridParam(searchParams.get('grid')))
  const [entries, setEntries] = useState<SoloLeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const devicePlayerId = getDevicePlayerId()

  useEffect(() => {
    const param = searchParams.get('grid')
    if (param) setGridSize(parseGridParam(param))
  }, [searchParams])

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    fetchSoloLeaderboard(gridSize)
      .then(setEntries)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [gridSize])

  const selectGrid = (size: GridSize) => {
    setGridSize(size)
    setSearchParams({ grid: String(size) }, { replace: true })
  }

  return (
    <div className="page solo-leaderboard">
      <BackButton label="Back" onClick={() => navigate(-1)} />
      <h1>Solo Leaderboard</h1>
      <p className="solo-leaderboard__subtitle">Top 50 fastest times</p>

      <div className="grid-tabs" role="tablist" aria-label="Grid size">
        {GRID_OPTIONS.map((size) => (
          <button
            key={size}
            type="button"
            role="tab"
            aria-selected={gridSize === size}
            className={`grid-tabs__option${gridSize === size ? ' grid-tabs__option--active' : ''}`}
            onClick={() => selectGrid(size)}
          >
            {gridSizeLabel(size)}
          </button>
        ))}
      </div>

      {!isSupabaseConfigured && (
        <p className="solo-leaderboard__offline">
          Global leaderboard requires online play to be set up.
        </p>
      )}

      {isSupabaseConfigured && loading && <p>Loading leaderboard…</p>}
      {error && <p className="error">{error}</p>}

      {isSupabaseConfigured && !loading && !error && (
        <section className="leaderboard">
          {entries.length === 0 ? (
            <p className="leaderboard__empty">No times yet for {gridSizeLabel(gridSize)}. Be the first!</p>
          ) : (
            <ol className="leaderboard__list">
              {entries.map((entry, index) => {
                const isYou = entry.playerId === devicePlayerId
                const isFirst = index === 0
                return (
                  <li
                    key={entry.id}
                    className={`leaderboard__entry${isYou ? ' leaderboard__entry--you' : ''}${isFirst ? ' leaderboard__entry--first' : ''}`}
                  >
                    <span className="leaderboard__rank">{index + 1}</span>
                    <div className="leaderboard__info">
                      <span className="leaderboard__name">
                        {entry.playerName}
                        {isYou && <span className="lobby__you">You</span>}
                      </span>
                      <span className="leaderboard__time">{formatTime(entry.totalMs)}</span>
                    </div>
                  </li>
                )
              })}
            </ol>
          )}
        </section>
      )}
    </div>
  )
}
