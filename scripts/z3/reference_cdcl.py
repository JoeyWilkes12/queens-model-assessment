"""Reference CDCL kernel for the "How Z3 solves Queens" book part.

This is a deliberately small teaching kernel. It is NOT Z3 and it does not
reproduce Z3's internal search. It is a port of the design prototype in
.empower/2026-10-14-z3-teaching-design/REFERENCE_CDCL.md:

* full clause scans in clause-id order (no watched literals),
* propagation to a fixed point before every decision,
* decisions: preferred variables first (if any), otherwise the lowest-numbered
  unassigned variable, always assigned true,
* first-UIP conflict analysis by resolution in reverse trail order,
* asserting backjumps, no restarts, no activity heuristic, no clause deletion.

Variables: cell (row, column), 1-based, has id (row - 1) * n + column.
Literals are signed integers. Clause ids are zero-based positions in the
clause database. Standard library only.
"""

from __future__ import annotations

from itertools import combinations

KERNEL_VERSION = "reference-cdcl-full-scan-v1"


def cell_var(row: int, column: int, n: int) -> int:
    return (row - 1) * n + column


def var_cell(var: int, n: int) -> tuple[int, int]:
    return ((var - 1) // n + 1, (var - 1) % n + 1)


def lit_key(lit: int) -> tuple[int, bool]:
    return (abs(lit), lit < 0)


class ClauseDB:
    """Deduplicating clause store that keeps every source reference."""

    def __init__(self) -> None:
        self.clauses: list[list[int]] = []
        self.sources: list[list[str]] = []
        self.index: dict[tuple[int, ...], int] = {}

    def add(self, lits, source: str) -> tuple[int, bool]:
        clause = sorted(set(lits), key=lit_key)
        key = tuple(clause)
        if key in self.index:
            cid = self.index[key]
            self.sources[cid].append(source)
            return cid, False
        cid = len(self.clauses)
        self.index[key] = cid
        self.clauses.append(clause)
        self.sources.append([source])
        return cid, True

    def copy(self) -> "ClauseDB":
        other = ClauseDB()
        other.clauses = [list(c) for c in self.clauses]
        other.sources = [list(s) for s in self.sources]
        other.index = dict(self.index)
        return other


def constraint_groups(regions: list[list[str]]):
    """Rows, then columns, then regions in label order; cells are 1-based."""
    n = len(regions)
    groups = [(f"row:{r}", [(r, c) for c in range(1, n + 1)]) for r in range(1, n + 1)]
    groups += [(f"column:{c}", [(r, c) for r in range(1, n + 1)]) for c in range(1, n + 1)]
    labels = sorted({label for row in regions for label in row})
    groups += [(f"region:{k}", [(r, c) for r in range(1, n + 1) for c in range(1, n + 1)
                                if regions[r - 1][c - 1] == k]) for k in labels]
    return groups


def pairwise_cnf(regions: list[list[str]]):
    """Pairwise exactly-one per row/column/region plus diagonal touching pairs.

    Orthogonal touching pairs are already excluded by the row and column
    at-most-one clauses, so only the two diagonal neighbours in the next row
    are generated. Returns (db, generated) where generated lists every clause
    in generation order with its family, before deduplication.
    """
    n = len(regions)
    v = lambda cell: cell_var(cell[0], cell[1], n)
    db = ClauseDB()
    generated: list[dict] = []
    for name, cells in constraint_groups(regions):
        lits = [v(cell) for cell in cells]
        cid, new = db.add(lits, f"{name}:ALO")
        generated.append({"source": f"{name}:ALO", "clauseId": cid, "new": new})
        for a, b in combinations(lits, 2):
            cid, new = db.add([-a, -b], f"{name}:AMO")
            generated.append({"source": f"{name}:AMO", "clauseId": cid, "new": new})
    for r in range(1, n):
        for c in range(1, n + 1):
            for dc in (-1, 1):
                if 1 <= c + dc <= n:
                    source = f"touching:r{r}c{c}-r{r + 1}c{c + dc}"
                    cid, new = db.add([-v((r, c)), -v((r + 1, c + dc))], source)
                    generated.append({"source": source, "clauseId": cid, "new": new})
    return db, generated


def run_cdcl(db: ClauseDB, num_vars: int, preferences=(), initial_level0=()):
    """Run the kernel on db (mutated: learned clauses are appended).

    Returns (events, learned, model). Events record the decision level after
    the event is applied. model is a dict var -> bool for SAT, else None.
    """
    clauses = db.clauses
    val: dict[int, bool] = {}
    level: dict[int, int] = {}
    reason: dict[int, int | None] = {}
    trail: list[int] = []
    events: list[dict] = []
    learned: list[dict] = []
    dl = 0
    preferences = [p for p in preferences if 1 <= p <= num_vars]

    def emit(kind: str, **kw) -> None:
        events.append({"kind": kind, "level": dl, **kw})

    def enqueue(lit: int, why: int | None) -> None:
        var = abs(lit)
        assert var not in val
        val[var] = lit > 0
        level[var] = dl
        reason[var] = why
        trail.append(lit)
        if why is None:
            emit("decide", literal=lit)
        else:
            emit("propagate", literal=lit, reasonClauseId=why)

    def value(lit: int):
        var = abs(lit)
        if var not in val:
            return None
        return val[var] == (lit > 0)

    def propagate():
        while True:
            changed = False
            for cid, clause in enumerate(clauses):
                if any(value(l) is True for l in clause):
                    continue
                unassigned = [l for l in clause if value(l) is None]
                if not unassigned:
                    return cid
                if len(unassigned) == 1:
                    enqueue(unassigned[0], cid)
                    changed = True
            if not changed:
                return None

    for lit in initial_level0:
        enqueue(lit, None)

    while True:
        conflict = propagate()
        if conflict is not None:
            emit("conflict", conflictClauseId=conflict)
            acc = set(clauses[conflict])
            steps = []
            while sum(level[abs(l)] == dl for l in acc) > (1 if dl else 0):
                lit = next(l for l in reversed(trail) if -l in acc and level[abs(l)] == dl)
                rid = reason[abs(lit)]
                assert rid is not None, "resolution reached a decision"
                acc = (acc - {-lit}) | (set(clauses[rid]) - {lit})
                assert not any(-x in acc for x in acc), "tautological resolvent"
                steps.append({"parentClauseId": rid, "pivot": abs(lit),
                              "result": sorted(acc, key=lit_key)})
            cid, new = db.add(acc, "learned")
            assert new, "learned clause already present"
            learned.append({"id": cid, "from": conflict, "steps": steps})
            emit("learn", conflictClauseId=conflict, learnedClauseId=cid, resolution=steps)
            if dl == 0:
                assert not acc
                emit("unsat")
                return events, learned, None
            current = next(l for l in acc if level[abs(l)] == dl)
            back = max([level[abs(l)] for l in acc if l != current], default=0)
            removed = [l for l in trail if level[abs(l)] > back]
            for lit in removed:
                var = abs(lit)
                del val[var], level[var], reason[var]
            trail[:] = [l for l in trail if abs(l) in val]
            dl = back
            emit("backjump", targetLevel=back, removed=removed)
        else:
            if len(val) == num_vars:
                emit("sat")
                return events, learned, dict(val)
            dl += 1
            choice = next((p for p in preferences if p not in val), None)
            if choice is None:
                choice = next(i for i in range(1, num_vars + 1) if i not in val)
            enqueue(choice, None)


def unit_propagate(db: ClauseDB, assumptions):
    """Unit propagation from explicit assumption literals at level 1.

    Returns (events, status) where status is 'fixed-point' or 'conflict'.
    Same full-scan order as the kernel; no decisions are made.
    """
    clauses = db.clauses
    val: dict[int, bool] = {}
    events: list[dict] = []

    def value(lit: int):
        var = abs(lit)
        if var not in val:
            return None
        return val[var] == (lit > 0)

    for lit in assumptions:
        if value(lit) is False:
            raise ValueError("inconsistent assumptions")
        if value(lit) is None:
            val[abs(lit)] = lit > 0
            events.append({"kind": "assume", "literal": lit})
    while True:
        changed = False
        for cid, clause in enumerate(clauses):
            if any(value(l) is True for l in clause):
                continue
            unassigned = [l for l in clause if value(l) is None]
            if not unassigned:
                events.append({"kind": "conflict", "conflictClauseId": cid})
                return events, "conflict"
            if len(unassigned) == 1:
                lit = unassigned[0]
                val[abs(lit)] = lit > 0
                events.append({"kind": "propagate", "literal": lit, "reasonClauseId": cid})
                changed = True
        if not changed:
            return events, "fixed-point"
