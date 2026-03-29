import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, Clock, ArrowRight, AlertTriangle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { procurementApi } from '../services/api'
import { getStatusChipClass, useCompany } from '../App'

const ApprovalView = () => {
  const { isMobile } = useCompany()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      const data = await procurementApi.getRequests()
      // Filter for requests that actually need interaction or attention
      const pending = data.filter(r => 
        ['PENDING_MANAGER', 'PENDING_DIRECTOR', 'APPROVED'].includes(r.status)
      )
      setRequests(pending)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '1.5rem' : '2.5rem', marginBottom: '4rem' }}>
      {/* Header */}
      <section>
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--outline)' }}>Workflow</span>
          <span style={{ color: 'var(--outline)', fontSize: '0.75rem' }}>›</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700 }}>Pending</span>
        </nav>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: 900, color: 'var(--primary)' }}>Pending Authorizations</h1>
          <span style={{ padding: '0.5rem 1rem', background: 'var(--warning-container)', color: 'white', borderRadius: 'var(--radius-pill)', fontSize: '0.625rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={12} />
            {requests.length} ACTIONS
          </span>
        </div>
      </section>

      {/* List Container */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center', fontWeight: 700, opacity: 0.5 }} className="animate-pulse">Loading secure ledger...</div>
        ) : requests.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center', background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-sm)' }}>
            <CheckCircle size={48} style={{ margin: '0 auto 1.5rem', color: 'var(--tertiary)', opacity: 0.2 }} />
            <p style={{ fontWeight: 800, fontSize: '1.125rem' }}>Queue Cleared</p>
            <p style={{ fontSize: '0.875rem', color: 'var(--outline)' }}>No pending authorizations detected.</p>
          </div>
        ) : requests.map((app, i) => (
          <Link to={`/request/${app.id}`} key={app.id} style={{ textDecoration: 'none' }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              style={{ 
                display: 'flex', flexDirection: isMobile ? 'column' : 'row', 
                alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between',
                padding: isMobile ? '1rem' : '1.25rem 2rem', background: 'var(--surface-container-lowest)', 
                borderRadius: 'var(--radius-sm)', border: '1px solid rgba(194,198,211,0.2)', gap: isMobile ? '1rem' : '2rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flex: 1, width: '100%' }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 'var(--radius-sm)',
                  background: 'var(--surface-container-high)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--primary)', fontWeight: 900, fontSize: '1.125rem', flexShrink: 0
                }}>{app.id}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.625rem', fontWeight: 900, color: 'var(--primary)', textTransform: 'uppercase' }}>SEQ-{app.id}</span>
                    <span style={{ fontSize: '0.625rem', color: 'var(--outline)' }}>• {new Date(app.created_at).toLocaleDateString()}</span>
                  </div>
                  <h3 style={{ fontWeight: 800, fontSize: '1.125rem', color: 'var(--primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{app.title}</h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--outline)' }}>{app.vendor_name}</p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: isMobile ? '100%' : 'auto', gap: '1.5rem' }}>
                 <div style={{ textAlign: isMobile ? 'left' : 'right' }}>
                    <p style={{ fontSize: '0.625rem', fontWeight: 900, color: 'var(--outline)', marginBottom: '0.25rem' }}>TOTAL VALUE</p>
                    <p style={{ fontWeight: 900, color: 'var(--primary)', fontSize: '1.25rem' }}>RM {app.total_amount.toLocaleString()}</p>
                 </div>
                 <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '0.625rem', fontWeight: 900, color: 'var(--outline)', marginBottom: '0.25rem' }}>GATE STATUS</p>
                    <span className={`chip ${getStatusChipClass(app.status)}`} style={{ fontSize: '0.625rem', fontWeight: 900 }}>{app.status}</span>
                 </div>
                 {!isMobile && <ArrowRight size={20} style={{ color: 'var(--outline)', opacity: 0.3 }} />}
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default ApprovalView
