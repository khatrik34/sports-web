// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ScoreStrip } from '../components/score-strip';
import { matches } from '../mocks/data';
vi.mock('next/link',()=>({default:({children,href,...props}:{children:React.ReactNode;href:string})=><a href={href} {...props}>{children}</a>}));
describe('score strip navigation',()=>{it('shows live matches and switches to upcoming fixtures',()=>{render(<ScoreStrip matches={matches}/>);expect(screen.getByText('India trail by 28 runs • Day 2, Session 3')).toBeTruthy();fireEvent.click(screen.getByRole('tab',{name:'upcoming'}));expect(screen.getByText('Nov 15 • 7:00 PM PKT')).toBeTruthy();expect(screen.getByRole('tab',{name:'upcoming'}).getAttribute('aria-selected')).toBe('true');});});
