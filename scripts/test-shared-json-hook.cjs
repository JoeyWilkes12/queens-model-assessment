/**
 * Runs the useSharedJson integration scenarios (scripts/hook-test/main.tsx) with real React 18 in Chromium:
 * StrictMode, a peer unmounting, a URL change with a late reply, retry recovering peers, invalid payloads.
 * Bundles the page with the project's own Vite; needs Playwright with Chromium.
 *
 * Usage: npm run test:shared-json-hook
 */
const http = require('http')
const fs = require('fs')
const os = require('os')
const path = require('path')
const { chromium } = require('playwright')

;(async () => {
  const { build } = await import('vite')
  const react = (await import('@vitejs/plugin-react')).default
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hook-test-'))
  await build({ configFile: false, root: path.join(__dirname, 'hook-test'), base: './', plugins: [react()], logLevel: 'warn', build: { outDir, emptyOutDir: true } })
  const server = http.createServer((req, res) => {
    const file = path.join(outDir, decodeURIComponent(req.url.split('?')[0]).replace(/\/$/, '/index.html'))
    if (!file.startsWith(outDir) || !fs.existsSync(file)) { res.writeHead(404); return res.end() }
    res.writeHead(200, { 'content-type': file.endsWith('.js') ? 'text/javascript' : 'text/html' })
    res.end(fs.readFileSync(file))
  })
  await new Promise(resolve => server.listen(0, resolve))
  const browser = await chromium.launch()
  let failed = 0
  try {
    const page = await browser.newPage()
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.goto(`http://localhost:${server.address().port}/`)
    const results = await page.waitForFunction(() => window.__results, null, { timeout: 20000 }).then(handle => handle.jsonValue())
    for (const result of results) {
      console.log(`${result.pass ? 'PASS' : 'FAIL'} ${result.name}${result.pass ? '' : ` — ${result.detail}`}`)
      if (!result.pass) failed++
    }
    if (errors.length) { console.log('Page errors:', errors.join(' | ')); failed++ }
    if (results.length < 5) { console.log(`Expected 5 scenarios, got ${results.length}`); failed++ }
  } finally {
    await browser.close(); server.close(); fs.rmSync(outDir, { recursive: true, force: true })
  }
  if (failed) process.exit(1)
  console.log('PASS useSharedJson integration: 5 scenarios with real React in Chromium')
})().catch(error => { console.error(error); process.exit(1) })
