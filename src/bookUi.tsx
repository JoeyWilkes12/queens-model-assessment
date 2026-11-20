import { Fragment, useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { crumbsFor } from './bookNav'

export function assetUrl(path: string) {
  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`
}

export function useHashPath() {
  const read = () => window.location.hash.replace(/^#\/?/, '').replace(/\/$/, '') || 'executive-summary'
  const [path, setPath] = useState(read)
  useEffect(() => {
    const onChange = () => setPath(read())
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return [
    path,
    (next: string) => {
      window.location.hash = `/${next}`
    },
  ] as const
}

export function Icon({
  name,
  size = 18,
}: {
  name:
    | 'arrow'
    | 'up'
    | 'chevron'
    | 'book'
    | 'close'
    | 'menu'
    | 'moon'
    | 'sun'
    | 'copy'
    | 'download'
    | 'search'
    | 'external'
    | 'expand'
  size?: number
}) {
  const paths: Record<string, ReactNode> = {
    arrow: (
      <>
        <path d="M4 9h11" />
        <path d="m11 4 5 5-5 5" />
      </>
    ),
    up: (
      <>
        <path d="M10 16V4" />
        <path d="m5 9 5-5 5 5" />
      </>
    ),
    chevron: <path d="m8 5 5 5-5 5" />,
    book: (
      <>
        <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H19v17H6.5A2.5 2.5 0 0 0 4 21.5v-17Z" />
        <path d="M4 19V4.5" />
        <path d="M7.5 6H16" />
        <path d="M7.5 9H16" />
      </>
    ),
    close: (
      <>
        <path d="m5 5 10 10" />
        <path d="m15 5-10 10" />
      </>
    ),
    menu: (
      <>
        <path d="M3 5h14" />
        <path d="M3 10h14" />
        <path d="M3 15h14" />
      </>
    ),
    moon: <path d="M15.5 12.5A6.5 6.5 0 0 1 8 5.2 6.5 6.5 0 1 0 15.5 12.5Z" />,
    sun: (
      <>
        <circle cx="10" cy="10" r="3" />
        <path d="M10 2v2M10 16v2M2 10h2m12 0h2M4.3 4.3l1.4 1.4m8.6 8.6 1.4 1.4m0-11.4-1.4 1.4m-8.6 8.6-1.4 1.4" />
      </>
    ),
    copy: (
      <>
        <rect x="5" y="5" width="10" height="10" rx="1" />
        <path d="M8 2h7a2 2 0 0 1 2 2v7" />
      </>
    ),
    download: (
      <>
        <path d="M10 2v10" />
        <path d="m6 8 4 4 4-4" />
        <path d="M3 15v2h14v-2" />
      </>
    ),
    search: (
      <>
        <circle cx="8.5" cy="8.5" r="5.5" />
        <path d="m13 13 4 4" />
      </>
    ),
    external: (
      <>
        <path d="M10 4h6v6" />
        <path d="m16 4-7 7" />
        <path d="M14 13v3H4V6h3" />
      </>
    ),
    expand: (
      <>
        <path d="M8 3H3v5" />
        <path d="m3 3 5 5" />
        <path d="M12 17h5v-5" />
        <path d="m17 17-5-5" />
      </>
    ),
  }
  return (
    <svg
      aria-hidden="true"
      className="icon"
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="square"
      strokeLinejoin="miter"
    >
      {paths[name]}
    </svg>
  )
}

export function LocalToc({ items }: { items: { id: string; label: string }[] }) {
  const jump = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  return (
    <nav className="local-toc" aria-label="On this page">
      <span className="toc-label">On this page</span>
      {items.map(item => (
        <button type="button" key={item.id} onClick={() => jump(item.id)}>
          {item.label}
        </button>
      ))}
    </nav>
  )
}

export function PageHero({
  title,
  deck,
  trail,
  action,
  children,
  className = '',
}: {
  title: string
  deck: string
  trail: string
  action?: { label: string; path?: string; scrollTo?: string }
  children?: ReactNode
  className?: string
}) {
  const [path, navigate] = useHashPath()
  const act = () => {
    if (action?.scrollTo)
      document.getElementById(action.scrollTo)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    else if (action?.path) navigate(action.path)
  }
  return (
    <header className={`page-hero ${className}`.trim()}>
      <HeroTrail path={path} fallback={trail.split('/').pop()?.trim()} />
      <h1>{title}</h1>
      <p className="hero-deck">{deck}</p>
      {action && (
        <button className="button button-mint" onClick={act}>
          {action.label}
          <Icon name="arrow" />
        </button>
      )}
      {children}
    </header>
  )
}

/** Where this page sits in the book. Every level above the current page is a link; the arrow goes up one level. */
export function HeroTrail({ path, fallback }: { path: string; fallback?: string }) {
  const crumbs = crumbsFor(path, fallback)
  const up = crumbs[crumbs.length - 2]
  // On phones, levels between the book and the parent page fold behind a button (CSS applies the fold below 780px).
  const [unfolded, setUnfolded] = useState(false)
  useEffect(() => setUnfolded(false), [path])
  const foldable = crumbs.length > 3 && !unfolded
  const middle = (index: number) => foldable && index > 0 && index < crumbs.length - 2
  return (
    <nav className={`hero-trail${foldable ? ' is-folded' : ''}`} aria-label="Breadcrumb">
      {up?.href && (
        <a className="hero-up" href={up.href} aria-label={`Up one level to ${up.label}`} title={`Up to ${up.label}`}>
          <Icon name="up" size={16} />
        </a>
      )}
      <ol>
        {crumbs.map((crumb, index) => (
          <Fragment key={`${index}-${crumb.label}`}>
            {foldable && index === 1 && (
              <li key="more" className="hero-more">
                <span className="hero-sep" aria-hidden="true">
                  /
                </span>
                <button
                  type="button"
                  onClick={() => setUnfolded(true)}
                  aria-label={`Show ${crumbs.length - 3} more ${crumbs.length - 3 === 1 ? 'level' : 'levels'} of the path`}
                >
                  …
                </button>
              </li>
            )}
            <li className={middle(index) ? 'hero-middle' : undefined}>
              {index > 0 && (
                <span className="hero-sep" aria-hidden="true">
                  /
                </span>
              )}
              {crumb.current || !crumb.href ? (
                <span aria-current={crumb.current ? 'page' : undefined}>{crumb.label}</span>
              ) : (
                <a href={crumb.href}>{crumb.label}</a>
              )}
            </li>
          </Fragment>
        ))}
      </ol>
    </nav>
  )
}

export function Section({
  id,
  title,
  children,
  label,
  className = '',
}: {
  id?: string
  title: string
  children: ReactNode
  label?: string
  className?: string
}) {
  return (
    <section id={id} className={`reading-section ${className}`}>
      {label && <span className="section-label">{label}</span>}
      <h2>{title}</h2>
      {children}
    </section>
  )
}

export function Callout({
  tone = 'note',
  title,
  children,
}: {
  tone?: 'note' | 'evidence' | 'caution' | 'stop'
  title: string
  children: ReactNode
}) {
  return (
    <aside className={`callout callout--${tone}`}>
      <span className="callout-tag">
        {tone === 'evidence' ? 'Evidence' : tone === 'caution' ? 'Caution' : tone === 'stop' ? 'Boundary' : 'Note'}
      </span>
      <h3>{title}</h3>
      <div>{children}</div>
    </aside>
  )
}

export function DataTable({
  caption,
  headers,
  rows,
}: {
  caption: string
  headers: string[]
  rows: (string | ReactNode)[][]
}) {
  const hintId = useId()
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const scroller = scrollRef.current
    const heading = scroller?.querySelector('thead')
    if (!scroller || !heading) return
    // Keep keyboard-focused links below the frozen header, including after
    // viewport changes, wrapped labels, zoom, or font loading.
    const measure = () =>
      scroller.style.setProperty('--table-header-height', `${heading.getBoundingClientRect().height}px`)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(heading)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="data-table">
      <p className="table-scroll-hint" id={hintId}>
        Scroll when needed to compare rows and columns. Column headers stay visible.
      </p>
      <div
        ref={scrollRef}
        className="table-wrap"
        tabIndex={0}
        role="region"
        aria-label={caption}
        aria-describedby={hintId}
      >
        <table>
          <caption>{caption}</caption>
          <thead>
            <tr>
              {headers.map(header => (
                <th scope="col" key={header}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index}>
                {row.map((cell, cellIndex) =>
                  cellIndex === 0 ? (
                    <th scope="row" key={cellIndex}>
                      {cell}
                    </th>
                  ) : (
                    <td key={cellIndex}>{cell}</td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export const bookUi = { PageHero, LocalToc, Section, Callout, DataTable }

export const formatDay = (date: string) =>
  new Date(`${date}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })
