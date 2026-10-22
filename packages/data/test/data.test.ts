import { ApiError } from '@sports247/api';
import { describe, expect, it } from 'vitest';
import { keys, shouldRetry } from '../src';

describe('shouldRetry', () => {
  it('does not retry client errors or blocked writes', () => {
    expect(shouldRetry(0, new ApiError('http', 'x', { status: 404 }))).toBe(false);
    expect(shouldRetry(0, new ApiError('validation', 'x', { status: 422 }))).toBe(false);
    expect(shouldRetry(0, new ApiError('blocked', 'x'))).toBe(false);
  });

  it('retries network errors and 5xx twice', () => {
    expect(shouldRetry(0, new ApiError('network', 'x'))).toBe(true);
    expect(shouldRetry(1, new ApiError('http', 'x', { status: 503 }))).toBe(true);
    expect(shouldRetry(2, new ApiError('network', 'x'))).toBe(false);
  });
});

describe('query keys', () => {
  it('nests match parts under the match so one invalidation refreshes all', () => {
    expect(keys.events(5).slice(0, 2)).toEqual(keys.match(5));
  });
});
