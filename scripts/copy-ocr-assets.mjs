// Copies the OCR engine files from node_modules into public/tesseract so the app serves them from its own origin.
// Nothing is fetched from a CDN at runtime, which is what lets scanning work offline. The copies are not committed
// (public/tesseract is gitignored); this script runs before `dev` and `build`, and again on Netlify.
import { copyFileSync, existsSync, mkdirSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const nm = (...parts) => join(root, 'node_modules', ...parts)
const out = (...parts) => join(root, 'public', 'tesseract', ...parts)

// The app runs the LSTM engine only, so these are the three builds the worker may pick between, depending on the
// browser's WebAssembly features. A visitor downloads just one of them.
const files = [
  [nm('tesseract.js', 'dist', 'worker.min.js'), out('worker.min.js')],
  [nm('tesseract.js-core', 'tesseract-core-lstm.wasm.js'), out('core', 'tesseract-core-lstm.wasm.js')],
  [nm('tesseract.js-core', 'tesseract-core-simd-lstm.wasm.js'), out('core', 'tesseract-core-simd-lstm.wasm.js')],
  [nm('tesseract.js-core', 'tesseract-core-relaxedsimd-lstm.wasm.js'), out('core', 'tesseract-core-relaxedsimd-lstm.wasm.js')],
  [nm('@tesseract.js-data', 'eng', '4.0.0_best_int', 'eng.traineddata.gz'), out('lang', 'eng.traineddata.gz')],
]

let copied = 0
for (const [from, to] of files) {
  if (!existsSync(from)) {
    console.error(`Missing ${from}. Run npm install first.`)
    process.exit(1)
  }
  if (existsSync(to) && statSync(to).size === statSync(from).size) continue
  mkdirSync(dirname(to), { recursive: true })
  copyFileSync(from, to)
  copied++
}
console.log(copied === 0 ? 'OCR assets already in place.' : `Copied ${copied} OCR asset file(s) to public/tesseract.`)
