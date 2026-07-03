import { NBCU_CONFIG } from "@/lib/nbcuData";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      className="w-full border-t"
      style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg-subtle)" }}
    >
      {/* Section 6, item 1-2: pro-forma + EBITDA-alignment disclosures */}
      <div className="px-6 py-3 border-b space-y-1.5" style={{ borderColor: "var(--color-border)" }}>
        <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-tertiary)" }}>
          {NBCU_CONFIG.proFormaDisclosure}
        </p>
        <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-tertiary)" }}>
          {NBCU_CONFIG.ebitdaAlignmentDisclosure}
        </p>
      </div>

      {/* Section 6, item 3: SAP Analytics Cloud framing */}
      <div className="px-6 py-3 border-b" style={{ borderColor: "var(--color-border)" }}>
        <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-tertiary)" }}>
          {NBCU_CONFIG.saplessFramingDisclosure}
        </p>
      </div>

      {/* Section 6, item 4: sourcing line */}
      <div className="px-6 py-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold" style={{ color: "var(--color-text-secondary)" }}>
            AugieAI Execute
          </span>
          <span className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>
            · Option 2 · NBCU Segment Forecast Dashboard · © {year}
          </span>
        </div>

        <span
          className="text-xs font-medium px-2 py-0.5 rounded"
          style={{
            backgroundColor: "var(--color-accent-subtle)",
            color: "var(--color-accent)",
            border: "1px solid #E0C98A",
          }}
        >
          Educational use only · Not investment advice
        </span>
      </div>

      <div className="px-6 pb-3">
        <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-tertiary)" }}>
          Sources: {NBCU_CONFIG.sourceDisclosure.join(" · ")}.
        </p>
      </div>
    </footer>
  );
}
