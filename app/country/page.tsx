import type { Metadata } from "next";
import Link from "next/link";
import { clsx } from "clsx";
import { COUNTRIES } from "@/lib/countries";
import { STATUS_META } from "@/lib/types";

export const metadata: Metadata = {
  title: "Countries",
  description: "India's bilateral relations with 25 key nations — strategic partners, partners, neighbours, and adversaries.",
};

// Group countries by region
const REGION_ORDER = ["South Asia", "Asia", "Asia-Pacific", "Middle East", "Europe", "Americas", "Africa", "Europe/Asia"];

export default function CountriesPage() {
  const byRegion: Record<string, typeof COUNTRIES> = {};
  for (const c of COUNTRIES) {
    if (!byRegion[c.region]) byRegion[c.region] = [];
    byRegion[c.region].push(c);
  }

  const regions = REGION_ORDER.filter((r) => byRegion[r]?.length);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Countries</h1>
        <p className="text-slate-500 text-sm">
          India&apos;s top 25 bilateral relations — strategic partners, partners, neighbours, and adversaries
        </p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-8 text-sm">
        {(Object.keys(STATUS_META) as Array<keyof typeof STATUS_META>).map((key) => {
          const meta = STATUS_META[key];
          return (
            <span key={key} className="flex items-center gap-1.5">
              <span className={clsx("inline-block w-2.5 h-2.5 rounded-full", meta.dot)}></span>
              <span className="text-slate-600">{meta.label}</span>
            </span>
          );
        })}
      </div>

      {/* Regions */}
      <div className="space-y-10">
        {regions.map((region) => (
          <section key={region}>
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 border-b border-slate-100 pb-2">
              {region}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {byRegion[region].map((country) => {
                const statusMeta = STATUS_META[country.status];
                return (
                  <Link
                    key={country.code}
                    href={`/country/${country.code}`}
                    className="group flex items-start gap-3 p-4 rounded-xl border border-slate-200 hover:shadow-sm hover:border-slate-300 transition-all bg-white"
                  >
                    <span className="text-3xl flex-shrink-0 mt-0.5">{country.flag}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-slate-900 group-hover:text-orange-600 transition-colors">
                          {country.name}
                        </span>
                        <span className={clsx("inline-block w-2 h-2 rounded-full flex-shrink-0", statusMeta.dot)}></span>
                      </div>
                      <span className={clsx("text-xs font-medium px-1.5 py-0.5 rounded-full", statusMeta.badge)}>
                        {statusMeta.label}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
