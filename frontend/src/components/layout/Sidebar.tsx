import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Users, Shield, Swords, ListOrdered, Plus, Trophy, Clock } from 'lucide-react';
import logoFull from '../../assets/logo+nameComplet.svg';
import logoCompact from '../../assets/logo-medium.svg';
import { useLeagueSummary } from '../../context/LeagueSummaryContext';

interface SidebarProps {
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  isCollapsed: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpenMobile,
  onCloseMobile,
  isCollapsed,
}) => {
  const { clubs, totalPlayers, matches, latestMatch, openCreateClubModal } =
    useLeagueSummary();

  return (
    <>
      <div
        className={`sidebar-overlay ${isOpenMobile ? 'open' : ''}`}
        onClick={onCloseMobile}
      />
      <aside
        className={`sidebar ${isOpenMobile ? 'open' : ''} ${isCollapsed ? 'collapsed' : ''}`}
        aria-label="Menu lateral"
      >
        <div className="sidebar-header">
          <Link
            to="/"
            onClick={onCloseMobile}
            className="sidebar-logo-link"
            title="Passe — Gestão da liga"
          >
            {isCollapsed ? (
              <img src={logoCompact} alt="Passe" className="sidebar-logo-compact" />
            ) : (
              <img
                src={logoFull}
                alt="Passe — Gestão da liga"
                className="sidebar-logo-full"
              />
            )}
          </Link>
        </div>

        <div className="sidebar-body">
          {/* Mercado */}
          <div className="sidebar-section">
            {!isCollapsed && (
              <div className="sidebar-section-header">
                <span>Mercado</span>
              </div>
            )}
            <NavLink
              to="/jogadores"
              onClick={onCloseMobile}
              title="Jogadores"
              className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="sidebar-nav-item-left">
                <Users size={16} className="sidebar-nav-icon" />
                {!isCollapsed && <span className="sidebar-nav-label">Jogadores</span>}
              </span>
              {!isCollapsed && (
                <span className="sidebar-item-count tabular-nums">{totalPlayers}</span>
              )}
            </NavLink>

            <NavLink
              to="/clubes"
              end
              onClick={onCloseMobile}
              title="Clubes"
              className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="sidebar-nav-item-left">
                <Shield size={16} className="sidebar-nav-icon" />
                {!isCollapsed && <span className="sidebar-nav-label">Clubes</span>}
              </span>
              {!isCollapsed && (
                <span className="sidebar-item-count tabular-nums">{clubs.length}</span>
              )}
            </NavLink>
          </div>

          {/* Liga */}
          <div className="sidebar-section">
            {!isCollapsed && (
              <div className="sidebar-section-header">
                <span>Liga</span>
              </div>
            )}
            <NavLink
              to="/liga/jogos"
              onClick={onCloseMobile}
              title="Partidas"
              className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="sidebar-nav-item-left">
                <Swords size={16} className="sidebar-nav-icon" />
                {!isCollapsed && <span className="sidebar-nav-label">Partidas</span>}
              </span>
              {!isCollapsed && (
                <span className="sidebar-item-count tabular-nums">{matches.length}</span>
              )}
            </NavLink>

            <NavLink
              to="/liga/classificacao"
              onClick={onCloseMobile}
              title="Classificação"
              className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="sidebar-nav-item-left">
                <ListOrdered size={16} className="sidebar-nav-icon" />
                {!isCollapsed && <span className="sidebar-nav-label">Classificação</span>}
              </span>
            </NavLink>
          </div>

          {isCollapsed && clubs.length > 0 && (
            <div className="sidebar-collapsed-divider" />
          )}

          {/* Clubes */}
          <div className="sidebar-section">
            {!isCollapsed && (
              <div className="sidebar-section-header">
                <span>Clubes</span>
                <button
                  type="button"
                  className="sidebar-section-action"
                  onClick={() => {
                    onCloseMobile();
                    openCreateClubModal();
                  }}
                  title="Novo clube"
                  aria-label="Criar novo clube"
                >
                  <Plus size={14} />
                </button>
              </div>
            )}

            <div className="sidebar-clubs-list">
              {clubs.map((club) => {
                const initial = club.name.trim().charAt(0).toUpperCase() || 'C';
                return (
                  <NavLink
                    key={club.id}
                    to={`/clubes/${club.id}`}
                    onClick={onCloseMobile}
                    title={`${club.name} (${club.acronym})`}
                    className={({ isActive }) =>
                      `sidebar-club-item ${isActive ? 'active' : ''}`
                    }
                  >
                    <span className="sidebar-club-badge">{initial}</span>
                    {!isCollapsed && (
                      <span className="sidebar-club-name">{club.name}</span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer: Resumo da Liga & Última Partida */}
        <div className="sidebar-footer">
          {isCollapsed ? (
            <Link
              to={latestMatch ? `/liga/jogos?match=${latestMatch.id}` : '/liga/jogos'}
              onClick={onCloseMobile}
              className="sidebar-footer-collapsed-btn"
              title={
                latestMatch
                  ? `Última partida: ${latestMatch.home.club_name} ${latestMatch.home.goals} × ${latestMatch.away.goals} ${latestMatch.away.club_name}`
                  : 'Liga Fictícia 2026 — Partidas'
              }
            >
              <Swords size={16} />
            </Link>
          ) : (
            <div className="sidebar-summary-card">
              <div className="sidebar-summary-row">
                <div className="sidebar-summary-icon-box">
                  <Trophy size={14} />
                </div>
                <div className="sidebar-summary-info">
                  <div className="sidebar-summary-title">Liga Fictícia 2026</div>
                  <div className="sidebar-summary-sub tabular-nums">
                    {clubs.length} clubes · {totalPlayers} jogadores
                  </div>
                </div>
              </div>

              <Link
                to={latestMatch ? `/liga/jogos?match=${latestMatch.id}` : '/liga/jogos'}
                onClick={onCloseMobile}
                className="sidebar-summary-row sidebar-summary-row-link"
              >
                <div className="sidebar-summary-icon-box">
                  <Swords size={14} />
                </div>
                <div className="sidebar-summary-info">
                  <div className="sidebar-summary-title">Última partida</div>
                  <div className="sidebar-summary-sub tabular-nums">
                    {latestMatch
                      ? `${latestMatch.home.club_name} ${latestMatch.home.goals} × ${latestMatch.away.goals} ${latestMatch.away.club_name}`
                      : 'Nenhuma partida realizada'}
                  </div>
                </div>
              </Link>

              <div className="sidebar-summary-timezone">
                <Clock size={12} />
                <span>Horário de Brasília (UTC-3)</span>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
