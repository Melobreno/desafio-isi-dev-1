import React, { useState } from 'react';
import { CheckCircle2, History, Info } from 'lucide-react';
import type { PlayerResponse, SellPlayerResponse } from '../../types/api';
import { marketService } from '../../services/marketService';
import { ApiError } from '../../services/apiClient';
import {
  formatCurrency,
  formatDateTimePtBr,
  formatSignedCurrency,
} from '../../utils/formatters';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import { Badge } from '../ui/Badge';
import { PlayerSummaryCard } from '../ui/PlayerSummaryCard';
import { SummaryCard, SummaryRow, toneFromSign } from '../ui/SummaryCard';
import { useToast } from '../ui/Toast';
import { useLeagueSummary } from '../../context/LeagueSummaryContext';

interface SellPlayerModalProps {
  open: boolean;
  onClose: () => void;
  player: PlayerResponse | null;
  clubName: string;
  isStarter?: boolean;
  onSuccess: () => void;
  onViewHistory?: () => void;
}

const ReceiptTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="modal-receipt-header-title">
    <span className="modal-receipt-check-badge">
      <CheckCircle2 size={16} />
    </span>
    <span>{children}</span>
  </span>
);

const SellReceipt: React.FC<{
  receipt: SellPlayerResponse;
  clubName: string;
  onClose: () => void;
  onViewHistory?: () => void;
}> = ({ receipt, clubName, onClose, onViewHistory }) => {
  const penaltyPercent = Math.round((receipt.penalty_rate ?? 0) * 100);
  const isRescinded = receipt.contract_status === 'RESCINDIDO';

  return (
    <Dialog
      open={true}
      onClose={onClose}
      title={<ReceiptTitle>Venda concluída</ReceiptTitle>}
      subtitle={`${receipt.player_name} saiu do ${clubName} e voltou a ficar livre.`}
      size="sm"
      footer={
        <>
          {onViewHistory && (
            <Button
              variant="secondary"
              leftIcon={<History size={14} />}
              onClick={() => {
                onClose();
                onViewHistory();
              }}
            >
              Ver histórico
            </Button>
          )}
          <Button variant="primary" onClick={onClose}>
            Fechar
          </Button>
        </>
      }
    >
      <SummaryCard>
        <SummaryRow label="Valor de compra">
          {formatCurrency(receipt.purchase_value)}
        </SummaryRow>
        <SummaryRow label="Valor de venda">{formatCurrency(receipt.value)}</SummaryRow>
        <SummaryRow label="Dias restantes">{receipt.remaining_days} dias</SummaryRow>
        <SummaryRow label="Multa">
          {receipt.penalty > 0
            ? `${formatCurrency(receipt.penalty)} (${penaltyPercent}%)`
            : formatCurrency(0)}
        </SummaryRow>
        <SummaryRow label="Lucro" tone={toneFromSign(receipt.profit)}>
          {formatSignedCurrency(receipt.profit).replace(/\s+/g, '')}
        </SummaryRow>
        <SummaryRow label="Comissão">{formatCurrency(receipt.fee)}</SummaryRow>
        <SummaryRow label="Crédito no caixa" highlight tone="success">
          +{formatCurrency(receipt.cash_change)}
        </SummaryRow>
        <SummaryRow label="Contrato" numeric={false}>
          <Badge
            variant={isRescinded ? 'warning' : 'neutral'}
            dotColor={isRescinded ? 'var(--warning)' : 'var(--muted-foreground)'}
          >
            {receipt.contract_status}
          </Badge>
        </SummaryRow>
        <SummaryRow label={`Novo caixa do ${clubName}`} highlight>
          {formatCurrency(receipt.club_cash)}
        </SummaryRow>
      </SummaryCard>
    </Dialog>
  );
};

const SellPlayerContent: React.FC<{
  player: PlayerResponse;
  clubName: string;
  isStarter: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onViewHistory?: () => void;
}> = ({ player, clubName, isStarter, onClose, onSuccess, onViewHistory }) => {
  const { showToast } = useToast();
  const { refreshSummary } = useLeagueSummary();

  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<SellPlayerResponse | null>(null);

  const contract = player.contract;
  const penaltyPercent = Math.round((contract?.penalty_rate ?? 0) * 100);

  const handleConfirmSell = async () => {
    setApiError(null);
    setIsSubmitting(true);

    try {
      const response = await marketService.sell(player.id);
      showToast({
        title: 'Venda concluída',
        description: `${response.player_name} vendido por ${formatCurrency(
          response.value
        )}. Crédito de ${formatCurrency(response.cash_change)} no caixa do ${clubName}.`,
      });
      await refreshSummary();
      onSuccess();
      setReceipt(response);
    } catch (err) {
      setApiError(
        err instanceof ApiError
          ? err.message
          : 'Não foi possível concluir a venda do jogador.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (receipt) {
    return (
      <SellReceipt
        receipt={receipt}
        clubName={clubName}
        onClose={onClose}
        onViewHistory={onViewHistory}
      />
    );
  }

  return (
    <Dialog
      open={true}
      onClose={onClose}
      title={`Vender ${player.name}?`}
      subtitle={`O jogador sai do elenco do ${clubName} e volta a ficar livre.`}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button variant="primary" isLoading={isSubmitting} onClick={handleConfirmSell}>
            Confirmar venda
          </Button>
        </>
      }
    >
      <div className="modal-stack">
        {apiError && (
          <Alert
            variant="error"
            title="Não foi possível vender o jogador"
            description={apiError}
          />
        )}

        {isStarter && (
          <Alert
            variant="warning"
            title={`${player.name} é titular`}
            description={`Ao vender, ele sai da escalação, e o ${clubName} só volta a jogar partidas depois de escalar de novo os 5 titulares.`}
          />
        )}

        <PlayerSummaryCard player={player} />

        <SummaryCard>
          <SummaryRow label="Valor de compra">
            {formatCurrency(contract?.purchase_value ?? player.market_value)}
          </SummaryRow>
          <SummaryRow label="Fim da fidelidade">
            {contract?.loyalty_until
              ? `${formatDateTimePtBr(contract.loyalty_until).replace(',', '')} (-03:00)`
              : '—'}
          </SummaryRow>
          <SummaryRow label="Dias restantes">
            {contract?.remaining_days ?? 0} dias
          </SummaryRow>
          <SummaryRow label="% de multa se vender agora" numeric={false}>
            <Badge variant={penaltyPercent > 0 ? 'warning' : 'neutral'}>
              {penaltyPercent}%
            </Badge>
          </SummaryRow>
        </SummaryCard>

        <div className="modal-RuleInfoBox">
          <Info size={15} className="modal-RuleInfoBox-icon" />
          <span>
            A venda é pelo valor de mercado do momento. Multa (teto de 10,00), lucro,
            comissão e crédito são calculados ao confirmar.
          </span>
        </div>
      </div>
    </Dialog>
  );
};

export const SellPlayerModal: React.FC<SellPlayerModalProps> = ({
  open,
  onClose,
  player,
  clubName,
  isStarter = false,
  onSuccess,
  onViewHistory,
}) => {
  if (!open || !player) return null;
  return (
    <SellPlayerContent
      key={player.id}
      player={player}
      clubName={clubName}
      isStarter={isStarter}
      onClose={onClose}
      onSuccess={onSuccess}
      onViewHistory={onViewHistory}
    />
  );
};
