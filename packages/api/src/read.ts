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

/** Image URL, or null for none and for the API's shared "no-photo" placeholder. */
export function img(v: unknown): string | null {
  const s = str(v);
  if (!s || /\/no-photo\.(png|jpe?g)$/i.test(s)) return null;
  if (/^https?:\/\//.test(s)) return s;
  return IMAGE_HOST + s.replace(/^\/+/, '');
}

let cairoWall: Intl.DateTimeFormat | undefined;

/**
 * API date (wall time at a fixed UTC+3, see `apiInstant`) → Cairo wall time, which is UTC+2 in
 * winter and UTC+3 in summer: `2026-01-19 23:00:00` → `2026-01-19T22:00`. Date-only values keep
 * their date at `T00:00`.
 */
export function egyptDateTime(v: unknown): string {
  const iso = apiInstant(v);
  if (iso) {
    try {
      cairoWall ??= new Intl.DateTimeFormat('en-US', {
        timeZone: 'Africa/Cairo',
        hour12: false,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
      const p = Object.fromEntries(cairoWall.formatToParts(new Date(iso)).map((x) => [x.type, x.value]));
      return `${p.year}-${p.month}-${p.day}T${String(+p.hour! % 24).padStart(2, '0')}:${p.minute}`;
    } catch {
      // No time zone data in this runtime: show the API's wall time unchanged.
    }
  }
  const m = str0(v).match(/^(\d{4}-\d{2}-\d{2})(?:[ T](\d{2}):(\d{2}))?/);
  return m ? `${m[1]}T${m[2] ?? '00'}:${m[3] ?? '00'}` : '';
}

/** Unwraps `{ data }` envelopes; returns the input when there is no envelope. */
export const data = (body: unknown): unknown => {
  const o = obj(body);
  return 'data' in o ? o.data : body;
};

/**
 * API timestamps such as `matchRoundInfo.created_at` are wall time at a fixed UTC+3, without an
 * offset ("2026-10-22 17:48:18"): `date` is 3 h ahead of the provider's UTC `time` in every month
 * sampled, winter included. Returns the ISO instant, or null when unreadable.
 */
export function apiInstant(v: unknown): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/.exec(str(v) ?? '');
  if (!m) return null;
  return new Date(Date.UTC(+m[1]!, +m[2]! - 1, +m[3]!, +m[4]! - 3, +m[5]!, +(m[6] ?? 0))).toISOString();
}
