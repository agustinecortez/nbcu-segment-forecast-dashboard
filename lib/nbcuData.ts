// lib/nbcuData.ts
// ─────────────────────────────────────────────────────────────────────────────
// All NBCU-specific data lives here. This is the swappable config layer —
// adapted from the Disney Segment Forecast Dashboard's disneyData.ts pattern.
//
// Baseline figures sourced per NBCU_Dashboard_Build_Spec.md Section 3:
// Comcast fiscal year 2025 Form 10-K (filed February 3, 2026); Versant Media
// Group fiscal year 2025 Form 10-K (carve-out basis).
//
// Scope: single forecast year — FY2025 pro-forma baseline growing to a
// FY2026 estimate. Not a multi-year model.
// ─────────────────────────────────────────────────────────────────────────────

export type SegmentKey = "media" | "studios" | "themeParks";

export interface DriverDefinition {
  id: string;
  label: string;
  description: string; // Tooltip text — the "basis" column from the spec
  unit: "percent" | "points"; // "percent" = organic growth rate, "points" = margin adjuster
  defaultValue: number;
  min: number;
  max: number;
  step: number;
  estimateFlag?: boolean; // true => render a visible "Est." badge in the UI
  // v2 quarterly: how this driver's annual rate distributes across Q1-Q4.
  // Must sum to 1.0. Per-quarter growth = annualRate * 4 * weight_i (see
  // NBCU_Dashboard_Build_Spec_v2_Quarterly.md Section 4.2).
  seasonalityQ1Q2Q3Q4: [number, number, number, number];
  seasonalityIsEstimate: boolean; // true for all v2 seasonality — always renders "Est." on the vector display
}

export interface PresetOption {
  id: string;
  label: string;
  value: number; // $M
}

export interface PresetDriverDefinition {
  id: string;
  label: string;
  description: string;
  defaultOptionId: string;
  options: PresetOption[];
  estimateFlag?: boolean;
}

export interface LockedLineDefinition {
  id: string;
  label: string;
  description: string;
  value: number; // $M — fixed, not user-editable
}

// v2 quarterly: a pinned actual quarter — Q1 and Q2 2026 for every segment.
// Reconciled to the primary-source 8-K exhibit (see
// NBCU_Dashboard_Build_Spec_v2_Quarterly.md Section 7). No Versant carve-out
// field — 2026 Comcast filings are already post-Versant since the separation
// completed January 2, 2026.
export interface QuarterlyActual {
  quarter: "Q1" | "Q2";
  revenue: number; // $M — as reported by Comcast, post-Versant already
  adjustedEbitda: number; // $M — same
  sourceExhibit: string; // e.g. "Q1 2026 8-K, ex99.1"
}

export interface SegmentBaseline {
  key: SegmentKey;
  name: string;
  fy25Revenue: number; // $M, pro-forma for Media
  fy25AdjustedEbitda: number; // $M, pro-forma for Media
  revenueMixNote: string; // disclosure — internal revenue-mix split used to convert
                           // growth-rate drivers into dollars, always rendered with an Est. badge
  q1Actual: QuarterlyActual;
  q2Actual: QuarterlyActual;
  drivers: DriverDefinition[];
  presetDrivers?: PresetDriverDefinition[];
  lockedLines?: LockedLineDefinition[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal revenue-mix allocations
//
// These splits are NOT separately disclosed by Comcast or Versant — the 10-Ks
// report each segment as a single revenue total. They exist only so that
// growth-rate drivers (e.g. "Peacock subscriber growth") have a dollar base to
// act on. Flagged here (SegmentBaseline.revenueMixNote, rendered with an Est.
// badge in the driver panel), in the driver tooltips, and in the dashboard
// footer.
// ─────────────────────────────────────────────────────────────────────────────

export const MEDIA_REVENUE_MIX = {
  // Sourced ratio: Peacock's own reported fiscal year 2025 revenue of $5.4B
  // against post-Versant Media's $20.4B pro-forma baseline = 26.5%. Still
  // flagged as an estimate — Comcast doesn't explicitly bridge Peacock's
  // standalone reporting basis to the Media pro-forma, and the residual
  // Linear/Other split below is an internal allocation, not disclosed.
  peacockShare: 0.265, // Peacock (streaming)
  linearShare: 0.685, // NBC broadcast + Telemundo + Bravo linear
  otherShare: 0.05, // residual content licensing/other, held flat
};

export const STUDIOS_REVENUE_MIX = {
  theatricalShare: 0.20, // Universal Filmed Entertainment theatrical slate
  licensingShare: 0.55, // content licensing (TV/streaming)
  otherShare: 0.25, // residual (themed-experience licensing, other), held flat
};

export const THEME_PARKS_REVENUE_MIX = {
  epicShare: 0.08, // Epic Universe — partial FY25 year (opened May 2025)
  legacyShare: 0.92, // legacy domestic + international parks
};

// Every dollar of event revenue (realized H1 tailwind + World Cup incremental)
// converts to $0.60 of Adjusted EBITDA — higher than base Media margin because
// production costs for these events are largely fixed/already committed.
export const EVENT_FLOW_THROUGH_RATE = 0.60;

// ─────────────────────────────────────────────────────────────────────────────
// Media
// ─────────────────────────────────────────────────────────────────────────────

const MEDIA_BASELINE: SegmentBaseline = {
  key: "media",
  name: "Media",
  fy25Revenue: 20_400,
  fy25AdjustedEbitda: 776,
  revenueMixNote:
    "Media revenue mix — Peacock 26.5% / Linear 68.5% / Other 5.0% — is an internal modeling " +
    "split used to convert growth-rate drivers into dollars. Peacock's share is sourced (Peacock's " +
    "own reported fiscal year 2025 revenue of $5.4B against the $20.4B post-Versant Media pro-forma " +
    "baseline) but still flagged as an estimate: Comcast doesn't explicitly bridge Peacock's " +
    "standalone reporting basis to the Media pro-forma, and the residual Linear/Other split is not " +
    "independently disclosed.",
  q1Actual: {
    quarter: "Q1",
    revenue: 7_280,
    adjustedEbitda: -426,
    sourceExhibit: "Q1 2026 8-K, ex99.1 (ex991-3312026.htm), Content & Experiences table",
  },
  q2Actual: {
    quarter: "Q2",
    revenue: 5_691,
    adjustedEbitda: 708,
    sourceExhibit: "Q2 2026 8-K, ex99.1 (ex991-6302026.htm), Content & Experiences table",
  },
  drivers: [
    {
      id: "peacockSubGrowth",
      label: "Peacock Subscriber Growth",
      description:
        "Fiscal year 2025 grew approximately 22% year over year. Applied against an internal " +
        "modeling allocation of 26.5% of Media revenue attributed to Peacock — sourced from " +
        "Peacock's own reported fiscal year 2025 revenue of $5.4B against the $20.4B post-Versant " +
        "Media baseline, though the reconciliation basis isn't explicitly bridged by Comcast.",
      unit: "percent",
      defaultValue: 20,
      min: 0,
      max: 40,
      step: 1,
      seasonalityQ1Q2Q3Q4: [0.25, 0.20, 0.25, 0.30],
      seasonalityIsEstimate: true,
    },
    {
      id: "peacockArpuGrowth",
      label: "Peacock ARPU Growth",
      description:
        "Fiscal year 2025 revenue grew +10% on +22% subscriber growth, implying roughly flat to " +
        "down average revenue per user.",
      unit: "percent",
      defaultValue: 3,
      min: -5,
      max: 15,
      step: 0.5,
      seasonalityQ1Q2Q3Q4: [0.25, 0.25, 0.25, 0.25],
      seasonalityIsEstimate: true,
    },
    {
      id: "linearRevenueDecline",
      label: "Linear Revenue Decline",
      description:
        "Not isolated in NBCUniversal-specific disclosure at this granularity. Industry-standard " +
        "secular decline assumption — same order of magnitude used for Disney's Linear Networks " +
        "driver.",
      unit: "percent",
      defaultValue: -8,
      min: -15,
      max: 0,
      step: 0.5,
      estimateFlag: true,
      seasonalityQ1Q2Q3Q4: [0.26, 0.24, 0.25, 0.25],
      seasonalityIsEstimate: true,
    },
    {
      id: "nbaRightsDrag",
      label: "NBA Rights Cost Step-Up Drag",
      description:
        "Management commentary confirms this is a primary driver of Content & Experiences " +
        "Adjusted EBITDA decline; no isolated dollar figure published, so this is a labeled " +
        "assumption applied as a margin adjuster.",
      unit: "points",
      defaultValue: -2.5,
      min: -5.0,
      max: 0,
      step: 0.1,
      estimateFlag: true,
      seasonalityQ1Q2Q3Q4: [0.30, 0.25, 0.15, 0.30],
      seasonalityIsEstimate: true,
    },
    {
      id: "peacockLossNarrowing",
      label: "Peacock Loss Narrowing (Path to Breakeven)",
      description:
        "Comcast's chief financial officer guided Peacock to approach profitability in the " +
        "second quarter of fiscal year 2026.",
      unit: "points",
      defaultValue: 1.5,
      min: 0,
      max: 3.0,
      step: 0.1,
      seasonalityQ1Q2Q3Q4: [0.15, 0.40, 0.20, 0.25],
      seasonalityIsEstimate: true,
    },
  ],
  presetDrivers: [
    {
      id: "q3WorldCupResidual",
      label: "Q3 2026 World Cup Residual",
      description:
        "Semifinals + final + advertiser wrap-up landing in Q3. Sized off the remaining ~2 " +
        "tournament weeks of the ~5 total, with a late-round premium for higher-tier games.",
      defaultOptionId: "base",
      options: [
        { id: "low", label: "Low", value: 80 },
        { id: "base", label: "Base", value: 130 },
        { id: "high", label: "High", value: 180 },
      ],
      estimateFlag: true,
    },
  ],
  lockedLines: [
    {
      id: "realizedH1Tailwind",
      label: "Realized First-Half Event Tailwind",
      description:
        "Milan Cortina Winter Olympics + Super Bowl 60, already reported in Comcast's " +
        "first-quarter 2026 results (~$2.2 billion company-wide; Media-specific attribution is " +
        "an estimate). Locked — not adjustable.",
      value: 1_900,
    },
    {
      id: "q2WorldCupRevenue",
      label: "Q2 2026 World Cup Revenue",
      description:
        "Comcast Q2 2026 disclosure — Telemundo Spanish-language World Cup revenue realized in " +
        "Q2 alone. Not adjustable. Source: Q2 2026 8-K, ex99.1 (ex991-6302026.htm): \"Excluding " +
        "$440 million of incremental revenue from the FIFA World Cup, Media revenue increased " +
        "15.6%.\"",
      value: 440,
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Studios
// ─────────────────────────────────────────────────────────────────────────────

const STUDIOS_BASELINE: SegmentBaseline = {
  key: "studios",
  name: "Studios",
  fy25Revenue: 11_286,
  fy25AdjustedEbitda: 1_099,
  revenueMixNote:
    "Studios revenue mix — Theatrical 20% / Content Licensing 55% / Other 25% — is an internal " +
    "modeling split used to convert growth-rate drivers into dollars. No percentage breakdown is " +
    "publicly disclosed by Comcast, only qualitative direction; Studios also has real intercompany " +
    "eliminations with Media that make a clean external split especially hard to source. Unsourced " +
    "modeling assumption, not a disclosed figure.",
  q1Actual: {
    quarter: "Q1",
    revenue: 3_426,
    adjustedEbitda: 555,
    sourceExhibit: "Q1 2026 8-K, ex99.1 (ex991-3312026.htm), Content & Experiences table",
  },
  q2Actual: {
    quarter: "Q2",
    revenue: 3_040,
    adjustedEbitda: 202,
    sourceExhibit: "Q2 2026 8-K, ex99.1 (ex991-6302026.htm), Content & Experiences table",
  },
  drivers: [
    {
      id: "contentLicensingGrowth",
      label: "Content Licensing Growth",
      description: "Fiscal year 2025 revenue +1.7%.",
      unit: "percent",
      defaultValue: 5,
      min: 0,
      max: 15,
      step: 0.5,
      seasonalityQ1Q2Q3Q4: [0.25, 0.25, 0.25, 0.25],
      seasonalityIsEstimate: true,
    },
    {
      id: "theatricalSlatePerformance",
      label: "Theatrical Slate Performance",
      description:
        "2026's confirmed slate: Christopher Nolan's 'The Odyssey' (released July 17, 2026 — " +
        "Nolan's biggest global opening ever at $264M worldwide), 'Minions & Monsters' (released " +
        "July 1, 2026), and 'The Super Mario Galaxy Movie' (released April 1, 2026, $131M domestic " +
        "opening). Note: 'Fast & Furious 11' is NOT a 2026 release — retitled 'Fast Forever' and " +
        "redated to March 17, 2028 — and is excluded from this slate. A judgment-based magnitude " +
        "grounded in named, real titles and their actual/confirmed release dates — not a disclosed " +
        "NBCUniversal figure.",
      unit: "percent",
      defaultValue: 10,
      min: -10,
      max: 20,
      step: 0.5,
      estimateFlag: true,
      seasonalityQ1Q2Q3Q4: [0.10, 0.30, 0.35, 0.25],
      seasonalityIsEstimate: true,
    },
    {
      id: "contentProductionCostInflation",
      label: "Content Production Cost Inflation",
      description: "Industry-wide talent and production budget inflation.",
      unit: "points",
      defaultValue: -1.5,
      min: -4.0,
      max: 0,
      step: 0.1,
      estimateFlag: true,
      seasonalityQ1Q2Q3Q4: [0.25, 0.25, 0.25, 0.25],
      seasonalityIsEstimate: true,
    },
    {
      id: "slateSizeMarketingSpendGrowth",
      label: "Slate Size & Marketing Spend Growth",
      description:
        "Sourced to The Hollywood Reporter's studio profit report: NBCUniversal's studio unit's " +
        "bottom line dropped in calendar year 2025, driven by a bigger slate — more titles " +
        "released means more marketing and production spend spread across more films.",
      unit: "points",
      defaultValue: -1.5,
      min: -5.0,
      max: 0,
      step: 0.1,
      estimateFlag: true,
      seasonalityQ1Q2Q3Q4: [0.20, 0.30, 0.30, 0.20],
      seasonalityIsEstimate: true,
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Theme Parks
// ─────────────────────────────────────────────────────────────────────────────

const THEME_PARKS_BASELINE: SegmentBaseline = {
  key: "themeParks",
  name: "Theme Parks",
  fy25Revenue: 9_836,
  fy25AdjustedEbitda: 3_080,
  revenueMixNote:
    "Theme Parks revenue mix — Epic Universe 8% / Legacy Parks 92% — is an internal modeling " +
    "split used to convert growth-rate drivers into dollars. Comcast discloses only qualitative " +
    "direction (e.g. Epic Universe driving growth), not a percentage breakdown. Unsourced modeling " +
    "assumption, not a disclosed figure.",
  q1Actual: {
    quarter: "Q1",
    revenue: 2_331,
    adjustedEbitda: 551,
    sourceExhibit: "Q1 2026 8-K, ex99.1 (ex991-3312026.htm), Content & Experiences table",
  },
  q2Actual: {
    quarter: "Q2",
    revenue: 2_413,
    adjustedEbitda: 609,
    sourceExhibit: "Q2 2026 8-K, ex99.1 (ex991-6302026.htm), Content & Experiences table",
  },
  drivers: [
    {
      id: "epicAttendanceRamp",
      label: "Epic Universe Attendance Ramp",
      description:
        "Fiscal year 2025 only captured a partial year (opened May 2025) — same calendar-artifact " +
        "caution as the Disney build's 53rd week. Fiscal year 2026 is the first full year and will " +
        "show inflated organic-looking growth if this isn't called out.",
      unit: "percent",
      defaultValue: 20,
      min: 0,
      max: 40,
      step: 1,
      seasonalityQ1Q2Q3Q4: [0.20, 0.30, 0.30, 0.20],
      seasonalityIsEstimate: true,
    },
    {
      id: "perCapitaSpendingGrowth",
      label: "Per Capita Spending Growth",
      description: "Called out explicitly in Comcast's fourth-quarter commentary as a growth driver.",
      unit: "percent",
      defaultValue: 4,
      min: 0,
      max: 10,
      step: 0.5,
      seasonalityQ1Q2Q3Q4: [0.25, 0.25, 0.25, 0.25],
      seasonalityIsEstimate: true,
    },
    {
      id: "legacyParksGrowth",
      label: "Legacy Domestic Parks Growth",
      description: "Not separately disclosed from the Epic Universe ramp.",
      unit: "percent",
      defaultValue: 2,
      min: -5,
      max: 10,
      step: 0.5,
      estimateFlag: true,
      seasonalityQ1Q2Q3Q4: [0.20, 0.30, 0.30, 0.20],
      seasonalityIsEstimate: true,
    },
    {
      id: "epicLaunchCostRollOff",
      label: "Epic Universe Launch-Cost Roll-Off",
      description:
        "Margin compressed ~2.9 points year over year in fiscal year 2025 (34.2% to 31.3%) despite " +
        "14.2% revenue growth, driven by Epic Universe's launch-year cost load (marketing, staffing " +
        "ramp, pre-opening costs) landing against only a partial year of revenue. This driver is a " +
        "positive adjuster representing partial recovery as fiscal year 2026 is confirmed as Epic " +
        "Universe's first full year of operation and one-time launch costs roll off. A labeled, " +
        "conservative assumption, not a disclosed figure.",
      unit: "points",
      defaultValue: 2.5,
      min: 0,
      max: 4.0,
      step: 0.1,
      estimateFlag: true,
      seasonalityQ1Q2Q3Q4: [0.35, 0.25, 0.20, 0.20],
      seasonalityIsEstimate: true,
    },
    {
      id: "universalKidsResortLaunchCostDrag",
      label: "Universal Kids Resort Launch-Cost Drag",
      description:
        "Sourced to Comcast's fourth-quarter 2025 earnings commentary confirming 2026 brings both " +
        "Epic Universe's first full year and the Universal Kids Resort opening — same launch-cost " +
        "mechanism that compressed fiscal year 2025 Theme Parks margin, applied a second time at a " +
        "smaller assumed scale since Kids Resort is not Epic Universe-sized. No disclosed cost " +
        "figure exists for this specific opening.",
      unit: "points",
      defaultValue: -1.0,
      min: -3.0,
      max: 0,
      step: 0.1,
      estimateFlag: true,
      seasonalityQ1Q2Q3Q4: [0.20, 0.25, 0.30, 0.25],
      seasonalityIsEstimate: true,
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Prior FY 2026 Forecast — v1's frozen base case (shipped July 3, 2026)
//
// Pulled live from nbcu-segment-forecast-dashboard.vercel.app on 2026-07-23,
// all three tabs, after clicking "Reset all drivers to default values" to
// confirm true default state (identical before/after reset — no stale
// slider state). Not driver-adjustable; frozen forever regardless of v2
// slider mechanics. See NBCU_Dashboard_Build_Spec_v2_Quarterly.md Section 4.4
// for the Media discrepancy note (live figures differ slightly from an
// earlier spec draft; live figures are what's used here).
// ─────────────────────────────────────────────────────────────────────────────

export const PRIOR_FY26_FORECAST: Record<
  SegmentKey,
  { revenue: number; adjustedEbitda: number; margin: number }
> = {
  media: { revenue: 22_733, adjustedEbitda: 1_881, margin: 8.3 },
  studios: { revenue: 11_822, adjustedEbitda: 792, margin: 6.7 },
  themeParks: { revenue: 10_581, adjustedEbitda: 3_471, margin: 32.8 },
};

// ─────────────────────────────────────────────────────────────────────────────
// Company configuration
// ─────────────────────────────────────────────────────────────────────────────

export interface CompanyConfig {
  companyName: string;
  parentTicker: string;
  baselineYear: string;
  forecastYear: string;
  segments: SegmentBaseline[];
  sourceDisclosure: string[];
  proFormaDisclosure: string;
  ebitdaAlignmentDisclosure: string;
  saplessFramingDisclosure: string;
  versantExclusionFootnote: string;
  educationalDisclosureLong: string;
  educationalDisclosureShort: string;
  githubUrl: string;
  comcastIrUrl: string;
  aboutText: string;
}

export const NBCU_CONFIG: CompanyConfig = {
  companyName: "NBCUniversal (post-Versant, within Comcast's Content & Experiences segment)",
  parentTicker: "CMCSA",
  baselineYear: "FY25 (pro-forma)",
  forecastYear: "FY26F",
  segments: [MEDIA_BASELINE, STUDIOS_BASELINE, THEME_PARKS_BASELINE],

  proFormaDisclosure:
    "Comcast's fiscal year 2025 Form 10-K (filed February 3, 2026) reports the Media segment " +
    "including Versant, because the separation did not close until January 2, 2026. The " +
    "post-Versant Media baseline shown here is a constructed pro-forma — a subtraction, not a " +
    "Comcast-published recast.",

  ebitdaAlignmentDisclosure:
    "Adjusted EBITDA definitions between Comcast's segment reporting and Versant's standalone " +
    "10-K may not perfectly align — the Media Adjusted EBITDA subtraction ($3,196M − $2,420M " +
    "carve-out basis = $776M) is more approximate than the revenue subtraction.",

  saplessFramingDisclosure:
    "This dashboard is a driver-based planning prototype demonstrating the analytical approach " +
    "SAP Analytics Cloud Planning is designed to enable at enterprise scale, built in React " +
    "because SAP Analytics Cloud access requires enterprise licensing not available to an " +
    "individual developer.",

  versantExclusionFootnote:
    "This dashboard reflects NBCUniversal's post-Versant structure. Versant Media Group — CNBC, " +
    "USA Network, MS NOW (formerly MSNBC), Golf Channel, E!, SYFY, Oxygen, and complementary " +
    "digital properties — separated from Comcast on January 2, 2026, and is excluded from every " +
    "figure shown here. The Media segment's revenue and Adjusted EBITDA are Comcast's as-reported " +
    "Content & Experiences figures minus Versant's standalone carve-out, a constructed pro-forma " +
    "estimate rather than a Comcast-published recast.",

  // Exact wording pulled from the live Disney Segment Forecast Dashboard
  // (disney-segment-dashboard.vercel.app) — not a paraphrase.
  educationalDisclosureLong:
    "This dashboard is presented for educational and methodology demonstration purposes only and " +
    "is not investment advice or a recommendation to buy, hold, or sell any security.",
  educationalDisclosureShort: "Educational use only · Not investment advice",

  sourceDisclosure: [
    "Comcast fiscal year 2025 Form 10-K (filed February 3, 2026)",
    "Versant Media Group fiscal year 2025 Form 10-K",
    "Comcast first-quarter 2026 earnings release and call commentary",
    "Sportico World Cup advertising revenue reporting via Awful Announcing",
    "World Advertising Research Center global ad trends research",
  ],

  githubUrl: "https://github.com/agustinecortez/nbcu-segment-forecast-dashboard",
  comcastIrUrl: "https://www.cmcsa.com/",

  aboutText:
    "This dashboard models post-Versant NBCUniversal as it sits inside Comcast's Content & " +
    "Experiences segment reporting, using publicly disclosed fiscal year 2025 figures from " +
    "Comcast's Form 10-K (filed February 3, 2026) and Versant Media Group's standalone Form " +
    "10-K. Because Comcast's fiscal year 2025 10-K still reports Media including Versant (the " +
    "separation did not close until January 2, 2026), the post-Versant Media baseline shown here " +
    "is a constructed pro-forma subtraction, not a Comcast-published recast. Several drivers — " +
    "the Media revenue-mix split, the NBA rights drag, the World Cup revenue presets, and the " +
    "Epic Universe launch-cost roll-off — are labeled estimates because NBCUniversal does not " +
    "disclose them at this granularity; each is flagged in the UI rather than presented as fact. " +
    "This is a single-year forecast (fiscal year 2025 pro-forma to a fiscal year 2026 estimate) " +
    "and does not extend to fiscal year 2027 or 2028. Adjusted EBITDA is the headline " +
    "profitability metric throughout — Comcast does not disclose segment-level depreciation and " +
    "amortization for Media, Studios, or Theme Parks individually, so an Operating Income " +
    "conversion would require an imputed allocation rather than a disclosed fact. Forecast " +
    "scenarios are illustrative and adjustable by the user; they do not represent Comcast or " +
    "NBCUniversal guidance. Built by AugieAI Execute as a methodology demonstration of " +
    "driver-based segment forecasting. This is not investment advice.",
};

// ─────────────────────────────────────────────────────────────────────────────
// Convenience: default driver values as a flat record (used for state init
// and per-segment Reset)
// ─────────────────────────────────────────────────────────────────────────────

export type DriverValues = Record<string, number>;

export function getDefaultDriverValues(): DriverValues {
  const defaults: DriverValues = {};
  for (const segment of NBCU_CONFIG.segments) {
    for (const driver of segment.drivers) {
      defaults[driver.id] = driver.defaultValue;
    }
    for (const preset of segment.presetDrivers ?? []) {
      const defaultOption = preset.options.find((o) => o.id === preset.defaultOptionId)!;
      defaults[preset.id] = defaultOption.value;
    }
  }
  return defaults;
}

export function getSegment(key: SegmentKey): SegmentBaseline {
  return NBCU_CONFIG.segments.find((s) => s.key === key)!;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sensitivity-eligible drivers — every continuous slider and preset driver
// within one segment, used to build that segment's own FY26E Adjusted EBITDA
// sensitivity tornado chart (Addendum Revision 3 Section 2: split into three
// segment-specific charts, each sorted independently). Locked lines are
// intentionally excluded: the realized first-half tailwind is an
// already-realized fact with no uncertainty band, not a forecast assumption.
// ─────────────────────────────────────────────────────────────────────────────

export interface SensitivityDriverRef {
  id: string;
  label: string;
}

export function getSensitivityDriversForSegment(key: SegmentKey): SensitivityDriverRef[] {
  const segment = getSegment(key);
  const refs: SensitivityDriverRef[] = segment.drivers.map((d) => ({ id: d.id, label: d.label }));
  for (const preset of segment.presetDrivers ?? []) {
    refs.push({ id: preset.id, label: preset.label });
  }
  return refs;
}
