import { Plus, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { cardClass, dangerButton, errorText, iconButton, inputClass, mutedText, primaryButton } from '../../components/ui'
import { FALLBACK_CATEGORY } from '../../lib/db'
import { useAppData } from '../../providers/appData'
import type { TaxCategory } from '../../types'

function newId(name: string): string {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 20) || 'category'
  return `${slug}-${crypto.randomUUID().slice(0, 4)}`
}

function CategoryRow({ category, count }: { category: TaxCategory; count: number }) {
  const { saveCategory, removeCategory } = useAppData()
  const [name, setName] = useState(category.name)
  const [confirming, setConfirming] = useState(false)
  const locked = category.id === FALLBACK_CATEGORY

  function commitName() {
    const trimmed = name.trim()
    if (!trimmed) setName(category.name)
    else if (trimmed !== category.name) void saveCategory({ ...category, name: trimmed })
  }

  return (
    <li className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 p-2 dark:border-slate-800">
      <input
        aria-label={`Name of ${category.name}`}
        className={`${inputClass} mt-0 min-w-40 flex-1`}
        value={name}
        maxLength={40}
        onChange={(e) => setName(e.target.value)}
        onBlur={commitName}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
      />
      <label className="flex min-h-11 items-center gap-2 text-sm">
        <input type="checkbox" className="size-5 accent-blue-700" checked={category.deductible} onChange={(e) => void saveCategory({ ...category, deductible: e.target.checked })} />
        Deductible
      </label>
      {locked ? (
        <span className={`w-11 text-center text-xs ${mutedText}`}>Fixed</span>
      ) : confirming ? (
        <button type="button" className={dangerButton} onClick={() => void removeCategory(category.id)} onBlur={() => setConfirming(false)} autoFocus>
          {count > 0 ? `Move ${count} to Other and delete` : 'Confirm delete'}
        </button>
      ) : (
        <button type="button" className={iconButton} onClick={() => setConfirming(true)} aria-label={`Delete ${category.name}`}>
          <Trash2 className="size-5" aria-hidden />
        </button>
      )}
    </li>
  )
}

/** Rename tax categories, mark which are deductible, add new ones. Deleting one moves its receipts to Other. */
export function CategoryManager() {
  const { categories, receipts, saveCategory } = useAppData()
  const [name, setName] = useState('')
  const [deductible, setDeductible] = useState(true)
  const [error, setError] = useState<string | null>(null)

  function add(event: FormEvent) {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Give the category a name.')
      return
    }
    if (categories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
      setError('You already have a category with that name.')
      return
    }
    void saveCategory({ id: newId(trimmed), name: trimmed, deductible })
    setName('')
    setError(null)
  }

  return (
    <section className={`${cardClass} space-y-4 p-4`} aria-labelledby="categories-heading">
      <h2 id="categories-heading" className="text-lg font-semibold">
        Tax categories
      </h2>
      <ul className="space-y-2" aria-label="Tax categories">
        {categories.map((c) => (
          <CategoryRow key={c.id} category={c} count={receipts.filter((r) => r.taxCategory === c.id).length} />
        ))}
      </ul>
      <form onSubmit={add} className="flex flex-wrap items-center gap-2">
        <input aria-label="New category name" className={`${inputClass} mt-0 min-w-40 flex-1`} placeholder="New category" value={name} maxLength={40} onChange={(e) => setName(e.target.value)} />
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input type="checkbox" className="size-5 accent-blue-700" checked={deductible} onChange={(e) => setDeductible(e.target.checked)} />
          Deductible
        </label>
        <button type="submit" className={primaryButton}>
          <Plus className="size-4" aria-hidden /> Add
        </button>
      </form>
      {error && (
        <p role="alert" className={`text-sm ${errorText}`}>
          {error}
        </p>
      )}
    </section>
  )
}
