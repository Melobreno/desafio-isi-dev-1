import React, { useCallback, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  History,
  Home,
  LayoutGrid,
  ShieldAlert,
  Shirt,
  ShoppingCart,
} from 'lucide-react';
import type { PlayerResponse } from '../types/api';
import { clubsService } from '../services/clubsService';
import { useAsyncResource } from '../hooks/useAsyncResource';
import { useClubTransactions } from '../hooks/useClubTransactions';
import { useLeagueSummary } from '../context/LeagueSummaryContext';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { ClubKpiGrid } from '../components/club/ClubKpiGrid';
import { ClubSquadTab } from '../components/club/ClubSquadTab';
import { ClubLineupTab } from '../components/club/ClubLineupTab';
import { ClubTransactionsTab } from '../components/club/ClubTransactionsTab';
import { SellPlayerModal } from '../components/modals/SellPlayerModal';
import { PlayerDetailsModal } from '../components/modals/PlayerDetailsModal';
import { PlayerFormModal } from '../components/modals/PlayerFormModal';
import { PlayerConditionModal } from '../components/modals/PlayerConditionModal';

type ClubTab = 'elenco' | 'escalacao' | 'historico';

const TAB_IDS: ClubTab[] = ['elenco', 'escalacao', 'historico'];

function parseTab(value: string | null): ClubTab {
  return TAB_IDS.includes(value as ClubTab) ? (value as ClubTab) : 'elenco';
}

export const ClubDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { clubsMap } = useLeagueSummary();

  const clubId = Number(id);
  const isValidId = Number.isInteger(clubId) && clubId > 0;
  const activeTab = parseTab(searchParams.get('tab'));

  const fetchClub = useCallback(async () => {
    if (!isValidId) throw new Error('Identificador de clube inválido.');
    const [club, lineup] = await Promise.all([
      clubsService.getById(clubId),
      clubsService.getLineup(clubId).catch(() => null),
    ]);
    return { club, starterIds: new Set(lineup?.players.map((p) => p.id) ?? []) };
  }, [clubId, isValidId]);

  const clubResource = useAsyncResource(
    fetchClub,
    'Não foi possível carregar os detalhes do clube.'
  );
  const history = useClubTransactions(clubId);

  const [sellingPlayer, setSellingPlayer] = useState<PlayerResponse | null>(null);
  const [detailsPlayer, setDetailsPlayer] = useState<PlayerResponse | null>(null);
  const [editingPlayer, setEditingPlayer] = useState<PlayerResponse | null>(null);
  const [conditionPlayer, setConditionPlayer] = useState<PlayerResponse | null>(null);

  const club = clubResource.data?.club ?? null;
  const starterIds = clubResource.data?.starterIds;
  const fallbackClub = clubsMap[clubId];
  const displayName = club?.name ?? fallbackClub?.name ?? 'Detalhes do Clube';
  const displayAcronym = club?.acronym ?? fallbackClub?.acronym ?? 'CLB';
  const squad = club?.players ?? [];

  const changeTab = (tab: ClubTab) => setSearchParams(tab === 'elenco' ? {} : { tab });

  const tabs: Array<{
    id: ClubTab;
    label: string;
    icon: React.ReactNode;
    count?: number;
  }> = [
    { id: 'elenco', label: 'Elenco', icon: <Shirt size={14} />, count: squad.length },
    { id: 'escalacao', label: 'Escalação', icon: <LayoutGrid size={14} /> },
    {
      id: 'historico',
      label: 'Histórico',
      icon: <History size={14} />,
      count: history.totalCount,
    },
  ];

  if (clubResource.isLoading) {
    return (
      <div className="table-state-container" style={{ padding: '80px 20px' }}>
        <div className="table-spinner" />
        <div className="cell-muted">Carregando detalhes do clube...</div>
      </div>
    );
  }

  if (!isValidId || clubResource.error || !club) {
    return (
      <div className="not-found-card-wrapper">
        <div className="not-found-card">
          <div className="not-found-icon-wrap club-error">
            <ShieldAlert size={36} color="var(--danger)" />
          </div>
          <span className="not-found-code-badge">Erro 404 · Não encontrado</span>
          <h1 className="not-found-title">Clube não encontrado</h1>
          <p className="not-found-description">
            O clube solicitado com identificador <strong>#{id}</strong> não foi encontrado
            na base de dados da liga ou o endereço digitado na barra de navegação é
            inválido.
          </p>
          <div className="not-found-actions">
            <Button
              variant="primary"
              leftIcon={<ArrowLeft size={14} />}
              onClick={() => navigate('/clubes')}
            >
              Voltar para Clubes
            </Button>
            <Button
              variant="secondary"
              leftIcon={<Home size={14} />}
              onClick={() => navigate('/')}
            >
              Ir para o início
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        icon={<span>{displayAcronym}</span>}
        iconVariant="neutral"
        title={displayName}
        subtitle={
          <div className="club-header-pills">
            <span className="club-header-pill">Sigla {displayAcronym}</span>
            <span className="club-header-pill">
              <Shirt size={12} />
              <span className="tabular-nums">{squad.length} de 12 jogadores</span>
            </span>
          </div>
        }
        actions={
          <Button
            variant="primary"
            leftIcon={<ShoppingCart size={14} />}
            onClick={() => navigate('/jogadores')}
          >
            Comprar jogadores
          </Button>
        }
      />

      <ClubKpiGrid
        cash={club?.cash ?? fallbackClub?.cash ?? 0}
        squadValue={club?.squad_value ?? fallbackClub?.squad_value ?? 0}
        netWorth={club?.net_worth ?? fallbackClub?.net_worth ?? 0}
        squadSize={squad.length}
      />

      <div className="club-tabs-bar" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`club-tab-btn${activeTab === tab.id ? ' active' : ''}`}
            onClick={() => changeTab(tab.id)}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className="club-tab-count tabular-nums">{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'elenco' && (
        <ClubSquadTab
          players={squad}
          isLoading={clubResource.isLoading}
          error={clubResource.error}
          onRetry={clubResource.reload}
          onSelectPlayer={setDetailsPlayer}
          onSellPlayer={setSellingPlayer}
          onBrowseFreePlayers={() => navigate('/jogadores')}
        />
      )}
      {activeTab === 'escalacao' && (
        <ClubLineupTab
          clubId={clubId}
          squad={squad}
          onLineupChanged={clubResource.reload}
        />
      )}
      {activeTab === 'historico' && (
        <ClubTransactionsTab
          club={{ id: clubId, acronym: displayAcronym }}
          history={history}
        />
      )}

      <SellPlayerModal
        open={Boolean(sellingPlayer)}
        player={sellingPlayer}
        clubName={displayName}
        isStarter={sellingPlayer ? Boolean(starterIds?.has(sellingPlayer.id)) : false}
        onClose={() => setSellingPlayer(null)}
        onSuccess={() => {
          clubResource.reload();
          history.reload();
        }}
        onViewHistory={() => changeTab('historico')}
      />

      <PlayerDetailsModal
        open={Boolean(detailsPlayer)}
        playerId={detailsPlayer?.id ?? null}
        initialPlayer={detailsPlayer}
        onClose={() => setDetailsPlayer(null)}
        onEdit={setEditingPlayer}
        onChangeCondition={setConditionPlayer}
      />

      <PlayerFormModal
        open={Boolean(editingPlayer)}
        playerToEdit={editingPlayer}
        onClose={() => setEditingPlayer(null)}
        onSuccess={clubResource.reload}
      />

      <PlayerConditionModal
        open={Boolean(conditionPlayer)}
        player={conditionPlayer}
        onClose={() => setConditionPlayer(null)}
        onSuccess={clubResource.reload}
      />
    </>
  );
};
