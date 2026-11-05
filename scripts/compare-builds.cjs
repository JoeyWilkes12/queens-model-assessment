/**
 * Check that a refactor does not change what readers see. Loads the same routes from two production builds in
 * Chromium and compares, per route, the rendered DOM of the page (asset hashes and React-generated ids normalized)
 * and a viewport screenshot. Routes are the book's pages plus every in-book link found on them, up to --max.
 *
 * Usage: node --experimental-strip-types scripts/compare-builds.cjs <portA> <portB> [--max 160] [--mobile] [--only '#/route']
 * Serve each dist/ with scripts/perf/gzip-static-server.cjs first. Exits 1 on any difference or page error.
 */
const { chromium } = require('playwright')
const args = process.argv.slice(2)
const flag = (name, takesValue) => { const index = args.indexOf(name); return index >= 0 ? args.splice(index, takesValue ? 2 : 1).at(-1) : undefined }
const max = Number(flag('--max', true) || 160), only = flag('--only', true), mobile = flag('--mobile') !== undefined
const [portA, portB] = args
const base = port => `http://localhost:${port}/queens-model-assessment/`

async function settle(page) {
  await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => undefined)
  await page.waitForFunction(() => !document.querySelector('[aria-busy="true"]') && !/Loading/.test(document.querySelector('main')?.getAttribute('aria-busy') || ''), null, { timeout: 30000 }).catch(() => undefined)
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(300)
}

async function capture(context, url) {
  const page = await context.newPage(); const errors = []
  page.on('pageerror', error => errors.push(error.message)); page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  await page.goto(url, { waitUntil: 'domcontentloaded' }); await settle(page)
  const result = await page.evaluate(() => ({
    title: document.title,
    html: document.querySelector('.page-body')?.innerHTML.replace(/assets\/[\w.-]+-[\w-]{8}\.(js|css)/g, 'assets/HASHED').replace(/:r[\w]+:|«r[\w]+»/g, ':id:').replaceAll(location.origin, 'ORIGIN') ?? '',
    links: [...document.querySelectorAll('a[href^="#/"]')].map(link => link.getAttribute('href')),
  }))
  const shot = await page.screenshot()
  await page.close()
  return { ...result, shot, errors }
}

;(async () => {
  const { BOOK_PAGES } = await import('../src/bookNav.ts')
  const queue = only ? [only] : ['', ...BOOK_PAGES.map(page => `#/${page.path}`)], seen = new Set(only ? ['*'] : queue)
  const browser = await chromium.launch()
  const options = mobile ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 } : { viewport: { width: 1440, height: 1000 } }
  const [contextA, contextB] = [await browser.newContext({ ...options, reducedMotion: 'reduce' }), await browser.newContext({ ...options, reducedMotion: 'reduce' })]
  const differences = []
  for (let index = 0; index < queue.length && index < max; index++) {
    const route = queue[index]
    const [a, b] = [await capture(contextA, base(portA) + route), await capture(contextB, base(portB) + route)]
    const problems = []
    if (a.title !== b.title) problems.push(`title "${a.title}" → "${b.title}"`)
    if (a.html !== b.html) { let at = 0; while (a.html[at] === b.html[at]) at++; problems.push(`DOM differs at ${at}: "${a.html.slice(at - 60, at + 60)}" → "${b.html.slice(at - 60, at + 60)}"`) }
    // A few pages finish painting late (images, replays); retake both screenshots twice before calling it a difference.
    let shotsMatch = a.shot.equals(b.shot)
    for (let retry = 0; !shotsMatch && retry < 2; retry++) shotsMatch = (await capture(contextA, base(portA) + route)).shot.equals((await capture(contextB, base(portB) + route)).shot)
    if (!shotsMatch) problems.push('screenshot differs (after two retakes)')
    if (b.errors.length) problems.push(`errors in B: ${b.errors.join('; ')}`)
    console.log(`${problems.length ? 'DIFF' : 'same'} ${route || '#/'}${problems.length ? `\n  ${problems.join('\n  ')}` : ''}`)
    if (problems.length) differences.push(route)
    if (!only) for (const link of a.links) { const clean = link.split('?')[0]; if (!seen.has(clean)) { seen.add(clean); queue.push(clean) } }
  }
  await browser.close()
  console.log(`${Math.min(queue.length, max)} routes compared (${queue.length} found), ${differences.length} different.`)
  if (differences.length) process.exit(1)
})().catch(error => { console.error(error); process.exit(1) })
