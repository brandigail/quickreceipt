import { cardClass, inputClass, mutedText } from '../../components/ui'
import { CURRENCIES } from '../../lib/currencies'
import { useAppData } from '../../providers/appData'
import type { DateOrder } from '../../types'
import { CategoryManager } from './CategoryManager'
import { DataSettings } from './DataSettings'
import { OfflineScanner } from './OfflineScanner'

export default function SettingsView() {
  const { settings, updateSettings } = useAppData()
  return (
    <section className="space-y-4" aria-labelledby="settings-heading">
      <h1 id="settings-heading" className="text-2xl font-bold">
        Settings
      </h1>

      <section className={`${cardClass} space-y-4 p-4`} aria-labelledby="defaults-heading">
        <h2 id="defaults-heading" className="text-lg font-semibold">
          Defaults
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="default-currency" className="text-sm font-medium">
              Currency for new receipts
            </label>
            <select id="default-currency" className={inputClass} value={settings.currency} onChange={(e) => void updateSettings({ currency: e.target.value })}>
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="date-order" className="text-sm font-medium">
              Dates like 03/04/2026 mean
            </label>
            <select id="date-order" className={inputClass} value={settings.dateOrder} onChange={(e) => void updateSettings({ dateOrder: e.target.value === 'mdy' ? ('mdy' satisfies DateOrder) : 'dmy' })}>
              <option value="dmy">3 April (day first)</option>
              <option value="mdy">March 4 (month first)</option>
            </select>
          </div>
        </div>
        <p className={`text-sm ${mutedText}`}>Used when a receipt's date could be read two ways. Dates where only one reading is possible are always read correctly.</p>
      </section>

      <OfflineScanner />
      <CategoryManager />
      <DataSettings />
    </section>
  )
}
