import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, ArrowLeft, Upload, FileText, CheckCircle2, Info, ArrowRight, X, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { procurementApi } from '../services/api'
import { useCompany } from '../App'

const ProcurementForm = () => {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const { isMobile, currentCompany } = useCompany()

  const [title, setTitle] = useState('')
  const [vendor, setVendor] = useState({ name: '', id: 'V-AUTO' })
  const [items, setItems] = useState([{ description: '', quantity: 1, uom: 'PCS', unitPrice: 0 }])
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [quotationUrl, setQuotationUrl] = useState(null)
  const [quotationName, setQuotationName] = useState('')
  const [threshold, setThreshold] = useState(5000)

  // Vendor Sync State
  const [allVendors, setAllVendors] = useState([])
  const [filteredVendors, setFilteredVendors] = useState([])
  const [showVendorDropdown, setShowVendorDropdown] = useState(false)
  const vendorDropdownRef = useRef(null)

  useEffect(() => {
    if (currentCompany) {
      procurementApi.getSettings(currentCompany.id).then(data => {
        setThreshold(data.approval_threshold || 5000)
      }).catch(err => console.error("Could not fetch settings:", err))

      // Fetch Vendors
      procurementApi.getVendors().then(setAllVendors).catch(err => console.error("Could not fetch vendors:", err))
    }
  }, [currentCompany])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (vendorDropdownRef.current && !vendorDropdownRef.current.contains(e.target)) {
        setShowVendorDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const addItem = () => setItems([...items, { description: '', quantity: 1, uom: 'PCS', unitPrice: 0 }])
  const removeItem = (index) => setItems(items.filter((_, i) => i !== index))

  const handleItemChange = (index, field, value) => {
    const newItems = [...items]
    newItems[index][field] = value
    setItems(newItems)
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setUploading(true)
    try {
      const result = await procurementApi.uploadFile(file)
      setQuotationUrl(result.url)
      setQuotationName(file.name)
    } catch (err) {
      alert("Failed to upload quotation: " + err.message)
    } finally {
      setUploading(false)
    }
  }

  const calculateTotal = () => items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0)

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    if (items.length === 0 || !items[0].description) {
      alert("Please add at least one line item with a description.");
      return;
    }

    const total = calculateTotal()
    
    // Vendor Sync Validation
    const isRegistered = allVendors.some(v => v.name.toLowerCase() === vendor.name.toLowerCase())
    if (!isRegistered && vendor.name) {
      alert(`The vendor "${vendor.name}" is not registered in the directory. Please select a registered vendor or register them first in the Vendor Directory.`)
      return
    }
    if (!vendor.name) {
      alert("Please select a vendor.")
      return
    }
    if (total > 1000 && !quotationUrl) {
      if (!window.confirm("Standard policy requires a quotation for spending over RM 1,000. Proceed anyway?")) {
        return;
      }
    }

    setSubmitting(true)
    try {
      const requestData = {
        title: title || items[0].description || "Untitled Procurement",
        vendor_name: vendor.name || "Unknown Vendor",
        vendor_id: vendor.id || "V-NEW",
        total_amount: total,
        quotation_url: quotationUrl,
        items: items.map(i => ({
          description: i.description,
          quantity: parseInt(i.quantity) || 0,
          uom: i.uom || 'PCS',
          unit_price: parseFloat(i.unitPrice) || 0,
          total_price: (parseInt(i.quantity) || 0) * (parseFloat(i.unitPrice) || 0)
        }))
      }

      const res = await procurementApi.createRequest(requestData)
      if (res && res.id) {
        navigate(`/request/${res.id}`)
      } else {
        throw new Error("Error: Request ID not returned by server.")
      }
    } catch (err) {
      alert("Submission Error: " + err.message)
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const S = {
    label: { fontFamily: 'var(--font-label)', fontSize: '0.625rem', fontWeight: 900, color: 'var(--outline)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '0.75rem' },
    input: { width: '100%', padding: '0.75rem 0', background: 'transparent', border: 'none', borderBottom: '2px solid var(--outline-variant)', fontFamily: 'var(--font-headline)', fontSize: '1rem', fontWeight: 800, color: 'var(--on-surface)', outline: 'none', transition: 'all 0.2s ease' },
    card: { background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(194,198,211,0.2)', overflow: 'hidden' }
  }

  return (
    <div style={{ maxWidth: '68rem', margin: '0 auto', paddingBottom: '8rem', display: 'flex', flexDirection: 'column', gap: isMobile ? '1.5rem' : '3rem' }}>

      {/* Header Context */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <button onClick={() => navigate('/')} style={{ width: 48, height: 48, borderRadius: '16px', border: 'none', background: 'var(--primary-fixed)', color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: isMobile ? '1.5rem' : '2.5rem', fontWeight: 900, color: 'var(--primary)', letterSpacing: '-0.03em', margin: 0 }}>Create Procurement</h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--outline)', marginTop: '4px' }}>Submit a new expenditure request for <strong>{currentCompany?.name}</strong>.</p>
          </div>
        </div>
        <div style={{ padding: '0.5rem 1.25rem', background: 'var(--primary-container)', borderRadius: 'var(--radius-pill)', color: 'var(--on-primary-container)', fontSize: '0.625rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)' }} />
          Drafting Request
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '8fr 4fr', gap: isMobile ? '1.5rem' : '2.5rem', alignItems: 'start' }}>

        <div style={S.card}>
          <div style={{ background: 'var(--surface-container-high)', padding: '1.5rem 2.5rem', borderBottom: '1px solid rgba(194,198,211,0.1)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <FileText size={20} style={{ color: 'var(--primary)' }} />
            <h2 style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--primary)' }}>Request Details</h2>
          </div>

          <form style={{ padding: isMobile ? '1.5rem' : '3rem' }}>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', marginBottom: '4rem' }}>
              <div>
                <label style={S.label}>Request Title</label>
                <input placeholder="e.g. Q3 Laboratory Reagent Replenishment" value={title} onChange={e => setTitle(e.target.value)} style={S.input} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '2.5rem' }}>
                <div style={{ position: 'relative' }} ref={vendorDropdownRef}>
                  <label style={S.label}>Vendor Selection</label>
                  <input 
                    required 
                    placeholder="Start typing vendor name..." 
                    value={vendor.name} 
                    onFocus={() => setShowVendorDropdown(true)}
                    onChange={e => {
                      const val = e.target.value
                      setVendor({ ...vendor, name: val })
                      const filtered = allVendors.filter(v => 
                        v.name.toLowerCase().includes(val.toLowerCase())
                      )
                      setFilteredVendors(filtered)
                      setShowVendorDropdown(true)
                    }} 
                    style={S.input} 
                  />
                  <AnimatePresence>
                    {showVendorDropdown && filteredVendors.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        exit={{ opacity: 0, y: 10 }}
                        style={{
                          position: 'absolute', top: '100%', left: 0, right: 0,
                          background: 'white', borderRadius: 'var(--radius-sm)',
                          boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                          border: '1px solid var(--outline-variant)',
                          zIndex: 100, marginTop: '8px', maxHeight: '250px', overflowY: 'auto'
                        }}>
                        {filteredVendors.map(v => (
                          <div 
                            key={v.id} 
                            onClick={() => {
                              setVendor({ name: v.name, id: `V-${v.id}` })
                              setShowVendorDropdown(false)
                            }}
                            className="vendor-suggestion-item"
                            style={{
                              padding: '1rem 1.5rem', cursor: 'pointer',
                              borderBottom: '1px solid var(--surface-variant)',
                              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                            }}>
                            <div>
                              <p style={{ margin: 0, fontWeight: 800, color: 'var(--primary)', fontSize: '0.875rem' }}>{v.name}</p>
                              <p style={{ margin: 0, fontSize: '0.625rem', color: 'var(--outline)' }}>{v.vendor_type}</p>
                            </div>
                            <span style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--outline)' }}>V-{v.id}</span>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div>
                  <label style={S.label}>Vendor ID (Automatic or Manual)</label>
                  <input 
                    placeholder="V-XXXX" 
                    value={vendor.id} 
                    onChange={e => setVendor({ ...vendor, id: e.target.value })} 
                    style={{ ...S.input, color: 'var(--primary)', fontWeight: 900 }} 
                  />
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '4rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Item Details</h3>
                <button type="button" onClick={addItem} style={{ padding: '0.5rem 1rem', background: 'var(--primary)', border: 'none', borderRadius: 'var(--radius-pill)', color: 'white', fontWeight: 900, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Plus size={14} /> Add Item
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {items.map((item, i) => (
                  <div key={i} style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : '4fr 1.5fr 1fr 1.5fr 1.5fr auto',
                    gap: isMobile ? '1.5rem' : '1.25rem', alignItems: 'end', padding: '1.5rem',
                    background: 'var(--surface-container-low)', borderRadius: 'var(--radius-md)',
                    border: '1px solid rgba(194,198,211,0.1)'
                  }}>
                    <div style={{ gridColumn: isMobile ? 'span 1' : 'auto' }}>
                      <label style={S.label}>Description</label>
                      <input required value={item.description} onChange={e => handleItemChange(i, 'description', e.target.value)} style={{ ...S.input, fontSize: '0.875rem' }} />
                    </div>
                    <div>
                      <label style={S.label}>Quantity</label>
                      <input type="number" value={item.quantity} onChange={e => handleItemChange(i, 'quantity', e.target.value)} style={{ ...S.input, fontSize: '0.875rem' }} />
                    </div>
                    <div>
                      <label style={S.label}>UOM</label>
                      <input placeholder="PCS" value={item.uom} onChange={e => handleItemChange(i, 'uom', e.target.value)} style={{ ...S.input, fontSize: '0.875rem', borderBottomColor: 'var(--primary)' }} />
                    </div>
                    <div>
                      <label style={S.label}>Unit Price</label>
                      <input type="number" value={item.unitPrice} onChange={e => handleItemChange(i, 'unitPrice', e.target.value)} style={{ ...S.input, fontSize: '0.875rem' }} />
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={S.label}>Total Price</p>
                      <p style={{ fontFamily: 'var(--font-headline)', fontWeight: 900, color: 'var(--primary)', fontSize: '1rem' }}>
                        RM {(item.quantity * item.unitPrice).toLocaleString()}
                      </p>
                    </div>
                    <button type="button" onClick={() => removeItem(i)} style={{ padding: '0.75rem', background: 'rgba(255, 71, 71, 0.05)', border: 'none', color: 'var(--error)', borderRadius: '12px', cursor: 'pointer' }}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '4rem' }}>
              <label style={S.label}>Supporting Documents</label>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '2rem', alignItems: 'center' }}>
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => fileInputRef.current.click()}
                  style={{
                    width: '100%', padding: '1.5rem', borderRadius: 'var(--radius-lg)',
                    border: '2px dashed var(--primary)', background: quotationUrl ? 'var(--primary-container)' : 'var(--surface-container-low)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', cursor: 'pointer', transition: 'all 0.2s',
                    boxShadow: '0 10px 20px rgba(0,0,0,0.05)'
                  }}>
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} accept=".pdf,image/*" />
                  <div style={{
                    width: 56, height: 56, borderRadius: '50%', background: quotationUrl ? 'var(--primary)' : 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: quotationUrl ? 'white' : 'var(--primary)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}>
                    {uploading ? (
                      <Loader2 className="animate-spin" size={24} />
                    ) : quotationUrl ? (
                      <CheckCircle2 size={24} />
                    ) : (
                      <Plus size={24} />
                    )}
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--primary)', margin: 0 }}>
                      {uploading ? "Processing Document..." : quotationUrl ? "Quotation Attached" : "Add Quotation"}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--outline)', marginTop: '4px' }}>
                      {quotationName || `Mandatory for spends > RM 1,000`}
                    </p>
                  </div>
                </motion.div>

                <div style={{ background: 'var(--surface-container-low)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(194,198,211,0.1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <Info size={16} style={{ color: 'var(--primary)' }} />
                    <p style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--primary)', textTransform: 'uppercase', margin: 0 }}>Requirement</p>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--on-surface-variant)', margin: 0 }}>
                    Company policy requires a supplier quotation for any expenditure over <strong>RM 1,000.00</strong>. Please attach the quotation to avoid delays.
                  </p>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'flex-end', alignItems: 'center', gap: '2rem', paddingTop: '3rem', borderTop: '1px solid rgba(194,198,211,0.1)' }}>
              <div style={{ display: 'flex', gap: '1.5rem', width: isMobile ? '100%' : 'auto' }}>
                <button 
                  type="button" 
                  onClick={() => navigate(-1)}
                  style={{ padding: '1rem 2rem', background: 'transparent', border: 'none', color: 'var(--outline)', fontWeight: 800, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting || uploading}
                  className="gradient-fill"
                  style={{
                    padding: '1rem 3rem', color: 'white', fontWeight: 900, textTransform: 'uppercase', borderRadius: 'var(--radius-pill)', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 10px 30px rgba(14, 77, 81, 0.2)', opacity: (submitting || uploading) ? 0.6 : 1
                  }}
                >
                  {submitting ? 'Processing...' : <>Submit Request <ArrowRight size={20} /></>}
                </button>
              </div>
            </div>
          </form>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div style={{ ...S.card, padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem' }}>
              <Info size={20} style={{ color: 'var(--primary)' }} />
              <h4 style={{ fontSize: '0.875rem', fontWeight: 900, color: 'var(--primary)', textTransform: 'uppercase' }}>Approval Rules</h4>
            </div>
            <ul style={{ paddingLeft: '1.25rem', fontSize: '0.875rem', color: 'var(--on-surface-variant)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <li>Requests over <strong>RM {threshold.toLocaleString()}</strong> will be sent to the <strong>Manager</strong> for review.</li>
              <li>All actions are recorded in the system audit log for security.</li>
              <li>Ensure UOM (Unit of Measure) is clearly specified for physical goods.</li>
            </ul>
          </div>

          <div style={{ background: 'var(--primary)', color: 'white', padding: '2rem', borderRadius: 'var(--radius-lg)', boxShadow: '0 20px 40px rgba(14, 77, 81, 0.15)' }}>
            <p style={{ fontSize: '0.625rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.8, marginBottom: '0.5rem' }}>System Status</p>
            <h5 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>System Status: Online</h5>
            <p style={{ fontSize: '0.75rem', marginTop: '1rem', opacity: 0.9 }}>Your request will be visible to the {currentCompany?.name} finance division immediately upon submission.</p>
          </div>
        </div>

      </div>
      <style>{`
        .vendor-suggestion-item:hover {
          background: var(--surface-container-high) !important;
        }
      `}</style>
    </div>
  )
}

export default ProcurementForm
