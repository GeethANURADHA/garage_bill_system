import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const Layout = () => {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
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
