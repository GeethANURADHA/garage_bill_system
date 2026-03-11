import React, { useEffect, useState } from 'react';
import { Plus, Search, Car, ChevronRight, Phone, User, Tag, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const Vehicles = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    const { data } = await supabase
      .from('vehicles')
      .select('*')
      .order('created_at', { ascending: false });
    setVehicles(data || []);
    setLoading(false);
  };

  const filteredVehicles = vehicles.filter(v => 
    v.vehicle_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.owner_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Vehicles Inventory</h1>
          <p className="text-muted">Manage your garage's vehicle records and owners.</p>
        </div>
        <Link to="/vehicles/new" className="btn-primary">
          <Plus size={20} />
          Add New Vehicle
        </Link>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ padding: '1.25rem 1.5rem', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
           <div className="search-container" style={{ flex: 1 }}>
             <Search size={20} />
             <input 
               type="text" 
               className="search-input" 
               placeholder="Search by vehicle number or owner name..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
           </div>
           <div style={{ display: 'flex', gap: '0.5rem' }}>
              <div style={{ padding: '0.5rem 1rem', background: 'var(--accent)', color: 'var(--primary)', borderRadius: '0.5rem', fontWeight: '600', fontSize: '0.85rem' }}>
                 {filteredVehicles.length} Total Vehicles
              </div>
           </div>
        </div>
      </div>

      <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))' }}>
        {loading ? (
          <div>Loading vehicles...</div>
        ) : filteredVehicles.length > 0 ? filteredVehicles.map(v => (
          <div key={v.id} className="stat-card" style={{ padding: 0, overflow: 'hidden' }}>
             <div style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                   <div style={{ background: 'var(--accent)', padding: '0.5rem', borderRadius: '0.75rem', display: 'flex' }}>
                      <Car size={24} className="text-primary" />
                   </div>
                   <div className="badge badge-success" style={{ fontSize: '0.7rem' }}>{v.vehicle_type || 'Active'}</div>
                </div>
                <div style={{ fontWeight: '800', fontSize: '1.25rem', marginBottom: '0.25rem' }}>{v.vehicle_number}</div>
                <div className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '1.25rem', fontWeight: '500' }}>
                   {v.brand} {v.model}
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <User size={16} className="text-muted" />
                      <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>{v.owner_name}</span>
                   </div>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <Phone size={16} className="text-muted" />
                      <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{v.phone}</span>
                   </div>
                </div>
             </div>
             <button 
                onClick={() => navigate(`/vehicles/${v.id}`)}
                style={{ width: '100%', padding: '1rem', background: '#f8fafc', border: 'none', borderTop: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: '700', color: 'var(--primary)', transition: 'background 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#f8fafc'}
             >
                View Records
                <ArrowRight size={18} />
             </button>
          </div>
        )) : (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem 0' }}>
             <div className="text-muted">No vehicles found.</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Vehicles;
