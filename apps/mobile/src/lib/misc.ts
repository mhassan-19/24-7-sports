import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import type { SeasonQuery } from '@sports247/api';
import { useCompetition } from '@sports247/data';
import type { Id } from '@sports247/domain';
import { focusManager, onlineManager } from '@tanstack/react-query';
import { randomUUID } from 'expo-crypto';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

const GUEST_KEY = 'sports247.guestId';

/** Anonymous device id sent as `user_identifier` for games (device UUID, not IP). */
export async function loadGuestId(): Promise<string> {
  try {
    const existing = await AsyncStorage.getItem(GUEST_KEY);
    if (existing) return existing;
    const id = randomUUID();
    await AsyncStorage.setItem(GUEST_KEY, id);
    return id;
  } catch {
    return randomUUID();
  }
}

/** TanStack Query: refetch on app foreground, pause polling in background, track connectivity. */
export function wireQueryManagers() {
  focusManager.setEventListener((setFocused) => {
    const sub = AppState.addEventListener('change', (s) => setFocused(s === 'active'));
    return () => sub.remove();
  });
  onlineManager.setEventListener((setOnline) =>
    NetInfo.addEventListener((s) => setOnline(s.isConnected !== false)),
  );
}

export function useOnline(): boolean {
  const [online, setOnline] = useState(true);
  useEffect(() => NetInfo.addEventListener((s) => setOnline(s.isConnected !== false)), []);
  return online;
}

/** Competition shown on Home (table + top scorers): Premier League, as on the website. */
export const FEATURED_COMPETITION_ID = 3;

/** Season query: the requested season when valid, otherwise the competition's current season. */
export function useSeasonQuery(competitionId: Id, seasonParam?: string | null): SeasonQuery | null {
  const { data } = useCompetition(competitionId);
  if (!data) return null;
  const requested = seasonParam ? data.seasons.find((s) => String(s.id) === seasonParam) : undefined;
  const season = requested ?? data.currentSeason;
  return season ? { competitionId, seasonId: season.id } : null;
}
