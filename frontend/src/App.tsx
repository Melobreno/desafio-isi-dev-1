import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/ui/Toast';
import { LeagueSummaryProvider } from './context/LeagueSummaryContext';
import { AppLayout } from './components/layout/AppLayout';
import { HomePage } from './pages/HomePage';
import { PlayersPage } from './pages/PlayersPage';
import { ClubsPage } from './pages/ClubsPage';
import { ClubDetailPage } from './pages/ClubDetailPage';
import { StandingsPage } from './pages/StandingsPage';
import { MatchesPage } from './pages/MatchesPage';

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
              <Route path="/liga/classificacao" element={<StandingsPage />} />
              <Route path="/liga/jogos" element={<MatchesPage />} />
              <Route path="*" element={<Navigate to="/jogadores" replace />} />
            </Route>
          </Routes>
        </LeagueSummaryProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
