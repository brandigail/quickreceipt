import { LoaderCircle } from 'lucide-react'
import { cardClass } from '../../components/ui'
import { useObjectUrl } from '../../hooks/useObjectUrl'

interface Props {
  preview: Blob
  label: string
  /** 0 to 1 while reading; null while the step has no measurable progress. */
  fraction: number | null
}

export function ScanProgress({ preview, label, fraction }: Props) {
  const url = useObjectUrl(preview)
  const percent = fraction === null ? null : Math.round(fraction * 100)
  return (
    <section aria-labelledby="working-heading" className={`${cardClass} flex flex-col items-center gap-4 p-6 text-center`}>
      <h1 id="working-heading" className="text-xl font-bold">
        Scanning
      </h1>
      {url && <img src={url} alt="" className="max-h-64 rounded-lg object-contain opacity-80" />}
      <div role="status" className="flex items-center gap-2 text-sm" aria-live="polite">
        <LoaderCircle className="size-4 animate-spin" aria-hidden />
        {label}
        {percent !== null && <span className="font-mono">{percent}%</span>}
      </div>
      <div
        className="h-2 w-full max-w-sm overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
        role="progressbar"
        aria-label="Scan progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent ?? undefined}
      >
        {percent === null ? <div className="h-full w-1/3 animate-pulse rounded-full bg-blue-600" /> : <div className="h-full rounded-full bg-blue-600 transition-[width]" style={{ width: `${percent}%` }} />}
      </div>
    </section>
  )
}
