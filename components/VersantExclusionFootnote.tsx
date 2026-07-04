import { Info } from "lucide-react";
import { NBCU_CONFIG } from "@/lib/nbcuData";

/**
 * Persistent Versant-exclusion scope footnote (Addendum v3 Section 1) —
 * must render on every segment tab without requiring a click, not just on
 * Media. Visually distinct from the amber "estimate/limitation" callouts:
 * this is a factual scope statement, not a flagged assumption.
 */
export default function VersantExclusionFootnote() {
  return (
    <div
      className="rounded-md px-4 py-3"
      style={{
        backgroundColor: "var(--color-bg-subtle)",
        borderLeft: "3px solid var(--color-primary)",
        border: "1px solid var(--color-border)",
        borderLeftWidth: 3,
        borderLeftColor: "var(--color-primary)",
      }}
    >
      <div className="flex items-start gap-2">
        <Info size={14} className="flex-shrink-0 mt-0.5" style={{ color: "var(--color-primary)" }} />
        <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
          {NBCU_CONFIG.versantExclusionFootnote}
        </p>
      </div>
    </div>
  );
}
