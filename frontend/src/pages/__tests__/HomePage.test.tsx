import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { HomePage } from '../HomePage';
import { LeagueSummaryContext } from '../../context/LeagueSummaryContext';
import { leagueService } from '../../services/leagueService';
import type { ClubResponse, MatchSummary, StandingRow } from '../../types/api';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../services/leagueService', () => ({
  leagueService: {
    listStandings: vi.fn(),
  },
}));

const mockClubs: ClubResponse[] = [
  { id: 1, name: 'Delta FC', acronym: 'DEL', cash: 300, squad_value: 0, net_worth: 300 },
  { id: 2, name: 'Gama EC', acronym: 'GAM', cash: 300, squad_value: 0, net_worth: 300 },
];

function renderHomePage(matches: MatchSummary[] = []) {
  return render(
    <LeagueSummaryContext.Provider
      value={{
        clubs: mockClubs,
        clubsMap: { 1: mockClubs[0], 2: mockClubs[1] },
        totalPlayers: 23,
        freePlayersCount: 7,
        clubPlayersCount: 16,
        matches,
        latestMatch: matches[0] ?? null,
        isLoadingSummary: false,
        hasUnseenUpdates: false,
        lastDiff: {
          newClubs: 0,
          newPlayers: 0,
          newMatches: 0,
          totalClubs: 2,
          totalPlayers: 23,
          totalMatches: matches.length,
          hasUpdates: false,
          lastAlteredAt: null,
          checkedAt: new Date(),
        },
        refreshVersion: 1,
        refreshSummary: vi.fn(),
        openCreateClubModal: vi.fn(),
        closeCreateClubModal: vi.fn(),
        isCreateClubModalOpen: false,
      }}
    >
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    </LeagueSummaryContext.Provider>
  );
}

describe('HomePage (Mockup Tela Inicial)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza o estado sem partidas (W02)', () => {
    renderHomePage([]);

    expect(screen.getByText('Passe')).toBeInTheDocument();
    expect(
      screen.getByText('Gestão da liga, do mercado à classificação')
    ).toBeInTheDocument();
    expect(screen.getByText(/nenhuma partida ainda/i)).toBeInTheDocument();

    // Metrics
    expect(screen.getByText('23')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getAllByText(/partidas/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Não precisa de login/i)).toBeInTheDocument();

    // 6 Steps
    expect(screen.getByText('Jogadores')).toBeInTheDocument();
    expect(screen.getByText('Clubes')).toBeInTheDocument();
    expect(screen.getByText('Compra')).toBeInTheDocument();
    expect(screen.getByText('Venda')).toBeInTheDocument();
    expect(screen.getByText('Histórico')).toBeInTheDocument();
    expect(screen.getByText('Liga')).toBeInTheDocument();
  });

  it('renderiza o estado com partidas e mostra o líder da classificação (W01)', async () => {
    const mockStandings: StandingRow[] = [
      {
        position: 1,
        club_id: 1,
        club_name: 'Delta FC',
        played: 2,
        wins: 2,
        draws: 0,
        losses: 0,
        goals_for: 4,
        goals_against: 1,
        goal_difference: 3,
        points: 6,
      },
    ];

    vi.mocked(leagueService.listStandings).mockResolvedValueOnce(mockStandings);

    const matches: MatchSummary[] = [
      {
        id: 1,
        played_at: '2026-10-19T10:00:00-03:00',
        home: { club_id: 1, club_name: 'Delta FC', formation: '2-2', goals: 2 },
        away: { club_id: 2, club_name: 'Gama EC', formation: '2-2', goals: 1 },
        result: 'MANDANTE',
      },
    ];

    renderHomePage(matches);

    await waitFor(() => {
      expect(screen.getByText(/líder: Delta FC, 6 pontos/i)).toBeInTheDocument();
    });

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getAllByText(/partida/i).length).toBeGreaterThan(0);
  });

  it('navega para /jogadores ao clicar no botão Iniciar', async () => {
    renderHomePage([]);

    const btn = screen.getByRole('button', { name: /Iniciar/i });
    await userEvent.click(btn);

    expect(mockNavigate).toHaveBeenCalledWith('/jogadores');
  });

  it('navega para /jogadores ao teclar Enter', () => {
    renderHomePage([]);

    fireEvent.keyDown(window, { key: 'Enter' });

    expect(mockNavigate).toHaveBeenCalledWith('/jogadores');
  });
});
