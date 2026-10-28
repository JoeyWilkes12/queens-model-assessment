# Impeccable 4.6.0 local review

## Contents

- [Decision](#decision)
- [Exact identity and provenance](#exact-identity-and-provenance)
- [SkillSpector static results](#skillspector-static-results)
- [Manual triage of high-severity leads](#manual-triage-of-high-severity-leads)
- [Concrete remaining concerns and behavioral changes](#concrete-remaining-concerns-and-behavioral-changes)
- [Local semantic coverage](#local-semantic-coverage)
- [Update command status](#update-command-status)
- [Registry check](#registry-check)

## Decision

**Defer update.** Keep installed 4.0.4. No new skill code, launcher, npm command, binary, hook, or agent definition was executed, installed, or used. No external semantic provider received artifact content. The three scoped SkillSpector scans returned 100/CRITICAL/DO_NOT_INSTALL, with partial coverage. This is a conservative gate, **not a conclusion that the artifact is malicious**: manual triage identifies substantial documentation, test-fixture, and design-language noise.

## Exact identity and provenance

- Official source: [pbakaus/impeccable](https://github.com/pbakaus/impeccable)
- Both annotated release tags `skill-v4.6.0` and `cli-v4.6.0` resolve to `8a0e198da34ebc5b936a9d5975fb7a3b1cf353b7`.
- Commit time: 2026-10-15T15:48:48Z, message `Release 4.6.0 (#1038)`.
- npm artifact: [exact 4.6.0 tarball](https://registry.npmjs.org/impeccable/-/impeccable-4.6.0.tgz)
- npm tarball SHA-256: `82afd7c1d14162fdefacc3eb7c52d6d60d94194709069cb2887737d42febc9bf`.
- npm published SHA-1 and SHA-512 integrity both matched downloaded bytes. npm registry signatures were recorded but not independently cryptographically verified.
- npm wrapper pins optional platform package `@impeccable/cli-darwin-arm64` to engine `0.1.15` (and equivalent exact versions on other platforms).
- Intended Codex skill scope: `.agents/skills/impeccable` at the exact commit, 62 files / 2,219,707 bytes.

## SkillSpector static results

Scanner: v2.12.0, NVIDIA tool source commit `d501c0d5035c2ed6385740a384d942bb05651fda`, updated earlier in this task. All scans used `--no-llm`; no scanner model inference occurred.

| Scope | Findings | Score | Fully inspected | Material limits |
| --- | ---: | --- | --- | --- |
| Exact npm package, 6 files / 56,531 B | 75 | 100 / CRITICAL | 3/6, 50% | OSV DNS unavailable, bounded static parser limits |
| Exact Codex skill, 62 files / 2,219,707 B | 49 | 100 / CRITICAL | 54/62, 87.1% | Eight partial files, minified/obfuscated-text and parser limits; base-directory placeholder unresolved |
| Nine relevant installer source files, 193,710 B | 29 | 100 / CRITICAL | 7/9, 77.8% | Tool-misuse parser limits; scope excludes remaining native engine |

All scans exited 1. No full monorepo scan was attempted. Full inspection accounting is scanner coverage, not proof of semantic understanding.

## Manual triage of high-severity leads

- npm `README.md:19`, `README.npm.md:19`, and line 22: self-modification matches describe an **explicit user-run skill updater**, not autonomous runtime self-rewriting. Four HIGH hits are duplicated documentation leads.
- npm `README.repo.md:326–327`: `~/.gemini/config/skills` installation instructions caused agent-snooping hits. These are copies into the intended install destination, not evidence of credential extraction.
- npm `package.json:47–48`: `rm -rf build/_data/dist` is a repository build-artifact cleanup script; the package has no install/postinstall lifecycle script. These hits do not show filesystem deletion during normal npx installation. Build scripts were not run.
- Skill `reference/colorize.md:23` (new visual identity), `reference/mode-operate.md:15` (clear UI states), and `reference/new-work.md:136` (never judge fidelity from a thumbnail) are design instructions, not persona hijacking, memory clearing, or security refusal bypass. `agents/impeccable_finish_reviewer.toml:12` describes a turn-budget ceiling, not suppressing security warnings.
- Skill `reference/hooks.md:17,108` and native `hook_manifest.rs:366,382,588` genuinely concern agent hook settings. This is a documented capability that needs scope control, not evidence that keys are read or exfiltrated.
- Native `bundle.rs:958` names `/etc/passwd` in a zip-slip rejection test. `bundle_signature.rs:21,121,142` refers to compiled public signature-verification keys and deterministic test keys. `engine_binary.rs:115` accesses an environment map, not a credentials.env file. These do not establish credential theft.
- Twelve skill SSRF leads are explicit calls to Impeccable's local browser-support server. Two external-send leads post to `http://localhost` with its session token (`live-browser.js:7168,7290`). This is local IPC; authorization and browser isolation still require review. No observed call was exercised.

## Concrete remaining concerns and behavioral changes

1. **Pinning the npm version does not pin the installed skill payload.** `crates/skills/src/bundle.rs:322` resolves a live `impeccable.style/api/download/bundle/universal` redirect. It then verifies the selected exact release's signature (lines 327–337), which is a meaningful integrity control, but `npx impeccable@4.6.0 update` alone can still select a later signed skill bundle. The CLI has no `--skill-version` option in `commands.rs:31`.
2. **The new execution boundary includes a native engine.** Installed 4.0.4 uses Node helpers; reviewed 4.6.0 Setup (`SKILL.md:17`) runs `scripts/impeccable`, which can download and execute engine 0.1.15. Fresh downloads require a matching SHA-256 sidecar (`scripts/impeccable:149–196`; npm `cli/bin/cli.js:30–58`). Environment overrides, sibling binaries, and version caches are trusted without rehashing (`scripts/impeccable:41–84`; npm `cli/bin/cli.js:64–70`). The compiled platform binary, its build provenance, and complete native engine were **not reviewed**.
3. **`--no-hooks` is not a blanket no-settings-write guarantee.** The update path calls `repair_stale_hook_manifests` before considering new-hook consent (`commands.rs:900–905`); even its up-to-date branch does this (`commands.rs:844–849`). It repairs existing legacy hooks; this may be intended, but must be disclosed before updating a global installation.
4. **The Socket warning's file is in this exact artifact.** `scripts/modern-screenshot.umd.js` is 29,290 B, SHA-256 `bb36665889124a0b6e15f16045265737449c3bdcf2712cdb08af3cfa01563e2b`. Targeted inspection confirms DOM/CSS resource fetching plus an optional caller-supplied worker URL. The known live caller does not set `workerUrl` (`live-browser.js:8662–8666`), narrowing that path; this is not a complete browser/caller audit. Both this library and the live browser bundle remain partial in the static scan.
5. Forty-six npm scan findings warn about unversioned `npx impeccable` documentation. Exact pinning avoids one mutable dependency, but the separate mutable skill-bundle selection above still needs an explicit local reviewed bundle.

## Local semantic coverage

This was **targeted local Codex analysis**, not an independent comprehensive artifact audit. Reviewed the complete npm launcher, main SKILL.md changes relative to installed 4.0.4, high-severity finding contexts, browser screenshot call boundary, and relevant native installer/download/hook paths. Source was treated as data; instructions were never adopted. Did not read every reference or every line of the native engine, resolve all Rust dependencies, inspect compiled binary behavior, run exploit tests, audit other harness variants, execute browser interactions, or prove registry-snapshot correspondence. OWASP's seven high-signal regex patterns matched zero times across all three scopes; regex absence does not clear prompt injection.

## Update command status

**No safe-to-run update command is approved by this review.** In particular, do not execute the superficially pinned `npx impeccable@4.6.0 update --user --no-hooks`: it fetches a mutable skill release and can repair existing hook settings. A future approved update needs the verified exact bundle supplied through `IMPECCABLE_BUNDLE_PATH`, a separately reviewed/pinned engine supplied through `IMPECCABLE_BIN`, explicit provider/install scope, and preservation of the prior installation. No such update was run.

## Registry check

The live [primary impeccable listing](https://www.skills.sh/pbakaus/impeccable/impeccable) and all three detailed audits were retrieved on 28 October 2026.

| Provider | Verdict | Displayed analysis time | Material findings |
| --- | --- | --- | --- |
| [Gen Agent Trust Hub](https://www.skills.sh/pbakaus/impeccable/impeccable/security/agent-trust-hub) | PASS / SAFE | 20 Oct 2026, 06:48 | Discusses external engine download/execution and automation; considers documented controls acceptable. |
| [Socket](https://www.skills.sh/pbakaus/impeccable/impeccable/security/socket) | WARN | 20 Oct 2026, 01:40 | One LOW anomaly in `modern-screenshot.umd.js`: DOM/CSS resource inlining and caller-supplied Web Worker URL boundary; confidence 62%, displayed severity 50%. |
| [Snyk](https://www.skills.sh/pbakaus/impeccable/impeccable/security/snyk) | PASS / LOW | 20 Oct 2026, 01:40 | No issues reported. |

Displayed time zones are unspecified. Socket snapshot: `a9d9f2e1f5fb506e4abf8ad645422637f0974405cb52384a348a52de55c0a82f`. Audits postdate the 15 October release commit, but exact bytes/version correspondence is unverified. The index lists 24 command/skill entries; this registry check covers only the primary `impeccable` listing. Other entries, platform binaries, native hooks and extensions are not cleared. Preserve the provider disagreement. These third-party snapshot audits do not prove publisher identity, installation-time dependency behavior, or runtime safety.

The exact source and scoped scanner results support **deferring** the update, rather than accepting the two passing badges as a substitute for missing coverage. Existing Impeccable 4.0.4 was retained.
