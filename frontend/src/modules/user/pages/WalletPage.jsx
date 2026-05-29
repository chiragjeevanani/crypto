import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Gift, CheckSquare, Gem, Link, ShieldCheck, AlertTriangle, Loader2, Zap, Share2 } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { useWalletStore } from '../store/useWalletStore'
import { useUserStore, getStoredToken } from '../store/useUserStore'
import { usePlatformSettings } from '../hooks/usePlatformSettings'
import WalletStatCard from '../components/wallet/WalletStatCard'
import TransactionItem from '../components/wallet/TransactionItem'

const TABS = ['Transactions', 'Withdraw', 'Linked']
const TODAY_IDX = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1

export default function WalletPage() {
    const {
        inrWallet,
        cryptoWallet,
        earningsWallet,
        walletRates,
        giftEarnings,
        taskEarnings,
        nftEarnings,
        transactions,
        payoutMethods,
        loadWallet,
        loadTransactions,
        walletError,
        initiateRecharge,
        verifyPayment,
        addPayoutMethod,
        requestWithdrawal,
    } = useWalletStore(useShallow(state => ({
        inrWallet: state.inrWallet,
        cryptoWallet: state.cryptoWallet,
        earningsWallet: state.earningsWallet,
        walletRates: state.walletRates,
        giftEarnings: state.giftEarnings,
        taskEarnings: state.taskEarnings,
        nftEarnings: state.nftEarnings,
        transactions: state.transactions,
        payoutMethods: state.payoutMethods,
        loadWallet: state.loadWallet,
        loadTransactions: state.loadTransactions,
        walletError: state.walletError,
        initiateRecharge: state.initiateRecharge,
        verifyPayment: state.verifyPayment,
        addPayoutMethod: state.addPayoutMethod,
        requestWithdrawal: state.requestWithdrawal,
    })))
    const [searchParams, setSearchParams] = useSearchParams()
    const [isProcessingPayment, setIsProcessingPayment] = useState(false)
    const { kyc, submitKYC, incrementReferralOnboarded, profile, initializeAuth } = useUserStore(useShallow(state => ({
        kyc: state.kyc,
        submitKYC: state.submitKYC,
        incrementReferralOnboarded: state.incrementReferralOnboarded,
        profile: state.profile,
        initializeAuth: state.initializeAuth,
    })))
    const currencySymbol = profile?.currencySymbol || '₹'
    const currencyCode = profile?.currencyCode || 'INR'
    const platformSettings = usePlatformSettings()
    const [activeTab, setActiveTab] = useState('Transactions')
    const [withdrawAmount, setWithdrawAmount] = useState('')
    const [withdrawMethod, setWithdrawMethod] = useState('upi')
    const [withdrawUpiId, setWithdrawUpiId] = useState('')
    const [withdrawAccountNumber, setWithdrawAccountNumber] = useState('')
    const [withdrawIFSC, setWithdrawIFSC] = useState('')
    const [kycReferralCode, setKycReferralCode] = useState(kyc.referralCode || '')
    const [kycAadharFront, setKycAadharFront] = useState(null)
    const [kycAadharBack, setKycAadharBack] = useState(null)
    const [linkMethodType, setLinkMethodType] = useState('upi')
    const [linkUpiId, setLinkUpiId] = useState('')
    const [linkUpiName, setLinkUpiName] = useState('')
    const [linkBankName, setLinkBankName] = useState('')
    const [linkBankAccountHolder, setLinkBankAccountHolder] = useState('')
    const [linkBankAccountNumber, setLinkBankAccountNumber] = useState('')
    const [linkBankIFSC, setLinkBankIFSC] = useState('')
    const [addInrAmount, setAddInrAmount] = useState('')
    const [addCryptoAmount, setAddCryptoAmount] = useState('')
    const [transferAmount, setTransferAmount] = useState('')
    const [transferWallet, setTransferWallet] = useState('inr')
    const [walletActionMessage, setWalletActionMessage] = useState('')
    const [kycMessage, setKycMessage] = useState('')
    const [aadharNumber, setAadharNumber] = useState('')
    const [panNumber, setPanNumber] = useState('')
    const [panCardFile, setPanCardFile] = useState(null)
    const [withdrawBankName, setWithdrawBankName] = useState('')
    const [withdrawAccountHolder, setWithdrawAccountHolder] = useState('')

    const hasAadharFront = Boolean(kycAadharFront) || Boolean(kyc.aadharFrontName)
    const hasAadharBack = Boolean(kycAadharBack) || Boolean(kyc.aadharBackName)
    const hasPanCard = Boolean(panCardFile)
    const canSubmitKYC = Boolean(kycReferralCode.trim()) && hasAadharFront && hasAadharBack && aadharNumber.length === 12 && panNumber.length === 10 && hasPanCard
    const hasWithdrawalAmount = Number(withdrawAmount || 0) >= platformSettings.minWithdrawal
    const hasWithdrawalDestination = withdrawMethod === 'upi'
        ? Boolean(withdrawUpiId.trim())
        : Boolean(withdrawAccountNumber.trim()) && Boolean(withdrawIFSC.trim()) && Boolean(withdrawAccountHolder.trim())
    const canWithdraw = (profile.referralCount >= platformSettings.minReferralsForWithdrawal) && hasWithdrawalAmount && hasWithdrawalDestination && aadharNumber.length >= 12 && panNumber.length >= 10 && hasAadharFront && hasAadharBack && hasPanCard

    useEffect(() => {
        loadWallet()
        loadTransactions()
    }, [loadWallet, loadTransactions])

    // Polling for KYC status updates if pending
    useEffect(() => {
        if (kyc.status !== 'pending') return;
        
        const interval = setInterval(() => {
            initializeAuth();
        }, 15000); // Increased to 15 seconds to reduce load
        
        return () => {
            clearInterval(interval);
        }
    }, [kyc.status, initializeAuth])

    // Auto-populate KYC data if verified
    useEffect(() => {
        if (kyc.status === 'verified' && kyc.aadharNumber) {
            setAadharNumber(kyc.aadharNumber);
            setPanNumber(kyc.panNumber || '');
        }
    }, [kyc.status, kyc.aadharNumber, kyc.panNumber])

    useEffect(() => {
        const verify = async () => {
            const gateway = searchParams.get('gateway')
            const trx = searchParams.get('trx')
            const status = searchParams.get('status') || 'success'
            const sessionId = searchParams.get('session_id') // Stripe returns this
            const cancelled = searchParams.get('cancelled')

            if (cancelled) {
                setWalletActionMessage('Payment was cancelled.')
                setTimeout(() => setWalletActionMessage(''), 4000)
                setSearchParams({}, { replace: true })
                return
            }
            
            if (gateway && trx) {
                setWalletActionMessage('Verifying payment...')
                // Pass session_id for Stripe, existing razorpay fields for Razorpay
                const verifyPayload = gateway === 'stripe'
                    ? { session_id: sessionId }
                    : status  // Razorpay uses the status string
                const res = await verifyPayment(trx, verifyPayload)
                if (res.ok) {
                    setWalletActionMessage('✅ Payment Successful! Wallet updated.')
                    setTimeout(() => setWalletActionMessage(''), 5000)
                    loadWallet()
                    loadTransactions()
                } else {
                    setWalletActionMessage(res.message || 'Payment Verification Failed.')
                }
                setSearchParams({}, { replace: true })
            }
        }
        verify()
    }, [searchParams, verifyPayment, setSearchParams, loadWallet, loadTransactions])

    // Auto-verify pending top-ups (failsafe if webhook/redirect missed)
    useEffect(() => {
        const pendingTopups = transactions.filter(tx => tx.status === 'pending' && tx.type === 'topup');
        if (pendingTopups.length > 0) {
            pendingTopups.forEach(async (tx) => {
                // Try verifying without passing gateway (backend will read it from DB)
                // For Stripe, it will use the stored session ID automatically.
                try {
                    const res = await verifyPayment(tx.id, {})
                    if (res.ok) {
                        loadWallet()
                        loadTransactions()
                    }
                } catch (e) {
                    console.log('Auto-verify failed for tx', tx.id)
                }
            })
        }
    }, [transactions, verifyPayment, loadWallet, loadTransactions])

    const handleQuickAdd = async (amount) => {
        const parsed = Number(amount)
        if (!parsed || parsed <= 0) return
        setIsProcessingPayment(true)
        setWalletActionMessage('Connecting to Secure Gateway...')
        const result = await initiateRecharge(parsed)

        if (!result?.ok) {
            setWalletActionMessage(result?.message || 'Gateway error. Please try again.')
            setIsProcessingPayment(false)
            return
        }

        // ── Stripe (international users) ─────────────────────────────────
        if (result.gateway === 'stripe') {
            if (result.sessionUrl) {
                setWalletActionMessage('Redirecting to Stripe secure checkout...')
                // Small delay so user sees the message before redirect
                setTimeout(() => {
                    window.location.href = result.sessionUrl
                }, 600)
            } else {
                setWalletActionMessage('Stripe session creation failed. Please try again.')
                setIsProcessingPayment(false)
            }
            return
        }

        // ── Razorpay (INR users — unchanged) ─────────────────────────────
        if (result.gateway === 'razorpay' && result.orderId && result.keyId) {
            const options = {
                key: result.keyId,
                amount: result.amount,
                currency: result.currency,
                name: 'KnQ Reels',
                description: 'Wallet Recharge',
                order_id: result.orderId,
                handler: async function (response) {
                    setWalletActionMessage('Verifying payment...')
                    const verification = await verifyPayment(result.transactionId, {
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_signature: response.razorpay_signature,
                    })
                    if (verification.ok) {
                        setWalletActionMessage('✅ Payment Successful!')
                        setTimeout(() => setWalletActionMessage(''), 5000)
                        loadWallet()
                        loadTransactions()
                    } else {
                        setWalletActionMessage(verification.message || 'Verification Failed')
                    }
                    setIsProcessingPayment(false)
                },
                modal: {
                    ondismiss: function () {
                        setIsProcessingPayment(false)
                        setWalletActionMessage('Payment cancelled.')
                    },
                },
                prefill: {
                    name: profile.fullName || profile.username,
                    email: profile.email || '',
                    contact: profile.phone || '',
                },
                theme: { color: '#f59e0b' },
            }
            const rzp = new window.Razorpay(options)
            rzp.open()
        } else {
            console.error('Gateway config error:', result)
            setWalletActionMessage(result?.message || 'Gateway config incomplete.')
            setIsProcessingPayment(false)
        }
    }

    const toDataUrl = (file) => new Promise((resolve) => {
        if (!file) {
            resolve('')
            return
        }
        const reader = new FileReader()
        reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
        reader.onerror = () => resolve('')
        reader.readAsDataURL(file)
    })

    const handleSubmitKYC = async () => {
        setKycMessage('')
        if (!aadharNumber || aadharNumber.length !== 12) {
            setKycMessage('Please enter a valid 12-digit Aadhar number.')
            return
        }
        if (!panNumber || panNumber.length !== 10) {
            setKycMessage('Please enter a valid 10-digit PAN number.')
            return
        }
        if (!kycAadharFront || !kycAadharBack) {
            setKycMessage('Please upload both Aadhar front and back images.')
            return
        }
        if (!panCardFile) {
            setKycMessage('Please upload your PAN card image.')
            return
        }
        try {
            setKycMessage('Uploading documentation...')
            const aadharFront = await toDataUrl(kycAadharFront)
            const aadharBack = await toDataUrl(kycAadharBack)
            const panCard = await toDataUrl(panCardFile)

            const response = await fetch(`${import.meta.env.VITE_API_URL}/user/kyc/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getStoredToken()}`
                },
                body: JSON.stringify({
                    aadharNumber: aadharNumber.trim(),
                    panNumber: panNumber.trim().toUpperCase(),
                    documents: {
                        aadharFrontUrl: aadharFront,
                        aadharBackUrl: aadharBack,
                        panCardUrl: panCard
                    }
                })
            })

            const result = await response.json()
            if (result.success) {
                setKycMessage(`KYC submitted. Admin review will complete shortly.`)
                // Sync with local state for immediate feedback
                submitKYC({
                    referralCode: kycReferralCode,
                    aadharFrontName: kycAadharFront?.name,
                    aadharBackName: kycAadharBack?.name,
                })
            } else {
                setKycMessage(result.message || 'KYC submission failed.')
            }
        } catch (error) {
            console.error('KYC Submit error:', error)
            setKycMessage('KYC submission failed. Please check your connection.')
        }
    }

    const handleReferralIncrement = () => {
        incrementReferralOnboarded()
    }

    const handleShareReferral = async () => {
        const shareData = {
            title: 'KnQ Reels',
            text: `Join KnQ Reels and start earning! Use my referral code: ${profile.referralCode}`,
            url: window.location.origin + '/signup?ref=' + (profile.referralCode || '')
        }
        try {
            if (navigator.share) {
                await navigator.share(shareData)
            } else {
                await navigator.clipboard.writeText(shareData.url)
                setWalletActionMessage('Referral link copied to clipboard!')
                setTimeout(() => setWalletActionMessage(''), 3000)
            }
        } catch (err) {
            console.error('Share failed:', err)
        }
    }

    const runWalletAction = (result, successMessage) => {
        if (result?.ok) {
            setWalletActionMessage(successMessage)
            return
        }
        setWalletActionMessage(result?.message || 'Action failed.')
    }

    return (
        <div className="px-4 md:px-6 pt-4 md:pt-8 max-w-2xl mx-auto pb-safe">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl md:text-4xl font-black tracking-tight" style={{ color: 'var(--color-text)' }}>Wallet</h1>
                <div className="p-2 rounded-2xl bg-surface border border-border/50">
                    <ShieldCheck size={20} className="text-primary" />
                </div>
            </div>
            {walletError && (
                <div className="mb-4 rounded-xl px-3 py-2 text-xs font-semibold"
                    style={{ background: 'rgba(244,63,94,0.12)', color: 'var(--color-danger)' }}>
                    {walletError}
                </div>
            )}

            {/* Wallet cards - Stacked Vertical for Single View */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
                {/* INR Wallet Card */}
                <motion.div 
                    whileHover={{ scale: 1.01 }}
                    className="rounded-2xl p-5 relative overflow-hidden shadow-lg border border-white/10"
                    style={{ 
                        background: 'linear-gradient(135deg, #FF9933 0%, #F45D22 100%)', 
                        color: '#fff' 
                    }}
                >
                    <div className="relative z-10 flex flex-col gap-3">
                        <div className="w-full">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-90 mb-1 break-words">{currencyCode} BALANCE</p>
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <h2 className="text-3xl font-black flex items-baseline gap-1 min-w-0">
                                    <span className="text-sm font-medium opacity-70">{currencySymbol}</span>
                                    <span className="truncate">{Math.round(inrWallet * (walletRates.localRate || 1)).toLocaleString()}</span>
                                </h2>
                                <button
                                    onClick={() => setActiveTab('Linked')}
                                    className="shrink-0 px-4 py-2 rounded-xl text-[10px] font-black bg-white/20 hover:bg-white/30 backdrop-blur-md transition-all active:scale-95 uppercase tracking-widest"
                                >
                                    Top up
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="absolute top-[-20%] right-[-10%] w-24 h-24 bg-white/10 rounded-full blur-2xl" />
                </motion.div>

                {/* Crypto Wallet Card */}
                <motion.div 
                    whileHover={{ scale: 1.01 }}
                    className="rounded-2xl p-5 relative overflow-hidden shadow-lg border border-black/5"
                    style={{ 
                        background: 'linear-gradient(135deg, #ffffff 0%, #f3f4f6 100%)', 
                        color: '#000' 
                    }}
                >
                    <div className="relative z-10 flex flex-col gap-3">
                        <div className="w-full">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50 mb-1 break-words">CRYPTO ASSETS</p>
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="flex flex-col min-w-0">
                                    <h2 className="text-3xl font-black flex items-baseline gap-1 min-w-0">
                                        <span className="truncate">{Number(cryptoWallet || 0).toFixed(3)}</span> 
                                        <span className="text-xs font-medium opacity-40">ETH</span>
                                    </h2>
                                    <span className="text-[9px] font-bold opacity-40 uppercase tracking-wider truncate">
                                        ≈ {currencySymbol}{Math.round(cryptoWallet * walletRates.inrPerCrypto).toLocaleString()}
                                    </span>
                                </div>
                                <button
                                    onClick={() => setActiveTab('Linked')}
                                    className="shrink-0 px-4 py-2 rounded-xl text-[10px] font-black bg-black/5 hover:bg-black/10 transition-all active:scale-95 uppercase tracking-widest"
                                >
                                    Manage
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="absolute bottom-[-20%] right-[-10%] w-24 h-24 bg-black/5 rounded-full blur-2xl" />
                </motion.div>

                {/* Earning Wallet Card */}
                <motion.div 
                    whileHover={{ scale: 1.01 }}
                    className="rounded-2xl p-5 relative overflow-hidden shadow-lg border border-white/5"
                    style={{ 
                        background: 'linear-gradient(135deg, #138808 0%, #0B6604 100%)', 
                        color: '#fff' 
                    }}
                >
                    <div className="relative z-10 flex flex-col gap-3">
                        <div className="w-full">
                            <div className="flex items-center gap-2 mb-1">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 break-words">EARNING WALLET</p>
                                {earningsWallet >= 10 && (
                                    <span className="bg-white/20 backdrop-blur-md text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase shrink-0">Unlock</span>
                                )}
                            </div>
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <h2 className="text-3xl font-black flex items-baseline gap-1 min-w-0">
                                    <span className="text-sm font-medium opacity-70">{currencySymbol}</span>
                                    <span className="truncate">{Math.round((earningsWallet / platformSettings.coinRate) * (walletRates.localRate || 1)).toLocaleString()}</span>
                                </h2>
                                
                                <div className="shrink-0 grow flex justify-end">
                                    {earningsWallet < platformSettings.minWithdrawal ? (
                                        <div className="w-full max-w-[120px] space-y-1">
                                            <div className="flex justify-between gap-1 text-[7px] font-black opacity-70 uppercase tracking-widest leading-none">
                                                <span>Payout Goal</span>
                                                <span>{Math.round((earningsWallet / platformSettings.minWithdrawal) * 100)}%</span>
                                            </div>
                                            <div className="h-1 bg-black/20 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-white transition-all duration-700" 
                                                    style={{ width: `${Math.min(100, (earningsWallet / platformSettings.minWithdrawal) * 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setActiveTab('Withdraw')}
                                            className="px-4 py-2 rounded-xl text-[10px] font-black bg-white text-emerald-700 hover:bg-emerald-50 transition-all active:scale-95 uppercase tracking-widest shadow-lg shadow-black/5"
                                        >
                                            Withdraw
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="absolute top-[-10%] right-[-10%] w-24 h-24 bg-white/10 rounded-full blur-2xl" />
                </motion.div>
            </div>

            {/* Quick Actions */}
            <div className="rounded-[24px] p-8 mb-8 bg-surface border border-border/40 shadow-sm relative overflow-hidden group">
                <div className="relative z-10">
                    <div className="mb-6">
                        <h3 className="text-xl font-black tracking-tight uppercase mb-1">Add to {currencyCode} Balance</h3>
                        <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-3">Recharge your {currencyCode} wallet</p>
                        <p className="text-[10px] font-bold text-muted uppercase tracking-widest flex items-center gap-2">
                            <Zap size={12} className="text-primary" />
                            Select or enter amount
                        </p>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-8">
                        {[5, 10, 20, 50, 100, 200, 500].map(amt => (
                            <button
                                key={amt}
                                disabled={isProcessingPayment}
                                onClick={() => handleQuickAdd(amt)}
                                className="flex-1 min-w-[calc(25%-0.5rem)] sm:min-w-0 sm:flex-none px-4 py-3 rounded-xl text-[10px] font-black transition-all border border-border/20 shadow-sm active:scale-95 bg-bg hover:bg-surface2 text-primary uppercase tracking-widest whitespace-nowrap"
                            >
                                +{currencySymbol}{amt}
                            </button>
                        ))}
                    </div>
                    
                    <div className="relative">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1 group/input">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-primary transition-colors group-focus-within/input:scale-110 transition-transform">{currencySymbol}</span>
                                <input
                                    type="number"
                                    value={addInrAmount}
                                    onChange={(e) => setAddInrAmount(e.target.value)}
                                    placeholder="Enter custom amount"
                                    className="w-full h-14 pl-10 pr-4 rounded-xl border-2 bg-primary/10 text-sm font-black outline-none border-primary/30 focus:border-primary focus:bg-primary/20 transition-all placeholder:text-primary/60"
                                    style={{ color: 'var(--color-text)' }}
                                />
                            </div>
                            <button
                                disabled={isProcessingPayment || !addInrAmount || Number(addInrAmount) <= 0}
                                onClick={() => handleQuickAdd(addInrAmount)}
                                className="w-full sm:w-auto px-10 h-14 rounded-xl text-white text-[11px] font-black uppercase tracking-widest shadow-lg transition-all disabled:opacity-60 shrink-0 active:scale-95 hover:brightness-110"
                                style={{ 
                                    background: 'linear-gradient(135deg, #F39C12 0%, #D35400 100%)',
                                    boxShadow: (isProcessingPayment || !addInrAmount || Number(addInrAmount) <= 0) 
                                        ? 'none' 
                                        : '0 10px 15px -3px rgba(211, 84, 0, 0.4)'
                                }}
                            >
                                {isProcessingPayment ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Recharge Now'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {walletActionMessage && (
                <p className="text-[11px] mb-6 text-center font-bold px-4 py-2 rounded-lg bg-orange-500/10 text-orange-600">
                    {walletActionMessage}
                </p>
            )}

            {/* Earnings breakdown */}
            <div className="flex gap-2 mb-4">
                <WalletStatCard label="Gifts" amount={giftEarnings} icon={Gift} color="var(--color-danger)" small />
                <WalletStatCard label="Tasks" amount={taskEarnings} icon={CheckSquare} color="var(--color-primary)" small />
                <WalletStatCard label="NFTs" amount={nftEarnings} icon={Gem} color="var(--color-purple)" small />
            </div>

            <div
                className="rounded-2xl p-4 mb-8 flex items-center justify-between gap-4 bg-surface/50 border border-border/30 backdrop-blur-sm"
            >
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <ShieldCheck size={20} className={kyc.status === 'verified' ? 'text-success' : 'text-primary'} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted">
                                Status: <span className={kyc.status === 'verified' ? 'text-success' : kyc.status === 'rejected' ? 'text-red-500' : 'text-primary'}>{kyc.status.toUpperCase()}</span>
                            </p>
                            {kyc.status === 'rejected' && (
                                <span className="px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-500 text-[8px] font-black uppercase">Attention Required</span>
                            )}
                        </div>
                        <p className="text-xs font-bold text-text truncate">
                            Level {kyc.level} · {kyc.status === 'verified' ? 'Payouts enabled' : kyc.status === 'rejected' ? 'Needs correction' : 'KYC required'}
                        </p>
                        {kyc.status === 'rejected' && kyc.rejectionReason && (
                            <p className="text-[10px] font-bold text-red-500 mt-1 opacity-80 uppercase leading-none italic">
                                Reason: {kyc.rejectionReason}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border/30 mb-8 overflow-x-auto no-scrollbar">
                {TABS.map((tab) => {
                    const active = tab === activeTab
                    return (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className="flex-1 min-w-fit px-4 pb-3 text-[11px] font-black uppercase tracking-[0.2em] transition-all relative whitespace-nowrap"
                            style={{ color: active ? 'var(--color-primary)' : 'var(--color-muted)' }}
                        >
                            <span className="relative z-10">{tab}</span>
                            {active && (
                                <motion.div
                                    layoutId="wallet-tab"
                                    className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-primary"
                                />
                            )}
                        </button>
                    )
                })}
            </div>

            {/* Tab content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                >
                    {activeTab === 'Transactions' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-2">
                                <h3 className="text-sm font-black uppercase tracking-widest text-muted">Recent Activity</h3>
                                <div className="px-3 py-1 bg-surface border rounded-full text-[10px] font-bold text-muted uppercase">Verified</div>
                            </div>
                            {transactions.length === 0 ? (
                                <div className="py-20 text-center space-y-3 opacity-40">
                                    <div className="w-16 h-16 rounded-3xl bg-surface border mx-auto flex items-center justify-center">
                                        <CheckSquare size={30} />
                                    </div>
                                    <p className="text-sm font-bold uppercase tracking-widest">No transactions yet</p>
                                </div>
                            ) : transactions.map((tx) => (
                                <TransactionItem key={tx.id} tx={tx} currencySymbol={currencySymbol} />
                            ))}
                        </div>
                    )}

                    {activeTab === 'Withdraw' && (
                        <div className="space-y-6">
                            {/* Referral Code Share Block */}
                            <div className="rounded-3xl p-6 border shadow-sm space-y-4" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase text-muted tracking-widest">Your Referral Identity</p>
                                        <h3 className="text-xl font-black text-primary tracking-tighter uppercase">{profile.referralCode || 'GENERATING...'}</h3>
                                    </div>
                                    <button 
                                        onClick={handleShareReferral}
                                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-primary text-black text-[11px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
                                    >
                                        <Share2 size={16} />
                                        Share & Earn
                                    </button>
                                </div>
                                <p className="text-[10px] font-bold text-muted leading-relaxed uppercase tracking-tighter">
                                    Share this platform with at least {platformSettings.minReferralsForWithdrawal} friends to unlock your revenue stream.
                                </p>
                            </div>
                            {/* KYC Status Banner */}
                            {(kyc.status !== 'verified' || (profile.referralCount || 0) < platformSettings.minReferralsForWithdrawal) && (
                                <motion.div 
                                    id="kyc-section"
                                    className="rounded-[32px] p-8 border backdrop-blur-md shadow-2xl relative overflow-hidden"
                                    style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                                >
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-3xl" />
                                    
                                    <div className="flex items-start gap-5 relative z-10">
                                        <div className="w-14 h-14 rounded-3xl flex items-center justify-center bg-orange-500/10 shrink-0 shadow-inner">
                                            <ShieldCheck size={28} className="text-orange-500" />
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <h3 className="text-lg font-black tracking-tight" style={{ color: 'var(--color-text)' }}>Unlock Withdrawals</h3>
                                            <p className="text-sm font-medium leading-relaxed opacity-60">
                                                Complete mandatory KYC and refer {platformSettings.minReferralsForWithdrawal} members to enable earnings withdrawal.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-8 space-y-6 relative z-10">
                                        {/* Progress Trackers */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="p-4 rounded-2xl bg-bg/50 border border-border/50">
                                                <p className="text-[10px] font-black uppercase text-muted tracking-widest mb-2">Referrals</p>
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-xl font-black">{profile.referralCount || 0}<span className="text-sm text-muted">/{platformSettings.minReferralsForWithdrawal}</span></span>
                                                    {profile.referralCount >= platformSettings.minReferralsForWithdrawal && <div className="p-1 rounded-full bg-emerald-500"><ShieldCheck size={10} className="text-white" /></div>}
                                                </div>
                                                <div className="h-1.5 bg-border rounded-full overflow-hidden">
                                                    <div className="h-full bg-primary" style={{ width: `${Math.min(100, ((profile.referralCount || 0) / platformSettings.minReferralsForWithdrawal) * 100)}%` }} />
                                                </div>
                                            </div>
                                            <div className="p-4 rounded-2xl bg-bg/50 border border-border/50">
                                                <p className="text-[10px] font-black uppercase text-muted tracking-widest mb-2">KYC Status</p>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className={`w-3 h-3 rounded-full ${kyc.status === 'verified' ? 'bg-emerald-500' : kyc.status === 'rejected' ? 'bg-red-500' : 'bg-orange-500 animate-pulse'}`} />
                                                    <span className={`text-xs font-black uppercase ${kyc.status === 'rejected' ? 'text-red-500' : ''}`}>{kyc.status}</span>
                                                </div>
                                                {kyc.status === 'rejected' && kyc.rejectionReason && (
                                                    <div className="mt-2 p-2 rounded-xl bg-red-500/10 border border-red-500/20">
                                                        <p className="text-[10px] font-bold text-red-500 leading-tight uppercase">Reason: {kyc.rejectionReason}</p>
                                                    </div>
                                                )}
                                                {kyc.status === 'pending' && <p className="text-[9px] font-bold text-muted leading-tight">Admin approval pending</p>}
                                                {kyc.status === 'rejected' && <p className="text-[9px] font-bold text-muted leading-tight">Please re-submit correct details</p>}
                                            </div>
                                        </div>

                                        {kyc.status !== 'verified' && (
                                            <div className="space-y-6">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black uppercase text-muted tracking-widest ml-1">Aadhar Number (12 digits)</label>
                                                        <input 
                                                            type="text"
                                                            maxLength={12}
                                                            value={aadharNumber}
                                                            onChange={(e) => setAadharNumber(e.target.value.replace(/\D/g, ''))}
                                                            placeholder="0000 0000 0000"
                                                            className="w-full px-5 h-14 rounded-2xl border-2 border-border/20 bg-bg text-sm font-black outline-none focus:border-primary/30 transition-all"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black uppercase text-muted tracking-widest ml-1">PAN Card Number</label>
                                                        <input 
                                                            type="text"
                                                            maxLength={10}
                                                            value={panNumber}
                                                            onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                                                            placeholder="ABCDE1234F"
                                                            className="w-full px-5 h-14 rounded-2xl border-2 border-border/20 bg-bg text-sm font-black outline-none focus:border-primary/30 transition-all uppercase"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                    <label className="flex flex-col items-center justify-center gap-3 p-6 rounded-3xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 cursor-pointer transition-all group">
                                                        <div className="p-2 rounded-xl bg-surface group-hover:bg-primary group-hover:text-black transition-all rotate-3"><ShieldCheck size={20} /></div>
                                                        <span className="text-[10px] font-black uppercase text-muted text-center tracking-tighter">
                                                            {kycAadharFront?.name || kyc.aadharFrontName?.substring(0,10) || 'AADHAR FRONT'}
                                                        </span>
                                                        <input type="file" accept="image/*,.pdf" onChange={(e) => setKycAadharFront(e.target.files?.[0] || null)} className="hidden" />
                                                    </label>
                                                    <label className="flex flex-col items-center justify-center gap-3 p-6 rounded-3xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 cursor-pointer transition-all group">
                                                        <div className="p-2 rounded-xl bg-surface group-hover:bg-primary group-hover:text-black transition-all -rotate-3"><ShieldCheck size={20} /></div>
                                                        <span className="text-[10px] font-black uppercase text-muted text-center tracking-tighter">
                                                            {kycAadharBack?.name || kyc.aadharBackName?.substring(0,10) || 'AADHAR BACK'}
                                                        </span>
                                                        <input type="file" accept="image/*,.pdf" onChange={(e) => setKycAadharBack(e.target.files?.[0] || null)} className="hidden" />
                                                    </label>
                                                    <label className="flex flex-col items-center justify-center gap-3 p-6 rounded-3xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 cursor-pointer transition-all group">
                                                        <div className="p-2 rounded-xl bg-surface group-hover:bg-primary group-hover:text-black transition-all rotate-6"><ShieldCheck size={20} /></div>
                                                        <span className="text-[10px] font-black uppercase text-muted text-center tracking-tighter">
                                                            {panCardFile?.name || 'PAN CARD IMAGE'}
                                                        </span>
                                                        <input type="file" accept="image/*,.pdf" onChange={(e) => setPanCardFile(e.target.files?.[0] || null)} className="hidden" />
                                                    </label>
                                                </div>
                                                
                                                <button
                                                    onClick={handleSubmitKYC}
                                                    className={`w-full py-4 rounded-[20px] text-[10px] font-black transition-all shadow-xl uppercase tracking-[0.2em] hover:scale-[1.01] active:scale-[0.98] ${canSubmitKYC ? 'bg-primary text-black' : 'bg-surface2 text-muted'}`}
                                                >
                                                    {kycMessage === 'Uploading documentation...' || kycMessage.includes('submitted') ? 'PROCESSING...' : 'PROCEED TO VERIFICATION'}
                                                </button>
                                                {kycMessage && <p className="text-[10px] text-center font-bold text-orange-500">{kycMessage}</p>}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}

                            {/* Withdrawal Form - Only visible when verified and referral count met */}
                            {kyc.status === 'verified' && (profile.referralCount || 0) >= platformSettings.minReferralsForWithdrawal ? (
                                <div className="rounded-[32px] p-8 border shadow-sm space-y-8" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
                                    <div className="space-y-4">
                                        <div className="flex p-1 bg-surface border border-border/30 rounded-2xl">
                                            {['upi', 'bank'].map((m) => (
                                                <button
                                                    key={m}
                                                    onClick={() => setWithdrawMethod(m)}
                                                    className={`flex-1 py-3 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all ${withdrawMethod === m ? 'bg-primary text-black shadow-lg' : 'text-muted hover:text-text'}`}
                                                >
                                                    {m}
                                                </button>
                                            ))}
                                        </div>

                                        <div className="space-y-6">
                                            <div className="relative group">
                                                <label className="text-[10px] font-black text-muted uppercase tracking-[0.2em] ml-1 mb-3 block">Withdrawal Amount (INR)</label>
                                                <div className="flex items-center px-5 h-14 rounded-2xl border-2 border-border/20 bg-bg transition-all group-within:border-primary/30 group-within:bg-surface">
                                                    <span className="text-xl font-black mr-2 text-muted">{currencySymbol}</span>
                                                    <input
                                                        type="number"
                                                        placeholder={`0.00`}
                                                        value={withdrawAmount}
                                                        onChange={(e) => {
                                                            const valInRs = Number(e.target.value);
                                                            const maxRs = earningsWallet / platformSettings.coinRate;
                                                            setWithdrawAmount(Math.min(valInRs, maxRs));
                                                        }}
                                                        className="bg-transparent border-none outline-none text-xl font-black w-full text-text placeholder:text-muted/20"
                                                    />
                                                    <button 
                                                        onClick={() => setWithdrawAmount(Math.floor(earningsWallet / platformSettings.coinRate))}
                                                        className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-[10px] font-black uppercase tracking-wider hover:bg-primary hover:text-black transition-all"
                                                    >
                                                        MAX
                                                    </button>
                                                </div>
                                                <p className="text-[9px] font-bold text-muted mt-2 ml-1 uppercase">
                                                    Equivalent to {Math.round(withdrawAmount * platformSettings.coinRate)} coins
                                                </p>
                                            </div>

                                            {/* Payout Breakdown */}
                                            <motion.div 
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: withdrawAmount ? 1 : 0, height: withdrawAmount ? 'auto' : 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="p-5 rounded-[22px] bg-bg border border-border/50 space-y-3">
                                                    <div className="flex justify-between text-xs font-bold text-muted">
                                                        <span>Requested Amount</span>
                                                        <span>{currencySymbol}{Number(withdrawAmount || 0).toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex justify-between text-[11px] font-bold text-red-500/80">
                                                        <span>Platform Fee ({platformSettings.commission || 10}%)</span>
                                                        <span>-{currencySymbol}{((Number(withdrawAmount || 0) * (platformSettings.commission || 10)) / 100).toFixed(2)}</span>
                                                    </div>
                                                    <div className="flex justify-between text-[11px] font-bold text-red-500/80">
                                                        <span>GST (18%)</span>
                                                        <span>-{currencySymbol}{((Number(withdrawAmount || 0) * 18) / 100).toFixed(2)}</span>
                                                    </div>
                                                    <div className="pt-2 border-t border-border/50 flex justify-between items-center">
                                                        <span className="text-[10px] font-black uppercase tracking-widest">Final Payout</span>
                                                        <span className="text-lg font-black text-emerald-500">
                                                            {currencySymbol}{Math.max(0, Number(withdrawAmount || 0) - (Number(withdrawAmount || 0) * (platformSettings.commission || 10) / 100) - (Number(withdrawAmount || 0) * 18 / 100)).toFixed(2)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </motion.div>

                                            {withdrawMethod === 'upi' ? (
                                                <div className="relative group">
                                                    <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-3 mb-2 block">UPI ID</label>
                                                    <input
                                                        type="text"
                                                        placeholder="e.g. yourname@bank"
                                                        value={withdrawUpiId}
                                                        onChange={(e) => setWithdrawUpiId(e.target.value)}
                                                        className="w-full px-5 h-16 rounded-[22px] text-sm outline-none border bg-bg/50 focus:ring-4 ring-primary/10 focus:border-primary transition-all font-bold placeholder:text-muted/30"
                                                        style={{ color: 'var(--color-text)', borderColor: 'var(--color-border)' }}
                                                    />
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-1 gap-4">
                                                    <input
                                                        type="text"
                                                        placeholder="Account Holder Name"
                                                        value={withdrawAccountHolder}
                                                        onChange={(e) => setWithdrawAccountHolder(e.target.value)}
                                                        className="w-full px-5 h-16 rounded-[22px] border font-bold text-sm bg-bg/50"
                                                        style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                                                    />
                                                    <input
                                                        type="text"
                                                        placeholder="Bank Name"
                                                        value={withdrawBankName}
                                                        onChange={(e) => setWithdrawBankName(e.target.value)}
                                                        className="w-full px-5 h-16 rounded-[22px] border font-bold text-sm bg-bg/50"
                                                        style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                                                    />
                                                    <input
                                                        type="text"
                                                        placeholder="Account Number"
                                                        value={withdrawAccountNumber}
                                                        onChange={(e) => setWithdrawAccountNumber(e.target.value)}
                                                        className="w-full px-5 h-16 rounded-[22px] border font-bold text-sm bg-bg/50"
                                                        style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                                                    />
                                                    <input
                                                        type="text"
                                                        placeholder="IFSC Code (e.g. SBIN0001234)"
                                                        value={withdrawIFSC}
                                                        onChange={(e) => setWithdrawIFSC(e.target.value.toUpperCase())}
                                                        className="w-full px-5 h-16 rounded-[22px] border font-bold text-sm bg-bg/50"
                                                        style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                                                    />
                                                </div>
                                            )}

                                            {/* Government Verification Info */}
                                            <div className="pt-4 border-t border-border/20 space-y-4">
                                                <p className="text-[10px] font-black uppercase text-muted tracking-widest ml-3">Identity Verified</p>
                                                <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                                                    <ShieldCheck className="text-emerald-500" size={20} />
                                                    <div>
                                                        <p className="text-xs font-black">KYC DOCUMENTATION APPROVED</p>
                                                        <p className="text-[9px] font-bold text-muted uppercase">Payouts are authorized for this account</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <motion.button
                                            whileHover={{ scale: 1.01 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={async () => {
                                                setWalletActionMessage('Processing payout request...')
                                                 const payoutPayload = {
                                                    paymentMethod: withdrawMethod,
                                                    bankDetails: withdrawMethod === 'bank' ? {
                                                        accountNumber: withdrawAccountNumber.trim(),
                                                        ifscCode: withdrawIFSC.trim().toUpperCase(),
                                                        bankName: withdrawBankName.trim(),
                                                        accountHolderName: withdrawAccountHolder.trim()
                                                    } : undefined,
                                                    upiId: withdrawMethod === 'upi' ? withdrawUpiId.trim().toLowerCase() : undefined,
                                                    kycDetails: {
                                                        aadharNumber: aadharNumber.trim(),
                                                        panNumber: panNumber.trim().toUpperCase()
                                                    },
                                                    documents: {
                                                        aadharFrontUrl: kyc.aadharFrontUrl || '',
                                                        aadharBackUrl: kyc.aadharBackUrl || '',
                                                        panCardUrl: kyc.panCardUrl || ''
                                                    }
                                                }


                                                const coinsToWithdraw = Math.round(withdrawAmount * platformSettings.coinRate);
                                                const result = await requestWithdrawal(coinsToWithdraw, payoutPayload)
                                                if (result?.ok) {
                                                    runWalletAction(result, 'Withdrawal request transmitted to treasury.')
                                                    setWithdrawAmount('')
                                                } else {
                                                    runWalletAction(result)
                                                }
                                            }}
                                            disabled={!withdrawAmount || (withdrawAmount * platformSettings.coinRate) < platformSettings.minWithdrawal || (withdrawAmount * platformSettings.coinRate) > earningsWallet}
                                            className="w-full py-4 rounded-2xl text-[10px] font-black transition-all shadow-2xl disabled:opacity-20 hover:shadow-primary/30 uppercase tracking-[0.2em] shadow-primary/20"
                                            style={{
                                                background: 'var(--color-primary)',
                                                color: '#000',
                                            }}
                                        >
                                            Execute Payout
                                        </motion.button>
                                        
                                        {earningsWallet < (platformSettings.minWithdrawal || 10) && (
                                            <p className="text-[10px] text-center font-bold text-muted px-6 uppercase tracking-widest opacity-60">
                                                Balance must be at least {currencySymbol}{platformSettings.minWithdrawal || 10} to initiate payout
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="rounded-[32px] p-12 border border-dashed border-border/50 text-center space-y-4 bg-surface/30">
                                    <div className="w-20 h-20 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto mb-6">
                                        <ShieldCheck size={40} className="text-orange-500" />
                                    </div>
                                    <h3 className="text-xl font-black tracking-tight uppercase">Verification Required</h3>
                                    <p className="text-xs font-bold text-muted max-w-xs mx-auto leading-relaxed">
                                        Identity verification (KYC) and at least {platformSettings.minReferralsForWithdrawal || 5} successful referrals are required to unlock payout features.
                                    </p>
                                    <div className="pt-6">
                                        <button 
                                            onClick={() => document.getElementById('kyc-section')?.scrollIntoView({ behavior: 'smooth' })}
                                            className="px-8 py-3 rounded-xl bg-bg border-2 border-primary text-primary text-[10px] font-black uppercase tracking-[0.2em] hover:bg-primary hover:text-black transition-all"
                                        >
                                            Complete KYC
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'Linked' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-2">
                                <h3 className="text-sm font-black uppercase tracking-widest text-muted">Saved Accounts</h3>
                                <div className="px-3 py-1 bg-surface border rounded-full text-[10px] font-bold text-muted uppercase">PCI DSS Compliant</div>
                            </div>
                            
                            <div className="space-y-3">
                                {payoutMethods.map((acc) => (
                                    <motion.div
                                        key={acc.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="flex items-center gap-4 p-5 rounded-3xl group relative overflow-hidden"
                                        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                                    >
                                        <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors" />
                                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-bg shadow-inner relative z-10">
                                            <Link size={20} className="text-primary" />
                                        </div>
                                        <div className="flex-1 relative z-10">
                                            <p className="text-sm font-black tracking-tight" style={{ color: 'var(--color-text)' }}>
                                                {acc.type === 'upi' ? 'Unified Payments (UPI)' : (acc.bankName || 'Digital Banking')}
                                            </p>
                                            <p className="text-xs font-bold text-muted opacity-60">
                                                {acc.type === 'upi' ? acc.upiId : `A/C •••• ${acc.accountNumber.slice(-4)} • ${acc.ifscCode}`}
                                            </p>
                                        </div>
                                        {acc.primary && (
                                            <span className="text-[10px] px-3 py-1 rounded-full font-black uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/10 relative z-10">
                                                Primary
                                            </span>
                                        )}
                                    </motion.div>
                                ))}
                            </div>

                            <div className="mt-8 rounded-[32px] p-8 border shadow-sm space-y-6" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                                <div className="space-y-1">
                                    <h4 className="text-sm font-black text-text uppercase tracking-widest">Connect New Account</h4>
                                    <p className="text-[10px] font-bold text-muted leading-tight">Linked accounts can be used for instant withdrawals.</p>
                                </div>
                                
                                <div className="space-y-4">
                                    <select
                                        value={linkMethodType}
                                        onChange={(e) => setLinkMethodType(e.target.value)}
                                        className="w-full px-5 h-14 rounded-2xl text-[11px] font-black uppercase tracking-widest outline-none bg-bg border appearance-none"
                                        style={{ color: 'var(--color-text)', borderColor: 'var(--color-border)' }}
                                    >
                                        <option value="upi">UPI ID</option>
                                        <option value="bank">Direct Bank Account</option>
                                    </select>
                                    
                                    {linkMethodType === 'upi' ? (
                                        <div className="grid grid-cols-1 gap-3">
                                            <input
                                                type="text"
                                                placeholder="Legal Name (As per Bank)"
                                                value={linkUpiName}
                                                onChange={(e) => setLinkUpiName(e.target.value)}
                                                className="w-full px-5 h-14 rounded-2xl text-sm font-bold bg-bg border outline-none focus:border-primary transition-all"
                                                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                                            />
                                            <input
                                                type="text"
                                                placeholder="upi-id@bankname"
                                                value={linkUpiId}
                                                onChange={(e) => setLinkUpiId(e.target.value)}
                                                className="w-full px-5 h-14 rounded-2xl text-sm font-bold bg-bg border outline-none focus:border-primary transition-all"
                                                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                                            />
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 gap-3">
                                            <input
                                                type="text"
                                                placeholder="Bank Center Name"
                                                value={linkBankName}
                                                onChange={(e) => setLinkBankName(e.target.value)}
                                                className="w-full px-5 h-14 rounded-2xl text-sm font-bold bg-bg border"
                                                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                                            />
                                            <input
                                                type="text"
                                                placeholder="Account Holder Legal Name"
                                                value={linkBankAccountHolder}
                                                onChange={(e) => setLinkBankAccountHolder(e.target.value)}
                                                className="w-full px-5 h-14 rounded-2xl text-sm font-bold bg-bg border"
                                                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                                            />
                                            <div className="grid grid-cols-2 gap-3">
                                                <input
                                                    type="text"
                                                    placeholder="Account Number"
                                                    value={linkBankAccountNumber}
                                                    onChange={(e) => setLinkBankAccountNumber(e.target.value)}
                                                    className="w-full px-5 h-14 rounded-2xl text-sm font-bold bg-bg border"
                                                    style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="IFSC Code"
                                                    value={linkBankIFSC}
                                                    onChange={(e) => setLinkBankIFSC(e.target.value.toUpperCase())}
                                                    className="w-full px-5 h-14 rounded-2xl text-sm font-bold bg-bg border"
                                                    style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                    <motion.button
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => {
                                            if (linkMethodType === 'upi') {
                                                addPayoutMethod({ type: 'upi', holderName: linkUpiName, upiId: linkUpiId })
                                                setLinkUpiId('')
                                                setLinkUpiName('')
                                                return
                                            }
                                            addPayoutMethod({
                                                type: 'bank',
                                                bankName: linkBankName,
                                                accountHolder: linkBankAccountHolder,
                                                accountNumber: linkBankAccountNumber,
                                                ifscCode: linkBankIFSC,
                                            })
                                            setLinkBankName('')
                                            setLinkBankAccountHolder('')
                                            setLinkBankAccountNumber('')
                                            setLinkBankIFSC('')
                                        }}
                                        className="w-full py-4 rounded-[20px] text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
                                        style={{ background: 'var(--color-primary)', color: '#000' }}
                                    >
                                        Authorize & Link Account
                                    </motion.button>
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    )
}
