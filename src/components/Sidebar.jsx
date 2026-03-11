import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Car, Wrench, Receipt, LogOut, Package } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="logo-icon" style={{ boxShadow: '0 4px 10px rgba(34, 197, 94, 0.3)' }}>
          <Package className="text-white" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span className="sidebar-brand" style={{ fontSize: '1.2rem', letterSpacing: '-0.5px' }}>Ishara Motors</span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '600' }}>GARAGE PORTAL</span>
        </div>
      </div>

      <nav className="nav-links">
        <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/vehicles" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Car size={20} />
          <span>Vehicles</span>
        </NavLink>
        <NavLink to="/invoices" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Receipt size={20} />
          <span>Invoices</span>
        </NavLink>
      </nav>

      <button onClick={handleSignOut} className="logout-btn">
        <LogOut size={20} />
        <span>Sign Out</span>
      </button>
    </div>
  );
};

export default Sidebar;
