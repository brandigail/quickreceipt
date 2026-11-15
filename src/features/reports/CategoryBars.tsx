import { cardClass, mutedText } from '../../components/ui'
import { formatMoney } from '../../lib/money'
import type { CurrencyReport } from '../../lib/reports'

/** One currency's month: the totals, and a bar per tax category showing where the money went. */
export function CategoryBars({ report, showCurrency }: { report: CurrencyReport; showCurrency: boolean }) {
  return (
    <section className={`${cardClass} space-y-4 p-4`} aria-label={showCurrency ? `${report.currency} summary` : 'Summary'}>
      <dl className="grid grid-cols-3 gap-3">
        <div>
          <dt className={`text-xs ${mutedText}`}>Total spent{showCurrency ? ` (${report.currency})` : ''}</dt>
          <dd className="text-xl font-bold tabular-nums sm:text-2xl" data-testid="report-total">
            {formatMoney(report.total, report.currency)}
          </dd>
        </div>
        <div>
          <dt className={`text-xs ${mutedText}`}>Tax deductible</dt>
          <dd className="text-xl font-bold text-emerald-700 tabular-nums sm:text-2xl dark:text-emerald-400" data-testid="report-deductible">
            {formatMoney(report.deductibleTotal, report.currency)}
          </dd>
        </div>
        <div>
          <dt className={`text-xs ${mutedText}`}>Receipts</dt>
          <dd className="text-xl font-bold tabular-nums sm:text-2xl">{report.count}</dd>
        </div>
      </dl>

      <ul className="space-y-3" aria-label="Spending by category">
        {report.rows.map((row) => (
          <li key={row.category.id}>
            <div className="flex items-baseline justify-between gap-2 text-sm">
              <span className="min-w-0 truncate font-medium">
                {row.category.name}
                {row.category.deductible && <span className="ml-1.5 rounded bg-emerald-100 px-1.5 py-0.5 text-xs font-normal text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">deductible</span>}
              </span>
              <span className="shrink-0 tabular-nums">
                {formatMoney(row.total, report.currency)} <span className={mutedText}>({Math.round(row.share * 100)}%, {row.count})</span>
              </span>
            </div>
            <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800" aria-hidden>
              <div className={`h-full rounded-full ${row.category.deductible ? 'bg-emerald-600' : 'bg-slate-500'}`} style={{ width: `${Math.max(row.share * 100, 1.5)}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
