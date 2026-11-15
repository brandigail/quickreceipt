import type { DateKey } from '../types'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

/** Today (or any moment) as the user's local calendar day. */
export function toDateKey(date: Date): DateKey {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** Builds a YYYY-MM-DD key only for a real calendar day (so 31 February gives null). */
export function makeDateKey(year: number, month: number, day: number): DateKey | null {
  const date = new Date(Date.UTC(year, month - 1, day))
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null
  return `${year}-${pad(month)}-${pad(day)}`
}

export function isDateKey(value: string): value is DateKey {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  return match !== null && makeDateKey(Number(match[1]), Number(match[2]), Number(match[3])) !== null
}

/** The `YYYY-MM` a day belongs to. */
export function monthOf(day: DateKey): string {
  return day.slice(0, 7)
}

/** For example `21 Oct 2026`. */
export function formatDate(day: DateKey): string {
  const [y, m, d] = day.split('-').map(Number)
  return `${d} ${MONTHS[(m ?? 1) - 1] ?? ''} ${y}`
}

/** For example `October 2026`. */
export function formatMonth(month: string): string {
  const [y, m] = month.split('-').map(Number)
  return `${MONTH_NAMES[(m ?? 1) - 1] ?? ''} ${y}`
}

export const MONTH_ABBREVIATIONS = MONTHS
