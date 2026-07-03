"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  LabelList,
} from "recharts";
import { MediaMarginBridgeStep, buildWaterfallData, WaterfallDatum } from "@/lib/forecastMath";

interface MarginBridgeChartProps {
  bridge: MediaMarginBridgeStep[];
}

function fmtPt(v: number): string {
  const sign = v > 0 ? "+" : "";
  return `${sign}${v.toFixed(1)}pt`;
}

function fmtPct(v: number): string {
  return `${v.toFixed(1)}%`;
}

function barColor(d: WaterfallDatum): string {
  if (d.isTotal) return "var(--color-media)";
  return d.raw >= 0 ? "var(--color-positive)" : "var(--color-negative)";
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: WaterfallDatum }>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div
      className="rounded-lg shadow-lg p-3 text-xs"
      style={{
        backgroundColor: "var(--color-primary)",
        border: "1px solid var(--color-primary-hover)",
        color: "#ffffff",
        minWidth: 160,
      }}
    >
      <p className="font-semibold mb-1" style={{ color: "rgba(255,255,255,0.85)" }}>
        {d.label}
      </p>
      <p className="font-semibold tabular-nums">{d.isTotal ? fmtPct(d.raw) : fmtPt(d.raw)}</p>
    </div>
  );
}

/**
 * Media margin bridge (waterfall): FY25 actual -> margin adjusters (NBA drag
 * + Peacock narrowing) -> event revenue flow-through -> FY26 estimate.
 * Recomputed dynamically from live slider state (Section 5) — the bars are
 * constructed in lib/forecastMath.ts so they always sum exactly to the
 * displayed FY26E margin, at every slider combination (Section 7).
 */
export default function MarginBridgeChart({ bridge }: MarginBridgeChartProps) {
  const data = useMemo(() => buildWaterfallData(bridge), [bridge]);

  const maxTop = Math.max(...data.map((d) => d.base + d.value));
  const domain: [number, number] = [0, Math.ceil((maxTop + 1) * 1.15)];

  return (
    <div className="card p-0 overflow-hidden">
      <div className="px-6 py-3 border-b" style={{ borderColor: "var(--color-border)" }}>
        <p className="font-semibold text-sm" style={{ color: "var(--color-text-primary)" }}>
          Media Margin Bridge — FY25 Actual to FY26 Estimate
        </p>
        <p className="text-xs mt-0.5" style={{ color: "var(--color-text-tertiary)" }}>
          Adjusted EBITDA margin, percentage points
        </p>
      </div>

      {/* Horizontal scroll on narrow viewports keeps bar/label spacing legible
          instead of squeezing five categories into an unreadable pile-up. */}
      <div className="px-2 pt-4 pb-2 overflow-x-auto">
        <div style={{ minWidth: 560 }}>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={data} margin={{ top: 24, right: 24, left: 8, bottom: 24 }} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "var(--color-text-secondary)" }}
              axisLine={{ stroke: "var(--color-border)" }}
              tickLine={false}
              interval={0}
              angle={-20}
              textAnchor="end"
              height={40}
            />
            <YAxis
              domain={domain}
              tickFormatter={(v: number) => `${v.toFixed(0)}%`}
              tick={{ fontSize: 10, fill: "var(--color-text-tertiary)" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.03)" }} />

            {/* Invisible stacking base */}
            <Bar dataKey="base" stackId="bridge" fill="transparent" isAnimationActive={false} />

            {/* Visible bar */}
            <Bar dataKey="value" stackId="bridge" radius={[3, 3, 0, 0]} maxBarSize={72}>
              {data.map((entry, index) => (
                <Cell key={`bar-${index}`} fill={barColor(entry)} />
              ))}
              <LabelList
                position="top"
                valueAccessor={(entry) => {
                  const d = (entry as unknown as { payload: WaterfallDatum }).payload;
                  return d.isTotal ? fmtPct(d.raw) : fmtPt(d.raw);
                }}
                style={{ fontSize: 11, fontWeight: 600, fill: "var(--color-text-primary)" }}
              />
            </Bar>
          </ComposedChart>
        </ResponsiveContainer>
        </div>
      </div>

      <div className="px-6 py-2 border-t flex items-center gap-6 flex-wrap" style={{ borderColor: "var(--color-border)" }}>
        <div className="flex items-center gap-1.5">
          <div className="rounded-sm" style={{ width: 12, height: 12, backgroundColor: "var(--color-media)" }} />
          <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
            FY25 Actual / FY26E
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="rounded-sm" style={{ width: 12, height: 12, backgroundColor: "var(--color-positive)" }} />
          <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
            Margin-additive step
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="rounded-sm" style={{ width: 12, height: 12, backgroundColor: "var(--color-negative)" }} />
          <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
            Margin-dilutive step
          </span>
        </div>
      </div>
    </div>
  );
}
