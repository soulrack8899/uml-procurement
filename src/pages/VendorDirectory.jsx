import React from 'react'
import { motion } from 'framer-motion'
import { Search, Filter, Plus, Mail, Phone, MapPin, Globe, ArrowRight, ChevronRight } from 'lucide-react'
import { useCompany } from '../App'

const VendorDirectory = () => {
  const { isMobile } = useCompany()
  const vendors = [
    { name: 'Borneo Scientific Supplies', type: 'Lab Equipment', location: 'Kuching, Sarawak', contact: '+60 82-442 331', rating: 4.8 },
    { name: 'Thermo Fisher Scientific', type: 'Reagent Kits', location: 'Kuala Lumpur', contact: '+60 3-8948 2000', rating: 4.9 },
    { name: 'Shimadzu Asia Pacific', type: 'Spectrometer Systems', location: 'Singapore', contact: '+65 6778 6280', rating: 4.7 },
    { name: 'Borosil Glass Works', type: 'Lab Glassware', location: 'Mumbai, India', contact: '+91 22-6740 6300', rating: 4.5 },
    { name: 'Agilent Technologies', type: 'Analytical Instruments', location: 'Penang, Malaysia', contact: '+60 4-382 1350', rating: 4.6 },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '1.5rem' : '2.5rem' }}>
      {/* Header */}
      <div>
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
           <span style={{ fontFamily: 'var(--font-label)', fontSize: '0.75rem', color: 'var(--outline)' }}>Registry</span>
           <ChevronRight size={12} style={{ color: 'var(--outline)' }} />
           <span style={{ fontFamily: 'var(--font-label)', fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>Vendor Directory</span>
        </nav>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: isMobile ? '1.5rem' : '2.5rem', fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--primary)' }}>Vendor Directory</h1>
          <button className="gradient-fill" style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.75rem 1.5rem', color: 'var(--on-primary)',
            fontFamily: 'var(--font-headline)', fontWeight: 800, fontSize: '0.875rem',
            borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer'
          }}>
            <Plus size={16} /> Register Vendor
          </button>
        </div>
      </div>

      {/* Search Bar - Responsive */}
      <div style={{
        background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-sm)',
        padding: '1rem', border: '1px solid rgba(194,198,211,0.2)',
        display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center', gap: '1rem'
      }}>
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', gap: '0.75rem',
          background: 'var(--surface-container-low)', padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-pill)'
        }}>
          <Search size={18} style={{ color: 'var(--outline)', flexShrink: 0 }} />
          <input type="text" placeholder="Search by vendor name or category..."
            style={{ background: 'transparent', border: 'none', outline: 'none', fontFamily: 'var(--font-body)', fontSize: '0.875rem', width: '100%' }} />
        </div>
        {!isMobile && (
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
        )}
      </div>

      {/* Vendor Grid - Responsive columns */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(320px, 1fr))', 
        gap: '1.5rem' 
      }}>
        {vendors.map((vendor, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            style={{
              background: 'var(--surface-container-lowest)',
              borderRadius: 'var(--radius-sm)',
              padding: '1.5rem',
              border: '1px solid rgba(194,198,211,0.15)',
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-container-high)'; e.currentTarget.style.transform = 'translateY(-4px)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-container-lowest)'; e.currentTarget.style.transform = 'none' }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 'var(--radius-sm)',
                  background: 'var(--primary-fixed-dim)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--primary)', fontWeight: 900, fontSize: '1.5rem'
                }}>{vendor.name[0]}</div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '0.625rem', color: 'var(--outline)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.125rem' }}>Rating</p>
                  <p style={{ fontSize: '0.875rem', fontWeight: 900, color: 'var(--primary)' }}>{vendor.rating} ★</p>
                </div>
              </div>

              <h3 style={{ fontFamily: 'var(--font-headline)', fontWeight: 800, fontSize: '1.125rem', letterSpacing: '-0.01em', marginBottom: '0.5rem', color: 'var(--primary)' }}>{vendor.name}</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--outline)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{vendor.type}</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--on-surface-variant)' }}>
                  <MapPin size={14} style={{ color: 'var(--primary)' }} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>{vendor.location}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--on-surface-variant)' }}>
                  <Phone size={14} style={{ color: 'var(--primary)' }} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>{vendor.contact}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(194,198,211,0.1)' }}>
              <button style={{
                display: 'flex', alignItems: 'center', gap: '0.25rem',
                fontSize: '0.75rem', fontWeight: 800,
                color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer'
              }}>
                Performance Report <ArrowRight size={14} />
              </button>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {[Mail, Globe].map((Icon, j) => (
                  <button key={j} style={{
                    padding: '0.5rem', borderRadius: '50%',
                    border: 'none', background: 'var(--surface-container-high)', cursor: 'pointer',
                    color: 'var(--primary)', transition: 'background 0.15s'
                  }}>
                    <Icon size={14} />
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
