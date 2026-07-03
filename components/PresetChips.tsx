"use client";

import { PresetDriverDefinition } from "@/lib/nbcuData";
import EstimateBadge from "./EstimateBadge";

interface PresetChipsProps {
  preset: PresetDriverDefinition;
  value: number;
  onChange: (id: string, value: number) => void;
  accentColor: string;
}

function fmtUsd(v: number): string {
  return `$${v.toLocaleString()}M`;
}

/**
 * Low / Base / High scenario chip selector — the World Cup revenue driver is
 * a sensitivity slider with three discrete presets, not a continuous range
 * (Section 4.1). Clicking a chip sets the underlying value to the exact
 * preset value; the active chip is derived from the current value so the
 * highlight always tracks state correctly.
 */
export default function PresetChips({ preset, value, onChange, accentColor }: PresetChipsProps) {
  return (
    <div className="mb-4 last:mb-0">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1 min-w-0">
          <span className="text-xs leading-tight truncate" style={{ color: "var(--color-text-secondary)" }}>
            {preset.label}
          </span>
          {preset.estimateFlag && <EstimateBadge compact />}
        </div>
        <span
          className="text-sm font-semibold tabular-nums flex-shrink-0 ml-2"
          style={{ color: "var(--color-text-primary)" }}
        >
          +{fmtUsd(value)}
        </span>
      </div>

      <div className="flex gap-1.5" role="group" aria-label={preset.label}>
        {preset.options.map((option) => {
          const active = option.value === value;
          return (
            <button
              key={option.id}
              onClick={() => onChange(preset.id, option.value)}
              className="flex-1 rounded-md text-xs font-medium py-1.5 transition-colors"
              style={{
                backgroundColor: active ? accentColor : "var(--color-bg-subtle)",
                color: active ? "#ffffff" : "var(--color-text-secondary)",
                border: `1px solid ${active ? accentColor : "var(--color-border)"}`,
              }}
              aria-pressed={active}
            >
              {option.label}
              <span className="block tabular-nums" style={{ fontSize: 10, opacity: 0.85 }}>
                {fmtUsd(option.value)}
              </span>
            </button>
          );
        })}
      </div>
      <p className="mt-1" style={{ color: "var(--color-text-tertiary)", fontSize: 10 }}>
        {preset.description}
      </p>
    </div>
  );
}
