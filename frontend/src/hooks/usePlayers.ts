import { useCallback } from 'react';
import type { PageMeta, PlayerFilters, PlayerResponse } from '../types/api';
import { playersService } from '../services/playersService';
import { useAsyncResource } from './useAsyncResource';

const NO_PLAYERS: PlayerResponse[] = [];

export function usePlayers(filters: PlayerFilters) {
  const fetchPlayers = useCallback(() => playersService.list(filters), [filters]);
  const { data, isLoading, error, reload } = useAsyncResource(fetchPlayers);

  const meta: PageMeta = data?.meta ?? {
    page: filters.page ?? 1,
    limit: filters.limit ?? 10,
    total_items: 0,
    total_pages: 0,
  };

  return {
    players: data?.data ?? NO_PLAYERS,
    meta,
    isLoading,
    error,
    refetch: reload,
  };
}
