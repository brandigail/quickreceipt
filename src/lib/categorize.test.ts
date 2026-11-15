import { describe, expect, it } from 'vitest'
import type { Receipt } from '../types'
import { suggestCategory } from './categorize'

const ids = new Set(['meals', 'travel', 'fuel', 'office', 'software', 'medical', 'groceries', 'other'])

function past(merchant: string, taxCategory: string, createdAt = '2026-10-01T10:00:00.000Z'): Receipt {
  return { id: `${merchant}-${createdAt}`, image: new Blob([]), merchant, date: '2026-10-01', total: 1, currency: 'ZAR', taxCategory, rawText: '', createdAt }
}

describe('suggestCategory', () => {
  it('repeats what the user chose last time for the same merchant, ignoring case and spacing', () => {
    expect(suggestCategory('  freshway market ', [past('Freshway Market', 'meals')], ids)).toBe('meals')
  })

  it('uses the most recent choice when it changed', () => {
    const history = [past('Shop', 'office', '2026-09-01T10:00:00.000Z'), past('Shop', 'travel', '2026-10-01T10:00:00.000Z')]
    expect(suggestCategory('Shop', history, ids)).toBe('travel')
  })

  it('ignores history that points at a deleted category', () => {
    expect(suggestCategory('Cafe Lumiere', [past('Cafe Lumiere', 'gone')], ids)).toBe('meals')
  })

  it.each([
    ['PETROPOINT SERVICE STATION', 'fuel'],
    ['Cafe Lumiere', 'meals'],
    ['Metro Taxi Co', 'travel'],
    ['Greenleaf Pharmacy', 'medical'],
    ['Clickstore Online', 'software'],
    ['Office Hub Stationers', 'office'],
    ['Freshway Market', 'groceries'],
  ])('guesses %s as %s from its name', (merchant, expected) => {
    expect(suggestCategory(merchant, [], ids)).toBe(expected)
  })

  it('falls back to Other for an unknown or empty merchant', () => {
    expect(suggestCategory('Zzyzx Holdings', [], ids)).toBe('other')
    expect(suggestCategory('', [], ids)).toBe('other')
  })

  it('does not suggest a category that does not exist', () => {
    expect(suggestCategory('Cafe Lumiere', [], new Set(['other']))).toBe('other')
  })
})
