import { describe, expect, it } from 'vitest'
import { SAMPLE_RECEIPTS, sampleTotal } from '../data/sampleReceipts'
import { DEFAULT_CATEGORIES } from './db'
import { buildDemoReceipts } from './seed'

const image = async () => new Blob(['img'], { type: 'image/png' })

describe('buildDemoReceipts', () => {
  it('builds one receipt per sample, matching the printed totals, dates and categories', async () => {
    const receipts = await buildDemoReceipts(image)
    expect(receipts).toHaveLength(SAMPLE_RECEIPTS.length)
    for (const sample of SAMPLE_RECEIPTS) {
      const receipt = receipts.find((r) => r.id === `sample-${sample.slug}`)
      expect(receipt).toMatchObject({ date: sample.date, total: sampleTotal(sample), taxCategory: sample.taxCategory, currency: 'ZAR' })
      expect(receipt?.rawText).toContain(sample.merchant)
    }
  })

  it('tidies the shouting merchant names', async () => {
    const names = (await buildDemoReceipts(image)).map((r) => r.merchant)
    expect(names).toContain('Freshway Market')
    expect(names).toContain('Petropoint Service Station')
  })

  it('uses real categories, real dates, and spreads over several months', async () => {
    const receipts = await buildDemoReceipts(image)
    const ids = new Set(DEFAULT_CATEGORIES.map((c) => c.id))
    expect(receipts.every((r) => ids.has(r.taxCategory))).toBe(true)
    expect(receipts.every((r) => /^\d{4}-\d{2}-\d{2}$/.test(r.date) && !Number.isNaN(Date.parse(r.createdAt)))).toBe(true)
    expect(new Set(receipts.map((r) => r.date.slice(0, 7))).size).toBeGreaterThanOrEqual(4)
  })

  it('skips an image that cannot be loaded instead of failing everything', async () => {
    const receipts = await buildDemoReceipts(async (url) => {
      if (url.includes('metro-taxi-oct')) throw new Error('missing')
      return image()
    })
    expect(receipts).toHaveLength(SAMPLE_RECEIPTS.length - 1)
  })
})
