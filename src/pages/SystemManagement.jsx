import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Shield, ShieldCheck, ShieldAlert, Key, UserCheck, UserX, Search, Filter, MoreVertical, RefreshCw, CheckCircle2, ChevronRight, Building2, Mail, Fingerprint } from 'lucide-react';
import { procurementApi } from '../services/api';
import { useCompany } from '../App';

const SystemManagement = () => {
  const { activeRole, isMobile } = useCompany();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');
  const [actionLoading, setActionLoading] = useState(null);
  const [companies, setCompanies] = useState([]);

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
      setUsers(userData);
      setCompanies(companyData);
    } catch (err) {
      console.error("Management Data Sync Failure:", err);
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
    const newPass = "temp" + Math.floor(Math.random() * 8999 + 1000);
    if (!window.confirm(`Reset password for this user? New temporary password will be: ${newPass}`)) return;
    
    setActionLoading(userId);
    try {
      await procurementApi.updateUser(userId, { 
        password: newPass, 
        is_temporary_password: true 
      });
      setUsers(users.map(u => u.id === userId ? { ...u, password: newPass, is_temporary_password: true } : u));
      alert("Password reset completed. Provide the temporary key to the user.");
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'ALL' || u.global_role === filterRole;
    return matchesSearch && matchesRole;
  });

  const S = {
    card: { background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(194,198,211,0.2)', overflow: 'hidden' },
    th: { padding: '1rem', fontSize: '0.625rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--outline)', textAlign: 'left', borderBottom: '1px solid var(--outline-variant-low)' },
    td: { padding: '1.25rem 1rem', fontSize: '0.875rem', color: 'var(--on-surface)', borderBottom: '1px solid var(--outline-variant-low)' }
  };

  const getStatusColor = (status) => {
    if (status === 'APPROVED') return 'var(--tertiary)';
    if (status === 'PENDING') return 'var(--primary)';
    return 'var(--error)';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      
      {/* Header */}
      <div>
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
           <span style={{ fontSize: '0.75rem', color: 'var(--outline)' }}>Governance Cluster</span>
           <ChevronRight size={12} style={{ color: 'var(--outline)' }} />
           <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700 }}>Identity Management</span>
        </nav>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: '2.5rem', fontWeight: 900, color: 'var(--primary)', letterSpacing: '-0.02em' }}>
               Administrative Oversight
            </h1>
            <p style={{ color: 'var(--outline)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
               {activeRole === 'GLOBAL_ADMIN' ? 'Full platform jurisdiction: Reset passwords, manage IDs, and authorize company admins.' : 'Entity-specific oversight: Manage user lifecycle within your organization.'}
            </p>
          </div>
          <button onClick={fetchData} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-pill)', border: '1px solid var(--outline-variant)', background: 'white', color: 'var(--primary)', fontWeight: 800, cursor: 'pointer' }}>
             <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh Ledger
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: '1.5rem' }}>
         {[
           { label: 'Total Identities', val: users.length, icon: <Users size={20} />, color: 'var(--primary)' },
           { label: 'Pending Approval', val: users.filter(u => u.approval_status === 'PENDING').length, icon: <Fingerprint size={20} />, color: 'var(--tertiary)' },
           { label: 'Platform Admins', val: users.filter(u => u.global_role === 'GLOBAL_ADMIN').length, icon: <ShieldCheck size={20} />, color: 'var(--secondary)' },
           { label: 'Temporary Keys', val: users.filter(u => u.is_temporary_password).length, icon: <Key size={20} />, color: 'var(--outline)' }
         ].map((s, i) => (
           <div key={i} style={{ ...S.card, padding: '1.5rem', borderLeft: `4px solid ${s.color}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: 'var(--outline)' }}>
                 {s.icon} <span style={{ fontSize: '0.625rem', fontWeight: 900, textTransform: 'uppercase' }}>{s.label}</span>
              </div>
              <h4 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--on-surface)' }}>{s.val}</h4>
           </div>
         ))}
      </div>

      {/* Controls & Table */}
      <div style={S.card}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--outline-variant-low)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
           <div style={{ display: 'flex', flex: 1, minWidth: '280px', background: 'var(--surface-container-high)', borderRadius: 'var(--radius-pill)', padding: '0.5rem 1.25rem', alignItems: 'center', gap: '0.75rem' }}>
              <Search size={18} style={{ color: 'var(--outline)' }} />
              <input 
                placeholder="Search by name, email or ID..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ background: 'transparent', border: 'none', outline: 'none', width: '100%', fontWeight: 600, fontSize: '0.875rem' }} 
              />
           </div>
           <div style={{ display: 'flex', gap: '1rem' }}>
              <select 
                value={filterRole}
                onChange={e => setFilterRole(e.target.value)}
                style={{ padding: '0.5rem 1rem', borderRadius: 'var(--radius-pill)', border: '1px solid var(--outline-variant)', fontWeight: 700, fontSize: '0.75rem', outline: 'none' }}
              >
                 <option value="ALL">All Roles</option>
                 <option value="GLOBAL_ADMIN">Global Admin</option>
                 <option value="REQUESTER">Standard Users</option>
              </select>
           </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--surface-container-low)' }}>
                <th style={S.th}>Identity ID</th>
                <th style={S.th}>Name / Role</th>
                <th style={S.th}>Security Protocol (Key)</th>
                <th style={S.th}>Approval Status</th>
                <th style={{ ...S.th, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} style={{ opacity: actionLoading === user.id ? 0.6 : 1, transition: 'opacity 0.2s' }}>
                  <td style={S.td}>
                     <div style={{ fontSize: '0.625rem', fontWeight: 900, color: 'var(--outline)', marginBottom: '0.25rem' }}>#UID_{user.id?.toString().padStart(4, '0')}</div>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
                        <Mail size={14} style={{ color: 'var(--outline)' }} /> {user.email}
                     </div>
                  </td>
                  <td style={S.td}>
                     <div style={{ fontWeight: 800 }}>{user.name}</div>
                     <div style={{ fontSize: '0.625rem', fontWeight: 900, color: 'var(--primary)', textTransform: 'uppercase', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {user.global_role === 'GLOBAL_ADMIN' ? <ShieldCheck size={10} /> : <UserCheck size={10} />} {user.global_role}
                     </div>
                  </td>
                  <td style={S.td}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ background: 'var(--surface-container-high)', padding: '0.5rem 0.75rem', borderRadius: '4px', fontFamily: 'monospace', fontSize: '0.875rem', fontWeight: 700, letterSpacing: '0.05em' }}>
                           {user.password}
                        </div>
                        {user.is_temporary_password && (
                           <span style={{ fontSize: '0.625rem', fontWeight: 900, color: 'var(--primary)', background: 'var(--primary-container)', padding: '2px 6px', borderRadius: '2px' }}>TEMP</span>
                        )}
                     </div>
                  </td>
                  <td style={S.td}>
                     <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-pill)', border: `1px solid ${getStatusColor(user.approval_status)}`, color: getStatusColor(user.approval_status), fontSize: '0.625rem', fontWeight: 900 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: getStatusColor(user.approval_status) }} />
                        {user.approval_status}
                     </div>
                  </td>
                  <td style={{ ...S.td, textAlign: 'right' }}>
                     <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        {user.approval_status === 'PENDING' && (
                           <button onClick={() => handleUpdateStatus(user.id, 'APPROVED')} className="gradient-fill" style={{ padding: '0.5rem 1rem', border: 'none', borderRadius: 'var(--radius-pill)', color: 'white', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer' }}>Authorize</button>
                        )}
                        {user.approval_status === 'APPROVED' && user.global_role !== 'GLOBAL_ADMIN' && (
                           <button onClick={() => handleUpdateStatus(user.id, 'SUSPENDED')} style={{ padding: '0.5rem 1rem', background: 'none', border: '1px solid var(--error)', borderRadius: 'var(--radius-pill)', color: 'var(--error)', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer' }}>Suspend</button>
                        )}
                        {user.approval_status === 'SUSPENDED' && (
                           <button onClick={() => handleUpdateStatus(user.id, 'APPROVED')} style={{ padding: '0.5rem 1rem', background: 'none', border: '1px solid var(--tertiary)', borderRadius: 'var(--radius-pill)', color: 'var(--tertiary)', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer' }}>Reactivate</button>
                        )}
                        <button onClick={() => handleResetPassword(user.id)} title="Reset Security Key" style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-container-high)', border: 'none', borderRadius: 'var(--radius-pill)', cursor: 'pointer' }}>
                           <RefreshCw size={14} />
                        </button>
                     </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredUsers.length === 0 && (
            <div style={{ padding: '5rem', textAlign: 'center', color: 'var(--outline)' }}>
               <ShieldAlert size={48} style={{ margin: '0 auto 1.5rem', opacity: 0.2 }} />
               <p style={{ fontWeight: 700 }}>No matching identities found in registry.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default SystemManagement;
