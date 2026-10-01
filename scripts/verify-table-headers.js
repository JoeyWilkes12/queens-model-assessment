// Run with the project's local Playwright CLI, not as a standalone Node script:
// playwright-cli --session queens-tables-20261001 run-code --filename=<this file>
async (page) => {
  const base = 'http://127.0.0.1:4190/queens-model-assessment/'
  const routes = ['executive-summary', 'assessment-receipt', 'queens-rules', 'protocol-results', 'earlier-generations', 'jev-primer', 'candidate-engineering', 'scale-primitives', 'jev-trajectories', 'evidence-atlas', 'methods-sources', 'about']
  const errors = []
  const checks = []
  page.on('pageerror', error => errors.push(error.message))
  const visit = async route => {
    await page.goto(`${base}#/${route}`)
    await page.locator('#main-content').waitFor()
    if (route === 'earlier-generations') await page.getByRole('region', { name: 'Every matched pair, replicate, and response receipt', exact: true }).waitFor()
    if (route === 'jev-trajectories') await page.getByRole('region', { name: 'Complete attempts, grouped by board and assistance', exact: true }).waitFor()
  }
  const inspect = async () => page.evaluate(async () => {
    const results = []
    const frame = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    const luminance = color => {
      const channels = color.match(/[\d.]+/g).slice(0, 3).map(value => {
        const channel = Number(value) / 255
        return channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4
      })
      return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722
    }
    const contrast = (foreground, background) => {
      const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a)
      return (values[0] + .05) / (values[1] + .05)
    }
    for (const region of document.querySelectorAll('.table-wrap')) {
      const heads = [...region.querySelectorAll('thead th')]
      const firstRow = region.querySelector('tbody tr')
      const vertical = region.scrollHeight > region.clientHeight + 1
      const horizontal = region.scrollWidth > region.clientWidth + 1
      const border = parseFloat(getComputedStyle(region).borderTopWidth)
      const normalHeadingOffset = heads[0].getBoundingClientRect().top - region.getBoundingClientRect().top - border
      region.scrollTop = vertical ? Math.min(250, region.scrollHeight - region.clientHeight) : 0
      region.scrollLeft = horizontal ? Math.min(180, region.scrollWidth - region.clientWidth) : 0
      await frame()
      const box = region.getBoundingClientRect()
      // A slightly overflowing table may not scroll past its caption. In that
      // case the still-visible header has not reached the sticky threshold yet.
      const expectedHeadingTop = box.top + border + Math.max(0, normalHeadingOffset - region.scrollTop)
      const failures = []
      if (!heads.length || region.querySelectorAll('caption').length !== 1) failures.push('missing native caption/headers')
      if (region.tabIndex !== 0 || region.getAttribute('role') !== 'region' || !region.getAttribute('aria-label')) failures.push('unnamed/unfocusable scroll region')
      if (!document.getElementById(region.getAttribute('aria-describedby') || '')) failures.push('missing scroll instructions')
      const hint = document.getElementById(region.getAttribute('aria-describedby'))
      if (hint && contrast(getComputedStyle(hint).color, getComputedStyle(document.body).backgroundColor) < 4.5) failures.push('scroll instruction contrast below 4.5:1')
      if (region.clientHeight > Math.min(576, innerHeight * .65) + 1) failures.push('viewport height cap exceeded')
      if (getComputedStyle(region).overflowY !== 'auto') failures.push('no native vertical scrolling')
      if (getComputedStyle(region.querySelector('table')).borderCollapse !== 'separate') failures.push('collapsed sticky borders')
      for (let index = 0; index < heads.length; index++) {
        const head = heads[index]
        const style = getComputedStyle(head)
        if (style.position !== 'sticky' || head.scope !== 'col') failures.push(`header ${index} is not a native sticky column header`)
        if (style.backgroundColor !== getComputedStyle(region).backgroundColor) failures.push(`header ${index} is not opaque/themed`)
        if (contrast(style.color, style.backgroundColor) < 4.5) failures.push(`header ${index} contrast below 4.5:1`)
        if (vertical && Math.abs(head.getBoundingClientRect().top - expectedHeadingTop) > 1.5) failures.push(`header ${index} moved during vertical scroll`)
        if (firstRow && Math.abs(head.getBoundingClientRect().left - firstRow.children[index].getBoundingClientRect().left) > 1.5) failures.push(`column ${index} lost horizontal alignment`)
      }
      const measured = parseFloat(region.style.getPropertyValue('--table-header-height'))
      if (!Number.isFinite(measured) || measured <= 0 || parseFloat(getComputedStyle(region).scrollPaddingBlockStart) < measured) failures.push('focus clearance does not cover header')
      results.push({ caption: region.getAttribute('aria-label'), rows: region.querySelectorAll('tbody tr').length, vertical, horizontal, failures })
      region.scrollTop = 0
      region.scrollLeft = 0
    }
    return { tables: results, pageOverflow: document.documentElement.scrollWidth > innerWidth + 1 }
  })

  for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport)
    for (const route of routes) {
      await visit(route)
      checks.push({ viewport, route, ...await inspect() })
    }
  }

  // The tallest, widest evidence table exercises both axes, low-height screens
  // and keyboard links. Preserve screenshots of the actual scrolled headers.
  for (const variant of [
    { name: 'desktop', width: 1440, height: 1000, theme: 'light' },
    { name: 'mobile', width: 390, height: 844, theme: 'light' },
    { name: 'mobile-dark', width: 390, height: 844, theme: 'dark' },
    { name: 'narrow', width: 320, height: 568, theme: 'light' },
    { name: 'landscape', width: 740, height: 360, theme: 'light' },
  ]) {
    await page.setViewportSize({ width: variant.width, height: variant.height })
    await visit('earlier-generations')
    await page.evaluate(theme => document.documentElement.setAttribute('data-theme', theme), variant.theme)
    checks.push({ viewport: variant, route: 'earlier-generations', ...await inspect() })
    const region = page.getByRole('region', { name: 'Board-level records · original image condition', exact: true })
    await region.evaluate(node => {
      const bar = document.querySelector('.mobile-topbar')
      const offset = bar && getComputedStyle(bar).display !== 'none' ? bar.getBoundingClientRect().height + 16 : 24
      window.scrollTo({ top: node.getBoundingClientRect().top + window.scrollY - offset, behavior: 'instant' })
      node.scrollTop = 280
      node.scrollLeft = 180
    })
    await page.screenshot({ path: `output/playwright/table-headers-${variant.name}-20261001.png`, scale: 'css' })
    // Focus the named scrollport; Tab must reveal its first receipt link below
    // the frozen header without losing the visible mobile navigation.
    await region.focus()
    await page.keyboard.press('Tab')
    const focus = await region.evaluate(node => {
      const active = document.activeElement
      const headingBottom = Math.max(...[...node.querySelectorAll('thead th')].map(head => head.getBoundingClientRect().bottom))
      const link = active.getBoundingClientRect()
      return { isReceiptLink: active.tagName === 'A' && node.contains(active), clearOfHeader: link.top >= headingBottom - 1, visibleInRegion: link.bottom <= node.getBoundingClientRect().bottom + 1 }
    })
    checks.push({ viewport: variant, keyboardFocus: focus })
  }

  await page.emulateMedia({ media: 'print' })
  checks.push({ print: await page.evaluate(() => [...document.querySelectorAll('.table-wrap')].every(node => getComputedStyle(node).maxBlockSize === 'none' && getComputedStyle(node).overflowY === 'visible' && getComputedStyle(node.querySelector('thead th')).position === 'static')) })
  await page.emulateMedia({ media: 'screen' })
  const failures = checks.filter(check => check.pageOverflow || check.print === false || check.tables?.some(table => table.failures.length) || check.keyboardFocus && Object.values(check.keyboardFocus).some(value => !value))
  const report = { result: failures.length || errors.length ? 'failed' : 'passed', routeViewportChecks: checks.filter(check => check.tables).length, tableChecks: checks.reduce((sum, check) => sum + (check.tables?.length || 0), 0), routeCoverage: checks.filter(check => check.tables).map(check => ({ route: check.route, viewport: check.viewport, tables: check.tables.length, verticallyScrollable: check.tables.filter(table => table.vertical).length })), keyboardFocusChecks: checks.filter(check => check.keyboardFocus), print: checks.find(check => 'print' in check).print, errors, failures }
  if (report.result !== 'passed') throw new Error(JSON.stringify(report))
  return report
}
