// lib/forecastMath.ts
// ─────────────────────────────────────────────────────────────────────────────
// Pure forecast math functions. No UI dependencies. All dollar values in $M.
//
// Math spec: NBCU_Dashboard_Build_Spec.md Section 3-4;
// NBCU_Dashboard_Build_Spec_Addendum_v2.md Section 1-3.
//
// Scope note: single forecast year only (FY25 pro-forma baseline -> FY26E).
// "Baseline" objects below are always the fixed FY25 Section 3 figures,
// regardless of slider state — this is what the Section 7 exit criterion
// ("every slider at default reproduces the exact baseline") is checking.
// ─────────────────────────────────────────────────────────────────────────────

import {
  DriverValues,
  EVENT_FLOW_THROUGH_RATE,
  MEDIA_REVENUE_MIX,
  STUDIOS_REVENUE_MIX,
  THEME_PARKS_REVENUE_MIX,
  getAllSensitivityDrivers,
  getSegment,
} from "./nbcuData";

export interface SegmentForecast {
  revenue: number;
  adjustedEbitda: number;
  margin: number; // percentage, e.g. 3.8
}

// Generic margin-bridge step, shared by Media, Studios, and Theme Parks
// waterfall charts (Addendum Section 1-2 reuse Media's existing pattern).
export interface MarginBridgeStep {
  label: string;
  delta: number; // percentage points contributed by this step
  isTotal: boolean;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
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
  bridge: MarginBridgeStep[];
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

  // Margin adjusters shift the organic-portion effective margin from the
  // FY25 baseline.
  const adjustedOrganicMarginPts = fy25Margin + drivers.nbaRightsDrag + drivers.peacockLossNarrowing;
  const organicEbitda = organicRevenue * (adjustedOrganicMarginPts / 100);

  // Event revenue converts to EBITDA at its own flow-through rate.
  const eventEbitda = eventRevenue * EVENT_FLOW_THROUGH_RATE;

  const totalEbitda = organicEbitda + eventEbitda;
  const totalMargin = (totalEbitda / totalRevenue) * 100;

  // The event flow-through bridge bar is the plug that reconciles the
  // organic-margin path to the true blended margin — this guarantees the
  // bridge always sums exactly to the computed FY26E margin, at every
  // slider combination, by construction (not by coincidence).
  const eventFlowThroughPts = totalMargin - adjustedOrganicMarginPts;

  const bridge: MarginBridgeStep[] = [
    { label: "FY25 Actual", delta: fy25Margin, isTotal: true },
    { label: "NBA Rights Drag", delta: drivers.nbaRightsDrag, isTotal: false },
    { label: "Peacock Narrowing", delta: drivers.peacockLossNarrowing, isTotal: false },
    { label: "Event Flow-Through", delta: eventFlowThroughPts, isTotal: false },
    { label: "FY26E", delta: totalMargin, isTotal: true },
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
  bridge: MarginBridgeStep[];
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

  const adjustedMargin = fy25Margin + drivers.programmingCostGrowth;
  const adjustedEbitda = revenue * (adjustedMargin / 100);

  // Single-adjuster bridge — no plug needed, since programmingCostGrowth is
  // the only step between FY25 actual and FY26E and the margin is applied
  // uniformly (Addendum Section 2).
  const bridge: MarginBridgeStep[] = [
    { label: "FY25 Actual", delta: fy25Margin, isTotal: true },
    { label: "Programming Cost Growth", delta: drivers.programmingCostGrowth, isTotal: false },
    { label: "FY26E", delta: adjustedMargin, isTotal: true },
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
  bridge: MarginBridgeStep[];
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

  // Epic Universe launch-cost roll-off is a positive margin adjuster on top
  // of the FY25 base rate (Addendum Section 1) — partial recovery of the
  // FY25 launch-year compression as one-time costs roll off.
  const adjustedMargin = fy25Margin + drivers.epicLaunchCostRollOff;
  const adjustedEbitda = revenue * (adjustedMargin / 100);

  const bridge: MarginBridgeStep[] = [
    { label: "FY25 Actual", delta: fy25Margin, isTotal: true },
    { label: "Epic Launch-Cost Roll-Off", delta: drivers.epicLaunchCostRollOff, isTotal: false },
    { label: "FY26E", delta: adjustedMargin, isTotal: true },
  ];

  return {
    baseline: { revenue: fy25Revenue, adjustedEbitda: fy25Ebitda, margin: fy25Margin },
    estimate: { revenue, adjustedEbitda, margin: adjustedMargin },
    bridge,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Total Segment Adjusted EBITDA — Media + Studios + Theme Parks combined
// ─────────────────────────────────────────────────────────────────────────────

export function computeTotalAdjustedEbitda(drivers: DriverValues): number {
  return (
    computeMediaForecast(drivers).estimate.adjustedEbitda +
    computeStudiosForecast(drivers).estimate.adjustedEbitda +
    computeThemeParksForecast(drivers).estimate.adjustedEbitda
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FY26E Adjusted EBITDA sensitivity — tornado chart (Addendum Section 3)
// ─────────────────────────────────────────────────────────────────────────────

export interface TornadoBar {
  driverId: string;
  driverLabel: string;
  upsideDelta: number; // $M change in Total Segment Adjusted EBITDA at +10% relative
  downsideDelta: number; // $M change in Total Segment Adjusted EBITDA at -10% relative
  absSwing: number; // |upside - downside| — used for sort order
}

/**
 * For each sensitivity-eligible driver (percentage growth drivers, point-based
 * margin adjusters, and the dollar-denominated World Cup driver all use the
 * same rule — shift the driver's own current value +/-10% relative), hold
 * every other driver at its current slider value, recompute Total Segment
 * Adjusted EBITDA, and record the swing from the base case. The realized
 * first-half tailwind is excluded by construction: getAllSensitivityDrivers()
 * only enumerates drivers and preset drivers, never locked lines.
 */
export function computeTornadoBars(drivers: DriverValues): TornadoBar[] {
  const baseline = computeTotalAdjustedEbitda(drivers);
  const refs = getAllSensitivityDrivers();

  const bars: TornadoBar[] = refs.map((ref) => {
    const currentValue = drivers[ref.id];
    const upDrivers = { ...drivers, [ref.id]: currentValue * 1.1 };
    const downDrivers = { ...drivers, [ref.id]: currentValue * 0.9 };

    const upEbitda = computeTotalAdjustedEbitda(upDrivers);
    const downEbitda = computeTotalAdjustedEbitda(downDrivers);

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
  base: number; // invisible stacking base
  value: number; // visible bar height
  raw: number; // signed underlying value (for tooltip + color)
  isTotal: boolean;
}

export function buildWaterfallData(steps: MarginBridgeStep[]): WaterfallDatum[] {
  let cumulative = 0;
  return steps.map((step) => {
    if (step.isTotal) {
      cumulative = step.delta;
      return { label: step.label, base: 0, value: step.delta, raw: step.delta, isTotal: true };
    }
    const start = cumulative;
    const end = cumulative + step.delta;
    cumulative = end;
    return {
      label: step.label,
      base: Math.min(start, end),
      value: Math.abs(step.delta),
      raw: step.delta,
      isTotal: false,
    };
  });
}
