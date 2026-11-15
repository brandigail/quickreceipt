/** A calendar day as YYYY-MM-DD. */
export type DateKey = string

export interface Receipt {
  id: string
  /** The receipt photo, compressed, stored as a Blob in IndexedDB. */
  image: Blob
  merchant: string
  date: DateKey
  /** The total in the currency's main unit (for example rand, not cents). */
  total: number
  currency: string
  /** The id of a TaxCategory. */
  taxCategory: string
  /** Everything the scanner read, kept so the fields can be re-checked later. */
  rawText: string
  createdAt: string
}

export interface TaxCategory {
  id: string
  name: string
  deductible: boolean
}

export type DateOrder = 'dmy' | 'mdy'

export interface Settings {
  currency: string
  /** How to read an ambiguous date such as 03/04/2026. */
  dateOrder: DateOrder
}

/** How sure the reader is about one field, so the form can ask the user to double-check shaky ones. */
export type Confidence = 'high' | 'medium' | 'low' | 'none'

export interface ParsedReceipt {
  merchant: string
  date: DateKey | null
  total: number | null
  /** Detected currency code, or null when the receipt does not show one. */
  currency: string | null
  confidence: { merchant: Confidence; date: Confidence; total: Confidence }
}
