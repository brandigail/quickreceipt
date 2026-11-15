import { describe, expect, it } from 'vitest'
import type { Receipt, TaxCategory } from '../types'
import { monthsWithReceipts, receiptsInMonth, reportByCurrency } from './reports'

const categories: TaxCategory[] = [
  { id: 'meals', name: 'Meals', deductible: true },
  { id: 'fuel', name: 'Fuel', deductible: true },
  { id: 'groceries', name: 'Groceries', deductible: false },
]

function r(id: string, date: string, total: number, taxCategory: string, currency = 'ZAR'): Receipt {
  return { id, image: new Blob([]), merchant: id, date, total, currency, taxCategory, rawText: '', createdAt: `${date}T10:00:00.000Z` }
}

const receipts = [r('a', '2026-10-05', 100, 'meals'), r('b', '2026-10-20', 50.5, 'fuel'), r('c', '2026-10-21', 200, 'groceries'), r('d', '2026-09-30', 10, 'meals'), r('e', '2026-11-02', 5, 'fuel')]

describe('months', () => {
  it('lists months that have receipts, newest first', () => {
    expect(monthsWithReceipts(receipts)).toEqual(['2026-11', '2026-10', '2026-09'])
  })

  it('picks a month by the receipt date, not when it was scanned, and handles month ends', () => {
    expect(receiptsInMonth(receipts, '2026-10').map((x) => x.id)).toEqual(['a', 'b', 'c'])
    expect(receiptsInMonth(receipts, '2026-09').map((x) => x.id)).toEqual(['d'])
  })
})

describe('reportByCurrency', () => {
  const [report] = reportByCurrency(receiptsInMonth(receipts, '2026-10'), categories)

  it('totals the month and the deductible part', () => {
    expect(report?.count).toBe(3)
    expect(report?.total).toBe(350.5)
    expect(report?.deductibleTotal).toBe(150.5)
  })

  it('orders categories by spend with shares that add up to 1', () => {
    expect(report?.rows.map((x) => x.category.id)).toEqual(['groceries', 'meals', 'fuel'])
    expect(report?.rows.reduce((s, x) => s + x.share, 0)).toBeCloseTo(1)
    expect(report?.rows[0]).toMatchObject({ count: 1, total: 200 })
  })

  it('adds in whole cents so floating point error never shows', () => {
    const tenths = [0.1, 0.2, 0.3, 0.7].map((t, i) => r(`t${i}`, '2026-10-01', t, 'meals'))
    expect(reportByCurrency(tenths, categories)[0]?.total).toBe(1.3)
  })

  it('keeps currencies separate', () => {
    const mixed = [r('a', '2026-10-01', 100, 'meals'), r('b', '2026-10-02', 20, 'meals', 'USD')]
    const reports = reportByCurrency(mixed, categories)
    expect(reports.map((x) => [x.currency, x.total])).toEqual([['USD', 20], ['ZAR', 100]])
  })

  it('labels a receipt whose category was removed instead of dropping it', () => {
    const [x] = reportByCurrency([r('a', '2026-10-01', 10, 'ghost')], categories)
    expect(x?.rows[0]?.category.name).toBe('Uncategorised')
    expect(x?.total).toBe(10)
  })

  it('is empty for no receipts', () => {
    expect(reportByCurrency([], categories)).toEqual([])
  })
})
