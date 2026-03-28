import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Upload, Send, CheckCircle2, ChevronDown, Info } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

/* ─────────────────────────────────────────────────────
   PaymentRequest (Translated to Stitch inline style tokens)
   ───────────────────────────────────────────────────── */

const PaymentRequest = () => {
  const navigate = useNavigate()
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
    label: { fontFamily: 'var(--font-label)', fontSize: '0.625rem', fontWeight: 700, color: 'var(--outline)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '1rem' },
    input: { width: '100%', paddingBottom: '0.5rem', background: 'transparent', border: 'none', borderBottom: '2px solid var(--outline-variant)', fontFamily: 'var(--font-headline)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--on-surface)', outline: 'none', transition: 'border-color 0.2s', appearance: 'none' },
    focus: (e) => e.target.style.borderBottomColor = 'var(--primary)',
    blur: (e) => e.target.style.borderBottomColor = 'var(--outline-variant)'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem', maxWidth: '64rem', margin: '0 auto', paddingBottom: '6rem' }}>
      
      {/* Header */}
      <div>
        <h2 style={{ fontFamily: 'var(--font-headline)', fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--primary)', marginBottom: '0.5rem' }}>Create Payment Request</h2>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '1.125rem', color: 'var(--on-surface-variant)' }}>Submit your invoice details to initiate the disbursement process for Sarawak Laboratory supplies.</p>
      </div>

      {/* Progress Tracker (Stitch tonal style) */}
      <section style={{ 
        display: 'flex', alignItems: 'center', gap: '2rem', 
        background: 'var(--surface-container-low)', padding: '2rem', 
        borderRadius: 'var(--radius-sm)', border: '1px solid rgba(194,198,211,0.1)' 
      }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,52,111,0.2)' }}>
            <CheckCircle2 size={20} />
          </div>
          <div>
            <span style={{ fontFamily: 'var(--font-label)', fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--outline)', display: 'block' }}>Step 1</span>
            <span style={{ fontFamily: 'var(--font-headline)', fontSize: '0.875rem', fontWeight: 700, color: 'var(--primary)' }}>PO Issued</span>
          </div>
        </div>
        <div style={{ width: '4rem', height: '1px', borderTop: '2px dashed var(--outline-variant)' }}></div>
        
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid var(--primary)', background: 'var(--surface-container-lowest)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 0 4px rgba(0,52,111,0.1)' }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--primary)' }}></div>
          </div>
          <div>
            <span style={{ fontFamily: 'var(--font-label)', fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--primary)', display: 'block' }}>Step 2</span>
            <span style={{ fontFamily: 'var(--font-headline)', fontSize: '0.875rem', fontWeight: 700, color: 'var(--primary)' }}>Invoice Submission</span>
          </div>
        </div>
        <div style={{ width: '4rem', height: '1px', borderTop: '2px dashed var(--outline-variant)' }}></div>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '1rem', opacity: 0.4 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid var(--outline-variant)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-headline)', fontWeight: 900, color: 'var(--outline-variant)' }}>
            3
          </div>
          <div>
            <span style={{ fontFamily: 'var(--font-label)', fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block' }}>Step 3</span>
            <span style={{ fontFamily: 'var(--font-headline)', fontSize: '0.875rem', fontWeight: 700 }}>Review & Approval</span>
          </div>
        </div>
      </section>

      {/* Grid Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '7fr 5fr', gap: '2.5rem', alignItems: 'start' }}>
        
        {/* Form Container */}
        <div style={{ 
          background: 'var(--surface-container-lowest)', padding: '2.5rem', 
          borderRadius: 'var(--radius-sm)', boxShadow: '0 20px 40px rgba(25,28,30,0.05)',
          borderLeft: '4px solid var(--primary)'
        }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            
            <div style={{ position: 'relative' }}>
              <label style={S.label}>Linked Purchase Order</label>
              <select style={S.input} value={form.poRef} onChange={e => setForm({...form, poRef: e.target.value})} onFocus={S.focus} onBlur={S.blur}>
                <option value="PO-2023-SAR-0892">PO-2023-SAR-0892 - Chemical Reagents</option>
                <option value="PO-2023-SAR-0910">PO-2023-SAR-0910 - Lab Glassware</option>
                <option value="PO-2023-SAR-0915">PO-2023-SAR-0915 - PPE Equipment</option>
              </select>
              <ChevronDown size={20} style={{ position: 'absolute', right: 0, bottom: 12, color: 'var(--outline)' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem' }}>
              <div>
                <label style={S.label}>Invoice Number</label>
                <input type="text" placeholder="INV/2023/000" style={S.input} value={form.invoiceNumber} onChange={e => setForm({...form, invoiceNumber: e.target.value})} onFocus={S.focus} onBlur={S.blur} required />
              </div>
              <div>
                <label style={S.label}>Total Amount (MYR)</label>
                <input type="number" placeholder="0.00" style={S.input} value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} onFocus={S.focus} onBlur={S.blur} required />
              </div>
            </div>

            <div>
              <label style={S.label}>Invoice Upload</label>
              <div style={{
                border: '2px dashed var(--outline-variant)', borderRadius: '0.75rem',
                padding: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem',
                background: 'var(--surface-container-low)', cursor: 'pointer', transition: 'all 0.15s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-container-high)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--surface-container-low)'}>
                <Upload size={48} style={{ color: 'var(--primary)' }} />
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontFamily: 'var(--font-headline)', fontWeight: 700, fontSize: '1.125rem' }}>Drag & drop invoice PDF</p>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--outline)' }}>or <span style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'underline' }}>browse files</span> (Max 10MB)</p>
                </div>
              </div>
            </div>

            <div style={{ paddingTop: '1.5rem' }}>
              <button disabled={submitting} type="submit" className="gradient-fill" style={{
                width: '100%', padding: '1.25rem',
                color: 'var(--on-primary)', fontFamily: 'var(--font-headline)', fontWeight: 700, fontSize: '0.875rem',
                textTransform: 'uppercase', letterSpacing: '0.2em',
                borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
                boxShadow: '0 20px 40px rgba(0,52,111,0.3)', opacity: submitting ? 0.7 : 1
              }}>
                {submitting ? 'Processing...' : 'Submit for Approval'}
                <Send size={18} />
              </button>
            </div>
          </form>
        </div>

        {/* Sidebar Context */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <div style={{ background: 'var(--surface-container-highest)', padding: '2rem', borderRadius: 'var(--radius-lg)', borderTop: '4px solid var(--tertiary)' }}>
            <h3 style={{
              fontFamily: 'var(--font-label)', fontSize: '0.625rem', fontWeight: 900,
              color: 'var(--tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em',
              display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem'
            }}>
              <Info size={14} /> Audit Trail Context
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {[
                { date: 'OCT 24, 09:15 AM', text: 'PO-2023-SAR-0892 Approved by Director', active: true },
                { date: 'OCT 25, 14:30 PM', text: 'Vendor acknowledged receipt of order', active: true },
                { date: 'PENDING', text: 'Invoice submission by requester', active: false }
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ 
                      width: 10, height: 10, borderRadius: '50%',
                      background: item.active ? 'var(--tertiary)' : 'transparent',
                      border: item.active ? 'none' : '2px solid var(--outline-variant)'
                    }}></div>
                    {i < 2 && <div style={{ width: 1, flex: 1, background: 'var(--outline-variant)', margin: '4px 0' }}></div>}
                  </div>
                  <div style={{ paddingBottom: i === 2 ? 0 : '1rem' }}>
                    <p style={{ fontFamily: 'var(--font-label)', fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: item.active ? 'var(--tertiary)' : 'var(--outline)' }}>{item.date}</p>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', marginTop: '0.25rem', color: item.active ? 'var(--on-surface)' : 'var(--outline)', fontStyle: item.active ? 'normal' : 'italic' }}>{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 'var(--radius-lg)', aspectRatio: '4/3', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
            <img 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuD-rtLtrBvOeAYkbgOOFfLaW7r1vky_XFPj_C1S-2OGN5MsQqg9IgUhI54dgbQIaM7T1OKYP58XyLoIATRgd0mwrFRXB9dSHVvi9fBcdAJlISvFDyK4ar9jYK2qAQaXla_uC5XNlNqxV98t4mOYzQJ-kshq-ZNf7Tl0EUqvrLOElQPyqRfCh5vsCNxCkRLHiIdCqTLR6bv_Kjp0oLky_HPy_171ItGu6wqbH2beXz8YPFKZVQ70LJ-fJ7Q78QCHWp8rULMXm-HzCvWt" 
              alt="Lab" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              referrerPolicy="no-referrer"
            />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,52,111,0.9), rgba(0,52,111,0.2), transparent)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '2rem' }}>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-label)', fontSize: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.3em', marginBottom: '0.25rem' }}>Reference Location</p>
              <p style={{ color: 'white', fontFamily: 'var(--font-headline)', fontWeight: 700, fontSize: '1.25rem', letterSpacing: '-0.02em' }}>Bio-Chem Analytical Lab, Kuching</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default PaymentRequest
