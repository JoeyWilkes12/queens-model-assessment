# Caveman review

## Contents

- [Artifact](#artifact)
- [Static check](#static-check)
- [Registry audits](#registry-audits)
- [Semantic review and use](#semantic-review-and-use)

## Artifact

The intended treatment is the basic `skills/caveman` skill at [commit 9b68f7ed12b05e7efaff18e65c5a3fc2849fd0a4](https://github.com/juliusbrussee/caveman/tree/9b68f7ed12b05e7efaff18e65c5a3fc2849fd0a4/skills/caveman), not the rest of the upstream monorepo. The directory contains two Markdown files totaling 7,708 bytes. Exact hashes and detailed provenance are in [the public review record](../public/evidence/ollama/caveman-review.json).

## Static check

NVIDIA SkillSpector was updated from the NVIDIA origin before scanning: **v2.12.0**, tool commit `d501c0d5035c2ed6385740a384d942bb05651fda`. The exact intended directory scored **0/LOW**, with no findings across its two files. The scan was static-only: no LLM, meta-analysis, target code execution, or target installation. Seven high-signal [OWASP prompt-injection patterns](https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html) had zero matches; three fuzzy matches were ordinary output-editing guidance.

A preliminary URL-wide scan of the whole upstream monorepo produced no report after more than five minutes and was stopped. That broad scan is **incomplete**. The separate exact basic-skill scan completed. Unrelated executable/plugin directories are outside this treatment and have not been approved for installation.

## Registry audits

All three live detailed audits were retrieved on 28 October 2026:

| Provider | Published verdict | Displayed analysis time | Material detail |
| --- | --- | --- | --- |
| [Gen Agent Trust Hub](https://www.skills.sh/juliusbrussee/caveman/caveman/security/agent-trust-hub) | PASS / SAFE | 8 Oct 2026, 15:25 | Describes style guidance; no malicious mechanisms reported. |
| [Socket](https://www.skills.sh/juliusbrussee/caveman/caveman/security/socket) | PASS | 8 Oct 2026, 15:26 | No detailed alerts or issue count exposed. |
| [Snyk](https://www.skills.sh/juliusbrussee/caveman/caveman/security/snyk) | PASS / LOW | 8 Oct 2026, 15:25 | No issues detected. |

Time zone unspecified. The basic skill subtree last changed on 6 October, before these audits, although the repository HEAD includes later changes. Socket's snapshot hash is retained in the review record. Exact Git correspondence is unverified. These third-party snapshot audits do not establish publisher identity, the exact local artifact, install-time dependencies, or runtime safety.

## Semantic review and use

Local Codex (GPT-6; exact profile and effort unavailable) inspected both raw basic-skill files, 7,708 bytes. No executable code, credential access, external egress, obfuscated payload, or policy-evasion instruction was identified. The text changes answer style and explicitly preserves technical payloads, negation, clear confirmations, and required harness status. Its persistence and alias guidance is bounded by fresh one-shot requests; no sibling skill is invoked. No artifact was transmitted to an external semantic reviewer.

The review is nonblocking for the user-authorized conditional local benchmark. The applied system instruction removes YAML frontmatter only and preserves the remaining body. The artifact and applied-body hashes are recorded separately. The first baseline 5×5 strict success met the solving gate. No global installation, upstream hooks, installer scripts, or rest-of-monorepo approval is implied. The remainder of the monorepo is excluded from semantic coverage. Manual inspection and passing scans are not proofs of safety or a claim of comprehensive repository coverage.

The applied prompt is redistributed with the upstream [Apache license](../public/evidence/ollama/caveman-LICENSE), [retained MIT notice](../public/evidence/ollama/caveman-LICENSE-MIT), and [NOTICE](../public/evidence/ollama/caveman-NOTICE). The NOTICE also lists upstream runtime components that are not included in this experiment.
