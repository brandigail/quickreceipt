import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { cardClass, inputClass, mutedText, primaryButton } from '../../components/ui'
import { formatMonth, monthOf } from '../../lib/date'
import { formatMoney } from '../../lib/money'
import { monthsWithReceipts, reportByCurrency } from '../../lib/reports'
import { useAppData } from '../../providers/appData'
import { ReceiptDialog } from './ReceiptDialog'
import { ReceiptRow } from './ReceiptRow'

interface Props {
  onScan: () => void
}

export function ReceiptsView({ onScan }: Props) {
  const { receipts, categories, seeding } = useAppData()
  const [month, setMonth] = useState('all')
  const [category, setCategory] = useState('all')
  const [query, setQuery] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)

  const months = useMemo(() => monthsWithReceipts(receipts), [receipts])
  const byId = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])
  const shown = useMemo(() => {
    const text = query.trim().toLowerCase()
    return receipts
      .filter((r) => (month === 'all' || monthOf(r.date) === month) && (category === 'all' || r.taxCategory === category) && (!text || r.merchant.toLowerCase().includes(text)))
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
  }, [receipts, month, category, query])
  const totals = useMemo(() => reportByCurrency(shown, categories), [shown, categories])
  const opened = receipts.find((r) => r.id === openId) ?? null

  if (receipts.length === 0 && seeding) return <p className={mutedText}>Adding the sample receipts…</p>

  if (receipts.length === 0) {
    return (
      <section className={`${cardClass} space-y-3 p-6 text-center`}>
        <h1 className="text-xl font-bold">No receipts yet</h1>
        <p className={mutedText}>Scan your first receipt and it will show up here.</p>
        <button type="button" className={primaryButton} onClick={onScan}>
          Scan a receipt
        </button>
      </section>
    )
  }

  return (
    <section className="space-y-4" aria-labelledby="receipts-heading">
      <h1 id="receipts-heading" className="text-2xl font-bold">
        Receipts
      </h1>

      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_1.4fr]">
        <div>
          <label htmlFor="filter-month" className="text-sm font-medium">
            Month
          </label>
          <select id="filter-month" className={inputClass} value={month} onChange={(e) => setMonth(e.target.value)}>
            <option value="all">All months</option>
            {months.map((m) => (
              <option key={m} value={m}>
                {formatMonth(m)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="filter-category" className="text-sm font-medium">
            Category
          </label>
          <select id="filter-category" className={inputClass} value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="filter-search" className="text-sm font-medium">
            Search
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 mt-0.5 size-4 -translate-y-1/2 text-slate-500" aria-hidden />
            <input id="filter-search" type="search" className={`${inputClass} pl-9`} placeholder="Shop name" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
        </div>
      </div>

      <p className={`text-sm ${mutedText}`} data-testid="receipts-summary">
        {shown.length} receipt{shown.length === 1 ? '' : 's'}
        {totals.map((t) => ` · ${formatMoney(t.total, t.currency)}`).join('')}
      </p>

      {shown.length === 0 ? (
        <p className={mutedText}>No receipts match. Try a different month, category or search.</p>
      ) : (
        <ul className="space-y-2" aria-label="Receipts">
          {shown.map((r) => (
            <ReceiptRow key={r.id} receipt={r} category={byId.get(r.taxCategory)} onOpen={() => setOpenId(r.id)} />
          ))}
        </ul>
      )}

      <ReceiptDialog receipt={opened} onClose={() => setOpenId(null)} />
    </section>
  )
}
