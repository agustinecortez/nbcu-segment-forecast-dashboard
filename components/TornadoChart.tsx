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
  ReferenceLine,
  Cell,
} from "recharts";
import { DriverValues, SegmentKey } from "@/lib/nbcuData";
import { computeSegmentQuarterlyTornadoBars, TornadoBar } from "@/lib/forecastMath";

interface TornadoChartProps {
  segmentKey: SegmentKey;
  drivers: DriverValues;
  title: string;
  subtitle: string;
}

function fmtDelta(value: number): string {
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}$${Math.round(Math.abs(value)).toLocaleString()}M`;
}

// Shorten driver labels so they fit on the Y-axis
function shortLabel(label: string): string {
  const map: Record<string, string> = {
    "Peacock Subscriber Growth": "Peacock Sub Growth",
    "Peacock ARPU Growth": "Peacock ARPU",
    "Linear Revenue Decline": "Linear Decline",
    "NBA Rights Cost Step-Up Drag": "NBA Rights Drag",
    "Peacock Loss Narrowing (Path to Breakeven)": "Peacock Narrowing",
    "Q3 2026 World Cup Residual": "Q3 World Cup Residual",
    "Content Licensing Growth": "Content Licensing",
    "Theatrical Slate Performance": "Theatrical Slate",
    "Content Production Cost Inflation": "Content Cost Inflation",
    "Slate Size & Marketing Spend Growth": "Slate Size / Marketing",
    "Epic Universe Attendance Ramp": "Epic Attendance",
    "Per Capita Spending Growth": "Per Capita Spend",
    "Legacy Domestic Parks Growth": "Legacy Parks Growth",
    "Epic Universe Launch-Cost Roll-Off": "Epic Launch-Cost Roll-Off",
    "Universal Kids Resort Launch-Cost Drag": "Kids Resort Drag",
  };
  return map[label] ?? label;
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: TornadoBar & { upside: number; downside: number } }>;
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
        minWidth: 200,
      }}
    >
      <p className="font-semibold mb-2" style={{ color: "rgba(255,255,255,0.85)" }}>
        {d.driverLabel}
      </p>
      <div className="space-y-1">
        <div className="flex justify-between gap-6">
          <span style={{ color: "rgba(255,255,255,0.7)" }}>+10% scenario</span>
          <span
            className="font-semibold tabular-nums"
            style={{ color: d.upsideDelta >= 0 ? "#6EE7A0" : "#FCA5A5" }}
          >
            {fmtDelta(d.upsideDelta)}
          </span>
        </div>
        <div className="flex justify-between gap-6">
          <span style={{ color: "rgba(255,255,255,0.7)" }}>−10% scenario</span>
          <span
            className="font-semibold tabular-nums"
            style={{ color: d.downsideDelta >= 0 ? "#6EE7A0" : "#FCA5A5" }}
          >
            {fmtDelta(d.downsideDelta)}
          </span>
        </div>
        <div
          className="flex justify-between gap-6 pt-1 mt-1"
          style={{ borderTop: "1px solid rgba(255,255,255,0.2)" }}
        >
          <span style={{ color: "rgba(255,255,255,0.7)" }}>Total swing</span>
          <span className="font-semibold tabular-nums">
            ${Math.round(d.absSwing).toLocaleString()}M
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Segment-specific sensitivity tornado (Addendum v3 Section 2 — replaces the
 * single consolidated 13-bar chart from Addendum v2). Each segment gets its
 * own chart, sorted independently by swing. v2 (spec Section 6.2): the
 * baseline is the FY26 Forecast headline (Q1 actual + Q2 actual + Q3/Q4
 * forecast), and perturbing a driver only recomputes Q3/Q4 — Q1/Q2 stay
 * pinned by construction inside computeSegmentQuarterlyTornadoBars, which
 * calls the same compute<Segment>QuarterlyForecast function used by the
 * metric cards and bridge (single source of truth, Section 6). Locked event
 * lines are excluded from every chart by construction (never enumerated as
 * sensitivity drivers); the Q3 World Cup Residual preset is included since
 * it's still a forecast assumption.
 */
export default function TornadoChart({ segmentKey, drivers, title, subtitle }: TornadoChartProps) {
  const bars: TornadoBar[] = useMemo(
    () => computeSegmentQuarterlyTornadoBars(segmentKey, drivers),
    [segmentKey, drivers]
  );

  const chartData = bars.map((b) => ({
    ...b,
    label: shortLabel(b.driverLabel),
    upside: b.upsideDelta,
    downside: b.downsideDelta,
  }));

  const maxAbs = Math.max(
    ...bars.flatMap((b) => [Math.abs(b.upsideDelta), Math.abs(b.downsideDelta)]),
    50
  );
  const domainPad = Math.ceil((maxAbs * 1.15) / 50) * 50;
  const domain: [number, number] = [-domainPad, domainPad];

  const tickFormatter = (v: number) => {
    if (v === 0) return "$0";
    const sign = v > 0 ? "+" : "−";
    return `${sign}$${Math.abs(v).toLocaleString()}M`;
  };

  const chartHeight = Math.max(160, chartData.length * 44);

  return (
    <div className="card p-0 overflow-hidden">
      <div className="px-6 py-3 border-b" style={{ borderColor: "var(--color-border)" }}>
        <p className="font-semibold text-sm" style={{ color: "var(--color-text-primary)" }}>
          {title}
        </p>
        <p className="text-xs mt-0.5" style={{ color: "var(--color-text-tertiary)" }}>
          {subtitle}
        </p>
      </div>

      <div className="px-2 pt-3 pb-2">
        <ResponsiveContainer width="100%" height={chartHeight}>
          <ComposedChart
            layout="vertical"
            data={chartData}
            margin={{ top: 4, right: 48, left: 8, bottom: 4 }}
            barCategoryGap="25%"
            barGap={2}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
            <XAxis
              type="number"
              domain={domain}
              tickFormatter={tickFormatter}
              tick={{ fontSize: 10, fill: "var(--color-text-tertiary)" }}
              axisLine={{ stroke: "var(--color-border)" }}
              tickLine={false}
              tickCount={7}
            />
            <YAxis
              type="category"
              dataKey="label"
              width={150}
              tick={{ fontSize: 11, fill: "var(--color-text-secondary)" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.03)" }} />

            <ReferenceLine x={0} stroke="var(--color-border-strong)" strokeWidth={1.5} />

            <Bar dataKey="upside" name="Upside (+10%)" radius={[0, 2, 2, 0]} maxBarSize={16}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`upside-${index}`}
                  fill={entry.upside >= 0 ? "var(--color-positive)" : "var(--color-negative)"}
                />
              ))}
            </Bar>

            <Bar dataKey="downside" name="Downside (−10%)" radius={[2, 0, 0, 2]} maxBarSize={16}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`downside-${index}`}
                  fill={entry.downside <= 0 ? "var(--color-negative)" : "var(--color-positive)"}
                />
              ))}
            </Bar>
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="px-6 py-2 border-t flex items-center gap-6 flex-wrap" style={{ borderColor: "var(--color-border)" }}>
        <div className="flex items-center gap-1.5">
          <div className="rounded-sm" style={{ width: 12, height: 12, backgroundColor: "var(--color-positive)" }} />
          <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
            Adjusted EBITDA increases
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="rounded-sm" style={{ width: 12, height: 12, backgroundColor: "var(--color-negative)" }} />
          <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
            Adjusted EBITDA decreases
          </span>
        </div>
        <span className="text-xs ml-auto" style={{ color: "var(--color-text-tertiary)" }}>
          ±10% relative to current driver values
        </span>
      </div>

      <div className="px-6 py-2 border-t" style={{ borderColor: "var(--color-border)" }}>
        <p className="text-xs italic" style={{ color: "var(--color-text-tertiary)" }}>
          Q1 & Q2 actuals unchanged; sensitivity comes from Q3 & Q4 forecast portion.
        </p>
      </div>
    </div>
  );
}
