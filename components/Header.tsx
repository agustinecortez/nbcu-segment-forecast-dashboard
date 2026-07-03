"use client";

interface HeaderProps {
  onReset: () => void;
}

export default function Header({ onReset }: HeaderProps) {
  return (
    <header
      className="sticky top-0 z-40 w-full border-b flex items-center justify-between px-4 sm:px-6"
      style={{ height: 64, backgroundColor: "var(--color-primary)", borderColor: "var(--color-primary-hover)" }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <span
          className="font-semibold tracking-tight truncate text-sm sm:text-lg md:text-xl"
          style={{ color: "#ffffff" }}
        >
          NBCU Segment Forecast Dashboard
        </span>
        <span
          className="hidden md:inline-flex text-xs px-2 py-0.5 rounded font-medium flex-shrink-0"
          style={{ backgroundColor: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.75)" }}
        >
          CMCSA · FY25 Pro Forma → FY26E
        </span>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={onReset}
          className="text-sm px-3 py-1.5 rounded transition-colors font-medium"
          style={{ color: "var(--color-primary)", backgroundColor: "#ffffff" }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--color-accent-subtle)")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#ffffff")}
        >
          Reset All
        </button>
      </div>
    </header>
  );
}
