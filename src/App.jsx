import React, { useState, useEffect, createContext, useContext, useCallback } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, FileText, Users, CheckSquare, Settings, Menu, X, Plus, Bell, Search, Globe, Wallet } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { procurementApi } from './services/api'

import Dashboard from './pages/Dashboard'
import ProcurementForm from './pages/ProcurementForm'
import VendorDirectory from './pages/VendorDirectory'
import ApprovalView from './pages/ApprovalView'
import RequestDetails from './pages/RequestDetails'
import PettyCashDashboard from './pages/PettyCashDashboard'
import AdminSettings from './pages/AdminSettings'
import TenantOnboarding from './pages/TenantOnboarding'

// --- Multi-Tenant Context Provider ---
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
    // Persistent initial admin mock
    if (!localStorage.getItem("currentUserId")) localStorage.setItem("currentUserId", "1")
    fetchCompanies()
  }, [])

  // Sync role when company changes
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
        console.error("Context Registry Failure: Invalid data format", data)
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
    setRefreshKey(Date.now()) // Clears stale cache/state
  }, [])

  const navItems = [
    { id: '/', label: 'Context Overview', icon: <LayoutDashboard size={20} /> },
    { id: '/procurement', label: 'Procurement Ledger', icon: <FileText size={20} /> },
    { id: '/petty-cash', label: 'Cash Disbursement', icon: <Wallet size={20} /> },
    { id: '/vendors', label: 'Asset Vendors', icon: <Users size={20} /> },
    { id: '/approvals', label: 'Audit Gates', icon: <CheckSquare size={20} /> },
    { id: '/admin-settings', label: 'Policy Settings', icon: <Settings size={20} /> },
  ]

  return (
    <CompanyContext.Provider value={{ currentCompany, companies, selectTenant, refreshKey, activeRole }}>
      <div className="min-h-screen bg-surface flex selection:bg-primary/20">
        
        {/* SaaS Sidemenu */}
        <motion.aside 
          initial={false}
          animate={{ width: sidebarOpen ? 280 : 80 }}
          className="h-screen bg-surface-container-low border-r border-outline-variant-low flex flex-col fixed left-0 top-0 z-50 overflow-hidden shadow-2xl"
        >
          <div className="p-10 flex items-center gap-4">
            <div className="w-12 h-12 rounded-sm gradient-fill flex items-center justify-center text-white shrink-0 shadow-xl border border-white/20">
              <span className="font-black text-2xl tracking-tighter">U</span>
            </div>
            {sidebarOpen && (
              <motion.h1 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="title-lg font-black tracking-tight"
              >
                UMLAB
                <span className="block text-primary label-sm uppercase tracking-widest opacity-60">SaaS PROTOCOL</span>
              </motion.h1>
            )}
          </div>

          <nav className="flex-1 px-5 py-6 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.id}
                to={item.id}
                className={`w-full flex items-center gap-4 p-4 rounded-sm transition-all duration-300 ${
                  location.pathname === item.id 
                    ? 'bg-primary text-white shadow-lg shadow-primary/20 font-black' 
                    : 'text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                <span className="shrink-0">{item.icon}</span>
                {sidebarOpen && (
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="label-md uppercase tracking-widest text-[11px] font-black">
                    {item.label}
                  </motion.span>
                )}
              </Link>
            ))}
          </nav>

          <footer className="p-8 space-y-6">
             <Link to="/onboard" className="flex items-center gap-4 p-4 label-sm text-primary font-black uppercase tracking-widest hover:bg-primary/5 rounded-sm transition-all">
                <Plus size={18} />
                {sidebarOpen && <span>Provision Tenant</span>}
             </Link>
          </footer>
        </motion.aside>

        {/* Multi-Tenant Shell */}
        <main 
          className="flex-1 transition-all duration-500"
          style={{ marginLeft: sidebarOpen ? 280 : 80 }}
        >
          {/* SaaS Header Control Panel */}
          <header className="h-24 bg-surface/90 glass border-b border-outline-variant-low sticky top-0 px-12 flex items-center justify-between z-40 shadow-sm">
            <div className="flex items-center gap-10">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-3 hover:bg-surface-container-high rounded-sm transition-all text-on-surface-variant border border-outline-variant-low group">
                {sidebarOpen ? <X size={18} className="group-hover:rotate-90 transition-transform" /> : <Menu size={18} />}
              </button>
              
              {/* Context Switcher with Dynamic Subtext */}
              <div className="flex items-center gap-4 group">
                 <div className="w-1.5 h-10 bg-primary opacity-20 group-hover:opacity-100 transition-all rounded-full" />
                 <div className="flex flex-col">
                    <p className="label-sm font-black uppercase tracking-widest text-primary text-[10px] mb-1">Entity Switcher</p>
                    <select 
                      value={currentCompany?.id || ""} 
                      onChange={(e) => selectTenant(companies.find(c => c.id.toString() === e.target.value))}
                      className="bg-transparent border-none outline-none title-md font-black text-on-surface cursor-pointer p-0 appearance-none hover:text-primary transition-colors"
                    >
                      {Array.isArray(companies) && companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                 </div>
              </div>
            </div>
            
            <div className="flex items-center gap-12 pr-4">
              <div className="bg-surface-container-low px-10 py-3.5 rounded-sm w-96 max-w-full shadow-inner border border-outline-variant-low flex items-center gap-4">
                <Search size={16} className="text-on-surface-variant opacity-30" />
                <input type="text" placeholder="Isolated Ledger Query..." className="bg-transparent border-none outline-none text-sm w-full label-md font-bold placeholder:italic placeholder:opacity-30" />
              </div>
              
              <div className="flex items-center gap-6 pl-10 border-l border-outline-variant-low h-12">
                <div className="text-right">
                  <p className="label-md font-black tracking-tighter text-on-surface">Karlos Albert</p>
                  <p className="label-sm font-black text-primary uppercase tracking-widest text-[9px] px-2 py-0.5 bg-primary/10 rounded-sm inline-block">{activeRole || 'IDENTIFYING...'}</p>
                </div>
                <div className="w-12 h-12 rounded-sm bg-on-surface text-surface flex items-center justify-center font-black text-xl shadow-lg ring-4 ring-primary/10">
                   K
                </div>
              </div>
            </div>
          </header>

          {/* SaaS Workspace Viewport */}
          <div className="p-16 max-w-[1400px] mx-auto min-h-[calc(100vh-6rem)]" key={refreshKey}>
            <AnimatePresence mode="wait">
              <Routes location={location} key={location.pathname}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/procurement" element={<ProcurementForm />} />
                <Route path="/vendors" element={<VendorDirectory />} />
                <Route path="/approvals" element={<ApprovalView />} />
                <Route path="/request/:id" element={<RequestDetails />} />
                <Route path="/petty-cash" element={<PettyCashDashboard />} />
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
