import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Gift, CheckSquare, Gem, Link, ShieldCheck, AlertTriangle, Loader2, Zap, Share2 } from 'lucide-react'
import { useWalletStore } from '../store/useWalletStore'
import { useUserStore } from '../store/useUserStore'
import { usePlatformSettings } from '../hooks/usePlatformSettings'
import { getKYCSubmissionByUser, patchKYCSubmission, upsertKYCSubmission } from '../../../shared/kycSync'
import WalletStatCard from '../components/wallet/WalletStatCard'
import TransactionItem from '../components/wallet/TransactionItem'
import { weeklyEarnings } from '../data/mockTransactions'

const TABS = ['Transactions', 'Withdraw', 'Linked']
const MAX_WEEKLY = Math.max(...weeklyEarnings.map((d) => d.amount))
const TODAY_IDX = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1

export default function WalletPage() {
    const {
        balance,
        inrWallet,
        cryptoWallet,
        earningsWallet,
        walletRates,
        giftEarnings,
        taskEarnings,
        nftEarnings,
        transactions,
        earningsLedger,
        payoutMethods,
        addFundsToWallet,
        transferEarningsToWallet,
        addPayoutMethod,
        requestWithdrawal,
        loadWallet,
        loadTransactions,
        walletLoading,
        transactionsLoading,
        walletError,
        initiateRecharge,
        verifyPayment,
    } = useWalletStore()
    const [searchParams, setSearchParams] = useSearchParams()
    const [isProcessingPayment, setIsProcessingPayment] = useState(false)
    const { kyc, submitKYC, incrementReferralOnboarded, setKYCFromSync, profile } = useUserStore()
    const currencySymbol = profile?.currencySymbol || '₹'
    const currencyCode = profile?.currencyCode || 'INR'
    const platformSettings = usePlatformSettings()
    const [activeTab, setActiveTab] = useState('Transactions')
    const [withdrawAmount, setWithdrawAmount] = useState('')
    const [withdrawMethod, setWithdrawMethod] = useState('upi')
    const [withdrawUpiId, setWithdrawUpiId] = useState('9876543210@upi')
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

    const hasAadharFront = Boolean(kycAadharFront) || Boolean(kyc.aadharFrontName)
    const hasAadharBack = Boolean(kycAadharBack) || Boolean(kyc.aadharBackName)
    const canSubmitKYC = Boolean(kycReferralCode.trim()) && hasAadharFront && hasAadharBack
    const hasWithdrawalAmount = Number(withdrawAmount || 0) >= platformSettings.minWithdrawal
    const hasWithdrawalDestination = withdrawMethod === 'upi'
        ? Boolean(withdrawUpiId.trim())
        : Boolean(withdrawAccountNumber.trim()) && Boolean(withdrawIFSC.trim())
    const canWithdraw = (profile.referralCount >= 5) && kyc.payoutsUnlocked && !kyc.riskFlag && hasWithdrawalAmount && hasWithdrawalDestination

    useEffect(() => {
        loadWallet()
        loadTransactions()
    }, [loadWallet, loadTransactions])

    useEffect(() => {
        const verify = async () => {
            const gateway = searchParams.get('gateway')
            const trx = searchParams.get('trx')
            const status = searchParams.get('status') || 'success'
            
            if (gateway && trx) {
                setWalletActionMessage('Verifying payment...')
                const res = await verifyPayment(trx, status)
                if (res.ok) {
                    setWalletActionMessage('Payment Successful!')
                    setTimeout(() => setWalletActionMessage(''), 5000)
                } else {
                    setWalletActionMessage(res.message || 'Payment Verification Failed.')
                }
                setSearchParams({}, { replace: true })
            }
        }
        verify()
    }, [searchParams, verifyPayment, setSearchParams])

    const handleQuickAdd = async (amount) => {
        const parsed = Number(amount)
        if (!parsed || parsed <= 0) return
        setIsProcessingPayment(true)
        setWalletActionMessage('Connecting to Secure Gateway...')
        const result = await initiateRecharge(parsed)
                if (result?.ok && result.orderId && result.keyId) {
            const options = {
                key: result.keyId,
                amount: result.amount,
                currency: result.currency,
                name: "K & Q Reels",
                description: "Wallet Recharge",
                order_id: result.orderId,
                handler: async function (response) {
                    setWalletActionMessage('Verifying payment...');
                    const verification = await verifyPayment(result.transactionId, {
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_signature: response.razorpay_signature
                    });

                    if (verification.ok) {
                        setWalletActionMessage('Payment Successful!');
                        setTimeout(() => setWalletActionMessage(''), 5000);
                        // Refresh wallet balance
                        loadWallet();
                        loadTransactions();
                    } else {
                        setWalletActionMessage(verification.message || 'Verification Failed');
                    }
                    setIsProcessingPayment(false);
                },
                modal: {
                    ondismiss: function() {
                        setIsProcessingPayment(false);
                        setWalletActionMessage('Payment cancelled.');
                    }
                },
                prefill: {
                    name: profile.fullName || profile.username,
                    email: profile.email || '',
                    contact: profile.phone || ''
                },
                theme: {
                    color: "#f59e0b"
                }
            };
            const rzp = new window.Razorpay(options);
            rzp.open();
        } else {
            console.error("Razorpay Config Error:", result);
            setWalletActionMessage(result?.message || 'Gateway config incomplete (Missing Key ID).');
            setIsProcessingPayment(false);
        }

    }

    useEffect(() => {
        const hydrate = () => {
            const synced = getKYCSubmissionByUser(kyc.syncUserId)
            if (synced) {
                setKYCFromSync(synced)
                setKycReferralCode(synced.referralCode || '')
            }
        }
        hydrate()
        const onSync = () => hydrate()
        const onStorage = (event) => {
            if (event.key === 'K & Q Reels_kyc_sync_v1') hydrate()
        }
        window.addEventListener('kyc-sync-updated', onSync)
        window.addEventListener('storage', onStorage)
        return () => {
            window.removeEventListener('kyc-sync-updated', onSync)
            window.removeEventListener('storage', onStorage)
        }
    }, [kyc.syncUserId, setKYCFromSync])

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
        try {
            setKycMessage('')
            const frontData = await toDataUrl(kycAadharFront)
            const backData = await toDataUrl(kycAadharBack)
            const payload = {
                userId: kyc.syncUserId,
                user: profile.username || 'User',
                referralCode: (kycReferralCode || '').trim().toUpperCase(),
                referredCount: kyc.referredCount || 0,
                requiredReferrals: kyc.requiredReferrals || 5,
                status: 'pending',
                aadharFront: frontData || '',
                aadharBack: backData || '',
                aadharFrontName: kycAadharFront?.name || kyc.aadharFrontName || '',
                aadharBackName: kycAadharBack?.name || kyc.aadharBackName || '',
                payoutsUnlocked: false,
            }
            submitKYC({
                referralCode: payload.referralCode,
                aadharFrontName: payload.aadharFrontName,
                aadharBackName: payload.aadharBackName,
            })
            upsertKYCSubmission(payload)
            setKycMessage('KYC submitted. Admin review will complete after 5 referral onboardings.')
        } catch {
            setKycMessage('KYC submission failed. Please re-upload Aadhaar and try again.')
        }
    }

    const handleReferralIncrement = () => {
        incrementReferralOnboarded()
        patchKYCSubmission(kyc.syncUserId, {
            referredCount: Math.min(100, (kyc.referredCount || 0) + 1),
        })
    }

    const handleShareReferral = async () => {
        const shareData = {
            title: 'K & Q Reels',
            text: `Join K & Q Reels and start earning! Use my referral code: ${profile.referralCode}`,
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
                <h1 className="text-2xl md:text-3xl font-black tracking-tight" style={{ color: 'var(--color-text)' }}>Wallet</h1>
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
                    className="rounded-2xl p-5 relative overflow-hidden shadow-lg border border-white/5"
                    style={{ 
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
                        color: '#fff' 
                    }}
                >
                    <div className="relative z-10 flex items-center justify-between">
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-70 mb-1">{currencyCode} BALANCE</p>
                            <h2 className="text-2xl font-black flex items-baseline gap-1">
                                <span className="text-sm font-medium opacity-50">{currencySymbol}</span>
                                {Math.round(inrWallet).toLocaleString()}
                            </h2>
                        </div>
                        <button
                            onClick={() => setActiveTab('Linked')}
                            className="px-4 py-2 rounded-xl text-[10px] font-black bg-white/20 hover:bg-white/30 backdrop-blur-md transition-all active:scale-95 uppercase tracking-widest"
                        >
                            Top up
                        </button>
                    </div>
                    <div className="absolute top-[-20%] right-[-10%] w-24 h-24 bg-white/10 rounded-full blur-2xl" />
                </motion.div>

                {/* Crypto Wallet Card */}
                <motion.div 
                    whileHover={{ scale: 1.01 }}
                    className="rounded-2xl p-5 relative overflow-hidden shadow-lg border border-white/5"
                    style={{ 
                        background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', 
                        color: '#fff' 
                    }}
                >
                    <div className="relative z-10 flex items-center justify-between">
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-70 mb-1">CRYPTO ASSETS</p>
                            <div className="flex items-baseline gap-2">
                                <h2 className="text-xl font-black truncate">
                                    {Number(cryptoWallet || 0).toFixed(3)} <span className="text-xs font-medium opacity-50">ETH</span>
                                </h2>
                                <span className="text-[9px] font-bold opacity-50 uppercase tracking-wider">
                                    ≈ {currencySymbol}{Math.round(cryptoWallet * walletRates.inrPerCrypto).toLocaleString()}
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={() => setActiveTab('Linked')}
                            className="px-4 py-2 rounded-xl text-[10px] font-black bg-white/20 hover:bg-white/30 backdrop-blur-md transition-all active:scale-95 uppercase tracking-widest"
                        >
                            Manage
                        </button>
                    </div>
                    <div className="absolute bottom-[-20%] right-[-10%] w-24 h-24 bg-white/10 rounded-full blur-2xl" />
                </motion.div>

                {/* Earning Wallet Card */}
                <motion.div 
                    whileHover={{ scale: 1.01 }}
                    className="rounded-2xl p-5 relative overflow-hidden shadow-lg border border-white/5"
                    style={{ 
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', 
                        color: '#fff' 
                    }}
                >
                    <div className="relative z-10 flex items-center justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-70">EARNING WALLET</p>
                                {earningsWallet >= 10 && (
                                    <span className="bg-white/20 backdrop-blur-md text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase">Unlock</span>
                                )}
                            </div>
                            <h2 className="text-2xl font-black flex items-baseline gap-1">
                                <span className="text-sm font-medium opacity-50">{currencySymbol}</span>
                                {Math.round(earningsWallet).toLocaleString()}
                            </h2>
                        </div>
                        
                        <div className="ml-4">
                            {earningsWallet < 10 ? (
                                <div className="w-24 space-y-1">
                                    <div className="flex justify-between text-[7px] font-black opacity-70 uppercase tracking-widest leading-none">
                                        <span>Payout Goal</span>
                                        <span>{Math.round((earningsWallet / 10) * 100)}%</span>
                                    </div>
                                    <div className="h-1 bg-black/20 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-white transition-all duration-700" 
                                            style={{ width: `${Math.min(100, (earningsWallet / 10) * 100)}%` }}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setActiveTab('Withdraw')}
                                    className="px-4 py-2 rounded-xl text-[10px] font-black bg-white text-orange-600 hover:bg-orange-50 transition-all active:scale-95 uppercase tracking-widest shadow-lg shadow-black/5"
                                >
                                    Withdraw
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="absolute top-[-10%] right-[-10%] w-24 h-24 bg-white/10 rounded-full blur-2xl" />
                </motion.div>
            </div>

            {/* Quick Actions */}
            <div className="rounded-[24px] p-6 mb-8 bg-surface border border-border/40 shadow-sm relative overflow-hidden group">
                <div className="relative z-10">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70 mb-4 flex items-center gap-2">
                        <Zap size={12} className="text-primary" />
                        Quick Recharge
                    </p>
                    <div className="flex flex-wrap gap-2 mb-6">
                        {[100, 200, 500].map(amt => (
                            <button
                                key={amt}
                                disabled={isProcessingPayment}
                                onClick={() => handleQuickAdd(amt)}
                                className="px-4 py-2 rounded-xl text-[10px] font-black transition-all border border-border/20 shadow-sm active:scale-95 bg-bg hover:bg-surface2 text-primary uppercase tracking-widest"
                            >
                                +{currencySymbol}{amt}
                            </button>
                        ))}
                    </div>
                    <div className="relative">
                        <div className="flex gap-2">
                            <div className="relative flex-1 group/input">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-muted group-focus-within/input:text-primary transition-colors">{currencySymbol}</span>
                                <input
                                    type="number"
                                    value={addInrAmount}
                                    onChange={(e) => setAddInrAmount(e.target.value)}
                                    placeholder="Enter custom amount"
                                    className="w-full h-12 pl-10 pr-4 rounded-xl border-2 bg-bg text-sm font-black outline-none border-transparent focus:border-primary/30 focus:bg-surface transition-all"
                                    style={{ color: 'var(--color-text)' }}
                                />
                            </div>
                            <button
                                disabled={isProcessingPayment || !addInrAmount || Number(addInrAmount) <= 0}
                                onClick={() => handleQuickAdd(addInrAmount)}
                                className="px-8 h-12 rounded-xl bg-primary text-black text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-20 shrink-0"
                            >
                                {isProcessingPayment ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Recharge'}
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
                        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted mb-0.5">
                            Status: <span className={kyc.status === 'verified' ? 'text-success' : 'text-primary'}>{kyc.status.toUpperCase()}</span>
                        </p>
                        <p className="text-xs font-bold text-text truncate">
                            Level {kyc.level} · {kyc.payoutsUnlocked ? 'Payouts enabled' : 'KYC required'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border/30 mb-8 overflow-x-auto no-scrollbar">
                {['Transactions', 'Withdraw', 'Linked'].map((tab) => {
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
                                    Share this platform with at least 5 friends to unlock your revenue stream.
                                </p>
                            </div>
                            {/* KYC Status Banner */}
                            {(kyc.status !== 'verified' || (profile.referralCount || 0) < 5) && (
                                <motion.div 
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
                                                Complete mandatory KYC and refer 5 members to enable earnings withdrawal.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-8 space-y-6 relative z-10">
                                        {/* Progress Trackers */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="p-4 rounded-2xl bg-bg/50 border border-border/50">
                                                <p className="text-[10px] font-black uppercase text-muted tracking-widest mb-2">Referrals</p>
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-xl font-black">{profile.referralCount || 0}<span className="text-sm text-muted">/5</span></span>
                                                    {profile.referralCount >= 5 && <div className="p-1 rounded-full bg-emerald-500"><ShieldCheck size={10} className="text-white" /></div>}
                                                </div>
                                                <div className="h-1.5 bg-border rounded-full overflow-hidden">
                                                    <div className="h-full bg-primary" style={{ width: `${Math.min(100, ((profile.referralCount || 0) / 5) * 100)}%` }} />
                                                </div>
                                            </div>
                                            <div className="p-4 rounded-2xl bg-bg/50 border border-border/50">
                                                <p className="text-[10px] font-black uppercase text-muted tracking-widest mb-2">KYC Status</p>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className={`w-3 h-3 rounded-full ${kyc.status === 'verified' ? 'bg-emerald-500' : 'bg-orange-500 animate-pulse'}`} />
                                                    <span className="text-xs font-black uppercase">{kyc.status}</span>
                                                </div>
                                                <p className="text-[9px] font-bold text-muted leading-tight">Admin approval pending</p>
                                            </div>
                                        </div>

                                        {kyc.status !== 'verified' && (
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    <label className="flex flex-col items-center justify-center gap-3 p-6 rounded-3xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 cursor-pointer transition-all group">
                                                        <div className="p-2 rounded-xl bg-surface group-hover:bg-primary group-hover:text-black transition-all rotate-3"><ShieldCheck size={20} /></div>
                                                        <span className="text-[10px] font-black uppercase text-muted text-center tracking-tighter">
                                                            {kycAadharFront?.name || kyc.aadharFrontName?.substring(0,10) || 'FRONT SIDE'}
                                                        </span>
                                                        <input type="file" accept="image/*,.pdf" onChange={(e) => setKycAadharFront(e.target.files?.[0] || null)} className="hidden" />
                                                    </label>
                                                    <label className="flex flex-col items-center justify-center gap-3 p-6 rounded-3xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 cursor-pointer transition-all group">
                                                        <div className="p-2 rounded-xl bg-surface group-hover:bg-primary group-hover:text-black transition-all -rotate-3"><ShieldCheck size={20} /></div>
                                                        <span className="text-[10px] font-black uppercase text-muted text-center tracking-tighter">
                                                            {kycAadharBack?.name || kyc.aadharBackName?.substring(0,10) || 'BACK SIDE'}
                                                        </span>
                                                        <input type="file" accept="image/*,.pdf" onChange={(e) => setKycAadharBack(e.target.files?.[0] || null)} className="hidden" />
                                                    </label>
                                                </div>
                                                
                                                <button
                                                    onClick={handleSubmitKYC}
                                                    disabled={!canSubmitKYC}
                                                    className="w-full py-4 rounded-[20px] text-[10px] font-black bg-text text-bg disabled:opacity-20 transition-all shadow-xl uppercase tracking-[0.2em] hover:scale-[1.01] active:scale-[0.98]"
                                                    style={{ background: 'var(--color-text)', color: 'var(--color-bg)' }}
                                                >
                                                    {kycMessage ? 'RE-SUBMIT REQUEST' : 'PROCEED TO VERIFICATION'}
                                                </button>
                                                {kycMessage && <p className="text-[10px] text-center font-bold text-orange-500">{kycMessage}</p>}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}

                            {/* Withdrawal Form */}
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
                                            <label className="text-[10px] font-black text-muted uppercase tracking-[0.2em] ml-1 mb-3 block">Withdrawal Amount</label>
                                            <div className="flex items-center px-5 h-14 rounded-2xl border-2 border-border/20 bg-bg transition-all group-within:border-primary/30 group-within:bg-surface">
                                                <span className="text-xl font-black mr-2 text-muted">{currencySymbol}</span>
                                                <input
                                                    type="number"
                                                    placeholder={`0.00`}
                                                    value={withdrawAmount}
                                                    onChange={(e) => {
                                                        const val = Number(e.target.value);
                                                        setWithdrawAmount(Math.min(val, earningsWallet));
                                                    }}
                                                    className="bg-transparent border-none outline-none text-xl font-black w-full text-text placeholder:text-muted/20"
                                                />
                                                <button 
                                                    onClick={() => setWithdrawAmount(Math.floor(earningsWallet))}
                                                    className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-[10px] font-black uppercase tracking-wider hover:bg-primary hover:text-black transition-all"
                                                >
                                                    MAX
                                                </button>
                                            </div>
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
                                    </div>

                                    <motion.button
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={async () => {
                                            const result = await requestWithdrawal(withdrawAmount, withdrawMethod === 'upi'
                                                ? { type: 'upi', upiId: withdrawUpiId.trim().toLowerCase() }
                                                : { type: 'bank', accountNumber: withdrawAccountNumber.trim(), ifscCode: withdrawIFSC.trim().toUpperCase() })
                                            if (result?.ok) {
                                                runWalletAction(result, 'Withdrawal request transmitted to treasury.')
                                                setWithdrawAmount('')
                                            } else {
                                                runWalletAction(result)
                                            }
                                        }}
                                        disabled={!canWithdraw}
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
