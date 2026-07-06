import emojiPool from './emojiPool.json'

export interface SymbolDef {
  id: string
  label: string
  emoji: string
}

function emojiToId(emoji: string): string {
  const cps: string[] = []
  for (let i = 0; i < emoji.length; ) {
    const cp = emoji.codePointAt(i)!
    cps.push(cp.toString(16))
    i += cp > 0xffff ? 2 : 1
  }
  return cps.join('-')
}

export const SYMBOLS: SymbolDef[] = (emojiPool as string[]).map((emoji) => ({
  id: emojiToId(emoji),
  label: emoji,
  emoji,
}))

const symbolMap = new Map(SYMBOLS.map((s) => [s.id, s]))

export function getSymbol(id: string): SymbolDef {
  const symbol = symbolMap.get(id)
  if (!symbol) throw new Error(`Unknown symbol: ${id}`)
  return symbol
}
