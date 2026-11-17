export type MatchStatus = "live" | "upcoming" | "recent";
export interface Team {
  slug: string;
  name: string;
  short: string;
  flag: string;
  description: string;
  logoUrl?: string;
}
export interface Match {
  slug: string;
  tournament: string;
  tournamentSlug?: string;
  format: string;
  category: "International" | "League" | "Domestic" | "";
  venue: string;
  date: string;
  status: MatchStatus;
  state: string;
  team1: Team;
  team2: Team;
  score1: string;
  score2: string;
  note: string;
}
export interface NewsArticle {
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  image: string;
  imageAlt: string;
  author: string;
  published: string;
  updated: string;
  readTime: number;
  body: string;
  bodyFormat: "HTML" | "MARKDOWN" | "PLAIN";
  featured: boolean;
  path: string;
  seo?: {
    metaTitle: string;
    metaDescription: string;
    canonicalUrl: string;
    robots: string;
    ogTitle: string;
    ogDescription: string;
    ogImageUrl: string;
  };
}
export interface Video {
  slug: string;
  title: string;
  category: string;
  image: string;
  duration: string;
  description: string;
  published: string;
  videoUrl: string;
}
export interface Player {
  slug: string;
  name: string;
  country: string;
  role: string;
  batting: string;
  bowling: string;
  description: string;
  teamSlug?: string;
  imageUrl?: string;
}
export interface Tournament {
  slug: string;
  name: string;
  short: string;
  description: string;
  dates: string;
  teams: string[];
}
export interface Scorecard {
  batter: string;
  dismissal: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  notOut: boolean;
}
export interface BowlingRow {
  bowler: string;
  overs: string;
  maidens: number;
  runsConceded: number;
  wickets: number;
  economy: string;
}
export interface Innings {
  inningsNumber: number;
  battingTeam: Team;
  runs: number;
  wickets: number;
  overs: string;
  declared: boolean;
  batting: Scorecard[];
  bowling: BowlingRow[];
}
export interface Commentary {
  over: string;
  text: string;
  kind: string;
  createdAt: string;
}
export interface PointsTable {
  team: string;
  played: number;
  won: number;
  lost: number;
  points: number;
  nrr: string;
}
export interface PaginatedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}
export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}
export interface HomepageSection {
  key: string;
  type: string;
  title: string;
  sortOrder: number;
  enabled: boolean;
  config: Record<string, unknown>;
}
export interface SearchHit {
  type: string;
  title: string;
  subtitle: string;
  path: string;
}
