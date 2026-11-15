import type { Worker as TesseractWorker } from 'tesseract.js'

export type OcrStage = 'loading' | 'reading'

export interface OcrProgress {
  stage: OcrStage
  /** 0 to 1 while reading; loading steps report their own smaller fractions. */
  fraction: number
}

export interface OcrResult {
  text: string
  /** The engine's own 0 to 100 score for how sure it is about the whole page. */
  confidence: number
}

const READY_KEY = 'quickreceipt-ocr-ready'
const LSTM_ONLY = 1

let workerPromise: Promise<TesseractWorker> | null = null
let report: ((progress: OcrProgress) => void) | null = null
// One worker reads one page at a time, so scans are queued.
let queue: Promise<unknown> = Promise.resolve()

function onLog(message: { status: string; progress: number }): void {
  if (!report) return
  report({ stage: message.status === 'recognizing text' ? 'reading' : 'loading', fraction: message.progress })
}

/**
 * Starts the OCR engine the first time it is needed and reuses it after that. Everything is loaded from this site's own
 * /tesseract folder (never a CDN), so once the files are in the service worker cache scanning works with no connection.
 * Tesseract's own IndexedDB cache is switched off so the service worker cache is the only thing offline use can rely on.
 */
function getWorker(): Promise<TesseractWorker> {
  workerPromise ??= (async () => {
    const { createWorker } = await import('tesseract.js')
    const worker = await createWorker('eng', LSTM_ONLY, {
      workerPath: '/tesseract/worker.min.js',
      corePath: '/tesseract/core',
      langPath: '/tesseract/lang',
      workerBlobURL: false,
      cacheMethod: 'none',
      gzip: true,
      logger: onLog,
    })
    try {
      localStorage.setItem(READY_KEY, '1')
    } catch {
      // ignore: the status line simply will not remember it
    }
    return worker
  })().catch((error: unknown) => {
    workerPromise = null
    throw error
  })
  return workerPromise
}

/** Loads the engine ahead of time so the first real scan is fast and, once cached, works offline. */
export async function prepareOcr(onProgress?: (progress: OcrProgress) => void): Promise<void> {
  report = onProgress ?? null
  try {
    await getWorker()
  } finally {
    report = null
  }
}

/** Reads the text from a receipt image on this device. */
export function recognizeReceipt(image: Blob, onProgress?: (progress: OcrProgress) => void): Promise<OcrResult> {
  const job = queue.then(async () => {
    report = onProgress ?? null
    try {
      const worker = await getWorker()
      const { data } = await worker.recognize(image)
      return { text: data.text, confidence: data.confidence }
    } finally {
      report = null
    }
  })
  queue = job.catch(() => undefined)
  return job
}

/** True once the engine has loaded successfully on this device and its files are in the offline cache. */
export async function isOcrCached(): Promise<boolean> {
  try {
    if (localStorage.getItem(READY_KEY) !== '1') return false
    return await caches.has('ocr-assets')
  } catch {
    return false
  }
}

export async function terminateOcr(): Promise<void> {
  const current = workerPromise
  workerPromise = null
  if (current) await (await current).terminate()
}
