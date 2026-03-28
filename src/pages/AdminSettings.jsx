import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useCompany } from '../App'
import { procurementApi } from '../services/api'

/* ─────────────────────────────────────────────────────
   AdminSettings — pixel-matched to Stitch code.html
   "Global Procurement Controls" bento grid layout
   ───────────────────────────────────────────────────── */

const AdminSettings = () => {
  const { currentCompany } = useCompany()
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [threshold, setThreshold] = useState('')
  const [pettyCashLimit, setPettyCashLimit] = useState('500.00')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (currentCompany) fetchData()
  }, [currentCompany])

  const fetchData = async () => {
    try {
      const data = await procurementApi.getSettings(currentCompany.id)
      setSettings(data)
      setThreshold(data.approval_threshold.toLocaleString('en', { minimumFractionDigits: 2 }))
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await procurementApi.updateSettings(currentCompany.id, parseFloat(threshold.replace(/,/g, '')))
      alert("Financial guardrails updated successfully.")
    } catch (err) { alert(err.message) }
    finally { setSaving(false) }
  }

  if (loading) return (
    <div style={{ padding: '5rem', textAlign: 'center', fontFamily: 'var(--font-headline)', fontWeight: 700, fontSize: '1.125rem' }} className="animate-pulse">
      Reading system policy...
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* Breadcrumbs & Headline (Stitch exact) */}
      <div style={{ marginBottom: '0.5rem' }}>
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <span style={{ fontFamily: 'var(--font-label)', fontSize: '0.75rem', color: 'var(--outline)' }}>Governance</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--outline)' }}>›</span>
          <span style={{ fontFamily: 'var(--font-label)', fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>Global Settings</span>
        </nav>
        <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Global Procurement Controls</h1>
        <p style={{ fontFamily: 'var(--font-body)', color: 'var(--on-surface-variant)', marginTop: '0.5rem', maxWidth: '42rem' }}>
          Configure financial guardrails, authorization workflows, and security audit protocols for the {currentCompany?.name} ecosystem.
        </p>
      </div>

      {/* Bento Grid (Stitch: 7-col + 5-col) */}
      <div style={{ display: 'grid', gridTemplateColumns: '7fr 5fr', gap: '1.5rem' }}>
        {/* ── Financial Thresholds (Left Panel) ── */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'var(--surface-container-lowest)',
            padding: '2rem',
            borderRadius: 'var(--radius-sm)',
            boxShadow: '0 0 0 1px rgba(194,198,211,0.05)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.875rem', color: 'var(--primary)' }}>🏛️</span>
              <h2 style={{ fontFamily: 'var(--font-headline)', fontSize: '1.25rem', fontWeight: 700 }}>Financial Thresholds</h2>
            </div>
            <span className="chip chip-approved" style={{ padding: '0.375rem 0.75rem', fontSize: '0.625rem' }}>Active Policy</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Director Approval Limit */}
            <div>
              <label style={{ fontFamily: 'var(--font-label)', fontSize: '0.625rem', fontWeight: 700, color: 'var(--outline)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '1rem' }}>
                Director Approval Limit (RM)
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 0, bottom: '0.75rem', color: 'var(--primary)', fontFamily: 'var(--font-headline)', fontSize: '1.5rem', fontWeight: 900 }}>RM</span>
                <input
                  type="text"
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                  style={{
                    width: '100%', paddingLeft: '3rem', paddingBottom: '0.5rem',
                    background: 'transparent', border: 'none', borderBottom: '2px solid var(--outline-variant)',
                    fontFamily: 'var(--font-headline)', fontSize: '1.875rem', fontWeight: 900,
                    color: 'var(--on-surface)', outline: 'none', transition: 'border-color 0.2s'
                  }}
                  onFocus={e => e.target.style.borderBottomColor = 'var(--primary)'}
                  onBlur={e => e.target.style.borderBottomColor = 'var(--outline-variant)'}
                />
              </div>
              <p style={{ marginTop: '0.5rem', fontFamily: 'var(--font-label)', fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>
                Transactions exceeding this amount require multi-factor Director biometric verification.
              </p>
            </div>

            {/* Petty Cash Daily Limit */}
            <div>
              <label style={{ fontFamily: 'var(--font-label)', fontSize: '0.625rem', fontWeight: 700, color: 'var(--outline)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '1rem' }}>
                Petty Cash Daily Limit
              </label>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 0, bottom: '0.5rem', color: 'var(--outline)', fontFamily: 'var(--font-headline)', fontSize: '1.125rem' }}>RM</span>
                  <input
                    type="text"
                    value={pettyCashLimit}
                    onChange={(e) => setPettyCashLimit(e.target.value)}
                    style={{
                      width: '100%', paddingLeft: '2.5rem', paddingBottom: '0.5rem',
                      background: 'transparent', border: 'none', borderBottom: '2px solid var(--outline-variant)',
                      fontFamily: 'var(--font-headline)', fontSize: '1.25rem', fontWeight: 700,
                      color: 'var(--on-surface)', outline: 'none'
                    }}
                  />
                </div>
                <div style={{ background: 'var(--surface-container-low)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)', boxShadow: '0 0 0 1px rgba(194,198,211,0.1)' }}>
                  <span style={{ fontFamily: 'var(--font-label)', fontSize: '0.625rem', fontWeight: 700, color: 'var(--outline)', display: 'block' }}>Auto-Replenish</span>
                  <span style={{ fontFamily: 'var(--font-headline)', fontSize: '0.875rem', fontWeight: 700, color: 'var(--primary)' }}>Enabled</span>
                </div>
              </div>
            </div>
          </div>

          {/* Update Guardrails CTA */}
          <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid rgba(194,198,211,0.15)', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={handleSave}
              disabled={saving}
              className="gradient-fill"
              style={{
                color: 'var(--on-primary)', padding: '0.75rem 2rem', borderRadius: 'var(--radius-sm)',
                fontFamily: 'var(--font-headline)', fontWeight: 700, fontSize: '0.875rem',
                border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
                transition: 'opacity 0.15s', opacity: saving ? 0.5 : 1
              }}
            >
              <span>{saving ? 'Syncing...' : 'Update Guardrails'}</span>
              <span>🛡️</span>
            </button>
          </div>
        </motion.section>

        {/* ── Right Column (Access Control + Emergency) ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Access Control */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            style={{
              background: 'var(--surface-container-high)',
              padding: '1.5rem',
              borderRadius: 'var(--radius-sm)', flex: 1
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <span style={{ color: 'var(--primary)' }}>🔒</span>
              <h3 style={{ fontFamily: 'var(--font-headline)', fontSize: '1.125rem', fontWeight: 700 }}>Access Control</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { icon: '👤', label: 'Lab Personnel', perm: 'View Only', active: false },
                { icon: '💳', label: 'Procurement Officer', perm: 'Full Create', active: false },
                { icon: '🛡️', label: 'Director', perm: 'Admin Override', active: true },
              ].map((role) => (
                <div
                  key={role.label}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.75rem', background: 'var(--surface-container-lowest)',
                    borderRadius: 'var(--radius-sm)',
                    boxShadow: role.active ? '0 0 0 2px rgba(0,52,111,0.2)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 'var(--radius-pill)',
                      background: role.active ? 'var(--primary)' : 'rgba(0,52,111,0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.875rem', color: role.active ? 'var(--on-primary)' : 'var(--primary)'
                    }}>{role.icon}</div>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', fontWeight: 600 }}>{role.label}</span>
                  </div>
                  <span style={{
                    fontFamily: 'var(--font-label)', fontSize: '0.625rem',
                    color: role.active ? 'var(--primary)' : 'var(--outline)',
                    fontWeight: role.active ? 700 : 400
                  }}>{role.perm}</span>
                </div>
              ))}
            </div>

            <button style={{
              width: '100%', marginTop: '1.5rem', color: 'var(--primary)',
              fontFamily: 'var(--font-label)', fontSize: '0.75rem', fontWeight: 700,
              padding: '0.5rem', border: '1px solid rgba(0,52,111,0.2)',
              background: 'transparent', borderRadius: 'var(--radius-sm)',
              cursor: 'pointer', transition: 'background 0.15s'
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,52,111,0.05)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >MANAGE PERMISSIONS</button>
          </motion.section>

          {/* Emergency Lockdown */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{
              background: 'var(--surface-container-lowest)',
              padding: '1.5rem', borderRadius: 'var(--radius-sm)',
              boxShadow: '0 0 0 1px rgba(194,198,211,0.2)',
              display: 'flex', alignItems: 'center', gap: '1rem'
            }}
          >
            <div style={{
              width: 48, height: 48, background: 'var(--error-container)',
              color: 'var(--error)', borderRadius: 'var(--radius-sm)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.875rem'
            }}>⚠️</div>
            <div>
              <p style={{ fontFamily: 'var(--font-headline)', fontWeight: 700, fontSize: '0.875rem' }}>Emergency Lockdown</p>
              <p style={{ fontFamily: 'var(--font-label)', fontSize: '0.625rem', color: 'var(--outline)' }}>Instantly freeze all procurement channels</p>
            </div>
          </motion.section>
        </div>
      </div>

      {/* ── Audit & Transparency Log (Full Width) ── */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        style={{
          background: 'rgba(224,227,229,0.3)',
          padding: '2rem', borderRadius: 'var(--radius-sm)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-headline)', fontSize: '1.25rem', fontWeight: 700 }}>Audit & Transparency Log</h2>
            <p style={{ fontFamily: 'var(--font-label)', fontSize: '0.75rem', color: 'var(--outline)', marginTop: '0.25rem' }}>Configure historical data retention and automated reporting frequencies.</p>
          </div>
          <button style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            color: 'var(--primary)', fontFamily: 'var(--font-label)', fontSize: '0.75rem', fontWeight: 700,
            background: 'none', border: 'none', cursor: 'pointer'
          }}>
            📥 EXPORT LOGS (.TSV)
          </button>
        </div>

        {/* 3-col config (Stitch exact) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <p style={{ fontFamily: 'var(--font-label)', fontSize: '0.625rem', fontWeight: 700, color: 'var(--outline)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Retention Period</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontFamily: 'var(--font-headline)', fontSize: '1.5rem', fontWeight: 900 }}>7 Years</span>
              <span style={{ color: 'var(--primary)', cursor: 'pointer' }}>✏️</span>
            </div>
            <p style={{ fontSize: '0.625rem', color: 'var(--on-surface-variant)', fontStyle: 'italic' }}>Compliant with Sarawak State Finance Regulations.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <p style={{ fontFamily: 'var(--font-label)', fontSize: '0.625rem', fontWeight: 700, color: 'var(--outline)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Notification Frequency</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--primary)' }} />
                <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', fontWeight: 700 }}>Real-time</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.3 }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', border: '1px solid var(--outline)' }} />
                <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem' }}>Batch Daily</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <p style={{ fontFamily: 'var(--font-label)', fontSize: '0.625rem', fontWeight: 700, color: 'var(--outline)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Security Level</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--tertiary)' }}>
              <span>✅</span>
              <span style={{ fontFamily: 'var(--font-headline)', fontSize: '1.125rem', fontWeight: 700 }}>End-to-End Encrypted</span>
            </div>
          </div>
        </div>

        {/* Audit Trail Table (Stitch exact: surface-container-highest) */}
        <div style={{
          marginTop: '2.5rem', background: 'var(--surface-container-highest)',
          padding: '1rem', borderRadius: 'var(--radius-sm)',
          boxShadow: '0 0 0 1px rgba(194,198,211,0.1)'
        }}>
          <table style={{ width: '100%', textAlign: 'left', fontFamily: 'var(--font-label)' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(194,198,211,0.2)' }}>
                {['Timestamp', 'Actor', 'Action', 'Status'].map(h => (
                  <th key={h} style={{ paddingBottom: '0.75rem', fontSize: '0.625rem', fontWeight: 700, color: 'var(--outline)', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: h === 'Status' ? 'right' : 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid rgba(194,198,211,0.1)' }}>
                <td style={{ padding: '0.75rem 0', fontSize: '0.75rem', color: 'var(--tertiary)', fontWeight: 500 }}>12 Oct 2023, 14:32:01</td>
                <td style={{ padding: '0.75rem 0', fontSize: '0.75rem', fontWeight: 600 }}>Director_Admin</td>
                <td style={{ padding: '0.75rem 0', fontSize: '0.75rem' }}>Modified Approval Threshold (RM 5k → RM 3k)</td>
                <td style={{ padding: '0.75rem 0', textAlign: 'right' }}>
                  <span className="chip chip-approved" style={{ fontSize: '0.5625rem' }}>COMMITTED</span>
                </td>
              </tr>
              <tr>
                <td style={{ padding: '0.75rem 0', fontSize: '0.75rem', color: 'var(--tertiary)', fontWeight: 500 }}>12 Oct 2023, 10:15:44</td>
                <td style={{ padding: '0.75rem 0', fontSize: '0.75rem', fontWeight: 600 }}>System_Kernel</td>
                <td style={{ padding: '0.75rem 0', fontSize: '0.75rem' }}>Automated Petty Cash Replenishment Triggered</td>
                <td style={{ padding: '0.75rem 0', textAlign: 'right' }}>
                  <span className="chip chip-pending" style={{ fontSize: '0.5625rem' }}>QUEUED</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </motion.section>

      {/* ── Multi-Entity Oversight Banner (Stitch exact) ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{
          background: 'var(--primary-container)',
          padding: '2.5rem',
          borderRadius: 'var(--radius-sm)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          overflow: 'hidden', position: 'relative'
        }}
      >
        <div style={{ position: 'absolute', right: 0, top: 0, opacity: 0.1, transform: 'translateX(25%) translateY(-25%)', fontSize: '12rem' }}>🏢</div>
        <div style={{ zIndex: 10 }}>
          <h4 style={{ fontFamily: 'var(--font-headline)', fontSize: '1.5rem', fontWeight: 900, color: '#fff' }}>Multi-Entity Oversight</h4>
          <p style={{ maxWidth: '28rem', marginTop: '0.5rem', color: 'rgba(215,226,255,0.8)' }}>
            You are currently managing <span style={{ color: '#fff', fontWeight: 700 }}>{currentCompany?.name}</span>. Switch to <span style={{ color: '#fff', fontWeight: 700, textDecoration: 'underline', textUnderlineOffset: '4px', cursor: 'pointer' }}>Alfa Mount</span> to manage secondary procurement clusters.
          </p>
        </div>
        <button style={{
          zIndex: 10, background: '#fff', color: 'var(--primary)',
          fontFamily: 'var(--font-headline)', fontWeight: 700,
          padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-sm)',
          border: 'none', cursor: 'pointer', transition: 'background 0.15s'
        }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-fixed)'}
          onMouseLeave={e => e.currentTarget.style.background = '#fff'}
        >Switch Entity</button>
      </motion.div>
    </div>
  )
}

export default AdminSettings
