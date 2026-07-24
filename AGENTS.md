<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This project runs Next.js 16 — breaking changes vs. earlier versions may affect
APIs, conventions, and file structure. Read the relevant guide in
`node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# NBCU Segment Forecast Dashboard — agent notes

Portfolio piece for AugieAI Execute, adapted from the companion
[Disney Segment Forecast Dashboard](https://github.com/agustinecortez/disney-segment-dashboard)
codebase. Same stack, same design-system pattern, different company and driver set.

**v2 quarterly rebuild (July 2026, this branch: `v2`).** The dashboard moved from an
annual-only model to a quarterly one: Q1 and Q2 2026 are pinned actuals sourced to
Comcast's own 8-K exhibits, Q3 and Q4 2026 remain driver-adjustable forecast, and the
FY26 Forecast headline is the sum of the four quarters. The primary spec for this
rebuild is `../../../NBCU_Dashboard_Build_Spec_v2_Quarterly.md` — read it before
touching `lib/nbcuData.ts` or `lib/forecastMath.ts`. It supersedes nothing below by
itself; see "Architecture" for what actually changed in code.

## Build specs — read these before changing driver logic

- `../../../NBCU_Dashboard_Build_Spec_v2_Quarterly.md` — **current spec, read this first.**
  Quarterly actuals, seasonality vectors, the six-step bridge, the FY26-Forecast-anchored
  tornado, and the live overlap-disclosure callout are all defined here (Sections 4-9).
- `../../../NBCU_Dashboard_Build_Spec.md`, `../../NBCU_Dashboard_Build_Spec_Addendum_v2.md`,
  `../../NBCU_Dashboard_Build_Spec_Addendum_v3.md` — the v1 annual-model specs (each
  addendum adds to and revises the previous one — none supersede outright). Still the
  source of truth for anything the v2 spec doesn't touch: the FY25 pro-forma baseline
  construction, the Versant carve-out methodology, revenue-mix rationale, and the
  original driver sourcing footnotes.

If you're asked to add a driver, change a default, or touch the calculation engine, read
the relevant spec section first; several values here look arbitrary until you see the
sourcing rationale behind them.

## Pre-flight items (v2) — already resolved, don't re-litigate without new data

The v2 spec gated code work on three research items, all completed and pinned into the
spec itself (§7, §1.2, §1.3) before the code below was written:

- **Q1/Q2 2026 actuals** reconciled to Comcast's own 8-K exhibits (Exhibit 99.1,
  `ex991-3312026.htm` and `ex991-6302026.htm`, both on EDGAR) — pulled via `curl` with a
  compliant `User-Agent` header (EDGAR 403s or silently empty-returns on a generic one;
  add `-L` too, since EDGAR 301-redirects a zero-padded CIK). Both exhibits are saved
  locally under `preflight/` (`preflight/q1_2026_8k.html`, `preflight/q2_2026_8k.html`,
  gitignored — raw source evidence, not app code) as the paper trail behind every pinned
  `q1Actual`/`q2Actual` figure in `lib/nbcuData.ts`.
- **2026 theatrical release calendar** researched — one correction worth remembering:
  **Fast & Furious 11 is not a 2026 release** (redated to March 17, 2028, retitled "Fast
  Forever"); it was in an earlier spec draft's assumption list and was removed.
- **NBA rights cost seasonality** — could not get a verbatim earnings-call quote to
  justify revising the existing 30/25/15/30 vector, so it was held as-is rather than
  changed off an unverified secondhand figure.

## Judgment calls made during v2 code work — confirmed correct, don't revisit

- **Locked event lines are pass-through, not additive, in Q1/Q2.** The spec's own §6.1
  text says to "add" the locked `q2WorldCupRevenue` line and split the realized H1
  tailwind across Q1/Q2 — but since Q1/Q2 are pinned *real* actuals, those events are
  already embedded in the reported numbers, so adding them again would double-count.
  Confirmed correct by Agustin; do not change `computeMediaQuarterlyForecast`'s
  treatment of these two locked lines back to additive.
- **`PRIOR_FY26_FORECAST` values** were pulled live from
  `nbcu-segment-forecast-dashboard.vercel.app` (all three tabs, after clicking "Reset all
  drivers to default values" to confirm true default state) rather than from an earlier
  spec draft's pre-filled Media numbers, which didn't match the live site. If you ever
  see a mismatch here again, trust the live site over a spec draft and flag it — don't
  silently reconcile.

## Scope discipline — don't drift without an explicit ask

- **Quarterly, not annual, as of v2**: FY25 pro-forma baseline → Q1/Q2 2026 pinned
  actuals → Q3/Q4 2026 driver-adjustable forecast → FY26 Forecast (sum of the four). No
  FY27/FY28 extension (unlike the Disney dashboard, which is multi-year).
- **Adjusted EBITDA is the only headline profitability metric.** No Operating Income
  conversion — Comcast doesn't disclose segment-level D&A for Media, Studios, or Theme
  Parks individually, only at the consolidated Content & Experiences level.
- **Never back-solve an assumption to hit a target number.** If a hand-sketched
  illustrative figure in a spec addendum doesn't match what the engine actually
  computes, that's expected — flag it, don't quietly adjust an internal constant
  (like a revenue-mix split) just to make the output match the illustration. This
  applies to seasonality vectors too (v2 Section 4.2) — the Theatrical Slate Performance
  vector was revised based on real release-calendar research, not to hit a number.
- **Terminology**: "Forecast," not "Estimate," as a period label (FY26F, not FY26E) —
  except the "Est." badge on undisclosed modeling assumptions, which stays.

## Architecture — one calculation function per segment, called everywhere

- `lib/nbcuData.ts` — all config: driver definitions (range/default/unit/estimateFlag/
  seasonalityQ1Q2Q3Q4), preset drivers (`q3WorldCupResidual`), locked lines
  (`realizedH1Tailwind`, `q2WorldCupRevenue` — both informational only, see "Judgment
  calls" above), segment baselines plus their `q1Actual`/`q2Actual` pinned quarters,
  `PRIOR_FY26_FORECAST`, revenue-mix constants, and all disclosure text.
- `lib/forecastMath.ts` — pure calculation engine, no UI dependencies.
  `computeMediaQuarterlyForecast`, `computeStudiosQuarterlyForecast`, and
  `computeThemeParksQuarterlyForecast` are each the **single source of truth** for their
  segment: the metric cards, that segment's six-step bridge, and that segment's tornado
  chart all call the same function — never re-derive the math in a component. Q1/Q2
  return the pinned actuals directly; Q3/Q4 compute from `driverValue * 4 * seasonality
  Weight` (v2 Section 4.2). `computeSegmentQuarterlyTornadoBars` perturbs a copy of the
  driver map and recomputes Q3/Q4 only (Q1/Q2 stay pinned by construction) — it does not
  have its own parallel formula. The old v1 annual functions
  (`computeMediaForecast` et al., `computeSegmentTornadoBars`) were removed in the v2
  rebuild once nothing referenced them anymore — if you're reading an older commit or a
  stale mental model that mentions them, they're gone.
- Dollar bridges are constructed so the steps sum **exactly** to the ending total by
  algebraic decomposition (see the comments in `computeMediaQuarterlyForecast` for the
  derivation) — never introduce a plug value to force a bridge to balance; if it doesn't
  balance, the decomposition is wrong.
- `buildWaterfallData` rounds the *cumulative* running total at each step (not each
  delta independently) so the on-screen rounded labels also sum exactly, not just the
  underlying floats. Keep this pattern if you add another bridge.
- **Recharts stacked-bar gotcha**: if a bar needs to represent a genuine negative value
  (a segment loss, e.g. Media Q1 2026's -$426M actual), Recharts' `stackId` stacking
  silently splits positive and negative values into separate direction-stacks per
  category and collapses the bar to near-invisible. `MarginBridgeChart.tsx` works around
  this by shifting every value up by a constant (`SHIFT`) so both the invisible base bar
  and the visible bar are always non-negative, undoing the shift only in the axis tick
  formatter. If you add a chart that can go negative, you'll likely need the same trick.

## Component conventions

- State is a single flat `DriverValues` (`Record<string, number>`) in `app/page.tsx` —
  no Redux/Zustand, no per-segment state. Driver ids are unique across all segments, so
  tab-switching naturally preserves each segment's slider state without extra plumbing.
- `MarginBridgeChart` renders always-visible two-line labels (dollar amount + detail)
  via a custom Recharts `LabelList` `content` renderer, not a hover-only tooltip. Q1/Q2
  bars render locked-blue (`--color-locked`) with a small padlock glyph; Q3/Q4 render in
  the segment accent at reduced opacity; the two true totals (FY25 Baseline, FY26
  Forecast) render at full accent opacity.
- `SeasonalitySparkline` renders a four-bar vector visualization next to every driver
  slider (Q1/Q2 dimmed, Q3/Q4 in accent) — every seasonality vector carries its own
  "Est." badge regardless of whether the driver's own annual value is flagged, since the
  vectors themselves are always a modeling construction (v2 Section 4.2).
- `TornadoChart` is segment-specific (one instance per active tab), not a single
  consolidated chart — each segment sorts its own drivers independently.
- `OverlapDisclosureCallout` is a live, conditional callout (Media tab only) — shown
  when the Peacock Loss Narrowing driver's own Q2 seasonality weight is >= 30% (read
  from `nbcuData`, not hardcoded) and the Q3 World Cup Residual preset is above Low.
  `ModelingLimitationFootnote` is the older, permanent static version of the same
  disclosure and stays in place as a secondary, always-on fallback — don't remove it
  when touching the live callout.
- Any driver, revenue-mix split, or bridge line that isn't independently disclosed by
  Comcast/Versant gets a visible `EstimateBadge` ("Est.") — this is a recurring, explicit
  requirement across all build specs, not a one-off. `RevenueMixNote` applies this same
  treatment to the internal revenue-mix constants (flagged once per segment panel rather
  than repeated on every affected slider).
- Permanent disclosure blocks (`VersantExclusionFootnote`, `ModelingLimitationFootnote`,
  `RevenueMixNote`) must render without a click or hover — the specs are explicit that
  "visible in the UI" means always-on, not discoverable. `VersantExclusionFootnote` in
  particular must stay byte-for-byte identical to v1 (spec exit criterion) — don't touch
  its text even in passing.

## Known internal (undisclosed) assumptions

`MEDIA_REVENUE_MIX`, `STUDIOS_REVENUE_MIX`, and `THEME_PARKS_REVENUE_MIX` in
`lib/nbcuData.ts` translate % growth drivers into dollars — none of these splits are
published by Comcast. Media's Peacock share (26.5%) is partially sourced (Peacock's own
reported FY2025 revenue of $5.4B against the $20.4B Media pro-forma baseline); Studios'
and Theme Parks' splits are fully unsourced modeling assumptions (Studios in particular
has real intercompany eliminations with Media that make an external split hard to
source). Don't change these without checking whether it's being done to make the
engine's output match some illustrative number — see "Scope discipline" above. The same
caution applies to every `seasonalityQ1Q2Q3Q4` vector.

## Dev

```
npm run dev      # Turbopack dev server, port 3000
npm run build    # production build (also runs the TypeScript check)
npx tsc --noEmit
npx eslint .
```
