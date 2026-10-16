"""Reconstruct receipt inputs and blockers, without project imports.

Perform first checks where needed to reproduce stateful solver serialization;
do not compare performance counters across processes.
"""
from pathlib import Path
from itertools import product
from hashlib import sha256
import json
import z3

root = Path(__file__).resolve().parents[2]
ev = root/'public/evidence/z3'
j = json.loads((ev/'z3-receipts.json').read_text())
digest = lambda text: sha256(text.encode()).hexdigest()
print('# Receipt input and arithmetic inset checks\n')
assert z3.get_full_version() == j['z3Version']
assert sha256((root/'scripts/z3/measure_z3.py').read_bytes()).hexdigest() == j['measureScriptSha256']
hash_count = 0
for board in j['boards']:
    rr = board['regions']
    n = len(rr)
    assert digest(json.dumps(rr)) == board['partitionSha256']
    for run in board['runs']:
        ctx=z3.Context()
        cells = [[z3.Bool(f'cell_{r}_{c}',ctx=ctx) for c in range(n)] for r in range(n)]
        flat = sum(cells,[])
        groups = list(cells)+[[cells[r][c] for r in range(n)] for c in range(n)]
        groups += [[cells[r][c] for r,c in product(range(n),repeat=2) if rr[r][c]==label] for label in sorted(set(sum(rr,[])))]
        exact = (lambda xs:z3.PbEq([(x,1) for x in xs],1)) if run['mode']=='pb' else (lambda xs:z3.Sum([z3.If(x,1,0) for x in xs])==1)
        formula = [exact(g) for g in groups]
        for r,c in product(range(n),repeat=2):
            for dr,dc in [(-1,0),(1,0),(0,-1),(0,1),(-1,-1),(-1,1),(1,-1),(1,1)]:
                if 0<=r+dr<n and 0<=c+dc<n:
                    formula.append(z3.Implies(cells[r][c],z3.Not(cells[r+dr][c+dc])))
        new_solver = (lambda:z3.Solver(ctx=ctx)) if run['mode']=='default' else lambda:z3.SolverFor('QF_FD',ctx=ctx)
        s=new_solver()
        s.set(timeout=30000)
        s.add(formula)
        assert digest(s.sexpr()) == run['formulaSha256']
        assert s.check() == z3.sat
        values = [c+1==run['modelColumns'][r] for r,c in product(range(n),repeat=2)]
        blocker=z3.Or([x!=z3.BoolVal(val,ctx=ctx) for x,val in zip(flat,values)])
        assert digest(blocker.sexpr()) == run['blocker']['sha256']
        assert len(flat) == run['blocker']['literalCount']
        s.add(blocker)
        assert digest(s.sexpr()) == run['blockedFormulaSha256'], (board['id'],run['mode'],'incremental',digest(s.sexpr()),run['blockedFormulaSha256'])
        fresh=new_solver()
        fresh.set(timeout=30000)
        fresh.add(formula)
        fresh.add(blocker)
        assert digest(fresh.sexpr()) == run['freshBlockedFormulaSha256']
        hash_count += 4
print(f'- {hash_count} hashes reconstructed: first, same-solver blocked, fresh blocked, and full-cell blocker for all nine board/configuration combinations.')
manifest=json.loads((ev/'manifest.json').read_text())
g=manifest['generator']
for name,record in [('generator',g),('kernel',g['kernel']),('measure',g['measure']),('board',g['board'])]:
    path=record.get('script',record.get('path'))
    assert sha256((root/path).read_bytes()).hexdigest()==record['sha256']
    print(f'- Manifest {name} source hash matches {path}.')
for record in manifest['files']:
    data=(ev/record['path']).read_bytes()
    assert len(data)==record['bytes'] and sha256(data).hexdigest()==record['sha256']
print('- Every manifest file byte count and hash matches.')
print('\n## Arithmetic inset (all eight states)\n')
print('| Domain | a | b | Feasible set | Correct theory lemma when empty |')
print('|---|---|---|---|---|')
for domain in ('reals','integers'):
    for a,b in product((False,True),repeat=2):
        if a and b:
            feasible,lemma='∅','¬a ∨ ¬b'
        elif not a and not b:
            feasible,lemma=('(0,1)','—') if domain=='reals' else ('∅','a ∨ b')
        elif a:
            feasible,lemma='x ≤ 0','—'
        else:
            feasible,lemma='x ≥ 1','—'
        # Independently check feasibility using the theory, no provider/network API.
        x=z3.Real('inset_x') if domain=='reals' else z3.Int('inset_x')
        s=z3.Solver()
        s.add((x<=0) if a else z3.Not(x<=0),(x>=1) if b else z3.Not(x>=1))
        assert (s.check()==z3.unsat)==(feasible=='∅')
        print(f'| {domain} | {a} | {b} | {feasible} | {lemma} |')
print('\nAll receipt input hashes and arithmetic inset assertions passed. Nine first queries were solved to reproduce stateful serialization; historical search counters/timings were not compared or replaced.')
