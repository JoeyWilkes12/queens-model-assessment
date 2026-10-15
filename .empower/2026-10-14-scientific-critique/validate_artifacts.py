"""Independent artifact checks; read-only source access and sibling output only."""
from pathlib import Path
from datetime import datetime
import hashlib,json,math,re

here=Path(__file__).resolve().parent
root=here.parent.parent
read=lambda p:json.loads(p.read_text())
doc=(here/'DELIVERABLE.md').read_text()
x=read(here/'calculation-results.json')
checks=[]
assert 3500<=len(doc.split())<=6000
assert all(f'## {i}.' in doc for i in range(1,9))
assert '## Calculation appendix' in doc
checks.append(f'Word count {len(doc.split())}; all eight sections and calculation appendix')
quotes=read(here/'wording-quotes.json')
assert len(quotes)==10
for q in quotes:
    assert q['quote'] in q['source_line']
    assert q['quote'] in doc
checks.append('Ten exact quotes verified against frozen source excerpts')
drift=[p for p,h in read(here/'source-hashes.json').items() if hashlib.sha256((root/p).read_bytes()).hexdigest()!=h]
checks.append('Current source drift: '+(', '.join(drift) if drift else 'none from frozen hash snapshot'))
assert abs(x['intervals']['0/3'][1]-(1-.025**(1/3)))<1e-14
assert abs(x['intervals']['6/6'][0]-.025**(1/6))<1e-14
assert .8<x['fisher_power']['44']<.81
assert .9<x['fisher_power']['58']<.91
checks.append('CP boundary intervals match closed forms; planned Fisher sample powers exceed targets')
ts=read(root/'public/evidence/trajectory-study.json')
sq=read(root/'public/evidence/subq-trajectories-summary.json')
assert sum(t['success'] for t in ts['trajectories'])==10
assert sum(t['success'] for t in sq['trajectories'])==10
assert len({t['board_id'] for t in ts['trajectories'] if t['success']})==1
assert len({t['board_id'] for t in sq['trajectories'] if t['success']})==2
assert all(not step.get('cell_call') for t in ts['trajectories'] if t['board_id']=='sequence-5-1' and t['mode']=='local' for step in t['steps'])
assert sum(any(s==1 for s in b['region_sizes'].values()) for b in ts['manifest']['generation'])==8
checks.append('10/90 totals, 1 versus 2 solved boards, forced Jev local cells, 8/9 singleton boards')
# Independent full greedy trajectories: no solution oracle, and no early oracle stopping.
solved=[]
for b in ts['boards']:
    g=b['regions'];n=b['size'];placed=[]
    for step in range(n):
        used={g[r-1][c-1] for r,c in placed}
        menus={k:[] for k in range(n) if k not in used}
        for r in range(1,n+1):
            for c in range(1,n+1):
                k=g[r-1][c-1]
                if k in menus and all(r!=a and c!=d and max(abs(r-a),abs(c-d))>1 for a,d in placed):
                    menus[k].append((r,c))
        k=min(menus,key=lambda k:(len(menus[k]),k))
        if not menus[k]:break
        placed.append(menus[k][0])
    if len(placed)==n:
        assert len({r for r,c in placed})==n
        assert len({c for r,c in placed})==n
        assert len({g[r-1][c-1] for r,c in placed})==n
        solved.append(b['id'])
assert solved==['sequence-5-1','sequence-5-3','sequence-7-1','sequence-9-2']
checks.append('Full greedy no-oracle run independently reproduces same 4/9 valid boards')
labels=read(here/'cell-probability-labels.json')
for model,n,k in [('Jev',121,41),('SubQ',120,40)]:
    rr=[r for r in labels if r['model']==model]
    assert len(rr)==n and sum(r['correct'] for r in rr)==k
    assert abs(sum(r['selected_probability'] for r in rr)/n-x['cell_calibration'][model]['all_calls']['mean_selected_p'])<1e-14
checks.append('241 cell labels reconcile to 41/121 Jev and 40/120 SubQ; selected probabilities reconcile')
assert abs(x['random_expected_solved_90']-5*sum(b['uniform_solve'] for b in x['baselines']))<1e-14
assert abs(x['cost']['headroom']-4.35406255)<1e-14
checks.append('Random expectation and ledger arithmetic reconcile')
result={'checked_at':datetime.now().astimezone().isoformat(),'passed':True,'checks':checks,'source_drift_since_snapshot':drift,'limitations':['No new inference, no browser/rendered or deployed-site validation','No external semantic review; original reports skimmed, raw evidence selected programmatically','Small generator-family corpus; descriptive calibration, not population certainty']}
(here/'validation-results.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result,indent=2))
