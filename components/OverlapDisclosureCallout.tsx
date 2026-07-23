import { AlertTriangle } from "lucide-react";
import { DriverValues, getSegment } from "@/lib/nbcuData";

interface OverlapDisclosureCalloutProps {
  drivers: DriverValues;
}

/**
 * Live overlap disclosure (Section 9) — v1 handled this risk as a static,
 * always-on footnote (still rendered separately via ModelingLimitationFootnote,
 * unchanged, as a permanent secondary disclosure). v2 promotes it to a
 * conditional callout above the margin bridge, shown only when both are true:
 * the Q2 Peacock Loss Narrowing seasonality weight is heavy (>= 30% of the
 * annual driver — read from the driver's own data-defined vector, not
 * hardcoded, so this stays correct if the vector is ever revised) AND the Q3
 * World Cup Residual preset is set above Low (i.e. Base or High).
 */
export default function OverlapDisclosureCallout({ drivers }: OverlapDisclosureCalloutProps) {
  const mediaSegment = getSegment("media");
  const narrowingDriver = mediaSegment.drivers.find((d) => d.id === "peacockLossNarrowing")!;
  const q2NarrowingWeight = narrowingDriver.seasonalityQ1Q2Q3Q4[1];

  const q3Preset = mediaSegment.presetDrivers!.find((p) => p.id === "q3WorldCupResidual")!;
  const lowValue = q3Preset.options.find((o) => o.id === "low")!.value;
  const q3IsBaseOrHigh = drivers.q3WorldCupResidual > lowValue;

  const shouldShow = q2NarrowingWeight >= 0.3 && q3IsBaseOrHigh;
  if (!shouldShow) return null;

  return (
    <div
      className="rounded-md px-4 py-3"
      style={{ backgroundColor: "var(--color-estimate-bg)", border: "1px solid var(--color-estimate-border)" }}
    >
      <div className="flex items-start gap-2">
        <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" style={{ color: "var(--color-estimate-text)" }} />
        <div>
          <p className="text-xs font-semibold mb-1" style={{ color: "var(--color-estimate-text)" }}>
            Overlap disclosure — Q2 Peacock loss-narrowing overlaps with realized World Cup revenue
          </p>
          <p className="text-xs leading-relaxed" style={{ color: "var(--color-estimate-text)" }}>
            Comcast&rsquo;s Q2 2026 earnings confirmed Peacock&rsquo;s first-ever quarterly profit
            ($189M) landed in the same quarter as $440M of Telemundo World Cup revenue. Additive
            treatment of Peacock loss-narrowing and Q3 World Cup Residual in your current view may
            double-count some of the Q2 profitability improvement. Static disclosure: v1 flagged this
            risk before Q2 filed. Actuals now confirm the overlap is real.
          </p>
        </div>
      </div>
    </div>
  );
}
