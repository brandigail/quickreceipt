import { describe, expect, it } from 'vitest'
import { receiptLines, SAMPLE_RECEIPTS, sampleTotal } from '../data/sampleReceipts'
import { findAmounts, parseReceipt } from './parser'

const options = { dateOrder: 'dmy', today: '2026-11-16' } as const
const parse = (text: string, order: 'dmy' | 'mdy' = 'dmy') => parseReceipt(text, { ...options, dateOrder: order })

describe('findAmounts', () => {
  it('reads the common money formats', () => {
    expect(findAmounts('Milk 2L        37.50')).toEqual([37.5])
    expect(findAmounts('TOTAL R 1 234.50')).toEqual([1234.5])
    expect(findAmounts('TOTAL 1,234.50')).toEqual([1234.5])
    expect(findAmounts('TOTAL 1.234,50')).toEqual([1234.5])
    expect(findAmounts('TOTAL 12,50')).toEqual([12.5])
    expect(findAmounts('TOTAL R12.50')).toEqual([12.5])
  })

  it('finds several amounts in order and ignores plain numbers', () => {
    expect(findAmounts('2 x 12.50    25.00')).toEqual([12.5, 25])
    expect(findAmounts('Tel 021 555 0142')).toEqual([])
    expect(findAmounts('VAT 15%')).toEqual([])
  })

  it('does not mistake a date for money', () => {
    expect(findAmounts('12.10.2026 14:32')).toEqual([])
    expect(findAmounts('2026-10-05')).toEqual([])
  })

  it('repairs letters a scanner reads inside numbers', () => {
    expect(findAmounts('TOTAL 1O5.OO')).toEqual([105])
    expect(findAmounts('TOTAL 2l9.5O')).toEqual([219.5])
  })
})

describe('total', () => {
  it('uses the line labelled total, not the biggest number', () => {
    const r = parse('SHOP\nItem 10.00\nItem 20.00\nSUBTOTAL 30.00\nTOTAL 30.00\nCASH 100.00\nCHANGE 70.00')
    expect(r.total).toBe(30)
    expect(r.confidence.total).toBe('high')
  })

  it('prefers a strong label such as total due', () => {
    expect(parse('SHOP\nTOTAL 80.00\nTOTAL DUE 95.00').total).toBe(95)
  })

  it('ignores subtotal, VAT total, items and tendered lines', () => {
    const r = parse('SHOP\nSUBTOTAL 100.00\nTOTAL VAT 13.04\nTOTAL ITEMS 3\nTOTAL TENDERED 200.00\nTOTAL 100.00')
    expect(r.total).toBe(100)
  })

  it('reads an amount printed on the line after the label', () => {
    expect(parse('SHOP\nTOTAL\n R 249.99').total).toBe(249.99)
  })

  it('falls back to the largest amount, with low confidence, when nothing says total', () => {
    const r = parse('SHOP\nItem 10.00\nItem 45.50\nCARD 55.50')
    expect(r.total).toBe(45.5)
    expect(r.confidence.total).toBe('low')
  })

  it('falls back to a whole number beside the word total', () => {
    const r = parse('SHOP\nTOTAL 150')
    expect(r.total).toBe(150)
    expect(r.confidence.total).toBe('low')
  })

  it('reports nothing found when there are no amounts', () => {
    expect(parse('hello world')).toMatchObject({ total: null, confidence: { total: 'none' } })
  })

  it('flags a total that is smaller than an item line', () => {
    expect(parse('SHOP\nTV 5000.00\nTOTAL 15.00').confidence.total).toBe('medium')
  })
})

describe('date', () => {
  const dateOf = (line: string, order: 'dmy' | 'mdy' = 'dmy') => parse(`SHOP\n${line}\nTOTAL 10.00`, order)

  it('reads year-first dates', () => {
    expect(dateOf('2026-10-05 14:30')).toMatchObject({ date: '2026-10-05', confidence: { date: 'high' } })
    expect(dateOf('2026/10/05').date).toBe('2026-10-05')
  })

  it('reads month names in either order', () => {
    expect(dateOf('21 Oct 2026').date).toBe('2026-10-21')
    expect(dateOf('21 October 2026').date).toBe('2026-10-21')
    expect(dateOf('Oct 21, 2026').date).toBe('2026-10-21')
    expect(dateOf('3rd Sept 2026').date).toBe('2026-09-03')
    expect(dateOf('21-Oct-26').date).toBe('2026-10-21')
  })

  it('resolves day/month order by the setting only when it is truly ambiguous', () => {
    expect(dateOf('03/04/2026', 'dmy')).toMatchObject({ date: '2026-04-03', confidence: { date: 'medium' } })
    expect(dateOf('03/04/2026', 'mdy')).toMatchObject({ date: '2026-03-04', confidence: { date: 'medium' } })
    expect(dateOf('25/04/2026', 'mdy')).toMatchObject({ date: '2026-04-25', confidence: { date: 'high' } })
    expect(dateOf('04/25/2026', 'dmy')).toMatchObject({ date: '2026-04-25', confidence: { date: 'high' } })
    expect(dateOf('05/05/2026')).toMatchObject({ date: '2026-05-05', confidence: { date: 'high' } })
  })

  it('reads two-digit years and dotted dates', () => {
    expect(dateOf('11.09.26').date).toBe('2026-09-11')
    expect(dateOf('11.09.2026 10:27').date).toBe('2026-09-11')
  })

  it('rejects impossible, future and ancient dates', () => {
    expect(dateOf('31/02/2026').date).toBeNull()
    expect(dateOf('20/11/2026').date).toBeNull()
    expect(dateOf('01/01/1999').date).toBeNull()
  })

  it('accepts yesterday, today and tomorrow (clock differences) but not later', () => {
    expect(dateOf('2026-11-16').date).toBe('2026-11-16')
    expect(dateOf('2026-11-17').date).toBe('2026-11-17')
    expect(dateOf('2026-11-18').date).toBeNull()
  })

  it('skips expiry and due dates and takes the next real one', () => {
    expect(parse('SHOP\nValid until 2027-01-01\n05/10/2026\nTOTAL 10.00').date).toBe('2026-10-05')
  })

  it('repairs letters a scanner reads inside a date', () => {
    expect(dateOf('2O26-1O-O5').date).toBe('2026-10-05')
    expect(dateOf('O5/1O/2O26').date).toBe('2026-10-05')
  })

  it('reports nothing found when there is no date', () => {
    expect(dateOf('no date here')).toMatchObject({ date: null, confidence: { date: 'none' } })
  })
})

describe('merchant', () => {
  it('takes the first real line and tidies shouting', () => {
    expect(parse('FRESHWAY MARKET\n12 Main Road\nTOTAL 10.00')).toMatchObject({ merchant: 'Freshway Market', confidence: { merchant: 'high' } })
  })

  it('skips noise lines above the name', () => {
    expect(parse('*** TAX INVOICE ***\nTel 021 555 0142\nCafe Lumiere\nTOTAL 10.00').merchant).toBe('Cafe Lumiere')
  })

  it('skips addresses, dates and prices', () => {
    expect(parse('12 Main Road, Rondebosch\n2026-10-05\n10.00\nGreenleaf Pharmacy\nTOTAL 10.00').merchant).toBe('Greenleaf Pharmacy')
  })

  it('strips scanner junk around the name and keeps mixed case', () => {
    expect(parse('| = Smith & Sons Hardware ~\nTOTAL 10.00').merchant).toBe('Smith & Sons Hardware')
  })

  it('has lower confidence when the name is not at the top', () => {
    expect(parse('TAX INVOICE\nTel 1234567\nVAT Reg 1234\nthank you\nWelcome\nDelta Stores\nTOTAL 10.00').confidence.merchant).toBe('medium')
  })

  it('reports nothing for text with no words', () => {
    expect(parse('123\n456')).toMatchObject({ merchant: '', confidence: { merchant: 'none' } })
  })
})

describe('currency', () => {
  it('detects rand, dollar, euro and pound', () => {
    expect(parse('SHOP\nTOTAL R 10.00').currency).toBe('ZAR')
    expect(parse('SHOP\nTOTAL $10.00').currency).toBe('USD')
    expect(parse('SHOP\nTOTAL €10.00').currency).toBe('EUR')
    expect(parse('SHOP\nTOTAL £10.00').currency).toBe('GBP')
    expect(parse('SHOP\nTOTAL 10.00 ZAR').currency).toBe('ZAR')
  })

  it('says nothing when the receipt shows no currency', () => {
    expect(parse('SHOP\nTOTAL 10.00').currency).toBeNull()
  })
})

// These are real scanner outputs, captured from the app after the photo was compressed to JPEG, errors included.
describe('real scanner output with mistakes', () => {
  const stationers = [
    'OFFICE HUB STATIONERS',
    '45 Voortrekker Road, Parow',
    'Tel. 1921. 555101.68',
    'VAT Reg 4120000000',
    'TAX INVOICE',
    '11.09.26 10r27',
    'A4 paper 5 reams 349.50',
    'Ballpoint pens 12pk 54.90',
    'Stapler heavy duty 129.06',
    'Sticky notes 6pk 62 ..50',
    'Toner cartridge 899.00',
    'SUBTOTAL 1494.90',
    'VAT 15% INCLUDED 194.99',
    'AMOUNT DUE R 1494.90',
    'CARD ****4821 1494.90',
    'THANK YOU FOR YOUR BUSINESS',
  ].join('\n')

  it('is not thrown off by a phone number misread as an amount', () => {
    expect(parse(stationers)).toMatchObject({ merchant: 'Office Hub Stationers', date: '2026-09-11', total: 1494.9, confidence: { total: 'high', date: 'medium' } })
  })

  it('skips a junk line made of one repeated letter above the real name', () => {
    const cafe = 'EEE\nCAFE LUMIERE\n7 Kloof Street, Gardens\nTel 021 555 0119\nVAT Reg 4120000000\nTAX INVOICE\n\n06 Nov 2026 09:12\nCappuccino 38.00\nSUBTOTAL 114.00\nVAT 15% INCLUDED 14.87\nTOTAL R114.00\nCASH 150.00\nCHANGE 36.00'
    expect(parse(cafe)).toMatchObject({ merchant: 'Cafe Lumiere', date: '2026-11-06', total: 114, confidence: { total: 'high' } })
  })

  it('still accepts a short real name', () => {
    expect(parse('BOB\n12 Main Road\nTOTAL 10.00').merchant).toBe('BOB')
    expect(parse('KFC\nTOTAL 10.00').merchant).toBe('KFC')
  })

  it('does not take a phone or registration line as the total when nothing says total', () => {
    expect(parse('SHOP\nTel 021 555 0142.50\nVAT Reg 4120000.00\nItem 25.00').total).toBe(25)
  })
})

describe('the twelve sample receipts', () => {
  it.each(SAMPLE_RECEIPTS.map((s) => [s.slug, s] as const))('%s is read correctly', (_slug, sample) => {
    const r = parse(receiptLines(sample).join('\n'))
    expect(r.merchant.toLowerCase()).toBe(sample.merchant.toLowerCase())
    expect(r.date).toBe(sample.date)
    expect(r.total).toBe(sampleTotal(sample))
    expect(r.confidence.total).toBe('high')
  })
})
