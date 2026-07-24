"use client";

import { useEffect, useCallback } from "react";
import { X, ExternalLink, GitBranch } from "lucide-react";
import { NBCU_CONFIG } from "@/lib/nbcuData";

interface AboutCardProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AboutCard({ isOpen, onClose }: AboutCardProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  // Split aboutText into paragraphs on sentence boundaries for readability
  const paragraphs = NBCU_CONFIG.aboutText
    .split(/(?<=\.) (?=[A-Z])/)
    .reduce<string[]>((acc, sentence) => {
      if (acc.length === 0 || acc[acc.length - 1].split(". ").length >= 2) {
        acc.push(sentence);
      } else {
        acc[acc.length - 1] += " " + sentence;
      }
      return acc;
    }, []);

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="about-modal-title"
    >
      <div
        className="w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden"
        style={{ backgroundColor: "var(--color-bg-card)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-primary)" }}
        >
          <div>
            <h2 id="about-modal-title" className="font-semibold text-base" style={{ color: "#ffffff" }}>
              About this dashboard
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.65)" }}>
              NBCU Segment Forecast Dashboard · AugieAI Execute
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center rounded-full transition-colors"
            style={{ width: 32, height: 32, color: "rgba(255,255,255,0.75)", backgroundColor: "rgba(255,255,255,0.1)" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.2)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)")}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Body ───────────────────────────────────────────────────────── */}
        <div className="px-6 py-5 space-y-3 max-h-[60vh] overflow-y-auto">
          <div
            className="rounded-lg px-4 py-3 border-l-4"
            style={{ backgroundColor: "var(--color-accent-subtle)", borderLeftColor: "var(--color-accent)" }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--color-accent)" }}>
              Methodology Demonstration
            </p>
            <p className="text-sm" style={{ color: "var(--color-text-primary)" }}>
              This tool demonstrates driver-based segment forecasting as a methodology. It is not
              investment advice and does not represent Comcast or NBCUniversal&rsquo;s internal
              projections.
            </p>
          </div>

          {paragraphs.map((para, i) => (
            <p key={i} className="text-sm leading-relaxed" style={{ color: "var(--color-text-primary)" }}>
              {para}
            </p>
          ))}

          {/* Data sourcing section */}
          <div className="mt-2 pt-4 border-t" style={{ borderColor: "var(--color-border)" }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--color-text-tertiary)" }}>
              Data Sources
            </p>
            <ul className="text-sm space-y-1.5" style={{ color: "var(--color-text-secondary)" }}>
              {NBCU_CONFIG.sourceDisclosure.map((source, i) => (
                <li key={i}>{source}</li>
              ))}
            </ul>
          </div>

          {/* Key forecast assumptions section */}
          <div className="pt-3 border-t" style={{ borderColor: "var(--color-border)" }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--color-text-tertiary)" }}>
              Key Forecast Assumptions
            </p>
            <ul className="text-sm space-y-1.5" style={{ color: "var(--color-text-secondary)" }}>
              <li>
                <span className="font-medium" style={{ color: "var(--color-text-primary)" }}>
                  Media revenue mix (Peacock / Linear / Other):
                </span>{" "}
                An internal modeling allocation, not disclosed by Comcast at this granularity — used
                only to give growth-rate drivers a dollar base to act on.
              </li>
              <li>
                <span className="font-medium" style={{ color: "var(--color-text-primary)" }}>
                  Event revenue flow-through margin:
                </span>{" "}
                60% — every dollar of event revenue (realized tailwind + World Cup) converts to
                $0.60 of Adjusted EBITDA, higher than base Media margin because production costs for
                these events are largely fixed or already committed.
              </li>
              <li>
                <span className="font-medium" style={{ color: "var(--color-text-primary)" }}>
                  Epic Universe launch-cost roll-off:
                </span>{" "}
                Sized as roughly two-thirds of the observed 2.9-point fiscal year 2025 margin
                compression — a conservative, labeled assumption, not a disclosed figure.
              </li>
              <li>
                <span className="font-medium" style={{ color: "var(--color-text-primary)" }}>
                  Operating Income:
                </span>{" "}
                Not modeled. Comcast does not disclose segment-level depreciation and amortization
                for Media, Studios, or Theme Parks individually, only at the consolidated Content &
                Experiences level — an Operating Income conversion would require an imputed
                allocation rather than a disclosed fact. Adjusted EBITDA is the headline
                profitability metric throughout.
              </li>
              <li>
                <span className="font-medium" style={{ color: "var(--color-text-primary)" }}>
                  Forecast horizon:
                </span>{" "}
                Fiscal year 2025 pro-forma baseline to a fiscal year 2026 forecast only — no fiscal
                year 2027 or 2028 extension. Q1 and Q2 2026 are pinned actuals; Q3 and Q4 2026 are
                driver-adjustable.
              </li>
            </ul>
          </div>
        </div>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <div
          className="flex items-center justify-between px-6 py-3 border-t flex-wrap gap-2"
          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg-subtle)" }}
        >
          <p className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>
            Built by{" "}
            <span className="font-semibold" style={{ color: "var(--color-text-secondary)" }}>
              AugieAI Execute
            </span>{" "}
            · Educational and methodology demonstration purposes only
          </p>

          <div className="flex items-center gap-2">
            <a
              href={NBCU_CONFIG.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded transition-colors font-medium"
              style={{ color: "var(--color-text-secondary)", backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--color-border-strong)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
            >
              <GitBranch size={13} />
              View on GitHub
            </a>

            <a
              href="https://www.cmcsa.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded transition-colors font-medium"
              style={{ color: "var(--color-primary)", backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--color-border-strong)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
            >
              <ExternalLink size={13} />
              Comcast IR
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
