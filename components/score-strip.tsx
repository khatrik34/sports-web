"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Match, MatchStatus } from "@/types";
export function ScoreStrip({ matches }: { matches: Match[] }) {
  const [tab, setTab] = useState<MatchStatus>("live");
  return (
    <section className="score-strip" aria-label="Match scores">
      <div className="shell score-inner">
        <div className="score-heading">
          <div>
            <span className="eyebrow light">THE SCOREBOARD</span>
            <h2>
              On the field<span>.</span>
            </h2>
          </div>
          <div className="score-tabs" role="tablist" aria-label="Match status">
            {(["live", "upcoming", "recent"] as const).map((t) => (
              <button
                role="tab"
                aria-selected={tab === t}
                className={tab === t ? "selected" : ""}
                key={t}
                onClick={() => setTab(t)}
              >
                {t === "live" && <span className="live-dot" />}
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="strip-cards">
          {matches
            .filter((m) => m.status === tab)
            .map((m) => (
              <Link
                className="strip-card"
                key={m.slug}
                href={`/cricket/match/${m.slug}`}
              >
                <div className="strip-meta">
                  <span>
                    {m.status === "live"
                      ? "● LIVE"
                      : m.status === "upcoming"
                        ? "UPCOMING"
                        : m.state === "ABANDONED"
                          ? "ABANDONED"
                          : "RESULT"}
                  </span>
                  <span>
                    {m.format} · {m.tournament}
                  </span>
                </div>
                <div className="score-row">
                  <span>
                    <span className="flag">{m.team1.flag}</span> {m.team1.short}
                  </span>
                  <strong>{m.score1 || "—"}</strong>
                </div>
                <div className="score-row">
                  <span>
                    <span className="flag">{m.team2.flag}</span> {m.team2.short}
                  </span>
                  <strong>{m.score2 || "—"}</strong>
                </div>
                <div className="strip-note">{m.note}</div>
              </Link>
            ))}
          <Link className="all-scores" href="/cricket/live-scores">
            <span>
              ALL
              <br />
              MATCHES
            </span>
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
}
