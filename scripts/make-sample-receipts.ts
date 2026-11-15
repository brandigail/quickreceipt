// Draws the twelve sample receipts in src/data/sampleReceipts.ts to PNG files in public/samples.
//
// Not part of the normal build. It needs a browser to draw with, so it is run by hand when the sample data changes:
//   npm install --no-save playwright && npx playwright install chromium
//   npx tsx scripts/make-sample-receipts.ts
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { receiptLines, SAMPLE_RECEIPTS, type SampleReceipt } from '../src/data/sampleReceipts.ts'

const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'samples')
mkdirSync(outDir, { recursive: true })

const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')
const HEADER_LINES = 5

function html(sample: SampleReceipt): string {
  const lines = receiptLines(sample)
  const header = lines.slice(0, HEADER_LINES).map((l, i) => `<div class="${i === 0 ? 'name' : 'head'}">${escape(l)}</div>`).join('')
  const body = escape(lines.slice(HEADER_LINES).join('\n'))
  const tilt = sample.photoStyle
    ? 'transform: rotate(-1.6deg); filter: blur(0.55px) contrast(0.9) brightness(0.97);'
    : ''
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    body { margin: 0; padding: 36px 44px; background: #cfd4da; display: inline-block; }
    .paper { background: #fffefb; padding: 22px 22px 26px; width: 380px; color: #1b1b1b;
      font-family: 'Courier New', 'Liberation Mono', monospace; font-size: 15px; line-height: 1.38;
      box-shadow: 0 3px 14px rgba(0,0,0,.28); ${tilt} }
    .name { text-align: center; font-weight: 700; font-size: 18px; margin-bottom: 2px; }
    .head { text-align: center; }
    pre { margin: 0; font: inherit; white-space: pre; }
    ${sample.photoStyle ? '.paper::after { content: ""; position: absolute; inset: 0; background: linear-gradient(115deg, rgba(0,0,0,.10), rgba(255,255,255,0) 45%, rgba(0,0,0,.07)); pointer-events: none; } .paper { position: relative; }' : ''}
  </style></head><body><div class="paper">${header}<pre>${body}</pre></div></body></html>`
}

const browser = await chromium.launch()
const page = await browser.newPage({ deviceScaleFactor: 2 })
for (const sample of SAMPLE_RECEIPTS) {
  await page.setContent(html(sample))
  await page.locator('body').screenshot({ path: join(outDir, `${sample.slug}.png`) })
  console.log(`wrote ${sample.slug}.png`)
}
await browser.close()
