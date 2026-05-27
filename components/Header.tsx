"use client";

import Link from "next/link";
import { useState } from "react";
import { Search, Menu, X } from "lucide-react";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Wordmark */}
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-orange-600 transition-colors">
              भारत<span className="text-orange-500">Intel</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <Link href="/" className="hover:text-slate-900 transition-colors">
              Latest
            </Link>
            <Link href="/country" className="hover:text-slate-900 transition-colors">
              Countries
            </Link>
            <Link href="/search" className="hover:text-slate-900 transition-colors flex items-center gap-1">
              <Search size={14} />
              Search
            </Link>
          </nav>

          {/* Link legend — subtle desktop only */}
          <div className="hidden lg:flex items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-amber-400"></span>
              Historical
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-cyan-400"></span>
              Related
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
              Forward signal
            </span>
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-1 text-slate-600"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile nav */}
        {menuOpen && (
          <div className="md:hidden border-t border-slate-100 py-3 space-y-1">
            <Link
              href="/"
              className="block px-2 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded"
              onClick={() => setMenuOpen(false)}
            >
              Latest
            </Link>
            <Link
              href="/country"
              className="block px-2 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded"
              onClick={() => setMenuOpen(false)}
            >
              Countries
            </Link>
            <Link
              href="/search"
              className="block px-2 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded"
              onClick={() => setMenuOpen(false)}
            >
              Search
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
