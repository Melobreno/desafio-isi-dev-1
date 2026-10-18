import React from 'react';
import { Avatar } from './Avatar';
import { PositionBadge } from './Badge';
import type { PlayerResponse } from '../../types/api';
import { POSITION_LABELS, formatCurrency } from '../../utils/formatters';

interface PlayerSummaryCardProps {
  player: PlayerResponse;
}

/**
 * Player identity card shown at the top of the buy and sell dialogs
 * (avatar, name, position, age and current market value).
 */
export const PlayerSummaryCard: React.FC<PlayerSummaryCardProps> = ({ player }) => (
  <div className="modal-player-summary-card">
    <div className="player-summary-identity">
      <Avatar name={player.name} seed={player.id} size={36} />
      <div>
        <div className="player-summary-name">{player.name}</div>
        <div className="player-summary-meta">
          <PositionBadge position={player.position} />
          <span>
            {POSITION_LABELS[player.position]} · {player.age} anos
          </span>
        </div>
      </div>
    </div>
    <div className="player-summary-value">
      <div className="player-summary-value-label">Valor de mercado</div>
      <div className="player-summary-value-number tabular-nums">
        {formatCurrency(player.market_value)}
      </div>
    </div>
  </div>
);
