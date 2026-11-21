/**
 * Print regression check for evidence that loads on demand (src/printPreparation.ts, src/FeaturedReplays.tsx).
 * Serves the production build in dist/ and prints the summary page to PDF with Chromium (Playwright).
 * The featured-replay JSON is delayed by one second to model a slow connection.
 *
 *   1. Menu print before the replays load (no scrolling): the PDF shows the defined text fallback
 *      (titles, takeaways, links), never "Loading saved attempts…".
 *   2. Ctrl+P before the replays load: the shortcut loads and renders the selected replay first, then
 *      opens the print dialog once, and the PDF shows the replay instead of the fallback.
 *   3. Ctrl+P after the replays loaded: nothing is pending, so the browser's own shortcut is left alone.
 *
 * Usage: npm run build && npm run test:print   (needs Playwright with Chromium; uses pdftotext when installed)
 */
const http = require('http')
const fs = require('fs')
const path = require('path')
const { execFileSync } = require('child_process')
const assert = require('assert/strict')
const { chromium } = require('playwright')

const dist = path.resolve(__dirname, '..', 'dist')
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png' }
const server = http.createServer((req, res) => {
  let file = decodeURIComponent(req.url.split('?')[0]).replace(/^\/queens-model-assessment/, '')
  if (file.endsWith('/')) file += 'index.html'
  const full = path.join(dist, file)
  if (!full.startsWith(dist) || !fs.existsSync(full) || fs.statSync(full).isDirectory()) { res.writeHead(404); return res.end() }
  res.writeHead(200, { 'content-type': types[path.extname(full)] || 'application/octet-stream' })
  res.end(fs.readFileSync(full))
})

const REPLAY_JSON = /(trajectory-study|subq-trajectories-summary|subq-trajectories-protocol)\.json$/
const SOLVED_TITLE = 'SubQ Snap completes board 5-2'
const FALLBACK_LEAD = 'Recorded attempts, with their receipts online'

let hasPdftotext = true
try { execFileSync('pdftotext', ['-v'], { stdio: 'ignore' }) } catch { hasPdftotext = false }

/** Printed text: the PDF's own text when pdftotext is available, else the print-media DOM text. */
async function printedText(page, file) {
  await page.pdf({ path: file, format: 'A4' })
  if (hasPdftotext) return execFileSync('pdftotext', [file, '-']).toString().replace(/\s+/g, ' ')
  await page.emulateMedia({ media: 'print' })
  return (await page.locator('body').innerText()).replace(/\s+/g, ' ')
}

async function freshPage(browser, base) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  await context.route(REPLAY_JSON, async route => { await new Promise(resolve => setTimeout(resolve, 1000)); await route.continue() })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  // Record each window.print() call and whether the replay had rendered at that moment.
  await page.addInitScript(() => {
    window.__prints = []
    window.print = () => window.__prints.push(!!document.querySelector('#featured-panel .board-replay'))
  })
  await page.goto(base, { waitUntil: 'networkidle' })
  return { context, page, errors }
}

;(async () => {
  assert.ok(fs.existsSync(path.join(dist, 'index.html')), 'run npm run build first')
  await new Promise(resolve => server.listen(0, resolve))
  const base = `http://localhost:${server.address().port}/queens-model-assessment/`
  const tmp = fs.mkdtempSync(path.join(require('os').tmpdir(), 'print-check-'))
  const browser = await chromium.launch()
  try {
    {
      const { context, page, errors } = await freshPage(browser, base)
      const text = await printedText(page, path.join(tmp, 'menu.pdf'))
      assert.ok(!text.includes('Loading saved attempts'), 'menu print must not show the loading line')
      assert.ok(text.includes(FALLBACK_LEAD) && text.includes(SOLVED_TITLE), 'menu print shows the text fallback with the attempt titles')
      // pdftotext can drop a hyphen at a line break inside the URL, so match the attempt id.
      assert.ok(text.includes('sequence-5-2_local_a1'), 'the fallback links to the attempt')
      assert.deepEqual(errors, [])
      console.log('PASS menu print before the replays load: text fallback, no loading line')
      await context.close()
    }
    {
      const { context, page, errors } = await freshPage(browser, base)
      await page.keyboard.press('Control+P')
      await page.waitForFunction(() => window.__prints.length > 0, null, { timeout: 15000 })
      assert.deepEqual(await page.evaluate(() => window.__prints), [true], 'print opens once, after the replay rendered')
      const text = await printedText(page, path.join(tmp, 'shortcut.pdf'))
      assert.ok(text.includes(SOLVED_TITLE) && !text.includes(FALLBACK_LEAD), 'the printed page shows the loaded replay')
      assert.deepEqual(errors, [])
      console.log('PASS Ctrl+P before the replays load: replay rendered before the print dialog')
      await context.close()
    }
    {
      const { context, page } = await freshPage(browser, base)
      await page.locator('#featured-panel').scrollIntoViewIfNeeded()
      await page.waitForSelector('#featured-panel .board-replay')
      await page.keyboard.press('Control+P')
      await page.waitForTimeout(500)
      assert.deepEqual(await page.evaluate(() => window.__prints), [], 'nothing pending: the browser keeps its own shortcut')
      console.log('PASS Ctrl+P after the replays loaded: shortcut not intercepted')
      await context.close()
    }
    console.log(`PASS print check (${hasPdftotext ? 'PDF text via pdftotext' : 'print-media DOM text; pdftotext not installed'})`)
  } finally {
    await browser.close()
    server.close()
    fs.rmSync(tmp, { recursive: true, force: true })
  }
})().catch(error => { console.error(error); process.exit(1) })
