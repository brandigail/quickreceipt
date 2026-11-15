import { useObjectUrl } from '../../hooks/useObjectUrl'
import { formatDate } from '../../lib/date'
import { formatMoney } from '../../lib/money'
import type { Receipt, TaxCategory } from '../../types'

interface Props {
  receipt: Receipt
  category: TaxCategory | undefined
  onOpen: () => void
}

export function ReceiptRow({ receipt, category, onOpen }: Props) {
  const url = useObjectUrl(receipt.image)
  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className="flex min-h-20 w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-left transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/60"
      >
        <span className="size-14 shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
          {url && <img src={url} alt="" className="size-full object-cover object-top" decoding="async" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium">{receipt.merchant}</span>
          <span className="block truncate text-xs text-slate-600 dark:text-slate-400">
            {formatDate(receipt.date)} · {category?.name ?? 'Uncategorised'}
            {category?.deductible ? ' · deductible' : ''}
          </span>
        </span>
        <span className="shrink-0 text-right font-semibold tabular-nums">{formatMoney(receipt.total, receipt.currency)}</span>
      </button>
    </li>
  )
}
