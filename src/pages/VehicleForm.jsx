import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft, Trash2, ShieldCheck, Phone, User, Car } from 'lucide-react';
import { supabase } from '../lib/supabase';

const VehicleForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    vehicle_number: '',
    owner_name: '',
    phone: '',
    vehicle_type: '',
    brand: '',
    model: '',
    notes: '',
    // Insurance Tracking
    ins_company: '',
    ins_policy_number: '',
    ins_expiry_date: '',
    ins_type: '',
    ins_contact_person: '',
    ins_contact_number: '',
  });

  const [showInsurance, setShowInsurance] = useState(false);

  useEffect(() => {
    if (isEditing) {
      fetchVehicle();
    }
  }, [id]);

  const fetchVehicle = async () => {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', id)
      .single();
    
    if (data) {
      setFormData({
        vehicle_number: data.vehicle_number || '',
        owner_name: data.owner_name || '',
        phone: data.phone || '',
        vehicle_type: data.vehicle_type || '',
        brand: data.brand || '',
        model: data.model || '',
        notes: data.notes || '',
        ins_company: data.ins_company || '',
        ins_policy_number: data.ins_policy_number || '',
        ins_expiry_date: data.ins_expiry_date || '',
        ins_type: data.ins_type || '',
        ins_contact_person: data.ins_contact_person || '',
        ins_contact_number: data.ins_contact_number || '',
      });
      // Automatically show insurance section if data exists
      if (data.ins_company || data.ins_policy_number) {
        setShowInsurance(true);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Clear insurance data if not shown
    const finalData = { ...formData };
    if (!showInsurance) {
      finalData.ins_company = '';
      finalData.ins_policy_number = '';
      finalData.ins_expiry_date = null;
      finalData.ins_type = '';
      finalData.ins_contact_person = '';
      finalData.ins_contact_number = '';
    }

    const { error } = isEditing 
      ? await supabase.from('vehicles').update(finalData).eq('id', id)
      : await supabase.from('vehicles').insert([finalData]);

    if (!error) {
      navigate('/vehicles');
    } else {
      alert(error.message);
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this vehicle?')) {
      const { error } = await supabase.from('vehicles').delete().eq('id', id);
      if (!error) navigate('/vehicles');
    }
  };

  return (
    <div>
      <div className="page-header">
        <button onClick={() => navigate(-1)} className="nav-link" style={{ padding: 0 }}>
          <ArrowLeft size={20} />
          Back
        </button>
        <h1>{isEditing ? 'Edit Vehicle' : 'Add New Vehicle'}</h1>
        {isEditing && (
          <button onClick={handleDelete} className="logout-btn" style={{ padding: '0.5rem 1rem' }}>
            <Trash2 size={18} />
            Delete
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '2rem', alignItems: 'start' }}>
          
          {/* Section 1: Vehicle Info */}
          <div className="card">
            <div className="card-header" style={{ background: 'rgba(99, 102, 241, 0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Car size={20} className="text-primary" />
                <h3 style={{ fontSize: '1.1rem' }}>Vehicle & Owner Information</h3>
              </div>
            </div>
            <div style={{ padding: '2rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="form-group">
                  <label>Vehicle Number</label>
                  <input 
                    className="search-input"
                    style={{ paddingLeft: '1rem' }}
                    value={formData.vehicle_number}
                    onChange={(e) => setFormData({...formData, vehicle_number: e.target.value.toUpperCase()})}
                    required
                    placeholder="e.g. WP-ABC-1234"
                  />
                </div>
                <div className="form-group">
                  <label>Vehicle Type</label>
                  <select 
                    className="search-input"
                    style={{ paddingLeft: '1rem', appearance: 'none', background: 'rgba(255, 255, 255, 0.05)' }}
                    value={formData.vehicle_type}
                    onChange={(e) => setFormData({...formData, vehicle_type: e.target.value})}
                  >
                    <option value="">Select Type</option>
                    <option value="Car">Car</option>
                    <option value="Van">Van</option>
                    <option value="SUV">SUV</option>
                    <option value="Bike">Bike</option>
                    <option value="Truck">Truck</option>
                    <option value="Lorry">Lorry</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Brand</label>
                  <input 
                    className="search-input"
                    style={{ paddingLeft: '1rem' }}
                    value={formData.brand}
                    onChange={(e) => setFormData({...formData, brand: e.target.value})}
                    placeholder="e.g. Toyota"
                  />
                </div>
                <div className="form-group">
                  <label>Model</label>
                  <input 
                    className="search-input"
                    style={{ paddingLeft: '1rem' }}
                    value={formData.model}
                    onChange={(e) => setFormData({...formData, model: e.target.value})}
                    placeholder="e.g. Corolla"
                  />
                </div>
                <div className="form-group">
                  <label>Owner Name</label>
                  <input 
                    className="search-input"
                    style={{ paddingLeft: '1rem' }}
                    value={formData.owner_name}
                    onChange={(e) => setFormData({...formData, owner_name: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input 
                    className="search-input"
                    style={{ paddingLeft: '1rem' }}
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="form-group" style={{ marginTop: '1.5rem' }}>
                <label>Notes</label>
                <textarea 
                  className="search-input"
                  style={{ paddingLeft: '1rem', height: '60px', resize: 'none' }}
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                />
              </div>

              <div style={{ marginTop: '2.5rem' }}>
                <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
                  <Save size={20} />
                  {loading ? 'Saving...' : 'Save Vehicle Record'}
                </button>
              </div>
            </div>
          </div>

          {/* Section 2: Insurance Info */}
          <div className="card">
            <div className="card-header" style={{ background: 'rgba(16, 185, 129, 0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <ShieldCheck size={20} style={{ color: 'var(--success)' }} />
                <h3 style={{ fontSize: '1.1rem' }}>Insurance Information</h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Required?</span>
                <input 
                  type="checkbox" 
                  checked={showInsurance} 
                  onChange={(e) => setShowInsurance(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
              </div>
            </div>
            
            <div style={{ padding: '2rem', opacity: showInsurance ? 1 : 0.4, pointerEvents: showInsurance ? 'all' : 'none', transition: 'all 0.3s' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="form-group">
                  <label>Insurance Company</label>
                  <input 
                    className="search-input"
                    style={{ paddingLeft: '1rem' }}
                    value={formData.ins_company}
                    onChange={(e) => setFormData({...formData, ins_company: e.target.value})}
                    disabled={!showInsurance}
                  />
                </div>
                <div className="form-group">
                  <label>Policy Number</label>
                  <input 
                    className="search-input"
                    style={{ paddingLeft: '1rem' }}
                    value={formData.ins_policy_number}
                    onChange={(e) => setFormData({...formData, ins_policy_number: e.target.value})}
                    disabled={!showInsurance}
                  />
                </div>
                <div className="form-group">
                  <label>Expiry Date</label>
                  <input 
                    type="date"
                    className="search-input"
                    style={{ paddingLeft: '1rem' }}
                    value={formData.ins_expiry_date}
                    onChange={(e) => setFormData({...formData, ins_expiry_date: e.target.value})}
                    disabled={!showInsurance}
                  />
                </div>
                <div className="form-group">
                  <label>Insurance Type</label>
                  <select 
                    className="search-input"
                    style={{ paddingLeft: '1rem', appearance: 'none', background: 'rgba(255, 255, 255, 0.05)' }}
                    value={formData.ins_type}
                    onChange={(e) => setFormData({...formData, ins_type: e.target.value})}
                    disabled={!showInsurance}
                  >
                    <option value="">Select Type</option>
                    <option value="Full">Full</option>
                    <option value="Third-party">Third-party</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Contact Person</label>
                  <input 
                    className="search-input"
                    style={{ paddingLeft: '1rem' }}
                    value={formData.ins_contact_person}
                    onChange={(e) => setFormData({...formData, ins_contact_person: e.target.value})}
                    disabled={!showInsurance}
                  />
                </div>
                <div className="form-group">
                  <label>Contact Number</label>
                  <input 
                    className="search-input"
                    style={{ paddingLeft: '1rem' }}
                    value={formData.ins_contact_number}
                    onChange={(e) => setFormData({...formData, ins_contact_number: e.target.value})}
                    disabled={!showInsurance}
                  />
                </div>
              </div>
              {!showInsurance && (
                <div style={{ marginTop: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>
                  Enable the checkbox above to add insurance details.
                </div>
              )}
            </div>
          </div>

        </div>
      </form>
    </div>
  );
};

export default VehicleForm;
