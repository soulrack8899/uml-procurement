import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Trash2, Send, Save, ArrowLeft, Upload } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { procurementApi } from '../services/api'

/* ─────────────────────────────────────────────────────
   ProcurementForm — synced with Stitch "Procurement Request Form" screen
   Bottom-stroke inputs, tonal surface sections, no solid borders
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

  const S = { // shorthand Stitch styling tokens
    label: { fontFamily: 'var(--font-label)', fontSize: '0.625rem', fontWeight: 700, color: 'var(--outline)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '1rem' },
    input: { width: '100%', paddingBottom: '0.5rem', background: 'transparent', border: 'none', borderBottom: '2px solid var(--outline-variant)', fontFamily: 'var(--font-headline)', fontSize: '1rem', fontWeight: 700, color: 'var(--on-surface)', outline: 'none', transition: 'border-color 0.2s' },
    focus: (e) => e.target.style.borderBottomColor = 'var(--primary)',
    blur: (e) => e.target.style.borderBottomColor = 'var(--outline-variant)'
  }

  return (
    <div style={{ maxWidth: '64rem', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem', paddingBottom: '6rem' }}>
      {/* Header (Stitch: breadcrumb + back) */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
          <button onClick={() => navigate('/')} style={{ padding: '0.5rem', borderRadius: 'var(--radius-pill)', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--primary)', transition: 'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-container-high)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <p style={{ fontFamily: 'var(--font-label)', fontSize: '0.625rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>UMLAB Procurement</p>
            <span style={{ fontFamily: 'var(--font-label)', fontSize: '0.625rem', color: 'var(--outline)' }}>PR-2026-SRW-{String(Date.now()).slice(-3)}</span>
          </div>
        </div>
        <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em' }}>New Request</h1>
      </div>

      {/* Main form card (Stitch: surface-container-lowest, ghost-ring) */}
      <div style={{ background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-sm)', boxShadow: '0 0 0 1px rgba(194,198,211,0.15)', padding: '2rem' }}>
        {/* Item Information */}
        <div style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontFamily: 'var(--font-headline)', fontSize: '1.375rem', fontWeight: 700, marginBottom: '0.5rem' }}>Item Information</h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--on-surface-variant)' }}>Provide specific details regarding the laboratory supplies or equipment required.</p>
        </div>

        {/* Vendor fields (Stitch: bottom-stroke only) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
          <div>
            <label style={S.label}>Vendor Name</label>
            <input type="text" placeholder="e.g. Sarawak Tech Solutions" value={vendor.name}
              onChange={e => setVendor({...vendor, name: e.target.value})}
              style={S.input} onFocus={S.focus} onBlur={S.blur} />
          </div>
          <div>
            <label style={S.label}>Vendor ID</label>
            <input type="text" placeholder="STS-99XX-SWK" value={vendor.id}
              onChange={e => setVendor({...vendor, id: e.target.value})}
              style={S.input} onFocus={S.focus} onBlur={S.blur} />
          </div>
        </div>

        {/* Line Items */}
        <div style={{ marginBottom: '2rem' }}>
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            {items.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
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
                  background: 'transparent', cursor: 'pointer', color: 'var(--on-surface-variant)',
                  transition: 'all 0.15s'
                }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'var(--error)'; e.currentTarget.style.background = 'var(--error-container)' }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--on-surface-variant)'; e.currentTarget.style.background = 'transparent' }}
                >
                  <Trash2 size={16} />
                </button>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Attachment Zone */}
        <div style={{
          border: '2px dashed var(--outline-variant)', borderRadius: 'var(--radius-sm)',
          padding: '2rem', textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.15s'
        }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--outline-variant)'}
        >
          <Upload size={24} style={{ margin: '0 auto 0.5rem', color: 'var(--outline)' }} />
          <p style={{ fontFamily: 'var(--font-label)', fontSize: '0.75rem', fontWeight: 600 }}>Click to upload or drag and drop</p>
          <p style={{ fontFamily: 'var(--font-label)', fontSize: '0.625rem', color: 'var(--outline)' }}>PDF, JPG, or PNG (Max 10MB)</p>
        </div>

        {/* Procurement Guidelines */}
        <div style={{ background: 'var(--surface-container-low)', padding: '1.5rem', borderRadius: 'var(--radius-sm)', marginTop: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <span>ℹ️</span>
            <h3 style={{ fontFamily: 'var(--font-headline)', fontWeight: 700, fontSize: '0.875rem' }}>Procurement Guidelines</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              'Ensure all quotes include shipping costs to the Sarawak Lab facility.',
              'Requests exceeding RM 5,000 require three comparative vendor quotes.',
              'Specify if "Urgent Fulfillment" is needed for critical research continuity.'
            ].map((text, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <span style={{ color: 'var(--tertiary)', fontSize: '0.875rem', flexShrink: 0 }}>✓</span>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', color: 'var(--on-surface-variant)' }}>{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Total & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid rgba(194,198,211,0.15)' }}>
          <div>
            <p style={{ fontFamily: 'var(--font-label)', fontSize: '0.625rem', fontWeight: 700, color: 'var(--outline)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>Aggregated Total</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
              <span style={{ fontFamily: 'var(--font-headline)', fontSize: '1rem', fontWeight: 900, color: 'var(--primary)' }}>RM</span>
              <span style={{ fontFamily: 'var(--font-headline)', fontSize: '2.75rem', fontWeight: 900, color: 'var(--primary)', letterSpacing: '-0.02em' }}>{calculateTotal().toLocaleString('en', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.75rem 1.5rem', background: 'transparent',
              border: '1px solid rgba(194,198,211,0.2)',
              fontFamily: 'var(--font-label)', fontSize: '0.75rem', fontWeight: 700,
              color: 'var(--on-surface-variant)', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
              transition: 'background 0.15s'
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-container-low)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <Save size={16} /> Save Draft
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="gradient-fill"
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.75rem 2rem', color: 'var(--on-primary)',
                fontFamily: 'var(--font-headline)', fontSize: '0.875rem', fontWeight: 700,
                borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer',
                transition: 'opacity 0.15s', opacity: submitting ? 0.5 : 1
              }}
            >
              <Send size={16} /> {submitting ? 'Processing...' : 'Submit Request'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProcurementForm
