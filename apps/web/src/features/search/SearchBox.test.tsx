import type { SportsApi } from '@sports247/api';
import type { SearchResult } from '@sports247/domain';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useLocation } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { renderWithApp } from '../../test/render';
import { SearchBox } from './SearchBox';

const results: SearchResult[] = [
  { id: 1, kind: 'team', name: 'الأهلي', image: null, subtitle: 'الدوري المصري' },
  { id: 37, kind: 'player', name: 'صلاح محسن', image: null, subtitle: null },
];

function Where() {
  const l = useLocation();
  return <output data-testid="where">{decodeURIComponent(l.pathname + l.search)}</output>;
}

function setup() {
  const search = vi.fn().mockResolvedValue(results);
  renderWithApp(
    <>
      <SearchBox variant="inline" />
      <Where />
    </>,
    { api: { search } as Partial<SportsApi> },
  );
  return { search, input: screen.getByRole('combobox') };
}

describe('Header search', () => {
  it('shows grouped results under the field while typing, without leaving the page', async () => {
    const { search, input } = setup();
    await userEvent.type(input, 'الأهلي');
    expect(await screen.findByRole('option', { name: /الأهلي/ })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'الفرق' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'اللاعبون' })).toBeInTheDocument();
    expect(search).toHaveBeenCalledWith('الأهلي');
    expect(screen.getByTestId('where')).toHaveTextContent('/ar/x');
  });

  it('moves through results with the arrow keys and opens one with Enter', async () => {
    const { input } = setup();
    await userEvent.type(input, 'الأهلي');
    await screen.findByRole('option', { name: /الأهلي/ });
    await userEvent.keyboard('{ArrowDown}');
    expect(input).toHaveAttribute('aria-activedescendant', screen.getByRole('option', { name: /الأهلي/ }).id);
    await userEvent.keyboard('{Enter}');
    expect(screen.getByTestId('where')).toHaveTextContent('/ar/football/team/1');
  });

  it('opens the full results page with Enter when no result is highlighted', async () => {
    const { input } = setup();
    await userEvent.type(input, 'صلاح{Enter}');
    expect(screen.getByTestId('where')).toHaveTextContent('/ar/search?q=صلاح');
  });

  it('asks for two characters and closes with Escape', async () => {
    const { search, input } = setup();
    await userEvent.type(input, 'ا');
    expect(screen.getByText('اكتب حرفين على الأقل.')).toBeInTheDocument();
    expect(search).not.toHaveBeenCalled();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByText('اكتب حرفين على الأقل.')).toBeNull();
  });
});
