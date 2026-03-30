import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Upload, Send, CheckCircle2, ChevronDown, Info, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useCompany } from '../App'

const PaymentRequest = () => {
  const navigate = useNavigate()
  const { isMobile } = useCompany()
  const [form, setForm] = useState({
    poRef: 'PO-2023-SAR-0892',
    invoiceNumber: '',
    amount: ''
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setSubmitting(true)
    setTimeout(() => {
      setSubmitting(false)
      navigate('/approvals')
    }, 1500)
  }

  const S = {
    label: { fontSize: '0.625rem', fontWeight: 800, color: 'var(--outline)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '0.75rem' },
    input: { width: '100%', paddingBottom: '0.5rem', background: 'transparent', border: 'none', borderBottom: '2px solid var(--outline-variant)', fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)', outline: 'none', transition: 'border-color 0.2s' },
    focus: (e) => e.target.style.borderBottomColor = 'var(--primary)',
    blur: (e) => e.target.style.borderBottomColor = 'var(--outline-variant)'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '1.5rem' : '3rem', maxWidth: '64rem', margin: '0 auto', paddingBottom: '6rem' }}>
      
      {/* Header */}
      <div>
        <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: 'var(--outline)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', marginBottom: '1.5rem' }}>
          <ArrowLeft size={16} /> BACK
        </button>
        <h2 style={{ fontFamily: 'var(--font-headline)', fontSize: isMobile ? '1.75rem' : '2.5rem', fontWeight: 900, color: 'var(--primary)', marginBottom: '0.5rem' }}>Submit Payment Request</h2>
        <p style={{ fontSize: '1rem', color: 'var(--outline-variant)' }}>Upload invoice and confirm disbursement details.</p>
      </div>

      {/* Progress Tracker - Simplified for Mobile */}
      <section style={{ 
        display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', gap: '1.5rem', 
        background: 'var(--surface-container-lowest)', padding: '1.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(194,198,211,0.2)' 
      }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '1rem' }}>
           <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={16} />
           </div>
           <div>
              <p style={{ fontSize: '0.625rem', fontWeight: 900, textTransform: 'uppercase', opacity: 0.6 }}>Phase 01</p>
              <p style={{ fontSize: '0.875rem', fontWeight: 800 }}>Order Validated</p>
           </div>
        </div>
        {!isMobile && <div style={{ width: '2rem', height: '1px', borderTop: '2px dotted var(--outline-variant)' }}></div>}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '1rem' }}>
           <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)' }} />
           </div>
           <div>
              <p style={{ fontSize: '0.625rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--primary)' }}>Phase 02</p>
              <p style={{ fontSize: '0.875rem', fontWeight: 800 }}>Invoice Upload</p>
           </div>
        </div>
      </section>

      {/* Grid Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '7fr 5fr', gap: '2.5rem', alignItems: 'start' }}>
        
        {/* Form Container */}
        <div style={{ background: 'var(--surface-container-lowest)', padding: isMobile ? '1.5rem' : '2.5rem', borderRadius: 'var(--radius-sm)', boxShadow: '0 20px 60px rgba(0,52,111,0.05)', borderLeft: isMobile ? 'none' : '4px solid var(--primary)', borderTop: isMobile ? '4px solid var(--primary)' : 'none' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            <div style={{ position: 'relative' }}>
              <label style={S.label}>Purchase Order Reference</label>
              <select style={S.input} value={form.poRef} onChange={e => setForm({...form, poRef: e.target.value})} onFocus={S.focus} onBlur={S.blur}>
                <option value="PO-2023-SAR-0892">PO-0892 (RM 5,200.00)</option>
                <option value="PO-2023-SAR-0910">PO-0910 (RM 1,150.00)</option>
              </select>
              <ChevronDown size={20} style={{ position: 'absolute', right: 0, bottom: 12, color: 'var(--outline-variant)' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '2.5rem' }}>
              <div>
                <label style={S.label}>Invoice Number</label>
                <input type="text" placeholder="REF_CODE_X" style={S.input} value={form.invoiceNumber} onChange={e => setForm({...form, invoiceNumber: e.target.value})} onFocus={S.focus} onBlur={S.blur} required />
              </div>
              <div>
                <label style={S.label}>Payment Amount (RM)</label>
                <input type="number" placeholder="0.00" style={S.input} value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} onFocus={S.focus} onBlur={S.blur} required />
              </div>
            </div>

            <div>
              <label style={S.label}>Upload Invoice</label>
              <div style={{ border: '2px dashed var(--outline-variant)', borderRadius: '1rem', padding: isMobile ? '2rem' : '4rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', background: 'var(--surface-container-low)', cursor: 'pointer' }}>
                <Upload size={40} style={{ color: 'var(--primary)' }} />
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontWeight: 800, fontSize: '1rem' }}>Drag or Tap to Upload</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--outline-variant)' }}>PDF, JPG approved (Max 12MB)</p>
                </div>
              </div>
            </div>

            <button disabled={submitting} type="submit" className="gradient-fill" style={{ width: '100%', padding: '1.25rem', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', fontWeight: 900, textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', opacity: submitting ? 0.7 : 1 }}>
               {submitting ? 'Submitting...' : 'Submit for Payment'}
               <Send size={18} />
            </button>
          </form>
        </div>

        {/* Sidebar Context */}
        {!isMobile && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ background: 'var(--surface-container-low)', padding: '2rem', borderRadius: 'var(--radius-lg)', borderTop: '4px solid var(--tertiary)' }}>
              <h3 style={{ fontSize: '0.625rem', fontWeight: 900, color: 'var(--tertiary)', textTransform: 'uppercase', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Info size={14} /> Compliance Status
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {[
                  { date: 'OCT 24', text: 'Approvals Verified', active: true },
                  { date: 'OCT 25', text: 'Vendor Identity Verified', active: true },
                  { date: 'WAIT', text: 'Finance Processing', active: false }
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: '1rem' }}>
                     <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.active ? 'var(--tertiary)' : 'var(--outline-variant)', marginTop: '0.25rem' }} />
                     <div>
                        <p style={{ fontSize: '0.625rem', fontWeight: 800, color: item.active ? 'var(--tertiary)' : 'var(--outline-variant)' }}>{item.date}</p>
                        <p style={{ fontSize: '0.875rem', fontWeight: 700, opacity: item.active ? 1 : 0.5 }}>{item.text}</p>
                     </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 'var(--radius-lg)', aspectRatio: '4/3' }}>
              <img 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuD-rtLtrBvOeAYkbgOOFfLaW7r1vky_XFPj_C1S-2OGN5MsQqg9IgUhI54dgbQIaM7T1OKYP58XyLoIATRgd0mwrFRXB9dSHVvi9fBcdAJlISvFDyK4ar9jYK2qAQaXla_uC5XNlNqxV98t4mOYzQJ-kshq-ZNf7Tl0EUqvrLOElQPyqRfCh5vsCNxCkRLHiIdCqTLR6bv_Kjp0oLky_HPy_171ItGu6wqbH2beXz8YPFKZVQ70LJ-fJ7Q78QCHWp8rULMXm-HzCvWt" 
                alt="Lab" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

export default PaymentRequest
