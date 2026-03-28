import React, { useState, useEffect, createContext, useContext, useCallback } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, FileText, Users, CheckSquare, Settings, Menu, X, Plus, Search, Wallet, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { procurementApi } from './services/api'

import Dashboard from './pages/Dashboard'
import ProcurementForm from './pages/ProcurementForm'
import VendorDirectory from './pages/VendorDirectory'
import ApprovalView from './pages/ApprovalView'
import RequestDetails from './pages/RequestDetails'
import PettyCashDashboard from './pages/PettyCashDashboard'
import PaymentRequest from './pages/PaymentRequest'
import AdminSettings from './pages/AdminSettings'
import TenantOnboarding from './pages/TenantOnboarding'

// --- Status Badge Helper (Stitch exact chip classes) ---
export function getStatusChipClass(status) {
  const map = {
    'DRAFT':             'chip-draft',
    'SUBMITTED':         'chip-submitted',
    'PENDING_MANAGER':   'chip-pending',
    'PENDING_DIRECTOR':  'chip-director',
    'APPROVED':          'chip-approved',
    'PO_ISSUED':         'chip-po',
    'PAYMENT_PENDING':   'chip-payment',
    'PAID':              'chip-paid',
    'DISBURSED':         'chip-disbursed',
  }
  return map[status] || 'chip-pending'
}

// --- Multi-Tenant Context ---
const CompanyContext = createContext()
export const useCompany = () => useContext(CompanyContext)

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [companies, setCompanies] = useState([])
  const [currentCompany, setCurrentCompany] = useState(null)
  const [activeRole, setActiveRole] = useState(null)
  const [refreshKey, setRefreshKey] = useState(Date.now())
  const location = useLocation()

  useEffect(() => {
    if (!localStorage.getItem("currentUserId")) localStorage.setItem("currentUserId", "1")
    fetchCompanies()
  }, [])

  useEffect(() => {
    if (currentCompany) fetchActiveRole()
  }, [currentCompany, refreshKey])

  const fetchCompanies = async () => {
    try {
      const data = await procurementApi.getCompanies()
      if (Array.isArray(data)) {
        setCompanies(data)
        const savedId = localStorage.getItem("currentCompanyId")
        const initial = data.find(c => c.id.toString() === savedId) || data[0]
        if (initial) selectTenant(initial)
      } else {
        console.error("Context Registry Failure:", data)
      }
    } catch (err) {
      console.error("Context Registry Failure:", err)
    }
  }

  const fetchActiveRole = async () => {
    try {
      const { active_role } = await procurementApi.whoami()
      setActiveRole(active_role)
    } catch (err) {
      console.error("Context Identification Failure:", err)
      setActiveRole(null)
    }
  }

  const selectTenant = useCallback((company) => {
    if (!company) return
    setCurrentCompany(company)
    localStorage.setItem("currentCompanyId", company.id)
    setRefreshKey(Date.now())
  }, [])

  const handleCompanyChange = useCallback((company) => {
    selectTenant(company)
  }, [selectTenant])

  const navItems = [
    { id: '/', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: '/procurement', label: 'Procurement', icon: <FileText size={20} /> },
    { id: '/petty-cash', label: 'Petty Cash', icon: <Wallet size={20} /> },
    { id: '/payment-request', label: 'Payment Request', icon: <FileText size={20} /> },
    { id: '/vendors', label: 'Vendors', icon: <Users size={20} /> },
    { id: '/approvals', label: 'Approvals', icon: <CheckSquare size={20} /> },
    { id: '/admin-settings', label: 'Admin Settings', icon: <Settings size={20} /> },
  ]

  const sidebarW = sidebarOpen ? 288 : 72

  return (
    <CompanyContext.Provider value={{ currentCompany, companies, selectTenant, handleCompanyChange, refreshKey, activeRole }}>
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--surface)' }}>
        
        {/* ─── Sidebar (Stitch: white bg, ghost border, ambient shadow) ─── */}
        <motion.aside
          initial={false}
          animate={{ width: sidebarW }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{
            position: 'fixed', left: 0, top: 0, height: '100vh', zIndex: 40,
            background: '#ffffff',
            borderRight: '1px solid rgba(194, 198, 211, 0.15)',
            boxShadow: '20px 0 40px rgba(25, 28, 30, 0.06)',
            display: 'flex', flexDirection: 'column', overflow: 'hidden'
          }}
        >
          {/* Brand */}
          <div style={{ padding: sidebarOpen ? '2rem 2rem 1rem' : '2rem 0.75rem 1rem' }}>
            {sidebarOpen ? (
              <div>
                <span style={{ 
                  fontFamily: 'var(--font-headline)', fontSize: '1.125rem', fontWeight: 900, 
                  color: 'var(--primary)', letterSpacing: '-0.02em' 
                }}>UMLAB</span>
                <div style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ 
                    width: 48, height: 48, borderRadius: 'var(--radius-sm)', 
                    background: 'var(--surface-container-high)', overflow: 'hidden',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--primary)', fontWeight: 800, fontSize: '1.25rem'
                  }}>K</div>
                  <div>
                    <p style={{ fontFamily: 'var(--font-headline)', fontWeight: 700, fontSize: '0.875rem', color: 'var(--on-surface)' }}>
                      Karlos Albert
                    </p>
                    <p style={{ fontFamily: 'var(--font-label)', fontSize: '0.75rem', color: 'var(--outline)' }}>
                      {activeRole || 'Identifying...'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ 
                width: 40, height: 40, borderRadius: 'var(--radius-sm)', 
                background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--on-primary)', fontWeight: 900, fontSize: '0.875rem', margin: '0 auto'
              }}>UL</div>
            )}
          </div>

          {/* Nav (Stitch: hover bg surface-container-low, active = primary-fixed bg) */}
          <nav style={{ flex: 1, padding: '1.5rem 1rem 0', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {navItems.map((item) => {
              const isActive = location.pathname === item.id
              return (
                <Link
                  key={item.id}
                  to={item.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: sidebarOpen ? '0.75rem 1rem' : '0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    fontFamily: 'var(--font-label)', fontSize: '0.875rem', fontWeight: isActive ? 600 : 500,
                    color: isActive ? 'var(--primary)' : 'var(--on-surface)',
                    background: isActive ? 'var(--primary-fixed)' : 'transparent',
                    transform: isActive ? 'translateX(4px)' : 'none',
                    transition: 'all 0.15s ease',
                    textDecoration: 'none',
                    justifyContent: sidebarOpen ? 'flex-start' : 'center'
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--surface-container-low)' }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
                >
                  <span style={{ flexShrink: 0, display: 'flex' }}>{item.icon}</span>
                  {sidebarOpen && <span>{item.label}</span>}
                </Link>
              )
            })}
          </nav>

          {/* Footer: System Health + Provision Tenant */}
          <div style={{ padding: '1rem' }}>
            {sidebarOpen && (
              <div style={{ 
                background: 'var(--surface-container-low)', borderRadius: 'var(--radius-lg)', 
                padding: '1rem', marginBottom: '0.5rem' 
              }}>
                <p style={{ fontFamily: 'var(--font-label)', fontSize: '0.625rem', fontWeight: 700, color: 'var(--outline)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
                  System Health
                </p>
                <div className="progress-track" style={{ height: 6 }}>
                  <div className="progress-fill" style={{ width: '92%' }} />
                </div>
                <p style={{ fontFamily: 'var(--font-label)', fontSize: '0.625rem', color: 'var(--on-surface-variant)', marginTop: '0.5rem' }}>
                  92% Resources Available
                </p>
              </div>
            )}
            <Link
              to="/onboard"
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.625rem 1rem', borderRadius: 'var(--radius-sm)',
                fontFamily: 'var(--font-label)', fontSize: '0.75rem', fontWeight: 700,
                color: 'var(--primary)', border: '1px solid rgba(0,52,111,0.2)',
                textDecoration: 'none', transition: 'background 0.15s ease',
                justifyContent: sidebarOpen ? 'flex-start' : 'center'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,52,111,0.05)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <Plus size={16} />
              {sidebarOpen && <span>Provision Tenant</span>}
            </Link>
          </div>
        </motion.aside>

        {/* ─── Main Content ─── */}
        <main style={{ flex: 1, marginLeft: sidebarW, transition: 'margin-left 0.3s ease' }}>
          
          {/* TopAppBar (Stitch: sticky, surface bg, entity switcher) */}
          <header style={{
            position: 'sticky', top: 0, zIndex: 50, 
            background: 'var(--surface)', 
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '1rem 1.5rem', maxWidth: '100%'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {/* Toggle */}
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                style={{ 
                  padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: 'none',
                  background: 'transparent', cursor: 'pointer', color: 'var(--on-surface-variant)',
                  transition: 'background 0.15s' 
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-container-high)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
              </button>

              {/* Company Switcher (Stitch structure) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <div style={{ 
                  width: 40, height: 40, background: 'var(--primary)', borderRadius: 'var(--radius-sm)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--on-primary)', fontWeight: 900, fontSize: '0.75rem'
                }}>UL</div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <select
                      value={currentCompany?.id || ""}
                      onChange={(e) => selectTenant(companies.find(c => c.id.toString() === e.target.value))}
                      style={{
                        fontFamily: 'var(--font-headline)', fontWeight: 700, fontSize: '1.25rem',
                        color: 'var(--primary)', background: 'none', border: 'none', outline: 'none',
                        cursor: 'pointer', padding: 0, letterSpacing: '-0.01em',
                        appearance: 'none'
                      }}
                    >
                      {Array.isArray(companies) && companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <ChevronDown size={14} style={{ color: 'var(--outline)' }} />
                  </div>
                  <span style={{ fontFamily: 'var(--font-label)', fontSize: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--outline)' }}>
                    Corporate Entity
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Search + Avatar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button 
                style={{ padding: '0.5rem', borderRadius: 'var(--radius-pill)', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--primary)', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-container-high)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <Settings size={20} />
              </button>
              <div style={{ 
                width: 32, height: 32, borderRadius: 'var(--radius-pill)', overflow: 'hidden',
                background: 'var(--surface-container-highest)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--primary)', fontWeight: 800, fontSize: '0.75rem'
              }}>K</div>
            </div>
          </header>

          {/* Content (Stitch: flex-1 with proper padding) */}
          <div style={{ padding: '1.5rem 2.5rem', maxWidth: '80rem', margin: '0 auto', width: '100%' }} key={refreshKey}>
            <AnimatePresence mode="wait">
              <Routes location={location} key={location.pathname}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/procurement" element={<ProcurementForm />} />
                <Route path="/vendors" element={<VendorDirectory />} />
                <Route path="/approvals" element={<ApprovalView />} />
                <Route path="/request/:id" element={<RequestDetails />} />
                <Route path="/petty-cash" element={<PettyCashDashboard />} />
                <Route path="/payment-request" element={<PaymentRequest />} />
                <Route path="/admin-settings" element={<AdminSettings />} />
                <Route path="/onboard" element={<TenantOnboarding />} />
              </Routes>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </CompanyContext.Provider>
  )
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}

export default App
