import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Wallet, Plus, CheckCircle2, DollarSign, Clock, Download, TrendingUp, HandCoins } from 'lucide-react'
import { procurementApi } from '../services/api'

const PettyCashDashboard = () => {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ amount: '', requester: '' })

  const currentUser = { name: "Karlos Albert", role: "MANAGER" }

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const data = await procurementApi.getPettyCash()
      setRequests(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await procurementApi.createPettyCash({
        requester_name: formData.requester,
        amount: parseFloat(formData.amount),
        status: 'PENDING'
      })
      setShowForm(false)
      fetchData()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleDisburse = async (id) => {
    try {
      await procurementApi.disbursePettyCash(id, currentUser.name)
      fetchData()
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <div className="space-y-12">
      {/* Header */}
      <section className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <p className="label-md text-primary font-black uppercase tracking-widest text-xs">Petty Cash Ledger 2026</p>
          <h1 className="display-sm text-on-surface text-4xl font-black tracking-tight flex items-center gap-4">
            Cash Disbursements
          </h1>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className="flex items-center gap-3 px-8 py-4 bg-tertiary-fixed text-on-tertiary-fixed-variant label-md font-bold rounded-sm shadow-ambient hover:brightness-95 transition-all"
        >
          <Plus size={18} />
          New Cash Request
        </button>
      </section>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="surface-card border-l-4 border-tertiary shadow-sm">
          <p className="label-sm text-on-surface-variant font-bold uppercase mb-2">Pending Requests</p>
          <h2 className="title-lg text-tertiary font-black text-3xl">
            RM {requests.filter(r => r.status === 'PENDING').reduce((acc, r) => acc + r.amount, 0).toLocaleString()}
          </h2>
        </div>
        <div className="surface-card border-l-4 border-primary shadow-sm">
          <p className="label-sm text-on-surface-variant font-bold uppercase mb-2">Disbursed This Month</p>
          <h2 className="title-lg text-primary font-black text-3xl">
            RM {requests.filter(r => r.status === 'DISBURSED').reduce((acc, r) => acc + r.amount, 0).toLocaleString()}
          </h2>
        </div>
        <div className="surface-card border-l-4 border-on-surface-variant shadow-sm">
          <p className="label-sm text-on-surface-variant font-bold uppercase mb-2">Total Ledger Count</p>
          <h2 className="title-lg text-on-surface font-black text-3xl">{requests.length}</h2>
        </div>
      </div>

      {/* Main Table */}
      <div className="surface-card p-0 overflow-hidden shadow-ambient border border-outline-variant-low">
        <table className="w-full text-left border-collapse">
          <thead className="bg-surface-container-low border-b border-outline-variant-low">
            <tr className="label-sm font-black text-on-surface-variant uppercase tracking-widest text-[10px]">
              <th className="p-6">Requester</th>
              <th className="p-6">Amount (RM)</th>
              <th className="p-6">Protocol Status</th>
              <th className="p-6">Authorization Trace</th>
              <th className="p-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" className="p-12 text-center label-md animate-pulse">Syncing with cash ledger...</td></tr>
            ) : requests.map((req, i) => (
              <tr key={req.id} className="hover:bg-surface-container-low transition-colors border-b border-outline-variant-low last:border-none">
                <td className="p-6">
                  <p className="body-md font-bold">{req.requester_name}</p>
                  <p className="label-sm text-on-surface-variant font-medium">{new Date(req.created_at).toLocaleDateString()}</p>
                </td>
                <td className="p-6 title-md font-black text-primary">RM {req.amount.toLocaleString()}</td>
                <td className="p-6">
                  <span className={`chip chip-${req.status === 'PENDING' ? 'pending' : 'approved'} font-bold uppercase text-[10px]`}>
                    {req.status}
                  </span>
                </td>
                <td className="p-6">
                  {req.disbursed_by ? (
                    <div className="space-y-1">
                      <p className="label-sm font-black text-primary uppercase">Disbursed by {req.disbursed_by}</p>
                      <p className="label-sm text-on-surface-variant">{new Date(req.disbursed_at).toLocaleString()}</p>
                    </div>
                  ) : (
                    <p className="label-sm text-on-surface-variant font-bold italic opacity-30">Awaiting payout sequence...</p>
                  )}
                </td>
                <td className="p-6 text-right">
                  {req.status === 'PENDING' && (
                    <button 
                      onClick={() => handleDisburse(req.id)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white label-sm font-black uppercase rounded-sm hover:opacity-90 transition-all shadow-sm"
                    >
                      <HandCoins size={14} />
                      Disburse Cash
                    </button>
                  )}
                  {req.status === 'DISBURSED' && (
                    <div className="text-tertiary-fixed flex items-center gap-2 justify-end">
                      <CheckCircle2 size={16} />
                      <span className="label-sm font-black uppercase">Finalized</span>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* New Request Modal */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowForm(false)}
              className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="surface-card w-full max-w-lg relative z-10 shadow-3xl space-y-8 p-12"
            >
              <h3 className="title-lg font-black tracking-tight border-b border-outline-variant-low pb-6">Initialize Cash Disbursement</h3>
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-4">
                  <label className="label-sm text-on-surface-variant font-black uppercase tracking-widest">Requester Name</label>
                  <input 
                    type="text" 
                    required
                    value={formData.requester}
                    onChange={(e) => setFormData({...formData, requester: e.target.value})}
                    className="w-full bg-surface-container-low p-4 rounded-sm border border-outline-variant-low label-md font-bold focus:border-primary outline-none transition-all"
                  />
                </div>
                <div className="space-y-4">
                  <label className="label-sm text-on-surface-variant font-black uppercase tracking-widest">Amount (RM)</label>
                  <input 
                    type="number" 
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    className="w-full bg-surface-container-low p-4 rounded-sm border border-outline-variant-low label-md font-bold focus:border-primary outline-none transition-all"
                  />
                </div>
                <div className="flex gap-4 pt-4">
                   <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-4 label-md font-black uppercase tracking-widest text-on-surface-variant hover:bg-surface-container-low rounded-sm transition-all">Cancel</button>
                   <button type="submit" className="flex-1 py-4 gradient-fill text-white label-md font-black uppercase tracking-widest rounded-sm shadow-lg hover:scale-[1.02] transition-all">Post to Ledger</button>
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
