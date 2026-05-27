import { loadLatestArticles } from "@/lib/articles";
import { COUNTRIES_BY_CODE } from "@/lib/countries";

const SITE_URL = "https://bharat-intel-seven.vercel.app";

export async function GET() {
  const articles = loadLatestArticles(40);

  const items = articles
    .map((article) => {
      const country = COUNTRIES_BY_CODE[article.countryCode];
      const pubDate = new Date(article.date).toUTCString();
      const url = `${SITE_URL}/article/${article.slug}`;

      return `
    <item>
      <title><![CDATA[${article.title}]]></title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${pubDate}</pubDate>
      <description><![CDATA[${article.lede}]]></description>
      <category>${article.category}</category>
      ${country ? `<author>${country.flag} ${country.name}</author>` : ""}
    </item>`;
    })
    .join("");

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>BharatIntel — India's Foreign Policy Intelligence</title>
    <link>${SITE_URL}</link>
    <description>Every bilateral relationship. Every defence deal, economic agreement, and diplomatic rupture — across 25 countries, updated daily from official Government of India sources.</description>
    <language>en-in</language>
    <atom:link href="${SITE_URL}/api/rss" rel="self" type="application/rss+xml"/>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${items}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
