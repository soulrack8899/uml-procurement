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
  const { activeRole, isMobile } = useCompany()
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
    <div style={{ padding: '5rem', textAlign: 'center', fontWeight: 700, fontSize: '1.125rem' }} className="animate-pulse">
      Syncing Ledger...
    </div>
  )
  if (!request) return (
    <div style={{ padding: '5rem', textAlign: 'center', fontWeight: 700 }}>
      Request data not retrieved.
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
    return flow[current] || current
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '1.5rem' : '2.5rem', paddingBottom: '4rem' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <button onClick={() => navigate(-1)} style={{ padding: '0.4rem', borderRadius: '50%', background: 'var(--surface-container-high)', color: 'var(--primary)', border: 'none', cursor: 'pointer' }}>
            <ArrowLeft size={18} />
          </button>
          <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--outline)' }}>
            <span>Requests</span> <ChevronRight size={12} /> <span style={{ color: 'var(--primary)' }}>SEQ-{id}</span>
          </nav>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: isMobile ? '1.5rem' : '2.25rem', fontWeight: 900, color: 'var(--primary)' }}>{request.title}</h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--outline)', marginTop: '0.25rem' }}>Vendor: <strong>{request.vendor_name}</strong> (#{request.vendor_id})</p>
          </div>
          <span className={`chip ${getStatusChipClass(request.status)}`} style={{ alignSelf: isMobile ? 'flex-start' : 'center' }}>{request.status}</span>
        </div>
      </div>

      {/* Mini Progress - Horizontal Scroll on Mobile */}
      <div style={{ 
        display: 'flex', 
        justifyContent: isMobile ? 'flex-start' : 'center', 
        alignItems: 'center', 
        gap: '0.5rem', 
        padding: '1rem 0',
        overflowX: isMobile ? 'auto' : 'visible',
        WebkitOverflowScrolling: 'touch'
      }}>
        {[
          { label: 'Created', done: ['SUBMITTED', 'PENDING_MANAGER', 'PENDING_DIRECTOR', 'APPROVED', 'PO_ISSUED', 'PAYMENT_PENDING', 'PAID'].includes(request.status) },
          { label: 'Approved', done: ['APPROVED', 'PO_ISSUED', 'PAYMENT_PENDING', 'PAID'].includes(request.status) },
          { label: 'PO Issued', done: ['PO_ISSUED', 'PAYMENT_PENDING', 'PAID'].includes(request.status) },
          { label: 'Paid', done: ['PAID'].includes(request.status) }
        ].map((step, idx, arr) => (
          <React.Fragment key={idx}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: step.done ? 'var(--primary)' : 'var(--surface-container-high)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {step.done ? <CheckCircle size={14} /> : <div style={{ width: 6, height: 6, background: 'var(--outline-variant)', borderRadius: '50%' }} />}
              </div>
              <span style={{ fontSize: '0.625rem', fontWeight: 900, textTransform: 'uppercase', color: step.done ? 'var(--primary)' : 'var(--outline)' }}>{step.label}</span>
            </div>
            {idx < arr.length - 1 && <div style={{ width: 20, height: 2, background: 'var(--outline-variant)', flexShrink: 0 }} />}
          </React.Fragment>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(12, 1fr)', gap: isMobile ? '1.5rem' : '2.5rem' }}>
        
        {/* Main Details Panel */}
        <div style={{ gridColumn: isMobile ? 'auto' : 'span 8', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <div className="surface-card" style={{ padding: isMobile ? '1.5rem' : '2.5rem' }}>
            <div style={{ marginBottom: '2.5rem' }}>
              <p style={{ fontSize: '0.625rem', fontWeight: 800, color: 'var(--outline)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>Authorized Value</p>
              <h2 style={{ fontFamily: 'var(--font-headline)', fontSize: '2.5rem', fontWeight: 900, color: 'var(--primary)' }}>RM {request.total_amount.toLocaleString()}</h2>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '1rem' }}>Requested Items</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {request.items?.map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--surface-container-low)', borderRadius: 'var(--radius-sm)' }}>
                    <div>
                      <p style={{ fontWeight: 800, fontSize: '0.875rem' }}>{item.description}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--outline)' }}>Qty: {item.quantity} x RM {item.unit_price?.toLocaleString()}</p>
                    </div>
                    <span style={{ fontWeight: 900, color: 'var(--primary)' }}>RM {item.total_price?.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            {request.status === 'APPROVED' && (
              <div style={{ background: 'var(--secondary-container)', padding: '2rem', borderRadius: 'var(--radius-lg)', marginTop: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <FileText size={20} style={{ color: 'var(--on-secondary-container)' }} />
                  <h4 style={{ fontWeight: 800, color: 'var(--on-secondary-container)' }}>Document Ready for PO</h4>
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--on-secondary-container)', opacity: 0.8, marginBottom: '2rem' }}>Generation will include Sarawak Division digital seals.</p>
                <button onClick={() => handleTransition('PO_ISSUED', 'Generated PO', activeRole)} className="gradient-fill" style={{ width: '100%', padding: '1rem', color: 'white', borderRadius: 'var(--radius-lg)', border: 'none', fontWeight: 900, cursor: 'pointer' }}>
                   Generate & Issue Purchase Order
                </button>
              </div>
            )}
          </div>

          <section>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem' }}>Audit Trail & Timeline</h3>
            <TimelineView auditLogs={auditLogs} />
          </section>
        </div>

        {/* Sidebar Panel */}
        <div style={{ gridColumn: isMobile ? 'auto' : 'span 4', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {canApprove(request.status, activeRole) && (
            <div className="surface-card" style={{ padding: '1.75rem', background: 'var(--surface-container-high)' }}>
               <h4 style={{ fontWeight: 800, marginBottom: '1rem' }}>Verify Compliance</h4>
               <p style={{ fontSize: '0.875rem', color: 'var(--outline)', marginBottom: '1.5rem' }}>Review all attached quotations before final authorization.</p>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <button onClick={() => handleTransition(getNextStatus(request.status), 'Approved', activeRole)} className="gradient-fill" style={{ padding: '0.875rem', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', fontWeight: 800, cursor: 'pointer' }}>
                    Approve Request
                  </button>
                  <button onClick={() => handleTransition('DRAFT', 'Rejected', activeRole)} style={{ padding: '0.875rem', color: 'var(--error)', background: 'var(--error-container)', border: 'none', borderRadius: 'var(--radius-sm)', fontWeight: 800, cursor: 'pointer' }}>
                    Reject & Return
                  </button>
               </div>
            </div>
          )}

          <div className="surface-card" style={{ padding: '1.75rem' }}>
             <h4 style={{ fontWeight: 800, marginBottom: '1.25rem' }}>Attachments</h4>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'var(--surface-container-low)', borderRadius: 'var(--radius-sm)', cursor: 'not-allowed' }}>
                   <FileText size={16} />
                   <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>QUOT_STS_9022.pdf</span>
                </div>
                {request.status === 'PO_ISSUED' && (
                  <button onClick={async () => {
                     const blob = await procurementApi.generatePO(id)
                     const url = URL.createObjectURL(blob)
                     const a = document.createElement('a')
                     a.href = url; a.download = `PO-${id}.pdf`; a.click()
                  }} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'var(--primary-fixed)', color: 'var(--primary)', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 700 }}>
                    <Download size={16} />
                    <span style={{ fontSize: '0.75rem' }}>Purchase Order (Generated)</span>
                  </button>
                )}
             </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default RequestDetails
