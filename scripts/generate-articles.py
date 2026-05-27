#!/usr/bin/env python3
"""
BharatIntel — Article Generator
================================
Reads event JSON files from data/events/ (from the india-diplomacy companion project
or any similar source) and uses Anthropic Claude to generate full intelligence articles
in the three-section format (Context / Connected Threads / Signal Forward).

Usage:
    python3 scripts/generate-articles.py [--country us] [--limit 10] [--overwrite]

Requirements:
    pip install anthropic python-slugify

Environment:
    ANTHROPIC_API_KEY=sk-ant-...
    EVENTS_DIR=/path/to/india-diplomacy/data/events  (optional, defaults to ../india-diplomacy/data/events)

Output:
    Writes article JSON files to data/articles/{slug}.json
    Each file is a complete Article object ready for the Next.js site.
"""

import os
import re
import json
import time
import argparse
import hashlib
import logging
from pathlib import Path
from typing import Optional

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
log = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent.parent
ARTICLES_DIR = BASE_DIR / "data" / "articles"
ARTICLES_DIR.mkdir(parents=True, exist_ok=True)

# Events source — can be overridden via EVENTS_DIR env var or --events-dir flag
DEFAULT_EVENTS_DIR = BASE_DIR.parent / "india-diplomacy" / "data" / "events"

# ---------------------------------------------------------------------------
# Country metadata (mirrors lib/countries.ts)
# ---------------------------------------------------------------------------

COUNTRY_NAMES = {
    "us": "United States", "cn": "China", "pk": "Pakistan", "ru": "Russia",
    "gb": "United Kingdom", "fr": "France", "de": "Germany", "jp": "Japan",
    "au": "Australia", "ae": "UAE", "sa": "Saudi Arabia", "il": "Israel",
    "bd": "Bangladesh", "lk": "Sri Lanka", "np": "Nepal", "bt": "Bhutan",
    "ca": "Canada", "za": "South Africa", "br": "Brazil", "sg": "Singapore",
    "kr": "South Korea", "it": "Italy", "nl": "Netherlands", "ir": "Iran",
    "id": "Indonesia",
}

# ---------------------------------------------------------------------------
# Slug generation
# ---------------------------------------------------------------------------

def make_slug(country_code: str, title: str, date: str) -> str:
    """Generate a URL-safe slug from country, title, and year."""
    year = date[:4] if date else "2025"
    # Sanitise title
    slug_title = re.sub(r"[^a-z0-9\s-]", "", title.lower())
    slug_title = re.sub(r"\s+", "-", slug_title.strip())
    slug_title = re.sub(r"-+", "-", slug_title)
    slug_title = slug_title[:60].rstrip("-")
    return f"india-{country_code}-{slug_title}-{year}"


def article_exists(slug: str) -> bool:
    return (ARTICLES_DIR / f"{slug}.json").exists()

# ---------------------------------------------------------------------------
# LLM Generation
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = """You are a foreign policy intelligence analyst writing for BharatIntel,
India's premier diplomatic intelligence publication. Your analysis is sharp, specific, and
grounded exclusively in official Government of India sources.

You write in the style of The Economist meets Foreign Affairs — authoritative but accessible,
analytical not descriptive, with clear cause-effect reasoning.

Your articles have three mandatory sections:
1. CONTEXT: Why does this matter RIGHT NOW? What is the immediate significance? (3-4 paragraphs)
2. CONNECTED THREADS: What parallel stories, historical precedents, or simultaneous events
   does this connect to? How does it fit the larger pattern? (3-4 paragraphs)
3. SIGNAL FORWARD: What specific indicators should analysts watch? What are the 2-3 most
   important developments to track in the next 6-18 months? Be specific and measurable. (2-3 paragraphs)

CRITICAL FORMATTING RULES:
- Use [[slug|label]] syntax to embed inline hyperlinks. Choose meaningful slugs that would
  make sense as article identifiers. Use three types:
  - Historical/backward links (past events): use prefix "india-[country]-[topic]-[year]"
  - Sideways/related links (concurrent parallel stories): describe the parallel story
  - Forward/predictive links (what to watch): describe what's coming
- Paragraphs are separated by double newlines (\\n\\n)
- Write in present tense for current analysis, past tense for historical facts
- No headers, no bullet points within section prose — pure analytical paragraphs
- Each section: 300-500 words"""

def generate_article(event: dict, country_code: str) -> Optional[dict]:
    """Call Claude to generate a full intelligence article from an event."""
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        log.error("ANTHROPIC_API_KEY not set")
        return None

    try:
        import anthropic
        client = anthropic.Anthropic(api_key=api_key)

        country_name = COUNTRY_NAMES.get(country_code, country_code.upper())

        prompt = f"""Generate a BharatIntel intelligence article for this diplomatic event:

Country: {country_name} ({country_code})
Date: {event['date']}
Title: {event['title']}
Description: {event.get('description', event['title'])}
Category: {event.get('category', 'diplomatic')}
Significance: {event.get('significance', 'medium')}
Source: {event.get('source', 'MEA Press Release')}

Write the full article in this exact JSON format (no markdown fences):
{{
  "title": "compelling headline (not just repeat of event title)",
  "lede": "one sentence that captures the strategic significance",
  "sections": {{
    "context": "section prose with [[slug|label]] links embedded...",
    "threads": "section prose with [[slug|label]] links embedded...",
    "signal": "section prose with [[slug|label]] links embedded..."
  }},
  "links": [
    {{
      "slug": "slug-used-in-prose",
      "label": "link text shown to reader",
      "direction": "backward|sideways|forward",
      "preview": "one sentence tooltip"
    }}
  ]
}}

Use ONLY facts derivable from official GoI sources. Do not speculate beyond what official statements support.
Embed 4-8 [[slug|label]] links across the three sections."""

        message = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=2000,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": prompt}],
        )

        raw = message.content[0].text.strip()
        # Strip markdown fences if present
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)

        generated = json.loads(raw)

        slug = make_slug(country_code, generated.get("title", event["title"]), event["date"])

        article = {
            "slug": slug,
            "countryCode": country_code,
            "date": event["date"],
            "title": generated.get("title", event["title"]),
            "lede": generated.get("lede", event.get("description", "")[:200]),
            "category": event.get("category", "diplomatic"),
            "significance": event.get("significance", "medium"),
            "sections": generated.get("sections", {
                "context": event.get("description", ""),
                "threads": "",
                "signal": "",
            }),
            "links": generated.get("links", []),
            "sources": [
                {
                    "label": event.get("sourceLabel", "MEA Press Release"),
                    "url": event.get("source", "https://www.mea.gov.in/press-releases.htm"),
                }
            ],
            "generated": True,
            "sourceEventId": event.get("id", ""),
        }

        return article

    except json.JSONDecodeError as e:
        log.error(f"JSON parse error for {event['id']}: {e}")
        return None
    except Exception as e:
        log.error(f"Generation failed for {event['id']}: {e}")
        return None


def save_article(article: dict) -> None:
    slug = article["slug"]
    path = ARTICLES_DIR / f"{slug}.json"
    with open(path, "w", encoding="utf-8") as f:
        json.dump(article, f, indent=2, ensure_ascii=False)
    log.info(f"  ✓ Saved: {slug}")


# ---------------------------------------------------------------------------
# Main pipeline
# ---------------------------------------------------------------------------

def load_events(events_dir: Path, country_filter: Optional[str] = None) -> list[tuple[str, dict]]:
    """Load all events from JSON files. Returns list of (country_code, event) tuples."""
    items = []
    pattern = f"{country_filter}.json" if country_filter else "*.json"
    for path in sorted(events_dir.glob(pattern)):
        code = path.stem
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
            for event in data.get("events", []):
                items.append((code, event))
        except Exception as e:
            log.warning(f"Could not load {path}: {e}")
    return items


def run(args: argparse.Namespace) -> None:
    events_dir = Path(args.events_dir) if args.events_dir else DEFAULT_EVENTS_DIR

    if not events_dir.exists():
        log.error(f"Events directory not found: {events_dir}")
        log.error("Set --events-dir to point to your india-diplomacy/data/events/ folder")
        return

    log.info(f"Loading events from: {events_dir}")
    all_events = load_events(events_dir, args.country)
    log.info(f"Found {len(all_events)} events")

    # Filter high-significance first, then others
    high = [(c, e) for c, e in all_events if e.get("significance") == "high"]
    others = [(c, e) for c, e in all_events if e.get("significance") != "high"]
    ordered = high + others

    if args.limit:
        ordered = ordered[: args.limit]

    generated_count = 0
    skipped_count = 0

    for country_code, event in ordered:
        # Quick slug to check for existing article
        preview_slug = make_slug(country_code, event.get("title", ""), event.get("date", ""))
        # Check if any article with this event ID already exists
        existing = list(ARTICLES_DIR.glob(f"*{country_code}*{event.get('date', '')[:4]}*.json"))

        if not args.overwrite and any(
            json.loads(p.read_text()).get("sourceEventId") == event.get("id")
            for p in existing
            if p.exists()
        ):
            log.debug(f"  Skipping existing: {event['id']}")
            skipped_count += 1
            continue

        log.info(f"Generating: [{country_code}] {event['title'][:60]}…")
        article = generate_article(event, country_code)

        if article:
            save_article(article)
            generated_count += 1
        else:
            log.warning(f"  ✗ Failed: {event.get('id', '?')}")

        # Rate limit: 1 request per second to avoid hitting API limits
        time.sleep(1.0)

    log.info(
        f"\nDone. Generated {generated_count} articles, skipped {skipped_count} existing."
    )


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate BharatIntel articles from event data")
    parser.add_argument("--country", help="Filter to a single country code (e.g. 'us')")
    parser.add_argument("--limit", type=int, help="Max articles to generate")
    parser.add_argument("--overwrite", action="store_true", help="Regenerate even if article exists")
    parser.add_argument("--events-dir", help="Path to events JSON directory")
    args = parser.parse_args()
    run(args)
