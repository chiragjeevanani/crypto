import { useLocation, useNavigate } from 'react-router-dom'
import { ChevronLeft, Shield } from 'lucide-react'
import { useState, useEffect } from 'react'
import axios from 'axios'

export default function PrivacyPolicyPage() {
    const location = useLocation()
    const navigate = useNavigate()
    const [policy, setPolicy] = useState('')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/config`)
            .then(res => {
                if (res.data.success) {
                    setPolicy(res.data.config.privacyPolicy || 'Privacy Policy will be updated soon.')
                }
            })
            .catch(() => setPolicy('Failed to load Privacy Policy.'))
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
        <div className="px-4 pt-4 pb-24">
            <div className="flex items-center gap-3 mb-4">
                <button onClick={handleBack} className="p-2 rounded-full" style={{ background: 'var(--color-surface2)' }}>
                    <ChevronLeft size={18} style={{ color: 'var(--color-text)' }} />
                </button>
                <h1 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>Privacy Policy</h1>
            </div>
            <div className="rounded-2xl p-4 space-y-4" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                <div className="flex items-center gap-2">
                    <Shield size={16} style={{ color: 'var(--color-primary)' }} />
                    <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Data & Privacy</p>
                </div>
                {loading ? (
                    <p className="text-sm animate-pulse" style={{ color: 'var(--color-sub)' }}>Loading...</p>
                ) : (
                    <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--color-sub)' }}>{policy}</p>
                )}
            </div>
        </div>
    )
}
