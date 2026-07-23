"use client";

import { useMemo } from "react";
import { Lock } from "lucide-react";
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

const LOCKED_LABELS = new Set(["Q1", "Q2"]);
const FORECAST_QUARTER_LABELS = new Set(["Q3", "Q4"]);

// Six-step bridge only (Section 6.3): FY25 Baseline and FY26 Forecast keep
// v1's total-bar treatment (segment accent color); Q1/Q2 are locked-blue
// (padlock icon marks the pinned actuals); Q3/Q4 use the same segment
// accent at reduced opacity so the two true totals still read as the
// visually "heavier" bars.
function barVisual(d: WaterfallDatum, accentColor: string): { fill: string; fillOpacity: number } {
  if (LOCKED_LABELS.has(d.label)) return { fill: "var(--color-locked)", fillOpacity: 1 };
  if (d.isTotal) return { fill: accentColor, fillOpacity: 1 };
  if (FORECAST_QUARTER_LABELS.has(d.label)) return { fill: accentColor, fillOpacity: 0.55 };
  return { fill: d.raw >= 0 ? "var(--color-positive)" : "var(--color-negative)", fillOpacity: 1 };
}

/** Small padlock glyph drawn with raw SVG primitives — consistent with the
 * rest of this custom label renderer, which already emits plain <text>/<g>
 * rather than imported icon components. */
function LockGlyph({ cx, topY }: { cx: number; topY: number }) {
  return (
    <g>
      <rect x={cx - 5} y={topY} width={10} height={7} rx={1.5} fill="var(--color-locked)" />
      <path
        d={`M ${cx - 3} ${topY} v-2.5 a3 3 0 0 1 6 0 v2.5`}
        fill="none"
        stroke="var(--color-locked)"
        strokeWidth={1.4}
      />
    </g>
  );
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

  // Recharts' stackId stacking auto-splits positive and negative values into
  // two separate direction-stacks per category rather than a straight
  // running sum — fine for v1 (cumulative EBITDA never went negative) but
  // wrong now that a pinned quarter can be a real loss (Media Q1 2026:
  // -$426M), which mixes signs within the same category's stack and
  // silently collapses the bar. Fix: shift every value up by a constant
  // (SHIFT) so both the invisible base and the visible bar are always
  // non-negative — stacking then behaves like the well-tested all-positive
  // case v1 already relied on. SHIFT is undone in the axis tick formatter so
  // displayed dollar amounts are unaffected; buildWaterfallData's base/value
  // fields (and their telescoping-rounding guarantee) are untouched, just
  // re-expressed here for rendering.
  const extents = data.flatMap((d) => [d.base, d.base + d.value]);
  const minExtent = Math.min(0, ...extents);
  const maxExtent = Math.max(0, ...extents);
  const SHIFT = Math.ceil(Math.max(0, -minExtent) / 50) * 50;

  const chartData = useMemo(
    () =>
      data.map((d) => ({
        ...d,
        shiftedBase: Math.min(d.base, d.base + d.value) + SHIFT,
        barHeight: Math.abs(d.value),
      })),
    [data, SHIFT]
  );

  const maxShiftedTop = Math.max(...chartData.map((d) => d.shiftedBase + d.barHeight));
  const pad = Math.max((maxShiftedTop - SHIFT) * 0.15, 50);
  const domainShifted: [number, number] = [0, Math.ceil((maxShiftedTop + pad) / 50) * 50];

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
    const locked = LOCKED_LABELS.has(d.label);
    return (
      <g>
        {locked && <LockGlyph cx={cx} topY={y - 48} />}
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
            <ComposedChart data={chartData} margin={{ top: 46, right: 24, left: 8, bottom: 24 }} barCategoryGap="20%">
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
                domain={domainShifted}
                tickFormatter={(v: number) => `$${Math.round(v - SHIFT).toLocaleString()}M`}
                tick={{ fontSize: 10, fill: "var(--color-text-tertiary)" }}
                axisLine={false}
                tickLine={false}
                width={68}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.03)" }} />

              {/* Invisible stacking base — always >= 0 thanks to SHIFT */}
              <Bar dataKey="shiftedBase" stackId="bridge" fill="transparent" isAnimationActive={false} />

              {/* Visible bar */}
              <Bar
                dataKey="barHeight"
                stackId="bridge"
                radius={[3, 3, 0, 0]}
                maxBarSize={80}
                isAnimationActive={false}
              >
                {data.map((entry, index) => {
                  const visual = barVisual(entry, accentColor);
                  return <Cell key={`bar-${index}`} fill={visual.fill} fillOpacity={visual.fillOpacity} />;
                })}
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
            FY25 Baseline / FY26 Forecast
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="rounded-sm" style={{ width: 12, height: 12, backgroundColor: "var(--color-locked)" }} />
          <Lock size={10} style={{ color: "var(--color-locked)" }} />
          <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
            Q1 / Q2 — Locked Actual
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="rounded-sm" style={{ width: 12, height: 12, backgroundColor: accentColor, opacity: 0.55 }} />
          <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
            Q3 / Q4 — Forecast
          </span>
        </div>
      </div>
    </div>
  );
}
