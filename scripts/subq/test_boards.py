"""Offline tests for board generation, certification, symmetry and profiles."""
import itertools
import json
import pathlib
import random
import unittest

import boards
import replay

EVIDENCE = replay.SITE / "public/evidence"


def letters(grid):
    return tuple(tuple(chr(65 + x) for x in row) for row in grid)


def brute_force(grid):
    n = len(grid)
    return sorted(tuple(p) for p in itertools.permutations(range(1, n + 1)) if boards.valid_solution(grid, list(p)))


class HistoricalRegressionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.study = replay.read(EVIDENCE / "trajectory-study.json")
        cls.boards = {b["id"]: boards.as_grid(b["regions"]) for b in cls.study["boards"]}

    def test_random_policy_dp_reproduces_all_18_historical_values(self):
        rows = self.study["audit"]["per_board"]
        self.assertEqual(len(rows), 18)
        for row in rows:
            grid = self.boards[row["board_id"]]
            solution = boards.certify(grid)["solution"]
            p = boards.random_policy_probability(grid, solution, row["mode"])
            self.assertAlmostEqual(p, row["uniform_random_full_solve_probability"], delta=1e-12, msg=(row["board_id"], row["mode"]))

    def test_greedy_solves_exactly_the_four_known_boards(self):
        solved = sorted(board_id for board_id, grid in self.boards.items()
                        if boards.greedy(grid, boards.certify(grid)["solution"])["solved"])
        self.assertEqual(solved, ["sequence-5-1", "sequence-5-3", "sequence-7-1", "sequence-9-2"])
        prefixes = {board_id: boards.greedy(grid, boards.certify(grid)["solution"])["correct_prefix"] for board_id, grid in self.boards.items()}
        # Methods critique section 3: stops after 2, 1, 4, 2 and 2 placements.
        self.assertEqual([prefixes[k] for k in ("sequence-5-2", "sequence-7-2", "sequence-7-3", "sequence-9-1", "sequence-9-3")], [2, 1, 4, 2, 2])

    def test_row_solver_nodes_match_the_historical_generator_records(self):
        recorded = {g["board_id"]: g["row_search_nodes"] for g in self.study["manifest"]["generation"]}
        for board_id, grid in self.boards.items():
            self.assertEqual(boards.solve_rows(grid)["nodes_total"], recorded[board_id], board_id)

    def test_historical_boards_certify_connect_and_are_canonically_distinct(self):
        keys = set()
        for board_id, grid in self.boards.items():
            certificate = boards.certify(grid)
            self.assertTrue(certificate["unique"] and certificate["solvers_agree"], board_id)
            self.assertEqual(replay.solutions(letters(grid)), (certificate["solution"],))
            self.assertTrue(boards.all_regions_connected(grid))
            self.assertEqual(boards.relabel(grid), grid)  # first-appearance labels, as generated boards use
            keys.add(boards.canonical(grid))
        self.assertEqual(len(keys), 9)


class HandCheckedProfileTests(unittest.TestCase):
    def test_sequence_5_1_profile(self):
        # 0 0 0 0 1 / 0 0 0 0 0 / 0 0 0 2 2 / 3 4 4 2 2 / 4 4 4 4 4
        grid = boards.as_grid(replay.read(EVIDENCE / "trajectory-study.json")["boards"][0]["regions"])
        p = boards.profile(grid)
        self.assertEqual(p["region_sizes_sorted"], [1, 1, 4, 7, 12])
        self.assertEqual(p["singleton_regions"], 2)
        self.assertTrue(p["has_singleton"])
        self.assertEqual(p["region_size_max_min_ratio"], 12)
        self.assertAlmostEqual(p["region_size_gini"], 56 / 125)  # sum((2i-n+1)v_i) / (n * total)
        # Round 1: singleton regions B (r1c5) and D (r4c1). Round 2: region C has
        # only r3c4 and column 2 only r2c2. Round 3: region E has only r5c3.
        prop = boards.propagate(grid)
        self.assertEqual((prop["forced_placements"], prop["rounds"], prop["solved"]), (5, 3, True))
        self.assertEqual(prop["placed"], [(0, 4), (1, 1), (2, 3), (3, 0), (4, 2)])
        self.assertEqual(boards.certify(grid)["solution"], (5, 2, 4, 1, 3))
        # Greedy: B, D, C, then A/E tie broken to A, then E; all on solution.
        self.assertEqual(p["greedy"], {"solved": True, "correct_prefix": 5, "stop_reason": "solved"})
        # Raw menus never change, so the random policy succeeds with 1/prod(region sizes).
        self.assertAlmostEqual(p["uniform_random_completion"]["raw"], 1 / (12 * 1 * 4 * 1 * 7))
        self.assertEqual((p["row_solver_nodes_first"], p["row_solver_nodes_uniqueness"]), (12, 13))

    def test_extendable_equals_solution_membership_on_viable_prefixes(self):
        grid = boards.as_grid(replay.read(EVIDENCE / "trajectory-study.json")["boards"][4]["regions"])
        solution = boards.certify(grid)["solution"]
        truth = [(r, c - 1) for r, c in enumerate(solution)]
        for k in range(len(grid)):
            prefix = truth[:k]
            for r in range(len(grid)):
                for c in range(len(grid)):
                    expected = boards.legal(grid, prefix, (r, c)) and (r, c) in truth
                    self.assertEqual(boards.extendable(grid, prefix + [(r, c)]), expected)


class SolverAndGeneratorTests(unittest.TestCase):
    def test_generators_are_deterministic_and_seed_sensitive(self):
        for generator in boards.GENERATORS:
            for n in (5, 7, 9):
                seeds = [boards.candidate_seed(99, generator, n, i) for i in range(40)]
                first = [boards.GENERATE[generator](n, s) for s in seeds]
                again = [boards.GENERATE[generator](n, s) for s in seeds]
                self.assertEqual(first, again)
                grids = [g for g, _ in first if g is not None]
                self.assertGreater(len(set(grids)), 1)
                for grid in grids:
                    self.assertTrue(boards.well_formed(grid) and boards.all_regions_connected(grid))

    def test_repair_keeps_planted_solution_unique_and_never_creates_singletons(self):
        repaired = 0
        for i in range(40):
            rng = random.Random(i)
            queens = boards.random_placement(7, rng)
            owner = [[None] * 7 for _ in range(7)]
            for g, (r, c) in enumerate(queens):
                owner[r][c] = g
            grown = boards.as_grid(boards._grow(7, owner, rng, [1.0] * 7, set()))
            singles = sum(len(v) == 1 for v in boards.region_cells(grown).values())
            result, moves = boards.repair_to_unique(grown, queens, set(), rng)
            if result is None:
                continue
            repaired += moves > 0
            planted = tuple(c + 1 for _, c in queens)
            self.assertEqual(boards.solve_rows(result, limit=2)["solutions"], [planted])
            self.assertTrue(boards.all_regions_connected(result))
            self.assertLessEqual(sum(len(v) == 1 for v in boards.region_cells(result).values()), singles)
            self.assertTrue(all(result[r][c] == grown[r][c] for r, c in queens))
        self.assertGreater(repaired, 5)

    def test_two_solvers_agree_including_ambiguous_and_unsolvable_candidates(self):
        kinds = set()
        for generator in boards.GENERATORS:
            for n in (5, 7):
                for i in range(30):
                    grid, _ = boards.GENERATE[generator](n, boards.candidate_seed(5, generator, n, i))
                    if grid is None:
                        continue
                    rows = sorted(boards.solve_rows(grid, limit=10 ** 6)["solutions"])
                    mrv = boards.solve_regions_mrv(grid, limit=10 ** 6)["solutions"]
                    self.assertEqual(rows, mrv)
                    self.assertEqual(rows, list(replay.solutions(letters(grid))))
                    self.assertEqual(rows, brute_force(grid))
                    kinds.add(min(len(rows), 2))
                    certificate = boards.certify(grid)
                    self.assertEqual(certificate["unique"], len(rows) == 1)
        self.assertEqual(kinds, {0, 1, 2})

    def test_symmetry_canonicalization_and_duplicate_rejection(self):
        grid = boards.as_grid(replay.read(EVIDENCE / "trajectory-study.json")["boards"][6]["regions"])
        key = boards.canonical(grid)
        rng = random.Random(3)
        for transformed in boards.dihedral(grid):
            mapping = list(range(len(grid)))
            rng.shuffle(mapping)
            relabelled = tuple(tuple(mapping[x] for x in row) for row in transformed)
            self.assertEqual(boards.canonical(relabelled), key)
        other = boards.as_grid(replay.read(EVIDENCE / "trajectory-study.json")["boards"][7]["regions"])
        self.assertNotEqual(boards.canonical(other), key)
        self.assertEqual(len({boards.relabel(t) for t in boards.dihedral(grid)}), 8)

    def test_evaluate_candidate_rejects_symmetry_duplicates(self):
        seen = {}
        code, record = None, None
        for i in range(50):
            code, record = boards.evaluate_candidate("solution_first_growth", 5, 11, i, seen)
            if record:
                break
        self.assertEqual(code, "A")
        seen[record["_key"]] = "P"
        self.assertEqual(boards.evaluate_candidate("solution_first_growth", 5, 11, i, seen), ("P", None))
        seen[record["_key"]] = "H"
        self.assertEqual(boards.evaluate_candidate("solution_first_growth", 5, 11, i, seen)[0], "H")

    def test_propagation_is_sound(self):
        for generator in boards.GENERATORS:
            for i in range(60):
                code, record = boards.evaluate_candidate(generator, 7, 13, i, {})
                if not record:
                    continue
                grid = boards.as_grid(record["regions"])
                truth = {(r, c - 1) for r, c in enumerate(record["_solution"])}
                self.assertTrue(set(boards.propagate(grid)["placed"]) <= truth)


class PanelBuilderTests(unittest.TestCase):
    def small(self, **kw):
        options = dict(sizes=(5,), per_size=8, dev_per_status=2, budgets={5: 3000}, top_up_budgets={5: 2000})
        options.update(kw)
        return boards.build(**options)

    def test_build_is_deterministic_quota_bound_and_solution_free(self):
        first = self.small()
        self.assertEqual(first, self.small())
        corpus, development, acceptance, solutions = first
        self.assertEqual(len(corpus["boards"]), 8)
        for row in corpus["strata"]:
            self.assertEqual((row["filled"], row["shortfall"]), (2, 0))
            self.assertEqual(set(row["by_generator"].values()), {1})
        public = json.dumps([corpus, development, acceptance])
        for board_id, columns in solutions["boards"].items():
            self.assertNotIn('"_solution"', public)
            board = next(b for b in corpus["boards"] + development["boards"] if b["id"] == board_id)
            self.assertEqual(board["solution_sha256"], boards.solution_sha256(columns))
            self.assertNotIn(json.dumps(columns), json.dumps({k: v for k, v in board.items() if k != "regions"}))
        stream = acceptance["streams"][0]
        self.assertEqual(sum(stream["counts"].values()), len(stream["codes"]))

    def test_unfillable_stratum_is_recorded_not_substituted(self):
        corpus, _, acceptance, _ = self.small(budgets={5: 3000}, top_up_budgets={5: 1}, per_size=400)
        shortfalls = [row for row in corpus["strata"] if row["shortfall"]]
        self.assertTrue(shortfalls)
        for row in corpus["strata"]:
            group = [b for b in corpus["boards"] if (b["stratum"]["singleton_status"], b["stratum"]["tier"]) == (row["singleton_status"], row["tier"])]
            self.assertEqual(len(group), row["filled"])
            self.assertLessEqual(row["filled"], row["quota"])
        self.assertTrue(any(s.get("shortfall") for s in acceptance["streams"] if s["corpus"] == "panel"))


class FrozenCorpusTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.corpus = replay.read(EVIDENCE / "subq-panel/corpus.json")
        cls.development = replay.read(EVIDENCE / "subq-panel/development-corpus.json")

    def test_strata_and_counts(self):
        self.assertEqual(len(self.corpus["boards"]), 192)
        for size in (5, 7, 9):
            group = [b for b in self.corpus["boards"] if b["size"] == size]
            self.assertEqual(len(group), 64)
            for status, tier in boards.STRATA:
                cell = [b for b in group if (b["stratum"]["singleton_status"], b["stratum"]["tier"]) == (status, tier)]
                self.assertEqual(len(cell), 16)
                self.assertEqual(sorted(b["generator"] for b in cell), sorted(boards.GENERATORS * 8))
        self.assertFalse([s for s in self.corpus["strata"] if s["shortfall"]])

    def test_every_board_is_certified_unique_distinct_and_committed(self):
        historical = {boards.canonical(boards.as_grid(b["regions"])) for b in boards.historical_boards()}
        keys = set()
        for board in self.corpus["boards"] + self.development["boards"]:
            grid = boards.as_grid(board["regions"])
            self.assertEqual(boards.relabel(grid), grid)
            self.assertTrue(boards.all_regions_connected(grid))
            certificate = boards.certify(grid)
            self.assertTrue(certificate["unique"], board["id"])
            self.assertEqual(boards.solution_sha256(certificate["solution"]), board["solution_sha256"])
            self.assertEqual(boards.canonical_sha256(grid), board["canonical_sha256"])
            key = boards.canonical(grid)
            self.assertNotIn(key, historical)
            self.assertNotIn(key, keys)
            keys.add(key)
            self.assertEqual(board["profile"]["has_singleton"], board["stratum"]["singleton_status"] == "singleton")
            self.assertEqual(dict(zip(("singleton_status", "tier"), boards.stratum(board["profile"], self.corpus["tier_cutoffs"]))), board["stratum"])

    def test_profiles_recompute_exactly(self):
        for board in self.corpus["boards"][::6]:
            self.assertEqual(boards.profile(boards.as_grid(board["regions"])), board["profile"], board["id"])

    def test_candidates_reproduce_from_recorded_seeds(self):
        for board in self.corpus["boards"][::16]:
            code, record = boards.evaluate_candidate(board["generator"], board["size"], board["master_seed"], board["candidate_index"], {})
            self.assertEqual(code, "A")
            self.assertEqual(record["regions"], board["regions"])


if __name__ == "__main__":
    unittest.main()
