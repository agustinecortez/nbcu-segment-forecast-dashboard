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
import { DollarBridgeStep, buildWaterfallData, WaterfallDatum } from "@/lib/forecastMath";

interface MarginBridgeChartProps {
  title: string;
  subtitle?: string;
  bridge: DollarBridgeStep[];
  accentColor: string;
}

function fmtUsd(v: number): string {
  return `$${Math.round(v).toLocaleString()}M`;
}

function fmtUsdSigned(v: number): string {
  const sign = v >= 0 ? "+" : "−";
  return `${sign}$${Math.round(Math.abs(v)).toLocaleString()}M`;
}

// Some detail strings (e.g. "-1.0 pt net (NBA drag + Peacock narrowing)")
// are too wide to render on one line without colliding with the neighboring
// bar's label. Word-wrap onto a second line at the nearest space to the
// midpoint rather than truncating — the parenthetical explanation is
// requested content (Addendum v3 Section 5), not filler to cut.
function wrapDetail(text: string, maxLineLength = 18): [string, string] {
  if (text.length <= maxLineLength) return [text, ""];
  let splitAt = text.lastIndexOf(" ", maxLineLength);
  if (splitAt <= 0) splitAt = text.indexOf(" ", maxLineLength);
  if (splitAt <= 0) return [text, ""];
  return [text.slice(0, splitAt), text.slice(splitAt + 1)];
}

function barColor(d: WaterfallDatum, accentColor: string): string {
  if (d.isTotal) return accentColor;
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
        minWidth: 180,
      }}
    >
      <p className="font-semibold mb-1" style={{ color: "rgba(255,255,255,0.85)" }}>
        {d.label}
      </p>
      <p className="font-semibold tabular-nums">{d.isTotal ? fmtUsd(d.raw) : fmtUsdSigned(d.raw)}</p>
      <p style={{ color: "rgba(255,255,255,0.7)" }}>{d.detail}</p>
    </div>
  );
}

/**
 * Generic dollar-denominated margin bridge — used by Media, Studios, and
 * Theme Parks (Addendum v3 Section 5). Every bar carries its dollar amount
 * and a secondary detail label (margin %, point value, or blended growth %)
 * rendered directly on the chart via a custom LabelList content renderer —
 * always visible, not gated behind a hover tooltip (the tooltip still shows
 * the same information on hover, as a convenience, not as the only source).
 * Recomputed dynamically from live slider state — the bars are constructed
 * in lib/forecastMath.ts so they always sum exactly to the displayed FY26E
 * Adjusted EBITDA, at every slider combination (single source of truth,
 * Addendum v3 Section 6).
 */
export default function MarginBridgeChart({ title, subtitle, bridge, accentColor }: MarginBridgeChartProps) {
  const data = useMemo(() => buildWaterfallData(bridge), [bridge]);

  const maxTop = Math.max(...data.map((d) => d.base + d.value));
  const domain: [number, number] = [0, Math.ceil((maxTop * 1.3) / 50) * 50];

  // Two lines of always-visible text (dollar amount + detail) rendered above
  // each bar. `data` is closed over so we can look up the full WaterfallDatum
  // (including `detail`) by index — Recharts only threads `value` through by
  // default, not the whole row.
  function renderBarLabel(props: {
    x?: string | number;
    y?: string | number;
    width?: string | number;
    index?: number;
  }) {
    const x = Number(props.x ?? 0);
    const y = Number(props.y ?? 0);
    const width = Number(props.width ?? 0);
    const { index } = props;
    if (index === undefined) return null;
    const d = data[index];
    if (!d) return null;
    const cx = x + width / 2;
    const primary = d.isTotal ? fmtUsd(d.raw) : fmtUsdSigned(d.raw);
    const [detailLine1, detailLine2] = wrapDetail(d.detail);
    return (
      <g>
        <text x={cx} y={y - 34} textAnchor="middle" fontSize={12} fontWeight={700} fill="var(--color-text-primary)">
          {primary}
        </text>
        <text x={cx} y={y - 21} textAnchor="middle" fontSize={10} fill="var(--color-text-tertiary)">
          {detailLine1}
        </text>
        {detailLine2 && (
          <text x={cx} y={y - 9} textAnchor="middle" fontSize={10} fill="var(--color-text-tertiary)">
            {detailLine2}
          </text>
        )}
      </g>
    );
  }

  return (
    <div className="card p-0 overflow-hidden">
      <div className="px-6 py-3 border-b" style={{ borderColor: "var(--color-border)" }}>
        <p className="font-semibold text-sm" style={{ color: "var(--color-text-primary)" }}>
          {title}
        </p>
        <p className="text-xs mt-0.5" style={{ color: "var(--color-text-tertiary)" }}>
          {subtitle ?? "Adjusted EBITDA, $M"}
        </p>
      </div>

      {/* Horizontal scroll on narrow viewports keeps bar/label spacing legible
          instead of squeezing categories into an unreadable pile-up. */}
      <div className="px-2 pt-12 pb-2 overflow-x-auto">
        <div style={{ minWidth: Math.max(320, data.length * 150) }}>
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart data={data} margin={{ top: 46, right: 24, left: 8, bottom: 24 }} barCategoryGap="20%">
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
                tickFormatter={(v: number) => `$${Math.round(v).toLocaleString()}M`}
                tick={{ fontSize: 10, fill: "var(--color-text-tertiary)" }}
                axisLine={false}
                tickLine={false}
                width={68}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.03)" }} />

              {/* Invisible stacking base */}
              <Bar dataKey="base" stackId="bridge" fill="transparent" isAnimationActive={false} />

              {/* Visible bar */}
              <Bar dataKey="value" stackId="bridge" radius={[3, 3, 0, 0]} maxBarSize={80}>
                {data.map((entry, index) => (
                  <Cell key={`bar-${index}`} fill={barColor(entry, accentColor)} />
                ))}
                <LabelList content={renderBarLabel} />
              </Bar>
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="px-6 py-2 border-t flex items-center gap-6 flex-wrap" style={{ borderColor: "var(--color-border)" }}>
        <div className="flex items-center gap-1.5">
          <div className="rounded-sm" style={{ width: 12, height: 12, backgroundColor: accentColor }} />
          <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
            FY25 Actual / FY26E
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="rounded-sm" style={{ width: 12, height: 12, backgroundColor: "var(--color-positive)" }} />
          <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
            EBITDA-additive step
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="rounded-sm" style={{ width: 12, height: 12, backgroundColor: "var(--color-negative)" }} />
          <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
            EBITDA-dilutive step
          </span>
        </div>
      </div>
    </div>
  );
}
