import { useCallback, useSyncExternalStore } from 'react'

export type Tab = 'scan' | 'receipts' | 'reports' | 'settings'

export const TABS: readonly { id: Tab; label: string }[] = [
  { id: 'scan', label: 'Scan' },
  { id: 'receipts', label: 'Receipts' },
  { id: 'reports', label: 'Reports' },
  { id: 'settings', label: 'Settings' },
]

function read(): Tab {
  const id = window.location.hash.replace(/^#\/?/, '')
  return TABS.find((t) => t.id === id)?.id ?? 'scan'
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener('hashchange', onChange)
  return () => window.removeEventListener('hashchange', onChange)
}

/** The current screen, kept in the URL hash so the back button and a refresh both behave. */
export function useTab(): [Tab, (tab: Tab) => void] {
  const tab = useSyncExternalStore(subscribe, read, (): Tab => 'scan')
  const go = useCallback((next: Tab) => {
    window.location.hash = `/${next}`
    window.scrollTo({ top: 0 })
  }, [])
  return [tab, go]
}
