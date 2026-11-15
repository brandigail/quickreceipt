import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import type { Receipt } from '../types'
import { DEFAULT_CATEGORIES, DEFAULT_SETTINGS, deleteCategory, deleteReceipt, ensureCategories, loadSettings, QuickReceiptDb, replaceReceipts, saveCategory, saveReceipt, saveSettings } from './db'

let database: QuickReceiptDb
let counter = 0

function receipt(id: string, taxCategory = 'meals'): Receipt {
  return { id, image: new Blob(['x'], { type: 'image/jpeg' }), merchant: `Shop ${id}`, date: '2026-10-05', total: 10, currency: 'ZAR', taxCategory, rawText: '', createdAt: '2026-10-05T10:00:00.000Z' }
}

beforeEach(() => {
  database = new QuickReceiptDb(`test-${counter++}`)
})

describe('receipts', () => {
  it('saves, updates and deletes', async () => {
    await saveReceipt(database, receipt('a'))
    await saveReceipt(database, { ...receipt('a'), merchant: 'Renamed' })
    expect((await database.receipts.toArray()).map((r) => r.merchant)).toEqual(['Renamed'])
    await deleteReceipt(database, 'a')
    expect(await database.receipts.count()).toBe(0)
  })

  it('keeps the image Blob', async () => {
    await saveReceipt(database, receipt('a'))
    const stored = await database.receipts.get('a')
    expect(stored?.image.type).toBe('image/jpeg')
    expect(stored?.image.size).toBe(1)
  })

  it('replaces everything at once', async () => {
    await saveReceipt(database, receipt('old'))
    await replaceReceipts(database, [receipt('n1'), receipt('n2')])
    expect((await database.receipts.toArray()).map((r) => r.id).sort()).toEqual(['n1', 'n2'])
  })
})

describe('categories', () => {
  it('starts with the defaults, once', async () => {
    await ensureCategories(database)
    await ensureCategories(database)
    expect(await database.categories.count()).toBe(DEFAULT_CATEGORIES.length)
  })

  it('does not overwrite categories the user changed', async () => {
    await ensureCategories(database)
    await saveCategory(database, { id: 'meals', name: 'Client lunches', deductible: false })
    await ensureCategories(database)
    expect((await database.categories.get('meals'))?.name).toBe('Client lunches')
  })

  it('moves receipts to Other when their category is deleted', async () => {
    await ensureCategories(database)
    await saveReceipt(database, receipt('a', 'fuel'))
    await saveReceipt(database, receipt('b', 'meals'))
    await deleteCategory(database, 'fuel')
    expect(await database.categories.get('fuel')).toBeUndefined()
    expect((await database.receipts.get('a'))?.taxCategory).toBe('other')
    expect((await database.receipts.get('b'))?.taxCategory).toBe('meals')
  })

  it('never deletes Other', async () => {
    await ensureCategories(database)
    await deleteCategory(database, 'other')
    expect(await database.categories.get('other')).toBeDefined()
  })
})

describe('settings', () => {
  it('defaults, then remembers changes', async () => {
    expect(await loadSettings(database)).toEqual(DEFAULT_SETTINGS)
    await saveSettings(database, { currency: 'USD', dateOrder: 'mdy' })
    expect(await loadSettings(database)).toEqual({ currency: 'USD', dateOrder: 'mdy' })
  })
})
