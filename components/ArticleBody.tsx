import Link from "next/link";
import { clsx } from "clsx";
import type { Article, ArticleLink, LinkDirection } from "@/lib/types";
import { LINK_META } from "@/lib/types";

// ─── Inline link chip ─────────────────────────────────────────────────────────

function LinkChip({ link, exists }: { link: ArticleLink; exists: boolean }) {
  const meta = LINK_META[link.direction];

  if (!exists) {
    return (
      <span
        title="This article is coming soon"
        className={clsx(
          "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium border cursor-default opacity-50",
          meta.color,
          meta.bg,
          meta.border
        )}
      >
        <span aria-hidden>{meta.icon}</span>
        {link.label}
        <span className="text-xs opacity-60 ml-0.5">·soon</span>
      </span>
    );
  }

  return (
    <Link
      href={`/article/${link.slug}`}
      title={link.preview}
      className={clsx(
        "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium no-underline border",
        "transition-all hover:shadow-sm",
        meta.color,
        meta.bg,
        meta.border
      )}
    >
      <span aria-hidden>{meta.icon}</span>
      {link.label}
    </Link>
  );
}

// ─── Section heading ──────────────────────────────────────────────────────────

function SectionLabel({ id, label, description }: { id: string; label: string; description: string }) {
  return (
    <div id={id} className="flex items-center gap-3 mb-4 pt-8 first:pt-0">
      <div className="flex-shrink-0 w-1 h-8 bg-orange-400 rounded-full"></div>
      <div>
        <div className="text-xs font-bold uppercase tracking-widest text-orange-600">{label}</div>
        <div className="text-xs text-slate-400">{description}</div>
      </div>
    </div>
  );
}

// ─── Link legend sidebar card ─────────────────────────────────────────────────

function LinkLegend({ links, existingSlugs }: { links: ArticleLink[]; existingSlugs: Set<string> }) {
  if (!links.length) return null;

  const grouped: Partial<Record<LinkDirection, ArticleLink[]>> = {};
  for (const link of links) {
    if (!grouped[link.direction]) grouped[link.direction] = [];
    grouped[link.direction]!.push(link);
  }

  const order: LinkDirection[] = ["backward", "sideways", "forward"];

  return (
    <aside className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-4 text-sm">
      <div className="text-xs font-bold uppercase tracking-widest text-slate-500">
        Connected reading
      </div>
      {order.map((dir) => {
        const items = grouped[dir];
        if (!items?.length) return null;
        const meta = LINK_META[dir];
        return (
          <div key={dir}>
            <div className={clsx("text-xs font-semibold mb-1.5", meta.color)}>
              {meta.icon} {meta.label}
            </div>
            <ul className="space-y-1">
              {items.map((link) => {
                const exists = existingSlugs.has(link.slug);
                if (!exists) {
                  return (
                    <li key={link.slug}>
                      <span
                        title="Coming soon"
                        className={clsx(
                          "block px-2 py-1.5 rounded border text-xs leading-snug opacity-40 cursor-default",
                          meta.color, meta.bg, meta.border
                        )}
                      >
                        {link.label} <span className="opacity-60">· soon</span>
                      </span>
                    </li>
                  );
                }
                return (
                  <li key={link.slug}>
                    <Link
                      href={`/article/${link.slug}`}
                      className={clsx(
                        "block px-2 py-1.5 rounded border text-xs leading-snug hover:shadow-sm transition-all",
                        meta.color, meta.bg, meta.border
                      )}
                      title={link.preview}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </aside>
  );
}

// ─── Prose block — renders text with embedded link chips ──────────────────────

function ProseBlock({ text, links, existingSlugs }: { text: string; links: ArticleLink[]; existingSlugs: Set<string> }) {
  const linkMap = new Map(links.map((l) => [l.slug, l]));
  const parts = text.split(/(\[\[[^\]]+\]\])/g);

  return (
    <p className="leading-relaxed text-slate-700 mb-4">
      {parts.map((part, i) => {
        const match = part.match(/^\[\[([^\]|]+)(?:\|([^\]]+))?\]\]$/);
        if (match) {
          const slug = match[1].trim();
          const overrideLabel = match[2]?.trim();
          const link = linkMap.get(slug);
          if (link) {
            return (
              <LinkChip
                key={i}
                link={overrideLabel ? { ...link, label: overrideLabel } : link}
                exists={existingSlugs.has(slug)}
              />
            );
          }
          return <span key={i}>{overrideLabel || slug}</span>;
        }
        return <span key={i}>{part}</span>;
      })}
    </p>
  );
}

// ─── Main ArticleBody component ───────────────────────────────────────────────

interface Props {
  article: Article;
  existingSlugs: Set<string>;
}

export default function ArticleBody({ article, existingSlugs }: Props) {
  const { sections, links, sources } = article;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8 items-start">
      {/* Body prose */}
      <div className="prose-area space-y-0">
        {/* CONTEXT */}
        <SectionLabel
          id="context"
          label="Context"
          description="Why this matters right now"
        />
        <div className="text-base">
          {sections.context.split("\n\n").map((para, i) => (
            <ProseBlock key={i} text={para} links={links} existingSlugs={existingSlugs} />
          ))}
        </div>

        {/* CONNECTED THREADS */}
        <SectionLabel
          id="threads"
          label="Connected Threads"
          description="The wider web this story sits inside"
        />
        <div className="text-base">
          {sections.threads.split("\n\n").map((para, i) => (
            <ProseBlock key={i} text={para} links={links} existingSlugs={existingSlugs} />
          ))}
        </div>

        {/* SIGNAL FORWARD */}
        <SectionLabel
          id="signal"
          label="Signal Forward"
          description="What to watch in the next 6–18 months"
        />
        <div className="text-base">
          {sections.signal.split("\n\n").map((para, i) => (
            <ProseBlock key={i} text={para} links={links} existingSlugs={existingSlugs} />
          ))}
        </div>

        {/* Sources */}
        {sources.length > 0 && (
          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
              Official sources
            </div>
            <ul className="space-y-1">
              {sources.map((s, i) => (
                <li key={i}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-slate-500 hover:text-orange-600 transition-colors"
                  >
                    ↗ {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Sidebar */}
      <div className="lg:sticky lg:top-20 space-y-4">
        <LinkLegend links={links} existingSlugs={existingSlugs} />

        {/* Section jump */}
        <nav className="rounded-xl border border-slate-200 bg-white p-4 text-sm hidden lg:block">
          <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
            Jump to
          </div>
          <ul className="space-y-1">
            {[
              { id: "context", label: "Context" },
              { id: "threads", label: "Connected Threads" },
              { id: "signal", label: "Signal Forward" },
            ].map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="block px-2 py-1 rounded text-slate-500 hover:text-orange-600 hover:bg-orange-50 transition-colors text-sm"
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}
