import React, { useEffect, useState } from 'react';
import { ExternalLink, Receipt, Search, Car, Calendar, Banknote, FileText, ArrowRight, User, Edit, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

const Invoices = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    const { data } = await supabase
      .from('invoices')
      .select('*, vehicles(vehicle_number, owner_name)')
      .order('created_at', { ascending: false });
    setInvoices(data || []);
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this invoice?')) {
      const { error } = await supabase.from('invoices').delete().eq('id', id);
      if (error) alert('Error deleting invoice: ' + error.message);
      else fetchInvoices();
    }
  };

  const filteredInvoices = invoices.filter(inv => 
    (inv.vehicles?.vehicle_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.vehicles?.owner_name.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (dateFilter ? inv.created_at.startsWith(dateFilter) : true)
  );

  return (
    <div>
      <div className="page-header">
        <div>
           <h1>Billing Records</h1>
           <p className="text-muted">History of all generated invoices and payments.</p>
        </div>
        <button onClick={() => navigate('/invoices/new')} className="btn-primary">
          <Receipt size={20} />
          Create New Invoice
        </button>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ padding: '1.25rem 1.5rem', display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="search-container" style={{ flex: '1 1 300px' }}>
            <Search size={20} />
            <input 
              type="text" 
              className="search-input" 
              placeholder="Search by vehicle or owner..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: '1 1 200px' }}>
            <Calendar size={18} className="text-muted" />
            <input 
              type="date" 
              className="search-input" 
              style={{ width: '100%', paddingLeft: '1rem' }} 
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Invoice Info</th>
                <th>Vehicle Details</th>
                <th>Payment Amount</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>Loading records...</td></tr>
              ) : filteredInvoices.length > 0 ? filteredInvoices.map((inv) => (
                <tr key={inv.id}>
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <div style={{ fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                       <FileText size={16} className="text-primary" />
                       INV-{inv.id.slice(-6).toUpperCase()}
                    </div>
                    <div className="text-muted" style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
                       Generated: {new Date(inv.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: '600' }}>{inv.vehicles?.vehicle_number}</div>
                    <div className="text-muted" style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                       <User size={12} /> {inv.vehicles?.owner_name}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: '800', color: 'var(--text-main)', fontSize: '1.1rem' }}>
                       Rs. {Number(inv.total_amount).toLocaleString()}
                    </div>
                    <div className="badge badge-success" style={{ fontSize: '0.65rem', padding: '0.15rem 0.5rem' }}>PAID</div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                       <a href={inv.pdf_url} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ background: 'var(--accent)', color: 'var(--primary)', padding: '0.5rem' }} title="View PDF">
                         <ExternalLink size={18} />
                       </a>
                       <button onClick={() => navigate(`/invoices/edit/${inv.id}`)} className="btn-primary" style={{ background: 'white', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '0.5rem' }} title="Edit">
                         <Edit size={18} />
                       </button>
                       <button onClick={() => handleDelete(inv.id)} className="logout-btn" style={{ padding: '0.5rem' }} title="Delete">
                         <Trash2 size={18} />
                       </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>No invoices found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Invoices;
