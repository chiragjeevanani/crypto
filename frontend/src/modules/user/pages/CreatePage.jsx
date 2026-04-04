import { useEffect, useState, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { Upload, Image, FileText, Video, ToggleLeft, ToggleRight, ChevronLeft, ArrowRight, Eye, Music, Check, Search, ChevronRight, X, Play, Pause } from 'lucide-react'
import { useUserStore } from '../store/useUserStore'
import { useFeedStore } from '../store/useFeedStore'
import { postService } from '../services/postService'
import { businessService } from '../services/businessService'
import { getSelectablePostCategories } from '../../../shared/postCategories'
import { addUserNFTListing } from '../../../shared/nftListings'
import MusicSelectionModal from '../components/feed/MusicSelectionModal'
import { musicService } from '../services/musicService'
import { useWalletStore } from '../store/useWalletStore'
import { loadRazorpayScript } from '../../../utils/razorpayLoader'
import { useAdminStore } from '../../admin/store/useAdminStore'

const STEPS = [
    { id: 1, label: 'Upload Media', icon: Image },
    { id: 2, label: 'Edit', icon: Image },
    { id: 3, label: 'Caption', icon: FileText },
    { id: 4, label: 'NFT & Price', icon: ToggleLeft },
    { id: 5, label: 'Category', icon: Eye },
    { id: 6, label: 'Preview', icon: Eye },
]

const FILTERS = [
    { name: 'Normal', value: 'none' },
    { name: 'Clarendon', value: 'contrast(1.2) saturate(1.35)' },
    { name: 'Gingham', value: 'brightness(1.05) hue-rotate(-10deg)' },
    { name: 'Moon', value: 'grayscale(1) contrast(1.1) brightness(1.1)' },
    { name: 'Lark', value: 'contrast(0.9)' },
    { name: 'Reyes', value: 'sepia(0.22) brightness(1.1) contrast(0.85) saturate(0.75)' },
    { name: 'Juno', value: 'saturate(1.3)' },
    { name: 'Slumber', value: 'saturate(0.66) hue-rotate(350deg)' },
    { name: 'Crema', value: 'sepia(0.5) contrast(1.25)' },
]



export default function CreatePage() {
    const navigate = useNavigate()
    const [step, setStep] = useState(1)
    const [isNFT, setIsNFT] = useState(false)
    const { profile, kyc } = useUserStore()
    const { categories, loadCategories } = useAdminStore()
    const [selectedCategory, setSelectedCategory] = useState('General')
    const [mediaPreview, setMediaPreview] = useState(null)
    const [mediaFile, setMediaFile] = useState(null)
    const [mediaType, setMediaType] = useState('image')
    const [activeFilter, setActiveFilter] = useState('none')
    const [selectedMusic, setSelectedMusic] = useState(null)
    const [musicStartTime, setMusicStartTime] = useState(0)
    const [isMusicModalOpen, setIsMusicModalOpen] = useState(false)
    const [published, setPublished] = useState(false)
    const [publishError, setPublishError] = useState('')
    const [publishing, setPublishing] = useState(false)
    const [isPlayingMusic, setIsPlayingMusic] = useState(false)
    const previewMusicRef = useRef(null)

    // Business states
    const [isBusiness, setIsBusiness] = useState(false)
    const [ctaType, setCtaType] = useState('Shop Now')
    const [redirectType, setRedirectType] = useState('whatsapp')
    const [whatsappNumber, setWhatsappNumber] = useState('')
    const [externalLink, setExternalLink] = useState('')

    // Promotion advanced states
    const [promoSettings, setPromoSettings] = useState({
        minDailyBudget: 99,
        maxDailyBudget: 100000,
        minDuration: 1,
        maxDuration: 30,
        minImpressionFactor: 14,
        maxImpressionFactor: 29
    })
    const [dailyBudget, setDailyBudget] = useState(99)
    const [durationSelection, setDurationSelection] = useState('set') // 'set' or 'pause'
    const [durationDays, setDurationDays] = useState(10)

    useEffect(() => {
        businessService.getSettings().then(setPromoSettings).catch(console.error)
        
        // Pre-load Razorpay script to save time during checkout
        loadRazorpayScript().then(success => {
            if (!success) console.warn('Failed to pre-load Razorpay script')
        })
    }, [])

    const totalBudget = durationSelection === 'set' ? dailyBudget * durationDays : dailyBudget;
    const estimatedMin = Math.round(dailyBudget * promoSettings.minImpressionFactor);
    const estimatedMax = Math.round(dailyBudget * promoSettings.maxImpressionFactor);
    const estimatedLabel = `${(estimatedMin / 1000).toFixed(1)}K - ${(estimatedMax / 1000).toFixed(1)}K`;

    const STEPS = [
        { id: 1, label: 'Upload Media', icon: Image },
        { id: 2, label: 'Edit', icon: Image },
        { id: 3, label: 'Caption', icon: FileText },
        { id: 4, label: 'Promotion', icon: ToggleRight },
        { id: 5, label: 'NFT & Price', icon: ToggleLeft },
        { id: 6, label: 'Category', icon: Eye },
        { id: 7, label: 'Preview', icon: Eye },
    ]

    const { register, watch, handleSubmit } = useForm({ defaultValues: { caption: '', price: '' } })
    const addPost = useFeedStore((s) => s.addPost)
    const caption = watch('caption', '')
    const nftPriceINR = Number(watch('price', 0) || 0)
    const nftPriceUSD = nftPriceINR / 83
    const nftPriceValid = nftPriceUSD >= 1 && nftPriceUSD <= 20

    useEffect(() => {
        loadCategories()
    }, [loadCategories])

    const categoryOptions = useMemo(() => {
        const type = mediaType === 'video' ? 'reel' : 'post'
        const filtered = categories.filter(c => c.type === 'all' || c.type === type)
        const names = filtered.map(c => c.name)
        if (!names.includes('General')) names.push('General')
        return names
    }, [categories, mediaType])

    useEffect(() => {
        if (!categoryOptions.includes(selectedCategory)) {
            setSelectedCategory(categoryOptions[0] || 'General')
        }
    }, [categoryOptions, selectedCategory])

    useEffect(() => {
        // Cleanup function for blob object URLs
        return () => {
            if (mediaPreview && mediaPreview.startsWith('blob:')) {
                URL.revokeObjectURL(mediaPreview)
            }
        }
    }, [mediaPreview])

    useEffect(() => {
        if (selectedMusic && previewMusicRef.current) {
            const audio = previewMusicRef.current;
            // Play in Step 2 (Selection/Edit) AND Step 7 (Final Preview)
            if (step === 2 || step === 7) {
                if (audio.src !== selectedMusic.audioUrl) {
                    audio.src = selectedMusic.audioUrl;
                }
                audio.currentTime = musicStartTime;
                audio.play().catch(() => {});
                setIsPlayingMusic(true);
            } else {
                audio.pause();
                setIsPlayingMusic(false);
            }
        } else if (previewMusicRef.current) {
            previewMusicRef.current.pause();
            setIsPlayingMusic(false);
        }
    }, [step, selectedMusic, musicStartTime])

    const handleMediaChange = (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        
        // Revoke previous URL if any
        if (mediaPreview && mediaPreview.startsWith('blob:')) {
            URL.revokeObjectURL(mediaPreview)
        }
        
        setMediaFile(file)
        setMediaPreview(URL.createObjectURL(file))
        if (file.type.startsWith('video/')) setMediaType('video')
        else if (file.type.startsWith('audio/')) setMediaType('audio')
        else setMediaType('image')
    }

    const handlePublish = async () => {
        if (publishing) return // Prevent duplicate clicks
        setPublishing(true)
        setPublishError('') // Reset error
        try {
            const formData = new FormData()
            formData.append('media', mediaFile)
            formData.append('caption', caption?.trim() || '')
            formData.append('category', selectedCategory || 'General')
            formData.append('filter', activeFilter || 'none')
            formData.append('musicId', selectedMusic?.id || '')
            formData.append('musicStartTime', String(musicStartTime))
            formData.append('isNFT', isNFT ? 'true' : 'false')
            formData.append('nftPriceINR', String(isNFT ? nftPriceINR : 0))
            formData.append('aspectRatio', '4/3')
            
            // Add business fields
            formData.append('isBusiness', isBusiness ? 'true' : 'false')
            if (isBusiness) {
                formData.append('ctaType', ctaType)
                formData.append('redirectType', redirectType)
                formData.append('whatsappNumber', whatsappNumber)
                formData.append('externalLink', externalLink)
                
                // Promotion details
                formData.append('promoEnabled', 'true')
                formData.append('dailyBudget', String(dailyBudget))
                formData.append('duration', durationSelection === 'set' ? String(durationDays) : '0')
                formData.append('totalBudget', String(totalBudget))
                formData.append('estimatedImpressions', estimatedLabel)
            }

            setPublishing('Optimizing & Uploading Content...')
            const res = await postService.createPost(formData)
            const newPost = res?.post
            
            setPublishing('Preparing Payment Bridge...')
            // Refresh wallet balance to show the post reward (10 coins) immediately
            const loadWallet = useWalletStore.getState().loadWallet;
            if (loadWallet) loadWallet();
            
            // If business, proceed to real Razorpay payment
            if (isBusiness && newPost?.id) {
                try {
                    const initRes = await businessService.initiatePayment(newPost.id)
                    const { amount, orderId, currency } = initRes.data || {}

                    setPublishing('Opening Secure Checkout...')
                    const isLoaded = await loadRazorpayScript();
                    if (orderId && isLoaded && typeof window.Razorpay !== 'undefined') {
                        const options = {
                            key: 'rzp_test_S2tOuYBZiOuLb4', 
                            amount: amount * 100, // Smallest unit
                            currency: currency || "INR",
                            name: "SocialEarn Promotion",
                            description: `Promotion for Reel #${newPost.id.slice(-6)}`,
                            order_id: orderId,
                            handler: async function (response) {
                                // Payment Successful
                                try {
                                    const verifyRes = await businessService.verifyPayment({
                                        postId: newPost.id,
                                        paymentId: response.razorpay_payment_id,
                                        orderId: response.razorpay_order_id,
                                        signature: response.razorpay_signature
                                    });

                                    if (verifyRes.success) {
                                        // The post is now paid but pending admin approval
                                        // We can show a success message or redirect
                                        setPublished(true)
                                    }
                                } catch (err) {
                                    setPublishError('Payment verification failed. Please contact support.')
                                } finally {
                                    setPublishing(false)
                                }
                            },
                            prefill: {
                                name: profile?.name || "",
                                email: profile?.email || "",
                                contact: profile?.phone || ""
                            },
                            theme: { color: "#e11d48" }, // Red theme to match app
                            modal: {
                                ondismiss: function() {
                                    setPublishing(false)
                                    setPublishError('Payment cancelled. Your reel remains as a draft.')
                                }
                            }
                        };
                        const rzp = new window.Razorpay(options);
                        rzp.open();
                    } else {
                        throw new Error('Razorpay script not loaded or invalid order.')
                    }
                } catch (payErr) {
                    console.error("Payment failed:", payErr);
                    setPublishError(payErr.message || "Payment initiation failed.");
                    setPublishing(false);
                }
                return; // Early return as payment handles the transition
            } else if (newPost) {
                addPost(newPost)
            }

            setPublished(true)
            setTimeout(() => {
                setPublished(false)
                setStep(1)
                setMediaPreview(null)
                setMediaFile(null)
                setActiveFilter('none')
                setSelectedMusic(null)
                setMusicStartTime(0)
                setIsNFT(false)
                setIsBusiness(false) // Reset business state
                navigate('/home')
            }, 1500)
        } catch (err) {
            setPublishError(err?.message || 'Failed to publish post')
        } finally {
            setPublishing(false)
        }
    }

    useEffect(() => {
        if (published) {
            const timer = setTimeout(() => {
                navigate('/home')
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [published, navigate]);

    if (published) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-5 px-8 text-center py-20 bg-[var(--color-bg)]">
                <motion.div
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1.1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                    className="w-24 h-24 rounded-full flex items-center justify-center text-5xl relative"
                    style={{ background: 'var(--color-surface)' }}
                >
                    <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ background: 'var(--color-primary)' }}></div>
                    {isBusiness || isNFT ? '📑' : '🚀'}
                </motion.div>
                
                <div className="space-y-2">
                    <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                        {isBusiness || isNFT ? 'Submission Received!' : 'Post Published!'}
                    </h2>
                    <p className="text-sm max-w-[280px] mx-auto opacity-70" style={{ color: 'var(--color-text)' }}>
                        {isBusiness
                            ? 'Your promotion has been submitted and is pending admin moderation. It will go live once approved.'
                            : isNFT 
                                ? 'Your NFT listing has been submitted for verification. You will be notified once it is approved.'
                                : 'Your content is live and earning rewards. Check your feed to see the engagement!'}
                    </p>
                </div>

                <div className="w-full max-w-[200px] space-y-3 pt-6">
                    <button 
                        onClick={() => navigate('/home')}
                        className="w-full py-3.5 rounded-2xl font-bold text-sm shadow-lg shadow-primary/20 transition-all active:scale-95"
                        style={{ background: 'var(--color-primary)', color: '#fff' }}
                    >
                        Go to Home
                    </button>
                    <p className="text-[10px] uppercase tracking-widest opacity-40 font-bold">
                        Redirecting in 5 seconds...
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="px-4 pt-4 pb-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
                <div className="flex items-center justify-between mb-3">
                    <h1 className="text-base font-bold" style={{ color: 'var(--color-text)' }}>Create Post</h1>
                    <span className="text-xs font-medium" style={{ color: 'var(--color-muted)' }}>
                        Step {step} of {STEPS.length}
                    </span>
                </div>
                {/* Step progress bar */}
                <div className="flex gap-1.5">
                    {STEPS.map((s) => (
                        <div
                            key={s.id}
                            className="flex-1 h-1 rounded-full transition-all duration-300"
                            style={{ background: s.id <= step ? 'var(--color-primary)' : 'var(--color-surface2)' }}
                        />
                    ))}
                </div>
            </div>

            {/* Step content */}
            <div className="flex-1 overflow-y-auto px-4 py-5">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                    >
                        {/* Step 1: Upload Media */}
                        {step === 1 && (
                            <div>
                                <p className="text-base font-bold mb-4" style={{ color: 'var(--color-text)' }}>Upload Media</p>
                                <label className="cursor-pointer block">
                                    <div
                                        className="w-full rounded-2xl flex flex-col items-center justify-center gap-3 border-2 border-dashed"
                                        style={{
                                            aspectRatio: '4/3',
                                            background: mediaPreview ? 'transparent' : 'var(--color-surface)',
                                            borderColor: 'var(--color-border)',
                                            overflow: 'hidden',
                                        }}
                                    >
                                        {mediaPreview ? (
                                            mediaType === 'video' ? (
                                                <video src={mediaPreview} className="w-full h-full object-cover" controls muted />
                                            ) : mediaType === 'audio' ? (
                                                <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-4" style={{ background: 'var(--color-surface2)' }}>
                                                    <Music size={40} style={{ color: 'var(--color-primary)' }} />
                                                    <audio src={mediaPreview} controls className="w-full max-w-xs" />
                                                </div>
                                            ) : (
                                                <img src={mediaPreview} alt="preview" className="w-full h-full object-cover" />
                                            )
                                        ) : (
                                            <>
                                                <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                                                    style={{ background: 'var(--color-surface2)' }}>
                                                    <Upload size={24} style={{ color: 'var(--color-primary)' }} />
                                                </div>
                                                <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                                                    Tap to upload
                                                </p>
                                                <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                                                    Image, Video or Audio
                                                </p>
                                            </>
                                        )}
                                    </div>
                                    <input type="file" accept="image/*,video/*,audio/*" className="hidden" onChange={handleMediaChange} />
                                </label>
                            </div>
                        )}

                        {/* Step 2: Edit Media */}
                        {step === 2 && (
                            <div>
                                <p className="text-base font-bold mb-4" style={{ color: 'var(--color-text)' }}>Edit Media</p>
                                {mediaPreview && (
                                    <div className="w-full rounded-2xl overflow-hidden mb-6 border border-surface" style={{ aspectRatio: mediaType === 'audio' ? 'auto' : '4/3' }}>
                                        {mediaType === 'video' ? (
                                            <video src={mediaPreview} className="w-full h-full object-cover" style={{ filter: activeFilter }} controls muted />
                                        ) : mediaType === 'audio' ? (
                                            <div className="p-4 flex flex-col items-center gap-2" style={{ background: 'var(--color-surface2)' }}>
                                                <Music size={32} style={{ color: 'var(--color-primary)' }} />
                                                <audio src={mediaPreview} controls className="w-full" />
                                            </div>
                                        ) : (
                                            <img src={mediaPreview} alt="preview" className="w-full h-full object-cover" style={{ filter: activeFilter }} />
                                        )}
                                    </div>
                                )}
                                {(mediaType === 'image' || mediaType === 'video') && (
                                <div className="overflow-x-auto hide-scrollbar pb-2">
                                    <div className="flex gap-3 px-1 w-max">
                                        {FILTERS.map(f => (
                                            <div
                                                key={f.name}
                                                className="flex flex-col items-center gap-1 cursor-pointer"
                                                onClick={() => setActiveFilter(f.value)}
                                            >
                                                <div
                                                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${activeFilter === f.value ? 'border-primary scale-105' : 'border-transparent'}`}
                                                >
                                                    {mediaType === 'video' ? (
                                                        <video
                                                            src={mediaPreview}
                                                            className="w-full h-full object-cover"
                                                            style={{ filter: f.value }}
                                                            muted
                                                        />
                                                    ) : (
                                                        <img
                                                            src={mediaPreview || "https://i.pravatar.cc/150"}
                                                            className="w-full h-full object-cover"
                                                            style={{ filter: f.value }}
                                                            alt={f.name}
                                                        />
                                                    )}
                                                </div>
                                                <span className="text-[10px] font-semibold" style={{ color: activeFilter === f.value ? 'var(--color-primary)' : 'var(--color-text)' }}>
                                                    {f.name}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                )}

                                <div className="mt-8">
                                    <p className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
                                        <Music size={16} /> Add Music
                                    </p>
                                    {!selectedMusic ? (
                                         <button 
                                             type="button"
                                             onClick={() => setIsMusicModalOpen(true)}
                                             className="w-full flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed transition-all text-sm font-semibold"
                                             style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted)' }}
                                         >
                                             <Music size={18} />
                                             Select Background Track
                                         </button>
                                     ) : (
                                         <div 
                                             className="p-4 rounded-2xl relative group"
                                             style={{ background: 'var(--color-surface)', border: '1px solid var(--color-primary)' }}
                                         >
                                             <div className="flex items-center gap-3">
                                                 <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'var(--color-primary)', color: '#000' }}>
                                                     {selectedMusic.thumbnail ? <img src={selectedMusic.thumbnail} className="w-full h-full rounded-lg object-cover" /> : <Music size={20} />}
                                                  </div>
                                                 <div className="flex-1 min-w-0">
                                                     <p className="text-sm font-bold truncate" style={{ color: 'var(--color-text)' }}>{selectedMusic.title}</p>
                                                     <p className="text-[10px] truncate" style={{ color: 'var(--color-muted)' }}>{selectedMusic.artist}</p>
                                                 </div>
                                                 <button 
                                                      type="button"
                                                      onClick={() => {
                                                          if (isPlayingMusic) {
                                                              previewMusicRef.current.pause();
                                                              setIsPlayingMusic(false);
                                                          } else {
                                                              previewMusicRef.current.src = selectedMusic.audioUrl;
                                                              previewMusicRef.current.currentTime = musicStartTime;
                                                              previewMusicRef.current.play();
                                                              setIsPlayingMusic(true);
                                                          }
                                                      }}
                                                      className={`p-2 rounded-full ${isPlayingMusic ? 'bg-primary text-black' : 'bg-surface2 text-muted'}`}
                                                  >
                                                      {isPlayingMusic ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                                                  </button>
                                                  <button 
                                                      type="button"
                                                      onClick={() => {
                                                          setSelectedMusic(null);
                                                          setIsPlayingMusic(false);
                                                          if (previewMusicRef.current) previewMusicRef.current.pause();
                                                      }}
                                                      className="p-1.5 rounded-full"
                                                      style={{ color: 'var(--color-muted)' }}
                                                  >
                                                      <X size={16} />
                                                  </button>
                                              </div>
                                              
                                              <div className="mt-4">
                                                  <div className="flex items-center justify-between mb-1.5">
                                                      <span className="text-[10px] font-bold" style={{ color: 'var(--color-muted)' }}>Start Time</span>
                                                      <span className="text-[10px] font-mono" style={{ color: 'var(--color-primary)' }}>{Math.floor(musicStartTime)}s</span>
                                                  </div>
                                                  <input 
                                                      type="range"
                                                      min="0"
                                                      max={Math.max(0, (selectedMusic.duration || 0) - 15)}
                                                      value={musicStartTime}
                                                      onChange={(e) => {
                                                          const val = Number(e.target.value);
                                                          setMusicStartTime(val);
                                                          if (isPlayingMusic && previewMusicRef.current) {
                                                              previewMusicRef.current.currentTime = val;
                                                          }
                                                      }}
                                                      className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-primary"
                                                      style={{ background: 'var(--color-border)' }}
                                                  />
                                              </div>
                                          </div>
                                      )}
                                </div>

                            </div>
                        )}

                        {/* Step 3: Caption */}
                        {step === 3 && (
                            <div>
                                <p className="text-base font-bold mb-4" style={{ color: 'var(--color-text)' }}>Add Caption</p>
                                {mediaPreview && (
                                    <div className="w-full rounded-xl overflow-hidden mb-4" style={{ aspectRatio: mediaType === 'audio' ? 'auto' : '4/3' }}>
                                        {mediaType === 'video' ? (
                                            <video src={mediaPreview} className="w-full h-full object-cover" muted />
                                        ) : mediaType === 'audio' ? (
                                            <div className="p-3 flex items-center gap-2" style={{ background: 'var(--color-surface2)' }}>
                                                <Music size={24} style={{ color: 'var(--color-primary)' }} />
                                                <audio src={mediaPreview} controls className="flex-1" />
                                            </div>
                                        ) : (
                                            <img src={mediaPreview} alt="preview" className="w-full h-full object-cover" style={{ filter: activeFilter }} />
                                        )}
                                    </div>
                                )}
                                <textarea
                                    {...register('caption')}
                                    rows={4}
                                    placeholder="Write something compelling..."
                                    className="w-full resize-none rounded-xl px-4 py-3 text-sm outline-none"
                                    style={{
                                        background: 'var(--color-surface)',
                                        color: 'var(--color-text)',
                                        border: '1px solid var(--color-border)',
                                        lineHeight: '1.6',
                                    }}
                                />
                                <div className="flex justify-end mt-1">
                                    <span className="text-[11px]" style={{ color: 'var(--color-muted)' }}>
                                        {caption.length}/300
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Step 4: Promotion */}
                        {step === 4 && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--color-text)' }}>What's your ad budget?</h2>
                                    <p className="text-sm" style={{ color: 'var(--color-muted)' }}>The budget and duration you set will impact your ad's reach</p>
                                </div>

                                <div
                                    className="flex items-center justify-between p-4 rounded-xl"
                                    style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                                >
                                    <div>
                                        <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Enable Promotion</p>
                                        <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>Boost your content to the business feed</p>
                                    </div>
                                    <button onClick={() => setIsBusiness(!isBusiness)} className="cursor-pointer">
                                        {isBusiness ? (
                                            <ToggleRight size={32} style={{ color: 'var(--color-primary)' }} />
                                        ) : (
                                            <ToggleLeft size={32} style={{ color: 'var(--color-muted)' }} />
                                        )}
                                    </button>
                                </div>

                                <AnimatePresence>
                                    {isBusiness && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="space-y-6"
                                        >
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>Daily budget</p>
                                                </div>
                                                <div className="flex flex-col items-center">
                                                    <div className="flex items-center gap-2 mb-4">
                                                        <span className="text-4xl font-extrabold" style={{ color: 'var(--color-text)' }}>₹{dailyBudget}</span>
                                                        <FileText size={20} style={{ color: 'var(--color-muted)' }} className="opacity-50" />
                                                    </div>
                                                    <div className="w-full flex items-center gap-4">
                                                        <span className="text-xs font-bold" style={{ color: 'var(--color-muted)' }}>₹{promoSettings.minDailyBudget}</span>
                                                        <input 
                                                            type="range"
                                                            min={promoSettings.minDailyBudget}
                                                            max={10000} // Capping for slider UX, but can be higher
                                                            value={dailyBudget}
                                                            onChange={(e) => setDailyBudget(Number(e.target.value))}
                                                            className="flex-1 h-1.5 rounded-lg appearance-none cursor-pointer accent-primary"
                                                            style={{ background: 'var(--color-surface2)' }}
                                                        />
                                                        <span className="text-xs font-bold" style={{ color: 'var(--color-muted)' }}>₹10,000+</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-4 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
                                                <p className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>Duration</p>
                                                <div className="space-y-3">
                                                    <label className="flex items-center gap-3 cursor-pointer group">
                                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${durationSelection === 'pause' ? 'border-primary' : 'border-muted'}`}>
                                                            {durationSelection === 'pause' && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                                                        </div>
                                                        <input type="radio" className="hidden" name="duration" checked={durationSelection === 'pause'} onChange={() => setDurationSelection('pause')} />
                                                        <span className="text-sm font-semibold" style={{ color: durationSelection === 'pause' ? 'var(--color-text)' : 'var(--color-muted)' }}>Run this ad until I pause it</span>
                                                    </label>
                                                    <label className="flex items-center gap-3 cursor-pointer group">
                                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${durationSelection === 'set' ? 'border-primary' : 'border-muted'}`}>
                                                            {durationSelection === 'set' && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                                                        </div>
                                                        <input type="radio" className="hidden" name="duration" checked={durationSelection === 'set'} onChange={() => setDurationSelection('set')} />
                                                        <span className="text-sm font-semibold" style={{ color: durationSelection === 'set' ? 'var(--color-text)' : 'var(--color-muted)' }}>Run this ad for a set duration</span>
                                                    </label>
                                                </div>

                                                {durationSelection === 'set' && (
                                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center pt-2">
                                                        <p className="text-2xl font-bold mb-4" style={{ color: 'var(--color-text)' }}>{durationDays} days</p>
                                                        <div className="w-full flex items-center gap-4">
                                                            <span className="text-xs font-bold" style={{ color: 'var(--color-muted)' }}>{promoSettings.minDuration}</span>
                                                            <input 
                                                                type="range"
                                                                min={promoSettings.minDuration}
                                                                max={promoSettings.maxDuration}
                                                                value={durationDays}
                                                                onChange={(e) => setDurationDays(Number(e.target.value))}
                                                                className="flex-1 h-1.5 rounded-lg appearance-none cursor-pointer accent-primary"
                                                                style={{ background: 'var(--color-surface2)' }}
                                                            />
                                                            <span className="text-xs font-bold" style={{ color: 'var(--color-muted)' }}>{promoSettings.maxDuration}</span>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </div>

                                            <div className="bg-surface2 rounded-2xl p-4 space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-semibold" style={{ color: 'var(--color-muted)' }}>Total budget</span>
                                                    <span className="text-base font-bold" style={{ color: 'var(--color-text)' }}>₹{totalBudget}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-xs font-semibold" style={{ color: 'var(--color-muted)' }}>Estimated daily impressions</span>
                                                        <div className="w-3.5 h-3.5 rounded-full border border-muted text-[10px] flex items-center justify-center opacity-60">i</div>
                                                    </div>
                                                    <span className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>{estimatedLabel}</span>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--color-sub)' }}>
                                                    CTA Button Text
                                                </label>
                                                <div className="grid grid-cols-3 gap-2">
                                                    {['Shop Now', 'Order Now', 'Contact Us'].map(cta => (
                                                        <button
                                                            key={cta}
                                                            onClick={() => setCtaType(cta)}
                                                            className={`py-2 px-1 rounded-lg text-[10px] font-bold border transition-all ${ctaType === cta ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-surface text-muted'}`}
                                                        >
                                                            {cta}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--color-sub)' }}>
                                                    Redirect To
                                                </label>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {[
                                                        { id: 'whatsapp', label: 'WhatsApp' },
                                                        { id: 'internal', label: 'In-App Direct' }
                                                    ].map(type => (
                                                        <button
                                                            key={type.id}
                                                            onClick={() => setRedirectType(type.id)}
                                                            className={`py-2 rounded-lg text-xs font-bold border transition-all ${redirectType === type.id ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-surface text-muted'}`}
                                                        >
                                                            {type.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {redirectType === 'whatsapp' && (
                                                <div className="space-y-1.5">
                                                    <label className="block text-xs font-semibold" style={{ color: 'var(--color-sub)' }}>WhatsApp Number</label>
                                                    <input
                                                        type="text"
                                                        value={whatsappNumber}
                                                        onChange={(e) => setWhatsappNumber(e.target.value)}
                                                        placeholder="e.g. +91 9876543210"
                                                        className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                                                        style={{ background: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
                                                    />
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                                {!isBusiness && (
                                    <div className="mt-4 p-4 rounded-2xl bg-surface2 border border-border">
                                        <p className="text-xs text-muted leading-relaxed">
                                            Promote your post to reach more people. Set a budget to increase impressions and add a call-to-action button to drive results.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Step 5: NFT Toggle */}
                        {step === 5 && (
                            <div>
                                <p className="text-base font-bold mb-4" style={{ color: 'var(--color-text)' }}>List as NFT</p>
                                <div
                                    className="flex items-center justify-between p-4 rounded-xl mb-4"
                                    style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                                >
                                    <div>
                                        <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Enable NFT Listing</p>
                                        <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>
                                            Let fans buy ownership of this post
                                        </p>
                                    </div>
                                    <button onClick={() => setIsNFT(!isNFT)} className="cursor-pointer">
                                        {isNFT ? (
                                            <ToggleRight size={32} style={{ color: 'var(--color-primary)' }} />
                                        ) : (
                                            <ToggleLeft size={32} style={{ color: 'var(--color-muted)' }} />
                                        )}
                                    </button>
                                </div>
                                <AnimatePresence>
                                    {isNFT && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                        >
                                            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-sub)' }}>
                                                Set Price (₹) · Policy: $1–$20
                                            </label>
                                            <input
                                                type="number"
                                                {...register('price')}
                                                placeholder="e.g. 199"
                                                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                                                style={{
                                                    background: 'var(--color-surface)',
                                                    color: 'var(--color-text)',
                                                    border: '1px solid var(--color-primary)',
                                                }}
                                            />
                                            <p className="text-[11px] mt-1" style={{ color: nftPriceValid ? 'var(--color-success)' : 'var(--color-danger)' }}>
                                                Approx ${nftPriceUSD.toFixed(2)} USD ({nftPriceValid ? 'within policy range' : 'outside allowed range'})
                                            </p>
                                            {!kyc.payoutsUnlocked && (
                                                <p className="text-[11px] mt-1" style={{ color: 'var(--color-muted)' }}>
                                                    KYC verification is required to receive NFT sale payouts.
                                                </p>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}

                        {/* Step 6: Category */}
                        {step === 6 && (
                            <div>
                                <p className="text-base font-bold mb-4" style={{ color: 'var(--color-text)' }}>Select Category</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {categoryOptions.map((cat) => {
                                        const active = cat === selectedCategory
                                        return (
                                            <motion.button
                                                key={cat}
                                                whileTap={{ scale: 0.93 }}
                                                onClick={() => setSelectedCategory(cat)}
                                                className="py-3 rounded-xl text-sm font-semibold cursor-pointer transition-all duration-150"
                                                style={{
                                                    background: active ? 'rgba(245,158,11,0.12)' : 'var(--color-surface)',
                                                    border: `1px solid ${active ? 'var(--color-primary)' : 'var(--color-border)'}`,
                                                    color: active ? 'var(--color-primary)' : 'var(--color-text)',
                                                }}
                                            >
                                                {cat}
                                            </motion.button>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Step 7: Preview */}
                        {step === 7 && (
                            <div>
                                <p className="text-base font-bold mb-4" style={{ color: 'var(--color-text)' }}>Preview & Publish</p>
                                {publishError && <p className="text-xs text-red-500 mb-2 font-medium">{publishError}</p>}
                                <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                                    {mediaPreview && (
                                        mediaType === 'video' ? (
                                            <video src={mediaPreview} className="w-full object-cover" style={{ aspectRatio: '4/3', filter: activeFilter }} muted />
                                        ) : mediaType === 'audio' ? (
                                            <div className="p-4 flex items-center gap-2" style={{ background: 'var(--color-surface2)' }}>
                                                <Music size={28} style={{ color: 'var(--color-primary)' }} />
                                                <audio src={mediaPreview} controls className="flex-1" />
                                            </div>
                                        ) : (
                                            <img src={mediaPreview} alt="preview" className="w-full object-cover" style={{ aspectRatio: '4/3', filter: activeFilter }} />
                                        )
                                    )}
                                    <div className="p-4">
                                        <p className="text-sm" style={{ color: 'var(--color-sub)' }}>
                                            {caption || 'No caption added'}
                                        </p>
                                        <div className="flex flex-wrap items-center gap-2 mt-3">
                                            <span
                                                className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                                                style={{ background: 'rgba(245,158,11,0.12)', color: 'var(--color-primary)' }}
                                            >
                                                {selectedCategory}
                                            </span>
                                            {isBusiness && (
                                                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                                                    style={{ background: 'rgba(59,130,246,0.12)', color: 'var(--color-blue)' }}>
                                                    Business Post (₹{totalBudget})
                                                </span>
                                            )}
                                            {isBusiness && ctaType !== 'none' && (
                                                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                                                    style={{ background: 'var(--color-surface2)', color: 'var(--color-text)' }}>
                                                    CTA: {ctaType}
                                                </span>
                                            )}
                                            {isNFT && (
                                                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                                                    style={{ background: 'rgba(168,85,247,0.12)', color: 'var(--color-purple)' }}>
                                                    NFT Listed
                                                </span>
                                            )}
                                            {selectedMusic && (
                                                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold flex items-center gap-1"
                                                    style={{ background: 'var(--color-surface2)', color: 'var(--color-text)' }}>
                                                    <Music size={10} />
                                                    {selectedMusic.title}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Navigation buttons */}
            <div
                className="flex gap-3 px-4 py-4"
                style={{ borderTop: '1px solid var(--color-border)' }}
            >
                {step > 1 && (
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setStep(step - 1)}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold cursor-pointer"
                        style={{ background: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
                    >
                        <ChevronLeft size={16} /> Previous
                    </motion.button>
                )}
                {step < 7 ? (
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setStep(step + 1)}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold cursor-pointer"
                        style={{
                            background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary2))',
                            color: '#fff',
                        }}
                    >
                        Next <ArrowRight size={16} />
                    </motion.button>
                ) : (
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={handlePublish}
                        disabled={!!publishing}
                        className="flex-1 py-3 rounded-xl text-sm font-bold cursor-pointer disabled:opacity-75 relative overflow-hidden"
                        style={{
                            background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary2))',
                            color: '#fff',
                        }}
                    >
                        <div className="flex items-center justify-center gap-2">
                            {publishing && (
                                <motion.div 
                                    animate={{ rotate: 360 }}
                                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                                />
                            )}
                            {typeof publishing === 'string' ? publishing : (publishing ? (isBusiness ? 'Processing...' : 'Publishing...') : (isBusiness ? `Pay ₹${totalBudget} & Publish` : '🚀 Publish'))}
                        </div>
                    </motion.button>
                )}
            </div>
            <AnimatePresence>
                {isMusicModalOpen && (
                    <MusicSelectionModal 
                        onClose={() => setIsMusicModalOpen(false)}
                        onSelect={(m) => { setSelectedMusic(m); setIsMusicModalOpen(false); }}
                        currentSelected={selectedMusic}
                    />
                )}
            </AnimatePresence>
            <audio ref={previewMusicRef} onEnded={() => setIsPlayingMusic(false)} className="hidden" loop />
        </div>
    )
}
