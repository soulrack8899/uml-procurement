import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, Clock, ArrowRight, AlertTriangle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { procurementApi } from '../services/api'
import { getStatusChipClass } from '../App'

const ApprovalView = () => {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      const data = await procurementApi.getRequests()
      const pending = data.filter(r => 
        ['PENDING_MANAGER', 'PENDING_DIRECTOR', 'APPROVED'].includes(r.status)
      )
      setRequests(pending)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* Header */}
      <section>
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <span style={{ fontFamily: 'var(--font-label)', fontSize: '0.75rem', color: 'var(--outline)' }}>Workflow</span>
          <span style={{ color: 'var(--outline)', fontSize: '0.75rem' }}>›</span>
          <span style={{ fontFamily: 'var(--font-label)', fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>Pending Authorizations</span>
        </nav>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Pending Authorizations</h1>
          <span className="chip chip-pending" style={{ padding: '0.5rem 1rem', fontSize: '0.6875rem' }}>
            <Clock size={14} />
            {requests.length} Awaiting
          </span>
        </div>
      </section>

      {/* List (Stitch: no dividers, vertical white space, hover → surface-container-high) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center', fontFamily: 'var(--font-label)', fontSize: '0.875rem' }} className="animate-pulse">Syncing with ledger authority...</div>
        ) : requests.length === 0 ? (
          <div className="surface-card" style={{ padding: '4rem', textAlign: 'center' }}>
            <CheckCircle size={40} style={{ margin: '0 auto 1rem', opacity: 0.15, color: 'var(--on-surface-variant)' }} />
            <p style={{ fontFamily: 'var(--font-headline)', fontWeight: 700, fontSize: '1rem' }}>All clear. No pending approvals.</p>
          </div>
        ) : requests.map((app, i) => (
          <Link to={`/request/${app.id}`} key={app.id} style={{ textDecoration: 'none', display: 'block' }}>
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="surface-card"
              style={{ 
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '1.25rem 1.5rem', cursor: 'pointer', transition: 'background 0.15s, transform 0.15s'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-container-high)'; e.currentTarget.style.transform = 'translateX(4px)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-container-lowest)'; e.currentTarget.style.transform = 'none' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flex: 1 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 'var(--radius-sm)',
                  background: 'rgba(0,52,111,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--primary)', fontFamily: 'var(--font-headline)', fontWeight: 900, fontSize: '1rem', flexShrink: 0
                }}>{app.id}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontFamily: 'var(--font-label)', fontSize: '0.625rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>SEQ-{app.id}</span>
                    <span style={{ fontFamily: 'var(--font-label)', fontSize: '0.625rem', color: 'var(--outline)' }}>• {new Date(app.created_at).toLocaleDateString()}</span>
                  </div>
                  <h3 style={{ fontFamily: 'var(--font-headline)', fontWeight: 700, fontSize: '1.125rem', letterSpacing: '-0.01em', marginBottom: '0.25rem' }}>{app.title}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontFamily: 'var(--font-label)', fontSize: '0.75rem', color: 'var(--on-surface-variant)', fontWeight: 500 }}>{app.vendor_name}</span>
                    <span style={{ fontFamily: 'var(--font-headline)', fontWeight: 900, color: 'var(--primary)', fontSize: '0.875rem' }}>RM {app.total_amount.toLocaleString()}</span>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {app.total_amount > 5000 && (
                    <span className="chip chip-rejected" style={{ fontSize: '0.5625rem' }}>
                      <AlertTriangle size={10} /> High Value
                    </span>
                  )}
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontFamily: 'var(--font-label)', fontSize: '0.5625rem', fontWeight: 700, color: 'var(--outline)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>Current Gate</p>
                    <span className={`chip ${getStatusChipClass(app.status)}`}>{app.status}</span>
                  </div>
                  <ArrowRight size={16} style={{ color: 'var(--outline)', opacity: 0.3 }} />
                </div>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default ApprovalView
