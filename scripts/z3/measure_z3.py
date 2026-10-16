"""One Z3 measurement process: first check, same-solver blocked, fresh blocked.

Invoked by build_teaching_data.py, one process per board/mode/verbosity so
counters start clean. Reads a JSON request on stdin:

  {"board": "seven", "regions": [[...]], "solution": [...],
   "mode": "default" | "fd" | "pb", "verbose": 0 | 10, "timeoutMs": 30000}

and writes one JSON receipt on stdout. Adapted from the design's
INSTRUMENTATION.md: the production syntax is Sum(If(q, 1, 0)) == 1 for every
row, column and region plus Implies(q_u, Not(q_v)) for every directed pair of
touching cells. Verbose diagnostics (stderr of the Z3 library) are captured
separately for each check by redirecting file descriptor 2.
"""

from __future__ import annotations

import hashlib
import json
import os
import sys
import tempfile
import time

import z3


def capture_stderr(fn):
    sys.stderr.flush()
    with tempfile.TemporaryFile(mode="w+b") as tmp:
        saved = os.dup(2)
        os.dup2(tmp.fileno(), 2)
        try:
            result = fn()
        finally:
            os.dup2(saved, 2)
            os.close(saved)
        tmp.seek(0)
        text = tmp.read().decode("utf-8", "replace")
    return result, text


def main() -> None:
    request = json.load(sys.stdin)
    regions = request["regions"]
    mode = request["mode"]
    verbose = int(request.get("verbose", 0))
    timeout = int(request.get("timeoutMs", 30000))
    n = len(regions)
    assert all(len(row) == n for row in regions)
    labels = sorted({k for row in regions for k in row})
    assert len(labels) == n

    z3.set_param(verbose=verbose)
    q = [[z3.Bool(f"cell_{r}_{c}") for c in range(n)] for r in range(n)]
    flat = [b for row in q for b in row]
    units = [list(row) for row in q]
    units += [[q[r][c] for r in range(n)] for c in range(n)]
    units += [[q[r][c] for r in range(n) for c in range(n) if regions[r][c] == k] for k in labels]
    if mode == "pb":
        exact = lambda u: z3.PbEq([(b, 1) for b in u], 1)
    else:
        exact = lambda u: z3.Sum([z3.If(b, 1, 0) for b in u]) == 1
    formula = [exact(u) for u in units]
    offsets = [(-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (-1, 1), (1, -1), (1, 1)]
    for r in range(n):
        for c in range(n):
            for dr, dc in offsets:
                if 0 <= r + dr < n and 0 <= c + dc < n:
                    formula.append(z3.Implies(q[r][c], z3.Not(q[r + dr][c + dc])))

    def new_solver():
        s = z3.Solver() if mode == "default" else z3.SolverFor("QF_FD")
        s.set(timeout=timeout)
        s.add(formula)
        return s

    def stats(s):
        t = s.statistics()
        return {k: t.get_key_value(k) for k in t.keys()}

    def checked(s):
        def run():
            start = time.perf_counter()
            result = s.check()
            return result, time.perf_counter() - start
        (result, elapsed), stderr = capture_stderr(run)
        return {
            "result": str(result),
            "elapsedSeconds": elapsed,
            "statistics": stats(s),
            "reasonUnknown": s.reason_unknown() if result == z3.unknown else None,
            "verboseStderr": stderr if verbose else None,
        }

    s = new_solver()
    out = {
        "z3": z3.get_full_version(),
        "board": request["board"],
        "mode": mode,
        "parameters": {"timeout": timeout, "verbose": verbose},
        "assertions": len(formula),
        "formulaSha256": hashlib.sha256(s.sexpr().encode()).hexdigest(),
    }
    out["first"] = checked(s)
    if out["first"]["result"] == "sat":
        m = s.model()
        values = [z3.is_true(m.eval(b, model_completion=True)) for b in flat]
        out["modelValues"] = values
        blocker = z3.Or([b != z3.BoolVal(v) for b, v in zip(flat, values)])
        out["blocker"] = {"sexpr": blocker.sexpr(), "literalCount": len(flat),
                          "variables": [str(b) for b in flat]}
        s.add(blocker)
        out["blockedFormulaSha256"] = hashlib.sha256(s.sexpr().encode()).hexdigest()
        out["incrementalBlocked"] = checked(s)
        fresh = new_solver()
        fresh.add(blocker)
        out["freshBlockedFormulaSha256"] = hashlib.sha256(fresh.sexpr().encode()).hexdigest()
        out["freshBlocked"] = checked(fresh)
    json.dump(out, sys.stdout)


if __name__ == "__main__":
    main()
