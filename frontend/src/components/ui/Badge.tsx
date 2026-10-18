import React from 'react';
import type { PlayerCondition, PlayerPosition } from '../../types/api';
import { CONDITION_SHORT_LABELS, POSITION_SHORT_LABELS } from '../../utils/formatters';

export interface BadgeProps {
  variant?: 'neutral' | 'outline' | 'primary' | 'success' | 'warning' | 'destructive';
  dotColor?: string;
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  dotColor,
  children,
  className = '',
}) => {
  return (
    <span className={`badge badge-${variant} ${className}`.trim()}>
      {dotColor && <span className="badge-dot" style={{ backgroundColor: dotColor }} />}
      {children}
    </span>
  );
};

export const PositionBadge: React.FC<{ position: PlayerPosition }> = ({ position }) => {
  return <Badge variant="outline">{POSITION_SHORT_LABELS[position] || position}</Badge>;
};

export const ConditionBadge: React.FC<{ condition: PlayerCondition }> = ({
  condition,
}) => {
  const config: Record<
    PlayerCondition,
    { variant: BadgeProps['variant']; dot: string; label: string }
  > = {
    APTO: {
      variant: 'success',
      dot: 'var(--success)',
      label: CONDITION_SHORT_LABELS.APTO,
    },
    MAL_CONDICIONADO: {
      variant: 'warning',
      dot: 'var(--warning)',
      label: CONDITION_SHORT_LABELS.MAL_CONDICIONADO,
    },
    DOENTE: {
      variant: 'destructive',
      dot: 'var(--destructive)',
      label: CONDITION_SHORT_LABELS.DOENTE,
    },
  };

  const item = config[condition] ?? config.APTO;
  return (
    <Badge variant={item.variant} dotColor={item.dot}>
      {item.label}
    </Badge>
  );
};
