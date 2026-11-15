import { describe, expect, it } from 'vitest'
import { formatMoney, parseAmountInput, sumAmounts } from './money'

describe('parseAmountInput', () => {
  it.each([
    ['12', 12],
    ['12.5', 12.5],
    ['12,50', 12.5],
    ['R 1 234.50', 1234.5],
    ['1,234.50', 1234.5],
    ['1.234,50', 1234.5],
    ['1,234', 1234],
    ['1.234', 1234],
    ['0.99', 0.99],
    ['  R99.5 ', 99.5],
    ['99.999', 99999],
    ['1,234,567.89', 1234567.89],
  ])('reads %j as %d', (text, expected) => {
    expect(parseAmountInput(text)).toBe(expected)
  })

  it.each(['', 'abc', '0', '0.00', '-5', ' −5.00', '..', '99999999'])('rejects %j', (text) => {
    expect(parseAmountInput(text)).toBeNull()
  })
})

describe('formatMoney', () => {
  it('formats rand with a space and grouped thousands', () => {
    expect(formatMoney(1234.5, 'ZAR')).toBe('R 1 234.50')
    expect(formatMoney(0, 'ZAR')).toBe('R 0.00')
  })

  it('uses the right symbol or the code', () => {
    expect(formatMoney(5, 'USD')).toBe('$5.00')
    expect(formatMoney(5, 'EUR')).toBe('€5.00')
    expect(formatMoney(5, 'XYZ')).toBe('XYZ 5.00')
    expect(formatMoney(-5, 'USD')).toBe('-$5.00')
  })
})

describe('sumAmounts', () => {
  it('adds without floating point error', () => {
    expect(sumAmounts([0.1, 0.2])).toBe(0.3)
    expect(sumAmounts([])).toBe(0)
  })
})
