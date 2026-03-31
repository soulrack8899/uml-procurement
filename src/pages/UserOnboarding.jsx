import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Plus, Users, Shield, Briefcase, Mail, Lock, ChevronDown, CheckCircle2, UserPlus, Trash2, ArrowRight } from 'lucide-react'
import { procurementApi } from '../services/api'
import { useCompany } from '../App'

const UserOnboarding = () => {
  const navigate = useNavigate()
  const { isMobile } = useCompany()
  const [companies, setCompanies] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone_number: '',
    password: 'Temporary@2026',
    company_id: '',
    role: 'REQUESTER'
  })

  const { activeRole, currentCompany } = useCompany()

  useEffect(() => {
    fetchCompanies()
  }, [])

  const fetchCompanies = async () => {
    try {
      const data = await procurementApi.getCompanies()
      // If user is just an ADMIN, they can only onboard for their own company
      const filteredCompanies = activeRole === 'GLOBAL_ADMIN' ? data : data.filter(c => c.id === currentCompany?.id)
      setCompanies(filteredCompanies)
      if (filteredCompanies.length > 0) {
        setFormData(prev => ({ ...prev, company_id: filteredCompanies[0].id }))
      }
    } catch (err) {
      console.error("Failed to load companies", err)
    }
  }

  const handleOnboard = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await procurementApi.onboardUser(formData)
      setShowSuccess(true)
      setTimeout(() => {
        setShowSuccess(false)
        setFormData(prev => ({ ...prev, name: '', email: '', phone_number: '' }))
      }, 3000)
    } catch (err) {
      alert(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  // Available Roles
  const allRoles = [
    { id: 'REQUESTER', name: 'Staff (Requester)', desc: 'Standard personnel. Can initiate procurement requests.' },
    { id: 'MANAGER', name: 'Manager (Approver)', desc: 'Department oversight. Can approve requests within thresholds.' },
    { id: 'FINANCE', name: 'Finance Officer', desc: 'Financial compliance. Manages PO issuance and payments.' },
    { id: 'DIRECTOR', name: 'Director (Board)', desc: 'Highest authority. Required for high-value strategic spend.' },
    { id: 'ADMIN', name: 'System Admin (Procurement)', desc: 'Administrative lead. Manages company users and vendors.' }
  ]

  const availableRoles = allRoles.filter(role => {
    // Only GLOBAL_ADMIN can provision ADMIN/DIRECTOR
    if (['ADMIN', 'DIRECTOR'].includes(role.id)) {
      return activeRole === 'GLOBAL_ADMIN'
    }
    return true
  })

  const S = {
    card: { background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(194,198,211,0.2)', overflow: 'hidden' },
    label: { display: 'block', fontSize: '0.625rem', fontWeight: 900, color: 'var(--outline)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' },
    input: { width: '100%', padding: '0.75rem 1rem', background: 'var(--surface-container-low)', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-sm)', color: 'var(--on-surface)', fontSize: '0.875rem', fontWeight: 600, outline: 'none', transition: 'all 0.2s' }
  }

  return (
    <div style={{ maxWidth: '64rem', margin: '0 auto', paddingBottom: '6rem' }}>
      
      {/* Header Area */}
      <div style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <div style={{ padding: '0.75rem', background: 'var(--primary-container)', borderRadius: 'var(--radius-md)', color: 'var(--on-primary-container)' }}>
            <UserPlus size={24} />
          </div>
          <div>
            <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: isMobile ? '1.5rem' : '2.5rem', fontWeight: 900, color: 'var(--primary)' }}>Add New User</h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--outline)' }}>Invite new team members and assign their access roles within the company.</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '7fr 5fr', gap: '2.5rem', alignItems: 'start' }}>
        
        {/* Form Column */}
        <div style={S.card}>
          <div style={{ background: 'var(--surface-container-high)', padding: '1.5rem', borderBottom: '1px solid rgba(194,198,211,0.1)' }}>
             <h2 style={{ fontSize: '1rem', fontWeight: 800 }}>Account Details</h2>
          </div>
          <form onSubmit={handleOnboard} style={{ padding: isMobile ? '1.5rem' : '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: '1.5rem' }}>
              <div>
                <label style={S.label}>Full Name</label>
                <div style={{ position: 'relative' }}>
                  <Users size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--outline)' }} />
                  <input required placeholder="John Doe" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={{ ...S.input, paddingLeft: '3rem' }} />
                </div>
              </div>
              <div>
                <label style={S.label}>Work Email</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--outline)' }} />
                  <input required type="email" placeholder="john@example.com" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} style={{ ...S.input, paddingLeft: '3rem' }} />
                </div>
              </div>
              <div>
                <label style={S.label}>Phone Number</label>
                <div style={{ position: 'relative' }}>
                  <Briefcase size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--outline)' }} />
                  <input type="text" placeholder="+60 12-345 6789" value={formData.phone_number} onChange={e => setFormData({ ...formData, phone_number: e.target.value })} style={{ ...S.input, paddingLeft: '3rem' }} />
                </div>
              </div>
            </div>

            <div>
              <label style={S.label}>Select Company</label>
              <div style={{ position: 'relative' }}>
                <Briefcase size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--outline)' }} />
                <select value={formData.company_id} onChange={e => setFormData({ ...formData, company_id: e.target.value })} style={{ ...S.input, paddingLeft: '3rem', appearance: 'none', cursor: 'pointer' }}>
                   {companies.map(co => (
                     <option key={co.id} value={co.id}>{co.name}</option>
                   ))}
                </select>
                <ChevronDown size={16} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--outline)', pointerEvents: 'none' }} />
              </div>
            </div>

            <div>
              <label style={S.label}>Select User Role</label>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>
                {availableRoles.map(role => (
                   <div key={role.id} onClick={() => setFormData({ ...formData, role: role.id })} style={{ 
                     padding: '1rem', borderRadius: 'var(--radius-sm)', border: `2px solid ${formData.role === role.id ? 'var(--primary)' : 'transparent'}`,
                     background: formData.role === role.id ? 'var(--primary-container)' : 'var(--surface-container-low)', cursor: 'pointer', transition: 'all 0.2s', position: 'relative'
                   }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        {formData.role === role.id ? <Shield size={16} style={{ color: 'var(--on-primary-container)' }} /> : <div style={{ width: 16 }} /> }
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: formData.role === role.id ? 'var(--on-primary-container)' : 'var(--on-surface)' }}>{role.name}</span>
                     </div>
                     <p style={{ fontSize: '0.625rem', color: formData.role === role.id ? 'var(--on-primary-container)' : 'var(--outline)', lineHeight: 1.4 }}>{role.desc}</p>
                   </div>
                ))}
              </div>
            </div>

            <div style={{ marginTop: '1rem' }}>
               <button disabled={submitting} type="submit" className="gradient-fill" style={{ width: '100%', padding: '1rem', borderRadius: 'var(--radius-md)', border: 'none', color: 'white', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', cursor: 'pointer', transition: 'all 0.3s' }}>
                  {submitting ? 'Processing...' : <>Add User Account <ArrowRight size={18} /></>}
               </button>
            </div>
          </form>
        </div>

        {/* Info Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
           <section style={{ ...S.card, padding: '1.5rem', borderLeft: '4px solid var(--primary)' }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 900, color: 'var(--primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                 <Lock size={16} /> System Security
              </h3>
              <ul style={{ paddingLeft: '1.25rem', fontSize: '0.875rem', color: 'var(--on-surface-variant)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                 <li>Onboarded users receive a default password <strong>password123</strong>.</li>
                 <li>Passwords should be updated upon first sign in.</li>
                 <li>Role-based permissions are enforced throughout the platform.</li>
              </ul>
           </section>

           <AnimatePresence>
             {showSuccess && (
               <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                 style={{ background: 'var(--secondary-container)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', gap: '1rem', border: '1px solid var(--on-secondary-container)' }}>
                  <CheckCircle2 size={32} style={{ color: 'var(--on-secondary-container)' }} />
                  <div>
                    <h4 style={{ fontWeight: 900, color: 'var(--on-secondary-container)' }}>User Added Successfully</h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--on-secondary-container)' }}>The new account is now active for {companies.find(c => c.id == formData.company_id)?.name}.</p>
                  </div>
               </motion.div>
             )}
           </AnimatePresence>
        </div>

      </div>

    </div>
  )
}

export default UserOnboarding
