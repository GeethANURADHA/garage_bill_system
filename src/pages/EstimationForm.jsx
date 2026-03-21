import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { supabase } from '../lib/supabase';
import { 
  ArrowLeft, Save, Plus, Trash2, CheckCircle, 
  FileText, ClipboardList, ShieldCheck, Car, User, Phone
} from 'lucide-react';

import logo from '../assets/logo.png';

const EstimationForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;
  
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    vehicle_id: '',
    vehicle_number: '',
    vehicle_model: '',
    owner_name: '',
    contact_number: '',
    date: new Date().toISOString().split('T')[0],
    insurance_company: '',
    damage_description: '',
    parts: [{ id: Date.now().toString(), description: '', price: 0 }],
    labor_charges: 0,
    parts_cost: 0,
    additional_charges: 0,
    total_cost: 0
  });

  useEffect(() => {
    fetchInitialData();
  }, [id]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const { data: vData } = await supabase.from('vehicles').select('*').order('vehicle_number');
      setVehicles(vData || []);

      if (isEditing) {
        const { data: estData, error } = await supabase
          .from('estimations')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) throw error;
        if (estData) {
          setFormData({
            ...estData,
            parts: estData.parts || [{ id: Date.now().toString(), description: '', price: 0 }]
          });
        }
      }
    } catch (err) {
      console.error(err);
      alert("Error loading data");
    } finally {
      setLoading(false);
    }
  };

  const handleVehicleChange = (vehicleId) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (vehicle) {
      setFormData({
        ...formData,
        vehicle_id: vehicle.id,
        vehicle_number: vehicle.vehicle_number,
        vehicle_model: vehicle.model || '',
        owner_name: vehicle.owner_name,
        contact_number: vehicle.phone || '',
        insurance_company: vehicle.ins_company || ''
      });
    } else {
      setFormData({
        ...formData,
        vehicle_id: '',
        vehicle_number: '',
        vehicle_model: '',
        owner_name: '',
        contact_number: '',
        insurance_company: ''
      });
    }
  };

  const addPart = () => {
    setFormData({
      ...formData,
      parts: [...formData.parts, { id: Date.now().toString(), description: '', price: 0 }]
    });
  };

  const removePart = (partId) => {
    const updatedParts = formData.parts.filter(p => p.id !== partId);
    setFormData({ ...formData, parts: updatedParts });
  };

  const updatePart = (partId, field, value) => {
    const updatedParts = formData.parts.map(p => 
      p.id === partId ? { ...p, [field]: value } : p
    );
    setFormData({ ...formData, parts: updatedParts });
  };

  // Re-calculate totals whenever parts or charges change
  useEffect(() => {
    const partsTotal = formData.parts.reduce((sum, p) => sum + Number(p.price || 0), 0);
    const total = partsTotal + Number(formData.labor_charges || 0) + Number(formData.additional_charges || 0);
    
    setFormData(prev => ({
      ...prev,
      parts_cost: partsTotal,
      total_cost: total
    }));
  }, [formData.parts, formData.labor_charges, formData.additional_charges]);

  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Header
    try {
      doc.addImage(logo, 'PNG', 15, 10, 60, 30);
    } catch (e) {
      console.warn("Logo failed to load");
    }
    
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(33, 37, 41);
    doc.text('ISHARA MOTORS', 195, 20, { align: 'right' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    doc.text('54/C, Sri Saranankara Mawatha, Rilawla, Polgasowita', 195, 27, { align: 'right' });
    doc.text('Mobile: 0719656885 | 0773531005', 195, 33, { align: 'right' });
    doc.text('Email: motorsishara65@gmail.com', 195, 39, { align: 'right' });

    doc.setFontSize(18);
    doc.setFont('times', 'bold');
    doc.text('VEHICLE ESTIMATING SHEET', 105, 55, { align: 'center' });

    // Details Grid
    doc.setFontSize(11);
    let y = 75;
    
    const drawRow = (label1, val1, label2, val2) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label1, 20, y);
      doc.setFont('helvetica', 'normal');
      doc.text(String(val1 || 'N/A'), 60, y);
      
      if (label2) {
        doc.setFont('helvetica', 'bold');
        doc.text(label2, 110, y);
        doc.setFont('helvetica', 'normal');
        doc.text(String(val2 || 'N/A'), 150, y);
      }
      y += 10;
    };

    drawRow('Vehicle No:', formData.vehicle_number, 'Date:', formData.date);
    drawRow('Model:', formData.vehicle_model, 'Contact No:', formData.contact_number);
    drawRow('Owner Name:', formData.owner_name, 'Insurance:', formData.insurance_company);
    
    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.text('Damage Description:', 20, y);
    y += 7;
    doc.setFont('helvetica', 'normal');
    const splitDamage = doc.splitTextToSize(formData.damage_description || 'No description provided.', 170);
    doc.text(splitDamage, 20, y);
    y += (splitDamage.length * 6) + 5;

    // Parts Table
    doc.setFillColor(248, 250, 252);
    doc.rect(15, y, 180, 10, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('Parts / Service Required', 20, y + 6.5);
    doc.text('Estimated Cost', 175, y + 6.5, { align: 'right' });
    
    doc.line(15, y, 195, y);
    doc.line(15, y + 10, 195, y + 10);
    
    y += 17;
    doc.setFont('helvetica', 'normal');
    formData.parts.forEach(part => {
      if (part.description) {
        doc.text(part.description, 20, y);
        doc.text(Number(part.price).toFixed(2), 175, y, { align: 'right' });
        y += 8;
      }
    });

    // Summary
    y += 5;
    doc.line(110, y, 195, y);
    y += 10;
    
    const drawSummaryRow = (label, value, bold = false) => {
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      doc.text(label, 115, y);
      doc.text(Number(value).toFixed(2), 175, y, { align: 'right' });
      y += 8;
    };

    drawSummaryRow('Labor Charges', formData.labor_charges);
    drawSummaryRow('Additional Charges', formData.additional_charges);
    y += 2;
    doc.setFillColor(33, 37, 41);
    doc.rect(110, y - 6, 85, 10, 'F');
    doc.setTextColor(255);
    drawSummaryRow('TOTAL ESTIMATED COST (Rs.)', formData.total_cost, true);
    doc.setTextColor(0);

    // Signature
    y += 30;
    doc.line(20, y, 80, y);
    doc.line(130, y, 190, y);
    y += 5;
    doc.setFontSize(10);
    doc.text('Customer Signature', 50, y, { align: 'center' });
    doc.text('Authorized Signature', 160, y, { align: 'center' });

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text('This is an estimation only. Final cost may vary upon further inspection.', 105, 280, { align: 'center' });
    doc.text('Ishara Motors - Performance & Reliability', 105, 285, { align: 'center' });

    return doc;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.vehicle_number || !formData.owner_name) {
      return alert("Please fill in required fields");
    }

    setSaving(true);
    try {
      // Clean up numeric fields to avoid "invalid input syntax for type numeric"
      const cleanedData = {
        ...formData,
        labor_charges: Number(formData.labor_charges || 0),
        parts_cost: Number(formData.parts_cost || 0),
        additional_charges: Number(formData.additional_charges || 0),
        total_cost: Number(formData.total_cost || 0),
        parts: formData.parts.map(p => ({
          ...p,
          price: Number(p.price || 0)
        }))
      };

      const { error } = isEditing
        ? await supabase.from('estimations').update(cleanedData).eq('id', id)
        : await supabase.from('estimations').insert([cleanedData]);

      if (error) throw error;

      setSuccess(true);
      setTimeout(() => navigate('/estimations'), 2000);
    } catch (err) {
      console.error(err);
      alert("Error saving estimation: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPDF = () => {
    const doc = generatePDF();
    doc.save(`Estimation_${formData.vehicle_number}_${formData.date}.pdf`);
  };

  if (loading) return <div className="p-8">Loading form...</div>;

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <div>
          <button onClick={() => navigate(-1)} className="nav-link" style={{ padding: 0, marginBottom: '0.5rem' }}>
            <ArrowLeft size={20} />
            Back to Estimations
          </button>
          <h1>{isEditing ? 'Edit Estimation' : 'New Vehicle Estimating Sheet'}</h1>
          <p className="text-muted">Create a professional cost estimate for insurance or customers.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {isEditing && (
             <button onClick={handleDownloadPDF} className="btn-primary" style={{ background: 'var(--secondary)' }}>
                <FileText size={20} />
                Print/Download PDF
             </button>
          )}
        </div>
      </div>

      <form onSubmit={handleSave} className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Vehicle & Customer Info */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <Car size={20} className="text-primary" />
                Vehicle & Customer Details
              </div>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <div className="grid-2-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="form-group">
                  <label>Select Vehicle / Registration No</label>
                  <select 
                    className="search-input"
                    style={{ paddingLeft: '1rem' }}
                    value={formData.vehicle_id}
                    onChange={(e) => handleVehicleChange(e.target.value)}
                  >
                    <option value="">-- Choose Existing Vehicle --</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>{v.vehicle_number} - {v.owner_name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Estimation Date</label>
                  <input 
                    type="date"
                    className="search-input"
                    style={{ paddingLeft: '1rem' }}
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                  />
                </div>
                {!formData.vehicle_id && (
                  <>
                    <div className="form-group">
                      <label>Vehicle Number</label>
                      <input 
                        className="search-input"
                        style={{ paddingLeft: '1rem' }}
                        value={formData.vehicle_number}
                        onChange={(e) => setFormData({...formData, vehicle_number: e.target.value.toUpperCase()})}
                        placeholder="WP-ABC-1234"
                      />
                    </div>
                    <div className="form-group">
                      <label>Vehicle Model</label>
                      <input 
                        className="search-input"
                        style={{ paddingLeft: '1rem' }}
                        value={formData.vehicle_model}
                        onChange={(e) => setFormData({...formData, vehicle_model: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label>Owner Name</label>
                      <input 
                        className="search-input"
                        style={{ paddingLeft: '1rem' }}
                        value={formData.owner_name}
                        onChange={(e) => setFormData({...formData, owner_name: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label>Contact Number</label>
                      <input 
                        className="search-input"
                        style={{ paddingLeft: '1rem' }}
                        value={formData.contact_number}
                        onChange={(e) => setFormData({...formData, contact_number: e.target.value})}
                      />
                    </div>
                  </>
                )}
                {formData.vehicle_id && (
                  <div style={{ gridColumn: 'span 2', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', background: 'var(--accent)', padding: '1rem', borderRadius: '0.75rem' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Owner: </span>
                      <span style={{ fontWeight: '600' }}>{formData.owner_name}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Model: </span>
                      <span style={{ fontWeight: '600' }}>{formData.vehicle_model || 'N/A'}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Phone: </span>
                      <span style={{ fontWeight: '600' }}>{formData.contact_number || 'N/A'}</span>
                    </div>
                  </div>
                )}
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Insurance Company Name</label>
                  <div className="input-with-icon">
                    <ShieldCheck size={18} />
                    <input 
                      className="search-input"
                      value={formData.insurance_company}
                      onChange={(e) => setFormData({...formData, insurance_company: e.target.value})}
                      placeholder="e.g. Sri Lanka Insurance, Allianz, etc."
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Damage Description */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <ClipboardList size={20} className="text-primary" />
                Damage Description
              </div>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <textarea 
                className="search-input"
                style={{ height: '120px', padding: '1rem', resize: 'none' }}
                placeholder="Describe the damages and work required in detail..."
                value={formData.damage_description}
                onChange={(e) => setFormData({...formData, damage_description: e.target.value})}
              />
            </div>
          </div>

          {/* Parts Required */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <Plus size={20} className="text-primary" />
                Parts Required & Services
              </div>
              <button type="button" onClick={addPart} className="btn-primary" style={{ background: 'white', color: 'var(--text-main)', border: '1px solid var(--border)', fontSize: '0.8rem' }}>
                <Plus size={16} /> Add Item
              </button>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <table style={{ border: 'none' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-main)' }}>
                    <th style={{ padding: '0.75rem' }}>Description</th>
                    <th style={{ width: '150px', padding: '0.75rem' }}>Estimated Cost (Rs.)</th>
                    <th style={{ width: '50px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {formData.parts.map((part) => (
                    <tr key={part.id}>
                      <td style={{ border: 'none', padding: '0.5rem' }}>
                        <input 
                          className="search-input"
                          style={{ paddingLeft: '1rem' }}
                          placeholder="e.g. Front Bumper, Headlamp"
                          value={part.description}
                          onChange={(e) => updatePart(part.id, 'description', e.target.value)}
                        />
                      </td>
                      <td style={{ border: 'none', padding: '0.5rem' }}>
                        <input 
                          type="number"
                          className="search-input"
                          style={{ paddingLeft: '1rem' }}
                          value={part.price}
                          onChange={(e) => updatePart(part.id, 'price', e.target.value)}
                        />
                      </td>
                      <td style={{ border: 'none', padding: '0.5rem' }}>
                        <button type="button" onClick={() => removePart(part.id)} className="logout-btn" style={{ padding: '0.5rem' }}>
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="sticky-sidebar">
          <div className="card" style={{ border: 'none', boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ background: 'var(--text-main)', padding: '1.5rem', color: 'white', borderRadius: '1rem 1rem 0 0' }}>
              <h3 style={{ fontSize: '1rem', opacity: 0.8, marginBottom: '1rem' }}>Cost Breakdown</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.9rem', opacity: 0.7 }}>Parts Total</span>
                <span style={{ fontWeight: '600' }}>Rs. {formData.parts_cost.toFixed(2)}</span>
              </div>
            </div>
            
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Labor Charges</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <span style={{ position: 'absolute', left: '1rem', color: 'var(--text-muted)' }}>Rs.</span>
                  <input 
                    type="number"
                    className="search-input"
                    style={{ paddingLeft: '2rem' }}
                    value={formData.labor_charges}
                    onChange={(e) => setFormData({...formData, labor_charges: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Additional Charges</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <span style={{ position: 'absolute', left: '1rem', color: 'var(--text-muted)' }}>Rs.</span>
                  <input 
                    type="number"
                    className="search-input"
                    style={{ paddingLeft: '2rem' }}
                    value={formData.additional_charges}
                    onChange={(e) => setFormData({...formData, additional_charges: e.target.value})}
                  />
                </div>
              </div>

              <div style={{ marginTop: '1rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: '700' }}>Total Estimate</span>
                <span style={{ fontWeight: '800', fontSize: '1.5rem', color: 'var(--primary)' }}>Rs. {formData.total_cost.toFixed(2)}</span>
              </div>

              <button 
                type="submit" 
                className="btn-primary" 
                style={{ width: '100%', height: '54px', justifyContent: 'center', marginTop: '1rem' }}
                disabled={saving}
              >
                <Save size={20} />
                {saving ? 'Saving...' : 'Save Estimation'}
              </button>
            </div>
          </div>
        </div>
      </form>

      {success && (
        <div style={{ position: 'fixed', top: '2rem', right: '2rem', background: 'var(--success)', color: 'white', padding: '1rem 2rem', borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: 'var(--shadow-lg)', zIndex: 2000 }}>
          <CheckCircle size={24} />
          <span>Estimation saved successfully!</span>
        </div>
      )}
    </div>
  );
};

export default EstimationForm;
