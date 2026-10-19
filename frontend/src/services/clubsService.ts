import { apiClient, buildQueryString } from './apiClient';
import type {
  ClubDetailResponse,
  ClubResponse,
  ClubSortOption,
  CreateClubRequest,
  LineupResponse,
  SaveLineupRequest,
} from '../types/api';

export const clubsService = {
  list(sort?: ClubSortOption): Promise<ClubResponse[]> {
    const query = sort ? buildQueryString({ sort }) : '';
    return apiClient.get<ClubResponse[]>(`/clubs${query}`);
  },

  getById(id: number): Promise<ClubDetailResponse> {
    return apiClient.get<ClubDetailResponse>(`/clubs/${id}`);
  },

  create(payload: CreateClubRequest): Promise<ClubResponse> {
    return apiClient.post<ClubResponse>('/clubs', payload);
  },

  getLineup(clubId: number): Promise<LineupResponse> {
    return apiClient.get<LineupResponse>(`/clubs/${clubId}/lineup`);
  },

  saveLineup(clubId: number, payload: SaveLineupRequest): Promise<LineupResponse> {
    return apiClient.put<LineupResponse>(`/clubs/${clubId}/lineup`, payload);
  },
};
