import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import logo from '../assets/logo.png';

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="app-layout">
      <div 
        className={`sidebar-overlay ${isSidebarOpen ? 'active' : ''}`} 
        onClick={closeSidebar}
      />
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
      
      <main className="main-content">
        <header className="mobile-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <img src={logo} alt="Logo" style={{ height: '32px', borderRadius: '0.25rem' }} />
            <span className="sidebar-brand" style={{ fontSize: '1rem' }}>Ishara Motors</span>
          </div>
          <button 
            onClick={toggleSidebar}
            style={{ background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer' }}
          >
            <Menu size={24} />
          </button>
        </header>

        <div style={{ flex: 1 }}>
          <Outlet />
        </div>
        <footer className="footer">
          Developed by <a href="https://geethanuradha.github.io/" target="_blank" rel="noopener noreferrer">Anusys</a>
        </footer>
      </main>
    </div>
  );
};

export default Layout;
