import { TriangleAlert } from 'lucide-react'
import { ReceiptForm, type ReceiptValues } from '../../components/ReceiptForm'
import { cardClass, mutedText } from '../../components/ui'
import { useObjectUrl } from '../../hooks/useObjectUrl'
import { useAppData } from '../../providers/appData'
import type { ScanStep } from './useScan'

type Review = Extract<ScanStep, { kind: 'review' }>

interface Props {
  review: Review
  onSave: (values: ReceiptValues) => void
  onDiscard: () => void
}

/** Check what the scanner read, fix anything wrong (shaky fields are flagged) and save. */
export function ScanReview({ review, onSave, onDiscard }: Props) {
  const { categories } = useAppData()
  const url = useObjectUrl(review.image)

  return (
    <section aria-labelledby="review-heading" className="space-y-4">
      <h1 id="review-heading" className="text-2xl font-bold">
        Check the details
      </h1>
      {review.scanFailed && (
        <p role="alert" className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          The scanner could not read this photo. Your photo is kept, so you can type the details in.
        </p>
      )}
      <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div className={`${cardClass} self-start overflow-hidden`}>{url &&<img src={url} alt="Your receipt" className="max-h-[28rem] w-full object-contain" />}</div>
        <div className="space-y-4">
          <div className={`${cardClass} p-4`}>
            <ReceiptForm
              initial={review.draft}
              hints={review.scanFailed ? { merchant: 'none', date: 'none', total: 'none' } : review.parsed.confidence}
              categories={categories}
              submitLabel="Save receipt"
              onSubmit={onSave}
              cancelLabel="Discard"
              onCancel={onDiscard}
            />
          </div>
          {review.rawText.trim() && (
            <details className={`${cardClass} p-3 text-sm`}>
              <summary className="min-h-9 font-medium">Text the scanner read</summary>
              <pre className={`mt-2 max-h-64 overflow-auto font-mono text-xs whitespace-pre-wrap ${mutedText}`}>{review.rawText}</pre>
            </details>
          )}
        </div>
      </div>
    </section>
  )
}
