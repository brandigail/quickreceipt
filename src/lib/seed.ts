import { receiptLines, SAMPLE_RECEIPTS, sampleTotal } from '../data/sampleReceipts'
import type { Receipt } from '../types'

type FetchImage = (url: string) => Promise<Blob>

const defaultFetch: FetchImage = async (url) => {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Could not load ${url}`)
  return response.blob()
}

/** The demo receipts, each with its image from /samples. One that fails to load is skipped rather than blocking the rest. */
export async function buildDemoReceipts(fetchImage: FetchImage = defaultFetch): Promise<Receipt[]> {
  const settled = await Promise.allSettled(
    SAMPLE_RECEIPTS.map(async (sample): Promise<Receipt> => ({
      id: `sample-${sample.slug}`,
      image: await fetchImage(`/samples/${sample.slug}.png`),
      merchant: sample.merchant
        .toLowerCase()
        .replace(/(^|\s)([a-z])/g, (_m, space: string, c: string) => space + c.toUpperCase()),
      date: sample.date,
      total: sampleTotal(sample),
      currency: 'ZAR',
      taxCategory: sample.taxCategory,
      rawText: receiptLines(sample).join('\n'),
      createdAt: new Date(`${sample.date}T${sample.time}:00`).toISOString(),
    })),
  )
  return settled.flatMap((s) => (s.status === 'fulfilled' ? [s.value] : []))
}
