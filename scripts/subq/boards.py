#!/usr/bin/env python3
"""Certified regional-Queens boards: generation, certification, profiling, panel.

Standard library only. Deterministic given seeds. No network, no credentials,
no model calls. Ground-truth solutions are written only to an ignored private
input file; the public corpus carries a sha256 commitment per solution.

Rules: an n x n grid is partitioned into n orthogonally connected regions.
Exactly one queen per row, column and region; no two queens touch, including
diagonally (Chebyshev distance > 1). Coordinates in this module are 0-based
internally; solutions are reported as 1-based column vectors by row, matching
`replay.solutions`.
"""
from __future__ import annotations

import argparse
import collections
import functools
import hashlib
import json
import math
import pathlib
import random
import statistics
import sys

HERE = pathlib.Path(__file__).resolve().parent
SITE = HERE.parent.parent
GENERATOR_VERSION = "boards.py/1"
GENERATORS = ("solution_first_growth", "partition_first_voronoi")


# ---------------------------------------------------------------- basics

def as_grid(regions):
    return tuple(tuple(int(x) for x in row) for row in regions)


def size_of(grid):
    return len(grid)


def region_cells(grid):
    """Region id -> row-major list of 0-based (r, c)."""
    cells = collections.defaultdict(list)
    for r, row in enumerate(grid):
        for c, g in enumerate(row):
            cells[g].append((r, c))
    return dict(cells)


def well_formed(grid):
    n = len(grid)
    return (n >= 2 and all(len(row) == n for row in grid)
            and {g for row in grid for g in row} == set(range(n)))


def connected(cells):
    cells = set(cells)
    if not cells:
        return False
    start = next(iter(sorted(cells)))
    seen = {start}
    queue = collections.deque([start])
    while queue:
        r, c = queue.popleft()
        for nxt in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
            if nxt in cells and nxt not in seen:
                seen.add(nxt)
                queue.append(nxt)
    return len(seen) == len(cells)


def all_regions_connected(grid):
    return all(connected(cells) for cells in region_cells(grid).values())


def touching(a, b):
    return max(abs(a[0] - b[0]), abs(a[1] - b[1])) <= 1


def legal(grid, placed, cell):
    """Immediate row/column/region/touch legality only (the local-menu filter)."""
    r, c = cell
    g = grid[r][c]
    return all(r != s and c != d and g != grid[s][d] and not touching(cell, (s, d)) for s, d in placed)


def valid_solution(grid, columns):
    """Independent full-rule check of a 1-based column vector."""
    n = len(grid)
    if len(columns) != n or not all(type(c) is int and 1 <= c <= n for c in columns):
        return False
    cells = [(r, c - 1) for r, c in enumerate(columns)]
    return (len({c for _, c in cells}) == n and len({grid[r][c] for r, c in cells}) == n
            and all(not touching(a, b) for i, a in enumerate(cells) for b in cells[i + 1:]))


def solution_sha256(columns):
    return hashlib.sha256(json.dumps(list(columns), separators=(",", ":")).encode()).hexdigest()


def board_record_sha256(board):
    """Same encoding as replay.sha(replay.encoded(board)) for {id,size,regions}."""
    value = {"id": board["id"], "size": board["size"], "regions": [list(row) for row in board["regions"]]}
    return hashlib.sha256(json.dumps(value, ensure_ascii=False, separators=(",", ":")).encode()).hexdigest()


# ---------------------------------------------------------------- solvers

def solve_rows(grid, limit=2):
    """Solver (i): row-by-row column backtracking (permutation/column vector).

    Fixed order: rows top to bottom; columns left to right. A *node* is one
    tentative queen placement that passes column, region and previous-row
    touch checks. `nodes_first` counts nodes until the first complete
    solution; `nodes_total` counts nodes until `limit` solutions or
    exhaustion (with limit=2 on a unique board this is the uniqueness proof).
    """
    n = len(grid)
    found = []
    stats = {"nodes_total": 0, "nodes_first": None}
    cols = [False] * n
    regs = [False] * n
    prefix = []

    def visit(r):
        if r == n:
            found.append(tuple(c + 1 for c in prefix))
            if stats["nodes_first"] is None:
                stats["nodes_first"] = stats["nodes_total"]
            return len(found) >= limit
        for c in range(n):
            g = grid[r][c]
            if cols[c] or regs[g] or (r and abs(c - prefix[-1]) <= 1):
                continue
            stats["nodes_total"] += 1
            cols[c] = regs[g] = True
            prefix.append(c)
            stop = visit(r + 1)
            prefix.pop()
            cols[c] = regs[g] = False
            if stop:
                return True
        return False

    visit(0)
    return {"solutions": found, **stats}


@functools.lru_cache(maxsize=16)
def _masks(n):
    rows = [sum(1 << (r * n + c) for c in range(n)) for r in range(n)]
    cols = [sum(1 << (r * n + c) for r in range(n)) for c in range(n)]
    near = []
    for r in range(n):
        for c in range(n):
            m = 0
            for dr in (-1, 0, 1):
                for dc in (-1, 0, 1):
                    if 0 <= r + dr < n and 0 <= c + dc < n:
                        m |= 1 << ((r + dr) * n + c + dc)
            near.append(m)
    return rows, cols, near


def _bits(mask):
    while mask:
        low = mask & -mask
        yield low.bit_length() - 1
        mask ^= low


def solve_regions_mrv(grid, limit=2):
    """Solver (ii): bitmask DFS over regions with minimum-remaining-values.

    At each node choose the unplaced region with the fewest available cells
    (ties: lowest region id), then try its cells in row-major order. Cells are
    removed by row, column, region and 3x3 neighbourhood masks. A *node* is
    one tentative placement. Independent of solver (i): different variable
    (regions, not rows), dynamic ordering and representation.
    """
    n = len(grid)
    rows, cols, near = _masks(n)
    region_mask = [0] * n
    for r in range(n):
        for c in range(n):
            region_mask[grid[r][c]] |= 1 << (r * n + c)
    found = []
    stats = {"nodes_total": 0, "nodes_first": None}
    assignment = {}

    def visit(available, unplaced):
        if not unplaced:
            columns = [None] * n
            for idx in assignment.values():
                columns[idx // n] = idx % n + 1
            found.append(tuple(columns))
            if stats["nodes_first"] is None:
                stats["nodes_first"] = stats["nodes_total"]
            return len(found) >= limit
        best, best_mask, best_count = None, 0, None
        for g in unplaced:
            m = region_mask[g] & available
            k = bin(m).count("1")
            if k == 0:
                return False
            if best_count is None or k < best_count:
                best, best_mask, best_count = g, m, k
        rest = tuple(g for g in unplaced if g != best)
        for idx in _bits(best_mask):
            r, c = divmod(idx, n)
            stats["nodes_total"] += 1
            assignment[best] = idx
            stop = visit(available & ~rows[r] & ~cols[c] & ~near[idx] & ~region_mask[best], rest)
            del assignment[best]
            if stop:
                return True
        return False

    visit((1 << (n * n)) - 1, tuple(range(n)))
    return {"solutions": sorted(found), **stats}


def certify(grid):
    """Both solvers must find exactly one solution, and the same one."""
    rows = solve_rows(grid)
    mrv = solve_regions_mrv(grid)
    # Both stop at two solutions, so for ambiguous boards only the count is
    # comparable; for unique boards the solution itself must also match.
    agree = len(rows["solutions"]) == len(mrv["solutions"]) and (
        len(rows["solutions"]) != 1 or rows["solutions"] == mrv["solutions"])
    unique = agree and len(rows["solutions"]) == 1
    solution = rows["solutions"][0] if unique else None
    return {"solution_count_row_solver": len(rows["solutions"]),
            "solution_count_mrv_solver": len(mrv["solutions"]),
            "unique": unique and agree and valid_solution(grid, list(solution)),
            "solvers_agree": agree, "solution": solution,
            "row_solver": {"nodes_first": rows["nodes_first"], "nodes_uniqueness": rows["nodes_total"]},
            "mrv_solver": {"nodes_first": mrv["nodes_first"], "nodes_uniqueness": mrv["nodes_total"]}}


def extendable(grid, placed):
    """Whether a 0-based placement prefix extends to some complete solution."""
    n = len(grid)
    rows, cols, near = _masks(n)
    available = (1 << (n * n)) - 1
    used = set()
    for i, (r, c) in enumerate(placed):
        if not legal(grid, placed[:i], (r, c)):
            return False
        idx = r * n + c
        available &= ~rows[r] & ~cols[c] & ~near[idx]
        used.add(grid[r][c])
    region_mask = [0] * n
    for r in range(n):
        for c in range(n):
            region_mask[grid[r][c]] |= 1 << (r * n + c)
    for g in used:
        available &= ~region_mask[g]

    def visit(avail, unplaced):
        if not unplaced:
            return True
        best, best_mask, best_count = None, 0, None
        for g in unplaced:
            m = region_mask[g] & avail
            k = bin(m).count("1")
            if k == 0:
                return False
            if best_count is None or k < best_count:
                best, best_mask, best_count = g, m, k
        rest = tuple(g for g in unplaced if g != best)
        for idx in _bits(best_mask):
            r, c = divmod(idx, n)
            if visit(avail & ~rows[r] & ~cols[c] & ~near[idx] & ~region_mask[best], rest):
                return True
        return False

    return visit(available, tuple(g for g in range(n) if g not in used))


# ---------------------------------------------------------------- symmetry

def dihedral(grid):
    """All 8 rotations/reflections."""
    out = []
    g = grid
    for _ in range(4):
        out.append(g)
        out.append(tuple(tuple(reversed(row)) for row in g))
        g = tuple(zip(*g[::-1]))  # rotate 90 degrees clockwise
    return out


def relabel(grid):
    """Relabel regions by first appearance in row-major order."""
    mapping = {}
    for row in grid:
        for g in row:
            if g not in mapping:
                mapping[g] = len(mapping)
    return tuple(tuple(mapping[g] for g in row) for row in grid)


def canonical(grid):
    return min(relabel(t) for t in dihedral(as_grid(grid)))


def canonical_sha256(grid):
    return hashlib.sha256(json.dumps([list(r) for r in canonical(grid)], separators=(",", ":")).encode()).hexdigest()


# ---------------------------------------------------------------- profile

def _units(grid):
    n = len(grid)
    units = []
    for g, cells in sorted(region_cells(grid).items()):
        units.append(("region", g, cells))
    for r in range(n):
        units.append(("row", r, [(r, c) for c in range(n)]))
    for c in range(n):
        units.append(("column", c, [(r, c) for r in range(n)]))
    return units


def propagate(grid):
    """Simple propagation: singleton rule plus row/column/region/adjacency elimination.

    Round structure: at the start of a round, every unit (regions by id, then
    rows, then columns) without a queen whose candidate set has exactly one
    cell forces that cell. All forced cells of the round are placed in sorted
    order, each eliminating its row, column, region and 8 neighbours. Repeat
    until a round forces nothing. No other inference (no confinement, no
    lookahead, no branching).
    """
    n = len(grid)
    candidates = {(r, c) for r in range(n) for c in range(n)}
    placed = []
    rounds = 0
    units = _units(grid)
    contradiction = False
    while len(placed) < n:
        done_rows = {r for r, _ in placed}
        done_cols = {c for _, c in placed}
        done_regs = {grid[r][c] for r, c in placed}
        forced = set()
        for kind, key, cells in units:
            if (kind == "region" and key in done_regs) or (kind == "row" and key in done_rows) or (kind == "column" and key in done_cols):
                continue
            live = [cell for cell in cells if cell in candidates]
            if not live:
                contradiction = True
            elif len(live) == 1:
                forced.add(live[0])
        if contradiction or not forced:
            break
        rounds += 1
        for cell in sorted(forced):
            if cell not in candidates:
                contradiction = True
                break
            placed.append(cell)
            r, c = cell
            g = grid[r][c]
            candidates = {x for x in candidates if x[0] != r and x[1] != c and grid[x[0]][x[1]] != g and not touching(x, cell)}
        if contradiction:
            break
    return {"forced_placements": len(placed), "rounds": rounds, "solved": len(placed) == n and not contradiction,
            "contradiction": contradiction, "placed": sorted(placed)}


def menus(grid, placed):
    occupied = {grid[r][c] for r, c in placed}
    cells = region_cells(grid)
    return {g: [cell for cell in cells[g] if legal(grid, placed, cell)] for g in range(len(grid)) if g not in occupied}


def greedy(grid, solution):
    """Frozen greedy baseline (methods critique section 3).

    Choose the unplaced region with the fewest immediately legal cells (ties:
    lowest region id, i.e. alphabetical letter); place its first legal cell in
    row-major order; never backtrack. The oracle (`solution`, 1-based columns)
    is used only to stop and score at the first off-solution placement.
    """
    placed = []
    n = len(grid)
    stop = "solved"
    for _ in range(n):
        options = menus(grid, placed)
        region = min(options, key=lambda g: (len(options[g]), g))
        if not options[region]:
            stop = "empty_menu"
            break
        cell = options[region][0]
        if solution[cell[0]] != cell[1] + 1:
            stop = "off_solution"
            break
        placed.append(cell)
    return {"solved": len(placed) == n, "correct_prefix": len(placed), "stop_reason": stop}


def random_policy_probability(grid, solution, mode):
    """Exact completion probability of a uniformly random policy.

    Same protocol as the trajectory study: choose an unoccupied region
    uniformly, then a cell uniformly from that region's raw menu (all cells)
    or local menu (immediately legal cells); any off-solution cell ends the
    attempt. Dynamic programming over the set of correctly placed regions.
    """
    n = len(grid)
    cells = region_cells(grid)
    truth = {grid[r][solution[r] - 1]: (r, solution[r] - 1) for r in range(n)}

    @functools.lru_cache(maxsize=None)
    def success(done):
        if len(done) == n:
            return 1.0
        placed = [truth[g] for g in done]
        total = 0.0
        for g in range(n):
            if g in done:
                continue
            menu = cells[g] if mode == "raw" else [cell for cell in cells[g] if legal(grid, placed, cell)]
            total += success(tuple(sorted(done + (g,)))) / len(menu)
        return total / (n - len(done))

    return success(())


def gini(values):
    values = sorted(values)
    n = len(values)
    total = sum(values)
    return sum((2 * i - n + 1) * v for i, v in enumerate(values)) / (n * total)


def profile(grid, certificate=None):
    grid = as_grid(grid)
    n = len(grid)
    certificate = certificate or certify(grid)
    assert certificate["unique"], "profile requires a uniquely solvable board"
    solution = certificate["solution"]
    sizes = sorted(len(v) for v in region_cells(grid).values())
    prop = propagate(grid)
    oriented = [solve_rows(t)["nodes_total"] for t in dihedral(grid)]
    return {
        "size": n,
        "region_sizes_sorted": sizes,
        "singleton_regions": sum(s == 1 for s in sizes),
        "has_singleton": any(s == 1 for s in sizes),
        "region_size_max_min_ratio": sizes[-1] / sizes[0],
        "region_size_gini": round(gini(sizes), 6),
        "propagation_forced_placements": prop["forced_placements"],
        "propagation_rounds": prop["rounds"],
        "propagation_solves": prop["solved"],
        "row_solver_nodes_first": certificate["row_solver"]["nodes_first"],
        "row_solver_nodes_uniqueness": certificate["row_solver"]["nodes_uniqueness"],
        "mrv_solver_nodes_first": certificate["mrv_solver"]["nodes_first"],
        "mrv_solver_nodes_uniqueness": certificate["mrv_solver"]["nodes_uniqueness"],
        "log2_row_nodes_uniqueness_orientation_mean": round(statistics.mean(math.log2(x) for x in oriented), 6),
        "greedy": greedy(grid, solution),
        "uniform_random_completion": {"raw": random_policy_probability(grid, solution, "raw"),
                                      "local": random_policy_probability(grid, solution, "local")},
    }


# ---------------------------------------------------------------- generators

def candidate_seed(master_seed, generator, size, index):
    """Per-candidate seed: each candidate is individually reproducible."""
    text = f"queens-subq-panel/{GENERATOR_VERSION}/{master_seed}/{generator}/{size}/{index}"
    return int.from_bytes(hashlib.sha256(text.encode()).digest()[:8], "big")


def random_placement(n, rng):
    """Uniform-order randomized backtracking for a non-touching permutation."""
    columns = []
    used = set()

    def visit(r):
        if r == n:
            return True
        options = [c for c in range(n) if c not in used and (not r or abs(c - columns[-1]) > 1)]
        rng.shuffle(options)
        for c in options:
            columns.append(c)
            used.add(c)
            if visit(r + 1):
                return True
            columns.pop()
            used.discard(c)
        return False

    assert visit(0)
    return [(r, c) for r, c in enumerate(columns)]


def _neighbours(n, cell):
    r, c = cell
    for nxt in ((r - 1, c), (r + 1, c), (r, c - 1), (r, c + 1)):
        if 0 <= nxt[0] < n and 0 <= nxt[1] < n:
            yield nxt


def _parameters(rng, n):
    """Per-candidate shape parameters, drawn from the candidate's own RNG.

    `locked_singletons`: number of seed regions that are never grown (0 with
    probability 1/2, otherwise 1 or 2). `weight_sigma`: spread of log region
    growth weights (larger means more imbalanced region sizes). The resulting
    stratum is always computed from the finished board, never from these.
    """
    locked = 0 if rng.random() < 0.5 else (1 if rng.random() < 0.6 else 2)
    sigma = round(0.2 + 1.3 * rng.random(), 4)
    return {"locked_singletons": locked, "weight_sigma": sigma}


def _grow(n, owner, rng, weights, locked):
    """Randomized weighted frontier growth; every step keeps regions connected."""
    unassigned = sum(v is None for row in owner for v in row)
    while unassigned:
        frontier = collections.defaultdict(list)
        for r in range(n):
            for c in range(n):
                if owner[r][c] is None:
                    for s, d in _neighbours(n, (r, c)):
                        g = owner[s][d]
                        if g is not None and g not in locked:
                            frontier[g].append((r, c))
        if not frontier:
            return None  # an unassigned pocket is enclosed by locked singletons/borders
        regions = sorted(frontier)
        total = sum(weights[g] for g in regions)
        pick = rng.random() * total
        for g in regions:
            pick -= weights[g]
            if pick <= 0:
                break
        options = sorted(set(frontier[g]))
        cell = options[rng.randrange(len(options))]
        owner[cell[0]][cell[1]] = g
        unassigned -= 1
    return owner


def generate_solution_first(n, seed):
    """Generator (a): sample a valid queen placement, seed one region per queen,
    grow regions by randomized weighted frontier (BFS-like) growth, then apply
    `repair_to_unique`. The planted placement stays a solution throughout;
    uniqueness is certified afterwards by both independent solvers."""
    rng = random.Random(seed)
    params = _parameters(rng, n)
    queens = random_placement(n, rng)
    owner = [[None] * n for _ in range(n)]
    for g, (r, c) in enumerate(queens):
        owner[r][c] = g
    locked = set(rng.sample(range(n), params["locked_singletons"])) if params["locked_singletons"] else set()
    weights = [math.exp(params["weight_sigma"] * rng.gauss(0, 1)) for _ in range(n)]
    owner = _grow(n, owner, rng, weights, locked)
    if owner is None:
        return None, params
    grid, params["repair_moves"] = repair_to_unique(as_grid(owner), queens, locked, rng)
    return grid, params


MAX_REPAIR_MOVES = 60


def repair_to_unique(grid, queens, locked, rng):
    """Solution-first uniqueness repair, keeping the planted solution valid.

    While the row solver finds a second solution, take the first-found
    alternative and move one of its queen cells (never a planted queen cell)
    into an orthogonally adjacent region. The alternative then has two queens
    in the receiving region, so it is no longer a solution. A move is allowed
    only if the donor region stays connected and keeps at least two cells
    (repair never creates a singleton), and neither region is a locked
    singleton. Up to MAX_REPAIR_MOVES moves; otherwise the candidate is
    rejected. Returns (grid or None, moves).
    """
    n = len(grid)
    owner = [list(row) for row in grid]
    planted = {cell for cell in queens}
    planted_columns = tuple(c + 1 for _, c in sorted(queens))
    for moves in range(MAX_REPAIR_MOVES + 1):
        current = as_grid(owner)
        found = solve_rows(current, limit=2)["solutions"]
        assert planted_columns in found or len(found) == 2
        others = [s for s in found if s != planted_columns]
        if not others:
            return current, moves
        alternative = others[0]
        options = []
        for r in range(n):
            cell = (r, alternative[r] - 1)
            if cell in planted:
                continue
            donor = owner[r][cell[1]]
            if donor in locked:
                continue
            remaining = [x for x in region_cells(current)[donor] if x != cell]
            if len(remaining) < 2 or not connected(remaining):
                continue
            for s, d in _neighbours(n, cell):
                receiver = owner[s][d]
                if receiver != donor and receiver not in locked:
                    options.append((cell, receiver))
        if not options:
            return None, moves
        options = sorted(set(options))
        (r, c), receiver = options[rng.randrange(len(options))]
        owner[r][c] = receiver
    return None, MAX_REPAIR_MOVES


def generate_partition_first(n, seed):
    """Generator (b): random connected partition with no planted solution.

    n distinct random seed cells; each other cell joins the seed minimizing a
    multiplicatively weighted Manhattan distance plus noise (weighted Voronoi).
    Disconnected fragments are released and re-grown from their neighbours.
    Locked seeds keep a single cell. Solvability is checked afterwards."""
    rng = random.Random(seed)
    params = _parameters(rng, n)
    seeds = [divmod(i, n) for i in rng.sample(range(n * n), n)]
    locked = set(rng.sample(range(n), params["locked_singletons"])) if params["locked_singletons"] else set()
    weights = [math.exp(params["weight_sigma"] * rng.gauss(0, 1)) for _ in range(n)]
    owner = [[None] * n for _ in range(n)]
    for g, (r, c) in enumerate(seeds):
        owner[r][c] = g
    free = [g for g in range(n) if g not in locked]
    for r in range(n):
        for c in range(n):
            if owner[r][c] is None:
                owner[r][c] = min(free, key=lambda g: ((abs(r - seeds[g][0]) + abs(c - seeds[g][1])) / weights[g]
                                                        + 0.75 * rng.random(), g))
    for g in range(n):  # keep only the component containing the seed
        cells = {(r, c) for r in range(n) for c in range(n) if owner[r][c] == g}
        keep = {seeds[g]}
        queue = collections.deque([seeds[g]])
        while queue:
            for nxt in _neighbours(n, queue.popleft()):
                if nxt in cells and nxt not in keep:
                    keep.add(nxt)
                    queue.append(nxt)
        for r, c in cells - keep:
            owner[r][c] = None
    owner = _grow(n, owner, rng, weights, locked)
    return (as_grid(owner) if owner else None), params


GENERATE = {"solution_first_growth": generate_solution_first, "partition_first_voronoi": generate_partition_first}


# ---------------------------------------------------------------- panel

DEV_SEED = 2026101401
PANEL_SEED = 2026101501
SIZES = (5, 7, 9)
PER_SIZE = 64
DEV_PER_STATUS_PER_GENERATOR = 12
TIER_METRIC = "log2_row_nodes_uniqueness_orientation_mean"
# Candidate budgets per (size, generator, phase). Pure-rejection partition-first
# boards without a singleton region are rare at 9x9 (about 1.5 per 10,000).
BUDGET = {5: 60000, 7: 150000, 9: 400000}
TOP_UP_BUDGET = {5: 60000, 7: 150000, 9: 400000}
REASONS = {"A": "accepted", "G": "growth_enclosed_cell", "R": "repair_exhausted", "W": "malformed_or_disconnected",
           "Z": "no_solution", "M": "multiple_solutions", "X": "solver_disagreement",
           "H": "symmetry_duplicate_of_historical", "P": "symmetry_duplicate_within_corpus",
           "Q": "stratum_quota_full"}
STRATA = [(status, tier) for status in ("singleton", "no_singleton") for tier in ("lower_search", "higher_search")]
DESIGN = {
    "board_rules": "n x n grid, n orthogonally connected regions; one queen per row, column and region; queens may not touch, including diagonally.",
    "generators": {
        "solution_first_growth": "Sample a non-touching permutation by randomized backtracking; seed one region per queen; grow by randomized weighted frontier growth (log-normal region weights); repair to uniqueness by moving cells of alternative solutions into adjacent regions (donor stays connected with >= 2 cells; planted queens never move; at most 60 moves).",
        "partition_first_voronoi": "Choose n random seed cells; assign other cells to the seed minimizing weighted Manhattan distance plus noise; release disconnected fragments and re-grow them from neighbours; no planted solution; keep only if uniquely solvable (pure rejection, no repair)."},
    "candidate_parameters": "Each candidate's RNG draws locked_singletons (0 with probability 1/2, else 1 with probability 0.6, else 2) and weight_sigma in [0.2, 1.5]. These only bias shapes; strata are computed from the finished board.",
    "certification": "Solver (i) row-by-row column backtracking and solver (ii) bitmask region DFS with minimum remaining values must both report exactly one solution and the same solution; replay.solutions is checked again at prepare time. Every region must be orthogonally connected.",
    "labels": "Region ids are relabelled by first appearance in row-major order (historical convention), so labels carry no generator or solution order.",
    "symmetry": "Canonical form = minimum over the 8 rotations/reflections of the grid relabelled by first appearance in row-major order. Candidates whose canonical form equals a historical board, a development board or an earlier accepted panel board are rejected.",
    "node_definition": "A node is one tentative queen placement passing the solver's constraint checks. Row solver: rows top to bottom, columns left to right. MRV solver: region with fewest available cells (ties lowest id), cells row-major. nodes_first counts until the first solution; nodes_uniqueness counts until exhaustion with a two-solution limit.",
    "tier_metric": "Mean over the 8 dihedral orientations of log2(row-solver uniqueness nodes), so the tier does not depend on board orientation.",
    "strata": "singleton status (>= 1 single-cell region vs none) x tier (tier metric <= vs > the median of the development pool for the same size and singleton status).",
    "quotas": "64 boards per size: 16 per stratum, 8 per generator per stratum. Phase 1 fills each generator's own quotas. Phase 2 (top-up) lets the other generator fill a stratum that a generator could not fill within its budget, recorded as top_up=true. Remaining gaps are recorded as shortfalls, never substituted from another stratum.",
    "propagation": "Simple propagation: a region, row or column with exactly one candidate cell forces a queen; each queen eliminates its row, column, region and 8 neighbours; rounds repeat until nothing is forced.",
    "greedy": "Unplaced region with the fewest immediately legal cells (ties lowest id), first legal cell row-major, no backtracking; oracle only scores.",
    "uniform_random_completion": "Exact DP: uniform unoccupied region, then uniform cell from the raw (all region cells) or local (immediately legal) menu; success only if every placement is on the unique solution.",
    "exploration_disclosure": "Generator shapes and the tier rule were chosen after exploratory runs with master seeds 1 and 2, which are not part of any corpus. The development pool (DEV_SEED) and panel (PANEL_SEED) were generated after the rule was fixed.",
}


def stratum(profile_row, cutoffs):
    status = "singleton" if profile_row["has_singleton"] else "no_singleton"
    cutoff = cutoffs[str(profile_row["size"])][status]
    tier = "lower_search" if profile_row[TIER_METRIC] <= cutoff else "higher_search"
    return status, tier


def evaluate_candidate(generator, size, master_seed, index, seen):
    """Generate and certify one candidate; return (code, record-or-None)."""
    seed = candidate_seed(master_seed, generator, size, index)
    grid, params = GENERATE[generator](size, seed)
    if grid is None:
        return ("R" if generator == "solution_first_growth" and "repair_moves" in params else "G"), None
    # Relabel by first appearance (historical convention). Without this,
    # solution-first labels would follow seed order, i.e. the solution's rows.
    grid = relabel(grid)
    if not well_formed(grid) or not all_regions_connected(grid):
        return "W", None
    cert = certify(grid)
    if not cert["solvers_agree"]:
        return "X", None
    if not cert["unique"]:
        return ("Z" if cert["solution_count_row_solver"] == 0 else "M"), None
    key = canonical(grid)
    if key in seen:
        return seen[key], None
    record = {"size": size, "regions": [list(row) for row in grid], "generator": generator,
              "master_seed": master_seed, "candidate_index": index, "candidate_seed": seed,
              "generator_params": params, "canonical_sha256": canonical_sha256(grid),
              "certification": {"connected_regions": True, "row_solver_solutions": cert["solution_count_row_solver"],
                                "mrv_solver_solutions": cert["solution_count_mrv_solver"], "solvers_agree": True,
                                "row_solver": cert["row_solver"], "mrv_solver": cert["mrv_solver"]},
              "profile": profile(grid, cert), "_solution": list(cert["solution"]), "_key": key}
    return "A", record


def historical_boards(evidence=None):
    data = json.loads(pathlib.Path(evidence or SITE / "public/evidence/trajectory-study.json").read_text())
    return data["boards"]


def build_development(sizes, per_status, budgets, seen, log):
    pool = []
    for size in sizes:
        for generator in GENERATORS:
            counts = collections.Counter()
            codes = []
            for index in range(budgets[size]):
                if counts["singleton"] >= per_status and counts["no_singleton"] >= per_status:
                    break
                code, record = evaluate_candidate(generator, size, DEV_SEED, index, seen)
                if record:
                    status = "singleton" if record["profile"]["has_singleton"] else "no_singleton"
                    if counts[status] >= per_status:
                        code = "Q"
                    else:
                        counts[status] += 1
                        seen[record["_key"]] = "P"
                        record["role"] = "development"
                        pool.append(record)
                codes.append(code)
            log.append({"corpus": "development", "size": size, "generator": generator, "phase": "development",
                        "master_seed": DEV_SEED, "first_index": 0, "codes": "".join(codes),
                        "counts": dict(collections.Counter(REASONS[c] for c in codes)),
                        "accepted_by_status": dict(counts),
                        "shortfall": {s: per_status - counts[s] for s in ("singleton", "no_singleton") if counts[s] < per_status}})
    return pool


def tier_cutoffs(pool, sizes):
    cutoffs = {}
    for size in sizes:
        cutoffs[str(size)] = {}
        for status in ("singleton", "no_singleton"):
            values = [r["profile"][TIER_METRIC] for r in pool if r["size"] == size and
                      (r["profile"]["has_singleton"] == (status == "singleton"))]
            cutoffs[str(size)][status] = statistics.median(values) if values else None
    return cutoffs


def build_panel(sizes, per_size, budgets, top_up_budgets, cutoffs, seen, log):
    per_stratum = per_size // len(STRATA)
    per_generator = per_stratum // len(GENERATORS)
    accepted = []
    next_index = {}
    for size in sizes:
        for generator in GENERATORS:
            counts = collections.Counter()
            codes = []
            index = 0
            while index < budgets[size] and any(counts[s] < per_generator for s in STRATA):
                code, record = evaluate_candidate(generator, size, PANEL_SEED, index, seen)
                if record:
                    key = stratum(record["profile"], cutoffs)
                    if counts[key] >= per_generator:
                        code = "Q"
                    else:
                        counts[key] += 1
                        seen[record["_key"]] = "P"
                        record.update(role="test", stratum={"singleton_status": key[0], "tier": key[1]}, top_up=False)
                        accepted.append(record)
                codes.append(code)
                index += 1
            next_index[(size, generator)] = index
            log.append({"corpus": "panel", "size": size, "generator": generator, "phase": "own_quota",
                        "master_seed": PANEL_SEED, "first_index": 0, "codes": "".join(codes),
                        "counts": dict(collections.Counter(REASONS[c] for c in codes)),
                        "accepted_by_stratum": {"/".join(s): counts[s] for s in STRATA},
                        "shortfall": {"/".join(s): per_generator - counts[s] for s in STRATA if counts[s] < per_generator}})
        for generator in GENERATORS:  # phase 2: top up strata another generator could not fill
            totals = collections.Counter((r["stratum"]["singleton_status"], r["stratum"]["tier"]) for r in accepted if r["size"] == size)
            deficit = {s: per_stratum - totals[s] for s in STRATA if totals[s] < per_stratum}
            if not deficit:
                break
            start = next_index[(size, generator)]
            codes = []
            index = start
            while index < start + top_up_budgets[size] and deficit:
                code, record = evaluate_candidate(generator, size, PANEL_SEED, index, seen)
                if record:
                    key = stratum(record["profile"], cutoffs)
                    if key not in deficit:
                        code = "Q"
                    else:
                        deficit[key] -= 1
                        if not deficit[key]:
                            del deficit[key]
                        seen[record["_key"]] = "P"
                        record.update(role="test", stratum={"singleton_status": key[0], "tier": key[1]}, top_up=True)
                        accepted.append(record)
                codes.append(code)
                index += 1
            next_index[(size, generator)] = index
            log.append({"corpus": "panel", "size": size, "generator": generator, "phase": "top_up",
                        "master_seed": PANEL_SEED, "first_index": start, "codes": "".join(codes),
                        "counts": dict(collections.Counter(REASONS[c] for c in codes)),
                        "remaining_deficit": {"/".join(s): k for s, k in deficit.items()}})
    return accepted


def assign_ids(records, prefix, seed):
    out = []
    for size in sorted({r["size"] for r in records}):
        group = sorted((r for r in records if r["size"] == size), key=lambda r: (r["generator"], r["candidate_index"]))
        random.Random(f"{prefix}/{seed}/{size}").shuffle(group)
        for k, record in enumerate(group, 1):
            record["id"] = f"{prefix}-{size}-{k:02d}"
            out.append(record)
    return out


def public_board(record):
    board = {"id": record["id"], "size": record["size"], "regions": record["regions"]}
    out = {**board, "board_sha256": board_record_sha256(board), "solution_sha256": solution_sha256(record["_solution"])}
    out.update({k: v for k, v in record.items() if not k.startswith("_") and k not in out})
    return out


def stratum_table(records, sizes, per_size):
    per_stratum = per_size // len(STRATA)
    rows = []
    for size in sizes:
        for s in STRATA:
            group = [r for r in records if r["size"] == size and (r["stratum"]["singleton_status"], r["stratum"]["tier"]) == s]
            rows.append({"size": size, "singleton_status": s[0], "tier": s[1], "quota": per_stratum, "filled": len(group),
                         "shortfall": max(0, per_stratum - len(group)),
                         "by_generator": {g: sum(r["generator"] == g for r in group) for g in GENERATORS},
                         "top_up": sum(r["top_up"] for r in group)})
    return rows


def build(sizes=SIZES, per_size=PER_SIZE, dev_per_status=DEV_PER_STATUS_PER_GENERATOR, budgets=None,
          top_up_budgets=None, historical=None, progress=None):
    budgets = budgets or BUDGET
    top_up_budgets = top_up_budgets or TOP_UP_BUDGET
    historical = historical if historical is not None else historical_boards()
    seen = {canonical(as_grid(b["regions"])): "H" for b in historical}
    log = []
    development = build_development(sizes, dev_per_status, budgets, seen, log)
    if progress:
        progress("development", len(development))
    cutoffs = tier_cutoffs(development, sizes)
    panel = build_panel(sizes, per_size, budgets, top_up_budgets, cutoffs, seen, log)
    if progress:
        progress("panel", len(panel))
    development = assign_ids(development, "dev", DEV_SEED)
    panel = assign_ids(panel, "panel", PANEL_SEED)
    for record in development:
        status = "singleton" if record["profile"]["has_singleton"] else "no_singleton"
        record["stratum"] = dict(zip(("singleton_status", "tier"), stratum(record["profile"], cutoffs)))
        assert record["stratum"]["singleton_status"] == status
    historical_reference = []
    for board in historical:
        grid = as_grid(board["regions"])
        cert = certify(grid)
        row = profile(grid, cert)
        historical_reference.append({"id": board["id"], "size": board["size"], "canonical_sha256": canonical_sha256(grid),
                                     "solution_sha256": solution_sha256(cert["solution"]), "profile": row,
                                     "stratum_under_panel_rule": dict(zip(("singleton_status", "tier"), stratum(row, cutoffs)))
                                     if str(board["size"]) in cutoffs else None})
    common = {"schema_version": 1, "generator_version": GENERATOR_VERSION, "design": DESIGN,
              "sizes": list(sizes), "tier_metric": TIER_METRIC, "tier_cutoffs": cutoffs,
              "development_seed": DEV_SEED, "panel_seed": PANEL_SEED,
              "candidate_seed_rule": "int(sha256('queens-subq-panel/<generator_version>/<master_seed>/<generator>/<size>/<index>')[:8], big-endian)",
              "budgets": {"own_quota": {str(k): v for k, v in budgets.items()}, "top_up": {str(k): v for k, v in top_up_budgets.items()}},
              "solutions": "Not included. Each board has solution_sha256 = sha256 of the compact JSON 1-based column vector; solutions are stored only in the ignored private input file. The board uniquely determines its solution, so the hash is an integrity commitment, not secrecy."}
    corpus = {**common, "corpus": "test", "per_size": per_size, "strata": stratum_table(panel, sizes, per_size),
              "boards": [public_board(r) for r in panel], "historical_reference": historical_reference}
    dev_corpus = {**common, "corpus": "development", "per_status_per_generator": dev_per_status,
                  "boards": [public_board(r) for r in development],
                  "use": "Tier cutoffs, pilot and any harness checks. Never part of the confirmatory test panel."}
    acceptance = {"schema_version": 1, "generator_version": GENERATOR_VERSION, "reason_codes": REASONS,
                  "note": "codes[i] is the outcome of candidate first_index + i for that corpus/size/generator/phase; every candidate is reproducible from its seed rule.",
                  "streams": log,
                  "totals": {corpus_name: dict(sum((collections.Counter(s["counts"]) for s in log if s["corpus"] == corpus_name), collections.Counter()))
                             for corpus_name in ("development", "panel")}}
    solutions = {"note": "PRIVATE ground truth. Never publish, never mount into a worker, never send upstream.",
                 "boards": {r["id"]: r["_solution"] for r in development + panel}}
    return corpus, dev_corpus, acceptance, solutions


def write_json(path, value):
    path = pathlib.Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=1) + "\n")


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    commands = parser.add_subparsers(dest="command", required=True)
    b = commands.add_parser("build-panel", help="Generate the frozen development pool and stratified test panel (offline)")
    b.add_argument("--public-dir", default=str(SITE / "public/evidence/subq-panel"))
    b.add_argument("--private-dir", default=str(HERE / "input/panel-private"))
    b.add_argument("--input-dir", default=str(HERE / "input"))
    p = commands.add_parser("profile", help="Certify and profile boards from a JSON file with boards[].regions")
    p.add_argument("path")
    args = parser.parse_args(argv)
    if args.command == "build-panel":
        def progress(stage, count):
            print(json.dumps({"event": "built", "stage": stage, "boards": count}), flush=True)
        corpus, dev_corpus, acceptance, solutions = build(progress=progress)
        public = pathlib.Path(args.public_dir)
        write_json(public / "corpus.json", corpus)
        write_json(public / "development-corpus.json", dev_corpus)
        write_json(public / "acceptance-log.json", acceptance)
        write_json(pathlib.Path(args.input_dir) / "panel-corpus.json", corpus)
        write_json(pathlib.Path(args.private_dir) / "solutions.json", solutions)
        print(json.dumps({"event": "panel_corpus", "boards": len(corpus["boards"]), "development": len(dev_corpus["boards"]),
                          "shortfalls": [s for s in corpus["strata"] if s["shortfall"]]}), flush=True)
    else:
        data = json.loads(pathlib.Path(args.path).read_text())
        rows = []
        for board in data["boards"]:
            grid = as_grid(board["regions"])
            cert = certify(grid)
            rows.append({"id": board.get("id"), "connected": all_regions_connected(grid), "unique": cert["unique"],
                         "canonical_sha256": canonical_sha256(grid), "profile": profile(grid, cert) if cert["unique"] else None})
        print(json.dumps(rows, indent=1))


if __name__ == "__main__":
    main()
