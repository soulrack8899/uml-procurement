import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Trash2, Send, Save, ArrowLeft, ClipboardList, TrendingUp } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { procurementApi } from '../services/api'

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

  const calculateTotal = () => {
    return items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0)
  }

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
      // Auto-transition to PENDING_MANAGER
      await procurementApi.transitionStatus(res.id, 'PENDING_MANAGER', 'System', 'REQUESTER')
      
      navigate(`/request/${res.id}`)
    } catch (err) {
      alert(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-24">
      {/* Header */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center gap-4 text-primary mb-2">
          <button onClick={() => navigate('/')} className="p-2 hover:bg-surface-container-high rounded-full transition-colors">
            <ArrowLeft size={20} />
          </button>
          <p className="label-md font-black uppercase tracking-widest">Initialization Protocol 2026</p>
        </div>
        <h1 className="display-sm text-on-surface text-4xl font-black tracking-tight">New Procurement Asset Request</h1>
      </section>

      {/* Form Body */}
      <div className="surface-card space-y-12 shadow-ambient border-t-4 border-primary">
        {/* Vendor Section */}
        <section className="space-y-8 p-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-sm bg-primary/10 flex items-center justify-center text-primary shadow-sm">
              <ClipboardList size={24} />
            </div>
            <h3 className="title-lg font-black tracking-tight">1. Strategic Vendor Verification</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            <div className="flex flex-col gap-3">
              <label className="label-sm text-on-surface-variant font-black uppercase tracking-wider">Vendor Entity Name</label>
              <div className="bottom-stroke py-3">
                <input 
                  type="text" 
                  placeholder="e.g. Sarawak Tech Solutions"
                  value={vendor.name}
                  onChange={(e) => setVendor({...vendor, name: e.target.value})}
                  className="w-full bg-transparent border-none outline-none body-md font-black text-primary text-lg"
                />
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <label className="label-sm text-on-surface-variant font-black uppercase tracking-wider">Unique Vendor ID</label>
              <div className="bottom-stroke py-3">
                <input 
                  type="text" 
                  placeholder="STS-99XX-SWK"
                  value={vendor.id}
                  onChange={(e) => setVendor({...vendor, id: e.target.value})}
                  className="w-full bg-transparent border-none outline-none body-md font-black text-primary text-lg"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Requirements Section */}
        <section className="space-y-8 pt-8 border-t border-outline-variant-low p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-sm bg-primary/10 flex items-center justify-center text-primary shadow-sm">
                <Plus size={24} />
              </div>
              <h3 className="title-lg font-black tracking-tight">2. Line Item Configuration</h3>
            </div>
            <button 
              onClick={addItem}
              className="label-md text-primary font-black uppercase tracking-widest flex items-center gap-2 hover:bg-surface-container-low px-4 py-2 rounded-sm transition-all"
            >
              Add New Record
              <TrendingUp size={16} />
            </button>
          </div>

          <div className="space-y-6">
            {items.map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 md:grid-cols-12 gap-8 items-end p-8 bg-surface-container-low rounded-sm hover:shadow-ambient transition-all group"
              >
                <div className="md:col-span-5 flex flex-col gap-2">
                   <label className="label-sm text-on-surface-variant font-bold uppercase">Asset Description</label>
                   <input 
                    type="text" 
                    value={item.description}
                    onChange={(e) => handleItemChange(i, 'description', e.target.value)}
                    className="w-full bg-white p-3 rounded-sm border border-outline-variant-low label-md font-bold focus:border-primary outline-none transition-all"
                  />
                </div>
                <div className="md:col-span-2 flex flex-col gap-2">
                   <label className="label-sm text-on-surface-variant font-bold uppercase">Qty</label>
                   <input 
                    type="number" 
                    value={item.quantity}
                    onChange={(e) => handleItemChange(i, 'quantity', parseInt(e.target.value))}
                    className="w-full bg-white p-3 rounded-sm border border-outline-variant-low label-md font-bold text-center"
                  />
                </div>
                <div className="md:col-span-2 flex flex-col gap-2">
                   <label className="label-sm text-on-surface-variant font-bold uppercase">Rate (RM)</label>
                   <input 
                    type="number" 
                    value={item.unitPrice}
                    onChange={(e) => handleItemChange(i, 'unitPrice', parseFloat(e.target.value))}
                    className="w-full bg-white p-3 rounded-sm border border-outline-variant-low label-md font-bold text-right"
                  />
                </div>
                <div className="md:col-span-2 text-right">
                    <p className="label-sm text-on-surface-variant font-bold uppercase mb-3">Total</p>
                    <p className="title-md font-black text-primary">{(item.quantity * item.unitPrice).toLocaleString()}</p>
                </div>
                <div className="md:col-span-1 text-center">
                   <button 
                    onClick={() => removeItem(i)}
                    className="p-3 text-on-surface-variant hover:text-error hover:bg-error-container rounded-sm transition-all"
                   >
                    <Trash2 size={18} />
                   </button>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Totals Section */}
        <section className="flex flex-col items-end gap-2 pt-12 p-4">
          <div className="pt-6 border-t-2 border-primary w-full max-w-sm text-right">
            <p className="label-md text-primary font-black uppercase tracking-widest mb-2">Aggregated Total RM</p>
            <p className="display-md text-primary text-6xl font-black">{calculateTotal().toLocaleString()}</p>
          </div>
        </section>
      </div>

      {/* Floating Action Bar */}
      <div className="fixed bottom-12 right-12 flex gap-4 z-50">
        <button className="flex items-center gap-3 px-10 py-5 bg-white border border-outline-variant-low text-on-surface-variant label-md font-black uppercase tracking-widest rounded-sm shadow-xl hover:bg-surface-container-low transition-all">
          <Save size={18} />
          Hold in Draft
        </button>
        <button 
          onClick={handleSubmit}
          disabled={submitting}
          className={`flex items-center gap-3 px-10 py-5 gradient-fill text-white label-md font-black uppercase tracking-widest rounded-sm shadow-xl transition-all ${submitting ? 'opacity-50' : 'hover:scale-105 active:scale-95'}`}
        >
          <Send size={18} />
          {submitting ? 'Authenticating...' : 'Submit to Ledger'}
        </button>
      </div>
    </div>
  )
}

export default ProcurementForm
