import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import {
  homepageService,
  newsService,
  matchService,
  tournamentService,
  videoService,
} from "@/services";
import { ScoreStrip } from "@/components/score-strip";
import {
  ArticleCard,
  SectionHeading,
  VideoCard,
  MatchCard,
  Points,
} from "@/components/cards";
import { Newsletter } from "@/components/newsletter";
import { formatDate } from "@/lib/utils";
import { mediaUrl, safePath } from "@/lib/content";
import type { HomepageSection, NewsArticle } from "@/types";
const limit = (config: Record<string, unknown>, fallback: number) =>
  typeof config.limit === "number"
    ? Math.max(1, Math.min(20, Math.floor(config.limit)))
    : fallback;
async function articleSelection(
  section: HomepageSection,
): Promise<NewsArticle[]> {
  const slugs =
    section.config.articleSlugs ??
    (section.type === "CUSTOM" ? section.config.slugs : undefined);
  if (Array.isArray(slugs)) {
    const found = await Promise.all(
      slugs
        .filter((s): s is string => typeof s === "string")
        .slice(0, 20)
        .map((s) => newsService.get(s)),
    );
    return found
      .filter((a): a is NewsArticle => !!a)
      .slice(0, limit(section.config, 10));
  }
  return newsService.latest(
    section.config.featured === true,
    limit(section.config, 10),
  );
}
function Hero({ article }: { article: NewsArticle }) {
  const image = mediaUrl(article.image);
  return (
    <Link
      href={safePath(article.path, `/news/${article.slug}`)}
      className="hero-card"
    >
      {image && (
        <Image
          src={image}
          alt={article.imageAlt}
          fill
          priority
          unoptimized
          sizes="(max-width: 900px) 100vw, 65vw"
        />
      )}
      <div className="hero-gradient" />
      <div className="hero-content">
        <span className="hero-label">
          THE BIG STORY <ArrowUpRight size={13} />
        </span>
        <span className="hero-category">
          {article.category} &nbsp; / &nbsp; {article.readTime} MIN READ
        </span>
        <h2>{article.title}</h2>
        <p>{article.excerpt}</p>
        <div className="hero-author">
          BY {article.author.toUpperCase()} <span>·</span>{" "}
          {formatDate(article.published).toUpperCase()}{" "}
          <span className="hero-arrow">
            <ArrowUpRight size={19} />
          </span>
        </div>
      </div>
    </Link>
  );
}
async function Block({
  section,
  headlineSection,
}: {
  section: HomepageSection;
  headlineSection?: HomepageSection;
}) {
  const title = section.title || section.type.replaceAll("_", " ");
  if (section.type === "HERO") {
    const [articles, latest] = await Promise.all([
      articleSelection(section),
      headlineSection ? articleSelection(headlineSection) : Promise.resolve([]),
    ]);
    return articles[0] ? (
      <div
        className="lead-layout"
        style={!headlineSection ? { gridTemplateColumns: "1fr" } : undefined}
      >
        <Hero article={articles[0]} />
        {headlineSection && (
          <aside className="latest-panel">
            <div className="panel-title">
              <div>
                <span className="eyebrow">THE STORIES THAT MATTER</span>
                <h2>
                  Latest stories<span>.</span>
                </h2>
              </div>
              <span className="panel-icon">↗</span>
            </div>
            {latest
              .filter((a) => a.slug !== articles[0].slug)
              .slice(0, 4)
              .map((a, i) => (
                <Link
                  className="latest-item"
                  href={safePath(a.path, `/news/${a.slug}`)}
                  key={a.slug}
                >
                  <span className="latest-number">0{i + 1}</span>
                  <div>
                    <span className="eyebrow">{a.category}</span>
                    <h3>{a.title}</h3>
                    <span className="article-meta">
                      {formatDate(a.published)} &nbsp;·&nbsp; {a.readTime} MIN
                      READ
                    </span>
                  </div>
                  <ArrowUpRight className="latest-arrow" size={16} />
                </Link>
              ))}
            <Link className="panel-bottom" href="/news">
              ALL THE LATEST <ArrowRight size={16} />
            </Link>
          </aside>
        )}
      </div>
    ) : (
      <div className="empty">No featured story is available yet.</div>
    );
  }
  if (
    section.type === "HEADLINE_LIST" ||
    (section.type === "CUSTOM" && Array.isArray(section.config.slugs))
  ) {
    const articles = await articleSelection(section);
    return (
      <section className="section-block">
        <SectionHeading
          title={title}
          kicker="THE STORIES THAT MATTER"
          href="/news"
        />
        <div className="article-grid">
          {articles.map((a) => (
            <ArticleCard key={a.slug} article={a} />
          ))}
        </div>
        {!articles.length && (
          <div className="empty">No stories available yet.</div>
        )}
      </section>
    );
  }
  if (section.type === "MATCH_STRIP") {
    const refs = section.config.matchSlugs;
    const statuses = Array.isArray(section.config.statuses)
      ? section.config.statuses.filter(
          (s): s is string => typeof s === "string",
        )
      : [];
    const filters = statuses
      .map(
        (s) =>
          (
            ({
              LIVE: "live",
              SCHEDULED: "upcoming",
              COMPLETED: "recent",
              ABANDONED: "recent",
            }) as Record<string, string>
          )[s],
      )
      .filter((s): s is string => !!s);
    const results = Array.isArray(refs)
      ? (
          await Promise.all(
            refs
              .filter((x): x is string => typeof x === "string")
              .slice(0, 20)
              .map((x) => matchService.get(x)),
          )
        ).filter((m): m is NonNullable<typeof m> => !!m)
      : (
          await Promise.all(
            (filters.length ? [...new Set(filters)] : ["all"]).map((filter) =>
              matchService.list({ size: 100, filter }),
            ),
          )
        ).flatMap((r) => r.content);
    const matches = results
      .filter((m) => !statuses.length || statuses.includes(m.state))
      .slice(0, limit(section.config, 4));
    return (
      <section className="section-block">
        <SectionHeading
          title={title}
          kicker="FOLLOW THE ACTION"
          href="/cricket/live-scores"
          link="ALL MATCHES"
        />
        <div className="match-grid">
          {matches.map((m) => (
            <MatchCard key={m.slug} match={m} />
          ))}
        </div>
        {!matches.length && (
          <div className="empty">No matches available yet.</div>
        )}
      </section>
    );
  }
  if (section.type === "POINTS_TABLE") {
    const slug =
      typeof section.config.tournamentSlug === "string"
        ? section.config.tournamentSlug
        : typeof section.config.series === "string"
          ? section.config.series
          : "";
    return (
      <section className="section-block">
        <SectionHeading
          title={title}
          href={
            slug
              ? `/cricket/series/${encodeURIComponent(slug)}`
              : "/cricket/series"
          }
          link="ALL SERIES"
        />
        {slug ? (
          <Points rows={await tournamentService.points(slug)} />
        ) : (
          <div className="empty">No tournament is selected.</div>
        )}
      </section>
    );
  }
  if (section.type === "VIDEO_RAIL") {
    const refs = section.config.videoSlugs;
    const videos = Array.isArray(refs)
      ? (
          await Promise.all(
            refs
              .filter((x): x is string => typeof x === "string")
              .slice(0, 20)
              .map((x) => videoService.get(x)),
          )
        )
          .filter((v): v is NonNullable<typeof v> => !!v)
          .slice(0, limit(section.config, 4))
      : (await videoService.list({ size: limit(section.config, 4) })).content;
    return (
      <section className="section-block">
        <SectionHeading
          title={title}
          kicker="WATCH THE GAME DIFFERENTLY"
          href="/videos"
          link="ALL VIDEOS"
        />
        <div className="video-grid">
          {videos.map((v) => (
            <VideoCard video={v} key={v.slug} />
          ))}
        </div>
        {!videos.length && (
          <div className="empty">No videos available yet.</div>
        )}
      </section>
    );
  }
  return null;
}
export default async function Home() {
  await connection();
  let sections = (await homepageService.list())
    .filter((s) => s.enabled)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  if (!sections.length)
    sections = [
      {
        key: "hero",
        type: "HERO",
        title: "Top story",
        sortOrder: 0,
        enabled: true,
        config: { featured: true },
      },
      {
        key: "headlines",
        type: "HEADLINE_LIST",
        title: "Latest stories",
        sortOrder: 1,
        enabled: true,
        config: {},
      },
      {
        key: "matches",
        type: "MATCH_STRIP",
        title: "Around the grounds",
        sortOrder: 2,
        enabled: true,
        config: {},
      },
      {
        key: "videos",
        type: "VIDEO_RAIL",
        title: "The Boundary in motion",
        sortOrder: 3,
        enabled: true,
        config: {},
      },
    ];
  const showScores = sections.some((s) => s.type === "MATCH_STRIP");
  const matches = showScores
    ? (
        await Promise.all(
          ["live", "upcoming", "recent"].map((filter) =>
            matchService.list({ size: 100, filter }),
          ),
        )
      ).flatMap((p) => p.content)
    : [];
  return (
    <>
      {showScores && <ScoreStrip matches={matches} />}
      <div className="shell home">
        <div className="breaking">
          <span className="breaking-label">THE BOUNDARY</span>
          <span>The stories, scores and moments that bring us together.</span>
          <Link className="breaking-more" href="/news">
            MORE STORIES <ArrowRight size={15} />
          </Link>
        </div>
        <div className="home-intro">
          <div>
            <div className="eyebrow">YOUR DAILY SPORTS EDIT</div>
            <h1>
              For the love of the game<span>.</span>
            </h1>
            <p>The stories, scores and moments that bring us together.</p>
          </div>
          <div className="edition">
            THE BOUNDARY <span>✳</span>
            <br />
            <b>YOUR FRONT ROW SEAT</b>
          </div>
        </div>
        {sections.map((section) => (
          <Block
            section={section}
            headlineSection={sections.find((s) => s.type === "HEADLINE_LIST")}
            key={section.key}
          />
        ))}
        <Newsletter />
      </div>
    </>
  );
}
