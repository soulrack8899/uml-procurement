import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Trash2, ArrowLeft, Upload, FileText, Verified, Banknote, Truck, Info, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { procurementApi } from '../services/api'
import { useCompany } from '../App'

const ProcurementForm = () => {
  const navigate = useNavigate()
  const { isMobile } = useCompany()
  const [vendor, setVendor] = useState({ name: '', id: '' })
  const [items, setItems] = useState([{ description: '', quantity: 1, uom: 'PCS', unitPrice: 0 }])
  const [submitting, setSubmitting] = useState(false)

  const addItem = () => setItems([...items, { description: '', quantity: 1, uom: 'PCS', unitPrice: 0 }])
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
          uom: i.uom,
          unit_price: i.unitPrice,
          total_price: i.quantity * i.unitPrice
        }))
      }
      const res = await procurementApi.createRequest(requestData)
      if (res && res.id) {
        await procurementApi.transitionStatus(res.id)
        navigate(`/request/${res.id}`)
      } else {
        throw new Error("Server returned success but no Request ID was created.")
      }
    } catch (err) {
      alert(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const S = {
    label: { fontFamily: 'var(--font-label)', fontSize: '0.625rem', fontWeight: 700, color: 'var(--outline)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '0.5rem' },
    input: { width: '100%', padding: '0.75rem 0', background: 'transparent', border: 'none', borderBottom: '2px solid var(--outline-variant)', fontFamily: 'var(--font-headline)', fontSize: '1rem', fontWeight: 700, color: 'var(--on-surface)', outline: 'none', transition: 'border-color 0.2s' },
    focus: (e) => e.target.style.borderBottomColor = 'var(--primary)',
    blur: (e) => e.target.style.borderBottomColor = 'var(--outline-variant)'
  }

  return (
    <div style={{ maxWidth: '64rem', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: isMobile ? '1.5rem' : '3rem', paddingBottom: '6rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={() => navigate('/')} style={{ padding: '0.5rem', borderRadius: 'var(--radius-pill)', border: 'none', background: 'var(--surface-container-high)', cursor: 'pointer', color: 'var(--primary)' }}>
            <ArrowLeft size={20} />
          </button>
          <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: isMobile ? '1.75rem' : '2.5rem', fontWeight: 800, color: 'var(--primary)', margin: 0 }}>New Request</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'var(--secondary-container)', borderRadius: 'var(--radius-pill)', color: 'var(--on-secondary-container)', fontSize: '0.625rem', fontWeight: 900, textTransform: 'uppercase' }}>
          <FileText size={14} /> Draft
        </div>
      </div>

      {/* Grid Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '7fr 5fr', gap: isMobile ? '1.5rem' : '2.5rem', alignItems: 'start' }}>
        
        {/* Main form card */}
        <div className="surface-card" style={{ padding: isMobile ? '1.5rem' : '3rem', borderLeft: '4px solid var(--primary)' }}>
          <h2 style={{ fontFamily: 'var(--font-headline)', fontSize: '1.25rem', fontWeight: 700, marginBottom: '2rem', color: 'var(--primary)' }}>Item Information</h2>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '1.5rem' : '3rem', marginBottom: '3rem' }}>
            <div>
              <label style={S.label}>Vendor Name</label>
              <input type="text" placeholder="Sarawak Tech Solutions" value={vendor.name}
                onChange={e => setVendor({...vendor, name: e.target.value})}
                style={S.input} onFocus={S.focus} onBlur={S.blur} />
            </div>
            <div>
              <label style={S.label}>Vendor ID</label>
              <input type="text" placeholder="STS-99XX" value={vendor.id}
                onChange={e => setVendor({...vendor, id: e.target.value})}
                style={S.input} onFocus={S.focus} onBlur={S.blur} />
            </div>
          </div>

          <div style={{ marginBottom: '3rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <label style={S.label}>Line Items</label>
              <button onClick={addItem} style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Plus size={14} /> Add Item
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {items.map((item, i) => (
                <div key={i} style={{ 
                  display: 'grid', 
                  gridTemplateColumns: isMobile ? '1fr' : '3.5fr 1fr 1fr 1.5fr 1.5fr auto',
                  gap: '1rem', alignItems: 'end', padding: '1.25rem',
                  background: 'var(--surface-container-high)', borderRadius: 'var(--radius-sm)'
                }}>
                  <div style={{ gridColumn: isMobile ? 'span 1' : 'auto' }}>
                    <label style={{ ...S.label, fontSize: '0.5625rem' }}>Description</label>
                    <input type="text" value={item.description}
                      onChange={e => handleItemChange(i, 'description', e.target.value)}
                      style={{ ...S.input, fontSize: '0.875rem' }} onFocus={S.focus} onBlur={S.blur} />
                  </div>
                  <div>
                    <label style={{ ...S.label, fontSize: '0.5625rem' }}>Qty</label>
                    <input type="number" value={item.quantity}
                      onChange={e => handleItemChange(i, 'quantity', parseInt(e.target.value) || 0)}
                      style={{ ...S.input, fontSize: '0.875rem' }} onFocus={S.focus} onBlur={S.blur} />
                  </div>
                  <div>
                    <label style={{ ...S.label, fontSize: '0.5625rem' }}>UOM</label>
                    <input type="text" value={item.uom} placeholder="PCS"
                      onChange={e => handleItemChange(i, 'uom', e.target.value)}
                      style={{ ...S.input, fontSize: '0.875rem' }} onFocus={S.focus} onBlur={S.blur} />
                  </div>
                  <div>
                    <label style={{ ...S.label, fontSize: '0.5625rem' }}>Rate (RM)</label>
                    <input type="number" value={item.unitPrice}
                      onChange={e => handleItemChange(i, 'unitPrice', parseFloat(e.target.value) || 0)}
                      style={{ ...S.input, fontSize: '0.875rem' }} onFocus={S.focus} onBlur={S.blur} />
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <label style={{ ...S.label, fontSize: '0.5625rem' }}>Total</label>
                    <p style={{ fontFamily: 'var(--font-headline)', fontWeight: 900, color: 'var(--primary)', fontSize: '0.875rem' }}>
                      {(item.quantity * item.unitPrice).toLocaleString()}
                    </p>
                  </div>
                  <button onClick={() => removeItem(i)} style={{ padding: '0.5rem', background: 'transparent', border: 'none', color: 'var(--error)', cursor: 'pointer' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', flexWrap: 'wrap' }}>
            <button style={{ padding: '0.75rem 1.5rem', background: 'transparent', border: 'none', fontWeight: 700, color: 'var(--outline)', cursor: 'pointer' }}>
              Save Draft
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="gradient-fill"
              style={{
                padding: '0.75rem 2.5rem', color: 'white', fontWeight: 900, textTransform: 'uppercase', borderRadius: 'var(--radius-pill)', border: 'none', cursor: 'pointer', opacity: submitting ? 0.7 : 1
              }}
            >
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </div>

        {/* Sidebar Context */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="surface-card" style={{ padding: '1.5rem' }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Info size={16} /> ProcuSure Wisdom
            </h4>
            <ul style={{ paddingLeft: '1.25rem', fontSize: '0.875rem', color: 'var(--on-surface-variant)', lineHeight: 1.6 }}>
              <li>Quotes over <strong>RM 5,000</strong> need 3 comparative bids.</li>
              <li>Attach clear PDF or image of the quotation.</li>
              <li>Specify delivery requirements in descriptions.</li>
            </ul>
          </div>
          
          <div style={{ background: 'var(--primary-fixed)', padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
             <p style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Need Help?</p>
             <p style={{ fontSize: '0.875rem', color: 'var(--on-surface-variant)' }}>Contact Sarawak Procurement Division Support.</p>
             <button style={{ marginTop: '1rem', background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
               Support <ArrowRight size={16}/>
             </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProcurementForm
