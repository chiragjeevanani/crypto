import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { X, Camera, Receipt, Video, ChevronRight, Trophy, Users, Clock, CheckCircle2 } from 'lucide-react'
import { useCampaignStore } from '../../store/useCampaignStore'
import { triggerCoinRain } from '../shared/CoinRain'
import { daysLeft, formatCount } from '../../utils/formatCurrency'

const BRAND_COLORS = {
    Swiggy: '#FC8019', Myntra: '#FF3F6C', BoAt: '#E63946',
    Nykaa: '#FC2779', Meesho: '#9B51E0',
}

const PROOF_ICONS = { selfie: Camera, bill: Receipt, video: Video }

export default function TaskDetail({ task, onClose }) {
    const { register, handleSubmit, formState: { isSubmitting } } = useForm()
    const [submitted, setSubmitted] = useState(false)
    const [currentStep, setCurrentStep] = useState(0)
    const { submitEntry } = useCampaignStore()

    const brandColor = BRAND_COLORS[task.brand.name] || '#f59e0b'

    const onSubmit = async () => {
        await new Promise((r) => setTimeout(r, 800))
        submitEntry(task)
        setSubmitted(true)
        triggerCoinRain()
    }

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 z-40 flex flex-col justify-end"
                style={{ background: 'rgba(0,0,0,0.6)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            >
                <motion.div
                    className="rounded-t-3xl overflow-y-auto max-h-[85vh]"
                    style={{ background: 'var(--color-surface)' }}
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', stiffness: 280, damping: 30 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Handle */}
                    <div className="flex justify-center pt-3 pb-1">
                        <div className="w-10 h-1 rounded-full" style={{ background: 'var(--color-border)' }} />
                    </div>

                    {/* Header */}
                    <div className="flex items-start gap-3 px-5 pt-2 pb-4">
                        <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-base flex-shrink-0"
                            style={{ background: brandColor }}
                        >
                            {task.brand.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                            <p className="text-xs font-semibold" style={{ color: brandColor }}>{task.brand.name}</p>
                            <p className="text-base font-bold leading-snug" style={{ color: 'var(--color-text)' }}>
                                {task.title}
                            </p>
                        </div>
                        <button onClick={onClose} className="cursor-pointer mt-1">
                            <X size={20} style={{ color: 'var(--color-muted)' }} />
                        </button>
                    </div>

                    {/* Campaign image (user side only) */}
                    <div className="px-5 mb-4">
                        {task.backgroundImage ? (
                            <img
                                src={task.backgroundImage}
                                alt={`${task.title} campaign`}
                                className="w-full h-40 rounded-2xl object-cover border"
                                style={{ borderColor: 'var(--color-border)' }}
                            />
                        ) : (
                            <div
                                className="w-full h-40 rounded-2xl border p-4 flex items-end"
                                style={{
                                    borderColor: 'var(--color-border)',
                                    background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(249,115,22,0.12))',
                                }}
                            >
                                <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                                    {task.title}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Stats */}
                    <div className="flex gap-3 px-5 mb-4">
                        <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-primary)' }}>
                            <Trophy size={13} strokeWidth={2} />
                            <span className="font-bold">₹{task.myReward} reward</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-muted)' }}>
                            <Users size={13} strokeWidth={2} />
                            {formatCount(task.participants)} joined
                        </div>
                        <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-danger)' }}>
                            <Clock size={13} strokeWidth={2} />
                            {daysLeft(task.deadline)}
                        </div>
                    </div>

                    {/* Instructions */}
                    <div className="px-5 mb-4">
                        <p className="text-xs font-semibold uppercase mb-2" style={{ color: 'var(--color-muted)', letterSpacing: '0.06em' }}>
                            Instructions
                        </p>
                        <p className="text-sm leading-relaxed" style={{ color: 'var(--color-sub)' }}>
                            {task.description}
                        </p>
                    </div>

                    {submitted ? (
                        <div className="px-5 pb-8 flex flex-col items-center gap-3 text-center">
                            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.15)' }}>
                                <CheckCircle2 size={36} style={{ color: 'var(--color-success)' }} />
                            </div>
                            <p className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>Task Submitted!</p>
                            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                                Submission queued for public voting. Winner payout: ₹{task.myReward}
                            </p>
                            <button
                                onClick={onClose}
                                className="mt-2 w-full py-3 rounded-xl text-sm font-semibold cursor-pointer"
                                style={{ background: 'var(--color-success)', color: '#fff' }}
                            >
                                Done
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit(onSubmit)} className="px-5 pb-8">
                            {/* Step progress */}
                            <div className="flex items-center gap-2 mb-4">
                                {task.steps.map((_, i) => (
                                    <div
                                        key={i}
                                        className="flex-1 h-1 rounded-full transition-colors duration-300"
                                        style={{ background: i <= currentStep ? 'var(--color-primary)' : 'var(--color-surface2)' }}
                                    />
                                ))}
                            </div>

                            {/* Upload steps */}
                            <div className="flex flex-col gap-3 mb-6">
                                {task.steps.map((step, i) => {
                                    const Icon = PROOF_ICONS[step.type] || Camera
                                    const isActive = i === currentStep
                                    const isDone = i < currentStep
                                    return (
                                        <div
                                            key={step.id}
                                            className="flex items-center gap-3 p-3 rounded-xl border transition-all duration-200"
                                            style={{
                                                background: isActive ? 'rgba(245,158,11,0.08)' : 'var(--color-surface2)',
                                                borderColor: isActive ? 'var(--color-primary)' : isDone ? 'var(--color-success)' : 'transparent',
                                            }}
                                            onClick={() => setCurrentStep(i)}
                                        >
                                            <div
                                                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                                                style={{ background: isDone ? 'rgba(16,185,129,0.15)' : isActive ? 'rgba(245,158,11,0.15)' : 'var(--color-surface)' }}
                                            >
                                                {isDone ? (
                                                    <CheckCircle2 size={18} style={{ color: 'var(--color-success)' }} />
                                                ) : (
                                                    <Icon size={18} style={{ color: isActive ? 'var(--color-primary)' : 'var(--color-muted)' }} />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                                                    {step.label}
                                                </p>
                                                <p className="text-[11px]" style={{ color: 'var(--color-muted)' }}>
                                                    {step.required ? 'Required' : 'Optional'}
                                                </p>
                                            </div>
                                            {isActive && (
                                                <label className="cursor-pointer">
                                                    <span
                                                        className="text-xs font-semibold px-2.5 py-1 rounded-full"
                                                        style={{ background: 'var(--color-primary)', color: '#fff' }}
                                                    >
                                                        Upload
                                                    </span>
                                                    <input
                                                        type="file"
                                                        accept={step.type === 'video' ? 'video/*' : 'image/*'}
                                                        className="hidden"
                                                        {...register(`proof_${i}`)}
                                                        onChange={() => setCurrentStep(Math.min(i + 1, task.steps.length - 1))}
                                                    />
                                                </label>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>

                            <motion.button
                                type="submit"
                                whileTap={{ scale: 0.96 }}
                                disabled={isSubmitting}
                                className="w-full py-3.5 rounded-xl text-sm font-bold cursor-pointer transition-opacity"
                                style={{
                                    background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary2))',
                                    color: '#fff',
                                    opacity: isSubmitting ? 0.7 : 1,
                                }}
                            >
                                {isSubmitting ? 'Submitting...' : 'Submit Task'}
                            </motion.button>
                        </form>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}
