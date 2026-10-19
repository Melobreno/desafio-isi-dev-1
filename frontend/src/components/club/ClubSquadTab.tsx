import React from 'react';
import { Shirt, ShoppingCart, Tag } from 'lucide-react';
import type { PlayerResponse } from '../../types/api';
import { formatCurrency, formatDateTimePtBr } from '../../utils/formatters';
import { DataTable, type DataTableColumn } from '../ui/DataTable';
import { Badge, ConditionBadge, PositionBadge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';

interface ClubSquadTabProps {
  players: PlayerResponse[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onSelectPlayer: (player: PlayerResponse) => void;
  onSellPlayer: (player: PlayerResponse) => void;
  onBrowseFreePlayers: () => void;
}

export const ClubSquadTab: React.FC<ClubSquadTabProps> = ({
  players,
  isLoading,
  error,
  onRetry,
  onSelectPlayer,
  onSellPlayer,
  onBrowseFreePlayers,
}) => {
  const columns: DataTableColumn<PlayerResponse>[] = [
    {
      key: 'player',
      header: 'Jogador',
      render: (player) => (
        <div className="cell-identity">
          <Avatar name={player.name} seed={player.id} size={32} />
          <div>
            <div className="cell-identity-name">{player.name}</div>
            <div className="cell-identity-meta">{player.age} anos</div>
          </div>
        </div>
      ),
    },
    {
      key: 'position',
      header: 'Posição',
      width: '90px',
      render: (player) => <PositionBadge position={player.position} />,
    },
    {
      key: 'overall',
      header: 'Overall',
      align: 'right',
      width: '85px',
      render: (player) => (
        <span className="overall-pill tabular-nums">{player.overall}</span>
      ),
    },
    {
      key: 'condition',
      header: 'Condição',
      width: '125px',
      render: (player) => <ConditionBadge condition={player.condition} />,
    },
    {
      key: 'market_value',
      header: 'Valor de mercado',
      align: 'right',
      width: '135px',
      render: (player) => (
        <span className="tabular-nums cell-strong">
          {formatCurrency(player.market_value)}
        </span>
      ),
    },
    {
      key: 'purchase_value',
      header: 'Valor de compra',
      align: 'right',
      width: '130px',
      render: (player) => (
        <span className="tabular-nums">
          {formatCurrency(player.contract?.purchase_value ?? player.market_value)}
        </span>
      ),
    },
    {
      key: 'loyalty_until',
      header: 'Fim da fidelidade',
      width: '185px',
      render: (player) => (
        <span className="tabular-nums cell-muted">
          {player.contract?.loyalty_until
            ? `${formatDateTimePtBr(player.contract.loyalty_until).replace(',', '')} (-03:00)`
            : '—'}
        </span>
      ),
    },
    {
      key: 'remaining_days',
      header: 'Dias restantes',
      align: 'right',
      width: '120px',
      render: (player) => (
        <span className="tabular-nums">{player.contract?.remaining_days ?? 0} dias</span>
      ),
    },
    {
      key: 'penalty_rate',
      header: '% de multa',
      align: 'right',
      width: '105px',
      render: (player) => {
        const percent = Math.round((player.contract?.penalty_rate ?? 0) * 100);
        return <Badge variant={percent > 0 ? 'warning' : 'neutral'}>{percent}%</Badge>;
      },
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: '110px',
      render: (player) => (
        <div className="cell-actions" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Tag size={12} />}
            onClick={() => onSellPlayer(player)}
          >
            Vender
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      toolbar={
        players.length > 0 ? (
          <div className="clubs-toolbar-row">
            <span className="cell-strong">
              {players.length} {players.length === 1 ? 'jogador' : 'jogadores'} no elenco
            </span>
          </div>
        ) : undefined
      }
      columns={columns}
      data={players}
      rowKey={(player) => player.id}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      onRowClick={onSelectPlayer}
      emptyIcon={<Shirt size={20} />}
      emptyTitle="Nenhum jogador no elenco"
      emptyDescription="Compre jogadores livres na página de jogadores para montar o elenco do clube."
      emptyAction={
        <Button
          variant="primary"
          leftIcon={<ShoppingCart size={14} />}
          onClick={onBrowseFreePlayers}
        >
          Ver jogadores livres
        </Button>
      }
    />
  );
};
