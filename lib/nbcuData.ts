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

export interface SegmentBaseline {
  key: SegmentKey;
  name: string;
  fy25Revenue: number; // $M, pro-forma for Media
  fy25AdjustedEbitda: number; // $M, pro-forma for Media
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
// act on. Flagged here, in the driver tooltips, and in the dashboard footer.
// ─────────────────────────────────────────────────────────────────────────────

export const MEDIA_REVENUE_MIX = {
  peacockShare: 0.25, // Peacock (streaming)
  linearShare: 0.70, // NBC broadcast + Telemundo + Bravo linear
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
  drivers: [
    {
      id: "peacockSubGrowth",
      label: "Peacock Subscriber Growth",
      description:
        "Fiscal year 2025 grew approximately 22% year over year. Applied against an internal " +
        "modeling allocation of ~25% of Media revenue attributed to Peacock (not separately " +
        "disclosed by Comcast).",
      unit: "percent",
      defaultValue: 20,
      min: 0,
      max: 40,
      step: 1,
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
    },
  ],
  presetDrivers: [
    {
      id: "worldCupRevenue",
      label: "FIFA World Cup 2026 Incremental Revenue",
      description:
        "Sized off 2018 vs. 2026 Fox + Telemundo combined advertising revenue comps ($384.3M → " +
        "$850M projected), discounted per the World Advertising Research Center's finding that " +
        "U.S. World Cup ad lift is historically modest (0.4%–1% of total ad spend) and partly " +
        "redistributive rather than net-new. Telemundo-specific share of the $850M combined figure " +
        "is not disclosed — these three preset values are an estimate.",
      defaultOptionId: "base",
      options: [
        { id: "low", label: "Low", value: 150 },
        { id: "base", label: "Base", value: 275 },
        { id: "high", label: "High", value: 400 },
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
    },
    {
      id: "theatricalSlatePerformance",
      label: "Theatrical Slate Performance",
      description:
        "Fiscal year 2025 theatrical revenue down on a tough comparison versus the prior year.",
      unit: "percent",
      defaultValue: 0,
      min: -10,
      max: 20,
      step: 0.5,
    },
    {
      id: "programmingCostGrowth",
      label: "Programming & Production Cost Growth",
      description:
        "Fiscal year 2025 Adjusted EBITDA fell 21.7% despite revenue growth — this driver is what " +
        "makes that visible instead of hiding it behind a flat margin slider.",
      unit: "points",
      defaultValue: -3.0,
      min: -8.0,
      max: 0,
      step: 0.1,
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
    },
    {
      id: "epicLaunchCostRollOff",
      label: "Epic Universe Launch-Cost Roll-Off",
      description:
        "Margin compressed ~2.9 points year over year in fiscal year 2025 (34.2% to 31.3%) despite " +
        "14.2% revenue growth, driven by Epic Universe's launch-year cost load (marketing, staffing " +
        "ramp, pre-opening costs) landing against only a partial year of revenue. This driver is a " +
        "positive adjuster representing partial recovery as Epic Universe moves into its first full " +
        "year and one-time launch costs roll off — sized as roughly two-thirds of the observed " +
        "2.9-point compression. A labeled, conservative assumption, not a disclosed figure.",
      unit: "points",
      defaultValue: 2.0,
      min: 0,
      max: 4.0,
      step: 0.1,
      estimateFlag: true,
    },
  ],
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
  githubUrl: string;
  aboutText: string;
}

export const NBCU_CONFIG: CompanyConfig = {
  companyName: "NBCUniversal (post-Versant, within Comcast's Content & Experiences segment)",
  parentTicker: "CMCSA",
  baselineYear: "FY25 (pro-forma)",
  forecastYear: "FY26E",
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

  sourceDisclosure: [
    "Comcast fiscal year 2025 Form 10-K (filed February 3, 2026)",
    "Versant Media Group fiscal year 2025 Form 10-K",
    "Comcast first-quarter 2026 earnings release and call commentary",
    "Sportico World Cup advertising revenue reporting via Awful Announcing",
    "World Advertising Research Center global ad trends research",
  ],

  githubUrl: "https://github.com/agustinecortez/nbcu-segment-forecast-dashboard",

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
// across all three segments, used to build the FY26E Adjusted EBITDA
// sensitivity tornado chart (Addendum Section 3). Locked lines are
// intentionally excluded: the realized first-half tailwind is an
// already-realized fact with no uncertainty band, not a forecast assumption.
// ─────────────────────────────────────────────────────────────────────────────

export interface SensitivityDriverRef {
  id: string;
  label: string;
}

export function getAllSensitivityDrivers(): SensitivityDriverRef[] {
  const refs: SensitivityDriverRef[] = [];
  for (const segment of NBCU_CONFIG.segments) {
    for (const driver of segment.drivers) {
      refs.push({ id: driver.id, label: driver.label });
    }
    for (const preset of segment.presetDrivers ?? []) {
      refs.push({ id: preset.id, label: preset.label });
    }
  }
  return refs;
}
