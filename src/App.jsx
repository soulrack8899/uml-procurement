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

// --- SaaS Context Provider ---
const CompanyContext = createContext()

export const useCompany = () => useContext(CompanyContext)

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [companies, setCompanies] = useState([])
  const [currentCompany, setCurrentCompany] = useState(null)
  
  // State Refresh Mechanism: Toggle key to force re-mounting components
  const [refreshKey, setRefreshKey] = useState(Date.now())
  const location = useLocation()

  useEffect(() => {
    // Initial user setup for SaaS demo
    if (!localStorage.getItem("currentUserId")) {
       localStorage.setItem("currentUserId", "1") // Dynamic admin seeding from startup
    }
    fetchCompanies()
  }, [])

  const fetchCompanies = async () => {
    try {
      const data = await procurementApi.getCompanies()
      setCompanies(data)
      const savedId = localStorage.getItem("currentCompanyId")
      const initial = data.find(c => c.id.toString() === savedId) || data[0]
      if (initial) selectTenant(initial)
    } catch (err) {
      console.error("Infrastructure fetch error:", err)
    }
  }

  const selectTenant = useCallback((company) => {
    setCurrentCompany(company)
    localStorage.setItem("currentCompanyId", company.id)
    // Global state refresh: force deep re-fetch by components
    setRefreshKey(Date.now())
  }, [])

  const navItems = [
    { id: '/', label: 'Overview', icon: <LayoutDashboard size={20} /> },
    { id: '/procurement', label: 'Ledger Requests', icon: <FileText size={20} /> },
    { id: '/petty-cash', label: 'Cash Flow', icon: <Wallet size={20} /> },
    { id: '/vendors', label: 'Vendors', icon: <Users size={20} /> },
    { id: '/approvals', label: 'Gatekeepers', icon: <CheckSquare size={20} /> },
    { id: '/admin-settings', label: 'Governance', icon: <Settings size={20} /> },
  ]

  return (
    <CompanyContext.Provider value={{ currentCompany, companies, selectTenant, refreshKey }}>
      <div className="min-h-screen bg-surface flex">
        {/* Sidebar */}
        <motion.aside 
          initial={false}
          animate={{ width: sidebarOpen ? 260 : 80 }}
          className="h-screen bg-surface-container-low border-r border-outline-variant-low flex flex-col fixed left-0 top-0 z-50 overflow-hidden shadow-ambient"
        >
          <div className="p-8 flex items-center gap-4">
            <div className="w-10 h-10 rounded-sm gradient-fill flex items-center justify-center text-white shrink-0 shadow-lg">
              <span className="font-bold text-xl">U</span>
            </div>
            {sidebarOpen && (
              <motion.h1 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="title-lg font-black tracking-tight flex flex-col"
              >
                UMLAB
                <span className="label-sm font-bold text-primary tracking-widest opacity-60">SaaS PROTOCOL</span>
              </motion.h1>
            )}
          </div>

          <nav className="flex-1 px-4 py-8 space-y-3">
            {navItems.map((item) => (
              <Link
                key={item.id}
                to={item.id}
                className={`w-full flex items-center gap-4 p-4 rounded-sm transition-all ${
                  location.pathname === item.id 
                    ? 'bg-primary text-white shadow-ambient font-black' 
                    : 'text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                <span className="shrink-0">{item.icon}</span>
                {sidebarOpen && (
                  <motion.span 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="label-md"
                  >
                    {item.label}
                  </motion.span>
                )}
              </Link>
            ))}
          </nav>
          
          <div className="p-6">
             <Link to="/onboard" className="flex items-center gap-4 p-4 label-sm text-primary font-black uppercase tracking-widest hover:bg-primary/5 rounded-sm transition-colors decoration-dashed">
                <Plus size={18} />
                {sidebarOpen && <span>Provision Tenant</span>}
             </Link>
          </div>
        </motion.aside>

        {/* Main Context */}
        <main 
          className="flex-1 transition-all duration-300 min-h-screen"
          style={{ marginLeft: sidebarOpen ? 260 : 80 }}
        >
          {/* SaaS Header */}
          <header className="h-24 bg-surface/80 glass border-b border-outline-variant-low sticky top-0 px-10 flex items-center justify-between z-40">
            <div className="flex items-center gap-8">
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2.5 hover:bg-surface-container-high rounded-full transition-colors text-on-surface-variant shadow-sm border border-outline-variant-low"
              >
                <Menu size={20} />
              </button>
              
              {/* Context Selector */}
              <div className="flex items-center gap-3 bg-white px-6 py-2.5 rounded-sm border-2 border-primary/20 shadow-ambient group hover:border-primary transition-all">
                 <Globe size={16} className="text-primary animate-spin-slow" />
                 <select 
                  value={currentCompany?.id || ""} 
                  onChange={(e) => selectTenant(companies.find(c => c.id.toString() === e.target.value))}
                  className="bg-transparent border-none outline-none title-sm font-black text-primary cursor-pointer"
                 >
                   {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                 </select>
              </div>
            </div>
            
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-4 bg-surface-container-low px-8 py-3 rounded-full w-96 max-w-full shadow-inner border border-outline-variant-low focus-within:border-primary transition-all">
                <Search size={18} className="text-on-surface-variant opacity-40" />
                <input 
                  type="text" 
                  placeholder="Enterprise ledger query..." 
                  className="bg-transparent border-none outline-none text-sm w-full label-md font-medium placeholder:italic"
                />
              </div>
              
              <div className="flex items-center gap-4 pl-8 border-l border-outline-variant-low h-10">
                <div className="text-right">
                  <p className="label-md font-black tracking-tight">K. Albert</p>
                  <p className="label-sm text-primary font-black uppercase tracking-tighter opacity-60">Global Admin</p>
                </div>
                <div className="w-12 h-12 rounded-sm bg-primary/10 border-2 border-primary flex items-center justify-center text-primary font-black text-md shadow-sm">
                   KA
                </div>
              </div>
            </div>
          </header>

          {/* Page Execution Grid */}
          <div className="p-12" key={refreshKey}>
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
