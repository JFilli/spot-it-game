import { useNavigate } from 'react-router-dom'

interface BackButtonProps {
  label?: string
  onClick?: () => void
}

export function BackButton({ label = 'Back', onClick }: BackButtonProps) {
  const navigate = useNavigate()

  return (
    <button type="button" className="back-button" onClick={onClick ?? (() => navigate('/'))}>
      ← {label}
    </button>
  )
}
