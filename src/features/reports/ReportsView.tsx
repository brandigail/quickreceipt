import { FileArchive, FileSpreadsheet, LoaderCircle } from 'lucide-react'
import { useMemo, useState } from 'react'
import { cardClass, errorText, inputClass, mutedText, primaryButton, secondaryButton } from '../../components/ui'
import { toCsv } from '../../lib/csv'
import { downloadBlob } from '../../lib/download'
import { formatMonth } from '../../lib/date'
import { monthsWithReceipts, receiptsInMonth, reportByCurrency } from '../../lib/reports'
import { buildMonthZip } from '../../lib/zip'
import { useAppData } from '../../providers/appData'
import { CategoryBars } from './CategoryBars'

interface Props {
  onScan: () => void
}

export function ReportsView({ onScan }: Props) {
  const { receipts, categories, seeding } = useAppData()
  const months = useMemo(() => monthsWithReceipts(receipts), [receipts])
  const [picked, setPicked] = useState<string | null>(null)
  const [zipping, setZipping] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const month = picked !== null && months.includes(picked) ? picked : (months[0] ?? null)
  const inMonth = useMemo(() => (month ? receiptsInMonth(receipts, month) : []), [receipts, month])
  const reports = useMemo(() => reportByCurrency(inMonth, categories), [inMonth, categories])

  if (month === null && seeding) return <p className={mutedText}>Adding the sample receipts…</p>

  if (month === null) {
    return (
      <section className={`${cardClass} space-y-3 p-6 text-center`}>
        <h1 className="text-xl font-bold">Reports</h1>
        <p className={mutedText}>Monthly totals appear here once you have saved a receipt.</p>
        <button type="button" className={primaryButton} onClick={onScan}>
          Scan a receipt
        </button>
      </section>
    )
  }

  function exportCsv() {
    if (month === null) return
    downloadBlob(`expenses-${month}.csv`, new Blob([toCsv(inMonth, categories)], { type: 'text/csv;charset=utf-8' }))
  }

  async function exportZip() {
    if (month === null) return
    setZipping(true)
    setError(null)
    try {
      downloadBlob(`receipts-${month}.zip`, await buildMonthZip(month, inMonth, categories))
    } catch {
      setError('The ZIP file could not be created. Try again, or export the CSV on its own.')
    } finally {
      setZipping(false)
    }
  }

  return (
    <section className="space-y-4" aria-labelledby="reports-heading">
      <h1 id="reports-heading" className="text-2xl font-bold">
        Reports
      </h1>

      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-48">
          <label htmlFor="report-month" className="text-sm font-medium">
            Month
          </label>
          <select id="report-month" className={inputClass} value={month} onChange={(e) => setPicked(e.target.value)}>
            {months.map((m) => (
              <option key={m} value={m}>
                {formatMonth(m)}
              </option>
            ))}
          </select>
        </div>
        <button type="button" className={secondaryButton} onClick={exportCsv}>
          <FileSpreadsheet className="size-4" aria-hidden /> Export CSV
        </button>
        <button type="button" className={primaryButton} onClick={() => void exportZip()} disabled={zipping}>
          {zipping ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : <FileArchive className="size-4" aria-hidden />}
          {zipping ? 'Building ZIP…' : 'Export CSV + photos (ZIP)'}
        </button>
      </div>
      {error && (
        <p role="alert" className={`text-sm ${errorText}`}>
          {error}
        </p>
      )}

      {reports.map((report) => (
        <CategoryBars key={report.currency} report={report} showCurrency={reports.length > 1} />
      ))}
    </section>
  )
}
