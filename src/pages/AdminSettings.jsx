import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useCompany } from '../App'
import { procurementApi } from '../services/api'
import { useNavigate } from 'react-router-dom'
import { Shield, Lock, AlertTriangle, ChevronRight, Download, Users, SwitchCamera } from 'lucide-react'

const AdminSettings = () => {
  const navigate = useNavigate()
  const { currentCompany, isMobile } = useCompany()
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [threshold, setThreshold] = useState('')
  const [pettyCashLimit, setPettyCashLimit] = useState('500.00')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (currentCompany) fetchData()
  }, [currentCompany])

  const fetchData = async () => {
    try {
      const data = await procurementApi.getSettings(currentCompany.id)
      setSettings(data)
      setThreshold(data.approval_threshold.toLocaleString('en', { minimumFractionDigits: 2 }))
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await procurementApi.updateSettings(currentCompany.id, parseFloat(threshold.replace(/,/g, '')))
      alert("Financial guardrails updated successfully.")
    } catch (err) { alert(err.message) }
    finally { setSaving(false) }
  }

  if (loading) return (
    <div style={{ padding: '5rem', textAlign: 'center', fontWeight: 700, fontSize: '1.125rem' }} className="animate-pulse">
      Syncing Governance...
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '1.5rem' : '2.5rem', paddingBottom: '4rem' }}>
      {/* Header */}
      <div>
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
           <span style={{ fontFamily: 'var(--font-label)', fontSize: '0.75rem', color: 'var(--outline)' }}>Governance</span>
           <ChevronRight size={12} style={{ color: 'var(--outline)' }} />
           <span style={{ fontFamily: 'var(--font-label)', fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>Global Controls</span>
        </nav>
        <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: isMobile ? '1.5rem' : '2.5rem', fontWeight: 900, color: 'var(--primary)' }}>Global Procurement Controls</h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--outline)', marginTop: '0.5rem', maxWidth: '42rem' }}>
          Configure financial guardrails and ecosystem protocols for {currentCompany?.name}.
        </p>
      </div>

      {/* Bento Grid - Responsive */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(12, 1fr)', gap: '1.5rem' }}>
        
        {/* Financial Thresholds */}
        <section style={{ gridColumn: isMobile ? 'auto' : 'span 7', background: 'var(--surface-container-lowest)', padding: isMobile ? '1.5rem' : '2.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(194,198,211,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Shield size={24} style={{ color: 'var(--primary)' }} />
              <h2 style={{ fontFamily: 'var(--font-headline)', fontSize: '1.25rem', fontWeight: 800 }}>Financial Thresholds</h2>
            </div>
            <span style={{ padding: '0.3rem 0.6rem', background: 'var(--primary-container)', color: 'white', borderRadius: 'var(--radius-pill)', fontSize: '0.625rem', fontWeight: 900, textTransform: 'uppercase' }}>Active</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
             <div>
                <label style={{ fontSize: '0.625rem', fontWeight: 900, color: 'var(--outline)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '1rem' }}>Approval Limit (RM)</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 0, bottom: '0.75rem', color: 'var(--primary)', fontWeight: 900, fontSize: '1.5rem' }}>RM</span>
                  <input type="text" value={threshold} onChange={(e) => setThreshold(e.target.value)} style={{ width: '100%', paddingLeft: '3rem', paddingBottom: '0.5rem', background: 'transparent', border: 'none', borderBottom: '2px solid var(--outline-variant)', fontWeight: 900, fontSize: '1.75rem', color: 'var(--primary)', outline: 'none' }} />
                </div>
                <p style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--outline)' }}>Transactions exceeding this value require Board authorization.</p>
             </div>

             <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '2rem' }}>
                <div style={{ flex: 1 }}>
                   <label style={{ fontSize: '0.625rem', fontWeight: 900, color: 'var(--outline)', textTransform: 'uppercase', marginBottom: '1rem', display: 'block' }}>Daily Petty Cash</label>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 800 }}>RM</span>
                      <input type="text" value={pettyCashLimit} style={{ flex: 1, padding: '0.5rem 0', background: 'transparent', border: 'none', borderBottom: '1px solid var(--outline-variant)', fontWeight: 700, outline: 'none' }} />
                   </div>
                </div>
                <div style={{ background: 'var(--surface-container-low)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(194,198,211,0.1)' }}>
                   <p style={{ fontSize: '0.625rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Auto-Replenish</p>
                   <p style={{ fontWeight: 800, color: 'var(--primary)' }}>System Enabled</p>
                </div>
             </div>
          </div>

          <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid rgba(194,198,211,0.1)', display: 'flex', justifyContent: 'flex-end' }}>
             <button onClick={handleSave} disabled={saving} className="gradient-fill" style={{ padding: '0.75rem 2.5rem', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', fontWeight: 900, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Syncing...' : 'Update Controls'}
             </button>
          </div>
        </section>

        {/* Access Control Panels */}
        <div style={{ gridColumn: isMobile ? 'auto' : 'span 5', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <section style={{ background: 'var(--surface-container-high)', padding: '1.75rem', borderRadius: 'var(--radius-sm)' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <Lock size={20} style={{ color: 'var(--primary)' }} />
                <h3 style={{ fontWeight: 800 }}>Role Authorization</h3>
             </div>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {['Lab Personnel', 'Purchasing Dept', 'Director Board'].map((role, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-sm)' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 700 }}>{role}</span>
                    <span style={{ fontSize: '0.625rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase' }}>{idx === 2 ? 'Override' : 'Standard'}</span>
                  </div>
                ))}
             </div>
             <button onClick={() => navigate('/onboard-users')} style={{ width: '100%', marginTop: '1.5rem', padding: '0.75rem', background: 'transparent', border: '1px solid var(--primary)', borderRadius: 'var(--radius-sm)', color: 'var(--primary)', fontWeight: 800, cursor: 'pointer' }}>Manage Permissions</button>
          </section>

          <section style={{ background: 'var(--error-container)', color: 'white', padding: '1.5rem', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
             <AlertTriangle size={32} />
             <div>
                <p style={{ fontWeight: 900, fontSize: '0.875rem' }}>Channel Lockdown</p>
                <p style={{ fontSize: '0.75rem', opacity: 0.9 }}>Force freeze all open procurement channels.</p>
             </div>
          </section>

        </div>
      </div>

      {/* Audit Log Configuration */}
      <section style={{ background: 'var(--surface-container-low)', padding: isMobile ? '1.5rem' : '2.5rem', borderRadius: 'var(--radius-sm)' }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2.5rem' }}>
            <div>
               <h2 style={{ fontFamily: 'var(--font-headline)', fontSize: '1.5rem', fontWeight: 900 }}>Audit & Transparency</h2>
               <p style={{ fontSize: '0.875rem', color: 'var(--outline)' }}>Governance protocol retention and logging schedules.</p>
            </div>
            <button style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 900, fontSize: '0.75rem', cursor: 'pointer' }}>
               <Download size={14} /> EXPORT TSV LOGS
            </button>
         </div>

         <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '2rem' }}>
            <div>
               <p style={{ fontSize: '0.625rem', fontWeight: 900, color: 'var(--outline)', textTransform: 'uppercase', marginBottom: '1rem' }}>Retention Period</p>
               <h3 style={{ fontSize: '1.5rem', fontWeight: 900 }}>72 Months</h3>
               <p style={{ fontSize: '0.625rem', color: 'var(--primary)', fontWeight: 700, marginTop: '0.5rem' }}>Compliant with State Policy</p>
            </div>
            <div>
               <p style={{ fontSize: '0.625rem', fontWeight: 900, color: 'var(--outline)', textTransform: 'uppercase', marginBottom: '1rem' }}>Alert Delivery</p>
               <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--primary)' }} />
                  <span style={{ fontSize: '0.875rem', fontWeight: 800 }}>Real-time Critical</span>
               </div>
            </div>
            <div>
               <p style={{ fontSize: '0.625rem', fontWeight: 900, color: 'var(--outline)', textTransform: 'uppercase', marginBottom: '1rem' }}>Encryption Level</p>
               <span style={{ padding: '0.4rem 0.8rem', background: 'var(--tertiary-container)', color: 'white', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', fontWeight: 900 }}>E2EE ACTIVE</span>
            </div>
         </div>

         {/* Audit Table - Responsive with scroll */}
         <div style={{ marginTop: '3rem', overflowX: 'auto', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(194,198,211,0.2)' }}>
            <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', textAlign: 'left' }}>
               <thead>
                  <tr style={{ background: 'var(--surface-container-high)' }}>
                     {['Timestamp', 'Identity', 'Action Profile', 'Outcome'].map(h => (
                        <th key={h} style={{ padding: '1rem', fontSize: '0.625rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{h}</th>
                     ))}
                  </tr>
               </thead>
               <tbody>
                  {[
                    { time: 'Mar 29, 14:15:02', id: 'Sys_Admin_K', action: 'Modified Threshold: RM5k -> RM3k', out: 'COMMITTED' },
                    { time: 'Mar 29, 10:22:11', id: 'Kernel_Syc', action: 'Auto-Replenish petty_cash_id_02', out: 'EXECUTED' }
                  ].map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(194,198,211,0.1)' }}>
                       <td style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 600 }}>{row.time}</td>
                       <td style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)' }}>{row.id}</td>
                       <td style={{ padding: '1rem', fontSize: '0.75rem' }}>{row.action}</td>
                       <td style={{ padding: '1rem' }}>
                          <span style={{ fontSize: '0.5rem', fontWeight: 900, padding: '0.2rem 0.5rem', background: 'var(--primary-container)', color: 'white', borderRadius: '2px' }}>{row.out}</span>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </section>

      {/* Entity Switch Banner */}
      <section style={{ background: 'var(--primary)', color: 'white', padding: isMobile ? '1.5rem' : '2.5rem', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
         <div>
            <h4 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '0.5rem' }}>Cross-Entity Deployment</h4>
            <p style={{ fontSize: '0.875rem', opacity: 0.8, maxWidth: '30rem' }}>Managing <strong style={{ textDecoration: 'underline' }}>{currentCompany?.name}</strong>. Switch to cluster oversight for Alfa Mount or HPSB.</p>
         </div>
         <button style={{ padding: '0.75rem 2rem', background: 'white', color: 'var(--primary)', border: 'none', borderRadius: 'var(--radius-sm)', fontWeight: 900, cursor: 'pointer' }}>
            Switch Entity Hub
         </button>
      </section>
    </div>
  )
}

export default AdminSettings
