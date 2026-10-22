import { ApiError } from '@sports247/api';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderWithApp } from '../test/render';
import { QueryView } from './states';

const q = (over: Partial<{ data: string[]; error: unknown; isPending: boolean }>) => ({
  data: undefined as string[] | undefined,
  error: null as unknown,
  isPending: false,
  refetch: vi.fn(),
  ...over,
});

describe('QueryView', () => {
  it('shows the skeleton only after 300 ms', () => {
    vi.useFakeTimers();
    renderWithApp(<QueryView query={q({ isPending: true })}>{() => 'data'}</QueryView>);
    const busy = document.querySelector('[aria-busy="true"]')!;
    expect(busy.children).toHaveLength(1); // only the screen-reader label
    act(() => vi.advanceTimersByTime(350));
    expect(busy.children.length).toBeGreaterThan(1);
    vi.useRealTimers();
  });

  it('shows an error with retry when there is no data', async () => {
    const query = q({ error: new ApiError('network', 'x') });
    renderWithApp(<QueryView query={query}>{() => 'data'}</QueryView>);
    expect(screen.getByRole('alert')).toHaveTextContent('تعذّر تحميل البيانات');
    await userEvent.click(screen.getByRole('button', { name: 'إعادة المحاولة' }));
    expect(query.refetch).toHaveBeenCalled();
  });

  it('says "not found" for a 404 and offers no retry', () => {
    renderWithApp(<QueryView query={q({ error: new ApiError('http', 'x', { status: 404 }) })}>{() => 'data'}</QueryView>);
    expect(screen.getByRole('alert')).toHaveTextContent('هذه الصفحة غير موجودة');
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('keeps showing cached data even when a refetch failed (offline)', () => {
    renderWithApp(<QueryView query={q({ data: ['cached'], error: new ApiError('network', 'x') })}>{(d) => d[0]}</QueryView>);
    expect(screen.getByText('cached')).toBeInTheDocument();
  });

  it('renders the empty state', () => {
    renderWithApp(
      <QueryView query={q({ data: [] })} isEmpty={(d) => !d.length} empty={<p>nothing</p>}>
        {() => 'data'}
      </QueryView>,
    );
    expect(screen.getByText('nothing')).toBeInTheDocument();
  });
});
