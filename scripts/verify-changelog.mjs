/**
 * Check that src/changelog.ts covers every first-parent commit on main, and that the navigation tree
 * has unique paths and a Changelog page. Pull-request merges are covered by their PR number; any other
 * commit by a hash prefix listed in an entry's `commits`.
 *
 * Usage: node --experimental-strip-types scripts/verify-changelog.mjs [ref]   (default ref: origin/main)
 * A shallow clone checks only the commits it can see and says so; a missing ref skips the history check.
 */
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { CHANGELOG } from '../src/changelog.ts'
import { BOOK_PARTS, NAV_ENTRIES } from '../src/bookNav.ts'

const paths = NAV_ENTRIES.map(entry => entry.page.path)
assert.equal(new Set(paths).size, paths.length, 'navigation paths must be unique')
assert.equal(new Set(BOOK_PARTS.map(part => part.id)).size, BOOK_PARTS.length, 'part ids must be unique')
assert.ok(paths.includes('changelog'), 'the navigation must list the changelog')

for (const [index, entry] of CHANGELOG.entries()) {
  assert.match(entry.date, /^\d{4}-\d{2}-\d{2}$/, `entry ${index} date`)
  assert.ok(entry.changes.length > 0, `entry ${index} has no changes`)
  if (index > 0) assert.ok(entry.date <= CHANGELOG[index - 1].date, `entry ${index} (${entry.title}) is out of date order`)
}
const prs = CHANGELOG.flatMap(entry => entry.pr ? [entry.pr] : [])
assert.equal(new Set(prs).size, prs.length, 'each pull request appears once')

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim()
const ref = process.argv[2] || 'origin/main'
let log = ''
let shallow = false
try {
  log = git('log', '--first-parent', '--format=%H %s', ref)
  shallow = git('rev-parse', '--is-shallow-repository') === 'true'
} catch (error) {
  console.log(`SKIP history check (${error.message.split('\n')[0]}); structure checks passed for ${CHANGELOG.length} entries.`)
  process.exit(0)
}

const hashes = CHANGELOG.flatMap(entry => entry.commits ?? [])
const missing = []
const lines = log.split('\n').filter(Boolean)
for (const line of lines) {
  const [hash, ...subject] = line.split(' ')
  const merged = /^Merge pull request #(\d+)/.exec(subject.join(' '))
  const covered = merged ? prs.includes(Number(merged[1])) : hashes.some(prefix => hash.startsWith(prefix))
  if (!covered) missing.push(`${hash.slice(0, 8)} ${subject.join(' ').slice(0, 90)}`)
}
assert.deepEqual(missing, [], `first-parent commits on ${ref} missing from src/changelog.ts:\n${missing.join('\n')}`)
console.log(`PASS changelog: ${lines.length} first-parent commits on ${ref} covered by ${CHANGELOG.length} entries${shallow ? ' (shallow clone: only the visible history was checked)' : ''}.`)
