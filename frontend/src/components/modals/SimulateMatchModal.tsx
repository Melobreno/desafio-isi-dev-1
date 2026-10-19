import React, { useState } from 'react';
import { Play, Swords } from 'lucide-react';
import type { MatchDetail } from '../../types/api';
import { leagueService } from '../../services/leagueService';
import { useLeagueSummary } from '../../context/LeagueSummaryContext';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { FormField } from '../ui/FormField';
import { Alert } from '../ui/Alert';
import { validateMatchForm } from '../../utils/validators';
import { useToast } from '../ui/Toast';

interface SimulateMatchModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (match: MatchDetail) => void;
}

export const SimulateMatchModal: React.FC<SimulateMatchModalProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const { clubs, refreshSummary } = useLeagueSummary();
  const { showToast } = useToast();

  const [homeClubId, setHomeClubId] = useState<string>('');
  const [awayClubId, setAwayClubId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);

  const resetForm = () => {
    setHomeClubId('');
    setAwayClubId('');
    setFormErrors({});
    setApiError(null);
  };

  const handleClose = () => {
    if (!isSubmitting) {
      resetForm();
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    const errors = validateMatchForm({ homeClubId, awayClubId });
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const match = await leagueService.simulateMatch({
        home_club_id: Number(homeClubId),
        away_club_id: Number(awayClubId),
      });

      showToast({
        type: 'success',
        title: 'Partida concluída',
        description: `Resultado: ${match.home.club_name} ${match.home.goals} × ${match.away.goals} ${match.away.club_name}`,
      });

      // Update league context in the background
      void refreshSummary('manual');

      resetForm();
      onSuccess(match);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ||
        (err instanceof Error
          ? err.message
          : 'Erro ao simular a partida. Verifique se os clubes possuem escalação completa.');
      setApiError(msg);
      showToast({
        type: 'error',
        title: 'Não foi possível simular a partida',
        description: msg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Swords size={18} color="var(--primary)" />
          <span>Simular Nova Partida</span>
        </div>
      }
      size="md"
      footer={
        <>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form="simulate-match-form"
            variant="primary"
            size="sm"
            isLoading={isSubmitting}
            disabled={isSubmitting}
            leftIcon={<Play size={14} />}
          >
            Jogar partida
          </Button>
        </>
      }
    >
      <form id="simulate-match-form" onSubmit={(e) => void handleSubmit(e)}>
        <div className="modal-stack">
          {apiError && (
            <Alert
              variant="error"
              title="Partida não realizada"
              description={apiError}
              onClose={() => setApiError(null)}
            />
          )}

          <div className="modal-RuleInfoBox">
            <Swords size={16} className="modal-RuleInfoBox-icon" />
            <div>
              A partida confronta os <strong>5 titulares</strong> escalados de cada clube
              em 6 duelos técnicos (RN20). Clubes com escalação incompleta não podem
              jogar.
            </div>
          </div>

          <FormField
            label="Clube Mandante"
            error={formErrors.homeClubId}
            hint="Time com mando de campo (atacará nos duelos 1 a 3)."
          >
            <select
              className="input"
              value={homeClubId}
              onChange={(e) => {
                setHomeClubId(e.target.value);
                setFormErrors((prev) => ({ ...prev, homeClubId: '' }));
                setApiError(null);
              }}
              disabled={isSubmitting}
            >
              <option value="">Selecione o mandante...</option>
              {clubs.map((club) => (
                <option key={club.id} value={club.id}>
                  {club.name} ({club.acronym})
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            label="Clube Visitante"
            error={formErrors.awayClubId}
            hint="Time adversário (atacará nos duelos 4 a 6)."
          >
            <select
              className="input"
              value={awayClubId}
              onChange={(e) => {
                setAwayClubId(e.target.value);
                setFormErrors((prev) => ({ ...prev, awayClubId: '' }));
                setApiError(null);
              }}
              disabled={isSubmitting}
            >
              <option value="">Selecione o visitante...</option>
              {clubs
                .filter((club) => String(club.id) !== homeClubId)
                .map((club) => (
                  <option key={club.id} value={club.id}>
                    {club.name} ({club.acronym})
                  </option>
                ))}
            </select>
          </FormField>
        </div>
      </form>
    </Dialog>
  );
};
