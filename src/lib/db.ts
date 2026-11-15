import Dexie, { type Table } from 'dexie'
import type { Receipt, Settings, TaxCategory } from '../types'

export const DEFAULT_SETTINGS: Settings = { currency: 'ZAR', dateOrder: 'dmy' }
export const FALLBACK_CATEGORY = 'other'

/** Categories every install starts with. "Other" is the catch-all and cannot be deleted. */
export const DEFAULT_CATEGORIES: readonly TaxCategory[] = [
  { id: 'meals', name: 'Meals and entertainment', deductible: true },
  { id: 'travel', name: 'Travel and transport', deductible: true },
  { id: 'fuel', name: 'Fuel', deductible: true },
  { id: 'office', name: 'Office supplies and equipment', deductible: true },
  { id: 'software', name: 'Software and subscriptions', deductible: true },
  { id: 'medical', name: 'Medical', deductible: false },
  { id: 'groceries', name: 'Groceries and household', deductible: false },
  { id: FALLBACK_CATEGORY, name: 'Other', deductible: false },
]

interface SettingsRow {
  key: string
  value: Settings
}

const SETTINGS_KEY = 'app'

/** Receipts (with their images as Blobs), tax categories and settings, all stored on this device. */
export class QuickReceiptDb extends Dexie {
  receipts!: Table<Receipt, string>
  categories!: Table<TaxCategory, string>
  settings!: Table<SettingsRow, string>

  constructor(name = 'quickreceipt') {
    super(name)
    this.version(1).stores({ receipts: 'id, date, taxCategory, createdAt', categories: 'id', settings: 'key' })
  }
}

export const db = new QuickReceiptDb()

export async function loadSettings(database: QuickReceiptDb): Promise<Settings> {
  const row = await database.settings.get(SETTINGS_KEY)
  return { ...DEFAULT_SETTINGS, ...row?.value }
}

export async function saveSettings(database: QuickReceiptDb, settings: Settings): Promise<void> {
  await database.settings.put({ key: SETTINGS_KEY, value: settings })
}

export async function saveReceipt(database: QuickReceiptDb, receipt: Receipt): Promise<void> {
  await database.receipts.put(receipt)
}

export async function deleteReceipt(database: QuickReceiptDb, id: string): Promise<void> {
  await database.receipts.delete(id)
}

export async function saveCategory(database: QuickReceiptDb, category: TaxCategory): Promise<void> {
  await database.categories.put(category)
}

/**
 * Deleting a category moves its receipts to "Other" in the same transaction, so no receipt is ever left pointing at a
 * category that no longer exists. "Other" itself cannot be deleted.
 */
export async function deleteCategory(database: QuickReceiptDb, id: string): Promise<void> {
  if (id === FALLBACK_CATEGORY) return
  await database.transaction('rw', database.receipts, database.categories, async () => {
    await database.receipts.where('taxCategory').equals(id).modify({ taxCategory: FALLBACK_CATEGORY })
    await database.categories.delete(id)
  })
}

/** Replaces everything in one transaction: the receipts are either all swapped or none are. */
export async function replaceReceipts(database: QuickReceiptDb, receipts: readonly Receipt[]): Promise<void> {
  await database.transaction('rw', database.receipts, async () => {
    await database.receipts.clear()
    await database.receipts.bulkPut([...receipts])
  })
}

/** Makes sure the default categories exist (without touching ones the user has renamed). */
export async function ensureCategories(database: QuickReceiptDb): Promise<void> {
  if ((await database.categories.count()) === 0) await database.categories.bulkPut([...DEFAULT_CATEGORIES])
}
