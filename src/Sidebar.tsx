import { useEffect, useState, type ReactNode } from 'react'
import { BOOK_PAGES, BOOK_PARTS, entryFor, expandedFor, type NavPage } from './bookNav'
import { Icon, formatDay } from './bookUi'
import { CHANGELOG } from './changelog'
import { preloadRoute } from './chapters'

/** The book rail: parts and parent pages are disclosures, closed by default except along the path to the open page. */
export function Sidebar({ path, open, onClose }: { path: string; open: boolean; onClose: () => void }) {
  const [expanded, setExpanded] = useState(() => new Set(expandedFor(path)))
  useEffect(() => { setExpanded(current => { const next = new Set(current); expandedFor(path).forEach(key => next.add(key)); return next.size === current.size ? current : next }) }, [path])
  const toggle = (key: string) => setExpanded(current => { const next = new Set(current); if (next.has(key)) next.delete(key); else next.add(key); return next })
  const here = entryFor(path)
  const ancestors = new Set(here?.ancestors.map(page => page.path))
  const latest = CHANGELOG[0]
  const page = (item: NavPage, depth: number): ReactNode => {
    const isOpen = expanded.has(item.path)
    const active = here?.page === item
    const listId = `nav-${item.path.replace(/[^a-z0-9]+/gi, '-')}`
    return <li key={item.path}>
      <div className={`nav-row nav-row--depth-${Math.min(depth, 2)}${active ? ' active' : ''}${ancestors.has(item.path) ? ' is-ancestor' : ''}`}>
        <a href={`#/${item.path}`} onClick={onClose} onPointerEnter={() => preloadRoute(item.path)} onFocus={() => preloadRoute(item.path)} onTouchStart={() => preloadRoute(item.path)} aria-current={active ? 'page' : undefined}><span>{item.title}</span>{active && <span className="nav-dot" aria-hidden="true" />}</a>
        {item.children && <button type="button" className="nav-twisty" aria-expanded={isOpen} aria-controls={listId} aria-label={`${isOpen ? 'Hide' : 'Show'} ${item.children.length} ${item.children.every(child => child.anchor) ? 'sections' : 'pages'} in ${item.title}`} onClick={() => toggle(item.path)}><Icon name="chevron" size={16} /></button>}
      </div>
      {item.children && <ul id={listId} hidden={!isOpen}>{item.children.map(child => page(child, depth + 1))}</ul>}
    </li>
  }
  return <><div className={`sidebar-scrim ${open ? 'is-open' : ''}`} onClick={onClose} aria-hidden="true" /><aside className={`book-sidebar ${open ? 'is-open' : ''}`} aria-label="Book navigation" role={open ? 'dialog' : undefined} aria-modal={open || undefined}><div className="bookmark"><div className="bookmark-icon"><Icon name="book" size={21} /></div><div><strong>Queens</strong><span>assessment book</span></div><button className="sidebar-close" onClick={onClose} aria-label="Close navigation"><Icon name="close" /></button></div><a className="edition-chip" href="#/changelog" onClick={onClose}><span>EXPANDED EDITION</span><strong>{formatDay(latest.date).toUpperCase()} UPDATE</strong></a>
    <nav className="chapter-nav" aria-label="Book contents">{BOOK_PARTS.map(part => {
      const key = `part:${part.id}`
      const isOpen = expanded.has(key)
      const holdsActive = here?.part === part
      return <div className={`chapter-group${holdsActive ? ' holds-active' : ''}`} key={part.id}>
        <button type="button" className="nav-part" aria-expanded={isOpen} aria-controls={`nav-part-${part.id}`} onClick={() => toggle(key)}>
          <span className="nav-part-text">{part.label && <span className="nav-part-label">{part.label}</span>}<span className="nav-part-title">{part.title}</span></span>
          <Icon name="chevron" size={16} />
        </button>
        <ul id={`nav-part-${part.id}`} className="nav-pages" hidden={!isOpen}>{part.pages.map(item => page(item, 0))}</ul>
      </div>
    })}</nav>
    <div className="sidebar-footer"><a href="#/changelog" onClick={onClose}>Changelog · updated {formatDay(latest.date)}</a><span>{BOOK_PAGES.length} pages · {BOOK_PARTS.length} sections · 5 figures</span></div></aside></>
}
