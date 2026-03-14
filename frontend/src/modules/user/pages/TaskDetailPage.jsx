import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Clock, Trophy, Users } from 'lucide-react'
import { triggerCoinRain } from '../components/shared/CoinRain'
import { daysLeft, formatCount } from '../utils/formatCurrency'
import { userCampaignService } from '../services/campaignService'
import { mapCampaignToTask } from '../utils/campaignMapper'
import { getJoinedCampaignIds, markCampaignJoined } from '../utils/campaignStorage'
import { useUserStore } from '../store/useUserStore'
import { useFeedStore } from '../store/useFeedStore'

const BRAND_COLORS = {
    Swiggy: '#FC8019', Myntra: '#FF3F6C', BoAt: '#E63946',
    Nykaa: '#FC2779', Meesho: '#9B51E0',
}

export default function TaskDetailPage({ task }) {
    const navigate = useNavigate()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [isJoining, setIsJoining] = useState(false)
    const [joinError, setJoinError] = useState('')
    const [submitError, setSubmitError] = useState('')
    const [campaignError, setCampaignError] = useState('')
    const [campaignLoading, setCampaignLoading] = useState(false)
    const [taskView, setTaskView] = useState(task)
    const [joined, setJoined] = useState(task?.joined || false)
    const [submissions, setSubmissions] = useState([])
    const [submissionsLoading, setSubmissionsLoading] = useState(false)
    const [voteBusy, setVoteBusy] = useState(null)
    const [submissionCaption, setSubmissionCaption] = useState('')
    const [submissionFile, setSubmissionFile] = useState(null)
    const [submissionMode, setSubmissionMode] = useState('post')
    const [showMineOnly, setShowMineOnly] = useState(false)
    const { profile } = useUserStore()
    const { loadPosts } = useFeedStore()

    const isCampaign = task?.source === 'campaign'
    const campaignId = isCampaign ? (task?.campaignId || task?.id) : null

    useEffect(() => {
        if (!campaignId) return
        let mounted = true
        const load = async () => {
            setCampaignLoading(true)
            setCampaignError('')
            try {
                const data = await userCampaignService.getById(campaignId, true)
                if (!mounted) return
                const joinedIds = new Set(getJoinedCampaignIds())
                const nextJoined = joinedIds.has(String(campaignId))
                setJoined(nextJoined)
                setTaskView(mapCampaignToTask(data, nextJoined))
            } catch (error) {
                if (mounted) setCampaignError(error?.message || 'Failed to load campaign')
            } finally {
                if (mounted) setCampaignLoading(false)
            }
        }
        load()
        return () => { mounted = false }
    }, [campaignId, task?.source])

    useEffect(() => {
        if (!campaignId) return
        let mounted = true
        const loadSubmissions = async () => {
            setSubmissionsLoading(true)
            try {
                const list = await userCampaignService.listSubmissions(campaignId)
                if (mounted) setSubmissions(list || [])
            } finally {
                if (mounted) setSubmissionsLoading(false)
            }
        }
        loadSubmissions()
        return () => { mounted = false }
    }, [campaignId, task?.source])

    const brandColor = useMemo(() => BRAND_COLORS[taskView?.brand?.name] || '#f59e0b', [taskView?.brand?.name])
    const deadlineText = taskView?.deadline ? daysLeft(taskView.deadline) : '—'
    const displaySubmissions = useMemo(() => {
        if (!showMineOnly) return submissions
        const me = String(profile?.id || '')
        return submissions.filter((entry) => {
            const uid = entry.user?._id || entry.user?.id
            return uid && String(uid) === me
        })
    }, [showMineOnly, submissions, profile?.id])

    const handleJoin = async () => {
        if (!campaignId || joined) return
        setIsJoining(true)
        setJoinError('')
        try {
            const res = await userCampaignService.join(campaignId)
            markCampaignJoined(campaignId)
            setJoined(true)
            setTaskView((prev) => prev ? { ...prev, joined: true, participants: res?.participants || prev.participants } : prev)
        } catch (error) {
            setJoinError(error?.message || 'Unable to join campaign')
        } finally {
            setIsJoining(false)
        }
    }

    const handleSubmit = async () => {
        if (!campaignId) return
        if (!joined) {
            setSubmitError('Join the campaign before submitting your entry.')
            return
        }
        if (!submissionFile) {
            setSubmitError('Please upload an image or video before submitting.')
            return
        }
        if (submissionMode === 'reel' && !submissionFile.type.startsWith('video/')) {
            setSubmitError('Reel submissions require a video file.')
            return
        }
        setIsSubmitting(true)
        setSubmitError('')
        try {
            await userCampaignService.submit(campaignId, { file: submissionFile, caption: submissionCaption })
            triggerCoinRain()
            setSubmitted(true)
            setSubmissionCaption('')
            setSubmissionFile(null)
            const list = await userCampaignService.listSubmissions(campaignId)
            setSubmissions(list || [])
            await loadPosts()
            window.dispatchEvent(new CustomEvent('reels-feed-refresh'))
        } catch (error) {
            setSubmitError(error?.message || 'Submission failed')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleVote = async (submissionId) => {
        if (!campaignId || !submissionId || voteBusy) return
        setVoteBusy(submissionId)
        try {
            const res = await userCampaignService.vote(campaignId, submissionId)
            const nextVotes = typeof res?.votes === 'number' ? res.votes : null
            setSubmissions((state) =>
                state.map((entry) =>
                    entry._id === submissionId || entry.id === submissionId
                        ? { ...entry, votes: nextVotes !== null ? nextVotes : (entry.votes || 0) + 1 }
                        : entry
                )
            )
        } finally {
            setVoteBusy(null)
        }
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

            {campaignLoading && (
                <p className="text-sm mb-3" style={{ color: 'var(--color-muted)' }}>Loading campaign...</p>
            )}
            {campaignError && (
                <p className="text-sm mb-3" style={{ color: 'var(--color-muted)' }}>{campaignError}</p>
            )}

            <div className="rounded-2xl overflow-hidden border" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
                {taskView?.backgroundImage ? (
                    <img src={taskView.backgroundImage} alt={taskView.title} className="w-full h-52 object-cover" />
                ) : (
                    <div
                        className="w-full h-52 p-5 flex items-end"
                        style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.22), rgba(249,115,22,0.12))' }}
                    >
                        <p className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>{taskView?.title}</p>
                    </div>
                )}

                <div className="p-4">
                    <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold" style={{ color: brandColor }}>{taskView?.brand?.name}</p>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(245,158,11,0.15)', color: 'var(--color-primary)' }}>
                            Campaign
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(16,185,129,0.12)', color: 'var(--color-success)' }}>
                            {taskView?.votingEnabled ? 'Voting On' : 'Voting Off'}
                        </span>
                    </div>
                    <h1 className="text-xl font-bold mt-2" style={{ color: 'var(--color-text)' }}>{taskView?.title}</h1>
                    <p className="text-sm mt-2 leading-relaxed" style={{ color: 'var(--color-sub)' }}>{taskView?.description}</p>

                    <div className="grid grid-cols-3 gap-2 mt-4">
                        <div className="rounded-lg p-2" style={{ background: 'var(--color-surface2)' }}>
                            <p className="text-[11px] flex items-center gap-1" style={{ color: 'var(--color-primary)' }}>
                                <Trophy size={12} /> Reward
                            </p>
                            <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                                {taskView?.rewardDetails ? taskView.rewardDetails : `₹${taskView?.myReward || 0}`}
                            </p>
                        </div>
                        <div className="rounded-lg p-2" style={{ background: 'var(--color-surface2)' }}>
                            <p className="text-[11px] flex items-center gap-1" style={{ color: 'var(--color-muted)' }}>
                                <Users size={12} /> Joined
                            </p>
                            <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{formatCount(taskView?.participants || 0)}</p>
                        </div>
                        <div className="rounded-lg p-2" style={{ background: 'var(--color-surface2)' }}>
                            <p className="text-[11px] flex items-center gap-1" style={{ color: 'var(--color-danger)' }}>
                                <Clock size={12} /> Time left
                            </p>
                            <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{deadlineText}</p>
                        </div>
                    </div>

                    <div className="mt-4">
                        <p className="text-xs font-semibold uppercase" style={{ color: 'var(--color-muted)' }}>What to do</p>
                        <div className="mt-2 space-y-2">
                            {(taskView?.steps || []).map((step) => (
                                <div key={step.id} className="rounded-lg p-3 flex items-center justify-between" style={{ background: 'var(--color-surface2)' }}>
                                    <p className="text-sm" style={{ color: 'var(--color-text)' }}>{step.label}</p>
                                    <span className="text-[11px]" style={{ color: 'var(--color-muted)' }}>
                                        {step.required ? 'Required' : 'Optional'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {taskView?.taskInstructions && (
                        <div className="mt-4 rounded-xl p-3 text-xs" style={{ background: 'var(--color-surface2)', color: 'var(--color-text)' }}>
                            <p className="text-[11px] font-semibold uppercase" style={{ color: 'var(--color-muted)' }}>Task Instructions</p>
                            <p className="mt-2 text-sm" style={{ color: 'var(--color-sub)' }}>{taskView.taskInstructions}</p>
                        </div>
                    )}

                    {isCampaign && (
                        <>
                            <div className="mt-4 flex flex-col gap-2">
                                <button
                                    onClick={handleJoin}
                                    disabled={isJoining || joined}
                                    className="w-full py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60"
                                    style={{ background: joined ? 'rgba(16,185,129,0.18)' : 'rgba(245,158,11,0.2)', color: joined ? 'var(--color-success)' : 'var(--color-primary)' }}
                                >
                                    {isJoining ? 'Joining...' : joined ? 'Joined' : 'Join Campaign'}
                                </button>
                                {joinError && (
                                    <p className="text-[11px]" style={{ color: 'var(--color-danger)' }}>{joinError}</p>
                                )}
                            </div>

                            <div className="mt-5">
                            <p className="text-xs font-semibold uppercase" style={{ color: 'var(--color-muted)' }}>Submit your entry</p>
                            <div className="mt-2 space-y-2">
                                <div className="flex items-center gap-2">
                                    {['post', 'reel'].map((mode) => (
                                        <button
                                            key={mode}
                                            type="button"
                                            onClick={() => setSubmissionMode(mode)}
                                            className="text-[11px] font-semibold px-3 py-1 rounded-full"
                                            style={{
                                                background: submissionMode === mode ? 'rgba(245,158,11,0.15)' : 'rgba(113,113,122,0.15)',
                                                color: submissionMode === mode ? 'var(--color-primary)' : 'var(--color-muted)',
                                            }}
                                        >
                                            {mode === 'post' ? 'Post' : 'Reel'}
                                        </button>
                                    ))}
                                </div>
                                <input
                                    type="file"
                                    accept="image/*,video/*"
                                    onChange={(event) => setSubmissionFile(event.target.files?.[0] || null)}
                                    className="w-full text-xs"
                                />
                                <p className="text-[11px]" style={{ color: 'var(--color-muted)' }}>
                                {submissionMode === 'reel' ? 'Upload a video reel for this campaign.' : 'Upload a selfie, bill, or video.'}
                                </p>
                                    <textarea
                                        value={submissionCaption}
                                        onChange={(event) => setSubmissionCaption(event.target.value)}
                                        placeholder="Add a caption or description"
                                        rows="3"
                                        className="w-full rounded-lg p-2 text-sm border"
                                        style={{ background: 'var(--color-surface2)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                                    />
                                    {submitError && (
                                        <p className="text-[11px]" style={{ color: 'var(--color-danger)' }}>{submitError}</p>
                                    )}
                                    {submitted && (
                                        <div className="rounded-xl p-3 flex items-start gap-2" style={{ background: 'rgba(16,185,129,0.14)', color: 'var(--color-success)' }}>
                                            <CheckCircle2 size={18} />
                                            <p className="text-sm">Submitted successfully. You are now in this campaign.</p>
                                        </div>
                                    )}
                                    <button
                                        onClick={handleSubmit}
                                        disabled={isSubmitting || !joined}
                                        className="w-full py-3 rounded-xl text-sm font-semibold disabled:opacity-60"
                                        style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary2))', color: '#fff' }}
                                    >
                                        {isSubmitting ? 'Submitting...' : joined ? 'Submit Task' : 'Join to Submit'}
                                    </button>
                                </div>
                            </div>

                            <div className="mt-6">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs font-semibold uppercase" style={{ color: 'var(--color-muted)' }}>Submission Gallery</p>
                                    <button
                                        type="button"
                                        onClick={() => setShowMineOnly((prev) => !prev)}
                                        className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                                        style={{
                                            background: showMineOnly ? 'rgba(16,185,129,0.15)' : 'rgba(113,113,122,0.15)',
                                            color: showMineOnly ? 'var(--color-success)' : 'var(--color-muted)',
                                        }}
                                    >
                                        {showMineOnly ? 'My submissions' : 'All submissions'}
                                    </button>
                                </div>
                                {submissionsLoading && (
                                    <p className="text-xs mt-2" style={{ color: 'var(--color-muted)' }}>Loading submissions...</p>
                                )}
                                {!submissionsLoading && displaySubmissions.length === 0 && (
                                    <p className="text-xs mt-2" style={{ color: 'var(--color-muted)' }}>No submissions yet.</p>
                                )}
                                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {displaySubmissions.map((entry) => (
                                        <div
                                            key={entry._id || entry.id}
                                            className="rounded-xl overflow-hidden"
                                            style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-border)' }}
                                        >
                                            {entry.media?.type === 'video' ? (
                                                <video src={entry.media?.url} controls className="w-full h-40 object-cover" />
                                            ) : (
                                                <img src={entry.media?.url} alt="submission" className="w-full h-40 object-cover" />
                                            )}
                                            <div className="p-3">
                                                <p className="text-xs font-semibold" style={{ color: 'var(--color-text)' }}>
                                                    {entry.user?.handle || entry.user?.name || 'Participant'}
                                                </p>
                                                {entry.caption && (
                                                    <p className="text-[11px] mt-1" style={{ color: 'var(--color-sub)' }}>{entry.caption}</p>
                                                )}
                                                <div className="mt-2 flex items-center justify-between">
                                                    <span className="text-[11px]" style={{ color: 'var(--color-muted)' }}>
                                                        {entry.votes || 0} votes
                                                    </span>
                                                    <button
                                                        onClick={() => handleVote(entry._id || entry.id)}
                                                        disabled={!taskView?.votingEnabled || voteBusy === (entry._id || entry.id)}
                                                        className="text-[11px] font-semibold px-2 py-1 rounded-full"
                                                        style={{
                                                            background: taskView?.votingEnabled ? 'rgba(245,158,11,0.14)' : 'rgba(113,113,122,0.15)',
                                                            color: taskView?.votingEnabled ? 'var(--color-primary)' : 'var(--color-muted)',
                                                        }}
                                                    >
                                                        {voteBusy === (entry._id || entry.id) ? 'Voting...' : 'Vote'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {taskView?.votingEnabled === false && (
                                    <p className="text-xs mt-2" style={{ color: 'var(--color-muted)' }}>Voting is disabled for this campaign.</p>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
