// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ScoreStrip } from "../components/score-strip";
import type { Match } from "../types";
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));
const team = {
  slug: "team",
  name: "Team",
  short: "TM",
  flag: "",
  description: "",
};
const matches: Match[] = [
  {
    slug: "live",
    tournament: "Series",
    format: "T20",
    category: "International",
    venue: "Ground",
    date: "2026-01-01T00:00:00Z",
    status: "live",
    state: "LIVE",
    team1: team,
    team2: team,
    score1: "100/1",
    score2: "",
    note: "In progress",
  },
  {
    slug: "next",
    tournament: "Series",
    format: "T20",
    category: "International",
    venue: "Ground",
    date: "2026-01-02T00:00:00Z",
    status: "upcoming",
    state: "SCHEDULED",
    team1: team,
    team2: team,
    score1: "",
    score2: "",
    note: "Starts tomorrow",
  },
];
describe("score strip navigation", () => {
  it("shows live matches and switches to upcoming fixtures", () => {
    render(<ScoreStrip matches={matches} />);
    expect(screen.getByText("In progress")).toBeTruthy();
    fireEvent.click(screen.getByRole("tab", { name: "upcoming" }));
    expect(screen.getByText("Starts tomorrow")).toBeTruthy();
    expect(
      screen
        .getByRole("tab", { name: "upcoming" })
        .getAttribute("aria-selected"),
    ).toBe("true");
  });
});
