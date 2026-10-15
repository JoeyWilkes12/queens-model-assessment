"""Generate and validate the data behind "How Z3 solves Queens".

Usage (Python 3.10+ with z3-solver 4.16 for the Z3 parts):

  python scripts/z3/build_teaching_data.py            # regenerate + validate
  python scripts/z3/build_teaching_data.py --verify   # validate committed JSON only

Outputs (public/evidence/z3/):
  reference-trace-existence.json  reference CDCL run on the pairwise CNF
  reference-trace-blocked.json    the same kernel after adding the blocking clause
  teaching-data.json              encodings, counts, propagation runs, Hall data,
                                  implication graphs
  z3-receipts.json                recorded Z3 4.16 checks for the 5x5/7x7/9x9 boards
  seven-pairwise.cnf              DIMACS text of the 513-clause pairwise CNF
  manifest.json                   SHA-256 of every artifact and generator file

Every validation failure raises; nothing is written unless all checks pass.
The reference kernel is not Z3. Z3 numbers come only from measure_z3.py runs.
"""

from __future__ import annotations

import argparse
import ast
import hashlib
import itertools
import json
import platform
import re
import subprocess
import sys
from datetime import datetime, timezone
from math import comb, factorial
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
sys.path.insert(0, str(HERE))

import reference_cdcl as kernel  # noqa: E402
from reference_cdcl import ClauseDB, cell_var, lit_key, pairwise_cnf, run_cdcl, unit_propagate, var_cell  # noqa: E402

BOARD_JSON = ROOT / "src" / "z3" / "board-seven.json"
APP_TSX = ROOT / "src" / "App.tsx"
OUT = ROOT / "public" / "evidence" / "z3"
CAPTION_REFERENCE = "Reference CDCL execution · pairwise encoding"
CAPTION_Z3 = "Recorded Z3 execution"
TIMEOUT_MS = 30000
MODES = {
    "default": {
        "configuration": "Solver() · default parameters · timeout 30 s",
        "syntax": "Sum(If(q, 1, 0)) == 1 for every row, column and region; Implies(q_u, Not(q_v)) for each directed touching pair",
        "production": True,
    },
    "fd": {
        "configuration": "SolverFor('QF_FD') · timeout 30 s",
        "syntax": "Same Sum(If) syntax as production, finite-domain solver",
        "production": False,
    },
    "pb": {
        "configuration": "SolverFor('QF_FD') · PbEq syntax · timeout 30 s",
        "syntax": "PbEq([(q, 1), ...], 1) for every row, column and region; same touching implications",
        "production": False,
    },
}


class ValidationError(AssertionError):
    pass


def check(condition, message: str) -> None:
    if not condition:
        raise ValidationError(message)


CHECKS: list[str] = []


def passed(label: str) -> None:
    CHECKS.append(label)
    print(f"PASS {label}")


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def sha256_file(path: Path) -> str:
    return sha256_bytes(path.read_bytes())


def partition_sha(regions) -> str:
    return sha256_bytes(json.dumps(regions).encode())


def _compact(value) -> str:
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"))


def _layout(value, depth: int) -> str:
    text = _compact(value)
    scalars = isinstance(value, list) and all(not isinstance(v, (dict, list)) for v in value)
    if len(text) <= 110 or scalars or not isinstance(value, (dict, list)):
        return text
    pad, inner = " " * depth, " " * (depth + 1)
    if isinstance(value, dict):
        items = [f"{inner}{json.dumps(k, ensure_ascii=False)}:{_layout(v, depth + 1)}" for k, v in value.items()]
        return "{\n" + ",\n".join(items) + "\n" + pad + "}"
    items = [inner + _layout(v, depth + 1) for v in value]
    return "[\n" + ",\n".join(items) + "\n" + pad + "]"


def dumps(value) -> str:
    """Deterministic JSON: compact objects, one array item or key per line."""
    return _layout(value, 0) + "\n"


# ---------------------------------------------------------------- boards

def app_boards() -> dict:
    source = APP_TSX.read_text()
    boards = {}
    for name in ("five", "seven", "nine"):
        part = source.split(f"  {name}: {{", 1)[1].split("  },", 1)[0]
        regions = ast.literal_eval(re.search(r"regions: (\[.*?\n    \])", part, re.S)[1])
        solution = ast.literal_eval(re.search(r"solution: (\[[^\n]+\])", part)[1])
        boards[name] = {"regions": regions, "solution": solution}
    return boards


def legal_columns(regions, cols) -> bool:
    n = len(regions)
    return (len(cols) == n and sorted(cols) == list(range(1, n + 1))
            and len({regions[r][cols[r] - 1] for r in range(n)}) == n
            and all(abs(cols[r + 1] - cols[r]) > 1 for r in range(n - 1)))


def brute_force_solutions(regions):
    n = len(regions)
    found = []
    checked = 0
    for perm in itertools.permutations(range(1, n + 1)):
        checked += 1
        if all(abs(perm[r + 1] - perm[r]) > 1 for r in range(n - 1)) and \
                len({regions[r][perm[r] - 1] for r in range(n)}) == n:
            found.append(list(perm))
    return checked, found


def load_board():
    board = json.loads(BOARD_JSON.read_text())
    n = board["size"]
    regions = board["regions"]
    check(board["id"] == "seven" and board["coordinateBase"] == 1, "board-seven.json identity")
    check(len(regions) == n and all(len(r) == n for r in regions), "board-seven.json is square")
    check(len({k for row in regions for k in row}) == n, "board-seven.json has n regions")
    check(board["partitionSha256"] == partition_sha(regions), "board-seven.json partition hash")
    boards = app_boards()
    check(boards["seven"]["regions"] == regions, "board-seven.json matches boardConfigs.seven in src/App.tsx")
    passed("board-seven.json matches boardConfigs.seven regions and its partition hash")
    return board, boards


# ---------------------------------------------------------------- traces

def dimacs(clauses, num_vars: int) -> str:
    lines = [f"p cnf {num_vars} {len(clauses)}"]
    lines += [" ".join(str(l) for l in clause) + " 0" for clause in clauses]
    return "\n".join(lines) + "\n"


def schema_events(raw_events):
    events = []
    for seq, e in enumerate(raw_events):
        out = {"seq": seq, "kind": e["kind"], "level": e["level"]}
        for key in ("literal", "reasonClauseId", "conflictClauseId", "learnedClauseId",
                    "resolution", "targetLevel", "removed"):
            if key in e:
                out[key] = e[key]
        events.append(out)
    return events


def build_traces(board):
    n = board["size"]
    num_vars = n * n
    db, generated = pairwise_cnf(board["regions"])
    original_count = len(db.clauses)
    cnf_text = dimacs(db.clauses, num_vars)
    cnf_sha = sha256_bytes(cnf_text.encode())
    code_sha = sha256_file(HERE / "reference_cdcl.py")
    variables = [{"id": v, "cell": list(var_cell(v, n))} for v in range(1, num_vars + 1)]
    policy = {
        "decision": "lowest-numbered unassigned variable, assigned true",
        "propagation": "full clause scan in clause-id order, repeated to a fixed point before every decision",
        "analysis": "first UIP: resolve current-level reasons in reverse trail order",
        "backjump": "largest level among the other learned literals (0 if none)",
        "watchedLiterals": False, "activityHeuristic": False, "restarts": False, "clauseDeletion": False,
    }
    common = {
        "schemaVersion": 1, "caption": CAPTION_REFERENCE, "notZ3Trace": True,
        "boardId": board["id"], "partitionSha256": board["partitionSha256"],
        "engine": {"name": "reference-cdcl", "version": kernel.KERNEL_VERSION, "codeSha256": code_sha},
        "encoding": "pairwise", "cnfSha256": cnf_sha, "originalClauseCount": original_count,
        "policy": policy, "variables": variables,
    }

    existence_initial = list(range(original_count))
    raw_events, learned, model = run_cdcl(db, num_vars)
    check(model is not None, "existence run is SAT")
    existence_events = schema_events(raw_events)
    learn_seq = {e["learnedClauseId"]: e["seq"] for e in existence_events if e["kind"] == "learn"}
    sources_existence = []
    for cid, src in enumerate(db.sources):
        sources_existence.append([f"learned@existence:{learn_seq[cid]}"] if src == ["learned"] else list(src))
    model_lits = [v if model[v] else -v for v in range(1, num_vars + 1)]
    columns = [next(c for c in range(1, n + 1) if model[cell_var(r, c, n)]) for r in range(1, n + 1)]
    existence = {**common, "query": "existence",
                 "clauses": [{"id": i, "lits": c, "sources": s} for i, (c, s) in enumerate(zip(db.clauses, sources_existence))],
                 "initialClauseIds": existence_initial, "events": existence_events, "result": "sat",
                 "model": model_lits, "modelColumns": columns}

    blocked_db = db.copy()
    first_run_clause_count = len(blocked_db.clauses)
    blocker = [-v if model[v] else v for v in range(1, num_vars + 1)]
    blocker_id, new = blocked_db.add(blocker, "blocker")
    check(new, "blocker is a new clause")
    blocked_initial = list(range(len(blocked_db.clauses)))
    raw_blocked, learned_blocked, model_blocked = run_cdcl(blocked_db, num_vars)
    check(model_blocked is None, "blocked run is UNSAT")
    blocked_events = schema_events(raw_blocked)
    learn_seq_b = {e["learnedClauseId"]: e["seq"] for e in blocked_events if e["kind"] == "learn"}
    sources_blocked = []
    for cid, src in enumerate(blocked_db.sources):
        if cid < first_run_clause_count and src == ["learned"]:
            sources_blocked.append([f"learned@existence:{learn_seq[cid]}"])
        elif src == ["learned"]:
            sources_blocked.append([f"learned@blocked:{learn_seq_b[cid]}"])
        else:
            sources_blocked.append(list(src))
    blocked = {**common, "query": "blocked",
               "clauses": [{"id": i, "lits": c, "sources": s} for i, (c, s) in enumerate(zip(blocked_db.clauses, sources_blocked))],
               "initialClauseIds": blocked_initial, "events": blocked_events, "blockerId": blocker_id,
               "blockerForm": "full-cell: one literal per board cell, false exactly on the found model",
               "inheritedLemmaIds": [cid for cid in range(original_count, first_run_clause_count)],
               "result": "unsat"}
    return existence, blocked, db, generated, cnf_text


def validate_trace(trace, label: str):
    """Independent replay of a published trace. Does not call the kernel."""
    clauses = {c["id"]: c["lits"] for c in trace["clauses"]}
    check(sorted(clauses) == list(range(len(clauses))), f"{label}: clause ids are contiguous")
    for cid, lits in clauses.items():
        check(len(set(abs(l) for l in lits)) == len(lits), f"{label}: clause {cid} has no repeated variable")
    num_vars = len(trace["variables"])
    n = int(round(num_vars ** 0.5))
    for v in trace["variables"]:
        check(v["cell"] == list(var_cell(v["id"], n)), f"{label}: variable {v['id']} cell mapping")
    available = set(trace["initialClauseIds"])
    assign: dict[int, tuple[bool, int, int | None]] = {}
    trail: list[int] = []
    level = 0
    snapshots: dict[int, list[int]] = {}
    conflict_id = None
    last_learned = None
    expect = None
    learned_ids: list[int] = []
    events = trace["events"]

    def value(l):
        if abs(l) not in assign:
            return None
        return assign[abs(l)][0] == (l > 0)

    def at_fixed_point():
        for cid in available:
            lits = clauses[cid]
            if any(value(l) is True for l in lits):
                continue
            if sum(value(l) is None for l in lits) < 2:
                return False
        return True

    for i, e in enumerate(events):
        check(e["seq"] == i, f"{label}: event {i} seq")
        kind = e["kind"]
        if expect is not None:
            check(kind == "propagate" and e["literal"] == expect[0] and e["reasonClauseId"] == expect[1],
                  f"{label}: event {i} must assert the learned literal after the backjump")
            expect = None
        if kind == "decide":
            check(at_fixed_point(), f"{label}: event {i} decision only after propagation saturates")
            lit = e["literal"]
            check(abs(lit) not in assign and 1 <= abs(lit) <= num_vars, f"{label}: event {i} decides an unassigned variable")
            snapshots[level + 1] = list(trail)
            level += 1
            check(e["level"] == level, f"{label}: event {i} opens level {level}")
            assign[abs(lit)] = (lit > 0, level, None)
            trail.append(lit)
        elif kind == "propagate":
            cid = e["reasonClauseId"]
            lit = e["literal"]
            check(cid in available, f"{label}: event {i} reason clause {cid} exists")
            lits = clauses[cid]
            check(lit in lits and abs(lit) not in assign, f"{label}: event {i} implied literal is unassigned and in its reason")
            check(all(value(m) is False for m in lits if m != lit), f"{label}: event {i} reason clause {cid} is unit at enqueue")
            check(e["level"] == level, f"{label}: event {i} level")
            assign[abs(lit)] = (lit > 0, level, cid)
            trail.append(lit)
        elif kind == "conflict":
            cid = e["conflictClauseId"]
            check(cid in available and all(value(l) is False for l in clauses[cid]), f"{label}: event {i} conflict clause {cid} is false")
            check(e["level"] == level, f"{label}: event {i} conflict level")
            conflict_id = cid
        elif kind == "learn":
            check(events[i - 1]["kind"] == "conflict" and e["conflictClauseId"] == conflict_id, f"{label}: event {i} learns from the preceding conflict")
            acc = set(clauses[conflict_id])
            for k, step in enumerate(e["resolution"]):
                latest = next(l for l in reversed(trail) if -l in acc and assign[abs(l)][1] == level)
                check(abs(latest) == step["pivot"], f"{label}: event {i} step {k} pivots on the latest current-level literal")
                parent = step["parentClauseId"]
                check(assign[abs(latest)][2] == parent, f"{label}: event {i} step {k} parent is the pivot's recorded reason")
                check(latest in clauses[parent] and -latest in acc, f"{label}: event {i} step {k} pivot occurs with opposite signs")
                acc = (acc - {-latest}) | (set(clauses[parent]) - {latest})
                check(not any(-x in acc for x in acc), f"{label}: event {i} step {k} resolvent is not tautological")
                check(set(step["result"]) == acc and len(step["result"]) == len(acc), f"{label}: event {i} step {k} resolvent recomputed")
            lid = e["learnedClauseId"]
            check(lid not in available and set(clauses[lid]) == acc, f"{label}: event {i} learned clause {lid} equals the final resolvent")
            check(all(value(l) is False for l in acc), f"{label}: event {i} learned clause is false before backjump")
            current = [l for l in acc if assign[abs(l)][1] == level]
            check(len(current) == (1 if level else 0), f"{label}: event {i} learned clause has one current-level literal (first UIP)")
            available.add(lid)
            learned_ids.append(lid)
            last_learned = (lid, acc, current[0] if current else None)
        elif kind == "backjump":
            check(events[i - 1]["kind"] == "learn", f"{label}: event {i} follows a learn event")
            lid, acc, uip = last_learned
            target = max([assign[abs(l)][1] for l in acc if l != uip], default=0)
            check(e["targetLevel"] == target and e["level"] == target, f"{label}: event {i} backjumps to the asserting level {target}")
            removed = [l for l in trail if assign[abs(l)][1] > target]
            check(e["removed"] == removed, f"{label}: event {i} removed literals")
            for l in removed:
                del assign[abs(l)]
            trail = [l for l in trail if abs(l) in assign]
            check(trail == snapshots[target + 1], f"{label}: event {i} restores the trail as it was before level {target + 1}")
            level = target
            expect = (uip, lid)
        elif kind == "sat":
            check(i == len(events) - 1 and trace["result"] == "sat", f"{label}: sat is final")
            check(len(assign) == num_vars, f"{label}: sat assignment is total")
            check(all(any(value(l) is True for l in clauses[cid]) for cid in available), f"{label}: sat assignment satisfies every clause")
            check(sorted(trace["model"], key=abs) == sorted(trail, key=abs), f"{label}: recorded model equals the final trail")
        elif kind == "unsat":
            check(i == len(events) - 1 and trace["result"] == "unsat", f"{label}: unsat is final")
            check(events[i - 1]["kind"] == "learn" and clauses[events[i - 1]["learnedClauseId"]] == [] and level == 0,
                  f"{label}: unsat follows the empty clause learned at level 0")
        else:
            raise ValidationError(f"{label}: unknown event kind {kind}")
    check(events[-1]["kind"] in ("sat", "unsat"), f"{label}: trace ends in a verdict")
    return learned_ids


def validate_traces(existence, blocked, regions, unique_columns):
    learned_e = validate_trace(existence, "existence")
    passed(f"existence trace replayed: {len(existence['events'])} events; every reason unit at enqueue, every conflict false, every resolvent recomputed, every backjump restored")
    learned_b = validate_trace(blocked, "blocked")
    passed(f"blocked trace replayed: {len(blocked['events'])} events; ends with the empty clause at level 0")
    check(existence["modelColumns"] == unique_columns, "existence model equals the brute-force unique solution")
    check(legal_columns(regions, existence["modelColumns"]), "existence model satisfies row/column/region/touching rules")
    n = len(regions)
    blocker = next(c for c in blocked["clauses"] if c["id"] == blocked["blockerId"])
    check(blocker["sources"] == ["blocker"], "blocker provenance")
    check(sorted(abs(l) for l in blocker["lits"]) == list(range(1, n * n + 1)), "blocker uses exactly the original cell variables")
    check(all(-l in existence["model"] for l in blocker["lits"]), "blocker is false exactly on the found model")
    e_clauses = {c["id"]: c["lits"] for c in existence["clauses"]}
    for cid in blocked["inheritedLemmaIds"]:
        lits = next(c for c in blocked["clauses"] if c["id"] == cid)["lits"]
        check(e_clauses.get(cid) == lits, f"inherited lemma {cid} equals the existence-run learned clause")
    check(blocked["inheritedLemmaIds"] == learned_e, "blocked run inherits exactly the existence-run learned clauses")
    check(existence["cnfSha256"] == blocked["cnfSha256"] and existence["partitionSha256"] == blocked["partitionSha256"], "traces bind the same CNF and partition")
    passed("blocker uses only the 49 original cell variables and inherits only derived lemmas")
    return learned_e, learned_b


def z3_entailment(existence, blocked):
    import z3
    n_vars = len(existence["variables"])
    q = {v: z3.Bool(f"v{v}") for v in range(1, n_vars + 1)}
    lit = lambda l: q[l] if l > 0 else z3.Not(q[-l])
    clause = lambda lits: z3.Or([lit(l) for l in lits]) if lits else z3.BoolVal(False)
    original = [c["lits"] for c in existence["clauses"][:existence["originalClauseCount"]]]
    base = [clause(c) for c in original]
    count = 0
    for e in existence["events"]:
        if e["kind"] == "learn":
            L = existence["clauses"][e["learnedClauseId"]]["lits"]
            s = z3.Solver(); s.add(base); s.add(z3.Not(clause(L)))
            check(s.check() == z3.unsat, f"existence learned clause {e['learnedClauseId']} is entailed by F")
            count += 1
    blocker = blocked["clauses"][blocked["blockerId"]]["lits"]
    base_b = base + [clause(blocker)]
    for e in blocked["events"]:
        if e["kind"] == "learn":
            L = blocked["clauses"][e["learnedClauseId"]]["lits"]
            s = z3.Solver(); s.add(base_b)
            if L:
                s.add(z3.Not(clause(L)))
            check(s.check() == z3.unsat, f"blocked learned clause {e['learnedClauseId']} is entailed by F ∧ B")
            count += 1
    s = z3.Solver(); s.add(base)
    check(s.check() == z3.sat, "pairwise CNF is satisfiable")
    m = s.model()
    cols = [next(c for c in range(1, 8) if z3.is_true(m.eval(q[(r - 1) * 7 + c], model_completion=True))) for r in range(1, 8)]
    check(cols == existence["modelColumns"], "Z3 model of the pairwise CNF equals the reference model")
    passed(f"{count} learned clauses entailed (Z3 proves F ∧ ¬L UNSAT; blocked run against F ∧ B); empty clause confirms F ∧ B UNSAT")


# ---------------------------------------------------------------- encodings

def enc_pairwise(m):
    xs = list(range(1, m + 1))
    clauses = [{"lits": xs, "role": "ALO"}]
    clauses += [{"lits": [-a, -b], "role": "AMO pair"} for a, b in itertools.combinations(xs, 2)]
    return {"aux": [], "clauses": clauses}


def enc_sequential(m):
    if m == 1:
        return {"aux": [], "clauses": [{"lits": [1], "role": "ALO"}]}
    s = lambda i: m + i  # s_i, 1 <= i <= m-1
    aux = [{"id": s(i), "name": f"s{i}", "meaning": f"may be true once one of x1..x{i} is true; forced true if one is"} for i in range(1, m)]
    clauses = [{"lits": list(range(1, m + 1)), "role": "ALO"}]
    clauses.append({"lits": [-1, s(1)], "role": "x1 → s1"})
    for i in range(2, m):
        clauses.append({"lits": [-i, s(i)], "role": f"x{i} → s{i}"})
        clauses.append({"lits": [-s(i - 1), s(i)], "role": f"s{i - 1} → s{i}"})
        clauses.append({"lits": [-i, -s(i - 1)], "role": f"s{i - 1} → ¬x{i}"})
    clauses.append({"lits": [-m, -s(m - 1)], "role": f"s{m - 1} → ¬x{m}"})
    return {"aux": aux, "clauses": clauses}


def enc_commander(m):
    next_id = [m + 1]
    aux = []
    clauses = []

    def eo(vs, depth):
        if len(vs) <= 3:
            clauses.append({"lits": list(vs), "role": "ALO" if depth == 0 else f"ALO on commanders (level {depth})"})
            for a, b in itertools.combinations(vs, 2):
                clauses.append({"lits": [-a, -b], "role": "AMO pair" if depth == 0 else f"AMO commander pair (level {depth})"})
            return
        cmds = []
        for g in range(0, len(vs), 3):
            group = vs[g:g + 3]
            c = next_id[0]
            next_id[0] += 1
            name = f"c{len(aux) + 1}"
            aux.append({"id": c, "name": name, "members": list(group), "meaning": f"true exactly when one of its group is true"})
            cmds.append(c)
            for a, b in itertools.combinations(group, 2):
                clauses.append({"lits": [-a, -b], "role": f"AMO inside group {name}"})
            for x in group:
                clauses.append({"lits": [-x, c], "role": f"member → {name}"})
            clauses.append({"lits": [-c] + list(group), "role": f"{name} → some member"})
        eo(cmds, depth + 1)

    eo(list(range(1, m + 1)), 0)
    return {"aux": aux, "clauses": clauses}


ENCODERS = {"pairwise": enc_pairwise, "sequential": enc_sequential, "commander": enc_commander}


def commander_formula(m):
    if m <= 3:
        return 1 + comb(m, 2), 0
    g = -(-m // 3)
    sizes = [min(3, m - 3 * j) for j in range(g)]
    e, a = commander_formula(g)
    return m + g + sum(comb(t, 2) for t in sizes) + e, g + a


def enc_counts(name, m):
    enc = ENCODERS[name](m)
    return {"clauses": len(enc["clauses"]), "aux": len(enc["aux"]),
            "literalOccurrences": sum(len(c["lits"]) for c in enc["clauses"]), "variables": m + len(enc["aux"])}


def satisfied(clauses, assignment):
    return all(any((l > 0) == assignment[abs(l)] for l in c["lits"]) for c in clauses)


def exhaustive_projection(name, m):
    enc = ENCODERS[name](m)
    aux_ids = [a["id"] for a in enc["aux"]]
    checks = 0
    for xs in itertools.product([False, True], repeat=m):
        base = {i + 1: xs[i] for i in range(m)}
        extends = False
        for ys in itertools.product([False, True], repeat=len(aux_ids)):
            assignment = dict(base)
            assignment.update(zip(aux_ids, ys))
            if satisfied(enc["clauses"], assignment):
                extends = True
                break
        check(extends == (sum(xs) == 1), f"{name} m={m}: assignment {xs} extends iff exactly one input is true")
        checks += 1
    return checks


def z3_projection(name, m):
    import z3
    enc = ENCODERS[name](m)
    total = m + len(enc["aux"])
    v = {i: z3.Bool(f"y{i}") for i in range(1, total + 1)}
    lit = lambda l: v[l] if l > 0 else z3.Not(v[-l])
    F = [z3.Or([lit(l) for l in c["lits"]]) for c in enc["clauses"]]
    xs = [v[i] for i in range(1, m + 1)]
    s = z3.Solver(); s.add(F); s.add(z3.Not(z3.PbEq([(x, 1) for x in xs], 1)))
    check(s.check() == z3.unsat, f"{name} m={m}: every model has exactly one input true")
    for i in range(m):
        s = z3.Solver(); s.add(F); s.add([xs[j] if j == i else z3.Not(xs[j]) for j in range(m)])
        check(s.check() == z3.sat, f"{name} m={m}: unit input {i + 1} extends")


def build_encodings(regions):
    from reference_cdcl import constraint_groups
    sizes = sorted(set(range(1, 10)) | {len(cells) for _, cells in constraint_groups(regions)})
    table = []
    for m in sizes:
        row = {"m": m}
        for name in ENCODERS:
            row[name] = enc_counts(name, m)
        check(row["pairwise"]["clauses"] == 1 + comb(m, 2) and row["pairwise"]["aux"] == 0, f"pairwise count m={m}")
        check(row["sequential"]["clauses"] == (1 if m == 1 else 3 * m - 3) and row["sequential"]["aux"] == max(0, m - 1), f"sequential count m={m}")
        e, a = commander_formula(m)
        check(row["commander"]["clauses"] == e and row["commander"]["aux"] == a, f"commander count m={m} matches E(m), A(m)")
        table.append(row)
    seven = next(r for r in table if r["m"] == 7)
    check((seven["pairwise"]["clauses"], seven["sequential"]["clauses"], seven["commander"]["clauses"]) == (22, 18, 20), "seven-cell counts 22/18/20")
    check((seven["pairwise"]["aux"], seven["sequential"]["aux"], seven["commander"]["aux"]) == (0, 6, 3), "seven-cell auxiliaries 0/6/3")
    checks = sum(exhaustive_projection(name, m) for name in ("sequential", "commander") for m in range(1, 10))
    check(checks == 2044, "2,044 exhaustive assignment checks")
    passed("sequential and commander encodings: existential extension iff exactly one input true (2,044 exhaustive checks, sizes 1–9)")
    for name in ENCODERS:
        for m in sizes:
            z3_projection(name, m)
    passed(f"Z3 projection proof for all three encodings at sizes {sizes}")
    groups = []
    for gname, cells in constraint_groups(regions):
        m = len(cells)
        groups.append({"name": gname, "size": m, **{name: enc_counts(name, m) for name in ENCODERS}})
    totals = {name: {"clauses": sum(g[name]["clauses"] for g in groups), "aux": sum(g[name]["aux"] for g in groups)} for name in ENCODERS}
    # Aux witness for the check-yourself answer: in the Sinz AMO part alone,
    # with every x false, s_{m-1} may still be true.
    amo_only = [c for c in enc_sequential(7)["clauses"] if c["role"] != "ALO"]
    witness = {i: False for i in range(1, 8)}
    witness.update({7 + i: i >= 5 for i in range(1, 7)})
    check(satisfied(amo_only, witness), "Sinz AMO admits s5, s6 true with every x false")
    one_queen = {i: i == 3 for i in range(1, 8)}
    one_queen.update({7 + i: i >= 3 for i in range(1, 7)})
    check(satisfied(enc_sequential(7)["clauses"], one_queen), "x3 true forces s3..s6 true")
    return {
        "row": {name: ENCODERS[name](7) for name in ENCODERS},
        "sizes": table,
        "groups": groups,
        "boardTotals": totals,
        "validation": {"exhaustiveSizes": list(range(1, 10)), "exhaustiveAssignmentChecks": checks,
                       "z3ProjectionSizes": sizes,
                       "method": "Exhaustive: for every input assignment, an auxiliary extension exists iff exactly one input is true. Z3: encoding ∧ ¬ExactlyOne(x) is UNSAT and each unit input vector extends."},
        "auxWitness": {
            "amoOnlyAllFalse": {"x": [False] * 7, "s": [witness[7 + i] for i in range(1, 7)]},
            "exactlyOneX3": {"x": [one_queen[i] for i in range(1, 8)], "s": [one_queen[7 + i] for i in range(1, 7)]},
        },
    }


def generated_vs_distinct(generated, db):
    families = {}
    duplicates = []
    for g in generated:
        family = g["source"].split(":")[0]
        kind = "touching" if family == "touching" else g["source"].split(":")[2]
        f = families.setdefault(family, {"family": family, "generated": 0, "new": 0, "ALO": 0, "AMO": 0, "touching": 0})
        f["generated"] += 1
        f[kind] += 1
        f["new"] += g["new"]
        if not g["new"]:
            duplicates.append({"source": g["source"], "clauseId": g["clauseId"], "firstSource": db.sources[g["clauseId"]][0]})
    pairs = {}
    for d in duplicates:
        key = (d["source"].split(":")[0] + ":" + d["source"].split(":")[1], d["firstSource"].split(":")[0] + ":" + d["firstSource"].split(":")[1])
        pairs[key] = pairs.get(key, 0) + 1
    result = {
        "generated": len(generated), "distinct": len(db.clauses), "duplicates": len(duplicates),
        "byFamily": list(families.values()),
        "duplicatePairs": [{"duplicate": a, "firstGeneratedBy": b, "count": c} for (a, b), c in sorted(pairs.items())],
    }
    check(result["generated"] == 664 and result["distinct"] == 513, "664 generated clauses, 513 distinct")
    passed("pairwise board CNF: 664 generated clauses, 513 after deduplication, every duplicate source retained")
    return result


# ---------------------------------------------------------------- counts

def funnel(regions, unique_columns):
    n = len(regions)
    perms = list(itertools.permutations(range(1, n + 1)))
    nontouching = [p for p in perms if all(abs(p[r + 1] - p[r]) > 1 for r in range(n - 1))]
    regional = [p for p in perms if len({regions[r][p[r] - 1] for r in range(n)}) == n]
    legal = [p for p in nontouching if len({regions[r][p[r] - 1] for r in range(n)}) == n]
    check(len(perms) == factorial(n), "n! permutations")
    check([list(p) for p in legal] == [unique_columns], "legal set is the unique solution")
    stages = [
        {"id": "assignments", "label": "All truth assignments", "count": str(2 ** (n * n)), "formula": f"2^{n * n}", "constraint": "none"},
        {"id": "rows", "label": "Exactly one queen in every row", "count": str(n ** n), "formula": f"{n}^{n}", "constraint": "rows"},
        {"id": "permutations", "label": "…and in every column", "count": str(len(perms)), "formula": f"{n}!", "constraint": "rows + columns"},
        {"id": "nontouching", "label": "…and no two queens touch", "count": str(len(nontouching)), "formula": "enumerated", "constraint": "rows + columns + touching"},
        {"id": "legal", "label": "…and exactly one per region", "count": str(len(legal)), "formula": "enumerated", "constraint": "all four rules"},
    ]
    passed(f"set funnel counts: 2^49 → 7^7 → 5040 → {len(nontouching)} → {len(legal)} (regions-only permutations: {len(regional)})")
    return {"stages": stages, "regionalPermutations": len(regional)}


# ---------------------------------------------------------------- propagation

def validate_up(db, run, assumptions, label):
    val = {}
    for lit in assumptions:
        val[abs(lit)] = lit > 0
    value = lambda l: None if abs(l) not in val else val[abs(l)] == (l > 0)
    for k, e in enumerate(run):
        if e["kind"] == "assume":
            continue
        if e["kind"] == "propagate":
            lits = db.clauses[e["reasonClauseId"]]
            check(e["literal"] in lits and value(e["literal"]) is None, f"{label}: step {k} literal unassigned and in reason")
            check(all(value(m) is False for m in lits if m != e["literal"]), f"{label}: step {k} reason unit at enqueue")
            val[abs(e["literal"])] = e["literal"] > 0
        elif e["kind"] == "conflict":
            check(all(value(m) is False for m in db.clauses[e["conflictClauseId"]]), f"{label}: conflict clause false")
            check(k == len(run) - 1, f"{label}: conflict is final")
    return val


def propagation_runs(db, board, boards):
    n = board["size"]
    runs = []
    for v in range(1, n * n + 1):
        events, status = unit_propagate(db, [v])
        val = validate_up(db, events, [v], f"UP from q{v}")
        if status == "fixed-point":
            for cid, lits in enumerate(db.clauses):
                if not any((l > 0) == val.get(abs(l)) for l in lits if abs(l) in val):
                    check(sum(abs(l) not in val for l in lits) >= 2, f"UP from var {v} reached a fixed point")
        runs.append({"cell": list(var_cell(v, n)), "decision": v,
                     "steps": [{"literal": e["literal"], "reasonClauseId": e["reasonClauseId"]} for e in events if e["kind"] == "propagate"],
                     "status": status,
                     "conflictClauseId": events[-1]["conflictClauseId"] if status == "conflict" else None,
                     "unassignedAfter": n * n - len(val)})
    passed(f"49 single-decision propagation runs replayed ({sum(r['status'] == 'conflict' for r in runs)} end in conflict)")
    five = boards["five"]["regions"]
    db5, _ = pairwise_cnf(five)
    events5, status5 = unit_propagate(db5, [])
    validate_up(db5, events5, [], "5x5 level-0 propagation")
    check(status5 == "fixed-point" and events5 and events5[0]["literal"] == cell_var(1, 5, 5), "5x5 inset: singleton region C forces r1c5 first")
    inset = {"boardId": "five", "regions": five, "partitionSha256": partition_sha(five),
             "clauses": {str(e["reasonClauseId"]): {"lits": db5.clauses[e["reasonClauseId"]], "sources": db5.sources[e["reasonClauseId"]]} for e in events5},
             "steps": [{"literal": e["literal"], "reasonClauseId": e["reasonClauseId"]} for e in events5], "status": status5}
    passed(f"5×5 inset: level-0 propagation from the singleton region forces r1c5 then {len(events5) - 1} more literals")
    rup = next(r for r in runs if r["cell"] == [2, 7])
    check(rup["status"] == "conflict", "RUP example: asserting q27 propagates to a conflict")
    return runs, inset


# ---------------------------------------------------------------- Hall / confinement

def confinement(board, db):
    import z3
    regions = board["regions"]
    n = board["size"]
    labels = sorted({k for row in regions for k in row})
    cells = {k: [(r, c) for r in range(1, n + 1) for c in range(1, n + 1) if regions[r - 1][c - 1] == k] for k in labels}
    hypothesis = -cell_var(3, 1, n)
    masks = {"none": set(), "notq31": {(3, 1)}}
    out_masks = {}
    for mask_id, removed in masks.items():
        candidates = {k: [cell for cell in cells[k] if cell not in removed] for k in labels}
        rows = {k: sorted({r for r, _ in candidates[k]}) for k in labels}
        sdrs = []
        for choice in itertools.product(*[candidates[k] for k in labels]):
            if len({r for r, _ in choice}) == n:
                sdrs.append(choice)
        used = {cell for choice in sdrs for cell in choice}
        subsets = []
        for size in range(1, n + 1):
            for K in itertools.combinations(labels, size):
                N = sorted(set().union(*[set(rows[k]) for k in K]))
                status = "deficient" if len(N) < len(K) else "tight" if len(N) == len(K) else "slack"
                excluded = []
                if status == "tight":
                    excluded = sorted(cell for k in labels if k not in K for cell in candidates[k] if cell[0] in N)
                    for cell in excluded:
                        check(cell not in used, f"Hall exclusion {cell} under mask {mask_id} is unused by every region-row matching")
                subsets.append({"regions": list(K), "rows": N, "status": status, "excluded": [list(c) for c in excluded]})
        deficient = any(s["status"] == "deficient" for s in subsets)
        check(deficient == (not sdrs), f"Hall's condition agrees with SDR enumeration under mask {mask_id}")
        out_masks[mask_id] = {"removedCells": [list(c) for c in sorted(removed)], "regionRows": rows,
                              "matchingCount": len(sdrs), "subsets": subsets,
                              "cellsUsedByAMatching": len(used)}
    tight = next(s for s in out_masks["notq31"]["subsets"] if s["regions"] == ["A", "B"])
    spec_cells = [[1, 6], [1, 7], [2, 4], [2, 5], [2, 6], [2, 7]]
    check(tight["status"] == "tight" and tight["rows"] == [1, 2] and tight["excluded"] == spec_cells, "¬q31: regions A,B confined to rows 1–2 exclude six C cells")
    q = {v: z3.Bool(f"v{v}") for v in range(1, n * n + 1)}
    lit = lambda l: q[l] if l > 0 else z3.Not(q[-l])
    base = [z3.Or([lit(l) for l in c]) for c in db.clauses[:513]]
    for r, c in spec_cells:
        s = z3.Solver(); s.add(base); s.add(lit(hypothesis)); s.add(q[cell_var(r, c, n)])
        check(s.check() == z3.unsat, f"Z3: F ∧ ¬q31 ∧ q{r}{c} is UNSAT")
    events, status = unit_propagate(db, [hypothesis])
    check(status == "fixed-point" and [e["kind"] for e in events] == ["assume"], "UP from ¬q31 adds no literal")
    check(not any(len(c) == 1 for c in db.clauses[:513]), "pairwise CNF has no unit clause")
    b_tight = next(s for s in out_masks["none"]["subsets"] if s["regions"] == ["B"])
    check(b_tight["status"] == "tight" and [1, 1] in b_tight["excluded"], "region B alone is confined to row 1")
    # A region-to-row matching that violates the column rule (and touching).
    counter = None
    for choice in itertools.product(*[cells[k] for k in labels]):
        if len({r for r, _ in choice}) == n and len({c for _, c in choice}) < n:
            counter = choice
            break
    check(counter is not None, "a row-perfect region matching that violates columns exists")
    cols = [c for _, c in counter]
    clash = sorted({c for c in cols if cols.count(c) > 1})
    passed("Hall example: ¬q31 confines A,B to rows 1–2; six C exclusions hold in the row–region relaxation and are Z3-UNSAT in F; UP adds nothing")
    return {
        "hypothesis": hypothesis, "hypothesisCell": [3, 1], "regions": labels,
        "regionCells": {k: [list(c) for c in v] for k, v in cells.items()},
        "masks": out_masks, "highlight": {"mask": "notq31", "regions": ["A", "B"], "rows": [1, 2], "excluded": spec_cells},
        "unitPropagationFromHypothesis": {"status": status, "newLiterals": 0},
        "z3Checks": [{"cell": cell, "formula": f"F ∧ ¬q31 ∧ q{cell[0]}{cell[1]}", "result": "unsat"} for cell in spec_cells],
        "firstLearnedLinks": {"learnedLiteral": -1, "hallSubset": ["B"], "note": "The reference run's first learned clause ¬q11 is one of region B's row-1 exclusions."},
        "matchingCounterexample": {"cells": [list(c) for c in counter], "regions": labels, "repeatedColumns": clash},
    }


# ---------------------------------------------------------------- implication graphs

def implication_graphs(existence):
    clauses = {c["id"]: c["lits"] for c in existence["clauses"]}
    graphs = []
    assign = {}
    trail = []
    for e in existence["events"]:
        if e["kind"] in ("decide", "propagate"):
            assign[abs(e["literal"])] = {"literal": e["literal"], "level": e["level"], "reason": e.get("reasonClauseId"), "seq": e["seq"], "pos": len(trail)}
            trail.append(e["literal"])
        elif e["kind"] == "backjump":
            for l in e["removed"]:
                del assign[abs(l)]
            trail = [l for l in trail if abs(l) in assign]
        elif e["kind"] == "conflict":
            level = e["level"]
            cid = e["conflictClauseId"]
            nodes = {}
            edges = []
            stack = [-l for l in clauses[cid]]
            for l in clauses[cid]:
                edges.append({"from": -l, "to": 0, "clauseId": cid})
            while stack:
                lit = stack.pop()
                if lit in nodes:
                    continue
                a = assign[abs(lit)]
                check(a["literal"] == lit, "graph node is on the trail")
                nodes[lit] = a
                if a["reason"] is not None:
                    for m in clauses[a["reason"]]:
                        if m != lit:
                            edges.append({"from": -m, "to": lit, "clauseId": a["reason"]})
                            stack.append(-m)
            decision = next(l for l in trail if assign[abs(l)]["level"] == level and assign[abs(l)]["reason"] is None)
            current = [l for l in nodes if nodes[l]["level"] == level]
            succ = {}
            for ed in edges:
                if ed["to"] == 0 or (ed["to"] in nodes and nodes[ed["to"]]["level"] == level):
                    if ed["from"] in nodes and nodes[ed["from"]]["level"] == level:
                        succ.setdefault(ed["from"], []).append(ed["to"])

            def path_avoiding(avoid):
                prev = {decision: None}
                queue = [decision]
                while queue:
                    x = queue.pop(0)
                    if x == 0:
                        out = []
                        while x is not None:
                            out.append(x)
                            x = prev[x]
                        return out[::-1]
                    for y in succ.get(x, []):
                        if y != avoid and y not in prev:
                            prev[y] = x
                            queue.append(y)
                return None

            uips = [x for x in current if x == decision or path_avoiding(x) is None]
            first_uip = max(uips, key=lambda x: nodes[x]["pos"])
            witnesses = {str(x): path_avoiding(x) for x in current if x not in uips}
            rank = {}

            def rank_of(x):
                if x in rank:
                    return rank[x]
                preds = [ed["from"] for ed in edges if ed["to"] == x]
                rank[x] = 0 if not preds else 1 + max(rank_of(p) for p in preds)
                return rank[x]

            for x in list(nodes) + [0]:
                rank_of(x)
            cut_clauses = {}
            for u in uips:
                # Conflict side: current-level descendants of u, plus the conflict node.
                side = {0}
                frontier = [u]
                while frontier:
                    x = frontier.pop()
                    for y in succ.get(x, []):
                        if y not in side:
                            side.add(y)
                            frontier.append(y)
                crossing = sorted({ed["from"] for ed in edges if ed["to"] in side and ed["from"] not in side}, key=lambda l: nodes[l]["pos"])
                cut_clauses[str(u)] = sorted((-l for l in crossing), key=lit_key)
            graphs.append({
                "conflictSeq": e["seq"], "level": level, "conflictClauseId": cid, "decision": decision,
                "nodes": [{"literal": x, "level": nodes[x]["level"], "seq": nodes[x]["seq"], "trailPosition": nodes[x]["pos"],
                           "reasonClauseId": nodes[x]["reason"], "rank": rank[x]} for x in sorted(nodes, key=lambda x: nodes[x]["pos"])],
                "conflictRank": rank[0],
                "edges": edges, "uips": sorted(uips, key=lambda x: nodes[x]["pos"]), "firstUip": first_uip,
                "witnessPaths": witnesses, "cutClauses": cut_clauses,
            })
    import z3
    q = {v: z3.Bool(f"v{v}") for v in range(1, len(existence["variables"]) + 1)}
    lit = lambda l: q[l] if l > 0 else z3.Not(q[-l])
    base = [z3.Or([lit(l) for l in c["lits"]]) for c in existence["clauses"][:existence["originalClauseCount"]]]
    for g in graphs:
        learn = next(e for e in existence["events"] if e["seq"] == g["conflictSeq"] + 1)
        learned = clauses[learn["learnedClauseId"]]
        check(-g["firstUip"] in learned, f"conflict {g['conflictSeq']}: learned clause contains ¬(first UIP)")
        check(set(g["cutClauses"][str(g["firstUip"])]) == set(learned), f"conflict {g['conflictSeq']}: first-UIP cut clause equals the learned clause")
        for u, cut in g["cutClauses"].items():
            s = z3.Solver(); s.add(base); s.add(z3.Not(z3.Or([lit(l) for l in cut])))
            check(s.check() == z3.unsat, f"conflict {g['conflictSeq']}: cut clause at UIP {u} is entailed by F")
    g126 = next(g for g in graphs if g["conflictSeq"] == 126)
    check(g126["firstUip"] == 14 and g126["conflictClauseId"] == 477, "event 126: first UIP is q27 and the conflict is region F's ALO clause")
    check(sorted(ed["clauseId"] for ed in g126["edges"] if ed["from"] == 14) == [295, 296, 297], "event 126: q27 excludes q57, q67, q77 through clauses 295–297")
    passed(f"implication graphs for {len(graphs)} conflicts; first-UIP cut equals each learned clause; every UIP cut clause Z3-entailed; event 126 → ¬q27")
    return graphs


# ---------------------------------------------------------------- Z3 receipts

STAGE_PHASES = {
    "simplifier": "simplify", "propagate-values": "simplify", "ctx-simplify": "simplify", "solve-eqs": "simplify",
    "elim-uncnstr": "simplify", "max-bv-sharing": "simplify", "ast-table": "bookkeeping",
    "lia2card": "cardinality", "ilp-model-finder-tactic": "cardinality", "pb-tactic": "cardinality", "pb2bv": "cardinality",
    "card2bv": "cardinality", "lia2pb": "cardinality",
    "bit-blast": "bit-level", "aig": "bit-level",
    "sat-status": "sat-core", "sat.solver": "sat-core", "sat.stats": "sat-core", "sat-cleaner": "sat-core",
}


def parse_route(stderr: str):
    lines = [line for line in stderr.splitlines() if line.strip()]
    stages = []
    for line in lines:
        m = re.match(r"^\s*\(([A-Za-z][\w.\-]*)", line)
        if not m:
            continue
        name = m.group(1)
        phase = STAGE_PHASES.get(name, "smt-core" if name.startswith("smt.") else "sat-core" if name.startswith("sat") else "other")
        if stages and stages[-1]["name"] == name:
            stages[-1]["count"] += 1
        else:
            stages.append({"name": name, "phase": phase, "count": 1})
    return {"stages": stages, "lines": lines}


SEARCH_KEYS = ("decisions", "conflicts", "propagations", "restarts", "backjumps", "units")


def classify_engine(stats, route, first_stats=None):
    names = {s["name"] for s in route["stages"]}
    sat_counters = sorted(k for k in stats if k.startswith("sat ") and any(w in k for w in SEARCH_KEYS))
    smt_counters = sorted(k for k in stats if not k.startswith("sat ") and any(k.startswith(w) or k == w for w in ("decisions", "conflicts", "propagations")))
    arith = sorted(k for k in stats if k.startswith("arith"))
    basis = []
    if "sat.solver" in names:
        basis.append("verbose route contains (sat.solver)")
    if "smt.searching" in names:
        basis.append("verbose route contains (smt.searching)")
    if sat_counters:
        basis.append("statistics report sat-prefixed search counters")
    if smt_counters:
        basis.append("statistics report unprefixed SMT search counters")
    if arith:
        basis.append(f"statistics report {len(arith)} arithmetic counters")
    if first_stats is not None and not route["stages"] and sat_counters and \
            all(stats.get(k) == first_stats.get(k) for k in sat_counters):
        basis.append("no verbose output during this check")
        basis.append("sat-prefixed counters are unchanged from the first check")
        return {"id": "no-new-search", "label": "Answered by the incremental SAT solver with no new search reported", "basis": basis}
    if "sat.solver" in names and sat_counters and "smt.searching" not in names:
        if not names & {"simplifier", "bit-blast", "pb2bv", "card2bv", "lia2card"}:
            basis.append("no preprocessing stage recorded during this check")
            return {"id": "sat-core", "label": "SAT core (incremental; clauses already compiled)", "basis": basis}
        return {"id": "sat-core", "label": "SAT core after preprocessing", "basis": basis}
    if "smt.searching" in names and smt_counters and "sat.solver" not in names:
        if arith:
            return {"id": "smt-core-arithmetic", "label": "SMT core with arithmetic", "basis": basis}
        return {"id": "smt-core", "label": "SMT core", "basis": basis}
    if not sat_counters and not smt_counters and "sat.solver" not in names and "smt.searching" not in names:
        last = [line for line in route["lines"] if line.startswith("(solve-eqs")]
        if last and ":num-exprs 0 " in last[-1]:
            basis.append("the last solve-eqs line reports :num-exprs 0")
        return {"id": "preprocessing-only", "label": "Settled during preprocessing; no search engine reported", "basis": basis}
    return {"id": "unclassified", "label": "Unclassified: route and counters disagree", "basis": basis}


def run_worker(python, board_id, regions, mode, verbose):
    request = {"board": board_id, "regions": regions, "mode": mode, "verbose": verbose, "timeoutMs": TIMEOUT_MS}
    proc = subprocess.run([python, "-I", str(HERE / "measure_z3.py")], input=json.dumps(request), capture_output=True, text=True,
                          env={"PYTHONDONTWRITEBYTECODE": "1", "PATH": "/usr/bin:/bin"}, timeout=300)
    check(proc.returncode == 0, f"measure_z3.py {board_id}/{mode}/v{verbose} failed: {proc.stderr[-2000:]}")
    return json.loads(proc.stdout)


def model_columns(values, n):
    rows = [values[r * n:(r + 1) * n] for r in range(n)]
    check(all(sum(row) == 1 for row in rows), "Z3 model has exactly one queen per row")
    return [row.index(True) + 1 for row in rows]


def build_receipts(boards, uniques):
    import z3
    python = sys.executable
    out_boards = []
    for board_id in ("five", "seven", "nine"):
        regions = boards[board_id]["regions"]
        n = len(regions)
        runs = []
        for mode, meta in MODES.items():
            quiet = run_worker(python, board_id, regions, mode, 0)
            loud = run_worker(python, board_id, regions, mode, 10)
            check(quiet["formulaSha256"] == loud["formulaSha256"], f"{board_id}/{mode}: formula hash stable across processes")
            check(quiet["z3"].startswith("Z3 4.16.0"), f"{board_id}/{mode}: Z3 4.16.0")
            columns = model_columns(quiet["modelValues"], n)
            check(legal_columns(regions, columns), f"{board_id}/{mode}: Z3 model satisfies row/column/region/touching rules")
            check(columns == uniques[board_id] == boards[board_id]["solution"], f"{board_id}/{mode}: Z3 model equals the unique enumerated solution and boardConfigs")
            check(model_columns(loud["modelValues"], n) == columns, f"{board_id}/{mode}: verbose run found the same model")
            names = [f"cell_{r}_{c}" for r in range(n) for c in range(n)]
            check(quiet["blocker"]["variables"] == names, f"{board_id}/{mode}: blocker uses only the original cell variables")
            checks = []
            for key, query, label in (("first", "first", "First check"),
                                      ("incrementalBlocked", "incremental-blocked", "Same solver + blocking clause"),
                                      ("freshBlocked", "fresh-blocked", "Fresh solver + blocking clause")):
                q_check, l_check = quiet[key], loud[key]
                expected = "sat" if key == "first" else "unsat"
                check(q_check["result"] == expected and l_check["result"] == expected, f"{board_id}/{mode}/{query}: result {expected}")
                route = parse_route(l_check["verboseStderr"] or "")
                compared = sorted(k for k in set(q_check["statistics"]) | set(l_check["statistics"]) if any(w in k for w in SEARCH_KEYS))
                match = all(q_check["statistics"].get(k) == l_check["statistics"].get(k) for k in compared)
                first_q = quiet["first"]["statistics"] if key == "incrementalBlocked" else None
                first_l = loud["first"]["statistics"] if key == "incrementalBlocked" else None
                engine = classify_engine(q_check["statistics"], route, first_q)
                check(engine["id"] != "unclassified", f"{board_id}/{mode}/{query}: engine classified")
                check(classify_engine(l_check["statistics"], route, first_l)["id"] == engine["id"], f"{board_id}/{mode}/{query}: same engine in verbose run")
                shared = [k for k in compared if k in q_check["statistics"] and k in quiet["first"]["statistics"]]
                cumulative = key == "incrementalBlocked" and bool(shared) and \
                    all(q_check["statistics"][k] >= quiet["first"]["statistics"][k] for k in shared)
                checks.append({"query": query, "label": label, "result": q_check["result"],
                               "elapsedSeconds": round(q_check["elapsedSeconds"], 6), "statistics": q_check["statistics"],
                               "reasonUnknown": q_check["reasonUnknown"], "engine": engine,
                               "route": {"source": "separate verbose=10 process, same formula", "stages": route["stages"], "lines": route["lines"]},
                               "verboseRunCountersMatch": match, "comparedCounters": compared,
                               "countersCumulativeWithFirst": cumulative})
            runs.append({"mode": mode, "configuration": meta["configuration"], "syntax": meta["syntax"], "production": meta["production"],
                         "parameters": {"timeout": TIMEOUT_MS, "verbose": 0, "seeds": "unchanged defaults"},
                         "assertions": quiet["assertions"], "formulaSha256": quiet["formulaSha256"],
                         "blockedFormulaSha256": quiet["blockedFormulaSha256"], "freshBlockedFormulaSha256": quiet["freshBlockedFormulaSha256"],
                         "blocker": {"form": "Or(cell != model value) over all cells", "literalCount": quiet["blocker"]["literalCount"],
                                     "sha256": sha256_bytes(quiet["blocker"]["sexpr"].encode())},
                         "modelColumns": columns, "checks": checks})
        out_boards.append({"id": board_id, "size": n, "regions": regions, "partitionSha256": partition_sha(regions), "runs": runs})
    passed("27 Z3 checks (3 boards × 3 configurations × first/incremental/fresh): models legal and unique; blocked checks UNSAT; engines classified")
    return {
        "schemaVersion": 1, "kind": "z3-receipts", "caption": CAPTION_Z3,
        "z3Version": z3.get_full_version(), "pythonVersion": platform.python_version(), "platform": platform.platform(terse=True),
        "generatedAt": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
        "measureScriptSha256": sha256_file(HERE / "measure_z3.py"),
        "notes": [
            "Each board/configuration ran in two separate processes: verbose=0 for the statistics shown, verbose=10 for the route.",
            "A missing counter means the receipt does not report it; it is not a measured zero.",
            "Counters from different engines are not comparable and are never subtracted.",
            "The QF_FD solver keeps one statistics object across checks: its incremental counters include the first check (countersCumulativeWithFirst).",
            "Elapsed seconds are wall-clock times on one machine and are not a benchmark.",
        ],
        "boards": out_boards,
    }


def validate_receipts(receipts, boards, uniques):
    import z3
    check(receipts["z3Version"].startswith("Z3 4.16.0"), "receipts: Z3 4.16.0")
    for b in receipts["boards"]:
        regions = boards[b["id"]]["regions"]
        check(b["regions"] == regions and b["partitionSha256"] == partition_sha(regions), f"receipts {b['id']}: partition binding")
        n = len(regions)
        for run in b["runs"]:
            check(run["modelColumns"] == uniques[b["id"]] and legal_columns(regions, run["modelColumns"]), f"receipts {b['id']}/{run['mode']}: legal unique model")
            check([c["query"] for c in run["checks"]] == ["first", "incremental-blocked", "fresh-blocked"], "receipt query order")
            check([c["result"] for c in run["checks"]] == ["sat", "unsat", "unsat"], f"receipts {b['id']}/{run['mode']}: verdicts")
            for c in run["checks"]:
                route = {"stages": c["route"]["stages"], "lines": c["route"]["lines"]}
                check(parse_route("\n".join(c["route"]["lines"]))["stages"] == c["route"]["stages"], "route stages re-parse")
                first = run["checks"][0]["statistics"] if c["query"] == "incremental-blocked" else None
                check(classify_engine(c["statistics"], route, first) == c["engine"], f"receipts {b['id']}/{run['mode']}/{c['query']}: engine classification reproduces")
            # Rebuild the formula (no solving) and check the recorded hash.
            q = [[z3.Bool(f"cell_{r}_{c}") for c in range(n)] for r in range(n)]
            labels = sorted({k for row in regions for k in row})
            units = [list(row) for row in q] + [[q[r][c] for r in range(n)] for c in range(n)]
            units += [[q[r][c] for r in range(n) for c in range(n) if regions[r][c] == k] for k in labels]
            exact = (lambda u: z3.PbEq([(x, 1) for x in u], 1)) if run["mode"] == "pb" else (lambda u: z3.Sum([z3.If(x, 1, 0) for x in u]) == 1)
            F = [exact(u) for u in units]
            for r in range(n):
                for c in range(n):
                    for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (-1, 1), (1, -1), (1, 1)]:
                        if 0 <= r + dr < n and 0 <= c + dc < n:
                            F.append(z3.Implies(q[r][c], z3.Not(q[r + dr][c + dc])))
            s = z3.Solver() if run["mode"] == "default" else z3.SolverFor("QF_FD")
            s.add(F)
            check(sha256_bytes(s.sexpr().encode()) == run["formulaSha256"], f"receipts {b['id']}/{run['mode']}: formula hash reproduces")
            check(run["assertions"] == len(F), "assertion count")
    passed("Z3 receipts: partitions, models, verdicts, engine classifications and formula hashes reproduce")


# ---------------------------------------------------------------- main

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--verify", action="store_true", help="validate committed JSON without writing")
    ap.add_argument("--skip-z3-runs", action="store_true", help="regenerate deterministic files but keep committed z3-receipts.json")
    args = ap.parse_args()

    board, boards = load_board()
    uniques = {}
    for name in ("five", "seven", "nine"):
        checked, found = brute_force_solutions(boards[name]["regions"])
        check(len(found) == 1 and found[0] == boards[name]["solution"], f"{name}: brute force finds exactly the saved solution")
        uniques[name] = found[0]
        passed(f"{name}: independent enumeration of {checked:,} permutations finds exactly one legal placement {found[0]}")

    existence, blocked, db, generated, cnf_text = build_traces(board)
    learned_e, learned_b = validate_traces(existence, blocked, board["regions"], uniques["seven"])
    z3_entailment(existence, blocked)
    teaching = {
        "schemaVersion": 1, "boardId": board["id"], "partitionSha256": board["partitionSha256"],
        "cnfSha256": existence["cnfSha256"],
        "captions": {"reference": CAPTION_REFERENCE, "z3": CAPTION_Z3},
        "funnel": funnel(board["regions"], uniques["seven"]),
        "encodings": build_encodings(board["regions"]),
        "generatedVsDistinct": generated_vs_distinct(generated, db_original := pairwise_cnf(board["regions"])[0]),
    }
    runs, inset = propagation_runs(db_original, board, boards)
    teaching["propagation"] = {"caption": CAPTION_REFERENCE, "order": "full clause scan in clause-id order, repeated until nothing changes",
                               "runs": runs, "inset5": inset}
    teaching["confinement"] = confinement(board, db_original)
    teaching["implicationGraphs"] = implication_graphs(existence)

    files = {
        "reference-trace-existence.json": dumps(existence),
        "reference-trace-blocked.json": dumps(blocked),
        "teaching-data.json": dumps(teaching),
        "seven-pairwise.cnf": cnf_text,
    }
    check(sha256_bytes(cnf_text.encode()) == existence["cnfSha256"], "DIMACS file hash equals cnfSha256")

    if args.verify:
        for name, text in files.items():
            committed = (OUT / name).read_text()
            check(committed == text, f"committed {name} equals a fresh deterministic rebuild")
            passed(f"committed {name} is byte-identical to the deterministic rebuild")
        for name in ("reference-trace-existence.json", "reference-trace-blocked.json"):
            trace = json.loads((OUT / name).read_text())
            validate_trace(trace, f"committed {name}")
        receipts = json.loads((OUT / "z3-receipts.json").read_text())
        validate_receipts(receipts, boards, uniques)
        manifest = json.loads((OUT / "manifest.json").read_text())
        for entry in manifest["files"]:
            check(sha256_file(OUT / entry["path"]) == entry["sha256"], f"manifest hash for {entry['path']}")
        passed("manifest hashes match every committed artifact")
        print(f"\nVERIFIED {len(CHECKS)} check groups; no files written.")
        return

    if args.skip_z3_runs:
        receipts = json.loads((OUT / "z3-receipts.json").read_text())
    else:
        receipts = build_receipts(boards, uniques)
    validate_receipts(receipts, boards, uniques)
    files["z3-receipts.json"] = dumps(receipts)

    OUT.mkdir(parents=True, exist_ok=True)
    for name, text in files.items():
        (OUT / name).write_text(text)
    manifest = {
        "schemaVersion": 1, "boardId": board["id"], "partitionSha256": board["partitionSha256"],
        "generator": {"script": "scripts/z3/build_teaching_data.py", "sha256": sha256_file(Path(__file__)),
                      "kernel": {"script": "scripts/z3/reference_cdcl.py", "sha256": sha256_file(HERE / "reference_cdcl.py")},
                      "measure": {"script": "scripts/z3/measure_z3.py", "sha256": sha256_file(HERE / "measure_z3.py")},
                      "board": {"path": "src/z3/board-seven.json", "sha256": sha256_file(BOARD_JSON)}},
        "files": [{"path": name, "sha256": sha256_file(OUT / name), "bytes": (OUT / name).stat().st_size} for name in files],
        "checks": CHECKS,
    }
    (OUT / "manifest.json").write_text(dumps(manifest))
    print(f"\nWROTE {len(files) + 1} files to {OUT.relative_to(ROOT)}; {len(CHECKS)} check groups passed.")


if __name__ == "__main__":
    try:
        main()
    except ValidationError as error:
        print(f"FAIL {error}", file=sys.stderr)
        sys.exit(1)
