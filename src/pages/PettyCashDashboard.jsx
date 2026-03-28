import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wallet, Plus, CheckCircle2, DollarSign, Clock, Download, TrendingUp, HandCoins, ArrowRight, ShieldCheck, FileText, ChevronRight } from 'lucide-react'
import { procurementApi } from '../services/api'
import { useCompany } from '../App'

const PettyCashDashboard = () => {
  const { refreshKey } = useCompany()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ amount: '', description: '' })

  const currentUser = { name: "Karlos Albert", role: "ADMIN" }

  useEffect(() => {
    fetchData()
  }, [refreshKey])

  const fetchData = async () => {
    setLoading(true)
    try {
      const data = await procurementApi.getPettyCash()
      setRequests(data)
    } catch (err) {
      console.error("Cash ledger pull error:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await procurementApi.createPettyCash({
        amount: parseFloat(formData.amount),
        description: formData.description, // Added description for clarity
        status: 'SUBMITTED'
      })
      setShowForm(false)
      fetchData()
    } catch (err) {
      alert("Submission error in ledger context: " + err.message)
    }
  }

  const handleAction = async (id, action) => {
    try {
      if (action === 'APPROVE') await procurementApi.approvePettyCash(id)
      if (action === 'DISBURSE') await procurementApi.disbursePettyCash(id)
      fetchData()
    } catch (err) {
      alert("Action restricted: " + err.message)
    }
  }

  return (
    <div className="space-y-12">
      {/* Header */}
      <section className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <p className="label-md text-primary font-black uppercase tracking-widest text-xs">Liquidity Protocol 2026</p>
          <h1 className="display-sm text-on-surface text-4xl font-black tracking-tighter">Small-Cap Ledger</h1>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className="flex items-center gap-4 px-10 py-5 gradient-fill text-white label-md font-black uppercase tracking-widest rounded-sm shadow-xl hover:scale-[1.05] transition-all"
        >
          <Plus size={20} />
          Initialize Cash Flow
        </button>
      </section>

      {/* Corporate Ledger Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        <div className="surface-card border-t-8 border-tertiary-fixed shadow-ambient">
          <p className="label-sm text-on-surface-variant font-black uppercase tracking-widest mb-3 opacity-60">Awaiting Approval</p>
          <h2 className="title-lg text-tertiary-fixed-dim font-black text-4xl">
            RM {requests.filter(r => r.status === 'SUBMITTED').reduce((acc, r) => acc + r.amount, 0).toLocaleString()}
          </h2>
          <div className="h-1 w-12 bg-tertiary-fixed-dim mt-4" />
        </div>
        <div className="surface-card border-t-8 border-primary shadow-ambient">
          <p className="label-sm text-on-surface-variant font-black uppercase tracking-widest mb-3 opacity-60">Liquidity Outflow (MTD)</p>
          <h2 className="title-lg text-primary font-black text-4xl">
            RM {requests.filter(r => r.status === 'DISBURSED').reduce((acc, r) => acc + r.amount, 0).toLocaleString()}
          </h2>
          <div className="h-1 w-12 bg-primary mt-4" />
        </div>
        <div className="surface-card border-t-8 border-on-surface-variant shadow-ambient">
          <p className="label-sm text-on-surface-variant font-black uppercase tracking-widest mb-3 opacity-60">Sequence Compliance</p>
          <h2 className="title-lg text-on-surface font-black text-4xl">{requests.length} Records</h2>
          <div className="h-1 w-12 bg-on-surface-variant mt-4" />
        </div>
      </div>

      {/* Main Execution Log */}
      <div className="surface-card p-0 overflow-hidden shadow-3xl border border-outline-variant-low">
        <div className="bg-surface-container-low p-8 border-b border-outline-variant-low flex items-center justify-between">
           <h3 className="title-md font-black flex items-center gap-4 uppercase tracking-widest text-[10px]">
             Transaction History Stream
           </h3>
           <TrendingUp size={20} className="text-primary opacity-40" />
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white border-b border-outline-variant-low label-sm font-black text-on-surface-variant uppercase tracking-widest text-[10px]">
              <th className="p-8">Sequence Context</th>
              <th className="p-8">Capital Amount</th>
              <th className="p-8 text-center">Protocol Status</th>
              <th className="p-8">Authorization Trace</th>
              <th className="p-8 text-right">Execution Sequence</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" className="p-16 text-center label-md animate-pulse">Synchronizing with isolated cash ledger...</td></tr>
            ) : requests.length === 0 ? (
              <tr><td colSpan="5" className="p-16 text-center text-on-surface-variant label-md font-bold italic opacity-40">Zero transaction records in this tenant context.</td></tr>
            ) : requests.map((req, i) => (
              <tr key={req.id} className="hover:bg-surface-container-low transition-colors border-b border-outline-variant-low last:border-none group">
                <td className="p-8">
                  <p className="body-md font-black tracking-tight group-hover:text-primary transition-colors cursor-default">#{req.id} System Requester</p>
                  <p className="label-sm text-on-surface-variant font-bold uppercase tracking-widest opacity-60">{new Date(req.created_at).toLocaleDateString()}</p>
                </td>
                <td className="p-8 title-md font-black text-primary">RM {req.amount.toLocaleString()}</td>
                <td className="p-8 text-center">
                  <span className={`chip chip-${req.status === 'SUBMITTED' ? 'pending' : req.status === 'APPROVED' ? 'approved' : 'disbursed'} font-black uppercase text-[10px] tracking-widest rounded-sm`}>
                    {req.status}
                  </span>
                </td>
                <td className="p-8">
                  {req.disbursed_at ? (
                    <div className="space-y-1 group-hover:scale-[1.02] transition-transform">
                      <p className="label-sm font-black text-primary uppercase tracking-tighter">Authorized by Root Admin</p>
                      <p className="label-sm text-on-surface-variant font-medium">{new Date(req.disbursed_at).toLocaleString()}</p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-on-surface-variant opacity-40 italic">
                       <Clock size={16} />
                       <p className="label-sm font-bold uppercase tracking-widest">In Pipeline</p>
                    </div>
                  )}
                </td>
                <td className="p-8 text-right">
                  <div className="flex justify-end gap-3">
                    {req.status === 'SUBMITTED' && (
                      <button 
                        onClick={() => handleAction(req.id, 'APPROVE')}
                        className="px-6 py-3 bg-tertiary text-on-tertiary label-sm font-black uppercase tracking-widest rounded-sm hover:opacity-90 transition-all shadow-sm"
                      >
                        Approve
                      </button>
                    )}
                    {req.status === 'APPROVED' && (
                      <button 
                        onClick={() => handleAction(req.id, 'DISBURSE')}
                        className="px-6 py-3 bg-primary text-white label-sm font-black uppercase tracking-widest rounded-sm hover:opacity-90 transition-all shadow-sm flex items-center gap-2"
                      >
                        <HandCoins size={14} />
                        Disburse
                      </button>
                    )}
                    {req.status === 'DISBURSED' && (
                      <div className="text-primary-fixed flex items-center gap-2 opacity-60">
                         <ShieldCheck size={18} />
                         <span className="label-sm font-black uppercase tracking-widest">Finalized</span>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Refined Modular Form */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-12">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowForm(false)}
              className="absolute inset-0 bg-on-surface/50 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="surface-card w-full max-w-xl relative z-10 shadow-3xl space-y-10 p-16 border-t-8 border-primary rounded-sm"
            >
              <div className="space-y-2 text-center mb-8">
                 <Wallet size={32} className="mx-auto text-primary mb-4" />
                 <h3 className="title-lg font-black tracking-tight text-3xl">Petty Cash Initialization</h3>
                 <p className="body-md text-on-surface-variant font-medium">Record a small-cap ledger expenditure in the current tenant space.</p>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-10">
                <div className="space-y-4">
                  <label className="label-sm text-on-surface-variant font-black uppercase tracking-widest text-xs flex items-center gap-2">
                    <DollarSign size={14} className="text-primary" />
                    Capital Inflow Amount (RM)
                  </label>
                  <input 
                    type="number" 
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    className="w-full bg-surface-container-low p-6 rounded-sm border-2 border-outline-variant-low label-md font-black focus:border-primary outline-none transition-all shadow-inner text-2xl"
                  />
                </div>
                
                <div className="space-y-4">
                  <label className="label-sm text-on-surface-variant font-black uppercase tracking-widest text-xs flex items-center gap-2">
                    <FileText size={14} className="text-primary" />
                    Operational Purpose
                  </label>
                  <textarea 
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full bg-surface-container-low p-6 rounded-sm border-2 border-outline-variant-low label-md font-black focus:border-primary outline-none transition-all shadow-inner h-32 resize-none"
                    placeholder="e.g. Laboratory supplies / Emergency maintenance"
                  />
                </div>

                <div className="flex gap-6 pt-6">
                   <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-5 label-md font-black uppercase tracking-widest text-on-surface-variant hover:bg-surface-container-low rounded-sm transition-all border border-outline-variant-low">Abstain</button>
                   <button type="submit" className="flex-1 py-5 gradient-fill text-white label-md font-black uppercase tracking-widest rounded-sm shadow-xl flex items-center justify-center gap-3">
                      Authorize Flow
                      <ChevronRight size={18} />
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
