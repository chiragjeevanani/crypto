import { useLocation, useNavigate } from 'react-router-dom'
import { ChevronLeft, ShieldAlert } from 'lucide-react'

export default function CommunityGuidelinesPage() {
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
        <div className="min-h-screen overflow-y-auto px-4 pt-4 pb-24 max-w-2xl mx-auto select-text">
            <div className="flex items-center gap-3 mb-4">
                <button onClick={handleBack} className="p-2 rounded-full" style={{ background: 'var(--color-surface2)' }}>
                    <ChevronLeft size={18} style={{ color: 'var(--color-text)' }} />
                </button>
                <h1 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>Community Guidelines</h1>
            </div>
            <div className="rounded-2xl p-4 md:p-6 space-y-4" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                    <ShieldAlert size={18} style={{ color: 'var(--color-primary)' }} />
                    <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Creator Conduct</p>
                </div>
                <div className="space-y-3 text-sm leading-relaxed" style={{ color: 'var(--color-sub)' }}>
                    <p>Post original, respectful, and lawful content. Harmful, abusive, misleading, or spam content is not allowed.</p>
                    <p>Do not share fake earning claims, scam links, or manipulative referrals. Repeated violations may lead to account limits or bans.</p>
                    <p>For brand tasks and NFTs, share genuine submissions and follow campaign rules. False submissions can be rejected by moderators.</p>
                    <p>Respect community members in comments and interactions. Keep the platform safe and professional for all creators and brands.</p>
                </div>
            </div>
        </div>
    )
}
