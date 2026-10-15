# Reference CDCL trace generator (design validation prototype)

This is a real run of a small CDCL algorithm over a pairwise CNF of the book's board, **not a Z3 search trace**. It uses full clause scans, first-unassigned positive decisions, no restarts, no deletion, and first-UIP resolution/backjumping. The production UI can replay its checked events or port this kernel to TypeScript. It is intentionally transparent rather than optimized.

```python
import ast, re, json
from pathlib import Path
from itertools import combinations

src = Path('../../src/App.tsx').read_text()
p = src.split('  seven: {',1)[1].split('  },',1)[0]
R = ast.literal_eval(re.search(r'regions: (\[.*?\n    \])',p,re.S)[1])
n = len(R)
v = lambda r,c: r*n+c+1
clauses=[]; provenance=[]; index={}
def add(C, source):
    C=sorted(set(C), key=lambda x:(abs(x),x<0)); key=tuple(C)
    if key not in index:
        index[key]=len(clauses); clauses.append(C); provenance.append([source])
    else: provenance[index[key]].append(source)
    return index[key]
groups=[('row:'+str(r+1),[v(r,c) for c in range(n)]) for r in range(n)]
groups += [('column:'+str(c+1),[v(r,c) for r in range(n)]) for c in range(n)]
groups += [('region:'+k,[v(r,c) for r in range(n) for c in range(n) if R[r][c]==k])
           for k in sorted(set(sum(R,[])))]
for name,U in groups:
    add(U,name+':ALO')
    for a,b in combinations(U,2):add([-a,-b],name+':AMO')
for r in range(n-1):
    for c in range(n):
        for dc in (-1,1):
            if 0<=c+dc<n:add([-v(r,c),-v(r+1,c+dc)],'touching')
original=len(clauses)

def run(blocker=None):
    if blocker is not None:add(blocker,'blocker')
    val={}; level={}; reason={}; trail=[]; events=[]; dl=0; learned=[]
    def emit(kind,**kw):events.append({'kind':kind,'level':dl,'trail':list(trail),**kw})
    def enqueue(lit,why):
        var=abs(lit); assert var not in val
        val[var]=lit>0; level[var]=dl; reason[var]=why; trail.append(lit)
        emit('decide' if why is None else 'propagate',lit=lit,reason=why)
    def value(lit):
        return None if abs(lit) not in val else val[abs(lit)]==(lit>0)
    def propagate():
        while True:
            changed=False
            for cid,C in enumerate(clauses):
                if any(value(l) is True for l in C):continue
                U=[l for l in C if value(l) is None]
                if not U:return cid
                if len(U)==1:enqueue(U[0],cid);changed=True
            if not changed:return None
    while True:
        conflict=propagate()
        if conflict is not None:
            emit('conflict',clause=conflict)
            C=set(clauses[conflict]); steps=[]
            while sum(level[abs(l)]==dl for l in C) > (1 if dl else 0):
                lit=next(l for l in reversed(trail) if -l in C and level[abs(l)]==dl)
                rid=reason[abs(lit)]; assert rid is not None
                C=(C-{-lit}) | (set(clauses[rid])-{lit})
                assert not any(-x in C for x in C)
                steps.append({'pivot':abs(lit),'reason':rid,'resolvent':sorted(C)})
            cid=add(C,'learned')
            learned.append({'id':cid,'from':conflict,'steps':steps})
            emit('learn',clause=cid,resolution=steps)
            if dl==0:
                assert not C;emit('unsat');return events,learned,None
            current=next(l for l in C if level[abs(l)]==dl)
            back=max([level[abs(l)] for l in C if l!=current], default=0)
            removed=[l for l in trail if level[abs(l)]>back]
            for lit in removed:
                var=abs(lit);del val[var];del level[var];del reason[var]
            trail[:]=[l for l in trail if abs(l) in val]
            dl=back;emit('backjump',target=back,removed=removed)
        else:
            if len(val)==n*n:
                emit('sat');return events,learned,dict(val)
            dl+=1;enqueue(next(i for i in range(1,n*n+1) if i not in val),None)

events,learned,model=run()
assert model
first_clause_count=len(clauses)
blocker=[-i if model[i] else i for i in sorted(model)]
unique_events,unique_learned,_=run(blocker)
print(json.dumps({'board':'seven','encoding':'deduplicated-pairwise-plus-diagonal',
 'engine':'reference-cdcl-full-scan-v1','not_z3_trace':True,'original_count':original,
 'first_clause_count':first_clause_count,'clauses':clauses,'provenance':provenance,
 'events':events,'learned':learned,'model':model,'blocker':blocker,
 'uniqueness_events':unique_events,'uniqueness_learned':unique_learned},indent=2))
```

Acceptance: replay every reason at its exact enqueue boundary; verify it has one unassigned literal and all others false. Recompute every displayed resolvent; verify learned clauses against the original CNF with a separate Z3 call; validate SAT placement geometrically; verify final root-conflict resolution to the empty clause for the blocked instance. Retaining first-run learned clauses in the uniqueness run is sound because they are consequences of the unblocked formula. Source clause IDs in this prototype are zero-based.
