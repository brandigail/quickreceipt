import { lazy, Suspense } from 'react'
import { Header } from './components/Header'
import { TabBar } from './components/TabBar'
import { UpdatePrompt } from './components/UpdatePrompt'
import { mutedText } from './components/ui'
import { ScanView } from './features/scan/ScanView'
import { useTab } from './hooks/useTab'
import { useAppData } from './providers/appData'

// Everything except the scan screen loads on demand, which keeps the first load small.
const ReceiptsView = lazy(() => import('./features/receipts/ReceiptsView').then((m) => ({ default: m.ReceiptsView })))
const ReportsView = lazy(() => import('./features/reports/ReportsView').then((m) => ({ default: m.ReportsView })))
const SettingsView = lazy(() => import('./features/settings/SettingsView'))

export function App() {
  const { ready, saveError } = useAppData()
  const [tab, go] = useTab()

  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <UpdatePrompt />
      <Header tab={tab} onTab={go} />
      {saveError && (
        <p role="alert" className="bg-amber-100 px-4 py-2 text-center text-sm text-amber-950 dark:bg-amber-950 dark:text-amber-100">
          {saveError}
        </p>
      )}
      <main className="mx-auto max-w-5xl px-4 pt-4 pb-28 md:pb-10">
        {!ready ? (
          <p className={mutedText}>Loading your receipts…</p>
        ) : (
          <Suspense fallback={<p className={mutedText}>Loading…</p>}>
            {tab === 'scan' && <ScanView onSaved={() => go('receipts')} />}
            {tab === 'receipts' && <ReceiptsView onScan={() => go('scan')} />}
            {tab === 'reports' && <ReportsView onScan={() => go('scan')} />}
            {tab === 'settings' && <SettingsView />}
          </Suspense>
        )}
      </main>
      <TabBar tab={tab} onTab={go} />
    </div>
  )
}
