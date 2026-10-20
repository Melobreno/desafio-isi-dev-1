import React, { useCallback, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowUpDown,
  ChevronRight,
  Plus,
  Search,
  SearchX,
  Shield,
  X,
} from 'lucide-react';
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
  const [search, setSearch] = useState<string>('');

  const fetchClubs = useCallback(() => clubsService.list(sort), [sort]);
  const { data, isLoading, error, reload } = useAsyncResource(
    fetchClubs,
    'Não foi possível carregar a lista de clubes.'
  );
  const clubs = data ?? NO_CLUBS;

  const filteredClubs = useMemo(() => {
    if (!search.trim()) return clubs;
    const term = search.trim().toLowerCase();
    return clubs.filter(
      (c) => c.name.toLowerCase().includes(term) || c.acronym.toLowerCase().includes(term)
    );
  }, [clubs, search]);

  const currentSort =
    SORT_OPTIONS.find((option) => option.value === sort) ?? SORT_OPTIONS[0];

  const toolbar =
    clubs.length > 0 ? (
      <div
        className="clubs-toolbar-row"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          width: '100%',
        }}
      >
        <div
          className="toolbar-inline"
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <span className="cell-strong">
            {filteredClubs.length} {filteredClubs.length === 1 ? 'clube' : 'clubes'}
          </span>
          <span className="club-count-pill tabular-nums">
            {clubs.length} de {MAX_CLUBS}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ position: 'relative', width: 220 }}>
            <Search
              size={14}
              style={{
                position: 'absolute',
                left: 9,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--muted-foreground)',
              }}
            />
            <input
              type="text"
              className="input"
              placeholder="Buscar por nome ou sigla..."
              style={{
                paddingLeft: 28,
                paddingRight: search ? 28 : 10,
                height: 32,
                fontSize: 12.5,
              }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Buscar clube por nome ou sigla"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                style={{
                  position: 'absolute',
                  right: 6,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  padding: 2,
                  cursor: 'pointer',
                  color: 'var(--muted-foreground)',
                  display: 'flex',
                }}
                aria-label="Limpar busca"
              >
                <X size={14} />
              </button>
            )}
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
      </div>
    ) : undefined;

  return (
    <>
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
        data={filteredClubs}
        rowKey={(club) => club.id}
        isLoading={isLoading}
        error={error}
        onRetry={reload}
        onRowClick={(club) => navigate(`/clubes/${club.id}`)}
        emptyIcon={search ? <SearchX size={24} /> : <Shield size={20} />}
        emptyTitle={
          search ? `Nenhum clube encontrado para "${search}"` : 'Nenhum clube cadastrado'
        }
        emptyDescription={
          search
            ? 'Nenhum clube corresponde ao nome ou à sigla informados na busca. Verifique a ortografia ou limpe a busca.'
            : 'Crie um clube para começar a comprar jogadores, montar a escalação e disputar a liga.'
        }
        emptyAction={
          search ? (
            <Button variant="secondary" size="sm" onClick={() => setSearch('')}>
              Limpar busca
            </Button>
          ) : (
            <Button
              variant="primary"
              leftIcon={<Plus size={14} />}
              onClick={openCreateClubModal}
            >
              Novo clube
            </Button>
          )
        }
      />
    </>
  );
};
