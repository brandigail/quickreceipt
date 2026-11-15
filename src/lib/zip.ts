import type { Receipt, TaxCategory } from '../types'
import { toCsv, receiptFileName } from './csv'

/** A ZIP for one month: the CSV at the top and every receipt image in an `images` folder, named to match the CSV rows. */
export async function buildMonthZip(month: string, receipts: readonly Receipt[], categories: readonly TaxCategory[]): Promise<Blob> {
  // Loaded only when someone exports, so it is not part of the first download.
  const { default: JSZip } = await import('jszip')
  const zip = new JSZip()
  zip.file(`expenses-${month}.csv`, toCsv(receipts, categories))
  const images = zip.folder('images')
  for (const receipt of receipts) {
    images?.file(receiptFileName(receipt), await receipt.image.arrayBuffer(), { compression: 'STORE' })
  }
  return zip.generateAsync({ type: 'blob', compression: 'DEFLATE', mimeType: 'application/zip' })
}
