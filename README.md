# BharatIntel

**India's foreign policy intelligence publication.** A clean editorial site that publishes daily analysis pieces on India's bilateral relations with 25 key nations — sourced exclusively from official Government of India publications, written by Claude.

---

## What it looks like

Three-section articles with three distinct hyperlink types:

| Link colour | Direction | Meaning |
|-------------|-----------|---------|
| 🟡 Amber | ↩ Historical | Context from the past — roots of this story |
| 🔵 Cyan | ↔ Sideways | Parallel story happening simultaneously in another country |
| 🟢 Green | ↪ Forward | Signal — what to watch next |

---

## Project layout

```
bharat-intel/
├── app/                          # Next.js 14 App Router
│   ├── page.tsx                  # Homepage: hero + feed
│   ├── layout.tsx                # Root layout + metadata
│   ├── article/[slug]/page.tsx   # Article reader
│   ├── country/page.tsx          # Countries A–Z
│   ├── country/[code]/page.tsx   # Country profile + articles
│   └── search/
│       ├── page.tsx              # Search (server wrapper)
│       └── SearchClient.tsx      # Fuse.js client search
├── components/
│   ├── Header.tsx                # Sticky header with link legend
│   ├── Footer.tsx                # Footer with source links
│   ├── ArticleCard.tsx           # Card for feed/hero variants
│   ├── ArticleBody.tsx           # Three-section reader + sidebar
│   └── CountryBadge.tsx          # Status-coloured country pill
├── lib/
│   ├── types.ts                  # TypeScript types + LINK_META/CATEGORY_META
│   ├── articles.ts               # File-system article loaders
│   └── countries.ts              # 25-country metadata
├── data/
│   └── articles/                 # One JSON file per article
│       ├── india-pakistan-operation-sindoor-2025.json
│       ├── india-us-trade-deal-2026.json
│       └── ...
├── scripts/
│   ├── generate-articles.py      # Batch generate articles from event JSON
│   └── daily-pipeline.py         # Scrape MEA/PIB → classify → generate → publish
└── START.command                 # macOS double-click launcher
```

---

## Quick start

### Prerequisites
- Node.js 18+ ([nodejs.org](https://nodejs.org))
- Python 3.9+ (for generators)
- Anthropic API key (for article generation)

### 1. Run locally

```bash
cd bharat-intel
npm install
npm run dev -- --port 3001
```

Open [http://localhost:3001](http://localhost:3001).

Or double-click `START.command` in Finder.

### 2. Generate articles from existing event data

If you have the `india-diplomacy` project in the same parent folder:

```bash
export ANTHROPIC_API_KEY=sk-ant-...
python3 scripts/generate-articles.py
```

This reads all 194 events from `../india-diplomacy/data/events/` and generates full intelligence articles for each. High-significance events first, ~1 API call/second, ~3–5 min total.

Options:
```bash
# Only generate for one country
python3 scripts/generate-articles.py --country us

# Limit total articles
python3 scripts/generate-articles.py --limit 20

# Point to custom events directory
python3 scripts/generate-articles.py --events-dir /path/to/events

# Regenerate even if article exists
python3 scripts/generate-articles.py --overwrite
```

### 3. Run the daily pipeline (scrape + generate)

```bash
export ANTHROPIC_API_KEY=sk-ant-...
python3 scripts/daily-pipeline.py
```

Schedule with cron (runs at 6:30 AM IST = 1:00 AM UTC):

```
0 1 * * * cd /path/to/bharat-intel && ANTHROPIC_API_KEY=sk-ant-... python3 scripts/daily-pipeline.py >> logs/pipeline.log 2>&1
```

---

## Article JSON format

Each article in `data/articles/` is a single JSON file:

```json
{
  "slug": "india-netherlands-strategic-partnership-2025",
  "countryCode": "nl",
  "date": "2025-11-14",
  "title": "India–Netherlands: The Semiconductor Handshake That Could Change Everything",
  "lede": "One-sentence strategic summary shown on cards",
  "category": "economic",
  "significance": "high",
  "sections": {
    "context": "Why it matters now. Use [[slug|label]] for links.",
    "threads": "Parallel stories and connected history.",
    "signal": "What to watch in the next 6–18 months."
  },
  "links": [
    {
      "slug": "india-us-icet-2022",
      "label": "iCET explained",
      "direction": "backward",
      "preview": "One-sentence tooltip"
    }
  ],
  "sources": [
    { "label": "MEA Press Release", "url": "https://www.mea.gov.in/..." }
  ],
  "generated": true
}
```

`direction` values: `backward` (amber), `sideways` (cyan), `forward` (green).

`[[slug|label]]` in body prose renders as an inline link chip. Label is optional — if omitted, the registered link's label is used.

---

## Adding articles manually

1. Create `data/articles/your-slug.json` following the format above
2. Set `"generated": true`
3. The homepage picks it up immediately (ISR refreshes every hour)

---

## Deploy to Vercel (recommended — free)

```bash
cd bharat-intel
git init
git add .
git commit -m "Initial commit — BharatIntel"
git remote add origin https://github.com/YOUR_USERNAME/bharat-intel.git
git push -u origin main
```

Then at [vercel.com](https://vercel.com): Add New Project → select `bharat-intel` → Deploy.

Add a Vercel Cron in `vercel.json` to run the pipeline daily:

```json
{
  "crons": [
    { "path": "/api/cron/daily", "schedule": "0 1 * * *" }
  ]
}
```

Create `app/api/cron/daily/route.ts` that invokes the pipeline logic.

---

## Roadmap

- **Full-text search** across all article bodies (not just title/lede)
- **Knowledge graph view** — visualise backward/sideways/forward links as a node graph
- **Country comparison** — side-by-side analysis of two bilateral relationships
- **Email digest** — daily briefing of new high-significance articles
- **RSS feed** — per-country and global feeds

---

*Built for analysts, journalists, and researchers tracking India's place in a multipolar world.*
