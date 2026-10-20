import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, Play, Swords } from 'lucide-react';
import type { MatchDetail, MatchSummary } from '../types/api';
import { leagueService } from '../services/leagueService';
import { useLeagueSummary } from '../context/LeagueSummaryContext';
import { useAsyncResource } from '../hooks/useAsyncResource';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ClubShield } from '../components/ui/ClubShield';
import { DataTable, type DataTableColumn } from '../components/ui/DataTable';
import { SimulateMatchModal } from '../components/modals/SimulateMatchModal';
import { formatDateTimePtBr } from '../utils/formatters';

export const MatchesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { clubs } = useLeagueSummary();

  const [clubFilter, setClubFilter] = useState<string>(
    () => searchParams.get('club_id') ?? ''
  );
  const [isSimulateOpen, setIsSimulateOpen] = useState<boolean>(
    () => searchParams.get('simular') === '1'
  );

  // Clear query params if 'simular' was set or redirect if 'match' was set
  useEffect(() => {
    const matchParam = searchParams.get('match');
    if (matchParam) {
      navigate(`/liga/jogos/${matchParam}`);
      return;
    }
    if (searchParams.get('simular') === '1') {
      const next = new URLSearchParams(searchParams);
      next.delete('simular');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams, navigate]);

  const fetchMatches = useCallback(async () => {
    const filterId = clubFilter ? Number(clubFilter) : undefined;
    return leagueService.listMatches(filterId);
  }, [clubFilter]);

  const {
    data: matches,
    isLoading,
    error,
    reload,
  } = useAsyncResource(fetchMatches, 'Não foi possível carregar as partidas.');

  const handleSimulateSuccess = (match: MatchDetail) => {
    setIsSimulateOpen(false);
    navigate(`/liga/jogos/${match.id}?nova=1`);
  };

  const getResultBadge = (result: string) => {
    if (result === 'MANDANTE') {
      return <Badge variant="success">Mandante</Badge>;
    }
    if (result === 'VISITANTE') {
      return <Badge variant="primary">Visitante</Badge>;
    }
    return <Badge variant="neutral">Empate</Badge>;
  };

  const columns: DataTableColumn<MatchSummary>[] = [
    {
      key: 'played_at',
      header: 'Data e Hora',
      width: '160px',
      render: (row) => (
        <span className="tabular-nums cell-muted">
          {formatDateTimePtBr(row.played_at)}
        </span>
      ),
    },
    {
      key: 'home',
      header: 'Mandante',
      render: (row) => (
        <div className="match-team-inline">
          <ClubShield
            name={row.home.club_name}
            clubId={row.home.club_id}
            size={16}
            showName={false}
          />
          <span>{row.home.club_name}</span>
          <Badge variant="neutral">{row.home.formation}</Badge>
        </div>
      ),
    },
    {
      key: 'score',
      header: 'Placar',
      align: 'center',
      width: '100px',
      render: (row) => (
        <span className="scoreboard-score" style={{ fontSize: 13, padding: '2px 8px' }}>
          {row.home.goals} × {row.away.goals}
        </span>
      ),
    },
    {
      key: 'away',
      header: 'Visitante',
      render: (row) => (
        <div className="match-team-inline">
          <ClubShield
            name={row.away.club_name}
            clubId={row.away.club_id}
            size={16}
            showName={false}
          />
          <span>{row.away.club_name}</span>
          <Badge variant="neutral">{row.away.formation}</Badge>
        </div>
      ),
    },
    {
      key: 'result',
      header: 'Resultado',
      align: 'center',
      width: '110px',
      render: (row) => getResultBadge(row.result),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: '110px',
      render: (row) => (
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<Eye size={13} />}
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/liga/jogos/${row.id}`);
          }}
        >
          Duelos
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        icon={<Swords size={20} />}
        title="Partidas"
        subtitle="Histórico de confrontos da liga e simulação de novas partidas"
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <select
              className="input"
              style={{ width: 200, height: 32, fontSize: 12.5 }}
              value={clubFilter}
              onChange={(e) => {
                setClubFilter(e.target.value);
              }}
              aria-label="Filtrar partidas por clube"
            >
              <option value="">Todos os clubes</option>
              {clubs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <Button
              variant="primary"
              size="sm"
              leftIcon={<Play size={14} />}
              onClick={() => setIsSimulateOpen(true)}
            >
              Simular partida
            </Button>
          </div>
        }
      />

      <DataTable<MatchSummary>
        columns={columns}
        data={matches ?? []}
        rowKey={(item) => item.id}
        isLoading={isLoading}
        error={error}
        onRetry={reload}
        emptyTitle="Nenhuma partida encontrada"
        emptyDescription={
          clubFilter
            ? 'Este clube ainda não participou de nenhuma partida na liga.'
            : 'Ainda não foram disputadas partidas na liga. Simule um confronto para começar o campeonato.'
        }
        emptyAction={
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Play size={14} />}
            onClick={() => setIsSimulateOpen(true)}
          >
            Simular primeira partida
          </Button>
        }
        onRowClick={(row) => {
          navigate(`/liga/jogos/${row.id}`);
        }}
      />

      <p className="page-bottom-caption">
        Partidas confrontam os 5 titulares escalados de cada clube em 6 duelos técnicos
        (RN20).
      </p>

      <SimulateMatchModal
        open={isSimulateOpen}
        onClose={() => setIsSimulateOpen(false)}
        onSuccess={handleSimulateSuccess}
      />
    </>
  );
};
