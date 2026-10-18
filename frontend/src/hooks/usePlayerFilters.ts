import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  PlayerCondition,
  PlayerFilters,
  PlayerPosition,
  PlayerSortOption,
} from '../types/api';

export type AvailabilityTab = 'ALL' | 'FREE' | 'CLUB';

export interface PlayerCriteria {
  availabilityTab: AvailabilityTab;
  position: PlayerPosition | '';
  condition: PlayerCondition | '';
  clubId: number | '';
  minAge: string;
  maxAge: string;
  minValue: string;
  maxValue: string;
  sort: PlayerSortOption;
}

const INITIAL_CRITERIA: PlayerCriteria = {
  availabilityTab: 'ALL',
  position: '',
  condition: '',
  clubId: '',
  minAge: '',
  maxAge: '',
  minValue: '',
  maxValue: '',
  sort: 'name',
};

const SEARCH_DEBOUNCE_MS = 250;
export const PLAYERS_PAGE_SIZE = 10;

function toNumberOrUndefined(value: string): number | undefined {
  return value !== '' ? Number(value) : undefined;
}

/**
 * Filter, sort and pagination state of the players list. Any criteria change goes back to
 * page 1; the search text is debounced before being applied.
 */
export function usePlayerFilters() {
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [criteria, setCriteria] = useState<PlayerCriteria>(INITIAL_CRITERIA);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAppliedSearch(searchInput.trim());
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const updateCriteria = useCallback((patch: Partial<PlayerCriteria>) => {
    setCriteria((prev) => ({ ...prev, ...patch }));
    setPage(1);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchInput('');
    setAppliedSearch('');
    setPage(1);
  }, []);

  const clearAll = useCallback(() => {
    setSearchInput('');
    setAppliedSearch('');
    setCriteria(INITIAL_CRITERIA);
    setPage(1);
  }, []);

  const queryFilters: PlayerFilters = useMemo(() => {
    const {
      availabilityTab,
      position,
      condition,
      clubId,
      minAge,
      maxAge,
      minValue,
      maxValue,
    } = criteria;
    const free =
      availabilityTab === 'FREE' ? true : availabilityTab === 'CLUB' ? false : undefined;

    return {
      search: appliedSearch || undefined,
      position: position || undefined,
      condition: condition || undefined,
      free,
      club_id: availabilityTab !== 'FREE' && clubId !== '' ? Number(clubId) : undefined,
      min_age: toNumberOrUndefined(minAge),
      max_age: toNumberOrUndefined(maxAge),
      min_value: toNumberOrUndefined(minValue),
      max_value: toNumberOrUndefined(maxValue),
      sort: criteria.sort,
      page,
      limit: PLAYERS_PAGE_SIZE,
    };
  }, [appliedSearch, criteria, page]);

  const ageFilterActive = criteria.minAge !== '' || criteria.maxAge !== '';
  const valueFilterActive = criteria.minValue !== '' || criteria.maxValue !== '';
  const hasNonTabFilters =
    Boolean(appliedSearch) ||
    criteria.position !== '' ||
    criteria.condition !== '' ||
    criteria.clubId !== '' ||
    ageFilterActive ||
    valueFilterActive;
  const hasAnyActiveFilter =
    hasNonTabFilters || criteria.availabilityTab !== 'ALL' || criteria.sort !== 'name';

  return {
    searchInput,
    setSearchInput,
    appliedSearch,
    clearSearch,
    criteria,
    updateCriteria,
    page,
    setPage,
    queryFilters,
    ageFilterActive,
    valueFilterActive,
    hasNonTabFilters,
    hasAnyActiveFilter,
    clearAll,
  };
}

export type PlayerFilterState = ReturnType<typeof usePlayerFilters>;
