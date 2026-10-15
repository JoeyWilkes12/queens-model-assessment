# Reproducible Z3 measurement script

Save the fenced block as `measure_queens.py` when implementing. During this design task it is executed directly from this Markdown, so no source outside the artifact directory is written. Requires Python 3.10+ and z3-solver. Run each mode/board in a separate process for clean counters. Default mode leaves solver parameters unchanged, apart from the explicit timeout. Verbose output goes to stderr. `--clauses` is an explicitly different diagnostic configuration, not a production baseline.

```python
import argparse, ast, hashlib, json, re, time
from pathlib import Path
import z3

ap = argparse.ArgumentParser()
ap.add_argument('--app', required=True)
ap.add_argument('--board', choices=['five', 'seven', 'nine'], required=True)
ap.add_argument('--mode', choices=['default', 'fd', 'pb'], default='default')
ap.add_argument('--verbose', type=int, default=0)
ap.add_argument('--clauses', action='store_true')
ap.add_argument('--inspect-tactics', action='store_true')
args = ap.parse_args()
z3.set_param(verbose=args.verbose)
source = Path(args.app).read_text()
part = source.split('  ' + args.board + ': {', 1)[1].split('  },', 1)[0]
regions = ast.literal_eval(re.search(r'regions: (\[.*?\n    \])', part, re.S)[1])
expected = ast.literal_eval(re.search(r'solution: (\[[^\n]+\])', part)[1])
n = len(regions)
assert all(len(row) == n for row in regions)
labels = sorted(set(sum(regions, [])))
assert len(labels) == n
q = [[z3.Bool(f'cell_{r}_{c}') for c in range(n)] for r in range(n)]
flat = sum(q, [])
units = q + [[q[r][c] for r in range(n)] for c in range(n)]
units += [[q[r][c] for r in range(n) for c in range(n)
           if regions[r][c] == k] for k in labels]
exact = (lambda u: z3.PbEq([(b, 1) for b in u], 1)) if args.mode == 'pb' else (
    lambda u: z3.Sum([z3.If(b, 1, 0) for b in u]) == 1)
F = [exact(u) for u in units]
offsets = [(-1,0), (1,0), (0,-1), (0,1), (-1,-1), (-1,1), (1,-1), (1,1)]
for r in range(n):
    for c in range(n):
        for dr, dc in offsets:
            if 0 <= r+dr < n and 0 <= c+dc < n:
                F.append(z3.Implies(q[r][c], z3.Not(q[r+dr][c+dc])))

def new_solver():
    s = z3.Solver() if args.mode == 'default' else z3.SolverFor('QF_FD')
    s.set(timeout=30000)
    if args.clauses:
        s.set(clause_proof=True)
    s.add(F)
    return s

def stats(s):
    t = s.statistics()
    return {k: t.get_key_value(k) for k in t.keys()}

def checked(s):
    start = time.perf_counter()
    result = s.check()
    return {'result': str(result), 'elapsed_s': time.perf_counter()-start,
            'statistics': stats(s),
            'reason_unknown': s.reason_unknown() if result == z3.unknown else None}

def valid(cols):
    return (len(set(cols)) == n and
            len({regions[r][c-1] for r, c in enumerate(cols)}) == n and
            all(abs(cols[r+1]-cols[r]) > 1 for r in range(n-1)))

s = new_solver()
events = []
observer = None
if args.clauses:
    # Copy strings immediately: callback AST lifetimes are not a data contract.
    def on_clause(proof, dependencies, clause):
        events.append({'proof': str(proof), 'dependencies': list(dependencies),
                       'clause': [str(lit) for lit in clause]})
    observer = z3.OnClause(s, on_clause)
out = {'z3': z3.get_full_version(), 'board': args.board, 'mode': args.mode,
       'parameters': {'timeout': 30000, 'verbose': args.verbose,
                      'clause_proof': args.clauses},
       'app_sha256': hashlib.sha256(source.encode()).hexdigest(),
       'partition_sha256': hashlib.sha256(json.dumps(regions).encode()).hexdigest(),
       'regions': regions, 'assertions': len(F),
       'formula_sha256': hashlib.sha256(s.sexpr().encode()).hexdigest()}
out['first'] = checked(s)
if out['first']['result'] == 'sat':
    m = s.model()
    values = [z3.is_true(m.eval(b, model_completion=True)) for b in flat]
    cols = [next(c+1 for c in range(n) if values[r*n+c]) for r in range(n)]
    assert all(sum(values[r*n:(r+1)*n]) == 1 for r in range(n))
    assert valid(cols)
    out['model_columns'] = cols
    out['matches_saved_solution'] = cols == expected
    blocker = z3.Or([b != z3.BoolVal(v) for b, v in zip(flat, values)])
    out['blocker'] = str(blocker)
    before = len(events)
    s.add(blocker)
    out['incremental_blocked'] = checked(s)
    out['callback_events_first'] = before if args.clauses else None
    out['callback_events_incremental'] = len(events)-before if args.clauses else None
    fresh = new_solver()
    fresh.add(blocker)
    out['fresh_blocked'] = checked(fresh)
out['clause_events'] = events if args.clauses else None
if args.inspect_tactics:
    # Explicit diagnostic rewrites; NOT a dump of Solver()'s hidden pipeline.
    snapshots = {}
    for names in [('simplify',), ('simplify','lia2card'),
                  ('simplify','lia2pb'), ('simplify','lia2pb','pb2bv'),
                  ('simplify','card2bv')]:
        try:
            g = z3.Goal(); g.add(F)
            t = z3.Tactic(names[0]) if len(names)==1 else z3.Then(*names)
            snapshots['+'.join(names)] = str(t(g))
        except z3.Z3Exception as e:
            snapshots['+'.join(names)] = {'error': str(e)}
    out['diagnostic_tactics'] = snapshots
print(json.dumps(out, indent=2))
```

Example invocation (paths verified on this Mac):

```sh
PYTHONDONTWRITEBYTECODE=1 /Users/joeywilkes/Desktop/scripts/Queens/.local/venv/bin/python measure_queens.py --app /Users/joeywilkes/Desktop/scripts/queens-model-assessment/.worktrees/decision-models-refresh/src/App.tsx --board seven --mode default --verbose 10
```

Run the Cartesian product of boards `five seven nine` and modes `default fd pb`. Retain stdout, stderr, script hash, version, parameters, and input/formula hashes. A missing counter is unavailable, not zero. Counters from an incremental solver can reset/change family when the combined solver changes engines; do not subtract unlike statistics. Callback events include assumptions, inferences and deletions: their count is **not** the number of learned clauses. Classify proof tags against the pinned Z3 implementation before publishing a learned-clause count. `mk clause` counts all created clauses, not only learned ones.

For legacy proofs use a separate process and `Context(proof=True)` before creating expressions; rebuild the blocked formula in that context, then request `proof()` after UNSAT. Proof mode can select a different pipeline. Never compare that run's timing/counters as if it were the baseline.
