import React, { useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowUpDown, ChevronRight, Plus, Shield } from 'lucide-react';
import type { ClubResponse, ClubSortOption } from '../types/api';
import { clubsService } from '../services/clubsService';
import { formatCurrency } from '../utils/formatters';
import { useAsyncResource } from '../hooks/useAsyncResource';
import { useLeagueSummary } from '../context/LeagueSummaryContext';
import { PageHeader } from '../components/layout/PageHeader';
import { DataTable, type DataTableColumn } from '../components/ui/DataTable';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { OptionPopover } from '../components/ui/OptionPopover';

const MAX_CLUBS = 20;
const NO_CLUBS: ClubResponse[] = [];

const SORT_OPTIONS: Array<{ value: ClubSortOption; label: string; shortLabel: string }> =
  [
    { value: 'name', label: 'Nome (A–Z)', shortLabel: 'nome' },
    {
      value: 'net_worth_desc',
      label: 'Patrimônio (maior para o menor)',
      shortLabel: 'maior patrimônio',
    },
    {
      value: 'net_worth_asc',
      label: 'Patrimônio (menor para o maior)',
      shortLabel: 'menor patrimônio',
    },
  ];

const columns: DataTableColumn<ClubResponse>[] = [
  {
    key: 'club',
    header: 'Clube',
    render: (club) => (
      <div className="cell-identity">
        <span className="club-acronym-square">{club.acronym}</span>
        <span className="cell-identity-name">{club.name}</span>
      </div>
    ),
  },
  {
    key: 'acronym',
    header: 'Sigla',
    width: '120px',
    render: (club) => <Badge variant="outline">{club.acronym}</Badge>,
  },
  {
    key: 'cash',
    header: 'Caixa',
    align: 'right',
    width: '160px',
    render: (club) => <span className="tabular-nums">{formatCurrency(club.cash)}</span>,
  },
  {
    key: 'squad_value',
    header: 'Valor do elenco',
    align: 'right',
    width: '180px',
    render: (club) => (
      <span className="tabular-nums">{formatCurrency(club.squad_value)}</span>
    ),
  },
  {
    key: 'net_worth',
    header: 'Patrimônio',
    align: 'right',
    width: '160px',
    render: (club) => (
      <span className="tabular-nums cell-bold">{formatCurrency(club.net_worth)}</span>
    ),
  },
  {
    key: 'actions',
    header: '',
    align: 'right',
    width: '130px',
    render: (club) => (
      <Link
        to={`/clubes/${club.id}`}
        className="table-action-link"
        onClick={(e) => e.stopPropagation()}
      >
        <span>Ver clube</span>
        <ChevronRight size={14} />
      </Link>
    ),
  },
];

export const ClubsPage: React.FC = () => {
  const navigate = useNavigate();
  const { openCreateClubModal } = useLeagueSummary();
  const [sort, setSort] = useState<ClubSortOption>('name');

  const fetchClubs = useCallback(() => clubsService.list(sort), [sort]);
  const { data, isLoading, error, reload } = useAsyncResource(
    fetchClubs,
    'Não foi possível carregar a lista de clubes.'
  );
  const clubs = data ?? NO_CLUBS;

  const currentSort =
    SORT_OPTIONS.find((option) => option.value === sort) ?? SORT_OPTIONS[0];

  const toolbar =
    clubs.length > 0 ? (
      <div className="clubs-toolbar-row">
        <div className="toolbar-inline">
          <span className="cell-strong">
            {clubs.length} {clubs.length === 1 ? 'clube' : 'clubes'}
          </span>
          <span className="club-count-pill tabular-nums">
            {clubs.length} de {MAX_CLUBS}
          </span>
        </div>

        <OptionPopover
          triggerIcon={<ArrowUpDown size={13} />}
          triggerLabel={`Ordenar: ${currentSort.shortLabel}`}
          title="Ordenar por"
          options={SORT_OPTIONS}
          value={sort}
          onChange={setSort}
          align="right"
          width={250}
        />
      </div>
    ) : undefined;

  return (
    <div>
      <PageHeader
        icon={<Shield size={20} />}
        title="Clubes"
        subtitle={`Cada clube começa com 300,00 em caixa e sem jogadores. A liga aceita no máximo ${MAX_CLUBS} clubes.`}
        actions={
          <Button
            variant="primary"
            leftIcon={<Plus size={15} />}
            onClick={openCreateClubModal}
          >
            Novo clube
          </Button>
        }
      />

      <DataTable
        toolbar={toolbar}
        columns={columns}
        data={clubs}
        rowKey={(club) => club.id}
        isLoading={isLoading}
        error={error}
        onRetry={reload}
        onRowClick={(club) => navigate(`/clubes/${club.id}`)}
        emptyIcon={<Shield size={20} />}
        emptyTitle="Nenhum clube cadastrado"
        emptyDescription="Crie um clube para começar a comprar jogadores, montar a escalação e disputar a liga."
        emptyAction={
          <Button
            variant="primary"
            leftIcon={<Plus size={14} />}
            onClick={openCreateClubModal}
          >
            Novo clube
          </Button>
        }
      />
    </div>
  );
};
