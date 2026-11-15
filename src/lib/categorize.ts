import { FALLBACK_CATEGORY } from './db'
import type { Receipt } from '../types'

const KEYWORDS: readonly [category: string, pattern: RegExp][] = [
  ['fuel', /petrol|fuel|diesel|garage|service station|filling|engen|shell|bp\b|caltex|total energies/i],
  ['meals', /cafe|caf[eé]|coffee|restaurant|bistro|grill|pizza|burger|diner|bakery|sushi|kitchen|eatery|bar\b|pub\b/i],
  ['travel', /taxi|cab\b|uber|bolt|airline|airways|flight|train|bus\b|parking|toll|car hire|hotel|lodge|airbnb/i],
  ['medical', /pharmacy|chemist|clinic|doctor|dental|dentist|optom|hospital|medi/i],
  ['software', /software|subscription|cloud|online|app store|licen[sc]e|hosting|domain|saas/i],
  ['office', /stationer|office|paper|print|toner|cartridge|techno|computer|electronics|hardware/i],
  ['groceries', /market|supermarket|grocer|spar\b|checkers|woolworths|pick n pay|fresh|butcher|deli\b/i],
]

/**
 * Suggests a category from what the user did last time with the same merchant, and otherwise from words in the name.
 * It only ever suggests: the user sees it in the form and can change it.
 */
export function suggestCategory(merchant: string, history: readonly Receipt[], validIds: ReadonlySet<string>): string {
  const name = merchant.trim().toLowerCase()
  if (name) {
    const previous = history
      .filter((r) => r.merchant.trim().toLowerCase() === name && validIds.has(r.taxCategory))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
    if (previous) return previous.taxCategory
    for (const [category, pattern] of KEYWORDS) {
      if (pattern.test(name) && validIds.has(category)) return category
    }
  }
  return FALLBACK_CATEGORY
}
