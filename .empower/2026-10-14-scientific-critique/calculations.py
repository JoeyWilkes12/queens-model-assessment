"""Read-only, standard-library audit. Writes only sibling calculation artifacts."""
from pathlib import Path
import collections, functools, hashlib, itertools, json, math, runpy, statistics

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
E = ROOT / 'public/evidence'
read = lambda p: json.loads(p.read_text())
jev = read(E/'trajectory-study.json')
subq = read(E/'subq-trajectories-summary.json')
manifest = read(E/'manifest.json')
aa = read(E/'external/aa-decision-index-2026-10-14.json')
replay = runpy.run_path(str(ROOT/'scripts/subq/replay.py'), run_name='offline_import')

def pmf(n, p):
    return [math.comb(n,k)*p**k*(1-p)**(n-k) for k in range(n+1)]

def root_increasing(fn, target):
    lo, hi = 0., 1.
    for _ in range(75):
        mid = (lo+hi)/2
        if fn(mid) < target: lo = mid
        else: hi = mid
    return (lo+hi)/2

def cp(k,n):
    lower = 0 if k==0 else root_increasing(lambda p: sum(pmf(n,p)[k:]), .025)
    upper = 1 if k==n else root_increasing(lambda p: 1-sum(pmf(n,p)[:k+1]), .975)
    return [lower,upper]

def binom_reject(d,k):
    return min(1., 2*sum(math.comb(d,i) for i in range(min(k,d-k)+1))/2**d) <= .05+1e-12

def paired_power(n,q):
    conditional=(q+.3)/(2*q)
    return sum(pd*sum(pk for k,pk in enumerate(pmf(d,conditional)) if binom_reject(d,k))
               for d,pd in enumerate(pmf(n,q)))

def fisher_power(n):
    pa,pb=pmf(n,.2),pmf(n,.5)
    answer=0.
    for total in range(2*n+1):
        lo,hi=max(0,total-n),min(n,total)
        hg={k: math.comb(n,k)*math.comb(n,total-k)/math.comb(2*n,total) for k in range(lo,hi+1)}
        for k,p in hg.items():
            pvalue=sum(z for z in hg.values() if z <= p*(1+1e-10))
            if pvalue<=.05+1e-12: answer+=pa[k]*pb[total-k]
    return answer

out={'intervals':{f'{k}/{n}':cp(k,n) for k,n in [(1,9),(2,9),(0,3),(0,6),(1,3),(2,3),(10,90),(6,6),(2,9)]}}
z80=statistics.NormalDist().inv_cdf(.8);z90=statistics.NormalDist().inv_cdf(.9)
out['normal_independent_n']={str(power):math.ceil((1.959963984540054*math.sqrt(2*.35*.65)+z*math.sqrt(.2*.8+.5*.5))**2/.3**2) for power,z in [(.8,z80),(.9,z90)]}
out['fisher_power']={str(n):fisher_power(n) for n in [39,40,44,45,50,52,58,60]}
out['paired_required_n']={str(q):{str(target):next(n for n in range(6,130) if paired_power(n,q)>=target) for target in [.8,.9]} for q in [.3,.5,.7]}

def cells(board,region):
    return [(r+1,c+1) for r,row in enumerate(board['regions']) for c,v in enumerate(row) if v==region]

def legal(board, placed, cell):
    r,c=cell
    return all(r!=s and c!=d and board['regions'][r-1][c-1]!=board['regions'][s-1][d-1]
               and max(abs(r-s),abs(c-d))>1 for s,d in placed)

baselines=[]
for board in jev['boards']:
    n=board['size'];grid=tuple(tuple(row) for row in board['regions'])
    valid=[v for v in itertools.permutations(range(1,n+1)) if len({grid[r][c-1] for r,c in enumerate(v)})==n and all(abs(v[r]-v[r+1])>1 for r in range(n-1))]
    assert len(valid)==1
    assert replay['solutions'](grid)==tuple(valid), 'Independent oracle disagreement'
    oracle=valid[0]
    for mode in ['raw','local']:
        @functools.lru_cache(None)
        def random_success(regions):
            if len(regions)==n: return 1.
            placed=[(r+1,c) for r,c in enumerate(oracle) if grid[r][c-1] in regions]
            total=0.
            for region in range(n):
                if region in regions: continue
                menu=[c for c in cells(board,region) if mode=='raw' or legal(board,placed,c)]
                total+=random_success(tuple(sorted(regions+(region,))))/len(menu)
            return total/(n-len(regions))
        p=random_success(())
        retained=next(x['uniform_random_full_solve_probability'] for x in jev['audit']['per_board'] if x['board_id']==board['id'] and x['mode']==mode)
        assert abs(p-retained)<1e-12
        # Greedy MRV: choose region with fewest locally legal cells, alphabetical ties;
        # choose first row-major legal cell, no oracle, no backtracking. Raw still uses this heuristic.
        placed=[];failure=None
        for depth in range(n):
            occupied={grid[r-1][c-1] for r,c in placed}
            menus={region:[c for c in cells(board,region) if legal(board,placed,c)] for region in range(n) if region not in occupied}
            region=min(menus,key=lambda r:(len(menus[r]),r))
            if not menus[region]: failure='empty_menu';break
            cell=menus[region][0]
            if oracle[cell[0]-1]!=cell[1]: failure='off_solution';break
            placed.append(cell)
        baselines.append({'board':board['id'],'size':n,'mode':mode,'uniform_solve':p,'greedy_solve':len(placed)==n,'greedy_correct_prefix':len(placed)})
out['baselines']=baselines
out['random_expected_solved_90']=5*sum(x['uniform_solve'] for x in baselines)

index={r['run']:r for r in manifest['records'] if r['study']=='2026-09-30-jev-trajectories'}
probability_rows=[]
for model,study,ts in [('Jev','2026-09-30-jev-trajectories',jev['trajectories']),('SubQ','2026-10-13-subq-trajectories',subq['trajectories'])]:
    group=collections.defaultdict(list)
    for t in ts: group[(t['size'],t['mode'])].append(t)
    out[model+'_survival']=[{'size':size,'mode':mode,'n':len(tt),'at_least_k':[sum(t['correct_queens_before_failure']>=k for t in tt)/len(tt) for k in range(size+1)],'mean_correct':statistics.mean(t['correct_queens_before_failure'] for t in tt),'model_calls':sum(t['http_calls'] for t in tt),'forced':sum(t['forced_decisions'] for t in tt)} for (size,mode),tt in sorted(group.items())]
    for t in ts:
        board=next(b for b in jev['boards'] if b['id']==t['board_id'])
        placed=[]
        for s in t['steps']:
            if 'cell' not in s: continue
            assert bool(s['local_violations']) == (not legal(board,placed,s['cell']))
            region=ord(s['region'])-65
            menu=[c for c in cells(board,region) if t['mode']=='raw' or legal(board,placed,c)]
            assert len(menu)==s['candidate_count']
            cid=s.get('cell_call')
            if cid:
                if model=='Jev':
                    files=index[cid]['files'];rq=read(E/files['request']);body=read(E/files['response'])
                else:
                    base=E/'runs'/study/cid;rq=read(base/'request.json');body=read(base/'response.json')
                qkey=next(iter(rq['questions']));answer=body['answers'][qkey];ps=answer['probabilities'];selected=answer['choice']
                expected=replay['expected_question'](rq,qkey,rq['questions'][qkey])['acceptable'];assert len(expected)==1
                target=expected[0]; y=int(selected==target);assert bool(y)==s['on_unique_solution']
                norm=sum(ps.values());pn={k:p/norm for k,p in ps.items()}
                sem=json.dumps({'state':rq['state'],'questions':rq['questions']},ensure_ascii=False,separators=(',',':'))
                probability_rows.append({'model':model,'board':t['board_id'],'mode':t['mode'],'step':s['step'],'payload_sha256':hashlib.sha256(sem.encode()).hexdigest(),'selected_probability':ps[selected],'correct':y,'uniform_correct':1/len(ps),'brier':sum((p-(k==target))**2 for k,p in pn.items()),'brier_raw':sum((p-(k==target))**2 for k,p in ps.items()),'selected_brier':(ps[selected]-y)**2,'logloss':-math.log(max(pn[target],1e-15)),'sum':norm,'below_max':ps[selected]<max(ps.values()),'forced':False})
            if s['on_unique_solution']:placed.append(tuple(s['cell']))
    assert all(t['correct_queens_before_failure']==sum(s.get('on_unique_solution') is True for s in t['steps']) for t in ts)

def metrics(rows):
    bins=[]
    for b in range(10):
        rr=[r for r in rows if min(9,int(r['selected_probability']*10))==b]
        if rr: bins.append({'bin':b,'n':len(rr),'p':statistics.mean(r['selected_probability'] for r in rr),'accuracy':statistics.mean(r['correct'] for r in rr)})
    return {'n':len(rows),'accuracy':statistics.mean(r['correct'] for r in rows),'mean_selected_p':statistics.mean(r['selected_probability'] for r in rows),'mean_uniform_chance_at_observed_states':statistics.mean(r['uniform_correct'] for r in rows),'selected_brier':statistics.mean(r['selected_brier'] for r in rows),'multiclass_brier_normalized':statistics.mean(r['brier'] for r in rows),'logloss_normalized':statistics.mean(r['logloss'] for r in rows),'ece10':sum(b['n']*abs(b['p']-b['accuracy']) for b in bins)/len(rows),'p_sum_minmax':[min(r['sum'] for r in rows),max(r['sum'] for r in rows)],'selected_belowmax':sum(r['below_max'] for r in rows),'bins':bins}
out['cell_calibration']={}
for model in ['Jev','SubQ']:
    rows=[r for r in probability_rows if r['model']==model]
    unique=collections.defaultdict(list)
    for r in rows: unique[r['payload_sha256']].append(r)
    # Each exact payload gets unit weight, averaging response-level scores within it.
    fields=['accuracy','mean_selected_p','selected_brier','multiclass_brier_normalized','logloss_normalized']
    summarized=[metrics(rr) for rr in unique.values()]
    out['cell_calibration'][model]={'all_calls':metrics(rows),'by_mode':{mode:metrics([r for r in rows if r['mode']==mode]) for mode in ['raw','local']},'unique_payloads':len(unique),'equal_payload_weight':{f:statistics.mean(x[f] for x in summarized) for f in fields}}

noul_rows=[]
for row in manifest['records']:
    if row['study']!='2026-09-19-jev-primitives' or not row['files'].get('response') or row['status']!='success':continue
    rq=read(E/row['files']['request']);body=read(E/row['files']['response'])
    for key,q in rq['questions'].items():
        if q['type']!='noul':continue
        ex=replay['expected_question'](rq,key,q)
        if 'truth' not in ex:continue
        p=body['answers'][key]['noul'];y=int(ex['truth'])
        noul_rows.append({'family':row['run'].split('_',1)[1],'y':y,'p':p})
out['Jev_noul']={}
for family in sorted({r['family'] for r in noul_rows}):
    rr=[r for r in noul_rows if r['family']==family]
    out['Jev_noul'][family]={'n':len(rr),'positives':sum(r['y'] for r in rr),'brier':statistics.mean((r['p']-r['y'])**2 for r in rr),'always_false_brier':statistics.mean(r['y'] for r in rr),'mean_p':statistics.mean(r['p'] for r in rr),'tp':sum(r['p']>=.5 and r['y'] for r in rr),'fp':sum(r['p']>=.5 and not r['y'] for r in rr)}

out['AA']={}
for m in aa['models']:
    if m['name'] not in ['Jev 1.13','GPT-6 Luna (Decisions)']:continue
    datasets={'pooled':m['calibrationBins'],**{k:v['calibrationBins'] for k,v in m['byDataset'].items()}}
    out['AA'][m['name']]={}
    for name,bins in datasets.items():
        n=sum(b['answers'] for b in bins)
        out['AA'][m['name']][name]={'bin_answers':n,'mean_confidence':sum(b['answers']*b['meanConfidence'] for b in bins)/n,'bin_weighted_accuracy':sum(b['answers']*b['accuracy'] for b in bins)/n,'ece':sum(b['answers']*abs(b['meanConfidence']-b['accuracy']) for b in bins)/n}

out['SubQ_split_noul']={}
split=read(E/'subq-split-summary.json')
for family in sorted({r['family'] for r in split['logical_tasks']}):
    rr=[]
    for t in split['logical_tasks']:
        if t['family']!=family:continue
        base=E/'subq-split/logical'/t['parent_call_id']
        rq=read(base/'request.json');response=read(base/'merged-response.json')
        grade=replay['grade'](rq,response)
        assert grade==t['grade']
        rr.extend(q for q in grade['questions'].values() if q['kind']=='candidate_validity')
    out['SubQ_split_noul'][family]={'n':len(rr),'positives':sum(r['truth'] for r in rr),'mean_p':statistics.mean(r['noul'] for r in rr),'brier':statistics.mean(r['brier'] for r in rr),'tp':sum(r['noul']>=.5 and r['truth'] for r in rr),'fp':sum(r['noul']>=.5 and not r['truth'] for r in rr)}
out['raw_multiclass_brier']={m:statistics.mean(r['brier_raw'] for r in probability_rows if r['model']==m) for m in ['Jev','SubQ']}

out['cost']={'headroom':4.5-.08695505-.0589824,'observed_trajectory_mean_input_tokens':statistics.mean(r['usage']['input_tokens'] for r in subq['records']),'observed_trajectory_total_cost':sum(r['usage']['input_tokens'] for r in subq['records'])*.05/1e6,'90_worst_case_calls':sum(2*t['size']-1 for t in subq['trajectories'])}
out['trace_agreement']={'Jev_mean_modal':statistics.mean(x['modal_trace_agreement'] for x in jev['audit']['per_board']),'Jev_identical_groups':sum(x['distinct_traces']==1 for x in jev['audit']['per_board'])}
(HERE/'calculation-results.json').write_text(json.dumps(out,indent=2)+'\n')
(HERE/'cell-probability-labels.json').write_text(json.dumps(probability_rows,indent=2)+'\n')
print(json.dumps({k:v for k,v in out.items() if k not in ['baselines','Jev_survival','SubQ_survival']},indent=2))
print('BASELINES',json.dumps(baselines));print('SURVIVAL',json.dumps({k:out[k] for k in ['Jev_survival','SubQ_survival']}))
