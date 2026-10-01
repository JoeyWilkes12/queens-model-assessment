# Frozen table headers — design review and verification

## Contents

- [Review and change](#review-and-change)
- [Verified behavior](#verified-behavior)
- [Reproduce locally](#reproduce-locally)
- [Limits and preservation](#limits-and-preservation)

## Review and change

The existing site already centralizes all **23 table render sites** in `DataTable`. Its previous horizontal-only overflow wrapper established a scroll ancestor but did not provide a bounded vertical scrollport. Sticky header cells alone would not have frozen headers during document scrolling.

The [design system](DESIGN.md#table-behavior) now specifies one shared pattern: naturally sized short tables; viewport-bounded, two-axis scrolling for tall tables; opaque theme-aware column headers frozen inside the table; accessible scrolling instructions; measured header clearance for focused links; and unclipped printing. The editorial palette, typography, native captions and header scopes remain intact. First-column pinning is not part of this change.

Implementation: [shared component](src/App.tsx) and [table styles](src/styles.css). An independent read-only support-agent review found no concrete regression in the component, resize observer, semantics or CSS. The Impeccable adaptation workflow informed the preservation of the incumbent design and native table behavior.

## Verified behavior

Final local verification completed October 1, 2026, before 20:13:56 UTC. The exact standalone GitHub Pages build was tested under its `/queens-model-assessment/` base path on a fresh localhost preview.

- **29 route/viewport checks**, **91 rendered-table checks**, no failures or browser page errors.
- All twelve routes at **1440×1000** and **390×844**; all 23 rendered table sites covered at both sizes.
- Additional earlier-generations checks at desktop, mobile light/dark, **320×568** narrow mobile and **740×360** landscape. Five scrolled screenshots were inspected locally.
- Native captions, column scopes, named keyboard-focusable regions and linked scroll instructions verified.
- Actual header geometry checked after vertical and horizontal scrolling, including tables that have not yet scrolled past their caption. Header/body columns remained aligned.
- Header backgrounds matched the opaque theme surface; header and instruction text met **4.5:1** contrast.
- Viewport height bounds and no whole-page horizontal overflow verified. Both scroll axes remained native.
- Five keyboard checks verified that Tab from a scrolled table brought its first receipt link into view below the actual frozen header cells.
- Print media removed the height limit, overflow clipping and sticky positioning.
- Final browser console: **0 errors, 0 warnings**. TypeScript/Vite source and standalone Pages builds passed. The mechanical design detector reported no findings.

Local captures are kept under ignored `output/playwright/table-headers-{desktop,mobile,mobile-dark,narrow,landscape}-20261001.png`, rather than included in the experimental evidence bundle.

The preliminary preview served an older cached asset index, which the contrast check exposed. Verification was rerun against a fresh server serving the final built CSS. The checker was also corrected to account for the caption-to-sticky threshold and to measure the frozen cells rather than their non-sticky parent row group. No additional visual redesign or experimental recomputation followed.

## Reproduce locally

Use the standalone Pages checkout. Build before starting a **fresh** preview process:

```sh
npm run build
npm run preview -- --host 127.0.0.1 --port 4190 --strictPort
```

In another terminal, use the existing project Playwright CLI:

```sh
playwright-cli --session queens-tables-20261001 open 'http://127.0.0.1:4190/queens-model-assessment/#/earlier-generations' --headed
playwright-cli --session queens-tables-20261001 run-code --filename=scripts/verify-table-headers.js
playwright-cli --session queens-tables-20261001 console
```

The [verification helper](scripts/verify-table-headers.js) requires a returned `result: "passed"`; it throws with the detailed report on failure. It navigates localhost only, makes no model calls, changes no account settings, and captures screenshots locally. It temporarily applies theme and print variants to its own page for verification.

## Limits and preservation

Mobile verification used Chromium at mobile viewport sizes, not physical phone hardware or Safari/WebKit. Real-device Safari testing is not claimed. The implementation uses native CSS sticky positioning and scrolling, and current-browser `ResizeObserver`, without cloned headers or a virtualized table.

No experimental requests, responses, grades, costs, reports or public evidence files changed. No OpenRouter calls were made. Hosting/build configuration and unrelated dirty solver/app files were preserved. Remote publication verification uses the existing GitHub workflow and direct HTTPS reads, not remote browser automation.
