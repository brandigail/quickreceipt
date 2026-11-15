import type { Confidence, DateKey, DateOrder, ParsedReceipt } from '../types'
import { makeDateKey, toDateKey } from './date'

export interface ParseOptions {
  /** How to read a date like 03/04/2026 when it could be either order. */
  dateOrder: DateOrder
  /** Today, so dates in the future (almost always misreads) can be rejected. */
  today?: DateKey
}

const MONTH_INDEX: Readonly<Record<string, number>> = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 }
const MONTH_WORD = 'jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sept?(?:ember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?'

// ---------- Amounts ----------

/** 1 234.50, 1,234.50, 1.234,50, 1234.50 and 12,50: digits, optional thousands groups, then exactly two decimals. */
const AMOUNT = /(?<![\d.,])(\d{1,3}(?:[  ,.]\d{3})+|\d+)[.,](\d{2})(?!\d)/g
const NUMERIC_DATE = /\d{1,4}\s?[-/.]\s?\d{1,2}\s?[-/.]\s?\d{2,4}/g

/**
 * Scanners often read 0 as O and 1 as l or I inside a number. This fixes those, but only inside a run of digit-like
 * characters that contains at least one real digit and is not part of a word, so "TOTAL", "OIL" and "21-Oct-26" are left alone.
 */
function repairRuns(text: string, joiners: string): string {
  const run = new RegExp(`(?<![A-Za-z])[\\dOolI|][\\dOolI|${joiners}]*(?![A-Za-z])`, 'g')
  return text.replace(run, (r) => (/\d/.test(r) ? r.replace(/[Oo]/g, '0').replace(/[lI|]/g, '1') : r))
}

function fixDigits(line: string): string {
  return repairRuns(line, '.,')
}

/** Every money amount on a line, left to right. Dates are blanked out first so 12.10 in 12.10.2026 is not read as money. */
export function findAmounts(line: string): number[] {
  const cleaned = fixDigits(line).replace(NUMERIC_DATE, (m) => ' '.repeat(m.length))
  return [...cleaned.matchAll(AMOUNT)].map((m) => Number(`${(m[1] ?? '').replace(/\D/g, '')}.${m[2] ?? '00'}`))
}

/** Lines whose numbers are never money: phone and registration numbers (which a scanner can easily misread as 555101.68). */
const NOT_MONEY = /\b(tel|telephone|phone|fax|cell|vat\s*reg(?:istration)?|reg(?:istration)?\s*no|vat\s*no|account\s*no|invoice\s*no|ref(?:erence)?\s*no|barcode)\b|\*{3,}/i

const NOT_A_TOTAL = /sub\s*-?\s*total|total\s+(?:vat|tax|discount|saving|saved|items?|qty|quantity|points)|(?:vat|tax|items?)\s+total|\bchange\b|tendered/i
const PAYMENT = /\b(cash|card|visa|master\s?card|eft|tender(?:ed)?|change|paid|payment|round(?:ing)?|vat|tax|discount|saving|saved|points)\b/i
const STRONG_TOTAL = /grand\s*total|total\s*due|amount\s*due|balance\s*due|total\s*payable|amount\s*payable|total\s*to\s*pay|net\s*total|total\s*incl|total\s*amount/i
const PLAIN_TOTAL = /\btotal\b|\bto\s*pay\b|\bamt\s*due\b/i

interface TotalGuess {
  value: number | null
  confidence: Confidence
}

function guessTotal(lines: readonly string[]): TotalGuess {
  const candidates: { rank: number; value: number }[] = []
  lines.forEach((line, i) => {
    if (NOT_A_TOTAL.test(line)) return
    const rank = STRONG_TOTAL.test(line) ? 2 : PLAIN_TOTAL.test(line) ? 1 : 0
    if (rank === 0) return
    // The amount is normally on the same line; some receipts print it on the next line.
    const found = findAmounts(line).at(-1) ?? findAmounts(lines[i + 1] ?? '')[0] ?? findAmounts(lines[i + 2] ?? '')[0]
    if (found !== undefined) candidates.push({ rank, value: found })
  })

  if (candidates.length > 0) {
    const best = Math.max(...candidates.map((c) => c.rank))
    const value = Math.max(...candidates.filter((c) => c.rank === best).map((c) => c.value))
    // Sanity check: a "total" smaller than an ordinary line on the receipt is probably the wrong number.
    const itemMax = Math.max(0, ...lines.filter((l) => !PAYMENT.test(l) && !PLAIN_TOTAL.test(l) && !NOT_MONEY.test(l)).flatMap(findAmounts))
    return { value, confidence: value >= itemMax ? 'high' : 'medium' }
  }

  const fallback = Math.max(0, ...lines.filter((l) => !PAYMENT.test(l) && !NOT_MONEY.test(l)).flatMap(findAmounts))
  if (fallback > 0) return { value: fallback, confidence: 'low' }

  // Last resort: a whole-number amount printed beside the word total.
  for (const line of lines) {
    if (NOT_A_TOTAL.test(line) || !PLAIN_TOTAL.test(line)) continue
    const whole = /(\d{1,6})\s*$/.exec(line)
    if (whole?.[1]) return { value: Number(whole[1]), confidence: 'low' }
  }
  return { value: null, confidence: 'none' }
}

// ---------- Dates ----------

interface DateGuess {
  date: DateKey | null
  confidence: Confidence
}

function fullYear(raw: string): number {
  const n = Number(raw)
  return raw.length <= 2 ? 2000 + n : n
}

/** A date is accepted only if it is real, not in the future (give or take a day) and not absurdly old. */
function acceptable(date: DateKey | null, today: DateKey): date is DateKey {
  if (date === null) return false
  const year = Number(date.slice(0, 4))
  const tomorrow = toDateKey(new Date(new Date(`${today}T12:00:00`).getTime() + 86_400_000))
  return year >= Number(today.slice(0, 4)) - 15 && date <= tomorrow
}

function tryLine(line: string, order: DateOrder, today: DateKey): DateGuess | null {
  const text = repairRuns(line, '/.-')

  const iso = /\b(\d{4})\s?[-/.]\s?(\d{1,2})\s?[-/.]\s?(\d{1,2})\b/.exec(text)
  if (iso) {
    const date = makeDateKey(Number(iso[1]), Number(iso[2]), Number(iso[3]))
    if (acceptable(date, today)) return { date, confidence: 'high' }
  }

  const named = new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?[\\s.,-]*(${MONTH_WORD})\\b[\\s.,-]*(\\d{4}|\\d{2})\\b`, 'i').exec(text)
  if (named) {
    const date = makeDateKey(fullYear(named[3] ?? ''), MONTH_INDEX[(named[2] ?? '').slice(0, 3).toLowerCase()] ?? 0, Number(named[1]))
    if (acceptable(date, today)) return { date, confidence: 'high' }
  }

  const monthFirst = new RegExp(`\\b(${MONTH_WORD})\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?,?\\s+(\\d{4}|\\d{2})\\b`, 'i').exec(text)
  if (monthFirst) {
    const date = makeDateKey(fullYear(monthFirst[3] ?? ''), MONTH_INDEX[(monthFirst[1] ?? '').slice(0, 3).toLowerCase()] ?? 0, Number(monthFirst[2]))
    if (acceptable(date, today)) return { date, confidence: 'high' }
  }

  const numeric = /\b(\d{1,2})\s?[-/.]\s?(\d{1,2})\s?[-/.]\s?(\d{4}|\d{2})\b/.exec(text)
  if (numeric) {
    const a = Number(numeric[1])
    const b = Number(numeric[2])
    const year = fullYear(numeric[3] ?? '')
    // If one part cannot be a month, the order is obvious; if both could be, use the user's setting and say so.
    const [day, month, certain] = a > 12 ? [a, b, true] : b > 12 ? [b, a, true] : a === b ? [a, b, true] : order === 'dmy' ? [a, b, false] : [b, a, false]
    const date = makeDateKey(year, month, day)
    if (acceptable(date, today)) return { date, confidence: certain ? 'high' : 'medium' }
  }
  return null
}

function guessDate(lines: readonly string[], order: DateOrder, today: DateKey): DateGuess {
  for (const line of lines) {
    if (/\b(expir\w*|exp|valid\s+until|due\s+date|best\s+before)\b/i.test(line)) continue
    const guess = tryLine(line, order, today)
    if (guess) return guess
  }
  return { date: null, confidence: 'none' }
}

// ---------- Merchant ----------

const NOT_A_NAME = /tax\s+invoice|invoice|receipt|welcome|vat\s*(?:reg|no|number)|reg(?:istration)?\s*no|\btel\b|\bphone\b|\bfax\b|www\.|https?:|@|\btill\b|cashier|customer\s+copy|copy|thank|^\s*(?:store|branch)\s*#?\d*\s*$/i
const STREET = /^\s*\d+\s+\w+|\b(street|road|rd|avenue|ave|drive|lane|boulevard|blvd|highway|crescent)\b/i

function titleCase(text: string): string {
  const letters = text.replace(/[^A-Za-z]/g, '')
  if (letters.length < 4 || letters !== letters.toUpperCase()) return text
  return text.toLowerCase().replace(/(^|[\s&/-])([a-z])/g, (_m, sep: string, c: string) => sep + c.toUpperCase())
}

function guessMerchant(lines: readonly string[]): { name: string; confidence: Confidence } {
  const head = lines.slice(0, 10)
  let picked: { name: string; index: number } | null = null
  for (const [index, raw] of head.entries()) {
    const line = raw.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9.)!]+$/g, '').replace(/\s+/g, ' ').trim()
    const letters = (line.match(/[A-Za-z]/g) ?? []).length
    if (letters < 3 || letters / line.length < 0.5) continue
    // Shadows and paper edges come out of a scanner as runs like "EEE" or "lll"; a real name has at least two different letters.
    if (new Set(line.toLowerCase().match(/[a-z]/g)).size < 2) continue
    if (NOT_A_NAME.test(line) || STREET.test(line)) continue
    if (/\d{1,2}\s?[-/.:]\s?\d{1,2}/.test(line) || findAmounts(line).length > 0) continue
    picked = { name: titleCase(line).slice(0, 60), index }
    break
  }
  if (picked) return { name: picked.name, confidence: picked.index <= 1 ? 'high' : 'medium' }
  const first = (head.find((l) => /[A-Za-z]{3,}/.test(l)) ?? '').replace(/[^A-Za-z0-9 &'.-]/g, ' ').replace(/\s+/g, ' ').trim()
  return first ? { name: titleCase(first).slice(0, 60), confidence: 'low' } : { name: '', confidence: 'none' }
}

// ---------- Currency ----------

function guessCurrency(text: string): string | null {
  const scores: Record<string, number> = {
    ZAR: (text.match(/\bZAR\b/gi)?.length ?? 0) * 3 + (text.match(/\bR\s?\d/g)?.length ?? 0),
    USD: (text.match(/\bUSD\b/gi)?.length ?? 0) * 3 + (text.match(/\$\s?\d/g)?.length ?? 0),
    EUR: (text.match(/\bEUR\b/gi)?.length ?? 0) * 3 + (text.match(/€\s?\d/g)?.length ?? 0),
    GBP: (text.match(/\bGBP\b/gi)?.length ?? 0) * 3 + (text.match(/£\s?\d/g)?.length ?? 0),
  }
  const [code, score] = Object.entries(scores).sort((a, b) => b[1] - a[1])[0] ?? ['', 0]
  return score > 0 ? code : null
}

/** Reads merchant, date and total out of the text a scanner produced, with a confidence for each so the form can flag shaky ones. */
export function parseReceipt(text: string, options: ParseOptions): ParsedReceipt {
  const today = options.today ?? toDateKey(new Date())
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  const merchant = guessMerchant(lines)
  const date = guessDate(lines, options.dateOrder, today)
  const total = guessTotal(lines)
  return {
    merchant: merchant.name,
    date: date.date,
    total: total.value,
    currency: guessCurrency(text),
    confidence: { merchant: merchant.confidence, date: date.confidence, total: total.confidence },
  }
}
