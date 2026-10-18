import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, Building2, Trophy, Swords, Plus, ArrowRight, Play } from 'lucide-react';
import { useLeagueSummary } from '../context/LeagueSummaryContext';
import { PageHeader } from '../components/layout/PageHeader';
import { StatCard } from '../components/ui/StatCard';
import { Button } from '../components/ui/Button';
import { ClubShield } from '../components/ui/ClubShield';
import { formatCurrency, formatDateTimePtBr } from '../utils/formatters';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { clubs, totalPlayers, matches, isLoadingSummary, openCreateClubModal } =
    useLeagueSummary();

  const totalNetWorth = clubs.reduce((acc, c) => acc + c.net_worth, 0);

  return (
    <>
      <PageHeader
        icon={<Trophy size={20} />}
        title="Painel da Liga"
        subtitle="Gerencie jogadores, clubes, contratos de fidelidade, escalações e partidas da temporada."
        actions={
          <>
            <Button
              variant="secondary"
              leftIcon={<Plus size={14} />}
              onClick={openCreateClubModal}
            >
              Novo clube
            </Button>
            <Button
              variant="primary"
              leftIcon={<Users size={14} />}
              onClick={() => navigate('/jogadores?novo=1')}
            >
              Novo jogador
            </Button>
          </>
        }
      />

      <div className="stat-grid">
        <StatCard
          label="Jogadores ativos"
          value={isLoadingSummary ? '...' : totalPlayers}
          subValue="Cadastrados na base da liga"
        />
        <StatCard
          label="Clubes na liga"
          value={isLoadingSummary ? '...' : `${clubs.length} / 20`}
          subValue="Limite máximo de 20 clubes (RN10)"
        />
        <StatCard
          label="Patrimônio somado"
          value={isLoadingSummary ? '...' : formatCurrency(totalNetWorth)}
          subValue="Caixa + valor de mercado dos elencos"
          accentColor="var(--primary)"
        />
        <StatCard
          label="Partidas disputadas"
          value={isLoadingSummary ? '...' : matches.length}
          subValue="Histórico oficial da temporada"
        />
      </div>

      <div className="form-grid-2" style={{ alignItems: 'stretch' }}>
        {/* Card de Clubes */}
        <div
          style={{
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: 18,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 14,
            background: 'var(--background)',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Building2 size={16} color="var(--primary)" />
                <span style={{ fontWeight: 600, fontSize: 14 }}>Clubes cadastrados</span>
              </div>
              <Link
                to="/clubes"
                style={{
                  fontSize: 12,
                  color: 'var(--primary)',
                  textDecoration: 'none',
                  fontWeight: 500,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                Ver todos <ArrowRight size={12} />
              </Link>
            </div>

            {clubs.length === 0 ? (
              <div
                style={{
                  padding: '24px 16px',
                  textAlign: 'center',
                  background: 'var(--muted-subtle)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--muted-foreground)',
                  fontSize: 12,
                }}
              >
                Nenhum clube cadastrado ainda. Crie clubes para comprar jogadores e
                disputar partidas.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {clubs.slice(0, 5).map((club) => (
                  <Link
                    key={club.id}
                    to={`/clubes/${club.id}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border)',
                      textDecoration: 'none',
                      color: 'inherit',
                    }}
                  >
                    <ClubShield
                      name={`${club.name} (${club.acronym})`}
                      clubId={club.id}
                    />
                    <span
                      className="tabular-nums"
                      style={{ fontSize: 12, fontWeight: 600 }}
                    >
                      Patrimônio: {formatCurrency(club.net_worth)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Plus size={13} />}
              onClick={openCreateClubModal}
            >
              Criar clube
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/jogadores')}>
              Ir para mercado de jogadores
            </Button>
          </div>
        </div>

        {/* Card de Últimas Partidas */}
        <div
          style={{
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: 18,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 14,
            background: 'var(--background)',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Swords size={16} color="var(--primary)" />
                <span style={{ fontWeight: 600, fontSize: 14 }}>Últimas partidas</span>
              </div>
              <Link
                to="/liga/jogos"
                style={{
                  fontSize: 12,
                  color: 'var(--primary)',
                  textDecoration: 'none',
                  fontWeight: 500,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                Histórico completo <ArrowRight size={12} />
              </Link>
            </div>

            {matches.length === 0 ? (
              <div
                style={{
                  padding: '24px 16px',
                  textAlign: 'center',
                  background: 'var(--muted-subtle)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--muted-foreground)',
                  fontSize: 12,
                }}
              >
                Nenhuma partida disputada até o momento. Escale 5 titulares em dois clubes
                para simular um jogo.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {matches.slice(0, 5).map((match) => (
                  <Link
                    key={match.id}
                    to={`/liga/jogos?match=${match.id}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border)',
                      textDecoration: 'none',
                      color: 'inherit',
                      fontSize: 12,
                    }}
                  >
                    <span style={{ fontWeight: 500 }}>{match.home.club_name}</span>
                    <span
                      className="tabular-nums"
                      style={{
                        fontWeight: 700,
                        padding: '2px 8px',
                        background: 'var(--muted)',
                        borderRadius: 4,
                      }}
                    >
                      {match.home.goals} × {match.away.goals}
                    </span>
                    <span style={{ fontWeight: 500 }}>{match.away.club_name}</span>
                    <span
                      className="tabular-nums"
                      style={{ fontSize: 11, color: 'var(--muted-foreground)' }}
                    >
                      {formatDateTimePtBr(match.played_at)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Play size={13} />}
              onClick={() => navigate('/liga/jogos?simular=1')}
            >
              Simular partida
            </Button>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Trophy size={13} />}
              onClick={() => navigate('/liga/classificacao')}
            >
              Ver classificação
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};
