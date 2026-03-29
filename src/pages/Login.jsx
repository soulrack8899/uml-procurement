import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Mail, ChevronRight, Building2, UserCircle, ShieldCheck, Fingerprint } from 'lucide-react';
import { useCompany } from '../App';

const Login = ({ onLogin }) => {
  const { isMobile } = useCompany();
  const [isLoading, setIsLoading] = useState(false);
  
  const mockUsers = [
    { id: "1", name: "Karlos Albert", role: "GLOBAL_ADMIN", description: "System Sovereignty" },
    { id: "2", name: "Sarah Malik", role: "ADMIN", description: "Company Authority" },
    { id: "3", name: "David Chen", role: "MANAGER", description: "Unit Control" },
    { id: "4", name: "Fatima Noor", role: "REQUESTER", description: "Operations" },
    { id: "5", name: "Robert Low", role: "FINANCE", description: "Ledger Audit" },
  ];

  const handleLogin = (user) => {
    setIsLoading(true);
    setTimeout(() => {
      localStorage.setItem("currentUserId", user.id);
      localStorage.setItem("currentUserName", user.name);
      onLogin(user);
      setIsLoading(false);
    }, 800);
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
            Divisional Ledger Access
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
             <Fingerprint size={18} style={{ color: 'var(--primary)' }} />
             <h2 style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Identify Authorization</h2>
          </div>
          
          {mockUsers.map((user) => (
            <motion.button
              key={user.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleLogin(user)}
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
              
              {isLoading && (
                 <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: '100%' }}
                   style={{ 
                     position: 'absolute', bottom: 0, left: 0, height: '4px', 
                     background: 'var(--tertiary)' 
                   }} 
                 />
              )}
            </motion.button>
          ))}
        </div>

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
