import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Mail, ChevronRight, Building2, UserCircle, ShieldCheck, Fingerprint, ArrowRight, Info } from 'lucide-react';
import { useCompany } from '../App';
import { procurementApi } from '../services/api';

const Login = ({ onLogin }) => {
  const { isMobile } = useCompany();
  const [isLoading, setIsLoading] = useState(false);
  const [useQuickAccess, setUseQuickAccess] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const mockUsers = [
    { id: "1", name: "Karlos Albert", email: "admin@umlab.sarawak.my", role: "GLOBAL_ADMIN", description: "System Sovereignty" },
    { id: "2", name: "Sarah Malik", email: "sarah@staff.my", role: "ADMIN", description: "Company Authority" },
    { id: "3", name: "David Chen", email: "david@manager.my", role: "MANAGER", description: "Unit Control" },
  ];

  const handleQuickLogin = async (user) => {
    setIsLoading(true);
    setError('');
    try {
      const data = await procurementApi.login(user.email, "password123");
      localStorage.setItem("currentUserId", data.user_id.toString());
      localStorage.setItem("currentUserName", data.user_name);
      if (data.active_company_id) localStorage.setItem("currentCompanyId", data.active_company_id.toString());
      onLogin({ id: data.user_id, name: data.user_name });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const data = await procurementApi.login(email, password);
      localStorage.setItem("currentUserId", data.user_id.toString());
      localStorage.setItem("currentUserName", data.user_name);
      if (data.active_company_id) localStorage.setItem("currentCompanyId", data.active_company_id.toString());
      onLogin({ id: data.user_id, name: data.user_name });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: 'var(--surface-container-low)',
      padding: isMobile ? '1rem' : '2rem'
    }}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ 
          width: '100%', 
          maxWidth: '500px', 
          background: 'var(--surface-container-lowest)',
          padding: isMobile ? '1.5rem' : '3.5rem',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid rgba(194,198,211,0.2)',
          boxShadow: '0 40px 80px rgba(25,28,30,0.1)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '12px',
            marginBottom: '1rem'
          }}>
            <svg width="48" height="48" viewBox="0 0 100 100" fill="none">
              <path d="M40 70 L20 50 L40 30" stroke="var(--primary)" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M60 70 L80 50 L60 30" stroke="var(--secondary)" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="50" cy="50" r="12" fill="var(--tertiary)"/>
            </svg>
            <h1 style={{ 
              fontFamily: 'var(--font-headline)', 
              fontSize: isMobile ? '2rem' : '2.5rem', 
              fontWeight: 900, 
              color: 'var(--primary)',
              letterSpacing: '-0.04em'
            }}>ProcuSure</h1>
          </div>
          <p style={{ color: 'var(--outline)', fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Identity Infrastructure Access
          </p>
        </div>

        {error && (
          <div style={{ background: 'var(--error-container)', color: 'var(--on-error-container)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', fontSize: '0.875rem', fontWeight: 700, border: '1px solid var(--error)' }}>
            {error}
          </div>
        )}

        {useQuickAccess ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Fingerprint size={18} style={{ color: 'var(--primary)' }} />
                  <h2 style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Identify Authorization</h2>
               </div>
               <button onClick={() => setUseQuickAccess(false)} style={{ fontSize: '0.625rem', fontWeight: 900, background: 'none', border: 'none', color: 'var(--secondary)', cursor: 'pointer', textDecoration: 'underline' }}>USE CREDENTIALS</button>
            </div>
            
            {mockUsers.map((user) => (
              <motion.button
                key={user.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleQuickLogin(user)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--outline-variant-low)',
                  background: 'var(--surface-container-low)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <div style={{ 
                  width: 48, height: 48, borderRadius: 'var(--radius-pill)', 
                  background: user.role === 'GLOBAL_ADMIN' ? 'var(--primary)' : 'var(--surface-container-high)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: user.role === 'GLOBAL_ADMIN' ? 'var(--on-primary)' : 'var(--primary)',
                  flexShrink: 0
                }}>
                  <UserCircle size={28} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: '1.125rem', color: 'var(--primary)' }}>{user.name}</div>
                  <div style={{ fontSize: '0.625rem', color: 'var(--outline)', textTransform: 'uppercase', fontWeight: 900, letterSpacing: '0.08em' }}>
                    {user.role.replace('_', ' ')} • {user.description}
                  </div>
                </div>
                <ChevronRight size={20} style={{ color: 'var(--outline)', opacity: 0.3 }} />
              </motion.button>
            ))}
          </div>
        ) : (
          <form onSubmit={handleManualLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
             <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
               <h2 style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--primary)', textTransform: 'uppercase' }}>Login Terminal</h2>
               <button type="button" onClick={() => setUseQuickAccess(true)} style={{ fontSize: '0.625rem', fontWeight: 900, background: 'none', border: 'none', color: 'var(--secondary)', cursor: 'pointer' }}>QUICK ACCESS</button>
             </div>
             
             <div>
               <label style={{ display: 'block', fontSize: '0.625rem', fontWeight: 900, color: 'var(--outline)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Work Email</label>
               <div style={{ position: 'relative' }}>
                 <Mail size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--outline)' }} />
                 <input required type="email" value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 3rem', background: 'var(--surface-container-high)', border: 'none', borderRadius: 'var(--radius-sm)', fontWeight: 600, color: 'var(--primary)' }} />
               </div>
             </div>

             <div>
               <label style={{ display: 'block', fontSize: '0.625rem', fontWeight: 900, color: 'var(--outline)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Security Protocol (Password)</label>
               <div style={{ position: 'relative' }}>
                 <Lock size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--outline)' }} />
                 <input required type="password" value={password} onChange={e => setPassword(e.target.value)} style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 3rem', background: 'var(--surface-container-high)', border: 'none', borderRadius: 'var(--radius-sm)', fontWeight: 600, color: 'var(--primary)' }} />
               </div>
             </div>

             <button disabled={isLoading} className="gradient-fill" style={{ width: '100%', padding: '1rem', borderRadius: 'var(--radius-sm)', border: 'none', color: 'white', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                {isLoading ? 'Verifying...' : <>Authorize Access <ArrowRight size={18} /></>}
             </button>

             <div style={{ background: 'var(--surface-container-low)', padding: '1rem', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <Info size={16} style={{ color: 'var(--primary)', marginTop: '0.125rem' }} />
                <p style={{ fontSize: '0.75rem', color: 'var(--outline)', lineHeight: 1.5 }}>
                  <strong>Global Admin</strong> credentials: <br/>
                  Email: <code>admin@umlab.sarawak.my</code> <br/>
                  Password: <code>password123</code>
                </p>
             </div>
          </form>
        )}

        <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(194,198,211,0.1)', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--outline)' }}>
             <ShieldCheck size={14} />
             <span style={{ fontSize: '0.625rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>SECURE ENCRYPTED SESSION</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
