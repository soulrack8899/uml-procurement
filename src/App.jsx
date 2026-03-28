import React, { useState, useEffect, createContext, useContext } from 'react'
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

// SaaS Context
const CompanyContext = createContext()

export const useCompany = () => useContext(CompanyContext)

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [companies, setCompanies] = useState([])
  const [currentCompany, setCurrentCompany] = useState(null)
  const location = useLocation()

  useEffect(() => {
    fetchCompanies()
  }, [])

  const fetchCompanies = async () => {
    try {
      const data = await procurementApi.getCompanies()
      setCompanies(data)
      const savedId = localStorage.getItem("currentCompanyId")
      const initial = data.find(c => c.id.toString() === savedId) || data[0]
      if (initial) handleCompanyChange(initial)
    } catch (err) {
      console.error(err)
    }
  }

  const handleCompanyChange = (company) => {
    setCurrentCompany(company)
    localStorage.setItem("currentCompanyId", company.id)
    // Reload or refresh data
    if (location.pathname === '/') window.location.reload()
  }

  const navItems = [
    { id: '/', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: '/procurement', label: 'Procurement', icon: <FileText size={20} /> },
    { id: '/petty-cash', label: 'Petty Cash', icon: <Wallet size={20} /> },
    { id: '/vendors', label: 'Vendor Directory', icon: <Users size={20} /> },
    { id: '/approvals', label: 'Approvals', icon: <CheckSquare size={20} /> },
    { id: '/admin-settings', label: 'Admin Settings', icon: <Settings size={20} /> },
  ]

  return (
    <CompanyContext.Provider value={{ currentCompany, companies, handleCompanyChange }}>
      <div className="min-h-screen bg-surface flex">
        {/* Sidebar */}
        <motion.aside 
          initial={false}
          animate={{ width: sidebarOpen ? 260 : 80 }}
          className="h-screen bg-surface-container-low border-r border-outline-variant-low flex flex-col fixed left-0 top-0 z-50 overflow-hidden"
        >
          <div className="p-6 flex items-center gap-3">
            <div className="w-8 h-8 rounded-sm gradient-fill flex items-center justify-center text-white shrink-0 shadow-lg">
              <span className="font-bold text-lg">U</span>
            </div>
            {sidebarOpen && (
              <motion.h1 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="title-lg font-black whitespace-nowrap tracking-tight"
              >
                UMLAB SaaS
              </motion.h1>
            )}
          </div>

          <nav className="flex-1 px-4 py-6 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.id}
                to={item.id}
                className={`w-full flex items-center gap-4 p-3 rounded-sm transition-all ${
                  location.pathname === item.id 
                    ? 'bg-primary text-white shadow-ambient' 
                    : 'text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                <span className="shrink-0">{item.icon}</span>
                {sidebarOpen && (
                  <motion.span 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="label-md font-bold"
                  >
                    {item.label}
                  </motion.span>
                )}
              </Link>
            ))}
          </nav>

          {/* Onboarding Trigger */}
          <div className="p-4 px-6 border-t border-outline-variant-low">
            <Link to="/onboard" className="flex items-center gap-4 text-primary hover:text-on-surface transition-colors p-3 w-full">
              <Globe size={20} />
              {sidebarOpen && <span className="label-md font-black uppercase tracking-widest text-xs">Add Tenant</span>}
            </Link>
          </div>
        </motion.aside>

        {/* Main Content */}
        <main 
          className="flex-1 transition-all duration-300 min-h-screen"
          style={{ marginLeft: sidebarOpen ? 260 : 80 }}
        >
          {/* Header */}
          <header className="h-24 bg-surface/80 glass border-b border-outline-variant-low sticky top-0 px-8 flex items-center justify-between z-40">
            <div className="flex items-center gap-6">
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-surface-container-high rounded-full transition-colors text-on-surface-variant"
              >
                <Menu size={20} />
              </button>
              
              {/* Tenant Switcher */}
              <div className="flex items-center gap-3 bg-white px-6 py-2 rounded-sm border border-outline-variant-low shadow-sm">
                 <div className="p-1.5 bg-tertiary-fixed-dim rounded-full text-white">
                    <Globe size={14} />
                 </div>
                 <select 
                  value={currentCompany?.id || ""} 
                  onChange={(e) => handleCompanyChange(companies.find(c => c.id.toString() === e.target.value))}
                  className="bg-transparent border-none outline-none title-sm font-black text-primary cursor-pointer hover:underline"
                 >
                   {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                 </select>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4 bg-surface-container-low px-6 py-2 rounded-full w-80 max-w-full shadow-inner">
                <Search size={18} className="text-on-surface-variant" />
                <input 
                  type="text" 
                  placeholder="Enterprise ledger search..." 
                  className="bg-transparent border-none outline-none text-sm w-full label-md font-medium"
                />
              </div>
              
              <div className="flex items-center gap-3 pl-6 border-l border-outline-variant-low">
                <div className="text-right">
                  <p className="label-md font-black">K. Albert</p>
                  <p className="label-sm text-on-surface-variant font-bold uppercase tracking-wider">Tenant Admin</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center text-primary font-black text-xs">
                   KA
                </div>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <div className="p-12 overflow-x-hidden">
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
