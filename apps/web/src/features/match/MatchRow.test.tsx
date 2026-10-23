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
  clock: null,
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

  it('marks live matches with the word and the running minute, not colour alone', () => {
    // Second half started 21½ minutes ago: minute 67.
    const clock = { startedAt: new Date(Date.now() - 21.5 * 60_000).toISOString(), base: 45, cap: 90 };
    renderWithApp(<MatchRow match={{ ...base, state: 'live', clock }} />, { lang: 'en' });
    expect(screen.getByRole('link')).toHaveTextContent("LIVE67'");
  });

  it('shows "LIVE" without a minute at half-time', () => {
    renderWithApp(<MatchRow match={{ ...base, state: 'live', phase: 'half_time', clock: null }} />, { lang: 'en' });
    const link = screen.getByRole('link');
    expect(link).toHaveTextContent('LIVE');
    expect(link.textContent).not.toMatch(/\d'/);
  });

  it('shows postponed matches with their date, not as live', () => {
    const postponed = { ...base, state: 'postponed' as const, home: { ...base.home, score: null }, away: { ...base.away, score: null } };
    renderWithApp(<MatchRow match={postponed} />, { lang: 'en' });
    expect(screen.getByRole('link')).toHaveTextContent('23:00');
    expect(screen.getByRole('link')).toHaveTextContent('Postponed');
  });

  it('shows the date instead of the status for past meetings', () => {
    renderWithApp(<MatchRow match={base} meta="19 January 2026" />, { lang: 'en' });
    expect(screen.getByRole('link')).toHaveTextContent('19 January 2026');
    expect(screen.getByRole('link')).not.toHaveTextContent('FT');
  });

  it('shows the Egypt kickoff time for scheduled matches', () => {
    renderWithApp(<MatchRow match={{ ...base, state: 'scheduled', home: { ...base.home, score: null }, away: { ...base.away, score: null } }} />, {
      lang: 'en',
    });
    expect(screen.getByRole('link')).toHaveTextContent('23:00');
  });
});
