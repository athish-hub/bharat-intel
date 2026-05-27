import { loadFeaturedArticles, loadLatestArticles } from "@/lib/articles";
import ArticleCard from "@/components/ArticleCard";
import { COUNTRIES } from "@/lib/countries";
import Link from "next/link";
import { STATUS_META } from "@/lib/types";
import { clsx } from "clsx";

export const revalidate = 3600; // ISR: re-generate every hour

export default function HomePage() {
  const featured = loadFeaturedArticles(4);
  const latest = loadLatestArticles(20);
  const latestFeed = latest.filter((a) => !featured.some((f) => f.slug === a.slug)).slice(0, 16);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

      {/* Masthead */}
      <div className="mb-8 pb-6 border-b border-slate-200">
        <h1 className="text-3xl font-bold text-slate-900 mb-1">
          भारत<span className="text-orange-500">Intel</span>
        </h1>
        <p className="text-slate-500 text-sm">
          India&apos;s foreign policy intelligence — sourced exclusively from official Government of India publications
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10">

        {/* Main column */}
        <div>
          {/* Hero grid */}
          {featured.length > 0 && (
            <section className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  High Significance
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {featured.map((article) => (
                  <ArticleCard key={article.slug} article={article} variant="hero" />
                ))}
              </div>
            </section>
          )}

          {/* Latest feed */}
          {latestFeed.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  Latest Intelligence
                </h2>
                <Link href="/search" className="text-xs text-orange-600 hover:underline">
                  Search all →
                </Link>
              </div>
              <div>
                {latestFeed.map((article) => (
                  <ArticleCard key={article.slug} article={article} variant="feed" />
                ))}
              </div>
            </section>
          )}

          {/* Empty state */}
          {featured.length === 0 && latestFeed.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 p-12 text-center">
              <div className="text-4xl mb-4">🇮🇳</div>
              <h2 className="text-xl font-bold text-slate-700 mb-2">Articles coming soon</h2>
              <p className="text-slate-500 text-sm max-w-sm mx-auto">
                Run <code className="bg-slate-100 px-1 rounded text-xs">python3 scripts/generate-articles.py</code> to
                generate intelligence articles from the seed event data.
              </p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          {/* Countries A-Z */}
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Countries
              </div>
              <Link href="/country" className="text-xs text-orange-600 hover:underline">
                All →
              </Link>
            </div>
            <ul className="space-y-1">
              {COUNTRIES.slice(0, 12).map((c) => {
                const statusMeta = STATUS_META[c.status];
                return (
                  <li key={c.code}>
                    <Link
                      href={`/country/${c.code}`}
                      className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-50 transition-colors"
                    >
                      <span className="text-base">{c.flag}</span>
                      <span className="text-sm text-slate-700 flex-1">{c.name}</span>
                      <span className={clsx("inline-block w-2 h-2 rounded-full flex-shrink-0", statusMeta.dot)}></span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <Link
              href="/country"
              className="block mt-3 text-center text-xs text-slate-400 hover:text-orange-600 transition-colors py-1"
            >
              View all 25 countries →
            </Link>
          </div>

          {/* Link legend */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
              How to read
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border bg-amber-50 border-amber-300 text-amber-700 text-xs font-medium flex-shrink-0 mt-0.5">
                  ↩ Historical
                </span>
                <span className="text-slate-500 text-xs">What happened before — roots of the story</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border bg-cyan-50 border-cyan-300 text-cyan-700 text-xs font-medium flex-shrink-0 mt-0.5">
                  ↔ Related
                </span>
                <span className="text-slate-500 text-xs">Parallel story happening simultaneously</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border bg-emerald-50 border-emerald-300 text-emerald-700 text-xs font-medium flex-shrink-0 mt-0.5">
                  ↪ Forward
                </span>
                <span className="text-slate-500 text-xs">What to watch — where this is heading</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
