import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wallet, Plus, CheckCircle2, Clock, Download, Upload } from 'lucide-react'
import { procurementApi } from '../services/api'
import { useCompany, getStatusChipClass } from '../App'

/* ─────────────────────────────────────────────────────
   PettyCashDashboard — synced with Stitch "Petty Cash Dashboard" screen
   ───────────────────────────────────────────────────── */

const PettyCashDashboard = () => {
  const { refreshKey, activeRole } = useCompany()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ description: '', amount: '', receipt_ref: '' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { fetchData() }, [refreshKey])

  const fetchData = async () => {
    try {
      const data = await procurementApi.getPettyCash()
      setRequests(data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await procurementApi.createPettyCash({
        description: form.description,
        amount: parseFloat(form.amount),
        receipt_ref: form.receipt_ref || 'N/A'
      })
      setShowForm(false)
      setForm({ description: '', amount: '', receipt_ref: '' })
      fetchData()
    } catch (err) { alert(err.message) }
    finally { setSubmitting(false) }
  }

  const totalSpent = requests.reduce((sum, r) => sum + r.amount, 0)
  const balance = 5000 - totalSpent
  const usagePercent = Math.min(Math.round((totalSpent / 5000) * 100), 100)

  const S = {
    label: { fontFamily: 'var(--font-label)', fontSize: '0.625rem', fontWeight: 700, color: 'var(--outline)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '1rem' },
    input: { width: '100%', paddingBottom: '0.5rem', background: 'transparent', border: 'none', borderBottom: '2px solid var(--outline-variant)', fontFamily: 'var(--font-headline)', fontSize: '1rem', fontWeight: 700, color: 'var(--on-surface)', outline: 'none', transition: 'border-color 0.2s' },
    focus: (e) => e.target.style.borderBottomColor = 'var(--primary)',
    blur: (e) => e.target.style.borderBottomColor = 'var(--outline-variant)'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Petty Cash Dashboard</h1>
      </div>

      {/* Top Grid: Balance + Fast-Track Claim */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Available Balance */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-sm)', padding: '2rem', boxShadow: '0 0 0 1px rgba(194,198,211,0.15)' }}
        >
          <p style={S.label}>Available Balance</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '2rem' }}>
            <span style={{ fontFamily: 'var(--font-headline)', fontSize: '1rem', fontWeight: 900, color: 'var(--primary)' }}>RM</span>
            <span style={{ fontFamily: 'var(--font-headline)', fontSize: '2.75rem', fontWeight: 900, color: 'var(--primary)', letterSpacing: '-0.02em' }}>
              {balance.toLocaleString('en', { minimumFractionDigits: 2 })}
            </span>
          </div>

          {/* Monthly Insight (Stitch: progress bar) */}
          <div style={{ background: 'var(--surface-container-low)', borderRadius: 'var(--radius-lg)', padding: '1rem' }}>
            <p style={{ fontFamily: 'var(--font-headline)', fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.75rem' }}>Monthly Insight</p>
            <div className="progress-track" style={{ height: 6, marginBottom: '0.5rem' }}>
              <div className="progress-fill" style={{ width: `${usagePercent}%` }} />
            </div>
            <p style={{ fontFamily: 'var(--font-label)', fontSize: '0.625rem', color: 'var(--on-surface-variant)' }}>
              You are at {usagePercent}% of your monthly petty cash allocation.
            </p>
          </div>
        </motion.div>

        {/* Fast-Track Claim */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          style={{ background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-sm)', padding: '2rem', boxShadow: '0 0 0 1px rgba(194,198,211,0.15)' }}
        >
          <h2 style={{ fontFamily: 'var(--font-headline)', fontSize: '1.375rem', fontWeight: 700, marginBottom: '0.5rem' }}>Fast-Track Claim</h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--on-surface-variant)', marginBottom: '1.5rem' }}>Submit small claims for instant processing.</p>

          <AnimatePresence mode="wait">
            {!showForm ? (
              <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div
                  onClick={() => setShowForm(true)}
                  style={{
                    border: '2px dashed var(--outline-variant)', borderRadius: 'var(--radius-sm)',
                    padding: '2rem', textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.15s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--outline-variant)'}
                >
                  <Upload size={24} style={{ margin: '0 auto 0.5rem', color: 'var(--outline)' }} />
                  <p style={{ fontFamily: 'var(--font-label)', fontSize: '0.75rem', fontWeight: 600 }}>Drag & drop or browse</p>
                  <p style={{ fontFamily: 'var(--font-label)', fontSize: '0.625rem', color: 'var(--outline)' }}>PDF, JPG or PNG (Max 5MB)</p>
                </div>
              </motion.div>
            ) : (
              <motion.form key="form" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} onSubmit={handleSubmit}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div>
                    <label style={S.label}>Description</label>
                    <input type="text" required value={form.description}
                      onChange={e => setForm({...form, description: e.target.value})}
                      placeholder="e.g. Staff Refreshments" style={S.input} onFocus={S.focus} onBlur={S.blur} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={S.label}>Amount (RM)</label>
                      <input type="number" required value={form.amount}
                        onChange={e => setForm({...form, amount: e.target.value})}
                        placeholder="45.00" style={S.input} onFocus={S.focus} onBlur={S.blur} />
                    </div>
                    <div>
                      <label style={S.label}>Receipt Ref</label>
                      <input type="text" value={form.receipt_ref}
                        onChange={e => setForm({...form, receipt_ref: e.target.value})}
                        placeholder="PC-XXXX" style={S.input} onFocus={S.focus} onBlur={S.blur} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                    <button type="button" onClick={() => setShowForm(false)} style={{
                      padding: '0.625rem 1.25rem', background: 'transparent',
                      border: '1px solid rgba(194,198,211,0.2)', borderRadius: 'var(--radius-sm)',
                      fontFamily: 'var(--font-label)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
                      color: 'var(--on-surface-variant)'
                    }}>Cancel</button>
                    <button type="submit" disabled={submitting} className="gradient-fill" style={{
                      padding: '0.625rem 1.5rem', color: 'var(--on-primary)',
                      borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer',
                      fontFamily: 'var(--font-headline)', fontSize: '0.875rem', fontWeight: 700,
                      opacity: submitting ? 0.5 : 1
                    }}>{submitting ? 'Submitting...' : 'Submit Claim'}</button>
                  </div>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Recent Claims (Stitch: vertical white space, alternating bg, no dividers) */}
      <motion.section
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h3 style={{ fontFamily: 'var(--font-headline)', fontSize: '1.375rem', fontWeight: 700 }}>Recent Claims</h3>
          <button style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)',
            fontFamily: 'var(--font-label)', fontSize: '0.75rem', fontWeight: 700,
            background: 'none', border: 'none', cursor: 'pointer'
          }}>
            <Download size={14} /> Export
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', fontFamily: 'var(--font-label)' }} className="animate-pulse">Syncing ledger...</div>
          ) : requests.length === 0 ? (
            <div style={{ background: 'var(--surface-container-lowest)', padding: '3rem', textAlign: 'center', borderRadius: 'var(--radius-sm)', boxShadow: '0 0 0 1px rgba(194,198,211,0.15)' }}>
              <Wallet size={40} style={{ margin: '0 auto 1rem', opacity: 0.15 }} />
              <p style={{ fontFamily: 'var(--font-label)', fontSize: '0.875rem', color: 'var(--on-surface-variant)' }}>No petty cash claims yet.</p>
            </div>
          ) : requests.map((req, i) => (
            <motion.div
              key={req.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '1.25rem 1.5rem',
                background: i % 2 === 0 ? 'var(--surface-container-lowest)' : 'transparent',
                borderRadius: 'var(--radius-sm)',
                boxShadow: i % 2 === 0 ? '0 0 0 1px rgba(194,198,211,0.1)' : 'none',
                transition: 'all 0.15s', cursor: 'pointer'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-container-high)'; e.currentTarget.style.transform = 'translateX(4px)' }}
              onMouseLeave={e => { e.currentTarget.style.background = i % 2 === 0 ? 'var(--surface-container-lowest)' : 'transparent'; e.currentTarget.style.transform = 'none' }}
            >
              <div>
                <h4 style={{ fontFamily: 'var(--font-headline)', fontWeight: 700, fontSize: '1rem', marginBottom: '0.25rem' }}>{req.description}</h4>
                <p style={{ fontFamily: 'var(--font-label)', fontSize: '0.625rem', color: 'var(--outline)' }}>
                  {new Date(req.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} • ID: {req.receipt_ref}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <span style={{ fontFamily: 'var(--font-headline)', fontWeight: 900, fontSize: '1.125rem', color: 'var(--primary)' }}>
                  RM {req.amount.toLocaleString('en', { minimumFractionDigits: 2 })}
                </span>
                <span className={`chip ${getStatusChipClass(req.status)}`}>{req.status}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Audit Trail Log (Stitch: surface-container-highest, label-sm Inter) */}
      <motion.section
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
      >
        <div>
          <h3 style={{ fontFamily: 'var(--font-headline)', fontSize: '1.375rem', fontWeight: 700 }}>Audit Trail Log</h3>
          <p style={{ fontFamily: 'var(--font-label)', fontSize: '0.75rem', color: 'var(--on-surface-variant)', marginTop: '0.25rem' }}>
            All petty cash transactions are cryptographically signed and stored in the divisional ledger for Sarawak regional compliance.
          </p>
        </div>
        <div style={{
          background: 'var(--surface-container-highest)', borderRadius: 'var(--radius-sm)',
          padding: '1rem', fontFamily: 'var(--font-label)', fontSize: '0.75rem',
          display: 'flex', flexDirection: 'column', gap: '0.5rem'
        }}>
          {[
            '[2023-10-27 09:15:22] SYNC_SUCCESS: Ledger partition Sarawak_04 updated.',
            '[2023-10-26 14:30:11] AUTH_VERIFY: Lab Manager approved claim PC-9921.',
            '[2023-10-25 11:02:45] SESSION_OPEN: Petty cash drawer synchronized with physical vault.'
          ].map((line, i) => (
            <p key={i} style={{ color: i === 0 ? 'var(--tertiary)' : 'var(--on-surface-variant)', fontWeight: i === 0 ? 600 : 400 }}>{line}</p>
          ))}
        </div>
      </motion.section>
    </div>
  )
}

export default PettyCashDashboard
