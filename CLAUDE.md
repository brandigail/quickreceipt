# QuickReceipt: Receipt Scanner and Expense Categorizer

Read the portfolio-root `CLAUDE.md` first for global rules. This file is the brief for this project.

## What it is
Snap a receipt and the app reads it entirely on your device with Tesseract.js, pre-filling merchant, date and total. Tag tax categories, see monthly totals and export a CSV plus images as a ZIP.

## Stack
React, Vite, TypeScript strict, Tailwind CSS, Tesseract.js (web worker), Dexie.js (images stored as Blobs), JSZip, vite-plugin-pwa. No backend. Hosted on Netlify. No Supabase, no Vercel, no Gemini/OpenAI.

## MVP (build first)
1. Capture or upload a receipt image, run OCR in a worker with progress, and parse merchant/date/total with confidence hints the user can correct.
2. Expense list with tax categories, edit/delete, and monthly aggregation by category.
3. One-click CSV export and ZIP (CSV + receipt images) for a selected month.

## Phase 2
Line-item extraction, Image pre-processing (grayscale, deskew), Multi-currency, Optional Neon sync.

## Data model (put in `types/`)
```ts
export interface Receipt { id: string; image: Blob; merchant: string; date: string; total: number; currency: string; taxCategory: string; rawText: string; createdAt: string }
export interface TaxCategory { id: string; name: string; deductible: boolean }
```

## Rules specific to this project
- OCR runs in a Web Worker so the UI never blocks; load language data from local `/public` files, not a CDN, so it works offline.
- Parsing heuristics (largest amount near "total", common date formats) live in one tested module with sample receipt strings.
- Compress images before storing to keep IndexedDB small.
- Seed sample receipts with local images (listed in `TODO-ASSETS.md`).
- Seed realistic demo data so the app looks alive on first load without sign-up.

## Start here
1. Scaffold Vite + Tailwind + Dexie + vite-plugin-pwa, commit.
2. Prove Tesseract.js works offline from local assets.
3. Work through `PLAN.md` from step 2.
