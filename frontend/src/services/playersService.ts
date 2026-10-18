import { apiClient, buildQueryString } from './apiClient';
import type {
  CreatePlayerRequest,
  PaginatedPlayersResponse,
  PlayerFilters,
  PlayerResponse,
  UpdatePlayerConditionRequest,
  UpdatePlayerRequest,
} from '../types/api';

export const playersService = {
  list(filters?: PlayerFilters): Promise<PaginatedPlayersResponse> {
    const query = filters
      ? buildQueryString({
          search:
            filters.search && filters.search.trim().length > 0
              ? filters.search.trim()
              : undefined,
          position: filters.position || undefined,
          condition: filters.condition || undefined,
          free: filters.free,
          club_id: filters.club_id || undefined,
          min_age: filters.min_age !== '' ? filters.min_age : undefined,
          max_age: filters.max_age !== '' ? filters.max_age : undefined,
          min_value: filters.min_value !== '' ? filters.min_value : undefined,
          max_value: filters.max_value !== '' ? filters.max_value : undefined,
          sort: filters.sort || undefined,
          page: filters.page ?? 1,
          limit: filters.limit ?? 10,
        })
      : '?page=1&limit=10';
    return apiClient.get<PaginatedPlayersResponse>(`/players${query}`);
  },

  getById(id: number): Promise<PlayerResponse> {
    return apiClient.get<PlayerResponse>(`/players/${id}`);
  },

  create(payload: CreatePlayerRequest): Promise<PlayerResponse> {
    return apiClient.post<PlayerResponse>('/players', payload);
  },

  update(id: number, payload: UpdatePlayerRequest): Promise<PlayerResponse> {
    return apiClient.put<PlayerResponse>(`/players/${id}`, payload);
  },

  updateCondition(
    id: number,
    payload: UpdatePlayerConditionRequest
  ): Promise<PlayerResponse> {
    return apiClient.patch<PlayerResponse>(`/players/${id}/condition`, payload);
  },

  remove(id: number): Promise<void> {
    return apiClient.delete<void>(`/players/${id}`);
  },
};
