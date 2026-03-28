import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, CheckCircle, XCircle, FileText, Download, Lock, Unlock, AlertTriangle } from 'lucide-react'
import { procurementApi } from '../services/api'
import TimelineView from '../components/TimelineView'

const RequestDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [request, setRequest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Demo Mock User Role (In production, this comes from AuthContext)
  const currentUser = { name: "Karlos Albert", role: "MANAGER" }

  useEffect(() => {
    fetchData()
  }, [id])

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

  const handleTransition = async (targetStatus) => {
    try {
      await procurementApi.transitionStatus(id, targetStatus, currentUser.name, currentUser.role)
      fetchData() // Refresh
    } catch (err) {
      alert(err.message)
    }
  }

  if (loading) return <div className="p-12 text-center title-lg">Loading ledger record...</div>
  if (error) return <div className="p-12 text-center text-error title-lg">{error}</div>
  if (!request) return <div className="p-12 text-center title-lg">Request not found</div>

  const isThresholdHigh = request.total_amount > 5000
  const poFile = request.files?.find(f => f.file_type === 'PO')

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-24">
      {/* Header */}
      <section className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
           <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-primary hover:underline label-md font-bold mb-2">
            <ArrowLeft size={16} />
            Back to Dashboard
          </button>
          <div className="flex items-center gap-4">
            <h1 className="display-sm text-on-surface text-3xl font-bold">Request: {request.title}</h1>
            <span className={`chip chip-pending font-bold px-4 py-2 text-sm uppercase`}>{request.status}</span>
          </div>
          <p className="label-md text-on-surface-variant">Vendor: <span className="font-bold text-primary">{request.vendor_name}</span> • ID: {request.vendor_id}</p>
        </div>
        
        <div className="text-right">
          <p className="label-sm text-on-surface-variant font-bold mb-1">Total Procurement Amount</p>
          <p className="display-md text-primary text-4xl">RM {request.total_amount.toLocaleString()}</p>
          {isThresholdHigh && (
            <div className="flex items-center gap-2 justify-end text-error mt-2">
              <AlertTriangle size={14} />
              <span className="label-sm font-bold uppercase tracking-wider">High-Value Threshold Logic Active</span>
            </div>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Main Content: Document Review */}
        <div className="lg:col-span-2 space-y-8">
           <section className="surface-card space-y-8">
            <h3 className="title-lg font-bold border-b border-outline-variant-low pb-4 flex items-center gap-3">
              <FileText size={20} className="text-primary" />
              Procurement Line Items
            </h3>
            <div className="overflow-hidden rounded-sm border border-outline-variant-low">
               <table className="w-full text-left border-collapse">
                <thead className="bg-surface-container-low">
                  <tr className="label-sm font-bold text-on-surface-variant">
                    <th className="p-4">Description</th>
                    <th className="p-4 text-center">Qty</th>
                    <th className="p-4 text-right">Unit (RM)</th>
                    <th className="p-4 text-right">Total (RM)</th>
                  </tr>
                </thead>
                <tbody>
                  {request.items?.map((item, i) => (
                    <tr key={i} className="border-t border-outline-variant-low hover:bg-surface-container-low transition-colors">
                      <td className="p-4 body-md font-semibold">{item.description}</td>
                      <td className="p-4 body-md text-center">{item.quantity}</td>
                      <td className="p-4 body-md text-right">{item.unit_price.toLocaleString()}</td>
                      <td className="p-4 body-md text-right font-bold text-primary">{item.total_price.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
           </section>

           {/* Purchase Order Preview if exists */}
           {poFile && (
             <section className="surface-section rounded-sm space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="title-lg font-bold flex items-center gap-3">
                    <FileText size={20} className="text-primary" />
                    Generated Purchase Order
                  </h3>
                  <a 
                    href={`http://localhost:8000/${poFile.file_path}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center gap-2 label-md text-primary font-bold hover:underline"
                  >
                    <Download size={18} />
                    Download PDF
                  </a>
                </div>
                <div className="bg-white p-12 border border-outline-variant-low rounded-sm shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-10">
                    <h1 className="text-6xl font-black rotate-[-15deg]">UMLAB</h1>
                  </div>
                  <div className="space-y-6 relative z-10">
                    <p className="label-sm font-bold text-on-surface-variant uppercase">Purchase Order Sequence</p>
                    <h2 className="title-lg font-black text-2xl">{poFile.filename}</h2>
                    <p className="body-md text-on-surface-variant leading-relaxed">
                      This document was automatically generated by the UMLAB High-Precision Ledger 
                      upon director-level approval of procurement request {request.id}. 
                      The vendor {request.vendor_name} is hereby authorized to fulfill the listed items.
                    </p>
                  </div>
                </div>
             </section>
           )}
        </div>

        {/* Sidebar: Timeline & Actions */}
        <div className="space-y-12">
           {/* Actions Card */}
           <section className="surface-card space-y-6 border-t-4 border-primary shadow-ambient">
              <h3 className="title-md font-bold text-primary flex items-center gap-3">
                <CheckCircle size={20} />
                Approval Logic Control
              </h3>
              <div className="space-y-4">
                {request.status === 'PENDING_MANAGER' && currentUser.role === 'MANAGER' && (
                  <button 
                    onClick={() => handleTransition(isThresholdHigh ? 'PENDING_DIRECTOR' : 'APPROVED')}
                    className="w-full py-4 gradient-fill text-white label-md font-bold rounded-sm hover:opacity-90 transition-opacity"
                  >
                    Approve as Manager
                  </button>
                )}
                
                {request.status === 'PENDING_DIRECTOR' && currentUser.role === 'DIRECTOR' && (
                  <button 
                    onClick={() => handleTransition('APPROVED')}
                    className="w-full py-4 gradient-fill text-white label-md font-bold rounded-sm hover:opacity-90 transition-opacity"
                  >
                    Final Approval (Director)
                  </button>
                )}

                {request.status === 'PO_ISSUED' && (
                  <button 
                    onClick={() => handleTransition('PAYMENT_PENDING')}
                    className="w-full py-4 bg-tertiary-fixed text-on-tertiary-fixed-variant label-md font-bold rounded-sm hover:brightness-95 transition-all flex items-center justify-center gap-2"
                  >
                    <Unlock size={18} />
                    Initiate Payment Request
                  </button>
                )}

                {!['PO_ISSUED', 'PAYMENT_PENDING', 'PAID', 'APPROVED'].includes(request.status) && (
                   <div className="p-4 bg-error-container text-on-error-container rounded-sm flex gap-3">
                    <Lock size={18} className="shrink-0" />
                    <p className="label-sm font-bold">Payment Request Locked: Sequence restricted until completion of PO issuance.</p>
                  </div>
                )}

                <button className="w-full py-4 border border-outline-variant text-on-surface-variant label-md font-bold rounded-sm hover:bg-surface-container-low transition-colors flex items-center justify-center gap-2">
                  <XCircle size={18} />
                  Reject & Revert
                </button>
              </div>
           </section>

           {/* Timeline Card */}
           <section className="space-y-6">
              <h3 className="title-md font-bold flex items-center gap-3">
                <ArrowDown size={20} className="text-primary" />
                Audit Trail Log
              </h3>
              <TimelineView auditLogs={request.audit_logs} />
           </section>
        </div>
      </div>
    </div>
  )
}

export default RequestDetails
