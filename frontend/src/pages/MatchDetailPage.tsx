import React, { useCallback, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Check, Swords } from 'lucide-react';
import type { FormationType, MatchDetail } from '../types/api';
import { leagueService } from '../services/leagueService';
import { useLeagueSummary } from '../context/LeagueSummaryContext';
import { useAsyncResource } from '../hooks/useAsyncResource';
import { useToast } from '../components/ui/Toast';
import { formatDateTimePtBr } from '../utils/formatters';
import { SoccerPitchSvg } from '../components/ui/SoccerPitch';

interface PitchPlayer {
  id: number;
  name: string;
  roleLabel: string;
  statValue: number;
  scored: boolean;
  isPoorlyConditioned: boolean;
  side: 'home' | 'away';
  x: number;
  y: number;
}

const ATTRIBUTE_LABELS: Record<string, string> = {
  shooting: 'Finalização',
  passing: 'Passe',
  dribbling: 'Drible',
  defending: 'Defesa',
};

const FORMATION_COORDS: Record<FormationType, { x: number; y: number }[]> = {
  '3-1': [
    { x: 6, y: 50 }, // GOL (dentro da pequena área)
    { x: 20, y: 24 }, // 1ª linha
    { x: 20, y: 50 }, // 2ª linha
    { x: 20, y: 76 }, // 3ª linha
    { x: 40, y: 50 }, // 4ª linha
  ],
  '2-2': [
    { x: 6, y: 50 }, // GOL
    { x: 20, y: 32 }, // 1ª linha
    { x: 20, y: 68 }, // 2ª linha
    { x: 38, y: 32 }, // 3ª linha
    { x: 38, y: 68 }, // 4ª linha
  ],
  '2-1-1': [
    { x: 6, y: 50 }, // GOL
    { x: 19, y: 30 }, // 1ª linha
    { x: 19, y: 70 }, // 2ª linha
    { x: 30, y: 50 }, // 3ª linha
    { x: 41, y: 50 }, // 4ª linha
  ],
  '1-2-1': [
    { x: 6, y: 50 }, // GOL
    { x: 18, y: 50 }, // 1ª linha
    { x: 29, y: 28 }, // 2ª linha
    { x: 29, y: 72 }, // 3ª linha
    { x: 41, y: 50 }, // 4ª linha
  ],
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return '??';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatPlayerShortName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length <= 1) return name;
  return `${parts[0][0]}. ${parts[parts.length - 1]}`;
}

function getAttackerSector(order: number): string {
  if (order === 1 || order === 4) return '4ª linha';
  if (order === 2 || order === 5) return '3ª linha';
  return '2ª linha';
}

function getDefenderSector(order: number): string {
  if (order === 1 || order === 4) return 'Goleiro';
  if (order === 2 || order === 5) return '1ª linha';
  return '2ª linha';
}

export const MatchDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { clubs } = useLeagueSummary();

  const fetchMatch = useCallback(async (): Promise<MatchDetail | null> => {
    if (!id) return null;
    return leagueService.getMatchById(Number(id));
  }, [id]);

  const {
    data: match,
    isLoading,
    error,
    reload,
  } = useAsyncResource(fetchMatch, 'Não foi possível carregar a partida.');

  // Trigger toast notification if query param is true
  useEffect(() => {
    if (match && searchParams.get('nova') === '1') {
      showToast({
        type: 'success',
        title: 'Partida jogada',
        description: `${match.home.club_name} ${match.home.goals} × ${match.away.goals} ${match.away.club_name}. Placar e duelos devolvidos pela API.`,
      });
      const next = new URLSearchParams(searchParams);
      next.delete('nova');
      setSearchParams(next, { replace: true });
    }
  }, [match, searchParams, setSearchParams, showToast]);

  const homeClub = useMemo(
    () => (match ? clubs.find((c) => c.id === match.home.club_id) : null),
    [clubs, match]
  );
  const awayClub = useMemo(
    () => (match ? clubs.find((c) => c.id === match.away.club_id) : null),
    [clubs, match]
  );

  const homeAcronym =
    homeClub?.acronym || match?.home.club_name.slice(0, 3).toUpperCase() || 'MAN';
  const awayAcronym =
    awayClub?.acronym || match?.away.club_name.slice(0, 3).toUpperCase() || 'VIS';

  const outcomeLabel = useMemo(() => {
    if (!match) return '';
    if (match.result === 'MANDANTE') return 'Vitória do mandante';
    if (match.result === 'VISITANTE') return 'Vitória do visitante';
    return 'Empate';
  }, [match]);

  // Reconstruct the 10 players on pitch from the 6 duels (RN20)
  const pitchPlayers = useMemo<PitchPlayer[]>(() => {
    if (!match || !match.duels || match.duels.length < 6) return [];

    const d = match.duels;
    const homeFormation = match.home.formation || '2-2';
    const awayFormation = match.away.formation || '2-2';

    const homeCoords = FORMATION_COORDS[homeFormation] || FORMATION_COORDS['2-2'];
    const awayCoords = FORMATION_COORDS[awayFormation] || FORMATION_COORDS['2-2'];

    // Home: GOL (D4.def), 1ª (D5.def), 2ª (D3.att), 3ª (D2.att), 4ª (D1.att)
    const homeList: PitchPlayer[] = [
      {
        id: d[3].defender.player_id,
        name: d[3].defender.player_name,
        roleLabel: 'GOL',
        statValue: d[3].defender.value,
        scored: false,
        isPoorlyConditioned: d[3].defender.condition === 'MAL_CONDICIONADO',
        side: 'home',
        x: homeCoords[0].x,
        y: homeCoords[0].y,
      },
      {
        id: d[4].defender.player_id,
        name: d[4].defender.player_name,
        roleLabel: '1ª linha',
        statValue: d[4].defender.value,
        scored: false,
        isPoorlyConditioned: d[4].defender.condition === 'MAL_CONDICIONADO',
        side: 'home',
        x: homeCoords[1].x,
        y: homeCoords[1].y,
      },
      {
        id: d[2].attacker.player_id,
        name: d[2].attacker.player_name,
        roleLabel: '2ª linha',
        statValue: d[2].attacker.value,
        scored: d[2].goal,
        isPoorlyConditioned: d[2].attacker.condition === 'MAL_CONDICIONADO',
        side: 'home',
        x: homeCoords[2].x,
        y: homeCoords[2].y,
      },
      {
        id: d[1].attacker.player_id,
        name: d[1].attacker.player_name,
        roleLabel: '3ª linha',
        statValue: d[1].attacker.value,
        scored: d[1].goal,
        isPoorlyConditioned: d[1].attacker.condition === 'MAL_CONDICIONADO',
        side: 'home',
        x: homeCoords[3].x,
        y: homeCoords[3].y,
      },
      {
        id: d[0].attacker.player_id,
        name: d[0].attacker.player_name,
        roleLabel: '4ª linha',
        statValue: d[0].attacker.value,
        scored: d[0].goal,
        isPoorlyConditioned: d[0].attacker.condition === 'MAL_CONDICIONADO',
        side: 'home',
        x: homeCoords[4].x,
        y: homeCoords[4].y,
      },
    ];

    // Away: GOL (D1.def), 1ª (D2.def), 2ª (D6.att), 3ª (D5.att), 4ª (D4.att)
    const awayList: PitchPlayer[] = [
      {
        id: d[0].defender.player_id,
        name: d[0].defender.player_name,
        roleLabel: 'GOL',
        statValue: d[0].defender.value,
        scored: false,
        isPoorlyConditioned: d[0].defender.condition === 'MAL_CONDICIONADO',
        side: 'away',
        x: 100 - awayCoords[0].x,
        y: awayCoords[0].y,
      },
      {
        id: d[1].defender.player_id,
        name: d[1].defender.player_name,
        roleLabel: '1ª linha',
        statValue: d[1].defender.value,
        scored: false,
        isPoorlyConditioned: d[1].defender.condition === 'MAL_CONDICIONADO',
        side: 'away',
        x: 100 - awayCoords[1].x,
        y: awayCoords[1].y,
      },
      {
        id: d[5].attacker.player_id,
        name: d[5].attacker.player_name,
        roleLabel: '2ª linha',
        statValue: d[5].attacker.value,
        scored: d[5].goal,
        isPoorlyConditioned: d[5].attacker.condition === 'MAL_CONDICIONADO',
        side: 'away',
        x: 100 - awayCoords[2].x,
        y: awayCoords[2].y,
      },
      {
        id: d[4].attacker.player_id,
        name: d[4].attacker.player_name,
        roleLabel: '3ª linha',
        statValue: d[4].attacker.value,
        scored: d[4].goal,
        isPoorlyConditioned: d[4].attacker.condition === 'MAL_CONDICIONADO',
        side: 'away',
        x: 100 - awayCoords[3].x,
        y: awayCoords[3].y,
      },
      {
        id: d[3].attacker.player_id,
        name: d[3].attacker.player_name,
        roleLabel: '4ª linha',
        statValue: d[3].attacker.value,
        scored: d[3].goal,
        isPoorlyConditioned: d[3].attacker.condition === 'MAL_CONDICIONADO',
        side: 'away',
        x: 100 - awayCoords[4].x,
        y: awayCoords[4].y,
      },
    ];

    return [...homeList, ...awayList];
  }, [match]);

  const homeAttackingDuels = useMemo(
    () => (match && match.duels ? match.duels.slice(0, 3) : []),
    [match]
  );
  const awayAttackingDuels = useMemo(
    () => (match && match.duels ? match.duels.slice(3, 6) : []),
    [match]
  );

  const homeGoalsInDuels = useMemo(
    () => homeAttackingDuels.filter((d) => d.goal).length,
    [homeAttackingDuels]
  );
  const awayGoalsInDuels = useMemo(
    () => awayAttackingDuels.filter((d) => d.goal).length,
    [awayAttackingDuels]
  );

  if (isLoading) {
    return (
      <div className="table-state-container" style={{ padding: '80px 20px' }}>
        <div className="table-spinner" />
        <div className="cell-muted">Carregando detalhes e duelos da partida...</div>
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="table-state-container" style={{ padding: '80px 20px' }}>
        <div className="cell-strong">{error || 'Partida não encontrada.'}</div>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          style={{ marginTop: 12 }}
          onClick={() => void reload()}
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="match-detail-page">
      {/* Back button */}
      <div>
        <button
          type="button"
          className="match-back-btn"
          onClick={() => navigate('/liga/jogos')}
        >
          <ArrowLeft size={16} />
          <span>Voltar para partidas</span>
        </button>
      </div>

      {/* Scoreboard Card */}
      <div className="match-scoreboard-card">
        {/* Home Club */}
        <div className="match-team-side home">
          <div>
            <div className="match-team-name-lg">{match.home.club_name}</div>
            <div className="match-team-meta-sm">
              Mandante · Formação {match.home.formation}
            </div>
          </div>
          <span className="scoreboard-acronym-pill">{homeAcronym}</span>
        </div>

        {/* Center Score & Info */}
        <div className="scoreboard-center-box">
          <div className="scoreboard-score-badge">
            {match.home.goals} × {match.away.goals}
          </div>
          <div className="scoreboard-date-text">
            {formatDateTimePtBr(match.played_at)}
          </div>
          <div className="scoreboard-outcome-pill">{outcomeLabel}</div>
        </div>

        {/* Away Club */}
        <div className="match-team-side away">
          <span className="scoreboard-acronym-pill">{awayAcronym}</span>
          <div>
            <div className="match-team-name-lg">{match.away.club_name}</div>
            <div className="match-team-meta-sm">
              Visitante · Formação {match.away.formation}
            </div>
          </div>
        </div>
      </div>

      {/* Pitch Section: "Em campo" */}
      <section>
        <div className="match-section-header">
          <div>
            <h2 className="match-section-title">Em campo</h2>
            <p className="match-section-desc">
              Distribuição dos 10 jogadores e resultado individual de cada confronto
            </p>
          </div>

          <div className="match-legend-bar">
            <span className="match-legend-item">
              <span className="pitch-goal-badge" style={{ position: 'static' }}>
                ⚽
              </span>
              <span>Marcou no duelo</span>
            </span>
            <span className="match-legend-item">
              <span className="legend-badge-orange">⚡</span>
              <span>Mal condicionado (-15%)</span>
            </span>
          </div>
        </div>

        <div className="pitch-field-container">
          <div className="pitch-grass-stripes" />

          {/* Official Vector Markings from campo area.svg */}
          <div className="pitch-svg-layer">
            <SoccerPitchSvg
              strokeColor="rgba(255, 255, 255, 0.42)"
              strokeWidth={1.5}
              className="pitch-svg-overlay"
            />
          </div>

          {/* Field Labels - Team Badges in top corners */}
          <div className="pitch-team-label home">
            <span className="pitch-dot blue" />
            <span>{match.home.club_name} (Mandante)</span>
            <span className="pitch-meta-muted">· Formação {match.home.formation}</span>
            <span className="pitch-meta-divider">|</span>
            <span>
              {match.home.goals} {match.home.goals === 1 ? 'gol' : 'gols'}
            </span>
          </div>

          <div className="pitch-team-label away">
            <span>
              {match.away.goals} {match.away.goals === 1 ? 'gol' : 'gols'}
            </span>
            <span className="pitch-meta-divider">|</span>
            <span>{match.away.club_name} (Visitante)</span>
            <span className="pitch-meta-muted">· Formação {match.away.formation}</span>
            <span className="pitch-dot grey" />
          </div>

          {/* Player Nodes */}
          {pitchPlayers.map((player) => (
            <div
              key={`${player.side}-${player.roleLabel}-${player.id}`}
              className="pitch-player-node"
              style={{ left: `${player.x}%`, top: `${player.y}%` }}
            >
              <div className="pitch-player-avatar-wrap">
                <div className={`pitch-avatar-circle ${player.side}`}>
                  {getInitials(player.name)}
                </div>

                {player.scored && (
                  <span className="pitch-goal-badge" title="Marcou gol no confronto">
                    ⚽
                  </span>
                )}

                {player.isPoorlyConditioned && (
                  <span
                    className="pitch-condition-badge"
                    title="Mal condicionado (-15% no teste)"
                  >
                    ⚡
                  </span>
                )}
              </div>

              <div className="pitch-player-name" title={player.name}>
                {formatPlayerShortName(player.name)}
              </div>

              <div className="pitch-player-stat">
                {player.roleLabel} · {player.statValue}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Duels Section */}
      <section>
        <div className="duels-table-card">
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <h2
              className="match-section-title"
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <Swords size={18} color="var(--primary)" />
              <span>Duelos</span>
            </h2>
            <p className="match-section-desc">
              Os 6 confrontos diretos definidos pelas regras da liga (RN20)
            </p>
          </div>

          <table className="duels-table">
            <thead>
              <tr>
                <th style={{ width: 44 }}>#</th>
                <th>Atacante</th>
                <th>Atributo testado</th>
                <th>Defensor</th>
                <th>Defesa</th>
                <th style={{ width: 110, textAlign: 'center' }}>Resultado</th>
              </tr>
            </thead>
            <tbody>
              {/* Group 1: Ataques do Mandante */}
              <tr className="duels-group-header">
                <td colSpan={6}>
                  <div className="duels-group-content">
                    <span className="duels-group-left">
                      <span className="pitch-dot blue" />
                      <span>Ataques do Mandante ({match.home.club_name})</span>
                    </span>
                    <span className="duels-group-goals">
                      Gols marcados: <strong>{homeGoalsInDuels}</strong>
                    </span>
                  </div>
                </td>
              </tr>

              {homeAttackingDuels.map((duel) => {
                const sectorAtt = getAttackerSector(duel.order);
                const sectorDef = getDefenderSector(duel.order);
                const attrName =
                  ATTRIBUTE_LABELS[duel.attacker.attribute] || duel.attacker.attribute;

                return (
                  <tr key={duel.order} className="duel-row">
                    <td className="duel-num-cell">{duel.order}</td>
                    <td>
                      <div className="duel-player-cell">
                        <div className="duel-avatar-circle home">
                          {getInitials(duel.attacker.player_name)}
                        </div>
                        <div className="duel-player-info">
                          <span className="duel-player-name-text">
                            {duel.attacker.player_name}
                          </span>
                          <span className="duel-player-sub-text">
                            {match.home.club_name} · {sectorAtt}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="duel-stat-cell">
                      {attrName} · <strong>{duel.attacker.value}</strong>
                    </td>
                    <td>
                      <div className="duel-player-cell">
                        <div className="duel-avatar-circle away">
                          {getInitials(duel.defender.player_name)}
                        </div>
                        <div className="duel-player-info">
                          <span className="duel-player-name-text">
                            {duel.defender.player_name}
                          </span>
                          <span className="duel-player-sub-text">
                            {match.away.club_name} · {sectorDef}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="duel-stat-cell">
                      Defesa · <strong>{duel.defender.value}</strong>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {duel.goal ? (
                        <span className="duel-outcome-pill-goal">
                          <Check size={12} strokeWidth={3} />
                          <span>Gol</span>
                        </span>
                      ) : (
                        <span className="duel-outcome-pill-saved">Sem gol</span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {/* Group 2: Ataques do Visitante */}
              <tr className="duels-group-header">
                <td colSpan={6}>
                  <div className="duels-group-content">
                    <span className="duels-group-left">
                      <span className="pitch-dot grey" />
                      <span>Ataques do Visitante ({match.away.club_name})</span>
                    </span>
                    <span className="duels-group-goals">
                      Gols marcados: <strong>{awayGoalsInDuels}</strong>
                    </span>
                  </div>
                </td>
              </tr>

              {awayAttackingDuels.map((duel) => {
                const sectorAtt = getAttackerSector(duel.order);
                const sectorDef = getDefenderSector(duel.order);
                const attrName =
                  ATTRIBUTE_LABELS[duel.attacker.attribute] || duel.attacker.attribute;

                return (
                  <tr key={duel.order} className="duel-row">
                    <td className="duel-num-cell">{duel.order}</td>
                    <td>
                      <div className="duel-player-cell">
                        <div className="duel-avatar-circle away">
                          {getInitials(duel.attacker.player_name)}
                        </div>
                        <div className="duel-player-info">
                          <span className="duel-player-name-text">
                            {duel.attacker.player_name}
                          </span>
                          <span className="duel-player-sub-text">
                            {match.away.club_name} · {sectorAtt}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="duel-stat-cell">
                      {attrName} · <strong>{duel.attacker.value}</strong>
                    </td>
                    <td>
                      <div className="duel-player-cell">
                        <div className="duel-avatar-circle home">
                          {getInitials(duel.defender.player_name)}
                        </div>
                        <div className="duel-player-info">
                          <span className="duel-player-name-text">
                            {duel.defender.player_name}
                          </span>
                          <span className="duel-player-sub-text">
                            {match.home.club_name} · {sectorDef}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="duel-stat-cell">
                      Defesa · <strong>{duel.defender.value}</strong>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {duel.goal ? (
                        <span className="duel-outcome-pill-goal">
                          <Check size={12} strokeWidth={3} />
                          <span>Gol</span>
                        </span>
                      ) : (
                        <span className="duel-outcome-pill-saved">Sem gol</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
