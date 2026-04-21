import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Upload, Send, CheckCircle2, ChevronDown, Info, ArrowLeft, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useCompany } from '../App'
import { procurementApi } from '../services/api'

const PaymentRequest = () => {
  const navigate = useNavigate()
  const { isMobile, activeRole } = useCompany()
  const fileInputRef = useRef(null)
  const [poRequests, setPoRequests] = useState([])
  const [loadingPos, setLoadingPos] = useState(true)
  const [form, setForm] = useState({
    poId: '',
    invoiceNumber: '',
    amount: ''
  })
  const [invoiceFile, setInvoiceFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    const loadPOs = async () => {
      try {
        const res = await procurementApi.getRequests()
        const all = res.items || []
        const issued = all.filter(r => r.status === 'PO_ISSUED')
        setPoRequests(issued)
        if (issued.length > 0) setForm(f => ({ ...f, poId: String(issued[0].id) }))
      } catch (err) {
        console.error('Failed to load POs', err)
      } finally {
        setLoadingPos(false)
      }
    }
    loadPOs()
  }, [])

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) setInvoiceFile(file)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.poId) return alert('No PO selected.')
    setSubmitting(true)
    try {
      // Upload invoice file if provided
      if (invoiceFile) {
        setUploading(true)
        const result = await procurementApi.uploadFile(invoiceFile)
        await procurementApi.updateRequest(form.poId, {
          quotation_url: result.url,
          comments: form.invoiceNumber ? `Invoice: ${form.invoiceNumber}` : undefined
        })
        setUploading(false)
      } else if (form.invoiceNumber) {
        await procurementApi.updateRequest(form.poId, {
          comments: `Invoice: ${form.invoiceNumber}`
        })
      }
      // Transition PO_ISSUED → PAYMENT_PENDING
      await procurementApi.transitionStatus(form.poId)
      navigate('/approvals')
    } catch (err) {
      alert('Submission failed: ' + err.message)
    } finally {
      setSubmitting(false)
      setUploading(false)
    }
  }

  const selectedPO = poRequests.find(r => String(r.id) === form.poId)

  if (activeRole !== 'FINANCE' && activeRole !== 'GLOBAL_ADMIN') {
    return (
      <div style={{ padding: '5rem', textAlign: 'center', fontWeight: 700, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        <h2 style={{ fontFamily: 'var(--font-headline)', color: 'var(--error)' }}>Finance Authorization Required</h2>
        <p style={{ color: 'var(--outline)' }}>Your current role ({activeRole?.replace('_', ' ') || 'Unknown'}) is not authorized to submit payment requests.</p>
        <button onClick={() => navigate(-1)} style={{ padding: '0.75rem 2rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', fontWeight: 800, cursor: 'pointer', marginTop: '1rem' }}>Return to Safety</button>
      </div>
    )
  }

  const S = {
    label: { fontSize: '0.625rem', fontWeight: 800, color: 'var(--outline)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '0.75rem' },
    input: { width: '100%', paddingBottom: '0.5rem', background: 'transparent', border: 'none', borderBottom: '2px solid var(--outline-variant)', fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)', outline: 'none', transition: 'border-color 0.2s' },
    focus: (e) => e.target.style.borderBottomColor = 'var(--primary)',
    blur: (e) => e.target.style.borderBottomColor = 'var(--outline-variant)'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '1.5rem' : '3rem', maxWidth: '64rem', margin: '0 auto', paddingBottom: '6rem' }}>

      {/* Header */}
      <div>
        <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: 'var(--outline)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', marginBottom: '1.5rem' }}>
          <ArrowLeft size={16} /> BACK
        </button>
        <h2 style={{ fontFamily: 'var(--font-headline)', fontSize: isMobile ? '1.75rem' : '2.5rem', fontWeight: 900, color: 'var(--primary)', marginBottom: '0.5rem' }}>Submit Payment Request</h2>
        <p style={{ fontSize: '1rem', color: 'var(--outline-variant)' }}>Upload invoice and confirm disbursement details.</p>
      </div>

      {/* Progress Tracker */}
      <section style={{
        display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', gap: '1.5rem',
        background: 'var(--surface-container-lowest)', padding: '1.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(194,198,211,0.2)'
      }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '1rem' }}>
           <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={16} />
           </div>
           <div>
              <p style={{ fontSize: '0.625rem', fontWeight: 900, textTransform: 'uppercase', opacity: 0.6 }}>Phase 01</p>
              <p style={{ fontSize: '0.875rem', fontWeight: 800 }}>Order Validated</p>
           </div>
        </div>
        {!isMobile && <div style={{ width: '2rem', height: '1px', borderTop: '2px dotted var(--outline-variant)' }}></div>}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '1rem' }}>
           <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)' }} />
           </div>
           <div>
              <p style={{ fontSize: '0.625rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--primary)' }}>Phase 02</p>
              <p style={{ fontSize: '0.875rem', fontWeight: 800 }}>Invoice Upload</p>
           </div>
        </div>
      </section>

      {/* Grid Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '7fr 5fr', gap: '2.5rem', alignItems: 'start' }}>

        {/* Form Container */}
        <div style={{ background: 'var(--surface-container-lowest)', padding: isMobile ? '1.5rem' : '2.5rem', borderRadius: 'var(--radius-sm)', boxShadow: '0 20px 60px rgba(0,52,111,0.05)', borderLeft: isMobile ? 'none' : '4px solid var(--primary)', borderTop: isMobile ? '4px solid var(--primary)' : 'none' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            <div style={{ position: 'relative' }}>
              <label style={S.label}>Purchase Order Reference</label>
              {loadingPos ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--outline)', fontSize: '0.875rem' }}>
                  <Loader2 size={16} className="animate-spin" /> Loading issued POs...
                </div>
              ) : poRequests.length === 0 ? (
                <p style={{ color: 'var(--outline)', fontSize: '0.875rem', fontWeight: 700 }}>No POs in PO_ISSUED status available for payment.</p>
              ) : (
                <>
                  <select style={S.input} value={form.poId} onChange={e => setForm({...form, poId: e.target.value})} onFocus={S.focus} onBlur={S.blur} required>
                    {poRequests.map(r => (
                      <option key={r.id} value={r.id}>
                        SEQ-{r.id} — {r.title} (RM {r.total_amount?.toLocaleString()})
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={20} style={{ position: 'absolute', right: 0, bottom: 12, color: 'var(--outline-variant)' }} />
                </>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '2.5rem' }}>
              <div>
                <label style={S.label}>Invoice Number</label>
                <input type="text" placeholder="INV-XXXXX" style={S.input} value={form.invoiceNumber} onChange={e => setForm({...form, invoiceNumber: e.target.value})} onFocus={S.focus} onBlur={S.blur} required />
              </div>
              <div>
                <label style={S.label}>Payment Amount (RM)</label>
                <input
                  type="number" placeholder="0.00" style={S.input}
                  value={form.amount || (selectedPO?.total_amount ?? '')}
                  onChange={e => setForm({...form, amount: e.target.value})}
                  onFocus={S.focus} onBlur={S.blur} required
                />
              </div>
            </div>

            <div>
              <label style={S.label}>Upload Invoice</label>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept=".pdf,image/*" />
              <div
                onClick={() => fileInputRef.current.click()}
                style={{ border: '2px dashed var(--outline-variant)', borderRadius: '1rem', padding: isMobile ? '2rem' : '4rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', background: 'var(--surface-container-low)', cursor: 'pointer' }}
              >
                <Upload size={40} style={{ color: 'var(--primary)' }} />
                <div style={{ textAlign: 'center' }}>
                  {invoiceFile ? (
                    <p style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--primary)' }}>{invoiceFile.name}</p>
                  ) : (
                    <>
                      <p style={{ fontWeight: 800, fontSize: '1rem' }}>Drag or Tap to Upload</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--outline-variant)' }}>PDF, JPG approved (Max 12MB)</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            <button
              disabled={submitting || loadingPos || poRequests.length === 0}
              type="submit"
              className="gradient-fill"
              style={{ width: '100%', padding: '1.25rem', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', fontWeight: 900, textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', opacity: (submitting || loadingPos || poRequests.length === 0) ? 0.7 : 1, cursor: (submitting || loadingPos || poRequests.length === 0) ? 'not-allowed' : 'pointer' }}
            >
              {uploading ? 'Uploading...' : submitting ? 'Submitting...' : 'Submit for Payment'}
              {submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </form>
        </div>

        {/* Sidebar Context */}
        {!isMobile && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ background: 'var(--surface-container-low)', padding: '2rem', borderRadius: 'var(--radius-lg)', borderTop: '4px solid var(--tertiary)' }}>
              <h3 style={{ fontSize: '0.625rem', fontWeight: 900, color: 'var(--tertiary)', textTransform: 'uppercase', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Info size={14} /> Compliance Status
              </h3>
              {selectedPO ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                    <span style={{ color: 'var(--outline)', fontWeight: 700 }}>Vendor</span>
                    <span style={{ fontWeight: 800 }}>{selectedPO.vendor_name}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                    <span style={{ color: 'var(--outline)', fontWeight: 700 }}>Amount</span>
                    <span style={{ fontWeight: 900, color: 'var(--primary)' }}>RM {selectedPO.total_amount?.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                    <span style={{ color: 'var(--outline)', fontWeight: 700 }}>Status</span>
                    <span style={{ fontWeight: 800, color: 'var(--tertiary)' }}>{selectedPO.status}</span>
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: '0.875rem', color: 'var(--outline)' }}>Select a PO to view details.</p>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

export default PaymentRequest
