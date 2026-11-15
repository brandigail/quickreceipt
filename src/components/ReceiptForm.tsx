import { useId, useState, type FormEvent, type ReactNode } from 'react'
import { CURRENCIES } from '../lib/currencies'
import { isDateKey, toDateKey } from '../lib/date'
import { parseAmountInput } from '../lib/money'
import type { Confidence, TaxCategory } from '../types'
import { errorText, fieldBase, inputClass, primaryButton, secondaryButton } from './ui'

export interface ReceiptDraft {
  merchant: string
  date: string
  total: string
  currency: string
  taxCategory: string
}

export interface ReceiptValues {
  merchant: string
  date: string
  total: number
  currency: string
  taxCategory: string
}

export type FieldHints = Partial<Record<'merchant' | 'date' | 'total', Confidence>>

interface Props {
  initial: ReceiptDraft
  /** When given (right after a scan), fields the reader was unsure about are flagged. */
  hints?: FieldHints
  categories: readonly TaxCategory[]
  submitLabel: string
  onSubmit: (values: ReceiptValues) => void
  cancelLabel?: string
  onCancel?: () => void
  /** Extra buttons, for example Delete. */
  extra?: ReactNode
}

const HINT_TEXT: Record<'merchant' | 'date' | 'total', Record<'none' | 'low' | 'medium', string>> = {
  merchant: { none: 'Could not read the shop name. Please type it.', low: 'Not sure about the shop name. Please check it.', medium: 'Please double-check the shop name.' },
  date: { none: 'Could not read the date. Please choose it.', low: 'Not sure about the date. Please check it.', medium: 'The day and month could be swapped. Please check the date.' },
  total: { none: 'Could not read the total. Please type it.', low: 'Not sure about the total. Please check it.', medium: 'Please double-check the total.' },
}

function Hint({ field, confidence, id }: { field: 'merchant' | 'date' | 'total'; confidence: Confidence | undefined; id: string }) {
  if (!confidence || confidence === 'high') return null
  return (
    <p id={id} data-testid={`hint-${field}`} className="mt-1 text-sm text-amber-800 dark:text-amber-300">
      {HINT_TEXT[field][confidence]}
    </p>
  )
}

/** The editable details of one receipt. Used right after a scan and when editing a saved receipt. */
export function ReceiptForm({ initial, hints, categories, submitLabel, onSubmit, cancelLabel = 'Cancel', onCancel, extra }: Props) {
  const id = useId()
  const [draft, setDraft] = useState(initial)
  const [errors, setErrors] = useState<Partial<Record<keyof ReceiptDraft, string>>>({})

  function change<K extends keyof ReceiptDraft>(key: K, value: ReceiptDraft[K]) {
    setDraft((d) => ({ ...d, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    const found: typeof errors = {}
    const merchant = draft.merchant.trim()
    const total = parseAmountInput(draft.total)
    const tomorrow = toDateKey(new Date(Date.now() + 86_400_000))
    if (!merchant) found.merchant = 'Enter the shop name.'
    if (!isDateKey(draft.date) || draft.date < '2000-01-01') found.date = 'Choose a valid date.'
    else if (draft.date > tomorrow) found.date = 'The date cannot be in the future.'
    if (total === null) found.total = 'Enter an amount greater than zero, for example 125.50.'
    setErrors(found)
    if (Object.keys(found).length > 0 || total === null) return
    onSubmit({ merchant, date: draft.date, total, currency: draft.currency, taxCategory: draft.taxCategory })
  }

  const field = (key: 'merchant' | 'date' | 'total') => ({
    'aria-invalid': errors[key] ? true : undefined,
    'aria-describedby': [errors[key] ? `${id}-${key}-error` : '', hints?.[key] && hints[key] !== 'high' ? `${id}-${key}-hint` : ''].filter(Boolean).join(' ') || undefined,
  })
  const error = (key: 'merchant' | 'date' | 'total') =>
    errors[key] ? (
      <p id={`${id}-${key}-error`} role="alert" className={`mt-1 text-sm ${errorText}`}>
        {errors[key]}
      </p>
    ) : null

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div>
        <label htmlFor={`${id}-merchant`} className="text-sm font-medium">
          Shop
        </label>
        <input id={`${id}-merchant`} className={inputClass} value={draft.merchant} maxLength={60} onChange={(e) => change('merchant', e.target.value)} {...field('merchant')} />
        {error('merchant')}
        <Hint field="merchant" confidence={hints?.merchant} id={`${id}-merchant-hint`} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`${id}-date`} className="text-sm font-medium">
            Date
          </label>
          <input id={`${id}-date`} type="date" className={inputClass} value={draft.date} onChange={(e) => change('date', e.target.value)} {...field('date')} />
          {error('date')}
          <Hint field="date" confidence={hints?.date} id={`${id}-date-hint`} />
        </div>
        <div>
          <label htmlFor={`${id}-total`} className="text-sm font-medium">
            Total
          </label>
          <div className="flex gap-2">
            <input id={`${id}-total`} inputMode="decimal" className={`${fieldBase} min-w-0 flex-1`} value={draft.total} placeholder="0.00" onChange={(e) => change('total', e.target.value)} {...field('total')} />
            <select aria-label="Currency" className={`${fieldBase} w-24 shrink-0`} value={draft.currency} onChange={(e) => change('currency', e.target.value)}>
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          {error('total')}
          <Hint field="total" confidence={hints?.total} id={`${id}-total-hint`} />
        </div>
      </div>
      <div>
        <label htmlFor={`${id}-category`} className="text-sm font-medium">
          Tax category
        </label>
        <select id={`${id}-category`} className={inputClass} value={draft.taxCategory} onChange={(e) => change('taxCategory', e.target.value)}>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
              {c.deductible ? ' (deductible)' : ''}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="submit" className={primaryButton}>
          {submitLabel}
        </button>
        {onCancel && (
          <button type="button" className={secondaryButton} onClick={onCancel}>
            {cancelLabel}
          </button>
        )}
        {extra}
      </div>
    </form>
  )
}
