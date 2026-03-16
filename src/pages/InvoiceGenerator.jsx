import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { supabase } from '../lib/supabase';
import { 
  ArrowLeft, Download, UploadCloud, CheckCircle, Plus, 
  Trash2, Tag, Receipt, ShieldCheck, ChevronRight, Save
} from 'lucide-react';

import logo from '../assets/logo.png';

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
    if (!vehicle) return null;

    const doc = new jsPDF();
    
    // Header Section
    // Logo (Top Left)
    try {
      doc.addImage(logo, 'PNG', 15, 10, 60, 30);
    } catch (e) {
      console.warn("Logo failed to load in PDF", e);
    }
    
    // Business Info (Top Right)
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(33, 37, 41);
    doc.text('ISHARA MOTORS', 195, 20, { align: 'right' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    doc.text('54/C, Sri Saranankara Mawatha, Rilawla, Polgasowita', 195, 27, { align: 'right' });
    doc.text('Mobile: 0719656885', 195, 33, { align: 'right' });
    doc.text('Email: motorsishara65@gmail.com', 195, 39, { align: 'right' });

    // Center Title "INVOICE"
    doc.setFontSize(18);
    doc.setFont('times', 'normal');
    doc.text('INVOICE', 105, 55, { align: 'center' });

    // Client and Invoice Metadata Section
    doc.setFontSize(11);
    
    // Left: Customer Info
    let metaY = 75;
    doc.setFont('helvetica', 'bold');
    doc.text('Customer Name :', 20, metaY);
    doc.setFont('helvetica', 'normal');
    doc.text(vehicle.owner_name, 55, metaY);
    
    metaY += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('Contact No :', 20, metaY);
    doc.setFont('helvetica', 'normal');
    doc.text(vehicle.phone || 'N/A', 55, metaY);
    
    metaY += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('Customer Address :', 20, metaY);
    doc.setFont('helvetica', 'normal');
    doc.text(vehicle.address || 'N/A', 58, metaY);
    
    metaY += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('Vehicle No :', 20, metaY);
    doc.setFont('helvetica', 'normal');
    doc.text(vehicle.vehicle_number, 55, metaY);

    // Right: Invoice Metadata
    let rightMetaY = 75;
    doc.setFont('helvetica', 'bold');
    doc.text('Date :', 135, rightMetaY);
    doc.setFont('helvetica', 'normal');
    doc.text(new Date(invoiceDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }), 150, rightMetaY);
    
    rightMetaY += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('Invoice No :', 135, rightMetaY);
    doc.setFont('helvetica', 'normal');
    doc.text(`INV-${Date.now().toString().slice(-6)}`, 160, rightMetaY);

    // Items Table
    doc.setDrawColor(200);
    doc.line(15, 110, 195, 110); // Top line
    
    doc.setFillColor(248, 250, 252);
    doc.rect(15, 110, 180, 10, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Description', 20, 116.5);
    doc.text('Qty', 120, 116.5);
    doc.text('Unit Price', 145, 116.5);
    doc.text('Amount', 175, 116.5);
    
    doc.line(15, 120, 195, 120); // Header bottom line
    
    let y = 127;
    doc.setFont('helvetica', 'normal');
    items.forEach(item => {
      doc.text(item.description, 20, y);
      doc.text(item.qty.toString(), 120, y);
      doc.text(`${Number(item.price).toFixed(2)}`, 145, y);
      doc.text(`${(item.qty * item.price).toFixed(2)}`, 175, y);
      y += 8;
    });

    // Subtotal and Calculations
    doc.line(15, y, 195, y);
    y += 10;
    
    doc.setFont('helvetica', 'bold');
    doc.text('Subtotal', 145, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`${subtotal.toFixed(2)}`, 175, y);
    
    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('Service Charge', 145, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`${Number(serviceCharge).toFixed(2)}`, 175, y);
    
    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('Insurance Approved', 145, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`-${Number(insuranceApprovedAmount).toFixed(2)}`, 175, y);
    
    y += 12;
    doc.setFillColor(33, 37, 41);
    doc.rect(140, y - 6, 55, 10, 'F');
    doc.setTextColor(255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL DUE', 143, y);
    doc.text(`${totalDue.toFixed(2)}`, 175, y);
    
    doc.setTextColor(0);
    
    // Summary Section
    if (summary) {
      y += 20;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('SERVICES PERFORMED SUMMARY:', 15, y);
      y += 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const splitSummary = doc.splitTextToSize(summary, 170);
      doc.text(splitSummary, 15, y);
    }

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text('Thank you for your business!', 105, 280, { align: 'center' });
    doc.text('Ishara Motors - Premium Garage Management', 105, 285, { align: 'center' });

    return doc;
  };

  const handleSaveInvoice = async () => {
    if (!selectedVehicleId) return alert('Please select a vehicle');
    setUploading(true);
    
    try {
      const doc = generatePDF();
      if (!doc) throw new Error("PDF generation failed");
      
      const pdfBlob = doc.output('blob');
      const fileName = `invoice-${Date.now()}-${selectedVehicleId}.pdf`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('invoices')
        .upload(fileName, pdfBlob);

      if (uploadError) throw uploadError;

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

      if (dbError) throw dbError;

      setSuccess(true);
      setTimeout(() => navigate('/invoices'), 2000);
    } catch (err) {
      console.error("Invoice Save Error:", err);
      alert('FAILED TO SAVE INVOICE: ' + (err.message || JSON.stringify(err)));
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div>Loading portal...</div>;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <button onClick={() => navigate(-1)} className="card" style={{ padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <ArrowLeft size={20} className="text-muted" />
        </button>
        <div style={{ flex: '1 1 300px' }}>
           <h1 style={{ fontSize: '1.75rem', fontWeight: '800', letterSpacing: '-0.5px' }}>Create New Invoice</h1>
           <p className="text-muted">Generate a professional bill for services rendered.</p>
        </div>
      </div>

      <div className="invoice-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: '2rem', alignItems: 'start' }}>
        
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
            <div style={{ padding: '1.5rem' }} className="table-container">
              <table style={{ border: 'none', minWidth: '600px' }}>
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
        <div className="sticky-sidebar" style={{ position: 'sticky', top: '2rem' }}>
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
                <label style={{ fontWeight: '600', color: 'var(--text-muted)' }}>Insurance <br></br> Approved Amount</label>
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
