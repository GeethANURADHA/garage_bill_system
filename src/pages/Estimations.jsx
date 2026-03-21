import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  Plus, Search, FileText, Trash2, Edit3, 
  ChevronRight, Calendar, User, Car, ArrowLeft
} from 'lucide-react';

const Estimations = () => {
  const navigate = useNavigate();
  const [estimations, setEstimations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchEstimations();
  }, []);

  const fetchEstimations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('estimations')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setEstimations(data || []);
    } catch (err) {
      console.error(err);
      alert("Error fetching estimations");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this estimation?")) {
      try {
        const { error } = await supabase.from('estimations').delete().eq('id', id);
        if (error) throw error;
        setEstimations(estimations.filter(e => e.id !== id));
      } catch (err) {
        console.error(err);
        alert("Delete failed");
      }
    }
  };

  const filteredEstimations = estimations.filter(est => 
    est.vehicle_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    est.owner_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', letterSpacing: '-0.5px' }}>Vehicle Estimations</h1>
          <p className="text-muted">Manage and track your vehicle service estimates.</p>
        </div>
        <button onClick={() => navigate('/estimations/new')} className="btn-primary" style={{ padding: '0.75rem 1.5rem', borderRadius: '0.75rem' }}>
          <Plus size={20} />
          Create Estimation
        </button>
      </div>

      <div className="card" style={{ border: 'none', boxShadow: 'var(--shadow-lg)', marginBottom: '2rem' }}>
        <div style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', borderRadius: '1rem 1rem 0 0' }}>
           <div className="search-container" style={{ flex: '1', maxWidth: '450px' }}>
              <Search size={18} />
              <input 
                type="text" 
                placeholder="Search by vehicle number or owner name..." 
                className="search-input"
                style={{ paddingLeft: '2.8rem' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
           <div style={{ display: 'flex', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '500' }}>
              <span>Total Estimations:</span>
              <span className="badge badge-success" style={{ background: 'var(--accent)', color: 'var(--primary)', borderRadius: '0.5rem' }}>{estimations.length}</span>
           </div>
        </div>

        <div className="table-container">
          <table style={{ background: 'white' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={{ padding: '1.25rem 1.5rem' }}>Date</th>
                <th style={{ padding: '1.25rem 1.5rem' }}>Vehicle & Owner</th>
                <th style={{ padding: '1.25rem 1.5rem' }}>Damage Overview</th>
                <th style={{ padding: '1.25rem 1.5rem' }}>Estimated Cost</th>
                <th style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                   <td colSpan="5" style={{ textAlign: 'center', padding: '3rem' }}>
                      <div className="text-muted">Loading estimations...</div>
                   </td>
                </tr>
              ) : filteredEstimations.length === 0 ? (
                <tr>
                   <td colSpan="5" style={{ textAlign: 'center', padding: '3rem' }}>
                      <div className="text-muted">No estimation records found.</div>
                   </td>
                </tr>
              ) : (
                filteredEstimations.map((est) => (
                  <tr key={est.id}>
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Calendar size={16} className="text-muted" />
                        {new Date(est.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: '700', color: 'var(--text-main)' }}>{est.vehicle_number}</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{est.owner_name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {est.damage_description || 'No description'}
                      </p>
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                      <span style={{ fontWeight: '800', color: 'var(--primary)', fontSize: '1rem' }}>
                        Rs. {Number(est.total_cost).toFixed(2)}
                      </span>
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button 
                          onClick={() => navigate(`/estimations/edit/${est.id}`)}
                          className="nav-link" 
                          style={{ padding: '0.5rem', background: '#f1f5f9', color: 'var(--text-main)', borderRadius: '0.5rem' }}
                          title="Edit"
                        >
                          <Edit3 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(est.id)}
                          className="logout-btn" 
                          style={{ padding: '0.5rem', background: '#fff1f2', borderRadius: '0.5rem' }}
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Estimations;
