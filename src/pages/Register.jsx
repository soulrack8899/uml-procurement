import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Phone, Building2, Lock, ArrowRight, CheckCircle2, ChevronLeft, Fingerprint, Shield } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { procurementApi } from '../services/api';
import { useCompany } from '../App';

const Register = () => {
  const navigate = useNavigate();
  const { isMobile } = useCompany();
  const [companies, setCompanies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone_number: '',
    company_id: '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const data = await procurementApi.getCompanies();
      setCompanies(data);
    } catch (err) {
      console.error("Failed to load entities", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      await procurementApi.register(formData);
      setSuccess(true);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const S = {
    label: { display: 'block', fontSize: '0.625rem', fontWeight: 900, color: 'var(--outline)', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.05em' },
    input: { width: '100%', padding: '0.75rem 1rem 0.75rem 3rem', background: 'var(--surface-container-high)', border: 'none', borderRadius: 'var(--radius-sm)', fontWeight: 600, color: 'var(--primary)', outline: 'none' }
  };

  if (success) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-container-low)', padding: '2rem' }}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ maxWidth: '400px', width: '100%', background: 'var(--surface-container-lowest)', padding: '3rem', borderRadius: 'var(--radius-sm)', textAlign: 'center', border: '1px solid rgba(194,198,211,0.2)' }}>
          <CheckCircle2 size={64} style={{ color: 'var(--tertiary)', margin: '0 auto 1.5rem' }} />
          <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--primary)', marginBottom: '1rem' }}>Registry Updated</h2>
          <p style={{ color: 'var(--outline)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '2rem' }}>
            Your identity has been indexed. To maintain governance integrity, access must be authorized by a System Admin before first initialization.
          </p>
          <button onClick={() => navigate('/login')} className="gradient-fill" style={{ width: '100%', padding: '1rem', borderRadius: 'var(--radius-sm)', border: 'none', color: 'white', fontWeight: 900, cursor: 'pointer' }}>
            Back to Terminal
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-container-low)', padding: isMobile ? '1rem' : '2rem' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ maxWidth: '500px', width: '100%', background: 'var(--surface-container-lowest)', padding: isMobile ? '1.5rem' : '3.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(194,198,211,0.2)', boxShadow: '0 40px 80px rgba(25,28,30,0.1)' }}>
        <div style={{ marginBottom: '2.5rem' }}>
           <Link to="/login" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontWeight: 800, fontSize: '0.75rem', textDecoration: 'none', marginBottom: '1.5rem' }}>
              <ChevronLeft size={16} /> REVERT TO LOGIN
           </Link>
           <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: '2rem', fontWeight: 900, color: 'var(--primary)', letterSpacing: '-0.04em' }}>Identify Initialization</h1>
           <p style={{ color: 'var(--outline)', fontSize: '0.875rem', marginTop: '0.5rem' }}>Provision a new identity within the ProcuSure ecosystem.</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={S.label}>Full Identity Name</label>
            <div style={{ position: 'relative' }}>
              <User size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--outline)' }} />
              <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. John Doe" style={S.input} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1.5rem' }}>
            <div>
              <label style={S.label}>System Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--outline)' }} />
                <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="john@domain.com" style={S.input} />
              </div>
            </div>
            <div>
              <label style={S.label}>Phone Number</label>
              <div style={{ position: 'relative' }}>
                <Phone size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--outline)' }} />
                <input required type="tel" value={formData.phone_number} onChange={e => setFormData({...formData, phone_number: e.target.value})} placeholder="+60 123..." style={S.input} />
              </div>
            </div>
          </div>

          <div>
            <label style={S.label}>Entity Target (Company)</label>
            <div style={{ position: 'relative' }}>
              <Building2 size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--outline)' }} />
              <select required value={formData.company_id} onChange={e => setFormData({...formData, company_id: e.target.value})} style={{ ...S.input, appearance: 'none' }}>
                <option value="">Select Entity...</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.name} (ID: {c.id})</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1.5rem' }}>
            <div>
              <label style={S.label}>Security Key</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--outline)' }} />
                <input required type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} style={S.input} />
              </div>
            </div>
            <div>
              <label style={S.label}>Confirm Key</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--outline)' }} />
                <input required type="password" value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})} style={S.input} />
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--surface-container-high)', padding: '1rem', borderRadius: 'var(--radius-sm)', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <Shield size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
            <p style={{ fontSize: '0.625rem', fontWeight: 700, color: 'var(--outline)', lineHeight: 1.4 }}>
               Identity initialization requires authorization from your Entity Admin. Access will be granted following verification.
            </p>
          </div>

          <button type="submit" disabled={isLoading} className="gradient-fill" style={{ width: '100%', padding: '1.25rem', borderRadius: 'var(--radius-sm)', border: 'none', color: 'white', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', cursor: 'pointer', marginTop: '1rem' }}>
            {isLoading ? 'SYNCING IDENTITY...' : <>INITIALIZE ACCESS <ArrowRight size={18} /></>}
          </button>
        </form>

        <div style={{ marginTop: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--outline)' }}>
           <Fingerprint size={14} />
           <span style={{ fontSize: '0.625rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>SECURE IDENTITY HANDSHAKE</span>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
