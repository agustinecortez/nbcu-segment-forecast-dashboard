// lib/forecastMath.ts
// ─────────────────────────────────────────────────────────────────────────────
// Pure forecast math functions. No UI dependencies. All dollar values in $M.
//
// Math spec: NBCU_Dashboard_Build_Spec.md Section 3-4;
// NBCU_Dashboard_Build_Spec_Addendum_v2.md Section 1-3;
// NBCU_Dashboard_Build_Spec_Addendum_v3.md Section 2-6;
// NBCU_Dashboard_Build_Spec_v2_Quarterly.md Section 6 (quarterly rebuild).
//
// Scope: FY25 pro-forma baseline; Q1/Q2 2026 pinned actuals; Q3/Q4 2026
// driver-adjustable forecast; FY26 Forecast = the sum of the four quarters.
// "Baseline" objects below are always the fixed FY25 figures, regardless of
// slider state.
//
// Single source of truth (Addendum v3 Section 6, extended to quarterly by
// v2 Section 6): the metric cards, each segment's six-step bridge, and each
// segment's tornado all read from the same compute<Segment>QuarterlyForecast()
// function below — there is exactly one place per segment where quarterly
// Revenue/Adjusted EBITDA/Margin get computed. The tornado perturbs a copy
// of the driver map and calls the identical function; it does not re-derive
// the math independently.
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
// Tornado bar shape — shared by computeSegmentQuarterlyTornadoBars above
// (Addendum v3 Section 2: three segment-specific charts, not one
// consolidated chart)
// ─────────────────────────────────────────────────────────────────────────────

export interface TornadoBar {
  driverId: string;
  driverLabel: string;
  upsideDelta: number; // $M change in this segment's FY26 Forecast Adjusted EBITDA at +10% relative
  downsideDelta: number; // $M change in this segment's FY26 Forecast Adjusted EBITDA at -10% relative
  absSwing: number; // |upside - downside| — used for sort order
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
