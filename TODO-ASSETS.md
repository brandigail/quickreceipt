# Assets to replace or review

No external images are used. These local placeholders stand in for real assets:

- `public/samples/*.png` (12 files): **generated placeholder receipts**, not photographs of real receipts. They show made-up shops and are drawn from `src/data/sampleReceipts.ts` by `scripts/make-sample-receipts.ts` (needs Playwright; see the header of that script). They exist so the app has demo data and the parser has repeatable test input. Replace them with real, consented, redacted receipt photos if you want a more convincing demo, and update the data file to match what they show.
- `public/icon.svg`, `public/favicon.svg` and the generated `pwa-*.png` / `apple-touch-icon.png`: a simple placeholder receipt icon. Replace with a designed logo if you have one.
- `public/tesseract/`: **not committed.** Created from `node_modules` by `scripts/copy-ocr-assets.mjs` (the Tesseract.js worker and engine, and the English language data).
