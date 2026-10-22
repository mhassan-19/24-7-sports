const KEY = 'sports247.guestId';

/**
 * Anonymous device id sent as `user_identifier` for games (README Q4: device UUID rather than IP,
 * which mobile carriers share between many users). Falls back to a per-session id when storage
 * is unavailable.
 */
export function getGuestId(): string {
  try {
    const existing = localStorage.getItem(KEY);
    if (existing) return existing;
    const id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
    return id;
  } catch {
    return crypto.randomUUID();
  }
}
