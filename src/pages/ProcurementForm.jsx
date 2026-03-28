import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Trash2, Send, Save, ArrowLeft, Upload, FileText, Verified, Banknote, Truck, Info, CheckCircle2, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { procurementApi } from '../services/api'

/* ─────────────────────────────────────────────────────
   ProcurementForm — synced with Stitch "New Request" screen
   7-5 layout, Progress tracker, Draft mode badge
   ───────────────────────────────────────────────────── */

const ProcurementForm = () => {
  const navigate = useNavigate()
  const [vendor, setVendor] = useState({ name: '', id: '' })
  const [items, setItems] = useState([{ description: '', quantity: 1, unitPrice: 0 }])
  const [submitting, setSubmitting] = useState(false)

  const addItem = () => setItems([...items, { description: '', quantity: 1, unitPrice: 0 }])
  const removeItem = (index) => setItems(items.filter((_, i) => i !== index))

  const handleItemChange = (index, field, value) => {
    const newItems = [...items]
    newItems[index][field] = value
    setItems(newItems)
  }

  const calculateTotal = () => items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0)

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const total = calculateTotal()
      const requestData = {
        title: items[0].description || "Untitled Procurement",
        vendor_name: vendor.name,
        vendor_id: vendor.id,
        total_amount: total,
        items: items.map(i => ({
          description: i.description,
          quantity: i.quantity,
          unit_price: i.unitPrice,
          total_price: i.quantity * i.unitPrice
        }))
      }
      const res = await procurementApi.createRequest(requestData)
      await procurementApi.transitionStatus(res.id, 'PENDING_MANAGER', 'System', 'REQUESTER')
      navigate(`/request/${res.id}`)
    } catch (err) {
      alert(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const S = {
    label: { fontFamily: 'var(--font-label)', fontSize: '0.625rem', fontWeight: 700, color: 'var(--outline)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '1rem' },
    input: { width: '100%', paddingBottom: '0.5rem', background: 'transparent', border: 'none', borderBottom: '2px solid var(--outline-variant)', fontFamily: 'var(--font-headline)', fontSize: '1rem', fontWeight: 700, color: 'var(--on-surface)', outline: 'none', transition: 'border-color 0.2s' },
    focus: (e) => e.target.style.borderBottomColor = 'var(--primary)',
    blur: (e) => e.target.style.borderBottomColor = 'var(--outline-variant)'
  }

  return (
    <div style={{ maxWidth: '64rem', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '3rem', paddingBottom: '6rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '1.5rem', flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
            <button onClick={() => navigate('/')} style={{ padding: '0.5rem', borderRadius: 'var(--radius-pill)', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--primary)', transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-container-high)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <ArrowLeft size={20} />
            </button>
            <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--primary)', margin: 0 }}>New Request</h1>
          </div>
          <p style={{ fontFamily: 'var(--font-label)', fontSize: '0.875rem', fontWeight: 700, color: 'var(--outline)', textTransform: 'uppercase', letterSpacing: '0.06em', marginLeft: '3.5rem' }}>PR-2026-SRW-{String(Date.now()).slice(-3)}</p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'var(--secondary-container)', borderRadius: 'var(--radius-pill)', color: 'var(--on-secondary-container)', fontFamily: 'var(--font-label)', fontSize: '0.625rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em' }}>
          <FileText size={14} />
          Draft Mode
        </div>
      </div>

      {/* Progress Tracker */}
      <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: '56rem', margin: '0 auto', padding: '3rem 0' }}>
        <div style={{ position: 'absolute', top: '50%', left: 0, width: '100%', height: '1px', borderTop: '1px dashed var(--outline-variant)', transform: 'translateY(-50%)', zIndex: 0 }}></div>
        
        {[
          { label: 'Request Creation', icon: FileText, active: true },
          { label: 'Manager Review', icon: Verified, active: false },
          { label: 'Finance Approval', icon: Banknote, active: false },
          { label: 'Fulfillment', icon: Truck, active: false }
        ].map((step, i) => (
          <div key={i} style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.5s',
              background: step.active ? 'var(--surface-container-lowest)' : 'var(--surface-container-low)',
              boxShadow: step.active ? '0 0 0 4px rgba(0,52,111,0.1)' : 'none',
              border: step.active ? '2px solid var(--primary)' : '1px solid var(--outline-variant)',
              color: step.active ? 'var(--primary)' : 'var(--outline)'
            }}>
              <step.icon size={20} />
            </div>
            <span style={{ fontFamily: 'var(--font-label)', fontSize: '0.625rem', fontWeight: 700, textAlign: 'center', maxWidth: 80, textTransform: 'uppercase', letterSpacing: '0.06em', color: step.active ? 'var(--primary)' : 'var(--outline)' }}>
              {step.label}
            </span>
          </div>
        ))}
      </div>

      {/* Grid Layout (7-5 split) */}
      <div style={{ display: 'grid', gridTemplateColumns: '7fr 5fr', gap: '2.5rem', alignItems: 'start' }}>
        
        {/* Main form card (7 Col) */}
        <div style={{ background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-sm)', boxShadow: '0 20px 40px rgba(25,28,30,0.05)', padding: '3rem', borderLeft: '4px solid var(--primary)' }}>
          <h2 style={{ fontFamily: 'var(--font-headline)', fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--primary)' }}>Item Information</h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--on-surface-variant)', marginBottom: '3rem' }}>Provide specific details regarding the laboratory supplies or equipment required.</p>

          {/* Vendor fields */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', marginBottom: '3rem' }}>
            <div>
              <label style={S.label}>Vendor Name</label>
              <input type="text" placeholder="e.g. Sarawak Tech Solutions" value={vendor.name}
                onChange={e => setVendor({...vendor, name: e.target.value})}
                style={S.input} onFocus={S.focus} onBlur={S.blur} />
            </div>
            <div>
              <label style={S.label}>Vendor Code / ID</label>
              <input type="text" placeholder="STS-99XX-SWK" value={vendor.id}
                onChange={e => setVendor({...vendor, id: e.target.value})}
                style={S.input} onFocus={S.focus} onBlur={S.blur} />
            </div>
          </div>

          {/* Line Items */}
          <div style={{ marginBottom: '3rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <label style={{ ...S.label, marginBottom: 0 }}>Line Items</label>
              <button onClick={addItem} style={{
                fontFamily: 'var(--font-label)', fontSize: '0.75rem', fontWeight: 700,
                color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '0.25rem'
              }}>
                <Plus size={14} /> Add Item
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {items.map((item, i) => (
                <motion.div
                  key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  style={{
                    display: 'grid', gridTemplateColumns: '5fr 2fr 2fr 2fr auto',
                    gap: '1rem', alignItems: 'end', padding: '1.25rem',
                    background: i % 2 === 0 ? 'var(--surface-container-low)' : 'transparent',
                    borderRadius: 'var(--radius-sm)', transition: 'background 0.15s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-container-high)'}
                  onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'var(--surface-container-low)' : 'transparent'}
                >
                  <div>
                    <label style={{ ...S.label, fontSize: '0.5625rem' }}>Description</label>
                    <input type="text" value={item.description}
                      onChange={e => handleItemChange(i, 'description', e.target.value)}
                      style={{ ...S.input, fontSize: '0.875rem' }} onFocus={S.focus} onBlur={S.blur} />
                  </div>
                  <div>
                    <label style={{ ...S.label, fontSize: '0.5625rem' }}>Qty</label>
                    <input type="number" value={item.quantity}
                      onChange={e => handleItemChange(i, 'quantity', parseInt(e.target.value) || 0)}
                      style={{ ...S.input, fontSize: '0.875rem', textAlign: 'center' }} onFocus={S.focus} onBlur={S.blur} />
                  </div>
                  <div>
                    <label style={{ ...S.label, fontSize: '0.5625rem' }}>Rate (RM)</label>
                    <input type="number" value={item.unitPrice}
                      onChange={e => handleItemChange(i, 'unitPrice', parseFloat(e.target.value) || 0)}
                      style={{ ...S.input, fontSize: '0.875rem', textAlign: 'right' }} onFocus={S.focus} onBlur={S.blur} />
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <label style={{ ...S.label, fontSize: '0.5625rem' }}>Total</label>
                    <p style={{ fontFamily: 'var(--font-headline)', fontWeight: 900, color: 'var(--primary)', fontSize: '0.875rem' }}>
                      {(item.quantity * item.unitPrice).toLocaleString()}
                    </p>
                  </div>
                  <button onClick={() => removeItem(i)} style={{
                    padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: 'none',
                    background: 'transparent', cursor: 'pointer', color: 'var(--outline)',
                    transition: 'all 0.15s'
                  }}
                    onMouseEnter={e => { e.currentTarget.style.color = 'var(--error)'; e.currentTarget.style.background = 'var(--error-container)' }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'var(--outline)'; e.currentTarget.style.background = 'transparent' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </motion.div>
              ))}
            </div>
          </div>

          <div style={{ paddingTop: '1rem', marginBottom: '3rem' }}>
            <label style={S.label}>Quotation Attachment</label>
            <div style={{
              border: '2px dashed var(--outline-variant)', borderRadius: 'var(--radius-sm)',
              padding: '4rem 2rem', textAlign: 'center', cursor: 'pointer', transition: 'all 0.15s',
              background: 'var(--surface-container-low)'
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-container-high)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--surface-container-low)'}
            >
              <Upload size={32} style={{ margin: '0 auto 1rem', color: 'var(--outline)' }} />
              <p style={{ fontFamily: 'var(--font-headline)', fontSize: '1.125rem', fontWeight: 700, color: 'var(--primary)' }}>Click to upload or drag and drop</p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--outline)', marginTop: '0.5rem' }}>PDF, JPG, or PNG (Max 10MB)</p>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1.5rem' }}>
            <button style={{
              padding: '1rem 2rem', background: 'transparent', border: 'none',
              fontFamily: 'var(--font-label)', fontSize: '0.875rem', fontWeight: 700,
              color: 'var(--on-surface-variant)', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.06em',
              transition: 'background 0.15s', borderRadius: 'var(--radius-sm)'
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-container-high)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              Save as Draft
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="gradient-fill"
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '1rem 3rem', color: 'var(--on-primary)',
                fontFamily: 'var(--font-label)', fontSize: '0.875rem', fontWeight: 900,
                textTransform: 'uppercase', letterSpacing: '0.06em',
                borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer',
                transition: 'opacity 0.15s', opacity: submitting ? 0.7 : 1,
                boxShadow: '0 20px 40px rgba(0,52,111,0.3)'
              }}
            >
              {submitting ? 'Processing...' : 'Submit Request'}
            </button>
          </div>
        </div>

        {/* Sidebar Context (5 Col) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <div style={{ background: 'var(--surface-container-highest)', padding: '2rem', borderRadius: 'var(--radius-sm)' }}>
            <h4 style={{ fontFamily: 'var(--font-label)', fontSize: '0.875rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              <Info size={16} /> Procurement Guidelines
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {[
                'Ensure all quotes include shipping costs to the Sarawak Lab facility.',
                'Requests exceeding RM 5,000 require three comparative vendor quotes.',
                'Specify if "Urgent Fulfillment" is needed for critical research continuity.'
              ].map((text, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <CheckCircle2 size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--on-surface-variant)', lineHeight: 1.5 }}>{text}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: 'var(--surface-container-high)', padding: '2rem', borderRadius: 'var(--radius-sm)' }}>
            <h4 style={{ fontFamily: 'var(--font-label)', fontSize: '0.625rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.3em', marginBottom: '1.5rem' }}>Request History</h4>
            <div style={{ position: 'relative', borderLeft: '1px dashed var(--outline-variant)', marginLeft: '0.5rem', paddingLeft: '1.5rem' }}>
              <div style={{ position: 'absolute', left: -5, top: 4, width: 10, height: 10, background: 'var(--primary)', borderRadius: '50%', boxShadow: '0 0 0 4px rgba(0,52,111,0.1)' }}></div>
              <p style={{ fontFamily: 'var(--font-label)', fontSize: '0.625rem', fontWeight: 900, color: 'var(--tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric'}).toUpperCase()} &middot; {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--on-surface)', marginTop: '0.25rem' }}>Draft created by User</p>
            </div>
          </div>

          <div style={{ background: 'var(--primary-fixed)', padding: '2rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(0,52,111,0.1)' }}>
            <p style={{ fontFamily: 'var(--font-label)', fontSize: '0.75rem', fontWeight: 900, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>Need Assistance?</p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--on-primary-fixed-variant)', marginBottom: '1.5rem', lineHeight: 1.5 }}>Contact the procurement helpdesk for Sarawak division queries.</p>
            <button style={{ fontFamily: 'var(--font-label)', fontSize: '0.75rem', fontWeight: 900, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              Contact Support <ArrowRight size={16} />
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}

export default ProcurementForm
