import React, { useCallback, useEffect, useId, useState } from 'react';
import { AlertTriangle, LayoutGrid, Save } from 'lucide-react';
import type {
  FormationType,
  LineupResponse,
  PlayerPosition,
  PlayerResponse,
} from '../../types/api';
import { clubsService } from '../../services/clubsService';
import { useToast } from '../ui/Toast';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import { Badge } from '../ui/Badge';
import { validateLineupForm } from '../../utils/validators';
import { getInitials } from '../../utils/formatters';

interface ClubLineupTabProps {
  clubId: number;
  squad: PlayerResponse[];
  onLineupChanged?: () => void;
}

interface FormationConfig {
  code: FormationType;
  label: string;
  summary: string;
  defenseCount: number;
  midfieldCount: number;
  attackCount: number;
  slots: Array<{
    label: string;
    sector: 'GOL' | 'DEF' | 'MEI' | 'ATA';
    allowedPositions: PlayerPosition[];
  }>;
}

const VERTICAL_FORMATION_DOTS: Record<
  FormationType,
  Array<{ cx: number; cy: number }>
> = {
  '3-1': [
    { cx: 17, cy: 42.5 }, // Goleiro
    { cx: 7.5, cy: 30 }, // Defensor 1
    { cx: 17, cy: 30 }, // Defensor 2
    { cx: 26.5, cy: 30 }, // Defensor 3
    { cx: 17, cy: 11 }, // Atacante
  ],
  '2-2': [
    { cx: 17, cy: 42.5 }, // Goleiro
    { cx: 10, cy: 30 }, // Defensor 1
    { cx: 24, cy: 30 }, // Defensor 2
    { cx: 10, cy: 12 }, // Atacante 1
    { cx: 24, cy: 12 }, // Atacante 2
  ],
  '2-1-1': [
    { cx: 17, cy: 42.5 }, // Goleiro
    { cx: 10, cy: 31 }, // Defensor 1
    { cx: 24, cy: 31 }, // Defensor 2
    { cx: 17, cy: 23 }, // Meio-campo
    { cx: 17, cy: 11 }, // Atacante
  ],
  '1-2-1': [
    { cx: 17, cy: 42.5 }, // Goleiro
    { cx: 17, cy: 32 }, // Defensor
    { cx: 10, cy: 22 }, // Meio-campo 1
    { cx: 24, cy: 22 }, // Meio-campo 2
    { cx: 17, cy: 11 }, // Atacante
  ],
};

const VerticalFieldPitchThumbnail: React.FC<{ formation: FormationType }> = ({
  formation,
}) => {
  const dots = VERTICAL_FORMATION_DOTS[formation] || VERTICAL_FORMATION_DOTS['2-1-1'];

  return (
    <svg
      width="34"
      height="48"
      viewBox="0 0 34 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', flexShrink: 0, borderRadius: 5 }}
      aria-hidden="true"
    >
      {/* Grass background */}
      <rect width="34" height="48" rx="4" fill="#0E4E28" />
      {/* Outer field boundary */}
      <rect
        x="1.5"
        y="1.5"
        width="31"
        height="45"
        rx="3"
        stroke="rgba(255, 255, 255, 0.45)"
        strokeWidth="0.8"
      />
      {/* Halfway line */}
      <line
        x1="1.5"
        y1="23.5"
        x2="32.5"
        y2="23.5"
        stroke="rgba(255, 255, 255, 0.45)"
        strokeWidth="0.8"
      />
      {/* Center circle */}
      <circle
        cx="17"
        cy="23.5"
        r="4.8"
        stroke="rgba(255, 255, 255, 0.45)"
        strokeWidth="0.8"
      />
      {/* Top goal area */}
      <rect
        x="8.5"
        y="1.5"
        width="17"
        height="7.5"
        stroke="rgba(255, 255, 255, 0.45)"
        strokeWidth="0.8"
      />
      {/* Bottom goal area */}
      <rect
        x="8.5"
        y="39"
        width="17"
        height="7.5"
        stroke="rgba(255, 255, 255, 0.45)"
        strokeWidth="0.8"
      />
      {/* Player dots */}
      {dots.map((pt, idx) => (
        <circle key={idx} cx={pt.cx} cy={pt.cy} r="1.85" fill="#FFFFFF" />
      ))}
    </svg>
  );
};

const FORMATIONS: Record<FormationType, FormationConfig> = {
  '3-1': {
    code: '3-1',
    label: '3-1 (3 Defesa, 1 Ataque)',
    summary: 'Defesa 3, ataque 1',
    defenseCount: 3,
    midfieldCount: 0,
    attackCount: 1,
    slots: [
      { label: 'Goleiro', sector: 'GOL', allowedPositions: ['GOL'] },
      { label: 'Defensor 1', sector: 'DEF', allowedPositions: ['ZAG', 'LAT'] },
      { label: 'Defensor 2', sector: 'DEF', allowedPositions: ['ZAG', 'LAT'] },
      { label: 'Defensor 3', sector: 'DEF', allowedPositions: ['ZAG', 'LAT'] },
      { label: 'Atacante', sector: 'ATA', allowedPositions: ['ATA'] },
    ],
  },
  '2-2': {
    code: '2-2',
    label: '2-2 (2 Defesa, 2 Ataque)',
    summary: 'Defesa 2, ataque 2',
    defenseCount: 2,
    midfieldCount: 0,
    attackCount: 2,
    slots: [
      { label: 'Goleiro', sector: 'GOL', allowedPositions: ['GOL'] },
      { label: 'Defensor 1', sector: 'DEF', allowedPositions: ['ZAG', 'LAT'] },
      { label: 'Defensor 2', sector: 'DEF', allowedPositions: ['ZAG', 'LAT'] },
      { label: 'Atacante 1', sector: 'ATA', allowedPositions: ['ATA'] },
      { label: 'Atacante 2', sector: 'ATA', allowedPositions: ['ATA'] },
    ],
  },
  '2-1-1': {
    code: '2-1-1',
    label: '2-1-1 (2 Defesa, 1 Meio, 1 Ataque)',
    summary: 'Defesa 2, meio 1, ataque 1',
    defenseCount: 2,
    midfieldCount: 1,
    attackCount: 1,
    slots: [
      { label: 'Goleiro', sector: 'GOL', allowedPositions: ['GOL'] },
      { label: 'Defensor 1', sector: 'DEF', allowedPositions: ['ZAG', 'LAT'] },
      { label: 'Defensor 2', sector: 'DEF', allowedPositions: ['ZAG', 'LAT'] },
      { label: 'Meio-campo', sector: 'MEI', allowedPositions: ['MEI'] },
      { label: 'Atacante', sector: 'ATA', allowedPositions: ['ATA'] },
    ],
  },
  '1-2-1': {
    code: '1-2-1',
    label: '1-2-1 (1 Defesa, 2 Meio, 1 Ataque)',
    summary: 'Defesa 1, meio 2, ataque 1',
    defenseCount: 1,
    midfieldCount: 2,
    attackCount: 1,
    slots: [
      { label: 'Goleiro', sector: 'GOL', allowedPositions: ['GOL'] },
      { label: 'Defensor', sector: 'DEF', allowedPositions: ['ZAG', 'LAT'] },
      { label: 'Meio-campo 1', sector: 'MEI', allowedPositions: ['MEI'] },
      { label: 'Meio-campo 2', sector: 'MEI', allowedPositions: ['MEI'] },
      { label: 'Atacante', sector: 'ATA', allowedPositions: ['ATA'] },
    ],
  },
};

export const ClubLineupTab: React.FC<ClubLineupTabProps> = ({
  clubId,
  squad,
  onLineupChanged,
}) => {
  const { showToast } = useToast();
  const selectIdPrefix = useId();

  const [lineup, setLineup] = useState<LineupResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedFormation, setSelectedFormation] = useState<FormationType>('2-1-1');
  const [slotPlayerIds, setSlotPlayerIds] = useState<Array<number | null>>([
    null,
    null,
    null,
    null,
    null,
  ]);
  const [isSaving, setIsSaving] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);

  const populateSlotsFromPlayers = useCallback(
    (formation: FormationType, players: PlayerResponse[]) => {
      const config = FORMATIONS[formation];
      const newSlots: Array<number | null> = [null, null, null, null, null];
      const usedIds = new Set<number>();

      // Slot 0: Goalkeeper
      const gk = players.find((p) => p.position === 'GOL');
      if (gk) {
        newSlots[0] = gk.id;
        usedIds.add(gk.id);
      }

      // Slots 1..4: Line players matching config
      for (let i = 1; i < 5; i++) {
        const slotConfig = config.slots[i];
        const match = players.find(
          (p) =>
            !usedIds.has(p.id) &&
            slotConfig.allowedPositions.includes(p.position as PlayerPosition)
        );
        if (match) {
          newSlots[i] = match.id;
          usedIds.add(match.id);
        }
      }

      return newSlots;
    },
    []
  );

  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    let isMounted = true;
    clubsService
      .getLineup(clubId)
      .then((data) => {
        if (!isMounted) return;
        setLineup(data);
        setIsLoading(false);
        if (data.formation && FORMATIONS[data.formation]) {
          setSelectedFormation(data.formation);
          setSlotPlayerIds(populateSlotsFromPlayers(data.formation, data.players));
        } else {
          setSelectedFormation('2-1-1');
          setSlotPlayerIds([null, null, null, null, null]);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(
          err instanceof Error ? err.message : 'Não foi possível carregar a escalação.'
        );
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [clubId, reloadTick, populateSlotsFromPlayers]);

  const handleFormationChange = (newFormation: FormationType) => {
    setSelectedFormation(newFormation);
    setFormErrors({});
    setApiError(null);

    // Repopulate slots using currently selected players
    const currentSelectedPlayers = slotPlayerIds
      .map((id) => squad.find((p) => p.id === id))
      .filter((p): p is PlayerResponse => Boolean(p));

    const newSlots = populateSlotsFromPlayers(newFormation, currentSelectedPlayers);
    setSlotPlayerIds(newSlots);
  };

  const handleSlotChange = (slotIndex: number, playerId: number | null) => {
    setSlotPlayerIds((prev) => {
      const next = [...prev];
      next[slotIndex] = playerId;
      return next;
    });
    setFormErrors({});
    setApiError(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    const errors = validateLineupForm({
      formation: selectedFormation,
      slots: slotPlayerIds,
    });

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const playerIds = slotPlayerIds.filter(
      (id): id is number => typeof id === 'number' && id > 0
    );

    setIsSaving(true);
    try {
      const updated = await clubsService.saveLineup(clubId, {
        formation: selectedFormation,
        player_ids: playerIds,
      });

      setLineup(updated);
      showToast({
        type: 'success',
        title: 'Escalação atualizada',
        description: 'Os 5 titulares e a formação foram salvos com sucesso.',
      });

      if (onLineupChanged) {
        onLineupChanged();
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ||
        (err instanceof Error ? err.message : 'Erro ao salvar escalação do clube.');
      setApiError(msg);
      showToast({
        type: 'error',
        title: 'Erro ao escalar time',
        description: msg,
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="table-state-container">
        <div className="table-spinner" />
        <div className="cell-muted">Carregando escalação do clube...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="table-state-container">
        <AlertTriangle size={32} color="var(--destructive)" />
        <div className="cell-strong">{error}</div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setIsLoading(true);
            setError(null);
            setReloadTick((t) => t + 1);
          }}
        >
          Tentar novamente
        </Button>
      </div>
    );
  }

  const currentConfig = FORMATIONS[selectedFormation];

  // Helper mapping: which players are already selected in another slot
  const selectedIdSet = new Set(slotPlayerIds.filter((id): id is number => id !== null));

  // Squad stats
  const eligibleSquad = squad.filter((p) => p.condition !== 'DOENTE');
  const sickSquadCount = squad.filter((p) => p.condition === 'DOENTE').length;

  const currentStarters = slotPlayerIds
    .map((id) => squad.find((p) => p.id === id))
    .filter((p): p is PlayerResponse => Boolean(p));

  const isLineupComplete = Boolean(lineup?.complete);

  return (
    <div className="club-tab-stack">
      {/* Warning when lineup is incomplete */}
      {!isLineupComplete && (
        <Alert
          variant="warning"
          title="Escalação incompleta — clube impedido de jogar"
          description="O clube não pode disputar partidas até que 5 titulares válidos (1 goleiro e 4 jogadores de linha no esquema tático) estejam escalados."
        />
      )}

      {apiError && (
        <Alert
          variant="error"
          title="Não foi possível salvar a escalação"
          description={apiError}
          onClose={() => setApiError(null)}
        />
      )}

      {sickSquadCount > 0 && (
        <Alert
          variant="info"
          title={`Jogadores indisponíveis (${sickSquadCount})`}
          description="Jogadores com condição física DOENTE não podem ser escalados até retornarem a APTO ou MAL CONDICIONADO."
        />
      )}

      <form onSubmit={(e) => void handleSave(e)}>
        <div className="lineup-layout">
          {/* Form Panel */}
          <div className="lineup-form-panel">
            {/* Formation Selector */}
            <div className="card" style={{ padding: 16 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 14,
                }}
              >
                <div>
                  <div className="cell-strong" style={{ fontSize: 15, fontWeight: 700 }}>
                    Formação
                  </div>
                  <div className="cell-muted" style={{ fontSize: 13, marginTop: 2 }}>
                    Os números contam os jogadores de linha de trás para frente. O goleiro
                    fica fora da conta.
                  </div>
                </div>
                <Badge variant={isLineupComplete ? 'success' : 'warning'}>
                  {isLineupComplete ? 'Escalação Completa' : 'Incompleta'}
                </Badge>
              </div>

              <div className="lineup-formation-picker" role="radiogroup">
                {(Object.keys(FORMATIONS) as FormationType[]).map((f) => {
                  const cfg = FORMATIONS[f];
                  const isActive = selectedFormation === f;
                  return (
                    <button
                      key={f}
                      type="button"
                      role="radio"
                      aria-checked={isActive}
                      className={`lineup-formation-card ${isActive ? 'active' : ''}`}
                      onClick={() => handleFormationChange(f)}
                    >
                      <VerticalFieldPitchThumbnail formation={f} />
                      <div className="lineup-formation-body">
                        <div className="lineup-formation-title-row">
                          <span className="lineup-formation-radio" aria-hidden="true">
                            {isActive && (
                              <span className="lineup-formation-radio-inner" />
                            )}
                          </span>
                          <span className="lineup-formation-name">{cfg.code}</span>
                        </div>
                        <div className="lineup-formation-desc">{cfg.summary}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {formErrors.formation && (
                <div className="form-field-error" style={{ marginTop: 8 }}>
                  {formErrors.formation}
                </div>
              )}
            </div>

            {/* Slots Selection */}
            <div className="card" style={{ padding: 16 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 12,
                }}
              >
                <div>
                  <div className="cell-strong" style={{ fontSize: 14 }}>
                    Titulares da formação ({selectedFormation})
                  </div>
                  <div className="cell-muted" style={{ fontSize: 12 }}>
                    Selecione 1 titular elegível para cada posição da vaga
                  </div>
                </div>
                <div className="cell-muted tabular-nums" style={{ fontSize: 12 }}>
                  {slotPlayerIds.filter((id) => id !== null).length} / 5 escalados
                </div>
              </div>

              <div className="lineup-slots-list">
                {currentConfig.slots.map((slot, index) => {
                  const currentSelectedId = slotPlayerIds[index];
                  const selectElementId = `${selectIdPrefix}-slot-${index}`;

                  // Eligible squad members for this slot:
                  // 1) Position must match slot allowed positions
                  // 2) Condition must NOT be DOENTE
                  // 3) Either not selected yet OR selected in this exact slot
                  const availableOptions = eligibleSquad.filter(
                    (p) =>
                      slot.allowedPositions.includes(p.position as PlayerPosition) &&
                      (!selectedIdSet.has(p.id) || p.id === currentSelectedId)
                  );

                  return (
                    <div key={index} className="lineup-slot-row">
                      <label
                        htmlFor={selectElementId}
                        className="lineup-slot-badge"
                        title={slot.allowedPositions.join(' ou ')}
                      >
                        {slot.sector}
                      </label>
                      <div className="lineup-slot-select">
                        <select
                          id={selectElementId}
                          className="input"
                          value={currentSelectedId ?? ''}
                          onChange={(e) => {
                            const val = e.target.value ? Number(e.target.value) : null;
                            handleSlotChange(index, val);
                          }}
                        >
                          <option value="">Selecione {slot.label}...</option>
                          {availableOptions.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.position} · OVR {p.overall} · {p.condition})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>

              {formErrors.slots && (
                <div className="form-field-error" style={{ marginTop: 10 }}>
                  {formErrors.slots}
                </div>
              )}

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  marginTop: 18,
                  paddingTop: 14,
                  borderTop: '1px solid var(--border)',
                }}
              >
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isSaving}
                  disabled={isSaving}
                  leftIcon={<Save size={15} />}
                >
                  Salvar escalação
                </Button>
              </div>
            </div>
          </div>

          {/* Tactical Pitch Board */}
          <div className="lineup-pitch-card">
            <div className="lineup-pitch-header">
              <div
                className="cell-strong"
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <LayoutGrid size={15} />
                Prancheta tática
              </div>
              <Badge variant="neutral">Formação {selectedFormation}</Badge>
            </div>

            <div className="lineup-pitch-field">
              {/* Sector: ATAQUE */}
              <div className="lineup-pitch-sector">
                {currentStarters
                  .filter((p) => p.position === 'ATA')
                  .map((player) => (
                    <div key={player.id} className="lineup-pitch-player">
                      <div className="lineup-pitch-avatar">
                        {getInitials(player.name)}
                      </div>
                      <div className="lineup-pitch-player-name">{player.name}</div>
                      <div className="lineup-pitch-player-meta">
                        {player.position} · {player.overall}
                      </div>
                    </div>
                  ))}
              </div>

              {/* Sector: MEIO */}
              {currentConfig.midfieldCount > 0 && (
                <div className="lineup-pitch-sector">
                  {currentStarters
                    .filter((p) => p.position === 'MEI')
                    .map((player) => (
                      <div key={player.id} className="lineup-pitch-player">
                        <div className="lineup-pitch-avatar">
                          {getInitials(player.name)}
                        </div>
                        <div className="lineup-pitch-player-name">{player.name}</div>
                        <div className="lineup-pitch-player-meta">
                          {player.position} · {player.overall}
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* Sector: DEFESA */}
              <div className="lineup-pitch-sector">
                {currentStarters
                  .filter((p) => p.position === 'ZAG' || p.position === 'LAT')
                  .map((player) => (
                    <div key={player.id} className="lineup-pitch-player">
                      <div className="lineup-pitch-avatar">
                        {getInitials(player.name)}
                      </div>
                      <div className="lineup-pitch-player-name">{player.name}</div>
                      <div className="lineup-pitch-player-meta">
                        {player.position} · {player.overall}
                      </div>
                    </div>
                  ))}
              </div>

              {/* Sector: GOLEIRO */}
              <div className="lineup-pitch-sector">
                {currentStarters
                  .filter((p) => p.position === 'GOL')
                  .map((player) => (
                    <div key={player.id} className="lineup-pitch-player">
                      <div
                        className="lineup-pitch-avatar"
                        style={{
                          borderColor: 'var(--warning)',
                          background: 'rgba(234, 179, 8, 0.3)',
                        }}
                      >
                        {getInitials(player.name)}
                      </div>
                      <div className="lineup-pitch-player-name">{player.name}</div>
                      <div className="lineup-pitch-player-meta">
                        GOL · {player.overall}
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div
              style={{
                fontSize: 11.5,
                color: 'var(--muted-foreground)',
                textAlign: 'center',
                lineHeight: 1.4,
              }}
            >
              Ordem nos duelos (RN20): 1º ao 4º jogador de linha de trás para frente +
              goleiro.
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
