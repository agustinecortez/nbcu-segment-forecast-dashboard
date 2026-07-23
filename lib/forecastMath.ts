// lib/forecastMath.ts
// ─────────────────────────────────────────────────────────────────────────────
// Pure forecast math functions. No UI dependencies. All dollar values in $M.
//
// Math spec: NBCU_Dashboard_Build_Spec.md Section 3-4;
// NBCU_Dashboard_Build_Spec_Addendum_v2.md Section 1-3;
// NBCU_Dashboard_Build_Spec_Addendum_v3.md Section 2-6.
//
// Scope note: single forecast year only (FY25 pro-forma baseline -> FY26E).
// "Baseline" objects below are always the fixed FY25 Section 3 figures,
// regardless of slider state — this is what the Section 7 exit criterion
// ("every slider at default reproduces the exact baseline") is checking.
//
// Single source of truth (Addendum v3 Section 6): the metric cards, each
// segment's dollar bridge, and each segment's tornado all read from the same
// compute<Segment>Forecast() function below — there is exactly one place
// per segment where Revenue/Adjusted EBITDA/Margin get computed. The tornado
// perturbs a copy of the driver map and calls the identical function; it does
// not re-derive the math independently.
// ─────────────────────────────────────────────────────────────────────────────

import {
  DriverValues,
  EVENT_FLOW_THROUGH_RATE,
  MEDIA_REVENUE_MIX,
  STUDIOS_REVENUE_MIX,
  THEME_PARKS_REVENUE_MIX,
  SegmentKey,
  SegmentBaseline,
  DriverDefinition,
  PRIOR_FY26_FORECAST,
  getSensitivityDriversForSegment,
  getSegment,
} from "./nbcuData";

export interface SegmentForecast {
  revenue: number;
  adjustedEbitda: number;
  margin: number; // percentage, e.g. 3.8
}

// Dollar-denominated margin bridge step (Addendum v3 Section 5). `delta` is
// the $M contributed by this step (signed), or the running total when
// isTotal. `detail` is the secondary label (margin %, point value, or
// blended growth %) rendered directly on the chart, always visible —
// never hidden behind a hover tooltip.
export interface DollarBridgeStep {
  label: string;
  delta: number;
  detail: string;
  isTotal: boolean;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function fmtSignedPct(v: number): string {
  const sign = v >= 0 ? "+" : "";
  return `${sign}${v.toFixed(1)}%`;
}

function fmtSignedPt(v: number): string {
  const sign = v >= 0 ? "+" : "";
  return `${sign}${v.toFixed(1)} pt`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Media
// ─────────────────────────────────────────────────────────────────────────────

export interface MediaForecastResult {
  baseline: SegmentForecast; // fixed FY25 pro-forma
  estimate: SegmentForecast; // computed FY26E
  organicRevenue: number;
  realizedTailwind: number;
  worldCupRevenue: number;
  eventRevenue: number;
  bridge: DollarBridgeStep[];
}

export function computeMediaForecast(drivers: DriverValues): MediaForecastResult {
  const seg = getSegment("media");
  const fy25Revenue = seg.fy25Revenue;
  const fy25Ebitda = seg.fy25AdjustedEbitda;
  const fy25Margin = round1((fy25Ebitda / fy25Revenue) * 100); // 3.8

  // Organic revenue — internal LOB split (see MEDIA_REVENUE_MIX) grown by
  // each driver's rate. "Other" is held flat; it has no assigned driver.
  const peacockBase = fy25Revenue * MEDIA_REVENUE_MIX.peacockShare;
  const linearBase = fy25Revenue * MEDIA_REVENUE_MIX.linearShare;
  const otherBase = fy25Revenue * MEDIA_REVENUE_MIX.otherShare;

  const peacockFY26 =
    peacockBase * (1 + drivers.peacockSubGrowth / 100) * (1 + drivers.peacockArpuGrowth / 100);
  const linearFY26 = linearBase * (1 + drivers.linearRevenueDecline / 100);
  const otherFY26 = otherBase;

  const organicRevenue = peacockFY26 + linearFY26 + otherFY26;

  // Event revenue — realized H1 tailwind (locked) + World Cup incremental (preset)
  const realizedTailwind = seg.lockedLines![0].value;
  const worldCupRevenue = drivers.worldCupRevenue;
  const eventRevenue = realizedTailwind + worldCupRevenue;

  const totalRevenue = organicRevenue + eventRevenue;

  // Dollar bridge decomposition — exact and additive, no plug required:
  //   FY25 + [organic rev growth @ FY25 margin] + [margin adjusters on grown
  //   organic revenue] + [event EBITDA] = organic EBITDA + event EBITDA
  const netAdjusterPts = drivers.nbaRightsDrag + drivers.peacockLossNarrowing;
  const revenueGrowthEbitda = organicRevenue * (fy25Margin / 100) - fy25Ebitda;
  const marginAdjusterEbitda = organicRevenue * (netAdjusterPts / 100);
  const eventEbitda = eventRevenue * EVENT_FLOW_THROUGH_RATE;

  const totalEbitda = fy25Ebitda + revenueGrowthEbitda + marginAdjusterEbitda + eventEbitda;
  const totalMargin = (totalEbitda / totalRevenue) * 100;

  const blendedGrowthPct = (organicRevenue / fy25Revenue - 1) * 100;

  const bridge: DollarBridgeStep[] = [
    { label: "FY25 Actual", delta: fy25Ebitda, detail: `${fy25Margin.toFixed(1)}% margin`, isTotal: true },
    {
      label: "Organic Revenue Growth",
      delta: revenueGrowthEbitda,
      detail: `${fmtSignedPct(blendedGrowthPct)} blended`,
      isTotal: false,
    },
    {
      label: "Margin Adjusters",
      delta: marginAdjusterEbitda,
      detail: `${fmtSignedPt(netAdjusterPts)} net (NBA drag + Peacock narrowing)`,
      isTotal: false,
    },
    {
      label: "Event Revenue Flow-Through",
      delta: eventEbitda,
      detail: `${Math.round(EVENT_FLOW_THROUGH_RATE * 100)}% flow-through`,
      isTotal: false,
    },
    { label: "FY26E", delta: totalEbitda, detail: `${totalMargin.toFixed(1)}% margin`, isTotal: true },
  ];

  return {
    baseline: { revenue: fy25Revenue, adjustedEbitda: fy25Ebitda, margin: fy25Margin },
    estimate: { revenue: totalRevenue, adjustedEbitda: totalEbitda, margin: totalMargin },
    organicRevenue,
    realizedTailwind,
    worldCupRevenue,
    eventRevenue,
    bridge,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Studios
// ─────────────────────────────────────────────────────────────────────────────

export interface StudiosForecastResult {
  baseline: SegmentForecast;
  estimate: SegmentForecast;
  bridge: DollarBridgeStep[];
}

export function computeStudiosForecast(drivers: DriverValues): StudiosForecastResult {
  const seg = getSegment("studios");
  const fy25Revenue = seg.fy25Revenue;
  const fy25Ebitda = seg.fy25AdjustedEbitda;
  const fy25Margin = round1((fy25Ebitda / fy25Revenue) * 100); // 9.7

  const theatricalBase = fy25Revenue * STUDIOS_REVENUE_MIX.theatricalShare;
  const licensingBase = fy25Revenue * STUDIOS_REVENUE_MIX.licensingShare;
  const otherBase = fy25Revenue * STUDIOS_REVENUE_MIX.otherShare;

  const theatricalFY26 = theatricalBase * (1 + drivers.theatricalSlatePerformance / 100);
  const licensingFY26 = licensingBase * (1 + drivers.contentLicensingGrowth / 100);
  const otherFY26 = otherBase;

  const revenue = theatricalFY26 + licensingFY26 + otherFY26;

  // Two cost drivers (Addendum v3 Section 3) replace the single v2 driver.
  const costPts = drivers.contentProductionCostInflation + drivers.slateSizeMarketingSpendGrowth;
  const adjustedMargin = fy25Margin + costPts;
  const adjustedEbitda = revenue * (adjustedMargin / 100);

  const blendedGrowthPct = (revenue / fy25Revenue - 1) * 100;
  const revenueGrowthEbitda = revenue * (fy25Margin / 100) - fy25Ebitda;
  const contentCostEbitda = revenue * (drivers.contentProductionCostInflation / 100);
  const slateSizeEbitda = revenue * (drivers.slateSizeMarketingSpendGrowth / 100);

  const bridge: DollarBridgeStep[] = [
    { label: "FY25 Actual", delta: fy25Ebitda, detail: `${fy25Margin.toFixed(1)}% margin`, isTotal: true },
    {
      label: "Revenue Growth",
      delta: revenueGrowthEbitda,
      detail: `${fmtSignedPct(blendedGrowthPct)} blended (2026 slate)`,
      isTotal: false,
    },
    {
      label: "Content Cost Inflation",
      delta: contentCostEbitda,
      detail: fmtSignedPt(drivers.contentProductionCostInflation),
      isTotal: false,
    },
    {
      label: "Slate Size / Marketing Spend",
      delta: slateSizeEbitda,
      detail: fmtSignedPt(drivers.slateSizeMarketingSpendGrowth),
      isTotal: false,
    },
    { label: "FY26E", delta: adjustedEbitda, detail: `${adjustedMargin.toFixed(1)}% margin`, isTotal: true },
  ];

  return {
    baseline: { revenue: fy25Revenue, adjustedEbitda: fy25Ebitda, margin: fy25Margin },
    estimate: { revenue, adjustedEbitda, margin: adjustedMargin },
    bridge,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Theme Parks
// ─────────────────────────────────────────────────────────────────────────────

export interface ThemeParksForecastResult {
  baseline: SegmentForecast;
  estimate: SegmentForecast;
  bridge: DollarBridgeStep[];
}

export function computeThemeParksForecast(drivers: DriverValues): ThemeParksForecastResult {
  const seg = getSegment("themeParks");
  const fy25Revenue = seg.fy25Revenue;
  const fy25Ebitda = seg.fy25AdjustedEbitda;
  const fy25Margin = round1((fy25Ebitda / fy25Revenue) * 100); // 31.3

  const epicBase = fy25Revenue * THEME_PARKS_REVENUE_MIX.epicShare;
  const legacyBase = fy25Revenue * THEME_PARKS_REVENUE_MIX.legacyShare;

  const epicFY26 =
    epicBase * (1 + drivers.epicAttendanceRamp / 100) * (1 + drivers.perCapitaSpendingGrowth / 100);
  const legacyFY26 =
    legacyBase * (1 + drivers.legacyParksGrowth / 100) * (1 + drivers.perCapitaSpendingGrowth / 100);

  const revenue = epicFY26 + legacyFY26;

  // Epic Universe launch-cost roll-off (revised default, Addendum v3) plus
  // the new Universal Kids Resort launch-cost drag — same launch-cost
  // mechanism applied a second time at a smaller assumed scale.
  const adjusterPts = drivers.epicLaunchCostRollOff + drivers.universalKidsResortLaunchCostDrag;
  const adjustedMargin = fy25Margin + adjusterPts;
  const adjustedEbitda = revenue * (adjustedMargin / 100);

  const blendedGrowthPct = (revenue / fy25Revenue - 1) * 100;
  const revenueGrowthEbitda = revenue * (fy25Margin / 100) - fy25Ebitda;
  const epicRollOffEbitda = revenue * (drivers.epicLaunchCostRollOff / 100);
  const kidsResortEbitda = revenue * (drivers.universalKidsResortLaunchCostDrag / 100);

  const bridge: DollarBridgeStep[] = [
    { label: "FY25 Actual", delta: fy25Ebitda, detail: `${fy25Margin.toFixed(1)}% margin`, isTotal: true },
    {
      label: "Revenue Growth",
      delta: revenueGrowthEbitda,
      detail: `${fmtSignedPct(blendedGrowthPct)} blended`,
      isTotal: false,
    },
    {
      label: "Epic Universe Roll-Off",
      delta: epicRollOffEbitda,
      detail: fmtSignedPt(drivers.epicLaunchCostRollOff),
      isTotal: false,
    },
    {
      label: "Universal Kids Resort Drag",
      delta: kidsResortEbitda,
      detail: `${fmtSignedPt(drivers.universalKidsResortLaunchCostDrag)}, est.`,
      isTotal: false,
    },
    { label: "FY26E", delta: adjustedEbitda, detail: `${adjustedMargin.toFixed(1)}% margin`, isTotal: true },
  ];

  return {
    baseline: { revenue: fy25Revenue, adjustedEbitda: fy25Ebitda, margin: fy25Margin },
    estimate: { revenue, adjustedEbitda, margin: adjustedMargin },
    bridge,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// v2 quarterly forecast — per-quarter compute functions
//
// Math spec: NBCU_Dashboard_Build_Spec_v2_Quarterly.md Section 6.
//
// Q1 and Q2 are pinned actuals (SegmentBaseline.q1Actual / q2Actual) —
// already-reported figures that inherently include the Realized H1 Event
// Tailwind and the Q2 World Cup Revenue as reported fact. Those two locked
// lines are therefore NOT re-added on top of the Q1/Q2 actuals here (that
// would double-count real, already-realized revenue); they remain in
// nbcuData.ts purely as sourced disclosure context for the UI. Only Q3
// (which carries the q3WorldCupResidual preset) and Q4 are computed from
// live driver values.
//
// Per-quarter rate: annualValue * 4 * seasonalityWeight_i (Section 4.2) —
// an even 25/25/25/25 vector reproduces the same annual rate in every
// quarter; non-even vectors concentrate or spread it. The same formula
// applies to both percent growth-rate drivers and points-based margin
// adjusters.
// ─────────────────────────────────────────────────────────────────────────────

export interface QuarterlyForecast {
  revenue: number;
  adjustedEbitda: number;
  margin: number; // percentage
  isActual: boolean; // true for Q1/Q2, false for Q3/Q4
}

export interface SegmentForecastV2 {
  baseline: SegmentForecast; // fixed FY25 pro-forma
  q1: QuarterlyForecast; // pinned actual
  q2: QuarterlyForecast; // pinned actual
  q3: QuarterlyForecast; // driver-adjustable
  q4: QuarterlyForecast; // driver-adjustable
  fy26Forecast: SegmentForecast; // q1 + q2 + q3 + q4, margin recomputed
  priorFy26Forecast: SegmentForecast; // frozen v1 base case
  bridge: DollarBridgeStep[]; // FY25 -> Q1 -> Q2 -> Q3 -> Q4 -> FY26F, 6 steps
}

function quarterlyRate(annualValue: number, weight: number): number {
  return annualValue * 4 * weight;
}

function actualToQuarterlyForecast(actual: { revenue: number; adjustedEbitda: number }): QuarterlyForecast {
  return {
    revenue: actual.revenue,
    adjustedEbitda: actual.adjustedEbitda,
    margin: round1((actual.adjustedEbitda / actual.revenue) * 100),
    isActual: true,
  };
}

function findDriver(seg: SegmentBaseline, id: string): DriverDefinition {
  return seg.drivers.find((d) => d.id === id)!;
}

/**
 * Six-step waterfall shared by every segment (Section 6.3). Q1 is flagged
 * isTotal here as a deliberate geometry reset — it lets buildWaterfallData
 * render Q1's bar at its own absolute EBITDA (not a delta from FY25) while
 * reusing the exact same telescoping-rounding helper unchanged. Q2/Q3/Q4
 * then float in sequence so their bar heights are each quarter's own
 * absolute EBITDA too, and their sum lands exactly on FY26 Forecast. UI
 * color styling (locked-blue for Q1/Q2, segment accent for Q3/Q4, navy for
 * the two true totals) is applied by label in the chart component,
 * independent of this isTotal flag.
 */
function buildSixStepBridge(
  fy25Ebitda: number,
  fy25Margin: number,
  q1: QuarterlyForecast,
  q2: QuarterlyForecast,
  q3: QuarterlyForecast,
  q4: QuarterlyForecast,
  fy26Forecast: SegmentForecast
): DollarBridgeStep[] {
  return [
    { label: "FY25 Baseline", delta: fy25Ebitda, detail: `${fy25Margin.toFixed(1)}% margin`, isTotal: true },
    { label: "Q1", delta: q1.adjustedEbitda, detail: `${q1.margin.toFixed(1)}% margin (actual)`, isTotal: true },
    { label: "Q2", delta: q2.adjustedEbitda, detail: `${q2.margin.toFixed(1)}% margin (actual)`, isTotal: false },
    { label: "Q3", delta: q3.adjustedEbitda, detail: `${q3.margin.toFixed(1)}% margin (forecast)`, isTotal: false },
    { label: "Q4", delta: q4.adjustedEbitda, detail: `${q4.margin.toFixed(1)}% margin (forecast)`, isTotal: false },
    {
      label: "FY26 Forecast",
      delta: fy26Forecast.adjustedEbitda,
      detail: `${fy26Forecast.margin.toFixed(1)}% margin`,
      isTotal: true,
    },
  ];
}

export function computeMediaQuarterlyForecast(drivers: DriverValues): SegmentForecastV2 {
  const seg = getSegment("media");
  const fy25Revenue = seg.fy25Revenue;
  const fy25Ebitda = seg.fy25AdjustedEbitda;
  const fy25Margin = round1((fy25Ebitda / fy25Revenue) * 100);

  const q1 = actualToQuarterlyForecast(seg.q1Actual);
  const q2 = actualToQuarterlyForecast(seg.q2Actual);

  const subDriver = findDriver(seg, "peacockSubGrowth");
  const arpuDriver = findDriver(seg, "peacockArpuGrowth");
  const linearDriver = findDriver(seg, "linearRevenueDecline");
  const nbaDriver = findDriver(seg, "nbaRightsDrag");
  const narrowDriver = findDriver(seg, "peacockLossNarrowing");

  function computeQuarter(quarterIdx: 2 | 3): QuarterlyForecast {
    const peacockBase = (fy25Revenue * MEDIA_REVENUE_MIX.peacockShare) / 4;
    const linearBase = (fy25Revenue * MEDIA_REVENUE_MIX.linearShare) / 4;
    const otherBase = (fy25Revenue * MEDIA_REVENUE_MIX.otherShare) / 4;

    const subRate = quarterlyRate(drivers.peacockSubGrowth, subDriver.seasonalityQ1Q2Q3Q4[quarterIdx]);
    const arpuRate = quarterlyRate(drivers.peacockArpuGrowth, arpuDriver.seasonalityQ1Q2Q3Q4[quarterIdx]);
    const linearRate = quarterlyRate(drivers.linearRevenueDecline, linearDriver.seasonalityQ1Q2Q3Q4[quarterIdx]);

    const peacockQ = peacockBase * (1 + subRate / 100) * (1 + arpuRate / 100);
    const linearQ = linearBase * (1 + linearRate / 100);
    const otherQ = otherBase;
    const organicRevenue = peacockQ + linearQ + otherQ;

    const nbaPts = quarterlyRate(drivers.nbaRightsDrag, nbaDriver.seasonalityQ1Q2Q3Q4[quarterIdx]);
    const narrowPts = quarterlyRate(drivers.peacockLossNarrowing, narrowDriver.seasonalityQ1Q2Q3Q4[quarterIdx]);
    const netAdjusterPts = nbaPts + narrowPts;

    const revenueGrowthEbitda = organicRevenue * (fy25Margin / 100) - fy25Ebitda / 4;
    const marginAdjusterEbitda = organicRevenue * (netAdjusterPts / 100);

    // Only Q3 (index 2) carries the World Cup residual — Q4 has no event line.
    const eventRevenue = quarterIdx === 2 ? drivers.q3WorldCupResidual : 0;
    const eventEbitda = eventRevenue * EVENT_FLOW_THROUGH_RATE;

    const revenue = organicRevenue + eventRevenue;
    const adjustedEbitda = fy25Ebitda / 4 + revenueGrowthEbitda + marginAdjusterEbitda + eventEbitda;

    return { revenue, adjustedEbitda, margin: round1((adjustedEbitda / revenue) * 100), isActual: false };
  }

  const q3 = computeQuarter(2);
  const q4 = computeQuarter(3);

  const fy26Revenue = q1.revenue + q2.revenue + q3.revenue + q4.revenue;
  const fy26Ebitda = q1.adjustedEbitda + q2.adjustedEbitda + q3.adjustedEbitda + q4.adjustedEbitda;
  const fy26Forecast: SegmentForecast = {
    revenue: fy26Revenue,
    adjustedEbitda: fy26Ebitda,
    margin: round1((fy26Ebitda / fy26Revenue) * 100),
  };

  return {
    baseline: { revenue: fy25Revenue, adjustedEbitda: fy25Ebitda, margin: fy25Margin },
    q1,
    q2,
    q3,
    q4,
    fy26Forecast,
    priorFy26Forecast: PRIOR_FY26_FORECAST.media,
    bridge: buildSixStepBridge(fy25Ebitda, fy25Margin, q1, q2, q3, q4, fy26Forecast),
  };
}

export function computeStudiosQuarterlyForecast(drivers: DriverValues): SegmentForecastV2 {
  const seg = getSegment("studios");
  const fy25Revenue = seg.fy25Revenue;
  const fy25Ebitda = seg.fy25AdjustedEbitda;
  const fy25Margin = round1((fy25Ebitda / fy25Revenue) * 100);

  const q1 = actualToQuarterlyForecast(seg.q1Actual);
  const q2 = actualToQuarterlyForecast(seg.q2Actual);

  const licensingDriver = findDriver(seg, "contentLicensingGrowth");
  const theatricalDriver = findDriver(seg, "theatricalSlatePerformance");
  const costInflationDriver = findDriver(seg, "contentProductionCostInflation");
  const slateSizeDriver = findDriver(seg, "slateSizeMarketingSpendGrowth");

  function computeQuarter(quarterIdx: 2 | 3): QuarterlyForecast {
    const theatricalBase = (fy25Revenue * STUDIOS_REVENUE_MIX.theatricalShare) / 4;
    const licensingBase = (fy25Revenue * STUDIOS_REVENUE_MIX.licensingShare) / 4;
    const otherBase = (fy25Revenue * STUDIOS_REVENUE_MIX.otherShare) / 4;

    const theatricalRate = quarterlyRate(
      drivers.theatricalSlatePerformance,
      theatricalDriver.seasonalityQ1Q2Q3Q4[quarterIdx]
    );
    const licensingRate = quarterlyRate(
      drivers.contentLicensingGrowth,
      licensingDriver.seasonalityQ1Q2Q3Q4[quarterIdx]
    );

    const theatricalQ = theatricalBase * (1 + theatricalRate / 100);
    const licensingQ = licensingBase * (1 + licensingRate / 100);
    const otherQ = otherBase;
    const revenue = theatricalQ + licensingQ + otherQ;

    const costPts = quarterlyRate(
      drivers.contentProductionCostInflation,
      costInflationDriver.seasonalityQ1Q2Q3Q4[quarterIdx]
    );
    const slatePts = quarterlyRate(
      drivers.slateSizeMarketingSpendGrowth,
      slateSizeDriver.seasonalityQ1Q2Q3Q4[quarterIdx]
    );
    const adjusterPts = costPts + slatePts;

    const revenueGrowthEbitda = revenue * (fy25Margin / 100) - fy25Ebitda / 4;
    const adjusterEbitda = revenue * (adjusterPts / 100);
    const adjustedEbitda = fy25Ebitda / 4 + revenueGrowthEbitda + adjusterEbitda;

    return { revenue, adjustedEbitda, margin: round1((adjustedEbitda / revenue) * 100), isActual: false };
  }

  const q3 = computeQuarter(2);
  const q4 = computeQuarter(3);

  const fy26Revenue = q1.revenue + q2.revenue + q3.revenue + q4.revenue;
  const fy26Ebitda = q1.adjustedEbitda + q2.adjustedEbitda + q3.adjustedEbitda + q4.adjustedEbitda;
  const fy26Forecast: SegmentForecast = {
    revenue: fy26Revenue,
    adjustedEbitda: fy26Ebitda,
    margin: round1((fy26Ebitda / fy26Revenue) * 100),
  };

  return {
    baseline: { revenue: fy25Revenue, adjustedEbitda: fy25Ebitda, margin: fy25Margin },
    q1,
    q2,
    q3,
    q4,
    fy26Forecast,
    priorFy26Forecast: PRIOR_FY26_FORECAST.studios,
    bridge: buildSixStepBridge(fy25Ebitda, fy25Margin, q1, q2, q3, q4, fy26Forecast),
  };
}

export function computeThemeParksQuarterlyForecast(drivers: DriverValues): SegmentForecastV2 {
  const seg = getSegment("themeParks");
  const fy25Revenue = seg.fy25Revenue;
  const fy25Ebitda = seg.fy25AdjustedEbitda;
  const fy25Margin = round1((fy25Ebitda / fy25Revenue) * 100);

  const q1 = actualToQuarterlyForecast(seg.q1Actual);
  const q2 = actualToQuarterlyForecast(seg.q2Actual);

  const epicDriver = findDriver(seg, "epicAttendanceRamp");
  const perCapitaDriver = findDriver(seg, "perCapitaSpendingGrowth");
  const legacyDriver = findDriver(seg, "legacyParksGrowth");
  const epicRollOffDriver = findDriver(seg, "epicLaunchCostRollOff");
  const kidsResortDriver = findDriver(seg, "universalKidsResortLaunchCostDrag");

  function computeQuarter(quarterIdx: 2 | 3): QuarterlyForecast {
    const epicBase = (fy25Revenue * THEME_PARKS_REVENUE_MIX.epicShare) / 4;
    const legacyBase = (fy25Revenue * THEME_PARKS_REVENUE_MIX.legacyShare) / 4;

    const epicRate = quarterlyRate(drivers.epicAttendanceRamp, epicDriver.seasonalityQ1Q2Q3Q4[quarterIdx]);
    const perCapitaRate = quarterlyRate(
      drivers.perCapitaSpendingGrowth,
      perCapitaDriver.seasonalityQ1Q2Q3Q4[quarterIdx]
    );
    const legacyRate = quarterlyRate(drivers.legacyParksGrowth, legacyDriver.seasonalityQ1Q2Q3Q4[quarterIdx]);

    const epicQ = epicBase * (1 + epicRate / 100) * (1 + perCapitaRate / 100);
    const legacyQ = legacyBase * (1 + legacyRate / 100) * (1 + perCapitaRate / 100);
    const revenue = epicQ + legacyQ;

    const rollOffPts = quarterlyRate(
      drivers.epicLaunchCostRollOff,
      epicRollOffDriver.seasonalityQ1Q2Q3Q4[quarterIdx]
    );
    const kidsResortPts = quarterlyRate(
      drivers.universalKidsResortLaunchCostDrag,
      kidsResortDriver.seasonalityQ1Q2Q3Q4[quarterIdx]
    );
    const adjusterPts = rollOffPts + kidsResortPts;

    const revenueGrowthEbitda = revenue * (fy25Margin / 100) - fy25Ebitda / 4;
    const adjusterEbitda = revenue * (adjusterPts / 100);
    const adjustedEbitda = fy25Ebitda / 4 + revenueGrowthEbitda + adjusterEbitda;

    return { revenue, adjustedEbitda, margin: round1((adjustedEbitda / revenue) * 100), isActual: false };
  }

  const q3 = computeQuarter(2);
  const q4 = computeQuarter(3);

  const fy26Revenue = q1.revenue + q2.revenue + q3.revenue + q4.revenue;
  const fy26Ebitda = q1.adjustedEbitda + q2.adjustedEbitda + q3.adjustedEbitda + q4.adjustedEbitda;
  const fy26Forecast: SegmentForecast = {
    revenue: fy26Revenue,
    adjustedEbitda: fy26Ebitda,
    margin: round1((fy26Ebitda / fy26Revenue) * 100),
  };

  return {
    baseline: { revenue: fy25Revenue, adjustedEbitda: fy25Ebitda, margin: fy25Margin },
    q1,
    q2,
    q3,
    q4,
    fy26Forecast,
    priorFy26Forecast: PRIOR_FY26_FORECAST.themeParks,
    bridge: buildSixStepBridge(fy25Ebitda, fy25Margin, q1, q2, q3, q4, fy26Forecast),
  };
}

const SEGMENT_QUARTERLY_FORECAST_FN: Record<SegmentKey, (drivers: DriverValues) => SegmentForecastV2> = {
  media: computeMediaQuarterlyForecast,
  studios: computeStudiosQuarterlyForecast,
  themeParks: computeThemeParksQuarterlyForecast,
};

/**
 * FY26-Forecast-headline-anchored tornado (Section 6.2). Perturbs one
 * driver +/-10% relative and recomputes that segment's quarterly forecast —
 * Q1/Q2 stay pinned by construction (only Q3/Q4 read from `drivers`) — then
 * reports the swing in the full FY26 Forecast headline. Locked event lines
 * are excluded by construction (getSensitivityDriversForSegment never
 * enumerates lockedLines); the Q3 World Cup Residual preset is included
 * since it's still a forecast assumption, not a realized fact.
 */
export function computeSegmentQuarterlyTornadoBars(segmentKey: SegmentKey, drivers: DriverValues): TornadoBar[] {
  const computeFn = SEGMENT_QUARTERLY_FORECAST_FN[segmentKey];
  const baseline = computeFn(drivers).fy26Forecast.adjustedEbitda;
  const refs = getSensitivityDriversForSegment(segmentKey);

  const bars: TornadoBar[] = refs.map((ref) => {
    const currentValue = drivers[ref.id];
    const upDrivers = { ...drivers, [ref.id]: currentValue * 1.1 };
    const downDrivers = { ...drivers, [ref.id]: currentValue * 0.9 };

    const upEbitda = computeFn(upDrivers).fy26Forecast.adjustedEbitda;
    const downEbitda = computeFn(downDrivers).fy26Forecast.adjustedEbitda;

    const upsideDelta = upEbitda - baseline;
    const downsideDelta = downEbitda - baseline;

    return {
      driverId: ref.id,
      driverLabel: ref.label,
      upsideDelta,
      downsideDelta,
      absSwing: Math.abs(upsideDelta - downsideDelta),
    };
  });

  return bars.sort((a, b) => b.absSwing - a.absSwing);
}

// ─────────────────────────────────────────────────────────────────────────────
// Per-segment FY26E Adjusted EBITDA sensitivity — tornado chart
// (Addendum v3 Section 2: three segment-specific charts, not one
// consolidated chart)
// ─────────────────────────────────────────────────────────────────────────────

export interface TornadoBar {
  driverId: string;
  driverLabel: string;
  upsideDelta: number; // $M change in this segment's FY26E Adjusted EBITDA at +10% relative
  downsideDelta: number; // $M change in this segment's FY26E Adjusted EBITDA at -10% relative
  absSwing: number; // |upside - downside| — used for sort order
}

// Single source of truth (Section 6): the tornado calls the exact same
// compute<Segment>Forecast function used by the metric cards and the bridge
// — never a separately-derived calculation.
const SEGMENT_FORECAST_FN: Record<SegmentKey, (drivers: DriverValues) => { estimate: SegmentForecast }> = {
  media: computeMediaForecast,
  studios: computeStudiosForecast,
  themeParks: computeThemeParksForecast,
};

/**
 * For each of this segment's own sensitivity-eligible drivers, hold every
 * other driver (in every segment) at its current slider value, shift the
 * target driver's own current value +/-10% relative, recompute this
 * segment's FY26E Adjusted EBITDA via the shared compute<Segment>Forecast
 * function, and record the swing from the base case. The realized first-half
 * tailwind is excluded by construction: getSensitivityDriversForSegment()
 * only enumerates drivers and preset drivers, never locked lines.
 */
export function computeSegmentTornadoBars(segmentKey: SegmentKey, drivers: DriverValues): TornadoBar[] {
  const computeFn = SEGMENT_FORECAST_FN[segmentKey];
  const baseline = computeFn(drivers).estimate.adjustedEbitda;
  const refs = getSensitivityDriversForSegment(segmentKey);

  const bars: TornadoBar[] = refs.map((ref) => {
    const currentValue = drivers[ref.id];
    const upDrivers = { ...drivers, [ref.id]: currentValue * 1.1 };
    const downDrivers = { ...drivers, [ref.id]: currentValue * 0.9 };

    const upEbitda = computeFn(upDrivers).estimate.adjustedEbitda;
    const downEbitda = computeFn(downDrivers).estimate.adjustedEbitda;

    const upsideDelta = upEbitda - baseline;
    const downsideDelta = downEbitda - baseline;

    return {
      driverId: ref.id,
      driverLabel: ref.label,
      upsideDelta,
      downsideDelta,
      absSwing: Math.abs(upsideDelta - downsideDelta),
    };
  });

  return bars.sort((a, b) => b.absSwing - a.absSwing);
}

// ─────────────────────────────────────────────────────────────────────────────
// Waterfall helper — shared by MarginBridgeChart (Media, Studios, Theme Parks)
// ─────────────────────────────────────────────────────────────────────────────

export interface WaterfallDatum {
  label: string;
  base: number; // invisible stacking base (exact, drives real bar height/position)
  value: number; // visible bar height ($M, exact)
  raw: number; // rounded $M value shown in the on-screen label (see note below)
  detail: string; // secondary label, always rendered
  isTotal: boolean;
}

/**
 * Bar heights/positions use the exact (unrounded) dollar math so the chart's
 * proportions stay accurate. But the on-screen labels are rounded to whole
 * millions independently per bar — round each delta separately and they can
 * fail to sum to the rounded ending total (e.g. 1099 + 48 - 177 - 177 = 793,
 * one dollar off a $792M ending bar that itself rounds correctly). To keep
 * the displayed integers internally consistent, round the *cumulative*
 * running total at each step and take successive differences for display —
 * a standard telescoping trick that guarantees the on-screen numbers always
 * sum exactly, not just the underlying floats.
 */
export function buildWaterfallData(steps: DollarBridgeStep[]): WaterfallDatum[] {
  let cumulative = 0;
  let roundedCumulative = 0;
  return steps.map((step) => {
    if (step.isTotal) {
      cumulative = step.delta;
      roundedCumulative = Math.round(cumulative);
      return {
        label: step.label,
        base: 0,
        value: step.delta,
        raw: roundedCumulative,
        detail: step.detail,
        isTotal: true,
      };
    }
    const start = cumulative;
    const end = cumulative + step.delta;
    cumulative = end;
    const newRounded = Math.round(end);
    const displayDelta = newRounded - roundedCumulative;
    roundedCumulative = newRounded;
    return {
      label: step.label,
      base: Math.min(start, end),
      value: Math.abs(step.delta),
      raw: displayDelta,
      detail: step.detail,
      isTotal: false,
    };
  });
}
