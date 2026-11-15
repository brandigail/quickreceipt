import JSZip from 'jszip'
import { describe, expect, it } from 'vitest'
import type { Receipt, TaxCategory } from '../types'
import { receiptFileName } from './csv'
import { buildMonthZip } from './zip'

const categories: TaxCategory[] = [{ id: 'meals', name: 'Meals', deductible: true }]

function r(id: string, merchant: string, bytes: number[]): Receipt {
  return { id, image: new Blob([new Uint8Array(bytes)], { type: 'image/jpeg' }), merchant, date: '2026-10-05', total: 10, currency: 'ZAR', taxCategory: 'meals', rawText: '', createdAt: '2026-10-05T10:00:00.000Z' }
}

describe('buildMonthZip', () => {
  const receipts = [r('aaaa1111', 'Cafe One', [1, 2, 3]), r('bbbb2222', 'Cafe Two', [9, 8, 7, 6])]

  it('holds the CSV and one image per receipt, with names that match the CSV', async () => {
    const zip = await JSZip.loadAsync(await (await buildMonthZip('2026-10', receipts, categories)).arrayBuffer())
    const names = Object.keys(zip.files).filter((n) => !zip.files[n]?.dir).sort()
    expect(names).toEqual(['expenses-2026-10.csv', ...receipts.map((x) => `images/${receiptFileName(x)}`)].sort())
    const csv = await zip.file('expenses-2026-10.csv')?.async('string')
    for (const receipt of receipts) expect(csv).toContain(receiptFileName(receipt))
  })

  it('keeps every image byte-for-byte', async () => {
    const zip = await JSZip.loadAsync(await (await buildMonthZip('2026-10', receipts, categories)).arrayBuffer())
    const second = receipts[1]
    const bytes = second ? await zip.file(`images/${receiptFileName(second)}`)?.async('uint8array') : undefined
    expect([...(bytes ?? [])]).toEqual([9, 8, 7, 6])
  })

  it('still produces a valid ZIP with just the CSV when there are no receipts', async () => {
    const zip = await JSZip.loadAsync(await (await buildMonthZip('2026-10', [], categories)).arrayBuffer())
    expect(Object.keys(zip.files).filter((n) => !zip.files[n]?.dir)).toEqual(['expenses-2026-10.csv'])
  })
})
