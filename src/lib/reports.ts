import type { Receipt, TaxCategory } from '../types'
import { monthOf } from './date'
import { fromCents, toCents } from './money'

/** Months that have at least one receipt, newest first, as YYYY-MM. */
export function monthsWithReceipts(receipts: readonly Receipt[]): string[] {
  return [...new Set(receipts.map((r) => monthOf(r.date)))].sort().reverse()
}

export function receiptsInMonth(receipts: readonly Receipt[], month: string): Receipt[] {
  return receipts.filter((r) => monthOf(r.date) === month)
}

export interface CategoryRow {
  category: TaxCategory
  count: number
  total: number
  /** Share of the month's spend in this currency, 0 to 1. */
  share: number
}

export interface CurrencyReport {
  currency: string
  count: number
  total: number
  deductibleTotal: number
  rows: CategoryRow[]
}

/**
 * Totals for a set of receipts, by currency and then by category, biggest first. Amounts in different currencies are
 * never added together, and sums are done in whole cents so rounding errors cannot creep into a tax report.
 */
export function reportByCurrency(receipts: readonly Receipt[], categories: readonly TaxCategory[]): CurrencyReport[] {
  const byId = new Map(categories.map((c) => [c.id, c]))
  const currencies = [...new Set(receipts.map((r) => r.currency))].sort()
  return currencies.map((currency) => {
    const mine = receipts.filter((r) => r.currency === currency)
    const totalCents = mine.reduce((sum, r) => sum + toCents(r.total), 0)
    const rows: CategoryRow[] = []
    let deductibleCents = 0
    for (const id of new Set(mine.map((r) => r.taxCategory))) {
      const inCategory = mine.filter((r) => r.taxCategory === id)
      const cents = inCategory.reduce((sum, r) => sum + toCents(r.total), 0)
      const category = byId.get(id) ?? { id, name: 'Uncategorised', deductible: false }
      if (category.deductible) deductibleCents += cents
      rows.push({ category, count: inCategory.length, total: fromCents(cents), share: totalCents === 0 ? 0 : cents / totalCents })
    }
    rows.sort((a, b) => b.total - a.total || a.category.name.localeCompare(b.category.name))
    return { currency, count: mine.length, total: fromCents(totalCents), deductibleTotal: fromCents(deductibleCents), rows }
  })
}
