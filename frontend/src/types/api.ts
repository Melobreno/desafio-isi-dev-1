export type PlayerPosition = 'GOL' | 'ZAG' | 'LAT' | 'MEI' | 'ATA';

export type PlayerCondition = 'APTO' | 'MAL_CONDICIONADO' | 'DOENTE';

export type FormationType = '3-1' | '2-2' | '2-1-1' | '1-2-1';

export type TransactionType = 'COMPRA' | 'VENDA';

export type ContractStatus = 'ATIVO' | 'ENCERRADO' | 'RESCINDIDO';

export type MatchResultType = 'MANDANTE' | 'VISITANTE' | 'EMPATE';

export interface PlayerContractSummary {
  purchase_value: number;
  loyalty_until: string;
  remaining_days?: number;
  penalty_rate?: number;
  status?: ContractStatus;
}

export interface PlayerResponse {
  id: number;
  name: string;
  position: PlayerPosition;
  agility: number;
  age: number;
  condition: PlayerCondition;
  base_value: number;
  market_value: number;
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
  potential: number;
  overall: number;
  club_id: number | null;
  contract?: PlayerContractSummary;
}

export interface PageMeta {
  page: number;
  limit: number;
  total_items: number;
  total_pages: number;
}

export interface PaginatedPlayersResponse {
  data: PlayerResponse[];
  meta: PageMeta;
}

export type PlayerSortOption =
  | 'name'
  | 'value_asc'
  | 'value_desc'
  | 'age_asc'
  | 'age_desc'
  | 'position';

export interface PlayerFilters {
  search?: string;
  position?: PlayerPosition | '';
  condition?: PlayerCondition | '';
  free?: boolean;
  club_id?: number | '';
  min_age?: number | '';
  max_age?: number | '';
  min_value?: number | '';
  max_value?: number | '';
  sort?: string;
  page?: number;
  limit?: number;
}

export interface CreatePlayerRequest {
  name: string;
  position: PlayerPosition;
  agility: number;
  age: number;
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
  potential: number;
}

export interface UpdatePlayerRequest {
  name: string;
  position: PlayerPosition;
  agility: number;
  age: number;
}

export interface UpdatePlayerConditionRequest {
  condition: PlayerCondition;
}

export type ClubSortOption = 'name' | 'net_worth_asc' | 'net_worth_desc';

export interface ClubResponse {
  id: number;
  name: string;
  acronym: string;
  cash: number;
  squad_value: number;
  net_worth: number;
}

export interface ClubDetailResponse extends ClubResponse {
  players: PlayerResponse[];
}

export interface CreateClubRequest {
  name: string;
  acronym: string;
}

export interface BuyPlayerRequest {
  club_id: number;
  loyalty_until: string;
}

export interface BuyPlayerResponse {
  id: number;
  club_id: number;
  player_id: number;
  player_name: string;
  type: 'COMPRA';
  value: number;
  fee: number;
  penalty: number;
  profit: null;
  cash_change: number;
  created_at: string;
  contract: {
    purchase_value: number;
    loyalty_until: string;
    status: ContractStatus;
  };
  club_cash: number;
}

export interface SellPlayerResponse {
  id: number;
  club_id: number;
  player_id: number;
  player_name: string;
  type: 'VENDA';
  value: number;
  fee: number;
  penalty: number;
  profit: number;
  cash_change: number;
  created_at: string;
  purchase_value: number;
  remaining_days: number;
  penalty_rate: number;
  contract_status: ContractStatus;
  club_cash: number;
}

export interface TransactionItem {
  id: number;
  club_id: number;
  player_id: number;
  player_name: string;
  type: TransactionType;
  value: number;
  fee: number;
  penalty: number;
  profit: number | null;
  cash_change: number;
  created_at: string;
}

export interface TransactionSummary {
  total_spent: number;
  total_received: number;
  total_fees: number;
  total_penalties: number;
  total_profit: number;
}

export interface ClubTransactionsResponse {
  data: TransactionItem[];
  summary: TransactionSummary;
}

export interface LineupResponse {
  club_id: number;
  formation: FormationType | null;
  complete: boolean;
  players: PlayerResponse[];
}

export interface SaveLineupRequest {
  formation: FormationType;
  player_ids: number[];
}

export interface MatchClubSide {
  club_id: number;
  club_name: string;
  formation: FormationType;
  goals: number;
}

export interface DuelPlayerSnapshot {
  player_id: number;
  player_name: string;
  position: PlayerPosition;
  condition: PlayerCondition;
  attribute: 'shooting' | 'passing' | 'dribbling' | 'defending';
  value: number;
}

export interface MatchDuel {
  order: number;
  attacking_club_id: number;
  attacker: DuelPlayerSnapshot;
  defender: DuelPlayerSnapshot;
  goal: boolean;
}

export interface MatchSummary {
  id: number;
  played_at: string;
  home: MatchClubSide;
  away: MatchClubSide;
  result: MatchResultType;
}

export interface MatchDetail extends MatchSummary {
  duels: MatchDuel[];
}

export interface SimulateMatchRequest {
  home_club_id: number;
  away_club_id: number;
}

export interface StandingRow {
  position: number;
  club_id: number;
  club_name: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
}

export interface ApiErrorPayload {
  message: string;
}
