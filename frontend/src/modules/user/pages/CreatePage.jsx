import { useEffect, useState } from 'react'
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
    const [categories, setCategories] = useState(getSelectablePostCategories())
    const [selectedCategory, setSelectedCategory] = useState(categories[0] || 'General')
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
    const [businessPrice, setBusinessPrice] = useState(499)

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
    const { kyc, profile } = useUserStore()
    const addPost = useFeedStore((s) => s.addPost)
    const caption = watch('caption', '')
    const nftPriceINR = Number(watch('price', 0) || 0)
    const nftPriceUSD = nftPriceINR / 83
    const nftPriceValid = nftPriceUSD >= 1 && nftPriceUSD <= 20

    useEffect(() => {
        const sync = () => {
            const next = getSelectablePostCategories()
            setCategories(next)
            setSelectedCategory((prev) => (next.includes(prev) ? prev : next[0]))
        }
        sync()
        const onStorage = (event) => {
            if (event.key === 'socialearn_post_categories_v2') sync()
        }
        window.addEventListener('post-categories-updated', sync)
        window.addEventListener('storage', onStorage)
        return () => {
            window.removeEventListener('post-categories-updated', sync)
            window.removeEventListener('storage', onStorage)
        }
    }, [])

    useEffect(() => {
        // Cleanup function for blob object URLs
        return () => {
            if (mediaPreview && mediaPreview.startsWith('blob:')) {
                URL.revokeObjectURL(mediaPreview)
            }
        }
    }, [mediaPreview])

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
        setPublishError('')
        if (!mediaFile) {
            setPublishError('Please upload an image, video, or audio file.')
            return
        }
        setPublishing(true)
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
            }

            const res = await postService.createPost(formData)
            const newPost = res?.post
            
            // If business, proceed to payment simulation (non-blocking for now)
            if (isBusiness && newPost?.id) {
                try {
                    // 1. Initiate payment
                    const initRes = await businessService.initiatePayment(newPost.id)
                    const orderId = initRes.data?.orderId; // Safe check

                    if (orderId) {
                        // 2. Simulate delay 
                        await new Promise(r => setTimeout(r, 800)); 
                        
                        const verifyRes = await businessService.verifyPayment({
                            postId: newPost.id,
                            paymentId: `sim_pay_${Date.now()}`,
                            orderId: orderId
                        });

                        if (verifyRes.success) {
                            if (verifyRes.post) addPost(verifyRes.post) // Use the updated post if available
                        }
                    }
                } catch (payErr) {
                    console.warn("Payment flow bypassed/failed:", payErr.message);
                    // We don't block the user, backend already set isPublished=true temporarily
                    if (newPost) addPost(newPost);
                }
            } else if (newPost) {
                addPost(newPost)
            }

            if (isNFT && nftPriceINR > 0 && nftPriceValid) {
                // ... NFT logic remains same
                const listingMediaType = newPost?.media?.type || mediaType
                const listingMediaUrl = newPost?.media?.url || ''
                const listingThumbnail = listingMediaType === 'video'
                    ? listingMediaUrl
                    : listingMediaUrl || mediaPreview || ''
                addUserNFTListing({
                    title: caption?.trim() ? caption.trim().slice(0, 40) : 'Creator NFT',
                    thumbnail: listingThumbnail,
                    mediaType: listingMediaType,
                    mediaUrl: listingMediaUrl,
                    price: nftPriceINR,
                    creatorId: profile.id,
                    creatorName: profile.username,
                    creatorHandle: profile.handle,
                    status: 'listed',
                    views: 0,
                    bids: 0,
                })
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

    if (published) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4 px-8 text-center py-24">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                    className="w-20 h-20 rounded-full flex items-center justify-center text-4xl"
                    style={{ background: 'rgba(245,158,11,0.15)' }}
                >
                    🚀
                </motion.div>
                <p className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>Post Published!</p>
                <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Your content is live and earning</p>
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
                                      <audio ref={previewMusicRef} onEnded={() => setIsPlayingMusic(false)} className="hidden" loop />
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
                            <div>
                                <p className="text-base font-bold mb-4" style={{ color: 'var(--color-text)' }}>Promote Content</p>
                                <div
                                    className="flex items-center justify-between p-4 rounded-xl mb-6"
                                    style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                                >
                                    <div>
                                        <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Enable Promotion</p>
                                        <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>
                                            Boost your content to the business feed
                                        </p>
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
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="space-y-4"
                                        >
                                            <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl mb-4">
                                                <p className="text-[11px] text-amber-500 font-medium">
                                                    Promotional posts require a one-time payment of ₹{businessPrice} to be published.
                                                </p>
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
                                                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                                                    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-sub)' }}>
                                                        WhatsApp Number
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={whatsappNumber}
                                                        onChange={(e) => setWhatsappNumber(e.target.value)}
                                                        placeholder="e.g. +91 9876543210"
                                                        className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                                                        style={{
                                                            background: 'var(--color-surface)',
                                                            color: 'var(--color-text)',
                                                            border: '1px solid var(--color-border)',
                                                        }}
                                                    />
                                                </motion.div>
                                            )}

                                            <div>
                                                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-sub)' }}>
                                                    Optional Link (Future Ready)
                                                </label>
                                                <input
                                                    type="url"
                                                    value={externalLink}
                                                    onChange={(e) => setExternalLink(e.target.value)}
                                                    placeholder="https://example.com"
                                                    className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                                                    style={{
                                                        background: 'var(--color-surface)',
                                                        color: 'var(--color-text)',
                                                        border: '1px solid var(--color-border)',
                                                    }}
                                                />
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                                {!isBusiness && (
                                    <div className="mt-8 p-4 rounded-2xl bg-surface2 border border-border">
                                        <p className="text-xs text-muted leading-relaxed">
                                            Turning on promotion will allow you to add a Call-To-Action button to your post and reach a wider audience interested in your products or services.
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
                                    {categories.map((cat) => {
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
                                                    Business Post (₹{businessPrice})
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
                        disabled={publishing}
                        className="flex-1 py-3 rounded-xl text-sm font-bold cursor-pointer disabled:opacity-50"
                        style={{
                            background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary2))',
                            color: '#fff',
                        }}
                    >
                        {publishing ? (isBusiness ? 'Processing Payment...' : 'Publishing...') : (isBusiness ? `Pay ₹${businessPrice} & Publish` : '🚀 Publish')}
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
        </div>
    )
}
