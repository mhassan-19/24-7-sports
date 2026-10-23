import { describe, expect, it, jest } from '@jest/globals';
import { ApiError } from '@sports247/api';
import { act, fireEvent, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { renderWithApp } from '../test/render';
import { EmptyState, QueryView } from './states';

const q = <T,>(over: Partial<{ data: T; error: unknown; isPending: boolean }> = {}) => ({
  data: undefined as T | undefined,
  error: null as unknown,
  isPending: false,
  refetch: jest.fn(),
  ...over,
});

describe('QueryView', () => {
  it('shows a busy skeleton while loading', async () => {
    jest.useFakeTimers();
    await renderWithApp(<QueryView query={q({ isPending: true })}>{() => null}</QueryView>);
    await act(async () => jest.advanceTimersByTime(300));
    expect(screen.getByLabelText('جارٍ التحميل')).toBeTruthy();
    jest.useRealTimers();
  });

  it('shows an error with retry when there is no data', async () => {
    const query = q({ error: new ApiError('network', 'offline') });
    await renderWithApp(<QueryView query={query}>{() => null}</QueryView>);
    await fireEvent.press(screen.getByRole('button'));
    expect(query.refetch).toHaveBeenCalled();
  });

  it('keeps cached data when a refetch fails', async () => {
    await renderWithApp(<QueryView query={q({ data: ['x'], error: new Error('boom') })}>{(d) => <Text>{d[0]}</Text>}</QueryView>);
    expect(screen.getByText('x')).toBeTruthy();
  });

  it('renders the empty state', async () => {
    await renderWithApp(
      <QueryView query={q({ data: [] as string[] })} isEmpty={(d) => !d.length} empty={<EmptyState message="لا شيء" />}>
        {() => null}
      </QueryView>,
    );
    expect(screen.getByText('لا شيء')).toBeTruthy();
  });

  it('says "not found" without a retry for 404s', async () => {
    await renderWithApp(<QueryView query={q({ error: new ApiError('http', 'nf', { status: 404 }) })}>{() => null}</QueryView>);
    expect(screen.getByText('هذه الصفحة غير موجودة.')).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });
});
