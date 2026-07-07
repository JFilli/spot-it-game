interface QuitConfirmProps {
  isMultiplayer: boolean
  quitting: boolean
  onCancel: () => void
  onConfirm: () => void
}

export function QuitConfirm({ isMultiplayer, quitting, onCancel, onConfirm }: QuitConfirmProps) {
  return (
    <div className="overlay">
      <div className="overlay__card">
        <h2>Quit game?</h2>
        <p className="quit-confirm__message">
          {isMultiplayer
            ? 'You will be marked as Quit on the leaderboard and cannot finish this game.'
            : 'Your progress in this round will be lost.'}
        </p>
        <button type="button" className="btn btn--primary" onClick={onCancel}>
          Keep Playing
        </button>
        <button type="button" className="btn btn--ghost" disabled={quitting} onClick={onConfirm}>
          {quitting ? 'Quitting…' : 'Yes, Quit'}
        </button>
      </div>
    </div>
  )
}
