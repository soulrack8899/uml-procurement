import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Shield, ShieldCheck, Mail, Lock, CheckCircle2, UserPlus, RefreshCw, Search, ChevronRight, Building2, ArrowRight, Briefcase } from 'lucide-react';
import { procurementApi } from '../services/api';
import { useCompany } from '../App';

const UserManagement = () => {
  const { currentCompany, activeRole, isMobile } = useCompany();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('DIRECTORY'); // DIRECTORY or PROVISION
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleTimeString());

  // Provisioning Form State
  const [companies, setCompanies] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone_number: '',
    password: 'password123',
    company_id: '',
    roles: ['REQUESTER']
  });


  useEffect(() => {
    fetchData();
    if (activeRole === 'GLOBAL_ADMIN') {
      fetchCompanies();
    }
  }, [activeRole]);

  useEffect(() => {
    if (currentCompany && !formData.company_id) {
      setFormData(prev => ({ ...prev, company_id: currentCompany.id }));
    }
  }, [currentCompany]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const userData = await procurementApi.getUsers();
      setUsers(userData || []);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error("User Loading Error:", err);
      alert("User Sync Failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const data = await procurementApi.getCompanies();
      setCompanies(data);
    } catch (err) {
      console.error("Failed to load companies", err);
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

  const handleUpdateRole = async (userId, newRole, roles = []) => {
    setActionLoading(userId);
    try {
      // If roles array provided, use it (multi). Else use newRole (single).
      const rolesArray = roles.length > 0 ? roles : [newRole];
      await procurementApi.updateUser(userId, { roles: rolesArray });
      fetchData(); // Refresh to get combined role labels
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };



  const handleResetPassword = async (userId) => {
    const newPass = "password123";
    if (!window.confirm(`Reset password for this user to default: 'password123'?`)) return;

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

  const handleOnboard = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await procurementApi.onboardUser(formData);
      setShowSuccess(true);
      fetchData(); // Refresh list
      setTimeout(() => {
        setShowSuccess(false);
        setFormData(prev => ({ ...prev, name: '', email: '', phone_number: '' }));
        setActiveTab('DIRECTORY');
      }, 2000);
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const allRoles = [
    { id: 'REQUESTER', name: 'Staff (Requester)', desc: 'Standard personnel. Can initiate procurement requests.' },
    { id: 'MANAGER', name: 'Manager (Approver)', desc: 'Department oversight. Can approve requests within thresholds.' },
    { id: 'FINANCE', name: 'Finance Officer', desc: 'Financial compliance. Manages PO issuance and payments.' },
    { id: 'DIRECTOR', name: 'Director (Board)', desc: 'Highest authority. Required for high-value strategic spend.' },
    { id: 'ADMIN', name: 'System Admin (Procurement)', desc: 'Administrative lead. Manages company users and vendors.' }
  ];

  const availableRoles = allRoles.filter(role => {
    if (['ADMIN', 'DIRECTOR'].includes(role.id)) return activeRole === 'GLOBAL_ADMIN';
    return true;
  });

  const S = {
    card: { background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(194,198,211,0.2)', overflow: 'hidden' },
    tab: (active) => ({
      padding: '1rem 2rem', borderBottom: `3px solid ${active ? 'var(--primary)' : 'transparent'}`,
      color: active ? 'var(--primary)' : 'var(--outline)', fontWeight: 800, fontSize: '0.875rem', cursor: 'pointer', transition: 'all 0.2s'
    }),
    th: { padding: '1rem', fontSize: '0.625rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--outline)', textAlign: 'left', borderBottom: '1px solid var(--outline-variant-low)' },
    td: { padding: '1.25rem 1rem', fontSize: '0.875rem', color: 'var(--on-surface)', borderBottom: '1px solid var(--outline-variant-low)' },
    label: { display: 'block', fontSize: '0.625rem', fontWeight: 900, color: 'var(--outline)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' },
    input: { width: '100%', padding: '0.75rem 1rem', background: 'var(--surface-container-low)', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-sm)', color: 'var(--on-surface)', fontSize: '0.875rem', fontWeight: 600, outline: 'none' }
  };

  return (
    <div style={{ maxWidth: '80rem', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--outline)' }}>Organization</span>
            <ChevronRight size={12} style={{ color: 'var(--outline)' }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700 }}>Team Management</span>
          </nav>
          <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: '2.5rem', fontWeight: 900, color: 'var(--primary)', letterSpacing: '-0.02em' }}>
            {activeRole === 'GLOBAL_ADMIN' ? 'Global Directory' : `${currentCompany?.name} Team`}
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={() => setActiveTab(activeTab === 'DIRECTORY' ? 'PROVISION' : 'DIRECTORY')} className="gradient-fill" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1.75rem', borderRadius: 'var(--radius-pill)', border: 'none', color: 'white', fontWeight: 800, cursor: 'pointer', transition: 'all 0.3s' }}>
            {activeTab === 'DIRECTORY' ? <><UserPlus size={18} /> Add Team Member</> : <><Users size={18} /> View Directory</>}
          </button>
        </div>
      </div>

      {/* Tabs Menu */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--outline-variant-low)', gap: '1rem' }}>
        <div onClick={() => setActiveTab('DIRECTORY')} style={S.tab(activeTab === 'DIRECTORY')}>Member Directory</div>
        <div onClick={() => setActiveTab('PROVISION')} style={S.tab(activeTab === 'PROVISION')}>Provisioning Hub</div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'DIRECTORY' ? (
          <motion.div key="dir" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={S.card}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--outline-variant-low)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', flex: 1, minWidth: '280px', background: 'var(--surface-container-high)', borderRadius: 'var(--radius-pill)', padding: '0.75rem 1.5rem', alignItems: 'center', gap: '1rem' }}>
                <Search size={18} style={{ color: 'var(--outline)' }} />
                <input placeholder="Search by name or email..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ background: 'transparent', border: 'none', outline: 'none', width: '100%', fontWeight: 600, fontSize: '0.875rem' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '0.625rem', color: 'var(--outline)', fontWeight: 800 }}>SYNCED: {lastUpdated}</span>
                <button
                  disabled={loading}
                  onClick={fetchData}
                  style={{ background: 'none', border: 'none', color: loading ? 'var(--outline)' : 'var(--primary)', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center' }}
                >
                  <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--surface-container-low)' }}>
                    <th style={S.th}>Team Member</th>
                    <th style={S.th}>Access Role</th>
                    <th style={S.th}>System Status</th>
                    <th style={{ ...S.th, textAlign: 'right' }}>Management</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: '4rem', fontWeight: 800, color: 'var(--outline)' }}>Syncing directory...</td></tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '6rem 4rem' }}>
                        <Users size={40} style={{ margin: '0 auto 1.5rem', opacity: 0.1 }} />
                        <p style={{ fontWeight: 800, color: 'var(--outline)' }}>No team members found</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--outline)', marginTop: '0.5rem' }}>{searchTerm ? 'Try adjusting your search filters.' : 'Start by provisioning a new account.'}</p>
                      </td>
                    </tr>
                  ) : filteredUsers.map((user) => (
                    <tr key={user.id} className="hover-lift">
                      <td style={S.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-pill)', background: 'var(--primary-container)', color: 'var(--on-primary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.75rem' }}>{user.name[0]}</div>
                          <div>
                            <div style={{ fontWeight: 800 }}>{user.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--outline)' }}>{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={S.td}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', maxWidth: '300px' }}>
                          {availableRoles.map(r => {
                            const isAssigned = (user.roles || [user.global_role]).includes(r.id);
                            return (
                              <button
                                key={r.id}
                                onClick={() => {
                                  const current = (user.roles || [user.global_role]);
                                  const next = isAssigned ? current.filter(x => x !== r.id) : [...current, r.id];
                                  if (next.length > 0) handleUpdateRole(user.id, null, next);
                                }}
                                style={{
                                  fontSize: '0.625rem', fontWeight: 900,
                                  background: isAssigned ? 'var(--primary-container)' : 'var(--surface-container-high)',
                                  color: isAssigned ? 'var(--on-primary-container)' : 'var(--outline)',
                                  padding: '2px 8px', borderRadius: 'var(--radius-pill)', cursor: 'pointer',
                                  transition: 'all 0.2s', border: isAssigned ? '1px solid var(--primary)' : '1px solid transparent'
                                }}
                              >
                                {r.id === 'ADMIN' ? 'ADMIN' : r.id}
                              </button>
                            );
                          })}
                        </div>
                      </td>


                      <td style={S.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, color: user.approval_status === 'APPROVED' ? 'var(--tertiary)' : 'var(--error)' }}>
                          {user.approval_status === 'APPROVED' ? <ShieldCheck size={14} /> : <Lock size={14} />}
                          {user.approval_status}
                        </div>
                      </td>
                      <td style={{ ...S.td, textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                          <button onClick={() => handleResetPassword(user.id)} style={{ padding: '0.5rem 1rem', background: 'var(--surface-container-high)', border: 'none', borderRadius: 'var(--radius-pill)', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer' }}>Reset PW</button>
                          {user.approval_status === 'APPROVED' ? (
                            <button onClick={() => handleUpdateStatus(user.id, 'SUSPENDED')} style={{ padding: '0.5rem 1rem', background: 'none', border: '1px solid var(--error)', color: 'var(--error)', borderRadius: 'var(--radius-pill)', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer' }}>Suspend</button>
                          ) : (
                            <button onClick={() => handleUpdateStatus(user.id, 'APPROVED')} className="gradient-fill" style={{ padding: '0.5rem 1rem', border: 'none', color: 'white', borderRadius: 'var(--radius-pill)', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer' }}>Approve</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        ) : (
          <motion.div key="prov" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '7fr 5fr', gap: '2rem' }}>
            <div style={S.card}>
              <div style={{ background: 'var(--surface-container-high)', padding: '1.5rem', borderBottom: '1px solid rgba(194,198,211,0.1)' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 800 }}>Onboarding Details</h2>
              </div>
              <form onSubmit={handleOnboard} style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1.5rem' }}>
                  <div>
                    <label style={S.label}>Full Legal Name</label>
                    <div style={{ position: 'relative' }}>
                      <Users size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--outline)' }} />
                      <input required placeholder="Staff Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={{ ...S.input, paddingLeft: '3rem' }} />
                    </div>
                  </div>
                  <div>
                    <label style={S.label}>Email Address</label>
                    <div style={{ position: 'relative' }}>
                      <Mail size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--outline)' }} />
                      <input required type="email" placeholder="email@company.com" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} style={{ ...S.input, paddingLeft: '3rem' }} />
                    </div>
                  </div>
                </div>

                {activeRole === 'GLOBAL_ADMIN' && (
                  <div>
                    <label style={S.label}>Target Company</label>
                    <select value={formData.company_id} onChange={e => setFormData({ ...formData, company_id: e.target.value })} style={S.input}>
                      {companies.map(co => <option key={co.id} value={co.id}>{co.name}</option>)}
                    </select>
                  </div>
                )}

                <div>
                  <label style={S.label}>Assign Role(s) & Permissions (Select Multiple)</label>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>
                    {availableRoles.map(role => {
                      const isSelected = (formData.roles || []).includes(role.id);
                      return (
                        <div key={role.id} onClick={() => {
                          const next = isSelected ? formData.roles.filter(r => r !== role.id) : [...(formData.roles || []), role.id];
                          setFormData({ ...formData, roles: next });
                        }} style={{
                          padding: '1rem', borderRadius: 'var(--radius-sm)', border: `2px solid ${isSelected ? 'var(--primary)' : 'transparent'}`,
                          background: isSelected ? 'var(--primary-container)' : 'var(--surface-container-low)', cursor: 'pointer', transition: 'all 0.2s'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: isSelected ? 'var(--on-primary-container)' : 'var(--on-surface)' }}>{role.name}</span>
                          </div>
                          <p style={{ fontSize: '0.625rem', color: isSelected ? 'var(--on-primary-container)' : 'var(--outline)', lineHeight: 1.4 }}>{role.desc}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button disabled={submitting} type="submit" className="gradient-fill" style={{ width: '100%', padding: '1rem', borderRadius: 'var(--radius-md)', border: 'none', color: 'white', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginTop: '1rem' }}>
                  {submitting ? 'Creating...' : <>Confirm & Provision Account <ArrowRight size={18} /></>}
                </button>
              </form>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <section style={{ ...S.card, padding: '2rem', borderLeft: '4px solid var(--primary)' }}>
                <h3 style={{ fontSize: '0.875rem', fontWeight: 900, color: 'var(--primary)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Lock size={16} /> Security Notice</h3>
                <ul style={{ paddingLeft: '1.25rem', fontSize: '0.875rem', color: 'var(--on-surface-variant)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <li>Initial password is set to <strong>password123</strong>.</li>
                  <li>User will be prompted to update this upon their first secure login.</li>
                  <li>All actions are tracked in the platform audit log.</li>
                </ul>
              </section>
              {showSuccess && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ background: 'var(--tertiary-container)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', gap: '1rem', border: '1px solid var(--on-tertiary-container)' }}>
                  <CheckCircle2 size={32} style={{ color: 'var(--on-tertiary-container)' }} />
                  <div>
                    <h4 style={{ fontWeight: 900, color: 'var(--on-tertiary-container)' }}>Success</h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--on-tertiary-container)' }}>User account created and credentials dispatched.</p>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default UserManagement;
