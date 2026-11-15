import { useLiveQuery } from 'dexie-react-hooks'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { DEFAULT_CATEGORIES, DEFAULT_SETTINGS, db, deleteCategory, deleteReceipt, ensureCategories, loadSettings, replaceReceipts, saveCategory, saveReceipt, saveSettings } from '../lib/db'
import { buildDemoReceipts } from '../lib/seed'
import type { Receipt, Settings, TaxCategory } from '../types'
import { AppDataContext, type AppData } from './appData'

const SEEDED_KEY = 'quickreceipt-seeded'
const NO_RECEIPTS: Receipt[] = []

const SETTLE_MS = 2500

/**
 * Resolves once the page has fully loaded, a short grace period has passed and the browser is idle. The demo receipts are
 * a dozen images, so on a slow connection they must never compete with the app's own first load. (Safari has no
 * requestIdleCallback, so it simply waits out the grace period.)
 */
async function whenIdle(): Promise<void> {
  if (document.readyState !== 'complete') await new Promise<void>((resolve) => window.addEventListener('load', () => resolve(), { once: true }))
  await new Promise<void>((resolve) => window.setTimeout(resolve, SETTLE_MS))
  const requestIdle: ((callback: () => void, options?: { timeout: number }) => number) | undefined = window.requestIdleCallback?.bind(window)
  if (requestIdle) await new Promise<void>((resolve) => requestIdle(() => resolve(), { timeout: 2000 }))
}

// A flag records that the demo receipts were added once, so deleting them all later does not bring them back.
function wasSeeded(): boolean {
  try {
    return localStorage.getItem(SEEDED_KEY) === '1'
  } catch {
    return false
  }
}

function markSeeded(): void {
  try {
    localStorage.setItem(SEEDED_KEY, '1')
  } catch {
    // ignore: worst case the demo is offered again on an empty database
  }
}

/** Reads receipts, categories and settings live from IndexedDB and adds the demo receipts on the very first launch. */
export function AppDataProvider({ children }: { children: ReactNode }) {
  const [initialised, setInitialised] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        await ensureCategories(db)
        const needsDemo = (await db.receipts.count()) === 0 && !wasSeeded()
        // The app is usable as soon as the categories exist; the demo receipts (a dozen images) arrive in the background.
        if (needsDemo && !cancelled) setSeeding(true)
        if (!cancelled) setInitialised(true)
        if (needsDemo) {
          // Wait until the browser is idle so the sample images never compete with the app's own first load.
          await whenIdle()
          await replaceReceipts(db, await buildDemoReceipts())
          markSeeded()
        }
      } catch {
        setSaveError('Your browser is blocking storage, so receipts cannot be saved on this device.')
        if (!cancelled) setInitialised(true)
      } finally {
        if (!cancelled) setSeeding(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const receipts = useLiveQuery(() => db.receipts.toArray(), [])
  const categories = useLiveQuery(() => db.categories.toArray(), [])
  const settings = useLiveQuery(() => loadSettings(db), [])

  const guard = useCallback(async (work: () => Promise<void>) => {
    try {
      await work()
      setSaveError(null)
    } catch {
      setSaveError('Your last change could not be saved on this device.')
    }
  }, [])

  const value = useMemo<AppData>(() => {
    const currentSettings: Settings = settings ?? DEFAULT_SETTINGS
    return {
      ready: initialised && receipts !== undefined && categories !== undefined && settings !== undefined,
      seeding,
      receipts: receipts ?? NO_RECEIPTS,
      categories: categories ?? [...DEFAULT_CATEGORIES],
      settings: currentSettings,
      saveError,
      saveReceipt: (receipt: Receipt) => guard(() => saveReceipt(db, receipt)),
      removeReceipt: (id: string) => guard(() => deleteReceipt(db, id)),
      updateSettings: (patch: Partial<Settings>) => guard(() => saveSettings(db, { ...currentSettings, ...patch })),
      saveCategory: (category: TaxCategory) => guard(() => saveCategory(db, category)),
      removeCategory: (id: string) => guard(() => deleteCategory(db, id)),
      loadDemo: () => guard(async () => replaceReceipts(db, await buildDemoReceipts())),
      clearReceipts: () => guard(() => replaceReceipts(db, [])),
    }
  }, [initialised, seeding, receipts, categories, settings, saveError, guard])

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}
