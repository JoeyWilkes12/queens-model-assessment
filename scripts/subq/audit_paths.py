#!/usr/bin/env python3
"""Independent offline re-derivation of every adaptive path and forced menu."""
import collections
import itertools
import json
import pathlib

import replay


def conflicts(grid, prefix, cell):
    r, c = cell
    facts = {"row_reused": any(r == s for s, d in prefix),
             "column_reused": any(c == d for s, d in prefix),
             "region_reused": any(grid[r - 1][c - 1] == grid[s - 1][d - 1] for s, d in prefix),
             "queens_touch": any(abs(r - s) <= 1 and abs(c - d) <= 1 for s, d in prefix)}
    return [key for key, value in facts.items() if value]


def main():
    root = replay.SITE
    output = root / "output/subq-trajectories"
    plan = replay.read(output / "manifest.json")
    summary = replay.read(output / "summary.json")
    boards = {b["id"]: b for b in plan["boards"]}
    scheduled = {row["trajectory_id"] for row in plan["schedule"]}
    attempts = [replay.read(p) for p in sorted((output / "trajectories").glob("*.json"))]
    assert {row["trajectory_id"] for row in attempts} == scheduled and len(attempts) == 90
    oracle = {}
    for bid, board in boards.items():
        grid = [[chr(65 + x) for x in row] for row in board["regions"]]
        found = [p for p in itertools.permutations(range(1, board["size"] + 1)) if replay.independent_valid(grid, p)]
        assert len(found) == 1
        oracle[bid] = found[0]
    seen_calls = set()
    payload_groups = collections.defaultdict(list)
    family_traces = collections.defaultdict(list)
    historical = replay.read(root / "public/evidence/manifest.json")
    historical_semantics = set()
    for row in historical["records"]:
        if row["study"] == "2026-09-30-jev-trajectories" and row["run"].startswith("sequence-"):
            req = replay.read(root / "public/evidence" / row["files"]["request"])
            historical_semantics.add(replay.sha(replay.encoded({"state": req["state"], "questions": req["questions"]})))
    matched_calls = 0
    outcomes = collections.Counter()
    forced_total = 0
    rank_discrepancies = 0
    for attempt in attempts:
        board = boards[attempt["board_id"]]
        grid = [[chr(65 + x) for x in row] for row in board["regions"]]
        prefix = []
        n = len(grid)
        forced = calls = correct_prefix = 0
        elapsed = 0
        stop = None
        trace = []
        for index, step in enumerate(attempt["steps"], 1):
            assert step["step"] == index
            assert stop is None, "Recorded an extra decision after terminal failure"
            occupied = {grid[r - 1][c - 1] for r, c in prefix}
            regions = [chr(65 + i) for i in range(n) if chr(65 + i) not in occupied]
            label = step["region"]
            assert label in regions
            assert step["region_forced"] == (len(regions) == 1)
            assert (step["region_call"] is None) == step["region_forced"]
            all_cells = [(r + 1, c + 1) for r, row in enumerate(grid) for c, region in enumerate(row) if region == label]
            menu = [cell for cell in all_cells if not conflicts(grid, prefix, cell)] if attempt["mode"] == "local" else all_cells
            assert step["candidate_count"] == len(menu)
            if not menu:
                stop = "no_locally_legal_cell"
                break
            assert step["cell_forced"] == (len(menu) == 1)
            assert (step["cell_call"] is None) == step["cell_forced"]
            cell = tuple(step["cell"])
            assert cell in menu
            for phase in ("region", "cell"):
                if step[phase + "_forced"]:
                    forced += 1
                    assert label == regions[0] if phase == "region" else cell == menu[0]
                    continue
                cid = step[phase + "_call"]
                assert cid not in seen_calls
                seen_calls.add(cid)
                directory = output / "runs" / cid
                req = replay.read(directory / "request.json")
                body = replay.read(directory / "response.json")
                meta = replay.read(directory / "metadata.json")
                checked = replay.grade(req, body)
                assert checked["schema_valid"] and checked == replay.read(directory / "grade.json")
                assert replay.sha(replay.encoded(req)) == meta["request_sha256"]
                assert replay.sha(replay.encoded(body)) == meta["response_sha256"]
                assert req["state"]["region_grid_rows"] == grid
                assert [(p["row"], p["column"]) for p in req["state"]["placed_queens"]] == prefix
                assert req["state"]["board_id"] == attempt["board_id"]
                question = req["questions"][phase]
                expected_options = regions if phase == "region" else [f"r{r}c{c}" for r, c in menu]
                assert list(question["criteria"]) == expected_options
                assert body["answers"][phase]["choice"] == (label if phase == "region" else f"r{cell[0]}c{cell[1]}")
                if phase == "cell":
                    assert req["state"]["selected_region"] == label
                semantics = replay.sha(replay.encoded({"state": req["state"], "questions": req["questions"]}))
                matched_calls += semantics in historical_semantics
                answer = body["answers"][phase]
                payload_groups[semantics].append({"choice": answer["choice"], "distribution": replay.sha(replay.encoded(sorted(answer["probabilities"].items())))})
                rank_discrepancies += checked["questions"][phase].get("selected_below_reported_max", False)
                elapsed += meta["elapsed_seconds"]
                calls += 1
            reasons = conflicts(grid, prefix, cell)
            on_solution = oracle[attempt["board_id"]][cell[0] - 1] == cell[1]
            assert reasons == step["local_violations"] and on_solution == step["on_unique_solution"]
            trace.append((label, cell))
            if on_solution:
                correct_prefix += 1
            if reasons:
                stop = "local_rule_violation"
                break
            prefix.append(cell)
            if not on_solution:
                stop = "globally_unextendable_prefix"
                break
        if stop is None:
            assert len(prefix) == n
            columns = [next(c for r, c in prefix if r == row) for row in range(1, n + 1)]
            assert replay.independent_valid(grid, columns)
            stop = "solved"
        assert attempt["stop_reason"] == stop
        assert attempt["success"] == (stop == "solved")
        assert attempt["placement_prefix"] == [list(cell) for cell in prefix]
        assert attempt["accepted_queens"] == len(prefix)
        assert attempt["correct_queens_before_failure"] == correct_prefix
        assert attempt["http_calls"] == calls and attempt["forced_decisions"] == forced
        assert abs(attempt["api_elapsed_seconds"] - elapsed) < 1e-8
        outcomes[stop] += 1
        forced_total += forced
        family_traces[(attempt["board_id"], attempt["mode"])].append(replay.sha(replay.encoded(trace)))
    metadata_calls = {p.parent.name for p in (output / "runs").glob("*/metadata.json")}
    assert seen_calls == metadata_calls and len(seen_calls) == summary["model_calls"] == 325
    assert forced_total == summary["forced_decisions"] == 105
    assert dict(outcomes) == summary["stop_reasons"]
    repeated = [rows for rows in payload_groups.values() if len(rows) > 1]
    result = {"passed": True, "study": summary["study"], "audited_utc": replay.now(), "trajectory_attempts": len(attempts),
              "boards_independently_certified_unique": len(boards), "model_calls": len(seen_calls), "forced_decisions": forced_total,
              "stop_reasons": dict(outcomes), "exact_calls_matching_historical_jev_state_and_questions": matched_calls,
              "new_dynamic_call_states": len(seen_calls) - matched_calls,
              "unique_model_visible_payloads": len(payload_groups), "repeated_payload_groups": len(repeated),
              "repeated_groups_with_choice_variation": sum(len({row["choice"] for row in rows}) > 1 for rows in repeated),
              "repeated_groups_with_distribution_variation": sum(len({row["distribution"] for row in rows}) > 1 for rows in repeated),
              "selected_below_reported_max": rank_discrepancies,
              "ordered_trace_groups": [{"board_id": bid, "mode": mode, "attempts": len(rows), "distinct_traces": len(set(rows))}
                                       for (bid, mode), rows in family_traces.items()],
              "checks": ["Independent exhaustive unique solutions", "Every prefix and selected cell", "Raw and local menu membership and order", "Forced transitions", "Model-visible prior placements", "Strict typed response schema", "Exact receipt hashes", "Terminal stop classification", "Completed-board validity", "Model-call/forced/timing totals", "Fresh empty-board restart"]}
    replay.save(root / "public/evidence/subq-trajectory-audit.json", result)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
