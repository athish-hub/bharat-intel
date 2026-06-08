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
    "venezuela": "ve", "bolivarian republic of venezuela": "ve",
    "myanmar": "mm", "burma": "mm", "republic of the union of myanmar": "mm",
    "cyprus": "cy", "republic of cyprus": "cy",
    "ethiopia": "et", "kenya": "ke", "nigeria": "ng",
    "mexico": "mx", "argentina": "ar",
    "vietnam": "vn", "thailand": "th", "malaysia": "my",
    "turkey": "tr", "turkiye": "tr",
    "egypt": "eg", "qatar": "qa", "kuwait": "kw", "oman": "om",
}

COUNTRY_NAMES = {
    "us": "United States", "cn": "China", "pk": "Pakistan", "ru": "Russia",
    "gb": "United Kingdom", "fr": "France", "de": "Germany", "jp": "Japan",
    "au": "Australia", "ae": "UAE", "sa": "Saudi Arabia", "il": "Israel",
    "bd": "Bangladesh", "lk": "Sri Lanka", "np": "Nepal", "bt": "Bhutan",
    "ca": "Canada", "za": "South Africa", "br": "Brazil", "sg": "Singapore",
    "kr": "South Korea", "it": "Italy", "nl": "Netherlands", "ir": "Iran",
    "id": "Indonesia", "ve": "Venezuela", "mm": "Myanmar", "cy": "Cyprus",
    "et": "Ethiopia", "ke": "Kenya", "ng": "Nigeria", "mx": "Mexico",
    "ar": "Argentina", "vn": "Vietnam", "th": "Thailand", "my": "Malaysia",
    "tr": "Turkey", "eg": "Egypt", "qa": "Qatar", "kw": "Kuwait", "om": "Oman",
}

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; BharatIntel/1.0)",
    "Accept": "text/html,application/xhtml+xml",
}


# ─── Scraping ─────────────────────────────────────────────────────────────────

def scrape_mea(since: datetime) -> list[dict]:
    items = []
    mea_sections = [
        ("https://www.mea.gov.in/press-releases?51/Press_Releases", "MEA Press Release"),
        ("https://www.mea.gov.in/media-briefings?49/Media_Briefings", "MEA Media Briefing"),
        ("https://www.mea.gov.in/speeches-statements?50/Speeches_Statements", "MEA Speech/Statement"),
        ("https://www.mea.gov.in/bilateral-documents?53/Bilateral_Documents", "MEA Bilateral Document"),
    ]
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        log.error("Playwright not installed. Run: pip3 install playwright && python3 -m playwright install chromium")
        return items

    skip_terms = {"home", "about us", "contact", "sitemap", "login", "search",
                  "accessibility", "skip to", "screen reader", "font resize",
                  "press releases", "speeches", "media briefings", "bilateral",
                  "all media", "response to", "travel advisory", "interview",
                  "lok sabha", "rajya sabha", "media advisory", "sitemap"}

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(extra_http_headers=HEADERS)
        pw_page = context.new_page()

        for page_url, source_label in mea_sections:
            try:
                log.info(f"Scraping (JS): {page_url}")
                pw_page.goto(page_url, wait_until="networkidle", timeout=30000)
                pw_page.wait_for_timeout(2000)

                # Try to expand to 50 results per page
                try:
                    pw_page.click("text=50", timeout=3000)
                    pw_page.wait_for_timeout(2000)
                except Exception:
                    pass

                seen_urls = set()
                page_num = 0
                max_pages = 5  # cap at 5 pages (~250 articles) per section

                while page_num < max_pages:
                    links = pw_page.query_selector_all("a[href*='dtl']")
                    found_old = False

                    for a in links:
                        title = (a.inner_text() or "").strip()
                        href = a.get_attribute("href") or ""
                        if not title or len(title) < 15:
                            continue
                        if any(skip in title.lower() for skip in skip_terms):
                            continue
                        url = href if href.startswith("http") else f"https://www.mea.gov.in{href}"
                        if url in seen_urls:
                            continue
                        seen_urls.add(url)

                        # Extract date from article page title/meta if possible,
                        # otherwise use today as fallback
                        items.append({
                            "title": title, "url": url,
                            "date": datetime.now().strftime("%Y-%m-%d"),
                            "snippet": title, "source_label": source_label,
                        })

                    # Try to go to next page
                    try:
                        next_btn = pw_page.query_selector("a[aria-label='Next'], .next-page, a:has-text('Next')")
                        if next_btn:
                            next_btn.click()
                            pw_page.wait_for_timeout(2000)
                            page_num += 1
                        else:
                            break
                    except Exception:
                        break

            except Exception as e:
                log.error(f"MEA Playwright scrape failed ({page_url}): {e}")

        context.close()
        browser.close()

    log.info(f"MEA raw items: {len(items)}")
    return items


def scrape_pib(since: datetime) -> list[dict]:
    items = []
    # Use MEA-specific PIB ministry filter (mnid=21 = Ministry of External Affairs)
    pib_urls = [
        "https://pib.gov.in/allRel.aspx?mnid=21",  # External Affairs ministry only
        "https://pib.gov.in/allRel.aspx?mnid=18",  # Defence ministry
        "https://pib.gov.in/allRel.aspx",           # All (fallback)
    ]
    keywords = [
        "external affairs", "foreign", "bilateral", "india-", "defence",
        "jaishankar", "prime minister", "summit", "agreement", "mou",
        "treaty", "envoy", "ambassador", "diplomatic", "minister",
        "visit", "signed", "cooperation", "partnership",
    ]
    seen = set()
    for pib_url in pib_urls:
        try:
            resp = requests.get(pib_url, headers=HEADERS, timeout=20)
            resp.raise_for_status()
            soup = BeautifulSoup(resp.text, "html.parser")
            for a in soup.select("a[href*='PressReleasePage']")[:150]:
                title = a.get_text(strip=True)
                href = a.get("href", "")
                if not title or len(title) < 10 or title in seen:
                    continue
                # For MEA/Defence specific pages, include everything; for all-ministry, filter
                if "mnid=21" in pib_url or "mnid=18" in pib_url:
                    passes = True
                else:
                    passes = any(kw in title.lower() for kw in keywords)
                if not passes:
                    continue
                seen.add(title)
                url = href if href.startswith("http") else f"https://pib.gov.in{href}"
                items.append({
                    "title": title, "url": url,
                    "date": datetime.now().strftime("%Y-%m-%d"),
                    "snippet": title, "source_label": "PIB Notification",
                })
        except Exception as e:
            log.error(f"PIB scrape failed ({pib_url}): {e}")
    log.info(f"PIB raw items: {len(items)}")
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
        source_text = event.get("snippet", "")
        prompt = f"""You are an intelligence analyst writing for BharatIntel, India's foreign policy intelligence platform.

Write a high-quality intelligence article based STRICTLY on the official source text below. Do not invent facts not present in the source. Write ENTIRELY in English.

--- SOURCE ---
Country: {country_name} ({country_code})
Date: {event['date']}
Category: {event.get('category', 'diplomatic')}
Official source text:
{source_text[:2500]}
--- END SOURCE ---

Write JSON (no markdown fences). ALL fields in English:
{{
  "title": "Sharp, specific title — name the countries, the deal, the significance (10-15 words)",
  "lede": "One punchy sentence: what happened, who was involved, why it matters",
  "sections": {{
    "context": "2-3 paragraphs: what is the backdrop to this event? Why now? What pressure or opportunity made this happen? Ground it in the source text. Use [[slug|label]] inline links.",
    "threads": "2-3 paragraphs: what parallel stories does this connect to? Other bilateral tracks, multilateral frameworks, domestic politics? Use [[slug|label]] inline links.",
    "signal": "2-3 paragraphs: what should analysts watch in the next 6-18 months? What is the next decision point? Use [[slug|label]] inline links."
  }},
  "links": [
    {{"slug": "kebab-case-slug", "label": "Short English label", "direction": "backward|sideways|forward", "preview": "One sentence describing that article"}}
  ]
}}

Rules:
- Every claim must be grounded in the source text
- 4-8 [[slug|label]] links across all sections
- backward = historical context, sideways = related current story, forward = future signal
- No invented facts, no hallucinated statistics
- Every word in English"""

        msg = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=3000,
            messages=[{"role": "user", "content": prompt}],
        )
        raw = re.sub(r"^```(?:json)?\s*|\s*```$", "", msg.content[0].text.strip())
        gen = json.loads(raw)

        year = event["date"][:4]
        raw_title = gen.get("title", event["title"])
        title_slug = re.sub(r"[^a-z0-9\s-]", "", raw_title.lower())
        title_slug = re.sub(r"\s+", "-", title_slug.strip())[:55].rstrip("-")
        # If slug is empty (non-ASCII title), use category + country + timestamp
        if not title_slug or len(title_slug) < 5:
            title_slug = f"{event.get('category', 'diplomatic')}-{event['date']}"
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

def fetch_article_text(url: str) -> str:
    """Fetch full article body from a JS-rendered MEA/PIB page using Playwright."""
    try:
        from playwright.sync_api import sync_playwright
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page(extra_http_headers=HEADERS)
            page.goto(url, wait_until="networkidle", timeout=30000)
            page.wait_for_timeout(2000)
            # MEA article body is usually in .article-content, .content, or <p> tags
            text = ""
            for selector in [".article-content", ".content-area", "#content", "article", "main"]:
                el = page.query_selector(selector)
                if el:
                    text = el.inner_text()
                    break
            if not text:
                # Fallback: grab all paragraph text
                paras = page.query_selector_all("p")
                text = " ".join(
                    p.inner_text().strip() for p in paras
                    if len(p.inner_text().strip()) > 60
                )
            browser.close()
            return text[:3000].strip()
    except Exception as e:
        log.warning(f"Failed to fetch article text from {url}: {e}")
        return ""


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
        # Fetch full article text — critical for quality
        if len(item.get("snippet", "")) < 200 and item.get("url"):
            log.info(f"  Fetching full text: {item['url'][:70]}…")
            full_text = fetch_article_text(item["url"])
            if full_text:
                item["snippet"] = full_text
                log.info(f"  Got {len(full_text)} chars")

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
