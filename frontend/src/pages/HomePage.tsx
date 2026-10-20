import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ArrowRightLeft,
  ChevronRight,
  Clock,
  History,
  Shield,
  ShoppingCart,
  Swords,
  Trophy,
  Users,
} from 'lucide-react';
import { useLeagueSummary } from '../context/LeagueSummaryContext';
import { leagueService } from '../services/leagueService';
import type { StandingRow } from '../types/api';
import { SoccerPitchSvg } from '../components/ui/SoccerPitch';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { clubs, totalPlayers, freePlayersCount, matches } = useLeagueSummary();
  const [standings, setStandings] = useState<StandingRow[]>([]);

  useEffect(() => {
    let active = true;
    if (matches.length > 0) {
      leagueService
        .listStandings()
        .then((data: StandingRow[]) => {
          if (active && data) {
            setStandings(data);
          }
        })
        .catch(() => {
          // Silent fallback if standings not yet available
        });
    }
    return () => {
      active = false;
    };
  }, [matches.length]);

  // Keyboard shortcut: pressing Enter starts navigating
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }
      if (e.key === 'Enter') {
        navigate('/jogadores');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  const hasMatches = matches.length > 0;
  const leader = standings.length > 0 ? standings[0] : null;

  return (
    <div className="landing-mockup-container">
      <div className="landing-mockup-card">
        {/* Official Soccer Pitch Background Vector (campo area.svg: 1234 x 702) */}
        <div className="landing-pitch-svg-wrap">
          <SoccerPitchSvg
            strokeColor="var(--border)"
            strokeWidth={1.5}
            fillColor="var(--background)"
            className="landing-pitch-svg"
          />
        </div>

        {/* Content Layer */}
        <div className="landing-content-layer">
          {/* Brand Logo & Name */}
          <div className="landing-brand-row">
            <div className="landing-brand-icon" title="Passe">
              <svg
                width="22"
                height="22"
                viewBox="0 0 28 28"
                fill="none"
                aria-hidden="true"
              >
                <rect width="28" height="28" rx="8" fill="#155DFC" />
                <path
                  d="M9.93994 7V21"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  stroke="white"
                />
                <circle
                  cx="13.9999"
                  cy="11.06"
                  r="4.06"
                  stroke="white"
                  strokeWidth="2.8"
                />
                <circle cx="13.9999" cy="11.0598" r="1.008" fill="white" />
              </svg>
            </div>
            <span className="landing-brand-text">Passe</span>
          </div>

          {/* Dynamic Status Badge (W01 / W02) */}
          <div className="landing-status-pill">
            <span className="landing-status-dot" />
            <strong>Liga Fictícia 2026</strong>
            <span className="landing-status-sub">
              {hasMatches && leader
                ? `· líder: ${leader.club_name}, ${leader.points} ${leader.points === 1 ? 'ponto' : 'pontos'}`
                : '· nenhuma partida ainda'}
            </span>
          </div>

          {/* Title & Description */}
          <h1 className="landing-title">Gestão da liga, do mercado à classificação</h1>
          <p className="landing-description">
            Cadastre jogadores, monte os clubes e negocie com contrato de fidelidade.
            Depois, escale os titulares e jogue partidas com placar calculado pelos
            atributos.
          </p>

          {/* CTA & Keyboard Hint */}
          <div className="landing-cta-row">
            <button
              type="button"
              className="landing-start-btn"
              onClick={() => navigate('/jogadores')}
            >
              <span>Iniciar</span>
              <ArrowRight size={15} />
            </button>
            <span className="landing-kbd-hint">
              ou tecle <kbd className="landing-kbd">Enter</kbd>
            </span>
          </div>

          {/* Metrics Row */}
          <div className="landing-metrics-row">
            <span className="landing-metric-item">
              <Users size={14} />
              <span>
                <strong>{totalPlayers}</strong> jogadores
              </span>
            </span>
            <span className="landing-metric-dot">·</span>
            <span className="landing-metric-item">
              <Users size={14} />
              <span>
                <strong>{freePlayersCount}</strong> livres
              </span>
            </span>
            <span className="landing-metric-dot">·</span>
            <span className="landing-metric-item">
              <Shield size={14} />
              <span>
                <strong>{clubs.length}</strong> clubes
              </span>
            </span>
            <span className="landing-metric-dot">·</span>
            <span className="landing-metric-item">
              <Swords size={14} />
              <span>
                <strong>{matches.length}</strong>{' '}
                {matches.length === 1 ? 'partida' : 'partidas'}
              </span>
            </span>
            <span className="landing-metric-dot">·</span>
            <span className="landing-metric-item">
              <Clock size={14} />
              <span>Não precisa de login</span>
            </span>
          </div>

          {/* 6 Step Cards */}
          <div className="landing-steps-row">
            {/* 01 Jogadores */}
            <div
              className="landing-step-card"
              role="button"
              tabIndex={0}
              onClick={() => navigate('/jogadores')}
              onKeyDown={(e) => {
                if (e.key === 'Enter') navigate('/jogadores');
              }}
            >
              <div className="landing-step-top">
                <span className="landing-step-icon">
                  <Users size={16} />
                </span>
                <span className="landing-step-num">01</span>
              </div>
              <div className="landing-step-title">Jogadores</div>
              <div className="landing-step-desc">
                Nascem livres e Apto; o valor de mercado vem da condição, agilidade e
                idade.
              </div>
            </div>

            <span className="landing-step-arrow">
              <ChevronRight size={14} />
            </span>

            {/* 02 Clubes */}
            <div
              className="landing-step-card"
              role="button"
              tabIndex={0}
              onClick={() => navigate('/clubes')}
              onKeyDown={(e) => {
                if (e.key === 'Enter') navigate('/clubes');
              }}
            >
              <div className="landing-step-top">
                <span className="landing-step-icon">
                  <Shield size={16} />
                </span>
                <span className="landing-step-num">02</span>
              </div>
              <div className="landing-step-title">Clubes</div>
              <div className="landing-step-desc">
                Começam com 300,00 em caixa e sem jogadores.
              </div>
            </div>

            <span className="landing-step-arrow">
              <ChevronRight size={14} />
            </span>

            {/* 03 Compra */}
            <div
              className="landing-step-card"
              role="button"
              tabIndex={0}
              onClick={() => navigate('/jogadores')}
              onKeyDown={(e) => {
                if (e.key === 'Enter') navigate('/jogadores');
              }}
            >
              <div className="landing-step-top">
                <span className="landing-step-icon">
                  <ShoppingCart size={16} />
                </span>
                <span className="landing-step-num">03</span>
              </div>
              <div className="landing-step-title">Compra</div>
              <div className="landing-step-desc">
                Valor + taxa, até 50% do caixa, com contrato de fidelidade.
              </div>
            </div>

            <span className="landing-step-arrow">
              <ChevronRight size={14} />
            </span>

            {/* 04 Venda */}
            <div
              className="landing-step-card"
              role="button"
              tabIndex={0}
              onClick={() => navigate('/clubes')}
              onKeyDown={(e) => {
                if (e.key === 'Enter') navigate('/clubes');
              }}
            >
              <div className="landing-step-top">
                <span className="landing-step-icon">
                  <ArrowRightLeft size={16} />
                </span>
                <span className="landing-step-num">04</span>
              </div>
              <div className="landing-step-title">Venda</div>
              <div className="landing-step-desc">
                Multa antes do fim da fidelidade e comissão sobre o lucro.
              </div>
            </div>

            <span className="landing-step-arrow">
              <ChevronRight size={14} />
            </span>

            {/* 05 Histórico */}
            <div
              className="landing-step-card"
              role="button"
              tabIndex={0}
              onClick={() => navigate('/clubes')}
              onKeyDown={(e) => {
                if (e.key === 'Enter') navigate('/clubes');
              }}
            >
              <div className="landing-step-top">
                <span className="landing-step-icon">
                  <History size={16} />
                </span>
                <span className="landing-step-num">05</span>
              </div>
              <div className="landing-step-title">Histórico</div>
              <div className="landing-step-desc">
                Toda compra e venda fica registrada, com totais e CSV.
              </div>
            </div>

            <span className="landing-step-arrow">
              <ChevronRight size={14} />
            </span>

            {/* 06 Liga */}
            <div
              className="landing-step-card"
              role="button"
              tabIndex={0}
              onClick={() => navigate('/liga/classificacao')}
              onKeyDown={(e) => {
                if (e.key === 'Enter') navigate('/liga/classificacao');
              }}
            >
              <div className="landing-step-top">
                <span className="landing-step-icon">
                  <Trophy size={16} />
                </span>
                <span className="landing-step-num">06</span>
              </div>
              <div className="landing-step-title">Liga</div>
              <div className="landing-step-desc">
                Escale 5 titulares e jogue partidas que entram na classificação.
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="landing-footer-text">
            <Clock size={13} />
            <span>Liga Fictícia 2026 · Horário de Brasília (UTC-3)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
