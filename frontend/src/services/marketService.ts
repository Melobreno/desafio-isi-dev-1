import { apiClient, buildQueryString } from './apiClient';
import type {
  BuyPlayerRequest,
  BuyPlayerResponse,
  ClubTransactionsResponse,
  SellPlayerResponse,
} from '../types/api';

export interface ClubTransactionFilters {
  type?: string;
  player_id?: number | '';
}

export const marketService = {
  buy(playerId: number, payload: BuyPlayerRequest): Promise<BuyPlayerResponse> {
    return apiClient.post<BuyPlayerResponse>(`/players/${playerId}/buy`, payload);
  },

  sell(playerId: number): Promise<SellPlayerResponse> {
    return apiClient.post<SellPlayerResponse>(`/players/${playerId}/sell`);
  },

  listClubTransactions(
    clubId: number,
    filters?: ClubTransactionFilters
  ): Promise<ClubTransactionsResponse> {
    const query = filters
      ? buildQueryString({
          type: filters.type || undefined,
          player_id: filters.player_id || undefined,
        })
      : '';
    return apiClient.get<ClubTransactionsResponse>(
      `/clubs/${clubId}/transactions${query}`
    );
  },

  exportClubTransactionsCsv(
    clubId: number,
    filters?: ClubTransactionFilters
  ): Promise<string> {
    const query = filters
      ? buildQueryString({
          type: filters.type || undefined,
          player_id: filters.player_id || undefined,
        })
      : '';
    return apiClient.getText(`/clubs/${clubId}/transactions/export${query}`);
  },
};
