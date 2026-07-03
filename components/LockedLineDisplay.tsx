import { Lock } from "lucide-react";
import { LockedLineDefinition } from "@/lib/nbcuData";

interface LockedLineDisplayProps {
  line: LockedLineDefinition;
}

/**
 * Realized event revenue is genuinely locked — no code path lets it be
 * edited (Section 7 exit criterion). Rendered as a plain display row, never
 * an input.
 */
export default function LockedLineDisplay({ line }: LockedLineDisplayProps) {
  return (
    <div
      className="mb-4 last:mb-0 rounded-md px-3 py-2"
      style={{ backgroundColor: "var(--color-bg-subtle)", border: "1px solid var(--color-border)" }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 min-w-0">
          <Lock size={11} style={{ color: "var(--color-text-tertiary)" }} />
          <span className="text-xs leading-tight truncate" style={{ color: "var(--color-text-secondary)" }}>
            {line.label}
          </span>
        </div>
        <span
          className="text-sm font-semibold tabular-nums flex-shrink-0 ml-2"
          style={{ color: "var(--color-positive)" }}
        >
          +${line.value.toLocaleString()}M
        </span>
      </div>
      <p className="mt-1" style={{ color: "var(--color-text-tertiary)", fontSize: 10 }}>
        {line.description}
      </p>
    </div>
  );
}
