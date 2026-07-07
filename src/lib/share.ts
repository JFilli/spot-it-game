import { APP_NAME } from './brand'

export type ShareInviteResult = 'shared' | 'copied' | 'cancelled' | 'failed'

export function canNativeShare(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function'
}

export async function shareInviteLink(url: string): Promise<ShareInviteResult> {
  const message = `Join my ${APP_NAME} game!`

  if (canNativeShare()) {
    try {
      await navigator.share({ title: APP_NAME, text: message, url })
      return 'shared'
    } catch (err) {
      if ((err as Error).name === 'AbortError') return 'cancelled'
    }
  }

  const copied = await copyToClipboard(url)
  return copied ? 'copied' : 'failed'
}

async function copyToClipboard(url: string): Promise<boolean> {
  const message = `Join my ${APP_NAME} game!\n${url}`

  try {
    await navigator.clipboard.writeText(url)
    return true
  } catch {
    // fall through
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
