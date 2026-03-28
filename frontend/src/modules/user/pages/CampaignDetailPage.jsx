import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Trophy, Users, Clock, Upload, Vote, X } from 'lucide-react'
import { userCampaignService } from '../services/campaignService'
import { useModalStore } from '../store/useModalStore'
import { daysLeft, formatCount } from '../utils/formatCurrency'

export default function CampaignDetailPage() {
    const navigate = useNavigate()
    const { campaignId } = useParams()
    const { showAlert } = useModalStore()
    const [campaign, setCampaign] = useState(null)
    const [submissions, setSubmissions] = useState([])
    const [joined, setJoined] = useState(false)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    
    // Submission Wizard State
    const [submitStep, setSubmitStep] = useState(1); // 1: Proof, 2: Reel
    const [files, setFiles] = useState({ bill: null, product: null, selfie: null, reel: null });
    const [previews, setPreviews] = useState({ bill: null, product: null, selfie: null, reel: null });
    const [caption, setCaption] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [submitSuccess, setSubmitSuccess] = useState(false)

    // Revoke object URLs on unmount
    useEffect(() => {
        return () => {
            Object.values(previews).forEach(url => {
                if (url) URL.revokeObjectURL(url);
            });
        };
    }, [previews]);

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
                // Check if user is already a participant
                const userRaw = localStorage.getItem('crypto_auth_user');
                if (userRaw) {
                    const user = JSON.parse(userRaw);
                    if (data.participants?.includes(user.id)) setJoined(true);
                }
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

    const handleFileChange = (field, e) => {
        const file = e.target.files?.[0];
        if (file) {
            // Revoke old preview if exists
            if (previews[field]) URL.revokeObjectURL(previews[field]);
            
            const url = URL.createObjectURL(file);
            setFiles(prev => ({ ...prev, [field]: file }));
            setPreviews(prev => ({ ...prev, [field]: url }));
        }
    };

    const removeFile = (field) => {
        if (previews[field]) URL.revokeObjectURL(previews[field]);
        setFiles(prev => ({ ...prev, [field]: null }));
        setPreviews(prev => ({ ...prev, [field]: null }));
    };

    const handleSubmit = async () => {
        if (!files.bill || !files.product || !files.selfie || !files.reel) {
            showAlert("Action Required", "Please upload all mandatory media (Bill, Product, Selfie, and Reel) to enter this campaign.", "warning");
            return;
        }
        setSubmitting(true)
        try {
            const formData = new FormData();
            formData.append('bill', files.bill);
            formData.append('product', files.product);
            formData.append('selfie', files.selfie);
            formData.append('reel', files.reel);
            formData.append('caption', caption);

            await userCampaignService.submit(campaignId, formData);
            const subs = await userCampaignService.listSubmissions(campaignId)
            setSubmissions(subs)
            setSubmitSuccess(true)
            setSubmitStep(1)
            setFiles({ bill: null, product: null, selfie: null, reel: null })
            setPreviews({ bill: null, product: null, selfie: null, reel: null })
            setCaption('')
            showAlert("Success!", "Your campaign entry has been submitted and is now live in the gallery.", "success");
        } catch (err) {
            showAlert("Submission Failed", err.message || "Failed to submit entry. Please check your connection and try again.", "error");
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
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-[11px] font-bold uppercase tracking-widest text-muted">Synchronizing with node...</p>
                </div>
            </div>
        )
    }

    const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5002/api";
    const BACKEND_URL = API_BASE.replace(/\/api\/?$/, '');
    const bannerUrlRaw = String(campaign.bannerUrl || '').trim();
    const resolvedBannerUrl = bannerUrlRaw ? (
        /^https?:\/\//i.test(bannerUrlRaw) || /^data:/i.test(bannerUrlRaw)
            ? bannerUrlRaw 
            : `${BACKEND_URL}${bannerUrlRaw.startsWith('/') ? '' : '/'}${bannerUrlRaw}`
    ) : null;

    return (
        <div className="px-4 pt-6 pb-20 max-w-2xl mx-auto">
            <button
                onClick={() => navigate('/campaigns')}
                className="mb-6 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-muted hover:text-text transition-all"
            >
                <ArrowLeft size={14} />
                Back to campaigns
            </button>

            {/* Campaign Header Card */}
            <div className="rounded-3xl overflow-hidden border border-surface bg-surface shadow-2xl">
                <div className="relative aspect-video overflow-hidden bg-bg/50">
                    {resolvedBannerUrl ? (
                        campaign.bannerType === 'video' ? (
                            <video 
                                src={resolvedBannerUrl} 
                                className="w-full h-full object-cover" 
                                muted playsInline loop autoPlay
                                crossOrigin="anonymous"
                            />
                        ) : (
                            <img src={resolvedBannerUrl} alt={campaign.title} className="w-full h-full object-cover" crossOrigin="anonymous" />
                        )
                    ) : (
                        <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}>
                            <Trophy size={48} className="text-white/20" />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary mb-1">{campaign.brandName}</p>
                        <h1 className="text-2xl font-black text-white leading-tight">{campaign.title}</h1>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    <p className="text-xs leading-relaxed opacity-70">{campaign.description}</p>

                    <div className="grid grid-cols-3 gap-3">
                        <div className="rounded-2xl p-3 bg-bg/50 border border-surface">
                            <p className="text-[9px] font-bold uppercase tracking-wider text-primary mb-1">Prize pool</p>
                            <p className="text-sm font-black text-text">{campaign.rewardDetails}</p>
                        </div>
                        <div className="rounded-2xl p-3 bg-bg/50 border border-surface">
                            <p className="text-[9px] font-bold uppercase tracking-wider text-muted mb-1">Participants</p>
                            <p className="text-sm font-black text-text">{formatCount(campaign.participants || 0)}</p>
                        </div>
                        <div className="rounded-2xl p-3 bg-bg/50 border border-surface">
                            <p className="text-[9px] font-bold uppercase tracking-wider text-rose-500 mb-1">Ending in</p>
                            <p className="text-sm font-black text-text">{daysLeft(campaign.endDate)}</p>
                        </div>
                    </div>

                    {!joined ? (
                        <button
                            onClick={handleJoin}
                            disabled={campaign.status !== 'Active'}
                            className="w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-lg transition-all active:scale-95 disabled:opacity-50"
                            style={{ background: 'var(--color-primary)', color: '#000' }}
                        >
                            {campaign.status !== 'Active' ? 'Campaign Ended' : 'Join Campaign'}
                        </button>
                    ) : (
                        <div className="flex items-center gap-2 justify-center py-2 px-4 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500">You have joined this campaign</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Submission Section */}
            {joined && !submitSuccess && (
                <div className="mt-8 rounded-3xl p-6 border border-surface bg-surface shadow-2xl space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-black uppercase tracking-[0.2em]">Submit Your Entry</h2>
                        <div className="flex items-center gap-1">
                            <div className={`w-2 h-2 rounded-full transition-all ${submitStep === 1 ? 'bg-primary scale-125' : 'bg-surface2'}`} />
                            <div className={`w-2 h-2 rounded-full transition-all ${submitStep === 2 ? 'bg-primary scale-125' : 'bg-surface2'}`} />
                        </div>
                    </div>

                    {submitStep === 1 ? (
                        <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted">Step 1: Verification Proofs</p>
                            
                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-bold uppercase tracking-widest text-muted block ml-1">Original Bill/Invoice</label>
                                    <div className="relative group">
                                        {!previews.bill ? (
                                            <>
                                                <input type="file" accept="image/*" onChange={(e) => handleFileChange('bill', e)} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                                                <div className="p-4 rounded-2xl border-2 border-dashed border-surface2 bg-bg/30 hover:border-primary/50 transition-all flex items-center gap-3">
                                                    <div className="p-2 rounded-lg bg-surface2 text-muted">
                                                        <Upload size={14} />
                                                    </div>
                                                    <span className="text-[10px] font-bold uppercase tracking-wider">Choose Bill Image</span>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="relative aspect-video rounded-2xl overflow-hidden border border-emerald-500/30">
                                                <img src={previews.bill} className="w-full h-full object-cover" alt="Bill Preview" />
                                                <button 
                                                    onClick={() => removeFile('bill')}
                                                    className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full hover:bg-rose-500 transition-all"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[9px] font-bold uppercase tracking-widest text-muted block ml-1">Product in Hand</label>
                                    <div className="relative group">
                                        {!previews.product ? (
                                            <>
                                                <input type="file" accept="image/*" onChange={(e) => handleFileChange('product', e)} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                                                <div className="p-4 rounded-2xl border-2 border-dashed border-surface2 bg-bg/30 hover:border-primary/50 transition-all flex items-center gap-3">
                                                    <div className="p-2 rounded-lg bg-surface2 text-muted">
                                                        <Upload size={14} />
                                                    </div>
                                                    <span className="text-[10px] font-bold uppercase tracking-wider">Choose Product Image</span>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="relative aspect-video rounded-2xl overflow-hidden border border-emerald-500/30">
                                                <img src={previews.product} className="w-full h-full object-cover" alt="Product Preview" />
                                                <button 
                                                    onClick={() => removeFile('product')}
                                                    className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full hover:bg-rose-500 transition-all"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[9px] font-bold uppercase tracking-widest text-muted block ml-1">Selfie with Product</label>
                                    <div className="relative group">
                                        {!previews.selfie ? (
                                            <>
                                                <input type="file" accept="image/*" onChange={(e) => handleFileChange('selfie', e)} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                                                <div className="p-4 rounded-2xl border-2 border-dashed border-surface2 bg-bg/30 hover:border-primary/50 transition-all flex items-center gap-3">
                                                    <div className="p-2 rounded-lg bg-surface2 text-muted">
                                                        <Upload size={14} />
                                                    </div>
                                                    <span className="text-[10px] font-bold uppercase tracking-wider">Choose Selfie</span>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="relative aspect-video rounded-2xl overflow-hidden border border-emerald-500/30">
                                                <img src={previews.selfie} className="w-full h-full object-cover" alt="Selfie Preview" />
                                                <button 
                                                    onClick={() => removeFile('selfie')}
                                                    className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full hover:bg-rose-500 transition-all"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => setSubmitStep(2)}
                                disabled={!files.bill || !files.product || !files.selfie}
                                className="w-full py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] bg-surface2 text-text disabled:opacity-30 transition-all hover:bg-primary hover:text-black"
                            >
                                Continue to Creative
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted">Step 2: Submit Your Reel</p>
                            
                            <div className="space-y-2">
                                <label className="text-[9px] font-bold uppercase tracking-widest text-muted block ml-1">Video Reel (Mandatory)</label>
                                <div className="relative group">
                                    {!previews.reel ? (
                                        <>
                                            <input type="file" accept="video/*" onChange={(e) => handleFileChange('reel', e)} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                                            <div className="p-8 rounded-2xl border-2 border-dashed border-surface2 bg-bg/30 hover:border-primary/50 transition-all flex flex-col items-center justify-center gap-3">
                                                <div className="p-3 rounded-xl bg-primary/10 text-primary">
                                                    <Upload />
                                                </div>
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-center max-w-[200px]">Upload Reel Video</span>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="relative aspect-[9/16] max-h-[300px] mx-auto rounded-2xl overflow-hidden border border-emerald-500/30 bg-black">
                                            <video src={previews.reel} className="w-full h-full object-contain" autoPlay muted loop />
                                            <button 
                                                onClick={() => removeFile('reel')}
                                                className="absolute top-4 right-4 p-2 bg-black/60 text-white rounded-full hover:bg-rose-500 transition-all z-20"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[9px] font-bold uppercase tracking-widest text-muted block ml-1">Caption</label>
                                <textarea
                                    value={caption}
                                    onChange={(e) => setCaption(e.target.value)}
                                    placeholder="Tell us about your experience..."
                                    rows="3"
                                    className="w-full bg-bg border border-surface2 rounded-2xl p-4 text-[11px] font-medium text-text placeholder:text-muted/30 focus:border-primary/50 outline-none resize-none transition-all"
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setSubmitStep(1)}
                                    className="flex-1 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border border-surface2 text-muted hover:text-text transition-all"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={!files.reel || submitting}
                                    className="flex-[2] py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                                    style={{ background: 'var(--color-primary)', color: '#000' }}
                                >
                                    {submitting ? (
                                        <>
                                            <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                            Synchronizing Proofs...
                                        </>
                                    ) : 'Finalize Entry'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {submitSuccess && (
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mt-8 p-8 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                    <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                        <Trophy size={32} />
                    </div>
                    <h3 className="text-lg font-black uppercase tracking-wider text-emerald-500">Submission Successful!</h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted mt-2">Your entry is now live in the Reels feed for voting.</p>
                    <button onClick={() => setSubmitSuccess(false)} className="mt-6 text-[10px] font-black uppercase tracking-widest text-primary hover:underline">Submit another entry</button>
                </motion.div>
            )}

            {/* Gallery Section */}
            <div className="mt-12 space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-black uppercase tracking-[0.2em]">Participants Gallery</h2>
                    <span className="text-[10px] font-bold text-muted">{submissions.length} Entries</span>
                </div>

                {submissions.length === 0 ? (
                    <div className="text-center py-12 bg-surface/30 rounded-3xl border border-dashed border-surface">
                        <Users size={32} className="mx-auto text-muted/30 mb-3" />
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted">No one has submitted yet.<br/>Be the first to join!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4">
                        {submissions.map((entry) => (
                            <div key={entry._id || entry.id} className="relative group rounded-3xl overflow-hidden bg-surface border border-surface shadow-lg hover:border-primary/30 transition-all">
                                <div className="relative aspect-[3/4] overflow-hidden bg-black">
                                    {entry.reel?.url ? (
                                        <video src={entry.reel.url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all" muted playsInline loop />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                                            <Upload className="text-muted/20" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
                                    
                                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full border border-white/20 bg-zinc-800 overflow-hidden">
                                                <img src={entry.user?.avatar} alt="" className="w-full h-full object-cover" />
                                            </div>
                                            <span className="text-[9px] font-bold text-white uppercase truncate max-w-[60px]">{entry.user?.name}</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-[9px] font-black text-primary">
                                            <Vote size={10} />
                                            {formatCount(entry.votes || 0)}
                                        </div>
                                    </div>
                                </div>
                                <div className="p-3">
                                    <p className="text-[10px] leading-tight text-white/70 line-clamp-1">{entry.caption || 'Campaign entry'}</p>
                                    <button
                                        onClick={() => handleVote(entry._id || entry.id)}
                                        className="mt-2 w-full py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all active:scale-95"
                                        style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--color-primary)' }}
                                    >
                                        <Vote size={10} /> Vote Entry
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
