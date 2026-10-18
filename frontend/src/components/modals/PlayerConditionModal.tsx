import React, { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import type { PlayerCondition, PlayerResponse } from '../../types/api';
import { playersService } from '../../services/playersService';
import { clubsService } from '../../services/clubsService';
import { ApiError } from '../../services/apiClient';
import {
  CONDITION_LABELS,
  POSITION_LABELS,
  formatCurrency,
} from '../../utils/formatters';
import { validateConditionForm } from '../../utils/validators';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import { Avatar } from '../ui/Avatar';
import { ConditionBadge } from '../ui/Badge';
import { useToast } from '../ui/Toast';
import { useLeagueSummary } from '../../context/LeagueSummaryContext';

interface PlayerConditionModalProps {
  open: boolean;
  onClose: () => void;
  player: PlayerResponse | null;
  onSuccess: (updatedPlayer: PlayerResponse) => void;
}

const CONDITION_OPTIONS: Array<{
  value: PlayerCondition;
  title: string;
  description: string;
}> = [
  {
    value: 'APTO',
    title: 'Apto',
    description: 'Sem desconto por condição.',
  },
  {
    value: 'MAL_CONDICIONADO',
    title: 'Mal condicionado',
    description:
      'Desconto de 15%. Agilidade de 80 a 100 corta pela metade; de 1 a 30 soma 10 pontos.',
  },
  {
    value: 'DOENTE',
    title: 'Doente',
    description: 'Desconto de 30%, com o mesmo ajuste de agilidade.',
  },
];

const PlayerConditionContent: React.FC<{
  player: PlayerResponse;
  onClose: () => void;
  onSuccess: (updatedPlayer: PlayerResponse) => void;
}> = ({ player, onClose, onSuccess }) => {
  const { showToast } = useToast();
  const { clubsMap, refreshSummary } = useLeagueSummary();

  const [condition, setCondition] = useState<PlayerCondition>(player.condition);
  const [isStarter, setIsStarter] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    if (player.club_id !== null) {
      clubsService
        .getLineup(player.club_id)
        .then((lineup) => {
          if (active && lineup && Array.isArray(lineup.players)) {
            const found = lineup.players.some((p) => p.id === player.id);
            setIsStarter(found);
          }
        })
        .catch(() => {
          if (active) setIsStarter(false);
        });
    }
    return () => {
      active = false;
    };
  }, [player.club_id, player.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    const validation = validateConditionForm({ condition });
    if (validation.condition) {
      setApiError(validation.condition);
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = await playersService.updateCondition(player.id, { condition });
      showToast({
        title: 'Condição alterada',
        description: `${updated.name} agora está ${CONDITION_LABELS[updated.condition]}. Valor de mercado: ${formatCurrency(updated.market_value)}.`,
      });
      await refreshSummary();
      onSuccess(updated);
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        setApiError(err.message);
      } else {
        setApiError('Não foi possível atualizar a condição física do jogador.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const clubName =
    player.club_id !== null
      ? (clubsMap[player.club_id]?.name ?? `Clube #${player.club_id}`)
      : null;

  return (
    <Dialog
      open={true}
      onClose={onClose}
      title="Alterar condição física"
      subtitle="A condição muda o desconto do valor de mercado, recalculado ao salvar."
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="player-condition-form"
            variant="primary"
            isLoading={isSubmitting}
          >
            Salvar condição
          </Button>
        </>
      }
    >
      <form
        id="player-condition-form"
        noValidate
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
      >
        {apiError && <Alert variant="error" description={apiError} />}

        <div className="condition-player-summary">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <Avatar name={player.name} seed={player.id} size={32} />
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: 13,
                  color: 'var(--foreground)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {player.name}
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>
                {player.position} · {POSITION_LABELS[player.position]} · {player.age} anos
              </div>
            </div>
          </div>
          <ConditionBadge condition={player.condition} />
        </div>

        <div
          className="condition-radio-list"
          role="radiogroup"
          aria-label="Condição física"
        >
          {CONDITION_OPTIONS.map((opt) => {
            const isSelected = condition === opt.value;
            const isCurrent = player.condition === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={isSelected}
                className={`condition-radio-card ${isSelected ? 'active' : ''}`}
                onClick={() => setCondition(opt.value)}
              >
                <span
                  className={`condition-radio-circle ${isSelected ? 'checked' : ''}`}
                />
                <div className="condition-radio-body">
                  <div className="condition-radio-title-row">
                    <span className="condition-radio-title">{opt.title}</span>
                    {isCurrent && <span className="condition-current-pill">Atual</span>}
                  </div>
                  <div className="condition-radio-desc">{opt.description}</div>
                </div>
              </button>
            );
          })}
        </div>

        {condition === 'DOENTE' && player.club_id !== null && isStarter && (
          <div className="condition-starter-warning">
            <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <div style={{ fontWeight: 600, marginBottom: 2 }}>
                {player.name} é titular
              </div>
              <div>
                Ao passar a Doente, ele sai da escalação, e o {clubName} só volta a jogar
                partidas depois de escalar de novo os 5 titulares.
              </div>
            </div>
          </div>
        )}
      </form>
    </Dialog>
  );
};

export const PlayerConditionModal: React.FC<PlayerConditionModalProps> = ({
  open,
  onClose,
  player,
  onSuccess,
}) => {
  if (!open || !player) return null;
  return (
    <PlayerConditionContent
      key={player.id}
      player={player}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
};
