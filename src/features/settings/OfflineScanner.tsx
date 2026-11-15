import { CircleCheck, Download, LoaderCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cardClass, errorText, mutedText, secondaryButton } from '../../components/ui'
import { isOcrCached, prepareOcr } from '../../lib/ocr'

type State = 'checking' | 'missing' | 'loading' | 'ready' | 'failed'

/** Lets the user download the scanner ahead of time, so the very first scan can happen with no connection. */
export function OfflineScanner() {
  const [state, setState] = useState<State>('checking')

  useEffect(() => {
    void isOcrCached().then((cached) => setState(cached ? 'ready' : 'missing'))
  }, [])

  async function prepare() {
    setState('loading')
    try {
      // Wait for the service worker to take over so it can keep the files; without one the scanner still works online.
      if ('serviceWorker' in navigator && !navigator.serviceWorker.controller) {
        await Promise.race([navigator.serviceWorker.ready, new Promise((resolve) => window.setTimeout(resolve, 3000))])
        await new Promise((resolve) => window.setTimeout(resolve, 300))
      }
      await prepareOcr()
      setState((await isOcrCached()) ? 'ready' : 'failed')
    } catch {
      setState('failed')
    }
  }

  return (
    <section className={`${cardClass} space-y-3 p-4`} aria-labelledby="offline-heading">
      <h2 id="offline-heading" className="text-lg font-semibold">
        Offline scanning
      </h2>
      <p className={`text-sm ${mutedText}`}>The scanner is about 6 MB. Download it once and receipts can be scanned with no internet connection at all.</p>
      {state === 'ready' ? (
        <p className="flex items-center gap-2 text-sm font-medium text-emerald-800 dark:text-emerald-300" role="status">
          <CircleCheck className="size-5" aria-hidden /> The scanner is saved on this device.
        </p>
      ) : (
        <button type="button" className={secondaryButton} onClick={() => void prepare()} disabled={state === 'loading' || state === 'checking'}>
          {state === 'loading' ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : <Download className="size-4" aria-hidden />}
          {state === 'loading' ? 'Downloading…' : 'Download the scanner for offline use'}
        </button>
      )}
      {state === 'failed' && (
        <p role="alert" className={`text-sm ${errorText}`}>
          The scanner could not be saved. Check your connection and try again.
        </p>
      )}
    </section>
  )
}
