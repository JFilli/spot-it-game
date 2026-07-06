import { isSupabaseConfigured } from '../lib/supabase'

export function OnlineStatus() {
  if (isSupabaseConfigured) {
    return (
      <p className="online-status online-status--on">
        Online — friends can join from any phone or computer
      </p>
    )
  }

  return (
    <div className="online-status online-status--off">
      <p><strong>Local mode only</strong> — other devices cannot join your games yet.</p>
      <p className="online-status__hint">
        See <code>SETUP_ONLINE.md</code> in the project folder to enable play with friends.
      </p>
    </div>
  )
}
