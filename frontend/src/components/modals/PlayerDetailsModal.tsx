import React, { useEffect, useState } from 'react';
import {
  BarChart2,
  Coins,
  HeartPulse,
  Pencil,
  ShoppingCart,
  Tag,
  TrendingUp,
  X,
} from 'lucide-react';
import type { PlayerResponse } from '../../types/api';
import { playersService } from '../../services/playersService';
import { ApiError } from '../../services/apiClient';
import { formatCurrency } from '../../utils/formatters';
import { Button } from '../ui/Button';
import { ConditionBadge, PositionBadge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import { Alert } from '../ui/Alert';
import { useLeagueSummary } from '../../context/LeagueSummaryContext';

interface PlayerDetailsModalProps {
  open: boolean;
  onClose: () => void;
  playerId: number | null;
  initialPlayer?: PlayerResponse | null;
  onEdit?: (player: PlayerResponse) => void;
  onChangeCondition?: (player: PlayerResponse) => void;
  onBuy?: (player: PlayerResponse) => void;
  onDelete?: (player: PlayerResponse) => void;
}

const ATTRIBUTE_ITEMS: Array<{
  key: keyof Pick<
    PlayerResponse,
    'pace' | 'shooting' | 'passing' | 'dribbling' | 'defending' | 'physical'
  >;
  label: string;
}> = [
  { key: 'pace', label: 'Velocidade' },
  { key: 'shooting', label: 'Finalização' },
  { key: 'passing', label: 'Passe' },
  { key: 'dribbling', label: 'Drible' },
  { key: 'defending', label: 'Defesa' },
  { key: 'physical', label: 'Físico' },
];

export const PlayerDetailsModal: React.FC<PlayerDetailsModalProps> = ({
  open,
  onClose,
  playerId,
  initialPlayer = null,
  onEdit,
  onChangeCondition,
  onBuy,
}) => {
  const { clubsMap } = useLeagueSummary();
  const [fetchedPlayer, setFetchedPlayer] = useState<PlayerResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || playerId === null) return;

    let active = true;
    Promise.resolve()
      .then(() => {
        if (!active) return null;
        if (!initialPlayer || initialPlayer.id !== playerId) {
          setIsLoading(true);
        }
        setError(null);
        return playersService.getById(playerId);
      })
      .then((data) => {
        if (active && data) {
          setFetchedPlayer(data);
        }
      })
      .catch((err) => {
        if (active) {
          if (err instanceof ApiError) {
            setError(err.message);
          } else {
            setError('Não foi possível carregar os detalhes do jogador.');
          }
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [open, playerId, initialPlayer]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const player =
    fetchedPlayer && fetchedPlayer.id === playerId
      ? fetchedPlayer
      : initialPlayer && initialPlayer.id === playerId
        ? initialPlayer
        : null;

  const club = player && player.club_id !== null ? clubsMap[player.club_id] : null;
  const potentialPct = player ? Math.round((player.potential / 99) * 100) : 0;

  return (
    <div
      className="drawer-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <aside
        className="drawer-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Detalhes do jogador"
      >
        {/* Drawer Header */}
        <div className="drawer-header">
          {player ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
              <Avatar name={player.name} seed={player.id} size={40} />
              <div style={{ minWidth: 0 }}>
                <div className="drawer-title">{player.name}</div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    marginTop: 4,
                    flexWrap: 'wrap',
                  }}
                >
                  <PositionBadge position={player.position} />
                  <ConditionBadge condition={player.condition} />
                  {player.club_id === null ? (
                    <span className="club-free-pill">Livre</span>
                  ) : (
                    <span className="club-free-pill">
                      {club
                        ? `${club.acronym} · ${club.name}`
                        : `Clube #${player.club_id}`}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="drawer-title">Detalhes do jogador</div>
          )}

          <button
            type="button"
            className="btn btn-ghost btn-icon"
            onClick={onClose}
            aria-label="Fechar painel"
          >
            <X size={16} />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="drawer-body">
          {error ? (
            <Alert variant="error" description={error} />
          ) : isLoading && !player ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="skeleton" style={{ height: 76, width: '100%' }} />
              <div className="skeleton" style={{ height: 180, width: '100%' }} />
            </div>
          ) : player ? (
            <>
              {/* 2x2 KPI Cards */}
              <div className="drawer-kpi-grid">
                <div className="drawer-kpi-card">
                  <div className="drawer-kpi-top">
                    <span>Valor de mercado</span>
                    <Coins size={13} />
                  </div>
                  <div className="drawer-kpi-value tabular-nums">
                    {formatCurrency(player.market_value)}
                  </div>
                  <div className="drawer-kpi-sub">Calculado automaticamente</div>
                </div>

                <div className="drawer-kpi-card">
                  <div className="drawer-kpi-top">
                    <span>Valor base</span>
                    <Tag size={13} />
                  </div>
                  <div className="drawer-kpi-value tabular-nums">
                    {formatCurrency(player.base_value)}
                  </div>
                  <div className="drawer-kpi-sub">Calculado no cadastro</div>
                </div>

                <div className="drawer-kpi-card">
                  <div className="drawer-kpi-top">
                    <span>Overall</span>
                    <BarChart2 size={13} />
                  </div>
                  <div className="drawer-kpi-value tabular-nums">{player.overall}</div>
                  <div className="drawer-kpi-sub">Calculado pela posição</div>
                </div>

                <div className="drawer-kpi-card">
                  <div className="drawer-kpi-top">
                    <span>Potencial</span>
                    <TrendingUp size={13} />
                  </div>
                  <div className="drawer-kpi-value tabular-nums">{player.potential}</div>
                  <div className="drawer-kpi-sub">Informado no cadastro</div>
                </div>
              </div>

              {/* Technical Indicators */}
              <div className="drawer-indicators-section">
                <div className="drawer-indicators-header">
                  <span
                    style={{ fontWeight: 600, fontSize: 13, color: 'var(--foreground)' }}
                  >
                    Indicadores técnicos
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>
                    Escala de 1 a 99
                  </span>
                </div>

                <div className="drawer-indicators-list">
                  {ATTRIBUTE_ITEMS.map(({ key, label }) => {
                    const val = player[key];
                    const valPct = Math.round((val / 99) * 100);
                    return (
                      <div key={key} className="drawer-indicator-row">
                        <span className="drawer-indicator-label">{label}</span>
                        <div className="attr-preview-track" style={{ height: 6 }}>
                          <div
                            className="attr-preview-potential-bar"
                            style={{ width: `${potentialPct}%` }}
                          />
                          <div
                            className="attr-preview-value-bar"
                            style={{ width: `${valPct}%` }}
                          />
                        </div>
                        <span className="drawer-indicator-val tabular-nums">{val}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="drawer-indicators-legend">
                  <span className="drawer-legend-item">
                    <span className="drawer-legend-dot solid" />
                    Valor do atributo
                  </span>
                  <span className="drawer-legend-item">
                    <span className="drawer-legend-dot soft" />
                    Até o potencial ({player.potential}), que nenhum atributo passa
                  </span>
                </div>
              </div>

              {/* Info Summary Card */}
              <div className="drawer-info-card">
                <div className="drawer-info-row">
                  <span className="drawer-info-label">Idade</span>
                  <span className="drawer-info-value tabular-nums">
                    {player.age} anos
                  </span>
                </div>
                <div className="drawer-info-row">
                  <span className="drawer-info-label">Agilidade</span>
                  <span className="drawer-info-value tabular-nums">{player.agility}</span>
                </div>
                <div className="drawer-info-row">
                  <span className="drawer-info-label">Clube</span>
                  <span className="drawer-info-value">
                    {player.club_id === null
                      ? 'Livre'
                      : club
                        ? `${club.name} (${club.acronym})`
                        : `Clube #${player.club_id}`}
                  </span>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Drawer Footer */}
        {player && (
          <div className="drawer-footer">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {onEdit && (
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<Pencil size={13} />}
                  onClick={() => {
                    onClose();
                    onEdit(player);
                  }}
                >
                  Editar
                </Button>
              )}
              {onChangeCondition && (
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<HeartPulse size={13} />}
                  onClick={() => {
                    onClose();
                    onChangeCondition(player);
                  }}
                >
                  Alterar condição
                </Button>
              )}
            </div>

            {player.club_id === null && onBuy && (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<ShoppingCart size={13} />}
                onClick={() => {
                  onClose();
                  onBuy(player);
                }}
              >
                Comprar
              </Button>
            )}
          </div>
        )}
      </aside>
    </div>
  );
};
