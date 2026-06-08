"use client";

import { useState, useMemo } from "react";
import Fuse from "fuse.js";
import Link from "next/link";
import { clsx } from "clsx";
import type { SearchEntry } from "@/lib/articles";
import { CATEGORY_META } from "@/lib/types";
import { COUNTRIES_BY_CODE } from "@/lib/countries";
import { Search } from "lucide-react";

interface Props {
  index: SearchEntry[];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

// Strip common stop words so sentence queries focus on meaningful terms
const STOPWORDS = new Set([
  "what", "when", "where", "which", "who", "why", "how", "is", "are", "was",
  "were", "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
  "of", "with", "by", "from", "about", "has", "have", "had", "does", "do",
  "did", "will", "would", "could", "should", "tell", "me", "us", "their",
  "between", "india", "indian",
]);

function extractKeyTerms(query: string): string {
  const words = query.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/);
  const meaningful = words.filter((w) => w.length > 2 && !STOPWORDS.has(w));
  return meaningful.length > 0 ? meaningful.join(" ") : query;
}

function highlight(text: string, terms: string[]): string {
  if (!terms.length) return text;
  const escaped = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const regex = new RegExp(`(${escaped.join("|")})`, "gi");
  return text.replace(regex, "**$1**");
}

function HighlightedText({ text, terms }: { text: string; terms: string[] }) {
  if (!terms.length) return <>{text}</>;
  const parts = text.split(new RegExp(`(${terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        terms.some((t) => t.toLowerCase() === part.toLowerCase()) ? (
          <mark key={i} className="bg-orange-100 text-orange-800 rounded px-0.5">{part}</mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

export default function SearchClient({ index }: Props) {
  const [query, setQuery] = useState("");

  const fuse = useMemo(
    () =>
      new Fuse(index, {
        keys: [
          { name: "title", weight: 3 },
          { name: "lede", weight: 2 },
          { name: "country", weight: 2 },
          { name: "body", weight: 1 },
          { name: "category", weight: 0.5 },
        ],
        threshold: 0.45,
        includeScore: true,
        ignoreLocation: true,   // don't penalise matches deep in body text
        useExtendedSearch: false,
        minMatchCharLength: 2,
      }),
    [index]
  );

  const { results, highlightTerms } = useMemo(() => {
    const q = query.trim();
    if (!q) return { results: index.slice(0, 20), highlightTerms: [] };

    // For short queries (1-2 words): use as-is
    // For longer queries (sentences/phrases): extract key terms
    const words = q.split(/\s+/);
    const searchQuery = words.length > 3 ? extractKeyTerms(q) : q;
    const terms = searchQuery.split(/\s+/).filter((w) => w.length > 2);

    const fuseResults = fuse.search(searchQuery).map((r) => r.item);

    // Also do a direct substring match on title/lede for exact phrase hits
    const lowerQ = q.toLowerCase();
    const exactMatches = index.filter(
      (e) =>
        e.title.toLowerCase().includes(lowerQ) ||
        e.lede.toLowerCase().includes(lowerQ) ||
        e.body.toLowerCase().includes(lowerQ)
    );

    // Merge: exact matches first, then fuse results, deduplicated
    const seen = new Set<string>();
    const merged = [...exactMatches, ...fuseResults].filter((e) => {
      if (seen.has(e.slug)) return false;
      seen.add(e.slug);
      return true;
    });

    return { results: merged.slice(0, 30), highlightTerms: terms };
  }, [query, fuse, index]);

  return (
    <div>
      {/* Search input */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="search"
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by keyword, country, phrase or question…"
          className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
        />
      </div>

      {/* Result count */}
      <div className="text-xs text-slate-400 mb-4">
        {query.trim()
          ? `${results.length} result${results.length !== 1 ? "s" : ""} for "${query.trim()}"`
          : `Latest ${results.length} articles`}
      </div>

      {/* Results */}
      <div className="divide-y divide-slate-100">
        {results.map((entry) => {
          const country = COUNTRIES_BY_CODE[entry.countryCode];
          const category = CATEGORY_META[entry.category];
          return (
            <Link
              key={entry.slug}
              href={`/article/${entry.slug}`}
              className="group block py-4 hover:bg-slate-50 -mx-2 px-2 rounded transition-colors"
            >
              <div className="flex items-center gap-2 mb-1 text-xs text-slate-500 flex-wrap">
                {country && (
                  <span className="font-medium text-slate-700">
                    {country.flag} {country.name}
                  </span>
                )}
                <span>·</span>
                <span className={clsx("px-1.5 py-0.5 rounded-full font-medium", category.bg, category.color)}>
                  {category.label}
                </span>
                <span>·</span>
                <span>{formatDate(entry.date)}</span>
              </div>
              <h3 className="text-base font-semibold text-slate-900 group-hover:text-orange-600 transition-colors mb-1 leading-snug">
                <HighlightedText text={entry.title} terms={highlightTerms} />
              </h3>
              <p className="text-sm text-slate-500 line-clamp-2">
                <HighlightedText text={entry.lede} terms={highlightTerms} />
              </p>
            </Link>
          );
        })}
      </div>

      {results.length === 0 && query.trim() && (
        <div className="text-center py-12 text-slate-400">
          <div className="text-2xl mb-2">🔍</div>
          <p>No articles found for &ldquo;{query}&rdquo;</p>
          <p className="text-xs mt-2">Try a country name, topic, or shorter phrase</p>
        </div>
      )}
    </div>
  );
}
