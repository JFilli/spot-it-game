import { useLocation, useParams } from 'react-router-dom'
import { Play } from './Play'

export function PlayRoute() {
  const { code } = useParams<{ code: string }>()
  const location = useLocation()
  const attempt = new URLSearchParams(location.search).get('attempt') ?? '0'
  return <Play key={`${code}-${attempt}`} />
}
