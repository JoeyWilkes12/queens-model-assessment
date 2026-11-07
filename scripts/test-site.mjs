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
  await page.getByText('Show the data as a table', { exact: true }).click()
  const row = page.getByRole('row').filter({ has: page.getByRole('rowheader', { name: 'GPT-5.6 Sol', exact: true }) })
  await visibleText(row.getByRole('cell').nth(1), '36/36')
  await visibleText(row.getByRole('cell').nth(2), '36')
})

test('completed leaderboard combines model, panel and size while keeping audits separate', async () => {
  await visit('executive-summary')
  await page.getByRole('radio', { name: 'Completed open-weight' }).click()
  await page.getByLabel('Model', { exact: true }).selectOption('qwen3.5:9b-nvfp4')
  await page.getByLabel('Board panel', { exact: true }).selectOption('fresh2')
  const results = page.locator('.ow-results')
  await visibleText(results.getByText(/strict$/), '43/48 strict')
  await page.getByLabel('Board size', { exact: true }).selectOption('5')
  await visibleText(results.getByText(/strict$/), '16/16 strict')
  await page.getByText('2 selected loop-stop audits · diagnostic reruns', { exact: true }).click()
  const audits = page.getByRole('table', { name: 'Completed audits of selected client stops' })
  assert.deepEqual((await audits.getByRole('cell', { name: /^\d+\/\d+$/ }).allTextContents()).sort(), ['0/6', '1/5'])
  await results.getByRole('link').click()
  await page.waitForURL('**/#/local-qwen/study/qwen3.5-9b-nvfp4-fresh2-4arm-np32768')
  assert.equal(await page.getByLabel('Study', { exact: true }).inputValue(), 'qwen3.5-9b-nvfp4-fresh2-4arm-np32768')
})

test('Caveman chapter renders signed spend differences and links the original pilot', async () => {
  await visit('caveman-summary')
  await page.getByRole('heading', { level: 1, name: 'Caveman across the local studies' }).waitFor()
  const chart = page.locator('figure').filter({ hasText: 'Spend change by sampling round' })
  await chart.getByText('-21.12%', { exact: true }).waitFor()
  await chart.getByText('+7.19%', { exact: true }).waitFor()
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
  await page.getByRole('heading', { name: 'Caveman comparison across local studies' }).waitFor()
  await page.getByRole('link', { name: 'Pull request #16', exact: true }).waitFor()
})
