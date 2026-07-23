import EstimateBadge from "./EstimateBadge";

interface SeasonalitySparklineProps {
  weights: [number, number, number, number];
  accentColor: string;
}

const QUARTER_LABELS = ["Q1", "Q2", "Q3", "Q4"] as const;
const MAX_BAR_HEIGHT = 20; // px, at weight = 0.5 (a fully concentrated-in-one-quarter vector)

/**
 * Small four-bar sparkline showing how a driver's annual rate distributes
 * across quarters (Section 4.2/5) — every seasonality vector is a modeling
 * construction, never disclosed, so it always carries its own "Est." badge
 * regardless of whether the driver's own annual value is flagged. Q1/Q2
 * bars render dimmed/locked-colored since those quarters are pinned actuals
 * that never respond to this vector; Q3/Q4 render in the segment's accent
 * color since those are the quarters the seasonality actually shapes.
 */
export default function SeasonalitySparkline({ weights, accentColor }: SeasonalitySparklineProps) {
  return (
    <div className="flex items-end gap-2 mt-1.5 mb-0.5">
      <div className="flex items-end gap-1" style={{ height: MAX_BAR_HEIGHT }}>
        {weights.map((w, i) => {
          const locked = i < 2;
          const heightPx = Math.max(2, Math.min(MAX_BAR_HEIGHT, (w / 0.5) * MAX_BAR_HEIGHT));
          return (
            <div key={QUARTER_LABELS[i]} className="flex flex-col items-center" style={{ width: 12 }}>
              <div
                title={`${QUARTER_LABELS[i]}: ${(w * 100).toFixed(0)}% of annual weight`}
                style={{
                  width: 8,
                  height: heightPx,
                  borderRadius: 1,
                  backgroundColor: locked ? "var(--color-locked)" : accentColor,
                  opacity: locked ? 0.45 : 1,
                }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-1">
        <span style={{ color: "var(--color-text-tertiary)", fontSize: 9 }}>Seasonality</span>
        <EstimateBadge compact />
      </div>
    </div>
  );
}
