import { useNavigate } from 'react-router-dom'

interface BackButtonProps {
  label?: string
}

export function BackButton({ label = 'Back' }: BackButtonProps) {
  const navigate = useNavigate()

  return (
    <button type="button" className="back-button" onClick={() => navigate('/')}>
      ← {label}
    </button>
  )
}
