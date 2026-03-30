import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Filter, Plus, Mail, Phone, MapPin, Globe, ArrowRight, ChevronRight, X, ShieldCheck } from 'lucide-react'
import { useCompany } from '../App'

const VendorDirectory = () => {
  const { isMobile } = useCompany()
  const [showRegister, setShowRegister] = useState(false)
  
  const [vendors, setVendors] = useState([
    { name: 'Borneo Scientific Supplies', type: 'Lab Equipment', location: 'Kuching, Sarawak', contact: '+60 82-442 331', rating: 4.8 },
    { name: 'Thermo Fisher Scientific', type: 'Reagent Kits', location: 'Kuala Lumpur', contact: '+60 3-8948 2000', rating: 4.9 },
    { name: 'Shimadzu Asia Pacific', type: 'Spectrometer Systems', location: 'Singapore', contact: '+65 6778 6280', rating: 4.7 },
  ])

  const [newVendor, setNewVendor] = useState({ name: '', type: '', location: '', contact: '', rating: 5.0 })

  const handleRegister = (e) => {
    e.preventDefault()
    setVendors([newVendor, ...vendors])
    setShowRegister(false)
    setNewVendor({ name: '', type: '', location: '', contact: '', rating: 5.0 })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '1.5rem' : '2.5rem', position: 'relative' }}>
      
      {/* Registration Modal */}
      <AnimatePresence>
        {showRegister && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              style={{ background: 'white', width: '100%', maxWidth: '500px', borderRadius: 'var(--radius-lg)', padding: '2.5rem', position: 'relative', boxShadow: '0 50px 100px rgba(0,0,0,0.2)' }}>
              <button onClick={() => setShowRegister(false)} style={{ position: 'absolute', right: '1.5rem', top: '1.5rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--outline)' }}><X /></button>
              
              <h2 style={{ fontFamily: 'var(--font-headline)', fontSize: '1.75rem', fontWeight: 900, color: 'var(--primary)', marginBottom: '0.5rem' }}>Add Vendor</h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--outline)', marginBottom: '2rem' }}>Add a new vendor to your directory.</p>
              
              <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.625rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '0.5rem', color: 'var(--outline)' }}>Company Name</label>
                  <input required value={newVendor.name} onChange={e => setNewVendor({...newVendor, name: e.target.value})} style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--outline-variant)', fontWeight: 700 }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.625rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '0.5rem', color: 'var(--outline)' }}>Primary Capability (e.g. Lab Supplies)</label>
                  <input required value={newVendor.type} onChange={e => setNewVendor({...newVendor, type: e.target.value})} style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--outline-variant)', fontWeight: 700 }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                   <div>
                     <label style={{ display: 'block', fontSize: '0.625rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '0.5rem', color: 'var(--outline)' }}>Contact</label>
                     <input required value={newVendor.contact} onChange={e => setNewVendor({...newVendor, contact: e.target.value})} style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--outline-variant)', fontWeight: 700 }} />
                   </div>
                   <div>
                     <label style={{ display: 'block', fontSize: '0.625rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '0.5rem', color: 'var(--outline)' }}>Region</label>
                     <input required value={newVendor.location} onChange={e => setNewVendor({...newVendor, location: e.target.value})} style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--outline-variant)', fontWeight: 700 }} />
                   </div>
                </div>
                
                <button type="submit" className="gradient-fill" style={{ width: '100%', marginTop: '1rem', padding: '1rem', borderRadius: 'var(--radius-md)', border: 'none', color: 'white', fontWeight: 900, cursor: 'pointer' }}>
                   Save Vendor
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div>
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
           <span style={{ fontFamily: 'var(--font-label)', fontSize: '0.75rem', color: 'var(--outline)' }}>Directory</span>
           <ChevronRight size={12} style={{ color: 'var(--outline)' }} />
           <span style={{ fontFamily: 'var(--font-label)', fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>Vendor Directory</span>
        </nav>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: isMobile ? '1.5rem' : '2.5rem', fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--primary)', margin: 0 }}>Vendor Directory</h1>
          <button onClick={() => setShowRegister(true)} className="gradient-fill" style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.75rem 1.5rem', color: 'white',
            fontFamily: 'var(--font-headline)', fontWeight: 800, fontSize: '0.875rem',
            borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer'
          }}>
            <Plus size={16} /> Register Vendor
          </button>
        </div>
      </div>

      {/* Search & Filter */}
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
      </div>

      {/* Vendor Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(320px, 1fr))', 
        gap: '1.5rem' 
      }}>
        {vendors.map((vendor, i) => (
          <motion.div key={i} whileHover={{ y: -4 }} style={{ background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-sm)', padding: '1.5rem', border: '1px solid rgba(194,198,211,0.15)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
               <div style={{ width: 48, height: 48, background: 'var(--primary)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: '1.25rem' }}>{vendor.name[0]}</div>
               <div style={{ textAlign: 'right' }}>
                 <p style={{ fontSize: '0.625rem', fontWeight: 900, color: 'var(--outline)', textTransform: 'uppercase' }}>Loyalty</p>
                 <p style={{ fontWeight: 900, color: 'var(--primary)' }}>{vendor.rating} ★</p>
               </div>
            </div>
            <div>
               <h3 style={{ fontWeight: 800, fontSize: '1.125rem', color: 'var(--primary)' }}>{vendor.name}</h3>
               <p style={{ fontSize: '0.625rem', fontWeight: 900, color: 'var(--outline)', textTransform: 'uppercase', marginTop: '0.25rem' }}>{vendor.type}</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--on-surface-variant)' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><MapPin size={14} /> {vendor.location}</div>
               <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Phone size={14} /> {vendor.contact}</div>
            </div>
            <button style={{ width: '100%', padding: '0.75rem', background: 'var(--primary-container)', border: 'none', borderRadius: 'var(--radius-sm)', color: 'var(--on-primary-container)', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
               View Profile <ArrowRight size={14}/>
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default VendorDirectory
