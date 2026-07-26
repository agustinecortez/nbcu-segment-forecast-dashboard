import { SegmentForecast } from "@/lib/forecastMath";

interface MetricCardsProps {
  segmentName: string;
  baseline: SegmentForecast; // fixed FY25 pro-forma
  fy26Forecast: SegmentForecast; // live, driver-responsive
  accentColor: string;
}

function fmtUsd(v: number): string {
  return `$${Math.round(v).toLocaleString()}M`;
}

function fmtPct(v: number): string {
  return `${v.toFixed(1)}%`;
}

/**
 * Two-row metric card (v2.1 — Prior FY 2026 Forecast row removed per
 * NBCU_Dashboard_Build_Spec_v2.1_H1_Recalibration.md §1): FY25 Baseline
 * (small, gray) and FY26 Forecast (large, bold, the live headline every
 * other chart on the page reads from). No delta chip — the two stacked
 * numbers speak for themselves.
 */
function Card({
  label,
  baselineValue,
  forecastValue,
  format,
  accentColor,
}: {
  label: string;
  baselineValue: number;
  forecastValue: number;
  format: (v: number) => string;
  accentColor: string;
}) {
  return (
    <div className="card" style={{ borderTop: `3px solid ${accentColor}` }}>
      <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--color-text-tertiary)" }}>
        {label}
      </p>

      <div className="flex items-baseline justify-between mb-1">
        <span className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>
          FY25 Baseline
        </span>
        <span className="text-sm font-medium tabular-nums" style={{ color: "var(--color-text-secondary)" }}>
          {format(baselineValue)}
        </span>
      </div>

      <div className="flex items-baseline justify-between">
        <span className="text-xs font-semibold" style={{ color: "var(--color-text-primary)" }}>
          FY26 Forecast
        </span>
        <span className="text-2xl font-bold tabular-nums" style={{ color: "var(--color-text-primary)" }}>
          {format(forecastValue)}
        </span>
      </div>
    </div>
  );
}

export default function MetricCards({ segmentName, baseline, fy26Forecast, accentColor }: MetricCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Card
        label={`${segmentName} Revenue`}
        baselineValue={baseline.revenue}
        forecastValue={fy26Forecast.revenue}
        format={fmtUsd}
        accentColor={accentColor}
      />
      <Card
        label="Adjusted EBITDA"
        baselineValue={baseline.adjustedEbitda}
        forecastValue={fy26Forecast.adjustedEbitda}
        format={fmtUsd}
        accentColor={accentColor}
      />
      <Card
        label="Margin"
        baselineValue={baseline.margin}
        forecastValue={fy26Forecast.margin}
        format={fmtPct}
        accentColor={accentColor}
      />
    </div>
  );
}
