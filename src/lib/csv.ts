import type { Receipt, TaxCategory } from '../types'

const BOM = '﻿'
const HEADER = ['Date', 'Merchant', 'Category', 'Tax deductible', 'Currency', 'Total', 'Image file']

/**
 * One CSV cell, quoted when needed. Text that starts with = + - @ (or a tab or carriage return) would be run as a
 * formula by Excel or Sheets, and the merchant comes from scanned text, so it gets a leading apostrophe to keep it as text.
 */
export function csvCell(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
}

const EXTENSIONS: Readonly<Record<string, string>> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' }

/** A file name that is safe on every system and unique per receipt, for example `2026-10-05_freshway-market_ab12cd34.jpg`. */
export function receiptFileName(receipt: Receipt): string {
  const slug = receipt.merchant
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30)
  const id = receipt.id.replace(/[^a-z0-9]/gi, '').slice(0, 8)
  return `${receipt.date}_${slug || 'receipt'}_${id}.${EXTENSIONS[receipt.image.type] ?? 'img'}`
}

/** The receipts as CSV, oldest first, with a byte order mark so Excel reads accents and symbols correctly. */
export function toCsv(receipts: readonly Receipt[], categories: readonly TaxCategory[]): string {
  const byId = new Map(categories.map((c) => [c.id, c]))
  const rows = [...receipts]
    .sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt))
    .map((r) => {
      const category = byId.get(r.taxCategory)
      return [r.date, csvCell(r.merchant), csvCell(category?.name ?? 'Uncategorised'), category?.deductible ? 'Yes' : 'No', r.currency, r.total.toFixed(2), csvCell(receiptFileName(r))].join(',')
    })
  return `${BOM}${[HEADER.join(','), ...rows].join('\r\n')}\r\n`
}
