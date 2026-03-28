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

      {/* Top Timeline (Mockup style) */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '1rem 0 2.5rem' }}>
        {[
          { label: 'REQUEST CREATED', done: ['SUBMITTED', 'PENDING_MANAGER', 'PENDING_DIRECTOR', 'APPROVED', 'PO_ISSUED', 'PAYMENT_PENDING', 'PAID'].includes(request.status), active: request.status === 'DRAFT' },
          { label: 'APPROVED', done: ['APPROVED', 'PO_ISSUED', 'PAYMENT_PENDING', 'PAID'].includes(request.status), active: ['PENDING_MANAGER', 'PENDING_DIRECTOR'].includes(request.status) },
          { label: 'PO ISSUED', done: ['PO_ISSUED', 'PAYMENT_PENDING', 'PAID'].includes(request.status), active: request.status === 'APPROVED' },
          { label: 'FULFILLMENT', done: ['PAID'].includes(request.status), active: ['PO_ISSUED', 'PAYMENT_PENDING'].includes(request.status) }
        ].map((step, idx, arr) => (
          <React.Fragment key={idx}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: step.done ? 'var(--primary)' : step.active ? 'var(--surface-container-highest)' : 'var(--surface-container-low)',
                color: step.done ? 'white' : step.active ? 'var(--primary)' : 'var(--outline)',
                boxShadow: step.active ? '0 0 0 4px var(--primary-container)' : 'none', border: step.active ? '2px solid var(--primary)' : 'none'
              }}>
                {step.done ? <CheckCircle size={16} /> : <div style={{ width: 8, height: 8, borderRadius: '50%', background: step.active ? 'var(--primary)' : 'var(--outline-variant)' }} />}
              </div>
              <span style={{ fontFamily: 'var(--font-label)', fontSize: '0.625rem', fontWeight: 700, color: step.done || step.active ? 'var(--primary)' : 'var(--outline)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{step.label}</span>
            </div>
            {idx < arr.length - 1 && (
              <div style={{ width: '100px', height: 2, background: arr[idx].done ? 'var(--primary)' : 'var(--outline-variant)', margin: '0 1rem', transform: 'translateY(-12px)' }} />
            )}
          </React.Fragment>
        ))}
      </div>

      {request.status === 'APPROVED' ? (
        /* =========================================================
           GENERATE PO MOCKUP VIEW
           ========================================================= */
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(350px, 1fr) 2fr', gap: '2rem' }}>
          
          {/* Left Column: Actions & Details */}
          <div style={{ background: 'var(--surface-container-lowest)', padding: '2.5rem 2rem', borderRadius: 'var(--radius-sm)', display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ fontFamily: 'var(--font-headline)', fontSize: '2.25rem', fontWeight: 900, color: 'var(--primary)', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: '1rem' }}>
              PO-{new Date().getFullYear()}-SRW-{request.id.toString().padStart(3, '0')}
            </h2>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '3rem' }}>
              <span style={{ background: 'var(--tertiary-container)', color: 'var(--on-tertiary-container)', padding: '0.375rem 0.875rem', borderRadius: 'var(--radius-pill)', fontFamily: 'var(--font-label)', fontSize: '0.625rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Awaiting Generation
              </span>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--outline)' }}>
                Created on {new Date(request.created_at).toLocaleDateString('en-GB', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            
            <p style={{ fontFamily: 'var(--font-label)', fontSize: '0.625rem', color: 'var(--outline)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem', fontWeight: 700 }}>Authorized Total</p>
            <p style={{ fontFamily: 'var(--font-headline)', fontSize: '2.25rem', fontWeight: 900, color: 'var(--primary)', letterSpacing: '-0.02em', marginBottom: '4rem' }}>
              RM {request.total_amount.toLocaleString('en', {minimumFractionDigits: 2})}
            </p>
            
            <h3 style={{ fontFamily: 'var(--font-headline)', fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--on-surface)' }}>Vendor Information</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '4rem' }}>
               <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ width: 40, height: 40, background: 'var(--surface-container-low)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                    <FileText size={18} />
                  </div>
                  <div>
                    <p style={{ fontFamily: 'var(--font-label)', fontSize: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--outline)', fontWeight: 700, marginBottom: '0.25rem' }}>Entity Name</p>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', fontWeight: 600, color: 'var(--on-surface)' }}>{request.vendor_name}</p>
                  </div>
               </div>
               <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ width: 40, height: 40, background: 'var(--surface-container-low)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                    <AlertTriangle size={18} />
                  </div>
                  <div>
                    <p style={{ fontFamily: 'var(--font-label)', fontSize: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--outline)', fontWeight: 700, marginBottom: '0.25rem' }}>Business Address</p>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', fontWeight: 500, color: 'var(--on-surface)', lineHeight: 1.5 }}>Level 4, Wisma Pelita, No. 12 Jalan Simpang Tiga, 93350 Kuching, Sarawak</p>
                  </div>
               </div>
            </div>
            
            <div style={{ marginTop: 'auto' }}>
              <button onClick={() => handleTransition('PO_ISSUED', 'Generated PO', activeRole)} className="gradient-fill" style={{ width: '100%', padding: '1.25rem', color: 'white', borderRadius: 'var(--radius-sm)', border: 'none', fontFamily: 'var(--font-headline)', fontSize: '1.125rem', fontWeight: 800, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem', transition: 'transform 0.15s', boxShadow: '0 8px 20px rgba(0,52,111,0.2)' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'none'}
              >
                  <FileText size={20} /> Generate PO Document
              </button>
              <p style={{ textAlign: 'center', marginTop: '1.25rem', fontFamily: 'var(--font-label)', fontSize: '0.625rem', color: 'var(--outline)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                  Secure digital signature will be applied automatically
              </p>
            </div>
          </div>
          
          {/* Right Column: Live Document Preview */}
          <div style={{ background: 'var(--surface-container-high)', padding: '2rem', borderRadius: 'var(--radius-sm)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
             <div style={{ width: '100%', maxWidth: '700px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <span style={{ fontFamily: 'var(--font-label)', fontSize: '0.75rem', fontWeight: 800, color: 'var(--outline)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Download size={14} /> Live Document Preview
                </span>
             </div>
             
             {/* Virtual A4 Paper */}
             <div style={{ background: 'white', width: '100%', maxWidth: '700px', aspectRatio: '1/1.414', padding: '4rem 3.5rem', boxShadow: '0 20px 40px rgba(0,0,0,0.08)', borderRadius: '2px', display: 'flex', flexDirection: 'column' }}>
                 
                 {/* Header */}
                 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4rem' }}>
                     <div>
                         <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: '2.5rem', fontWeight: 900, color: 'var(--primary)', letterSpacing: '-0.02em', lineHeight: 1 }}>{request.company?.name || 'LEDGEROCK'}</h1>
                         <p style={{ fontFamily: 'var(--font-label)', fontSize: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--outline)', marginTop: '0.75rem', fontWeight: 700 }}>Analytical<br/>Laboratory Systems</p>
                     </div>
                     <div style={{ textAlign: 'right' }}>
                         <h2 style={{ fontFamily: 'var(--font-headline)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--on-surface)', letterSpacing: '0.04em' }}>PURCHASE ORDER</h2>
                         <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--outline)', marginTop: '0.5rem' }}># PO-{new Date().getFullYear()}-SRW-{request.id.toString().padStart(3, '0')}</p>
                     </div>
                 </div>
                 
                 {/* Addresses */}
                 <div style={{ display: 'flex', gap: '4rem', marginBottom: '4rem' }}>
                   <div style={{ flex: 1 }}>
                     <p style={{ fontFamily: 'var(--font-label)', fontSize: '0.5625rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>Bill To</p>
                     <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', fontWeight: 700, color: 'var(--on-surface)', marginBottom: '0.25rem' }}>{request.company?.name || 'LedgerRock'} HQ</p>
                     <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--outline)', lineHeight: 1.6 }}>Lot 88, Sarawak<br/>Higher Education Park<br/>Jalan Stadium,<br/>93050 Kuching</p>
                   </div>
                   <div style={{ flex: 1 }}>
                     <p style={{ fontFamily: 'var(--font-label)', fontSize: '0.5625rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>Ship To</p>
                     <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', fontWeight: 700, color: 'var(--on-surface)', marginBottom: '0.25rem' }}>{request.company?.name || 'LedgerRock'} Lab Complex B</p>
                     <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--outline)', lineHeight: 1.6 }}>Receiving Bay 02,<br/>Ground Floor<br/>Demak Laut Industrial Estate,<br/>Sarawak</p>
                   </div>
                 </div>

                 {/* Table */}
                 <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '3rem' }}>
                   <thead>
                     <tr style={{ borderBottom: '2px solid rgba(194,198,211,0.3)' }}>
                       <th style={{ fontFamily: 'var(--font-label)', fontSize: '0.5625rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0.75rem 0', textAlign: 'left', width: '60%' }}>No. Item Description</th>
                       <th style={{ fontFamily: 'var(--font-label)', fontSize: '0.5625rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0.75rem 0', textAlign: 'center', width: '15%' }}>Qty</th>
                       <th style={{ fontFamily: 'var(--font-label)', fontSize: '0.5625rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0.75rem 0', textAlign: 'right', width: '25%' }}>Unit Price (RM)</th>
                     </tr>
                   </thead>
                   <tbody>
                     {request.items && request.items.length > 0 ? request.items.map((item, i) => (
                       <tr key={i} style={{ borderBottom: '1px solid rgba(194,198,211,0.2)' }}>
                         <td style={{ padding: '1rem 0', display: 'flex', gap: '1rem' }}>
                           <span style={{ color: 'var(--outline-variant)', fontFamily: 'var(--font-body)', fontSize: '0.875rem' }}>{(i+1).toString().padStart(2, '0')}</span>
                           <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', fontWeight: 600, color: 'var(--on-surface)' }}>{item.description}</span>
                         </td>
                         <td style={{ padding: '1rem 0', textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: '0.875rem' }}>{item.quantity.toString().padStart(2, '0')}</td>
                         <td style={{ padding: '1rem 0', textAlign: 'right', fontFamily: 'var(--font-body)', fontSize: '0.875rem' }}>{item.unit_price?.toLocaleString('en', {minimumFractionDigits: 2})}</td>
                       </tr>
                     )) : (
                       <tr style={{ borderBottom: '1px solid rgba(194,198,211,0.2)' }}>
                         <td style={{ padding: '1rem 0', display: 'flex', gap: '1rem' }}>
                           <span style={{ color: 'var(--outline-variant)', fontFamily: 'var(--font-body)', fontSize: '0.875rem' }}>01</span>
                           <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', fontWeight: 600, color: 'var(--on-surface)' }}>{request.title}</span>
                         </td>
                         <td style={{ padding: '1rem 0', textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: '0.875rem' }}>01</td>
                         <td style={{ padding: '1rem 0', textAlign: 'right', fontFamily: 'var(--font-body)', fontSize: '0.875rem' }}>{request.total_amount.toLocaleString('en', {minimumFractionDigits: 2})}</td>
                       </tr>
                     )}
                   </tbody>
                 </table>
                 
                 {/* Totals */}
                 <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'auto' }}>
                   <div style={{ width: '250px' }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                       <span style={{ fontFamily: 'var(--font-label)', fontSize: '0.75rem', color: 'var(--outline)', fontWeight: 600 }}>Subtotal</span>
                       <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', fontWeight: 600 }}>RM {request.total_amount.toLocaleString('en', {minimumFractionDigits: 2})}</span>
                     </div>
                     <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '2px solid rgba(194,198,211,0.5)', paddingBottom: '1rem' }}>
                       <span style={{ fontFamily: 'var(--font-label)', fontSize: '0.75rem', color: 'var(--outline)', fontWeight: 600 }}>Tax (0%)</span>
                       <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', fontWeight: 600 }}>RM 0.00</span>
                     </div>
                     <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                       <span style={{ fontFamily: 'var(--font-headline)', fontSize: '1rem', color: 'var(--on-surface)', fontWeight: 800 }}>Total</span>
                       <span style={{ fontFamily: 'var(--font-headline)', fontSize: '1rem', fontWeight: 900 }}>RM {request.total_amount.toLocaleString('en', {minimumFractionDigits: 2})}</span>
                     </div>
                   </div>
                 </div>

             </div>
             
             {/* Small audit trail directly below preview */}
             <div style={{ width: '100%', maxWidth: '700px', marginTop: '1.5rem', background: 'var(--surface-container-lowest)', padding: '1.5rem', borderRadius: 'var(--radius-sm)' }}>
                <p style={{ fontFamily: 'var(--font-label)', fontSize: '0.625rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle size={12} /> Approval Audit Trail
                </p>
                {auditLogs.filter(a => a.to_status === 'APPROVED' || a.action?.includes('Approve')).slice(-2).map((log, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--surface-container-low)', borderRadius: 'var(--radius-sm)', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <CheckCircle size={14} style={{ color: 'var(--primary)' }} />
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', fontWeight: 600 }}>{log.user_role} Approved</span>
                    </div>
                    <span style={{ fontFamily: 'var(--font-label)', fontSize: '0.625rem', color: 'var(--outline)' }}>{new Date(log.timestamp).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                ))}
             </div>
          </div>
          
        </div>
      ) : (
        /* =========================================================
           STANDARD REQUEST DETAILS VIEW
           ========================================================= */
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

      )}

      {/* Audit Trail */}
      {request.status !== 'APPROVED' && (
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <h3 style={{ fontFamily: 'var(--font-headline)', fontSize: '1.375rem', fontWeight: 700, marginBottom: '1rem' }}>Audit Trail</h3>
          <TimelineView auditLogs={auditLogs} />
        </motion.section>
      )}
    </div>
  )
}

export default RequestDetails
