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

export default function SearchClient({ index }: Props) {
  const [query, setQuery] = useState("");

  const fuse = useMemo(
    () =>
      new Fuse(index, {
        keys: [
          { name: "title", weight: 2 },
          { name: "lede", weight: 1 },
        ],
        threshold: 0.4,
        includeScore: true,
      }),
    [index]
  );

  const results = useMemo(() => {
    if (!query.trim()) return index.slice(0, 20);
    return fuse.search(query.trim()).map((r) => r.item);
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
          placeholder="Search articles, countries, events…"
          className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
        />
      </div>

      {/* Result count */}
      <div className="text-xs text-slate-400 mb-4">
        {query ? `${results.length} result${results.length !== 1 ? "s" : ""}` : "Latest articles"}
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
                {entry.title}
              </h3>
              <p className="text-sm text-slate-500 line-clamp-2">{entry.lede}</p>
            </Link>
          );
        })}
      </div>

      {results.length === 0 && query && (
        <div className="text-center py-12 text-slate-400">
          <div className="text-2xl mb-2">🔍</div>
          <p>No articles found for &quot;{query}&quot;</p>
        </div>
      )}
    </div>
  );
}
