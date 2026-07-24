"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Info } from "lucide-react";
import { DriverDefinition } from "@/lib/nbcuData";
import EstimateBadge from "./EstimateBadge";
import SeasonalitySparkline from "./SeasonalitySparkline";

interface DriverSliderProps {
  driver: DriverDefinition;
  value: number;
  onChange: (id: string, value: number) => void;
  accentColor: string;
}

const TOOLTIP_WIDTH = 320;
const TOOLTIP_OFFSET = 10;

interface TooltipPos {
  top: number;
  left: number;
}

function calcTooltipPos(anchorRect: DOMRect): TooltipPos {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const estHeight = 120;

  const rightPos = anchorRect.right + TOOLTIP_OFFSET;
  const leftPos = anchorRect.left - TOOLTIP_OFFSET - TOOLTIP_WIDTH;

  const left =
    rightPos + TOOLTIP_WIDTH <= vw - 8 ? rightPos : leftPos >= 8 ? leftPos : 8;

  const anchorMidY = anchorRect.top + anchorRect.height / 2;
  let top = anchorMidY - estHeight / 2;
  top = Math.max(8, Math.min(top, vh - estHeight - 8));

  return { top, left };
}

function PortalTooltip({ text, anchorRect }: { text: string; anchorRect: DOMRect }) {
  const [pos, setPos] = useState<TooltipPos>(() => calcTooltipPos(anchorRect));
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      const rightPos = anchorRect.right + TOOLTIP_OFFSET;
      const leftPos = anchorRect.left - TOOLTIP_OFFSET - rect.width;

      const left =
        rightPos + rect.width <= vw - 8 ? rightPos : leftPos >= 8 ? leftPos : 8;

      const anchorMidY = anchorRect.top + anchorRect.height / 2;
      let top = anchorMidY - rect.height / 2;
      top = Math.max(8, Math.min(top, vh - rect.height - 8));

      setPos({ top, left });
    }
  }, [anchorRect]);

  const openedRight = pos.left >= anchorRect.right;

  return createPortal(
    <div
      ref={ref}
      role="tooltip"
      className="fixed rounded-md shadow-xl text-xs leading-relaxed"
      style={{
        top: pos.top,
        left: pos.left,
        width: TOOLTIP_WIDTH,
        maxWidth: `calc(100vw - 16px)`,
        zIndex: 9999,
        backgroundColor: "var(--color-primary)",
        color: "#ffffff",
        border: "1px solid var(--color-primary-hover)",
        padding: "10px 12px",
        pointerEvents: "none",
      }}
    >
      {text}
      <div
        style={{
          position: "absolute",
          top: "50%",
          transform: "translateY(-50%)",
          width: 0,
          height: 0,
          ...(openedRight
            ? {
                left: -5,
                borderTop: "5px solid transparent",
                borderBottom: "5px solid transparent",
                borderRight: `5px solid var(--color-primary)`,
              }
            : {
                right: -5,
                borderTop: "5px solid transparent",
                borderBottom: "5px solid transparent",
                borderLeft: `5px solid var(--color-primary)`,
              }),
        }}
      />
    </div>,
    document.body
  );
}

export default function DriverSlider({ driver, value, onChange, accentColor }: DriverSliderProps) {
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);

  const showTooltip = useCallback((e: React.MouseEvent | React.FocusEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setAnchorRect(rect);
    setTooltipVisible(true);
  }, []);

  const hideTooltip = useCallback(() => {
    setTooltipVisible(false);
    setAnchorRect(null);
  }, []);

  const isPoints = driver.unit === "points";

  function formatValue(v: number): string {
    const sign = v > 0 ? "+" : "";
    return isPoints ? `${sign}${v.toFixed(1)}pt` : `${sign}${v.toFixed(1)}%`;
  }

  function valueColor(v: number): string {
    if (v > 0) return "var(--color-positive)";
    if (v < 0) return "var(--color-negative)";
    return "var(--color-text-secondary)";
  }

  const pct = ((value - driver.min) / (driver.max - driver.min)) * 100;

  return (
    <div className="mb-4 last:mb-0">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1 min-w-0">
          <span className="text-xs leading-tight truncate" style={{ color: "var(--color-text-secondary)" }}>
            {driver.label}
          </span>

          {driver.estimateFlag && <EstimateBadge compact />}

          <div className="relative flex-shrink-0">
            <button
              className="flex items-center justify-center rounded-full transition-colors"
              style={{ color: "var(--color-text-tertiary)", width: 16, height: 16 }}
              onMouseEnter={showTooltip}
              onMouseLeave={hideTooltip}
              onFocus={showTooltip}
              onBlur={hideTooltip}
              aria-label={`Info: ${driver.label}`}
              aria-describedby={tooltipVisible ? `tooltip-${driver.id}` : undefined}
              tabIndex={0}
            >
              <Info size={12} />
            </button>
          </div>
        </div>

        <span
          className="text-sm font-semibold tabular-nums flex-shrink-0 ml-2"
          style={{ color: valueColor(value) }}
        >
          {formatValue(value)}
        </span>
      </div>

      <div className="relative">
        <input
          type="range"
          min={driver.min}
          max={driver.max}
          step={driver.step}
          value={value}
          onChange={(e) => onChange(driver.id, parseFloat(e.target.value))}
          className="w-full"
          style={{
            background: `linear-gradient(to right,
                  ${accentColor} 0%,
                  ${accentColor} ${pct}%,
                  var(--color-border-strong) ${pct}%,
                  var(--color-border-strong) 100%)`,
          }}
          aria-label={driver.label}
          aria-valuemin={driver.min}
          aria-valuemax={driver.max}
          aria-valuenow={value}
        />
      </div>

      <div className="flex justify-between mt-0.5">
        <span style={{ color: "var(--color-text-tertiary)", fontSize: 10 }}>
          {formatValue(driver.min)}
        </span>
        <span style={{ color: "var(--color-text-tertiary)", fontSize: 10 }}>
          {formatValue(driver.max)}
        </span>
      </div>

      <SeasonalitySparkline weights={driver.seasonalityQ1Q2Q3Q4} accentColor={accentColor} />

      {tooltipVisible && anchorRect && (
        <PortalTooltip text={driver.description} anchorRect={anchorRect} />
      )}
    </div>
  );
}
