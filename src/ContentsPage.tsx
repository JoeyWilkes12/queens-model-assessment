import { useEffect, type ReactNode } from 'react'
import { BOOK_PARTS, type NavPage } from './bookNav'
import { LocalToc, PageHero } from './bookUi'
import { preloadRoute } from './chapters'

export function ContentsPage({ partId }: { partId?: string }) {
  useEffect(() => {
    if (!partId) return
    const frame = window.requestAnimationFrame(() =>
      document.getElementById(`part-${partId}`)?.scrollIntoView({ block: 'start' }),
    )
    return () => window.cancelAnimationFrame(frame)
  }, [partId])
  const list = (items: NavPage[]): ReactNode => (
    <ul className="contents-list">
      {items.map(item => (
        <li key={item.path}>
          <a
            href={`#/${item.path}`}
            onPointerEnter={() => preloadRoute(item.path)}
            onFocus={() => preloadRoute(item.path)}
          >
            {item.title}
          </a>
          <span>{item.description}</span>
          {item.children &&
            (item.children.every(child => child.anchor) ? (
              <p className="contents-sections">
                {item.children.map((child, index) => (
                  <span key={child.path}>
                    {index > 0 && ' · '}
                    <a href={`#/${child.path}`}>{child.title}</a>
                  </span>
                ))}
              </p>
            ) : (
              list(item.children)
            ))}
        </li>
      ))}
    </ul>
  )
  return (
    <>
      <PageHero
        trail="Contents"
        title="Contents"
        deck="Every part of the book on one page. Start with the summary, read a part end to end, or jump straight to the receipts."
      />
      <div className="reading-layout">
        <LocalToc
          items={BOOK_PARTS.map(part => ({
            id: `part-${part.id}`,
            label: part.label ? `${part.label} · ${part.title}` : part.title,
          }))}
        />
        <main className="reading-column contents-page" id="main-content">
          {BOOK_PARTS.map(part => (
            <section key={part.id} id={`part-${part.id}`} className="reading-section contents-part">
              {part.label && <span className="section-label">{part.label}</span>}
              <h2>{part.title}</h2>
              <p>{part.description}</p>
              {list(part.pages)}
            </section>
          ))}
        </main>
      </div>
    </>
  )
}
