import { describe, expect, it } from 'vitest';
import { apiInstant, egyptDateTime } from '../src/read';

// API dates are wall time at a fixed UTC+3; Cairo is UTC+3 in summer and UTC+2 in winter.
// Egypt 2026: summer time from Fri 24 Apr 00:00 to Thu 29 Oct 24:00.
describe('egyptDateTime', () => {
  it('keeps summer times (Cairo is UTC+3 too)', () => {
    expect(egyptDateTime('2026-10-22 16:40:00')).toBe('2026-10-22T16:40');
    expect(egyptDateTime('2026-04-24 12:00:00')).toBe('2026-04-24T12:00');
  });

  it('moves winter times back an hour', () => {
    expect(egyptDateTime('2026-11-05 21:00:00')).toBe('2026-11-05T20:00');
    expect(egyptDateTime('2026-01-19 23:00:00')).toBe('2026-01-19T22:00');
    expect(egyptDateTime('2026-04-23 12:00:00')).toBe('2026-04-23T11:00');
  });

  it('switches on the night summer time ends', () => {
    expect(egyptDateTime('2026-10-29 23:30:00')).toBe('2026-10-29T23:30');
    expect(egyptDateTime('2026-10-30 12:00:00')).toBe('2026-10-30T11:00');
  });

  it('crosses midnight when needed', () => {
    expect(egyptDateTime('2026-12-01 00:30:00')).toBe('2026-11-30T23:30');
  });

  it('keeps date-only values and rejects junk', () => {
    expect(egyptDateTime('2026-12-01')).toBe('2026-12-01T00:00');
    expect(egyptDateTime('2026-12-01T18:05:00')).toBe('2026-12-01T17:05');
    expect(egyptDateTime('')).toBe('');
    expect(egyptDateTime(null)).toBe('');
  });
});

describe('apiInstant', () => {
  it('reads API wall time as UTC+3 all year', () => {
    expect(apiInstant('2026-10-22 17:48:18')).toBe('2026-10-22T14:48:18.000Z');
    expect(apiInstant('2026-12-01 20:00:00')).toBe('2026-12-01T17:00:00.000Z');
    expect(apiInstant('2026-12-01')).toBeNull();
  });
});
