# QuickReceipt: Build Plan

- [ ] 1. Scaffold the project (stack in `CLAUDE.md`), strict `tsconfig`, lint, `netlify.toml`, `.env.example`; first working commit
- [ ] 2. Dexie schema and `types/`
- [ ] 3. App shell and theme
- [ ] 4. Capture/upload UI with image compression
- [ ] 5. OCR worker with progress using local language data
- [ ] 6. Receipt parser (merchant, date, total) with unit tests
- [ ] 7. Review-and-correct form
- [ ] 8. Expense list and edit/delete
- [ ] 9. Tax categories and monthly aggregation view
- [ ] 10. CSV export
- [ ] 11. ZIP export with images (JSZip)
- [ ] 12. Seed demo receipts
- [ ] 13. PWA manifest, offline shell, update banner
- [ ] 14. Mobile polish at 375px
- [ ] 15. Quality gate: `npm run build`, lint and `tsc --noEmit` all pass; no console errors; core flow tested at 375px and desktop
- [ ] 16. README: pitch, features, stack, architecture notes, screenshot placeholders, run steps, 3-bullet "what to demo to a recruiter", Phase 2 list
- [ ] 17. Deploy to Netlify, set env vars, verify the public URL end to end
- [ ] 18. Push to GitHub and update the live URL in `README.md` and the root `LINKS.md`
