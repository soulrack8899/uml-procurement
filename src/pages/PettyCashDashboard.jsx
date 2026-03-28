import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  TrendingUp, 
  History as HistoryIcon, 
  Plus, 
  ChevronRight, 
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import { procurementApi } from '../services/api'
import { useCompany } from '../App'

export default function PettyCashDashboard() {
  const { refreshKey } = useCompany()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchData() }, [refreshKey])

  const fetchData = async () => {
    try {
      const data = await procurementApi.getPettyCash()
      setRequests(data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const totalSpent = requests.reduce((sum, r) => sum + r.amount, 0)
  const balance = 5000 - totalSpent
  const pendingCount = requests.filter(r => r.status === 'PENDING').length
  const pendingAmt = requests.filter(r => r.status === 'PENDING').reduce((s, r) => s + r.amount, 0)
  const approvedToday = requests.filter(r => r.status === 'APPROVED').length // Simplified
  const approvedAmt = requests.filter(r => r.status === 'APPROVED').reduce((s, r) => s + r.amount, 0)

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
          <h2 className="text-4xl font-headline font-extrabold tracking-tight text-primary">Petty Cash Dashboard</h2>
          <p className="text-secondary font-body text-lg">Fast-track claims and small-scale procurement management.</p>
        </div>
        <button className="tectonic-gradient px-8 py-4 text-sm font-bold text-white shadow-xl shadow-primary/20 rounded-sm flex items-center gap-3 tracking-widest uppercase">
          <Plus size={18} />
          New Claim
        </button>
      </div>

      {/* Monthly Insights */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Current Balance', value: `RM ${balance.toLocaleString('en', {minimumFractionDigits: 2})}`, trend: '+12%', icon: TrendingUp, type: 'primary' },
          { label: 'Monthly Spend', value: `RM ${totalSpent.toLocaleString('en', {minimumFractionDigits: 2})}`, trend: '-5%', icon: ArrowDownRight, type: 'secondary' },
          { label: 'Pending Claims', value: pendingCount.toString().padStart(2, '0'), sub: `RM ${pendingAmt.toLocaleString('en', {minimumFractionDigits: 2})}`, icon: Clock, type: 'outline' },
          { label: 'Approved Today', value: approvedToday.toString().padStart(2, '0'), sub: `RM ${approvedAmt.toLocaleString('en', {minimumFractionDigits: 2})}`, icon: CheckCircle2, type: 'outline' }
        ].map((stat, i) => (
          <div key={i} className="bg-surface-container-low p-6 rounded-sm border-l-4 border-primary/10">
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] font-label font-bold text-outline uppercase tracking-widest">{stat.label}</span>
              <stat.icon size={16} className="text-primary" />
            </div>
            <p className="text-2xl font-headline font-black text-primary tracking-tight">{stat.value}</p>
            {stat.trend && (
              <p className={`text-[10px] font-bold mt-1 ${stat.trend.startsWith('+') ? 'text-tertiary' : 'text-error'}`}>
                {stat.trend} <span className="text-outline font-normal">vs last month</span>
              </p>
            )}
            {stat.sub && <p className="text-xs text-outline mt-1 font-medium">{stat.sub}</p>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        {/* Recent Claims Table */}
        <div className="xl:col-span-8 space-y-6">
          <div className="bg-surface-container-lowest rounded-sm border border-outline-variant/10 overflow-hidden shadow-2xl shadow-on-surface/5">
            <div className="p-6 border-b border-outline-variant/10 flex justify-between items-center">
              <h3 className="font-headline font-bold text-on-surface">Recent Claims</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" size={16} />
                <input 
                  className="bg-surface-container-low border-none rounded-full pl-10 pr-4 py-2 text-xs font-label focus:ring-2 focus:ring-primary/20 outline-none w-64" 
                  placeholder="Search claims..." 
                  type="text"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low/50">
                    <th className="px-6 py-4 text-[10px] font-label font-black text-outline uppercase tracking-widest">Claim ID</th>
                    <th className="px-6 py-4 text-[10px] font-label font-black text-outline uppercase tracking-widest">Description</th>
                    <th className="px-6 py-4 text-[10px] font-label font-black text-outline uppercase tracking-widest">Amount</th>
                    <th className="px-6 py-4 text-[10px] font-label font-black text-outline uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {loading ? (
                    <tr><td colSpan="5" className="p-8 text-center text-outline text-sm animate-pulse">Syncing ledger...</td></tr>
                  ) : requests.length === 0 ? (
                    <tr><td colSpan="5" className="p-8 text-center text-outline text-sm">No petty cash claims found.</td></tr>
                  ) : requests.map((claim, i) => (
                    <tr key={claim.id} className="hover:bg-surface-container-low transition-colors group">
                      <td className="px-6 py-4">
                        <span className="text-xs font-label font-bold text-primary">{claim.receipt_ref || `#PC-${claim.id}`}</span>
                        <p className="text-[9px] text-outline uppercase tracking-tighter mt-0.5">
                          {new Date(claim.created_at).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-on-surface">{claim.description}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-headline font-black text-primary">
                          RM {claim.amount.toLocaleString('en', {minimumFractionDigits: 2})}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                          claim.status === 'APPROVED' ? 'bg-tertiary-fixed text-on-tertiary-fixed-variant' :
                          claim.status === 'PENDING' ? 'bg-secondary-container text-on-secondary-container' :
                          'bg-error-container text-on-error-container'
                        }`}>
                          {claim.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-2 text-outline hover:text-primary hover:bg-primary-fixed rounded-full transition-all">
                          <ChevronRight size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 bg-surface-container-low/30 text-center">
              <button className="text-[10px] font-label font-black text-primary uppercase tracking-widest hover:underline">Load More Transactions</button>
            </div>
          </div>
        </div>

        {/* Audit Trail */}
        <div className="xl:col-span-4 space-y-8">
          <div className="bg-surface-container-highest p-8 rounded-sm">
            <h3 className="text-sm font-label font-black text-secondary uppercase tracking-widest mb-8 flex items-center gap-2">
              <HistoryIcon size={16} />
              Petty Cash Audit Trail
            </h3>
            <div className="space-y-8 relative">
              <div className="absolute left-[11px] top-2 bottom-2 w-[1px] bg-outline-variant/30 border-l border-dashed border-outline-variant"></div>
              {[
                { time: '14:22 PM', user: 'Admin', action: 'Approved PC-0892', type: 'success' },
                { time: '11:05 AM', user: 'Technician A', action: 'Submitted PC-0891', type: 'pending' },
                { time: '09:15 AM', user: 'Finance', action: 'Replenished RM 500.00', type: 'success' },
                { time: 'Yesterday', user: 'Admin', action: 'Rejected PC-0889', detail: 'Missing receipt', type: 'error' }
              ].map((log, i) => (
                <div key={i} className="relative pl-8">
                  <div className={`absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center z-10 ${
                    log.type === 'success' ? 'bg-tertiary-fixed text-on-tertiary-fixed-variant' :
                    log.type === 'pending' ? 'bg-secondary-container text-on-secondary-container' :
                    'bg-error-container text-on-error-container'
                  }`}>
                    {log.type === 'success' ? <CheckCircle2 size={12} /> : log.type === 'pending' ? <Clock size={12} /> : <AlertCircle size={12} />}
                  </div>
                  <p className="text-[10px] font-label font-bold text-outline uppercase tracking-widest">{log.time} · {log.user}</p>
                  <p className="text-sm font-bold text-on-surface mt-1">{log.action}</p>
                  {log.detail && <p className="text-xs text-error mt-1 italic">{log.detail}</p>}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-primary p-8 rounded-sm text-white shadow-2xl shadow-primary/20">
            <h4 className="font-headline font-black text-xl mb-2 tracking-tight">Replenishment Alert</h4>
            <p className="text-sm text-white/70 leading-relaxed mb-6">
              Petty cash balance is below RM 500.00. Automatic replenishment request has been drafted for Finance review.
            </p>
            <button className="w-full bg-white text-primary font-label font-black text-[10px] uppercase tracking-widest py-4 rounded-sm hover:bg-primary-fixed transition-colors">
              Authorize Replenishment
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
