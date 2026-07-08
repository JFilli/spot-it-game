import { Navigate, Route, Routes, useParams } from 'react-router-dom'
import { Home } from './pages/Home'
import { Lobby } from './pages/Lobby'
import { PlayRoute } from './pages/PlayRoute'
import { RaceLobby } from './pages/RaceLobby'
import { RacePlay } from './pages/RacePlay'
import { SoloLeaderboard } from './pages/SoloLeaderboard'

function JoinRedirect() {
  const { code } = useParams<{ code: string }>()
  if (!code) return <Navigate to="/" replace />
  const cleanCode = code.split('?')[0].split('/')[0].toUpperCase()
  return <Navigate to={`/lobby/${cleanCode}`} replace />
}

function ResultsRedirect() {
  const { code } = useParams<{ code: string }>()
  return <Navigate to={`/lobby/${code}`} replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/leaderboard" element={<SoloLeaderboard />} />
      <Route path="/lobby/:code" element={<Lobby />} />
      <Route path="/race/:code" element={<RaceLobby />} />
      <Route path="/race/:code/play" element={<RacePlay />} />
      <Route path="/play/:code" element={<PlayRoute />} />
      <Route path="/results/:code" element={<ResultsRedirect />} />
      <Route path="/join/:code" element={<JoinRedirect />} />
    </Routes>
  )
}
