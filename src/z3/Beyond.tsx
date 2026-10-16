import { Lede, ReadSource } from './format'
import type { ChapterProps } from './ui'

const x = (sub: string) => <>x<sub>{sub}</sub></>

/** Closing appendix: the Queens pattern in three other models (adapted from the Constraint Atlas transfer section). */
export function Beyond({ ui }: ChapterProps) {
  const { Section, DataTable } = ui
  return <Section id="z3-beyond" label="Appendix" title="Beyond Queens">
    <Lede>Queens uses three ingredients that recur in scheduling and assignment: Boolean decision variables, exactly-one groups, and pairwise conflicts. Only the names change.</Lede>
    <p>In each model below a variable x says that one choice is made, as q<sub>rc</sub> says that cell rc holds a queen. Each Queens rule has a counterpart, and each becomes the clauses of Chapter 2: an exactly-one group is one at-least-one clause plus its at-most-one pairs, and a conflict is one binary clause (¬x ∨ ¬y). Where a group may stay empty, “exactly one” relaxes to “at most one”: the pairs stay and the at-least-one clause goes.</p>
    <DataTable caption="Each Queens rule and its counterpart in three models" headers={['Queens', 'Staff rostering', 'Exam timetabling', 'Seating plan']} rows={[
      [<>Variable q<sub>rc</sub>: a queen in row r, column c</>, <>{x('p,d,s')}: person p works shift s on day d</>, <>{x('e,t')}: exam e is held in time slot t</>, <>{x('g,s')}: guest g takes seat s</>],
      ['One per row', 'Each person has exactly one shift per day, counting “off” as a shift', 'Each exam is held in exactly one slot', 'Each guest has exactly one seat'],
      ['One per column', 'Each shift on each day has exactly one person (exactly k for a larger team)', <>No student sits two exams in one slot: {x('e,t')} and {x('e′,t')} exclude each other when e and e′ share a student</>, 'Each seat holds at most one guest (exactly one if every seat is filled)'],
      ['One per region: an irregular group of cells', 'Each person works exactly one weekend shift: one group per person over their Saturday and Sunday cells', 'Each cohort sits at most one exam per day: one group per cohort and day', 'Each table has exactly one host: one group per table over the hosts’ cells at its seats'],
      ['No touching: a conflict between neighbouring cells', <>No early shift straight after a night shift: ¬{x('p,d,night')} ∨ ¬{x('p,d+1,early')}</>, <>No cohort has exams in consecutive slots: ¬{x('e,t')} ∨ ¬{x('e′,t+1')} for exams of one cohort</>, <>Two guests kept apart: ¬{x('g,s')} ∨ ¬{x('g′,s′')} for adjacent seats s, s′</>],
      ['What Queens lacks', 'Coverage of k people; fairness as an objective', 'Hall capacities as weighted sums', 'Seating preferences as an objective'],
    ]} />
    <p>Three differences matter once the names change. Coverage often asks for exactly k rather than exactly one; the sequential counter of Chapter 2 extends to at most k. Capacities are weighted sums such as Σ<sub>e</sub> size<sub>e</sub> · {x('e,t')} ≤ seats, which are pseudo-Boolean constraints. And real rosters and seating plans carry preferences, so the question becomes optimization rather than satisfiability; Z3’s Optimize interface accepts maximize, minimize and soft constraints for that. None of this says how fast any such model solves: as Chapter 9 showed for Queens, that depends on the instance, the encoding and the solver configuration.</p>
    <ReadSource items={[
      { id: 'P19', locator: 'Maximize and Minimize; soft constraints', why: 'objectives and preferences in Z3, for the rows of the table marked “objective”.' },
      { id: 'P3', locator: '§2', why: 'the sequential counter for at most k of n variables, as needed for coverage rules.' },
      { id: 'P16', locator: 'whole paper', why: 'translating weighted sums such as hall capacities into clauses.' },
    ]} />
  </Section>
}
