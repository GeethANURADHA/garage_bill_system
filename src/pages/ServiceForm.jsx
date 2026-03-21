import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Plus, Trash2, Calendar, Banknote, 
  Settings, Briefcase, Package, ClipboardList, Save, X
} from 'lucide-react';
import { supabase } from '../lib/supabase';

const ServiceForm = () => {
  const { id, serviceId } = useParams();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    total_cost: 0,
    services: [''],
    parts: [],
    notes: ''
  });

  useEffect(() => {
    fetchInitialData();
  }, [id, serviceId]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      // Fetch Vehicle
      const { data: vData, error: vError } = await supabase.from('vehicles').select('*').eq('id', id).single();
      if (vError) throw vError;
      setVehicle(vData);

      // Fetch Service if in Edit Mode
      if (serviceId) {
        const { data: sData, error: sError } = await supabase.from('services').select('*').eq('id', serviceId).single();
        if (sError) throw sError;

        setFormData({
          date: sData.date,
          total_cost: sData.total_cost || sData.cost || 0,
          services: sData.service_name ? sData.service_name.split(', ') : [''],
          parts: sData.parts_replaced ? sData.parts_replaced.split(', ') : [],
          notes: sData.notes || ''
        });
      }
    } catch (err) {
      console.error(err);
      navigate(`/vehicles/${id}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddService = () => {
    setFormData({ ...formData, services: [...formData.services, ''] });
  };

  const handleUpdateService = (index, value) => {
    const newServices = [...formData.services];
    newServices[index] = value;
    setFormData({ ...formData, services: newServices });
  };

  const handleRemoveService = (index) => {
    setFormData({ ...formData, services: formData.services.filter((_, i) => i !== index) });
  };

  const handleAddPart = () => {
    setFormData({ ...formData, parts: [...formData.parts, ''] });
  };

  const handleUpdatePart = (index, value) => {
    const newParts = [...formData.parts];
    newParts[index] = value;
    setFormData({ ...formData, parts: newParts });
  };

  const handleRemovePart = (index) => {
    setFormData({ ...formData, parts: formData.parts.filter((_, i) => i !== index) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const servicesText = formData.services.filter(s => s.trim()).join(', ');
      const partsText = formData.parts.filter(p => p.trim()).join(', ');

      const serviceData = {
        vehicle_id: id,
        date: formData.date,
        total_cost: Number(formData.total_cost) || 0,
        service_name: servicesText,
        services_done: servicesText,
        parts_replaced: partsText,
        parts_cost: 0,
        labour_cost: 0,
        cost: Number(formData.total_cost) || 0,
        notes: formData.notes,
        description: servicesText
      };

      const { error } = serviceId 
        ? await supabase.from('services').update(serviceData).eq('id', serviceId)
        : await supabase.from('services').insert([serviceData]);

      if (error) {
        console.error("Supabase Save Error:", error);
        throw error;
      }
      navigate(`/vehicles/${id}`);
    } catch (err) {
      alert('FAILED TO SAVE: ' + (err.message || JSON.stringify(err)));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '4rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <button onClick={() => navigate(-1)} className="card" style={{ padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <ArrowLeft size={20} className="text-muted" />
        </button>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', letterSpacing: '-0.5px' }}>Add Service Record</h1>
          <p className="text-muted">
            For <span style={{ color: 'var(--primary)', fontWeight: '700' }}>{vehicle.brand} {vehicle.model}</span> — {vehicle.vehicle_number}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Section 1: Service Details */}
        <div className="card">
          <div className="card-header" style={{ border: 'none', padding: '1.5rem 1.5rem 0' }}>
            <div className="card-title" style={{ fontSize: '1.1rem' }}>
              <div style={{ background: '#f0fdf4', color: 'var(--primary)', width: '28px', height: '28px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: '800' }}>1</div>
              Service Details
            </div>
          </div>
          <div className="grid-2-col" style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '0.85rem' }}>Service Date <span className="text-danger">*</span></label>
              <input 
                type="date" 
                className="search-input" 
                style={{ paddingLeft: '1rem', marginTop: '0.5rem' }}
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '0.85rem' }}>Total Cost (Rs.) <span className="text-danger">*</span></label>
              <input 
                type="number" 
                step="0.01"
                className="search-input" 
                style={{ paddingLeft: '1rem', marginTop: '0.5rem' }}
                placeholder="0.00"
                value={formData.total_cost}
                onChange={e => setFormData({ ...formData, total_cost: Number(e.target.value) })}
                required
              />
            </div>
          </div>
        </div>

        {/* Section 2: Services Performed */}
        <div className="card">
          <div className="card-header" style={{ border: 'none', padding: '1.5rem 1.5rem 0' }}>
            <div className="card-title" style={{ fontSize: '1.1rem' }}>
              <div style={{ background: '#f0fdf4', color: 'var(--primary)', width: '28px', height: '28px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: '800' }}>2</div>
              Services Performed
            </div>
          </div>
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {formData.services.map((service, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span className="text-muted" style={{ fontSize: '0.8rem', fontWeight: 'bold', width: '20px' }}>{index + 1}</span>
                <input 
                  className="search-input" 
                  style={{ paddingLeft: '1rem', flex: 1, background: '#f8fafc' }}
                  placeholder="e.g. Oil Change, Brake Service..."
                  value={service}
                  onChange={e => handleUpdateService(index, e.target.value)}
                  required={index === 0}
                />
                {formData.services.length > 1 && (
                  <button type="button" onClick={() => handleRemoveService(index)} className="logout-btn" style={{ padding: '0.5rem' }}>
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            ))}
            <button 
              type="button"
              onClick={handleAddService}
              style={{ padding: '0.75rem', border: '1px dashed var(--border)', borderRadius: '0.75rem', background: 'none', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '0.5rem' }}
            >
              <Plus size={16} />
              Add Another Service
            </button>
          </div>
        </div>

        {/* Section 3: Parts Replaced */}
        <div className="card">
          <div className="card-header" style={{ border: 'none', padding: '1.5rem 1.5rem 0' }}>
            <div className="card-title" style={{ fontSize: '1.1rem' }}>
              <div style={{ background: '#f0fdf4', color: 'var(--primary)', width: '28px', height: '28px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: '800' }}>3</div>
              Parts Replaced <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '500', marginLeft: '0.25rem' }}>(Optional)</span>
            </div>
          </div>
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {formData.parts.length > 0 ? (
              formData.parts.map((part, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <input 
                    className="search-input" 
                    style={{ paddingLeft: '1rem', flex: 1, background: '#f8fafc' }}
                    placeholder="e.g. Oil Filter, Brake Pads..."
                    value={part}
                    onChange={e => handleUpdatePart(index, e.target.value)}
                  />
                  <button type="button" onClick={() => handleRemovePart(index)} className="logout-btn" style={{ padding: '0.5rem' }}>
                    <Trash2 size={18} />
                  </button>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                No parts added yet. Click below to add.
              </div>
            )}
            <button 
              type="button"
              onClick={handleAddPart}
              style={{ padding: '0.75rem', border: '1px dashed var(--border)', borderRadius: '0.75rem', background: 'none', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '0.5rem' }}
            >
              <Plus size={16} />
              Add Part
            </button>
          </div>
        </div>

        {/* Section 4: Additional Notes */}
        <div className="card">
          <div className="card-header" style={{ border: 'none', padding: '1.5rem 1.5rem 0' }}>
            <div className="card-title" style={{ fontSize: '1.1rem' }}>
              <div style={{ background: '#f0fdf4', color: 'var(--primary)', width: '28px', height: '28px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: '800' }}>4</div>
              Additional Notes
            </div>
          </div>
          <div style={{ padding: '1.5rem' }}>
            <textarea 
              className="search-input"
              style={{ width: '100%', height: '120px', padding: '1rem', borderRadius: '0.75rem', background: 'white', resize: 'none' }}
              placeholder="Any remarks, observations, or follow-up recommendations..."
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
        </div>

        {/* Footer Buttons */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem' }}>
          <button type="button" onClick={() => navigate(-1)} className="card" style={{ padding: '0.75rem 2.5rem', fontWeight: '600', cursor: 'pointer', border: 'none', background: 'white' }}>
            Cancel
          </button>
          <button 
            type="submit" 
            className="btn-primary" 
            style={{ padding: '0.75rem 2.5rem', fontSize: '1rem', gap: '0.75rem', background: 'var(--primary)' }}
            disabled={saving}
          >
            <Save size={20} />
            {saving ? 'Saving...' : 'Save Service Record'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ServiceForm;
