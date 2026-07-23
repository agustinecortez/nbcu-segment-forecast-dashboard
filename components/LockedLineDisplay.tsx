import { Lock } from "lucide-react";
import { LockedLineDefinition } from "@/lib/nbcuData";

interface LockedLineDisplayProps {
  line: LockedLineDefinition;
}

/**
 * Realized event revenue is genuinely locked — no code path lets it be
 * edited (Section 7 exit criterion). Rendered as a plain display row, never
 * an input. v2: these lines are already embedded in the pinned Q1/Q2
 * actuals (NBCU_Dashboard_Build_Spec_v2_Quarterly.md Section 6.1) — the
 * locked-blue treatment and `tag` (e.g. "Included in Q1 Actual") make clear
 * this card is informational context, not an additive math input.
 */
export default function LockedLineDisplay({ line }: LockedLineDisplayProps) {
  return (
    <div
      className="mb-4 last:mb-0 rounded-md px-3 py-2"
      style={{ backgroundColor: "var(--color-locked-bg)", border: "1px solid var(--color-locked-border)" }}
      title={line.description}
    >
      {line.tag && (
        <p
          className="mb-1 font-semibold uppercase tracking-wide"
          style={{ color: "var(--color-locked-text)", fontSize: 9, letterSpacing: "0.04em" }}
        >
          {line.tag}
        </p>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 min-w-0">
          <Lock size={11} style={{ color: "var(--color-locked)" }} />
          <span className="text-xs leading-tight truncate" style={{ color: "var(--color-text-secondary)" }}>
            {line.label}
          </span>
        </div>
        <span
          className="text-sm font-semibold tabular-nums flex-shrink-0 ml-2"
          style={{ color: "var(--color-locked-text)" }}
        >
          ${line.value.toLocaleString()}M
        </span>
      </div>
      <p className="mt-1" style={{ color: "var(--color-text-tertiary)", fontSize: 10 }}>
        {line.description}
      </p>
    </div>
  );
}
