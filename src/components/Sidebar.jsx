import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Car, Receipt, LogOut, X, ClipboardList } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';

const Sidebar = ({ isOpen, onClose }) => {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header" style={{ position: 'relative' }}>
        <button 
          onClick={onClose}
          style={{ 
            position: 'absolute', 
            right: '-0.5rem', 
            top: '-0.5rem', 
            background: 'white', 
            border: '1px solid var(--border)', 
            borderRadius: '50%', 
            padding: '0.25rem',
            display: 'none', // Controlled by media query in CSS indirectly if we want, but easier here with a display check or just CSS
          }}
          className="mobile-close-btn"
        >
          <X size={18} />
        </button>
        <div className="logo-icon-container" style={{ width: '100%', marginBottom: '1rem' }}>
          <img src={logo} alt="Ishara Motors Logo" style={{ width: '100%', height: 'auto', borderRadius: '0.5rem' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '600', letterSpacing: '1px' }}>GARAGE PORTAL</span>
        </div>
      </div>

      <nav className="nav-links">
        <NavLink 
          to="/" 
          onClick={onClose}
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </NavLink>
        <NavLink 
          to="/vehicles" 
          onClick={onClose}
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <Car size={20} />
          <span>Vehicles</span>
        </NavLink>
        <NavLink 
          to="/invoices" 
          onClick={onClose}
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <Receipt size={20} />
          <span>Invoices</span>
        </NavLink>
        <NavLink 
          to="/estimations" 
          onClick={onClose}
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <ClipboardList size={20} />
          <span>Estimations</span>
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
