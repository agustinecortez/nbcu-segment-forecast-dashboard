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

## Build specs — read these before changing driver logic

The locked build specs live one directory up, at `../NBCU_Dashboard_Build_Spec.md`,
`../NBCU_Dashboard_Build_Spec_Addendum_v2.md`, and
`../NBCU_Dashboard_Build_Spec_Addendum_v3.md` (each addendum adds to and revises the
previous one — none supersede outright). If you're asked to add a driver, change a
default, or touch the calculation engine, read the relevant spec section first; several
values here look arbitrary until you see the sourcing rationale behind them.

## Scope discipline — don't drift without an explicit ask

- **Single forecast year only**: fiscal year 2025 pro-forma baseline → fiscal year 2026
  estimate. No FY27/FY28 extension (unlike the Disney dashboard, which is multi-year).
- **Adjusted EBITDA is the only headline profitability metric.** No Operating Income
  conversion — Comcast doesn't disclose segment-level D&A for Media, Studios, or Theme
  Parks individually, only at the consolidated Content & Experiences level.
- **Never back-solve an assumption to hit a target number.** If a hand-sketched
  illustrative figure in a spec addendum doesn't match what the engine actually
  computes, that's expected — flag it, don't quietly adjust an internal constant
  (like a revenue-mix split) just to make the output match the illustration.

## Architecture — one calculation function per segment, called everywhere

- `lib/nbcuData.ts` — all config: driver definitions (range/default/unit/estimateFlag),
  preset drivers (World Cup revenue), locked lines (realized event tailwind), segment
  baselines, revenue-mix constants, and all disclosure text (footer, About modal,
  Versant exclusion footnote, revenue-mix notes).
- `lib/forecastMath.ts` — pure calculation engine, no UI dependencies. `computeMediaForecast`,
  `computeStudiosForecast`, and `computeThemeParksForecast` are each the **single source
  of truth** for their segment: the metric cards, that segment's dollar bridge, and that
  segment's tornado chart all call the same function — never re-derive the math in a
  component. `computeSegmentTornadoBars` perturbs a copy of the driver map and calls the
  identical compute function; it does not have its own parallel formula.
- Dollar bridges are constructed so the steps sum **exactly** to the ending total by
  algebraic decomposition (see the comments in `computeMediaForecast` for the derivation)
  — never introduce a plug value to force a bridge to balance; if it doesn't balance,
  the decomposition is wrong.
- `buildWaterfallData` additionally rounds the *cumulative* running total at each step
  (not each delta independently) so the on-screen rounded labels also sum exactly, not
  just the underlying floats. Keep this pattern if you add a fourth bridge.

## Component conventions

- State is a single flat `DriverValues` (`Record<string, number>`) in `app/page.tsx` —
  no Redux/Zustand, no per-segment state. Driver ids are unique across all segments, so
  tab-switching naturally preserves each segment's slider state without extra plumbing.
- `MarginBridgeChart` renders always-visible two-line labels (dollar amount + detail)
  via a custom Recharts `LabelList` `content` renderer, not a hover-only tooltip. Long
  detail strings (e.g. "−1.0 pt net (NBA drag + Peacock narrowing)") are word-wrapped
  onto a second line — see `wrapDetail` — to avoid colliding with the neighboring bar.
- `TornadoChart` is segment-specific (one instance per active tab), not a single
  consolidated chart — each segment sorts its own drivers independently.
- Any driver, revenue-mix split, or bridge line that isn't independently disclosed by
  Comcast/Versant gets a visible `EstimateBadge` ("Est.") — this is a recurring, explicit
  requirement across all three build specs, not a one-off. `RevenueMixNote` applies this
  same treatment to the internal revenue-mix constants (flagged once per segment panel
  rather than repeated on every affected slider).
- Permanent disclosure blocks (`VersantExclusionFootnote`, `ModelingLimitationFootnote`,
  `RevenueMixNote`) must render without a click or hover — the specs are explicit that
  "visible in the UI" means always-on, not discoverable.

## Known internal (undisclosed) assumptions

`MEDIA_REVENUE_MIX`, `STUDIOS_REVENUE_MIX`, and `THEME_PARKS_REVENUE_MIX` in
`lib/nbcuData.ts` translate % growth drivers into dollars — none of these splits are
published by Comcast. Media's Peacock share (26.5%) is partially sourced (Peacock's own
reported FY2025 revenue of $5.4B against the $20.4B Media pro-forma baseline); Studios'
and Theme Parks' splits are fully unsourced modeling assumptions (Studios in particular
has real intercompany eliminations with Media that make an external split hard to
source). Don't change these without checking whether it's being done to make the
engine's output match some illustrative number — see "Scope discipline" above.

## Dev

```
npm run dev      # Turbopack dev server, port 3000
npm run build    # production build (also runs the TypeScript check)
npx tsc --noEmit
npx eslint .
```
