import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { loadArticle, getAllSlugs } from "@/lib/articles";
import { COUNTRIES_BY_CODE } from "@/lib/countries";
import { CATEGORY_META } from "@/lib/types";
import ArticleBody from "@/components/ArticleBody";
import CountryBadge from "@/components/CountryBadge";
import { clsx } from "clsx";

interface Props {
  params: { slug: string };
}

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = loadArticle(params.slug);
  if (!article) return { title: "Not found" };
  const country = COUNTRIES_BY_CODE[article.countryCode];
  return {
    title: article.title,
    description: article.lede,
    openGraph: {
      title: article.title,
      description: article.lede,
      type: "article",
      publishedTime: article.date,
      tags: [country?.name ?? article.countryCode, article.category],
    },
  };
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function ArticlePage({ params }: Props) {
  const article = loadArticle(params.slug);
  if (!article || !article.generated) notFound();

  const existingSlugs = new Set(getAllSlugs());
  const country = COUNTRIES_BY_CODE[article.countryCode];
  const category = CATEGORY_META[article.category];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Breadcrumb */}
      <nav className="text-xs text-slate-400 mb-6 flex items-center gap-1.5">
        <a href="/" className="hover:text-slate-600 transition-colors">Home</a>
        <span>/</span>
        {country && (
          <>
            <a href={`/country/${article.countryCode}`} className="hover:text-slate-600 transition-colors">
              {country.flag} {country.name}
            </a>
            <span>/</span>
          </>
        )}
        <span className="text-slate-500 truncate max-w-xs">{article.title}</span>
      </nav>

      {/* Article header */}
      <header className="mb-8 pb-6 border-b border-slate-200">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {country && <CountryBadge code={article.countryCode} size="md" />}
          <span
            className={clsx(
              "inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium",
              category.bg,
              category.color
            )}
          >
            {category.label}
          </span>
          {article.significance === "high" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-medium bg-red-50 text-red-700">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500"></span>
              High significance
            </span>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight mb-3">
          {article.title}
        </h1>

        <p className="text-lg text-slate-600 leading-relaxed mb-4 max-w-3xl">{article.lede}</p>

        <div className="text-sm text-slate-400">{formatDate(article.date)}</div>
      </header>

      {/* Article body */}
      <ArticleBody article={article} existingSlugs={existingSlugs} />
    </div>
  );
}
