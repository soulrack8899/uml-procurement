import React, { useState, useEffect, createContext, useContext, useCallback } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom'
import { LayoutDashboard, FileText, Users, CheckSquare, Settings, Menu, X, Plus, Search, Wallet, ChevronDown, LogOut } from 'lucide-react'
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
import Login from './pages/Login'

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

// --- Context ---
const CompanyContext = createContext()
export const useCompany = () => useContext(CompanyContext)

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const [companies, setCompanies] = useState([])
  const [currentCompany, setCurrentCompany] = useState(null)
  const [activeRole, setActiveRole] = useState(null)
  const [userName, setUserName] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem("currentUserId"))
  const [refreshKey, setRefreshKey] = useState(Date.now())
  const location = useLocation()

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768
      setIsMobile(mobile)
      if (mobile) setSidebarOpen(false)
      else if (window.innerWidth > 1024) setSidebarOpen(true)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      setUserName(localStorage.getItem("currentUserName") || "User")
      fetchCompanies()
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (isAuthenticated && currentCompany) fetchActiveRole()
  }, [isAuthenticated, currentCompany, refreshKey])

  const fetchCompanies = async () => {
    try {
      const data = await procurementApi.getCompanies()
      if (Array.isArray(data)) {
        setCompanies(data)
        const savedId = localStorage.getItem("currentCompanyId")
        const initial = data.find(c => c.id.toString() === savedId) || data[0]
        if (initial) selectTenant(initial)
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

  const handleLogin = (user) => {
    setIsAuthenticated(true)
    setUserName(user.name)
  }

  const handleLogout = () => {
    localStorage.removeItem("currentUserId")
    localStorage.removeItem("currentUserName")
    setIsAuthenticated(false)
    setActiveRole(null)
    setCurrentCompany(null)
  }

  const navItems = [
    { id: '/', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: '/procurement', label: 'Procurement', icon: <FileText size={20} /> },
    { id: '/petty-cash', label: 'Petty Cash', icon: <Wallet size={20} /> },
    { id: '/payment-request', label: 'Payment Request', icon: <FileText size={20} /> },
    { id: '/vendors', label: 'Vendors', icon: <Users size={20} /> },
    { id: '/approvals', label: 'Approvals', icon: <CheckSquare size={20} /> },
    { id: '/admin-settings', label: 'Admin Settings', icon: <Settings size={20} /> },
  ]

  if (!isAuthenticated) {
    return (
      <CompanyContext.Provider value={{ isAuthenticated, isMobile }}>
        <Routes>
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </CompanyContext.Provider>
    )
  }

  const sidebarW = isMobile ? 280 : (sidebarOpen ? 288 : 72)

  return (
    <CompanyContext.Provider value={{ currentCompany, companies, selectTenant, refreshKey, activeRole, userName, isMobile }}>
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--surface)' }}>
        
        {/* --- Mobile Overlay --- */}
        <AnimatePresence>
          {isMobile && sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              style={{
                position: 'fixed', inset: 0, zIndex: 100, 
                background: 'rgba(25, 28, 30, 0.4)', backdropFilter: 'blur(4px)'
              }}
            />
          )}
        </AnimatePresence>

        {/* --- Sidebar --- */}
        <motion.aside
          initial={false}
          animate={{ 
            width: sidebarW,
            x: isMobile && !sidebarOpen ? -280 : 0
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{
            position: isMobile ? 'fixed' : 'fixed', left: 0, top: 0, height: '100vh', zIndex: 110,
            background: '#ffffff',
            borderRight: '1px solid rgba(194, 198, 211, 0.15)',
            boxShadow: '20px 0 40px rgba(25, 28, 30, 0.06)',
            display: 'flex', flexDirection: 'column', overflow: 'hidden'
          }}
        >
          {/* Brand */}
          <div style={{ padding: (sidebarOpen || isMobile) ? '2rem 2.25rem 1.5rem' : '2rem 1.125rem 1.5rem' }}>
            {sidebarOpen || isMobile ? (
              <div>
                <span style={{ 
                  fontFamily: 'var(--font-headline)', fontSize: '1.5rem', fontWeight: 900, 
                  color: 'var(--primary)', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '10px'
                }}>
                  <svg width="28" height="28" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M40 70 L20 50 L40 30" stroke="var(--primary)" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M60 70 L80 50 L60 30" stroke="var(--secondary)" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="50" cy="50" r="12" fill="var(--tertiary)"/>
                  </svg>
                  ProcuSure
                </span>
                <div style={{ marginTop: '2.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ 
                    width: 52, height: 52, borderRadius: 'var(--radius-xl)', 
                    background: 'var(--primary)', overflow: 'hidden',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: 800, fontSize: '1.25rem'
                  }}>{userName.substring(0, 1) || 'U'}</div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <p style={{ 
                      fontFamily: 'var(--font-headline)', fontWeight: 800, fontSize: '1rem', 
                      color: 'var(--on-surface)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' 
                    }}>
                      {userName}
                    </p>
                    <p style={{ fontFamily: 'var(--font-label)', fontSize: '0.75rem', color: 'var(--outline)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {activeRole?.replace('_', ' ') || 'Identifying...'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ 
                width: 48, height: 48, borderRadius: 'var(--radius-xl)', 
                background: 'var(--surface-container-highest)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--primary)', margin: '0 auto'
              }}>
                <svg width="24" height="24" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M40 70 L20 50 L40 30" stroke="var(--primary)" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M60 70 L80 50 L60 30" stroke="var(--secondary)" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav style={{ flex: 1, padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto' }}>
            {navItems.map((item) => {
              const isActive = location.pathname === item.id || (item.id !== '/' && location.pathname.startsWith(item.id))
              return (
                <Link
                  key={item.id}
                  to={item.id}
                  onClick={() => isMobile && setSidebarOpen(false)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '1rem',
                    padding: (sidebarOpen || isMobile) ? '0.875rem 1.25rem' : '1rem',
                    borderRadius: 'var(--radius-xl)',
                    fontFamily: 'var(--font-label)', fontSize: '0.925rem', fontWeight: isActive ? 700 : 500,
                    color: isActive ? 'var(--primary)' : 'var(--outline)',
                    background: isActive ? 'var(--primary-fixed)' : 'transparent',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    textDecoration: 'none',
                    justifyContent: (sidebarOpen || isMobile) ? 'flex-start' : 'center',
                    boxShadow: isActive ? '0 4px 12px rgba(14, 77, 81, 0.1)' : 'none'
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--surface-container-low)'; e.currentTarget.style.color = 'var(--on-surface)' }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--outline)' }}
                >
                  <span style={{ flexShrink: 0, display: 'flex' }}>{item.icon}</span>
                  {(sidebarOpen || isMobile) && <span>{item.label}</span>}
                </Link>
              )
            })}
          </nav>

          {/* Footer actions */}
          <div style={{ padding: '1.5rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Link
              to="/onboard"
              onClick={() => isMobile && setSidebarOpen(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.875rem 1.25rem', borderRadius: 'var(--radius-xl)',
                fontFamily: 'var(--font-label)', fontSize: '0.875rem', fontWeight: 700,
                color: 'var(--tertiary)', background: 'var(--tertiary-fixed)',
                textDecoration: 'none', transition: 'all 0.2s ease',
                justifyContent: (sidebarOpen || isMobile) ? 'flex-start' : 'center'
              }}
              onMouseEnter={e => e.currentTarget.style.filter = 'brightness(0.95)'}
              onMouseLeave={e => e.currentTarget.style.filter = 'none'}
            >
              <Plus size={18} />
              {(sidebarOpen || isMobile) && <span>New Tenant</span>}
            </Link>
            <button
              onClick={handleLogout}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.875rem 1.25rem', borderRadius: 'var(--radius-xl)',
                fontFamily: 'var(--font-label)', fontSize: '0.875rem', fontWeight: 600,
                color: 'var(--error)', border: '1px solid var(--error-container)',
                background: 'transparent', cursor: 'pointer',
                justifyContent: (sidebarOpen || isMobile) ? 'flex-start' : 'center',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--error-container)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <LogOut size={18} />
              {(sidebarOpen || isMobile) && <span>Log Out</span>}
            </button>
          </div>
        </motion.aside>

        {/* --- Main Content --- */}
        <main style={{ 
          flex: 1, 
          marginLeft: isMobile ? 0 : sidebarW, 
          transition: 'margin-left 0.3s ease',
          width: isMobile ? '100%' : `calc(100% - ${sidebarW}px)`
        }}>
          
          {/* TopAppBar */}
          <header style={{
            position: 'sticky', top: 0, zIndex: 90, 
            background: 'rgba(248, 249, 251, 0.8)', 
            backdropFilter: 'blur(8px)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '1rem 2rem', borderBottom: '1px solid var(--outline-variant-low)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              {/* Menu Toggle */}
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                style={{ 
                  width: 40, height: 40, borderRadius: 'var(--radius-xl)', border: 'none',
                  background: 'var(--surface-container-low)', cursor: 'pointer', color: 'var(--primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
              </button>

              {/* Company Switcher */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ 
                  width: 44, height: 44, background: 'var(--primary)', borderRadius: 'var(--radius-xl)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--on-primary)', fontWeight: 900, fontSize: '0.875rem',
                  boxShadow: '0 4px 12px rgba(14, 77, 81, 0.2)'
                }}>{currentCompany?.name?.substring(0, 1).toUpperCase() || 'P'}</div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <select
                      value={currentCompany?.id || ""}
                      onChange={(e) => selectTenant(companies.find(c => c.id.toString() === e.target.value))}
                      style={{
                        fontFamily: 'var(--font-headline)', fontWeight: 800, fontSize: '1.25rem',
                        color: 'var(--on-surface)', background: 'none', border: 'none', outline: 'none',
                        cursor: 'pointer', padding: 0, letterSpacing: '-0.02em', appearance: 'none'
                      }}
                    >
                      {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <ChevronDown size={16} style={{ color: 'var(--outline)' }} />
                  </div>
                  <span style={{ fontFamily: 'var(--font-label)', fontSize: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--outline)', fontWeight: 700 }}>
                    Active Entity Context
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ display: isMobile ? 'none' : 'flex', padding: '0.5rem 1rem', background: 'var(--surface-container-low)', borderRadius: 'var(--radius-pill)', border: '1px solid var(--outline-variant-low)', gap: '0.5rem', alignItems: 'center' }}>
                <Search size={16} />
                <input placeholder="Search ledger..." style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.875rem', width: '120px' }} />
              </div>
              <div style={{ 
                width: 36, height: 36, borderRadius: 'var(--radius-pill)', overflow: 'hidden',
                background: 'var(--primary-fixed)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--primary)', fontWeight: 800, fontSize: '0.875rem'
              }}>{userName.substring(0, 1) || 'U'}</div>
            </div>
          </header>

          {/* Content */}
          <div className="main-content-wrapper" style={{ padding: '2rem 3rem', maxWidth: '90rem', margin: '0 auto', width: '100%', minHeight: 'calc(100vh - 80px)' }} key={refreshKey}>
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                style={{ width: '100%', height: '100%' }}
              >
                <Routes location={location}>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/procurement" element={<ProcurementForm />} />
                  <Route path="/vendors" element={<VendorDirectory />} />
                  <Route path="/approvals" element={<ApprovalView />} />
                  <Route path="/request/:id" element={<RequestDetails />} />
                  <Route path="/petty-cash" element={<PettyCashDashboard />} />
                  <Route path="/payment-request" element={<PaymentRequest />} />
                  <Route path="/admin-settings" element={<AdminSettings />} />
                  <Route path="/onboard" element={<TenantOnboarding />} />
                  <Route path="/login" element={<Navigate to="/" />} />
                </Routes>
              </motion.div>
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
