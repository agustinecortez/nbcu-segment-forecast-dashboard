"use client";

import { useMemo, useState } from "react";
import Header from "@/components/Header";
import SegmentTabs from "@/components/SegmentTabs";
import DriverPanel from "@/components/DriverPanel";
import MetricCards from "@/components/MetricCards";
import MarginBridgeChart from "@/components/MarginBridgeChart";
import TornadoChart from "@/components/TornadoChart";
import ModelingLimitationFootnote from "@/components/ModelingLimitationFootnote";
import VersantExclusionFootnote from "@/components/VersantExclusionFootnote";
import AboutCard from "@/components/AboutCard";
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

const BRIDGE_TITLE: Record<SegmentKey, string> = {
  media: "Media Margin Bridge — FY25 Actual to FY26 Estimate",
  studios: "Studios Margin Bridge — FY25 Actual to FY26 Estimate",
  themeParks: "Theme Parks Margin Bridge — FY25 Actual to FY26 Estimate",
};

const TORNADO_TITLE: Record<SegmentKey, string> = {
  media: "Media FY26E Adjusted EBITDA Sensitivity",
  studios: "Studios FY26E Adjusted EBITDA Sensitivity",
  themeParks: "Theme Parks FY26E Adjusted EBITDA Sensitivity",
};

const TORNADO_SUBTITLE: Record<SegmentKey, string> = {
  media:
    "Impact on Media FY26E Adjusted EBITDA of ±10% relative shift per driver · sorted by total " +
    "swing · excludes the locked realized event tailwind",
  studios: "Impact on Studios FY26E Adjusted EBITDA of ±10% relative shift per driver · sorted by total swing",
  themeParks:
    "Impact on Theme Parks FY26E Adjusted EBITDA of ±10% relative shift per driver · sorted by total swing",
};

export default function DashboardPage() {
  const [drivers, setDrivers] = useState<DriverValues>(getDefaultDriverValues);
  const [activeSegment, setActiveSegment] = useState<SegmentKey>("media");
  const [aboutOpen, setAboutOpen] = useState(false);

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
  const activeBridge = activeForecast.bridge;

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: "var(--color-bg-primary)" }}>
      <Header onAboutOpen={() => setAboutOpen(true)} onReset={handleReset} />

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
          {/* Persistent on every tab — Addendum v3 Section 1 */}
          <VersantExclusionFootnote />

          <MetricCards
            segmentName={activeConfigSegment.name}
            baseline={activeForecast.baseline}
            estimate={activeForecast.estimate}
            accentColor={accentColor}
          />

          <MarginBridgeChart title={BRIDGE_TITLE[activeSegment]} bridge={activeBridge} accentColor={accentColor} />

          {activeSegment === "media" && <ModelingLimitationFootnote />}

          {/* Segment-specific sensitivity — Addendum v3 Section 2 */}
          <TornadoChart
            segmentKey={activeSegment}
            drivers={drivers}
            title={TORNADO_TITLE[activeSegment]}
            subtitle={TORNADO_SUBTITLE[activeSegment]}
          />

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

      <AboutCard isOpen={aboutOpen} onClose={() => setAboutOpen(false)} />
    </div>
  );
}
