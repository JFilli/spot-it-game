import { APP_NAME } from './brand'

export async function copyInviteLink(url: string): Promise<boolean> {
  const message = `Join my ${APP_NAME} game!\n${url}`

  // Prefer clipboard — button says "Copy Invite Link"
  try {
    await navigator.clipboard.writeText(url)
    return true
  } catch {
    // Clipboard can fail on some mobile browsers; try share sheet next
  }

  if (navigator.share) {
    try {
      await navigator.share({ title: APP_NAME, text: message, url })
      return true
    } catch (err) {
      if ((err as Error).name === 'AbortError') return false
    }
  }

  try {
    await navigator.clipboard.writeText(message)
    return true
  } catch {
    return copyViaFallback(url)
  }
}

function copyViaFallback(text: string): boolean {
  try {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'fixed'
    textarea.style.left = '-9999px'
    document.body.appendChild(textarea)
    textarea.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(textarea)
    return ok
  } catch {
    return false
  }
}
