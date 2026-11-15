# QuickReceipt: Build Plan

- [x] 1. Scaffold the project (stack in `CLAUDE.md`), strict `tsconfig`, lint, `netlify.toml`, `.env.example`; first working commit
- [x] 2. Dexie schema and `types/`
- [x] 3. App shell and theme
- [x] 4. Capture/upload UI with image compression
- [x] 5. OCR worker with progress using local language data
- [x] 6. Receipt parser (merchant, date, total) with unit tests
- [x] 7. Review-and-correct form
- [x] 8. Expense list and edit/delete
- [x] 9. Tax categories and monthly aggregation view
- [x] 10. CSV export
- [x] 11. ZIP export with images (JSZip)
- [x] 12. Seed demo receipts
- [x] 13. PWA manifest, offline shell, update banner
- [x] 14. Mobile polish at 375px
- [x] 15. Quality gate: `npm run build`, lint and `tsc --noEmit` all pass; no console errors; core flow tested at 375px and desktop
- [x] 16. README: pitch, features, stack, architecture notes, screenshot placeholders, run steps, 3-bullet "what to demo to a recruiter", Phase 2 list
- [ ] 17. Deploy to Netlify, set env vars, verify the public URL end to end
- [ ] 18. Push to GitHub and update the live URL in `README.md` and the root `LINKS.md`
