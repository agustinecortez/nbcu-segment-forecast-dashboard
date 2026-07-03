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
import { DriverValues } from "@/lib/nbcuData";
import { computeTornadoBars, TornadoBar } from "@/lib/forecastMath";

interface TornadoChartProps {
  drivers: DriverValues;
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
    "FIFA World Cup 2026 Incremental Revenue": "World Cup Revenue",
    "Content Licensing Growth": "Content Licensing",
    "Theatrical Slate Performance": "Theatrical Slate",
    "Programming & Production Cost Growth": "Programming Cost",
    "Epic Universe Attendance Ramp": "Epic Attendance",
    "Per Capita Spending Growth": "Per Capita Spend",
    "Legacy Domestic Parks Growth": "Legacy Parks Growth",
    "Epic Universe Launch-Cost Roll-Off": "Epic Launch-Cost Roll-Off",
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
 * FY26E Adjusted EBITDA sensitivity — Media + Studios + Theme Parks combined
 * (Addendum Section 3). For each driver, +/-10% relative shift of its own
 * current value (percentage, points, or dollars — same rule for all three
 * unit types), all other drivers held at current slider state. The realized
 * first-half tailwind is excluded: it's an already-realized fact with no
 * uncertainty band, not a forecast assumption, so it never appears here.
 */
export default function TornadoChart({ drivers }: TornadoChartProps) {
  const bars: TornadoBar[] = useMemo(() => computeTornadoBars(drivers), [drivers]);

  const chartData = bars.map((b) => ({
    ...b,
    label: shortLabel(b.driverLabel),
    upside: b.upsideDelta,
    downside: b.downsideDelta,
  }));

  const maxAbs = Math.max(
    ...bars.flatMap((b) => [Math.abs(b.upsideDelta), Math.abs(b.downsideDelta)]),
    100
  );
  const domainPad = Math.ceil((maxAbs * 1.15) / 100) * 100;
  const domain: [number, number] = [-domainPad, domainPad];

  const tickFormatter = (v: number) => {
    if (v === 0) return "$0";
    const sign = v > 0 ? "+" : "−";
    return `${sign}$${(Math.abs(v) / 1000).toFixed(1)}B`;
  };

  return (
    <div className="card p-0 overflow-hidden">
      <div className="px-6 py-3 border-b" style={{ borderColor: "var(--color-border)" }}>
        <p className="font-semibold text-sm" style={{ color: "var(--color-text-primary)" }}>
          FY26E Adjusted EBITDA Sensitivity
        </p>
        <p className="text-xs mt-0.5" style={{ color: "var(--color-text-tertiary)" }}>
          Impact on Total Segment (Media + Studios + Theme Parks) Adjusted EBITDA of ±10% relative
          shift per driver · sorted by total swing · excludes the locked realized event tailwind
        </p>
      </div>

      <div className="px-2 pt-3 pb-2">
        <ResponsiveContainer width="100%" height={420}>
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
              width={140}
              tick={{ fontSize: 11, fill: "var(--color-text-secondary)" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.03)" }} />

            <ReferenceLine x={0} stroke="var(--color-border-strong)" strokeWidth={1.5} />

            <Bar dataKey="upside" name="Upside (+10%)" radius={[0, 2, 2, 0]} maxBarSize={12}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`upside-${index}`}
                  fill={entry.upside >= 0 ? "var(--color-positive)" : "var(--color-negative)"}
                />
              ))}
            </Bar>

            <Bar dataKey="downside" name="Downside (−10%)" radius={[2, 0, 0, 2]} maxBarSize={12}>
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
    </div>
  );
}
