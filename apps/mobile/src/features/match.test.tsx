import { describe, expect, it } from '@jest/globals';
import type { Match } from '@sports247/domain';
import { fireEvent, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import { renderWithApp } from '../test/render';
import { MatchRow } from './match';

const base: Match = {
  id: 2578,
  sportId: 1,
  kickoff: '2026-01-19T23:00',
  state: 'finished',
  statusLabel: 'انتهت',
  phase: null,
  home: { id: 26, name: 'برايتون', shortName: 'Brighton', logo: null, score: 1, penalties: null },
  away: { id: 22, name: 'بورنموث', shortName: 'Bournemouth', logo: null, score: 2, penalties: null },
  competition: { id: 3, title: 'الدوري الإنجليزي', logo: null },
  stage: null,
  venue: null,
  regionIds: [2],
  clock: null,
};

describe('MatchRow', () => {
  it('shows Arabic names and Arabic-Indic digits, and opens the match centre', async () => {
    await renderWithApp(<MatchRow match={base} />);
    expect(screen.getByText('برايتون')).toBeTruthy();
    expect(screen.getByText('١')).toBeTruthy();
    expect(screen.getByText('٢')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button'));
    expect(router.push).toHaveBeenCalledWith('/football/match/2578');
  });

  it('uses Latin short names and a spoken score label in English', async () => {
    await renderWithApp(<MatchRow match={base} />, { lang: 'en' });
    expect(screen.getByText('Brighton')).toBeTruthy();
    expect(screen.getByLabelText('Brighton 1, Bournemouth 2 · FT')).toBeTruthy();
  });

  it('marks live matches with the word and the minute, not colour alone', async () => {
    const clock = { startedAt: new Date(Date.now() - 21.5 * 60_000).toISOString(), base: 45, cap: 90 };
    await renderWithApp(<MatchRow match={{ ...base, state: 'live', clock }} />, { lang: 'en' });
    expect(screen.getByText("LIVE 67'")).toBeTruthy();
  });

  it('shows the Egypt kickoff time for scheduled matches', async () => {
    const scheduled = { ...base, state: 'scheduled' as const, home: { ...base.home, score: null }, away: { ...base.away, score: null } };
    await renderWithApp(<MatchRow match={scheduled} />, { lang: 'en' });
    expect(screen.getByText('23:00')).toBeTruthy();
  });
});
