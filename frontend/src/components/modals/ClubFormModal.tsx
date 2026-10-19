import React, { useState } from 'react';
import { Shield, Wallet } from 'lucide-react';
import type { ClubResponse } from '../../types/api';
import { clubsService } from '../../services/clubsService';
import { ApiError } from '../../services/apiClient';
import { validateClubForm } from '../../utils/validators';
import { Dialog } from '../ui/Dialog';
import { FormField } from '../ui/FormField';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import { useToast } from '../ui/Toast';
import { useLeagueSummary } from '../../context/LeagueSummaryContext';

interface ClubFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (club: ClubResponse) => void;
}

const ClubFormContent: React.FC<{
  onClose: () => void;
  onSuccess?: (club: ClubResponse) => void;
}> = ({ onClose, onSuccess }) => {
  const { showToast } = useToast();
  const { refreshSummary } = useLeagueSummary();

  const [name, setName] = useState('');
  const [acronym, setAcronym] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; acronym?: string }>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    const validation = validateClubForm({ name, acronym });
    if (Object.keys(validation).length > 0) {
      setFieldErrors(validation);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const saved = await clubsService.create({
        name: name.trim(),
        acronym: acronym.trim().toUpperCase(),
      });
      showToast({
        title: 'Clube criado',
        description: `${saved.name} (${saved.acronym}) começa com 300,00 em caixa.`,
      });
      await refreshSummary();
      onSuccess?.(saved);
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        setApiError(err.message);
      } else {
        setApiError('Ocorreu um erro inesperado ao criar o clube.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={true}
      onClose={onClose}
      title="Novo clube"
      subtitle="Cadastre um clube para comprar jogadores, escalar o time e disputar a liga."
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="club-form"
            variant="primary"
            isLoading={isSubmitting}
          >
            Criar clube
          </Button>
        </>
      }
    >
      <form
        id="club-form"
        noValidate
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
      >
        {apiError && (
          <Alert
            variant="error"
            title="Não foi possível criar o clube"
            description={apiError}
          />
        )}

        <FormField
          label="Nome"
          htmlFor="club-name-input"
          error={fieldErrors.name}
          hint="De 3 a 60 caracteres e de 2 a 5 palavras; só letras, espaços, hífen e ponto. Não pode repetir outro clube."
        >
          <Input
            id="club-name-input"
            leftIcon={<Shield size={14} />}
            placeholder="Ex.: Águias do Sul"
            value={name}
            hasError={Boolean(fieldErrors.name)}
            onChange={(e) => {
              setName(e.target.value);
              if (fieldErrors.name) {
                setFieldErrors((prev) => ({ ...prev, name: undefined }));
              }
            }}
            autoFocus
          />
        </FormField>

        <FormField
          label="Sigla"
          htmlFor="club-acronym-input"
          error={fieldErrors.acronym}
          hint="3 letras de A a Z, maiúsculas, que aparecem no nome nessa ordem; a primeira é a primeira letra do nome."
        >
          <Input
            id="club-acronym-input"
            placeholder="Ex.: AGS"
            maxLength={3}
            value={acronym}
            hasError={Boolean(fieldErrors.acronym)}
            onChange={(e) => {
              setAcronym(e.target.value.toUpperCase());
              if (fieldErrors.acronym) {
                setFieldErrors((prev) => ({ ...prev, acronym: undefined }));
              }
            }}
          />
        </FormField>

        <div className="modal-RuleInfoBox">
          <Wallet size={15} className="modal-RuleInfoBox-icon" />
          <span>
            O clube começa com <strong>300,00</strong> em caixa e sem jogadores.
          </span>
        </div>
      </form>
    </Dialog>
  );
};

export const ClubFormModal: React.FC<ClubFormModalProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  if (!open) return null;
  return <ClubFormContent onClose={onClose} onSuccess={onSuccess} />;
};
