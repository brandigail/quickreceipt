import { useState } from 'react'
import { cardClass, dangerButton, mutedText, primaryButton, secondaryButton } from '../../components/ui'
import { useAppData } from '../../providers/appData'

type Pending = 'demo' | 'clear'

export function DataSettings() {
  const { receipts, saveError, loadDemo, clearReceipts } = useAppData()
  const [pending, setPending] = useState<Pending | null>(null)
  const [done, setDone] = useState<string | null>(null)

  async function confirm() {
    if (pending === 'demo') {
      await loadDemo()
      setDone('Loaded the sample receipts.')
    } else {
      await clearReceipts()
      setDone('All receipts were deleted.')
    }
    setPending(null)
  }

  return (
    <section className={`${cardClass} space-y-4 p-4`} aria-labelledby="data-heading">
      <h2 id="data-heading" className="text-lg font-semibold">
        Your data
      </h2>
      <p className={`text-sm ${mutedText}`}>
        Receipts and photos are stored only in this browser, on this device ({receipts.length} saved). Export a month from Reports to keep a copy, especially before clearing browser data.
      </p>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={secondaryButton} onClick={() => setPending('demo')}>
          Load sample receipts
        </button>
        <button type="button" className={secondaryButton} onClick={() => setPending('clear')}>
          Delete all receipts
        </button>
      </div>
      {pending && (
        <div role="alertdialog" aria-label="Confirm" className="space-y-3 rounded-xl border border-amber-300 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/40">
          <p className="text-sm">
            {pending === 'demo' ? 'This replaces your receipts with 12 sample receipts. Export first if you want to keep yours.' : `This deletes all ${receipts.length} receipts and their photos from this device. This cannot be undone.`}
          </p>
          <div className="flex gap-2">
            <button type="button" className={pending === 'clear' ? dangerButton : primaryButton} onClick={() => void confirm()} autoFocus>
              {pending === 'demo' ? 'Load samples' : 'Delete everything'}
            </button>
            <button type="button" className={secondaryButton} onClick={() => setPending(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}
      {done && !saveError && (
        <p role="status" className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
          {done}
        </p>
      )}
    </section>
  )
}
