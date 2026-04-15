import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Filter, Plus, Mail, Phone, MapPin, Globe, ArrowRight, ChevronRight, X, ShieldCheck, Map, MessageSquare, Star } from 'lucide-react'
import { procurementApi } from '../services/api'
import { useCompany } from '../App'

const VendorDirectory = () => {
  const { isMobile, refreshKey } = useCompany()
  const [showRegister, setShowRegister] = useState(false)
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [newVendor, setNewVendor] = useState({
    name: '',
    vendor_type: '',
    location: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'Malaysia',
    contact: '',
    rating: 5.0,
    comments: ''
  })

  // Selected Vendor & Order History State
  const [selectedVendor, setSelectedVendor] = useState(null)
  const [vendorOrders, setVendorOrders] = useState([])
  const [fetchingOrders, setFetchingOrders] = useState(false)

  // Address Lookup State
  const [addressQuery, setAddressQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [searchingAddress, setSearchingAddress] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    fetchData()
  }, [refreshKey])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setSuggestions([])
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const data = await procurementApi.getVendors()
      setVendors(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddressSearch = async (query) => {
    setAddressQuery(query)
    if (query.length < 3) {
      setSuggestions([])
      return
    }

    setSearchingAddress(true)
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5`)
      const data = await response.json()
      setSuggestions(data)
    } catch (err) {
      console.error('Address lookup failed', err)
    } finally {
      setSearchingAddress(false)
    }
  }

  const selectAddress = (suggestion) => {
    const addr = suggestion.address
    setNewVendor({
      ...newVendor,
      address: suggestion.display_name.split(',')[0], // Primary address line
      city: addr.city || addr.town || addr.village || addr.suburb || '',
      state: addr.state || '',
      postal_code: addr.postcode || '',
      country: addr.country || 'Malaysia',
      location: `${addr.city || addr.town || ''}, ${addr.state || ''}`.trim().replace(/^,|,$/g, '')
    })
    setAddressQuery(suggestion.display_name)
    setSuggestions([])
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    try {
      await procurementApi.createVendor(newVendor)
      setShowRegister(false)
      setNewVendor({
        name: '', vendor_type: '', location: '', contact: '', rating: 5.0,
        address: '', city: '', state: '', postal_code: '', country: 'Malaysia', comments: ''
      })
      setAddressQuery('')
      fetchData()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleSelectVendor = async (vendor) => {
    setSelectedVendor(vendor)
    setFetchingOrders(true)
    try {
      // Fetch procurement history for this vendor
      const orders = await procurementApi.getRequests()
      // Use loose linking to filter orders by vendor name or id if available
      const filtered = orders.filter(o => o.vendor_id === vendor.id || o.vendor_name === vendor.name)
      setVendorOrders(filtered)
    } catch (err) {
      console.error('Failed to fetch vendor history', err)
      setVendorOrders([])
    } finally {
      setFetchingOrders(false)
    }
  }

  const filteredVendors = vendors.filter(v => {
    const q = searchQuery.toLowerCase()
    if (!q) return true
    return (
      v.name?.toLowerCase().includes(q) ||
      v.vendor_type?.toLowerCase().includes(q) ||
      v.location?.toLowerCase().includes(q) ||
      v.city?.toLowerCase().includes(q) ||
      v.state?.toLowerCase().includes(q) ||
      v.address?.toLowerCase().includes(q)
    )
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '1.5rem' : '2.5rem', position: 'relative' }}>

      {/* Vendor Profile Drawer */}
      <AnimatePresence>
        {selectedVendor && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 1100, display: 'flex', justifyContent: 'flex-end' }}>
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={{ width: isMobile ? '100%' : '500px', background: 'white', height: '100%', padding: '2.5rem', boxShadow: '-20px 0 60px rgba(0,0,0,0.1)', overflowY: 'auto' }}>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3rem' }}>
                <button onClick={() => setSelectedVendor(null)} style={{ background: 'var(--surface-container-low)', border: 'none', padding: '0.5rem 1rem', borderRadius: 'var(--radius-pill)', color: 'var(--outline)', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <X size={16} /> Close
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Star size={16} fill="var(--primary)" color="var(--primary)" />
                  <span style={{ fontWeight: 900, color: 'var(--primary)', fontSize: '1.25rem' }}>{selectedVendor.rating.toFixed(1)}</span>
                </div>
              </div>

              <div style={{ marginBottom: '2.5rem' }}>
                <div style={{ width: 80, height: 80, background: 'var(--primary)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: '2rem', marginBottom: '1.5rem' }}>{selectedVendor.name[0]}</div>
                <h2 style={{ fontFamily: 'var(--font-headline)', fontSize: '2rem', fontWeight: 900, color: 'var(--primary)', letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>{selectedVendor.name}</h2>
                <span style={{ padding: '4px 12px', background: 'var(--surface-container-high)', borderRadius: 'var(--radius-pill)', fontSize: '0.75rem', fontWeight: 800, color: 'var(--secondary)', textTransform: 'uppercase' }}>{selectedVendor.vendor_type}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '3rem' }}>
                <DetailItem icon={<MapPin size={18} />} label="Full Address" value={`${selectedVendor.address || ''}, ${selectedVendor.city || ''}, ${selectedVendor.state || ''}, ${selectedVendor.country || ''}`} />
                <DetailItem icon={<Phone size={18} />} label="Contact Support" value={selectedVendor.contact} />
                {selectedVendor.comments && <DetailItem icon={<MessageSquare size={18} />} label="Internal Context" value={selectedVendor.comments} italic />}
              </div>

              <div style={{ borderTop: '1px solid var(--outline-variant-low)', paddingTop: '2.5rem' }}>
                <h3 style={{ fontFamily: 'var(--font-label)', fontSize: '0.75rem', fontWeight: 900, color: 'var(--outline)', textTransform: 'uppercase', marginBottom: '1.5rem', letterSpacing: '0.1em' }}>Order History</h3>

                {fetchingOrders ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--outline)', fontSize: '0.875rem' }}>Syncing order history...</div>
                ) : vendorOrders.length === 0 ? (
                  <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--surface-container-low)', borderRadius: 'var(--radius-md)', color: 'var(--outline)', fontSize: '0.875rem' }}>No previous transactions found.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {vendorOrders.map(order => (
                      <div key={order.id} style={{ padding: '1rem', border: '1px solid var(--outline-variant-low)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <p style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--on-surface)' }}>{order.title}</p>
                          <p style={{ fontSize: '0.625rem', color: 'var(--outline)', marginTop: '2px' }}>{new Date(order.created_at).toLocaleDateString()}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontSize: '0.875rem', fontWeight: 900, color: 'var(--primary)' }}>RM {order.total_amount.toLocaleString()}</p>
                          <span style={{ fontSize: '0.5rem', fontWeight: 900, color: 'var(--tertiary)' }}>{order.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Registration Modal */}
      <AnimatePresence>
        {showRegister && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
              style={{ background: 'white', width: '100%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto', borderRadius: 'var(--radius-lg)', padding: isMobile ? '1.5rem' : '2.5rem', position: 'relative', boxShadow: '0 50px 100px rgba(0,0,0,0.2)' }}>
              <button onClick={() => setShowRegister(false)} style={{ position: 'absolute', right: '1.5rem', top: '1.5rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--outline)' }}><X /></button>

              <h2 style={{ fontFamily: 'var(--font-headline)', fontSize: '1.75rem', fontWeight: 900, color: 'var(--primary)', marginBottom: '0.5rem' }}>Add Vendor</h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--outline)', marginBottom: '2rem' }}>Register a new supplier to the procurement network.</p>

              <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1.5rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.625rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '0.5rem', color: 'var(--outline)' }}>Company Name</label>
                    <input required value={newVendor.name} onChange={e => setNewVendor({ ...newVendor, name: e.target.value })} style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--outline-variant)', fontWeight: 700 }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.625rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '0.5rem', color: 'var(--outline)' }}>Vendor Type / Category</label>
                    <input required value={newVendor.vendor_type} onChange={e => setNewVendor({ ...newVendor, vendor_type: e.target.value })} placeholder="e.g. Lab Equipment, IT Services" style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--outline-variant)', fontWeight: 700 }} />
                  </div>
                </div>

                {/* Address Lookup */}
                <div style={{ position: 'relative' }} ref={dropdownRef}>
                  <label style={{ display: 'block', fontSize: '0.625rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '0.5rem', color: 'var(--outline)' }}>Address Lookup</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                      <input
                        value={addressQuery}
                        onChange={e => handleAddressSearch(e.target.value)}
                        placeholder="Search for an address..."
                        style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--outline-variant)', fontWeight: 700 }}
                      />
                      <MapPin size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--outline)' }} />
                    </div>
                  </div>

                  {suggestions.length > 0 && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', borderRadius: 'var(--radius-sm)', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', border: '1px solid var(--outline-variant)', zIndex: 10, marginTop: '0.25rem', maxHeight: '200px', overflowY: 'auto' }}>
                      {suggestions.map((s, idx) => (
                        <div key={idx} onClick={() => selectAddress(s)} style={{ padding: '0.75rem 1rem', cursor: 'pointer', borderBottom: '1px solid var(--surface-variant)', fontSize: '0.875rem', hover: { background: 'var(--surface-container)' } }} className="suggestion-item">
                          {s.display_name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr', gap: '1.5rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.625rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '0.5rem', color: 'var(--outline)' }}>Street Address</label>
                    <input required value={newVendor.address} onChange={e => setNewVendor({ ...newVendor, address: e.target.value })} style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--outline-variant)', fontWeight: 700 }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.625rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '0.5rem', color: 'var(--outline)' }}>Postal Code</label>
                    <input required value={newVendor.postal_code} onChange={e => setNewVendor({ ...newVendor, postal_code: e.target.value })} style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--outline-variant)', fontWeight: 700 }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr 1fr', gap: '1.5rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.625rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '0.5rem', color: 'var(--outline)' }}>City</label>
                    <input required value={newVendor.city} onChange={e => setNewVendor({ ...newVendor, city: e.target.value })} style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--outline-variant)', fontWeight: 700 }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.625rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '0.5rem', color: 'var(--outline)' }}>State</label>
                    <input required value={newVendor.state} onChange={e => setNewVendor({ ...newVendor, state: e.target.value })} style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--outline-variant)', fontWeight: 700 }} />
                  </div>
                  <div style={{ gridColumn: isMobile ? 'span 2' : 'auto' }}>
                    <label style={{ display: 'block', fontSize: '0.625rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '0.5rem', color: 'var(--outline)' }}>Country</label>
                    <input required value={newVendor.country} onChange={e => setNewVendor({ ...newVendor, country: e.target.value })} style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--outline-variant)', fontWeight: 700 }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1.5rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.625rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '0.5rem', color: 'var(--outline)' }}>Contact Number</label>
                    <input required value={newVendor.contact} onChange={e => setNewVendor({ ...newVendor, contact: e.target.value })} placeholder="+60 ..." style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--outline-variant)', fontWeight: 700 }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.625rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '0.5rem', color: 'var(--outline)' }}>Internal Rating</label>
                    <select value={newVendor.rating} onChange={e => setNewVendor({ ...newVendor, rating: parseFloat(e.target.value) })} style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--outline-variant)', fontWeight: 700, background: 'white' }}>
                      {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} Stars</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.625rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '0.5rem', color: 'var(--outline)' }}>Internal Comments / Notes</label>
                  <textarea value={newVendor.comments} onChange={e => setNewVendor({ ...newVendor, comments: e.target.value })} placeholder="Shared experience or special handling notes..." style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--outline-variant)', fontWeight: 700, minHeight: '100px', resize: 'vertical' }} />
                </div>

                <button type="submit" className="gradient-fill" style={{ width: '100%', marginTop: '1rem', padding: '1rem', borderRadius: 'var(--radius-md)', border: 'none', color: 'white', fontWeight: 900, cursor: 'pointer', boxShadow: '0 10px 20px rgba(var(--primary-rgb), 0.3)' }}>
                  Register Vendor
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
          <input type="text" placeholder="Search by vendor name, category, or location..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ background: 'transparent', border: 'none', outline: 'none', fontFamily: 'var(--font-body)', fontSize: '0.875rem', width: '100%' }} />
        </div>
      </div>

      {/* Vendor Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(350px, 1fr))',
        gap: '2rem'
      }}>
        {loading ? (
          <div style={{ gridColumn: '1 / -1', padding: '4rem', textAlign: 'center', fontWeight: 800, opacity: 0.5 }}>Loading vendor directory...</div>
        ) : vendors.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', padding: '4rem', textAlign: 'center', background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-sm)' }}>
            <ShieldCheck size={40} style={{ margin: '0 auto 1.5rem', opacity: 0.2 }} />
            <p style={{ fontWeight: 800 }}>No vendors registered</p>
          </div>
        ) : filteredVendors.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', padding: '4rem', textAlign: 'center', background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-sm)' }}>
            <Search size={40} style={{ margin: '0 auto 1.5rem', opacity: 0.2, color: 'var(--outline)' }} />
            <p style={{ fontWeight: 800 }}>No vendors match your search</p>
          </div>
        ) : filteredVendors.map((vendor, i) => (
          <motion.div key={i} whileHover={{ y: -6, boxShadow: '0 20px 40px rgba(0,0,0,0.08)' }} style={{ background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-md)', padding: '2rem', border: '1px solid rgba(194,198,211,0.15)', display: 'flex', flexDirection: 'column', gap: '1.5rem', transition: 'box-shadow 0.3s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ width: 56, height: 56, background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 100%)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: '1.5rem', boxShadow: '0 8px 16px rgba(var(--primary-rgb), 0.2)' }}>{vendor.name[0]}</div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '0.625rem', fontWeight: 900, color: 'var(--outline)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Trust Score</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2px', justifyContent: 'flex-end', marginTop: '2px' }}>
                  <Star size={14} fill="var(--primary)" color="var(--primary)" />
                  <p style={{ fontWeight: 900, color: 'var(--primary)', fontSize: '1rem' }}>{vendor.rating.toFixed(1)}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--primary)', letterSpacing: '-0.01em' }}>{vendor.name}</h3>
              <span style={{ display: 'inline-block', padding: '0.25rem 0.75rem', background: 'var(--primary-container)', color: 'var(--on-primary-container)', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', borderRadius: 'var(--radius-pill)', marginTop: '0.5rem' }}>{vendor.vendor_type}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem', color: 'var(--on-surface-variant)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <MapPin size={16} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }} />
                <div style={{ lineHeight: 1.4 }}>
                  {vendor.address && <div>{vendor.address}</div>}
                  <div>{vendor.postal_code} {vendor.city}</div>
                  <div style={{ fontWeight: 700, fontSize: '0.75rem' }}>{vendor.state}, {vendor.country}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Phone size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                <span style={{ fontWeight: 600 }}>{vendor.contact}</span>
              </div>
            </div>

            {vendor.comments && (
              <div style={{ background: 'var(--surface-container-low)', padding: '1rem', borderRadius: 'var(--radius-sm)', display: 'flex', gap: '0.75rem' }}>
                <MessageSquare size={16} style={{ color: 'var(--outline)', flexShrink: 0, marginTop: '2px' }} />
                <p style={{ fontSize: '0.8125rem', color: 'var(--outline)', fontStyle: 'italic', margin: 0, lineHeight: 1.5 }}>
                  "{vendor.comments}"
                </p>
              </div>
            )}

            <button
              onClick={() => handleSelectVendor(vendor)}
              style={{ width: '100%', padding: '1rem', background: 'var(--surface-container-high)', border: 'none', borderRadius: 'var(--radius-sm)', color: 'var(--primary)', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: 'auto' }}>
              Vendor Profile <ArrowRight size={16} />
            </button>
          </motion.div>
        ))}
      </div>

      <style>{`
        .suggestion-item:hover {
          background: var(--surface-container-high) !important;
        }
      `}</style>
    </div>
  )
}

const DetailItem = ({ icon, label, value, italic }) => (
  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
    <div style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }}>{icon}</div>
    <div>
      <p style={{ fontFamily: 'var(--font-label)', fontSize: '0.625rem', fontWeight: 900, color: 'var(--outline)', textTransform: 'uppercase', marginBottom: '0.25rem', letterSpacing: '0.05em' }}>{label}</p>
      <p style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--on-surface)', lineHeight: 1.4, fontStyle: italic ? 'italic' : 'normal' }}>{value || 'Not provided'}</p>
    </div>
  </div>
)

export default VendorDirectory
