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

      {/* Section 6, item 4: sourcing line + long-form educational disclosure
          (Addendum v3 Section 1a — same placement pattern as Disney's) */}
      <div className="px-6 pt-3 pb-2 border-b space-y-1.5" style={{ borderColor: "var(--color-border)" }}>
        <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-tertiary)" }}>
          Sources: {NBCU_CONFIG.sourceDisclosure.join(" · ")}.
        </p>
        <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-tertiary)" }}>
          {NBCU_CONFIG.educationalDisclosureLong}
        </p>
      </div>

      {/* Utility bar — brand, GitHub, Comcast IR, and the short educational
          tag (Addendum v3 Section 1a — same pattern as Disney's utility bar) */}
      <div className="px-6 py-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold" style={{ color: "var(--color-text-secondary)" }}>
            AugieAI Execute
          </span>
          <span className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>
            · Option 2 · NBCU Segment Forecast Dashboard · © {year}
          </span>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <a
            href={NBCU_CONFIG.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs transition-colors"
            style={{ color: "var(--color-text-tertiary)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-primary)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-tertiary)")}
          >
            GitHub →
          </a>
          <a
            href={NBCU_CONFIG.comcastIrUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs transition-colors"
            style={{ color: "var(--color-text-tertiary)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-primary)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-tertiary)")}
          >
            Comcast IR →
          </a>
          <span
            className="text-xs font-medium px-2 py-0.5 rounded"
            style={{
              backgroundColor: "var(--color-accent-subtle)",
              color: "var(--color-accent)",
              border: "1px solid #E0C98A",
            }}
          >
            {NBCU_CONFIG.educationalDisclosureShort}
          </span>
        </div>
      </div>
    </footer>
  );
}
