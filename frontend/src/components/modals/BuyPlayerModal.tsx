import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Calendar, CheckCircle2, Clock, Info, Plus } from 'lucide-react';
import type { BuyPlayerResponse, ClubResponse, PlayerResponse } from '../../types/api';
import { marketService } from '../../services/marketService';
import { ApiError } from '../../services/apiClient';
import {
  formatCurrency,
  formatDateTimePtBr,
  getDefaultLoyaltyDateTimeLocal,
  localDateTimeInputToBrasiliaIso,
} from '../../utils/formatters';
import { validateBuyPlayerForm } from '../../utils/validators';
import { Dialog } from '../ui/Dialog';
import { FormField } from '../ui/FormField';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import { Badge } from '../ui/Badge';
import { PlayerSummaryCard } from '../ui/PlayerSummaryCard';
import { SummaryCard, SummaryRow } from '../ui/SummaryCard';
import { useToast } from '../ui/Toast';
import { useLeagueSummary } from '../../context/LeagueSummaryContext';

interface BuyPlayerModalProps {
  open: boolean;
  onClose: () => void;
  player: PlayerResponse | null;
  defaultClubId?: number | null;
  onSuccess: () => void;
}

const BuyReceipt: React.FC<{
  receipt: BuyPlayerResponse;
  club: ClubResponse | undefined;
  onClose: () => void;
}> = ({ receipt, club, onClose }) => {
  const navigate = useNavigate();
  const clubLabel = club ? club.name : `Clube #${receipt.club_id}`;

  return (
    <Dialog
      open={true}
      onClose={onClose}
      title={
        <span className="modal-receipt-header-title">
          <span className="modal-receipt-check-badge">
            <CheckCircle2 size={16} />
          </span>
          <span>Compra concluída</span>
        </span>
      }
      subtitle={`${receipt.player_name} agora é do ${clubLabel}.`}
      size="sm"
      footer={
        <>
          <Button
            variant="secondary"
            rightIcon={<ArrowRight size={14} />}
            onClick={() => {
              onClose();
              navigate(`/clubes/${receipt.club_id}`);
            }}
          >
            Ver clube
          </Button>
          <Button variant="primary" onClick={onClose}>
            Fechar
          </Button>
        </>
      }
    >
      <SummaryCard>
        <SummaryRow label="Valor">{formatCurrency(receipt.value)}</SummaryRow>
        <SummaryRow label="Taxa">{formatCurrency(receipt.fee)}</SummaryRow>
        <SummaryRow label="Custo total" highlight>
          {formatCurrency(receipt.value + receipt.fee)}
        </SummaryRow>
        <SummaryRow label="Fim da fidelidade">
          {formatDateTimePtBr(receipt.contract.loyalty_until).replace(',', '')} (-03:00)
        </SummaryRow>
        <SummaryRow label="Contrato" numeric={false}>
          <Badge variant="success" dotColor="var(--success)">
            {receipt.contract.status}
          </Badge>
        </SummaryRow>
        <SummaryRow label={`Novo caixa do ${clubLabel}`} highlight>
          {formatCurrency(receipt.club_cash)}
        </SummaryRow>
      </SummaryCard>
    </Dialog>
  );
};

const BuyPlayerContent: React.FC<{
  player: PlayerResponse;
  defaultClubId: number | null;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ player, defaultClubId, onClose, onSuccess }) => {
  const { showToast } = useToast();
  const { clubs, clubsMap, refreshSummary, openCreateClubModal } = useLeagueSummary();

  const initialClub = defaultClubId ?? (clubs.length > 0 ? clubs[0].id : '');
  const [clubId, setClubId] = useState<string>(initialClub ? String(initialClub) : '');

  const defaultDateTime = useMemo(() => getDefaultLoyaltyDateTimeLocal(180), []);
  const [loyaltyDate, setLoyaltyDate] = useState<string>(
    defaultDateTime.split('T')[0] || ''
  );
  const [loyaltyTime, setLoyaltyTime] = useState<string>(
    defaultDateTime.split('T')[1] || '14:30'
  );

  const [fieldErrors, setFieldErrors] = useState<Record<string, string | undefined>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<BuyPlayerResponse | null>(null);

  const selectedClub = useMemo(() => {
    const idNum = Number(clubId);
    return Number.isFinite(idNum) ? (clubsMap[idNum] ?? null) : null;
  }, [clubId, clubsMap]);

  const combinedLoyalty =
    loyaltyDate && loyaltyTime ? `${loyaltyDate}T${loyaltyTime}` : '';

  const clearFieldError = (field: string) => {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    const validation = validateBuyPlayerForm({ clubId, loyaltyUntil: combinedLoyalty });
    if (Object.keys(validation).length > 0) {
      setFieldErrors(validation);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const response = await marketService.buy(player.id, {
        club_id: Number(clubId),
        loyalty_until: localDateTimeInputToBrasiliaIso(combinedLoyalty),
      });
      const buyerClub = clubsMap[response.club_id];

      showToast({
        title: 'Compra concluída',
        description: `${response.player_name} comprado pelo ${
          buyerClub ? buyerClub.name : `Clube #${response.club_id}`
        } por ${formatCurrency(response.value + response.fee)} (valor ${formatCurrency(
          response.value
        )} + taxa ${formatCurrency(response.fee)}).`,
      });
      await refreshSummary();
      onSuccess();
      setReceipt(response);
    } catch (err) {
      setApiError(
        err instanceof ApiError
          ? err.message
          : 'Não foi possível concluir a compra do jogador.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (receipt) {
    return (
      <BuyReceipt receipt={receipt} club={clubsMap[receipt.club_id]} onClose={onClose} />
    );
  }

  return (
    <Dialog
      open={true}
      onClose={onClose}
      title="Comprar jogador"
      subtitle="A compra é pelo valor de mercado do momento e cria o contrato de fidelidade."
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="buy-player-form"
            variant="primary"
            isLoading={isSubmitting}
            disabled={clubs.length === 0}
          >
            Confirmar compra
          </Button>
        </>
      }
    >
      <form
        id="buy-player-form"
        noValidate
        onSubmit={handleSubmit}
        className="modal-stack"
      >
        {apiError && (
          <Alert
            variant="error"
            title="Não foi possível comprar o jogador"
            description={apiError}
          />
        )}

        <PlayerSummaryCard player={player} />

        {clubs.length === 0 ? (
          <Alert
            variant="warning"
            title="Nenhum clube cadastrado"
            description="Cadastre ao menos um clube antes de realizar a compra de um jogador."
            action={
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Plus size={13} />}
                onClick={() => {
                  onClose();
                  openCreateClubModal();
                }}
              >
                Novo clube
              </Button>
            }
          />
        ) : (
          <>
            <FormField
              label="Clube comprador"
              htmlFor="buy-club-select"
              error={fieldErrors.clubId}
              hint={
                selectedClub
                  ? `Caixa atual: ${formatCurrency(
                      selectedClub.cash
                    )}. O custo total (valor + taxa) pode ir até 50% do caixa.`
                  : 'O custo total (valor + taxa) pode ir até 50% do caixa do clube comprador.'
              }
            >
              <Select
                id="buy-club-select"
                value={clubId}
                hasError={Boolean(fieldErrors.clubId)}
                onChange={(e) => {
                  setClubId(e.target.value);
                  clearFieldError('clubId');
                }}
                placeholder="Selecione um clube..."
                options={clubs.map((c) => ({
                  value: c.id,
                  label: `${c.name} (${c.acronym}) — caixa ${formatCurrency(c.cash)}`,
                }))}
              />
            </FormField>

            <FormField
              label="Fim da fidelidade"
              htmlFor="buy-loyalty-date-input"
              error={fieldErrors.loyaltyUntil}
              hint="Depois do momento da compra e até 1.095 dias. Horário de Brasília; enviado com o fuso (-03:00)."
            >
              <div className="form-grid-2">
                <Input
                  id="buy-loyalty-date-input"
                  type="date"
                  leftIcon={<Calendar size={14} />}
                  value={loyaltyDate}
                  hasError={Boolean(fieldErrors.loyaltyUntil)}
                  onChange={(e) => {
                    setLoyaltyDate(e.target.value);
                    clearFieldError('loyaltyUntil');
                  }}
                />
                <Input
                  id="buy-loyalty-time-input"
                  type="time"
                  leftIcon={<Clock size={14} />}
                  value={loyaltyTime}
                  hasError={Boolean(fieldErrors.loyaltyUntil)}
                  onChange={(e) => {
                    setLoyaltyTime(e.target.value);
                    clearFieldError('loyaltyUntil');
                  }}
                />
              </div>
            </FormField>

            <div className="modal-RuleInfoBox">
              <Info size={15} className="modal-RuleInfoBox-icon" />
              <span>
                A taxa é de 5% do valor de mercado, só quando ele passa de 30,00. Taxa,
                custo e novo caixa são calculados ao confirmar.
              </span>
            </div>
          </>
        )}
      </form>
    </Dialog>
  );
};

export const BuyPlayerModal: React.FC<BuyPlayerModalProps> = ({
  open,
  onClose,
  player,
  defaultClubId = null,
  onSuccess,
}) => {
  if (!open || !player) return null;
  return (
    <BuyPlayerContent
      key={player.id}
      player={player}
      defaultClubId={defaultClubId}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
};
