interface EstimateBadgeProps {
  compact?: boolean;
}

/**
 * Persistent visual flag for any driver or line marked "est." in the build
 * spec — must be visible in the UI itself, not just in supporting docs
 * (Section 5).
 */
export default function EstimateBadge({ compact }: EstimateBadgeProps) {
  return (
    <span
      className="inline-flex items-center rounded font-semibold uppercase tracking-wide flex-shrink-0"
      style={{
        backgroundColor: "var(--color-estimate-bg)",
        color: "var(--color-estimate-text)",
        border: "1px solid var(--color-estimate-border)",
        fontSize: compact ? 9 : 10,
        padding: compact ? "1px 4px" : "1px 6px",
        lineHeight: 1.4,
      }}
      title="Estimate — not isolated in NBCUniversal-specific disclosure at this granularity"
    >
      Est.
    </span>
  );
}
