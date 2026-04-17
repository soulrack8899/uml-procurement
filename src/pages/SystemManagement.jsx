import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Shield, ShieldCheck, ShieldAlert, Key, UserCheck, UserX, Search, Filter, MoreVertical, RefreshCw, CheckCircle2, ChevronRight, Building2, Mail, Fingerprint, Plus, Database, Globe, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { procurementApi } from '../services/api';
import { useCompany } from '../App';

const SystemManagement = () => {
  const { activeRole, isMobile } = useCompany();
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('USERS'); // USERS or COMPANIES
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');
  const [actionLoading, setActionLoading] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [userData, companyData] = await Promise.all([
        procurementApi.getUsers(),
        procurementApi.getCompanies()
      ]);
      setUsers(userData || []);
      setCompanies(companyData || []);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error("Data Loading Error:", err);
      alert("System Sync Failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (userId, newStatus) => {
    setActionLoading(userId);
    try {
      await procurementApi.updateUser(userId, { approval_status: newStatus });
      setUsers(users.map(u => u.id === userId ? { ...u, approval_status: newStatus } : u));
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleResetPassword = async (userId) => {
    const newPass = "password123"; // Reset to default
    if (!window.confirm(`Reset password for this user to the default: 'password123'?`)) return;
    
    setActionLoading(userId);
    try {
      await procurementApi.updateUser(userId, { 
        password: newPass, 
        is_temporary_password: true 
      });
      alert("Password reset completed. User must change it on next login.");
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const exportCSV = () => {
    const headers = ['Name', 'Email', 'Role', 'Status'];
    const rows = filteredUsers.map(u => [u.name, u.email, u.global_role, u.approval_status]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map(e => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", "user_export.csv");
    link.click();
  }

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || u.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'ALL' || u.global_role === filterRole;
    return matchesSearch && matchesRole;
  });

  const filteredCompanies = companies.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || c.domain?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const S = {
    card: { background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(194,198,211,0.2)', overflow: 'hidden' },
    th: { padding: '1rem', fontSize: '0.625rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--outline)', textAlign: 'left', borderBottom: '1px solid var(--outline-variant-low)' },
    td: { padding: '1.25rem 1rem', fontSize: '0.875rem', color: 'var(--on-surface)', borderBottom: '1px solid var(--outline-variant-low)' },
    tab: (active) => ({
      padding: '1rem 2rem', borderBottom: `2px solid ${active ? 'var(--primary)' : 'transparent'}`,
      color: active ? 'var(--primary)' : 'var(--outline)', fontWeight: 800, fontSize: '0.875rem', cursor: 'pointer', transition: 'all 0.2s'
    })
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
             <span style={{ fontSize: '0.75rem', color: 'var(--outline)' }}>System Control</span>
             <ChevronRight size={12} style={{ color: 'var(--outline)' }} />
             <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700 }}>Management Hub</span>
          </nav>
          <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: '2.5rem', fontWeight: 900, color: 'var(--primary)', letterSpacing: '-0.02em' }}>
             Platform Governance
          </h1>
          <p style={{ color: 'var(--outline)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
             Global workspace orchestration and user account lifecycle management.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
            <Link to="/user-management" style={{ textDecoration: 'none' }}>
                <button style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-pill)', border: 'none', background: 'var(--primary)', color: 'white', fontWeight: 800, cursor: 'pointer' }}>
                    <Users size={18} /> Provision User
                </button>
            </Link>
            <Link to="/onboard" style={{ textDecoration: 'none' }}>
                <button style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-pill)', border: 'none', background: 'var(--tertiary)', color: 'white', fontWeight: 800, cursor: 'pointer' }}>
                    <Plus size={18} /> Add Company
                </button>
            </Link>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--outline-variant-low)', gap: '1rem' }}>
          <div onClick={() => setActiveTab('USERS')} style={S.tab(activeTab === 'USERS')}>Directory (Users)</div>
          <div onClick={() => setActiveTab('COMPANIES')} style={S.tab(activeTab === 'COMPANIES')}>Entities (Companies)</div>
          <div onClick={() => setActiveTab('STATS')} style={S.tab(activeTab === 'STATS')}>System Health</div>
          <div onClick={() => setActiveTab('CHANGELOG')} style={S.tab(activeTab === 'CHANGELOG')}>System Updates</div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'USERS' && (
        <div style={S.card}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--outline-variant-low)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
             <div style={{ display: 'flex', flex: 1, minWidth: '280px', background: 'var(--surface-container-high)', borderRadius: 'var(--radius-pill)', padding: '0.5rem 1.25rem', alignItems: 'center', gap: '0.75rem' }}>
                <Search size={18} style={{ color: 'var(--outline)' }} />
                <input 
                  placeholder="ID, Name, or Email..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{ background: 'transparent', border: 'none', outline: 'none', width: '100%', fontWeight: 600, fontSize: '0.875rem' }} 
                />
             </div>
             <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button onClick={exportCSV} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 800 }}>
                    <Globe size={16} /> Export CSV
                </button>
                <span style={{ fontSize: '0.625rem', color: 'var(--outline)', fontWeight: 800 }}>SYNCED: {lastUpdated}</span>
                <button onClick={fetchData} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}><RefreshCw size={20} className={loading ? 'animate-spin' : ''} /></button>
             </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--surface-container-low)' }}>
                  <th style={S.th}>Identity</th>
                  <th style={S.th}>Role / Status</th>
                  <th style={S.th}>Access Map</th>
                  <th style={{ ...S.th, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td style={S.td}>
                       <div style={{ fontWeight: 800 }}>{user.name}</div>
                       <div style={{ fontSize: '0.75rem', color: 'var(--outline)' }}>{user.email}</div>
                    </td>
                    <td style={S.td}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '4px' }}>
                          <span style={{ fontSize: '0.625rem', fontWeight: 900, background: user.global_role === 'GLOBAL_ADMIN' ? 'var(--primary-container)' : 'var(--surface-container-high)', color: user.global_role === 'GLOBAL_ADMIN' ? 'var(--on-primary-container)' : 'var(--on-surface)', padding: '2px 8px', borderRadius: 'var(--radius-sm)' }}>
                             {user.global_role}
                          </span>
                       </div>
                       <div style={{ fontSize: '0.7rem', fontWeight: 800, color: user.approval_status === 'APPROVED' ? 'var(--tertiary)' : 'var(--error)' }}>
                          {user.approval_status}
                       </div>
                    </td>
                    <td style={S.td}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--outline)' }}>
                          <Building2 size={14} /> Active in {user.companies || 0} Entities
                       </div>
                    </td>
                    <td style={{ ...S.td, textAlign: 'right' }}>
                       <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                          <button onClick={() => handleResetPassword(user.id)} style={{ padding: '0.4rem 0.8rem', background: 'var(--surface-container-high)', border: 'none', borderRadius: 'var(--radius-pill)', fontWeight: 700, fontSize: '0.7rem', cursor: 'pointer' }}>Reset PW</button>
                          {user.approval_status === 'APPROVED' ? (
                            <button onClick={() => handleUpdateStatus(user.id, 'SUSPENDED')} style={{ padding: '0.4rem 0.8rem', background: 'none', border: '1px solid var(--error)', color: 'var(--error)', borderRadius: 'var(--radius-pill)', fontWeight: 700, fontSize: '0.7rem', cursor: 'pointer' }}>Suspend</button>
                          ) : (
                            <button onClick={() => handleUpdateStatus(user.id, 'APPROVED')} className="gradient-fill" style={{ padding: '0.4rem 0.8rem', border: 'none', color: 'white', borderRadius: 'var(--radius-pill)', fontWeight: 700, fontSize: '0.7rem', cursor: 'pointer' }}>Approve</button>
                          )}
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'COMPANIES' && (
        <div style={S.card}>
          <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
             <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '1.5rem' }}>
                {filteredCompanies.map(co => (
                    <div key={co.id} style={{ padding: '1.5rem', background: 'var(--surface-container-low)', borderRadius: 'var(--radius-md)', border: '1px solid var(--outline-variant-low)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <div style={{ width: 48, height: 48, background: 'var(--primary)', color: 'white', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.25rem' }}>
                                {co.name[0]}
                            </div>
                            <Globe size={18} style={{ color: 'var(--outline)' }} />
                        </div>
                        <h3 style={{ fontSize: '1rem', fontWeight: 900, marginBottom: '0.25rem' }}>{co.name}</h3>
                        <p style={{ fontSize: '0.75rem', color: 'var(--outline)', marginBottom: '1rem' }}>{co.email_address || 'No contact email'}</p>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                             <span style={{ fontSize: '0.625rem', fontWeight: 900, background: 'var(--surface-container-high)', padding: '2px 8px', borderRadius: '2px' }}>REG: {co.co_reg_no || 'NA'}</span>
                        </div>
                    </div>
                ))}
             </div>
          </div>
        </div>
      )}

      {activeTab === 'STATS' && (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: '1.5rem' }}>
              {[
                { label: 'System Users', val: users.length, icon: <Users />, color: 'var(--primary)' },
                { label: 'Active Tenants', val: companies.length, icon: <Building2 />, color: 'var(--secondary)' },
                { label: 'Security Protocols', val: 'Active', icon: <ShieldCheck />, color: 'var(--tertiary)' },
                { label: 'Cloud Database', val: 'Online', icon: <Database />, color: 'var(--outline)' },
              ].map((s, i) => (
                  <div key={i} style={{ ...S.card, padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                      <div style={{ width: 56, height: 56, borderRadius: 'var(--radius-pill)', background: 'var(--surface-container-high)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, marginBottom: '1rem' }}>
                          {s.icon}
                      </div>
                      <span style={{ fontSize: '0.625rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--outline)', letterSpacing: '0.1em' }}>{s.label}</span>
                      <h2 style={{ fontSize: '1.75rem', fontWeight: 900, marginTop: '0.5rem' }}>{s.val}</h2>
                  </div>
              ))}
          </div>
      )}
      
      {activeTab === 'CHANGELOG' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div className="surface-card" style={{ padding: '2.5rem', border: 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '3rem' }}>
                      <div style={{ padding: '0.5rem 1rem', background: 'var(--primary-container)', color: 'white', borderRadius: 'var(--radius-sm)', fontSize: '0.625rem', fontWeight: 900, textTransform: 'uppercase' }}>Current Release</div>
                      <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--primary)' }}>v0.2.0-STABLE • Batch 04/17</h2>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '3rem' }}>
                      <div>
                          <h3 style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--outline)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Database size={14} /> Core Performance Fixes
                          </h3>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                              {[
                                  { title: "Hard Schema Sync", desc: "Resolved UndefinedColumn errors on startup." },
                                  { title: "Self-Healing DB", desc: "Auto-provisioning of audit logs and rejection fields." },
                                  { title: "Robust Dashboard Stats", desc: "Fixed crashes on null expenditure data." }
                              ].map((f, i) => (
                                  <div key={i} style={{ padding: '1rem', background: 'var(--surface-container-low)', borderRadius: 'var(--radius-sm)' }}>
                                      <p style={{ fontSize: '0.875rem', fontWeight: 800, marginBottom: '2px' }}>{f.title}</p>
                                      <p style={{ fontSize: '0.75rem', color: 'var(--outline)' }}>{f.desc}</p>
                                  </div>
                              ))}
                          </div>
                      </div>

                      <div>
                          <h3 style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--outline)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <RefreshCw size={14} /> Feature Improvements
                          </h3>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                              {[
                                  { title: "Notification Engine", desc: "Added real-time alert API & notification hub." },
                                  { title: "Authentication Refresh", desc: "Implemented password recovery and SHA-256 fix." },
                                  { title: "Verification Suite", desc: "Added new diagnostic scripts for SMTP and DB." }
                              ].map((f, i) => (
                                  <div key={i} style={{ padding: '1rem', background: 'var(--surface-container-high)', borderRadius: 'var(--radius-sm)' }}>
                                      <p style={{ fontSize: '0.875rem', fontWeight: 800, marginBottom: '2px' }}>{f.title}</p>
                                      <p style={{ fontSize: '0.75rem', color: 'var(--outline)' }}>{f.desc}</p>
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>

                  <div style={{ marginTop: '4rem', padding: '2rem', borderTop: '1px solid var(--outline-variant-low)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <p style={{ fontSize: '0.75rem', color: 'var(--outline)' }}>System version maintained by ProcuSure Core Engineering.</p>
                      <button 
                        onClick={() => window.open('/REPORT_2026_04_17.md')}
                        style={{ border: 'none', background: 'none', color: 'var(--primary)', fontWeight: 800, fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                         View Full Report <ArrowRight size={16} />
                      </button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default SystemManagement;
