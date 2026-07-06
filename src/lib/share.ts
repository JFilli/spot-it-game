export async function shareLobby(code: string, url: string): Promise<'shared' | 'copied' | 'failed'> {
  const text = `Join my Spot It game!\nCode: ${code}\n${url}`

  if (navigator.share) {
    try {
      await navigator.share({ title: 'Spot It', text, url })
      return 'shared'
    } catch (err) {
      if ((err as Error).name === 'AbortError') return 'failed'
    }
  }

  try {
    await navigator.clipboard.writeText(text)
    return 'copied'
  } catch {
    return 'failed'
  }
}
