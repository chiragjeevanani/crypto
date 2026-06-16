import { useLocation, useNavigate } from 'react-router-dom'
import { ChevronLeft, Mail, Phone, HelpCircle } from 'lucide-react'
import { useState, useEffect } from 'react'
import axios from 'axios'

export default function SupportPage() {
    const location = useLocation()
    const navigate = useNavigate()
    const [config, setConfig] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/config`)
            .then(res => {
                if (res.data.success) {
                    setConfig(res.data.config)
                }
            })
            .catch(() => {})
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
        <div className="px-4 pt-4 pb-24 space-y-6">
            <div className="flex items-center gap-3">
                <button onClick={handleBack} className="p-2 rounded-full" style={{ background: 'var(--color-surface2)' }}>
                    <ChevronLeft size={18} style={{ color: 'var(--color-text)' }} />
                </button>
                <h1 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>Support Center</h1>
            </div>

            {loading ? (
                <div className="text-center text-sm animate-pulse text-muted">Loading support info...</div>
            ) : config ? (
                <>
                    <div className="rounded-2xl p-5 space-y-4" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                        <div className="flex items-center gap-2 mb-2">
                            <HelpCircle size={16} style={{ color: 'var(--color-primary)' }} />
                            <p className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>Contact Us</p>
                        </div>
                        
                        {config.supportEmail && (
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                    <Mail size={14} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-muted uppercase tracking-wider">Email Support</p>
                                    <a href={`mailto:${config.supportEmail}`} className="text-sm font-semibold hover:text-primary transition-colors">{config.supportEmail}</a>
                                </div>
                            </div>
                        )}

                        {config.supportMobile && (
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                    <Phone size={14} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-muted uppercase tracking-wider">Call Support</p>
                                    <a href={`tel:${config.supportMobile}`} className="text-sm font-semibold hover:text-primary transition-colors">{config.supportMobile}</a>
                                </div>
                            </div>
                        )}

                        {!config.supportEmail && !config.supportMobile && (
                            <p className="text-sm text-muted">Contact information is currently unavailable.</p>
                        )}
                    </div>

                    <div className="space-y-3">
                        <h2 className="text-sm font-bold ml-1">Frequently Asked Questions</h2>
                        {config.faqs && config.faqs.length > 0 ? (
                            <div className="space-y-3">
                                {config.faqs.map((faq, idx) => (
                                    <div key={idx} className="rounded-xl p-4 space-y-2" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                                        <h3 className="text-sm font-bold">{faq.question}</h3>
                                        <p className="text-xs text-muted leading-relaxed whitespace-pre-wrap">{faq.answer}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-xl p-4 text-center text-sm text-muted" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                                No FAQs available at the moment.
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <div className="text-center text-sm text-red-500">Failed to load support information.</div>
            )}
        </div>
    )
}
