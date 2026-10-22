import type { Match } from '@sports247/domain';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithApp } from '../../test/render';
import { MatchRow } from './MatchRow';

const base: Match = {
  id: 2578,
  sportId: 1,
  kickoff: '2026-01-19T23:00',
  state: 'finished',
  statusLabel: 'انتهت',
  phase: null,
  minute: null,
  home: { id: 26, name: 'برايتون', shortName: 'Brighton', logo: null, score: 1, penalties: null },
  away: { id: 22, name: 'بورنموث', shortName: 'Bournemouth', logo: null, score: 2, penalties: null },
  competition: { id: 3, title: 'الدوري الإنجليزي', logo: null },
  stage: null,
  venue: null,
  regionIds: [2],
};

describe('MatchRow', () => {
  it('shows Arabic names, Arabic-Indic digits and links to the match centre', () => {
    renderWithApp(<MatchRow match={base} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/ar/football/match/2578');
    expect(link).toHaveTextContent('برايتون');
    expect(link).toHaveTextContent('١');
    expect(link).toHaveTextContent('٢');
    expect(link).toHaveTextContent('انتهت');
  });

  it('uses Latin short names and digits in English', () => {
    renderWithApp(<MatchRow match={base} />, { lang: 'en' });
    const link = screen.getByRole('link');
    expect(link).toHaveTextContent('Brighton');
    expect(link).toHaveAccessibleName('Brighton 1, Bournemouth 2 · FT');
  });

  it('marks live matches with the word and the minute, not colour alone', () => {
    renderWithApp(<MatchRow match={{ ...base, state: 'live', minute: '67' }} />, { lang: 'en' });
    expect(screen.getByRole('link')).toHaveTextContent("LIVE67'");
  });

  it('shows the Egypt kickoff time for scheduled matches', () => {
    renderWithApp(<MatchRow match={{ ...base, state: 'scheduled', home: { ...base.home, score: null }, away: { ...base.away, score: null } }} />, {
      lang: 'en',
    });
    expect(screen.getByRole('link')).toHaveTextContent('23:00');
  });
});
