"""Independent, read-only review of the Queens evidence. No generator imports.

Run with PYTHONDONTWRITEBYTECODE=1 and the authorized Z3 Python interpreter.
All output goes to stdout; redirect it inside this artifact directory.
"""
from pathlib import Path
from itertools import combinations, permutations, product
from collections import Counter
from math import comb, factorial
import hashlib
import json

ROOT = Path(__file__).resolve().parents[2]
EVIDENCE = ROOT / 'public/evidence/z3'
read = lambda name: json.loads((EVIDENCE / name).read_text())
t = read('teaching-data.json')
e = read('reference-trace-existence.json')
b = read('reference-trace-blocked.json')
receipts = read('z3-receipts.json')
board = json.loads((ROOT / 'src/z3/board-seven.json').read_text())
regions = board['regions']
n = len(regions)
v = lambda r, c: r * n + c + 1
key = lambda l: (abs(l), l < 0)
canon = lambda lits: tuple(sorted(set(lits), key=key))

print('# Independent recomputations\n')
print('No project generator/kernel is imported. All assertions below passed if the script exits 0.\n')
print('## Counts and bindings\n')
for rb in receipts['boards']:
    rr = rb['regions']
    nn = len(rr)
    valid, local, regional = [], 0, 0
    for p in permutations(range(nn)):
        # Independent pairwise cell test, including every pair, not just adjacent rows.
        touch = any(max(abs(i-j), abs(p[i]-p[j])) == 1 for i,j in combinations(range(nn),2))
        reg_ok = len({rr[i][p[i]] for i in range(nn)}) == nn
        local += not touch
        regional += reg_ok
        if not touch and reg_ok:
            valid.append([x+1 for x in p])
    assert len(valid) == 1
    assert all(run['modelColumns'] == valid[0] for run in rb['runs'])
    implications = sum(max(abs(r-s), abs(c-d)) == 1
        for r,c in product(range(nn), repeat=2)
        for s,d in product(range(nn), repeat=2))
    assert implications == 4*nn*(nn-1)+4*(nn-1)**2
    assert all(run['assertions'] == implications+3*nn for run in rb['runs'])
    print(f'- {nn}×{nn}: {factorial(nn):,} permutations; {local:,} non-touching; '
          f'{regional:,} region-valid permutations; sole solution {valid[0]}; '
          f'{implications} directed neighbour assertions + {3*nn} equations = {implications+3*nn}.')
    if nn == 7:
        assert local == int(t['funnel']['stages'][3]['count']) == 646
        assert regional == t['funnel']['regionalPermutations']
assert [int(x['count']) for x in t['funnel']['stages']] == [2**49, 7**7, 5040, 646, 1]
print(f'- 2^49 = {2**49:,}; 7^7 = {7**7:,}; 7! = {factorial(7):,}.')
assert hashlib.sha256(json.dumps(regions).encode()).hexdigest() == board['partitionSha256']

groups = [(f'row:{r+1}', [v(r,c) for c in range(n)]) for r in range(n)]
groups += [(f'column:{c+1}', [v(r,c) for r in range(n)]) for c in range(n)]
labels = sorted(set(sum(regions, [])))
groups += [(f'region:{s}', [v(r,c) for r,c in product(range(n),repeat=2) if regions[r][c] == s]) for s in labels]
db, sources, counts, new_counts = [], [], Counter(), Counter()
index = {}
def add(lits, source):
    family = source.split(':')[0]
    counts[family] += 1
    clause = canon(lits)
    if clause not in index:
        index[clause] = len(db)
        db.append(clause)
        sources.append([])
        new_counts[family] += 1
    sources[index[clause]].append(source)
for name, cells in groups:
    add(cells, name+':ALO')
    for x,y in combinations(cells,2):
        add([-x,-y], name+':AMO')
for r in range(n-1):
    for c in range(n):
        for cc in (c-1,c+1):
            if 0 <= cc < n:
                add([-v(r,c),-v(r+1,cc)], f'touching:r{r+1}c{c+1}-r{r+2}c{cc+1}')
assert db == [tuple(c['lits']) for c in e['clauses'][:513]]
assert sources == [c['sources'] for c in e['clauses'][:513]]
assert sum(counts.values()) == 664 and len(db) == 513
print(f'- CNF generated = {sum(counts.values())}, distinct = {len(db)}, repeats = {sum(counts.values())-len(db)}. Family generated/new: {dict((k,(counts[k],new_counts[k])) for k in counts)}.')
dimacs = f'p cnf 49 {len(db)}\n' + ''.join(' '.join(map(str,c))+' 0\n' for c in db)
assert hashlib.sha256(dimacs.encode()).hexdigest() == e['cnfSha256']

def encode(m, kind):
    cells = list(range(1,m+1))
    if kind == 'pairwise':
        return [cells]+[[-a,-b] for a,b in combinations(cells,2)], 0
    if kind == 'sequential':
        if m == 1:
            return [[1]], 0
        clauses = [cells, [-1,m+1], [-m,-(2*m-1)]]
        for i in range(2,m):
            clauses += [[-i,m+i],[-(m+i-1),m+i],[-i,-(m+i-1)]]
        return clauses, m-1
    clauses, next_id = [], m+1
    def recurse(xs):
        nonlocal next_id
        if len(xs) <= 3:
            clauses.append(xs)
            clauses.extend([[-a,-b] for a,b in combinations(xs,2)])
            return
        commanders = []
        for start in range(0,len(xs),3):
            chunk = xs[start:start+3]
            commander = next_id
            next_id += 1
            commanders.append(commander)
            clauses.extend([[-a,-b] for a,b in combinations(chunk,2)])
            clauses.extend([[-x,commander] for x in chunk])
            clauses.append([-commander]+chunk)
        recurse(commanders)
    recurse(cells)
    return clauses, next_id-m-1

def up(clauses, assumptions=(), reverse=False):
    assigned = set(assumptions)
    assert not any(-l in assigned for l in assigned)
    order = list(range(len(clauses)))
    if reverse:
        order.reverse()
    steps = []
    while True:
        changed = False
        for cid in order:
            clause = clauses[cid]
            if any(l in assigned for l in clause):
                continue
            remaining = [l for l in clause if -l not in assigned]
            if not remaining:
                return assigned, steps, cid
            if len(remaining) == 1:
                lit = remaining[0]
                assigned.add(lit)
                steps.append({'literal':lit,'reasonClauseId':cid})
                changed = True
        if not changed:
            return assigned, steps, None

# Independent recursive SAT extension check after UP, rather than generator's auxiliary enumeration.
def sat(clauses, assumptions=()):
    assigned, _, conflict = up(clauses, assumptions)
    if conflict is not None:
        return False
    open_vars = {abs(l) for c in clauses if not any(l in assigned for l in c) for l in c if -l not in assigned}
    if not open_vars:
        return True
    x = min(open_vars)
    return sat(clauses, (*assigned,x)) or sat(clauses, (*assigned,-x))

print('\n## Encodings\n')
print('| m | Pairwise clauses/aux/literals | Sinz clauses/aux/literals | Commander clauses/aux/literals |')
print('|---:|---:|---:|---:|')
for row in t['encodings']['sizes']:
    m = row['m']
    results = []
    for name in ('pairwise','sequential','commander'):
        clauses, aux = encode(m,name)
        got = {'clauses':len(clauses),'aux':aux,'literalOccurrences':sum(map(len,clauses)),'variables':m+aux}
        assert got == row[name], (m,name,got,row[name])
        results.append('/'.join(str(got[k]) for k in ('clauses','aux','literalOccurrences')))
        if m <= 9:
            for xs in product((False,True), repeat=m):
                assert sat(clauses, [i+1 if x else -(i+1) for i,x in enumerate(xs)]) == (sum(xs) == 1)
    print(f'| {m} | '+ ' | '.join(results)+' |')
print(f'\n- Exhaustive checks of all input assignments for all three encodings, m=1…9: {3*sum(2**m for m in range(1,10)):,}; auxiliary encodings alone: {2*sum(2**m for m in range(1,10)):,}.')
for name in ('pairwise','sequential','commander'):
    total_c = sum(len(encode(len(cells),name)[0]) for _,cells in groups)
    total_a = sum(encode(len(cells),name)[1] for _,cells in groups)
    assert {'clauses':total_c,'aux':total_a} == t['encodings']['boardTotals'][name]
    print(f'- All 21 groups {name}: {total_c} clauses, {total_a} auxiliaries (before cross-group deduplication).')
print('- Region sizes: '+', '.join(f'{name.split(":")[1]}={len(cells)}' for name,cells in groups if name.startswith('region:'))+'.')

print('\n## Propagation and traces\n')
conflicts = 0
for run in t['propagation']['runs']:
    assigned,steps,conflict = up(db,[run['decision']])
    assert steps == run['steps'] and conflict == run['conflictClauseId']
    assert 49-len(assigned) == run['unassignedAfter']
    assert (conflict is not None) == (run['status']=='conflict')
    conflicts += conflict is not None
    reverse_assigned,_,reverse_conflict = up(db,[run['decision']],True)
    assert (conflict is None) == (reverse_conflict is None)
    if conflict is None:
        assert assigned == reverse_assigned
print(f'- Recomputed all 49 propagation runs exactly: {conflicts} conflict, {49-conflicts} fixed point. Reverse clause order gives the same outcome; nonconflicting closures agree.')
assert up(db,[-15])[0] == {-15}
print('- From ¬q31 (literal -15), UP adds zero literals.')
q12 = t['propagation']['runs'][1]
print(f'- From q12, q31 becomes true at step {next(i+1 for i,s in enumerate(q12["steps"]) if s["literal"] == 15)}.')

def replay_check(trace):
    clauses = [tuple(c['lits']) for c in trace['clauses']]
    available = set(trace['initialClauseIds'])
    trail, values, snapshots = [], {}, {}
    level, previous_learn, rup_count, resolution_count = 0, None, 0, 0
    for seq,event in enumerate(trace['events']):
        assert event['seq'] == seq
        kind = event['kind']
        if kind in ('decide','propagate'):
            lit = event['literal']
            assert abs(lit) not in values
            if kind == 'decide':
                closed,_,con = up([clauses[c] for c in sorted(available)], trail)
                assert con is None and closed == set(trail)
                level += 1
                snapshots[level] = list(trail)
                reason = None
            else:
                reason = event['reasonClauseId']
                assert reason in available and lit in clauses[reason]
                assert all(-x in trail for x in clauses[reason] if x != lit)
            assert event['level'] == level
            values[abs(lit)] = (lit,level,reason)
            trail.append(lit)
        elif kind == 'conflict':
            assert all(-x in trail for x in clauses[event['conflictClauseId']])
        elif kind == 'learn':
            acc = set(clauses[event['conflictClauseId']])
            for step in event['resolution']:
                last = next(x for x in reversed(trail) if -x in acc and values[abs(x)][1] == level)
                assert step['pivot'] == abs(last) and step['parentClauseId'] == values[abs(last)][2]
                parent = clauses[step['parentClauseId']]
                assert last in parent
                acc = (acc-{-last}) | (set(parent)-{last})
                assert canon(acc) == tuple(step['result'])
                resolution_count += 1
            lid = event['learnedClauseId']
            assert canon(acc) == clauses[lid] and lid not in available
            assert all(-x in trail for x in acc)
            assert sum(values[abs(x)][1] == level for x in acc) == (1 if level else 0)
            # Check each learned clause by RUP against preceding database.
            assert up([clauses[c] for c in sorted(available)], [-x for x in clauses[lid]])[2] is not None
            rup_count += 1
            previous_learn = acc
            available.add(lid)
        elif kind == 'backjump':
            curr = next(x for x in previous_learn if values[abs(x)][1] == level)
            target = max((values[abs(x)][1] for x in previous_learn if x != curr), default=0)
            assert target == event['targetLevel'] == event['level']
            assert event['removed'] == [x for x in trail if values[abs(x)][1] > target]
            trail = [x for x in trail if values[abs(x)][1] <= target]
            assert trail == snapshots[target+1]
            values = {abs(x):values[abs(x)] for x in trail}
            level = target
            assert [x for x in previous_learn if -x not in trail] == [curr]
        elif kind == 'sat':
            assert len(trail) == 49 and all(any(x in trail for x in clauses[c]) for c in available)
        elif kind == 'unsat':
            assert level == 0 and previous_learn == set()
    print(f'- {trace["query"]}: {len(trace["events"])} events, {resolution_count} independently checked resolution steps, {rup_count} learned clauses independently RUP-checked; terminal {trace["events"][-1]["kind"].upper()}.')
replay_check(e)
replay_check(b)
print('- Events 66 and 126: '+str([e['events'][x] for x in (66,126)])+'.')
print('- Clauses 295–297, 477, 517: '+str({i:e['clauses'][i]['lits'] for i in (295,296,297,477,517)})+'.')
print('- Event 127 resolution: '+str(e['events'][127]['resolution'])+'.')

print('\n## Hall abstraction\n')
by_region = {s:[(r+1,c+1) for r,c in product(range(n),repeat=2) if regions[r][c] == s] for s in labels}
for name,mask in t['confinement']['masks'].items():
    candidates = {s:[x for x in by_region[s] if list(x) not in mask['removedCells']] for s in labels}
    matching_count, used = 0,set()
    def dfs(i,rows,chosen):
        global matching_count
        if i == len(labels):
            matching_count += 1
            used.update(chosen)
            return
        for cell in candidates[labels[i]]:
            if cell[0] not in rows:
                dfs(i+1,rows|{cell[0]},chosen+[cell])
    dfs(0,set(),[])
    assert matching_count == mask['matchingCount'] and len(used) == mask['cellsUsedByAMatching']
    for subset in mask['subsets']:
        K = set(subset['regions'])
        rows = {r for s in K for r,c in candidates[s]}
        assert sorted(rows) == subset['rows']
        status = 'deficient' if len(rows)<len(K) else 'tight' if len(rows)==len(K) else 'slack'
        assert status == subset['status']
        if status == 'tight':
            excluded = sorted(cell for s in labels if s not in K for cell in candidates[s] if cell[0] in rows)
            assert [list(x) for x in excluded] == subset['excluded'] and not (set(excluded)&used)
    print(f'- Mask {name}: {matching_count:,} selections of one cell per region in distinct rows; {len(used)} cells used by some selection; all 127 nonempty region subsets checked.')
highlight = t['confinement']['highlight']
print(f'- Under ¬q31, K={{A,B}}, N(K)={{1,2}}, exclusions {highlight["excluded"]}.')
counter = t['confinement']['matchingCounterexample']
column_counts = Counter(c for r,c in counter['cells'])
print(f'- Counterexample cells {counter["cells"]}; repeated columns with multiplicity {dict((c,k) for c,k in column_counts.items() if k>1)}.')

print('\n## Engine receipts\n')
for rb in receipts['boards']:
    for run in rb['runs']:
        for check in run['checks']:
            s = check['statistics']
            if any(k.startswith('sat ') and any(w in k for w in ('decisions','conflicts','propagations')) for k in s):
                d,c = s.get('sat decisions'),s.get('sat conflicts')
                p = s.get('sat propagations 2ary',0)+s.get('sat propagations nary',0)
            else:
                d,c,p = s.get('decisions'),s.get('conflicts'),s.get('propagations')
            print(f'- {rb["id"]}/{run["mode"]}/{check["query"]}: {check["result"]}, D{d}/C{c}/P{p}; {check["engine"]["id"]}; cumulative flag={check["countersCumulativeWithFirst"]}; quiet/loud search counters match={check["verboseRunCountersMatch"]}.')
            if rb['id']=='nine' and run['mode']=='default' and check['query']=='first':
                print('  - Last route lines: '+str(check['route']['lines'][-5:]))
print('\nAll independent assertions passed.')
