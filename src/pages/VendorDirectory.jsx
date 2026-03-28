import React from 'react'
import { motion } from 'framer-motion'
import { Search, Filter, Plus, Mail, Phone, MapPin, Globe, ArrowRight } from 'lucide-react'

/* ─────────────────────────────────────────────────────
   VendorDirectory — synced with Stitch "Vendor Directory" screen
   No line dividers, alternating tonal surfaces, ghost-ring cards
   ───────────────────────────────────────────────────── */

const VendorDirectory = () => {
  const vendors = [
    { name: 'Borneo Scientific Supplies', type: 'Lab Equipment', location: 'Kuching, Sarawak', contact: '+60 82-442 331', rating: 4.8 },
    { name: 'Thermo Fisher Scientific', type: 'Reagent Kits', location: 'Kuala Lumpur', contact: '+60 3-8948 2000', rating: 4.9 },
    { name: 'Shimadzu Asia Pacific', type: 'Spectrometer Systems', location: 'Singapore', contact: '+65 6778 6280', rating: 4.7 },
    { name: 'Borosil Glass Works', type: 'Lab Glassware', location: 'Mumbai, India', contact: '+91 22-6740 6300', rating: 4.5 },
    { name: 'Agilent Technologies', type: 'Analytical Instruments', location: 'Penang, Malaysia', contact: '+60 4-382 1350', rating: 4.6 },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* Header */}
      <div>
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <span style={{ fontFamily: 'var(--font-label)', fontSize: '0.75rem', color: 'var(--outline)' }}>Registry</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--outline)' }}>›</span>
          <span style={{ fontFamily: 'var(--font-label)', fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>Vendor Directory</span>
        </nav>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Vendor Directory</h1>
          <button className="gradient-fill" style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.75rem 1.5rem', color: 'var(--on-primary)',
            fontFamily: 'var(--font-headline)', fontWeight: 700, fontSize: '0.875rem',
            borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer'
          }}>
            <Plus size={16} /> Register Vendor
          </button>
        </div>
      </div>

      {/* Search Bar (Stitch: surface-container-lowest card) */}
      <div style={{
        background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-sm)',
        padding: '1rem', boxShadow: '0 0 0 1px rgba(194,198,211,0.15)',
        display: 'flex', alignItems: 'center', gap: '1rem'
      }}>
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', gap: '0.75rem',
          background: 'var(--surface-container-low)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-pill)'
        }}>
          <Search size={18} style={{ color: 'var(--on-surface-variant)', flexShrink: 0 }} />
          <input type="text" placeholder="Search by vendor name, category, or region..."
            style={{ background: 'transparent', border: 'none', outline: 'none', fontFamily: 'var(--font-label)', fontSize: '0.875rem', width: '100%' }} />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {[{ icon: <Filter size={16} />, label: 'Category' }, { icon: <MapPin size={16} />, label: 'Region' }].map(f => (
            <button key={f.label} style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.625rem 1rem', border: '1px solid rgba(194,198,211,0.2)',
              borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-label)', fontSize: '0.75rem', fontWeight: 700,
              background: 'transparent', cursor: 'pointer', color: 'var(--on-surface-variant)', transition: 'background 0.15s'
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-container-low)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >{f.icon} {f.label}</button>
          ))}
        </div>
      </div>

      {/* Vendor Grid (Stitch: tonal cards, no solid borders, hover → surface-container-high) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
        {vendors.map((vendor, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            style={{
              background: 'var(--surface-container-lowest)',
              borderRadius: 'var(--radius-sm)',
              padding: '1.5rem',
              boxShadow: '0 0 0 1px rgba(194,198,211,0.15)',
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              cursor: 'pointer', transition: 'all 0.15s'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-container-high)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-container-lowest)'; e.currentTarget.style.transform = 'none' }}
          >
            <div>
              {/* Avatar + Rating */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <div style={{
                  width: 64, height: 64, borderRadius: 'var(--radius-sm)',
                  background: 'var(--surface-container-low)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--primary)', fontWeight: 700, fontSize: '1.5rem'
                }}>{vendor.name[0]}</div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontFamily: 'var(--font-label)', fontSize: '0.5625rem', color: 'var(--on-surface-variant)', fontWeight: 700, marginBottom: '0.125rem' }}>Rating</p>
                  <p style={{ fontFamily: 'var(--font-label)', fontSize: '0.75rem', fontWeight: 900, color: 'var(--primary)' }}>{vendor.rating} / 5.0</p>
                </div>
              </div>

              <h3 style={{ fontFamily: 'var(--font-headline)', fontWeight: 700, fontSize: '1.125rem', letterSpacing: '-0.01em', marginBottom: '0.5rem' }}>{vendor.name}</h3>
              <span className="chip chip-pending" style={{ marginBottom: '1.25rem' }}>{vendor.type}</span>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--on-surface-variant)' }}>
                  <MapPin size={14} />
                  <span style={{ fontFamily: 'var(--font-label)', fontSize: '0.75rem' }}>{vendor.location}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--on-surface-variant)' }}>
                  <Phone size={14} />
                  <span style={{ fontFamily: 'var(--font-label)', fontSize: '0.75rem' }}>{vendor.contact}</span>
                </div>
              </div>
            </div>

            {/* Footer actions */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(194,198,211,0.15)' }}>
              <button style={{
                display: 'flex', alignItems: 'center', gap: '0.25rem',
                fontFamily: 'var(--font-label)', fontSize: '0.75rem', fontWeight: 700,
                color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer'
              }}>
                View Performance <ArrowRight size={14} />
              </button>
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                {[Mail, Globe].map((Icon, j) => (
                  <button key={j} style={{
                    padding: '0.375rem', borderRadius: 'var(--radius-pill)',
                    border: 'none', background: 'transparent', cursor: 'pointer',
                    color: 'var(--on-surface-variant)', transition: 'background 0.15s'
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-container-high)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <Icon size={16} />
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default VendorDirectory
