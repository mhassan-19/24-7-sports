// Lenient readers for API payloads. The API mixes strings and numbers, uses nulls freely and
// sometimes omits fields, so every mapper goes through these instead of trusting the shape.

export type Raw = Record<string, unknown>;

/** Images are served from the production host in every environment; some paths are relative. */
export const IMAGE_HOST = 'https://v3.appkora.com/';

export const obj = (v: unknown): Raw => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Raw) : {});
export const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
export const objs = (v: unknown): Raw[] => arr(v).map(obj);

export function num(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v))) return Number(v);
  return null;
}
export const num0 = (v: unknown): number => num(v) ?? 0;
/** Positive number or null: the API sends 0 for unknown ages, heights and weights. */
export const pos = (v: unknown): number | null => {
  const n = num(v);
  return n != null && n > 0 ? n : null;
};

export function str(v: unknown): string | null {
  if (typeof v === 'string') {
    const s = v.trim();
    return s && s !== '--' ? s : null;
  }
  if (typeof v === 'number') return String(v);
  return null;
}
export const str0 = (v: unknown): string => str(v) ?? '';

export const bool = (v: unknown): boolean => v === true || v === 1 || v === '1' || v === 'true';

export function img(v: unknown): string | null {
  const s = str(v);
  if (!s) return null;
  if (/^https?:\/\//.test(s)) return s;
  return IMAGE_HOST + s.replace(/^\/+/, '');
}

/** `2026-01-19 23:00:00` (Egypt wall clock) → `2026-01-19T23:00`. */
export function egyptDateTime(v: unknown): string {
  const s = str0(v);
  const m = s.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}):(\d{2})/);
  if (m) return `${m[1]}T${m[2]}:${m[3]}`;
  const d = s.match(/^(\d{4}-\d{2}-\d{2})/);
  return d ? `${d[1]}T00:00` : '';
}

/** Unwraps `{ data }` envelopes; returns the input when there is no envelope. */
export const data = (body: unknown): unknown => {
  const o = obj(body);
  return 'data' in o ? o.data : body;
};
