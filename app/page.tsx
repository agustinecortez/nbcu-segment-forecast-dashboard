"use client";

import { useMemo, useState } from "react";
import Header from "@/components/Header";
import SegmentTabs from "@/components/SegmentTabs";
import DriverPanel from "@/components/DriverPanel";
import MetricCards from "@/components/MetricCards";
import MarginBridgeChart from "@/components/MarginBridgeChart";
import ModelingLimitationFootnote from "@/components/ModelingLimitationFootnote";
import Footer from "@/components/Footer";
import { DriverValues, getDefaultDriverValues, getSegment, SegmentKey } from "@/lib/nbcuData";
import { computeMediaForecast, computeStudiosForecast, computeThemeParksForecast } from "@/lib/forecastMath";

const SEGMENT_TABS: { key: SegmentKey; name: string; color: string }[] = [
  { key: "media", name: "Media", color: "var(--color-media)" },
  { key: "studios", name: "Studios", color: "var(--color-studios)" },
  { key: "themeParks", name: "Theme Parks", color: "var(--color-themeparks)" },
];

const ACCENT_COLOR: Record<SegmentKey, string> = {
  media: "var(--color-media)",
  studios: "var(--color-studios)",
  themeParks: "var(--color-themeparks)",
};

export default function DashboardPage() {
  const [drivers, setDrivers] = useState<DriverValues>(getDefaultDriverValues);
  const [activeSegment, setActiveSegment] = useState<SegmentKey>("media");

  function handleDriverChange(id: string, value: number) {
    setDrivers((prev) => ({ ...prev, [id]: value }));
  }

  function handleReset() {
    setDrivers(getDefaultDriverValues());
  }

  const mediaForecast = useMemo(() => computeMediaForecast(drivers), [drivers]);
  const studiosForecast = useMemo(() => computeStudiosForecast(drivers), [drivers]);
  const themeParksForecast = useMemo(() => computeThemeParksForecast(drivers), [drivers]);

  const activeConfigSegment = getSegment(activeSegment);
  const accentColor = ACCENT_COLOR[activeSegment];

  const forecastBySegment = {
    media: mediaForecast,
    studios: studiosForecast,
    themeParks: themeParksForecast,
  } as const;
  const activeForecast = forecastBySegment[activeSegment];

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: "var(--color-bg-primary)" }}>
      <Header onReset={handleReset} />

      <SegmentTabs segments={SEGMENT_TABS} active={activeSegment} onChange={setActiveSegment} />

      <div className="flex flex-1" style={{ minHeight: 0 }}>
        {/* Driver rail — sticky, desktop only */}
        <div className="hidden lg:flex lg:flex-col flex-shrink-0" style={{ width: 340 }}>
          <div className="sticky top-[112px] h-[calc(100vh-112px)] overflow-y-auto">
            <DriverPanel
              segment={activeConfigSegment}
              drivers={drivers}
              onChange={handleDriverChange}
              accentColor={accentColor}
            />
          </div>
        </div>

        {/* Main canvas */}
        <main className="flex-1 overflow-y-auto px-6 py-6 space-y-4" style={{ minWidth: 0 }}>
          <MetricCards
            segmentName={activeConfigSegment.name}
            baseline={activeForecast.baseline}
            estimate={activeForecast.estimate}
            accentColor={accentColor}
          />

          {activeSegment === "media" && (
            <>
              <MarginBridgeChart bridge={mediaForecast.bridge} />
              <ModelingLimitationFootnote />
            </>
          )}

          {/* Mobile: driver panel stacks below main content */}
          <div className="lg:hidden card p-0 overflow-hidden">
            <DriverPanel
              segment={activeConfigSegment}
              drivers={drivers}
              onChange={handleDriverChange}
              accentColor={accentColor}
            />
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}
