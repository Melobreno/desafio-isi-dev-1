import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '../services/apiClient';
import { useLeagueSummary } from '../context/LeagueSummaryContext';

interface AsyncResourceState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}

export interface AsyncResource<T> extends AsyncResourceState<T> {
  reload: () => void;
}

/**
 * Loads data through a service function and exposes loading, error and reload state.
 * Reloads automatically whenever the fetcher identity changes (wrap it in `useCallback`
 * with its inputs) or the league summary is refreshed after a write operation.
 * Keeps the previous data visible while reloading, and ignores stale responses.
 */
export function useAsyncResource<T>(
  fetcher: () => Promise<T>,
  fallbackError = 'Não foi possível conectar ao servidor da API.'
): AsyncResource<T> {
  const { refreshVersion } = useLeagueSummary();
  const [state, setState] = useState<AsyncResourceState<T>>({
    data: null,
    isLoading: true,
    error: null,
  });
  const [reloadTick, setReloadTick] = useState(0);

  const reload = useCallback(() => setReloadTick((prev) => prev + 1), []);

  useEffect(() => {
    let active = true;

    Promise.resolve()
      .then(() => {
        if (!active) return null;
        setState((prev) => ({ ...prev, isLoading: true, error: null }));
        return fetcher().then((data) => ({ data }));
      })
      .then((result) => {
        if (active && result) {
          setState({ data: result.data, isLoading: false, error: null });
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: err instanceof ApiError ? err.message : fallbackError,
          }));
        }
      });

    return () => {
      active = false;
    };
  }, [fetcher, fallbackError, reloadTick, refreshVersion]);

  return { ...state, reload };
}
