"use client";

import { SegmentKey } from "@/lib/nbcuData";

interface SegmentTabsProps {
  segments: { key: SegmentKey; name: string; color: string }[];
  active: SegmentKey;
  onChange: (key: SegmentKey) => void;
}

/**
 * Segment tabs — Media / Studios / Theme Parks (Section 5). Switching tabs
 * only changes which segment's config/state is rendered; it does not reset
 * or mutate any segment's driver values, so each tab's slider state persists
 * independently (Section 7 exit criterion).
 */
export default function SegmentTabs({ segments, active, onChange }: SegmentTabsProps) {
  return (
    <div
      className="flex gap-1 px-6 pt-3 border-b overflow-x-auto"
      style={{ backgroundColor: "var(--color-bg-card)", borderColor: "var(--color-border)" }}
      role="tablist"
    >
      {segments.map((segment) => {
        const isActive = segment.key === active;
        return (
          <button
            key={segment.key}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(segment.key)}
            className="px-4 py-2.5 text-sm font-semibold rounded-t-md transition-colors flex-shrink-0"
            style={{
              color: isActive ? segment.color : "var(--color-text-tertiary)",
              borderBottom: isActive ? `2px solid ${segment.color}` : "2px solid transparent",
              backgroundColor: isActive ? "var(--color-bg-subtle)" : "transparent",
            }}
          >
            {segment.name}
          </button>
        );
      })}
    </div>
  );
}
