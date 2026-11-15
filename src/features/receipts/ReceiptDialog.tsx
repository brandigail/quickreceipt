import { Download, Trash2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { ReceiptForm, type ReceiptValues } from '../../components/ReceiptForm'
import { cardClass, dangerButton, iconButton, mutedText, secondaryButton } from '../../components/ui'
import { useObjectUrl } from '../../hooks/useObjectUrl'
import { receiptFileName } from '../../lib/csv'
import { formatDate } from '../../lib/date'
import { useAppData } from '../../providers/appData'
import type { Receipt } from '../../types'

interface Props {
  receipt: Receipt | null
  onClose: () => void
}

/** A saved receipt in a window: its photo, the details to edit, and delete. */
export function ReceiptDialog({ receipt, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (receipt && !dialog.open) dialog.showModal()
    if (!receipt && dialog.open) dialog.close()
  }, [receipt])

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby="receipt-dialog-title"
      className={`${cardClass} m-auto max-h-[calc(100dvh-2rem)] w-[min(44rem,calc(100vw-1.5rem))] overflow-y-auto p-0 text-slate-900 backdrop:bg-black/50 dark:text-slate-100`}
    >
      {receipt && <Content key={receipt.id} receipt={receipt} onClose={() => ref.current?.close()} />}
    </dialog>
  )
}

function Content({ receipt, onClose }: { receipt: Receipt; onClose: () => void }) {
  const { categories, saveReceipt, removeReceipt } = useAppData()
  const url = useObjectUrl(receipt.image)
  const [confirming, setConfirming] = useState(false)

  async function save(values: ReceiptValues) {
    await saveReceipt({ ...receipt, ...values })
    onClose()
  }

  async function remove() {
    await removeReceipt(receipt.id)
    onClose()
  }

  return (
    <div className="space-y-4 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 id="receipt-dialog-title" className="truncate text-lg font-semibold">
            {receipt.merchant}
          </h2>
          <p className={`text-sm ${mutedText}`}>{formatDate(receipt.date)}</p>
        </div>
        <button type="button" className={iconButton} onClick={onClose} aria-label="Close">
          <X className="size-5" aria-hidden />
        </button>
      </div>
      {url && <img src={url} alt={`Photo of the receipt from ${receipt.merchant}`} className="max-h-80 w-full rounded-lg bg-slate-100 object-contain dark:bg-slate-800" />}
      <ReceiptForm
        initial={{ merchant: receipt.merchant, date: receipt.date, total: receipt.total.toFixed(2), currency: receipt.currency, taxCategory: receipt.taxCategory }}
        categories={categories}
        submitLabel="Save changes"
        onSubmit={(v) => void save(v)}
        extra={
          <>
            {url && (
              <a href={url} download={receiptFileName(receipt)} className={secondaryButton}>
                <Download className="size-4" aria-hidden /> Photo
              </a>
            )}
            {confirming ? (
              <button type="button" className={dangerButton} onClick={() => void remove()} onBlur={() => setConfirming(false)} autoFocus>
                Confirm delete
              </button>
            ) : (
              <button type="button" className={secondaryButton} onClick={() => setConfirming(true)}>
                <Trash2 className="size-4" aria-hidden /> Delete
              </button>
            )}
          </>
        }
      />
    </div>
  )
}
