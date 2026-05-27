import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: {
    default: "BharatIntel — India's Foreign Policy Intelligence",
    template: "%s · BharatIntel",
  },
  description:
    "India's foreign policy intelligence platform. Every analysis sourced exclusively from official Government of India publications — MEA, PIB, Ministry of Defence, Ministry of Commerce.",
  keywords: ["India foreign policy", "MEA", "diplomatic intelligence", "India geopolitics"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-white text-slate-900 antialiased min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
