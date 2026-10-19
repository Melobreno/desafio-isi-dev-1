import React, { useState } from 'react';
import { Check, Download, History, X } from 'lucide-react';
import type { TransactionItem } from '../../types/api';
import { marketService } from '../../services/marketService';
import { ApiError } from '../../services/apiClient';
import { downloadCsvFile } from '../../utils/csvExport';
import {
  formatCurrency,
  formatDateTimePtBr,
  formatSignedCurrency,
} from '../../utils/formatters';
import type { useClubTransactions } from '../../hooks/useClubTransactions';
import { DataTable, type DataTableColumn } from '../ui/DataTable';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { OptionPopover } from '../ui/OptionPopover';
import { useToast } from '../ui/Toast';

type ClubTransactions = ReturnType<typeof useClubTransactions>;

interface ClubTransactionsTabProps {
  club: { id: number; acronym: string };
  history: ClubTransactions;
}

const SIGN_CLASS = {
  success: 'amount-positive',
  destructive: 'amount-negative',
} as const;

function signedAmountClass(value: number): string {
  if (value > 0) return SIGN_CLASS.success;
  if (value < 0) return SIGN_CLASS.destructive;
  return '';
}

const columns: DataTableColumn<TransactionItem>[] = [
  {
    key: 'created_at',
    header: 'Data e hora',
    width: '190px',
    render: (tx) => (
      <span className="tabular-nums cell-muted">
        {formatDateTimePtBr(tx.created_at).replace(',', '')} (-03:00)
      </span>
    ),
  },
  {
    key: 'type',
    header: 'Tipo',
    width: '125px',
    render: (tx) =>
      tx.type === 'COMPRA' ? (
        <Badge variant="primary">↙ COMPRA</Badge>
      ) : (
        <Badge variant="success">↗ VENDA</Badge>
      ),
  },
  {
    key: 'player',
    header: 'Jogador',
    render: (tx) => (
      <div className="cell-identity">
        <Avatar name={tx.player_name} seed={tx.player_id} size={26} />
        <span className="cell-identity-name">{tx.player_name}</span>
      </div>
    ),
  },
  {
    key: 'value',
    header: 'Valor',
    align: 'right',
    width: '120px',
    render: (tx) => (
      <span className="tabular-nums cell-strong">{formatCurrency(tx.value)}</span>
    ),
  },
  {
    key: 'fee',
    header: 'Taxa ou comissão',
    align: 'right',
    width: '145px',
    render: (tx) => <span className="tabular-nums">{formatCurrency(tx.fee)}</span>,
  },
  {
    key: 'penalty',
    header: 'Multa',
    align: 'right',
    width: '115px',
    render: (tx) => (
      <span className="tabular-nums cell-muted">
        {tx.type === 'VENDA' ? formatCurrency(tx.penalty) : '—'}
      </span>
    ),
  },
  {
    key: 'profit',
    header: 'Lucro',
    align: 'right',
    width: '120px',
    render: (tx) =>
      tx.type === 'COMPRA' || tx.profit === null ? (
        <span className="cell-muted">—</span>
      ) : (
        <span className={`tabular-nums cell-strong ${signedAmountClass(tx.profit)}`}>
          {formatSignedCurrency(tx.profit).replace(/\s+/g, '')}
        </span>
      ),
  },
  {
    key: 'cash_change',
    header: 'Variação do caixa',
    align: 'right',
    width: '150px',
    render: (tx) => (
      <span className={`tabular-nums cell-bold ${signedAmountClass(tx.cash_change)}`}>
        {formatSignedCurrency(tx.cash_change).replace(/\s+/g, '')}
      </span>
    ),
  },
];

const SummaryCell: React.FC<{ label: string; value: number; signed?: boolean }> = ({
  label,
  value,
  signed = false,
}) => (
  <div className="tx-summary-cell">
    <span className="tx-summary-label">{label}</span>
    <span
      className={`tx-summary-value tabular-nums ${signed ? signedAmountClass(value) : ''}`}
    >
      {signed ? formatSignedCurrency(value).replace(/\s+/g, '') : formatCurrency(value)}
    </span>
  </div>
);

const TypeCheckbox: React.FC<{
  label: string;
  checked: boolean;
  onToggle: () => void;
}> = ({ label, checked, onToggle }) => (
  <button
    type="button"
    role="checkbox"
    aria-checked={checked}
    className={`tx-type-checkbox-pill${checked ? ' checked' : ''}`}
    onClick={onToggle}
  >
    <span className="tx-checkbox-box">
      {checked && <Check size={11} strokeWidth={3} />}
    </span>
    <span>{label}</span>
  </button>
);

export const ClubTransactionsTab: React.FC<ClubTransactionsTabProps> = ({
  club,
  history,
}) => {
  const { showToast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const { transactions, summary, filters } = history;

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      const csv = await marketService.exportClubTransactionsCsv(club.id, {
        type: filters.type,
        player_id: filters.playerId,
      });
      const filename = `transacoes-${club.acronym.toLowerCase()}.csv`;
      downloadCsvFile(csv, filename);
      showToast({
        title: 'CSV exportado',
        description: `O arquivo ${filename} foi baixado com ${transactions.length} ${
          transactions.length === 1 ? 'transação' : 'transações'
        }.`,
      });
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Não foi possível exportar o CSV',
        description:
          err instanceof ApiError
            ? err.message
            : 'Ocorreu um erro ao exportar o histórico de transações.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const playerOptions = [
    { value: 0, label: 'Todos os jogadores' },
    ...history.playerOptions.map((p) => ({ value: p.id, label: p.name })),
  ];
  const selectedPlayerLabel =
    playerOptions.find((option) => option.value === Number(filters.playerId))?.label ??
    `Jogador #${filters.playerId}`;

  const footer =
    transactions.length > 0 ? (
      <div className="tx-summary-footer">
        <SummaryCell label="Total pago em compras" value={summary.total_spent} />
        <SummaryCell label="Total recebido em vendas" value={summary.total_received} />
        <SummaryCell label="Taxas e comissões" value={summary.total_fees} />
        <SummaryCell label="Multas" value={summary.total_penalties} />
        <SummaryCell label="Lucro total" value={summary.total_profit} signed />
      </div>
    ) : undefined;

  return (
    <div className="club-tab-stack">
      <div className="transactions-toolbar-bar">
        <div className="transactions-filters-left">
          <div className="tx-filter-group">
            <span className="tx-filter-label">Tipo</span>
            <TypeCheckbox
              label="Compra"
              checked={filters.includeCompra}
              onToggle={() => history.toggleType('COMPRA')}
            />
            <TypeCheckbox
              label="Venda"
              checked={filters.includeVenda}
              onToggle={() => history.toggleType('VENDA')}
            />
          </div>

          <div className="tx-filter-group">
            <span className="tx-filter-label">Jogador</span>
            <OptionPopover
              triggerLabel={selectedPlayerLabel}
              title="Filtrar por jogador"
              options={playerOptions}
              value={Number(filters.playerId) || 0}
              onChange={(id) => history.setPlayerId(id === 0 ? '' : id)}
              isActive={Boolean(filters.playerId)}
            />
          </div>

          {filters.hasActiveFilters && (
            <button
              type="button"
              className="filter-clear-all-btn"
              onClick={history.resetFilters}
            >
              <X size={12} />
              <span>Limpar filtros</span>
            </button>
          )}
        </div>

        <div className="transactions-actions-right">
          <span className="tabular-nums cell-muted">
            {transactions.length} {transactions.length === 1 ? 'transação' : 'transações'}
          </span>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Download size={13} />}
            isLoading={isExporting}
            disabled={transactions.length === 0}
            onClick={handleExportCsv}
          >
            Exportar CSV
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={transactions}
        rowKey={(tx) => tx.id}
        isLoading={history.isLoading}
        error={history.error}
        onRetry={history.reload}
        footer={footer}
        emptyIcon={<History size={20} />}
        emptyTitle="Nenhuma transação encontrada"
        emptyDescription={
          filters.hasActiveFilters
            ? 'Nenhuma transação corresponde aos filtros selecionados.'
            : 'As compras e vendas de jogadores deste clube aparecerão registradas aqui.'
        }
      />
    </div>
  );
};
