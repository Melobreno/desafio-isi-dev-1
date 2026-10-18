import { useCallback, useMemo, useState } from 'react';
import type { TransactionItem, TransactionSummary } from '../types/api';
import { marketService, type ClubTransactionFilters } from '../services/marketService';
import { useAsyncResource } from './useAsyncResource';

const NO_TRANSACTIONS: TransactionItem[] = [];

export const EMPTY_TRANSACTION_SUMMARY: TransactionSummary = {
  total_spent: 0,
  total_received: 0,
  total_fees: 0,
  total_penalties: 0,
  total_profit: 0,
};

export interface TransactionPlayerOption {
  id: number;
  name: string;
}

/**
 * Club transaction history with its filters (type checkboxes and player).
 * Keeps an unfiltered request for the tab counter and the player options, and sends the
 * active filters to the API for the table and the `summary` totals.
 */
export function useClubTransactions(clubId: number) {
  const [includeCompra, setIncludeCompra] = useState(true);
  const [includeVenda, setIncludeVenda] = useState(true);
  const [playerId, setPlayerId] = useState<number | ''>('');

  const type: ClubTransactionFilters['type'] =
    includeCompra && !includeVenda
      ? 'COMPRA'
      : !includeCompra && includeVenda
        ? 'VENDA'
        : undefined;
  const hasActiveFilters = Boolean(type || playerId);

  const fetchAll = useCallback(
    () => marketService.listClubTransactions(clubId),
    [clubId]
  );
  const all = useAsyncResource(
    fetchAll,
    'Não foi possível carregar o histórico de transações.'
  );

  const fetchFiltered = useCallback(
    () =>
      hasActiveFilters
        ? marketService.listClubTransactions(clubId, { type, player_id: playerId })
        : Promise.resolve(null),
    [clubId, hasActiveFilters, type, playerId]
  );
  const filtered = useAsyncResource(
    fetchFiltered,
    'Não foi possível carregar o histórico de transações.'
  );

  const source = hasActiveFilters ? filtered : all;
  const response = hasActiveFilters ? filtered.data : all.data;

  const playerOptions = useMemo<TransactionPlayerOption[]>(() => {
    const unique = new Map<number, string>();
    for (const item of all.data?.data ?? NO_TRANSACTIONS) {
      if (!unique.has(item.player_id)) unique.set(item.player_id, item.player_name);
    }
    return Array.from(unique, ([id, name]) => ({ id, name }));
  }, [all.data]);

  /** Prevents unchecking both types: unchecking the last one re-enables the other. */
  const toggleType = (which: 'COMPRA' | 'VENDA') => {
    const isCompra = which === 'COMPRA';
    const thisChecked = isCompra ? includeCompra : includeVenda;
    const otherChecked = isCompra ? includeVenda : includeCompra;
    if (thisChecked && !otherChecked) {
      (isCompra ? setIncludeVenda : setIncludeCompra)(true);
      return;
    }
    (isCompra ? setIncludeCompra : setIncludeVenda)(!thisChecked);
  };

  const resetFilters = () => {
    setIncludeCompra(true);
    setIncludeVenda(true);
    setPlayerId('');
  };

  const reload = () => {
    all.reload();
    filtered.reload();
  };

  return {
    transactions: response?.data ?? NO_TRANSACTIONS,
    summary: response?.summary ?? EMPTY_TRANSACTION_SUMMARY,
    isLoading:
      source.isLoading || (hasActiveFilters && filtered.data === null && !filtered.error),
    error: source.error,
    reload,
    totalCount: all.data?.data.length ?? 0,
    playerOptions,
    filters: { includeCompra, includeVenda, playerId, type, hasActiveFilters },
    toggleType,
    setPlayerId,
    resetFilters,
  };
}
