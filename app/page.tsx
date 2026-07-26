"use client";

import { useMemo, useState } from "react";
import Header from "@/components/Header";
import SegmentTabs from "@/components/SegmentTabs";
import DriverPanel from "@/components/DriverPanel";
import MetricCards from "@/components/MetricCards";
import MarginBridgeChart from "@/components/MarginBridgeChart";
import TornadoChart from "@/components/TornadoChart";
import ModelingLimitationFootnote from "@/components/ModelingLimitationFootnote";
import OverlapDisclosureCallout from "@/components/OverlapDisclosureCallout";
import VersantExclusionFootnote from "@/components/VersantExclusionFootnote";
import AboutCard from "@/components/AboutCard";
import Footer from "@/components/Footer";
import { DriverValues, getDefaultDriverValues, getSegment, SegmentKey } from "@/lib/nbcuData";
import {
  computeMediaQuarterlyForecast,
  computeStudiosQuarterlyForecast,
  computeThemeParksQuarterlyForecast,
} from "@/lib/forecastMath";

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
  media: "Media Margin Bridge — FY25 Baseline to FY26 Forecast",
  studios: "Studios Margin Bridge — FY25 Baseline to FY26 Forecast",
  themeParks: "Theme Parks Margin Bridge — FY25 Baseline to FY26 Forecast",
};

const TORNADO_TITLE: Record<SegmentKey, string> = {
  media: "Media FY26F Adjusted EBITDA Sensitivity",
  studios: "Studios FY26F Adjusted EBITDA Sensitivity",
  themeParks: "Theme Parks FY26F Adjusted EBITDA Sensitivity",
};

// Spec Section 6.2 — single fixed template, segment name swapped per tab.
const TORNADO_SUBTITLE: Record<SegmentKey, string> = {
  media: "Impact on Media FY26 Forecast Adjusted EBITDA of ±10% relative shift per driver · sorted by total swing",
  studios:
    "Impact on Studios FY26 Forecast Adjusted EBITDA of ±10% relative shift per driver · sorted by total swing",
  themeParks:
    "Impact on Theme Parks FY26 Forecast Adjusted EBITDA of ±10% relative shift per driver · sorted by total swing",
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

  const mediaForecast = useMemo(() => computeMediaQuarterlyForecast(drivers), [drivers]);
  const studiosForecast = useMemo(() => computeStudiosQuarterlyForecast(drivers), [drivers]);
  const themeParksForecast = useMemo(() => computeThemeParksQuarterlyForecast(drivers), [drivers]);

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
            fy26Forecast={activeForecast.fy26Forecast}
            accentColor={accentColor}
          />

          {activeSegment === "media" && <OverlapDisclosureCallout drivers={drivers} />}

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
