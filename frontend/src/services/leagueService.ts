import { apiClient, buildQueryString } from './apiClient';
import type {
  MatchDetail,
  MatchSummary,
  SimulateMatchRequest,
  StandingRow,
} from '../types/api';

export const leagueService = {
  listStandings(): Promise<StandingRow[]> {
    return apiClient.get<StandingRow[]>('/standings');
  },

  listMatches(clubId?: number | ''): Promise<MatchSummary[]> {
    const query = clubId ? buildQueryString({ club_id: clubId }) : '';
    return apiClient.get<MatchSummary[]>(`/matches${query}`);
  },

  getMatchById(id: number): Promise<MatchDetail> {
    return apiClient.get<MatchDetail>(`/matches/${id}`);
  },

  simulateMatch(payload: SimulateMatchRequest): Promise<MatchDetail> {
    return apiClient.post<MatchDetail>('/matches', payload);
  },
};
