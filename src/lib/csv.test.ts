import { describe, expect, it } from 'vitest'
import type { Receipt, TaxCategory } from '../types'
import { csvCell, receiptFileName, toCsv } from './csv'

const categories: TaxCategory[] = [
  { id: 'meals', name: 'Meals and entertainment', deductible: true },
  { id: 'groceries', name: 'Groceries', deductible: false },
]

function r(patch: Partial<Receipt>): Receipt {
  return { id: 'ab12cd34-ffff', image: new Blob(['x'], { type: 'image/jpeg' }), merchant: 'Cafe Lumiere', date: '2026-10-05', total: 36, currency: 'ZAR', taxCategory: 'meals', rawText: '', createdAt: '2026-10-05T10:00:00.000Z', ...patch }
}

describe('csvCell', () => {
  it('leaves plain text alone', () => {
    expect(csvCell('Cafe Lumiere')).toBe('Cafe Lumiere')
  })

  it('quotes commas, quotes and line breaks', () => {
    expect(csvCell('Smith, Jones & Co')).toBe('"Smith, Jones & Co"')
    expect(csvCell('The "Best" Deli')).toBe('"The ""Best"" Deli"')
    expect(csvCell('line one\nline two')).toBe('"line one\nline two"')
  })

  it.each(['=SUM(A1:A9)', '+1+1', '-2+3', '@cmd', '\tTab', '\rReturn'])('defuses the formula-like text %j', (text) => {
    expect(csvCell(text).replace(/^"/, '').startsWith("'")).toBe(true)
  })

  it('defuses a formula even when it also needs quoting', () => {
    expect(csvCell('=HYPERLINK("http://evil","click")')).toBe('"\'=HYPERLINK(""http://evil"",""click"")"')
  })
})

describe('receiptFileName', () => {
  it('is dated, readable, unique and uses the right extension', () => {
    expect(receiptFileName(r({}))).toBe('2026-10-05_cafe-lumiere_ab12cd34.jpg')
    expect(receiptFileName(r({ image: new Blob([], { type: 'image/png' }) }))).toMatch(/\.png$/)
    expect(receiptFileName(r({ image: new Blob([], { type: 'application/x-weird' }) }))).toMatch(/\.img$/)
  })

  it('removes characters that are unsafe in file names', () => {
    const name = receiptFileName(r({ merchant: '../../Étoile <Café>: "Nº1"?' }))
    expect(name).toBe('2026-10-05_etoile-cafe-no1_ab12cd34.jpg')
    expect(name).not.toMatch(/[\\/:*?"<>|]/)
  })

  it('has a fallback for a merchant with no usable characters', () => {
    expect(receiptFileName(r({ merchant: '???' }))).toContain('_receipt_')
  })
})

describe('toCsv', () => {
  it('starts with a byte order mark and the header, and uses Windows line endings', () => {
    const csv = toCsv([r({})], categories)
    expect(csv.startsWith('﻿Date,Merchant,Category,Tax deductible,Currency,Total,Image file\r\n')).toBe(true)
    expect(csv.endsWith('\r\n')).toBe(true)
  })

  it('writes one row per receipt, oldest first, with money as plain 2-decimal numbers', () => {
    const csv = toCsv([r({ id: 'bbbb2222', date: '2026-10-20', total: 1234.5, merchant: 'Later' }), r({})], categories)
    const lines = csv.trim().split('\r\n')
    expect(lines).toHaveLength(3)
    expect(lines[1]).toBe('2026-10-05,Cafe Lumiere,Meals and entertainment,Yes,ZAR,36.00,2026-10-05_cafe-lumiere_ab12cd34.jpg')
    expect(lines[2]?.split(',')[5]).toBe('1234.50')
  })

  it('marks non-deductible categories and unknown ones', () => {
    const lines = toCsv([r({ taxCategory: 'groceries' }), r({ id: 'zzzz9999', taxCategory: 'gone' })], categories).trim().split('\r\n')
    expect(lines[1]).toContain(',Groceries,No,')
    expect(lines[2]).toContain(',Uncategorised,No,')
  })

  it('cannot be turned into a formula through the merchant name', () => {
    const lines = toCsv([r({ merchant: '=cmd|\' /C calc\'!A0' })], categories).trim().split('\r\n')
    expect(lines[1]?.split(',')[1]?.startsWith("'=")).toBe(true)
  })

  it('is just the header for no receipts', () => {
    expect(toCsv([], categories).trim().split('\r\n')).toHaveLength(1)
  })
})
