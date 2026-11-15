import { sumAmounts } from '../lib/money'
import type { DateKey } from '../types'

/**
 * Twelve made-up receipts. They are the single source for three things: the receipt images in public/samples (made by
 * scripts/make-sample-receipts.ts), the demo rows added on first launch, and the parser's test fixtures, so those
 * three can never drift apart. The shops are fictional.
 */
export interface SampleReceipt {
  slug: string
  merchant: string
  address: string
  phone: string
  date: DateKey
  /** The date exactly as the receipt prints it, to exercise different formats. */
  dateText: string
  time: string
  items: readonly (readonly [string, number])[]
  /** The label printed beside the total. */
  totalLabel: string
  /** Printed before the total amount, for example "R ". */
  totalPrefix: string
  payment: 'card' | 'cash'
  taxCategory: string
  /** True for the one receipt that is drawn tilted and soft, like a quick photo. */
  photoStyle: boolean
}

export const SAMPLE_RECEIPTS: readonly SampleReceipt[] = [
  { slug: 'freshway-aug', merchant: 'FRESHWAY MARKET', address: '12 Main Road, Rondebosch', phone: '021 555 0142', date: '2026-08-14', dateText: '14/08/2026', time: '17:42', items: [['Bread white 700g', 18.99], ['Full cream milk 2L', 37.5], ['Free range eggs 18s', 64.99], ['Cheddar 400g', 79.99], ['Bananas 1.2kg', 24.6]], totalLabel: 'TOTAL', totalPrefix: 'R ', payment: 'card', taxCategory: 'groceries', photoStyle: false },
  { slug: 'petropoint-aug', merchant: 'PETROPOINT SERVICE STATION', address: 'N2 Off-ramp, Bellville', phone: '021 555 0177', date: '2026-08-22', dateText: '2026-08-22', time: '07:15', items: [['Unleaded 95  38.42 L', 812.4], ['Windscreen wash', 45]], totalLabel: 'TOTAL DUE', totalPrefix: '', payment: 'card', taxCategory: 'fuel', photoStyle: false },
  { slug: 'cafe-lumiere-sep', merchant: 'CAFE LUMIERE', address: '7 Kloof Street, Gardens', phone: '021 555 0119', date: '2026-09-03', dateText: '03 Sep 2026', time: '13:08', items: [['Flat white', 36], ['Flat white', 36], ['Chicken wrap', 89], ['Caesar salad', 94.5], ['Sparkling water', 28]], totalLabel: 'TOTAL', totalPrefix: 'R', payment: 'card', taxCategory: 'meals', photoStyle: false },
  { slug: 'office-hub-sep', merchant: 'OFFICE HUB STATIONERS', address: '45 Voortrekker Road, Parow', phone: '021 555 0163', date: '2026-09-11', dateText: '11.09.26', time: '10:27', items: [['A4 paper 5 reams', 349.5], ['Ballpoint pens 12pk', 54.9], ['Stapler heavy duty', 129], ['Sticky notes 6pk', 62.5], ['Toner cartridge', 899]], totalLabel: 'AMOUNT DUE', totalPrefix: 'R ', payment: 'card', taxCategory: 'office', photoStyle: false },
  { slug: 'clickstore-sep', merchant: 'CLICKSTORE ONLINE', address: 'www.clickstore.example', phone: '086 000 0123', date: '2026-09-27', dateText: 'Sep 27, 2026', time: '21:50', items: [['Design software, annual', 2399], ['Cloud storage 1TB, annual', 1199]], totalLabel: 'GRAND TOTAL', totalPrefix: 'R ', payment: 'card', taxCategory: 'software', photoStyle: false },
  { slug: 'metro-taxi-oct', merchant: 'METRO TAXI CO', address: 'Airport Road, Cape Town', phone: '021 555 0100', date: '2026-10-05', dateText: '05/10/2026', time: '18:33', items: [['Airport transfer', 385], ['Waiting time 10 min', 40]], totalLabel: 'TOTAL', totalPrefix: 'R ', payment: 'cash', taxCategory: 'travel', photoStyle: false },
  { slug: 'greenleaf-oct', merchant: 'GREENLEAF PHARMACY', address: '3 Church Street, Claremont', phone: '021 555 0188', date: '2026-10-09', dateText: '9 Oct 2026', time: '11:54', items: [['Allergy tablets 30s', 118.95], ['Vitamin C 60s', 94.5], ['Plasters assorted', 32.9]], totalLabel: 'TOTAL', totalPrefix: 'R ', payment: 'card', taxCategory: 'medical', photoStyle: false },
  { slug: 'freshway-oct', merchant: 'FRESHWAY MARKET', address: '12 Main Road, Rondebosch', phone: '021 555 0142', date: '2026-10-17', dateText: '17/10/2026', time: '16:21', items: [['Chicken fillets 1kg', 99.99], ['Basmati rice 2kg', 74.5], ['Olive oil 500ml', 129], ['Tomatoes 1kg', 29.9], ['Onions 2kg', 31.99], ['Yoghurt 1kg', 46.5]], totalLabel: 'TOTAL', totalPrefix: 'R ', payment: 'card', taxCategory: 'groceries', photoStyle: false },
  { slug: 'technoworld-oct', merchant: 'TECHNOWORLD', address: 'Canal Walk, Century City', phone: '021 555 0155', date: '2026-10-28', dateText: '28/10/2026', time: '12:39', items: [['USB-C dock 7-in-1', 1249], ['HDMI cable 2m', 149], ['Wireless mouse', 399]], totalLabel: 'TOTAL', totalPrefix: 'R ', payment: 'card', taxCategory: 'office', photoStyle: false },
  { slug: 'petropoint-nov', merchant: 'PETROPOINT SERVICE STATION', address: 'N2 Off-ramp, Bellville', phone: '021 555 0177', date: '2026-11-02', dateText: '2026-11-02', time: '06:58', items: [['Unleaded 95  41.07 L', 868.6]], totalLabel: 'TOTAL DUE', totalPrefix: '', payment: 'card', taxCategory: 'fuel', photoStyle: false },
  { slug: 'cafe-lumiere-nov', merchant: 'CAFE LUMIERE', address: '7 Kloof Street, Gardens', phone: '021 555 0119', date: '2026-11-06', dateText: '06 Nov 2026', time: '09:12', items: [['Cappuccino', 38], ['Almond croissant', 42], ['Orange juice', 34]], totalLabel: 'TOTAL', totalPrefix: 'R', payment: 'cash', taxCategory: 'meals', photoStyle: true },
  { slug: 'metro-taxi-nov', merchant: 'METRO TAXI CO', address: 'Airport Road, Cape Town', phone: '021 555 0100', date: '2026-11-12', dateText: '12/11/2026', time: '19:47', items: [['City trip', 210], ['Late night surcharge', 35]], totalLabel: 'TOTAL', totalPrefix: 'R ', payment: 'card', taxCategory: 'travel', photoStyle: false },
]

export function sampleTotal(sample: SampleReceipt): number {
  return sumAmounts(sample.items.map(([, amount]) => amount))
}

const WIDTH = 34
const money = (n: number) => n.toFixed(2)
const row = (left: string, right: string) => left.padEnd(Math.max(1, WIDTH - right.length)).slice(0, WIDTH - right.length) + right

/** The receipt as printed lines. These are drawn into the sample images and double as the "scanned" text for the demo data. */
export function receiptLines(sample: SampleReceipt): string[] {
  const total = sampleTotal(sample)
  const vat = Math.round((total * 15) / 115 * 100) / 100
  const rule = '-'.repeat(WIDTH)
  const lines = [sample.merchant, sample.address, `Tel ${sample.phone}`, 'VAT Reg 4120000000', 'TAX INVOICE', `${sample.dateText}  ${sample.time}`, rule]
  for (const [description, amount] of sample.items) lines.push(row(description, money(amount)))
  lines.push(rule, row('SUBTOTAL', money(total)), row('VAT 15% INCLUDED', money(vat)), row(sample.totalLabel, `${sample.totalPrefix}${money(total)}`))
  if (sample.payment === 'card') lines.push(row('CARD ****4821', money(total)))
  else {
    const tendered = Math.ceil(total / 50) * 50
    lines.push(row('CASH', money(tendered)), row('CHANGE', money(tendered - total)))
  }
  lines.push('', 'THANK YOU FOR YOUR BUSINESS')
  return lines
}
