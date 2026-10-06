import { useLocation, useNavigate } from 'react-router-dom'
import { ChevronLeft, FileText } from 'lucide-react'
import { useState, useEffect } from 'react'
import axios from 'axios'

export default function TermsConditionsPage() {
    const location = useLocation()
    const navigate = useNavigate()
    const [terms, setTerms] = useState('')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/config`)
            .then(res => {
                if (res.data.success) {
                    setTerms(res.data.config.termsAndConditions || 'Terms and Conditions will be updated soon.')
                }
            })
            .catch(() => setTerms('Failed to load Terms and Conditions.'))
            .finally(() => setLoading(false))
    }, [])

    const handleBack = () => {
        if (location.state?.openSettingsOnBack) {
            navigate('/profile', { state: location.state.openSettingsOnBack })
            return
        }
        navigate(-1)
    }

    return (
        <div className="min-h-screen overflow-y-auto px-4 pt-4 pb-24 max-w-2xl mx-auto select-text">
            <div className="flex items-center gap-3 mb-4">
                <button onClick={handleBack} className="p-2 rounded-full" style={{ background: 'var(--color-surface2)' }}>
                    <ChevronLeft size={18} style={{ color: 'var(--color-text)' }} />
                </button>
                <h1 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>Terms & Conditions</h1>
            </div>
            <div className="rounded-2xl p-4 md:p-6 space-y-4" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                    <FileText size={18} style={{ color: 'var(--color-primary)' }} />
                    <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Platform Terms</p>
                </div>
                {loading ? (
                    <p className="text-sm animate-pulse" style={{ color: 'var(--color-sub)' }}>Loading...</p>
                ) : (
                    <div className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--color-sub)' }}>{terms}</div>
                )}
            </div>
        </div>
    )
}
