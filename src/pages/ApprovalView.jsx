import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, Clock, Eye, Download, Printer, User, MessageSquare, ArrowRight, X } from 'lucide-react'

const ApprovalView = () => {
  const [selectedApproval, setSelectedApproval] = useState(null)

  const pendingApprovals = [
    { id: 'APP-9901', title: 'Chromatograph Upgrade Kit', vendor: 'Sarawak Tech Solutions Ltd.', amount: 'RM 102,500.00', requester: 'Dr. Ahmad Rizal', date: '2026-03-27' },
    { id: 'APP-9902', title: 'Bio-Safety Level 3 Reagents', vendor: 'UMLAB Global Supplies Ltd.', amount: 'RM 15,200.00', requester: 'Siti Aminah', date: '2026-03-25' },
    { id: 'APP-9903', title: 'Precision Calibration Gas', vendor: 'Industrial Gas Supplies', amount: 'RM 45,000.00', requester: 'Dr. Ahmad Rizal', date: '2026-03-22' },
    { id: 'APP-9904', title: 'Annual Lab Equipment Maintenance', vendor: 'Equipment Experts', amount: 'RM 12,000.00', requester: 'Michael Wong', date: '2026-03-20' },
  ]

  return (
    <div className="space-y-12 h-full">
      {/* Header */}
      <section className="flex flex-col gap-2">
        <p className="label-md text-primary font-bold uppercase tracking-wider">Strategic Approvals</p>
        <div className="flex items-center justify-between">
          <h1 className="display-md text-on-surface">Pending Requests</h1>
          <div className="flex items-center gap-2 chip chip-pending">
            <Clock size={16} />
            <span className="font-bold">4 Requests Awaiting</span>
          </div>
        </div>
      </section>

      {/* List Layout */}
      <div className="space-y-4">
        {pendingApprovals.map((app, i) => (
          <motion.div
            key={app.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => setSelectedApproval(app)}
            className="surface-card flex items-center justify-between p-8 hover-lift cursor-pointer shadow-ambient"
          >
            <div className="flex items-center gap-8 flex-1">
              <div className="w-16 h-16 rounded-sm bg-primary/10 flex items-center justify-center text-primary font-bold text-xl shrink-0">
                {app.id.split('-')[1]}
              </div>
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-4">
                  <p className="label-sm text-primary font-bold uppercase tracking-wider">{app.id}</p>
                  <p className="label-sm text-on-surface-variant font-medium">• {app.date}</p>
                </div>
                <h3 className="title-lg font-bold">{app.title}</h3>
                <div className="flex items-center gap-4">
                  <p className="label-md text-on-surface-variant">{app.vendor}</p>
                  <p className="label-md font-bold text-primary">| {app.amount}</p>
                </div>
              </div>
              <div className="text-right flex items-center gap-4">
                <div className="text-right">
                  <p className="label-sm text-on-surface-variant font-bold mb-1">Requester</p>
                  <p className="label-md font-bold text-on-surface">{app.requester}</p>
                </div>
                <ArrowRight size={20} className="text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Approval Drawer (Slide-out Overlay) */}
      <AnimatePresence>
        {selectedApproval && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedApproval(null)}
              className="fixed inset-0 bg-on-surface/20 backdrop-blur-sm z-[100]"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-screen w-full max-w-2xl bg-surface-container-lowest shadow-2xl z-[101] overflow-y-auto flex flex-col"
            >
              {/* Drawer Header */}
              <div className="p-8 border-b border-outline-variant-low flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-10">
                <div className="flex items-center gap-4">
                  <button onClick={() => setSelectedApproval(null)} className="p-2 hover:bg-surface-container-high rounded-full transition-colors">
                    <X size={20} />
                  </button>
                  <h2 className="title-lg font-bold">Request: {selectedApproval.id}</h2>
                </div>
                <div className="flex gap-4">
                  <button className="p-2 hover:bg-surface-container-high rounded-full transition-colors text-on-surface-variant">
                    <Download size={20} />
                  </button>
                  <button className="p-2 hover:bg-surface-container-high rounded-full transition-colors text-on-surface-variant">
                    <Printer size={20} />
                  </button>
                </div>
              </div>

              {/* Drawer Content */}
              <div className="p-12 space-y-12">
                {/* Meta Grid */}
                <div className="grid grid-cols-2 gap-8 p-8 bg-surface-container-low rounded-sm">
                  <div>
                    <label className="label-sm text-on-surface-variant font-bold uppercase mb-2 block">Requester</label>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">AR</div>
                      <p className="label-md font-bold">{selectedApproval.requester}</p>
                    </div>
                  </div>
                  <div>
                    <label className="label-sm text-on-surface-variant font-bold uppercase mb-2 block">Vendor</label>
                    <p className="label-md font-bold text-primary">{selectedApproval.vendor}</p>
                  </div>
                </div>

                {/* Audit Trail (Technical Mini-log) */}
                <section className="space-y-6">
                  <h4 className="label-md text-primary font-bold uppercase flex items-center gap-2">
                    <Clock size={16} /> Workflow Audit Trace
                  </h4>
                  <div className="bg-surface-container-highest p-6 rounded-sm space-y-4">
                    <div className="flex items-start gap-4">
                      <p className="label-sm text-tertiary font-bold w-12 pt-1">09:12</p>
                      <div>
                        <p className="label-sm font-bold">Request Created</p>
                        <p className="label-sm text-on-surface-variant">System initialized ledger entry</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <p className="label-sm text-tertiary font-bold w-12 pt-1">11:05</p>
                      <div>
                        <p className="label-sm font-bold">Budget Verified</p>
                        <p className="label-sm text-on-surface-variant">Finance engine matched threshold</p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Document Preview (Mockup) */}
                <section className="space-y-6">
                  <h4 className="label-md text-primary font-bold uppercase">Commercial Quote</h4>
                  <div className="border border-outline-variant-low rounded-sm p-12 bg-white shadow-ambient relative overflow-hidden group">
                     {/* Signature Watermark */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] rotate-[-20deg]">
                      <h1 className="text-8xl font-black">UMLAB SARAWAK</h1>
                    </div>
                    
                    <div className="space-y-8 relative z-10">
                      <div className="flex justify-between items-start">
                        <div>
                          <h1 className="title-lg font-black text-2xl mb-1">QUOTATION</h1>
                          <p className="label-sm font-bold text-on-surface-variant"># QT-SWK-2024-001</p>
                        </div>
                        <div className="text-right">
                          <p className="label-md font-bold">UMLAB Sarawak</p>
                          <p className="label-sm text-on-surface-variant">Level 5, Wisma Lab,</p>
                          <p className="label-sm text-on-surface-variant">93400 Kuching, Sarawak</p>
                        </div>
                      </div>
                      
                      <div className="border-t border-b border-outline-variant-low py-8 space-y-4">
                        <div className="flex justify-between items-center bg-surface-container-low p-4 rounded-sm">
                          <p className="label-sm font-bold">Chromatograph Tech Sensor Pak-12</p>
                          <p className="label-md font-black">RM 8,500.00 x 12</p>
                        </div>
                        <div className="flex justify-between items-center text-right p-4">
                          <p className="label-sm font-bold">Subtotal</p>
                          <p className="label-md font-bold">RM 102,000.00</p>
                        </div>
                      </div>
                      
                      <p className="label-sm text-on-surface-variant italic">
                        * All sensitive lab components are certified under SWK-Precision standard ISO-9001.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Response Section */}
                <section className="space-y-6 pt-12 border-t border-outline-variant-low">
                  <label className="label-md text-on-surface-variant font-bold">Internal Approval Note</label>
                  <textarea 
                    placeholder="Enter approval rationale or rejection reason..."
                    className="w-full bg-surface-container-low border-none rounded-sm p-6 label-md focus:bg-white focus:shadow-ambient outline-none transition-all h-32 resize-none"
                  />
                </section>
              </div>

              {/* Drawer Sticky Footer */}
              <div className="p-8 border-t border-outline-variant-low bg-white flex gap-6 mt-auto">
                <button className="flex-1 flex items-center justify-center gap-3 py-5 rounded-sm bg-error-container text-error font-bold label-md hover:bg-error/10 transition-colors">
                  <XCircle size={18} />
                  Reject Request
                </button>
                <button className="flex-1 flex items-center justify-center gap-3 py-5 rounded-sm bg-tertiary-fixed text-on-tertiary-fixed-variant font-bold label-md hover:brightness-95 transition-all">
                  <CheckCircle size={18} />
                  Sign & Approve
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ApprovalView
