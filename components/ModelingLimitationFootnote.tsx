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
            Peacock loss narrowing and World Cup 2026 revenue may partially overlap. Comcast&rsquo;s
            chief financial officer gave second-quarter 2026 profitability guidance in April 2026,
            after Telemundo had already announced 90% of World Cup ad inventory sold — so some of
            that guidance may already assume World Cup momentum, even though most of the tournament
            falls in the third quarter. Public disclosure does not allow a clean separation. Check
            against Comcast&rsquo;s actual second-quarter 2026 earnings release (expected late July
            2026) to confirm the two drivers are additive rather than overlapping.
          </p>
          <p className="text-xs leading-relaxed mt-2" style={{ color: "var(--color-estimate-text)" }}>
            Known gap, not modeled: Peacock subscription revenue from World Cup-driven sign-ups is
            not captured anywhere in this model — the $850M comp used to size the World Cup driver
            is advertising revenue only. This is an under-count, not a double count.
          </p>
        </div>
      </div>
    </div>
  );
}
