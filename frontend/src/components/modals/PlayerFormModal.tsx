import React, { useState } from 'react';
import { CheckCircle2, Eye, Info, Lock, SlidersHorizontal, User } from 'lucide-react';
import type { PlayerPosition, PlayerResponse } from '../../types/api';
import { playersService } from '../../services/playersService';
import { ApiError } from '../../services/apiClient';
import { POSITION_LABELS, formatCurrency } from '../../utils/formatters';
import { validatePlayerForm } from '../../utils/validators';
import { Dialog } from '../ui/Dialog';
import { FormField } from '../ui/FormField';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import { useToast } from '../ui/Toast';
import { useLeagueSummary } from '../../context/LeagueSummaryContext';

interface PlayerFormModalProps {
  open: boolean;
  onClose: () => void;
  playerToEdit?: PlayerResponse | null;
  onSuccess: (savedPlayer: PlayerResponse) => void;
  onViewDetails?: (player: PlayerResponse) => void;
}

const POSITIONS: PlayerPosition[] = ['GOL', 'ZAG', 'LAT', 'MEI', 'ATA'];

const ATTRIBUTE_FIELDS = [
  { key: 'pace', label: 'Velocidade' },
  { key: 'shooting', label: 'Finalização' },
  { key: 'passing', label: 'Passe' },
  { key: 'dribbling', label: 'Drible' },
  { key: 'defending', label: 'Defesa' },
  { key: 'physical', label: 'Físico' },
] as const;

const PlayerFormContent: React.FC<{
  playerToEdit: PlayerResponse | null;
  onClose: () => void;
  onSuccess: (savedPlayer: PlayerResponse) => void;
  onViewDetails?: (player: PlayerResponse) => void;
}> = ({ playerToEdit, onClose, onSuccess, onViewDetails }) => {
  const isEditing = Boolean(playerToEdit);
  const { showToast } = useToast();
  const { refreshSummary } = useLeagueSummary();

  const [name, setName] = useState(playerToEdit ? playerToEdit.name : '');
  const [position, setPosition] = useState<PlayerPosition>(
    playerToEdit ? playerToEdit.position : 'MEI'
  );
  const [age, setAge] = useState(playerToEdit ? String(playerToEdit.age) : '23');
  const [agility, setAgility] = useState(
    playerToEdit ? String(playerToEdit.agility) : '70'
  );
  const [potential, setPotential] = useState(
    playerToEdit ? String(playerToEdit.potential) : '82'
  );
  const [attributes, setAttributes] = useState({
    pace: playerToEdit ? String(playerToEdit.pace) : '66',
    shooting: playerToEdit ? String(playerToEdit.shooting) : '62',
    passing: playerToEdit ? String(playerToEdit.passing) : '74',
    dribbling: playerToEdit ? String(playerToEdit.dribbling) : '70',
    defending: playerToEdit ? String(playerToEdit.defending) : '48',
    physical: playerToEdit ? String(playerToEdit.physical) : '58',
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdResult, setCreatedResult] = useState<PlayerResponse | null>(null);

  const runValidation = (
    nextValues?: Partial<{
      name: string;
      position: PlayerPosition;
      age: string;
      agility: string;
      potential: string;
      pace: string;
      shooting: string;
      passing: string;
      dribbling: string;
      defending: string;
      physical: string;
    }>
  ) => {
    return validatePlayerForm({
      name: nextValues?.name ?? name,
      position: nextValues?.position ?? position,
      agility: nextValues?.agility ?? agility,
      age: nextValues?.age ?? age,
      currentAge: playerToEdit?.age,
      potential: nextValues?.potential ?? potential,
      pace: nextValues?.pace ?? attributes.pace,
      shooting: nextValues?.shooting ?? attributes.shooting,
      passing: nextValues?.passing ?? attributes.passing,
      dribbling: nextValues?.dribbling ?? attributes.dribbling,
      defending: nextValues?.defending ?? attributes.defending,
      physical: nextValues?.physical ?? attributes.physical,
      isEdit: isEditing,
    });
  };

  const handleFieldBlur = (fieldKey: string) => {
    const allErrors = runValidation();
    setFieldErrors((prev) => {
      const next = { ...prev };
      if (allErrors[fieldKey]) {
        next[fieldKey] = allErrors[fieldKey];
      } else {
        delete next[fieldKey];
      }
      return next;
    });
  };

  const handleAttributeChange = (key: keyof typeof attributes, val: string) => {
    const nextAttrs = { ...attributes, [key]: val };
    setAttributes(nextAttrs);
    if (hasSubmitted || fieldErrors[key]) {
      const allErrors = runValidation(nextAttrs);
      setFieldErrors((prev) => {
        const next = { ...prev };
        if (allErrors[key]) {
          next[key] = allErrors[key];
        } else {
          delete next[key];
        }
        return next;
      });
    }
  };

  const hasFieldErrors = Object.keys(fieldErrors).length > 0;
  const hasIndicatorErrors = Boolean(
    fieldErrors.pace ||
    fieldErrors.shooting ||
    fieldErrors.passing ||
    fieldErrors.dribbling ||
    fieldErrors.defending ||
    fieldErrors.physical ||
    fieldErrors.potential
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    setHasSubmitted(true);

    const validation = runValidation();

    if (Object.keys(validation).length > 0) {
      setFieldErrors(validation);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    try {
      if (isEditing && playerToEdit) {
        const updated = await playersService.update(playerToEdit.id, {
          name: name.trim(),
          position,
          agility: Number(agility),
          age: Number(age),
        });
        showToast({
          title: 'Jogador atualizado',
          description: `${updated.name} teve os dados salvos. Overall: ${updated.overall} · Valor de mercado: ${formatCurrency(updated.market_value)}.`,
        });
        await refreshSummary();
        onSuccess(updated);
        onClose();
      } else {
        const created = await playersService.create({
          name: name.trim(),
          position,
          agility: Number(agility),
          age: Number(age),
          pace: Number(attributes.pace),
          shooting: Number(attributes.shooting),
          passing: Number(attributes.passing),
          dribbling: Number(attributes.dribbling),
          defending: Number(attributes.defending),
          physical: Number(attributes.physical),
          potential: Number(potential),
        });
        await refreshSummary();
        onSuccess(created);
        setCreatedResult(created);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setApiError(err.message);
      } else {
        setApiError('Não foi possível salvar os dados do jogador.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (createdResult) {
    return (
      <Dialog
        open={true}
        onClose={onClose}
        size="sm"
        title={
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: 'var(--success-soft)',
                border: '1px solid var(--success-border)',
                color: 'var(--success)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CheckCircle2 size={18} />
            </div>
            <span>Jogador cadastrado</span>
          </div>
        }
        subtitle={`${createdResult.name} entrou livre e Apto. Valores em moedas, calculados pela API ao salvar.`}
        footer={
          <>
            {onViewDetails && (
              <Button
                variant="secondary"
                leftIcon={<Eye size={14} />}
                onClick={() => {
                  const target = createdResult;
                  onClose();
                  onViewDetails(target);
                }}
              >
                Ver detalhes
              </Button>
            )}
            <Button variant="primary" onClick={onClose}>
              Fechar
            </Button>
          </>
        }
      >
        <div className="created-summary-card">
          <div className="created-summary-row">
            <div>
              <div className="created-summary-title">Valor base</div>
              <div className="created-summary-sub">
                Calculado no cadastro; não muda depois
              </div>
            </div>
            <div className="created-summary-value-lg tabular-nums">
              {formatCurrency(createdResult.base_value)}
            </div>
          </div>

          <div className="created-summary-row">
            <div>
              <div className="created-summary-title">Valor de mercado</div>
              <div className="created-summary-sub">Com condição, agilidade e idade</div>
            </div>
            <div className="created-summary-value tabular-nums">
              {formatCurrency(createdResult.market_value)}
            </div>
          </div>

          <div className="created-summary-row">
            <div>
              <div className="created-summary-title">Overall</div>
              <div className="created-summary-sub">
                Pelos pesos da posição {POSITION_LABELS[createdResult.position]}
              </div>
            </div>
            <div className="created-summary-value tabular-nums">
              {createdResult.overall}
            </div>
          </div>
        </div>
      </Dialog>
    );
  }

  const rawPotential = Number(potential);
  const potentialPct =
    Number.isFinite(rawPotential) && rawPotential >= 1 && rawPotential <= 99
      ? Math.round((rawPotential / 99) * 100)
      : 0;

  return (
    <Dialog
      open={true}
      onClose={onClose}
      title={isEditing ? 'Editar jogador' : 'Novo jogador'}
      subtitle={
        isEditing
          ? 'Edite nome, posição, idade e agilidade. Os demais dados não mudam.'
          : hasFieldErrors
            ? 'Corrija os campos destacados para salvar.'
            : 'Preencha os dados e os indicadores técnicos. O valor base, o overall e o valor de mercado são calculados ao salvar.'
      }
      size={isEditing ? 'md' : 'lg'}
      footer={
        isEditing ? (
          <>
            <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="player-form"
              variant="primary"
              isLoading={isSubmitting}
            >
              Salvar alterações
            </Button>
          </>
        ) : (
          <div className="modal-footer-split">
            <div className="modal-footer-info">
              <Info size={14} />
              <span>O jogador começa livre e Apto.</span>
            </div>
            <div className="modal-footer-actions">
              <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button
                type="submit"
                form="player-form"
                variant="primary"
                isLoading={isSubmitting}
              >
                Salvar jogador
              </Button>
            </div>
          </div>
        )
      }
    >
      <form
        id="player-form"
        noValidate
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
      >
        {apiError && <Alert variant="error" description={apiError} />}

        {/* Nome */}
        <FormField
          label="Nome"
          htmlFor="player-name"
          error={fieldErrors.name}
          hint="De 3 a 100 caracteres, com pelo menos duas palavras e sem números."
        >
          <Input
            id="player-name"
            leftIcon={<User size={14} />}
            placeholder="Ex: Davi Melo"
            value={name}
            hasError={Boolean(fieldErrors.name)}
            onBlur={() => handleFieldBlur('name')}
            onChange={(e) => {
              const val = e.target.value;
              setName(val);
              if (hasSubmitted || fieldErrors.name) {
                const errs = runValidation({ name: val });
                setFieldErrors((prev) => {
                  const next = { ...prev };
                  if (errs.name) next.name = errs.name;
                  else delete next.name;
                  return next;
                });
              }
            }}
            autoFocus
          />
        </FormField>

        {/* Posição */}
        <FormField
          label="Posição"
          error={fieldErrors.position}
          hint={
            isEditing && playerToEdit?.club_id !== null
              ? 'Jogador com clube não muda de posição: as outras posições ficam desabilitadas.'
              : undefined
          }
        >
          <div className="position-selector-grid" role="radiogroup" aria-label="Posição">
            {POSITIONS.map((pos) => {
              const isSelected = position === pos;
              const isDisabled =
                isEditing &&
                playerToEdit?.club_id !== null &&
                pos !== playerToEdit?.position;
              return (
                <button
                  key={pos}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  disabled={isDisabled}
                  className={`position-card ${isSelected ? 'active' : ''}`}
                  onClick={() => setPosition(pos)}
                >
                  <span className="position-card-code">{pos}</span>
                  <span className="position-card-name">{POSITION_LABELS[pos]}</span>
                </button>
              );
            })}
          </div>
        </FormField>

        {/* Idade, Agilidade e Valor base */}
        <div className={isEditing ? 'form-grid-2' : 'form-grid-3'}>
          <FormField
            label="Idade"
            htmlFor="player-age"
            error={fieldErrors.age}
            hint={
              isEditing && playerToEdit
                ? `De 16 a 45, sem diminuir (atual: ${playerToEdit.age}).`
                : 'De 16 a 45 anos.'
            }
          >
            <Input
              id="player-age"
              type="text"
              inputMode="numeric"
              value={age}
              hasError={Boolean(fieldErrors.age)}
              onBlur={() => handleFieldBlur('age')}
              onChange={(e) => {
                const val = e.target.value;
                setAge(val);
                if (hasSubmitted || fieldErrors.age) {
                  const errs = runValidation({ age: val });
                  setFieldErrors((prev) => {
                    const next = { ...prev };
                    if (errs.age) next.age = errs.age;
                    else delete next.age;
                    return next;
                  });
                }
              }}
            />
          </FormField>

          <FormField
            label="Agilidade"
            htmlFor="player-agility"
            error={fieldErrors.agility}
            hint="De 1 a 100 (até 85 com 35 anos ou mais)."
          >
            <Input
              id="player-agility"
              type="text"
              inputMode="numeric"
              value={agility}
              hasError={Boolean(fieldErrors.agility)}
              onBlur={() => handleFieldBlur('agility')}
              onChange={(e) => {
                const val = e.target.value;
                setAgility(val);
                if (hasSubmitted || fieldErrors.agility) {
                  const errs = runValidation({ agility: val });
                  setFieldErrors((prev) => {
                    const next = { ...prev };
                    if (errs.agility) next.agility = errs.agility;
                    else delete next.agility;
                    return next;
                  });
                }
              }}
            />
          </FormField>

          {!isEditing && (
            <FormField label="Valor base (moedas)" hint="Calculado no cadastro.">
              <div className="readonly-field-box">
                <Lock size={13} />
                <span>Após salvar</span>
              </div>
            </FormField>
          )}
        </div>

        {/* Indicadores técnicos (no cadastro) ou Aviso fixo (na edição) */}
        {!isEditing ? (
          <div className="indicators-section">
            <div>
              <div className="indicators-header-title">Indicadores técnicos</div>
              <div className="indicators-header-sub">
                Seis atributos e o potencial, de 1 a 99. Não mudam depois do cadastro; a
                soma dos seis atributos não pode passar de 480.
              </div>
            </div>

            <div className="indicators-layout">
              <div className="indicators-inputs-grid">
                {ATTRIBUTE_FIELDS.map(({ key, label }) => (
                  <FormField
                    key={key}
                    label={label}
                    htmlFor={`attr-${key}`}
                    error={fieldErrors[key]}
                  >
                    <Input
                      id={`attr-${key}`}
                      type="text"
                      inputMode="numeric"
                      value={attributes[key]}
                      hasError={Boolean(fieldErrors[key])}
                      onBlur={() => handleFieldBlur(key)}
                      onChange={(e) => handleAttributeChange(key, e.target.value)}
                    />
                  </FormField>
                ))}

                <FormField
                  label="Potencial"
                  htmlFor="player-potential"
                  error={fieldErrors.potential}
                  hint="≥ maior atributo; igual a ele com 33+ anos"
                >
                  <Input
                    id="player-potential"
                    type="text"
                    inputMode="numeric"
                    value={potential}
                    hasError={Boolean(fieldErrors.potential)}
                    onBlur={() => handleFieldBlur('potential')}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPotential(val);
                      if (hasSubmitted || fieldErrors.potential) {
                        const errs = runValidation({ potential: val });
                        setFieldErrors((prev) => {
                          const next = { ...prev };
                          if (errs.potential) next.potential = errs.potential;
                          else delete next.potential;
                          return next;
                        });
                      }
                    }}
                  />
                </FormField>

                <FormField label="Overall" hint="Calculado automaticamente">
                  <div className="readonly-field-box">
                    <Lock size={13} />
                    <span>Após salvar</span>
                  </div>
                </FormField>
              </div>

              {/* Card de Prévia dos Atributos */}
              <div className="attr-preview-card">
                <div className="attr-preview-header">
                  <SlidersHorizontal size={12} />
                  <span>Prévia dos atributos</span>
                </div>

                {hasIndicatorErrors ? (
                  <div className="attr-preview-empty">
                    <SlidersHorizontal size={18} style={{ opacity: 0.45 }} />
                    <span>Corrija os valores destacados para ver a prévia.</span>
                  </div>
                ) : (
                  <>
                    <div className="attr-preview-list">
                      {ATTRIBUTE_FIELDS.map(({ key, label }) => {
                        const rawVal = Number(attributes[key]);
                        const validVal =
                          Number.isFinite(rawVal) && rawVal >= 1 && rawVal <= 99
                            ? rawVal
                            : 0;
                        const valPct = Math.round((validVal / 99) * 100);
                        return (
                          <div key={key} className="attr-preview-row">
                            <span className="attr-preview-label">{label}</span>
                            <div className="attr-preview-track">
                              <div
                                className="attr-preview-potential-bar"
                                style={{ width: `${potentialPct}%` }}
                              />
                              <div
                                className="attr-preview-value-bar"
                                style={{ width: `${valPct}%` }}
                              />
                            </div>
                            <span className="attr-preview-val tabular-nums">
                              {validVal || '—'}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="attr-preview-footer">
                      Faixa clara: até o potencial ({potential || '—'}). A prévia só
                      desenha os valores digitados; não calcula overall nem valor base.
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          playerToEdit && (
            <div className="readonly-notice-banner">
              <Lock size={13} />
              <span>
                Não mudam depois do cadastro: valor base (
                {formatCurrency(playerToEdit.base_value)}), indicadores e potencial.
              </span>
            </div>
          )
        )}
      </form>
    </Dialog>
  );
};

export const PlayerFormModal: React.FC<PlayerFormModalProps> = ({
  open,
  onClose,
  playerToEdit = null,
  onSuccess,
  onViewDetails,
}) => {
  if (!open) return null;
  return (
    <PlayerFormContent
      key={playerToEdit ? `edit-${playerToEdit.id}` : 'create-new'}
      playerToEdit={playerToEdit}
      onClose={onClose}
      onSuccess={onSuccess}
      onViewDetails={onViewDetails}
    />
  );
};
