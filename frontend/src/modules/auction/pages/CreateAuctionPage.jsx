import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Info, CheckCircle, CreditCard } from 'lucide-react';
import { auctionService } from '../services/auctionService';
import axios from 'axios';
import { useFeedStore } from '../../user/store/useFeedStore';
import { useUserStore } from '../../user/store/useUserStore';
import { loadRazorpayScript } from '../../../utils/razorpayLoader';

export default function CreateAuctionPage() {
    const navigate = useNavigate();
    const { pushNotification } = useFeedStore();
    const { profile } = useUserStore();
    
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1); // 1: Details, 2: Payment
    const [media, setMedia] = useState(null);
    const [preview, setPreview] = useState(null);
    const [config, setConfig] = useState({ listingFee: 500, commission: 10 });
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        basePrice: '',
        startDate: '',
        endDate: '',
        royaltyPct: 10
    });

    // Initial load from localStorage
    React.useEffect(() => {
        const userId = profile?.id || 'guest';
        const saved = localStorage.getItem(`create_auction_form_${userId}`);
        if (saved) {
            try {
                setFormData(JSON.parse(saved));
            } catch (err) {
                console.error("Failed to parse saved form data", err);
            }
        }
    }, [profile?.id]);

    // Persist form data
    React.useEffect(() => {
        const userId = profile?.id || 'guest';
        localStorage.setItem(`create_auction_form_${userId}`, JSON.stringify(formData));
    }, [formData, profile?.id]);


    React.useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/config`);
                if (res.data.success) {
                    setConfig({
                        listingFee: res.data.config.auctionListingFeeINR !== undefined ? res.data.config.auctionListingFeeINR : 500,
                        commission: res.data.config.auctionCommissionPct !== undefined ? res.data.config.auctionCommissionPct : 10
                    });
                }
            } catch (err) {
                console.error("Failed to fetch config", err);
            }
        };
        fetchConfig();
    }, []);


    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setMedia(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleNext = (e) => {
        e.preventDefault();
        if (!media || !formData.title || !formData.description || !formData.basePrice || !formData.startDate || !formData.endDate) {
            pushNotification({ type: 'error', title: 'Missing Info', subtitle: 'Please fill all fields and upload media.' });
            return;
        }
        setStep(2);
    };

    const handlePayment = async () => {
        setLoading(true);
        try {
            // 1. Initiate Listing Fee
            const initRes = await auctionService.initiateListingFee();
            if (!initRes.success) throw new Error(initRes.message);

            const submitAuction = async (paymentData = {}) => {
                const finalData = new FormData();
                finalData.append('media', media);
                finalData.append('title', formData.title);
                finalData.append('description', formData.description);
                finalData.append('basePrice', formData.basePrice);
                finalData.append('startDate', new Date(formData.startDate).toISOString());
                finalData.append('endDate', new Date(formData.endDate).toISOString());
                finalData.append('royaltyPct', formData.royaltyPct);
                
                if (paymentData.razorpay_payment_id) {
                    finalData.append('razorpay_payment_id', paymentData.razorpay_payment_id);
                    finalData.append('razorpay_order_id', paymentData.razorpay_order_id);
                    finalData.append('razorpay_signature', paymentData.razorpay_signature);
                } else if (initRes.isFree) {
                    finalData.append('razorpay_order_id', initRes.orderId);
                }

                const createRes = await auctionService.createAuction(finalData);
                if (createRes.success) {
                    pushNotification({ type: 'success', title: 'Submitted', subtitle: 'Auction sent to admin for approval.' });
                    localStorage.removeItem(`create_auction_form_${profile?.id || 'guest'}`);
                    navigate('/auctions');
                } else {
                    throw new Error(createRes.message);
                }
            };

            if (initRes.isFree) {
                await submitAuction();
                return;
            }

            const isLoaded = await loadRazorpayScript();
            if (!isLoaded) {
                pushNotification({ type: 'error', title: 'Error', subtitle: 'Failed to load Razorpay SDK. Please check your connection.' });
                setLoading(false);
                return;
            }

            const options = {
                key: initRes.keyId,
                amount: initRes.amount,
                currency: initRes.currency,
                name: 'KnQ Reels',
                description: 'Auction Listing Fee',
                order_id: initRes.orderId,
                handler: async (response) => {
                    try {
                        await submitAuction(response);
                    } catch (err) {
                        const errorMessage = err.response?.data?.message || err.message;
                        pushNotification({ type: 'error', title: 'Submission Failed', subtitle: errorMessage });
                    } finally {
                        setLoading(false);
                    }
                },
                theme: { color: '#f59e0b' }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', (err) => {
                pushNotification({ type: 'error', title: 'Payment Failed', subtitle: err.error.description });
                setLoading(false);
            });
            rzp.open();

        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message;
            pushNotification({ type: 'error', title: 'Error', subtitle: errorMessage });
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col bg-bg h-full">
            <header className="p-4 flex items-center gap-3 bg-surface border-b border-border sticky top-0 z-10">
                <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-surface2 transition-colors">
                    <ArrowLeft size={18} />
                </button>
                <h1 className="font-bold">Create New Auction</h1>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-20">
                {/* Stepper */}
                <div className="flex items-center justify-between max-w-xs mx-auto mb-8">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${step >= 1 ? 'bg-primary text-white' : 'bg-surface2 text-muted'}`}>1</div>
                    <div className={`flex-1 h-0.5 mx-2 ${step >= 2 ? 'bg-primary' : 'bg-surface2'}`} />
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${step >= 2 ? 'bg-primary text-white' : 'bg-surface2 text-muted'}`}>2</div>
                </div>

                {step === 1 ? (
                    <form onSubmit={handleNext} className="space-y-6 animate-in slide-in-from-right duration-300">
                        {/* Media Upload */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted uppercase tracking-widest ml-1">Media (Image/Video)</label>
                            <label className="block aspect-video w-full rounded-2xl border-2 border-dashed border-border hover:border-primary/50 transition-all cursor-pointer overflow-hidden relative group"
                                style={{ background: 'var(--color-surface2)' }}
                            >
                                <input type="file" onChange={handleFileChange} accept="image/*,video/*" className="hidden" />
                                {preview ? (
                                    <>
                                        {media.type.startsWith('video') ? (
                                            <video src={preview} className="w-full h-full object-cover" />
                                        ) : (
                                            <img src={preview} className="w-full h-full object-cover" />
                                        )}
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Upload className="text-white" size={32} />
                                        </div>
                                    </>
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center space-y-3">
                                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                            <Upload size={24} />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm font-bold">Tap to upload media</p>
                                            <p className="text-[10px] text-muted px-4">Supported: JPG, PNG, MP4. Max 20MB.</p>
                                        </div>
                                    </div>
                                )}
                            </label>
                        </div>

                        {/* Details */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted uppercase tracking-widest ml-1">Auction Title</label>
                                <input 
                                    className="w-full bg-surface2 border border-border rounded-xl py-3 px-4 text-sm font-bold outline-none focus:ring-1 focus:ring-primary/20"
                                    placeholder="e.g. Rare NFT Collectible"
                                    value={formData.title}
                                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted uppercase tracking-widest ml-1">Description</label>
                                <textarea 
                                    className="w-full bg-surface2 border border-border rounded-xl py-3 px-4 text-sm font-medium outline-none focus:ring-1 focus:ring-primary/20 min-h-[100px] resize-none"
                                    placeholder="Tell participants about this item..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                />
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-muted uppercase tracking-widest ml-1">Base Price (₹)</label>
                                    <input 
                                        type="number"
                                        className="w-full bg-surface2 border border-border rounded-xl py-3 px-4 text-sm font-bold outline-none focus:ring-1 focus:ring-primary/20"
                                        placeholder="Min 100"
                                        value={formData.basePrice}
                                        onChange={(e) => setFormData({...formData, basePrice: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-muted uppercase tracking-widest ml-1">Start Date</label>
                                    <input 
                                        type="datetime-local"
                                        className="w-full bg-surface2 border border-border rounded-xl py-3 px-4 text-[11px] font-bold outline-none focus:ring-1 focus:ring-primary/20"
                                        value={formData.startDate}
                                        onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-muted uppercase tracking-widest ml-1">End Date</label>
                                    <input 
                                        type="datetime-local"
                                        className="w-full bg-surface2 border border-border rounded-xl py-3 px-4 text-[11px] font-bold outline-none focus:ring-1 focus:ring-primary/20"
                                        value={formData.endDate}
                                        onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                                    />
                                </div>
                            </div>

                            {/* Royalty Percentage (Web3) */}
                            <div className="p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/20 space-y-3">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs font-black text-yellow-600 uppercase tracking-widest">Creator Royalty (%)</label>
                                    <span className="bg-yellow-500 text-black text-[10px] px-2 py-0.5 rounded-lg font-black">{formData.royaltyPct}%</span>
                                </div>
                                <input 
                                    type="range"
                                    min="0"
                                    max="30"
                                    step="1"
                                    value={formData.royaltyPct}
                                    onChange={(e) => setFormData({...formData, royaltyPct: parseInt(e.target.value)})}
                                    className="w-full accent-yellow-500 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                                />
                                <div className="flex items-center gap-2 text-[9px] text-muted font-medium">
                                    <Info size={10} />
                                    <span>You earn this % on every secondary market sale (OpenSea, etc.)</span>
                                </div>
                            </div>
                        </div>

                        <button 
                            type="submit"
                            className="w-full py-4 rounded-2xl bg-primary text-white font-bold text-sm shadow-xl shadow-primary/20 transition-all active:scale-95 group"
                        >
                            Review & Proceed
                        </button>
                    </form>
                ) : (
                    <div className="space-y-8 animate-in slide-in-from-right duration-300">
                        <div className="text-center space-y-2">
                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto mb-4">
                                <CheckCircle size={32} />
                            </div>
                            <h2 className="text-xl font-black">Final Step</h2>
                            <p className="text-xs text-muted">Review your auction details and pay the listing fee to publish.</p>
                        </div>

                        <div className="bg-surface2 rounded-2xl p-5 space-y-4 border border-border">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted font-medium">Platform Listing Fee</span>
                                <span className="font-bold">₹{config.listingFee.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted font-medium">Platform Commission</span>
                                <span className="font-bold text-primary">{config.commission}% on sale</span>
                            </div>
                            <div className="h-px bg-border pt-2" />
                            <div className="flex justify-between items-center text-lg">
                                <span className="font-bold">Total Payable</span>
                                <span className="font-black text-primary">₹{config.listingFee.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex gap-3">
                            <Info className="text-blue-500 shrink-0" size={18} />
                            <p className="text-[10px] text-blue-500 font-medium leading-normal">
                                The auction will remain in 'Pending' status until approved by an admin. Once approved, it will go live automatically on the scheduled start date.
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button 
                                onClick={() => setStep(1)}
                                className="flex-1 py-4 rounded-2xl bg-surface2 text-text font-bold text-sm"
                            >
                                Back
                            </button>
                            <button 
                                onClick={handlePayment}
                                disabled={loading}
                                className="flex-[2] py-4 rounded-2xl bg-primary text-white font-bold text-sm shadow-xl shadow-primary/20 flex items-center justify-center gap-2"
                            >
                                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><CreditCard size={18} /> Pay & Submit</>}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
