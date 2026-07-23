import { SegmentForecast } from "@/lib/forecastMath";

interface MetricCardsProps {
  segmentName: string;
  baseline: SegmentForecast; // fixed FY25 pro-forma
  fy26Forecast: SegmentForecast; // live, driver-responsive
  priorFy26Forecast: SegmentForecast; // frozen v1 base case — Section 4.4
  accentColor: string;
}

function fmtUsd(v: number): string {
  return `$${Math.round(v).toLocaleString()}M`;
}

function fmtPct(v: number): string {
  return `${v.toFixed(1)}%`;
}

/**
 * Three-row metric card (Section 8): FY25 Baseline (small, gray), FY26
 * Forecast (large, bold — the live headline every other chart on the page
 * reads from), Prior FY 2026 Forecast (small, italic, gray, with a frozen-
 * date caption). No delta chip — the three stacked numbers speak for
 * themselves, top to bottom.
 */
function Card({
  label,
  baselineValue,
  forecastValue,
  priorValue,
  format,
  accentColor,
}: {
  label: string;
  baselineValue: number;
  forecastValue: number;
  priorValue: number;
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

      <div className="flex items-baseline justify-between mb-1">
        <span className="text-xs font-semibold" style={{ color: "var(--color-text-primary)" }}>
          FY26 Forecast
        </span>
        <span className="text-2xl font-bold tabular-nums" style={{ color: "var(--color-text-primary)" }}>
          {format(forecastValue)}
        </span>
      </div>

      <div className="flex items-baseline justify-between">
        <span className="text-xs italic" style={{ color: "var(--color-text-tertiary)" }}>
          Prior FY 2026 Forecast
        </span>
        <span className="text-xs italic font-medium tabular-nums" style={{ color: "var(--color-text-tertiary)" }}>
          {format(priorValue)}
        </span>
      </div>
      <p className="mt-1 text-right" style={{ color: "var(--color-text-tertiary)", fontSize: 10 }}>
        Prior frozen at v1 · Jul 3, 2026
      </p>
    </div>
  );
}

export default function MetricCards({ segmentName, baseline, fy26Forecast, priorFy26Forecast, accentColor }: MetricCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Card
        label={`${segmentName} Revenue`}
        baselineValue={baseline.revenue}
        forecastValue={fy26Forecast.revenue}
        priorValue={priorFy26Forecast.revenue}
        format={fmtUsd}
        accentColor={accentColor}
      />
      <Card
        label="Adjusted EBITDA"
        baselineValue={baseline.adjustedEbitda}
        forecastValue={fy26Forecast.adjustedEbitda}
        priorValue={priorFy26Forecast.adjustedEbitda}
        format={fmtUsd}
        accentColor={accentColor}
      />
      <Card
        label="Margin"
        baselineValue={baseline.margin}
        forecastValue={fy26Forecast.margin}
        priorValue={priorFy26Forecast.margin}
        format={fmtPct}
        accentColor={accentColor}
      />
    </div>
  );
}
