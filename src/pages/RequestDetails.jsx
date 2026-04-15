import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, CheckCircle, XCircle, FileText, Download, AlertTriangle, ChevronRight, ExternalLink, Plus, Loader2, X, Ban } from 'lucide-react'
import { procurementApi } from '../services/api'
import TimelineView from '../components/TimelineView'
import { useCompany, getStatusChipClass } from '../App'

const WORKFLOW_STEPS = [
  { status: 'SUBMITTED', label: 'Submitted', icon: FileText },
  { status: 'PENDING_MANAGER', label: 'Manager Review', icon: CheckCircle },
  { status: 'PENDING_DIRECTOR', label: 'Director Review', icon: CheckCircle },
  { status: 'APPROVED', label: 'Approved', icon: CheckCircle },
  { status: 'PO_ISSUED', label: 'PO Issued', icon: FileText },
  { status: 'PAYMENT_PENDING', label: 'Payment Pending', icon: CheckCircle },
  { status: 'PAID', label: 'Paid', icon: CheckCircle },
]

const STATUS_ORDER = {
  'DRAFT': -1,
  'SUBMITTED': 0,
  'PENDING_MANAGER': 1,
  'PENDING_DIRECTOR': 2,
  'APPROVED': 3,
  'PO_ISSUED': 4,
  'PAYMENT_PENDING': 5,
  'PAID': 6,
}

const RequestDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { activeRole, isMobile, userName } = useCompany()
  const [request, setRequest] = useState(null)
  const [auditLogs, setAuditLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [transitioning, setTransitioning] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectNotes, setRejectNotes] = useState('')
  const fileInputRef = useRef(null)

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

  const handleTransition = async (action, newStatus, notes) => {
    setTransitioning(newStatus)
    try {
      await procurementApi.transitionStatus(id, action, notes)
      fetchData()
    } catch (err) { alert(err.message) }
    finally { setTransitioning(null) }
  }

  const handleReject = () => {
    if (!rejectNotes.trim()) {
      alert('Please provide a reason for rejection.')
      return
    }
    handleTransition('Rejected', 'DRAFT', rejectNotes)
    setShowRejectModal(false)
    setRejectNotes('')
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setUploading(true)
    try {
      const result = await procurementApi.uploadFile(file)
      await procurementApi.updateRequest(id, { quotation_url: result.url })
      fetchData()
    } catch (err) {
      alert("Failed to upload quotation: " + err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleCancel = async () => {
    if (!window.confirm('Withdraw this request? It will be returned to Draft status.')) return
    handleTransition('Withdrawn by requester', 'DRAFT', 'Withdrawn by requester')
  }

  if (loading) return (
    <div style={{ padding: '5rem', textAlign: 'center', fontWeight: 700, fontSize: '1.125rem' }} className="animate-pulse">
      Loading Request...
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
    if (status === 'SUBMITTED' && ['MANAGER', 'DIRECTOR', 'ADMIN'].includes(role)) return true
    return false
  }

  const canCancel = (status, role) => {
    return role === 'REQUESTER' && ['SUBMITTED', 'PENDING_MANAGER', 'PENDING_DIRECTOR'].includes(status)
  }

  const getNextStatus = (current) => {
    const flow = {
      'SUBMITTED': 'PENDING_MANAGER',
      'PENDING_MANAGER': 'APPROVED',
      'PENDING_DIRECTOR': 'APPROVED',
      'APPROVED': 'PO_ISSUED',
      'PO_ISSUED': 'PAYMENT_PENDING',
      'PAYMENT_PENDING': 'PAID',
    }
    return flow[current] || current
  }

  // Compute workflow progress for the stepper
  const currentStepIdx = STATUS_ORDER[request.status] ?? 0
  const isRejected = request.status === 'DRAFT'

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

      {/* Visual Workflow Stepper */}
      <div className="surface-card" style={{ padding: isMobile ? '1.25rem' : '2rem' }}>
        <h3 style={{ fontSize: '0.625rem', fontWeight: 900, color: 'var(--outline)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1.5rem' }}>Approval Workflow</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, overflowX: 'auto', paddingBottom: '0.5rem' }}>
          {WORKFLOW_STEPS.map((step, idx) => {
            const stepStatus = STATUS_ORDER[step.status]
            const isComplete = stepStatus <= currentStepIdx && !isRejected
            const isCurrent = stepStatus === currentStepIdx
            const isFuture = stepStatus > currentStepIdx
            const isPast = stepStatus < currentStepIdx

            return (
              <React.Fragment key={step.status}>
                {/* Connector */}
                {idx > 0 && (
                  <div style={{
                    flex: 1, minWidth: 20, height: 2,
                    background: isComplete ? 'var(--primary)' : 'var(--outline-variant)',
                    opacity: isComplete ? 1 : 0.3,
                    marginBottom: 20
                  }} />
                )}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 80, flex: 1 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isComplete ? 'var(--primary)' : isCurrent ? 'var(--surface-container-lowest)' : 'var(--surface-container-low)',
                    border: isCurrent ? '3px solid var(--primary)' : isComplete ? 'none' : '2px solid var(--outline-variant)',
                    color: isComplete ? 'white' : isCurrent ? 'var(--primary)' : 'var(--outline-variant)',
                    transition: 'all 0.3s ease'
                  }}>
                    <step.icon size={16} />
                  </div>
                  <span style={{
                    fontSize: '0.625rem', fontWeight: isCurrent ? 800 : 600,
                    color: isComplete ? 'var(--primary)' : isCurrent ? 'var(--on-surface)' : 'var(--outline-variant)',
                    textAlign: 'center', marginTop: 8, lineHeight: 1.2
                  }}>
                    {step.label}
                  </span>
                </div>
              </React.Fragment>
            )
          })}
        </div>
        {isRejected && (
          <div style={{ marginTop: '1rem', padding: '1.25rem', background: 'var(--error-container)', border: '1px solid var(--error)', borderRadius: 'var(--radius-sm)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <XCircle size={18} style={{ color: 'var(--error)' }} />
              <span style={{ fontSize: '0.875rem', fontWeight: 900, color: 'var(--error)', textTransform: 'uppercase' }}>
                Request Returned to Draft
              </span>
            </div>
            {request.rejection_reason && (
              <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.4)', borderRadius: 'var(--radius-xs)', fontSize: '0.875rem', color: 'var(--error)', fontStyle: 'italic', fontWeight: 600 }}>
                "{request.rejection_reason}"
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(12, 1fr)', gap: isMobile ? '1.5rem' : '2.5rem' }}>

        {/* Main Details Panel */}
        <div style={{ gridColumn: isMobile ? 'auto' : 'span 8', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

          <div className="surface-card" style={{ padding: isMobile ? '1.5rem' : '2.5rem' }}>
            <div style={{ marginBottom: '2.5rem' }}>
              <p style={{ fontSize: '0.625rem', fontWeight: 800, color: 'var(--outline)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>Total Amount</p>
              <h2 style={{ fontFamily: 'var(--font-headline)', fontSize: '2.5rem', fontWeight: 900, color: 'var(--primary)' }}>RM {request.total_amount?.toLocaleString()}</h2>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '1rem' }}>Requested Items</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {request.items?.map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--surface-container-low)', borderRadius: 'var(--radius-sm)' }}>
                    <div>
                      <p style={{ fontWeight: 800, fontSize: '0.875rem' }}>{item.description}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--outline)' }}>{item.quantity} {item.uom || 'PCS'} x RM {item.unit_price?.toLocaleString()}</p>
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
                <p style={{ fontSize: '0.875rem', color: 'var(--on-secondary-container)', opacity: 0.8, marginBottom: '2rem' }}>Generation will include company digital signatures.</p>
                <button onClick={() => handleTransition('Generated PO', 'PO_ISSUED')} className="gradient-fill" style={{ width: '100%', padding: '1rem', color: 'white', borderRadius: 'var(--radius-lg)', border: 'none', fontWeight: 900, cursor: 'pointer' }}>
                  Generate & Issue Purchase Order
                </button>
              </div>
            )}
          </div>

          <section>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem' }}>History & Timeline</h3>
            <TimelineView auditLogs={auditLogs} />
          </section>
        </div>

        {/* Sidebar Panel */}
        <div style={{ gridColumn: isMobile ? 'auto' : 'span 4', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

          {/* Rejection Reason Modal */}
          <AnimatePresence>
            {showRejectModal && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ position: 'fixed', inset: 0, background: 'rgba(25,28,30,0.5)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
                onClick={() => setShowRejectModal(false)}
              >
                <motion.div
                  initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                  onClick={e => e.stopPropagation()}
                  style={{ background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-lg)', padding: '2rem', maxWidth: '480px', width: '100%', boxShadow: '0 40px 80px rgba(0,0,0,0.2)' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <XCircle size={24} style={{ color: 'var(--error)' }} />
                      <h3 style={{ fontSize: '1.125rem', fontWeight: 800 }}>Reject Request</h3>
                    </div>
                    <button onClick={() => setShowRejectModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--outline)' }}>
                      <X size={20} />
                    </button>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--outline)', marginBottom: '1.5rem' }}>
                    Provide a reason for returning this request to Draft. The requester will be notified.
                  </p>
                  <textarea
                    value={rejectNotes}
                    onChange={e => setRejectNotes(e.target.value)}
                    placeholder="e.g. Missing quotation document, incorrect vendor, amount exceeds budget..."
                    style={{
                      width: '100%', minHeight: 120, padding: '1rem', background: 'var(--surface-container-low)',
                      border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-sm)',
                      fontSize: '0.875rem', fontFamily: 'inherit', outline: 'none', resize: 'vertical',
                      marginBottom: '1.5rem'
                    }}
                  />
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button onClick={() => setShowRejectModal(false)} style={{ flex: 1, padding: '0.875rem', background: 'var(--surface-container-high)', border: 'none', borderRadius: 'var(--radius-sm)', fontWeight: 800, cursor: 'pointer' }}>
                      Cancel
                    </button>
                    <button onClick={handleReject} style={{ flex: 1, padding: '0.875rem', background: 'var(--error)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                      <XCircle size={16} /> Confirm Rejection
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {canApprove(request.status, activeRole) && (
            <div className="surface-card" style={{ padding: '1.75rem', background: 'var(--surface-container-high)' }}>
              <h4 style={{ fontWeight: 800, marginBottom: '1rem' }}>Review Request</h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--outline)', marginBottom: '1.5rem' }}>Review all attached quotations before final approval.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <button
                  onClick={() => handleTransition('Approved', getNextStatus(request.status))}
                  disabled={transitioning === getNextStatus(request.status)}
                  className="gradient-fill"
                  style={{ padding: '0.875rem', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', fontWeight: 800, cursor: 'pointer', opacity: transitioning === getNextStatus(request.status) ? 0.6 : 1 }}
                >
                  {transitioning === getNextStatus(request.status) ? (
                    <><Loader2 size={16} className="animate-spin" /> Processing...</>
                  ) : 'Approve Request'}
                </button>
                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={transitioning === 'DRAFT'}
                  style={{ padding: '0.875rem', color: 'var(--error)', background: 'var(--error-container)', border: 'none', borderRadius: 'var(--radius-sm)', fontWeight: 800, cursor: 'pointer', opacity: transitioning === 'DRAFT' ? 0.6 : 1 }}
                >
                  Reject & Return
                </button>
              </div>
            </div>
          )}

          {/* Requester Cancel */}
          {canCancel(request.status, activeRole) && (
            <div className="surface-card" style={{ padding: '1.75rem', background: 'var(--surface-container-high)', border: '1px solid var(--warning-container)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <Ban size={18} style={{ color: 'var(--warning)' }} />
                <h4 style={{ fontWeight: 800 }}>Withdraw Request</h4>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--outline)', marginBottom: '1rem' }}>
                You can withdraw this request while it's pending. It will return to Draft status.
              </p>
              <button
                onClick={handleCancel}
                disabled={transitioning === 'DRAFT'}
                style={{ width: '100%', padding: '0.875rem', color: 'var(--warning)', background: 'var(--warning-container)', border: 'none', borderRadius: 'var(--radius-sm)', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: transitioning === 'DRAFT' ? 0.6 : 1 }}
              >
                <Ban size={16} />
                {transitioning === 'DRAFT' ? 'Withdrawing...' : 'Withdraw Request'}
              </button>
            </div>
          )}

          <div className="surface-card" style={{ padding: '1.75rem' }}>
            <h4 style={{ fontWeight: 800, marginBottom: '1.25rem' }}>Attachments & Quotations</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} accept=".pdf,image/*" />

              {request.quotation_url ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <a
                    href={request.quotation_url.startsWith('http') ? request.quotation_url : `${import.meta.env.VITE_API_URL || "http://localhost:8000"}${request.quotation_url}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem',
                      background: 'var(--secondary-container)', color: 'var(--on-secondary-container)',
                      borderRadius: 'var(--radius-sm)', textDecoration: 'none', fontWeight: 800, fontSize: '0.875rem'
                    }}
                  >
                    <FileText size={18} />
                    View Supplier Quotation
                    <ExternalLink size={14} style={{ marginLeft: 'auto' }} />
                  </a>
                  <button
                    onClick={() => fileInputRef.current.click()}
                    disabled={uploading}
                    style={{
                      fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)',
                      background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                      padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px'
                    }}
                  >
                    {uploading ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                    Replace Document
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current.click()}
                  disabled={uploading}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '1rem', background: 'var(--surface-container-low)',
                    borderRadius: 'var(--radius-sm)', border: '2px dashed var(--outline-variant)',
                    color: 'var(--primary)', cursor: 'pointer', textAlign: 'left',
                    transition: 'all 0.2s'
                  }}
                >
                  {uploading ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <Plus size={18} />
                  )}
                  <span style={{ fontSize: '0.875rem', fontWeight: 700 }}>
                    {uploading ? "Uploading..." : "Add Quotation Document"}
                  </span>
                </button>
              )}

              {request.status === 'PO_ISSUED' && (
                <button onClick={async () => {
                  const blob = await procurementApi.generatePO(id)
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url; a.download = `PO-${id}.pdf`; a.click()
                }} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', background: 'var(--primary-fixed)', color: 'var(--primary)', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 800 }}>
                  <Download size={18} />
                  <span style={{ fontSize: '0.875rem' }}>Final Purchase Order</span>
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
