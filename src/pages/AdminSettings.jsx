import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Settings, ShieldCheck, DollarSign, Database, AlertCircle, Save, Trash2, Clock, BellRing, Activity } from 'lucide-react'
import { useCompany } from '../App'
import { procurementApi } from '../services/api'

const AdminSettings = () => {
  const { currentCompany } = useCompany()
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [threshold, setThreshold] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (currentCompany) fetchData()
  }, [currentCompany])

  const fetchData = async () => {
    try {
      const data = await procurementApi.getSettings(currentCompany.id)
      setSettings(data)
      setThreshold(data.approval_threshold.toString())
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await procurementApi.updateSettings(currentCompany.id, parseFloat(threshold))
      alert("Financial guardrails updated successfully.")
    } catch (err) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-20 text-center animate-pulse title-lg">Reading system policy...</div>

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      {/* Header */}
      <section className="flex flex-col gap-2">
        <p className="label-md text-primary font-black uppercase tracking-widest text-xs">Tenant Governance Context</p>
        <h1 className="display-sm text-on-surface text-4xl font-black tracking-tight">{currentCompany?.name} | Config</h1>
      </section>

      <div className="space-y-8">
        {/* Financial Policy */}
        <section className="surface-card space-y-8 border-l-4 border-primary shadow-ambient">
           <div className="flex items-center gap-4 border-b border-outline-variant-low pb-6">
              <div className="w-12 h-12 rounded-sm bg-primary/10 flex items-center justify-center text-primary shadow-sm shrink-0">
                <DollarSign size={24} />
              </div>
              <div>
                <h3 className="title-md font-black tracking-tight uppercase tracking-widest text-xs mb-1">Financial Guardrails</h3>
                <p className="body-sm text-on-surface-variant font-medium">Configure authorization tiers for procurement asset acquisitions.</p>
              </div>
           </div>

           <div className="space-y-6 max-w-md">
             <div className="space-y-3">
                <label className="label-sm text-on-surface-variant font-black uppercase tracking-widest">Director Approval Threshold (RM)</label>
                <div className="flex gap-4">
                  <input 
                    type="number" 
                    value={threshold}
                    onChange={(e) => setThreshold(e.target.value)}
                    className="flex-1 bg-surface-container-low p-4 rounded-sm border border-outline-variant-low label-md font-black focus:border-primary outline-none transition-all shadow-inner"
                    placeholder="e.g. 5000"
                  />
                  <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="px-8 py-4 gradient-fill text-white label-sm font-black uppercase tracking-widest rounded-sm shadow-lg hover:scale-[1.05] transition-all disabled:opacity-50"
                  >
                    {saving ? 'Syncing...' : 'Save Policy'}
                  </button>
                </div>
                <p className="label-sm text-on-surface-variant flex items-center gap-2 mt-2">
                  <AlertCircle size={14} className="text-primary" />
                  Requests exceeding this amount will trigger a PENDING_DIRECTOR gate automatically.
                </p>
             </div>
           </div>
        </section>

        {/* System Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <section className="surface-card space-y-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <Clock size={20} className="text-secondary-fixed" />
                <h3 className="label-md font-black uppercase tracking-widest text-on-surface">Data Retention</h3>
              </div>
              <div className="space-y-2">
                 <p className="label-sm font-bold text-on-surface">Standard Period: 365 Days</p>
                 <p className="body-sm text-on-surface-variant leading-relaxed">Compliance with Sarawak Regional Audit Regulation SWK-992. Automated clearing of expired PO payloads.</p>
              </div>
              <button disabled className="label-sm text-primary font-bold hover:underline opacity-50 cursor-not-allowed uppercase tracking-wider">Configure Storage Tiers</button>
           </section>

           <section className="surface-card space-y-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <BellRing size={20} className="text-tertiary-fixed-variant" />
                <h3 className="label-md font-black uppercase tracking-widest text-on-surface">Global Notifiers</h3>
              </div>
              <div className="space-y-2">
                 <p className="label-sm font-bold text-on-surface">Active Channels: Email, Telegram</p>
                 <p className="body-sm text-on-surface-variant leading-relaxed">Real-time telemetry for all threshold violations and final disbursements.</p>
              </div>
              <button disabled className="label-sm text-primary font-bold hover:underline opacity-50 cursor-not-allowed uppercase tracking-wider">Modify Webhooks</button>
           </section>
        </div>

        {/* Destructive Zone */}
        <section className="surface-card space-y-6 border border-error/20 bg-error/5 opacity-50 grayscale hover:grayscale-0 transition-all shadow-sm">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-sm bg-error/10 flex items-center justify-center text-error">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="label-md font-black text-error uppercase tracking-widest">Enterprise Purge</h3>
                <p className="body-sm text-on-surface-variant">Irreversibly delete this tenant environment and all associated ledger records.</p>
              </div>
           </div>
           <button disabled className="w-full py-3 bg-error/10 text-error label-sm font-black uppercase tracking-widest rounded-sm cursor-not-allowed">Protocol Restricted</button>
        </section>
      </div>
    </div>
  )
}

export default AdminSettings
