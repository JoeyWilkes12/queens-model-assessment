import { Fragment, type ReactNode } from 'react'

/**
 * A small Markdown renderer for model-written pages. It builds React elements directly and never
 * injects HTML, so whatever a model writes is shown as text. It covers what the arena prompt allows:
 * headings, paragraphs, lists, tables, block quotes, code fences and inline bold, italic, code and links.
 */

/** Inline spans: `code`, **bold**, *italic* and [text](https://…). Anything else stays literal. */
function inline(text: string, key = 0): ReactNode[] {
  const out: ReactNode[] = []
  const pattern = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*\s][^*]*\*)|(\[[^\]]+\]\(https?:\/\/[^)\s]+\))/
  let rest = text, index = key
  while (rest) {
    const match = pattern.exec(rest)
    if (!match) { out.push(rest); break }
    if (match.index) out.push(rest.slice(0, match.index))
    const token = match[0]
    if (token.startsWith('`')) out.push(<code key={index++}>{token.slice(1, -1)}</code>)
    else if (token.startsWith('**')) out.push(<strong key={index++}>{inline(token.slice(2, -2), index * 100)}</strong>)
    else if (token.startsWith('*')) out.push(<em key={index++}>{inline(token.slice(1, -1), index * 100)}</em>)
    else { const [, label, url] = /\[([^\]]+)\]\(([^)]+)\)/.exec(token)!; out.push(<a key={index++} href={url} rel="noreferrer">{label}</a>) }
    rest = rest.slice(match.index + token.length)
  }
  return out
}

const cells = (line: string) => line.trim().replace(/^\||\|$/g, '').split('|').map(cell => cell.trim())
const isRule = (line: string) => /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(line)

/** Render Markdown text as React elements. Headings are shifted down so a page's `#` becomes an h3 inside the arena. */
export function MiniMarkdown({ text }: { text: string }) {
  const lines = text.replace(/\r/g, '').split('\n')
  const blocks: ReactNode[] = []
  let i = 0, key = 0
  while (i < lines.length) {
    const line = lines[i]
    if (!line.trim()) { i++; continue }
    if (/^```/.test(line)) {
      const body: string[] = []
      for (i++; i < lines.length && !/^```/.test(lines[i]); i++) body.push(lines[i])
      i++
      blocks.push(<pre key={key++}><code>{body.join('\n')}</code></pre>)
      continue
    }
    const heading = /^(#{1,6})\s+(.*)$/.exec(line)
    if (heading) {
      const level = Math.min(6, heading[1].length + 2)
      const Tag = `h${level}` as 'h3'
      blocks.push(<Tag key={key++}>{inline(heading[2].replace(/\s+#+\s*$/, ''))}</Tag>)
      i++
      continue
    }
    if (/^\s*\|/.test(line) && i + 1 < lines.length && isRule(lines[i + 1])) {
      const head = cells(line), rows: string[][] = []
      for (i += 2; i < lines.length && /^\s*\|/.test(lines[i]); i++) rows.push(cells(lines[i]))
      blocks.push(<div className="wa-table" key={key++}><table><thead><tr>{head.map((cell, c) => <th key={c} scope="col">{inline(cell)}</th>)}</tr></thead>
        <tbody>{rows.map((row, r) => <tr key={r}>{row.map((cell, c) => <td key={c}>{inline(cell)}</td>)}</tr>)}</tbody></table></div>)
      continue
    }
    const bullet = /^\s*([-*+]|\d+[.)])\s+/
    if (bullet.test(line)) {
      const ordered = /^\s*\d/.test(line), items: string[] = []
      for (; i < lines.length && (bullet.test(lines[i]) || (/^\s{2,}\S/.test(lines[i]) && items.length)); i++) {
        if (bullet.test(lines[i])) items.push(lines[i].replace(bullet, ''))
        else items[items.length - 1] += ' ' + lines[i].trim()
      }
      const List = ordered ? 'ol' : 'ul'
      blocks.push(<List key={key++}>{items.map((item, n) => <li key={n}>{inline(item)}</li>)}</List>)
      continue
    }
    if (/^\s*>/.test(line)) {
      const quote: string[] = []
      for (; i < lines.length && /^\s*>/.test(lines[i]); i++) quote.push(lines[i].replace(/^\s*>\s?/, ''))
      blocks.push(<blockquote key={key++}>{inline(quote.join(' '))}</blockquote>)
      continue
    }
    if (/^\s*([-*_])\s*\1\s*\1[\s\-*_]*$/.test(line)) { blocks.push(<hr key={key++} />); i++; continue }
    const paragraph: string[] = []
    for (; i < lines.length && lines[i].trim() && !/^(#{1,6}\s|```|\s*>|\s*\|)/.test(lines[i]) && !bullet.test(lines[i]); i++) paragraph.push(lines[i].trim())
    blocks.push(<p key={key++}>{inline(paragraph.join(' '))}</p>)
  }
  return <Fragment>{blocks}</Fragment>
}
