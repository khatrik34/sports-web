import * as data from '@/mocks/data';
import type { Match, NewsArticle, Player, Team, Tournament, Video } from '@/types';
export interface ContentService<T> { list(): Promise<T[]>; get(slug:string): Promise<T | undefined> }
const createService = <T extends {slug:string}>(items:T[]):ContentService<T> => ({ async list(){ return items; }, async get(slug){ return items.find(item=>item.slug===slug); } });
export const matchService = createService<Match>(data.matches);
export const newsService = createService<NewsArticle>(data.articles);
export const playerService = createService<Player>(data.players);
export const tournamentService = createService<Tournament>(data.tournaments);
export const videoService = createService<Video>(data.videos);
export const teamService = createService<Team>(data.teams);
export const matchDetailsService = { async scorecard(){return data.scorecard}, async commentary(){return data.commentary}, async points(){return data.points} };
export async function searchAll(query:string) {
 const q=query.trim().toLowerCase(); if(!q) return [];
 const [news,teams,players,tournaments,matches]=await Promise.all([newsService.list(),teamService.list(),playerService.list(),tournamentService.list(),matchService.list()]);
 return [...news.map(x=>({title:x.title, type:'News',href:`/news/${x.slug}`})), ...teams.map(x=>({title:x.name,type:'Team',href:`/teams/${x.slug}`})), ...players.map(x=>({title:x.name,type:'Player',href:`/players/${x.slug}`})), ...tournaments.map(x=>({title:x.name,type:'Tournament',href:`/cricket/series/${x.slug}`})), ...matches.map(x=>({title:`${x.team1.name} vs ${x.team2.name}`,type:'Match',href:`/cricket/match/${x.slug}`}))].filter(x=>x.title.toLowerCase().includes(q));
}
