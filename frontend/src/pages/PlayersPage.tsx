import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowUpDown,
  Eye,
  HeartPulse,
  Pencil,
  Plus,
  ShoppingCart,
  Trash2,
  Users,
} from 'lucide-react';
import type { PlayerResponse, PlayerSortOption } from '../types/api';
import { usePlayers } from '../hooks/usePlayers';
import { usePlayerFilters } from '../hooks/usePlayerFilters';
import { useLeagueSummary } from '../context/LeagueSummaryContext';
import { POSITION_LABELS, formatCurrency } from '../utils/formatters';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { ConditionBadge, PositionBadge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { DataTable, type DataTableColumn } from '../components/ui/DataTable';
import { DropdownMenu } from '../components/ui/DropdownMenu';
import { OptionPopover } from '../components/ui/OptionPopover';
import { PlayersFilterBar } from '../components/players/PlayersFilterBar';
import { PlayerFormModal } from '../components/modals/PlayerFormModal';
import { PlayerConditionModal } from '../components/modals/PlayerConditionModal';
import { PlayerDetailsModal } from '../components/modals/PlayerDetailsModal';
import { DeletePlayerModal } from '../components/modals/DeletePlayerModal';
import { BuyPlayerModal } from '../components/modals/BuyPlayerModal';

const SORT_OPTIONS: Array<{
  value: PlayerSortOption;
  label: string;
  shortLabel: string;
}> = [
  { value: 'name', label: 'Nome', shortLabel: 'nome' },
  {
    value: 'value_desc',
    label: 'Maior valor de mercado',
    shortLabel: 'maior valor de mercado',
  },
  {
    value: 'value_asc',
    label: 'Menor valor de mercado',
    shortLabel: 'menor valor de mercado',
  },
  { value: 'age_desc', label: 'Maior idade', shortLabel: 'maior idade' },
  { value: 'age_asc', label: 'Menor idade', shortLabel: 'menor idade' },
  { value: 'position', label: 'Posição (GOL a ATA)', shortLabel: 'posição' },
];

export const PlayersPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { clubsMap, totalPlayers, freePlayersCount, clubPlayersCount } =
    useLeagueSummary();

  const filterState = usePlayerFilters();
  const {
    criteria,
    updateCriteria,
    setPage,
    queryFilters,
    hasNonTabFilters,
    hasAnyActiveFilter,
    clearAll,
  } = filterState;

  const { players, meta, isLoading, error, refetch } = usePlayers(queryFilters);

  const [isCreateOrEditOpen, setIsCreateOrEditOpen] = useState<boolean>(
    () => searchParams.get('novo') === '1'
  );
  const [playerToEdit, setPlayerToEdit] = useState<PlayerResponse | null>(null);
  const [playerForCondition, setPlayerForCondition] = useState<PlayerResponse | null>(
    null
  );
  const [playerForDetails, setPlayerForDetails] = useState<PlayerResponse | null>(null);
  const [playerForDelete, setPlayerForDelete] = useState<PlayerResponse | null>(null);
  const [playerForBuy, setPlayerForBuy] = useState<PlayerResponse | null>(null);

  useEffect(() => {
    if (searchParams.get('novo') === '1') {
      const next = new URLSearchParams(searchParams);
      next.delete('novo');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const currentSort =
    SORT_OPTIONS.find((o) => o.value === criteria.sort) ?? SORT_OPTIONS[0];

  const columns: DataTableColumn<PlayerResponse>[] = [
    {
      key: 'name',
      header: 'Jogador',
      render: (row) => (
        <div className="cell-identity">
          <Avatar name={row.name} seed={row.id} size={32} />
          <div>
            <div className="cell-identity-name">{row.name}</div>
            <div className="cell-identity-meta">{POSITION_LABELS[row.position]}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'position',
      header: 'Posição',
      width: '90px',
      render: (row) => <PositionBadge position={row.position} />,
    },
    {
      key: 'overall',
      header: 'Overall',
      align: 'right',
      width: '85px',
      render: (row) => <span className="overall-pill tabular-nums">{row.overall}</span>,
    },
    {
      key: 'agility',
      header: 'Agilidade',
      render: (row) => {
        const barTone = row.agility >= 80 ? 'high' : row.agility <= 30 ? 'low' : 'mid';
        return (
          <div className="agility-cell">
            <span className="agility-cell-num tabular-nums">{row.agility}</span>
            <div className="agility-bar-track">
              <div
                className={`agility-bar-fill ${barTone}`}
                style={{ width: `${Math.min(100, Math.max(8, row.agility))}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      key: 'age',
      header: 'Idade',
      align: 'right',
      width: '75px',
      render: (row) => <span className="tabular-nums">{row.age}</span>,
    },
    {
      key: 'condition',
      header: 'Condição',
      width: '125px',
      render: (row) => <ConditionBadge condition={row.condition} />,
    },
    {
      key: 'base_value',
      header: 'Valor base',
      align: 'right',
      width: '120px',
      render: (row) => (
        <span className="tabular-nums cell-muted">{formatCurrency(row.base_value)}</span>
      ),
    },
    {
      key: 'market_value',
      header: 'Valor de mercado',
      align: 'right',
      width: '135px',
      render: (row) => (
        <span className="tabular-nums cell-strong">
          {formatCurrency(row.market_value)}
        </span>
      ),
    },
    {
      key: 'club',
      header: 'Clube',
      render: (row) => {
        if (row.club_id === null) {
          return <span className="club-free-pill">Livre</span>;
        }
        const club = clubsMap[row.club_id];
        return (
          <Link
            to={`/clubes/${row.club_id}`}
            className="club-table-link"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="club-acronym-pill">
              {club ? club.acronym : `#${row.club_id}`}
            </span>
            <span className="club-table-link-name">
              {club ? club.name : `Clube #${row.club_id}`}
            </span>
          </Link>
        );
      },
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: '120px',
      render: (row) => {
        const isFree = row.club_id === null;
        return (
          <div className="cell-actions" onClick={(e) => e.stopPropagation()}>
            <div className="toolbar-inline">
              {isFree && (
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<ShoppingCart size={13} />}
                  onClick={() => setPlayerForBuy(row)}
                >
                  Comprar
                </Button>
              )}
              <DropdownMenu
                header={row.name}
                ariaLabel={`Mais ações para ${row.name}`}
                items={[
                  {
                    label: 'Ver detalhes',
                    icon: <Eye size={14} />,
                    onClick: () => setPlayerForDetails(row),
                  },
                  {
                    label: 'Editar',
                    icon: <Pencil size={14} />,
                    onClick: () => {
                      setPlayerToEdit(row);
                      setIsCreateOrEditOpen(true);
                    },
                  },
                  {
                    label: 'Alterar condição',
                    icon: <HeartPulse size={14} />,
                    onClick: () => setPlayerForCondition(row),
                  },
                  ...(isFree
                    ? [
                        {
                          label: 'Comprar',
                          icon: <ShoppingCart size={14} />,
                          dividerBefore: true,
                          onClick: () => setPlayerForBuy(row),
                        },
                      ]
                    : []),
                  {
                    label: 'Excluir',
                    icon: <Trash2 size={14} />,
                    destructive: true,
                    dividerBefore: true,
                    disabled: !isFree,
                    description: isFree
                      ? 'Disponível porque o jogador está livre.'
                      : 'Indisponível porque o jogador está em um clube.',
                    onClick: () => {
                      if (isFree) setPlayerForDelete(row);
                    },
                  },
                ]}
              />
            </div>
          </div>
        );
      },
    },
  ];

  return (
    <>
      <PageHeader
        icon={<Users size={20} />}
        title="Jogadores"
        subtitle="Cadastre jogadores, acompanhe os indicadores e compre os que estão livres."
        actions={
          <Button
            variant="primary"
            leftIcon={<Plus size={15} />}
            onClick={() => {
              setPlayerToEdit(null);
              setIsCreateOrEditOpen(true);
            }}
          >
            Novo jogador
          </Button>
        }
      />

      <PlayersFilterBar filters={filterState} />

      <DataTable
        toolbar={
          <>
            <div
              className="tabs-pill-group"
              role="tablist"
              aria-label="Filtro de vínculo"
            >
              <button
                type="button"
                role="tab"
                aria-selected={criteria.availabilityTab === 'ALL'}
                className={`tab-pill ${criteria.availabilityTab === 'ALL' ? 'active' : ''}`}
                onClick={() => updateCriteria({ availabilityTab: 'ALL' })}
              >
                <span>Todos</span>
                <span className="tab-pill-count tabular-nums">
                  {hasNonTabFilters && criteria.availabilityTab === 'ALL'
                    ? meta.total_items
                    : totalPlayers}
                </span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={criteria.availabilityTab === 'FREE'}
                className={`tab-pill ${criteria.availabilityTab === 'FREE' ? 'active' : ''}`}
                onClick={() => updateCriteria({ availabilityTab: 'FREE', clubId: '' })}
              >
                <span>Livres</span>
                <span className="tab-pill-count tabular-nums">
                  {hasNonTabFilters && criteria.availabilityTab === 'FREE'
                    ? meta.total_items
                    : freePlayersCount}
                </span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={criteria.availabilityTab === 'CLUB'}
                className={`tab-pill ${criteria.availabilityTab === 'CLUB' ? 'active' : ''}`}
                onClick={() => updateCriteria({ availabilityTab: 'CLUB' })}
              >
                <span>Em clubes</span>
                <span className="tab-pill-count tabular-nums">
                  {hasNonTabFilters && criteria.availabilityTab === 'CLUB'
                    ? meta.total_items
                    : clubPlayersCount}
                </span>
              </button>
            </div>

            <OptionPopover
              triggerIcon={<ArrowUpDown size={13} />}
              triggerLabel={`Ordenar: ${currentSort.shortLabel}`}
              title="Ordenar por"
              options={SORT_OPTIONS}
              value={criteria.sort}
              onChange={(sortOption) => updateCriteria({ sort: sortOption })}
              align="right"
              width={220}
            />
          </>
        }
        columns={columns}
        data={players}
        rowKey={(row) => row.id}
        isLoading={isLoading}
        error={error}
        onRetry={clearAll}
        emptyTitle="Nenhum jogador encontrado"
        emptyDescription={
          hasAnyActiveFilter
            ? 'Nenhum jogador corresponde aos filtros selecionados. Limpe os filtros ou ajuste a busca.'
            : 'Ainda não há jogadores cadastrados na liga. Cadastre o primeiro jogador para começar.'
        }
        emptyAction={
          hasAnyActiveFilter ? (
            <Button variant="secondary" size="sm" onClick={clearAll}>
              Limpar filtros
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus size={14} />}
              onClick={() => {
                setPlayerToEdit(null);
                setIsCreateOrEditOpen(true);
              }}
            >
              Cadastrar jogador
            </Button>
          )
        }
        onRowClick={(row) => setPlayerForDetails(row)}
        pagination={{
          currentPage: meta.page,
          pageSize: meta.limit,
          totalItems: meta.total_items,
          itemLabel: meta.total_items === 1 ? 'jogador' : 'jogadores',
          onPageChange: (newPage) => setPage(newPage),
        }}
      />

      <p className="page-bottom-caption">
        Overall e valor de mercado são calculados a cada consulta. A busca ignora
        maiúsculas, minúsculas e acentos.
      </p>

      <PlayerFormModal
        open={isCreateOrEditOpen}
        onClose={() => setIsCreateOrEditOpen(false)}
        playerToEdit={playerToEdit}
        onSuccess={refetch}
        onViewDetails={(p) => setPlayerForDetails(p)}
      />

      <PlayerConditionModal
        open={Boolean(playerForCondition)}
        onClose={() => setPlayerForCondition(null)}
        player={playerForCondition}
        onSuccess={refetch}
      />

      <PlayerDetailsModal
        open={Boolean(playerForDetails)}
        onClose={() => setPlayerForDetails(null)}
        playerId={playerForDetails?.id ?? null}
        initialPlayer={playerForDetails}
        onEdit={(p) => {
          setPlayerToEdit(p);
          setIsCreateOrEditOpen(true);
        }}
        onChangeCondition={(p) => setPlayerForCondition(p)}
        onBuy={(p) => setPlayerForBuy(p)}
      />

      <DeletePlayerModal
        open={Boolean(playerForDelete)}
        onClose={() => setPlayerForDelete(null)}
        player={playerForDelete}
        onSuccess={refetch}
      />

      <BuyPlayerModal
        open={Boolean(playerForBuy)}
        onClose={() => setPlayerForBuy(null)}
        player={playerForBuy}
        onSuccess={refetch}
      />
    </>
  );
};
