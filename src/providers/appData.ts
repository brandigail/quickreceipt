import { createContext, useContext } from 'react'
import type { Receipt, Settings, TaxCategory } from '../types'

export interface AppData {
  /** False until the saved data has been read from this device. */
  ready: boolean
  /** True while the demo receipts are being added on the very first launch, so an empty list is not mistaken for "no receipts". */
  seeding: boolean
  receipts: Receipt[]
  categories: TaxCategory[]
  settings: Settings
  /** Set when a change could not be written to this device. */
  saveError: string | null
  saveReceipt: (receipt: Receipt) => Promise<void>
  removeReceipt: (id: string) => Promise<void>
  updateSettings: (patch: Partial<Settings>) => Promise<void>
  saveCategory: (category: TaxCategory) => Promise<void>
  removeCategory: (id: string) => Promise<void>
  loadDemo: () => Promise<void>
  clearReceipts: () => Promise<void>
}

export const AppDataContext = createContext<AppData | null>(null)

export function useAppData(): AppData {
  const ctx = useContext(AppDataContext)
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider')
  return ctx
}
