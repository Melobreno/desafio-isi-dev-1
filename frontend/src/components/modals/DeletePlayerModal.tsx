import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import type { PlayerResponse } from '../../types/api';
import { playersService } from '../../services/playersService';
import { ApiError } from '../../services/apiClient';
import { POSITION_LABELS } from '../../utils/formatters';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import { Avatar } from '../ui/Avatar';
import { useToast } from '../ui/Toast';
import { useLeagueSummary } from '../../context/LeagueSummaryContext';

interface DeletePlayerModalProps {
  open: boolean;
  onClose: () => void;
  player: PlayerResponse | null;
  onSuccess: (deletedId: number) => void;
}

const DeletePlayerContent: React.FC<{
  player: PlayerResponse;
  onClose: () => void;
  onSuccess: (deletedId: number) => void;
}> = ({ player, onClose, onSuccess }) => {
  const { showToast } = useToast();
  const { refreshSummary } = useLeagueSummary();

  const [apiError, setApiError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    setApiError(null);
    setIsDeleting(true);
    try {
      await playersService.remove(player.id);
      showToast({
        title: 'Jogador excluído',
        description: `${player.name} saiu da lista. Transações e partidas antigas dele continuam gravadas.`,
      });
      await refreshSummary();
      onSuccess(player.id);
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        setApiError(err.message);
      } else {
        setApiError('Não foi possível excluir o jogador.');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog
      open={true}
      onClose={onClose}
      title={`Excluir ${player.name}?`}
      subtitle="O jogador sai da lista e da busca, mas as transações e as partidas antigas dele continuam como foram gravadas."
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isDeleting}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            leftIcon={<Trash2 size={14} />}
            isLoading={isDeleting}
            onClick={handleConfirmDelete}
          >
            Excluir jogador
          </Button>
        </>
      }
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
        <span className="club-free-pill">Livre</span>
      </div>
    </Dialog>
  );
};

export const DeletePlayerModal: React.FC<DeletePlayerModalProps> = ({
  open,
  onClose,
  player,
  onSuccess,
}) => {
  if (!open || !player) return null;
  return (
    <DeletePlayerContent
      key={player.id}
      player={player}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
};
