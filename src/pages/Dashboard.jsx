import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowUpRight, ArrowDownRight, ShoppingCart, Activity, Plus, Search, Filter } from 'lucide-react'
import { Link } from 'react-router-dom'
import { procurementApi } from '../services/api'
import { useCompany, getStatusChipClass } from '../App'

const Dashboard = () => {
  const { currentCompany } = useCompany()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (currentCompany) fetchData()
  }, [currentCompany])

  const fetchData = async () => {
    setLoading(true)
    try {
      const data = await procurementApi.getRequests()
      setRequests(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const stats = [
    { label: 'Active Procurements', value: requests.length, change: '+12%', type: 'positive' },
    { label: 'Pending Approvals', value: requests.filter(r => r.status.includes('PENDING')).length, change: '+5%', type: 'positive' },
    { label: 'Total Vendor Spend', value: `RM ${(requests.reduce((acc, r) => acc + r.total_amount, 0) / 1000).toFixed(1)}K`, change: '-3%', type: 'negative' },
    { label: 'System Health', value: '99.9%', change: '+0.1%', type: 'positive' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* Hero */}
      <section style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <motion.p 
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            style={{ fontFamily: 'var(--font-label)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            Digital Ledger Context 
            <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--primary)', display: 'inline-block' }} />
            <span style={{ color: 'var(--on-surface-variant)' }}>{currentCompany?.name || 'Loading...'}</span>
          </motion.p>
          <motion.h1 
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 }}
            style={{ fontFamily: 'var(--font-headline)', fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--on-surface)' }}
          >
            SaaS Operational Overview
          </motion.h1>
        </div>
        <Link 
          to="/procurement" 
          style={{ 
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.75rem 1.5rem', background: 'var(--primary)', color: 'var(--on-primary)',
            fontFamily: 'var(--font-headline)', fontWeight: 700, fontSize: '0.875rem',
            borderRadius: 'var(--radius-sm)', textDecoration: 'none', transition: 'background 0.15s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-container)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--primary)'}
        >
          <Plus size={16} />
          New Procurement
        </Link>
      </section>

      {/* Stats Grid (Stitch: tonal layering, no borders) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="surface-card"
            style={{ padding: '1.25rem 1.5rem' }}
          >
            <p style={{ fontFamily: 'var(--font-label)', fontSize: '0.625rem', fontWeight: 700, color: 'var(--outline)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>
              {stat.label}
            </p>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <h2 style={{ fontFamily: 'var(--font-headline)', fontWeight: 900, fontSize: '1.75rem', color: 'var(--primary)', letterSpacing: '-0.02em' }}>
                {stat.value}
              </h2>
              <span style={{ 
                display: 'inline-flex', alignItems: 'center', gap: '0.125rem',
                fontFamily: 'var(--font-label)', fontSize: '0.6875rem', fontWeight: 700,
                color: stat.type === 'positive' ? 'var(--on-tertiary-fixed-variant)' : 'var(--error)'
              }}>
                {stat.change}
                {stat.type === 'positive' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        {/* Request Stream (Stitch: no dividers, vertical white space, alternating bg) */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 className="title-lg" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <ShoppingCart size={20} style={{ color: 'var(--primary)' }} />
              Tenant Request Stream
            </h3>
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              <button style={{ padding: '0.5rem', borderRadius: 'var(--radius-pill)', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--on-surface-variant)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-container-high)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <Search size={18} />
              </button>
              <button style={{ padding: '0.5rem', borderRadius: 'var(--radius-pill)', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--on-surface-variant)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-container-high)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <Filter size={18} />
              </button>
            </div>
          </div>
          
          <div className="surface-card" style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontFamily: 'var(--font-label)' }}>
              <thead>
                <tr style={{ background: 'var(--surface-container-low)' }}>
                  {['ID', 'Vendor', 'Amount (RM)', 'Status', 'Action'].map(h => (
                    <th key={h} style={{ padding: '0.875rem 1.25rem', fontSize: '0.625rem', fontWeight: 700, color: 'var(--outline)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5" style={{ padding: '3rem', textAlign: 'center', fontFamily: 'var(--font-label)', fontSize: '0.875rem' }} className="animate-pulse">Syncing with tenant ledger...</td></tr>
                ) : requests.length === 0 ? (
                  <tr><td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: 'var(--on-surface-variant)', fontFamily: 'var(--font-label)' }}>No records found for this context.</td></tr>
                ) : requests.map((req, i) => (
                  <tr 
                    key={req.id}
                    style={{ background: i % 2 === 0 ? 'transparent' : 'var(--surface-container-low)', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-container-high)'}
                    onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'var(--surface-container-low)'}
                  >
                    <td style={{ padding: '0.875rem 1.25rem', fontWeight: 900, color: 'var(--primary)', fontSize: '0.875rem' }}>#{req.id}</td>
                    <td style={{ padding: '0.875rem 1.25rem' }}>
                      <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{req.vendor_name}</p>
                      <p style={{ fontSize: '0.625rem', color: 'var(--outline)' }}>ID: {req.vendor_id}</p>
                    </td>
                    <td style={{ padding: '0.875rem 1.25rem', fontWeight: 900, fontSize: '0.875rem' }}>{req.total_amount.toLocaleString()}</td>
                    <td style={{ padding: '0.875rem 1.25rem' }}>
                      <span className={`chip ${getStatusChipClass(req.status)}`}>{req.status}</span>
                    </td>
                    <td style={{ padding: '0.875rem 1.25rem' }}>
                      <Link 
                        to={`/request/${req.id}`}
                        style={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          width: 28, height: 28, borderRadius: 'var(--radius-pill)',
                          background: 'rgba(0,52,111,0.1)', color: 'var(--primary)',
                          transition: 'all 0.15s', textDecoration: 'none'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--primary)'; e.currentTarget.style.color = '#fff' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,52,111,0.1)'; e.currentTarget.style.color = 'var(--primary)' }}
                      >
                        <ArrowUpRight size={14} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Live Telemetry (Stitch: dashed connector, tertiary timestamps) */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 className="title-lg" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Activity size={20} style={{ color: 'var(--primary)' }} />
            Live Telemetry
          </h3>
          
          <div className="surface-card" style={{ position: 'relative', paddingLeft: '2.5rem' }}>
            {/* Stitch: dashed connector line */}
            <div style={{ 
              position: 'absolute', left: 27, top: '1.5rem', bottom: '1.5rem', 
              borderLeft: '2px dashed var(--outline-variant)', opacity: 0.4
            }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {[
                { time: 'Active', action: 'Ledger Isolated', user: currentCompany?.name, target: 'Tenant-OK' },
                { time: 'System', action: 'Multi-Tenant Auth', user: 'Gateway', target: '200 OK' },
                { time: 'Ready', action: 'Petty Cash Ready', user: 'Finance', target: 'Enabled' },
              ].map((activity, i) => (
                <div key={i} style={{ display: 'flex', gap: '1rem', position: 'relative' }}>
                  {/* Stitch: active step circle with primary ring */}
                  <div style={{ 
                    width: 12, height: 12, borderRadius: '50%', 
                    border: '2px solid var(--primary)', background: 'var(--surface-container-lowest)',
                    flexShrink: 0, zIndex: 1, marginTop: 4
                  }} />
                  <div>
                    {/* Stitch: tertiary color for timestamps */}
                    <p style={{ fontFamily: 'var(--font-label)', fontSize: '0.625rem', fontWeight: 700, color: 'var(--tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>
                      {activity.time}
                    </p>
                    <p style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.875rem' }}>{activity.action}</p>
                    <p style={{ fontFamily: 'var(--font-label)', fontSize: '0.625rem', color: 'var(--on-surface-variant)' }}>
                      <span style={{ fontWeight: 700, color: 'var(--on-surface)' }}>{activity.user}</span> • {activity.target}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default Dashboard
