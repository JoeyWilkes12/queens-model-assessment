# Response: "The AI cost of JavaScript frameworks"

November 5, 2026. A review of Nolan Lawson's [The AI cost of JavaScript frameworks](https://nolanlawson.com/2026/10/28/the-ai-cost-of-javascript-frameworks/) (October 28, 2026) for this book: which findings apply, and what they suggest. Nothing here is implemented yet.

## Contents

- [What the benchmark measured](#what-the-benchmark-measured)
- [How far it transfers to this book](#how-far-it-transfers-to-this-book)
- [Findings that apply](#findings-that-apply)
- [Suggestions](#suggestions)
- [What not to conclude](#what-not-to-conclude)

## What the benchmark measured

- **The task:** an agent (Claude Code with Opus 5.5, high effort) built the same small Pokémon app from a spec and an accessibility-tree conformance suite in 12 frameworks. Each framework got five runs; medians are reported.
- **What was recorded:**
  - Agent cost: API-price dollars, wall-clock time, tokens and lines of code.
  - Lighthouse on the home page: mobile, 4× CPU, Slow 4G.
- **Headline results:**
  - Hono+htmx was cheapest ($2.67 a run) and Angular the most expensive ($4.97).
  - Cost tracked time, tokens and code size.
  - Every framework scored CLS 0 except the frameworkless Vite build (0.111).
  - JavaScript transferred ranged from 0 KiB (Astro) to 142 KiB (Next.js). The author: "LCP here is mostly a function of JavaScript bundle size."
- **Stated limits:**
  - One content-style app.
  - Highly stochastic agent runs.
  - Lighthouse favors multi-page apps.
  - Dollar figures are list prices, not spend.
  - Pre-rendered static HTML was forbidden.
  - Agents were not asked to optimize.

## How far it transfers to this book

This book is closer to his "holotype" than most apps: a content-heavy, Wikipedia-like reading site with charts and a searchable catalog. But it differs in ways that matter:

- **It already exists.** The ongoing agent cost here is editing and extending a large codebase, not building from a spec. His lines-of-code and token findings speak to that indirectly.
- **It is a React 18 + Vite single-page app** with hash routing on GitHub Pages, serving a large static evidence bundle. His React entries were full-stack frameworks with server rendering (Next.js, React Router, TanStack Start), so their numbers are not our numbers.
- **The hardware and app differ.** His LCP figures cannot be compared with ours. Our own matched measurements are in [the November 5 results](../output/performance/2026-11-05/results.md).

## Findings that apply

1. **JavaScript size drives first paint, and our data agrees.**
   - Cutting the entry bundle from 182 to 127 kB gzip in PR #14 coincided with earlier LCP on every mobile route, with the largest effect (2.45 → 1.25 s) on the local chapter. Some of that gain also came from the loading shell.
   - At 127 kB gzip, our entry is in the same range as his React framework entries (115–142 KiB). React DOM alone is about 42 kB gzip of it.
2. **Agents don't reserve layout unless something makes them.**
   - His only non-zero CLS came from the build with no framework conventions.
   - Ours (0.27 on the local chapter) came from short loading states that agents had written chapter by chapter. It was fixed in PR #14.
   - In both cases, frameworks or explicit acceptance criteria, not agent judgment, kept layout stable.
3. **Code size is an ongoing token cost.** He notes that code size "ultimately impacts the number of tokens, including in future edits." This is the clearest lesson for us:
   - `src/App.tsx` is 1,374 lines and 140 kB, roughly 35,000 tokens. It holds about a dozen chapters inline.
   - It has 24 lines over 500 characters, the longest 5,309, so agents editing it read large blocks to change small ones.
   - Agents on this repo (Claude, Codex) touch `App.tsx` in most website changes, so its size is paid again on every edit. It is also the largest module in the entry bundle: about 203 kB before minification, against React DOM's 184 kB.
4. **Familiar tools cost less.** His most expensive runs were frameworks the model had to look up (SvelteKit v3's migration guide, Gracile's source). React and Vite are well represented in training data, which favors staying on them.
5. **Instructions and skills are context, and context has a price.** He suspects framework MCP servers and skills "may be doing more harm than good" (untested). Our `AGENTS.md` and `CLAUDE.md` add about 5 kB to every session. That is modest now, but it should stay concise.
6. **Measure, then decide.** His method matches ours: medians of five runs with ranges, mobile 4× CPU, slow network. He also reports **Total Blocking Time**, which our harness lacks. Our 12× CPU trace found main-thread work absorbing the summary's network gain, and TBT would quantify exactly that.

## Suggestions

In order of value for effort:

1. **Write a performance budget into `AGENTS.md`**, so future agent PRs keep the gains without being reminded. Cost: a few lines. Three checks:
   - Entry JS stays at or below about 135 kB gzip.
   - Loading layout shift stays 0 on the three measured routes.
   - Below-the-fold evidence stays deferred.
2. **Enforce the bundle part in CI.** A small script would read the production build and fail if the entry chunk exceeds the budget. Unlike the browser checks, it needs no browser, so it can run in the existing `validate` job.
3. **Add Total Blocking Time and long tasks to `ab-lab.cjs`.** That way the CPU-bound case the review exposed is measured on every comparison, not only in a one-off trace.
4. **Split `App.tsx` into one module per chapter**, with shared UI in a neutral module. This was already in Codex's stage 3. There are three reasons:
   - Agent edits read and rewrite much less text.
   - Those chapters can then load lazily like the ten split in PR #14, shrinking the entry further.
   - It ends the 5,000-character lines.

   It is mechanical, but touches most of the app. Do it as its own PR with the browser checks from PR #14, and measure both bundle size and an agent edit's token use before and after.
5. **Evaluate, but do not adopt yet: a lighter runtime.** Aliasing React to Preact's compatibility layer would save most of React DOM's ~42 kB gzip. His benchmark did not test Preact, and compatibility gaps would need checking across every chapter. Worth a measured spike only if the budget becomes binding.
6. **Evaluate later: prerendered chapter pages.**
   - His fastest results came from frameworks that ship little or no JavaScript (Astro 0 KiB, LCP 810 ms). The book's content is static, so prerendering each chapter's HTML is plausible in principle.
   - It would need path-based routes in place of hash routes (with a GitHub Pages fallback), and a rework of how evidence loads.
   - It is a large architectural change. Revisit only if mobile first-paint becomes the priority after the split in suggestion 4.

## What not to conclude

- **No framework migration is justified by this article.** It tested one different app, the author calls the runs "very stochastic", and he explicitly does not recommend a framework. His Lighthouse metrics also favor multi-page apps by design.
- **React is not the bottleneck here.** The bundle came down 31% without changing framework, by not shipping chapters the page does not show.
- **The dollar figures say nothing about this project's model-assessment spend,** which is evaluation inference, not agent coding.
