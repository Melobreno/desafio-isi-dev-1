import React, { useCallback } from 'react';
import { Calendar, CheckCircle2, Swords } from 'lucide-react';
import type { MatchDetail, PlayerCondition, PlayerPosition } from '../../types/api';
import { leagueService } from '../../services/leagueService';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ClubShield } from '../ui/ClubShield';
import { useAsyncResource } from '../../hooks/useAsyncResource';
import {
  CONDITION_LABELS,
  formatDateTimePtBr,
  POSITION_LABELS,
} from '../../utils/formatters';

interface MatchDetailModalProps {
  open: boolean;
  matchId: number | null;
  initialMatch?: MatchDetail | null;
  onClose: () => void;
}

const ATTRIBUTE_LABELS: Record<string, string> = {
  shooting: 'Finalização',
  passing: 'Passe',
  dribbling: 'Drible',
  defending: 'Defesa',
};

export const MatchDetailModal: React.FC<MatchDetailModalProps> = ({
  open,
  matchId,
  initialMatch,
  onClose,
}) => {
  const fetchMatch = useCallback(async (): Promise<MatchDetail | null> => {
    if (!open) return null;
    if (initialMatch) return initialMatch;
    if (!matchId) return null;
    return leagueService.getMatchById(matchId);
  }, [open, initialMatch, matchId]);

  const {
    data: fetchedMatch,
    isLoading,
    error,
  } = useAsyncResource(fetchMatch, 'Não foi possível carregar a partida.');

  const match = initialMatch ?? fetchedMatch;

  const getResultBadge = (result: string) => {
    if (result === 'MANDANTE') {
      return <Badge variant="success">Vitória do Mandante</Badge>;
    }
    if (result === 'VISITANTE') {
      return <Badge variant="primary">Vitória do Visitante</Badge>;
    }
    return <Badge variant="neutral">Empate</Badge>;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Swords size={18} color="var(--primary)" />
          <span>Detalhes da Partida</span>
        </div>
      }
      size="lg"
      footer={
        <Button variant="secondary" size="sm" onClick={onClose}>
          Fechar
        </Button>
      }
    >
      {isLoading && (
        <div className="table-state-container">
          <div className="table-spinner" />
          <div className="cell-muted">Carregando duelos da partida...</div>
        </div>
      )}

      {error && (
        <div className="table-state-container">
          <div className="cell-strong">{error}</div>
        </div>
      )}

      {!isLoading && !error && match && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Match Scoreboard Card */}
          <div
            className="card"
            style={{
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              background: 'var(--muted-subtle)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: 12,
                color: 'var(--muted-foreground)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Calendar size={13} />
                <span>{formatDateTimePtBr(match.played_at)}</span>
              </div>
              {getResultBadge(match.result)}
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto 1fr',
                alignItems: 'center',
                gap: 16,
              }}
            >
              {/* Home Team */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  justifyContent: 'flex-start',
                }}
              >
                <ClubShield
                  name={match.home.club_name}
                  clubId={match.home.club_id}
                  size={20}
                  showName={false}
                />
                <div>
                  <div className="cell-strong" style={{ fontSize: 15 }}>
                    {match.home.club_name}
                  </div>
                  <div className="cell-muted" style={{ fontSize: 11.5 }}>
                    Mandante · Formação {match.home.formation}
                  </div>
                </div>
              </div>

              {/* Score Display */}
              <div className="scoreboard-score">
                {match.home.goals} × {match.away.goals}
              </div>

              {/* Away Team */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  justifyContent: 'flex-end',
                  textAlign: 'right',
                }}
              >
                <div>
                  <div className="cell-strong" style={{ fontSize: 15 }}>
                    {match.away.club_name}
                  </div>
                  <div className="cell-muted" style={{ fontSize: 11.5 }}>
                    Visitante · Formação {match.away.formation}
                  </div>
                </div>
                <ClubShield
                  name={match.away.club_name}
                  clubId={match.away.club_id}
                  size={20}
                  showName={false}
                />
              </div>
            </div>
          </div>

          {/* 6 Duels Section */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 10,
              }}
            >
              <div className="cell-strong" style={{ fontSize: 13.5 }}>
                Os 6 Duelos da Partida (RN20)
              </div>
              <div className="cell-muted" style={{ fontSize: 11.5 }}>
                1 a 3: Ataque Mandante · 4 a 6: Ataque Visitante
              </div>
            </div>

            <div className="duels-list">
              {match.duels.map((duel) => {
                const isHomeAttack = duel.order <= 3;
                const attackingClubName = isHomeAttack
                  ? match.home.club_name
                  : match.away.club_name;

                return (
                  <div
                    key={duel.order}
                    className={`duel-card ${duel.goal ? 'is-goal' : ''}`}
                  >
                    <div className="duel-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Badge variant="neutral">Duelo {duel.order}</Badge>
                        <span className="cell-muted" style={{ fontSize: 11 }}>
                          Ataque do {attackingClubName}
                        </span>
                      </div>

                      {duel.goal ? (
                        <span className="duel-goal-badge">
                          <CheckCircle2 size={13} />
                          GOL!
                        </span>
                      ) : (
                        <span className="duel-saved-badge">Sem gol</span>
                      )}
                    </div>

                    <div className="duel-body">
                      {/* Attacker */}
                      <div className="duel-side attacker">
                        <div className="duel-player-name">
                          {duel.attacker.player_name}
                        </div>
                        <div className="duel-player-stat">
                          {POSITION_LABELS[duel.attacker.position as PlayerPosition] ||
                            duel.attacker.position}{' '}
                          ·{' '}
                          {ATTRIBUTE_LABELS[duel.attacker.attribute] ||
                            duel.attacker.attribute}
                          : <strong>{duel.attacker.value}</strong>
                        </div>
                        {duel.attacker.condition !== 'APTO' && (
                          <div className="cell-muted" style={{ fontSize: 10 }}>
                            {CONDITION_LABELS[duel.attacker.condition as PlayerCondition]}{' '}
                            (-15%)
                          </div>
                        )}
                      </div>

                      <div className="duel-vs-pill">vs</div>

                      {/* Defender */}
                      <div className="duel-side defender">
                        <div className="duel-player-name">
                          {duel.defender.player_name}
                        </div>
                        <div className="duel-player-stat">
                          {POSITION_LABELS[duel.defender.position as PlayerPosition] ||
                            duel.defender.position}{' '}
                          · Defesa: <strong>{duel.defender.value}</strong>
                        </div>
                        {duel.defender.condition !== 'APTO' && (
                          <div className="cell-muted" style={{ fontSize: 10 }}>
                            {CONDITION_LABELS[duel.defender.condition as PlayerCondition]}{' '}
                            (-15%)
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </Dialog>
  );
};
