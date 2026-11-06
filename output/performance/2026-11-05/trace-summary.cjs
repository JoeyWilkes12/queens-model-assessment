/**
 * Critical-path trace of the summary page (#/executive-summary) for two builds, to explain timing differences
 * before attributing them to a change. Mobile emulation (390×844, 1.6 Mbps, 150 ms) with normal caching, at 4×
 * and 12× CPU slowdown; A/B order alternates. Per sample it records the milestones on the way to "leaderboard
 * ready" (Resource Timing) and, from a Chrome trace of the renderer main thread, the busy time, long tasks and
 * top-level script evaluation before that point.
 *
 * Usage: node trace-summary.cjs <rounds> <labelA>=<portA> <labelB>=<portB>   → trace-summary.json beside this file
 */
const fs = require('fs'); const path = require('path')
const { chromium } = require('playwright')
const rounds = Number(process.argv[2] || 3)
const targets = process.argv.slice(3).map(arg => { const [label, port] = arg.split('='); return { label, base: `http://localhost:${port}/queens-model-assessment/` } })
const network = { offline: false, latency: 150, downloadThroughput: 200000, uploadThroughput: 93750, connectionType: 'cellular4g' }

async function sample(browser, target, cpu, file) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3, serviceWorkers: 'block' })
  const page = await context.newPage(); const cdp = await context.newCDPSession(page)
  await cdp.send('Network.enable'); await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu }); await cdp.send('Network.emulateNetworkConditions', network)
  await page.addInitScript(() => {
    window.__ready = null
    const observer = new MutationObserver(() => { if (document.querySelector('.leaderboard .lb-controls')) { observer.disconnect(); requestAnimationFrame(() => requestAnimationFrame(() => window.__ready = performance.now())) } })
    observer.observe(document, { subtree: true, childList: true })
  })
  await browser.startTracing(page, { path: file, categories: ['devtools.timeline', 'disabled-by-default-devtools.timeline', 'v8.execute'] })
  await page.goto(target.base, { waitUntil: 'domcontentloaded', timeout: 90000 })
  await page.waitForFunction(() => window.__ready !== null, null, { timeout: 90000 })
  const milestones = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0]
    const resource = pattern => performance.getEntriesByType('resource').find(entry => pattern.test(entry.name))
    const entry = resource(/assets\/index-.*\.js$/), board = resource(/leaderboard\.json$/)
    const round = value => value === undefined ? null : Math.round(value)
    return { htmlEnd: round(nav.responseEnd), entryJsEnd: round(entry?.responseEnd), domContentLoaded: round(nav.domContentLoadedEventEnd),
      leaderboardRequest: round(board?.startTime), leaderboardEnd: round(board?.responseEnd), ready: round(window.__ready),
      requestsBeforeReady: performance.getEntriesByType('resource').filter(e => e.startTime < window.__ready).length }
  })
  await browser.stopTracing()
  await context.close()
  const trace = JSON.parse(fs.readFileSync(file, 'utf8'))
  const events = trace.traceEvents || trace
  const main = new Set(events.filter(event => event.name === 'thread_name' && event.args?.name === 'CrRendererMain').map(event => `${event.pid}:${event.tid}`))
  const navStart = events.find(event => event.name === 'navigationStart')?.ts ?? Math.min(...events.filter(event => event.ts).map(event => event.ts))
  const readyAt = navStart + milestones.ready * 1000
  const tasks = events.filter(event => event.name === 'RunTask' && event.dur && main.has(`${event.pid}:${event.tid}`) && event.ts >= navStart && event.ts <= readyAt)
  fs.rmSync(file, { force: true })
  // Top-level script evaluation (module bodies), counted once: EvaluateScript and v8.evaluateModule do not nest in each other.
  const evaluation = events.filter(event => (event.name === 'EvaluateScript' || event.name === 'v8.evaluateModule') && event.dur && main.has(`${event.pid}:${event.tid}`) && event.ts >= navStart && event.ts <= readyAt)
  return { ...milestones, mainThreadBusyMs: Math.round(tasks.reduce((sum, task) => sum + task.dur / 1000, 0)), longTasks: tasks.filter(task => task.dur > 50000).length,
    scriptEvaluationMs: Math.round(evaluation.reduce((sum, event) => sum + event.dur / 1000, 0)) }
}

;(async () => {
  const browser = await chromium.launch()
  const rows = []
  for (const cpu of [4, 12]) for (let round = 1; round <= rounds; round++) for (const target of round % 2 ? targets : [...targets].reverse()) {
    const result = await sample(browser, target, cpu, path.join(require('os').tmpdir(), `trace-${target.label}-${cpu}-${round}.json`))
    rows.push({ cpu, round, target: target.label, ...result })
    console.log(JSON.stringify(rows.at(-1)))
  }
  await browser.close()
  fs.writeFileSync(path.join(__dirname, 'trace-summary.json'), JSON.stringify({ date: new Date().toISOString(), chromium: browser.version(), rounds, network, rows }, null, 1))
})().catch(error => { console.error(error); process.exit(1) })
