import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, CheckCircle, XCircle, FileText, Download, Lock, Unlock, AlertTriangle, ChevronRight } from 'lucide-react'
import { procurementApi } from '../services/api'
import TimelineView from '../components/TimelineView'
import { useCompany } from '../App'

const RequestDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { refreshKey, activeRole } = useCompany()
  const [request, setRequest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchData()
  }, [id, refreshKey])

  const fetchData = async () => {
    try {
      const data = await procurementApi.getRequest(id)
      setRequest(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleTransition = async () => {
    try {
      await procurementApi.transitionStatus(id)
      fetchData()
    } catch (err) {
      alert("Authorization Required: " + err.message)
    }
  }

  if (loading) return <div className="p-16 text-center animate-pulse title-lg">Pulling from ledger infrastructure...</div>
  if (error) return (
    <div className="p-16 text-center space-y-8">
       <XCircle size={64} className="mx-auto text-error opacity-20" />
       <div className="space-y-4">
          <h2 className="title-lg font-black uppercase tracking-widest text-error">Access Restricted</h2>
          <p className="body-md text-on-surface-variant font-medium">{error}</p>
       </div>
    </div>
  )
  if (!request) return <div className="p-12 text-center title-lg">Registry entry not found.</div>

  const poFile = request.files?.find(f => f.file_type === 'PO')

  // Simple UI Role Check (Backend enforces strictly)
  const canApprove = ['MANAGER', 'DIRECTOR', 'ADMIN'].includes(activeRole)
  const canFinance = ['FINANCE', 'ADMIN'].includes(activeRole)

  return (
    <div className="space-y-16">
      {/* Header Context */}
      <section className="flex items-end justify-between border-b-2 border-outline-variant-low pb-12">
        <div className="space-y-8">
           <button onClick={() => navigate(-1)} className="flex items-center gap-3 text-primary font-black label-sm uppercase tracking-widest hover:translate-x-[-10px] transition-transform">
            <ArrowLeft size={16} />
            Context Dashboard
          </button>
          <div className="space-y-3">
             <div className="flex items-center gap-6">
                <h1 className="display-sm text-on-surface text-5xl font-black tracking-tighter">{request.title}</h1>
                <span className={`chip chip-pending font-black px-6 py-1.5 text-xs uppercase tracking-widest`}>{request.status}</span>
             </div>
             <p className="title-sm text-on-surface-variant font-bold opacity-40 uppercase tracking-widest">Vendor Context: {request.vendor_name} / {request.vendor_id}</p>
          </div>
        </div>
        
        <div className="text-right space-y-1">
          <p className="label-sm text-on-surface-variant font-black uppercase tracking-widest text-[10px] opacity-40">Capital Outflow Value</p>
          <p className="display-md text-primary text-6xl font-black tabular-nums tracking-tighter">RM {request.total_amount.toLocaleString()}</p>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
        {/* Registry Stream */}
        <div className="lg:col-span-2 space-y-12">
           <section className="surface-card p-0 overflow-hidden shadow-2xl border border-outline-variant-low">
            <div className="bg-surface-container-low p-8 border-b border-outline-variant-low flex items-center justify-between">
              <h3 className="label-sm font-black text-on-surface uppercase tracking-widest text-[11px] flex gap-4 items-center">
                 <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                 Line Item Specifications
              </h3>
              <FileText size={18} className="text-primary opacity-20" />
            </div>
            
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface-container-lowest">
                <tr className="label-sm font-black text-on-surface-variant uppercase tracking-widest text-[10px]">
                  <th className="p-8">Asset Description</th>
                  <th className="p-8 text-center w-32">Qty</th>
                  <th className="p-8 text-right w-44">Price (RM)</th>
                  <th className="p-8 text-right w-44">Total (RM)</th>
                </tr>
              </thead>
              <tbody>
                {request.items?.map((item, i) => (
                  <tr key={i} className="border-t border-outline-variant-low hover:bg-surface-container-low transition-colors">
                    <td className="p-8 body-md font-black text-on-surface">{item.description}</td>
                    <td className="p-8 body-md text-center font-black opacity-30">{item.quantity}</td>
                    <td className="p-8 body-md text-right tabular-nums font-bold">{item.unit_price.toLocaleString()}</td>
                    <td className="p-8 body-md text-right tabular-nums font-black text-primary text-lg">{item.total_price.toLocaleString()}</td>
                  </tr>
                ))}
                <tr className="bg-primary shadow-inner text-white">
                  <td colSpan="3" className="p-8 label-md font-black text-right uppercase tracking-[4px]">Aggregated Value</td>
                  <td className="p-8 title-md font-black text-right tabular-nums text-2xl">RM {request.total_amount.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
           </section>

           {/* Purchase Order Sequence */}
           {poFile && (
             <section className="surface-card p-0 overflow-hidden shadow-3xl border border-primary/20 bg-primary/[0.02]">
                <div className="bg-primary p-8 flex items-center justify-between text-white shadow-lg">
                  <div className="space-y-1">
                     <p className="label-sm font-black uppercase tracking-widest text-[9px] opacity-60">Verified Document</p>
                     <h3 className="title-md font-black uppercase tracking-widest text-xs">Official Purchase Order</h3>
                  </div>
                  <a 
                    href={`http://localhost:8000/${poFile.file_path}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center gap-3 label-md font-black uppercase tracking-widest text-[10px] hover:translate-y-[-2px] transition-transform"
                  >
                    <Download size={18} />
                    Extract PDF
                  </a>
                </div>
                <div className="p-20 relative overflow-hidden bg-white">
                  <div className="absolute top-0 right-0 p-16 opacity-[0.03]">
                    <h1 className="text-9xl font-black rotate-[-15deg]">UMLAB</h1>
                  </div>
                  <div className="space-y-10 relative z-10">
                    <div className="space-y-3">
                       <p className="label-sm font-black text-primary uppercase tracking-[3px] text-[10px]">Trace Sequence Hash</p>
                       <h2 className="title-lg font-black text-4xl uppercase tracking-tighter text-on-surface">{poFile.filename}</h2>
                    </div>
                    <div className="h-1 w-24 bg-primary rounded-full" />
                    <p className="body-lg text-on-surface-variant leading-relaxed font-bold opacity-40 max-w-2xl text-xl">
                      Instrument synthesized by context-aware SaaS engine for vendor {request.vendor_name}. Authorized under entity-specific mandate for company {request.company_id}.
                    </p>
                  </div>
                </div>
             </section>
           )}
        </div>

        {/* Action Sidebar */}
        <div className="space-y-16">
           <section className="surface-card space-y-10 border-t-8 border-primary shadow-3xl bg-surface-container-lowest">
              <div className="flex items-center gap-4 border-b border-outline-variant-low pb-8">
                 <div className="w-12 h-12 rounded-sm bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                    <Lock size={20} />
                 </div>
                 <div>
                    <h3 className="title-md font-black tracking-tight text-on-surface uppercase">Authorization Gate</h3>
                    <p className="label-sm font-black text-primary uppercase text-[9px] tracking-widest opacity-60">Active Context: {activeRole || '???'}</p>
                 </div>
              </div>
              
              <div className="space-y-5">
                {/* Approval Control for Managers/Admins */}
                {['SUBMITTED', 'PENDING_MANAGER', 'PENDING_DIRECTOR'].includes(request.status) && canApprove && (
                  <button 
                    onClick={handleTransition}
                    className="w-full py-6 gradient-fill text-white label-md font-black uppercase tracking-[3px] rounded-sm shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4"
                  >
                    Authorize Flow
                    <ChevronRight size={20} />
                  </button>
                )}
                
                {/* Finance Workflow */}
                {request.status === 'PO_ISSUED' && canFinance && (
                  <button 
                    onClick={handleTransition}
                    className="w-full py-6 bg-tertiary-fixed text-on-tertiary-fixed-variant label-md font-black uppercase tracking-[3px] rounded-sm shadow-xl flex items-center justify-center gap-4 hover:brightness-105 transition-all"
                  >
                    <Unlock size={20} />
                    Execute Payout
                  </button>
                )}

                {/* Unauthorized Notification */}
                {(!canApprove && ['SUBMITTED', 'PENDING_MANAGER', 'PENDING_DIRECTOR'].includes(request.status)) && (
                   <div className="p-8 bg-surface-container-low text-on-surface-variant rounded-sm border-l-8 border-outline-variant space-y-3 opacity-60">
                    <div className="flex items-center gap-3 text-primary">
                       <ShieldCheck size={18} />
                       <p className="label-sm font-black uppercase tracking-widest text-[10px]">Restricted Flow</p>
                    </div>
                    <p className="body-sm font-black italic">Unauthorized for next authorization gate based on entity-specific role {activeRole}.</p>
                  </div>
                )}
              </div>
           </section>

           <section className="space-y-8">
              <div className="flex items-center gap-4 opacity-40">
                 <h3 className="label-sm font-black uppercase tracking-widest text-[10px]">Sequence Audit Trace</h3>
                 <div className="flex-1 h-[1px] bg-outline-variant-low" />
              </div>
              <TimelineView auditLogs={request.audit_logs} />
           </section>
        </div>
      </div>
    </div>
  )
}

export default RequestDetails
