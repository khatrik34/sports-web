import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Play } from "lucide-react";
import {
  ArticleCard,
  MatchCard,
  Points,
  SectionHeading,
  VideoCard,
} from "@/components/cards";
import {
  matchService,
  newsService,
  playerService,
  tournamentService,
  videoService,
  teamService,
  matchDetailsService,
  searchAll,
  rankingsService,
} from "@/services";
import { ServiceError } from "@/lib/api";
import {
  externalUrl,
  mediaUrl,
  renderArticleBody,
  safePath,
} from "@/lib/content";
import { formatDate } from "@/lib/utils";
import { site } from "@/config/site";
import type { Innings, NewsArticle, PaginatedResponse } from "@/types";
type Props = {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};
const val = (v: string | string[] | undefined) =>
  typeof v === "string" ? v : "";
const titles: Record<string, string> = {
  cricket: "Cricket",
  "cricket/live-scores": "Live Cricket Scores",
  "cricket/fixtures": "Fixtures & Results",
  "cricket/series": "Series & Tournaments",
  news: "Latest Sports News",
  "news/latest": "Latest News",
  "news/trending": "Trending Stories",
  "news/featured": "Featured Stories",
  "news/categories": "News Categories",
  videos: "Cricket Videos",
  teams: "Cricket Teams",
  rankings: "Cricket Rankings",
  search: "Search",
  about: "About The Boundary",
  contact: "Contact",
};
const pageNumber = (s: string) =>
  /^\d+$/.test(s) ? Math.min(Number(s), 100000) : 0;
function absolute(url: string) {
  try {
    return new URL(url, site.url).toString();
  } catch {
    return site.url;
  }
}
async function identify(slug: string[]) {
  const path = slug.join("/");
  if (titles[path])
    return {
      title: titles[path],
      description: `${titles[path]} from The Boundary. Scores, stories and moments for the love of the game.`,
    };
  if (slug[0] === "cricket" && slug[1] === "news" && slug.length === 3)
    return {
      title: "Cricket News",
      description: "The latest cricket stories and analysis.",
    };
  if (slug[0] === "news" && slug.length === 2) {
    const a = await newsService.get(slug[1]);
    return a
      ? {
          title: a.seo?.metaTitle || a.title,
          description: a.seo?.metaDescription || a.excerpt,
          image: a.seo?.ogImageUrl || a.image,
          canonical: a.seo?.canonicalUrl || a.path,
          robots: a.seo?.robots,
          ogTitle: a.seo?.ogTitle,
          ogDescription: a.seo?.ogDescription,
        }
      : null;
  }
  if (slug[0] === "cricket" && slug[1] === "match" && slug.length === 3) {
    const m = await matchService.get(slug[2]);
    return m
      ? {
          title: `${m.team1.name} vs ${m.team2.name} | Match Centre`,
          description: `${m.tournament} match centre, scorecard and details.`,
        }
      : null;
  }
  if (slug[0] === "cricket" && slug[1] === "series" && slug.length === 3) {
    const t = await tournamentService.get(slug[2]);
    return t ? { title: t.name, description: t.description } : null;
  }
  if (slug[0] === "teams" && slug.length === 2) {
    const t = await teamService.get(slug[1]);
    return t
      ? { title: `${t.name} Cricket Team`, description: t.description }
      : null;
  }
  if (slug[0] === "players" && slug.length === 2) {
    const p = await playerService.get(slug[1]);
    return p ? { title: p.name, description: p.description } : null;
  }
  if (slug[0] === "videos" && slug.length === 2) {
    const v = await videoService.get(slug[1]);
    return v
      ? { title: v.title, description: v.description, image: v.image }
      : null;
  }
  return null;
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const info = await identify(slug);
  if (!info) return { title: "Not found" };
  const canonical = info.canonical || `/${slug.join("/")}`;
  return {
    title: info.title,
    description: info.description,
    alternates: { canonical },
    robots:
      slug[0] === "search"
        ? { index: false, follow: true }
        : info.robots || undefined,
    openGraph: {
      title: info.ogTitle || info.title,
      description: info.ogDescription || info.description,
      url: canonical,
      images: info.image ? [absolute(info.image)] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: info.title,
      description: info.description,
      images: info.image ? [absolute(info.image)] : undefined,
    },
  };
}
function Crumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <Link href="/">Home</Link>
      {items.map((x, i) => (
        <span key={i}>
          {" "}
          / &nbsp; {x.href ? <Link href={x.href}>{x.label}</Link> : x.label}
        </span>
      ))}
    </nav>
  );
}
function JsonLd({ value }: { value: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(value).replace(/</g, "\\u003c"),
      }}
    />
  );
}
function PageHeader({
  kicker = "THE BOUNDARY",
  title,
  description,
}: {
  kicker?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="page-header">
      <span className="eyebrow">{kicker}</span>
      <h1>
        {title}
        <span className="accent">.</span>
      </h1>
      {description && <p>{description}</p>}
    </div>
  );
}
function Trending({ articles }: { articles: NewsArticle[] }) {
  return (
    <aside className="sidebar">
      <span className="eyebrow">MORE FROM THE BOUNDARY</span>
      <h2>
        Latest stories<span className="accent">.</span>
      </h2>
      {articles.map((a, i) => (
        <Link key={a.slug} href={safePath(a.path, `/news/${a.slug}`)}>
          <span className="accent">0{i + 1} &nbsp; </span>
          {a.title}
        </Link>
      ))}
    </aside>
  );
}
function Filters({
  base,
  items,
  current,
}: {
  base: string;
  items: { label: string; value: string }[];
  current: string;
}) {
  return (
    <nav className="filter-nav" aria-label="Filter content">
      {items.map((i) => (
        <Link
          className={current === i.value ? "selected" : ""}
          key={i.value}
          href={`${base}${i.value === "all" && base !== "/cricket/live-scores" && base !== "/cricket/fixtures" ? "" : `?filter=${encodeURIComponent(i.value)}`}`}
        >
          {i.label}
        </Link>
      ))}
    </nav>
  );
}
function Pagination<T>({
  data,
  base,
  params,
}: {
  data: PaginatedResponse<T>;
  base: string;
  params: Record<string, string>;
}) {
  function url(p: number) {
    const q = new URLSearchParams({ ...params, page: String(p) });
    for (const [k, v] of q.entries()) if (!v) q.delete(k);
    return `${base}?${q}`;
  }
  return data.totalPages > 1 ? (
    <nav className="filter-nav" aria-label="Pagination">
      {!data.first && <Link href={url(data.page - 1)}>← Previous</Link>}
      <span>
        Page {data.page + 1} of {data.totalPages}
      </span>
      {!data.last && <Link href={url(data.page + 1)}>Next →</Link>}
    </nav>
  ) : null;
}
function ScoreTables({ innings }: { innings: Innings[] }) {
  return innings.length ? (
    <>
      {innings.map((i) => (
        <section className="section-block" key={i.inningsNumber}>
          <h2>
            {i.battingTeam.name} · {i.runs}/{i.wickets} ({i.overs}){" "}
            {i.declared ? "declared" : ""}
          </h2>
          <div className="data-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Batter</th>
                  <th>Dismissal</th>
                  <th>R</th>
                  <th>B</th>
                  <th>4s</th>
                  <th>6s</th>
                </tr>
              </thead>
              <tbody>
                {i.batting.map((b, n) => (
                  <tr key={`${b.batter}-${n}`}>
                    <td>{b.batter}</td>
                    <td>{b.dismissal || (b.notOut ? "not out" : "—")}</td>
                    <td>{b.runs}</td>
                    <td>{b.balls}</td>
                    <td>{b.fours}</td>
                    <td>{b.sixes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="data-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Bowler</th>
                  <th>Overs</th>
                  <th>Maidens</th>
                  <th>Runs</th>
                  <th>Wickets</th>
                  <th>Economy</th>
                </tr>
              </thead>
              <tbody>
                {i.bowling.map((b, n) => (
                  <tr key={`${b.bowler}-${n}`}>
                    <td>{b.bowler}</td>
                    <td>{b.overs}</td>
                    <td>{b.maidens}</td>
                    <td>{b.runsConceded}</td>
                    <td>{b.wickets}</td>
                    <td>{b.economy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </>
  ) : (
    <div className="empty">No scorecard available yet.</div>
  );
}
async function MatchPage({
  slug,
  tab,
  page,
}: {
  slug: string;
  tab: string;
  page: number;
}) {
  const m = await matchService.get(slug);
  if (!m) notFound();
  const tabs = [
    "Summary",
    "Live Commentary",
    "Scorecard",
    "Full Scorecard",
    "Playing XI",
    "Match Details",
    "Points Table",
  ];
  const selected =
    tabs.find((t) => t.toLowerCase().replaceAll(" ", "-") === tab) || "Summary";
  let body: React.ReactNode;
  if (selected === "Live Commentary") {
    const c = await matchDetailsService.commentary(slug, page);
    body = (
      <div className="content-box">
        <h2>Commentary</h2>
        {c.content.length ? (
          c.content.map((x, i) => (
            <div className="commentary-item" key={`${x.createdAt}-${i}`}>
              <strong>
                {x.over} · {x.kind}
              </strong>
              {x.text}
            </div>
          ))
        ) : (
          <p>No commentary available yet.</p>
        )}
        <Pagination
          data={c}
          base={`/cricket/match/${slug}`}
          params={{ tab: "live-commentary" }}
        />
      </div>
    );
  } else if (selected === "Scorecard" || selected === "Full Scorecard") {
    body = <ScoreTables innings={await matchDetailsService.scorecard(slug)} />;
  } else if (selected === "Points Table") {
    body = m.tournamentSlug ? (
      <Points rows={await tournamentService.points(m.tournamentSlug)} />
    ) : (
      <div className="empty">No tournament standings available.</div>
    );
  } else if (selected === "Playing XI") {
    body = (
      <div className="empty">
        Playing XI is not available from the current API.
      </div>
    );
  } else {
    body = (
      <div className="content-box">
        <h2>{selected === "Summary" ? "Match summary" : "Match details"}</h2>
        <p>
          <b>Series:</b> {m.tournament || "—"}
        </p>
        <p>
          <b>Venue:</b> {m.venue || "—"}
        </p>
        <p>
          <b>Format:</b> {m.format || "—"}
        </p>
        <p>
          <b>Scheduled:</b> {formatDate(m.date)}
        </p>
        <p>{m.note}</p>
      </div>
    );
  }
  return (
    <>
      <Crumbs
        items={[
          { label: "Live Scores", href: "/cricket/live-scores" },
          { label: `${m.team1.name} vs ${m.team2.name}` },
        ]}
      />
      <PageHeader
        kicker={`${m.format} / ${m.tournament.toUpperCase()}`}
        title={`${m.team1.name} vs ${m.team2.name}`}
        description={`${m.venue} · ${formatDate(m.date)}`}
      />
      <div className="detail-score">
        <span className="eyebrow">
          {m.status === "live" ? "● LIVE" : m.state} &nbsp; / &nbsp; {m.format}
        </span>
        <div className="match-team">
          <span>
            {m.team1.flag} &nbsp;{m.team1.name}
          </span>
          <strong>{m.score1 || "—"}</strong>
        </div>
        <div className="match-team">
          <span>
            {m.team2.flag} &nbsp;{m.team2.name}
          </span>
          <strong>{m.score2 || "—"}</strong>
        </div>
        <div className="match-bottom">{m.note}</div>
      </div>
      <nav className="filter-nav" aria-label="Match centre tabs">
        {tabs.map((t) => (
          <Link
            key={t}
            className={selected === t ? "selected" : ""}
            href={`/cricket/match/${slug}?tab=${t.toLowerCase().replaceAll(" ", "-")}`}
          >
            {t}
          </Link>
        ))}
      </nav>
      {body}
      <JsonLd
        value={{
          "@context": "https://schema.org",
          "@type": "SportsEvent",
          name: `${m.team1.name} vs ${m.team2.name}`,
          startDate: m.date,
          location: { "@type": "Place", name: m.venue },
          competitor: [
            { "@type": "SportsTeam", name: m.team1.name },
            { "@type": "SportsTeam", name: m.team2.name },
          ],
          description: m.note,
        }}
      />
    </>
  );
}
export default async function DynamicPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const q = await searchParams;
  const path = slug.join("/");
  const info = await identify(slug);
  if (!info) notFound();
  let content: React.ReactNode;
  if (path === "cricket/live-scores" || path === "cricket/fixtures") {
    const filter =
      val(q.filter) || (path === "cricket/live-scores" ? "live" : "upcoming");
    const team = val(q.team),
      tournament = val(q.tournament),
      date = val(q.date),
      from = val(q.from),
      to = val(q.to);
    let data: Awaited<ReturnType<typeof matchService.list>> | undefined;
    let filterError = "";
    try {
      data = await matchService.list({
        filter,
        team,
        tournament,
        date,
        from,
        to,
        page: pageNumber(val(q.page)),
      });
    } catch (error) {
      if (
        error instanceof ServiceError &&
        error.status === 400 &&
        (error.code === "invalid_date" || error.code === "invalid_date_range")
      ) {
        filterError =
          "Please use valid dates. Choose a single date or an inclusive date range, and ensure the start is not after the end.";
      } else {
        throw error;
      }
    }
    content = (
      <>
        <Crumbs items={[{ label: info.title }]} />
        <PageHeader
          kicker="FOLLOW THE ACTION"
          title={info.title}
          description="Follow the action from around the cricket world."
        />
        <Filters
          base={`/${path}`}
          current={filter}
          items={[
            "all",
            "live",
            "upcoming",
            "recent",
            "international",
            "domestic",
            "league",
          ].map((x) => ({ label: x[0].toUpperCase() + x.slice(1), value: x }))}
        />
        <form className="filter-nav" action={`/${path}`}>
          <input type="hidden" name="filter" value={filter} />
          <label>
            Team slug <input name="team" defaultValue={team} />
          </label>
          <label>
            Tournament slug{" "}
            <input name="tournament" defaultValue={tournament} />
          </label>
          <label>
            Date <input type="date" name="date" defaultValue={date} />
          </label>
          <label>
            From (UTC) <input type="date" name="from" defaultValue={from} />
          </label>
          <label>
            To (UTC) <input type="date" name="to" defaultValue={to} />
          </label>
          <button>Apply filters</button>
        </form>
        {filterError && (
          <div className="empty" role="alert">
            {filterError}
          </div>
        )}
        <div className="listing-grid">
          {data?.content.map((m) => (
            <MatchCard key={m.slug} match={m} />
          ))}
        </div>
        {data && !data.content.length && (
          <div className="empty">No matches found for these filters.</div>
        )}
        {data && (
          <Pagination
            data={data}
            base={`/${path}`}
            params={{ filter, team, tournament, date, from, to }}
          />
        )}
        <div style={{ marginTop: 30 }}>
          <Link
            className="text-link"
            href={
              path === "cricket/fixtures"
                ? "/cricket/live-scores"
                : "/cricket/fixtures"
            }
          >
            {path === "cricket/fixtures"
              ? "VIEW LIVE SCORES"
              : "VIEW FIXTURES & RESULTS"}{" "}
            <ArrowRight size={15} />
          </Link>
        </div>
      </>
    );
  } else if (slug[0] === "cricket" && slug[1] === "match" && slug.length === 3)
    content = (
      <MatchPage
        slug={slug[2]}
        tab={val(q.tab)}
        page={pageNumber(val(q.page))}
      />
    );
  else if (path === "cricket/series") {
    const series = await tournamentService.list();
    content = (
      <>
        <Crumbs items={[{ label: info.title }]} />
        <PageHeader
          kicker="THE BIG STAGE"
          title="Series & tournaments"
          description="Follow the competitions, teams and stories that matter."
        />
        <div className="tournament-grid">
          {series.map((t, i) => (
            <Link
              href={`/cricket/series/${t.slug}`}
              className={`tournament-card tournament-${i % 3}`}
              key={t.slug}
            >
              <span className="tournament-number">SERIES / {t.dates}</span>
              <span className="tournament-symbol">✳</span>
              <div>
                <h3>{t.name}</h3>
                <span className="tournament-link">
                  EXPLORE SERIES <ArrowRight size={15} />
                </span>
              </div>
            </Link>
          ))}
        </div>
        {!series.length && (
          <div className="empty">No series available yet.</div>
        )}
      </>
    );
  } else if (
    slug[0] === "cricket" &&
    slug[1] === "series" &&
    slug.length === 3
  ) {
    const t = await tournamentService.get(slug[2]);
    if (!t) notFound();
    const tab = val(q.filter) || "overview";
    const tabs = [
      "Overview",
      "Matches",
      "Points Table",
      "Teams",
      "Squads",
      "Top Scorers",
      "Top Wickets",
      "News",
    ];
    let body: React.ReactNode;
    if (tab === "points table" || tab === "points-table")
      body = <Points rows={await tournamentService.points(t.slug)} />;
    else if (tab === "matches") {
      const matches = await matchService.list({ tournament: t.slug });
      body = (
        <div className="listing-grid">
          {matches.content.map((m) => (
            <MatchCard key={m.slug} match={m} />
          ))}
        </div>
      );
    } else if (tab === "teams" || tab === "squads") {
      const teams = (
        await Promise.all(t.teams.map((slug) => teamService.get(slug)))
      ).filter((team): team is NonNullable<typeof team> => !!team);
      body = (
        <div className="profile-links">
          {teams.map((team) => (
            <Link href={`/teams/${team.slug}`} key={team.slug}>
              {team.flag} {team.name}
            </Link>
          ))}
        </div>
      );
    } else if (tab === "news") {
      const articles = (await newsService.list()).content;
      body = (
        <div className="article-grid">
          {articles.map((a) => (
            <ArticleCard article={a} key={a.slug} />
          ))}
        </div>
      );
    } else if (tab === "top scorers" || tab === "top wickets")
      body = (
        <div className="empty">
          Statistics are not available from the current API.
        </div>
      );
    else
      body = (
        <div className="content-box">
          <h2>About the competition</h2>
          <p>{t.description}</p>
          <p>
            {t.dates} · {t.teams.length} teams
          </p>
        </div>
      );
    content = (
      <>
        <Crumbs
          items={[
            { label: "Series", href: "/cricket/series" },
            { label: t.name },
          ]}
        />
        <PageHeader
          kicker={t.dates}
          title={t.name}
          description={t.description}
        />
        <Filters
          base={`/cricket/series/${t.slug}`}
          current={tab}
          items={tabs.map((x) => ({ label: x, value: x.toLowerCase() }))}
        />
        {body}
      </>
    );
  } else if (path === "news/categories") {
    const categories = await newsService.categories();
    content = (
      <>
        <Crumbs
          items={[{ label: "News", href: "/news" }, { label: "Categories" }]}
        />
        <PageHeader title="News categories" />
        <div className="profile-links">
          {categories.map((c) => (
            <Link
              href={`/news?filter=${encodeURIComponent(c.slug)}`}
              key={c.slug}
            >
              {c.name}
            </Link>
          ))}
        </div>
        {!categories.length && (
          <div className="empty">No categories available.</div>
        )}
      </>
    );
  } else if (
    path === "news" ||
    path === "news/latest" ||
    path === "news/trending" ||
    path === "news/featured" ||
    (slug[0] === "cricket" && slug[1] === "news")
  ) {
    const filter = val(q.filter) || "all";
    const categories = await newsService.categories();
    const data =
      path === "news/latest" || path === "news/featured"
        ? null
        : await newsService.list({
            category: filter === "all" ? undefined : filter,
            page: pageNumber(val(q.page)),
          });
    const list =
      data?.content ?? (await newsService.latest(path === "news/featured", 12));
    content = (
      <>
        <Crumbs items={[{ label: info.title }]} />
        <PageHeader
          kicker="THE STORIES THAT MATTER"
          title={info.title}
          description="Perspectives, insight and stories from across the game."
        />
        <Filters
          base="/news"
          current={filter}
          items={[
            { label: "All", value: "all" },
            ...categories.map((c) => ({ label: c.name, value: c.slug })),
          ]}
        />
        {path === "news/trending" && (
          <p>
            Trending data is not currently available; showing latest stories.
          </p>
        )}
        <div className="page-grid">
          <div className="article-grid">
            {list.map((a) => (
              <ArticleCard article={a} key={a.slug} />
            ))}
          </div>
          <Trending articles={list.slice(0, 4)} />
        </div>
        {!list.length && (
          <div className="empty">No stories in this category yet.</div>
        )}
        {data && (
          <Pagination data={data} base={`/${path}`} params={{ filter }} />
        )}
      </>
    );
  } else if (slug[0] === "news" && slug.length === 2) {
    const a = await newsService.get(slug[1]);
    if (!a) notFound();
    const related = (await newsService.latest(false, 4)).filter(
      (x) => x.slug !== a.slug,
    );
    const image = mediaUrl(a.image);
    const canonical = a.seo?.canonicalUrl || absolute(a.path);
    content = (
      <>
        <Crumbs
          items={[{ label: "News", href: "/news" }, { label: a.title }]}
        />
        <div className="page-grid">
          <article className="article-detail">
            <span className="eyebrow">{a.category}</span>
            <h1>{a.title}</h1>
            <p className="article-deck">{a.excerpt}</p>
            <div className="byline">
              <b>BY {a.author.toUpperCase()}</b>
              <span>Published {formatDate(a.published)}</span>
              <span>Updated {formatDate(a.updated)}</span>
              <span>{a.readTime} min read</span>
            </div>
            {image && (
              <div className="article-cover">
                <Image
                  src={image}
                  alt={a.imageAlt}
                  fill
                  priority
                  unoptimized
                  sizes="(max-width: 800px) 100vw, 800px"
                />
              </div>
            )}
            <div
              className="article-body"
              dangerouslySetInnerHTML={{ __html: renderArticleBody(a) }}
            />
            <div className="share-row">
              <span>SHARE THIS STORY</span>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(a.title)}&url=${encodeURIComponent(canonical)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                X / TWITTER ↗
              </a>
              <a
                href={`mailto:?subject=${encodeURIComponent(a.title)}&body=${encodeURIComponent(canonical)}`}
              >
                EMAIL ↗
              </a>
            </div>
          </article>
          <Trending articles={related} />
        </div>
        <div className="section-block">
          <SectionHeading title="More stories" href="/news" />
          <div className="article-grid">
            {related.map((x) => (
              <ArticleCard article={x} key={x.slug} />
            ))}
          </div>
        </div>
        <JsonLd
          value={{
            "@context": "https://schema.org",
            "@type": "NewsArticle",
            headline: a.title,
            description: a.excerpt,
            ...(image ? { image: absolute(image) } : {}),
            datePublished: a.published,
            dateModified: a.updated,
            ...(a.author
              ? { author: { "@type": "Person", name: a.author } }
              : {}),
            publisher: { "@type": "Organization", name: site.name },
            mainEntityOfPage: canonical,
          }}
        />
      </>
    );
  } else if (path === "videos") {
    const filter = val(q.filter) || "all";
    const data = await videoService.list({
      filter: filter === "all" ? undefined : filter,
      page: pageNumber(val(q.page)),
    });
    content = (
      <>
        <Crumbs items={[{ label: "Videos" }]} />
        <PageHeader
          kicker="WATCH THE GAME DIFFERENTLY"
          title="The Boundary in motion"
          description="Highlights, interviews and analysis from around the game."
        />
        <form action="/videos" className="filter-nav">
          <label>
            Category{" "}
            <input
              name="filter"
              defaultValue={filter === "all" ? "" : filter}
            />
          </label>
          <button>Filter</button>
          <Link href="/videos">All</Link>
        </form>
        <div className="video-grid">
          {data.content.map((v) => (
            <VideoCard video={v} key={v.slug} />
          ))}
        </div>
        {!data.content.length && <div className="empty">No videos found.</div>}
        <Pagination data={data} base="/videos" params={{ filter }} />
      </>
    );
  } else if (slug[0] === "videos" && slug.length === 2) {
    const v = await videoService.get(slug[1]);
    if (!v) notFound();
    const url = externalUrl(v.videoUrl),
      image = mediaUrl(v.image);
    content = (
      <>
        <Crumbs
          items={[{ label: "Videos", href: "/videos" }, { label: v.title }]}
        />
        <PageHeader
          kicker={v.category}
          title={v.title}
          description={v.description}
        />
        <div className="video-placeholder">
          <div>
            <Play size={40} />
            <h2>Watch this video</h2>
            {url ? (
              <a
                className="dark-button"
                href={url}
                target="_blank"
                rel="noopener noreferrer"
              >
                OPEN VIDEO ↗
              </a>
            ) : (
              <p>Video source is not available.</p>
            )}
          </div>
        </div>
        <JsonLd
          value={{
            "@context": "https://schema.org",
            "@type": "VideoObject",
            name: v.title,
            description: v.description,
            ...(image ? { thumbnailUrl: absolute(image) } : {}),
            uploadDate: v.published,
            ...(url ? { contentUrl: url } : {}),
          }}
        />
      </>
    );
  } else if (path === "teams") {
    const data = await teamService.list({ page: pageNumber(val(q.page)) });
    content = (
      <>
        <Crumbs items={[{ label: "Teams" }]} />
        <PageHeader
          kicker="THE TEAMS"
          title="Teams around the world"
          description="Get to know the sides and players bringing the game to life."
        />
        <div className="listing-grid">
          {data.content.map((t) => (
            <Link
              href={`/teams/${t.slug}`}
              className="content-box"
              key={t.slug}
            >
              {mediaUrl(t.logoUrl || "") ? (
                <Image
                  src={mediaUrl(t.logoUrl || "")!}
                  alt={`${t.name} team logo`}
                  width={64}
                  height={64}
                  unoptimized
                  style={{ objectFit: "contain" }}
                />
              ) : (
                <span className="profile-flag">{t.flag}</span>
              )}
              <h2>
                {t.name} <span className="accent">↗</span>
              </h2>
              <p>{t.description}</p>
            </Link>
          ))}
        </div>
        {!data.content.length && (
          <div className="empty">No teams available yet.</div>
        )}
        <Pagination data={data} base="/teams" params={{}} />
      </>
    );
  } else if (slug[0] === "teams" && slug.length === 2) {
    const t = await teamService.get(slug[1]);
    if (!t) notFound();
    const [players, matches] = await Promise.all([
      playerService.list({ team: t.slug }),
      matchService.list({ team: t.slug }),
    ]);
    content = (
      <>
        <Crumbs
          items={[{ label: "Teams", href: "/teams" }, { label: t.name }]}
        />
        <div className="profile-card">
          {mediaUrl(t.logoUrl || "") ? (
            <Image
              src={mediaUrl(t.logoUrl || "")!}
              alt={`${t.name} team logo`}
              width={64}
              height={64}
              unoptimized
              style={{ objectFit: "contain" }}
            />
          ) : (
            <span className="profile-flag">{t.flag}</span>
          )}
          <div>
            <span className="eyebrow">CRICKET TEAM</span>
            <h1>{t.name}</h1>
            <p>{t.description}</p>
          </div>
        </div>
        <SectionHeading title="Squad & players" />
        <div className="profile-links">
          {players.content.map((p) => (
            <Link href={`/players/${p.slug}`} key={p.slug}>
              {p.name} · {p.role}
            </Link>
          ))}
          {!players.content.length && <p>No players available yet.</p>}
        </div>
        <div className="section-block">
          <SectionHeading title="Matches" href="/cricket/fixtures" />
          <div className="listing-grid">
            {matches.content.map((m) => (
              <MatchCard match={m} key={m.slug} />
            ))}
          </div>
          {!matches.content.length && (
            <div className="empty">No matches available yet.</div>
          )}
        </div>
        <JsonLd
          value={{
            "@context": "https://schema.org",
            "@type": "SportsTeam",
            name: t.name,
            description: t.description,
            url: site.url + "/teams/" + t.slug,
          }}
        />
      </>
    );
  } else if (slug[0] === "players" && slug.length === 2) {
    const p = await playerService.get(slug[1]);
    if (!p) notFound();
    content = (
      <>
        <Crumbs
          items={[{ label: "Teams", href: "/teams" }, { label: p.name }]}
        />
        <div className="profile-card">
          {mediaUrl(p.imageUrl || "") ? (
            <Image
              src={mediaUrl(p.imageUrl || "")!}
              alt={p.name}
              width={80}
              height={80}
              unoptimized
              style={{ objectFit: "cover" }}
            />
          ) : (
            <span className="profile-flag">🏏</span>
          )}
          <div>
            <span className="eyebrow">
              {p.country.toUpperCase()} / {p.role.toUpperCase()}
            </span>
            <h1>{p.name}</h1>
            <p>{p.description}</p>
          </div>
        </div>
        <div className="content-box">
          <h2>Player profile</h2>
          <p>
            <b>Playing role:</b> {p.role || "—"}
          </p>
          <p>
            <b>Batting style:</b> {p.batting || "—"}
          </p>
          <p>
            <b>Bowling style:</b> {p.bowling || "—"}
          </p>
          <p>Career statistics are not available from the current API.</p>
          {p.teamSlug && (
            <Link className="text-link" href={`/teams/${p.teamSlug}`}>
              VIEW TEAM <ArrowRight size={15} />
            </Link>
          )}
        </div>
        <JsonLd
          value={{
            "@context": "https://schema.org",
            "@type": "Person",
            name: p.name,
            description: p.description,
          }}
        />
      </>
    );
  } else if (path === "rankings") {
    const rankings = await rankingsService.get(val(q.format) || undefined);
    content = (
      <>
        <Crumbs items={[{ label: "Rankings" }]} />
        <PageHeader
          kicker="THE TABLE"
          title="Cricket rankings"
          description={
            rankings
              ? `${rankings.tournamentName} standings`
              : "No standings are currently available."
          }
        />
        {rankings && <Points rows={rankings.rows} />}
      </>
    );
  } else if (path === "search") {
    const text = val(q.q).trim();
    let result: Awaited<ReturnType<typeof searchAll>> | undefined;
    let problem = "";
    if (text)
      try {
        result = await searchAll(text);
      } catch (error) {
        if (error instanceof ServiceError && error.code === "query_too_short")
          problem = "Please enter at least two characters.";
        else if (error instanceof ServiceError && error.status === 429)
          problem = "Too many requests. Please try again shortly.";
        else throw error;
      }
    content = (
      <>
        <Crumbs items={[{ label: "Search" }]} />
        <PageHeader
          kicker="FIND YOUR GAME"
          title="Search The Boundary"
          description="Search stories, teams, players, tournaments and matches."
        />
        <form className="search-form" action="/search">
          <label className="sr-only" htmlFor="q">
            Search
          </label>
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={text}
            placeholder="Search sport"
          />
          <button>SEARCH</button>
        </form>
        {problem ? (
          <div className="empty">{problem}</div>
        ) : text && result ? (
          <>
            <p>
              {result.total} results for “{text}”
            </p>
            {result.results.length ? (
              result.results.map((r, i) => (
                <Link
                  className="result"
                  href={safePath(r.path, "/search")}
                  key={`${r.path}-${i}`}
                >
                  <span className="eyebrow">{r.type}</span>
                  <b>{r.title}</b>
                  {r.subtitle && <p>{r.subtitle}</p>}
                </Link>
              ))
            ) : (
              <div className="empty">
                No results found. Try a different search term.
              </div>
            )}
          </>
        ) : (
          <div className="empty">
            Enter a search term to explore the world of sport.
          </div>
        )}
      </>
    );
  } else if (path === "cricket") {
    const [matches, articles] = await Promise.all([
      matchService.list({ size: 3 }),
      newsService.list({ size: 3 }),
    ]);
    content = (
      <>
        <Crumbs items={[{ label: "Cricket" }]} />
        <PageHeader
          kicker="YOUR FRONT ROW SEAT"
          title="Cricket"
          description="Everything you love about the game, in one place."
        />
        <div className="profile-links">
          <Link href="/cricket/live-scores">Live scores ↗</Link>
          <Link href="/cricket/fixtures">Fixtures & results ↗</Link>
          <Link href="/cricket/series">Series & tournaments ↗</Link>
          <Link href="/teams">Teams ↗</Link>
          <Link href="/rankings">Rankings ↗</Link>
        </div>
        <div className="section-block">
          <SectionHeading
            title="Around the grounds"
            href="/cricket/live-scores"
          />
          <div className="match-grid">
            {matches.content.map((m) => (
              <MatchCard match={m} key={m.slug} />
            ))}
          </div>
        </div>
        <div className="section-block">
          <SectionHeading title="Latest cricket stories" href="/news" />
          <div className="article-grid">
            {articles.content.map((a) => (
              <ArticleCard article={a} key={a.slug} />
            ))}
          </div>
        </div>
      </>
    );
  } else
    content = (
      <>
        <Crumbs items={[{ label: info.title }]} />
        <PageHeader title={info.title} />
        <div className="content-box">
          {path === "about" ? (
            <>
              <h2>For the love of the game.</h2>
              <p>
                The Boundary brings you the stories, scores and moments that
                bring fans together.
              </p>
            </>
          ) : (
            <>
              <h2>Get in touch</h2>
              <p>Contact information is not available yet.</p>
            </>
          )}
        </div>
      </>
    );
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: site.url },
      {
        "@type": "ListItem",
        position: 2,
        name: info.title,
        item: site.url + "/" + path,
      },
    ],
  };
  return (
    <div className="shell page">
      {content}
      <JsonLd value={breadcrumb} />
    </div>
  );
}
