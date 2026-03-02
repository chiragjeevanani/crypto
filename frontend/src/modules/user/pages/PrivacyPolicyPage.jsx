import { useLocation, useNavigate } from 'react-router-dom'
import { ChevronLeft, Shield } from 'lucide-react'

export default function PrivacyPolicyPage() {
    const location = useLocation()
    const navigate = useNavigate()
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
                <p className="text-sm" style={{ color: 'var(--color-sub)' }}>We collect basic profile data, wallet activity, and KYC documents only for account operations, security, and payout compliance.</p>
                <p className="text-sm" style={{ color: 'var(--color-sub)' }}>Sensitive data is access-controlled and used only by authorized teams for verification, moderation, and fraud prevention.</p>
                <p className="text-sm" style={{ color: 'var(--color-sub)' }}>We do not sell personal identity data. Operational analytics may be used to improve platform performance and trust systems.</p>
                <p className="text-sm" style={{ color: 'var(--color-sub)' }}>Users can request updates to personal profile information through account settings and support channels.</p>
            </div>
        </div>
    )
}
