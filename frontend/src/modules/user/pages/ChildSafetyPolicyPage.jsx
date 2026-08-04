import { useLocation, useNavigate } from 'react-router-dom'
import { ChevronLeft, ShieldAlert } from 'lucide-react'

export default function ChildSafetyPolicyPage() {
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
        <div className="h-screen overflow-y-auto px-4 pt-4 pb-24 max-w-2xl mx-auto select-text">
            <div className="flex items-center gap-3 mb-4">
                <button onClick={handleBack} className="p-2 rounded-full" style={{ background: 'var(--color-surface2)' }}>
                    <ChevronLeft size={18} style={{ color: 'var(--color-text)' }} />
                </button>
                <h1 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>Child Safety Standards</h1>
            </div>
            <div className="rounded-2xl p-6 space-y-6" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                <div className="flex items-center gap-3 pb-3 border-b border-white/5">
                    <ShieldAlert size={20} className="text-primary" />
                    <div>
                        <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>KnQ Reels Child Safety Standards</p>
                        <p className="text-xs" style={{ color: 'var(--color-sub)' }}>Zero tolerance for child sexual abuse and exploitation</p>
                    </div>
                </div>

                <div className="space-y-4 text-sm leading-relaxed" style={{ color: 'var(--color-sub)' }}>
                    <p>
                        KnQ Reels is committed to providing a safer messaging environment. These standards explain how we prohibit child sexual abuse and exploitation, how users can report concerns, and how KnQ Reels responds to violations.
                    </p>
                    
                    <p className="text-xs font-medium" style={{ color: 'var(--color-text)' }}>Last updated: July 27, 2026</p>

                    <div className="space-y-2">
                        <h2 className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>1. Scope</h2>
                        <p>
                            These standards apply to all users, conversations, uploads, profile content, channels, groups, and any other activity carried out through KnQ Reels.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>2. Prohibited Content And Conduct</h2>
                        <p>
                            KnQ Reels has zero tolerance for child sexual abuse and exploitation (CSAE), including child sexual abuse material (CSAM), grooming, extortion, trafficking, or any behavior that sexualizes, harms, or endangers minors.
                        </p>
                        <p>
                            Users must not create, upload, store, share, request, promote, or facilitate content that exploits or endangers children.
                        </p>
                        <p>
                            We may remove violating content, restrict features, suspend accounts, permanently ban users, and preserve information for lawful investigations when required.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>3. Reporting And Safety Tools</h2>
                        <p>
                            Use the in-app reporting tools available in chats, channels, and other supported surfaces to flag abuse, harmful content, or suspicious behavior.
                        </p>
                        <p>
                            Use in-app blocking and privacy controls to stop contact from abusive users while a report is being reviewed.
                        </p>
                        <p>
                            Email child-safety concerns, CSAE/CSAM reports, or urgent compliance questions to <a href="mailto:childsafety@knqreels.com" className="text-primary underline">childsafety@knqreels.com</a>.
                        </p>
                        <p>
                            If you believe a child is in immediate danger, contact local law enforcement or your local child protection authority first, then report the matter to KnQ Reels.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>4. Review And Enforcement</h2>
                        <p>
                            Review reported accounts, messages, channels, and related activity signals. Remove or restrict content that violates our standards. Suspend or permanently terminate accounts involved in child endangerment.
                        </p>
                        <p>
                            Escalate credible CSAM or child exploitation matters to appropriate authorities or child protection organizations when legally required.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>5. Compliance</h2>
                        <p>
                            We maintain and enforce standards intended to prevent child sexual abuse and exploitation on our service. We respond to valid legal requests and cooperate with applicable child safety laws and regulatory obligations. We continuously improve moderation, reporting, and abuse-response workflows as the product evolves.
                        </p>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-white/5">
                        <h2 className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>6. Child Safety Contact</h2>
                        <p>
                            Designated child safety contact for KnQ Reels:
                        </p>
                        <p className="font-semibold" style={{ color: 'var(--color-text)' }}>
                            <a href="mailto:childsafety@knqreels.com" className="text-primary underline">childsafety@knqreels.com</a>
                        </p>
                        <p className="text-xs">
                            This contact must remain monitored so reports from users, Google Play, regulators, and lawful authorities can be reviewed promptly.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
