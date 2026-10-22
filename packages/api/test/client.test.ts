import { describe, expect, it, vi } from 'vitest';
import { ApiError, buildUrl, createApiClient, encodeForm } from '../src/client';

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

describe('buildUrl', () => {
  it('joins paths, strips a leading /api/ and drops empty params', () => {
    expect(buildUrl('https://x.test/api/', '/api/guess-games/5/answer')).toBe('https://x.test/api/guess-games/5/answer');
    expect(buildUrl('https://x.test/api', 'matches', { a: 1, b: '', c: null })).toBe('https://x.test/api/matches?a=1');
  });
});

describe('encodeForm', () => {
  it('encodes arrays the way Laravel reads them', () => {
    expect(encodeForm({ user_identifier: 'u', answer: [1, 2] })).toBe('user_identifier=u&answer%5B%5D=1&answer%5B%5D=2');
  });
});

describe('createApiClient', () => {
  it('blocks writes to production hosts unless allowed', async () => {
    const fetchImpl = vi.fn();
    const client = createApiClient({ baseUrl: 'https://v3.appkora.com/api', allowProductionWrites: false, fetchImpl });
    await expect(client.postForm('x', {})).rejects.toMatchObject({ kind: 'blocked' });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('allows writes to the test host', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(json(200, { ok: true }));
    const client = createApiClient({ baseUrl: 'https://testv3.appkora.com/api', allowProductionWrites: false, fetchImpl });
    await expect(client.postForm('x', { a: 1 })).resolves.toEqual({ ok: true });
    expect(fetchImpl.mock.calls[0]![1].headers['Content-Type']).toBe('application/x-www-form-urlencoded');
  });

  it('turns 422 into a validation error with field errors', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(json(422, { message: 'bad', errors: { answer: ['required'] } }));
    const client = createApiClient({ baseUrl: 'https://testv3.appkora.com/api', allowProductionWrites: false, fetchImpl });
    const err = await client.postForm('x', {}).catch((e: ApiError) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({ kind: 'validation', status: 422, fieldErrors: { answer: ['required'] } });
  });

  it('never keeps Laravel debug messages', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(json(404, { message: 'No query results for model', exception: 'X', trace: [] }));
    const client = createApiClient({ baseUrl: 'https://testv3.appkora.com/api', allowProductionWrites: false, fetchImpl });
    const err = await client.get('players/0/details').catch((e: ApiError) => e);
    expect(err).toMatchObject({ kind: 'http', status: 404, serverMessage: null });
    expect((err as ApiError).isNotFound).toBe(true);
  });

  it('reports network failures as network errors', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    const client = createApiClient({ baseUrl: 'https://testv3.appkora.com/api', allowProductionWrites: false, fetchImpl });
    await expect(client.get('x')).rejects.toMatchObject({ kind: 'network' });
  });
});
