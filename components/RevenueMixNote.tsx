import EstimateBadge from "./EstimateBadge";

interface RevenueMixNoteProps {
  note: string;
}

/**
 * Discloses the internal revenue-mix split used to convert this segment's
 * growth-rate drivers into dollars. These splits are never independently
 * disclosed by Comcast — same "Est." treatment as Theatrical Slate
 * Performance and the Universal Kids Resort drag, surfaced once per segment
 * rather than repeated on every affected slider's tooltip.
 */
export default function RevenueMixNote({ note }: RevenueMixNoteProps) {
  return (
    <div
      className="mb-3 rounded-md px-3 py-2"
      style={{ backgroundColor: "var(--color-estimate-bg)", border: "1px solid var(--color-estimate-border)" }}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <EstimateBadge compact />
        <span className="text-xs font-semibold" style={{ color: "var(--color-estimate-text)" }}>
          Internal revenue-mix assumption
        </span>
      </div>
      <p className="text-xs leading-relaxed" style={{ color: "var(--color-estimate-text)" }}>
        {note}
      </p>
    </div>
  );
}
