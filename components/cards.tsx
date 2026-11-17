import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import type { Match, NewsArticle, PointsTable, Video } from "@/types";
import { formatDate } from "@/lib/utils";
import { mediaUrl, safePath } from "@/lib/content";
export function SectionHeading({
  kicker,
  title,
  href,
  link = "VIEW ALL",
}: {
  kicker?: string;
  title: string;
  href?: string;
  link?: string;
}) {
  return (
    <div className="section-heading">
      <div>
        {kicker && <div className="eyebrow">{kicker}</div>}
        <h2>
          {title}
          <span className="accent">.</span>
        </h2>
      </div>
      {href && (
        <Link href={href} className="text-link">
          {link} <ArrowRight size={15} />
        </Link>
      )}
    </div>
  );
}
export function ArticleCard({
  article,
  compact = false,
}: {
  article: NewsArticle;
  compact?: boolean;
}) {
  const image = mediaUrl(article.image);
  return (
    <Link
      href={safePath(article.path, `/news/${article.slug}`)}
      className={`article-card ${compact ? "compact" : ""}`}
    >
      <div className="article-image">
        {image && (
          <Image
            src={image}
            alt={article.imageAlt}
            fill
            unoptimized
            sizes="(max-width: 700px) 90vw, 350px"
          />
        )}
      </div>
      <div className="article-copy">
        <span className="eyebrow">{article.category}</span>
        <h3>{article.title}</h3>
        {!compact && <p>{article.excerpt}</p>}
        <span className="article-meta">
          {formatDate(article.published)} <span>·</span> {article.readTime} MIN
          READ
        </span>
      </div>
    </Link>
  );
}
export function MatchCard({ match }: { match: Match }) {
  return (
    <Link className="match-card" href={`/cricket/match/${match.slug}`}>
      <div className="match-card-top">
        <span
          className={match.status === "live" ? "status-live" : "status-other"}
        >
          {match.status === "live"
            ? "● LIVE"
            : match.state === "ABANDONED"
              ? "ABANDONED"
              : match.status === "recent"
                ? "RESULT"
                : "UPCOMING"}
        </span>
        <span>
          {match.format} · {match.category}
        </span>
      </div>
      <p>
        {match.tournament} · {match.venue}
      </p>
      <div className="match-team">
        <span>
          {match.team1.flag} &nbsp;{match.team1.name}
        </span>
        <strong>{match.score1 || "—"}</strong>
      </div>
      <div className="match-team">
        <span>
          {match.team2.flag} &nbsp;{match.team2.name}
        </span>
        <strong>{match.score2 || "—"}</strong>
      </div>
      <div className="match-bottom">
        {match.note} <ArrowRight size={15} />
      </div>
    </Link>
  );
}
export function VideoCard({ video }: { video: Video }) {
  const image = mediaUrl(video.image);
  return (
    <Link className="video-card" href={`/videos/${video.slug}`}>
      <div className="video-image">
        {image && (
          <Image
            src={image}
            alt=""
            fill
            unoptimized
            sizes="(max-width: 700px) 90vw, 350px"
          />
        )}
        <span className="play">
          <Play size={16} fill="currentColor" />
        </span>
        <span className="duration">{video.duration}</span>
      </div>
      <span className="eyebrow">{video.category}</span>
      <h3>{video.title}</h3>
    </Link>
  );
}
export function Points({ rows }: { rows: PointsTable[] }) {
  return rows.length ? (
    <div className="data-table-wrap">
      <table>
        <thead>
          <tr>
            <th>Team</th>
            <th>Played</th>
            <th>Won</th>
            <th>Lost</th>
            <th>Points</th>
            <th>NRR / Percentage</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.team}>
              <td>{p.team}</td>
              <td>{p.played}</td>
              <td>{p.won}</td>
              <td>{p.lost}</td>
              <td>{p.points}</td>
              <td>{p.nrr}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <div className="empty">No standings available yet.</div>
  );
}
