import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { supabase } from '../lib/supabase';
import { 
  ArrowLeft, Download, UploadCloud, CheckCircle, Plus, 
  Trash2, Tag, Receipt, ShieldCheck, ChevronRight, Save
} from 'lucide-react';

const InvoiceGenerator = () => {
  const { invoiceId } = useParams();
  const [searchParams] = useSearchParams();
  const serviceId = searchParams.get('serviceId');
  const navigate = useNavigate();
  
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [items, setItems] = useState([{ id: '1', description: '', qty: 1, price: 0 }]);
  const [serviceCharge, setServiceCharge] = useState(0);
  const [insuranceApprovedAmount, setInsuranceApprovedAmount] = useState(0);
  const [summary, setSummary] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, [serviceId, invoiceId]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      // Fetch Vehicles
      const { data: vData } = await supabase.from('vehicles').select('*').order('vehicle_number');
      setVehicles(vData || []);

      if (invoiceId) {
        // Fetch Existing Invoice (Edit Mode)
        const { data: invData, error: invError } = await supabase
          .from('invoices')
          .select('*')
          .eq('id', invoiceId)
          .single();
        
        if (invError) throw invError;

        setSelectedVehicleId(invData.vehicle_id);
        if (invData.created_at) setInvoiceDate(invData.created_at.split('T')[0]);
        
        if (invData.items) {
          setItems(invData.items.items || []);
          setServiceCharge(invData.items.serviceCharge || 0);
          setInsuranceApprovedAmount(invData.items.insuranceApprovedAmount || 0);
          setSummary(invData.items.summary || '');
        }
      } else if (serviceId) {
        // Fetch Initial data from Service (New Mode)
        const { data: sData } = await supabase
          .from('services')
          .select('*, vehicles(*)')
          .eq('id', serviceId)
          .single();
        
        if (sData) {
          setSelectedVehicleId(sData.vehicles.id);
          setItems([
            { id: '1', description: `${sData.service_name} (Parts)`, qty: 1, price: sData.parts_cost || 0 },
            { id: '2', description: `${sData.service_name} (Labour)`, qty: 1, price: sData.labour_cost || 0 },
          ]);
          setSummary(sData.services_done || '');
        }
      }
    } catch (err) {
      console.error(err);
      navigate('/invoices');
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    setItems([...items, { id: Date.now().toString(), description: '', qty: 1, price: 0 }]);
  };

  const removeItem = (id) => {
    setItems(items.filter(i => i.id !== id));
  };

  const updateItem = (id, field, value) => {
    setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const subtotal = items.reduce((sum, item) => sum + (Number(item.qty || 0) * Number(item.price || 0)), 0);
  const totalDue = subtotal + Number(serviceCharge) - Number(insuranceApprovedAmount);

  const generatePDF = () => {
    const vehicle = vehicles.find(v => v.id === selectedVehicleId);
    if (!vehicle) return;

    const doc = new jsPDF();
    const primaryColor = [34, 197, 94];
    
    // Header
    doc.setFontSize(26);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('ISHARA MOTORS', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Premium Vehicle Care & Service Garage', 105, 28, { align: 'center' });
    
    // Line
    doc.setDrawColor(200);
    doc.line(20, 35, 190, 35);
    
    // Client section
    doc.setTextColor(0);
    doc.setFontSize(9);
    doc.text('BILL TO:', 20, 45);
    doc.setFontSize(14);
    doc.text(vehicle.owner_name, 20, 52);
    doc.setFontSize(10);
    doc.text(`${vehicle.vehicle_number} - ${vehicle.brand} ${vehicle.model}`, 20, 58);
    doc.text(`Phone: ${vehicle.phone}`, 20, 63);
    
    // Invoice details
    doc.text(`Invoice Date: ${new Date(invoiceDate).toLocaleDateString()}`, 140, 52);
    doc.text(`Invoice ID: INV-${Date.now().toString().slice(-6)}`, 140, 58);
    
    // Table
    doc.setFillColor(248, 250, 252);
    doc.rect(20, 75, 170, 10, 'F');
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text('Description', 25, 81.5);
    doc.text('Qty', 110, 81.5);
    doc.text('Price ($)', 135, 81.5);
    doc.text('Total ($)', 165, 81.5);
    
    let y = 95;
    items.forEach(item => {
      doc.text(item.description, 25, y);
      doc.text(item.qty.toString(), 110, y);
      doc.text(`$${Number(item.price).toFixed(2)}`, 135, y);
      doc.text(`$${(item.qty * item.price).toFixed(2)}`, 165, y);
      y += 10;
    });
    
    // Summary line
    doc.setDrawColor(200);
    doc.line(20, y, 190, y);
    y += 10;
    
    // Financials
    doc.text('Subtotal:', 135, y);
    doc.text(`$${subtotal.toFixed(2)}`, 165, y);
    y += 8;
    doc.text('Service Charge:', 135, y);
    doc.text(`$${Number(serviceCharge).toFixed(2)}`, 165, y);
    y += 8;
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('Insurance Approved:', 135, y);
    doc.text(`-$${Number(insuranceApprovedAmount).toFixed(2)}`, 165, y);
    y += 12;
    
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('TOTAL DUE', 100, y);
    doc.text(`$${totalDue.toFixed(2)}`, 165, y);
    
    // Note
    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text('Thank you for choosing Ishara Motors. Have a safe drive!', 105, y + 30, { align: 'center' });

    return doc;
  };

  const handleSaveInvoice = async () => {
    if (!selectedVehicleId) return alert('Please select a vehicle');
    setUploading(true);
    
    const doc = generatePDF();
    const pdfBlob = doc.output('blob');
    const fileName = `invoice-${Date.now()}-${selectedVehicleId}.pdf`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('invoices')
      .upload(fileName, pdfBlob);

    if (uploadError) {
      alert('Upload failed: ' + uploadError.message);
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('invoices')
      .getPublicUrl(fileName);

    const invoiceData = {
      vehicle_id: selectedVehicleId,
      total_amount: totalDue,
      items: {
        items,
        serviceCharge,
        insuranceApprovedAmount,
        summary
      },
      pdf_url: publicUrl,
    };

    const { error: dbError } = invoiceId
      ? await supabase.from('invoices').update(invoiceData).eq('id', invoiceId)
      : await supabase.from('invoices').insert([{
          ...invoiceData,
          invoice_number: `INV-${Date.now().toString().slice(-6)}`
        }]);

    if (dbError) {
      console.error("Invoice Save Error:", dbError);
      alert('FAILED TO SAVE INVOICE: ' + (dbError.message || JSON.stringify(dbError)));
    } else {
      setSuccess(true);
      setTimeout(() => navigate('/invoices'), 2000);
    }
    setUploading(false);
  };

  if (loading) return <div>Loading portal...</div>;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
        <button onClick={() => navigate(-1)} className="card" style={{ padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <ArrowLeft size={20} className="text-muted" />
        </button>
        <div>
           <h1 style={{ fontSize: '1.75rem', fontWeight: '800', letterSpacing: '-0.5px' }}>Create New Invoice</h1>
           <p className="text-muted">Generate a professional bill for services rendered and parts replaced.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: '2rem', alignItems: 'start' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Customer Selection */}
          <div className="card">
            <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 200px', gap: '1.5rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontWeight: '600', color: 'var(--text-main)' }}>Select Customer / Vehicle <span className="text-danger">*</span></label>
                <select 
                  className="search-input" 
                  style={{ paddingLeft: '1rem', background: 'white' }}
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                >
                  <option value="">— Choose a Vehicle —</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.vehicle_number} - {v.owner_name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontWeight: '600', color: 'var(--text-main)' }}>Invoice Date</label>
                <input 
                  type="date" 
                  className="search-input" 
                  style={{ paddingLeft: '1rem' }} 
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Invoice Items */}
          <div className="card">
            <div className="card-header" style={{ padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Invoice Items</h2>
              <button 
                onClick={addItem}
                className="btn-primary" 
                style={{ background: 'white', color: 'var(--text-main)', border: '1px solid var(--border)', fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
              >
                <Plus size={16} />
                Add Line Item
              </button>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <table style={{ border: 'none' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ borderRadius: '0.5rem 0 0 0.5rem', padding: '0.75rem 1rem' }}>Description</th>
                    <th style={{ width: '100px', padding: '0.75rem 1rem' }}>Qty</th>
                    <th style={{ width: '150px', padding: '0.75rem 1rem' }}>Price ($)</th>
                    <th style={{ width: '50px', padding: '0.75rem 1rem', borderRadius: '0 0.5rem 0.5rem 0' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td style={{ border: 'none', padding: '1rem 0.5rem' }}>
                        <input 
                          className="search-input" 
                          style={{ paddingLeft: '1rem', background: '#f8fafc' }} 
                          placeholder="Service or Part name" 
                          value={item.description}
                          onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                        />
                      </td>
                      <td style={{ border: 'none', padding: '1rem 0.5rem' }}>
                        <input 
                          type="number"
                          className="search-input" 
                          style={{ paddingLeft: '1rem', background: '#f8fafc' }} 
                          value={item.qty}
                          onChange={(e) => updateItem(item.id, 'qty', e.target.value)}
                        />
                      </td>
                      <td style={{ border: 'none', padding: '1rem 0.5rem' }}>
                        <input 
                          type="number"
                          className="search-input" 
                          style={{ paddingLeft: '1rem', background: '#f8fafc' }} 
                          value={item.price}
                          onChange={(e) => updateItem(item.id, 'price', e.target.value)}
                        />
                      </td>
                      <td style={{ border: 'none', padding: '1rem 0.5rem' }}>
                        <button onClick={() => removeItem(item.id)} className="logout-btn" style={{ padding: '0.5rem' }}>
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button 
                onClick={addItem}
                style={{ width: '100%', marginTop: '1rem', padding: '1rem', border: '2px dashed var(--border)', borderRadius: '0.75rem', background: 'none', color: 'var(--text-muted)', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                <Plus size={18} />
                Add Another Item
              </button>
            </div>
          </div>

          {/* Summary Box */}
          <div className="card">
             <div className="card-header" style={{ padding: '1.5rem' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Services & Summary</h2>
             </div>
             <div style={{ padding: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Summary of Services Performed</label>
                <textarea 
                  className="search-input"
                  style={{ width: '100%', height: '120px', padding: '1rem', borderRadius: '0.75rem', background: 'white', resize: 'none' }}
                  placeholder="Summarize the work done on the vehicle..."
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                />
             </div>
          </div>
        </div>

        {/* Right Column: Sticky Summary */}
        <div style={{ position: 'sticky', top: '2rem' }}>
          <div className="card" style={{ boxShadow: 'var(--shadow-lg)', border: 'none' }}>
            <div style={{ background: '#0f172a', padding: '1.5rem', color: 'white' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1.5rem', opacity: 0.8 }}>Invoice Summary</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem', opacity: 0.7 }}>Subtotal</span>
                <span style={{ fontSize: '1.1rem', fontWeight: '700' }}>${subtotal.toFixed(2)}</span>
              </div>
            </div>
            
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontWeight: '600', color: 'var(--text-muted)' }}>Service Charge</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginTop: '0.5rem' }}>
                   <span style={{ position: 'absolute', left: '1rem', color: 'var(--text-muted)' }}>$</span>
                   <input 
                    type="number"
                    className="search-input" 
                    style={{ paddingLeft: '2rem', background: 'white' }} 
                    value={serviceCharge}
                    onChange={(e) => setServiceCharge(e.target.value)}
                   />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontWeight: '600', color: 'var(--text-muted)' }}>Insurance Approved Amount</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginTop: '0.5rem' }}>
                   <span style={{ position: 'absolute', left: '1rem', color: 'var(--text-muted)' }}>$</span>
                   <input 
                    type="number"
                    className="search-input" 
                    style={{ paddingLeft: '2rem', background: 'white' }} 
                    value={insuranceApprovedAmount}
                    onChange={(e) => setInsuranceApprovedAmount(e.target.value)}
                   />
                </div>
              </div>

              <div style={{ marginTop: '1rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: '700', fontSize: '1rem' }}>Total Due</span>
                <span style={{ fontWeight: '800', fontSize: '1.75rem', color: 'var(--primary)' }}>${totalDue.toFixed(2)}</span>
              </div>

              <button 
                onClick={handleSaveInvoice}
                disabled={uploading || !selectedVehicleId}
                className="btn-primary" 
                style={{ width: '100%', height: '54px', fontSize: '1rem', justifyContent: 'center', boxShadow: '0 10px 15px -3px rgba(34, 197, 94, 0.4)' }}
              >
                <Save size={20} />
                {uploading ? 'Processing...' : 'Save & Generate PDF'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {success && (
        <div style={{ position: 'fixed', top: '2rem', right: '2rem', background: 'var(--success)', color: 'white', padding: '1rem 2rem', borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: 'var(--shadow-lg)', zIndex: 2000 }}>
            <CheckCircle size={24} />
            <span>Invoice generated successfully!</span>
        </div>
      )}
    </div>
  );
};

export default InvoiceGenerator;
