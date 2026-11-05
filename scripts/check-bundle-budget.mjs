#!/usr/bin/env node
/**
 * Performance budget for the production build (see AGENTS.md, "Performance budget").
 *
 * Reads dist/index.html, follows every script and modulepreload it references, and the static imports of those
 * scripts, so it measures exactly the JavaScript a reader downloads before any chapter is chosen. Sizes are gzip
 * at zlib's default level, the level the local lab server uses. Fails (exit 1) when the entry JavaScript exceeds
 * the budget, or when a module that must stay lazy is found in it.
 *
 * Usage: node scripts/check-bundle-budget.mjs [distDir]       (run `npm run build` first)
 */
import { readFileSync, existsSync } from 'node:fs'
import { join, dirname, posix } from 'node:path'
import { gzipSync } from 'node:zlib'

/** Gzip bytes allowed for the JavaScript every route downloads first. PR #14 brought it to about 128 kB. */
export const ENTRY_JS_BUDGET_GZIP = 135_000
/** Chunks that must never be part of the entry: chapters with their own route, and evidence views below the fold. */
export const MUST_STAY_LAZY = ['Z3Part', 'LocalQwen', 'ReceiptChainNavigation', 'SubQAssessment', 'OllamaComparison']

const dist = process.argv[2] || 'dist'
const indexPath = join(dist, 'index.html')
if (!existsSync(indexPath)) { console.error(`No ${indexPath}; run npm run build first.`); process.exit(1) }
const html = readFileSync(indexPath, 'utf8')
const base = '/queens-model-assessment/'
const toFile = url => join(dist, url.startsWith(base) ? url.slice(base.length) : url.replace(/^\.?\//, ''))

const roots = [...html.matchAll(/<script[^>]*type="module"[^>]*src="([^"]+)"/g), ...html.matchAll(/<link[^>]*rel="modulepreload"[^>]*href="([^"]+)"/g)].map(match => toFile(match[1]))
if (!roots.length) { console.error('No module script found in index.html.'); process.exit(1) }

// Static imports only: `import ... from "./x.js"` and `import "./x.js"`. Dynamic import("./x.js") is a lazy chunk.
const staticImport = /(?:^|[;\n}])\s*import\s*(?:[\w$*{}\s,]+from\s*)?["'](\.{1,2}\/[^"']+\.js)["']/g
const seen = new Map()
const visit = file => {
  if (seen.has(file)) return
  const code = readFileSync(file)
  seen.set(file, { raw: code.length, gzip: gzipSync(code).length })
  for (const match of code.toString('utf8').matchAll(staticImport)) visit(join(dirname(file), posix.normalize(match[1])))
}
roots.forEach(visit)

const files = [...seen].map(([file, size]) => ({ file: file.slice(dist.length + 1), ...size }))
const total = files.reduce((sum, file) => ({ raw: sum.raw + file.raw, gzip: sum.gzip + file.gzip }), { raw: 0, gzip: 0 })
const kb = bytes => `${(bytes / 1000).toFixed(1)} kB`
for (const file of files) console.log(`  ${file.file.padEnd(48)} ${kb(file.gzip).padStart(9)} gzip  ${kb(file.raw).padStart(9)} raw`)
console.log(`Entry JavaScript: ${kb(total.gzip)} gzip (${kb(total.raw)} raw) across ${files.length} file(s); budget ${kb(ENTRY_JS_BUDGET_GZIP)} gzip.`)

const failures = []
if (total.gzip > ENTRY_JS_BUDGET_GZIP) failures.push(`entry JavaScript is ${kb(total.gzip - ENTRY_JS_BUDGET_GZIP)} over budget`)
for (const name of MUST_STAY_LAZY) if (files.some(file => posix.basename(file.file).startsWith(`${name}-`))) failures.push(`${name} is in the entry; it must load with its route`)
if (failures.length) {
  console.error(`Performance budget failed:\n- ${failures.join('\n- ')}\nSee AGENTS.md, "Performance budget", before raising the budget.`)
  process.exit(1)
}
console.log('Performance budget passed.')
