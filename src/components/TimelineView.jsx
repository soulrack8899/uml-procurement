import React from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, Clock, FileText, User, ArrowDown } from 'lucide-react'
import { getStatusChipClass } from '../App'

const TimelineView = ({ auditLogs }) => {
  if (!auditLogs || auditLogs.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--surface-container-low)', borderRadius: 'var(--radius-sm)', color: 'var(--on-surface-variant)' }}>
        <Clock style={{ margin: '0 auto 1rem', opacity: 0.2 }} size={40} />
        <p style={{ fontFamily: 'var(--font-label)', fontSize: '0.75rem' }}>Waiting for initial activity...</p>
      </div>
    )
  }

  return (
    /* Stitch Audit Trail: label-sm Inter, surface-container-highest bg, tertiary timestamps, dashed connector */
    <div style={{ 
      background: 'var(--surface-container-highest)', borderRadius: 'var(--radius-sm)', 
      padding: '1rem', boxShadow: '0 0 0 1px rgba(194,198,211,0.1)' 
    }}>
      <table style={{ width: '100%', textAlign: 'left', fontFamily: 'var(--font-label)' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(194,198,211,0.2)' }}>
            {['Timestamp', 'Actor', 'Action', 'Status'].map(h => (
              <th key={h} style={{ 
                paddingBottom: '0.75rem', fontSize: '0.625rem', fontWeight: 700, 
                color: 'var(--outline)', textTransform: 'uppercase', letterSpacing: '0.06em',
                textAlign: h === 'Status' ? 'right' : 'left'
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {auditLogs.map((log, i) => (
            <tr key={log.id || i} style={{ borderBottom: i < auditLogs.length - 1 ? '1px solid rgba(194,198,211,0.1)' : 'none' }}>
              {/* Stitch: tertiary color for timestamps */}
              <td style={{ padding: '0.75rem 0', fontSize: '0.75rem', color: 'var(--tertiary)', fontWeight: 500 }}>
                {new Date(log.timestamp).toLocaleString()}
              </td>
              <td style={{ padding: '0.75rem 0', fontSize: '0.75rem', fontWeight: 600 }}>
                {log.user_name}
              </td>
              <td style={{ padding: '0.75rem 0', fontSize: '0.75rem' }}>
                {log.notes || log.action}
                {log.from_status && log.to_status && (
                  <span style={{ marginLeft: '0.5rem', fontSize: '0.625rem', color: 'var(--on-surface-variant)' }}>
                    ({log.from_status} → {log.to_status})
                  </span>
                )}
              </td>
              <td style={{ padding: '0.75rem 0', textAlign: 'right' }}>
                <span className={`chip ${getStatusChipClass(log.to_status || 'SUBMITTED')}`} style={{ fontSize: '0.5625rem' }}>
                  {log.to_status || log.action}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default TimelineView
