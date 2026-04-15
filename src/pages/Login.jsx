import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Mail, ChevronRight, Building2, UserCircle, ShieldCheck, Fingerprint, ArrowRight, Info, AlertCircle, KeyRound, Eye, EyeOff } from 'lucide-react';
import { useCompany } from '../App';
import { procurementApi } from '../services/api';

const Login = ({ onLogin }) => {
  const { isMobile } = useCompany();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  // Password Change State
  const [showPwdChange, setShowPwdChange] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  const [forgotPwd, setForgotPwd] = useState(false);

  const handleManualLogin = async (e) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const data = await procurementApi.login(email, password);
      
      if (data.is_temporary_password) {
        localStorage.setItem("tempUserId", data.user_id.toString());
        if (data.active_company_id) {
          localStorage.setItem("currentCompanyId", data.active_company_id.toString());
        }
        setShowPwdChange(true);
        setIsLoading(false);
        return;
      }

      completeLogin(data);
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  const completeLogin = (data) => {
    localStorage.setItem("currentUserId", data.user_id.toString());
    localStorage.setItem("currentUserName", data.user_name);
    if (data.active_company_id) localStorage.setItem("currentCompanyId", data.active_company_id.toString());
    onLogin({ id: data.user_id, name: data.user_name });
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);
    try {
      // Temporarily set userId for headers to work if not already set
      const tempId = localStorage.getItem("tempUserId");
      localStorage.setItem("currentUserId", tempId);
      
      await procurementApi.changePassword(newPassword);
      
      // Now re-login or just complete based on previous data
      // For simplicity, let's just ask them to login again with new password
      setShowPwdChange(false);
      setError("");
      setPassword(newPassword);
      alert("Password updated successfully. Please sign in now.");
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
            Sign in to ProcuSure
          </p>
        </div>

        {error && (
          <div style={{ background: 'var(--error-container)', color: 'var(--on-error-container)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', fontSize: '0.875rem', fontWeight: 700, border: '1px solid var(--error)' }}>
            {error}
          </div>
        )}

        <AnimatePresence mode="wait">
          {showPwdChange ? (
            <motion.form 
              key="pwd-change"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handlePasswordChange} 
              style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
            >
              <div style={{ background: 'var(--tertiary-container)', color: 'var(--on-tertiary-container)', padding: '1rem', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', fontWeight: 600, display: 'flex', gap: '0.75rem' }}>
                <KeyRound size={18} />
                <span>Please set a new password for your account.</span>
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.625rem', fontWeight: 900, color: 'var(--outline)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>New Password</label>
                <input required type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={{ width: '100%', padding: '0.75rem 1rem', background: 'var(--surface-container-high)', border: 'none', borderRadius: 'var(--radius-sm)', fontWeight: 600, color: 'var(--primary)' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.625rem', fontWeight: 900, color: 'var(--outline)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Confirm Password</label>
                <input required type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={{ width: '100%', padding: '0.75rem 1rem', background: 'var(--surface-container-high)', border: 'none', borderRadius: 'var(--radius-sm)', fontWeight: 600, color: 'var(--primary)' }} />
              </div>

              <button disabled={isLoading} className="gradient-fill" style={{ width: '100%', padding: '1rem', borderRadius: 'var(--radius-sm)', border: 'none', color: 'white', fontWeight: 900, cursor: 'pointer' }}>
                {isLoading ? 'Updating...' : 'Set New Password'}
              </button>
            </motion.form>
          ) : forgotPwd ? (
            <motion.div 
               key="forgot"
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: -20 }}
               style={{ textAlign: 'center' }}
            >
               <AlertCircle size={48} style={{ color: 'var(--primary)', marginBottom: '1.5rem' }} />
               <h2 style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: '1rem' }}>Account Recovery</h2>
               <p style={{ fontSize: '0.875rem', color: 'var(--outline)', lineHeight: 1.6, marginBottom: '2rem' }}>
                  Enter your work email below. If an account is found, we will send a temporary password immediately.
               </p>
               
               <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
                  <label style={{ display: 'block', fontSize: '0.625rem', fontWeight: 900, color: 'var(--outline)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Work Email</label>
                  <input 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    placeholder="name@company.com"
                    style={{ width: '100%', padding: '0.75rem 1rem', background: 'var(--surface-container-high)', border: 'none', borderRadius: 'var(--radius-sm)', fontWeight: 600, color: 'var(--primary)' }} 
                  />
               </div>

               <button 
                onClick={async () => {
                   setIsLoading(true);
                   try {
                     const res = await procurementApi.forgotPassword(email);
                     alert(res.message);
                     setForgotPwd(false);
                   } catch (err) { alert(err.message); }
                   finally { setIsLoading(false); }
                }}
                disabled={isLoading || !email}
                className="gradient-fill" 
                style={{ width: '100%', padding: '1rem', borderRadius: 'var(--radius-sm)', border: 'none', color: 'white', fontWeight: 900, cursor: 'pointer', marginBottom: '1.5rem' }}
               >
                 {isLoading ? 'Sending...' : 'Request Recovery'}
               </button>

               <div>
                 <button onClick={() => setForgotPwd(false)} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 800, cursor: 'pointer' }}>Back to Login</button>
               </div>
            </motion.div>
          ) : (
            <motion.form 
              key="login"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              onSubmit={handleManualLogin} 
              style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
            >
                <h2 style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Member Login</h2>
                
                <div>
                  <label style={{ display: 'block', fontSize: '0.625rem', fontWeight: 900, color: 'var(--outline)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Work Email</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--outline)' }} />
                    <input required type="email" value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 3rem', background: 'var(--surface-container-high)', border: 'none', borderRadius: 'var(--radius-sm)', fontWeight: 600, color: 'var(--primary)' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <label style={{ fontSize: '0.625rem', fontWeight: 900, color: 'var(--outline)', textTransform: 'uppercase' }}>Password</label>
                    <button type="button" onClick={() => setForgotPwd(true)} style={{ background: 'none', border: 'none', fontSize: '0.625rem', fontWeight: 900, color: 'var(--primary)', cursor: 'pointer' }}>Forgot Password?</button>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--outline)' }} />
                    <input required type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 3rem', background: 'var(--surface-container-high)', border: 'none', borderRadius: 'var(--radius-sm)', fontWeight: 600, color: 'var(--primary)' }} />
                    <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--outline)', cursor: 'pointer' }}>
                       {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button disabled={isLoading} className="gradient-fill" style={{ width: '100%', padding: '1rem', borderRadius: 'var(--radius-sm)', border: 'none', color: 'white', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    {isLoading ? 'Verifying...' : <>Sign In <ArrowRight size={18} /></>}
                </button>

                <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                   <p style={{ fontSize: '0.75rem', color: 'var(--outline)', fontWeight: 600 }}>
                      New to the platform? <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 900, textDecoration: 'none' }}>CREATE AN ACCOUNT</Link>
                   </p>
                </div>
            </motion.form>
          )}
        </AnimatePresence>

        <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(194,198,211,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--outline)' }}>
             <Fingerprint size={14} />
             <span style={{ fontSize: '0.625rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>SECURE LOGIN SESSION</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
