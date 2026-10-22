import type { SportsApi } from '@sports247/api';
import type { DayMatches, Match } from '@sports247/domain';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderWithApp } from '../test/render';
import MatchesPage from './MatchesPage';

const match = (id: number, competition: { id: number; title: string }, kickoff: string): Match => ({
  id,
  sportId: 1,
  kickoff,
  state: 'scheduled',
  statusLabel: '',
  phase: null,
  minute: null,
  home: { id: id * 10, name: `فريق ${id}أ`, shortName: null, logo: null, score: null, penalties: null },
  away: { id: id * 10 + 1, name: `فريق ${id}ب`, shortName: null, logo: null, score: null, penalties: null },
  competition: { ...competition, logo: null },
  stage: null,
  venue: null,
  regionIds: [2],
});

const egypt = { id: 1, title: 'الدوري المصري' };
const ucl = { id: 10, title: 'دوري أبطال أوروبا' };
const days: DayMatches = {
  yesterday: [],
  today: [match(1, ucl, '2026-10-22T22:00'), match(2, egypt, '2026-10-22T17:00'), match(3, ucl, '2026-10-22T19:45')],
  tomorrow: [],
};

describe('Matches page filter', () => {
  it('offers one chip per competition playing that day and filters by it', async () => {
    renderWithApp(<MatchesPage />, { api: { dayMatches: vi.fn().mockResolvedValue(days) } as Partial<SportsApi>, path: '/ar/football/matches' });
    const chips = await screen.findByRole('group', { name: 'تصفية حسب البطولة' });
    // Same order as the list: Egyptian League kicks off first.
    // Compare the names, not textContent (the crest's fallback initial is aria-hidden).
    const names = within(chips).getAllByRole('button').map((b) => b.querySelector('bdi')?.textContent ?? b.textContent);
    expect(names).toEqual(['الكل', 'الدوري المصري', 'دوري أبطال أوروبا']);
    expect(screen.getAllByRole('link', { name: /ضد/ })).toHaveLength(3);

    await userEvent.click(within(chips).getByRole('button', { name: 'دوري أبطال أوروبا' }));
    expect(within(chips).getByRole('button', { name: 'دوري أبطال أوروبا' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getAllByRole('link', { name: /ضد/ })).toHaveLength(2);
  });
});
