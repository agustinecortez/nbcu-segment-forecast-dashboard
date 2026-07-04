# NBCU Segment Forecast Dashboard

An interactive driver-based financial scenario tool for NBCUniversal's three core segments — Media, Studios, and Theme Parks — as reported within Comcast Corporation's Content & Experiences segment, reflecting NBCUniversal's post-Versant corporate structure following the January 2, 2026 spin-off.

## Live URL

**[nbcu-segment-forecast-dashboard.vercel.app](https://nbcu-segment-forecast-dashboard.vercel.app)**

## What this dashboard does

The tool constructs a fiscal year 2025 pro-forma baseline — Comcast's reported Media segment figures (which still include Versant, since the separation closed after fiscal year end) minus Versant Media Group's own standalone carve-out revenue and Adjusted EBITDA — then projects a fiscal year 2026 estimate driven by user-adjustable operational sliders across all three segments. Results display across per-segment driver panels, dollar-denominated Adjusted EBITDA bridges, and segment-specific sensitivity tornado charts.

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

Several drivers — the internal Media, Studios, and Theme Parks revenue-mix splits; Theatrical Slate Performance; the Universal Kids Resort launch-cost drag — are the author's constructed estimates rather than disclosed NBCUniversal or Comcast figures, and are labeled as such directly in the dashboard.

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
