import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, Clock, Eye, Download, Printer, User, MessageSquare, ArrowRight, X, AlertTriangle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { procurementApi } from '../services/api'

const ApprovalView = () => {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const data = await procurementApi.getRequests()
      // Filter for anything PENDING or APPROVED but not yet PO_ISSUED for this view
      const pending = data.filter(r => 
        ['PENDING_MANAGER', 'PENDING_DIRECTOR', 'APPROVED'].includes(r.status)
      )
      setRequests(pending)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-12 h-full">
      {/* Header */}
      <section className="flex flex-col gap-2">
        <p className="label-md text-primary font-black uppercase tracking-widest">Workflow Authority</p>
        <div className="flex items-center justify-between">
          <h1 className="display-sm text-on-surface text-4xl font-black tracking-tight">Pending Authorizations</h1>
          <div className="flex items-center gap-3 chip chip-pending px-6 py-3 border border-outline-variant-low">
            <Clock size={18} className="text-on-secondary-container" />
            <span className="font-black text-sm uppercase tracking-wider">{requests.length} Awaiting Ledger Update</span>
          </div>
        </div>
      </section>

      {/* List Layout */}
      <div className="space-y-6">
        {loading ? (
             <div className="p-20 text-center label-md animate-pulse">Syncing with ledger authority...</div>
        ) : requests.length === 0 ? (
             <div className="p-20 text-center surface-card border-dashed border-2 border-outline-variant-low text-on-surface-variant">
                <CheckCircle size={48} className="mx-auto mb-4 opacity-20" />
                <p className="title-md font-bold">All clear. No pending approvals found.</p>
             </div>
        ) : requests.map((app, i) => (
          <Link
            to={`/request/${app.id}`}
            key={app.id}
            className="block"
          >
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="surface-card flex items-center justify-between p-10 hover-lift cursor-pointer shadow-ambient border-l-4 border-transparent hover:border-primary"
            >
              <div className="flex items-center gap-10 flex-1">
                <div className="w-20 h-20 rounded-sm bg-primary/10 flex items-center justify-center text-primary font-black text-2xl shrink-0 shadow-sm">
                  {app.id}
                </div>
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-4">
                    <p className="label-sm text-primary font-black uppercase tracking-widest">SEQ-IDENTIFIER: {app.id}</p>
                    <p className="label-sm text-on-surface-variant font-bold uppercase tracking-wider">• {new Date(app.created_at).toLocaleDateString()}</p>
                  </div>
                  <h3 className="title-lg font-black tracking-tight text-xl">{app.title}</h3>
                  <div className="flex items-center gap-6">
                    <p className="label-md text-on-surface-variant font-bold uppercase tracking-wider">{app.vendor_name}</p>
                    <div className="h-1 w-1 bg-outline-variant-low rounded-full" />
                    <p className="label-md font-black text-primary text-lg">RM {app.total_amount.toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-10">
                   {app.total_amount > 5000 && (
                     <div className="flex items-center gap-2 text-error bg-error-container px-3 py-1 rounded-sm">
                        <AlertTriangle size={14} />
                        <span className="label-sm font-black uppercase tracking-tighter">High Value</span>
                     </div>
                   )}
                   <div className="text-right flex items-center gap-6">
                    <div className="text-right">
                      <p className="label-sm text-on-surface-variant font-black uppercase mb-1 tracking-wider">Current Gate</p>
                      <span className="chip chip-pending font-black uppercase text-xs tracking-widest">{app.status}</span>
                    </div>
                    <ArrowRight size={24} className="text-primary opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0" />
                  </div>
                </div>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default ApprovalView
