import React from 'react'
import { motion } from 'framer-motion'
import { Plus, Trash2, Send, Save, ArrowLeft, ClipboardList } from 'lucide-react'

const ProcurementForm = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-24">
      {/* Header */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center gap-4 text-primary mb-2">
          <button className="p-2 hover:bg-surface-container-high rounded-full transition-colors">
            <ArrowLeft size={20} />
          </button>
          <p className="label-md font-bold uppercase tracking-wider">New Procurement Request</p>
        </div>
        <h1 className="title-lg text-on-surface text-3xl font-bold">Document: PR-2024-045</h1>
      </section>

      {/* Form Body */}
      <div className="surface-card space-y-12">
        {/* Vendor Section */}
        <section className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-sm bg-primary/10 flex items-center justify-center text-primary">
              <ClipboardList size={22} />
            </div>
            <h3 className="title-lg font-bold">1. Vendor Details</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="flex flex-col gap-2">
              <label className="label-md text-on-surface-variant font-bold">Vendor Name</label>
              <div className="bottom-stroke py-2">
                <input 
                  type="text" 
                  defaultValue="Sarawak Tech Solutions"
                  className="w-full bg-transparent border-none outline-none body-md font-semibold text-primary"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="label-md text-on-surface-variant font-bold">Vendor ID</label>
              <div className="bottom-stroke py-2">
                <input 
                  type="text" 
                  defaultValue="STS-9981-SWK"
                  className="w-full bg-transparent border-none outline-none body-md font-semibold text-primary"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Requirements Section */}
        <section className="space-y-8 pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-sm bg-primary/10 flex items-center justify-center text-primary">
                <Plus size={22} />
              </div>
              <h3 className="title-lg font-bold">2. Line Items</h3>
            </div>
            <button className="label-md text-primary font-bold flex items-center gap-2 hover:underline">
              Add New Item
              <Plus size={16} />
            </button>
          </div>

          <div className="space-y-4">
            {[
              { id: 1, desc: 'High-Precision Chromatograph Sensors', qty: 12, unit: 'RM 8,500', total: 'RM 102,000' },
              { id: 2, desc: 'Calibration Software License (Annual)', qty: 1, unit: 'RM 45,000', total: 'RM 45,000' },
              { id: 3, desc: 'Setup & Installation Service', qty: 1, unit: 'RM 8,000', total: 'RM 8,000' },
            ].map((item, i) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center justify-between p-6 border border-outline-variant-low rounded-sm hover:border-primary transition-colors hover:shadow-ambient"
              >
                <div className="flex gap-8 flex-1">
                  <div className="flex-1">
                    <p className="label-sm text-on-surface-variant mb-1">Description</p>
                    <p className="body-md font-semibold">{item.desc}</p>
                  </div>
                  <div className="w-20">
                    <p className="label-sm text-on-surface-variant mb-1">Qty</p>
                    <p className="body-md font-semibold">{item.qty}</p>
                  </div>
                  <div className="w-32">
                    <p className="label-sm text-on-surface-variant mb-1">Unit Price</p>
                    <p className="body-md font-semibold">{item.unit}</p>
                  </div>
                  <div className="w-32">
                    <p className="label-sm text-on-surface-variant mb-1">Total</p>
                    <p className="body-md font-bold text-primary">{item.total}</p>
                  </div>
                </div>
                <button className="ml-8 p-3 hover:bg-error-container hover:text-error rounded-full transition-colors text-on-surface-variant">
                  <Trash2 size={18} />
                </button>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Totals Section */}
        <section className="flex flex-col items-end gap-2 pt-6 border-t border-outline-variant-low">
          <div className="flex gap-12 text-right">
            <div>
              <p className="label-md text-on-surface-variant font-bold mb-1">Subtotal</p>
              <p className="title-lg text-on-surface">RM 155,000.00</p>
            </div>
            <div>
              <p className="label-md text-on-surface-variant font-bold mb-1">Tax (6%)</p>
              <p className="title-lg text-on-surface">RM 9,300.00</p>
            </div>
          </div>
          <div className="pt-4 mt-4 border-t border-primary w-full max-w-[300px] text-right">
            <p className="label-md text-primary font-bold uppercase tracking-wider mb-2">Grand Total</p>
            <p className="display-md text-primary text-4xl">RM 164,300.00</p>
          </div>
        </section>
      </div>

      {/* Floating Action Bar */}
      <div className="fixed bottom-12 right-12 flex gap-4">
        <button className="flex items-center gap-3 px-8 py-4 surface-card hover-lift shadow-ambient text-on-surface-variant font-bold label-md">
          <Save size={18} />
          Save as Draft
        </button>
        <button className="flex items-center gap-3 px-8 py-4 gradient-fill hover:opacity-90 transition-opacity text-white font-bold label-md rounded-sm shadow-ambient">
          <Send size={18} />
          Submit for Approval
        </button>
      </div>
    </div>
  )
}

export default ProcurementForm
