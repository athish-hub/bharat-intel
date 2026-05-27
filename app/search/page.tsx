import type { Metadata } from "next";
import { buildSearchIndex } from "@/lib/articles";
import SearchClient from "./SearchClient";

export const metadata: Metadata = {
  title: "Search",
  description: "Search across all BharatIntel intelligence articles.",
};

export default function SearchPage() {
  const index = buildSearchIndex();
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Search</h1>
      <p className="text-slate-500 text-sm mb-8">
        Search across {index.length} intelligence articles
      </p>
      <SearchClient index={index} />
    </div>
  );
}
