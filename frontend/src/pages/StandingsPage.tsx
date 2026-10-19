import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ListOrdered, Play, Swords } from 'lucide-react';
import type { StandingRow } from '../types/api';
import { leagueService } from '../services/leagueService';
import { useAsyncResource } from '../hooks/useAsyncResource';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { ClubShield } from '../components/ui/ClubShield';
import { DataTable, type DataTableColumn } from '../components/ui/DataTable';

export const StandingsPage: React.FC = () => {
  const navigate = useNavigate();

  const fetchStandings = useCallback(async () => {
    return leagueService.listStandings();
  }, []);

  const {
    data: standings,
    isLoading,
    error,
    reload,
  } = useAsyncResource(
    fetchStandings,
    'Não foi possível carregar a tabela de classificação.'
  );

  const columns: DataTableColumn<StandingRow>[] = [
    {
      key: 'position',
      header: '#',
      width: '48px',
      align: 'center',
      render: (row) => (
        <span className="standings-pos-badge tabular-nums">{row.position}</span>
      ),
    },
    {
      key: 'club',
      header: 'Clube',
      render: (row) => (
        <div className="match-team-inline">
          <ClubShield
            name={row.club_name}
            clubId={row.club_id}
            size={16}
            showName={false}
          />
          <span className="cell-strong">{row.club_name}</span>
        </div>
      ),
    },
    {
      key: 'points',
      header: 'PTS',
      width: '60px',
      align: 'center',
      render: (row) => <span className="standings-pts tabular-nums">{row.points}</span>,
    },
    {
      key: 'played',
      header: 'J',
      width: '50px',
      align: 'center',
      render: (row) => <span className="tabular-nums cell-muted">{row.played}</span>,
    },
    {
      key: 'wins',
      header: 'V',
      width: '50px',
      align: 'center',
      render: (row) => <span className="tabular-nums">{row.wins}</span>,
    },
    {
      key: 'draws',
      header: 'E',
      width: '50px',
      align: 'center',
      render: (row) => <span className="tabular-nums cell-muted">{row.draws}</span>,
    },
    {
      key: 'losses',
      header: 'D',
      width: '50px',
      align: 'center',
      render: (row) => <span className="tabular-nums cell-muted">{row.losses}</span>,
    },
    {
      key: 'goals_for',
      header: 'GP',
      width: '50px',
      align: 'center',
      render: (row) => <span className="tabular-nums">{row.goals_for}</span>,
    },
    {
      key: 'goals_against',
      header: 'GC',
      width: '50px',
      align: 'center',
      render: (row) => (
        <span className="tabular-nums cell-muted">{row.goals_against}</span>
      ),
    },
    {
      key: 'goal_difference',
      header: 'SG',
      width: '55px',
      align: 'center',
      render: (row) => {
        const sg = row.goal_difference;
        const color =
          sg > 0
            ? 'var(--success)'
            : sg < 0
              ? 'var(--destructive)'
              : 'var(--muted-foreground)';
        const text = sg > 0 ? `+${sg}` : `${sg}`;
        return (
          <span className="tabular-nums" style={{ color, fontWeight: 600 }}>
            {text}
          </span>
        );
      },
    },
  ];

  return (
    <>
      <PageHeader
        icon={<ListOrdered size={20} />}
        title="Classificação"
        subtitle="Todos os clubes, com 3 pontos por vitória e 1 por empate (RN21)"
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Swords size={14} />}
              onClick={() => navigate('/liga/jogos')}
            >
              Ver partidas
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Play size={14} />}
              onClick={() => navigate('/liga/jogos?simular=1')}
            >
              Simular partida
            </Button>
          </div>
        }
      />

      <DataTable<StandingRow>
        columns={columns}
        data={standings ?? []}
        rowKey={(item) => item.club_id}
        isLoading={isLoading}
        error={error}
        onRetry={reload}
        emptyTitle="Nenhum clube na liga"
        emptyDescription="Ainda não há clubes cadastrados para disputar o campeonato."
        emptyAction={
          <Button variant="primary" size="sm" onClick={() => navigate('/clubes')}>
            Cadastrar primeiro clube
          </Button>
        }
        onRowClick={(row) => navigate(`/clubes/${row.club_id}`)}
      />

      <p className="page-bottom-caption">
        Critérios de desempate: 1º Pontos · 2º Saldo de gols · 3º Gols marcados · 4º Nome
        do clube (RN21).
      </p>
    </>
  );
};
