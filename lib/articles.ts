import fs from "fs";
import path from "path";
import type { Article, EventCategory } from "./types";

const ARTICLES_DIR = path.join(process.cwd(), "data", "articles");

// ─── Loaders ──────────────────────────────────────────────────────────────────

/** Load a single article by slug. Returns null if not found. */
export function loadArticle(slug: string): Article | null {
  const file = path.join(ARTICLES_DIR, `${slug}.json`);
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, "utf-8")) as Article;
  } catch {
    return null;
  }
}

/** Load all articles, optionally filtered. Sorted newest first. */
export function loadAllArticles(opts?: {
  country?: string;
  category?: EventCategory;
  significance?: "high" | "medium" | "low";
  generated?: boolean;
  limit?: number;
}): Article[] {
  if (!fs.existsSync(ARTICLES_DIR)) return [];

  const files = fs.readdirSync(ARTICLES_DIR).filter((f) => f.endsWith(".json"));
  let articles: Article[] = [];

  for (const file of files) {
    try {
      const a = JSON.parse(
        fs.readFileSync(path.join(ARTICLES_DIR, file), "utf-8")
      ) as Article;
      articles.push(a);
    } catch {
      // skip corrupt files
    }
  }

  // Filter
  if (opts?.country) articles = articles.filter((a) => a.countryCode === opts.country);
  if (opts?.category) articles = articles.filter((a) => a.category === opts.category);
  if (opts?.significance) articles = articles.filter((a) => a.significance === opts.significance);
  if (opts?.generated !== undefined) articles = articles.filter((a) => a.generated === opts.generated);

  // Sort newest first
  articles.sort((a, b) => (a.date < b.date ? 1 : -1));

  if (opts?.limit) articles = articles.slice(0, opts.limit);

  return articles;
}

/** Load articles for a specific country, newest first. */
export function loadCountryArticles(countryCode: string, limit = 20): Article[] {
  return loadAllArticles({ country: countryCode, limit });
}

/** Load featured / high-significance articles for the homepage hero */
export function loadFeaturedArticles(limit = 6): Article[] {
  return loadAllArticles({ significance: "high", generated: true, limit });
}

/** Load latest articles regardless of significance, for the feed */
export function loadLatestArticles(limit = 30): Article[] {
  return loadAllArticles({ generated: true, limit });
}

/** Return all article slugs (for generateStaticParams) */
export function getAllSlugs(): string[] {
  if (!fs.existsSync(ARTICLES_DIR)) return [];
  return fs
    .readdirSync(ARTICLES_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(".json", ""));
}

/** Return all country codes that have at least one article */
export function getCountriesWithArticles(): string[] {
  const articles = loadAllArticles();
  return Array.from(new Set(articles.map((a) => a.countryCode)));
}

// ─── Search index ─────────────────────────────────────────────────────────────

/** Lightweight search index entry (excludes body prose to keep payload small) */
export interface SearchEntry {
  slug: string;
  title: string;
  lede: string;
  countryCode: string;
  date: string;
  category: EventCategory;
}

export function buildSearchIndex(): SearchEntry[] {
  return loadAllArticles({ generated: true }).map(({ slug, title, lede, countryCode, date, category }) => ({
    slug,
    title,
    lede,
    countryCode,
    date,
    category,
  }));
}
