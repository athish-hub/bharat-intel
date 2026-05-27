import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 mt-16 bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-col md:flex-row items-start justify-between gap-8">
          {/* Brand */}
          <div className="max-w-xs">
            <div className="text-lg font-bold tracking-tight text-slate-900 mb-2">
              भारत<span className="text-orange-500">Intel</span>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">
              India&apos;s foreign policy intelligence platform. Every article sourced exclusively from
              official Government of India publications.
            </p>
          </div>

          {/* Nav */}
          <div className="flex flex-wrap gap-x-10 gap-y-4 text-sm">
            <div className="space-y-2">
              <div className="font-semibold text-slate-700 text-xs uppercase tracking-wider">
                Navigation
              </div>
              <div className="flex flex-col gap-1 text-slate-500">
                <Link href="/" className="hover:text-slate-800 transition-colors">Latest</Link>
                <Link href="/country" className="hover:text-slate-800 transition-colors">Countries</Link>
                <Link href="/search" className="hover:text-slate-800 transition-colors">Search</Link>
              </div>
            </div>

            <div className="space-y-2">
              <div className="font-semibold text-slate-700 text-xs uppercase tracking-wider">
                Link types
              </div>
              <div className="flex flex-col gap-1 text-sm">
                <span className="flex items-center gap-2">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400 flex-shrink-0"></span>
                  <span className="text-slate-500">Historical context</span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-cyan-400 flex-shrink-0"></span>
                  <span className="text-slate-500">Related story</span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 flex-shrink-0"></span>
                  <span className="text-slate-500">Forward signal</span>
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="font-semibold text-slate-700 text-xs uppercase tracking-wider">
                Sources
              </div>
              <div className="flex flex-col gap-1 text-slate-500 text-sm">
                <a href="https://www.mea.gov.in" target="_blank" rel="noopener noreferrer" className="hover:text-slate-800 transition-colors">MEA</a>
                <a href="https://pib.gov.in" target="_blank" rel="noopener noreferrer" className="hover:text-slate-800 transition-colors">PIB</a>
                <a href="https://mod.gov.in" target="_blank" rel="noopener noreferrer" className="hover:text-slate-800 transition-colors">Ministry of Defence</a>
                <a href="https://commerce.gov.in" target="_blank" rel="noopener noreferrer" className="hover:text-slate-800 transition-colors">Ministry of Commerce</a>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-200 text-xs text-slate-400">
          All analysis draws exclusively from official Government of India publications. No government affiliation.
        </div>
      </div>
    </footer>
  );
}
