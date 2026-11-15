import { useCallback, useState } from 'react'
import { suggestCategory } from '../../lib/categorize'
import { toDateKey } from '../../lib/date'
import { ImageError, prepareImage } from '../../lib/image'
import { recognizeReceipt, type OcrProgress } from '../../lib/ocr'
import { parseReceipt } from '../../lib/parser'
import { useAppData } from '../../providers/appData'
import type { ParsedReceipt } from '../../types'
import type { ReceiptDraft } from '../../components/ReceiptForm'
import { CURRENCIES } from '../../lib/currencies'

export type ScanStep =
  | { kind: 'idle'; error: string | null }
  | { kind: 'working'; preview: Blob; label: string; fraction: number | null }
  | { kind: 'review'; image: Blob; draft: ReceiptDraft; parsed: ParsedReceipt; rawText: string; scanFailed: boolean }

const IDLE: ScanStep = { kind: 'idle', error: null }

const EMPTY_PARSE: ParsedReceipt = {
  merchant: '',
  date: null,
  total: null,
  currency: null,
  confidence: { merchant: 'none', date: 'none', total: 'none' },
}

/**
 * The scan flow: shrink the photo, read it on this device, pre-fill the form from what was read, and hand over to the
 * user to check. If reading fails the user still gets the photo and an empty form, so a bad scan never blocks saving.
 */
export function useScan() {
  const { receipts, categories, settings } = useAppData()
  const [step, setStep] = useState<ScanStep>(IDLE)

  const scan = useCallback(
    async (file: Blob) => {
      setStep({ kind: 'working', preview: file, label: 'Preparing the photo…', fraction: null })
      let image: Blob
      let forScan: Blob
      try {
        const prepared = await prepareImage(file)
        image = prepared.stored
        forScan = prepared.forScan
      } catch (error) {
        setStep({ kind: 'idle', error: error instanceof ImageError ? error.message : 'That image could not be read.' })
        return
      }
      setStep({ kind: 'working', preview: image, label: 'Starting the scanner…', fraction: null })

      let rawText = ''
      let scanFailed = false
      try {
        const result = await recognizeReceipt(forScan, (p: OcrProgress) =>
          setStep({
            kind: 'working',
            preview: image,
            label: p.stage === 'reading' ? 'Reading the receipt…' : 'Loading the scanner (first time only)…',
            fraction: p.stage === 'reading' ? p.fraction : null,
          }),
        )
        rawText = result.text
      } catch {
        scanFailed = true
      }

      const parsed = scanFailed ? EMPTY_PARSE : parseReceipt(rawText, { dateOrder: settings.dateOrder })
      const currency = parsed.currency && (CURRENCIES as readonly string[]).includes(parsed.currency) ? parsed.currency : settings.currency
      const validIds = new Set(categories.map((c) => c.id))
      setStep({
        kind: 'review',
        image,
        parsed,
        rawText,
        scanFailed,
        draft: {
          merchant: parsed.merchant,
          date: parsed.date ?? toDateKey(new Date()),
          total: parsed.total === null ? '' : parsed.total.toFixed(2),
          currency,
          taxCategory: suggestCategory(parsed.merchant, receipts, validIds),
        },
      })
    },
    [receipts, categories, settings],
  )

  const reset = useCallback(() => setStep(IDLE), [])
  return { step, scan, reset }
}
