import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ClubDetailPage } from '../ClubDetailPage';
import { clubsService } from '../../services/clubsService';
import { LeagueSummaryContext } from '../../context/LeagueSummaryContext';
import type { ClubResponse } from '../../types/api';

vi.mock('../../services/clubsService', () => ({
  clubsService: {
    getById: vi.fn(),
    getLineup: vi.fn(),
    listTransactions: vi.fn().mockResolvedValue({
      data: [],
      summary: {
        total_spent: 0,
        total_received: 0,
        total_fees: 0,
        total_penalties: 0,
        total_profit: 0,
      },
    }),
  },
}));

const mockClubs: ClubResponse[] = [
  { id: 1, name: 'Delta FC', acronym: 'DEL', cash: 300, squad_value: 0, net_worth: 300 },
];

function renderClubDetailPage(initialUrl = '/clubes/999') {
  return render(
    <LeagueSummaryContext.Provider
      value={{
        clubs: mockClubs,
        clubsMap: { 1: mockClubs[0] },
        totalPlayers: 10,
        freePlayersCount: 2,
        clubPlayersCount: 8,
        matches: [],
        latestMatch: null,
        isLoadingSummary: false,
        hasUnseenUpdates: false,
        lastDiff: {
          newClubs: 0,
          newPlayers: 0,
          newMatches: 0,
          totalClubs: 1,
          totalPlayers: 10,
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
          <Route path="/clubes/:id" element={<ClubDetailPage />} />
          <Route path="/clubes" element={<div>Lista de Clubes</div>} />
          <Route path="/" element={<div>Tela Inicial</div>} />
        </Routes>
      </MemoryRouter>
    </LeagueSummaryContext.Provider>
  );
}

describe('ClubDetailPage (Not Found & Erros)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exibe tela de erro amigável quando o ID na URL é inválido (/clubes/abc)', async () => {
    renderClubDetailPage('/clubes/abc');

    await waitFor(() => {
      expect(screen.getByText('Clube não encontrado')).toBeInTheDocument();
    });

    expect(screen.getByText(/O clube solicitado com identificador/i)).toBeInTheDocument();
    expect(screen.getByText('Erro 404 · Não encontrado')).toBeInTheDocument();
  });

  it('exibe tela de erro amigável quando o clube não existe no banco (/clubes/999)', async () => {
    vi.mocked(clubsService.getById).mockRejectedValueOnce(
      new Error('Clube não encontrado')
    );

    renderClubDetailPage('/clubes/999');

    await waitFor(() => {
      expect(screen.getByText('Clube não encontrado')).toBeInTheDocument();
    });

    expect(
      screen.getByRole('button', { name: /Voltar para Clubes/i })
    ).toBeInTheDocument();
  });

  it('permite voltar para a lista de clubes a partir da tela de erro', async () => {
    renderClubDetailPage('/clubes/invalido');

    await waitFor(() => {
      expect(screen.getByText('Clube não encontrado')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: /Voltar para Clubes/i }));

    expect(screen.getByText('Lista de Clubes')).toBeInTheDocument();
  });
});
