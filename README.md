# NBCU Segment Forecast Dashboard

An interactive driver-based financial scenario tool for NBCUniversal's three core segments — Media, Studios, and Theme Parks — as reported within Comcast Corporation's Content & Experiences segment, reflecting NBCUniversal's post-Versant corporate structure following the January 2, 2026 spin-off.

**v2 (July 2026): quarterly rebuild.** Q1 and Q2 2026 are now pinned actuals, sourced to Comcast's own Q1 and Q2 2026 8-K filings — Q3 and Q4 2026 remain driver-adjustable forecast, and the FY26 Forecast headline is the sum of the four quarters. v1's July 3, 2026 base case is preserved on every metric card as a frozen "Prior FY 2026 Forecast" comparison column. See "What the actuals taught us" below for what changed and why.

## Live URL

**[nbcu-segment-forecast-dashboard.vercel.app](https://nbcu-segment-forecast-dashboard.vercel.app)**

## What this dashboard does

The tool constructs a fiscal year 2025 pro-forma baseline — Comcast's reported Media segment figures (which still include Versant, since the separation closed after fiscal year end) minus Versant Media Group's own standalone carve-out revenue and Adjusted EBITDA — then builds a fiscal year 2026 forecast: Q1 and Q2 2026 as pinned actuals (Comcast's own reported figures, already post-Versant), Q3 and Q4 2026 driven by user-adjustable operational sliders across all three segments. Results display across per-segment driver panels, six-step dollar-denominated Adjusted EBITDA bridges (FY25 Baseline → Q1 → Q2 → Q3 → Q4 → FY26 Forecast), and segment-specific sensitivity tornado charts.

The dashboard is built around the same three principles as the companion Disney Segment Forecast Dashboard, with one addition specific to this build:

- **Credibility.** Every baseline figure traces to a public filing. Where an internal assumption isn't independently disclosed (a segment's internal revenue mix, a cost-growth magnitude), it's explicitly badged as an estimate rather than presented as fact.
- **Interactivity.** All drivers are live across all three segments. Metric cards, margin bridges, and sensitivity tornados all recompute from the same shared calculation per segment, so nothing can silently drift out of sync between views.
- **Disclosed limitations, not buried ones.** Known modeling gaps — for example, that Peacock's profitability guidance and the FIFA World Cup 2026 revenue estimate may partially overlap — are permanent, visible notes on the dashboard itself, not footnotes a viewer has to go looking for.

## Tech stack

- **Framework:** Next.js (App Router) with TypeScript
- **Styling:** Tailwind CSS
- **Charts:** Recharts
- **Icons:** Lucide React
- **Hosting:** Vercel
- **Development environment:** Claude Code

## Source data

Baseline and driver figures sourced from:

- Comcast Corporation's fiscal year 2025 Form 10-K (Content & Experiences segment table, filed February 3, 2026)
- Versant Media Group's fiscal year 2025 Form 10-K (standalone carve-out figures, used to back Versant out of Comcast's reported Media segment)
- Comcast's first-quarter 2026 earnings release and call commentary (Peacock subscriber and revenue figures, profitability guidance, Epic Universe and Universal Kids Resort commentary)
- Sportico's World Cup advertising revenue reporting, via Awful Announcing (2018 vs. 2026 Fox/Telemundo ad revenue comps)
- The World Advertising Research Center's global ad-trends research (historical World Cup ad-lift patterns in the United States)
- The Hollywood Reporter's annual studio profit report (calendar year 2025 studio industry commentary)
- Comcast's Q1 2026 8-K, Exhibit 99.1 (`ex991-3312026.htm`, filed April 23, 2026, EDGAR) and Q2 2026 8-K, Exhibit 99.1 (`ex991-6302026.htm`, filed July 23, 2026, EDGAR) — Content & Experiences segment tables, source for every pinned Q1/Q2 2026 actual, the $440M Q2 World Cup revenue disclosure, and the $189M Peacock quarterly profit disclosure
- The 2026 NBCUniversal theatrical release calendar (Variety, Deadline, and Nintendo/Illumination press materials) — source for the Theatrical Slate Performance seasonality vector
- v1's shipped defaults at `nbcu-segment-forecast-dashboard.vercel.app` (July 3, 2026 base case) — source for the frozen "Prior FY 2026 Forecast" column

Several drivers — the internal Media, Studios, and Theme Parks revenue-mix splits; Theatrical Slate Performance; the Universal Kids Resort launch-cost drag — are the author's constructed estimates rather than disclosed NBCUniversal or Comcast figures, and are labeled as such directly in the dashboard.

## v1 (July 3, 2026) → v2 (July 2026): what the actuals taught us

The v1 dashboard was an annual-only model. Q2 2026's earnings release (July 23, 2026) surfaced three miscalibrations worth naming:

- **World Cup was materially undersized as an annual driver.** v1's High case was $400M for the full year; Q2 alone realized $440M from Telemundo. Calibrating a Q2/Q3-concentrated event as an annual line item obscured the sizing error.
- **Studios margin compression didn't materialize.** v1 built in a -3.0pt margin drag (content cost inflation + slate/marketing spend). H1 actuals show Studios margin at 11.8% — higher than the FY25 baseline of 9.7%, not lower.
- **Theme Parks margin expansion didn't materialize either.** v1 assumed the Epic Universe launch-cost roll-off would drive margin to 32.8% in FY26. H1 came in at 24.7%, and Q2 EBITDA declined -5.1% YoY as Comcast flagged "near-term softness."

v2 preserves v1's methodology framework, adds Q1 and Q2 as locked actuals, and keeps v1's exact base case values in a "Prior FY 2026 Forecast" column on every metric card. The miscalibrations aren't hidden — they're the story.

## Disclosure

Forecast scenarios are driver-based projections and do not represent company guidance. This dashboard is presented for educational and methodology demonstration purposes only and is not investment advice or a recommendation to buy, hold, or sell any security. It is an independent analytical exercise and is not an official or endorsed publication of Comcast Corporation, NBCUniversal, or Versant Media Group.

## About the methodology

Built by **AugieAI Execute** — a methodology for closing the gap between enterprise AI experimentation and AI execution. This dashboard demonstrates driver-based segment forecasting applied to a public company undergoing active corporate restructuring, using publicly available financial disclosures.

Companion portfolio assets:
- [AI Opportunity Assessment](https://ai-opportunity-assessment-livid.vercel.app)
- [Disney Segment Forecast Dashboard](https://disney-segment-dashboard.vercel.app)

## Author

**Agustin E. Cortez, MBA** <agustin.e.cortez@gmail.com>

Finance & FP&A Leader · AI Implementation Methodology Builder
ex-American Express Global Business Travel · Warner Bros · DIRECTV Latin America · Starwood · Infineon Technologies
