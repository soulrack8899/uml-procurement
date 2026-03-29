import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, CheckCircle2, User, Gavel, Banknote, ShieldCheck, FileText, AlertTriangle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { procurementApi } from '../services/api'
import { useCompany } from '../App'

const Dashboard = () => {
  const { currentCompany, activeRole, isMobile } = useCompany()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    if (currentCompany && activeRole) fetchData()
  }, [currentCompany, activeRole])

  const fetchData = async () => {
    setLoading(true)
    try {
      const data = await procurementApi.getRequests()
      if (activeRole === 'REQUESTER') {
        const myUserId = parseInt(localStorage.getItem("currentUserId") || "1")
        setRequests(data.filter(r => r.created_by === myUserId))
      } else {
        setRequests(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Calculate stats
  const pendingManager = requests.filter(r => r.status.includes('MANAGER')).length
  const pendingDirector = requests.filter(r => r.status.includes('DIRECTOR')).length
  const completed = requests.filter(r => r.status === 'APPROVED' || r.status === 'COMPLETED' || r.status === 'PO_ISSUED').length

  const getStep = (status) => {
    if (status.includes('MANAGER')) return 2;
    if (status.includes('DIRECTOR')) return 3;
    if (status === 'APPROVED' || status === 'COMPLETED' || status === 'PO_ISSUED' || status === 'PAID') return 4;
    return 1;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '1.5rem' : '3rem', paddingBottom: '4rem' }}>
      
      {/* Welcome & Onboarding Guide */}
      <WelcomeGuide activeRole={activeRole} isMobile={isMobile} />

      {/* Tectonic Header Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        
        <StatsCard label="Pending Manager" count={pendingManager} color="var(--secondary)" />
        <StatsCard label="Pending Director" count={pendingDirector} color="var(--tertiary)" />
        <div className="gradient-fill" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 180, borderRadius: 'var(--radius-xl)', color: 'white', boxShadow: '0 20px 40px rgba(0,77,81,0.15)' }}>
          <span style={{ fontFamily: 'var(--font-label)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.7)', fontWeight: 800 }}>Success Overview</span>
          <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'baseline', gap: '1.5rem' }}>
            <div>
              <p style={{ fontFamily: 'var(--font-headline)', fontSize: '3rem', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1 }}>{completed.toString().padStart(2, '0')}</p>
              <p style={{ fontFamily: 'var(--font-label)', fontSize: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.7)', marginTop: '0.5rem' }}>Completed</p>
            </div>
            <div style={{ width: 1, height: 40, background: 'rgba(255,255,255,0.2)' }} />
            <div>
              <p style={{ fontFamily: 'var(--font-headline)', fontSize: '3rem', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1 }}>0.0</p>
              <p style={{ fontFamily: 'var(--font-label)', fontSize: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.7)', marginTop: '0.5rem' }}>Claims</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(12, 1fr)', gap: isMobile ? '1.5rem' : '2.5rem' }}>
        
        {/* Recent Requests */}
        <div style={{ gridColumn: isMobile ? 'auto' : 'span 8', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontFamily: 'var(--font-headline)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--on-surface)', letterSpacing: '-0.02em' }}>Recent Activity</h3>
            <button 
              onClick={fetchData} 
              style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              Refresh <ArrowRight size={16} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {loading ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--outline)' }}>Syncing with ledger...</div>
            ) : requests.length === 0 ? (
              <div className="surface-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--on-surface-variant)' }}>No recent activity to display.</div>
            ) : requests.slice(0, 5).map((req, idx) => (
              <RequestRow key={req.id} req={req} idx={idx} isMobile={isMobile} onClick={() => navigate(`/request/${req.id}`)} />
            ))}
          </div>
        </div>

        {/* Sidebar Activity */}
        <div style={{ gridColumn: isMobile ? 'auto' : 'span 4', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="surface-card" style={{ minHeight: 400, border: 'none', padding: '2rem' }}>
            <h3 style={{ fontFamily: 'var(--font-label)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '2rem' }}>Live Systems</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
              <ActivityItem time="14:22 PM" title="Director Approval" detail="PR-2023-0870 Laboratory Safety Quota" active />
              <ActivityItem time="13:45 PM" title="Payment Disbursed" detail="Vendor: Agilent Technologies ($4.2k)" />
              <ActivityItem time="11:05 AM" title="Liaison Alert" detail="New procurement request from Unit A" />
            </div>
          </div>

          <div style={{ background: 'var(--primary-fixed)', padding: '2rem', borderRadius: 'var(--radius-xl)', position: 'relative', overflow: 'hidden' }}>
            <ShieldCheck size={120} style={{ position: 'absolute', right: -20, bottom: -20, opacity: 0.1, color: 'var(--primary)' }} />
            <h4 style={{ fontFamily: 'var(--font-bold)', fontSize: '1.25rem', color: 'var(--primary)', marginBottom: '0.5rem' }}>Governance Policy</h4>
            <p style={{ fontSize: '0.875rem', color: 'var(--on-surface-variant)', lineHeight: 1.6 }}>
               Procurements exceeding <strong>RM 5,000</strong> require Executive Director clearance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const StatsCard = ({ label, count, color }) => (
  <div className="surface-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 180, borderLeft: `6px solid ${color}` }}>
    <span style={{ fontFamily: 'var(--font-label)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--outline)', fontWeight: 800 }}>{label}</span>
    <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'baseline', gap: '1.5rem' }}>
      <div>
        <p style={{ fontFamily: 'var(--font-headline)', fontSize: '3.5rem', fontWeight: 900, color: 'var(--primary)', letterSpacing: '-0.04em', lineHeight: 1 }}>{count.toString().padStart(2, '0')}</p>
        <p style={{ fontFamily: 'var(--font-label)', fontSize: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--outline)', marginTop: '0.5rem' }}>Procurements</p>
      </div>
      <div style={{ width: 1, height: 40, background: 'var(--outline-variant)' }} />
      <div>
        <p style={{ fontFamily: 'var(--font-headline)', fontSize: '3.5rem', fontWeight: 900, color: color, letterSpacing: '-0.04em', lineHeight: 1 }}>00</p>
        <p style={{ fontFamily: 'var(--font-label)', fontSize: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--outline)', marginTop: '0.5rem' }}>Claims</p>
      </div>
    </div>
  </div>
);

const RequestRow = ({ req, idx, isMobile, onClick }) => {
  const isPayment = req.title.toLowerCase().includes('payment');
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.05 }}
      onClick={onClick}
      className="surface-card hover-lift"
      style={{ 
        padding: isMobile ? '1.25rem' : '1.5rem', 
        borderLeft: `4px solid ${isPayment ? 'var(--secondary)' : 'var(--primary)'}`,
        cursor: 'pointer'
      }}
    >
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', gap: '1rem' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', items: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.625rem', fontWeight: 900, textTransform: 'uppercase', background: isPayment ? 'var(--secondary-container)' : 'var(--primary-fixed)', color: isPayment ? 'var(--on-secondary-container)' : 'var(--primary)', padding: '2px 8px', borderRadius: '4px' }}>
               {isPayment ? 'Payment' : 'Procure'}
            </span>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--outline)' }}>#{req.id}</span>
          </div>
          <h4 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--on-surface)' }}>{req.title}</h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--outline)' }}>{req.vendor_name}</p>
            {req.total_amount > 1000 && !req.quotation_url && (
              <span style={{ fontSize: '0.625rem', fontWeight: 900, color: 'var(--error)', display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--error-container)', padding: '2px 8px', borderRadius: '4px' }}>
                <AlertTriangle size={10} /> MISSING QUOTATION
              </span>
            )}
            {req.quotation_url && (
              <span style={{ fontSize: '0.625rem', fontWeight: 900, color: 'var(--tertiary)', display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--tertiary-fixed)', padding: '2px 8px', borderRadius: '4px' }}>
                <FileText size={10} /> QUOTED
              </span>
            )}
          </div>
        </div>
        <div style={{ textAlign: isMobile ? 'left' : 'right' }}>
           <p style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--primary)' }}>RM {req.total_amount.toLocaleString()}</p>
           <p style={{ fontSize: '0.75rem', color: 'var(--outline)' }}>{new Date(req.created_at).toLocaleDateString()}</p>
        </div>
      </div>
    </motion.div>
  );
};

const ActivityItem = ({ time, title, detail, active }) => (
  <div style={{ display: 'flex', gap: '1rem' }}>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: 10, height: 10, borderRadius: '50%', background: active ? 'var(--tertiary)' : 'var(--outline-variant)', marginTop: 4 }}></div>
      <div style={{ width: 1, flex: 1, background: 'var(--outline-variant)', margin: '4px 0' }}></div>
    </div>
    <div>
      <p style={{ fontSize: '0.75rem', fontWeight: 800, color: active ? 'var(--tertiary)' : 'var(--outline)' }}>{time}</p>
      <p style={{ fontSize: '0.925rem', fontWeight: 700 }}>{title}</p>
      <p style={{ fontSize: '0.75rem', color: 'var(--outline)' }}>{detail}</p>
    </div>
  </div>
);

const WelcomeGuide = ({ activeRole, isMobile }) => {
  const [dismissed, setDismissed] = useState(localStorage.getItem('guideDismissed') === 'true')
  if (dismissed) return null;

  const roleGuides = {
    GLOBAL_ADMIN: {
      title: "System Master Command",
      desc: "As the Global Admin, you are the final authority. Oversee all entities, provision new company admins, and ensure global governance standards are met across the ProcuSure ecosystem.",
      steps: ["Register new Company entities", "Provision Entity Admins and Directors", "Monitor global audit logs"]
    },
    ADMIN: {
      title: "Entity Governance Lead",
      desc: "Welcome to your organization's control center. You manage company settings, internal user onboarding, and vendor directories for your specific organization.",
      steps: ["Onboard Internal Staff", "Add/Update Vendor Directory", "Configure Approval Thresholds"]
    },
    DIRECTOR: {
      title: "Executive Authorization",
      desc: "You are responsible for high-value strategic spend. Your clearance is required for all procurements exceeding company thresholds (e.g., > RM 5,000).",
      steps: ["Review high-value requests", "Authorized overrides", "Executive expenditure trends"]
    },
    MANAGER: {
      title: "Operational Approval",
      desc: "You oversee day-to-day unit spending. Review and approve standard procurement requests from your team within defined limits.",
      steps: ["Review standard requests", "Track team procurement metrics", "Authorize petty cash"]
    },
    REQUESTER: {
      title: "Expedited Procurement",
      desc: "Efficiency starts here. Initiate new procurement requests or claim petty cash for operational needs. Track your items through the approval cycle in real-time.",
      steps: ["Submit new Request", "Attach Quotations for > RM 1k", "Track status in Dashboard"]
    }
  }

  const guide = roleGuides[activeRole] || roleGuides.REQUESTER;

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }} 
      animate={{ opacity: 1, y: 0 }}
      style={{ 
        background: 'var(--surface-container-high)', border: '1px solid rgba(194,198,211,0.2)', 
        borderRadius: 'var(--radius-xl)', padding: '2.5rem', 
        position: 'relative', overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.05)'
      }}
    >
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <ShieldCheck size={24} style={{ color: 'var(--primary)' }} />
          <h2 style={{ fontFamily: 'var(--font-headline)', fontSize: '1.25rem', fontWeight: 900, color: 'var(--primary)', letterSpacing: '-0.02em' }}>
            Welcome to ProcuSure • {guide.title}
          </h2>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(12, 1fr)', gap: '2rem' }}>
           <div style={{ gridColumn: isMobile ? 'auto' : 'span 7' }}>
             <p style={{ fontSize: '0.925rem', color: 'var(--on-surface-variant)', lineHeight: 1.6, marginBottom: '1.5rem' }}>{guide.desc}</p>
             <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                {guide.steps.map((step, idx) => (
                  <div key={idx} style={{ padding: '0.5rem 1rem', background: 'var(--surface-container-low)', borderRadius: 'var(--radius-pill)', border: '1px solid var(--outline-variant-low)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)' }}>
                    <CheckCircle2 size={14} /> {step}
                  </div>
                ))}
             </div>
           </div>

           <div style={{ gridColumn: isMobile ? 'auto' : 'span 5', borderLeft: isMobile ? 'none' : '1px solid var(--outline-variant-low)', paddingLeft: isMobile ? 0 : '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h4 style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--outline)', letterSpacing: '0.1em' }}>Spending Lifecycle</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                 <FlowStep active icon={<FileText size={14}/>} label="Submission" />
                 <FlowStep active icon={<Gavel size={14}/>} label="Management Review" />
                 <FlowStep icon={<Banknote size={14}/>} label="Finance / PO Generation" />
                 <FlowStep icon={<CheckCircle2 size={14}/>} label="Payment Distribution" />
              </div>
           </div>
        </div>
      </div>

      <button onClick={() => { localStorage.setItem('guideDismissed', 'true'); setDismissed(true); }} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', border: 'none', background: 'none', color: 'var(--outline)', cursor: 'pointer', fontFamily: 'var(--font-label)', fontSize: '0.625rem', fontWeight: 900, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
        Dismiss Guide <ArrowRight size={14} />
      </button>
    </motion.div>
  )
}

const FlowStep = ({ active, icon, label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', opacity: active ? 1 : 0.4 }}>
     <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-pill)', background: active ? 'var(--primary)' : 'var(--outline-variant-low)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: active ? 'white' : 'var(--outline)' }}>{icon}</div>
     <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: active ? 'var(--primary)' : 'var(--outline)' }}>{label}</span>
     </div>
  </div>
)

export default Dashboard;
