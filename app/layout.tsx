import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NBCU Segment Forecast Dashboard — AugieAI Execute",
  description:
    "Driver-based scenario forecast model for post-Versant NBCUniversal, as reported inside " +
    "Comcast's Content & Experiences segment. Adjust operational drivers across Media, Studios, " +
    "and Theme Parks to project fiscal year 2026 revenue, Adjusted EBITDA, and margin.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  );
}
