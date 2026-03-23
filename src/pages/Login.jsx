import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, Key, Mail } from 'lucide-react';
import logo from '../assets/logo.png';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { signIn, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await signIn({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <div className="logo-display" style={{ marginBottom: '1.5rem' }}>
            <img src={logo} alt="Ishara Motors Logo" style={{ width: '200px', height: 'auto', margin: '0 auto', display: 'block' }} />
          </div>
          <p>Sign in to manage your garage portal</p>
        </div>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>Email Address</label>
            <div className="input-with-icon">
              <Mail size={18} />
              <input 
                type="email" 
                placeholder="admin@example.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
          </div>
          
          <div className="form-group">
            <label>Password</label>
            <div className="input-with-icon">
              <Key size={18} />
              <input 
                type="password" 
                placeholder="••••••••" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <button type="submit" disabled={loading} className="login-button">
            {loading ? 'Signing in...' : 'Sign In'}
            <LogIn size={20} />
          </button>
        </form>
      </div>
      <footer className="footer">
        Developed by <a href="https://geethanuradha.github.io/" target="_blank" rel="noopener noreferrer">Anusys</a>
      </footer>
    </div>
  );
};

export default Login;
