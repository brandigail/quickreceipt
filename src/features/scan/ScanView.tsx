import type { ReceiptValues } from '../../components/ReceiptForm'
import { useAppData } from '../../providers/appData'
import { ScanPicker } from './ScanPicker'
import { ScanProgress } from './ScanProgress'
import { ScanReview } from './ScanReview'
import { useScan } from './useScan'

interface Props {
  onSaved: () => void
}

export function ScanView({ onSaved }: Props) {
  const { saveReceipt } = useAppData()
  const { step, scan, reset } = useScan()

  async function save(values: ReceiptValues) {
    if (step.kind !== 'review') return
    await saveReceipt({
      id: crypto.randomUUID(),
      image: step.image,
      merchant: values.merchant,
      date: values.date,
      total: values.total,
      currency: values.currency,
      taxCategory: values.taxCategory,
      rawText: step.rawText,
      createdAt: new Date().toISOString(),
    })
    reset()
    onSaved()
  }

  if (step.kind === 'working') return <ScanProgress preview={step.preview} label={step.label} fraction={step.fraction} />
  if (step.kind === 'review') return <ScanReview review={step} onSave={(v) => void save(v)} onDiscard={reset} />
  return <ScanPicker error={step.error} onFile={(file) => void scan(file)} />
}
