/**
 * Matched A/B lab for two production builds of the book, served locally with gzip (gzip-static-server.cjs).
 * Revised after the PR #14 review: same routes, readiness criteria and profiles as the November 2 harness, plus
 *   - both cache modes: a fresh context with the normal HTTP cache, and CDP cache disabled;
 *   - A/B order alternated every round, after one unrecorded warm-up load per build and route;
 *   - invalid samples (navigation, readiness or browser errors) are kept in the raw output, excluded from medians,
 *     and make the process exit 1;
 *   - layout shift reported two ways: the captured sum of every non-input shift, and session-window CLS
 *     (largest burst of shifts less than 1 s apart, at most 5 s long), as the CLS metric defines it;
 *   - run metadata: build SHAs, Chromium and Playwright versions, CPU, Node, endpoints and cache policy.
 *
 * Usage: node ab-lab.cjs <rounds> <labelA>=<portA>@<shaA> <labelB>=<portB>@<shaB>
 * Writes ab-results.json beside this file and prints medians with ranges.
 */
const fs = require('fs'); const os = require('os'); const path = require('path')
const { chromium } = require('playwright')
const [rounds, ...targetArgs] = [Number(process.argv[2] || 3), ...process.argv.slice(3)]
const targets = targetArgs.map(arg => { const [label, rest] = arg.split('='); const [port, sha] = rest.split('@'); return { label, sha, base: `http://localhost:${port}/queens-model-assessment/` } })
if (targets.length !== 2) throw new Error('give exactly two targets: label=port@sha')
const routes = [{ id: 'home', hash: '' }, { id: 'local-qwen', hash: '#/local-qwen' }, { id: 'atlas', hash: '#/evidence-atlas' }]
const profiles = [{ id: 'desktop', viewport: { width: 1440, height: 1000 }, cpu: 1, network: null },
  { id: 'mobile-slow4g', viewport: { width: 390, height: 844 }, cpu: 4, network: { offline: false, latency: 150, downloadThroughput: 200000, uploadThroughput: 93750, connectionType: 'cellular4g' } }]
const cacheModes = ['normal', 'disabled']

async function sample(browser, target, profile, route, cacheMode) {
  const mobile = profile.id !== 'desktop'
  const context = await browser.newContext({ viewport: profile.viewport, serviceWorkers: 'block', isMobile: mobile, hasTouch: mobile, deviceScaleFactor: mobile ? 3 : 1 })
  const page = await context.newPage(); const cdp = await context.newCDPSession(page)
  await cdp.send('Network.enable'); await cdp.send('Network.setCacheDisabled', { cacheDisabled: cacheMode === 'disabled' })
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: profile.cpu }); if (profile.network) await cdp.send('Network.emulateNetworkConditions', profile.network)
  const requests = new Map(), errors = []
  cdp.on('Network.requestWillBeSent', event => requests.set(event.requestId, { url: event.request.url }))
  cdp.on('Network.loadingFinished', event => { const request = requests.get(event.requestId); if (request) request.bytes = event.encodedDataLength })
  cdp.on('Network.loadingFailed', event => { const request = requests.get(event.requestId); if (request && !event.canceled) errors.push(`request failed: ${request.url} ${event.errorText}`) })
  page.on('pageerror', error => errors.push(error.message)); page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  await page.addInitScript(({ route }) => {
    window.__audit = { lcpMs: null, shifts: [], primaryReadyMs: null }
    new PerformanceObserver(list => { for (const entry of list.getEntries()) window.__audit.lcpMs = entry.startTime }).observe({ type: 'largest-contentful-paint', buffered: true })
    new PerformanceObserver(list => { for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.__audit.shifts.push({ t: entry.startTime, v: entry.value }) }).observe({ type: 'layout-shift', buffered: true })
    const ready = () => route === 'home' ? document.querySelector('.leaderboard .lb-controls')
      : route === 'atlas' ? (+(/(\d+) included by default/.exec(document.querySelector('.atlas-count')?.textContent || '')?.[1] || 0) > 1000)
        : document.querySelector('#lq-study') && document.querySelector('#lq-tariff') && document.querySelector('#lq-receipts tbody tr')
    const observer = new MutationObserver(() => { if (ready()) { observer.disconnect(); requestAnimationFrame(() => requestAnimationFrame(() => window.__audit.primaryReadyMs = performance.now())) } })
    observer.observe(document, { subtree: true, childList: true, characterData: true })
  }, { route: route.id })
  let failure = null
  try {
    await page.goto(target.base + route.hash, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await page.waitForFunction(() => window.__audit.primaryReadyMs !== null, null, { timeout: 60000 })
    await page.waitForLoadState('networkidle', { timeout: 20000 }); await page.waitForTimeout(1000)
  } catch (error) { failure = String(error).slice(0, 300) }
  const audit = await page.evaluate(() => window.__audit).catch(() => ({ lcpMs: null, shifts: [], primaryReadyMs: null }))
  await context.close()
  const own = [...requests.values()].filter(request => request.url.startsWith(target.base))
  const shiftSum = audit.shifts.reduce((sum, shift) => sum + shift.v, 0)
  let sessionCls = 0, windowStart = -Infinity, last = -Infinity, current = 0
  for (const shift of audit.shifts) {
    if (shift.t - last >= 1000 || shift.t - windowStart >= 5000) { windowStart = shift.t; current = 0 }
    current += shift.v; last = shift.t; sessionCls = Math.max(sessionCls, current)
  }
  const valid = !failure && !errors.length && audit.primaryReadyMs !== null
  return { lcpMs: audit.lcpMs, primaryReadyMs: audit.primaryReadyMs, layoutShiftSum: +shiftSum.toFixed(4), sessionWindowCls: +sessionCls.toFixed(4),
    requestCount: own.length, transferBytes: own.reduce((sum, request) => sum + (request.bytes || 0), 0), valid, failure, errors }
}

;(async () => {
  const browser = await chromium.launch()
  const meta = { date: new Date().toISOString(), rounds, targets, chromium: browser.version(), playwright: require('playwright/package.json').version, node: process.version,
    cpu: os.cpus()[0]?.model, cpuCount: os.cpus().length, cacheModes, profiles, routes: routes.map(route => route.id), server: 'gzip-static-server.cjs (gzip level 6, max-age=600), warmed by one unrecorded load per build and route' }
  for (const target of targets) for (const route of routes) await sample(browser, target, profiles[0], route, 'normal')
  const samples = []
  for (let round = 1; round <= rounds; round++) {
    const order = round % 2 ? targets : [...targets].reverse()
    for (const profile of profiles) for (const cacheMode of cacheModes) for (const route of routes) for (const target of order) {
      const result = await sample(browser, target, profile, route, cacheMode)
      samples.push({ round, order: order.map(t => t.label).join('>'), target: target.label, profile: profile.id, cacheMode, route: route.id, ...result })
    }
  }
  await browser.close()
  fs.writeFileSync(path.join(__dirname, 'ab-results.json'), JSON.stringify({ meta, samples }, null, 1))
  const valid = samples.filter(row => row.valid)
  const median = values => { const sorted = values.filter(value => value !== null).sort((a, b) => a - b); return sorted.length ? sorted[Math.floor(sorted.length / 2)] : null }
  const range = values => { const sorted = values.filter(value => value !== null).sort((a, b) => a - b); return sorted.length ? `${Math.round(sorted[0])}–${Math.round(sorted.at(-1))}` : '—' }
  console.log(`samples ${samples.length}, valid ${valid.length}; ${meta.chromium}, Playwright ${meta.playwright}, ${meta.cpu}`)
  for (const profile of profiles) for (const cacheMode of cacheModes) for (const route of routes) {
    const line = targets.map(target => {
      const rows = valid.filter(row => row.target === target.label && row.profile === profile.id && row.cacheMode === cacheMode && row.route === route.id)
      return `${target.label}: ready ${Math.round(median(rows.map(row => row.primaryReadyMs)))} (${range(rows.map(row => row.primaryReadyMs))}) lcp ${Math.round(median(rows.map(row => row.lcpMs)))} sum ${median(rows.map(row => row.layoutShiftSum))} cls ${median(rows.map(row => row.sessionWindowCls))} ${(median(rows.map(row => row.transferBytes)) / 1000).toFixed(1)}kB n=${rows.length}`
    })
    console.log(`${profile.id} ${cacheMode} ${route.id} | ${line.join(' | ')}`)
  }
  if (valid.length !== samples.length) { console.error(`${samples.length - valid.length} invalid samples (kept in ab-results.json, excluded from medians)`); process.exit(1) }
})().catch(error => { console.error(error); process.exit(1) })
