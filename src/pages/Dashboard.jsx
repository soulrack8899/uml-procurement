import React from 'react'
import { motion } from 'framer-motion'
import { ArrowUpRight, ArrowDownRight, TrendingUp, PieChart, ShoppingCart, Activity } from 'lucide-react'

const Dashboard = () => {
  const stats = [
    { label: 'Active Procurements', value: '1,280', change: '+12%', type: 'positive' },
    { label: 'Pending Approvals', value: '342', change: '+5%', type: 'positive' },
    { label: 'Total Vendor Spend', value: 'RM 2.4M', change: '-3%', type: 'negative' },
    { label: 'System Health', value: '99.9%', change: '+0.1%', type: 'positive' },
  ]

  const recentRequests = [
    { id: 'PR-2024-001', vendor: 'Sarawak Tech Solutions', amount: 'RM 12,500', status: 'pending', date: '2026-03-24' },
    { id: 'PR-2024-002', vendor: 'Global Office Supplies', amount: 'RM 4,200', status: 'approved', date: '2026-03-22' },
    { id: 'PR-2024-003', vendor: 'Industrial Hardwares Inc.', amount: 'RM 89,000', status: 'rejected', date: '2026-03-20' },
    { id: 'PR-2024-004', vendor: 'Lab Equipments Pro', amount: 'RM 540,000', status: 'pending', date: '2026-03-18' },
  ]

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="flex flex-col gap-2">
        <motion.p 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="label-md text-primary font-bold uppercase tracking-wider"
        >
          High-Precision Ledger
        </motion.p>
        <motion.h1 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="display-md text-on-surface"
        >
          Procurement Overview
        </motion.h1>
      </section>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="surface-card hover-lift"
          >
            <p className="label-md text-on-surface-variant mb-2">{stat.label}</p>
            <div className="flex items-end justify-between">
              <h2 className="title-lg text-primary font-bold text-2xl">{stat.value}</h2>
              <span className={`inline-flex items-center gap-1 label-sm font-bold ${
                stat.type === 'positive' ? 'text-tertiary' : 'text-error'
              }`}>
                {stat.change}
                {stat.type === 'positive' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity Table */}
        <section className="lg:col-span-2 surface-section rounded-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="title-lg flex items-center gap-3">
              <ShoppingCart size={20} className="text-primary" />
              Recent Procurement Requests
            </h3>
            <button className="label-md text-primary font-bold hover:underline">View All Requests</button>
          </div>
          
          <div className="overflow-hidden bg-surface-container-lowest rounded-sm shadow-ambient">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low">
                  <th className="p-4 label-md font-bold text-on-surface-variant">Request ID</th>
                  <th className="p-4 label-md font-bold text-on-surface-variant">Vendor</th>
                  <th className="p-4 label-md font-bold text-on-surface-variant">Amount</th>
                  <th className="p-4 label-md font-bold text-on-surface-variant">Status</th>
                  <th className="p-4 label-md font-bold text-on-surface-variant">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentRequests.map((req, i) => (
                  <tr key={req.id} className="hover:bg-surface-container-low transition-colors group">
                    <td className="p-4 label-md font-bold text-primary">{req.id}</td>
                    <td className="p-4 body-md">{req.vendor}</td>
                    <td className="p-4 body-md font-semibold">{req.amount}</td>
                    <td className="p-4">
                      <span className={`chip chip-${req.status}`}>{req.status}</span>
                    </td>
                    <td className="p-4 label-sm text-on-surface-variant">{req.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* System Activity & Audit Trail */}
        <section className="surface-card space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="title-lg flex items-center gap-3">
              <Activity size={20} className="text-primary" />
              System Audit
            </h3>
          </div>
          
          <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[1px] before:border-l before:border-dashed before:border-outline-variant">
            {[
              { time: '10:45 AM', action: 'Approval Granted', user: 'H. Mohamad', target: 'PR-2024-002' },
              { time: '09:12 AM', action: 'New Vendor Registered', user: 'System', target: 'Borneo Logistics' },
              { time: 'Yesterday', action: 'Budget Threshold Updated', user: 'K. Albert', target: 'Lab Supplies' },
              { time: 'Yesterday', action: 'Payment Processed', user: 'Finance Bot', target: 'PR-2023-998' },
            ].map((activity, i) => (
              <div key={i} className="flex gap-6 relative group">
                <div className="w-6 h-6 rounded-full bg-surface-container-highest border-2 border-primary shrink-0 z-10 group-hover:bg-primary transition-colors" />
                <div className="space-y-1">
                  <p className="label-sm text-tertiary font-bold">{activity.time}</p>
                  <p className="body-md font-semibold">{activity.action}</p>
                  <p className="label-sm text-on-surface-variant">
                    <span className="font-bold">{activity.user}</span> • {activity.target}
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
