import { Camera, ImagePlus, Sparkles } from 'lucide-react'
import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { cardClass, errorText, mutedText, primaryButton, secondaryButton } from '../../components/ui'
import { SAMPLE_RECEIPTS } from '../../data/sampleReceipts'
import { isOcrCached } from '../../lib/ocr'

interface Props {
  error: string | null
  onFile: (file: Blob) => void
}

/** Where a scan starts: take a photo, choose an image, drop one on the page, or try a sample receipt. */
export function ScanPicker({ error, onFile }: Props) {
  const camera = useRef<HTMLInputElement>(null)
  const gallery = useRef<HTMLInputElement>(null)
  const nextSample = useRef(0)
  const [dragging, setDragging] = useState(false)
  const [cached, setCached] = useState<boolean | null>(null)
  const [sampleError, setSampleError] = useState<string | null>(null)

  useEffect(() => {
    void isOcrCached().then(setCached)
  }, [])

  function chosen(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (file) onFile(file)
  }

  function dropped(event: DragEvent) {
    event.preventDefault()
    setDragging(false)
    const file = event.dataTransfer.files[0]
    if (file) onFile(file)
  }

  async function trySample() {
    const sample = SAMPLE_RECEIPTS[nextSample.current % SAMPLE_RECEIPTS.length]
    nextSample.current += 1
    if (!sample) return
    try {
      const response = await fetch(`/samples/${sample.slug}.png`)
      if (!response.ok) throw new Error('missing')
      setSampleError(null)
      onFile(await response.blob())
    } catch {
      setSampleError('The sample receipt could not be loaded.')
    }
  }

  return (
    <section aria-labelledby="scan-heading" className="space-y-4">
      <div>
        <h1 id="scan-heading" className="text-2xl font-bold">
          Scan a receipt
        </h1>
        <p className={`text-sm ${mutedText}`}>The photo is read on your device. Nothing is uploaded.</p>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={dropped}
        className={`${cardClass} flex flex-col items-center gap-4 border-2 border-dashed p-6 text-center sm:p-10 ${dragging ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/30' : ''}`}
      >
        <p className="font-medium">Take a photo of a receipt, or choose an image</p>
        <div className="flex flex-wrap justify-center gap-2">
          <button type="button" className={primaryButton} onClick={() => camera.current?.click()}>
            <Camera className="size-4" aria-hidden /> Take a photo
          </button>
          <button type="button" className={secondaryButton} onClick={() => gallery.current?.click()}>
            <ImagePlus className="size-4" aria-hidden /> Choose an image
          </button>
          <button type="button" className={secondaryButton} onClick={() => void trySample()}>
            <Sparkles className="size-4" aria-hidden /> Try a sample receipt
          </button>
        </div>
        <input ref={camera} type="file" accept="image/*" capture="environment" className="hidden" aria-label="Take a photo" onChange={chosen} />
        <input ref={gallery} type="file" accept="image/*" className="hidden" aria-label="Choose an image" onChange={chosen} />
        <p className={`text-xs ${mutedText}`}>On a computer you can also drop an image here.</p>
      </div>

      {(error ?? sampleError) && (
        <p role="alert" className={`text-sm ${errorText}`}>
          {error ?? sampleError}
        </p>
      )}

      <p className={`text-sm ${mutedText}`} data-testid="scanner-status">
        {cached === null
          ? ''
          : cached
            ? 'The scanner is saved on this device, so scanning works offline.'
            : 'The first scan downloads the scanner (about 6 MB) once. After that it works offline.'}
      </p>
    </section>
  )
}
