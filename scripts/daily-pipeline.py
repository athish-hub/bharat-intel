#!/usr/bin/env python3
"""
BharatIntel — Daily Pipeline
==============================
1. Scrapes MEA and PIB for new press releases (last 2 days)
2. Classifies each item by country and category using Claude Haiku
3. Writes new events to the events source directory
4. Generates full intelligence articles for the new events
5. Logs results

Run manually:     python3 scripts/daily-pipeline.py
Schedule (cron):  30 1 * * * cd /path/to/bharat-intel && ANTHROPIC_API_KEY=sk-ant-... python3 scripts/daily-pipeline.py >> logs/pipeline.log 2>&1

Requirements:
    pip install anthropic requests beautifulsoup4 python-dateutil

Environment:
    ANTHROPIC_API_KEY=sk-ant-...
    EVENTS_DIR=/path/to/events/directory   (optional)
"""

import os
import re
import json
import time
import hashlib
import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional

import requests
from bs4 import BeautifulSoup
from dateutil import parser as dateparser

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(),
    ]
)
log = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent.parent
ARTICLES_DIR = BASE_DIR / "data" / "articles"
LOGS_DIR = BASE_DIR / "logs"
LOGS_DIR.mkdir(exist_ok=True)
ARTICLES_DIR.mkdir(parents=True, exist_ok=True)

# ── Optional: write new events back to india-diplomacy events directory
EVENTS_DIR = Path(os.getenv("EVENTS_DIR", str(BASE_DIR.parent / "india-diplomacy" / "data" / "events")))

COUNTRY_ALIASES: dict[str, str] = {
    "united states": "us", "usa": "us", "america": "us", "u.s.": "us",
    "china": "cn", "people's republic of china": "cn", "prc": "cn",
    "pakistan": "pk",
    "russia": "ru", "russian federation": "ru",
    "united kingdom": "gb", "uk": "gb", "britain": "gb",
    "france": "fr", "germany": "de", "japan": "jp", "australia": "au",
    "united arab emirates": "ae", "uae": "ae",
    "saudi arabia": "sa", "israel": "il",
    "bangladesh": "bd", "sri lanka": "lk", "nepal": "np", "bhutan": "bt",
    "canada": "ca", "south africa": "za", "brazil": "br",
    "singapore": "sg", "south korea": "kr", "republic of korea": "kr",
    "italy": "it", "netherlands": "nl", "holland": "nl",
    "iran": "ir", "indonesia": "id",
}

COUNTRY_NAMES = {
    "us": "United States", "cn": "China", "pk": "Pakistan", "ru": "Russia",
    "gb": "United Kingdom", "fr": "France", "de": "Germany", "jp": "Japan",
    "au": "Australia", "ae": "UAE", "sa": "Saudi Arabia", "il": "Israel",
    "bd": "Bangladesh", "lk": "Sri Lanka", "np": "Nepal", "bt": "Bhutan",
    "ca": "Canada", "za": "South Africa", "br": "Brazil", "sg": "Singapore",
    "kr": "South Korea", "it": "Italy", "nl": "Netherlands", "ir": "Iran",
    "id": "Indonesia",
}

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; BharatIntel/1.0)",
    "Accept": "text/html,application/xhtml+xml",
}


# ─── Scraping ─────────────────────────────────────────────────────────────────

def scrape_mea(since: datetime) -> list[dict]:
    items = []
    try:
        resp = requests.get("https://www.mea.gov.in/press-releases.htm", headers=HEADERS, timeout=20)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")
        links = soup.select(".ListItems a") or soup.select("ul.ulList li a") or soup.select("a[href*='press-releases']")
        for a in links[:50]:
            title = a.get_text(strip=True)
            href = a.get("href", "")
            if not title or len(title) < 10:
                continue
            url = href if href.startswith("http") else f"https://www.mea.gov.in{href}"
            items.append({
                "title": title, "url": url,
                "date": datetime.now().strftime("%Y-%m-%d"),
                "snippet": title, "source_label": "MEA Press Release",
            })
    except Exception as e:
        log.error(f"MEA scrape failed: {e}")
    return items


def scrape_pib(since: datetime) -> list[dict]:
    items = []
    try:
        resp = requests.get("https://pib.gov.in/allRel.aspx", headers=HEADERS, timeout=20)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")
        keywords = ["external affairs", "foreign", "bilateral", "india-", "defence",
                    "minister jaishankar", "prime minister", "summit", "agreement", "mou"]
        for a in soup.select("a[href*='PressReleasePage']")[:50]:
            title = a.get_text(strip=True)
            href = a.get("href", "")
            if not title or len(title) < 10:
                continue
            if not any(kw in title.lower() for kw in keywords):
                continue
            url = href if href.startswith("http") else f"https://pib.gov.in{href}"
            items.append({
                "title": title, "url": url,
                "date": datetime.now().strftime("%Y-%m-%d"),
                "snippet": title, "source_label": "PIB Notification",
            })
    except Exception as e:
        log.error(f"PIB scrape failed: {e}")
    return items


# ─── Classification ───────────────────────────────────────────────────────────

def classify(title: str, snippet: str) -> dict:
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        return heuristic_classify(title, snippet)
    try:
        import anthropic
        client = anthropic.Anthropic(api_key=api_key)
        country_list = ", ".join(sorted(set(COUNTRY_ALIASES.values())))
        prompt = f"""Classify this Indian government press release for a diplomatic database.

Title: {title}
Snippet: {snippet[:400]}

Tracked countries (ISO alpha-2): {country_list}

Respond ONLY with valid JSON (no markdown):
{{
  "country_code": "xx or null",
  "category": "defence|economic|cultural|mou|diplomatic|multilateral",
  "significance": "high|medium|low",
  "description": "2-3 sentence factual summary."
}}"""
        msg = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=300,
            messages=[{"role": "user", "content": prompt}],
        )
        raw = re.sub(r"```json?\s*|\s*```", "", msg.content[0].text.strip())
        return json.loads(raw)
    except Exception as e:
        log.warning(f"LLM classify failed: {e}")
        return heuristic_classify(title, snippet)


def heuristic_classify(title: str, snippet: str) -> dict:
    text = (title + " " + snippet).lower()
    country_code = None
    for alias, code in COUNTRY_ALIASES.items():
        if alias in text:
            country_code = code
            break
    category = "diplomatic"
    best = 0
    keywords_map = {
        "defence": ["defence", "defense", "military", "missile", "weapon", "combat", "strategic", "joint exercise"],
        "economic": ["trade", "invest", "fta", "cepa", "economic", "bilateral trade", "export", "import"],
        "cultural": ["culture", "education", "tourism", "youth", "diaspora"],
        "mou": ["mou", "memorandum", "agreement signed", "pact signed", "protocol signed"],
        "multilateral": ["quad", "brics", "g20", "g7", "sco", "asean", "united nations"],
        "diplomatic": ["visit", "summit", "bilateral", "state visit", "ambassador", "minister"],
    }
    for cat, kws in keywords_map.items():
        score = sum(1 for kw in kws if kw in text)
        if score > best:
            best = score
            category = cat
    high_markers = ["prime minister", "president", "historic", "signed", "summit", "deal", "landmark"]
    significance = "high" if any(m in text for m in high_markers) else "medium"
    return {"country_code": country_code, "category": category,
            "significance": significance, "description": snippet[:300]}


# ─── Article generation (reuses generate-articles logic inline) ───────────────

def generate_article_from_event(event: dict, country_code: str) -> Optional[dict]:
    """Generate a full article for a freshly-scraped event."""
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        return None

    try:
        import anthropic
        client = anthropic.Anthropic(api_key=api_key)

        country_name = COUNTRY_NAMES.get(country_code, country_code.upper())
        prompt = f"""Generate a BharatIntel intelligence article.

Country: {country_name} ({country_code})
Date: {event['date']}
Title: {event['title']}
Description: {event.get('description', event['title'])}
Category: {event.get('category', 'diplomatic')}

Write JSON (no markdown fences):
{{
  "title": "...",
  "lede": "...",
  "sections": {{
    "context": "prose with [[slug|label]] links...",
    "threads": "prose with [[slug|label]] links...",
    "signal": "prose with [[slug|label]] links..."
  }},
  "links": [
    {{"slug": "...", "label": "...", "direction": "backward|sideways|forward", "preview": "..."}}
  ]
}}

Sections: CONTEXT (why now), CONNECTED THREADS (parallel stories), SIGNAL FORWARD (what to watch).
Embed 4-8 [[slug|label]] links. Use only facts from official GoI sources."""

        msg = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=2000,
            messages=[{"role": "user", "content": prompt}],
        )
        raw = re.sub(r"^```(?:json)?\s*|\s*```$", "", msg.content[0].text.strip())
        gen = json.loads(raw)

        year = event["date"][:4]
        title_slug = re.sub(r"[^a-z0-9\s-]", "", gen.get("title", event["title"]).lower())
        title_slug = re.sub(r"\s+", "-", title_slug.strip())[:55].rstrip("-")
        slug = f"india-{country_code}-{title_slug}-{year}"

        return {
            "slug": slug,
            "countryCode": country_code,
            "date": event["date"],
            "title": gen.get("title", event["title"]),
            "lede": gen.get("lede", ""),
            "category": event.get("category", "diplomatic"),
            "significance": event.get("significance", "medium"),
            "sections": gen.get("sections", {"context": "", "threads": "", "signal": ""}),
            "links": gen.get("links", []),
            "sources": [{"label": event.get("source_label", "MEA"), "url": event.get("url", "")}],
            "generated": True,
            "sourceEventId": event.get("id", ""),
        }
    except Exception as e:
        log.error(f"Article gen failed: {e}")
        return None


# ─── Main ─────────────────────────────────────────────────────────────────────

def run():
    log.info("=" * 60)
    log.info(f"BharatIntel daily pipeline — {datetime.now().isoformat()}")
    log.info("=" * 60)

    since = datetime.now() - timedelta(days=2)

    log.info("Scraping MEA…")
    raw = scrape_mea(since)
    log.info("Scraping PIB…")
    raw += scrape_pib(since)
    log.info(f"Total raw items: {len(raw)}")

    if not raw:
        log.info("Nothing to process.")
        return

    total_articles = 0
    for item in raw:
        if len(item["snippet"]) < 100:
            try:
                resp = requests.get(item["url"], headers=HEADERS, timeout=15)
                soup = BeautifulSoup(resp.text, "html.parser")
                paras = [p.get_text(strip=True) for p in soup.find_all("p") if len(p.get_text(strip=True)) > 80]
                item["snippet"] = " ".join(paras[:3])[:600] or item["title"]
            except Exception:
                pass

        cl = classify(item["title"], item["snippet"])
        country_code = cl.get("country_code")

        if not country_code or country_code not in set(COUNTRY_ALIASES.values()):
            continue

        item["category"] = cl.get("category", "diplomatic")
        item["significance"] = cl.get("significance", "medium")
        item["description"] = cl.get("description", item["snippet"][:300])

        # Generate article
        log.info(f"Generating article: [{country_code}] {item['title'][:55]}…")
        article = generate_article_from_event(item, country_code)
        if article:
            out_path = ARTICLES_DIR / f"{article['slug']}.json"
            if not out_path.exists():
                with open(out_path, "w", encoding="utf-8") as f:
                    json.dump(article, f, indent=2, ensure_ascii=False)
                log.info(f"  ✓ {article['slug']}")
                total_articles += 1

        time.sleep(1.2)

    log.info(f"\nDone. {total_articles} new articles published.")
    log.info("=" * 60)


if __name__ == "__main__":
    run()
