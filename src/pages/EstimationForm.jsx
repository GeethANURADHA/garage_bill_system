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
    parts: [{ id: Date.now().toString(), description: '', price: '', amended_price: '' }],
    labor_charges: 0,
    parts_cost: 0,
    additional_charges: 0,
    total_cost: 0,
    total_amended_price: 0
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
            parts: estData.parts || [{ id: Date.now().toString(), description: '', price: 0, amended_price: 0 }]
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
      parts: [...formData.parts, { id: Date.now().toString(), description: '', price: '', amended_price: '' }]
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
    const amendedTotal = formData.parts.reduce((sum, p) => sum + Number(p.amended_price || 0), 0);
    const total = partsTotal + Number(formData.labor_charges || 0) + Number(formData.additional_charges || 0);
    const hasAmended = formData.parts.some(p => p.amended_price !== '' && p.amended_price !== 0);
    const totalAmended = hasAmended ? (amendedTotal + Number(formData.labor_charges || 0) + Number(formData.additional_charges || 0)) : null;
    
    setFormData(prev => ({
      ...prev,
      parts_cost: partsTotal,
      total_cost: total,
      total_amended_price: totalAmended
    }));
  }, [formData.parts, formData.labor_charges, formData.additional_charges]);

  const generatePDF = () => {
    const doc = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 15;
    let y = margin;

    // --- Header ---
    try {
      doc.addImage(logo, 'PNG', margin, y, 40, 20);
    } catch (e) {
      console.warn("Logo failed to load");
    }

    doc.setTextColor(0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('ISHARA MOTORS', pageWidth - margin, y + 8, { align: 'right' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const address = [
      '54/C, Sri Saranankara Mawatha, Rilawla, Polgasowita',
      'Mobile: 0719656885 | 0773531005',
      'Email: motorsishara65@gmail.com'
    ];
    address.forEach((line, index) => {
      doc.text(line, pageWidth - margin, y + 14 + (index * 4.5), { align: 'right' });
    });

    y += 25;
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    
    y += 10;
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('VEHICLE ESTIMATION SHEET', pageWidth / 2, y, { align: 'center' });

    // --- Basic Info ---
    y += 15;
    doc.setFontSize(10);
    doc.setLineWidth(0.1);
    
    const drawInfoRow = (label1, value1, label2, value2) => {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139); // Slate-500
      doc.text(label1, margin, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59); // Slate-800
      doc.text(`: ${value1 || ''}`, margin + 35, y);

      if (label2) {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 116, 139);
        doc.text(label2, pageWidth / 2 + 5, y);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(30, 41, 59);
        doc.text(`: ${value2 || ''}`, pageWidth / 2 + 45, y);
      }
      y += 7;
    };

    drawInfoRow('Date', new Date(formData.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }), 'Vehicle Number', formData.vehicle_number);
    drawInfoRow('Vehicle Model', formData.vehicle_model, 'Owner Name', formData.owner_name);

    // --- Table ---
    y += 5;
    const tableTop = y;
    const colWidths = { no: 12, desc: 100, est: 34, amended: 34 };
    const colPos = {
      no: margin,
      desc: margin + colWidths.no,
      est: margin + colWidths.no + colWidths.desc,
      amended: margin + colWidths.no + colWidths.desc + colWidths.est
    };

    // Header Background
    doc.setFillColor(248, 250, 252); // Slate-50
    doc.rect(margin, y, pageWidth - (margin * 2), 10, 'F');
    
    doc.setDrawColor(226, 232, 240); // Slate-200
    doc.line(margin, y, pageWidth - margin, y);
    doc.line(margin, y + 10, pageWidth - margin, y + 10);
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105); // Slate-600
    doc.text('No.', colPos.no + 2, y + 6.5);
    doc.text('Description', colPos.desc + 2, y + 6.5);
    doc.text('Estimated (Rs.)', colPos.est + 2, y + 6.5);
    doc.text('Amended (Rs.)', colPos.amended + 2, y + 6.5);

    y += 10;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);

    // Table Content
    formData.parts.forEach((item, index) => {
      const rowHeight = 10;
      doc.line(margin, y + rowHeight, pageWidth - margin, y + rowHeight);
      
      doc.text((index + 1).toString().padStart(2, '0'), colPos.no + 2, y + 6.5);
      const descLines = doc.splitTextToSize(item.description || '', colWidths.desc - 4);
      doc.text(descLines[0] || '', colPos.desc + 2, y + 6.5);
      
      doc.text(item.price ? `Rs. ${Number(item.price || 0).toFixed(2)}` : '', colPos.amended - 2, y + 6.5, { align: 'right' });
      doc.text(item.amended_price ? `Rs. ${Number(item.amended_price || 0).toFixed(2)}` : '', pageWidth - margin - 2, y + 6.5, { align: 'right' });
      
      y += rowHeight;
      if (y > pageHeight - 40) { doc.addPage(); y = margin; }
    });

    // Vertical borders
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, tableTop, margin, y);
    doc.line(colPos.desc, tableTop, colPos.desc, y);
    doc.line(colPos.est, tableTop, colPos.est, y);
    doc.line(colPos.amended, tableTop, colPos.amended, y);
    doc.line(pageWidth - margin, tableTop, pageWidth - margin, y);

    // Grand Totals
    y += 10;
    doc.setFillColor(248, 250, 252);
    doc.rect(margin + colWidths.no + colWidths.desc, y, colWidths.est + colWidths.amended, 12, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(margin + colWidths.no + colWidths.desc, y, colWidths.est + colWidths.amended, 12);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text('TOTAL ESTIMATED', colPos.est + 2, y + 5);
    doc.text('TOTAL AMENDED', colPos.amended + 2, y + 5);
    
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(formData.total_cost ? `Rs. ${Number(formData.total_cost || 0).toFixed(2)}` : '', colPos.amended - 2, y + 10, { align: 'right' });
    doc.text(formData.total_amended_price ? `Rs. ${Number(formData.total_amended_price || 0).toFixed(2)}` : '', pageWidth - margin - 2, y + 10, { align: 'right' });
    
    // Disclaimer
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('Thank you for choosing Ishara Motors!', pageWidth / 2, pageHeight - 15, { align: 'center' });
    doc.text('Performance & Reliability Guaranteed', pageWidth / 2, pageHeight - 10, { align: 'center' });

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
        vehicle_id: formData.vehicle_id || null,
        vehicle_number: formData.vehicle_number,
        vehicle_model: formData.vehicle_model,
        owner_name: formData.owner_name,
        contact_number: formData.contact_number,
        date: formData.date,
        insurance_company: formData.insurance_company,
        damage_description: formData.damage_description,
        labor_charges: Number(formData.labor_charges || 0),
        parts_cost: Number(formData.parts_cost || 0),
        additional_charges: Number(formData.additional_charges || 0),
        total_cost: Number(formData.total_cost || 0),
        parts: formData.parts.map(p => ({
          id: p.id,
          description: p.description,
          price: Number(p.price || 0),
          amended_price: Number(p.amended_price || 0)
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

  const handlePrint = () => {
    const doc = generatePDF();
    window.open(doc.output('bloburl'), '_blank');
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
            <>
              <button onClick={handlePrint} className="btn-primary" style={{ background: 'var(--text-main)' }}>
                <Plus size={20} />
                Print Sheet
              </button>
              <button onClick={handleDownloadPDF} className="btn-primary" style={{ background: 'var(--secondary)' }}>
                <FileText size={20} />
                Download PDF
              </button>
            </>
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
                    <th style={{ width: '50px', padding: '0.75rem' }}>No.</th>
                    <th style={{ padding: '0.75rem' }}>Description</th>
                    <th style={{ width: '150px', padding: '0.75rem' }}>Estimated Amount (Rs.)</th>
                    <th style={{ width: '150px', padding: '0.75rem' }}>Amended Amount (Rs.)</th>
                    <th style={{ width: '50px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {formData.parts.map((part, index) => (
                    <tr key={part.id}>
                      <td style={{ border: 'none', padding: '0.5rem', textAlign: 'center', fontWeight: 'bold' }}>
                        {(index + 1).toString().padStart(2, '0')}
                      </td>
                      <td style={{ border: 'none', padding: '0.5rem' }}>
                        <input 
                          className="search-input"
                          style={{ paddingLeft: '1rem' }}
                          placeholder="e.g. Front Bumper - Brand New"
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
                        <input 
                          type="number"
                          className="search-input"
                          style={{ paddingLeft: '1rem' }}
                          value={part.amended_price}
                          onChange={(e) => updatePart(part.id, 'amended_price', e.target.value)}
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
                <span style={{ fontWeight: '600' }}>Rs. {(formData.parts_cost || 0).toFixed(2)}</span>
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

              <div style={{ marginTop: '1rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: '600', fontSize: '0.85rem' }}>Total Estimated</span>
                  <span style={{ fontWeight: '700', fontSize: '1.1rem', color: 'var(--text-muted)' }}>Rs. {(formData.total_cost || 0).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: '800', fontSize: '1.5rem', color: 'var(--primary)' }}>
                    {typeof formData.total_amended_price === 'number' ? `Rs. ${formData.total_amended_price.toFixed(2)}` : '--'}
                  </span>
                </div>
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
