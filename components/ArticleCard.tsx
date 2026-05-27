import Link from "next/link";
import { clsx } from "clsx";
import type { Article } from "@/lib/types";
import { CATEGORY_META } from "@/lib/types";
import { COUNTRIES_BY_CODE } from "@/lib/countries";

interface Props {
  article: Article;
  /** "hero" = large card, "feed" = compact row */
  variant?: "hero" | "feed" | "compact";
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function ArticleCard({ article, variant = "feed" }: Props) {
  const country = COUNTRIES_BY_CODE[article.countryCode];
  const category = CATEGORY_META[article.category];

  if (variant === "hero") {
    return (
      <Link href={`/article/${article.slug}`} className="group block">
        <article className="rounded-xl border border-slate-200 bg-white p-6 hover:shadow-md transition-shadow">
          {/* Meta row */}
          <div className="flex items-center gap-2 mb-3 text-xs text-slate-500">
            {country && (
              <span className="font-medium text-slate-700">
                {country.flag} {country.name}
              </span>
            )}
            <span>·</span>
            <span
              className={clsx(
                "px-2 py-0.5 rounded-full text-xs font-medium",
                category.bg,
                category.color
              )}
            >
              {category.label}
            </span>
            {article.significance === "high" && (
              <>
                <span>·</span>
                <span className="text-red-500 font-medium">High significance</span>
              </>
            )}
          </div>

          {/* Headline */}
          <h2 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-orange-600 transition-colors leading-snug">
            {article.title}
          </h2>

          {/* Lede */}
          <p className="text-slate-600 text-sm leading-relaxed line-clamp-3">{article.lede}</p>

          {/* Date */}
          <div className="mt-4 text-xs text-slate-400">{formatDate(article.date)}</div>
        </article>
      </Link>
    );
  }

  if (variant === "compact") {
    return (
      <Link href={`/article/${article.slug}`} className="group block py-3 border-b border-slate-100 last:border-0">
        <div className="flex items-start gap-3">
          {country && <span className="text-base mt-0.5">{country.flag}</span>}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className={clsx("text-xs font-medium", category.color)}>{category.label}</span>
              <span className="text-slate-300 text-xs">·</span>
              <span className="text-xs text-slate-400">{formatDate(article.date)}</span>
            </div>
            <h3 className="text-sm font-semibold text-slate-800 group-hover:text-orange-600 transition-colors leading-snug line-clamp-2">
              {article.title}
            </h3>
          </div>
        </div>
      </Link>
    );
  }

  // Default: "feed"
  return (
    <Link href={`/article/${article.slug}`} className="group block">
      <article className="flex gap-4 py-4 border-b border-slate-100 last:border-0">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 text-xs text-slate-500 flex-wrap">
            {country && (
              <span className="font-medium text-slate-700">
                {country.flag} {country.name}
              </span>
            )}
            <span>·</span>
            <span
              className={clsx(
                "px-1.5 py-0.5 rounded-full text-xs font-medium",
                category.bg,
                category.color
              )}
            >
              {category.label}
            </span>
            <span>·</span>
            <span>{formatDate(article.date)}</span>
          </div>
          <h3 className="text-base font-semibold text-slate-900 group-hover:text-orange-600 transition-colors leading-snug mb-1">
            {article.title}
          </h3>
          <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">{article.lede}</p>
        </div>
        {article.significance === "high" && (
          <div className="flex-shrink-0 mt-1">
            <span className="inline-block w-2 h-2 rounded-full bg-red-400"></span>
          </div>
        )}
      </article>
    </Link>
  );
}
