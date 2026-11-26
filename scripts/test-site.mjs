import assert from 'node:assert/strict'
import { after, before, beforeEach, test } from 'node:test'
import { chromium } from 'playwright'
import { preview } from 'vite'

const projectPath = '/queens-model-assessment/'
const pilot = 'qwen3.5-4b-pilot'
const receiptRoute = (study, call) => `local-qwen/receipt/${study}/${call}`
let previewServer, browser, page, url

before(async () => {
  const origin = process.env.QUEENS_TEST_ORIGIN
  if (origin) {
    url = new URL(projectPath, origin)
  } else if (process.env.CI === 'true') {
    previewServer = await preview({ preview: { host: '127.0.0.1', port: 0 } })
    url = new URL(projectPath, `http://127.0.0.1:${previewServer.httpServer.address().port}`)
  }
  if (!url) throw new Error('Set QUEENS_TEST_ORIGIN to the running Queens preview origin.')
  browser = await chromium.launch()
})

after(async () => {
  await browser?.close()
  await previewServer?.close()
})

beforeEach(async context => {
  page = await browser.newPage()
  page.setDefaultTimeout(5000)
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.route('**/*', route => new URL(route.request().url()).origin === url.origin ? route.continue() : route.abort())
  context.after(async () => {
    await page.close()
    assert.deepEqual(errors, [], 'No uncaught browser errors')
  })
})

/** Open an actual hash route under the GitHub Pages base path. */
async function visit(route) {
  const response = await page.goto(new URL(`#/${route}`, url).href)
  assert.ok(response?.ok(), `Serve the built page at ${projectPath}`)
}

/** Wait for a unique visible element and verify its normalized text. */
async function visibleText(locator, expected) {
  await locator.waitFor({ state: 'visible' })
  assert.equal((await locator.innerText()).trim(), expected)
}

test('shared leaderboard displays solved boards and exact-format counts', async () => {
  await visit('executive-summary')
  assert.equal(await page.getByRole('radio', { name: 'Solved vs cost' }).getAttribute('aria-checked'), 'true')
  await page.getByText('Show the data as a table', { exact: true }).click()
  const row = page.getByRole('row').filter({ has: page.getByRole('rowheader', { name: 'GPT-5.6 Sol', exact: true }) })
  await visibleText(row.getByRole('cell').nth(1), '36/36')
  await visibleText(row.getByRole('cell').nth(2), '36')
})

test('completed leaderboard filters comparable studies by panel, protocol and size', async () => {
  await visit('executive-summary')
  await page.getByRole('radio', { name: 'Open-weight studies' }).click()
  await page.getByRole('radio', { name: 'Fresh2', exact: true }).click()
  const protocol = page.getByRole('combobox', { name: 'Protocol' })
  await protocol.selectOption({ label: 'image · 32k · 4 arms · shadow detection' })
  const results = page.locator('.ow-results li').filter({
    has: page.locator('a[href="#/local-qwen/study/qwen3.5-9b-nvfp4-fresh2-4arm-np32768"]'),
  })
  await visibleText(results.locator('.ow-score small'), '43/48')
  await page.getByRole('radio', { name: '5×5', exact: true }).click()
  await visibleText(results.locator('.ow-score small'), '16/16')
  await page.getByText('Loop-stop audits (2)', { exact: true }).click()
  const audits = page.getByRole('table', { name: 'Completed audits of selected client stops' })
  assert.deepEqual((await audits.getByRole('cell', { name: /^\d+\/\d+$/ }).allInnerTexts()).sort(), ['0/6', '1/5'])
  await results.getByRole('link').click()
  await page.waitForURL('**/#/local-qwen/study/qwen3.5-9b-nvfp4-fresh2-4arm-np32768')
  assert.equal(await page.getByLabel('Study', { exact: true }).inputValue(), 'qwen3.5-9b-nvfp4-fresh2-4arm-np32768')
})

test('open-weight cost order leaves unpriced studies unranked', async () => {
  await visit('executive-summary')
  await page.getByRole('radio', { name: 'Open-weight studies' }).click()
  await page.getByRole('radio', { name: 'Cost per call' }).click()
  const result = page.locator('.ow-results li').filter({
    has: page.locator('a[href="#/local-qwen/study/gemma4-e4b-fresh1-4arm-np32768"]'),
  })
  await visibleText(result.locator('.ow-score'), 'no price saved')
  assert.equal(await result.locator('.ow-place').innerText(), '')
  assert.match(await result.locator('..').getAttribute('aria-label'), /^Outside the cost order/)
})

test('Caveman chapter renders signed spend differences and links the original pilot', async () => {
  await visit('caveman-summary')
  await page.getByRole('heading', { level: 1, name: 'Caveman across the local studies' }).waitFor()
  const chart = page.locator('figure').filter({ hasText: 'Spend change by sampling round' })
  await chart.getByText('-21.12%', { exact: true }).waitFor()
  await chart.getByText('+7.19%', { exact: true }).waitFor()
  const table = page.getByRole('table', { name: 'Baseline and Caveman only · original estimated USD' })
  for (const [study, expected] of [
    ['qwen3.5-27b-q4_K_M-np24576-qwen-sampling-r3', '-21.12%'],
    ['qwen3.5-9b-nvfp4-np24576-qwen-sampling-r3', '+7.19%'],
  ]) {
    const link = page.locator(`a[href="#/local-qwen/study/${study}"]`)
    const row = table.getByRole('row').filter({ has: link })
    await visibleText(row.getByRole('cell').last(), expected)
  }
  await page.getByRole('main').getByRole('link', { name: 'Original 4B Caveman pilot' }).click()
  await page.waitForURL('**/#/caveman-summary/pilot')
  await page.getByRole('heading', { name: 'More strict answers in this sample' }).waitFor()
})

test('receipt shows its strict grade and follows the reciprocal same-board peer', async () => {
  await visit(receiptRoute(pilot, 'baseline_panel-5-18'))
  const matched = page.getByRole('navigation', { name: 'Matched conditions' })
  const grade = page.getByRole('table', { name: 'Recorded original attempt' }).getByRole('row').filter({ hasText: 'Outcome' })
  await visibleText(grade.getByRole('cell'), 'Strict correct')
  const peer = matched.getByRole('link', { name: 'Compare + Caveman · recorded', exact: true })
  assert.equal(await peer.getAttribute('href'), `#/${receiptRoute(pilot, 'caveman_panel-5-18')}`)
  await peer.click()
  await page.waitForURL(`**/#/${receiptRoute(pilot, 'caveman_panel-5-18')}`)
  await page.getByRole('heading', { level: 1, name: 'panel-5-18 · + Caveman' }).waitFor()
  assert.equal(await matched.getByRole('link', { name: 'Compare Baseline · recorded' }).getAttribute('href'), `#/${receiptRoute(pilot, 'baseline_panel-5-18')}`)
})

test('malformed fetched catalog fails closed on the study page', async () => {
  await page.route('**/evidence/local-qwen/index.json', async route => {
    const original = await route.fetch()
    const catalog = await original.json()
    catalog.studies.find(study => study.id === pilot).rows.find(row => row.call_id === 'baseline_panel-5-18').state = 'broken'
    await route.fulfill({ response: original, json: catalog })
  })
  await visit(`local-qwen/study/${pilot}`)
  await page.getByText(/The saved study snapshot is unavailable or invalid/).waitFor()
  assert.equal(await page.getByLabel('Study', { exact: true }).count(), 0)
})

test('changelog includes the Caveman synthesis with its PR link', async () => {
  await visit('changelog')
  await page.getByRole('heading', { name: 'Validate local assessment results and receipt navigation' }).waitFor()
  await page.getByRole('heading', { name: 'Caveman results across local studies' }).waitFor()
  await page.getByRole('link', { name: 'Pull request #16', exact: true }).waitFor()
})

test('data tables stack at phone widths and restore desktop columns and print headers', async () => {
  await page.setViewportSize({ width: 320, height: 640 })
  await visit('earlier-generations')
  const caption = 'Board-level records · original image condition'
  const table = page.getByRole('table', { name: caption })
  await table.waitFor()
  const row = table.getByRole('row').nth(1)
  assert.equal(await table.getByRole('columnheader', { name: 'Requested model' }).count(), 1)
  await visibleText(row.locator('.responsive-table-label').first(), 'Requested model')
  assert.match(await row.getByRole('rowheader').innerText(), /openai\/gpt-5\.5/)
  assert.equal(await row.getByRole('link', { name: 'Open receipt' }).count(), 1)
  const scroller = table.locator('..')
  assert.equal(await scroller.evaluate(node => node.scrollWidth <= node.clientWidth), true)
  assert.equal(await scroller.evaluate(node => node.scrollHeight <= node.clientHeight), true)

  await page.emulateMedia({ media: 'print' })
  assert.equal(await table.evaluate(node => getComputedStyle(node).display), 'table')
  assert.equal(await table.locator('thead th').first().evaluate(node => getComputedStyle(node).position), 'static')
  await page.emulateMedia({ media: 'screen' })

  await page.setViewportSize({ width: 1440, height: 1000 })
  const desktopRegion = page.getByRole('region', { name: caption, exact: true })
  await desktopRegion.waitFor()
  await row.locator('.responsive-table-label').first().waitFor({ state: 'hidden' })
  assert.equal(await table.locator('thead th').first().evaluate(node => getComputedStyle(node).position), 'sticky')
})

test('long model identifiers wrap inside stacked table cells', async () => {
  await page.setViewportSize({ width: 320, height: 640 })
  await visit('about-models')
  const table = page.getByRole('table', { name: 'Hosted models reached through OpenRouter: at a glance' })
  await table.waitFor()
  const fits = await table.locator('.responsive-table-value').evaluateAll(values =>
    values.every(value => value.scrollWidth <= value.clientWidth + 1),
  )
  assert.equal(fits, true)
})

test('Writing Arena keeps the reveal and keyboard focus when selecting a different page', async () => {
  await visit('writing-arena/queens-rules')
  const reveal = page.getByRole('checkbox', { name: 'Show who wrote each one' })
  assert.equal(await reveal.isChecked(), false)
  await reveal.check()
  const pages = page.getByRole('navigation', { name: 'Page to compare' })
  const next = pages.getByRole('link', { name: 'Jev primer' })
  await next.focus()
  await page.keyboard.press('Enter')
  await page.waitForURL('**/#/writing-arena/jev-primer')
  await next.and(page.locator('[aria-current="page"]')).waitFor()
  assert.equal(await reveal.isChecked(), true)
  assert.equal(await next.evaluate(element => element === document.activeElement), true)
})

test('Writing Arena identifies an unknown comparison page', async () => {
  await visit('writing-arena/does-not-exist')
  await page.getByRole('heading', { level: 1, name: 'Comparison page unavailable' }).waitFor()
  await page.getByRole('link', { name: 'See available comparisons' }).click()
  const pages = page.getByRole('navigation', { name: 'Page to compare' })
  await pages.getByRole('link', { name: 'Queens rules' }).and(page.locator('[aria-current="page"]')).waitFor()
})

test('Writing Arena keeps writer controls below the top bar when present', async () => {
  await page.setViewportSize({ width: 900, height: 1000 })
  await visit('writing-arena/queens-rules')
  const writerHeader = page.locator('.wa-pane-head').first()
  await writerHeader.waitFor()
  const bar = page.locator('.mobile-topbar')
  assert.equal(await bar.isVisible(), false)
  assert.equal(await writerHeader.evaluate(element => getComputedStyle(element).top), '0px')

  await page.setViewportSize({ width: 1010, height: 450 })
  await bar.waitFor()
  assert.equal(await writerHeader.evaluate(element => parseFloat(getComputedStyle(element).top)), (await bar.boundingBox()).height)
})

test('unfinished study progress loads when the disclosure opens', async () => {
  let requested = false
  page.on('request', request => {
    if (/\/assets\/OpenWeightProgress-[\w-]+\.js$/.test(request.url())) requested = true
  })
  await visit('executive-summary')
  await page.getByRole('radio', { name: 'Open-weight studies' }).click()
  const disclosure = page.getByText(/^Unfinished and superseded runs/)
  await disclosure.waitFor()
  assert.equal(requested, false)
  await disclosure.click()
  await page.getByRole('heading', { name: 'Unfinished panels' }).waitFor()
  assert.equal(requested, true)
})

test('Writing Arena tables stack inside narrow side-by-side panes and retain print columns', async () => {
  await page.setViewportSize({ width: 1024, height: 800 })
  await visit('writing-arena/protocol-results')
  await page.getByRole('checkbox', { name: 'Show who wrote each one' }).check()
  const panes = page.locator('.wa-pane')
  assert.equal(await panes.count(), 2)
  const pane = panes.first()
  await pane.getByRole('combobox', { name: 'Writer in this pane' }).selectOption({ label: 'Frozen source page' })
  const table = pane.getByRole('table').filter({ has: page.getByRole('columnheader', { name: 'STRICT + CORRECT', exact: true }) }).first()
  await table.waitFor()
  assert.equal(await table.locator('.responsive-table-label').first().isVisible(), true)
  assert.equal(await table.locator('..').evaluate(node => node.scrollWidth <= node.clientWidth + 1), true)
  await page.emulateMedia({ media: 'print' })
  assert.equal(await table.evaluate(node => getComputedStyle(node).display), 'table')
})

test('mobile model jumps keep the focused card heading below the sticky top bar', async () => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await visit('about-models')
  const table = page.getByRole('table', { name: 'Hosted models reached through OpenRouter: at a glance' })
  await table.getByRole('link').first().click()
  const card = page.locator('.am-card:focus')
  await card.waitFor()
  const heading = await card.getByRole('heading', { level: 3 }).boundingBox()
  const bar = await page.locator('.mobile-topbar').boundingBox()
  assert.ok(heading.y >= bar.y + bar.height)
})
