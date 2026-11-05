import { Icon, LocalToc, PageHero, Section, formatDay } from './bookUi'
import { CHANGELOG, FOUNDATION, REPOSITORY_URL, type ChangeKind } from './changelog'

export const KIND_LABEL: Record<ChangeKind, string> = { evidence: 'Evidence', chapter: 'Chapter', interface: 'Interface', method: 'Method', fix: 'Fix', dependency: 'Dependency' }

export function ChangelogPage() {
  const months = Array.from(new Set(CHANGELOG.map(entry => entry.date.slice(0, 7))))
  const monthLabel = (month: string) => new Date(`${month}-01T12:00:00Z`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' })
  return <><PageHero trail="Changelog" title="Changelog" deck="Every published change to this book, newest first. Rebuilt from the repository history: each pull request and each direct commit to the main branch is listed once, with links to the source." />
    <div className="reading-layout"><LocalToc items={[...months.map(month => ({ id: `changes-${month}`, label: monthLabel(month) })), { id: 'foundation', label: 'Foundation' }, { id: 'maintaining', label: 'How this log is kept' }]} />
      <main className="reading-column changelog" id="main-content">
        {months.map(month => <section key={month} id={`changes-${month}`} className="reading-section">
          <h2>{monthLabel(month)}</h2>
          <ol className="changelog-list">{CHANGELOG.filter(entry => entry.date.startsWith(month)).map(entry => <li key={`${entry.date}-${entry.title}`} className="changelog-entry">
            <div className="changelog-meta"><time dateTime={entry.date}>{formatDay(entry.date)}</time>{entry.kinds.map(kind => <span key={kind} className="changelog-kind">{KIND_LABEL[kind]}</span>)}</div>
            <h3>{entry.title}</h3>
            <ul>{entry.changes.map(change => <li key={change}>{change}</li>)}</ul>
            <p className="changelog-refs">{entry.pr && <a href={`${REPOSITORY_URL}/pull/${entry.pr}`} target="_blank" rel="noreferrer">Pull request #{entry.pr} <Icon name="external" size={14} /></a>}{entry.commits && <span>{entry.pr ? 'Commits' : 'Direct commits'}: {entry.commits.map((hash, index) => <span key={hash}>{index > 0 && ', '}<a href={`${REPOSITORY_URL}/commit/${hash}`} target="_blank" rel="noreferrer"><code>{hash}</code></a></span>)}</span>}</p>
          </li>)}</ol>
        </section>)}
        <Section id="foundation" title="Foundation">
          <div className="about-ledger"><div><span>Foundation report SHA</span><code>{FOUNDATION.reportSha}</code></div><div><span>Foundation source revision</span><code>{FOUNDATION.sourceRevision}</code></div><div><span>First commit in this repository</span><a href={`${REPOSITORY_URL}/commit/${CHANGELOG[CHANGELOG.length - 1].commits?.[0]}`} target="_blank" rel="noreferrer"><code>{CHANGELOG[CHANGELOG.length - 1].commits?.[0]}</code> · {formatDay(CHANGELOG[CHANGELOG.length - 1].date)} <Icon name="external" size={14} /></a></div></div>
          <p>{FOUNDATION.note}</p>
        </Section>
        <Section id="maintaining" title="How this log is kept">
          <p>Each pull request adds its own entry to <code>src/changelog.ts</code>. <code>npm run changelog:verify</code> fails if a commit on the main branch has no entry: a pull-request merge counts by its number and a direct commit by its hash. The <a href={`${REPOSITORY_URL}/commits/main`} target="_blank" rel="noreferrer">repository history <Icon name="external" size={14} /></a> remains the complete record.</p>
        </Section>
      </main>
    </div></>
}
