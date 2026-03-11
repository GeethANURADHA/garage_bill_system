import React, { useEffect, useState } from 'react';
import { Car, Wrench, DollarSign, Clock, ShieldCheck, AlertTriangle, ArrowRight, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

const StatCard = ({ icon: Icon, label, value, color, subValue, subColor }) => (
  <div className="stat-card">
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div className="stat-icon" style={{ backgroundColor: `${color}15`, color: color }}>
        <Icon size={24} />
      </div>
      {subValue && (
        <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: subColor, background: `${subColor}10`, padding: '0.2rem 0.6rem', borderRadius: '2rem' }}>
           {subValue}
        </div>
      )}
    </div>
    <div className="stat-label" style={{ marginTop: '1.25rem' }}>{label}</div>
    <div className="stat-value" style={{ marginTop: '0.25rem' }}>{value}</div>
  </div>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    vehicles: 0,
    services: 0,
    income: 0,
    activeClaims: 0,
    expiringPolicies: 0,
  });
  const [recentServices, setRecentServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // 1. Fetch Basic Totals & Vehicles for Mapping
      const { data: vData } = await supabase.from('vehicles').select('*');
      const { data: sData } = await supabase.from('services').select('*');
      
      // Calculate Income (Resilient to missing total_cost column)
      const totalIncome = sData?.reduce((acc, curr) => {
        const cost = curr.total_cost || (Number(curr.parts_cost || 0) + Number(curr.labour_cost || 0));
        return acc + Number(cost);
      }, 0) || 0;

      // 2. Fetch Pending Claims (Resilient to missing table)
      let claimCount = 0;
      try {
        const { count } = await supabase
          .from('insurance_claims')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'Pending');
        claimCount = count || 0;
      } catch (e) {
        console.warn("Insurance claims table not found yet");
      }

      // 3. Expiry Logic
      const today = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(today.getDate() + 30);
      
      const expiring = vData?.filter(v => {
         if (!v.ins_expiry_date) return false;
         const expiry = new Date(v.ins_expiry_date);
         return expiry > today && expiry <= thirtyDaysFromNow;
      }).length || 0;

      // 4. Map Recent Services Manually (Avoids Join 400 Error)
      const sortedServices = (sData || [])
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5)
        .map(service => {
          const v = vData?.find(veh => veh.id === service.vehicle_id);
          return {
            ...service,
            vehicles: v || { vehicle_number: 'Unknown', owner_name: 'Unknown' },
            display_cost: service.total_cost || (Number(service.parts_cost || 0) + Number(service.labour_cost || 0))
          };
        });

      setStats({
        vehicles: vData?.length || 0,
        services: sData?.length || 0,
        income: totalIncome,
        activeClaims: claimCount,
        expiringPolicies: expiring,
      });
      setRecentServices(sortedServices);
    } catch (err) {
      console.error("Dashboard calculation error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>Loading dashboard...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
           <h1>Garage Overview</h1>
           <p className="text-muted">Welcome back. Here's what's happening today.</p>
        </div>
        <button onClick={() => fetchStats()} className="btn-primary" style={{ background: 'white', color: 'var(--text-main)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
          <Clock size={16} />
          Refresh Stats
        </button>
      </div>

      <div className="dashboard-grid">
        <StatCard icon={Car} label="Total Vehicles" value={stats.vehicles} color="var(--primary)" />
        <StatCard icon={Wrench} label="Total Services" value={stats.services} color="#6366f1" />
        <StatCard icon={DollarSign} label="Total Income" value={`$${stats.income.toLocaleString()}`} color="#f59e0b" />
        <StatCard 
          icon={ShieldCheck} 
          label="Insurance Policies" 
          value={stats.vehicles} 
          color="#10b981" 
          subValue={stats.expiringPolicies > 0 ? `${stats.expiringPolicies} expiring` : null} 
          subColor="var(--danger)"
        />
        <StatCard 
          icon={AlertTriangle} 
          label="Active Claims" 
          value={stats.activeClaims} 
          color="var(--danger)" 
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem', alignItems: 'start' }}>
        <div className="card">
          <div className="card-header" style={{ padding: '1.5rem 2rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Recent Service Activity</h2>
            <button onClick={() => navigate('/vehicles')} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              View All <ArrowRight size={16} />
            </button>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Vehicle Info</th>
                  <th>Service Task</th>
                  <th style={{ textAlign: 'right' }}>Date</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {recentServices.length > 0 ? recentServices.map((service) => (
                  <tr key={service.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/vehicles/${service.vehicles?.id}`)}>
                    <td style={{ padding: '1.25rem 2rem' }}>
                      <div style={{ fontWeight: '700', color: 'var(--text-main)' }}>{service.vehicles?.vehicle_number}</div>
                      <div className="text-muted" style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <User size={12} /> {service.vehicles?.owner_name}
                      </div>
                    </td>
                    <td>
                       <div style={{ fontWeight: '500' }}>{service.service_name}</div>
                    </td>
                    <td style={{ textAlign: 'right', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {new Date(service.date).toLocaleDateString()}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: '800', color: 'var(--primary)' }}>
                      ${Number(service.display_cost).toLocaleString()}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>No recent activity found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
