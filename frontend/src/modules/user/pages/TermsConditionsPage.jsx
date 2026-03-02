import { useLocation, useNavigate } from 'react-router-dom'
import { ChevronLeft, FileText } from 'lucide-react'

export default function TermsConditionsPage() {
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
                <h1 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>Terms & Conditions</h1>
            </div>
            <div className="rounded-2xl p-4 space-y-4" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                <div className="flex items-center gap-2">
                    <FileText size={16} style={{ color: 'var(--color-primary)' }} />
                    <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Platform Terms</p>
                </div>
                <p className="text-sm" style={{ color: 'var(--color-sub)' }}>By using SocialEarn, you agree to follow platform rules, content standards, and payment terms.</p>
                <p className="text-sm" style={{ color: 'var(--color-sub)' }}>Users must provide correct identity details for KYC and payouts. Fraud, abuse, spam, or misleading promotions can result in account restrictions.</p>
                <p className="text-sm" style={{ color: 'var(--color-sub)' }}>Gift earnings, campaign rewards, and withdrawals are processed according to active platform rules and verification status.</p>
                <p className="text-sm" style={{ color: 'var(--color-sub)' }}>SocialEarn may update these terms for legal, safety, or product changes. Continued usage means acceptance of updated terms.</p>
            </div>
        </div>
    )
}
