# QuickReceipt

Receipt scanner PWA: on-device OCR extracts merchant, date and total, then exports CSV/ZIP expense reports.

## Planned features
- Capture or upload a receipt image, run OCR in a worker with progress, and parse merchant/date/total with confidence hints the user can correct.
- Expense list with tax categories, edit/delete, and monthly aggregation by category.
- One-click CSV export and ZIP (CSV + receipt images) for a selected month.

### Phase 2
- Line-item extraction
- Image pre-processing (grayscale, deskew)
- Multi-currency
- Optional Neon sync

## Stack
React, Vite, TypeScript strict, Tailwind CSS, Tesseract.js (web worker), Dexie.js (images stored as Blobs), JSZip, vite-plugin-pwa. No backend, Netlify

## Live demo
Live demo: TBD

## Run locally
Run locally: TBD

## Status
Not started
