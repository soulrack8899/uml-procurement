import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wallet, Plus, CheckCircle2, Clock, Download, Upload, ChevronRight } from 'lucide-react'
import { procurementApi } from '../services/api'
import { useCompany, getStatusChipClass } from '../App'

const PettyCashDashboard = () => {
  const { refreshKey, activeRole, isMobile } = useCompany()
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
        receipt_url: form.receipt_ref || 'N/A'
      })
      setShowForm(false)
      setForm({ description: '', amount: '', receipt_ref: '' })
      fetchData()
    } catch (err) { alert(err.message) }
    finally { setSubmitting(false) }
  }

  const handleDisburse = async (e, id) => {
    e.stopPropagation()
    try {
      await procurementApi.disbursePettyCash(id)
      fetchData()
    } catch (err) { alert(err.message) }
  }

  const totalSpent = requests.reduce((sum, r) => sum + r.amount, 0)
  const balance = 5000 - totalSpent
  const usagePercent = Math.min(Math.round((totalSpent / 5000) * 100), 100)

  const S = {
    label: { fontSize: '0.625rem', fontWeight: 900, color: 'var(--outline)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '1rem' },
    input: { width: '100%', paddingBottom: '0.5rem', background: 'transparent', border: 'none', borderBottom: '2px solid var(--outline-variant)', fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)', outline: 'none' }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '1.5rem' : '2.5rem', paddingBottom: '4rem' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: isMobile ? '1.5rem' : '2.5rem', fontWeight: 900, color: 'var(--primary)' }}>Petty Cash Hub</h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--outline)', marginTop: '0.25rem' }}> Sarawak Divisional Disbursement Authority</p>
      </div>

      {/* Top Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1.5rem' }}>
        
        {/* Balance Card */}
        <motion.section style={{ background: 'var(--surface-container-lowest)', padding: isMobile ? '1.5rem' : '2.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(194,198,211,0.2)' }}>
          <p style={S.label}>Available Balance</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '2.5rem' }}>
             <span style={{ fontWeight: 900, fontSize: '1rem', color: 'var(--primary)' }}>RM</span>
             <span style={{ fontWeight: 900, fontSize: isMobile ? '2.5rem' : '3.5rem', color: 'var(--primary)', letterSpacing: '-0.02em' }}>{balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>

          <div style={{ background: 'var(--surface-container-low)', padding: '1.25rem', borderRadius: 'var(--radius-sm)' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800 }}>Usage Monitor</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--primary)' }}>{usagePercent}%</span>
             </div>
             <div style={{ height: 8, background: 'var(--surface-container-high)', borderRadius: 'var(--radius-pill)', overflow: 'hidden' }}>
                <div style={{ width: `${usagePercent}%`, height: '100%', background: 'var(--primary)', borderRadius: 'inherit' }} />
             </div>
          </div>
        </motion.section>

        {/* Fast-Track Claim Form */}
        <section style={{ background: 'var(--surface-container-lowest)', padding: isMobile ? '1.5rem' : '2.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(194,198,211,0.1)' }}>
           <h2 style={{ fontWeight: 900, fontSize: '1.25rem', marginBottom: '0.5rem' }}>Fast-Track Claim</h2>
           <p style={{ fontSize: '0.875rem', color: 'var(--outline)', marginBottom: '2rem' }}>Instant micro-reimbursement protocols.</p>

           <AnimatePresence mode="wait">
              {!showForm ? (
                <div onClick={() => setShowForm(true)} style={{ border: '2px dashed var(--outline-variant)', padding: '2.5rem', borderRadius: 'var(--radius-sm)', textAlign: 'center', cursor: 'pointer', background: 'var(--surface-container-low)' }}>
                   <Upload size={32} style={{ margin: '0 auto 1rem', color: 'var(--primary)' }} />
                   <p style={{ fontWeight: 800, fontSize: '0.875rem' }}>Tap to Initiation Claim</p>
                   <p style={{ fontSize: '0.625rem', color: 'var(--outline)' }}>SECURE ENCRYPTED UPLOAD</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                   <div>
                      <label style={S.label}>Claim Specification</label>
                      <input type="text" required value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Staff Reimbursment..." style={S.input} />
                   </div>
                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                         <label style={S.label}>Amount (RM)</label>
                         <input type="number" required value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} placeholder="0.00" style={S.input} />
                      </div>
                      <div>
                         <label style={S.label}>Receipt ID</label>
                         <input type="text" value={form.receipt_ref} onChange={e => setForm({...form, receipt_ref: e.target.value})} placeholder="RC-1002" style={S.input} />
                      </div>
                   </div>
                   <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                      <button type="button" onClick={() => setShowForm(false)} style={{ flex: 1, padding: '0.75rem', background: 'transparent', border: '1px solid var(--outline)', borderRadius: 'var(--radius-sm)', fontWeight: 800 }}>CANCEL</button>
                      <button type="submit" disabled={submitting} className="gradient-fill" style={{ flex: 1, padding: '0.75rem', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', fontWeight: 900 }}>{submitting ? 'SYNCING...' : 'DISPATCH'}</button>
                   </div>
                </form>
              )}
           </AnimatePresence>
        </section>
      </div>

      {/* Recent Claims List */}
      <section>
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontWeight: 900, fontSize: '1.5rem', color: 'var(--primary)' }}>Recent Activity</h2>
            <button style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 900, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
               <Download size={14} /> EXPORT (.TSV)
            </button>
         </div>

         <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {loading ? (
              <div style={{ padding: '4rem', textAlign: 'center', fontWeight: 800, opacity: 0.5 }}>Synchronizing Ledger...</div>
            ) : requests.length === 0 ? (
              <div style={{ padding: '4rem', textAlign: 'center', background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-sm)' }}>
                 <CheckCircle2 size={40} style={{ margin: '0 auto 1.5rem', opacity: 0.2 }} />
                 <p style={{ fontWeight: 800 }}>Log Empty</p>
              </div>
            ) : requests.map((req, i) => (
              <motion.div key={req.id} style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', padding: isMobile ? '1rem' : '1.25rem 2rem', background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(194,198,211,0.2)', gap: isMobile ? '1rem' : '2rem' }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontWeight: 800, fontSize: '1.125rem', color: 'var(--primary)' }}>{req.description}</h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--outline)', fontWeight: 700 }}>{new Date(req.created_at).toLocaleDateString()} • {req.receipt_url}</p>
                  </div>
                 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: isMobile ? '100%' : 'auto', gap: '2rem' }}>
                    <p style={{ fontWeight: 900, fontSize: '1.25rem', color: 'var(--primary)' }}>RM {req.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                       <span className={`chip ${getStatusChipClass(req.status)}`} style={{ fontSize: '0.625rem', fontWeight: 900 }}>{req.status}</span>
                       {activeRole === 'MANAGER' && req.status !== 'DISBURSED' && (
                          <button onClick={(e) => handleDisburse(e, req.id)} style={{ padding: '0.5rem 1rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', fontWeight: 900, fontSize: '0.625rem' }}>DISBURSE</button>
                       )}
                       {!isMobile && <ChevronRight size={16} style={{ opacity: 0.2 }} />}
                    </div>
                 </div>
              </motion.div>
            ))}
         </div>
      </section>

      {/* Legal Disclaimer */}
      <footer style={{ background: 'var(--surface-container-high)', padding: '1.5rem', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', color: 'var(--outline)', fontStyle: 'italic' }}>
         All petty cash disbursements are cryptographically logged and subject to Sarawak State Government audit protocols. Identity biometric verification may be required for RM 1,000+ claims.
      </footer>
    </div>
  )
}

export default PettyCashDashboard
