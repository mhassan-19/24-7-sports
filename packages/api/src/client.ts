export type AppEnv = 'test' | 'production';

/** Hosts that must never receive writes from a development or test build. */
export const PRODUCTION_HOSTS = ['v3.appkora.com'];

export type ApiErrorKind = 'network' | 'timeout' | 'http' | 'validation' | 'parse' | 'blocked';

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status: number | null;
  readonly fieldErrors: Record<string, string[]>;
  /** Message from the API body, when it sent one. Laravel debug traces are never kept. */
  readonly serverMessage: string | null;

  constructor(
    kind: ApiErrorKind,
    message: string,
    opts: { status?: number | null; fieldErrors?: Record<string, string[]>; serverMessage?: string | null } = {},
  ) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = opts.status ?? null;
    this.fieldErrors = opts.fieldErrors ?? {};
    this.serverMessage = opts.serverMessage ?? null;
  }

  get isNotFound() {
    return this.status === 404;
  }
}

export interface ApiClientOptions {
  baseUrl: string;
  /** Development and test builds refuse writes to production hosts. */
  allowProductionWrites: boolean;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

export type Query = Record<string, string | number | boolean | null | undefined>;
export type FormBody = Record<string, string | number | (string | number)[] | null | undefined>;

export interface ApiClient {
  readonly baseUrl: string;
  get<T = unknown>(path: string, query?: Query): Promise<T>;
  /**
   * POST as application/x-www-form-urlencoded. Form posts are "simple" CORS requests, so they
   * skip the preflight that production does not allow for POST.
   */
  postForm<T = unknown>(path: string, body: FormBody): Promise<T>;
}

export function buildUrl(baseUrl: string, path: string, query?: Query): string {
  const base = baseUrl.replace(/\/+$/, '');
  const clean = path.replace(/^\/+/, '').replace(/^api\//, '');
  const url = new URL(`${base}/${clean}`);
  for (const [k, v] of Object.entries(query ?? {})) {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  }
  return url.toString();
}

export function encodeForm(body: FormBody): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(body)) {
    if (v === undefined || v === null) continue;
    if (Array.isArray(v)) v.forEach((item) => params.append(`${k}[]`, String(item)));
    else params.append(k, String(v));
  }
  return params.toString();
}

async function readJson(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    throw new ApiError('parse', `Invalid JSON from ${res.url}`, { status: res.status });
  }
}

function toHttpError(status: number, body: unknown): ApiError {
  const b = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;
  // Laravel debug bodies carry `exception`/`trace`; their message is not meant for users.
  const isDebug = 'exception' in b || 'trace' in b;
  const serverMessage = !isDebug && typeof b.message === 'string' ? b.message : null;
  if (status === 422 && b.errors && typeof b.errors === 'object') {
    return new ApiError('validation', 'Validation failed', {
      status,
      fieldErrors: b.errors as Record<string, string[]>,
      serverMessage,
    });
  }
  return new ApiError('http', `HTTP ${status}`, { status, serverMessage });
}

export function createApiClient(opts: ApiClientOptions): ApiClient {
  const fetchImpl = opts.fetchImpl ?? ((...args: Parameters<typeof fetch>) => fetch(...args));
  const timeoutMs = opts.timeoutMs ?? 15000;
  const host = new URL(opts.baseUrl).host;

  async function request<T>(method: 'GET' | 'POST', url: string, init: RequestInit): Promise<T> {
    if (method !== 'GET' && PRODUCTION_HOSTS.includes(host) && !opts.allowProductionWrites) {
      throw new ApiError('blocked', `Writes to ${host} are blocked in this build`);
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    let res: Response;
    try {
      res = await fetchImpl(url, {
        ...init,
        method,
        signal: controller.signal,
        headers: { Accept: 'application/json', ...(init.headers ?? {}) },
      });
    } catch (e) {
      const aborted = (e as Error)?.name === 'AbortError';
      throw new ApiError(aborted ? 'timeout' : 'network', aborted ? 'Request timed out' : 'Network error');
    } finally {
      clearTimeout(timer);
    }
    const body = await readJson(res);
    if (!res.ok) throw toHttpError(res.status, body);
    return body as T;
  }

  return {
    baseUrl: opts.baseUrl,
    get: (path, query) => request('GET', buildUrl(opts.baseUrl, path, query), {}),
    postForm: (path, body) =>
      request('POST', buildUrl(opts.baseUrl, path), {
        body: encodeForm(body),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }),
  };
}
