import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowUpRight, ArrowDownRight, TrendingUp, PieChart, ShoppingCart, Activity, Plus, Search, Filter } from 'lucide-react'
import { Link } from 'react-router-dom'
import { procurementApi } from '../services/api'

const Dashboard = () => {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const data = await procurementApi.getRequests()
      setRequests(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const stats = [
    { label: 'Active Procurements', value: requests.length, change: '+12%', type: 'positive' },
    { label: 'Pending Approvals', value: requests.filter(r => r.status.includes('PENDING')).length, change: '+5%', type: 'positive' },
    { label: 'Total Vendor Spend', value: `RM ${(requests.reduce((acc, r) => acc + r.total_amount, 0) / 1000).toFixed(1)}K`, change: '-3%', type: 'negative' },
    { label: 'System Health', value: '99.9%', change: '+0.1%', type: 'positive' },
  ]

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="label-md text-primary font-black uppercase tracking-widest"
          >
            Digital Procurement Ledger
          </motion.p>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="display-md text-on-surface text-5xl font-black"
          >
            Operational Overview
          </motion.h1>
        </div>
        <Link to="/procurement" className="flex items-center gap-3 px-8 py-4 gradient-fill text-white label-md font-bold rounded-sm shadow-ambient hover:opacity-90 transition-opacity">
          <Plus size={18} />
          New Procurement Request
        </Link>
      </section>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="surface-card hover-lift border-t-2 border-outline-variant-low hover:border-primary"
          >
            <p className="label-sm text-on-surface-variant font-bold uppercase tracking-wider mb-2">{stat.label}</p>
            <div className="flex items-end justify-between">
              <h2 className="title-lg text-primary font-black text-3xl">{stat.value}</h2>
              <span className={`inline-flex items-center gap-1 label-sm font-bold ${
                stat.type === 'positive' ? 'text-tertiary-fixed' : 'text-error'
              }`}>
                {stat.change}
                {stat.type === 'positive' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Recent Activity Table */}
        <section className="lg:col-span-2 space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="title-lg font-black flex items-center gap-3">
              <ShoppingCart size={22} className="text-primary" />
              Real-Time Procurement Stream
            </h3>
            <div className="flex items-center gap-4">
               <button className="p-2 hover:bg-surface-container-low rounded-full transition-colors text-on-surface-variant">
                  <Search size={20} />
               </button>
               <button className="p-2 hover:bg-surface-container-low rounded-full transition-colors text-on-surface-variant">
                  <Filter size={20} />
               </button>
            </div>
          </div>
          
          <div className="overflow-hidden bg-surface-container-lowest rounded-sm shadow-ambient border border-outline-variant-low">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant-low">
                  <th className="p-6 label-sm font-black text-on-surface-variant uppercase tracking-widest">ID</th>
                  <th className="p-6 label-sm font-black text-on-surface-variant uppercase tracking-widest">Vendor Context</th>
                  <th className="p-6 label-sm font-black text-on-surface-variant uppercase tracking-widest">Amount (RM)</th>
                  <th className="p-6 label-sm font-black text-on-surface-variant uppercase tracking-widest">Status Flow</th>
                  <th className="p-6 label-sm font-black text-on-surface-variant uppercase tracking-widest">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5" className="p-12 text-center label-md animate-pulse">Synchronizing with ledger...</td></tr>
                ) : requests.map((req, i) => (
                  <tr key={req.id} className="hover:bg-surface-container-low transition-colors group border-b border-outline-variant-low last:border-none">
                    <td className="p-6 label-md font-black text-primary">#{req.id}</td>
                    <td className="p-6">
                      <p className="body-md font-bold">{req.vendor_name}</p>
                      <p className="label-sm text-on-surface-variant">ID: {req.vendor_id}</p>
                    </td>
                    <td className="p-6 body-md font-black text-on-surface">{req.total_amount.toLocaleString()}</td>
                    <td className="p-6">
                      <span className={`chip chip-pending font-bold uppercase`}>{req.status}</span>
                    </td>
                    <td className="p-6">
                      <Link 
                        to={`/request/${req.id}`}
                        className="p-3 bg-surface-container-low hover:bg-primary hover:text-white rounded-full transition-all inline-flex items-center justify-center text-primary"
                      >
                         <ArrowUpRight size={18} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* System Activity & Global Audit */}
        <section className="space-y-8">
          <h3 className="title-lg font-black flex items-center gap-3">
            <Activity size={22} className="text-primary" />
            Global Audit Trace
          </h3>
          
          <div className="surface-card space-y-8 relative before:absolute before:left-[27px] before:top-4 before:bottom-4 before:w-[1px] before:border-l before:border-dashed before:border-outline-variant">
            {[
              { time: '10:45 AM', action: 'Digital PO Generated', user: 'System Bot', target: 'REQ-45' },
              { time: '09:12 AM', action: 'Managerial Sign-off', user: 'KA Albert', target: 'REQ-45' },
              { time: 'Yesterday', action: 'New Vendor Verified', user: 'System', target: 'Tech Corp' },
              { time: 'Yesterday', action: 'Budget Lock Engaged', user: 'Finance', target: 'Threshold: 5K' },
            ].map((activity, i) => (
              <div key={i} className="flex gap-6 relative group">
                <div className="w-6 h-6 rounded-full bg-surface-container-highest border-2 border-primary shrink-0 z-10 group-hover:bg-primary transition-colors" />
                <div className="space-y-1">
                  <p className="label-sm text-tertiary-fixed font-black tracking-tighter uppercase">{activity.time}</p>
                  <p className="body-md font-black">{activity.action}</p>
                  <p className="label-sm text-on-surface-variant font-medium">
                    <span className="font-bold text-on-surface">{activity.user}</span> • {activity.target}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

export default Dashboard
