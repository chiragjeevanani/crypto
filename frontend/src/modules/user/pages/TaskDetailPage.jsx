import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Clock, Trophy, Users } from 'lucide-react'
import { useCampaignStore } from '../store/useCampaignStore'
import { triggerCoinRain } from '../components/shared/CoinRain'
import { daysLeft, formatCount } from '../utils/formatCurrency'

const BRAND_COLORS = {
    Swiggy: '#FC8019', Myntra: '#FF3F6C', BoAt: '#E63946',
    Nykaa: '#FC2779', Meesho: '#9B51E0',
}

export default function TaskDetailPage({ task }) {
    const navigate = useNavigate()
    const { submitEntry } = useCampaignStore()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)

    const brandColor = useMemo(() => BRAND_COLORS[task.brand.name] || '#f59e0b', [task.brand.name])

    const handleSubmit = async () => {
        setIsSubmitting(true)
        await new Promise((resolve) => setTimeout(resolve, 700))
        submitEntry(task)
        triggerCoinRain()
        setSubmitted(true)
        setIsSubmitting(false)
    }

    return (
        <div className="px-4 pt-4 pb-8">
            <button
                onClick={() => navigate('/tasks')}
                className="mb-4 inline-flex items-center gap-2 text-sm font-semibold"
                style={{ color: 'var(--color-text)' }}
            >
                <ArrowLeft size={16} />
                Back to campaigns
            </button>

            <div className="rounded-2xl overflow-hidden border" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
                {task.backgroundImage ? (
                    <img src={task.backgroundImage} alt={task.title} className="w-full h-52 object-cover" />
                ) : (
                    <div
                        className="w-full h-52 p-5 flex items-end"
                        style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.22), rgba(249,115,22,0.12))' }}
                    >
                        <p className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>{task.title}</p>
                    </div>
                )}

                <div className="p-4">
                    <p className="text-xs font-semibold" style={{ color: brandColor }}>{task.brand.name}</p>
                    <h1 className="text-xl font-bold mt-1" style={{ color: 'var(--color-text)' }}>{task.title}</h1>
                    <p className="text-sm mt-2 leading-relaxed" style={{ color: 'var(--color-sub)' }}>{task.description}</p>

                    <div className="grid grid-cols-3 gap-2 mt-4">
                        <div className="rounded-lg p-2" style={{ background: 'var(--color-surface2)' }}>
                            <p className="text-[11px] flex items-center gap-1" style={{ color: 'var(--color-primary)' }}>
                                <Trophy size={12} /> Reward
                            </p>
                            <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>₹{task.myReward}</p>
                        </div>
                        <div className="rounded-lg p-2" style={{ background: 'var(--color-surface2)' }}>
                            <p className="text-[11px] flex items-center gap-1" style={{ color: 'var(--color-muted)' }}>
                                <Users size={12} /> Joined
                            </p>
                            <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{formatCount(task.participants)}</p>
                        </div>
                        <div className="rounded-lg p-2" style={{ background: 'var(--color-surface2)' }}>
                            <p className="text-[11px] flex items-center gap-1" style={{ color: 'var(--color-danger)' }}>
                                <Clock size={12} /> Time left
                            </p>
                            <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{daysLeft(task.deadline)}</p>
                        </div>
                    </div>

                    <div className="mt-4">
                        <p className="text-xs font-semibold uppercase" style={{ color: 'var(--color-muted)' }}>What to do</p>
                        <div className="mt-2 space-y-2">
                            {task.steps.map((step) => (
                                <div key={step.id} className="rounded-lg p-3 flex items-center justify-between" style={{ background: 'var(--color-surface2)' }}>
                                    <p className="text-sm" style={{ color: 'var(--color-text)' }}>{step.label}</p>
                                    <span className="text-[11px]" style={{ color: 'var(--color-muted)' }}>
                                        {step.required ? 'Required' : 'Optional'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {submitted ? (
                        <div className="mt-4 rounded-xl p-3 flex items-start gap-2" style={{ background: 'rgba(16,185,129,0.14)', color: 'var(--color-success)' }}>
                            <CheckCircle2 size={18} />
                            <p className="text-sm">Submitted successfully. You are now in this campaign.</p>
                        </div>
                    ) : null}

                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || submitted}
                        className="mt-4 w-full py-3 rounded-xl text-sm font-semibold disabled:opacity-60"
                        style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary2))', color: '#fff' }}
                    >
                        {isSubmitting ? 'Submitting...' : submitted ? 'Submitted' : 'Submit Task'}
                    </button>
                </div>
            </div>
        </div>
    )
}
