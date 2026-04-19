import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useLocation, useNavigate } from 'react-router-dom'
import { Search, ArrowLeft, ArrowRight, FileText, User, Building2, AlertTriangle } from 'lucide-react'
import { procurementApi } from '../services/api'
import { useCompany, getStatusChipClass } from '../App'

const SearchResults = () => {
    const location = useLocation()
    const navigate = useNavigate()
    const { currentCompany, isMobile } = useCompany()
    
    const params = new URLSearchParams(location.search)
    const query = params.get('q') || ''
    
    const [results, setResults] = useState([])
    const [loading, setLoading] = useState(true)
    
    useEffect(() => {
        if (query) fetchResults()
    }, [query, currentCompany])
    
    const fetchResults = async () => {
        setLoading(true)
        try {
            const data = await procurementApi.getRequests(0, 100) // Increase limit for search visibility
            const items = data.items || []
            // Client-side search for now
            const filtered = items.filter(r => 
                r.title?.toLowerCase().includes(query.toLowerCase()) ||
                r.vendor_name?.toLowerCase().includes(query.toLowerCase()) ||
                r.id.toString() === query
            )
            setResults(filtered)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }
    
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <button onClick={() => navigate(-1)} style={{ width: 40, height: 40, borderRadius: '12px', border: 'none', background: 'var(--surface-container-high)', color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: '1.5rem', fontWeight: 900, color: 'var(--primary)' }}>Search Results</h1>
                    <p style={{ fontSize: '0.875rem', color: 'var(--outline)' }}>Found {results.length} matches for "{query}"</p>
                </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {loading ? (
                    <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--outline)' }}>Searching archives...</div>
                ) : results.length === 0 ? (
                    <div className="surface-card" style={{ padding: '5rem', textAlign: 'center', background: 'var(--surface-container-lowest)' }}>
                        <Search size={48} style={{ margin: '0 auto 1.5rem', opacity: 0.2 }} />
                        <h3 style={{ fontWeight: 800 }}>No exact matches</h3>
                        <p style={{ color: 'var(--outline)', fontSize: '0.875rem', marginTop: '0.5rem' }}>Try searching by Vendor name or Request ID.</p>
                    </div>
                ) : (
                    results.map((req, idx) => (
                        <motion.div 
                            key={req.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            onClick={() => navigate(`/request/${req.id}`)}
                            className="surface-card hover-lift"
                            style={{ padding: '1.5rem', cursor: 'pointer', borderLeft: '4px solid var(--primary)' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                        <span className={`chip ${getStatusChipClass(req.status)}`} style={{ fontSize: '0.625rem' }}>{req.status}</span>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--outline)' }}>#{req.id}</span>
                                    </div>
                                    <h4 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--on-surface)' }}>{req.title}</h4>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.25rem' }}>
                                        <p style={{ fontSize: '0.875rem', color: 'var(--outline)', display: 'flex', alignItems: 'center', gap: '4px' }}><Building2 size={14} /> {req.vendor_name}</p>
                                        <p style={{ fontSize: '0.875rem', color: 'var(--outline)', display: 'flex', alignItems: 'center', gap: '4px' }}><FileText size={14} /> RM {req.total_amount.toLocaleString()}</p>
                                    </div>
                                </div>
                                <ArrowRight size={20} style={{ color: 'var(--outline-variant)' }} />
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    )
}

export default SearchResults;
