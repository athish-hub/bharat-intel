// ─── Enumerations ────────────────────────────────────────────────────────────

export type EventCategory =
  | "defence"
  | "economic"
  | "cultural"
  | "mou"
  | "diplomatic"
  | "multilateral";

export type RelationshipStatus =
  | "strategic-partner"
  | "partner"
  | "neighbour"
  | "adversary"
  | "complex";

export type ArticleSection = "context" | "threads" | "signal";

/** Link direction tells readers *when* the linked article sits relative to this one */
export type LinkDirection =
  | "backward"   // historical — what happened before; rendered amber
  | "sideways"   // concurrent — parallel story in another country; rendered cyan
  | "forward";   // predictive — what comes next; rendered emerald/green

// ─── Article Link ─────────────────────────────────────────────────────────────

export interface ArticleLink {
  slug: string;
  label: string;
  direction: LinkDirection;
  /** Optional one-sentence tooltip shown on hover */
  preview?: string;
}

// ─── Full Article ─────────────────────────────────────────────────────────────

export interface Article {
  /** URL-safe unique identifier, e.g. "india-netherlands-strategic-partnership-2025" */
  slug: string;

  /** ISO alpha-2 country code this article is primarily about */
  countryCode: string;

  /** Publication date, ISO 8601 string */
  date: string;

  /** Headline */
  title: string;

  /** One-sentence summary shown on cards and in <meta description> */
  lede: string;

  /** Category label */
  category: EventCategory;

  /** Editorial weight */
  significance: "high" | "medium" | "low";

  /**
   * The three body sections.
   * Each section is a string of plain text / inline HTML.
   * ArticleLink objects are embedded as JSON inside <a> tags by the renderer.
   * During generation we store them as structured arrays here.
   */
  sections: {
    /** CONTEXT — why this matters right now */
    context: string;
    /** CONNECTED THREADS — parallel stories, the wider web */
    threads: string;
    /** SIGNAL FORWARD — what to watch */
    signal: string;
  };

  /** Outbound links embedded in the article body */
  links: ArticleLink[];

  /** Official GoI source URLs */
  sources: Array<{
    label: string;
    url: string;
  }>;

  /** Auto-generated — set to true once LLM has written full prose */
  generated: boolean;

  /** Scraper event ID this was generated from, if applicable */
  sourceEventId?: string;
}

// ─── Country ──────────────────────────────────────────────────────────────────

export interface CountryMeta {
  code: string;         // ISO alpha-2
  numericCode: string;  // ISO numeric (for TopoJSON, if ever needed)
  name: string;
  flag: string;         // emoji
  status: RelationshipStatus;
  statusLabel: string;
  summary: string;      // One paragraph for country landing page
  region: string;
}

// ─── Category & Status metadata ──────────────────────────────────────────────

export const CATEGORY_META: Record<
  EventCategory,
  { label: string; color: string; bg: string; dot: string }
> = {
  defence:      { label: "Defence",      color: "text-red-700",    bg: "bg-red-50",    dot: "bg-red-500"    },
  economic:     { label: "Economic",     color: "text-emerald-700",bg: "bg-emerald-50",dot: "bg-emerald-500"},
  cultural:     { label: "Cultural",     color: "text-violet-700", bg: "bg-violet-50", dot: "bg-violet-500" },
  mou:          { label: "MOU",          color: "text-blue-700",   bg: "bg-blue-50",   dot: "bg-blue-500"   },
  diplomatic:   { label: "Diplomatic",   color: "text-slate-700",  bg: "bg-slate-100", dot: "bg-slate-500"  },
  multilateral: { label: "Multilateral", color: "text-amber-700",  bg: "bg-amber-50",  dot: "bg-amber-500"  },
};

export const STATUS_META: Record<
  RelationshipStatus,
  { label: string; dot: string; badge: string }
> = {
  "strategic-partner": { label: "Strategic Partner", dot: "bg-emerald-500", badge: "bg-emerald-100 text-emerald-800" },
  "partner":           { label: "Partner",           dot: "bg-blue-500",    badge: "bg-blue-100 text-blue-800"       },
  "neighbour":         { label: "Neighbour",         dot: "bg-yellow-500",  badge: "bg-yellow-100 text-yellow-800"   },
  "adversary":         { label: "Adversary",         dot: "bg-red-500",     badge: "bg-red-100 text-red-800"         },
  "complex":           { label: "Complex",           dot: "bg-orange-500",  badge: "bg-orange-100 text-orange-800"   },
};

export const LINK_META: Record<
  LinkDirection,
  { label: string; color: string; bg: string; border: string; icon: string }
> = {
  backward: {
    label: "Historical context",
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-300",
    icon: "↩",
  },
  sideways: {
    label: "Related story",
    color: "text-cyan-700",
    bg: "bg-cyan-50",
    border: "border-cyan-300",
    icon: "↔",
  },
  forward: {
    label: "What to watch",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-300",
    icon: "↪",
  },
};
