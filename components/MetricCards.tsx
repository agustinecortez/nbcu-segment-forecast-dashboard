import { SegmentForecast } from "@/lib/forecastMath";

interface MetricCardsProps {
  segmentName: string;
  baseline: SegmentForecast; // fixed FY25 pro-forma — Section 3
  estimate: SegmentForecast; // computed FY26E
  accentColor: string;
}

function fmtUsd(v: number): string {
  return `$${Math.round(v).toLocaleString()}M`;
}

function fmtPct(v: number): string {
  return `${v.toFixed(1)}%`;
}

function DeltaTag({ delta, isPoints }: { delta: number; isPoints?: boolean }) {
  const positive = delta >= 0;
  const sign = positive ? "+" : "";
  const suffix = isPoints ? "pt" : "%";
  return (
    <span
      className="text-xs font-semibold tabular-nums px-1.5 py-0.5 rounded"
      style={{
        color: positive ? "var(--color-positive)" : "var(--color-negative)",
        backgroundColor: positive ? "#E7F3EB" : "#FBEAEA",
      }}
    >
      {sign}
      {delta.toFixed(1)}
      {suffix}
    </span>
  );
}

function Card({
  label,
  baselineValue,
  estimateValue,
  format,
  accentColor,
  deltaIsPoints,
}: {
  label: string;
  baselineValue: number;
  estimateValue: number;
  format: (v: number) => string;
  accentColor: string;
  deltaIsPoints?: boolean;
}) {
  const delta = deltaIsPoints
    ? estimateValue - baselineValue
    : baselineValue === 0
      ? 0
      : ((estimateValue - baselineValue) / Math.abs(baselineValue)) * 100;

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
          FY26 Estimate
        </span>
        <span className="text-2xl font-bold tabular-nums" style={{ color: "var(--color-text-primary)" }}>
          {format(estimateValue)}
        </span>
      </div>

      <div className="mt-2 flex justify-end">
        <DeltaTag delta={delta} isPoints={deltaIsPoints} />
      </div>
    </div>
  );
}

export default function MetricCards({ segmentName, baseline, estimate, accentColor }: MetricCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Card
        label={`${segmentName} Revenue`}
        baselineValue={baseline.revenue}
        estimateValue={estimate.revenue}
        format={fmtUsd}
        accentColor={accentColor}
      />
      <Card
        label="Adjusted EBITDA"
        baselineValue={baseline.adjustedEbitda}
        estimateValue={estimate.adjustedEbitda}
        format={fmtUsd}
        accentColor={accentColor}
      />
      <Card
        label="Margin"
        baselineValue={baseline.margin}
        estimateValue={estimate.margin}
        format={fmtPct}
        accentColor={accentColor}
        deltaIsPoints
      />
    </div>
  );
}
