"""Strict grader and post-hoc format diagnostic, copied verbatim from the
September one-shot study (run_pilot.py `grade`, diagnose_format.py `diagnose`).
Never executes model-provided text. `board` needs `id`, `size`, `regions`.
"""
import json


def grade(board, text):
    """Strict JSON and rule validation. Never executes model-provided text."""
    result = {'format_valid': False, 'correct': False, 'checks': {}}
    def unique_keys(pairs):
        obj = {}
        for key, value in pairs:
            if key in obj:
                raise ValueError('Duplicate JSON object key')
            obj[key] = value
        return obj
    try:
        obj = json.loads(text, object_pairs_hook=unique_keys)
    except (ValueError, TypeError):
        result['failure'] = 'invalid_json_or_missing_final'
        return result
    n = board['size']
    if not isinstance(obj, dict) or set(obj) != {'board_id', 'columns_by_row'}:
        result['failure'] = 'schema'
        return result
    cols = obj['columns_by_row']
    if obj['board_id'] != board['id'] or not isinstance(cols, list) or len(cols) != n or any(
            type(c) is not int or not 1 <= c <= n for c in cols):
        result['failure'] = 'schema'
        return result
    result['format_valid'] = True
    regions = board['regions']
    checks = {'one_per_row': len(cols) == n, 'one_per_column': len(set(cols)) == n,
              'one_per_region': len({regions[r][c-1] for r, c in enumerate(cols)}) == n,
              'no_touch': all(abs(cols[r]-cols[r-1]) > 1 for r in range(1, n))}
    result.update(checks=checks, correct=all(checks.values()))
    result['failure'] = None if result['correct'] else 'rule_violation'
    return result


def diagnose(board, text):
    if not isinstance(text, str):
        return {'diagnostic_only': True, 'candidate_count': 0, 'rule_valid_after_extraction': False}
    decoder = json.JSONDecoder()
    candidates = []
    offset = 0
    while offset < len(text):
        start = text.find('{', offset)
        if start < 0:
            break
        try:
            obj, end = decoder.raw_decode(text[start:])
        except ValueError:
            offset = start + 1
            continue
        if isinstance(obj, dict) and set(obj) == {'board_id', 'columns_by_row'}:
            candidates.append(text[start:start+end])
        offset = start + end
    result = {'diagnostic_only': True, 'candidate_count': len(candidates),
              'markdown_fence_present': '```' in text,
              'visible_character_count': len(text), 'rule_valid_after_extraction': False}
    if len(candidates) == 1:
        extracted_grade = grade(board, candidates[0])
        result['rule_valid_after_extraction'] = extracted_grade['correct']
        result['checks'] = extracted_grade['checks']
        result['failure'] = extracted_grade['failure']
        result['extra_visible_text'] = text.strip() != candidates[0]
    return result
