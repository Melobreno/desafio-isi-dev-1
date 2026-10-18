import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { ListOrdered, Swords } from 'lucide-react';
import { ToastProvider } from './components/ui/Toast';
import { LeagueSummaryProvider } from './context/LeagueSummaryContext';
import { AppLayout } from './components/layout/AppLayout';
import { HomePage } from './pages/HomePage';
import { PlayersPage } from './pages/PlayersPage';
import { ClubsPage } from './pages/ClubsPage';
import { ClubDetailPage } from './pages/ClubDetailPage';
import { PageHeader } from './components/layout/PageHeader';
import { Button } from './components/ui/Button';

const ModulePlaceholder: React.FC<{
  icon: React.ReactNode;
  iconVariant?: 'primary' | 'neutral';
  title: string;
  subtitle: React.ReactNode;
  description?: string;
  actions?: React.ReactNode;
}> = ({ icon, iconVariant = 'primary', title, subtitle, description, actions }) => (
  <>
    <PageHeader
      icon={icon}
      iconVariant={iconVariant}
      title={title}
      subtitle={subtitle}
      actions={actions}
    />
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: 32,
        textAlign: 'center',
        background: 'var(--muted-subtle)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <div style={{ fontWeight: 600, fontSize: 15 }}>{title}</div>
      <div style={{ fontSize: 13, color: 'var(--muted-foreground)', maxWidth: 440 }}>
        {description ??
          (typeof subtitle === 'string'
            ? subtitle
            : 'Módulo em implementação conforme o plano de desenvolvimento.')}
      </div>
      <Link to="/jogadores" style={{ textDecoration: 'none' }}>
        <Button variant="primary" size="sm">
          Ir para Jogadores
        </Button>
      </Link>
    </div>
  </>
);

export function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <LeagueSummaryProvider>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/jogadores" element={<PlayersPage />} />
              <Route path="/clubes" element={<ClubsPage />} />
              <Route path="/clubes/:id" element={<ClubDetailPage />} />
              <Route
                path="/liga/classificacao"
                element={
                  <ModulePlaceholder
                    icon={<ListOrdered size={20} />}
                    title="Classificação"
                    subtitle="Todos os clubes, com 3 pontos por vitória e 1 por empate."
                  />
                }
              />
              <Route
                path="/liga/jogos"
                element={
                  <ModulePlaceholder
                    icon={<Swords size={20} />}
                    title="Partidas"
                    subtitle="Jogue partidas entre clubes com os 5 titulares escalados e acompanhe o histórico."
                  />
                }
              />
              <Route path="*" element={<Navigate to="/jogadores" replace />} />
            </Route>
          </Routes>
        </LeagueSummaryProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
