import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wallet, Plus, CheckCircle2, DollarSign, Clock, Download, TrendingUp, HandCoins, ArrowRight, ShieldCheck, FileText, ChevronRight, Lock } from 'lucide-react'
import { procurementApi } from '../services/api'
import { useCompany } from '../App'

const PettyCashDashboard = () => {
  const { refreshKey, activeRole } = useCompany()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ amount: '', description: '' })

  const currentUser = { name: "Karlos Albert" }

  useEffect(() => {
    fetchData()
  }, [refreshKey])

  const fetchData = async () => {
    setLoading(true)
    try {
      const data = await procurementApi.getPettyCash()
      setRequests(data)
    } catch (err) {
      console.error("Infrastructure Registry Pull Error:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await procurementApi.createPettyCash({
        amount: parseFloat(formData.amount),
        description: formData.description,
        status: 'SUBMITTED'
      })
      setShowForm(false)
      fetchData()
    } catch (err) {
      alert("Submission restricted in context: " + err.message)
    }
  }

  const handleAction = async (id, action) => {
    try {
      if (action === 'APPROVE') await procurementApi.approvePettyCash(id)
      if (action === 'DISBURSE') await procurementApi.disbursePettyCash(id)
      fetchData()
    } catch (err) {
      alert("Unauthorized Access Context: " + err.message)
    }
  }

  // Role Checks for UI Logic
  const canApprove = ['MANAGER', 'ADMIN'].includes(activeRole)
  const canDisburse = ['FINANCE', 'ADMIN'].includes(activeRole)

  return (
    <div className="space-y-16">
      {/* Header Context */}
      <section className="flex items-end justify-between border-b-2 border-outline-variant-low pb-12">
        <div className="space-y-4">
          <p className="label-sm text-primary font-black uppercase tracking-[5px] text-[11px] flex gap-4 items-center">
             <div className="w-2 h-2 bg-primary rounded-full animate-ping" />
             Liquidity Execution Protocol 2026
          </p>
          <h1 className="display-sm text-on-surface text-6xl font-black tracking-tighter">Small-Cap Ledger</h1>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className="flex items-center gap-6 px-12 py-6 gradient-fill text-white label-md font-black uppercase tracking-[3px] rounded-sm shadow-2xl hover:scale-[1.05] active:scale-[0.95] transition-all"
        >
          <Plus size={24} />
          Initialize Cash Inflow
        </button>
      </section>

      {/* Aggregate Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
        <div className="surface-card border-t-[10px] border-tertiary-fixed-dim shadow-2xl space-y-4">
          <p className="label-sm text-on-surface-variant font-black uppercase tracking-[3px] text-[10px] opacity-40">Awaiting Clearing</p>
          <h2 className="title-lg text-tertiary font-black text-5xl tabular-nums tracking-tighter">
            RM {requests.filter(r => r.status === 'SUBMITTED').reduce((acc, r) => acc + r.amount, 0).toLocaleString()}
          </h2>
          <div className="h-1.5 w-16 bg-tertiary rounded-full opacity-20" />
        </div>
        <div className="surface-card border-t-[10px] border-primary shadow-2xl space-y-4">
          <p className="label-sm text-on-surface-variant font-black uppercase tracking-[3px] text-[10px] opacity-40">Contextual Outflow (MTD)</p>
          <h2 className="title-lg text-primary font-black text-5xl tabular-nums tracking-tighter">
            RM {requests.filter(r => r.status === 'DISBURSED').reduce((acc, r) => acc + r.amount, 0).toLocaleString()}
          </h2>
          <div className="h-1.5 w-16 bg-primary rounded-full opacity-20" />
        </div>
        <div className="surface-card border-t-[10px] border-on-surface-variant shadow-2xl space-y-4">
          <p className="label-sm text-on-surface-variant font-black uppercase tracking-[3px] text-[10px] opacity-40">Compliance Sequencing</p>
          <h2 className="title-lg text-on-surface font-black text-5xl tabular-nums tracking-tighter">{requests.length} Records</h2>
          <div className="h-1.5 w-16 bg-on-surface-variant rounded-full opacity-10" />
        </div>
      </div>

      {/* Corporate Transaction Registry */}
      <div className="surface-card p-0 overflow-hidden shadow-3xl border border-outline-variant-low">
        <div className="bg-surface-container-low p-10 border-b border-outline-variant-low flex items-center justify-between">
           <div className="flex items-center gap-4">
              <h3 className="title-md font-black tracking-tight text-on-surface uppercase pr-8 border-r border-outline-variant-low">Transaction Registry</h3>
              <p className="label-sm font-black text-primary uppercase text-[9px] tracking-widest opacity-60">Multi-Tenant Mode: {activeRole || '???'}</p>
           </div>
           <TrendingUp size={24} className="text-primary animate-pulse" />
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-lowest border-b border-outline-variant-low label-sm font-black text-on-surface-variant uppercase tracking-[3px] text-[10px]">
              <th className="p-10">Sequence Identity</th>
              <th className="p-10">Operational Capital</th>
              <th className="p-10 text-center">Authorization Status</th>
              <th className="p-10">Audit Verification</th>
              <th className="p-10 text-right">Contextual Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" className="p-24 text-center animate-pulse title-lg uppercase tracking-widest opacity-20 font-black">Syncing ledger records...</td></tr>
            ) : requests.length === 0 ? (
              <tr><td colSpan="5" className="p-24 text-center text-on-surface-variant font-black uppercase tracking-[5px] text-xl opacity-10">Isolated Context Empty</td></tr>
            ) : requests.map((req, i) => (
              <tr key={req.id} className="hover:bg-primary/[0.02] transition-colors border-b border-outline-variant-low last:border-none group">
                <td className="p-10">
                  <p className="body-lg font-black tracking-tighter group-hover:text-primary transition-colors cursor-default">#{req.id} System Sequence</p>
                  <p className="label-sm text-on-surface-variant font-black uppercase tracking-widest opacity-40 mt-1">{new Date(req.created_at).toLocaleDateString()}</p>
                </td>
                <td className="p-10 title-md font-black text-primary text-2xl tabular-nums">RM {req.amount.toLocaleString()}</td>
                <td className="p-10 text-center">
                  <span className={`chip chip-${req.status === 'SUBMITTED' ? 'pending' : req.status === 'APPROVED' ? 'approved' : 'disbursed'} font-black uppercase text-[10px] tracking-[2px] rounded-sm ring-1 ring-inset`}>
                    {req.status}
                  </span>
                </td>
                <td className="p-10">
                  {req.disbursed_at ? (
                    <div className="space-y-1">
                      <p className="label-sm font-black text-primary uppercase tracking-tighter flex items-center gap-2">
                        <ShieldCheck size={14} />
                        Authorized Context
                      </p>
                      <p className="label-sm text-on-surface-variant font-black opacity-30">{new Date(req.disbursed_at).toLocaleString()}</p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 text-on-surface-variant opacity-20 italic font-black text-[11px] uppercase tracking-widest">
                       <Clock size={16} />
                       Pending Verification
                    </div>
                  )}
                </td>
                <td className="p-10 text-right">
                  <div className="flex justify-end gap-3">
                    {req.status === 'SUBMITTED' && (
                      <button 
                        onClick={() => handleAction(req.id, 'APPROVE')}
                        disabled={!canApprove}
                        className={`px-8 py-3 label-sm font-black uppercase tracking-widest rounded-sm transition-all shadow-xl ${
                           canApprove ? 'bg-tertiary text-on-tertiary hover:scale-105' : 'bg-outline-variant opacity-20 cursor-not-allowed'
                        }`}
                      >
                         {canApprove ? 'Approve' : <Lock size={14} />}
                      </button>
                    )}
                    {req.status === 'APPROVED' && (
                      <button 
                        onClick={() => handleAction(req.id, 'DISBURSE')}
                        disabled={!canDisburse}
                        className={`px-8 py-3 label-sm font-black uppercase tracking-widest rounded-sm transition-all shadow-xl flex items-center gap-3 ${
                           canDisburse ? 'bg-primary text-white hover:scale-105' : 'bg-outline-variant opacity-20 cursor-not-allowed'
                        }`}
                      >
                        <HandCoins size={14} />
                        {canDisburse ? 'Disburse' : <Lock size={14} />}
                      </button>
                    )}
                    {req.status === 'DISBURSED' && (
                      <div className="text-primary flex items-center gap-3 opacity-30 font-black label-sm uppercase tracking-widest">
                         <ShieldCheck size={20} />
                         Ref: {req.id}
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Global Form Context */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-16">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowForm(false)}
              className="absolute inset-0 bg-on-surface/60 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="surface-card w-full max-w-2xl relative z-10 shadow-3xl space-y-12 p-20 border-t-[12px] border-primary rounded-sm"
            >
              <div className="space-y-4 text-center mb-12">
                 <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto mb-6 shadow-inner ring-8 ring-primary/[0.03]">
                    <Wallet size={36} />
                 </div>
                 <h3 className="title-lg font-black tracking-tighter text-5xl">Liquidity Initialization</h3>
                 <p className="body-lg text-on-surface-variant font-bold opacity-60">Recording small-cap capital outflow in the current entity context.</p>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-12">
                <div className="space-y-4">
                  <label className="label-sm text-primary font-black uppercase tracking-[3px] text-[10px] flex items-center gap-3">
                    <DollarSign size={14} />
                    Capital Allocation (RM)
                  </label>
                  <input 
                    type="number" 
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    className="w-full bg-surface-container-low p-8 rounded-sm border-b-4 border-primary/20 label-md font-black focus:border-primary outline-none transition-all shadow-inner text-4xl tabular-nums tracking-tighter"
                    placeholder="0.00"
                  />
                </div>
                
                <div className="space-y-4">
                  <label className="label-sm text-primary font-black uppercase tracking-[3px] text-[10px] flex items-center gap-3">
                    <FileText size={14} />
                    Execution Purpose
                  </label>
                  <textarea 
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full bg-surface-container-low p-8 rounded-sm border-b-4 border-primary/20 label-md font-black focus:border-primary outline-none transition-all shadow-inner h-40 resize-none text-xl opacity-80"
                    placeholder="e.g. Laboratory asset maintenance sequence..."
                  />
                </div>

                <div className="flex gap-8 pt-10">
                   <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-6 label-md font-black uppercase tracking-widest text-on-surface-variant hover:bg-surface-container-low rounded-sm transition-all border-2 border-outline-variant-low">Abstain</button>
                   <button type="submit" className="flex-1 py-6 gradient-fill text-white label-md font-black uppercase tracking-widest rounded-sm shadow-2xl flex items-center justify-center gap-4 hover:translate-y-[-4px] transition-transform">
                      Authorize Sequence
                      <ChevronRight size={24} />
                   </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default PettyCashDashboard
