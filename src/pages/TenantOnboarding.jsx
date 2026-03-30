import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Globe, CheckCircle, ArrowRight, Zap, Shield, Database } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { procurementApi } from '../services/api'
import { useCompany } from '../App'

const TenantOnboarding = () => {
  const navigate = useNavigate()
  const { handleCompanyChange, isMobile } = useCompany()
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
    label: { fontSize: '0.625rem', fontWeight: 900, color: 'var(--outline)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '1rem' },
    input: { width: '100%', paddingBottom: '0.5rem', background: 'transparent', border: 'none', borderBottom: '2px solid var(--outline-variant)', fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)', outline: 'none' }
  }

  return (
    <div style={{ maxWidth: '48rem', margin: '0 auto', padding: isMobile ? '1.5rem 0' : '3rem 0' }}>
      <AnimatePresence mode="wait">
        {!success ? (
          <motion.div key="form" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '1.5rem' : '2.5rem' }}
          >
            {/* Header */}
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 72, height: 72, borderRadius: 'var(--radius-pill)',
                background: 'var(--surface-container-high)', color: 'var(--primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1.5rem'
              }}>
                <Globe size={40} />
              </div>
              <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: isMobile ? '1.75rem' : '3rem', fontWeight: 900, color: 'var(--primary)', marginBottom: '1rem' }}>
                Set Up New Company
              </h1>
              <p style={{ color: 'var(--outline)', maxWidth: '32rem', margin: '0 auto', fontSize: '0.875rem' }}>
                Create a secure workspace for your company. Standard procurement rules and approval workflows will be automatically configured.
              </p>
            </div>

            {/* Form Card */}
            <div style={{
              background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(194,198,211,0.2)', padding: isMobile ? '1.5rem' : '3.5rem'
            }}>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '2rem' }}>
                  <div>
                    <label style={S.label}>Company Name</label>
                    <input type="text" required value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      placeholder="e.g. Advanced Tech Lab"
                      style={S.input} />
                  </div>
                  <div>
                    <label style={S.label}>Company Domain (Optional)</label>
                    <input type="text" value={formData.domain}
                      onChange={e => setFormData({...formData, domain: e.target.value})}
                      placeholder="e.g. advtech.co.uk (or leave blank)"
                      style={S.input} />
                  </div>
                </div>

                {/* Protocol Section */}
                <div style={{ background: 'var(--surface-container-low)', borderRadius: 'var(--radius-sm)', padding: '1.5rem' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                      <Shield size={16} style={{ color: 'var(--primary)' }} />
                      <h3 style={{ fontSize: '0.625rem', fontWeight: 900, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>System Configuration</h3>
                   </div>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <Zap size={14} style={{ marginTop: 2, color: 'var(--tertiary)', flexShrink: 0 }} />
                        <p style={{ fontSize: '0.8125rem', color: 'var(--outline)' }}>
                           <span style={{ fontWeight: 800, color: 'var(--on-surface)' }}>Initial Fund:</span> RM 5,000 petty cash fund will be allocated.
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <Database size={14} style={{ marginTop: 2, color: 'var(--primary)', flexShrink: 0 }} />
                        <p style={{ fontSize: '0.8125rem', color: 'var(--outline)' }}>
                           <span style={{ fontWeight: 800, color: 'var(--on-surface)' }}>Data Security:</span> Secure tracking for all procurement requests and records.
                        </p>
                      </div>
                   </div>
                </div>

                <button type="submit" disabled={submitting} className="gradient-fill" style={{
                  width: '100%', padding: '1.25rem',
                  color: 'white', fontWeight: 900, fontSize: '0.875rem',
                  borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer',
                  opacity: submitting ? 0.5 : 1
                }}>
                  {submitting ? 'CREATING COMPANY...' : 'CREATE COMPANY'}
                </button>
              </form>
            </div>
          </motion.div>
        ) : (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            style={{
              background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(194,198,211,0.2)', textAlign: 'center', padding: isMobile ? '3rem 1.5rem' : '5rem 4rem'
            }}
          >
            <div style={{
              width: 96, height: 96, borderRadius: 'var(--radius-pill)',
              background: 'rgba(0,61,53,0.1)', color: 'var(--tertiary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 2rem'
            }}>
              <CheckCircle size={56} />
            </div>
            <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: isMobile ? '1.75rem' : '2.5rem', fontWeight: 900, color: 'var(--primary)', marginBottom: '0.5rem' }}>
              Company Set Up Complete
            </h1>
            <p style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--outline)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1.5rem' }}>
               TENANT ID: {newCompany?.name || 'MAPPED'}
            </p>
            <p style={{ color: 'var(--outline)', maxWidth: '24rem', margin: '0 auto 2.5rem', fontSize: '0.875rem' }}>
               Secure environment established. All financial modules are now accessible within your dedicated divisional context.
            </p>
            <button onClick={handleEnterTenant} className="gradient-fill" style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.75rem',
              padding: '1rem 2.5rem', color: 'white',
              fontWeight: 900, fontSize: '0.75rem', textTransform: 'uppercase',
              borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer'
            }}>
              Go to Dashboard <ArrowRight size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default TenantOnboarding
