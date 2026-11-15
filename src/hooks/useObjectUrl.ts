import { useEffect } from 'react'

interface Entry {
  url: string
  users: number
}

// One temporary URL per image, shared by everything showing it. It is released only when nothing shows it any more.
const entries = new WeakMap<Blob, Entry>()

function entryFor(blob: Blob): Entry {
  let entry = entries.get(blob)
  if (!entry) {
    entry = { url: URL.createObjectURL(blob), users: 0 }
    entries.set(blob, entry)
  }
  return entry
}

function release(blob: Blob): void {
  const entry = entries.get(blob)
  if (!entry) return
  entry.users -= 1
  // Revoking is deferred a tick: React's development StrictMode unmounts and remounts straight away, and that remount must find the URL still valid.
  window.setTimeout(() => {
    if (entry.users <= 0) {
      URL.revokeObjectURL(entry.url)
      entries.delete(blob)
    }
  }, 0)
}

/** A temporary URL for showing a stored image. It is released when the image is no longer shown anywhere. */
export function useObjectUrl(blob: Blob | null): string | null {
  const url = blob ? entryFor(blob).url : null
  useEffect(() => {
    if (!blob) return
    entryFor(blob).users += 1
    return () => release(blob)
  }, [blob])
  return url
}
