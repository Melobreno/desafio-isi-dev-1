import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { MatchDetailPage } from '../MatchDetailPage';
import { leagueService } from '../../services/leagueService';
import { ToastProvider } from '../../components/ui/Toast';
import { LeagueSummaryContext } from '../../context/LeagueSummaryContext';
import type { ClubResponse, MatchDetail } from '../../types/api';

vi.mock('../../services/leagueService', () => ({
  leagueService: {
    getMatchById: vi.fn(),
  },
}));

const mockClubs: ClubResponse[] = [
  {
    id: 1,
    name: 'Botafogo',
    acronym: 'BOT',
    cash: 300,
    squad_value: 500,
    net_worth: 800,
  },
  {
    id: 2,
    name: 'Flamengo',
    acronym: 'FLA',
    cash: 300,
    squad_value: 600,
    net_worth: 900,
  },
];

const mockMatch: MatchDetail = {
  id: 10,
  played_at: '2026-10-19T17:30:00-03:00',
  home: {
    club_id: 1,
    club_name: 'Botafogo',
    formation: '3-1',
    goals: 2,
  },
  away: {
    club_id: 2,
    club_name: 'Flamengo',
    formation: '2-2',
    goals: 1,
  },
  result: 'MANDANTE',
  duels: [
    {
      order: 1,
      attacking_club_id: 1,
      attacker: {
        player_id: 101,
        player_name: 'Igor Jesus',
        position: 'ATA',
        condition: 'APTO',
        attribute: 'shooting',
        value: 90,
      },
      defender: {
        player_id: 201,
        player_name: 'Agustín Rossi',
        position: 'GOL',
        condition: 'APTO',
        attribute: 'defending',
        value: 82,
      },
      goal: true,
    },
    {
      order: 2,
      attacking_club_id: 1,
      attacker: {
        player_id: 102,
        player_name: 'Thiago Almada',
        position: 'MEI',
        condition: 'APTO',
        attribute: 'passing',
        value: 84,
      },
      defender: {
        player_id: 202,
        player_name: 'Léo Ortiz',
        position: 'ZAG',
        condition: 'APTO',
        attribute: 'defending',
        value: 80,
      },
      goal: false,
    },
    {
      order: 3,
      attacking_club_id: 1,
      attacker: {
        player_id: 103,
        player_name: 'Edinson Cavani',
        position: 'ATA',
        condition: 'MAL_CONDICIONADO',
        attribute: 'dribbling',
        value: 88,
      },
      defender: {
        player_id: 203,
        player_name: 'Fabrício Bruno',
        position: 'ZAG',
        condition: 'APTO',
        attribute: 'defending',
        value: 78,
      },
      goal: true,
    },
    {
      order: 4,
      attacking_club_id: 2,
      attacker: {
        player_id: 204,
        player_name: 'Gabriel Barbosa',
        position: 'ATA',
        condition: 'APTO',
        attribute: 'shooting',
        value: 87,
      },
      defender: {
        player_id: 104,
        player_name: 'John Victor',
        position: 'GOL',
        condition: 'APTO',
        attribute: 'defending',
        value: 86,
      },
      goal: true,
    },
    {
      order: 5,
      attacking_club_id: 2,
      attacker: {
        player_id: 205,
        player_name: 'Giorgian De Arrascaeta',
        position: 'MEI',
        condition: 'APTO',
        attribute: 'passing',
        value: 89,
      },
      defender: {
        player_id: 105,
        player_name: 'Alexander Barboza',
        position: 'ZAG',
        condition: 'APTO',
        attribute: 'defending',
        value: 81,
      },
      goal: false,
    },
    {
      order: 6,
      attacking_club_id: 2,
      attacker: {
        player_id: 203,
        player_name: 'Fabrício Bruno',
        position: 'ZAG',
        condition: 'APTO',
        attribute: 'dribbling',
        value: 75,
      },
      defender: {
        player_id: 103,
        player_name: 'Edinson Cavani',
        position: 'ATA',
        condition: 'MAL_CONDICIONADO',
        attribute: 'defending',
        value: 74,
      },
      goal: false,
    },
  ],
};

function renderMatchDetailPage(initialUrl = '/liga/jogos/10') {
  return render(
    <ToastProvider>
      <LeagueSummaryContext.Provider
        value={{
          clubs: mockClubs,
          clubsMap: { 1: mockClubs[0], 2: mockClubs[1] },
          totalPlayers: 20,
          freePlayersCount: 5,
          clubPlayersCount: 15,
          matches: [],
          latestMatch: null,
          isLoadingSummary: false,
          hasUnseenUpdates: false,
          lastDiff: {
            newClubs: 0,
            newPlayers: 0,
            newMatches: 0,
            totalClubs: 2,
            totalPlayers: 20,
            totalMatches: 0,
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
        <MemoryRouter initialEntries={[initialUrl]}>
          <Routes>
            <Route path="/liga/jogos/:id" element={<MatchDetailPage />} />
            <Route path="/liga/jogos" element={<div>Lista de Partidas</div>} />
          </Routes>
        </MemoryRouter>
      </LeagueSummaryContext.Provider>
    </ToastProvider>
  );
}

describe('MatchDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exibe o estado de carregamento e depois os detalhes da partida', async () => {
    vi.mocked(leagueService.getMatchById).mockResolvedValueOnce(mockMatch);

    renderMatchDetailPage();

    expect(
      screen.getByText(/Carregando detalhes e duelos da partida.../i)
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('2 × 1')).toBeInTheDocument();
    });

    // Scoreboard
    expect(screen.getByText('Vitória do mandante')).toBeInTheDocument();
    expect(screen.getByText('BOT')).toBeInTheDocument();
    expect(screen.getByText('FLA')).toBeInTheDocument();
    expect(screen.getByText('Mandante · Formação 3-1')).toBeInTheDocument();
    expect(screen.getByText('Visitante · Formação 2-2')).toBeInTheDocument();

    // Section Em campo
    expect(screen.getByText('Em campo')).toBeInTheDocument();
    expect(screen.getByText('Botafogo (Mandante)')).toBeInTheDocument();
    expect(screen.getByText('Flamengo (Visitante)')).toBeInTheDocument();

    // Section Duelos
    expect(screen.getByText('Duelos')).toBeInTheDocument();
    expect(screen.getByText(/Ataques do Mandante \(Botafogo\)/)).toBeInTheDocument();
    expect(screen.getByText(/Ataques do Visitante \(Flamengo\)/)).toBeInTheDocument();
  });

  it('renderiza os jogadores no campo com badges de gol e condição', async () => {
    vi.mocked(leagueService.getMatchById).mockResolvedValueOnce(mockMatch);

    renderMatchDetailPage();

    await waitFor(() => {
      expect(screen.getByText('2 × 1')).toBeInTheDocument();
    });

    // Cavani is MAL_CONDICIONADO and scored
    const conditionBadges = screen.getAllByTitle(/Mal condicionado/i);
    expect(conditionBadges.length).toBeGreaterThan(0);

    const goalBadges = screen.getAllByTitle(/Marcou gol/i);
    expect(goalBadges.length).toBeGreaterThan(0);
  });

  it('exibe os grupos de duelos com contagem correta de gols', async () => {
    vi.mocked(leagueService.getMatchById).mockResolvedValueOnce(mockMatch);

    renderMatchDetailPage();

    await waitFor(() => {
      expect(screen.getByText('2 × 1')).toBeInTheDocument();
    });

    // Duels goals
    const goalsCounters = screen.getAllByText(/Gols marcados:/i);
    expect(goalsCounters).toHaveLength(2);
    expect(goalsCounters[0]).toHaveTextContent('2');
    expect(goalsCounters[1]).toHaveTextContent('1');

    // Outcomes
    const goalPills = screen.getAllByText('Gol');
    expect(goalPills.length).toBe(3); // 2 home goals + 1 away goal

    const savedPills = screen.getAllByText('Sem gol');
    expect(savedPills.length).toBe(3);
  });

  it('dispara notificação toast quando acessado com query param ?nova=1', async () => {
    vi.mocked(leagueService.getMatchById).mockResolvedValueOnce(mockMatch);

    renderMatchDetailPage('/liga/jogos/10?nova=1');

    await waitFor(() => {
      expect(screen.getByText('Partida jogada')).toBeInTheDocument();
    });

    expect(
      screen.getByText(/Botafogo 2 × 1 Flamengo\. Placar e duelos devolvidos pela API\./i)
    ).toBeInTheDocument();
  });

  it('permite voltar para a lista de partidas', async () => {
    vi.mocked(leagueService.getMatchById).mockResolvedValueOnce(mockMatch);

    renderMatchDetailPage();

    await waitFor(() => {
      expect(screen.getByText('Voltar para partidas')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('Voltar para partidas'));

    expect(screen.getByText('Lista de Partidas')).toBeInTheDocument();
  });
});
