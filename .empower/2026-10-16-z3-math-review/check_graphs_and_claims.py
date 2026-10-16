"""Independent graph/cut and prose-counterexample checks; no project imports."""
from pathlib import Path
from collections import Counter
from itertools import product
import json

root = Path(__file__).resolve().parents[2]
read = lambda name: json.loads((root/'public/evidence/z3'/name).read_text())
t = read('teaching-data.json')
e = read('reference-trace-existence.json')
b = read('reference-trace-blocked.json')
clauses = [c['lits'] for c in e['clauses']]
print('# Graph and displayed-claim checks\n')
trail, info = [], {}
graph_map = {g['conflictSeq']:g for g in t['implicationGraphs']}
for event in e['events']:
    kind = event['kind']
    if kind in ('decide','propagate'):
        l = event['literal']
        info[l] = (event['level'], event.get('reasonClauseId'), event['seq'])
        trail.append(l)
    elif kind == 'backjump':
        trail = [l for l in trail if l not in event['removed']]
        info = {l:info[l] for l in trail}
    elif kind == 'conflict':
        g = graph_map[event['seq']]
        edges = set()
        ancestors = set()
        def expand(l):
            if l in ancestors:
                return
            ancestors.add(l)
            assert l in info
            reason = info[l][1]
            if reason is not None:
                for m in clauses[reason]:
                    if m != l:
                        edges.add((-m,l,reason))
                        expand(-m)
        for m in clauses[event['conflictClauseId']]:
            edges.add((-m,0,event['conflictClauseId']))
            expand(-m)
        assert ancestors == {x['literal'] for x in g['nodes']}
        assert edges == {(x['from'],x['to'],x['clauseId']) for x in g['edges']}
        for node in g['nodes']:
            assert (node['level'],node['reasonClauseId'],node['seq']) == info[node['literal']]
            assert node['trailPosition'] == trail.index(node['literal'])
        decision = next(l for l in trail if info[l][0] == event['level'] and info[l][1] is None)
        def reachable(start,avoid=None):
            seen = {start} if start != avoid else set()
            frontier = list(seen)
            while frontier:
                x = frontier.pop()
                for a,z,_ in edges:
                    if a == x and z != avoid and z not in seen:
                        seen.add(z)
                        frontier.append(z)
            return seen
        uips = {l for l in ancestors if info[l][0] == event['level'] and 0 not in reachable(decision,l)}
        assert uips == set(g['uips'])
        first = max(uips,key=trail.index)
        assert first == g['firstUip']
        for node,path in g['witnessPaths'].items():
            assert int(node) not in path and path[0] == decision and path[-1] == 0
            assert all(any(a==x and z==y for a,z,_ in edges) for x,y in zip(path,path[1:]))
        for u in uips:
            # Only current-level descendants enter the conflict side.
            side = reachable(u)-{u}
            side = {x for x in side if x==0 or info[x][0] == event['level']}
            crossing = {a for a,z,_ in edges if z in side and a not in side}
            cut = {-x for x in crossing}
            assert cut == set(g['cutClauses'][str(u)])
            if u == first:
                assert cut == set(clauses[e['events'][event['seq']+1]['learnedClauseId']])
        print(f'- Event {event["seq"]}: {len(ancestors)} ancestor assignments, {len(edges)} reason/conflict edges; UIPs {g["uips"]}; first UIP {first}; all cuts and avoiding paths agree.')

print('\n## Caption and mathematical counterexamples\n')
first = t['propagation']['runs'][2]['steps'][0]
assert first['literal'] == -1
print('- Default propagation Figure 3.1, step 1: trail literal -1 means q11=false and ¬q11=true. Current template prints “¬q11 becomes false”.')
for trace in (e,b):
    negatives = sum(x['kind']=='propagate' and x['literal']<0 for x in trace['events'])
    blocker_props = [x['seq'] for x in trace['events'] if x.get('reasonClauseId') == trace.get('blockerId',-1)]
    print(f'- {trace["query"]}: {negatives} negative propagation events receive the inverted visible value in CDCLPlayer; blocker used as reason at events {blocker_props}.')
assert all(x['literal']<0 for x in t['propagation']['inset5']['steps'][1:])
print('- 5×5 inset: singleton q15 is true, followed by nine negative assignments; the exclusion count is correct.')
# F=(a∨b), a=1, b=2. A clause can stop being unit when a literal becomes true.
F = [1,2]
M, Mp = {-1}, {-1,2}
unit = lambda C,A: not(set(C)&A) and len([l for l in C if -l not in A])==1
assert unit(F,M) and not unit(F,Mp)
print('- Propagation proof counterexample: (a∨b) is unit under {¬a}, satisfied and nonunit under {¬a,b}; unit-clause status is not monotone under extension.')
# One false variable satisfies every negative binary containing it.
C = next(c for c in clauses[:513] if -15 in c and len(c)==2)
assert len([l for l in C if abs(l)!=15])==1
print(f'- Chapter 7 counterexample to “every clause has at least two open literals”: {C} is already satisfied under ¬q31 and has one open literal.')
# Sinz one-way AMO versus EO scope.
def chain_ok(xs,ss):
    m=len(xs)
    return ((not xs[0] or ss[0]) and (not xs[-1] or not ss[-1])
        and all((not xs[i] or ss[i]) and (not ss[i-1] or ss[i]) and (not xs[i] or not ss[i-1]) for i in range(1,m-1)))
amo = []
eo = []
for xs in product((False,True),repeat=7):
    for ss in product((False,True),repeat=6):
        if chain_ok(xs,ss):
            amo.append((xs,ss))
            if any(xs):
                eo.append((xs,ss))
assert all(all(ss[i] == any(xs[:i+1]) for i in range(6)) for xs,ss in eo)
assert any(any(ss[i] != any(xs[:i+1]) for i in range(6)) for xs,ss in amo)
print('- Sinz s_i is exactly prefix OR under the full EO encoding (7 models), but not under AMO alone. The chapter’s EO example is correct; clarify its scope only if changing its AMO wording.')
# Learned unit and decision cut are logically incomparable outside F.
cut = next(g for g in t['implicationGraphs'] if g['conflictSeq']==126)['cutClauses']['2']
assert cut == [1,-2]
def holds(C,assignment):
    return any(assignment[abs(l)]==(l>0) for l in C)
A={1:False,2:True,14:False}
B={1:True,2:True,14:True}
assert holds([-14],A) and not holds(cut,A)
assert holds(cut,B) and not holds([-14],B)
print('- The event-126 clauses ¬q27 and (q11∨¬q12) do not imply one another as standalone formulas; “says less” is not a logical-strength comparison.')

print('\n## Proof DAG counts\n')
derivations = {}
for trace in (e,b):
    for event in trace['events']:
        if event['kind']=='learn':
            derivations[event['learnedClauseId']]=event
root_id=b['events'][-2]['learnedClauseId']
seen, inputs, learned = set(),set(),set()
def leaves(cid):
    if cid in seen:
        return
    seen.add(cid)
    if cid not in derivations:
        inputs.add(cid)
    else:
        learned.add(cid)
        x=derivations[cid]
        leaves(x['conflictClauseId'])
        for step in x['resolution']:
            leaves(step['parentClauseId'])
leaves(root_id)
assert b['blockerId'] in inputs
print(f'- Empty clause #{root_id}, learned at blocked event {b["events"][-2]["seq"]}: {len(inputs)-1} original input leaves plus blocker; {len(learned)} learned clause nodes; final resolution chain {len(b["events"][-2]["resolution"])} steps.')
print('\nAll graph and counterexample assertions passed.')
