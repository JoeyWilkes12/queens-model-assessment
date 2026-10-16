"""Z3 facts about the Chapter 10 workbench exports, for scripts/verify-z3-workbench.mjs.

Reads one JSON request on stdin:

  {"n": 7,
   "cases": [{"id": str, "production": smt2 text, "pairwise": smt2 text, "enumerateUpTo": int}],
   "intactProduction": smt2 text,
   "regions": [[...]]}

and writes one JSON object on stdout. It only reports what Z3 says; the Node
script makes every assertion. Each exported file is run as a whole script in a
fresh context (like `z3 file.smt2`) and also parsed into a Solver.
"""

from __future__ import annotations

import hashlib
import json
import re
import sys

import z3


def run_script(text: str) -> dict:
    """Z3's output for the whole file, as `z3 file.smt2` prints it.

    After unsat, (get-model) makes Z3 report an error; the binding raises it
    with the full output, so the output is recovered from the exception.
    """
    ctx = z3.Context()
    try:
        out = z3.Z3_eval_smtlib2_string(ctx.ref(), text)
    except z3.Z3Exception as error:
        value = error.value
        out = value.decode() if isinstance(value, bytes) else str(value)
    lines = [line for line in out.strip().splitlines() if line.strip()]
    return {"result": lines[0] if lines else "", "errors": [line for line in lines if line.startswith("(error")]}


def cells(n: int):
    return [[z3.Bool(f"q_{r}_{c}") for c in range(1, n + 1)] for r in range(1, n + 1)]


def columns_of(model, grid):
    out = []
    for row in grid:
        on = [c for c, b in enumerate(row, start=1) if z3.is_true(model.eval(b, model_completion=True))]
        out.append(on)
    return out


def enumerate_models(text: str, n: int, limit: int) -> int:
    solver = z3.Solver()
    solver.from_string(text)
    flat = [b for row in cells(n) for b in row]
    count = 0
    while count < limit and solver.check() == z3.sat:
        m = solver.model()
        count += 1
        solver.add(z3.Or([b != m.eval(b, model_completion=True) for b in flat]))
    return count


def integer_model(regions):
    """Chapter 2 sidebar: one Int per row, AllDifferent, region counts, |q_r - q_{r+1}| != 1."""
    n = len(regions)
    labels = sorted({k for row in regions for k in row})
    q = [z3.Int(f"col_{r}") for r in range(1, n + 1)]
    solver = z3.Solver()
    solver.add([z3.And(1 <= x, x <= n) for x in q])
    solver.add(z3.Distinct(q))
    for k in labels:
        terms = []
        for r, row in enumerate(regions):
            cols = [c for c, label in enumerate(row, start=1) if label == k]
            if cols:
                terms.append(z3.If(z3.Or([q[r] == c for c in cols]), 1, 0))
        solver.add(z3.Sum(terms) == 1)
    for r in range(n - 1):
        solver.add(q[r] - q[r + 1] != 1, q[r + 1] - q[r] != 1)
    first = solver.check()
    columns = [solver.model()[x].as_long() for x in q] if first == z3.sat else None
    if columns:
        solver.add(z3.Or([x != v for x, v in zip(q, columns)]))
    blocked = solver.check()
    return {"first": str(first), "columns": columns, "blocked": str(blocked), "assertions": len(solver.assertions())}


def main() -> None:
    request = json.load(sys.stdin)
    n = request["n"]
    results = []
    for case in request["cases"]:
        entry = {"id": case["id"], "production": run_script(case["production"]), "pairwise": run_script(case["pairwise"])}
        limit = int(case.get("enumerateUpTo", 0))
        if limit:
            entry["productionCount"] = enumerate_models(case["production"], n, limit)
            entry["pairwiseCount"] = enumerate_models(case["pairwise"], n, limit)
        results.append(entry)

    intact = request["intactProduction"]
    solver = z3.Solver()
    solver.from_string(intact)
    check = solver.check()
    columns = columns_of(solver.model(), cells(n)) if check == z3.sat else None
    renamed = re.sub(r"q_(\d+)_(\d+)", lambda m: f"cell_{int(m.group(1)) - 1}_{int(m.group(2)) - 1}", intact)
    production = z3.Solver()
    production.from_string(renamed)
    json.dump({
        "z3": z3.get_full_version(),
        "cases": results,
        "intact": {
            "check": str(check),
            "columns": columns,
            "assertions": len(solver.assertions()),
            "renamedFormulaSha256": hashlib.sha256(production.sexpr().encode()).hexdigest(),
        },
        "integerModel": integer_model(request["regions"]),
    }, sys.stdout)


if __name__ == "__main__":
    main()
