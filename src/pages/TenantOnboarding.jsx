import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Globe, CheckCircle, ArrowRight, Zap, Shield, Database } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { procurementApi } from '../services/api'
import { useCompany } from '../App'

/* ─────────────────────────────────────────────────────
   TenantOnboarding — Stitch-aligned
   ───────────────────────────────────────────────────── */

const TenantOnboarding = () => {
  const navigate = useNavigate()
  const { handleCompanyChange } = useCompany()
  const [formData, setFormData] = useState({ name: '', domain: '' })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [newCompany, setNewCompany] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const company = await procurementApi.createCompany({ name: formData.name, domain: formData.domain })
      setNewCompany(company)
      setSuccess(true)
    } catch (err) { alert(err.message) }
    finally { setSubmitting(false) }
  }

  const handleEnterTenant = () => {
    handleCompanyChange(newCompany)
    navigate('/')
  }

  const S = {
    label: { fontFamily: 'var(--font-label)', fontSize: '0.625rem', fontWeight: 700, color: 'var(--outline)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '1rem' },
    input: { width: '100%', paddingBottom: '0.5rem', background: 'transparent', border: 'none', borderBottom: '2px solid var(--outline-variant)', fontFamily: 'var(--font-headline)', fontSize: '1.125rem', fontWeight: 700, color: 'var(--on-surface)', outline: 'none', transition: 'border-color 0.2s' },
    focus: (e) => e.target.style.borderBottomColor = 'var(--primary)',
    blur: (e) => e.target.style.borderBottomColor = 'var(--outline-variant)'
  }

  return (
    <div style={{ maxWidth: '48rem', margin: '0 auto', padding: '3rem 0' }}>
      <AnimatePresence mode="wait">
        {!success ? (
          <motion.div key="form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}
          >
            {/* Header */}
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 64, height: 64, borderRadius: 'var(--radius-pill)',
                background: 'rgba(0,52,111,0.1)', color: 'var(--primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1.5rem'
              }}>
                <Globe size={32} />
              </div>
              <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.75rem' }}>
                Initialize Enterprise Tenant
              </h1>
              <p style={{ fontFamily: 'var(--font-body)', color: 'var(--on-surface-variant)', maxWidth: '32rem', margin: '0 auto', lineHeight: 1.5 }}>
                Provision a new secure environment within the ProcuSure ecosystem. Each tenant operates on a strictly isolated ledger infrastructure.
              </p>
            </div>

            {/* Form Card */}
            <div style={{
              background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-sm)',
              boxShadow: '0 20px 40px rgba(25,28,30,0.06)', padding: '3rem'
            }}>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                  <div>
                    <label style={S.label}>Entity Legal Name</label>
                    <input type="text" required value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      placeholder="e.g. Alfa Mount Solutions"
                      style={S.input} onFocus={S.focus} onBlur={S.blur} />
                  </div>
                  <div>
                    <label style={S.label}>Primary Operations Domain</label>
                    <input type="text" required value={formData.domain}
                      onChange={e => setFormData({...formData, domain: e.target.value})}
                      placeholder="e.g. alfamount.my"
                      style={S.input} onFocus={S.focus} onBlur={S.blur} />
                  </div>
                </div>

                {/* Protocol Info (Stitch: surface-container-low section) */}
                <div style={{
                  background: 'var(--surface-container-low)', borderRadius: 'var(--radius-sm)',
                  padding: '1.5rem'
                }}>
                  <h3 style={{
                    fontFamily: 'var(--font-label)', fontSize: '0.625rem', fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                    display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem'
                  }}>
                    <Shield size={14} style={{ color: 'var(--primary)' }} /> Infrastructure Protocols Engaged
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                      <Zap size={14} style={{ marginTop: 2, color: 'var(--tertiary)', flexShrink: 0 }} />
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', color: 'var(--on-surface-variant)' }}>
                        <span style={{ fontWeight: 700, color: 'var(--on-surface)' }}>Dynamic Financial Guardrails:</span> RM 5,000 baseline threshold will be seeded in the new global context.
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                      <Database size={14} style={{ marginTop: 2, color: 'var(--primary)', flexShrink: 0 }} />
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', color: 'var(--on-surface-variant)' }}>
                        <span style={{ fontWeight: 700, color: 'var(--on-surface)' }}>Ledger Isolation:</span> Unique UUID generation for all future procurement and petty cash records.
                      </p>
                    </div>
                  </div>
                </div>

                <button type="submit" disabled={submitting} className="gradient-fill" style={{
                  width: '100%', padding: '1rem',
                  color: 'var(--on-primary)', fontFamily: 'var(--font-headline)', fontWeight: 700, fontSize: '0.875rem',
                  borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer',
                  transition: 'opacity 0.15s', opacity: submitting ? 0.5 : 1
                }}>
                  {submitting ? 'Provisioning Environment...' : 'Authorize Tenant Creation'}
                </button>
              </form>
            </div>
          </motion.div>
        ) : (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            style={{
              background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-sm)',
              boxShadow: '0 20px 40px rgba(25,28,30,0.06)',
              textAlign: 'center', padding: '4rem 3rem'
            }}
          >
            <div style={{
              width: 96, height: 96, borderRadius: 'var(--radius-pill)',
              background: 'rgba(0,61,53,0.1)', color: 'var(--tertiary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 2rem'
            }}>
              <CheckCircle size={48} />
            </div>
            <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
              Provisioning Complete
            </h1>
            <p style={{ fontFamily: 'var(--font-label)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1.5rem' }}>
              Context: {newCompany?.name}
            </p>
            <p style={{ fontFamily: 'var(--font-body)', color: 'var(--on-surface-variant)', maxWidth: '24rem', margin: '0 auto 2rem', lineHeight: 1.5 }}>
              The secure multi-tenant environment is live and the ledger is ready for initialization.
            </p>
            <button onClick={handleEnterTenant} style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.875rem 2rem', background: 'var(--on-surface)', color: 'var(--surface)',
              fontFamily: 'var(--font-label)', fontWeight: 700, fontSize: '0.75rem',
              textTransform: 'uppercase', letterSpacing: '0.04em',
              borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer',
              transition: 'opacity 0.15s'
            }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              Enter Execution Context <ArrowRight size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default TenantOnboarding
