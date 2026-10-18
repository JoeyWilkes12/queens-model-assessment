#!/usr/bin/env python3
"""Build public/evidence/scoreboard.json for the executive-summary charts.

Every value is derived from published evidence files; nothing is typed in by
hand. Run from the repository root:

    python3 -I scripts/analysis/build_scoreboard.py

Offline, standard library only. The SubQ panel section is included when
public/evidence/subq-panel/trajectories-summary.json exists.
"""
from pathlib import Path
import datetime, itertools, json, sys

sys.path.insert(0, str(Path(__file__).resolve().parent))
import openrouter_costs as OC  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
E = ROOT / 'public/evidence'
SIZES = {'queens-5-easy': 5, 'queens-7-medium': 7, 'queens-9-hard': 9}

AUTHORS = {
    'openai': ('OpenAI', 'openai.svg'),
    'anthropic': ('Anthropic', 'anthropic.svg'),
    'google': ('Google', 'google-gemini.svg'),
    'x-ai': ('xAI', 'xai.png'),
    'typesafe': ('TypeSafe', 'typesafe.png'),
    'subquadratic': ('Subquadratic', 'subquadratic.svg'),
}
DISPLAY = {
    'openai/gpt-5.6-sol': 'GPT-5.6 Sol', 'anthropic/claude-opus-4.8': 'Claude Opus 4.8',
    'google/gemini-3.1-pro-preview': 'Gemini 3.1 Pro Preview', 'x-ai/grok-4.6': 'Grok 4.6',
    'openai/gpt-5.5': 'GPT-5.5', 'openai/gpt-5.4': 'GPT-5.4', 'openai/gpt-5': 'GPT-5', 'openai/gpt-4.1': 'GPT-4.1',
    'openai/gpt-5.2': 'GPT-5.2', 'openai/gpt-5.1': 'GPT-5.1', 'openai/gpt-4o-2024-11-20': 'GPT-4o (2024-11-20)',
    'anthropic/claude-opus-4.7': 'Claude Opus 4.7', 'anthropic/claude-opus-4.6': 'Claude Opus 4.6',
    'anthropic/claude-opus-4.5': 'Claude Opus 4.5', 'anthropic/claude-sonnet-4.5': 'Claude Sonnet 4.5',
    'anthropic/claude-sonnet-4': 'Claude Sonnet 4', 'google/gemini-2.5-pro': 'Gemini 2.5 Pro',
    'google/gemini-2.5-flash': 'Gemini 2.5 Flash', 'google/gemini-2.5-flash-lite': 'Gemini 2.5 Flash-Lite',
}


def load(name):
    return json.loads((E / name).read_text())


def author(model_id):
    key = model_id.split('/')[0]
    name, logo = AUTHORS[key]
    return {'author': name, 'logo': f'assets/logos/{logo}'}


def outcome(strict, written, answered=True):
    if not answered:
        return 'no_answer'
    return 'strict' if strict else 'format_only' if written else 'wrong'


def llm_section():
    manifest = [r for r in load('manifest.json')['records'] if r.get('study') == '2026-09-17-one-shot']
    grades = {g['call_id']: g for g in load('grades/2026-09-17-one-shot/grades.json')['attempts']}
    diag = {d['call_id']: d for d in load('one-shot-format-diagnostics.json')['records']}
    models = {}
    for record in manifest:
        run = record['run']
        # The scored Grok route is Bedrock; the default-route 5×5 call was a routing error, and
        # its 7×7/9×9 default-route calls were never sent. Those are retained but not scored.
        if record['model'] == 'x-ai/grok-4.6' and not run.endswith('_bedrock'):
            continue
        size = SIZES[record['board']]
        grade = grades.get(run, {})
        answered = record.get('assessmentOutcome') != 'request_failure'
        strict = bool(grade.get('correct')) and bool(grade.get('format_valid'))
        written = bool(diag.get(run, {}).get('rule_valid_after_extraction'))
        entry = models.setdefault(record['model'], {
            'id': record['model'], 'name': DISPLAY[record['model']], **author(record['model']),
            'cohort': 'frontier', 'study': '2026-09-17-one-shot', 'boards': {}, 'notes': []})
        entry['boards'][str(size)] = {'issued': 1, 'outcome': outcome(strict, written, answered),
                                      'receipt': record['id']}
        if not answered:
            entry['notes'].append(f'{size}×{size}: request timed out after 600 s with no answer; not retried.')
    if 'x-ai/grok-4.6' in models:
        models['x-ai/grok-4.6']['notes'].append('Routed through Amazon Bedrock after the default route failed on 5×5 (routing error, not scored).')

    earlier = load('earlier-generations-summary.json')
    tested = {m['model'] for m in earlier['models']}
    for m in earlier['models']:
        entry = {'id': m['model'], 'name': DISPLAY.get(m['model'], m['model']), **author(m['model']),
                 'cohort': 'earlier', 'study': '2026-10-01-earlier-generations', 'boards': {}, 'notes': []}
        for b in m['boards']:
            size = SIZES[b['board_id']]
            entry['boards'][str(size)] = {'issued': 1, 'outcome': outcome(b['strict_correct'], b['written_correct']),
                                          'receipt': f"2026-10-01-earlier-generations:{b['call_id']}"}
        models[m['model']] = entry
    scheduled = {r['model'] for r in load('manifest.json')['records'] if r.get('study') == '2026-10-01-earlier-generations'}
    not_run = [{'id': mid, 'name': DISPLAY.get(mid, mid), **author(mid),
                'reason': 'Scheduled in the adaptive replay but not run: the family stop rule ended that family first.'}
               for mid in sorted(scheduled - tested)]
    rerun_dir = E / 'runs/2026-10-16-one-shot-rerun'
    for directory in sorted(rerun_dir.glob('*')) if rerun_dir.exists() else []:
        meta = json.loads((directory / 'metadata.json').read_text())
        grade = json.loads((directory / 'grade.json').read_text())
        diag = json.loads((directory / 'diagnostic.json').read_text())
        if 'grok' in directory.name and 'x-ai/grok-4.6' in models:
            result = outcome(grade.get('correct') and grade.get('format_valid'), diag.get('rule_valid_after_extraction'), meta.get('http_status') == 200)
            models['x-ai/grok-4.6']['rerun'] = {'size': '7', 'outcome': result, 'date': '2026-10-16',
                                                'receipt': f'2026-10-16-one-shot-rerun:{directory.name}'}
            models['x-ai/grok-4.6']['notes'].append(f'7×7 re-run on 16 Oct with the identical request: {result.replace("_", " ")}; the chart keeps the original timeout as recorded.')
    order = ['frontier', 'earlier']
    return {'unit': 'boards with a correct full placement', 'boards': [5, 7, 9],
            'models': sorted(models.values(), key=lambda m: (order.index(m['cohort']), m['name'])),
            'not_run': not_run, 'panel': llm_panel()}


def llm_panel():
    path = E / 'frontier-image-panel/summary.json'
    if not path.exists():
        return {'status': 'running', 'boards': [], 'models': []}
    summary = json.loads(path.read_text())
    boards, models = {}, {}
    sources = [('frontier', summary)]
    legacy_path = E / 'legacy-panel/summary.json'
    legacy = json.loads(legacy_path.read_text()) if legacy_path.exists() else None
    if legacy:
        sources.append(('earlier', legacy))
    for cohort, source in sources:
        for row in source['rows']:
            boards[row['board_id']] = row['size']
            entry = models.setdefault(row['model'], {'id': row['model'], 'name': DISPLAY[row['model']], **author(row['model']),
                                                     'cohort': cohort, 'study': source['study'], 'route': row['route'], 'boards': {}})
            entry['boards'][row['board_id']] = row.get('outcome', 'not_run')
    complete = all(o != 'not_run' for m in models.values() for o in m['boards'].values())
    reruns = [{'model': DISPLAY[r['model']], 'size': r['size'], 'board_id': r['board_id'], 'outcome': r['outcome'], 'reason': r['reason'],
               'receipt': f"{summary['study']}:{r['call_id']}_rerun-2026-10-16"} for r in summary.get('reruns', [])]
    retired = [{'id': mid, 'name': DISPLAY.get(mid, mid), **author(mid), 'reason': 'Tested on 1 October, but OpenRouter no longer serves it (no endpoint on 17 October).'}
               for mid in (legacy or {}).get('retired', {}).values()]
    return {'status': 'complete' if complete else 'partial', 'study': summary['study'], 'reruns': reruns, 'retired': retired,
            'earlier_study': legacy['study'] if legacy else None, 'earlier_amendments': (legacy or {}).get('amendments', []),
            'boards': [{'id': b, 'size': s} for b, s in sorted(boards.items(), key=lambda kv: (kv[1], kv[0]))],
            'models': sorted(models.values(), key=lambda m: m['name'])}


def solutions(regions):
    n = len(regions)
    return [p for p in itertools.permutations(range(n))
            if all(abs(p[i] - p[i + 1]) > 1 for i in range(n - 1)) and len({regions[i][p[i]] for i in range(n)}) == n]


def greedy(regions):
    n = len(regions)
    sol = solutions(regions)
    assert len(sol) == 1
    truth = {(r, sol[0][r]) for r in range(n)}
    placed, used = [], set()
    legal = lambda r, c: all(r != a and c != b and max(abs(r - a), abs(c - b)) > 1 for a, b in placed)
    while len(placed) < n:
        menus = {k: [(r, c) for r in range(n) for c in range(n) if regions[r][c] == k and legal(r, c)]
                 for k in sorted({x for row in regions for x in row}) if k not in used}
        k = min(menus, key=lambda key: (len(menus[key]), key))
        if not menus[k] or menus[k][0] not in truth:
            return False
        placed.append(menus[k][0]); used.add(k)
    return True


def decision_original():
    jev = load('trajectory-study.json')
    subq = load('subq-trajectories-summary.json')
    boards = [{'id': b['id'], 'size': b['size']} for b in jev['boards']]
    random_p = {(p['board_id'], p['mode']): p['uniform_random_full_solve_probability'] for p in jev['audit']['per_board']}

    def per_board(trajectories):
        out = {}
        for t in trajectories:
            cell = out.setdefault(t['board_id'], {'raw': [0, 0], 'local': [0, 0]})
            cell[t['mode']][1] += 1
            cell[t['mode']][0] += int(bool(t['success']))
        return out

    models = [
        {'name': 'Jev 1.13', **author('typesafe/jev'), 'study': '2026-09-30-jev-trajectories',
         'per_board': per_board(jev['trajectories']), 'calls': jev['audit']['calls'],
         'attempts_per_board_mode': 5},
        {'name': 'SubQ Snap (preview)', **author('subquadratic/snap'), 'study': '2026-10-13-subq-trajectories',
         'per_board': per_board(subq['trajectories']), 'calls': subq['model_calls'],
         'attempts_per_board_mode': 5},
    ]
    regions = {b['id']: b['regions'] for b in jev['boards']}
    baselines = {
        'greedy': {b['id']: greedy(regions[b['id']]) for b in boards},
        'random_expected_any': {b['id']: 1 - (1 - random_p[(b['id'], 'raw')]) ** 5 * (1 - random_p[(b['id'], 'local')]) ** 5 for b in boards},
    }
    return {'label': 'Original nine boards', 'boards': boards, 'models': models, 'baselines': baselines,
            'pending': []}


def decision_panel():
    path = E / 'subq-panel/trajectories-summary.json'
    corpus = load('subq-panel/corpus.json')
    boards = [{'id': b['id'], 'size': b['size']} for b in corpus['boards']]
    baselines = {
        'greedy': {b['id']: bool(b['profile']['greedy']['solved']) for b in corpus['boards']},
        'random_expected_any': {b['id']: 1 - (1 - b['profile']['uniform_random_completion']['raw']) * (1 - b['profile']['uniform_random_completion']['local'])
                                for b in corpus['boards']},
    }
    section = {'label': 'New 192-board panel', 'boards': boards, 'baselines': baselines, 'pending': [], 'models': []}

    def per_board(summary):
        out = {}
        for t in summary['trajectories']:
            cell = out.setdefault(t['board_id'], {'raw': [0, 0], 'local': [0, 0]})
            cell[t['mode']][1] += 1
            cell[t['mode']][0] += int(t['stop_reason'] == 'solved')
        return out

    jev_path = E / 'jev-panel/trajectories-summary.json'
    if jev_path.exists():
        jev = json.loads(jev_path.read_text())
        section['models'].append({'name': 'Jev 1.13', **author('typesafe/jev'), 'study': jev['study'],
                                  'per_board': per_board(jev), 'calls': jev['model_calls'], 'attempts_per_board_mode': 1})
    else:
        section['pending'].append({'name': 'Jev 1.13', **author('typesafe/jev'), 'reason': 'Not yet tested.'})
    if path.exists():
        subq = json.loads(path.read_text())
        section['models'].append({'name': 'SubQ Snap (preview)', **author('subquadratic/snap'), 'study': subq['study'],
                                  'per_board': per_board(subq), 'calls': subq['model_calls'], 'attempts_per_board_mode': 1})
    section['status'] = 'complete' if section['models'] else 'running'
    return section


STUDY_LABELS = {
    '2026-09-17-one-shot': 'One shot from an image, 3 original boards (17 Sep)',
    '2026-09-18-jev-5x5-variations': 'Jev 5×5 prompt variations (18 Sep)',
    '2026-09-18-jev-deep-dive': 'Jev deep dive (18 Sep)',
    '2026-09-19-jev-primitives': 'Jev primitives (19 Sep)',
    '2026-09-19-jev-scale': 'Jev scale and held-out boards (19 Sep)',
    '2026-09-30-jev-trajectories': 'Jev trajectories, 9 original boards (30 Sep)',
    '2026-10-01-earlier-generations': 'Earlier generations, 3 original boards (1 Oct)',
    '2026-10-01-diagnostic-completion': 'Diagnostic completion (1 Oct)',
    '2026-10-16-jev-new-board-panel': 'Jev on the 192-board panel (16 Oct)',
    '2026-10-16-jev-new-board-panel-pilot': 'Jev panel pilot (16 Oct)',
    '2026-10-16-frontier-image-panel': 'One shot from an image, 36 panel boards (16 Oct)',
    '2026-10-16-one-shot-rerun': 'Re-run of the September Grok 7×7 request (16 Oct)',
    '2026-10-17-earlier-generations-panel': 'Earlier generations, 36 panel boards (17 Oct)',
    '2026-10-17-frontier-step-trajectories-pilot': 'One queen per request, pilot board (17 Oct)',
}


def attach_costs(out):
    """OpenRouter cost per board on every chart entry, plus a per-evaluation cost table."""
    index = OC.cost_index()
    llm = out['llm']
    for model in llm['models']:
        costs = OC.board_costs(index, model['study'], model['id'])
        for size, board in model['boards'].items():
            board_id = next(b for b, s in SIZES.items() if str(s) == size)
            board['cost_usd'] = costs.get(board_id)
    for model in llm['panel'].get('models', []):
        model['costs'] = OC.board_costs(index, model['study'], model['id'])
    for section in out['decision'].values():
        for model in section['models']:
            jev = model['author'] == 'TypeSafe'
            model['costs'] = OC.board_costs(index, model['study'], 'typesafe/jev-1.13') if jev else None
            model['cost_note'] = None if jev else 'Not billed through OpenRouter (SubQ preview API); not counted.'
    outcome_ok = ('strict', 'format_only')
    pilot = load('frontier-trajectories/pilot.json') if (E / 'frontier-trajectories/pilot.json').exists() else None

    def solved(study, model_id):
        for m in llm['models']:
            if m['study'] == study and m['id'] == model_id:
                return sum(b['outcome'] in outcome_ok for b in m['boards'].values()), len(m['boards'])
            if study == '2026-10-16-one-shot-rerun' and m.get('rerun') and m['id'] == model_id:
                return int(m['rerun']['outcome'] in outcome_ok), 1
        for m in llm['panel'].get('models', []):
            if m['study'] == study and m['id'] == model_id:
                graded = [o for o in m['boards'].values() if o != 'not_run']
                return sum(o in outcome_ok for o in graded), len(graded)
        for section in out['decision'].values():
            for m in section['models']:
                if m['study'] == study and model_id.startswith('typesafe/jev'):
                    return sum(c['raw'][0] > 0 or c['local'][0] > 0 for c in m['per_board'].values()), len(m['per_board'])
        if pilot and study == pilot['study']:
            mine = [t for t in pilot['trajectories'] if t['model'] == model_id]
            return sum(t['solved'] for t in mine), len(mine)
        return None

    rows = OC.evaluations(index, solved)
    for row in rows:
        row['label'] = STUDY_LABELS.get(row['study'], row['study'])
        row['model_name'] = DISPLAY.get(row['model'], 'Jev 1.13' if row['model'].startswith('typesafe/jev') else 'Jev (latest alias)' if row['model'] == '~typesafe/jev-latest' else row['model'])
    out['costs'] = {
        'scope': 'OpenRouter spend recorded in the published receipts. SubQ Snap (own preview API) and agent-led use outside the studies are not counted.',
        'basis': {'reported': 'usage.cost returned by OpenRouter', 'derived': 'batch item: tokens x batch price, cached input at a tenth of the input price (reproduces the billed batch total)',
                  'unbilled': 'HTTP error before any generation; billed $0', 'unknown': 'client timeout with no generation ID; not counted'},
        'total_usd': round(sum(r['cost_usd'] for r in rows), 6),
        'unknown_receipts': sum(r['basis'].get('unknown', 0) for r in rows),
        'evaluations': rows,
    }


def main():
    out = {
        'generated_utc': datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='seconds'),
        'builder': 'scripts/analysis/build_scoreboard.py',
        'llm': llm_section(),
        'decision': {'original': decision_original(), 'panel': decision_panel()},
    }
    attach_costs(out)
    (E / 'scoreboard.json').write_text(json.dumps(out, indent=1) + '\n')
    llm = out['llm']
    for m in llm['models']:
        solved = sum(b['outcome'] in ('strict', 'format_only') for b in m['boards'].values())
        print(f"{m['cohort']:8} {m['name']:24} {solved}/{len(m['boards'])}", [m['boards'][s]['outcome'] for s in ('5', '7', '9')])
    print('not run:', [m['name'] for m in llm['not_run']])
    o = out['decision']['original']
    print('greedy original:', sum(o['baselines']['greedy'].values()), 'random expected boards:', round(sum(o['baselines']['random_expected_any'].values()), 2))
    p = out['decision']['panel']
    print('panel status:', p['status'], 'greedy panel:', sum(p['baselines']['greedy'].values()))
    print('OpenRouter cost in receipts: $%.4f; unknown receipts: %d' % (out['costs']['total_usd'], out['costs']['unknown_receipts']))


if __name__ == '__main__':
    main()
