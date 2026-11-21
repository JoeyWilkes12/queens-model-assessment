import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MiniMarkdown } from '../node_modules/.cache/writing-arena/miniMarkdown.js'

const render = text => renderToStaticMarkup(createElement(MiniMarkdown, { text }))

test('literal pipe lines and a malformed table stay readable before a real table', () => {
  const text = '|\n| Not a header |\n| broken separator |\n\n| Heading |\n| --- |\n| content |'
  const html = render(text)
  assert.ok(html.includes('<p>|</p>'))
  assert.ok(html.includes('<p>| Not a header |</p>'))
  assert.ok(html.includes('<p>| broken separator |</p>'))
  assert.ok(html.includes('<th scope="col">Heading</th>'))
  assert.ok(html.includes('<td>content</td>'))
})

test('all five frozen pages and every recorded output render', () => {
  const root = new URL('../public/evidence/writing-arena/', import.meta.url)
  const read = path => readFileSync(new URL(path, root), 'utf8')
  const index = JSON.parse(read('index.json'))
  for (const path of [...index.tasks.map(row => row.source), ...index.entries.map(row => row.output)]) {
    const text = read(path)
    assert.equal(Boolean(render(text)), Boolean(text.trim()), path)
  }
})
