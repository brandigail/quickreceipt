/** Money is added up in whole cents, so 0.1 + 0.2 never shows up as 0.30000000000000004 in a report. */
export function toCents(amount: number): number {
  return Math.round(amount * 100)
}

export function fromCents(cents: number): number {
  return cents / 100
}

export function sumAmounts(amounts: readonly number[]): number {
  return fromCents(amounts.reduce((sum, a) => sum + toCents(a), 0))
}

/**
 * Reads an amount someone typed: `12.5`, `12,50`, `R 1 234.50`, `1,234.50` or `1.234,50`. Returns null for anything that
 * is not a positive amount of at most 10 million, so a typo can never be saved as a total.
 */
export function parseAmountInput(text: string): number | null {
  if (/^\s*[-−–]/.test(text)) return null
  const cleaned = text.replace(/[^\d.,]/g, '')
  if (!/\d/.test(cleaned)) return null
  const lastDot = cleaned.lastIndexOf('.')
  const lastComma = cleaned.lastIndexOf(',')
  const separator = Math.max(lastDot, lastComma)
  let normalised: string
  if (separator === -1) normalised = cleaned
  else {
    const decimals = cleaned.length - separator - 1
    // A lone separator followed by exactly three digits (1,234 or 1.234) is a thousands mark, not a decimal point.
    const onlyOneKind = lastDot === -1 || lastComma === -1
    const isThousands = onlyOneKind && decimals === 3 && cleaned.indexOf(cleaned[separator] ?? '') === separator
    normalised = isThousands ? cleaned.replace(/[.,]/g, '') : `${cleaned.slice(0, separator).replace(/[.,]/g, '')}.${cleaned.slice(separator + 1)}`
  }
  const value = Number(normalised)
  if (!Number.isFinite(value) || value <= 0 || value > 10_000_000) return null
  return Math.round(value * 100) / 100
}

const SYMBOLS: Readonly<Record<string, string>> = { ZAR: 'R', USD: '$', EUR: '€', GBP: '£' }
const NBSP = ' '

/** For example `R 1 234.50` or `$1 234.50`; a currency without a known symbol is shown by its code. */
export function formatMoney(amount: number, currency: string): string {
  const [whole = '0', cents = '00'] = Math.abs(amount).toFixed(2).split('.')
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, NBSP)
  const sign = amount < 0 ? '-' : ''
  const symbol = SYMBOLS[currency]
  const prefix = symbol === undefined ? `${currency}${NBSP}` : symbol === 'R' ? `R${NBSP}` : symbol
  return `${sign}${prefix}${grouped}.${cents}`
}
