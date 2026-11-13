export type MatchStatus = 'live' | 'upcoming' | 'recent';
export interface Team { slug:string; name:string; short:string; flag:string; description:string }
export interface Match { slug:string; tournament:string; format:string; category:'International'|'League'|'Domestic'; venue:string; date:string; status:MatchStatus; team1:Team; team2:Team; score1:string; score2:string; note:string }
export interface NewsArticle { slug:string; title:string; category:string; excerpt:string; image:string; imageAlt:string; author:string; published:string; updated:string; readTime:number; body:string[]; featured?:boolean }
export interface Video { slug:string; title:string; category:string; image:string; duration:string; description:string; published:string }
export interface Player { slug:string; name:string; country:string; role:string; batting:string; bowling:string; description:string }
export interface Tournament { slug:string; name:string; short:string; description:string; dates:string; teams:string[] }
export interface Scorecard { batter:string; dismissal:string; runs:number; balls:number; fours:number; sixes:number }
export interface Commentary { over:string; text:string; kind:string }
export interface PointsTable { team:string; played:number; won:number; lost:number; points:number; nrr:string }
export interface PaginatedResponse<T> { data:T[]; page:number; pageSize:number; total:number }
export interface ApiError { message:string; status?:number }
