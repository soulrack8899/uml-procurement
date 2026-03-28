import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, FileText, Users, CheckSquare, Settings, Menu, X, Plus, Bell, Search } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

import Dashboard from './pages/Dashboard'
import ProcurementForm from './pages/ProcurementForm'
import VendorDirectory from './pages/VendorDirectory'
import ApprovalView from './pages/ApprovalView'
import RequestDetails from './pages/RequestDetails'

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const location = useLocation()

  const navItems = [
    { id: '/', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: '/procurement', label: 'Procurement', icon: <FileText size={20} /> },
    { id: '/vendors', label: 'Vendor Directory', icon: <Users size={20} /> },
    { id: '/approvals', label: 'Approvals', icon: <CheckSquare size={20} /> },
  ]

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: sidebarOpen ? 260 : 80 }}
        className="h-screen bg-surface-container-low border-r border-outline-variant-low flex flex-col fixed left-0 top-0 z-50 overflow-hidden"
      >
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded-sm gradient-fill flex items-center justify-center text-white shrink-0">
            <span className="font-bold text-lg">U</span>
          </div>
          {sidebarOpen && (
            <motion.h1 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="title-lg font-black whitespace-nowrap tracking-tight"
            >
              UMLAB SARAWAK
            </motion.h1>
          )}
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.id}
              to={item.id}
              className={`w-full flex items-center gap-4 p-3 rounded-sm transition-colors ${
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

        <div className="p-4 px-6 border-t border-outline-variant-low">
          <button className="flex items-center gap-4 text-on-surface-variant hover:text-on-surface transition-colors p-3 w-full">
            <Settings size={20} />
            {sidebarOpen && <span className="label-md font-bold">Settings</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main 
        className="flex-1 transition-all duration-300 min-h-screen"
        style={{ marginLeft: sidebarOpen ? 260 : 80 }}
      >
        {/* Header */}
        <header className="h-20 bg-surface/80 glass border-b border-outline-variant-low sticky top-0 px-8 flex items-center justify-between z-40">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-surface-container-high rounded-full transition-colors text-on-surface-variant"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-4 bg-surface-container-low px-4 py-2 rounded-full w-96 max-w-full">
              <Search size={18} className="text-on-surface-variant" />
              <input 
                type="text" 
                placeholder="Search ledger records..." 
                className="bg-transparent border-none outline-none text-sm w-full label-md font-medium"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <button className="relative p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full border border-white" />
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-outline-variant-low">
              <div className="text-right">
                <p className="label-md font-black">K. Albert</p>
                <p className="label-sm text-on-surface-variant font-bold uppercase tracking-wider">Lab Manager</p>
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
            </Routes>
          </AnimatePresence>
        </div>
      </main>
    </div>
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
