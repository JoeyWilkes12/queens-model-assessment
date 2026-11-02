// Local lab version of Codex's public-performance template (output/playwright/public-performance/lab-template.cjs):
// same routes, profiles and readiness criteria, against a local gzip server. Usage: node lab.cjs <port> <label> [samples]
const { chromium } = require('playwright'); const fs = require('fs')
const [port, label, samples = 3] = [process.argv[2], process.argv[3], +(process.argv[4] || 3)]
const base = `http://localhost:${port}/queens-model-assessment/`
const routes = [{ id: 'home', hash: '' }, { id: 'local-qwen', hash: '#/local-qwen' }, { id: 'atlas', hash: '#/evidence-atlas' }]
const profiles = [{ id: 'desktop', viewport: { width: 1440, height: 1000 }, cpu: 1, network: null },
  { id: 'mobile-slow4g', viewport: { width: 390, height: 844 }, cpu: 4, network: { offline: false, latency: 150, downloadThroughput: 200000, uploadThroughput: 93750, connectionType: 'cellular4g' } }]
;(async () => {
  const browser = await chromium.launch(); const results = []
  for (let round = 1; round <= samples; round++) for (const profile of profiles) for (const route of routes) {
    const mobile = profile.id !== 'desktop'
    const context = await browser.newContext({ viewport: profile.viewport, serviceWorkers: 'block', isMobile: mobile, hasTouch: mobile, deviceScaleFactor: mobile ? 3 : 1 })
    const p = await context.newPage(); const cdp = await context.newCDPSession(p)
    await cdp.send('Network.enable'); await cdp.send('Network.setCacheDisabled', { cacheDisabled: true })
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: profile.cpu }); if (profile.network) await cdp.send('Network.emulateNetworkConditions', profile.network)
    const requests = new Map(), errors = []
    cdp.on('Network.requestWillBeSent', e => requests.set(e.requestId, { url: e.request.url }))
    cdp.on('Network.loadingFinished', e => { const r = requests.get(e.requestId); if (r) r.bytes = e.encodedDataLength })
    p.on('pageerror', e => errors.push(e.message)); p.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
    await p.addInitScript(({ route }) => {
      window.__audit = { lcpMs: null, cls: 0, shifts: [], primaryReadyMs: null }
      new PerformanceObserver(l => { for (const e of l.getEntries()) window.__audit.lcpMs = e.startTime }).observe({ type: 'largest-contentful-paint', buffered: true })
      new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) { window.__audit.cls += e.value; window.__audit.shifts.push({ t: Math.round(e.startTime), v: +e.value.toFixed(4), nodes: e.sources.map(s => (s.node?.className || s.node?.nodeName || '?').toString().slice(0, 40)) }) } }).observe({ type: 'layout-shift', buffered: true })
      const ready = () => route === 'home' ? document.querySelector('.leaderboard .lb-controls')
        : route === 'atlas' ? (+(/(\d+) included by default/.exec(document.querySelector('.atlas-count')?.textContent || '')?.[1] || 0) > 1000)
          : document.querySelector('#lq-study') && document.querySelector('#lq-tariff') && document.querySelector('#lq-receipts tbody tr')
      const observer = new MutationObserver(() => { if (ready()) { observer.disconnect(); requestAnimationFrame(() => requestAnimationFrame(() => window.__audit.primaryReadyMs = performance.now())) } })
      observer.observe(document, { subtree: true, childList: true, characterData: true })
    }, { route: route.id })
    let failure = null
    try {
      await p.goto(base + route.hash, { waitUntil: 'domcontentloaded', timeout: 60000 })
      await p.waitForFunction(() => window.__audit.primaryReadyMs !== null, null, { timeout: 60000 })
      await p.waitForLoadState('networkidle', { timeout: 20000 }); await p.waitForTimeout(1000)
    } catch (e) { failure = String(e).slice(0, 200) }
    const audit = await p.evaluate(() => window.__audit)
    const reqs = [...requests.values()].filter(r => r.url.startsWith(base))
    const short = u => u.replace(base, '')
    const urls = reqs.map(r => short(r.url))
    results.push({ label, round, profile: profile.id, route: route.id, lcpMs: audit.lcpMs, cls: +audit.cls.toFixed(4), shifts: audit.shifts, primaryReadyMs: audit.primaryReadyMs, requestCount: reqs.length,
      transferBytes: reqs.reduce((n, r) => n + (r.bytes || 0), 0), jsBytes: reqs.filter(r => /\.js$/.test(r.url)).reduce((n, r) => n + (r.bytes || 0), 0),
      jsonBytes: reqs.filter(r => /\.json$/.test(r.url)).reduce((n, r) => n + (r.bytes || 0), 0), duplicates: urls.filter((u, i) => urls.indexOf(u) !== i), urls, errors, failure })
    await context.close()
  }
  await browser.close()
  fs.writeFileSync(`${__dirname}/lab-${label}.json`, JSON.stringify(results, null, 1))
  const med = a => { const s = a.filter(v => v !== null).sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : null }
  for (const profile of profiles) for (const route of routes) {
    const rows = results.filter(r => r.profile === profile.id && r.route === route.id)
    console.log([label, profile.id, route.id, 'lcp', Math.round(med(rows.map(r => r.lcpMs))), 'ready', Math.round(med(rows.map(r => r.primaryReadyMs))), 'cls', med(rows.map(r => r.cls)), 'req', med(rows.map(r => r.requestCount)), 'kB', (med(rows.map(r => r.transferBytes)) / 1000).toFixed(1), 'js', (med(rows.map(r => r.jsBytes)) / 1000).toFixed(1), 'json', (med(rows.map(r => r.jsonBytes)) / 1000).toFixed(1), 'dup', rows[0].duplicates.join(','), rows.some(r => r.failure) ? 'FAIL' : '', rows.flatMap(r => r.errors).slice(0, 2).join(' | ')].join(' '))
  }
})()
