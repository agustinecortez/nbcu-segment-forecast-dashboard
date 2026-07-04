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
