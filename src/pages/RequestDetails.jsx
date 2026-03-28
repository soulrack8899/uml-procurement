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
  const { refreshKey } = useCompany()
  const [request, setRequest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Demo Context: In production, load from a real User Auth provider
  const currentUser = { name: "Karlos Albert", role: "ADMIN" }

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
      alert(err.message)
    }
  }

  if (loading) return <div className="p-12 text-center title-lg">Reading ledger context...</div>
  if (error) return <div className="p-12 text-center text-error title-lg">{error}</div>
  if (!request) return <div className="p-12 text-center title-lg">Request not found in this tenant.</div>

  const poFile = request.files?.find(f => f.file_type === 'PO')

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-24">
      {/* Header */}
      <section className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
           <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-primary hover:underline label-md font-bold mb-4 uppercase tracking-widest text-xs">
            <ArrowLeft size={16} />
            Tenant Dashboard
          </button>
          <div className="flex items-center gap-4">
            <h1 className="display-sm text-on-surface text-4xl font-black tracking-tight">{request.title}</h1>
            <span className={`chip chip-pending font-black px-4 py-1 text-xs uppercase tracking-widest`}>{request.status}</span>
          </div>
          <p className="label-md text-on-surface-variant font-medium">Vendor Target: <span className="font-bold text-primary">{request.vendor_name}</span> • Sequence: {request.vendor_id}</p>
        </div>
        
        <div className="text-right">
          <p className="label-sm text-on-surface-variant font-black uppercase tracking-widest mb-2 opacity-60">Capital Expenditure</p>
          <p className="display-md text-primary text-5xl font-black">RM {request.total_amount.toLocaleString()}</p>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Main Content: Registry Review */}
        <div className="lg:col-span-2 space-y-10">
           <section className="surface-card p-0 overflow-hidden shadow-ambient border border-outline-variant-low">
            <div className="bg-surface-container-low p-6 border-b border-outline-variant-low flex items-center justify-between">
              <h3 className="title-md font-black flex items-center gap-3 uppercase tracking-widest text-xs">
                Line Item Registry
              </h3>
              <FileText size={18} className="text-primary opacity-40" />
            </div>
            <div className="">
               <table className="w-full text-left border-collapse">
                <thead className="bg-white">
                  <tr className="label-sm font-black text-on-surface-variant uppercase tracking-widest text-[10px]">
                    <th className="p-6">Asset Specification</th>
                    <th className="p-6 text-center">Unit Count</th>
                    <th className="p-6 text-right">Rate (RM)</th>
                    <th className="p-6 text-right">Aggregated (RM)</th>
                  </tr>
                </thead>
                <tbody>
                  {request.items?.map((item, i) => (
                    <tr key={i} className="border-t border-outline-variant-low hover:bg-surface-container-low transition-colors">
                      <td className="p-6 body-md font-bold text-on-surface">{item.description}</td>
                      <td className="p-6 body-md text-center font-black text-on-surface-variant">{item.quantity}</td>
                      <td className="p-6 body-md text-right font-medium">{item.unit_price.toLocaleString()}</td>
                      <td className="p-6 body-md text-right font-black text-primary">{item.total_price.toLocaleString()}</td>
                    </tr>
                  ))}
                  <tr className="bg-primary/5 border-t-2 border-primary">
                    <td colSpan="3" className="p-6 label-md font-black text-right uppercase tracking-widest">Total Asset Value</td>
                    <td className="p-6 title-md font-black text-right text-primary">RM {request.total_amount.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
           </section>

           {/* Purchase Order Preview if exists */}
           {poFile && (
             <section className="surface-card p-0 overflow-hidden shadow-ambient border border-outline-variant-low">
                <div className="bg-primary p-6 flex items-center justify-between text-white">
                  <h3 className="title-md font-black flex items-center gap-3 uppercase tracking-widest text-xs">
                    Official Purchase Order
                  </h3>
                  <a 
                    href={`http://localhost:8000/${poFile.file_path}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center gap-2 label-md font-bold hover:underline"
                  >
                    <Download size={18} />
                    Extract PDF
                  </a>
                </div>
                <div className="bg-white p-16 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-12 opacity-5">
                    <h1 className="text-8xl font-black rotate-[-15deg]">UMLAB</h1>
                  </div>
                  <div className="space-y-8 relative z-10">
                    <div className="space-y-2">
                       <p className="label-sm font-black text-primary uppercase tracking-widest">Digital Authorization Hash</p>
                       <h2 className="title-lg font-black text-3xl uppercase tracking-tighter">{poFile.filename}</h2>
                    </div>
                    <div className="h-0.5 w-20 bg-primary" />
                    <p className="body-lg text-on-surface-variant leading-relaxed font-medium">
                      This instrument of procurement was automatically synthesized by the **UMLAB SaaS Governance Engine** 
                      following multi-tier authorization for request sequence **#{request.id}**. 
                      The designated vendor is hereby authorized to commence fulfillment under the listed specifications.
                    </p>
                  </div>
                </div>
             </section>
           )}
        </div>

        {/* Sidebar: Authorization & Trace */}
        <div className="space-y-10">
           {/* Actions Card */}
           <section className="surface-card space-y-8 border-t-8 border-primary shadow-3xl">
              <div className="flex items-center gap-3">
                 <CheckCircle size={24} className="text-primary" />
                 <h3 className="title-md font-black uppercase tracking-tight">Governance Gate</h3>
              </div>
              
              <div className="space-y-4">
                {['DRAFT', 'SUBMITTED', 'PENDING_MANAGER', 'PENDING_DIRECTOR'].includes(request.status) && (
                  <button 
                    onClick={handleTransition}
                    className="w-full py-5 gradient-fill text-white label-md font-black uppercase tracking-widest rounded-sm shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                  >
                    Authorize Next Sequence
                    <ChevronRight size={18} />
                  </button>
                )}
                
                {request.status === 'PO_ISSUED' && (
                  <button 
                    onClick={handleTransition}
                    className="w-full py-5 bg-tertiary-fixed text-on-tertiary-fixed-variant label-md font-black uppercase tracking-widest rounded-sm shadow-xl flex items-center justify-center gap-3"
                  >
                    <Unlock size={18} />
                    Initiate Payout
                  </button>
                )}

                {!['PO_ISSUED', 'PAYMENT_PENDING', 'PAID', 'APPROVED'].includes(request.status) && (
                   <div className="p-6 bg-surface-container-low text-on-surface-variant rounded-sm border-l-4 border-outline-variant space-y-2">
                    <div className="flex items-center gap-2 text-primary">
                       <Lock size={16} />
                       <p className="label-sm font-black uppercase tracking-widest text-[10px]">Payout sequence locked</p>
                    </div>
                    <p className="body-sm font-medium opacity-60 italic">Authorization pending completion of PO synthesis.</p>
                  </div>
                )}
              </div>
           </section>

           {/* Trace Card */}
           <section className="space-y-6">
              <h3 className="title-md font-black flex items-center gap-3 uppercase tracking-widest text-xs opacity-60">
                Audit Log Stream
              </h3>
              <TimelineView auditLogs={request.audit_logs} />
           </section>
        </div>
      </div>
    </div>
  )
}

export default RequestDetails
