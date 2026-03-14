import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Trophy, Users, Clock, Upload, Vote } from 'lucide-react'
import { userCampaignService } from '../services/campaignService'
import { daysLeft, formatCount } from '../utils/formatCurrency'

export default function CampaignDetailPage() {
    const navigate = useNavigate()
    const { campaignId } = useParams()
    const [campaign, setCampaign] = useState(null)
    const [submissions, setSubmissions] = useState([])
    const [joined, setJoined] = useState(false)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [caption, setCaption] = useState('')
    const [file, setFile] = useState(null)
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        let mounted = true
        const load = async () => {
            setLoading(true)
            try {
                const data = await userCampaignService.getById(campaignId, true)
                const subs = await userCampaignService.listSubmissions(campaignId)
                if (!mounted) return
                setCampaign(data)
                setSubmissions(subs)
                setError('')
            } catch (err) {
                if (mounted) setError(err?.message || 'Failed to load campaign')
            } finally {
                if (mounted) setLoading(false)
            }
        }
        load()
        return () => { mounted = false }
    }, [campaignId])

    const handleJoin = async () => {
        try {
            await userCampaignService.join(campaignId)
            setJoined(true)
        } catch (_) {
            // ignore
        }
    }

    const handleSubmit = async () => {
        if (!file) return
        setSubmitting(true)
        try {
            await userCampaignService.submit(campaignId, { file, caption })
            const subs = await userCampaignService.listSubmissions(campaignId)
            setSubmissions(subs)
            setCaption('')
            setFile(null)
        } finally {
            setSubmitting(false)
        }
    }

    const handleVote = async (submissionId) => {
        try {
            const res = await userCampaignService.vote(campaignId, submissionId)
            if (res?.votes != null) {
                setSubmissions((prev) =>
                    prev.map((s) => (s._id === submissionId || s.id === submissionId ? { ...s, votes: res.votes } : s)),
                )
            }
        } catch (_) {
            // ignore
        }
    }

    if (loading) {
        return (
            <div className="px-4 pt-4 pb-8">
                <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Loading campaign...</p>
            </div>
        )
    }

    if (!campaign) {
        return (
            <div className="px-4 pt-4 pb-8">
                <p className="text-sm" style={{ color: 'var(--color-muted)' }}>{error || 'Campaign not found'}</p>
            </div>
        )
    }

    return (
        <div className="px-4 pt-4 pb-10">
            <button
                onClick={() => navigate('/campaigns')}
                className="mb-4 inline-flex items-center gap-2 text-sm font-semibold"
                style={{ color: 'var(--color-text)' }}
            >
                <ArrowLeft size={16} />
                Back to campaigns
            </button>

            <div className="rounded-2xl overflow-hidden border" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
                {campaign.bannerUrl ? (
                    <img src={campaign.bannerUrl} alt={campaign.title} className="w-full h-56 object-cover" />
                ) : (
                    <div className="w-full h-56" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.22), rgba(249,115,22,0.12))' }} />
                )}

                <div className="p-4">
                    <p className="text-xs font-semibold" style={{ color: 'var(--color-primary)' }}>{campaign.brandName}</p>
                    <h1 className="text-xl font-bold mt-1" style={{ color: 'var(--color-text)' }}>{campaign.title}</h1>
                    <p className="text-sm mt-2 leading-relaxed" style={{ color: 'var(--color-sub)' }}>{campaign.description}</p>

                    <div className="grid grid-cols-3 gap-2 mt-4">
                        <div className="rounded-lg p-2" style={{ background: 'var(--color-surface2)' }}>
                            <p className="text-[11px] flex items-center gap-1" style={{ color: 'var(--color-primary)' }}>
                                <Trophy size={12} /> Prize
                            </p>
                            <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{campaign.rewardDetails}</p>
                        </div>
                        <div className="rounded-lg p-2" style={{ background: 'var(--color-surface2)' }}>
                            <p className="text-[11px] flex items-center gap-1" style={{ color: 'var(--color-muted)' }}>
                                <Users size={12} /> Joined
                            </p>
                            <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{formatCount(campaign.participants || 0)}</p>
                        </div>
                        <div className="rounded-lg p-2" style={{ background: 'var(--color-surface2)' }}>
                            <p className="text-[11px] flex items-center gap-1" style={{ color: 'var(--color-danger)' }}>
                                <Clock size={12} /> Time left
                            </p>
                            <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{daysLeft(campaign.endDate)}</p>
                        </div>
                    </div>

                    <div className="mt-4">
                        <p className="text-xs font-semibold uppercase" style={{ color: 'var(--color-muted)' }}>Task Instructions</p>
                        <p className="text-sm mt-2" style={{ color: 'var(--color-sub)' }}>{campaign.taskInstructions}</p>
                        {campaign.tasks?.length ? (
                            <div className="mt-3 space-y-2">
                                {campaign.tasks.map((task) => (
                                    <div key={task.id || task.name} className="rounded-lg p-3" style={{ background: 'var(--color-surface2)' }}>
                                        <p className="text-sm" style={{ color: 'var(--color-text)' }}>{task.name || 'Task'}</p>
                                        <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>{task.instructions || task.description}</p>
                                    </div>
                                ))}
                            </div>
                        ) : null}
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
                        <span>Participation: {campaign.participationType}</span>
                        <span>Winners: {campaign.numberOfWinners}</span>
                        <span>Voting: {campaign.votingEnabled ? 'Enabled' : 'Disabled'}</span>
                    </div>

                    <div className="mt-4">
                    <button
                        onClick={handleJoin}
                        disabled={joined || campaign.status !== 'Active'}
                        className="w-full py-3 rounded-xl text-sm font-semibold disabled:opacity-60"
                        style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary2))', color: '#fff' }}
                    >
                        {campaign.status !== 'Active' ? 'Campaign Closed' : (joined ? 'Joined' : 'Join Campaign')}
                    </button>
                </div>
            </div>
            </div>

            <div className="mt-6 rounded-2xl p-4" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Submit Your Entry</p>
                <div className="mt-3 space-y-3">
                    <input
                        type="file"
                        accept="image/*,video/*"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                        className="w-full text-xs"
                    />
                    <textarea
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        placeholder="Add a caption or description"
                        rows="3"
                        className="w-full bg-bg border border-surface rounded-xl p-3 text-xs font-medium text-text placeholder-muted/50 focus:ring-1 focus:ring-primary/30 outline-none resize-none"
                    />
                    <button
                        onClick={handleSubmit}
                        disabled={!file || submitting || campaign.status !== 'Active' || !joined}
                        className="w-full py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
                        style={{ background: 'var(--color-primary)', color: '#111' }}
                    >
                        <Upload size={14} />
                        {campaign.status !== 'Active'
                            ? 'Submissions Closed'
                            : !joined
                                ? 'Join to Submit'
                                : (submitting ? 'Submitting...' : 'Submit Entry')}
                    </button>
                </div>
            </div>

            <div className="mt-6">
                <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Submission Gallery</p>
                {submissions.length === 0 ? (
                    <p className="mt-2 text-[11px]" style={{ color: 'var(--color-muted)' }}>No submissions yet.</p>
                ) : (
                    <div className="mt-3 grid grid-cols-2 gap-3">
                        {submissions.map((entry) => (
                            <div key={entry._id || entry.id} className="rounded-2xl overflow-hidden" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                                {entry.media?.url ? (
                                    entry.media.type === 'video' ? (
                                        <video src={entry.media.url} controls className="w-full aspect-square object-cover" />
                                    ) : (
                                        <img src={entry.media.url} alt={entry.caption} className="w-full aspect-square object-cover" />
                                    )
                                ) : null}
                                <div className="p-2.5 space-y-2">
                                    <p className="text-[11px]" style={{ color: 'var(--color-text)' }}>{entry.caption || 'Submission'}</p>
                                    <div className="flex items-center justify-between text-[11px]">
                                        <span style={{ color: 'var(--color-muted)' }}>{entry.votes || 0} votes</span>
                                        {campaign.votingEnabled && (
                                            <button
                                                onClick={() => handleVote(entry._id || entry.id)}
                                                className="px-2 py-1 rounded-full text-[10px] font-semibold flex items-center gap-1"
                                                style={{ background: 'rgba(245,158,11,0.14)', color: 'var(--color-primary)' }}
                                            >
                                                <Vote size={12} />
                                                Vote
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
