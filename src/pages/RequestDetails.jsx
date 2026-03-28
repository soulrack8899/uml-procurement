import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, CheckCircle, XCircle, FileText, Download, AlertTriangle, ChevronRight } from 'lucide-react'
import { procurementApi } from '../services/api'
import TimelineView from '../components/TimelineView'
import { useCompany, getStatusChipClass } from '../App'

const RequestDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { activeRole } = useCompany()
  const [request, setRequest] = useState(null)
  const [auditLogs, setAuditLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [transitioning, setTransitioning] = useState(null)

  useEffect(() => { fetchData() }, [id])

  const fetchData = async () => {
    try {
      const [reqData, logsData] = await Promise.all([
        procurementApi.getRequest(id),
        procurementApi.getAuditLogs(id)
      ])
      setRequest(reqData)
      setAuditLogs(logsData)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const handleTransition = async (newStatus, action, role) => {
    setTransitioning(newStatus)
    try {
      await procurementApi.transitionStatus(id, newStatus, action, role)
      fetchData()
    } catch (err) { alert(err.message) }
    finally { setTransitioning(null) }
  }

  if (loading) return (
    <div style={{ padding: '5rem', textAlign: 'center', fontFamily: 'var(--font-headline)', fontWeight: 700, fontSize: '1.125rem' }} className="animate-pulse">
      Loading context...
    </div>
  )
  if (!request) return (
    <div style={{ padding: '5rem', textAlign: 'center', fontFamily: 'var(--font-headline)', fontWeight: 700 }}>
      Request not found.
    </div>
  )

  const canApprove = (status, role) => {
    if (status === 'PENDING_MANAGER' && ['MANAGER', 'DIRECTOR'].includes(role)) return true
    if (status === 'PENDING_DIRECTOR' && role === 'DIRECTOR') return true
    if (status === 'APPROVED' && ['FINANCE', 'DIRECTOR'].includes(role)) return true
    return false
  }

  const getNextStatus = (current) => {
    const flow = {
      'PENDING_MANAGER': 'APPROVED',
      'PENDING_DIRECTOR': 'APPROVED',
      'APPROVED': 'PO_ISSUED',
      'PO_ISSUED': 'PAYMENT_PENDING',
      'PAYMENT_PENDING': 'PAID',
    }
    return flow[current]
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <button onClick={() => navigate(-1)} style={{ padding: '0.5rem', borderRadius: 'var(--radius-pill)', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--primary)', transition: 'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-container-high)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <ArrowLeft size={20} />
          </button>
          <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontFamily: 'var(--font-label)', fontSize: '0.75rem', color: 'var(--outline)' }}>Procurement</span>
            <ChevronRight size={12} style={{ color: 'var(--outline)' }} />
            <span style={{ fontFamily: 'var(--font-label)', fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>SEQ-{request.id}</span>
          </nav>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em' }}>{request.title}</h1>
          <span className={`chip ${getStatusChipClass(request.status)}`}>{request.status}</span>
        </div>
        <p style={{ fontFamily: 'var(--font-label)', fontSize: '0.75rem', color: 'var(--on-surface-variant)', fontWeight: 500, marginTop: '0.25rem' }}>
          Vendor: {request.vendor_name} / {request.vendor_id}
        </p>
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '7fr 5fr', gap: '1.5rem' }}>
        {/* Left: Detail Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-sm)',
            boxShadow: '0 0 0 1px rgba(194,198,211,0.15)', padding: '2rem'
          }}
        >
          {/* Financial Summary */}
          <div style={{ marginBottom: '2rem' }}>
            <p style={{ fontFamily: 'var(--font-label)', fontSize: '0.625rem', fontWeight: 700, color: 'var(--outline)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
              Total Procurement Value
            </p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
              <span style={{ fontFamily: 'var(--font-headline)', fontSize: '1rem', fontWeight: 900, color: 'var(--primary)' }}>RM</span>
              <span style={{ fontFamily: 'var(--font-headline)', fontSize: '2.75rem', fontWeight: 900, color: 'var(--primary)', letterSpacing: '-0.02em' }}>
                {request.total_amount.toLocaleString('en', { minimumFractionDigits: 2 })}
              </span>
            </div>
            {request.total_amount > 5000 && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem',
                background: 'var(--error-container)', padding: '0.625rem 0.875rem',
                borderRadius: 'var(--radius-sm)', color: 'var(--on-error-container)',
                fontFamily: 'var(--font-label)', fontSize: '0.75rem', fontWeight: 600
              }}>
                <AlertTriangle size={14} /> Exceeds RM 5,000 — Director authorization required
              </div>
            )}
          </div>

          {/* Line Items */}
          {request.items && request.items.length > 0 && (
            <div>
              <p style={{ fontFamily: 'var(--font-label)', fontSize: '0.625rem', fontWeight: 700, color: 'var(--outline)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1rem' }}>
                Line Items
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                {request.items.map((item, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.875rem 1rem',
                    background: i % 2 === 0 ? 'var(--surface-container-low)' : 'transparent',
                    borderRadius: 'var(--radius-sm)'
                  }}>
                    <div>
                      <p style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '0.875rem' }}>{item.description}</p>
                      <p style={{ fontFamily: 'var(--font-label)', fontSize: '0.625rem', color: 'var(--outline)' }}>Qty: {item.quantity} × RM {item.unit_price?.toLocaleString()}</p>
                    </div>
                    <span style={{ fontFamily: 'var(--font-headline)', fontWeight: 900, color: 'var(--primary)', fontSize: '0.875rem' }}>
                      RM {item.total_price?.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(194,198,211,0.15)' }}>
            <div>
              <p style={{ fontFamily: 'var(--font-label)', fontSize: '0.625rem', fontWeight: 700, color: 'var(--outline)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>Initiated</p>
              <p style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.875rem' }}>{new Date(request.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
            <div>
              <p style={{ fontFamily: 'var(--font-label)', fontSize: '0.625rem', fontWeight: 700, color: 'var(--outline)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>Last Updated</p>
              <p style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.875rem' }}>{new Date(request.updated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
          </div>
        </motion.div>

        {/* Right: Actions + Workflow */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Approval Actions */}
          {canApprove(request.status, activeRole) && (
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              style={{
                background: 'var(--surface-container-high)', borderRadius: 'var(--radius-sm)', padding: '1.5rem'
              }}
            >
              <h3 style={{ fontFamily: 'var(--font-headline)', fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem' }}>
                Authorization Required
              </h3>
              <p style={{ fontFamily: 'var(--font-label)', fontSize: '0.75rem', color: 'var(--on-surface-variant)', marginBottom: '1.5rem' }}>
                This action will be logged in the Audit Trail for compliance.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={() => handleTransition(getNextStatus(request.status), 'Approved', activeRole)}
                  disabled={transitioning}
                  className="gradient-fill"
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                    padding: '0.875rem', color: 'var(--on-primary)',
                    fontFamily: 'var(--font-headline)', fontWeight: 700, fontSize: '0.875rem',
                    borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer',
                    opacity: transitioning ? 0.5 : 1
                  }}
                >
                  <CheckCircle size={18} /> {transitioning ? 'Processing...' : 'Approve'}
                </button>
                <button
                  onClick={() => handleTransition('DRAFT', 'Rejected', activeRole)}
                  disabled={transitioning}
                  style={{
                    padding: '0.875rem 1.5rem', background: 'var(--error-container)',
                    color: 'var(--on-error-container)', fontFamily: 'var(--font-headline)',
                    fontWeight: 700, fontSize: '0.875rem', borderRadius: 'var(--radius-sm)',
                    border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem'
                  }}
                >
                  <XCircle size={18} /> Reject
                </button>
              </div>
            </motion.div>
          )}

          {/* Generate Documents */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            style={{
              background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-sm)',
              boxShadow: '0 0 0 1px rgba(194,198,211,0.2)', padding: '1.5rem'
            }}
          >
            <h3 style={{ fontFamily: 'var(--font-headline)', fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem' }}>Documents</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                { label: 'Purchase Order (PDF)', icon: <FileText size={16} />, action: async () => {
                  try {
                    const blob = await procurementApi.generatePO(id)
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url; a.download = `PO-${id}.pdf`; a.click()
                  } catch (err) { alert(err.message) }
                }},
                { label: 'Procurement Summary', icon: <Download size={16} />, action: () => {} }
              ].map((doc, i) => (
                <button key={i} onClick={doc.action} style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.875rem', background: 'var(--surface-container-low)',
                  borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer',
                  fontFamily: 'var(--font-label)', fontSize: '0.75rem', fontWeight: 600,
                  color: 'var(--on-surface)', textAlign: 'left', width: '100%',
                  transition: 'background 0.15s'
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-container-high)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--surface-container-low)'}
                >
                  <span style={{ color: 'var(--primary)' }}>{doc.icon}</span>
                  {doc.label}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Audit Trail */}
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <h3 style={{ fontFamily: 'var(--font-headline)', fontSize: '1.375rem', fontWeight: 700, marginBottom: '1rem' }}>Audit Trail</h3>
        <TimelineView auditLogs={auditLogs} />
      </motion.section>
    </div>
  )
}

export default RequestDetails
