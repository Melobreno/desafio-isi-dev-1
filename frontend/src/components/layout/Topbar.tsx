import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Menu,
  PanelLeft,
  Play,
  RefreshCw,
  Shield,
  Sparkles,
  Swords,
  Users,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { useLeagueSummary } from '../../context/LeagueSummaryContext';
import logoCompact from '../../assets/logo-medium.svg';

interface TopbarProps {
  onOpenMobileMenu: () => void;
  isSidebarCollapsed: boolean;
  onToggleSidebarCollapse: () => void;
  showSidebarControls?: boolean;
}

function formatDeltaLabel(delta: number): string {
  if (delta > 0) {
    return delta === 1 ? '1 novo' : `${delta} novos`;
  }
  if (delta < 0) {
    const abs = Math.abs(delta);
    return abs === 1 ? '-1 removido' : `-${abs} removidos`;
  }
  return '0 novo';
}

export const Topbar: React.FC<TopbarProps> = ({
  onOpenMobileMenu,
  isSidebarCollapsed,
  onToggleSidebarCollapse,
  showSidebarControls = true,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { clubs, hasUnseenUpdates, lastDiff, refreshSummary } = useLeagueSummary();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const popoverContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!popoverOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverContainerRef.current &&
        !popoverContainerRef.current.contains(e.target as Node)
      ) {
        setPopoverOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [popoverOpen]);

  const handleRefreshClick = async () => {
    setIsRefreshing(true);
    try {
      await refreshSummary('manual');
      setPopoverOpen(true);
    } finally {
      setIsRefreshing(false);
    }
  };

  const getBreadcrumb = (): {
    section: string;
    subSection?: { title: string; path: string };
    page: string;
  } => {
    const path = location.pathname;
    if (path === '/') return { section: 'Passe', page: 'Início' };
    if (path.startsWith('/jogadores')) return { section: 'Mercado', page: 'Jogadores' };
    if (path === '/clubes') return { section: 'Mercado', page: 'Clubes' };
    if (path.startsWith('/clubes/')) {
      const clubIdStr = path.split('/')[2];
      const foundClub = clubs.find((c) => String(c.id) === clubIdStr);
      return {
        section: 'Clubes',
        subSection: { title: 'Clubes', path: '/clubes' },
        page: foundClub ? foundClub.name : 'Clube não encontrado',
      };
    }
    if (path.startsWith('/liga/classificacao'))
      return { section: 'Liga', page: 'Classificação' };
    if (path.startsWith('/liga/jogos/')) {
      return {
        section: 'Liga',
        subSection: { title: 'Partidas', path: '/liga/jogos' },
        page: 'Detalhes da partida',
      };
    }
    if (path.startsWith('/liga/jogos')) return { section: 'Liga', page: 'Partidas' };
    if (path.startsWith('/mercado/historico'))
      return { section: 'Mercado', page: 'Histórico de transações' };
    return { section: 'Passe', page: 'Painel' };
  };

  const { section, subSection, page } = getBreadcrumb();

  const timeFormatter = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const checkedTimeStr = timeFormatter.format(lastDiff.checkedAt);
  const alteredTimeStr = lastDiff.lastAlteredAt
    ? timeFormatter.format(lastDiff.lastAlteredAt)
    : null;

  return (
    <header className="topbar">
      <div className="topbar-left">
        {showSidebarControls ? (
          <>
            <button
              type="button"
              className="btn btn-ghost btn-icon mobile-menu-btn"
              onClick={onOpenMobileMenu}
              aria-label="Abrir menu"
            >
              <Menu size={18} />
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-icon desktop-collapse-btn"
              onClick={onToggleSidebarCollapse}
              aria-label={
                isSidebarCollapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'
              }
              title={
                isSidebarCollapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'
              }
            >
              <PanelLeft size={16} />
            </button>
            <span className="topbar-divider" aria-hidden="true" />
          </>
        ) : (
          <>
            <Link
              to="/"
              className="sidebar-logo-link"
              title="Passe — Página Inicial"
              style={{ marginRight: 8, display: 'inline-flex', alignItems: 'center' }}
            >
              <img src={logoCompact} alt="Passe" style={{ width: 26, height: 26 }} />
            </Link>
            <span className="topbar-divider" aria-hidden="true" />
          </>
        )}
        <nav className="topbar-breadcrumb" aria-label="Breadcrumb">
          <span>{section}</span>
          {subSection && (
            <>
              <span>›</span>
              <span
                role="button"
                tabIndex={0}
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(subSection.path)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') navigate(subSection.path);
                }}
              >
                {subSection.title}
              </span>
            </>
          )}
          <span>›</span>
          <strong>{page}</strong>
        </nav>
      </div>

      <div className="topbar-right" ref={popoverContainerRef}>
        <button
          type="button"
          className={`btn btn-ghost btn-icon topbar-refresh-btn ${popoverOpen ? 'active' : ''}`}
          onClick={() => {
            void handleRefreshClick();
          }}
          disabled={isRefreshing}
          aria-label="Atualizar dados da tela"
          title="Verificar atualizações da liga"
        >
          <RefreshCw size={15} className={isRefreshing ? 'spin-icon' : ''} />
          {hasUnseenUpdates && <span className="topbar-refresh-dot" />}
        </button>

        {popoverOpen && (
          <div
            className="topbar-refresh-popover"
            role="dialog"
            aria-label="Status de atualização"
          >
            <div className="topbar-refresh-header">
              <div
                className={`topbar-refresh-status-icon ${lastDiff.hasUpdates ? 'has-updates' : ''}`}
              >
                {lastDiff.hasUpdates ? (
                  <Sparkles size={15} />
                ) : (
                  <CheckCircle2 size={15} />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="topbar-refresh-title">
                  {lastDiff.hasUpdates
                    ? 'Resumo da última alteração'
                    : 'Dados da liga sincronizados'}
                </div>
                <div className="topbar-refresh-sub tabular-nums">
                  {alteredTimeStr
                    ? `Última alteração às ${alteredTimeStr}`
                    : `Verificado às ${checkedTimeStr}`}
                </div>
              </div>
            </div>

            <div className="topbar-refresh-list">
              <div className="topbar-refresh-row">
                <div className="topbar-refresh-row-left">
                  <Swords size={14} className="topbar-refresh-row-icon" />
                  <div>
                    <div className="topbar-refresh-row-label">Atualizações da liga</div>
                    <div className="topbar-refresh-row-meta tabular-nums">
                      {lastDiff.totalMatches} partida(s) registrada(s)
                    </div>
                  </div>
                </div>
                <span
                  className={`topbar-refresh-badge tabular-nums ${
                    lastDiff.newMatches !== 0 ? 'highlight' : ''
                  }`}
                >
                  {formatDeltaLabel(lastDiff.newMatches)}
                </span>
              </div>

              <div className="topbar-refresh-row">
                <div className="topbar-refresh-row-left">
                  <Users size={14} className="topbar-refresh-row-icon" />
                  <div>
                    <div className="topbar-refresh-row-label">Jogadores cadastrados</div>
                    <div className="topbar-refresh-row-meta tabular-nums">
                      {lastDiff.totalPlayers} jogador(es) ativo(s)
                    </div>
                  </div>
                </div>
                <span
                  className={`topbar-refresh-badge tabular-nums ${
                    lastDiff.newPlayers !== 0 ? 'highlight' : ''
                  }`}
                >
                  {formatDeltaLabel(lastDiff.newPlayers)}
                </span>
              </div>

              <div className="topbar-refresh-row">
                <div className="topbar-refresh-row-left">
                  <Shield size={14} className="topbar-refresh-row-icon" />
                  <div>
                    <div className="topbar-refresh-row-label">Clubes cadastrados</div>
                    <div className="topbar-refresh-row-meta tabular-nums">
                      {lastDiff.totalClubs} clube(s) na liga
                    </div>
                  </div>
                </div>
                <span
                  className={`topbar-refresh-badge tabular-nums ${
                    lastDiff.newClubs !== 0 ? 'highlight' : ''
                  }`}
                >
                  {formatDeltaLabel(lastDiff.newClubs)}
                </span>
              </div>
            </div>

            <div className="topbar-refresh-footer">
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Play size={13} />}
                style={{ width: '100%' }}
                onClick={() => {
                  setPopoverOpen(false);
                  navigate('/liga/jogos?simular=1');
                }}
              >
                Simular jogo
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
