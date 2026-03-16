import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, User, Phone, Car, Receipt, Plus, Briefcase, 
  Trash2, Calendar, Tag, ShieldCheck, FileWarning, 
  AlertCircle, ChevronRight, DollarSign, Edit, Eye, Clock
} from 'lucide-react';
import { supabase } from '../lib/supabase';

const VehicleDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState(null);
  const [services, setServices] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('services'); // services, bills, claims
  
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  
  const [newClaim, setNewClaim] = useState({
    claim_number: '', claim_amount: 0, status: 'Pending', 
    notes: '', date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchVehicleData();
  }, [id]);

  const fetchVehicleData = async () => {
    setLoading(true);
    try {
      const { data: vData } = await supabase.from('vehicles').select('*').eq('id', id).single();
      const { data: sData } = await supabase.from('services').select('*').eq('vehicle_id', id).order('date', { ascending: false });
      const { data: iData } = await supabase.from('invoices').select('*').eq('vehicle_id', id).order('created_at', { ascending: false });
      const { data: cData } = await supabase.from('insurance_claims').select('*').eq('vehicle_id', id).order('date', { ascending: false });
      
      setVehicle(vData);
      setServices(sData || []);
      setInvoices(iData || []);
      setClaims(cData || []);
    } catch (err) {
      console.error("Error fetching vehicle details:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitClaim = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('insurance_claims').insert([{
      ...newClaim,
      vehicle_id: id
    }]);

    if (error) {
      alert('Error filing claim: ' + error.message);
    } else {
      setShowClaimForm(false);
      setNewClaim({
        claim_number: '', claim_amount: 0, status: 'Pending', 
        notes: '', date: new Date().toISOString().split('T')[0]
      });
      fetchVehicleData();
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading details...</div>;
  if (!vehicle) return <div style={{ padding: '2rem', textAlign: 'center' }}>Vehicle not found</div>;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <button onClick={() => navigate('/vehicles')} className="card" style={{ padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <ArrowLeft size={20} className="text-muted" />
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.25rem', letterSpacing: '-0.5px' }}>{vehicle.vehicle_number}</h1>
          <p className="text-muted" style={{ fontWeight: '500' }}>
            {vehicle.brand} {vehicle.model} <span style={{ margin: '0 0.5rem', opacity: 0.3 }}>•</span> {vehicle.vehicle_type}
          </p>
        </div>
        <button onClick={() => navigate(`/vehicles/edit/${id}`)} className="btn-primary" style={{ background: 'white', color: 'var(--text-main)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
          <Edit size={18} />
          Edit Details
        </button>
      </div>

      <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 320px) minmax(0, 1fr)', gap: '2rem', alignItems: 'start' }}>
        
        {/* Left Column: Side Information */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Owner Card */}
          <div className="card">
            <div className="card-header" style={{ border: 'none', paddingBottom: '0' }}>
              <div className="card-title">
                <Edit size={18} className="text-primary" />
                Owner Information
              </div>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ background: 'var(--bg-main)', padding: '1rem', borderRadius: '0.75rem' }}>
                  <label style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>Full Name</label>
                  <div style={{ fontWeight: '700', fontSize: '1.1rem' }}>{vehicle.owner_name}</div>
                </div>
                <div style={{ background: 'var(--bg-main)', padding: '1rem', borderRadius: '0.75rem' }}>
                  <label style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>Contact Number</label>
                  <div style={{ fontWeight: '700', fontSize: '1.1rem' }}>{vehicle.phone}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Insurance Card */}
          <div className="card">
            <div className="card-header" style={{ border: 'none', paddingBottom: '0' }}>
              <div className="card-title">
                <ShieldCheck size={18} className="text-primary" />
                Insurance Details
              </div>
            </div>
            <div style={{ padding: '1.5rem' }}>
              {vehicle.ins_company ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div>
                    <label className="text-muted" style={{ fontSize: '0.75rem', fontWeight: '600' }}>Company</label>
                    <div style={{ fontWeight: '700' }}>{vehicle.ins_company}</div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label className="text-muted" style={{ fontSize: '0.75rem', fontWeight: '600' }}>Policy #</label>
                      <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>{vehicle.ins_policy_number}</div>
                    </div>
                    <div>
                      <label className="text-muted" style={{ fontSize: '0.75rem', fontWeight: '600' }}>Type</label>
                      <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>{vehicle.ins_type}</div>
                    </div>
                  </div>
                  <div>
                    <label className="text-muted" style={{ fontSize: '0.75rem', fontWeight: '600' }}>Expiry Date</label>
                    <div style={{ fontWeight: '700', color: new Date(vehicle.ins_expiry_date) < new Date() ? 'var(--danger)' : 'var(--success)' }}>
                      {new Date(vehicle.ins_expiry_date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '1rem' }}>
                  <p className="text-muted" style={{ fontSize: '0.9rem', fontStyle: 'italic' }}>No insurance details provided.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Main Content Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Navigation Tabs */}
          <div className="card" style={{ padding: '0.5rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                className={`tab-btn ${activeTab === 'services' ? 'active' : ''}`} 
                onClick={() => setActiveTab('services')}
              >
                <div style={{ background: activeTab === 'services' ? 'var(--primary)' : 'var(--bg-main)', padding: '0.4rem', borderRadius: '0.5rem', display: 'flex' }}>
                   <Briefcase size={16} color={activeTab === 'services' ? 'white' : 'var(--text-muted)'} />
                </div>
                Service History
                <span className="count-badge">{services.length}</span>
              </button>
              <button 
                className={`tab-btn ${activeTab === 'bills' ? 'active' : ''}`} 
                onClick={() => setActiveTab('bills')}
              >
                <div style={{ background: activeTab === 'bills' ? 'var(--primary)' : 'var(--bg-main)', padding: '0.4rem', borderRadius: '0.5rem', display: 'flex' }}>
                   <Receipt size={16} color={activeTab === 'bills' ? 'white' : 'var(--text-muted)'} />
                </div>
                Bills & Invoices
                <span className="count-badge">{invoices.length}</span>
              </button>
              <button 
                className={`tab-btn ${activeTab === 'claims' ? 'active' : ''}`} 
                onClick={() => setActiveTab('claims')}
              >
                <div style={{ background: activeTab === 'claims' ? 'var(--primary)' : 'var(--bg-main)', padding: '0.4rem', borderRadius: '0.5rem', display: 'flex' }}>
                   <ShieldCheck size={16} color={activeTab === 'claims' ? 'white' : 'var(--text-muted)'} />
                </div>
                Insurance Claims
                <span className="count-badge">{claims.length}</span>
              </button>
            </div>
          </div>

          {/* Records Content */}
          <div className="card">
            <div className="card-header" style={{ padding: '1.5rem 2rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>
               {activeTab === 'services' ? 'Service Records' : activeTab === 'claims' ? 'Insurance Claims' : 'Bills & Invoices'}
              </h3>
              {activeTab === 'services' ? (
                <button onClick={() => navigate(`/vehicles/${id}/services/new`)} className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                  <Plus size={16} />
                  Add Service
                </button>
              ) : activeTab === 'bills' ? (
                <button onClick={() => navigate('/invoices/new')} className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                  <Receipt size={16} />
                  New Invoice
                </button>
              ) : (
                <button onClick={() => setShowClaimForm(true)} className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                  <ShieldCheck size={16} />
                  File Claim
                </button>
              )}
            </div>

            {/* List View */}
            <div style={{ padding: '1rem 1.5rem 2rem' }}>
              {activeTab === 'services' && services.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {services.map(s => (
                    <div key={s.id} className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.25rem' }}>
                      <div style={{ background: 'var(--accent)', padding: '0.75rem', borderRadius: '0.75rem', display: 'flex' }}>
                        <Clock size={24} className="text-primary" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '700', fontSize: '1.05rem', marginBottom: '0.1rem' }}>
                          {new Date(s.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </div>
                        <div className="text-muted" style={{ fontSize: '0.85rem' }}>Services: {s.service_name}</div>
                      </div>
                      <div style={{ fontWeight: '800', fontSize: '1.25rem' }}>${Number(s.total_cost || 0).toLocaleString()}</div>
                      <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
                        <button className="nav-link" style={{ padding: '0.5rem' }} onClick={() => setSelectedService(s)} title="View Details"><Eye size={18} className="text-primary" /></button>
                        <button className="nav-link" style={{ padding: '0.5rem' }} onClick={() => navigate(`/invoices/new?serviceId=${s.id}`)} title="Create Bill"><Receipt size={18} className="text-primary" /></button>
                        <button className="nav-link" style={{ padding: '0.5rem' }} onClick={() => navigate(`/vehicles/${id}/services/edit/${s.id}`)} title="Edit"><Edit size={18} className="text-primary" /></button>
                        <button className="nav-link" style={{ padding: '0.5rem' }} onClick={() => handleDelete('services', s.id)} title="Delete"><Trash2 size={18} className="text-danger" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : activeTab === 'bills' && invoices.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {invoices.map(inv => (
                    <div key={inv.id} className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.25rem' }}>
                      <div style={{ background: 'var(--accent)', padding: '0.75rem', borderRadius: '0.75rem', display: 'flex' }}>
                        <Receipt size={24} className="text-primary" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '700', fontSize: '1.05rem', marginBottom: '0.1rem' }}>
                          INV-{inv.id.slice(-6).toUpperCase()}
                        </div>
                        <div className="text-muted" style={{ fontSize: '0.85rem' }}>Date: {new Date(inv.created_at).toLocaleDateString()}</div>
                      </div>
                      <div style={{ fontWeight: '800', fontSize: '1.25rem' }}>${Number(inv.total_amount || 0).toLocaleString()}</div>
                      <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
                        <a href={inv.pdf_url} target="_blank" rel="noopener noreferrer" className="nav-link" style={{ padding: '0.5rem' }} title="View PDF"><Eye size={18} className="text-primary" /></a>
                        <button className="nav-link" style={{ padding: '0.5rem' }} onClick={() => navigate(`/invoices/edit/${inv.id}`)} title="Edit Bill"><Edit size={18} className="text-primary" /></button>
                        <button className="nav-link" style={{ padding: '0.5rem' }} onClick={() => handleDelete('invoices', inv.id)} title="Delete"><Trash2 size={18} className="text-danger" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : activeTab === 'claims' && claims.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {claims.map(c => (
                    <div key={c.id} className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.25rem' }}>
                      <div style={{ background: 'var(--accent)', padding: '0.75rem', borderRadius: '0.75rem', display: 'flex' }}>
                        <ShieldCheck size={24} className="text-primary" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '700', fontSize: '1.05rem', marginBottom: '0.1rem' }}>
                          Claim #{c.claim_number}
                        </div>
                        <div className="text-muted" style={{ fontSize: '0.85rem' }}>Status: <span style={{ color: c.status === 'Approved' ? 'var(--success)' : 'var(--danger)', fontWeight: '600' }}>{c.status}</span></div>
                      </div>
                      <div style={{ fontWeight: '800', fontSize: '1.25rem' }}>${Number(c.claim_amount || 0).toLocaleString()}</div>
                      <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
                        <button className="nav-link" style={{ padding: '0.5rem' }} onClick={() => handleDelete('insurance_claims', c.id)} title="Delete"><Trash2 size={18} className="text-danger" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                   <p className="text-muted">No {activeTab} found for this vehicle.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Service Details Modal */}
      {selectedService && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem' }}>
          <div className="card" style={{ maxWidth: '600px', width: '100%', maxHeight: '90vh', overflow: 'auto' }}>
            <div className="card-header" style={{ padding: '1.5rem 2rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800' }}>Service Record Details</h3>
                <p className="text-muted" style={{ fontSize: '0.85rem' }}>Performed on {new Date(selectedService.date).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
              </div>
              <button 
                onClick={() => setSelectedService(null)}
                style={{ background: 'var(--bg-main)', border: 'none', padding: '0.5rem', borderRadius: '0.5rem', cursor: 'pointer' }}
              >
                <ArrowLeft size={20} />
              </button>
            </div>
            {/* Modal Body */}
            <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '0.5px' }}>Services Performed</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                  {selectedService.service_name?.split(', ').map((s, i) => (
                    <div key={i} style={{ background: 'var(--accent)', color: 'var(--primary)', padding: '0.5rem 1rem', borderRadius: '2rem', fontSize: '0.9rem', fontWeight: '600' }}>{s}</div>
                  ))}
                </div>
              </div>
              {selectedService.parts_replaced && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '0.5px' }}>Parts Replaced</label>
                  <div style={{ background: 'var(--bg-main)', borderRadius: '1rem', padding: '1rem' }}>
                    <ul style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {selectedService.parts_replaced.split(', ').map((p, i) => (<li key={i} style={{ fontSize: '0.95rem', fontWeight: '500' }}>{p}</li>))}
                    </ul>
                  </div>
                </div>
              )}
              <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: '600', color: 'var(--text-muted)' }}>Total Cost</span>
                  <span style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--primary)' }}>${Number(selectedService.total_cost || selectedService.cost || 0).toLocaleString()}</span>
                </div>
              </div>
              {selectedService.notes && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Additional Notes</label>
                  <p style={{ background: 'white', border: '1px solid var(--border)', padding: '1rem', borderRadius: '0.75rem', fontSize: '0.95rem', color: 'var(--text-main)', fontStyle: 'italic' }}>"{selectedService.notes}"</p>
                </div>
              )}
            </div>
            <div style={{ padding: '1.5rem 2rem', background: 'var(--bg-main)', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button onClick={() => setSelectedService(null)} className="btn-primary" style={{ background: 'white', color: 'var(--text-main)', border: '1px solid var(--border)' }}>Close</button>
              <button onClick={() => { const s = selectedService; setSelectedService(null); navigate(`/vehicles/${id}/services/edit/${s.id}`); }} className="btn-primary"><Edit size={18} /> Edit</button>
            </div>
          </div>
        </div>
      )}

      {/* Insurance Claim Modal */}
      {showClaimForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem' }}>
          <div className="card" style={{ maxWidth: '500px', width: '100%' }}>
            <div className="card-header" style={{ padding: '1.5rem 2rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800' }}>File New Claim</h3>
            </div>
            <form onSubmit={handleSubmitClaim} style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="form-group">
                <label>Claim Number</label>
                <input type="text" value={newClaim.claim_number} onChange={(e) => setNewClaim({...newClaim, claim_number: e.target.value})} required placeholder="e.g. CLM-123456" />
              </div>
              <div className="form-group">
                <label>Claim Amount</label>
                <input type="number" value={newClaim.claim_amount} onChange={(e) => setNewClaim({...newClaim, claim_amount: Number(e.target.value)})} required />
              </div>
              <div className="form-group">
                <label>Date</label>
                <input type="date" value={newClaim.date} onChange={(e) => setNewClaim({...newClaim, date: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select value={newClaim.status} onChange={(e) => setNewClaim({...newClaim, status: e.target.value})}>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea value={newClaim.notes} onChange={(e) => setNewClaim({...newClaim, notes: e.target.value})} rows="3" placeholder="Additional details..." />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowClaimForm(false)} className="btn-primary" style={{ flex: 1, background: 'white', color: 'var(--text-main)', border: '1px solid var(--border)' }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Submit Claim</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleDetails;
