import { AlertTriangle } from "lucide-react";

/**
 * Disclosed modeling limitation (Section 4.1) — must render as a permanent,
 * visible block in the Media panel, not a tooltip that requires discovery.
 */
export default function ModelingLimitationFootnote() {
  return (
    <div
      className="rounded-md px-4 py-3"
      style={{ backgroundColor: "var(--color-estimate-bg)", border: "1px solid var(--color-estimate-border)" }}
    >
      <div className="flex items-start gap-2">
        <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" style={{ color: "var(--color-estimate-text)" }} />
        <div>
          <p className="text-xs font-semibold mb-1" style={{ color: "var(--color-estimate-text)" }}>
            Modeling limitation — Peacock narrowing / World Cup overlap
          </p>
          <p className="text-xs leading-relaxed" style={{ color: "var(--color-estimate-text)" }}>
            Peacock loss narrowing and World Cup revenue overlap in Q2 2026 — a risk v1 flagged
            before Q2 filed, now confirmed by the actuals: Comcast&rsquo;s Q2 2026 8-K reports
            Peacock&rsquo;s first-ever quarterly profit of $189M landing in the same quarter as
            $440M of Telemundo World Cup revenue, and the disclosure notes the Peacock figure
            &ldquo;includes amounts attributable to the FIFA World Cup.&rdquo; Q1 and Q2 are pinned
            actuals here, so this overlap is embedded in reported fact, not double-counted; the
            live Q3 World Cup Residual preset and the Peacock Loss Narrowing slider are the only
            places you can still make the two drivers add together — the callout above the bridge
            fires when a specific slider combination trips the risk.
          </p>
          <p className="text-xs leading-relaxed mt-2" style={{ color: "var(--color-estimate-text)" }}>
            Known gap, not modeled separately: Peacock subscription revenue from World Cup-driven
            sign-ups is not called out as its own line — the Q3 World Cup Residual preset is sized
            off advertising revenue from the remaining tournament weeks, not subscription lift. Q2
            actuals implicitly include any subscription contribution that landed in the pinned
            quarter, so this is only a gap for Q3/Q4 estimation, not for the H1 total.
          </p>
        </div>
      </div>
    </div>
  );
}
