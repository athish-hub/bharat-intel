import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { clsx } from "clsx";
import { COUNTRIES_BY_CODE, COUNTRIES } from "@/lib/countries";
import { STATUS_META, CATEGORY_META } from "@/lib/types";
import { loadCountryArticles } from "@/lib/articles";
import ArticleCard from "@/components/ArticleCard";

interface Props {
  params: { code: string };
}

export async function generateStaticParams() {
  return COUNTRIES.map((c) => ({ code: c.code }));
}

const BASE_URL = "https://bharat-intel-seven.vercel.app";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const country = COUNTRIES_BY_CODE[params.code];
  if (!country) return { title: "Not found" };
  const canonicalUrl = `${BASE_URL}/country/${params.code}`;

  return {
    title: `India–${country.name} Relations | Intelligence & Analysis`,
    description: country.summary,
    keywords: [
      `India ${country.name} relations`,
      `India ${country.name} bilateral`,
      `India ${country.name} foreign policy`,
      `${country.name} India diplomacy`,
      `India ${country.name} trade defence`,
      "BharatIntel",
    ],
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: `India–${country.name} Relations`,
      description: country.summary,
      type: "website",
      url: canonicalUrl,
      siteName: "BharatIntel",
    },
    twitter: {
      card: "summary",
      title: `India–${country.name} Relations | BharatIntel`,
      description: country.summary,
      site: "@bharatintel",
    },
  };
}

export default function CountryPage({ params }: Props) {
  const country = COUNTRIES_BY_CODE[params.code];
  if (!country) notFound();

  const articles = loadCountryArticles(country.code, 30);
  const statusMeta = STATUS_META[country.status];
  const canonicalUrl = `${BASE_URL}/country/${params.code}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `India–${country.name} Relations`,
    description: country.summary,
    url: canonicalUrl,
    about: [
      { "@type": "Country", name: "India" },
      { "@type": "Country", name: country.name },
    ],
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
        { "@type": "ListItem", position: 2, name: country.name, item: canonicalUrl },
      ],
    },
  };

  // Count by category
  const catCounts: Record<string, number> = {};
  for (const a of articles) {
    catCounts[a.category] = (catCounts[a.category] ?? 0) + 1;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb */}
      <nav className="text-xs text-slate-400 mb-6 flex items-center gap-1.5">
        <a href="/" className="hover:text-slate-600 transition-colors">Home</a>
        <span>/</span>
        <a href="/country" className="hover:text-slate-600 transition-colors">Countries</a>
        <span>/</span>
        <span className="text-slate-500">{country.flag} {country.name}</span>
      </nav>

      {/* Country header */}
      <header className="mb-8 pb-6 border-b border-slate-200">
        <div className="flex items-start gap-4">
          <span className="text-5xl">{country.flag}</span>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-900">
                India — {country.name}
              </h1>
              <span className={clsx("text-sm font-medium px-2.5 py-1 rounded-full", statusMeta.badge)}>
                {statusMeta.label}
              </span>
            </div>
            <p className="text-slate-600 leading-relaxed max-w-3xl">{country.summary}</p>
          </div>
        </div>
      </header>

      {/* Category breakdown */}
      {Object.keys(catCounts).length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          {(Object.entries(catCounts) as [string, number][])
            .sort((a, b) => b[1] - a[1])
            .map(([cat, count]) => {
              const meta = CATEGORY_META[cat as keyof typeof CATEGORY_META];
              return (
                <span
                  key={cat}
                  className={clsx(
                    "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium",
                    meta.bg,
                    meta.color
                  )}
                >
                  {meta.label}
                  <span className="opacity-60 text-xs">({count})</span>
                </span>
              );
            })}
        </div>
      )}

      {/* Articles feed */}
      {articles.length > 0 ? (
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
            Intelligence ({articles.length} articles)
          </div>
          <div>
            {articles.map((article) => (
              <ArticleCard key={article.slug} article={article} variant="feed" />
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center">
          <div className="text-3xl mb-3">{country.flag}</div>
          <p className="text-slate-500 text-sm">
            No articles yet for {country.name}. Run the daily pipeline to generate intelligence.
          </p>
        </div>
      )}
    </div>
  );
}
