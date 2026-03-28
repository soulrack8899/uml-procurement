import React from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, Clock, AlertCircle, FileText, User, ArrowDown } from 'lucide-react'

const TimelineView = ({ auditLogs }) => {
  if (!auditLogs || auditLogs.length === 0) {
    return (
      <div className="p-8 text-center text-on-surface-variant bg-surface-container-low rounded-sm">
        <Clock className="mx-auto mb-4 opacity-20" size={48} />
        <p className="label-md">Waiting for initial activity...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-[2px] before:bg-outline-variant-low">
      {auditLogs.map((log, i) => (
        <motion.div 
          key={log.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
          className="flex gap-6 relative"
        >
          {/* Timeline Icon */}
          <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 shrink-0 shadow-sm ${
            log.action === 'STATUS_CHANGE' 
              ? 'bg-primary text-white' 
              : 'bg-surface-container-highest text-on-surface-variant'
          }`}>
            {log.action === 'STATUS_CHANGE' ? <CheckCircle2 size={18} /> : 
             log.action === 'AUTO_GENERATION' ? <FileText size={18} /> : <User size={18} />}
          </div>

          {/* Log Content */}
          <div className="flex-1 space-y-2 pb-6">
            <div className="flex items-center justify-between">
              <p className="label-sm text-tertiary-fixed font-bold bg-tertiary px-2 py-0.5 rounded-sm">
                {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
              <p className="label-sm text-on-surface-variant font-medium">
                {new Date(log.timestamp).toLocaleDateString()}
              </p>
            </div>

            <div className="surface-card border-l-4 border-primary p-4 shadow-ambient hover-lift">
              <h4 className="title-md font-bold mb-1">{log.notes || log.action}</h4>
              
              {log.from_status && log.to_status && (
                <div className="flex items-center gap-3 mt-2 text-on-surface-variant">
                   <span className="chip chip-pending font-bold">{log.from_status}</span>
                   <ArrowDown size={14} className="rotate-[-90deg]" />
                   <span className="chip chip-approved font-bold">{log.to_status}</span>
                </div>
              )}

              <div className="mt-4 flex items-center gap-2 pt-3 border-t border-outline-variant-low">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold">
                  {log.user_name.substring(0, 2).toUpperCase()}
                </div>
                <p className="label-sm font-bold text-on-surface">
                  {log.user_name} <span className="text-on-surface-variant font-normal">({log.user_role})</span>
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

export default TimelineView
