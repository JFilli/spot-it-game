import { APP_NAME } from './brand'

export async function copyInviteLink(url: string): Promise<boolean> {
  const text = `Join my ${APP_NAME} game!\n${url}`

  if (navigator.share) {
    try {
      await navigator.share({ title: APP_NAME, text, url })
      return true
    } catch (err) {
      if ((err as Error).name === 'AbortError') return false
    }
  }

  try {
    await navigator.clipboard.writeText(url)
    return true
  } catch {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      return false
    }
  }
}
