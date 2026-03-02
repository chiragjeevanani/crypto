import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { Upload, Image, FileText, Video, ToggleLeft, ToggleRight, ChevronLeft, ArrowRight, Eye } from 'lucide-react'
import { useUserStore } from '../store/useUserStore'
import { getSelectablePostCategories } from '../../../shared/postCategories'
import { addUserNFTListing } from '../../../shared/nftListings'

const STEPS = [
    { id: 1, label: 'Upload Media', icon: Image },
    { id: 2, label: 'Caption', icon: FileText },
    { id: 3, label: 'NFT & Price', icon: ToggleLeft },
    { id: 4, label: 'Category', icon: Eye },
    { id: 5, label: 'Preview', icon: Eye },
]

export default function CreatePage() {
    const [step, setStep] = useState(1)
    const [isNFT, setIsNFT] = useState(false)
    const [categories, setCategories] = useState(getSelectablePostCategories())
    const [selectedCategory, setSelectedCategory] = useState(categories[0] || 'General')
    const [mediaPreview, setMediaPreview] = useState(null)
    const [published, setPublished] = useState(false)
    const { register, watch, handleSubmit } = useForm({ defaultValues: { caption: '', price: '' } })
    const { kyc, profile } = useUserStore()
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

    const handleMediaChange = (e) => {
        const file = e.target.files?.[0]
        if (file) setMediaPreview(URL.createObjectURL(file))
    }

    const handlePublish = () => {
        if (isNFT && nftPriceINR > 0 && nftPriceValid) {
            addUserNFTListing({
                title: caption?.trim() ? caption.trim().slice(0, 40) : 'Creator NFT',
                thumbnail: mediaPreview || '',
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
            setIsNFT(false)
        }, 2500)
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
                                            <img src={mediaPreview} alt="preview" className="w-full h-full object-cover" />
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
                                                    Image or Video
                                                </p>
                                            </>
                                        )}
                                    </div>
                                    <input type="file" accept="image/*,video/*" className="hidden" onChange={handleMediaChange} />
                                </label>
                            </div>
                        )}

                        {/* Step 2: Caption */}
                        {step === 2 && (
                            <div>
                                <p className="text-base font-bold mb-4" style={{ color: 'var(--color-text)' }}>Add Caption</p>
                                {mediaPreview && (
                                    <div className="w-full rounded-xl overflow-hidden mb-4" style={{ aspectRatio: '4/3' }}>
                                        <img src={mediaPreview} alt="preview" className="w-full h-full object-cover" />
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

                        {/* Step 3: NFT Toggle */}
                        {step === 3 && (
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

                        {/* Step 4: Category */}
                        {step === 4 && (
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

                        {/* Step 5: Preview */}
                        {step === 5 && (
                            <div>
                                <p className="text-base font-bold mb-4" style={{ color: 'var(--color-text)' }}>Preview & Publish</p>
                                <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                                    {mediaPreview && (
                                        <img src={mediaPreview} alt="preview" className="w-full object-cover" style={{ aspectRatio: '4/3' }} />
                                    )}
                                    <div className="p-4">
                                        <p className="text-sm" style={{ color: 'var(--color-sub)' }}>
                                            {caption || 'No caption added'}
                                        </p>
                                        <div className="flex items-center gap-2 mt-3">
                                            <span
                                                className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                                                style={{ background: 'rgba(245,158,11,0.12)', color: 'var(--color-primary)' }}
                                            >
                                                {selectedCategory}
                                            </span>
                                            {isNFT && (
                                                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                                                    style={{ background: 'rgba(168,85,247,0.12)', color: 'var(--color-purple)' }}>
                                                    NFT Listed
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
                {step < 5 ? (
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
                        className="flex-1 py-3 rounded-xl text-sm font-bold cursor-pointer"
                        style={{
                            background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary2))',
                            color: '#fff',
                        }}
                    >
                        🚀 Publish
                    </motion.button>
                )}
            </div>
        </div>
    )
}
