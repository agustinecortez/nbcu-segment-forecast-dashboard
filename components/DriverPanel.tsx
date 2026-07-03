import { DriverValues, SegmentBaseline } from "@/lib/nbcuData";
import DriverSlider from "./DriverSlider";
import PresetChips from "./PresetChips";
import LockedLineDisplay from "./LockedLineDisplay";

interface DriverPanelProps {
  segment: SegmentBaseline;
  drivers: DriverValues;
  onChange: (id: string, value: number) => void;
  accentColor: string;
}

/**
 * Renders every control for one segment: organic-growth sliders, margin-
 * adjuster sliders, preset chips, and locked display lines — in that order,
 * matching Section 4 of the build spec. Tab switching swaps which segment's
 * SegmentBaseline is passed in; the underlying DriverValues map is untouched,
 * so each segment's state persists independently while a different tab is
 * active (Section 7 exit criterion).
 */
export default function DriverPanel({ segment, drivers, onChange, accentColor }: DriverPanelProps) {
  return (
    <aside
      className="h-full border-r flex flex-col"
      style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg-card)" }}
    >
      <div className="px-4 py-3 border-b flex-shrink-0" style={{ borderColor: "var(--color-border)" }}>
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: accentColor }}>
          {segment.name} Drivers
        </p>
        <p className="text-xs mt-0.5" style={{ color: "var(--color-text-tertiary)" }}>
          Adjust to model scenarios. Outputs update in real time.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-3">
        {segment.drivers.map((driver) => (
          <DriverSlider
            key={driver.id}
            driver={driver}
            value={drivers[driver.id]}
            onChange={onChange}
            accentColor={accentColor}
          />
        ))}

        {segment.presetDrivers?.map((preset) => (
          <PresetChips
            key={preset.id}
            preset={preset}
            value={drivers[preset.id]}
            onChange={onChange}
            accentColor={accentColor}
          />
        ))}

        {segment.lockedLines?.map((line) => <LockedLineDisplay key={line.id} line={line} />)}
      </div>
    </aside>
  );
}
