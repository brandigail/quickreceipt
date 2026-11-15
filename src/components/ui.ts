/** Shared class names so every control looks and behaves the same. Tap targets are at least 44px. */

/** Everything a text field or select looks like except its width, so a field can choose its own. */
export const fieldBase =
  'mt-1 min-h-11 rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 placeholder:text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100'

export const inputClass = `${fieldBase} w-full`

export const primaryButton =
  'inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60'

export const secondaryButton =
  'inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-800 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800'

export const dangerButton =
  'inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-800'

export const iconButton =
  'inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'

export const cardClass = 'rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'

export const mutedText = 'text-slate-600 dark:text-slate-400'

export const errorText = 'text-red-700 dark:text-red-400'

export const chipClass = (active: boolean): string =>
  `inline-flex min-h-9 items-center rounded-full border px-3 text-sm transition-colors ${
    active ? 'border-blue-700 bg-blue-700 text-white' : 'border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800'
  }`
