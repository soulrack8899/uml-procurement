import React from 'react'
import { motion } from 'framer-motion'
import { Search, Filter, Plus, Mail, Phone, MapPin, Globe, ArrowRight } from 'lucide-react'

const VendorDirectory = () => {
  const vendors = [
    { name: 'Sarawak Tech Solutions Ltd.', type: 'Hardware & IT', location: 'Kuching, Sarawak', contact: '+60 82-123 456', rating: 4.8 },
    { name: 'Borneo Industrial Hardware', type: 'Construction & Tools', location: 'Miri, Sarawak', contact: '+60 85-789 012', rating: 4.5 },
    { name: 'UMLAB Global Supplies', type: 'Lab Kits & Reagents', location: 'Sibu, Sarawak', contact: '+60 84-234 567', rating: 4.9 },
    { name: 'Sarawak Office Needs', type: 'Furniture & Stationery', location: 'Kuching, Sarawak', contact: '+60 82-345 678', rating: 4.2 },
    { name: 'Industrial Gas Supplies', type: 'Chemicals & Gases', location: 'Kuching, Sarawak', contact: '+60 82-456 789', rating: 4.7 },
  ]

  return (
    <div className="space-y-12">
      {/* Header */}
      <section className="flex flex-col gap-2">
        <p className="label-md text-primary font-bold uppercase tracking-wider">Strategic Partners</p>
        <div className="flex items-center justify-between">
          <h1 className="display-md text-on-surface">Vendor Directory</h1>
          <button className="flex items-center gap-3 px-8 py-4 gradient-fill hover:opacity-90 transition-opacity text-white font-bold label-md rounded-sm shadow-ambient">
            <Plus size={18} />
            Register New Vendor
          </button>
        </div>
      </section>

      {/* Filters Bar */}
      <section className="flex items-center justify-between gap-6 p-6 surface-card shadow-ambient rounded-sm">
        <div className="flex flex-1 items-center gap-4 bg-surface-container-low px-4 py-3 rounded-full">
          <Search size={18} className="text-on-surface-variant" />
          <input 
            type="text" 
            placeholder="Search by vendor name, category, or region..." 
            className="bg-transparent border-none outline-none text-sm w-full label-md"
          />
        </div>
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 px-6 py-3 border border-outline-variant-low label-md font-bold hover:bg-surface-container-low transition-colors rounded-sm">
            <Filter size={18} />
            Category
          </button>
          <button className="flex items-center gap-2 px-6 py-3 border border-outline-variant-low label-md font-bold hover:bg-surface-container-low transition-colors rounded-sm">
            <MapPin size={18} />
            Region
          </button>
        </div>
      </section>

      {/* Vendor Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {vendors.map((vendor, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="surface-card group hover-lift border-b-4 border-transparent hover:border-primary cursor-pointer h-full flex flex-col justify-between shadow-ambient"
          >
            <div>
              <div className="flex justify-between items-start mb-6">
                <div className="w-16 h-16 rounded-sm bg-surface-container-low flex items-center justify-center text-primary font-bold text-2xl">
                  {vendor.name[0]}
                </div>
                <div className="text-right">
                  <p className="label-sm text-on-surface-variant font-bold mb-1">Rating</p>
                  <p className="label-md font-black text-primary">{vendor.rating} / 5.0</p>
                </div>
              </div>
              <h3 className="title-lg font-bold mb-2 group-hover:text-primary transition-colors">{vendor.name}</h3>
              <p className="chip chip-pending mb-6 font-bold">{vendor.type}</p>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-on-surface-variant">
                  <MapPin size={16} />
                  <p className="label-md">{vendor.location}</p>
                </div>
                <div className="flex items-center gap-3 text-on-surface-variant">
                  <Phone size={16} />
                  <p className="label-md">{vendor.contact}</p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-outline-variant-low flex items-center justify-between">
              <button className="flex items-center gap-2 text-primary font-bold label-md hover:underline">
                View Performance
                <ArrowRight size={16} />
              </button>
              <div className="flex gap-2">
                <button className="p-2 hover:bg-surface-container-high rounded-full transition-colors">
                  <Mail size={18} />
                </button>
                <button className="p-2 hover:bg-surface-container-high rounded-full transition-colors">
                  <Globe size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default VendorDirectory
