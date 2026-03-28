import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Globe, Plus, CheckCircle, ArrowRight, Zap, Shield, Database } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { procurementApi } from '../services/api'
import { useCompany } from '../App'

const TenantOnboarding = () => {
  const navigate = useNavigate()
  const { handleCompanyChange } = useCompany()
  const [formData, setFormData] = useState({ name: '', domain: '' })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [newCompany, setNewCompany] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const company = await procurementApi.createCompany({
        name: formData.name,
        domain: formData.domain
      })
      setNewCompany(company)
      setSuccess(true)
    } catch (err) {
      alert(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEnterTenant = () => {
    handleCompanyChange(newCompany)
    navigate('/')
  }

  return (
    <div className="max-w-4xl mx-auto py-12">
      <AnimatePresence mode="wait">
        {!success ? (
          <motion.div 
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-12"
          >
            {/* Header */}
            <section className="flex flex-col gap-3 text-center mb-12">
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Globe size={32} />
              </div>
              <h1 className="display-sm text-on-surface text-5xl font-black tracking-tighter">Initialize Enterprise Tenant</h1>
              <p className="body-lg text-on-surface-variant max-w-xl mx-auto">
                Provision a new secure environment within the UMLAB ecosystem. Each tenant operates on a strictly isolated ledger infrastructure.
              </p>
            </section>

            {/* Form */}
            <div className="surface-card shadow-3xl border-t-8 border-primary space-y-12 p-16">
               <form onSubmit={handleSubmit} className="space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                     <div className="space-y-4">
                        <label className="label-sm text-on-surface-variant font-black uppercase tracking-widest text-xs">Entity Legal Name</label>
                        <input 
                          type="text" 
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          className="w-full bg-surface-container-low p-5 rounded-sm border border-outline-variant-low label-md font-black focus:border-primary outline-none transition-all shadow-inner"
                          placeholder="e.g. Alfa Mount Solutions"
                        />
                     </div>
                     <div className="space-y-4">
                        <label className="label-sm text-on-surface-variant font-black uppercase tracking-widest text-xs">Primary Operations Domain</label>
                        <input 
                          type="text" 
                          required
                          value={formData.domain}
                          onChange={(e) => setFormData({...formData, domain: e.target.value})}
                          className="w-full bg-surface-container-low p-5 rounded-sm border border-outline-variant-low label-md font-black focus:border-primary outline-none transition-all shadow-inner"
                          placeholder="e.g. alfamount.my"
                        />
                     </div>
                  </div>

                  <div className="bg-surface-container-lowest p-8 rounded-sm space-y-6 border border-outline-variant-low">
                     <h3 className="label-sm font-black uppercase tracking-widest flex items-center gap-3">
                        <Shield size={16} className="text-primary" />
                        Infrastructure Protocols Engaged
                     </h3>
                     <ul className="space-y-3">
                        <li className="flex items-start gap-4 text-on-surface-variant body-sm">
                           <Zap size={14} className="mt-1 text-tertiary-fixed" />
                           <p><span className="font-bold text-on-surface">Dynamic Financial Guardrails:</span> RM 5,000 baseline threshold will be seeded in the new global context.</p>
                        </li>
                        <li className="flex items-start gap-4 text-on-surface-variant body-sm">
                           <Database size={14} className="mt-1 text-primary-fixed" />
                           <p><span className="font-bold text-on-surface">Ledger Isolation:</span> Unique UUID generation for all future procurement and petty cash records.</p>
                        </li>
                     </ul>
                  </div>

                  <button 
                    type="submit" 
                    disabled={submitting}
                    className="w-full py-6 gradient-fill text-white label-md font-black uppercase tracking-widest rounded-sm shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50"
                  >
                    {submitting ? 'Provisioning Environment...' : 'Authorize Tenant Creation'}
                  </button>
               </form>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="surface-card text-center p-20 shadow-3xl space-y-10 border-t-8 border-tertiary"
          >
             <div className="w-24 h-24 bg-tertiary/10 text-tertiary rounded-full flex items-center justify-center mx-auto mb-8 shadow-ambient">
                <CheckCircle size={48} />
             </div>
             <div className="space-y-4">
                <h1 className="display-sm text-on-surface text-5xl font-black">Provisioning Complete</h1>
                <p className="title-md text-on-surface-variant font-bold uppercase tracking-widest">Context: {newCompany?.name}</p>
             </div>
             <p className="body-lg text-on-surface-variant max-w-sm mx-auto">
                The secure multi-tenant environment is live and the ledger is ready for initialization.
             </p>
             <button 
              onClick={handleEnterTenant}
              className="px-12 py-5 bg-on-surface text-surface label-md font-black uppercase tracking-widest rounded-sm hover-lift flex items-center gap-4 mx-auto"
             >
                Enter Execution Context
                <ArrowRight size={20} />
             </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default TenantOnboarding
