import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { ClubFormModal } from '../modals/ClubFormModal';
import { useLeagueSummary } from '../../context/LeagueSummaryContext';

export const AppLayout: React.FC = () => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { isCreateClubModalOpen, closeCreateClubModal } = useLeagueSummary();

  return (
    <div className={`app-shell ${isHomePage ? 'no-sidebar' : ''}`}>
      {!isHomePage && (
        <Sidebar
          isOpenMobile={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
          isCollapsed={isSidebarCollapsed}
        />
      )}
      <div className="main-area">
        <Topbar
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebarCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
          showSidebarControls={!isHomePage}
        />
        <main className={`page-container ${isHomePage ? 'home-page-container' : ''}`}>
          <Outlet />
        </main>
      </div>

      <ClubFormModal open={isCreateClubModalOpen} onClose={closeCreateClubModal} />
    </div>
  );
};
