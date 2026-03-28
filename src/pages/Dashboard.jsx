import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, CheckCircle2, User, Gavel, Banknote, ShieldCheck, FileText, ArrowUpRight } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { procurementApi } from '../services/api'
import { useCompany, getStatusChipClass } from '../App'

/* ─────────────────────────────────────────────────────
   Dashboard — Synced with styling from soulrack8899/procurement-frontend
   ───────────────────────────────────────────────────── */

const Dashboard = () => {
  const { currentCompany } = useCompany()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    if (currentCompany) fetchData()
  }, [currentCompany])

  const fetchData = async () => {
    setLoading(true)
    try {
      const data = await procurementApi.getRequests()
      setRequests(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Calculate dynamic stats
  const pendingManager = requests.filter(r => r.status.includes('MANAGER')).length
  const pendingDirector = requests.filter(r => r.status.includes('DIRECTOR')).length
  const completed = requests.filter(r => r.status === 'APPROVED' || r.status === 'COMPLETED').length

  const getStep = (status) => {
    if (status.includes('MANAGER')) return 2;
    if (status.includes('DIRECTOR')) return 3;
    if (status === 'APPROVED' || status === 'COMPLETED') return 4;
    return 1;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem', paddingBottom: '4rem', maxWidth: '80rem', margin: '0 auto' }}>
      
      {/* Tectonic Header Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        
        <div style={{ background: 'var(--surface-container-low)', padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 160, borderRadius: 'var(--radius-sm)', borderLeft: '4px solid rgba(0,52,111,0.2)' }}>
          <span style={{ fontFamily: 'var(--font-label)', fontSize: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--secondary)', fontWeight: 700 }}>Pending Manager</span>
          <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'baseline', gap: '1rem' }}>
            <div>
              <p style={{ fontFamily: 'var(--font-headline)', fontSize: '2.5rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '-0.02em', lineHeight: 1 }}>{pendingManager.toString().padStart(2, '0')}</p>
              <p style={{ fontFamily: 'var(--font-label)', fontSize: '0.5625rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--outline)', marginTop: '0.25rem' }}>Procure</p>
            </div>
            <div style={{ height: 32, width: 1, background: 'rgba(194,198,211,0.3)' }}></div>
            <div>
              <p style={{ fontFamily: 'var(--font-headline)', fontSize: '2.5rem', fontWeight: 800, color: 'var(--secondary)', letterSpacing: '-0.02em', lineHeight: 1 }}>00</p>
              <p style={{ fontFamily: 'var(--font-label)', fontSize: '0.5625rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--outline)', marginTop: '0.25rem' }}>Payment</p>
            </div>
          </div>
        </div>

        <div style={{ background: 'var(--surface-container-low)', padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 160, borderRadius: 'var(--radius-sm)', borderLeft: '4px solid rgba(0,165,181,0.2)' }}>
          <span style={{ fontFamily: 'var(--font-label)', fontSize: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--secondary)', fontWeight: 700 }}>Pending Director</span>
          <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'baseline', gap: '1rem' }}>
            <div>
              <p style={{ fontFamily: 'var(--font-headline)', fontSize: '2.5rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '-0.02em', lineHeight: 1 }}>{pendingDirector.toString().padStart(2, '0')}</p>
              <p style={{ fontFamily: 'var(--font-label)', fontSize: '0.5625rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--outline)', marginTop: '0.25rem' }}>Procure</p>
            </div>
            <div style={{ height: 32, width: 1, background: 'rgba(194,198,211,0.3)' }}></div>
            <div>
              <p style={{ fontFamily: 'var(--font-headline)', fontSize: '2.5rem', fontWeight: 800, color: 'var(--secondary)', letterSpacing: '-0.02em', lineHeight: 1 }}>00</p>
              <p style={{ fontFamily: 'var(--font-label)', fontSize: '0.5625rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--outline)', marginTop: '0.25rem' }}>Payment</p>
            </div>
          </div>
        </div>

        <div className="gradient-fill" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 160, borderRadius: 'var(--radius-sm)', color: 'white', boxShadow: '0 20px 40px rgba(0,52,111,0.1)' }}>
          <span style={{ fontFamily: 'var(--font-label)', fontSize: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.7)', fontWeight: 700 }}>Completed Today</span>
          <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'baseline', gap: '1.5rem' }}>
            <div>
              <p style={{ fontFamily: 'var(--font-headline)', fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1 }}>{completed.toString().padStart(2, '0')}</p>
              <p style={{ fontFamily: 'var(--font-label)', fontSize: '0.5625rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'rgba(255,255,255,0.7)', marginTop: '0.25rem' }}>Orders</p>
            </div>
            <div>
              <p style={{ fontFamily: 'var(--font-headline)', fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1 }}>03</p>
              <p style={{ fontFamily: 'var(--font-label)', fontSize: '0.5625rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'rgba(255,255,255,0.7)', marginTop: '0.25rem' }}>Claims</p>
            </div>
          </div>
        </div>

      </div>

      {/* Main Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '2.5rem' }}>
        
        {/* Recent Requests (8 cols) */}
        <div style={{ gridColumn: 'span 8', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <h3 style={{ fontFamily: 'var(--font-headline)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--on-surface)', letterSpacing: '-0.02em' }}>Recent Requests & Claims</h3>
            <Link to="/procurement" style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.25rem', textDecoration: 'none' }}>
              View All <ArrowRight size={16} />
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {loading ? (
              <div style={{ padding: '3rem', textAlign: 'center', fontFamily: 'var(--font-label)', color: 'var(--outline)' }}>Syncing with ledger...</div>
            ) : requests.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', fontFamily: 'var(--font-body)', color: 'var(--on-surface-variant)' }}>No recent activity.</div>
            ) : requests.slice(0, 5).map((req, idx) => {
              const currentStep = getStep(req.status);
              const isPayment = req.title.toLowerCase().includes('payment') || req.title.toLowerCase().includes('invoice');

              return (
                <motion.div 
                  key={req.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  onClick={() => navigate(`/request/${req.id}`)}
                  style={{
                    background: 'var(--surface-container-lowest)', padding: '1.5rem', borderRadius: 'var(--radius-sm)',
                    borderLeft: `4px solid ${isPayment ? 'var(--secondary)' : 'var(--primary)'}`, cursor: 'pointer',
                    transition: 'background 0.2s', boxShadow: '0 10px 30px rgba(0,0,0,0.02)'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-container-high)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--surface-container-lowest)'}
                >
                  <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '1rem' }}>
                    
                    <div style={{ flex: 1, minWidth: '300px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <span style={{ 
                          padding: '0.125rem 0.5rem', borderRadius: 4, fontSize: '0.5625rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.04em',
                          background: isPayment ? 'var(--secondary)' : 'var(--primary)', color: 'white'
                        }}>
                          {isPayment ? 'payment' : 'procurement'}
                        </span>
                        <span style={{ fontFamily: 'var(--font-label)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)' }}>#{req.id}</span>
                        <span style={{ 
                          padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-pill)',
                          fontFamily: 'var(--font-label)', fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                          background: req.status === 'APPROVED' ? 'var(--tertiary-fixed)' : req.status.includes('DIRECTOR') ? 'var(--error-container)' : 'var(--secondary-container)',
                          color: req.status === 'APPROVED' ? 'var(--on-tertiary-fixed-variant)' : req.status.includes('DIRECTOR') ? 'var(--on-error-container)' : 'var(--on-secondary-container)'
                        }}>
                          {req.status}
                        </span>
                      </div>
                      <h4 style={{ fontFamily: 'var(--font-body)', fontSize: '1.125rem', fontWeight: 700, color: 'var(--on-surface)', lineHeight: 1.2 }}>{req.title}</h4>
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--outline)', marginTop: '0.25rem' }}>Vendor: {req.vendor_name}</p>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontFamily: 'var(--font-headline)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>RM {req.total_amount.toLocaleString('en', {minimumFractionDigits:2})}</p>
                      <p style={{ fontFamily: 'var(--font-label)', fontSize: '0.75rem', color: 'var(--outline)', marginTop: '0.25rem' }}>{new Date(req.created_at).toLocaleDateString()}</p>
                    </div>

                  </div>

                  {/* Mini Progress Tracker */}
                  <div style={{ marginTop: '2rem', borderTop: '1px solid rgba(194,198,211,0.2)', paddingTop: '1.5rem' }}>
                    <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '28rem' }}>
                      <div style={{ position: 'absolute', top: '50%', left: 0, width: '100%', height: 1, borderTop: '1px dashed var(--outline-variant)', transform: 'translateY(-50%)', zIndex: 0 }}></div>
                      
                      {[
                        { label: isPayment ? 'Invoice' : 'Request', icon: isPayment ? Banknote : FileText },
                        { label: 'Manager', icon: User },
                        { label: isPayment ? 'Director' : 'Finance', icon: isPayment ? Gavel : ShieldCheck },
                        { label: isPayment ? 'Disbursed' : 'Complete', icon: CheckCircle2 }
                      ].map((step, i) => {
                        const isActive = i + 1 <= currentStep;
                        const isCurrent = i + 1 === currentStep;
                        return (
                          <div key={i} style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{
                              width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.5s',
                              background: isActive ? 'var(--primary)' : 'var(--surface-container-high)',
                              color: isActive ? 'white' : 'var(--outline)',
                              border: isActive ? 'none' : '1px solid var(--outline-variant)',
                              boxShadow: isActive ? '0 4px 12px rgba(0,52,111,0.2)' : 'none',
                              outline: isCurrent ? '4px solid rgba(0,52,111,0.1)' : 'none'
                            }}>
                              <step.icon size={14} />
                            </div>
                            <span style={{ fontFamily: 'var(--font-label)', fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', marginTop: '0.5rem', color: isActive ? 'var(--primary)' : 'var(--outline)' }}>
                              {step.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Sidebar Activity (4 cols) */}
        <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <div style={{ background: 'var(--surface-container-highest)', padding: '1.5rem', borderRadius: 'var(--radius-sm)', minHeight: 400 }}>
            <h3 style={{ fontFamily: 'var(--font-label)', fontSize: '0.875rem', fontWeight: 700, color: 'var(--secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1.5rem' }}>Live Activity Feed</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {[
                { time: '14:22 PM', title: 'Director approved PR-2023-0870', detail: '"Necessary for Q4 laboratory safety quota."', type: 'primary' },
                { time: '13:45 PM', title: 'Payment Released: #PY-2023-0390', detail: 'Vendor: Agilent Technologies', type: 'secondary' },
                { time: '11:05 AM', title: 'New Request: #PR-2023-0892', detail: 'By Lab Technician A. Razak', type: 'outline' },
                { time: '09:15 AM', title: 'Payment Claim Submitted: #PY-2023-0412', detail: 'Supporting docs attached: Shimadzu Invoice 9022', type: 'secondary' }
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ 
                      width: 8, height: 8, borderRadius: '50%', marginTop: 4,
                      background: item.type === 'primary' ? 'var(--primary)' : item.type === 'secondary' ? 'var(--secondary)' : 'var(--outline-variant)'
                    }}></div>
                    {i < 3 && <div style={{ width: 1, flex: 1, background: 'var(--outline-variant)', margin: '4px 0' }}></div>}
                  </div>
                  <div>
                    <p style={{ 
                      fontFamily: 'var(--font-label)', fontSize: '0.75rem', fontWeight: 700, 
                      color: item.type === 'primary' ? 'var(--primary)' : item.type === 'secondary' ? 'var(--secondary)' : 'var(--outline)' 
                    }}>{item.time}</p>
                    <p style={{ fontFamily: 'var(--font-headline)', fontSize: '0.875rem', fontWeight: 700, color: 'var(--on-surface)' }}>{item.title}</p>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--outline)', marginTop: '0.25rem', fontStyle: 'italic' }}>{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: 'var(--primary-fixed)', padding: '1.5rem', borderRadius: 'var(--radius-sm)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', right: -16, bottom: -16, opacity: 0.1, color: 'var(--primary)' }}>
              <ShieldCheck size={160} />
            </div>
            <h4 style={{ fontFamily: 'var(--font-headline)', fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.5rem', position: 'relative', zIndex: 10 }}>Compliance Alert</h4>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--on-primary-fixed-variant)', lineHeight: 1.5, position: 'relative', zIndex: 10 }}>
              Sarawak Division policy requires 3 quotations for any procurement exceeding RM 5,000. Payment claims must include a verified delivery order.
            </p>
            <button style={{ 
              marginTop: '1rem', fontFamily: 'var(--font-label)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
              color: 'var(--primary)', borderBottom: '2px solid var(--primary)', paddingBottom: '0.25rem', background: 'transparent',
              borderTop: 'none', borderLeft: 'none', borderRight: 'none', cursor: 'pointer', position: 'relative', zIndex: 10
            }}>
              Review Policy
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Dashboard;
