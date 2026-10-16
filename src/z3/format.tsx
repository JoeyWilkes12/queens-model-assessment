import { useId, type ReactNode } from 'react'
import { cellOf, describeSources, z3VersionShort } from './data'

/** q_rc rendered with a subscript; screen readers hear "not r2c7" style text. */
export function Lit({ lit, n = 7, name }: { lit: number; n?: number; name?: string }) {
  if (name) {
    const negative = lit < 0
    const [base, sub] = name.match(/^([a-z]+)(\d*)$/i)?.slice(1) ?? [name, '']
    return <span className="z3-lit"><span aria-hidden="true">{negative ? '¬' : ''}{base}{sub && <sub>{sub}</sub>}</span><span className="sr-only">{negative ? 'not ' : ''}{name}</span></span>
  }
  const [r, c] = cellOf(lit, n)
  return <span className="z3-lit"><span aria-hidden="true">{lit < 0 ? '¬' : ''}q<sub>{r}{c}</sub></span><span className="sr-only">{lit < 0 ? 'not ' : ''}q{r}{c}</span></span>
}

/** A clause as a disjunction; the empty clause is □. */
export function Clause({ lits, n = 7, struck, names, parens = true }: { lits: number[]; n?: number; struck?: number; names?: (lit: number) => string | undefined; parens?: boolean }) {
  if (!lits.length) return <span className="z3-clause z3-clause--empty"><span aria-hidden="true">□</span><span className="sr-only">the empty clause</span></span>
  return <span className="z3-clause">
    {parens && lits.length > 1 && <span aria-hidden="true">(</span>}
    {lits.map((lit, index) => <span key={`${lit}-${index}`} className={`z3-clause-lit${struck !== undefined && Math.abs(lit) === struck ? ' is-struck' : ''}`}>
      {index > 0 && <span className="z3-or" aria-hidden="true"> ∨ </span>}
      {index > 0 && <span className="sr-only"> or </span>}
      <Lit lit={lit} n={n} name={names?.(lit)} />
    </span>)}
    {parens && lits.length > 1 && <span aria-hidden="true">)</span>}
  </span>
}

export function ClauseRef({ id, lits, sources, n = 7 }: { id: number; lits: number[]; sources?: string[]; n?: number }) {
  return <span className="z3-clause-ref"><span className="z3-clause-id">#{id}</span> <Clause lits={lits} n={n} />{sources && <span className="z3-clause-source"> · {describeSources(sources)}</span>}</span>
}

/** First-use definition of a glossary term. */
export function Term({ id, children }: { id: string; children: ReactNode }) {
  return <dfn className="z3-term" id={`z3-term-${id}`}>{children}</dfn>
}

/** Display mathematics with a spoken text equivalent. */
export function Formula({ spoken, children, block = true }: { spoken: string; children: ReactNode; block?: boolean }) {
  const Tag = block ? 'div' : 'span'
  return <Tag className={block ? 'z3-math' : 'z3-math-inline'} role="math" aria-label={spoken}><span aria-hidden="true">{children}</span></Tag>
}

export function Statement({ kind, label, children }: { kind: 'Definition' | 'Theorem' | 'Lemma' | 'Proposition' | 'Rule' | 'Example'; label?: string; children: ReactNode }) {
  return <div className={`z3-statement z3-statement--${kind.toLowerCase()}`}><span className="z3-statement-kind">{kind}{label ? ` ${label}` : ''}</span><div>{children}</div></div>
}

export function Proof({ children }: { children: ReactNode }) {
  return <div className="z3-proof"><em>Proof.</em> {children} <span className="z3-qed" aria-label="end of proof">□</span></div>
}

export function CheckYourself({ question, children }: { question: ReactNode; children: ReactNode }) {
  return <div className="z3-check">
    <span className="z3-check-label">Check yourself</span>
    <p className="z3-check-question">{question}</p>
    <details className="z3-disclosure"><summary>Reveal the answer</summary><div className="z3-check-answer">{children}</div></details>
  </div>
}

type Source = { authors: string; title: string; venue: string; url: string; doi?: string; note?: string }

/** Verified paper map from the design specification (checked 14 Oct 2026). */
export const SOURCES: Record<string, Source> = {
  P1: { authors: 'Leonardo de Moura and Nikolaj Bjørner', title: 'Z3: An Efficient SMT Solver', venue: 'TACAS 2008, LNCS 4963, 337–340', url: 'https://www.microsoft.com/en-us/research/?p=825739', doi: '10.1007/978-3-540-78800-3_24' },
  P2: { authors: 'Nikolaj Bjørner, Leonardo de Moura, Lev Nachmanson and Christoph M. Wintersteiger', title: 'Programming Z3', venue: 'Engineering Trustworthy Software Systems, LNCS 11430, 148–201, 2019', url: 'https://z3prover.github.io/papers/programmingz3.html', doi: '10.1007/978-3-030-17601-3_4' },
  P3: { authors: 'Carsten Sinz', title: 'Towards an Optimal CNF Encoding of Boolean Cardinality Constraints', venue: 'CP 2005, LNCS 3709, 827–831', url: 'https://www.carstensinz.de/papers/CP-2005.pdf', doi: '10.1007/11564751_73' },
  P4: { authors: 'Will Klieber and Gihwon Kwon', title: 'Efficient CNF Encoding for Selecting 1 from N Objects', venue: 'International Workshop on Constraints in Formal Verification, 2007', url: 'https://www.cs.cmu.edu/~wklieber/papers/2007_efficient-cnf-encoding-for-selecting-1.pdf' },
  P5: { authors: 'G. S. Tseitin', title: 'On the Complexity of Derivation in Propositional Calculus', venue: 'Zapiski Nauchnykh Seminarov LOMI 8, 234–259, 1968; English reprint', url: 'https://yurichev.com/mirrors/SAT/Tseitin/Tseitin1968_en.pdf', note: 'Original publication record: https://www.mathnet.ru/eng/znsl2268' },
  P6: { authors: 'Matthew W. Moskewicz, Conor F. Madigan, Ying Zhao, Lintao Zhang and Sharad Malik', title: 'Chaff: Engineering an Efficient SAT Solver', venue: 'DAC 2001, 530–535', url: 'https://www.princeton.edu/~chaff/publication/DAC2001v56.pdf' },
  P7: { authors: 'Robert Nieuwenhuis, Albert Oliveras and Cesare Tinelli', title: 'Solving SAT and SAT Modulo Theories: From an Abstract Davis–Putnam–Logemann–Loveland Procedure to DPLL(T)', venue: 'Journal of the ACM 53(6), 937–977, 2006', url: 'https://homepage.divms.uiowa.edu/~tinelli/papers/NieOT-JACM-06.pdf', doi: '10.1145/1217856.1217859' },
  P8: { authors: 'João Marques-Silva, Inês Lynce and Sharad Malik', title: 'Conflict-Driven Clause Learning SAT Solvers', venue: 'Handbook of Satisfiability, IOS Press, 2009, chapter 4, 131–153', url: 'https://www3.cs.stonybrook.edu/~cram/cse505/Fall20/Resources/cdcl.pdf', doi: '10.3233/978-1-58603-929-5-131' },
  P9: { authors: 'Niklas Eén and Niklas Sörensson', title: 'An Extensible SAT-solver', venue: 'SAT 2003 (published 2004), LNCS 2919, 502–518', url: 'https://link.springer.com/chapter/10.1007/978-3-540-24605-3_37', doi: '10.1007/978-3-540-24605-3_37' },
  P10: { authors: 'João P. Marques-Silva and Karem A. Sakallah', title: 'GRASP: A Search Algorithm for Propositional Satisfiability', venue: 'IEEE Transactions on Computers 48(5), 506–521, 1999', url: 'https://web.stanford.edu/class/cs357/SS99.pdf', doi: '10.1109/12.769433' },
  P11: { authors: 'P. Hall', title: 'On Representatives of Subsets', venue: 'Journal of the London Mathematical Society s1-10(1), 26–30, 1935', url: 'https://londmathsoc.onlinelibrary.wiley.com/doi/abs/10.1112/jlms/s1-10.37.26', doi: '10.1112/jlms/s1-10.37.26' },
  P12: { authors: 'Donald E. Knuth', title: 'The Art of Computer Programming, Volume 4, Fascicle 6: Satisfiability', venue: 'Addison-Wesley, 2015', url: 'https://www-cs-faculty.stanford.edu/~knuth/taocp.html' },
  P13: { authors: 'Nathan Wetzler, Marijn J. H. Heule and Warren A. Hunt Jr.', title: 'DRAT-trim: Efficient Checking and Trimming Using Expressive Clausal Proofs', venue: 'SAT 2014, LNCS 8561, 422–429', url: 'https://www.cs.cmu.edu/~mheule/publications/drat-trim.pdf' },
  P14: { authors: 'Nikolaj Bjørner, Clemens Eisenhofer, Arie Gurfinkel, Nuno P. Lopes, Leonardo de Moura, Lev Nachmanson and Christoph M. Wintersteiger', title: 'Z3 Internals (Draft)', venue: 'evolving author draft, accessed 14 October 2026', url: 'https://z3prover.github.io/papers/z3internals.html' },
  P15: { authors: 'Ian P. Gent, Christopher Jefferson and Peter Nightingale', title: 'Complexity of n-Queens Completion', venue: 'Journal of Artificial Intelligence Research 59, 815–848, 2017', url: 'https://eprints.whiterose.ac.uk/id/eprint/141513/1/n_queens_jair.pdf', doi: '10.1613/jair.5512' },
  P16: { authors: 'Niklas Eén and Niklas Sörensson', title: 'Translating Pseudo-Boolean Constraints into SAT', venue: 'Journal on Satisfiability, Boolean Modeling and Computation 2, 2006', url: 'https://journals.sagepub.com/doi/10.3233/SAT190014', doi: '10.3233/SAT190014' },
}

export function ReadSource({ items }: { items: { id: keyof typeof SOURCES | string; locator: string; why: string }[] }) {
  return <aside className="z3-sources" aria-label="Read the source">
    <span className="z3-sources-label">Read the source</span>
    <ol>{items.map(item => {
      const source = SOURCES[item.id]
      return <li key={`${item.id}-${item.locator}`}>
        <span className="z3-source-id">{item.id}</span>
        <div>
          <a href={source.url} target="_blank" rel="noreferrer">{source.title}</a>
          <span className="z3-source-meta">{source.authors}. {source.venue}.{source.doi ? <> DOI <code>{source.doi}</code>.</> : null}</span>
          <span className="z3-source-locator"><strong>{item.locator}</strong> — {item.why}</span>
        </div>
      </li>
    })}</ol>
  </aside>
}

export function EngineTag({ kind, version, configuration, note }: { kind: 'reference' | 'z3' | 'new-run' | 'illustration'; version?: string; configuration?: string; note?: string }) {
  const text = kind === 'reference' ? 'Reference CDCL execution · pairwise encoding'
    : kind === 'z3' ? `Recorded Z3 execution · Z3 ${z3VersionShort(version || '')} · ${configuration}`
      : kind === 'new-run' ? 'New run in this browser · reference CDCL kernel · pairwise encoding · not recorded, not Z3'
        : 'Illustration · not part of any recorded run'
  return <p className={`z3-engine-tag z3-engine-tag--${kind}`}><span className="z3-engine-mark" aria-hidden="true">{kind === 'z3' ? 'Z3' : kind === 'reference' ? 'REF' : kind === 'new-run' ? 'NEW' : 'ILL'}</span><span>{text}{note ? <> · {note}</> : null}</span></p>
}

export function Figure({ label, title, tag, children, className = '', id }: { label: string; title: string; tag?: ReactNode; children: ReactNode; className?: string; id?: string }) {
  const headingId = useId()
  return <section className={`z3-figure ${className}`} aria-labelledby={headingId} id={id}>
    <header className="z3-figure-head">
      <span className="z3-figure-label">{label}</span>
      <h3 id={headingId}>{title}</h3>
      {tag}
    </header>
    {children}
  </section>
}

export function Unavailable({ what }: { what: string }) {
  return <p className="z3-unavailable" role="status">{what} is unavailable because the recorded evidence did not load. No substitute data is generated.</p>
}

export function Lede({ children }: { children: ReactNode }) {
  return <p className="lead z3-lede">{children}</p>
}
