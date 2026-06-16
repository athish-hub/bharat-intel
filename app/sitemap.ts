import { MetadataRoute } from "next";
import { loadAllArticles } from "@/lib/articles";
import { COUNTRIES } from "@/lib/countries";

const BASE_URL = "https://bharat-intel-seven.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const articles = loadAllArticles({ generated: true });

  const articleUrls: MetadataRoute.Sitemap = articles.map((a) => ({
    url: `${BASE_URL}/article/${a.slug}`,
    lastModified: new Date(a.date),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const countryUrls: MetadataRoute.Sitemap = COUNTRIES.map((c) => ({
    url: `${BASE_URL}/country/${c.code}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/search`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.5,
    },
    ...countryUrls,
    ...articleUrls,
  ];
}
