import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ClubResponse, MatchSummary } from '../types/api';
import { clubsService } from '../services/clubsService';
import { playersService } from '../services/playersService';
import { leagueService } from '../services/leagueService';

export interface LeagueRefreshDiff {
  newClubs: number;
  newPlayers: number;
  newMatches: number;
  totalClubs: number;
  totalPlayers: number;
  totalMatches: number;
  hasUpdates: boolean;
  lastAlteredAt: Date | null;
  checkedAt: Date;
}

interface PersistedTrackerState {
  initialized: boolean;
  lastKnownTotals: {
    clubs: number;
    players: number;
    matches: number;
  };
  unacknowledgedDelta: {
    clubs: number;
    players: number;
    matches: number;
    updatedAtIso: string | null;
  };
  lastAlteration: {
    clubs: number;
    players: number;
    matches: number;
    updatedAtIso: string | null;
  };
}

const STORAGE_KEY = 'passe_league_tracker_v1';

function loadTrackerState(): PersistedTrackerState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PersistedTrackerState>;
      if (parsed && typeof parsed === 'object' && parsed.lastKnownTotals) {
        return {
          initialized: Boolean(parsed.initialized),
          lastKnownTotals: {
            clubs: Number(parsed.lastKnownTotals.clubs) || 0,
            players: Number(parsed.lastKnownTotals.players) || 0,
            matches: Number(parsed.lastKnownTotals.matches) || 0,
          },
          unacknowledgedDelta: {
            clubs: Number(parsed.unacknowledgedDelta?.clubs) || 0,
            players: Number(parsed.unacknowledgedDelta?.players) || 0,
            matches: Number(parsed.unacknowledgedDelta?.matches) || 0,
            updatedAtIso: parsed.unacknowledgedDelta?.updatedAtIso ?? null,
          },
          lastAlteration: {
            clubs: Number(parsed.lastAlteration?.clubs) || 0,
            players: Number(parsed.lastAlteration?.players) || 0,
            matches: Number(parsed.lastAlteration?.matches) || 0,
            updatedAtIso: parsed.lastAlteration?.updatedAtIso ?? null,
          },
        };
      }
    }
  } catch {
    // Ignore storage read errors
  }

  return {
    initialized: false,
    lastKnownTotals: { clubs: 0, players: 0, matches: 0 },
    unacknowledgedDelta: { clubs: 0, players: 0, matches: 0, updatedAtIso: null },
    lastAlteration: { clubs: 0, players: 0, matches: 0, updatedAtIso: null },
  };
}

function saveTrackerState(state: PersistedTrackerState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage write errors
  }
}

interface LeagueSummaryContextValue {
  clubs: ClubResponse[];
  clubsMap: Record<number, ClubResponse>;
  totalPlayers: number;
  freePlayersCount: number;
  clubPlayersCount: number;
  matches: MatchSummary[];
  latestMatch: MatchSummary | null;
  isLoadingSummary: boolean;
  hasUnseenUpdates: boolean;
  lastDiff: LeagueRefreshDiff;
  refreshVersion: number;
  refreshSummary: (mode?: 'silent' | 'manual') => Promise<LeagueRefreshDiff>;
  openCreateClubModal: () => void;
  closeCreateClubModal: () => void;
  isCreateClubModalOpen: boolean;
}

export const LeagueSummaryContext = createContext<LeagueSummaryContextValue | undefined>(
  undefined
);

export const LeagueSummaryProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [clubs, setClubs] = useState<ClubResponse[]>([]);
  const [totalPlayers, setTotalPlayers] = useState<number>(0);
  const [freePlayersCount, setFreePlayersCount] = useState<number>(0);
  const [clubPlayersCount, setClubPlayersCount] = useState<number>(0);
  const [matches, setMatches] = useState<MatchSummary[]>([]);
  const [isLoadingSummary, setIsLoadingSummary] = useState<boolean>(true);
  const [refreshVersion, setRefreshVersion] = useState<number>(0);
  const [isCreateClubModalOpen, setIsCreateClubModalOpen] = useState<boolean>(false);

  const trackerRef = useRef<PersistedTrackerState>(loadTrackerState());

  const [hasUnseenUpdates, setHasUnseenUpdates] = useState<boolean>(() => {
    const u = loadTrackerState().unacknowledgedDelta;
    return u.clubs !== 0 || u.players !== 0 || u.matches !== 0;
  });

  const [lastDiff, setLastDiff] = useState<LeagueRefreshDiff>(() => {
    const t = loadTrackerState();
    const alt = t.lastAlteration;
    return {
      newClubs: alt.clubs,
      newPlayers: alt.players,
      newMatches: alt.matches,
      totalClubs: t.lastKnownTotals.clubs,
      totalPlayers: t.lastKnownTotals.players,
      totalMatches: t.lastKnownTotals.matches,
      hasUpdates: alt.clubs !== 0 || alt.players !== 0 || alt.matches !== 0,
      lastAlteredAt: alt.updatedAtIso ? new Date(alt.updatedAtIso) : null,
      checkedAt: new Date(),
    };
  });

  const refreshSummary = useCallback(
    async (mode: 'silent' | 'manual' = 'silent'): Promise<LeagueRefreshDiff> => {
      try {
        const [clubsList, allPlayersPage, freePlayersPage, matchesList] =
          await Promise.all([
            clubsService.list().catch(() => [] as ClubResponse[]),
            playersService.list({ page: 1, limit: 1 }).catch(() => null),
            playersService.list({ page: 1, limit: 1, free: true }).catch(() => null),
            leagueService.listMatches().catch(() => [] as MatchSummary[]),
          ]);

        const tracker = trackerRef.current;
        const nextClubs = clubsList.length;
        const nextPlayers = allPlayersPage
          ? allPlayersPage.meta.total_items
          : tracker.lastKnownTotals.players;
        const nextFree = freePlayersPage ? freePlayersPage.meta.total_items : 0;
        const nextMatches = matchesList.length;
        const now = new Date();
        const nowIso = now.toISOString();

        if (!tracker.initialized) {
          tracker.initialized = true;
          tracker.lastKnownTotals = {
            clubs: nextClubs,
            players: nextPlayers,
            matches: nextMatches,
          };
          saveTrackerState(tracker);
        } else {
          const deltaClubs = nextClubs - tracker.lastKnownTotals.clubs;
          const deltaPlayers = nextPlayers - tracker.lastKnownTotals.players;
          const deltaMatches = nextMatches - tracker.lastKnownTotals.matches;

          if (deltaClubs !== 0 || deltaPlayers !== 0 || deltaMatches !== 0) {
            tracker.unacknowledgedDelta = {
              clubs: tracker.unacknowledgedDelta.clubs + deltaClubs,
              players: tracker.unacknowledgedDelta.players + deltaPlayers,
              matches: tracker.unacknowledgedDelta.matches + deltaMatches,
              updatedAtIso: nowIso,
            };
            tracker.lastAlteration = { ...tracker.unacknowledgedDelta };
            tracker.lastKnownTotals = {
              clubs: nextClubs,
              players: nextPlayers,
              matches: nextMatches,
            };
            saveTrackerState(tracker);
          }
        }

        const pending = tracker.unacknowledgedDelta;
        const hasPending =
          pending.clubs !== 0 || pending.players !== 0 || pending.matches !== 0;

        if (mode === 'manual' && hasPending) {
          tracker.lastAlteration = { ...pending };
          tracker.unacknowledgedDelta = {
            clubs: 0,
            players: 0,
            matches: 0,
            updatedAtIso: null,
          };
          saveTrackerState(tracker);
          setHasUnseenUpdates(false);
        } else {
          setHasUnseenUpdates(hasPending);
        }

        const displaySource =
          tracker.unacknowledgedDelta.clubs !== 0 ||
          tracker.unacknowledgedDelta.players !== 0 ||
          tracker.unacknowledgedDelta.matches !== 0
            ? tracker.unacknowledgedDelta
            : tracker.lastAlteration;

        const hasAnyAlteration =
          displaySource.clubs !== 0 ||
          displaySource.players !== 0 ||
          displaySource.matches !== 0;

        const diffResult: LeagueRefreshDiff = {
          newClubs: displaySource.clubs,
          newPlayers: displaySource.players,
          newMatches: displaySource.matches,
          totalClubs: nextClubs,
          totalPlayers: nextPlayers,
          totalMatches: nextMatches,
          hasUpdates: hasAnyAlteration,
          lastAlteredAt: displaySource.updatedAtIso
            ? new Date(displaySource.updatedAtIso)
            : null,
          checkedAt: now,
        };

        setClubs(clubsList);
        setTotalPlayers(nextPlayers);
        setFreePlayersCount(nextFree);
        setClubPlayersCount(Math.max(0, nextPlayers - nextFree));
        setMatches(matchesList);
        setLastDiff(diffResult);
        setRefreshVersion((v) => v + 1);

        return diffResult;
      } finally {
        setIsLoadingSummary(false);
      }
    },
    []
  );

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) {
        void refreshSummary('silent');
      }
    });
    return () => {
      active = false;
    };
  }, [refreshSummary]);

  const clubsMap = useMemo(() => {
    const map: Record<number, ClubResponse> = {};
    for (const c of clubs) {
      map[c.id] = c;
    }
    return map;
  }, [clubs]);

  const latestMatch = useMemo(() => {
    if (matches.length === 0) return null;
    return matches[0];
  }, [matches]);

  const openCreateClubModal = useCallback(() => setIsCreateClubModalOpen(true), []);
  const closeCreateClubModal = useCallback(() => setIsCreateClubModalOpen(false), []);

  return (
    <LeagueSummaryContext.Provider
      value={{
        clubs,
        clubsMap,
        totalPlayers,
        freePlayersCount,
        clubPlayersCount,
        matches,
        latestMatch,
        isLoadingSummary,
        hasUnseenUpdates,
        lastDiff,
        refreshVersion,
        refreshSummary,
        openCreateClubModal,
        closeCreateClubModal,
        isCreateClubModalOpen,
      }}
    >
      {children}
    </LeagueSummaryContext.Provider>
  );
};

export function useLeagueSummary(): LeagueSummaryContextValue {
  const ctx = useContext(LeagueSummaryContext);
  if (!ctx) {
    throw new Error(
      'useLeagueSummary deve ser utilizado dentro de um LeagueSummaryProvider'
    );
  }
  return ctx;
}
