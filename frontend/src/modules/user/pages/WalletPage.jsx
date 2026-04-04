import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Gift, CheckSquare, Gem, Link, ShieldCheck, AlertTriangle, Loader2 } from 'lucide-react'
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
    const canWithdraw = kyc.payoutsUnlocked && !kyc.riskFlag && hasWithdrawalAmount && hasWithdrawalDestination

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
        
        if (result?.ok && result.orderId) {
            const options = {
                key: result.keyId,
                amount: result.amount,
                currency: result.currency,
                name: "K & Q Reels",
                description: "Wallet Recharge",
                order_id: result.orderId,
                handler: async function (response) {
                    setWalletActionMessage('Verifying payment...')
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
            setWalletActionMessage(result?.message || 'Gateway unavailable.');
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

    const runWalletAction = (result, successMessage) => {
        if (result?.ok) {
            setWalletActionMessage(successMessage)
            return
        }
        setWalletActionMessage(result?.message || 'Action failed.')
    }

    return (
        <div className="px-4 pt-4">
            {/* Header */}
            <h1 className="text-xl font-extrabold mb-4" style={{ color: 'var(--color-text)' }}>Wallet</h1>
            {walletError && (
                <div className="mb-4 rounded-xl px-3 py-2 text-xs font-semibold"
                    style={{ background: 'rgba(244,63,94,0.12)', color: 'var(--color-danger)' }}>
                    {walletError}
                </div>
            )}

            {/* New 3 separate wallet cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {/* INR Wallet Card */}
                <motion.div 
                    whileHover={{ y: -2 }}
                    className="rounded-3xl p-6 relative overflow-hidden shadow-xl"
                    style={{ 
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
                        color: '#fff' 
                    }}
                >
                    <div className="relative z-10">
                        <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-2">{currencyCode} WALLET</p>
                        <h2 className="text-4xl font-black mb-4">
                            {currencySymbol}{Math.round(inrWallet).toLocaleString()}
                        </h2>
                        <div className="flex gap-2">
                             <button
                                onClick={() => setActiveTab('Linked')}
                                className="px-4 py-2 rounded-xl text-xs font-bold bg-white/20 hover:bg-white/30 transition-colors"
                            >
                                Top up
                            </button>
                        </div>
                    </div>
                    {/* Abstract background element */}
                    <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-white/10 rounded-full blur-3xl" />
                </motion.div>

                {/* Crypto Wallet Card */}
                <motion.div 
                    whileHover={{ y: -2 }}
                    className="rounded-3xl p-6 relative overflow-hidden shadow-xl"
                    style={{ 
                        background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', 
                        color: '#fff' 
                    }}
                >
                    <div className="relative z-10">
                        <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-2">CRYPTO WALLET</p>
                        <h2 className="text-4xl font-black mb-1">
                            {Number(cryptoWallet || 0).toFixed(4)} <span className="text-xl font-medium">ETH</span>
                        </h2>
                        <p className="text-[10px] opacity-70 mb-4">
                            ≈ {currencySymbol}{Math.round(cryptoWallet * walletRates.inrPerCrypto).toLocaleString()}
                        </p>
                        <button
                            onClick={() => setActiveTab('Linked')}
                            className="px-4 py-2 rounded-xl text-xs font-bold bg-white/20 hover:bg-white/30 transition-colors"
                        >
                            Manage
                        </button>
                    </div>
                    <div className="absolute bottom-[-20%] right-[-10%] w-40 h-40 bg-white/10 rounded-full blur-3xl" />
                </motion.div>

                {/* Earning Wallet Card */}
                <motion.div 
                    whileHover={{ y: -2 }}
                    className="rounded-3xl p-6 relative overflow-hidden shadow-xl border border-white/10"
                    style={{ 
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', 
                        color: '#fff' 
                    }}
                >
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-xs font-bold uppercase tracking-widest opacity-80">EARNING WALLET</p>
                            {earningsWallet >= platformSettings.minWithdrawal && (
                                <span className="bg-green-500/30 text-[10px] font-black px-2 py-1 rounded-full uppercase">Ready to Withdraw</span>
                            )}
                        </div>
                        <h2 className="text-4xl font-black mb-4">
                            {currencySymbol}{Math.round(earningsWallet).toLocaleString()}
                        </h2>
                        
                        {/* Withdrawal Progress */}
                        {earningsWallet < platformSettings.minWithdrawal ? (
                            <div className="mb-4">
                                <div className="flex justify-between text-[10px] font-bold mb-1 opacity-90">
                                    <span>Withdrawal Progress</span>
                                    <span>{Math.round((earningsWallet / platformSettings.minWithdrawal) * 100)}%</span>
                                </div>
                                <div className="h-2 bg-black/20 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-white transition-all duration-500" 
                                        style={{ width: `${Math.min(100, (earningsWallet / platformSettings.minWithdrawal) * 100)}%` }}
                                    />
                                </div>
                                <p className="text-[10px] mt-2 opacity-80 italic">
                                    Add {currencySymbol}{platformSettings.minWithdrawal - earningsWallet} more to unlock withdrawal
                                </p>
                            </div>
                        ) : (
                            <button
                                onClick={() => setActiveTab('Withdraw')}
                                className="px-4 py-2 rounded-xl text-xs font-bold bg-white text-orange-600 hover:bg-orange-50 transition-colors"
                            >
                                Withdraw Now
                            </button>
                        )}
                    </div>
                    <div className="absolute top-[10%] right-[-15%] w-48 h-48 bg-white/10 rounded-full blur-3xl rotate-45" />
                </motion.div>
            </div>

            {/* Wallet Actions (Integrated into Tabs if possible, or keeping separate for now) */}
                <div className="rounded-2xl p-5" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                     <p className="text-sm font-black mb-4" style={{ color: 'var(--color-text)' }}>INR Quick Recharge</p>
                     <div className="flex flex-wrap gap-2 mb-4">
                        {[100, 200, 500].map(amt => (
                            <button
                                key={amt}
                                disabled={isProcessingPayment}
                                onClick={() => handleQuickAdd(amt)}
                                className="px-4 py-2 rounded-xl text-[11px] font-black transition-all border shadow-sm active:scale-95 bg-white dark:bg-zinc-800 text-orange-500 border-orange-500/20"
                            >
                                +{currencySymbol}{amt}
                            </button>
                        ))}
                    </div>
                    <div className="relative mt-2">
                        <label className="text-[10px] font-black text-muted uppercase tracking-wider mb-2 block">Or Enter Custom Amount</label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-muted">{currencySymbol}</span>
                                <input
                                    type="number"
                                    value={addInrAmount}
                                    onChange={(e) => setAddInrAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full h-11 pl-9 pr-4 rounded-xl border bg-bg text-sm font-black outline-none focus:border-primary transition-all"
                                    style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                                />
                            </div>
                            <button
                                disabled={isProcessingPayment || !addInrAmount || Number(addInrAmount) <= 0}
                                onClick={() => handleQuickAdd(addInrAmount)}
                                className="px-6 h-11 rounded-xl bg-primary text-black text-[11px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30 shrink-0"
                            >
                                {isProcessingPayment ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Recharge'}
                            </button>
                        </div>
                    </div>
                </div>

            {walletActionMessage && (
                <p className="text-[11px] mb-4 text-center font-bold px-4 py-2 rounded-lg bg-orange-500/10 text-orange-600">
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
                className="rounded-2xl p-3 mb-4 flex items-center justify-between gap-3"
                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
            >
                <div className="flex items-center gap-2">
                    <ShieldCheck size={15} style={{ color: kyc.status === 'verified' ? 'var(--color-success)' : 'var(--color-primary)' }} />
                    <div>
                        <p className="text-xs font-semibold" style={{ color: 'var(--color-text)' }}>
                            Compliance Status: {kyc.status.toUpperCase()}
                        </p>
                        <p className="text-[10px]" style={{ color: 'var(--color-muted)' }}>
                            Level {kyc.level} · {kyc.payoutsUnlocked ? 'Payouts enabled' : 'KYC required for payouts'}
                        </p>
                        <p className="text-[10px]" style={{ color: 'var(--color-muted)' }}>
                            Platform rules: {platformSettings.commission}% fee · Min withdraw {currencySymbol}{platformSettings.minWithdrawal}
                        </p>
                    </div>
                </div>
                {kyc.riskFlag && (
                    <span className="text-[10px] font-semibold px-2 py-1 rounded-full"
                        style={{ background: 'rgba(244,63,94,0.12)', color: 'var(--color-danger)' }}>
                        Risk Hold
                    </span>
                )}
            </div>

            {/* Weekly bar chart */}
            <div
                className="rounded-2xl p-4 mb-4"
                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
            >
                <p className="text-xs font-semibold mb-3" style={{ color: 'var(--color-muted)' }}>This Week</p>
                <div className="flex items-end gap-2 h-16">
                    {weeklyEarnings.map((d, i) => {
                        const pct = (d.amount / MAX_WEEKLY) * 100
                        const isToday = i === TODAY_IDX
                        return (
                            <div key={d.day} className="flex flex-col items-center gap-1 flex-1">
                                <div className="w-full rounded-t-sm" style={{
                                    height: `${pct}%`,
                                    minHeight: 4,
                                    background: isToday ? 'var(--color-primary)' : 'var(--color-surface2)',
                                    transition: 'all 0.3s',
                                }} />
                                <span className="text-[10px]" style={{ color: isToday ? 'var(--color-primary)' : 'var(--color-muted)' }}>
                                    {d.day}
                                </span>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b mb-3" style={{ borderColor: 'var(--color-border)' }}>
                {TABS.map((tab) => {
                    const active = tab === activeTab
                    return (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className="flex-1 pb-2.5 text-sm font-semibold cursor-pointer transition-colors duration-150 relative"
                            style={{ color: active ? 'var(--color-primary)' : 'var(--color-muted)' }}
                        >
                            {tab}
                            {active && (
                                <motion.div
                                    layoutId="wallet-tab"
                                    className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                                    style={{ background: 'var(--color-primary)' }}
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
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                >
                    {activeTab === 'Transactions' && (
                        <div>
                            <div className="mb-3 rounded-xl px-3 py-2 text-[11px] flex items-center justify-between"
                                style={{ background: 'var(--color-surface2)', color: 'var(--color-muted)' }}>
                                <span>Ledger reconciliation</span>
                                <span className="font-semibold">{earningsLedger.filter((e) => e.status === 'reconciled').length}/{earningsLedger.length} reconciled</span>
                            </div>
                            {transactions.map((tx) => (
                                <TransactionItem key={tx.id} tx={tx} currencySymbol={currencySymbol} />
                            ))}
                        </div>
                    )}

                    {activeTab === 'Withdraw' && (
                        <div className="flex flex-col gap-5 py-4">
                            {kyc.status !== 'verified' ? (
                                <div className="rounded-3xl p-6" style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)' }}>
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-orange-500/10 shrink-0">
                                            <AlertTriangle size={20} className="text-orange-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-base font-bold text-zinc-900 dark:text-white">KYC Verification Pending</p>
                                            <p className="text-xs mt-1 text-zinc-500 leading-relaxed">
                                                To ensure secure transactions, please complete your KYC by uploading your Aadhaar card and completing 5 referrals.
                                            </p>
                                            
                                            <div className="mt-5 space-y-3">
                                                <input
                                                    type="text"
                                                    value={kycReferralCode}
                                                    onChange={(e) => setKycReferralCode(e.target.value)}
                                                    placeholder="Enter Referral Code"
                                                    className="w-full px-4 py-3 rounded-2xl text-sm outline-none border focus:ring-2 ring-orange-500/20 transition-all font-medium"
                                                    style={{ background: 'var(--color-surface)', color: 'var(--color-text)', borderColor: 'var(--color-border)' }}
                                                />
                                                <div className="grid grid-cols-2 gap-3">
                                                    <label className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 border-dashed cursor-pointer hover:bg-orange-500/5 transition-colors"
                                                        style={{ borderColor: 'var(--color-border)' }}>
                                                        <ShieldCheck size={20} className="text-zinc-400" />
                                                        <span className="text-[10px] font-bold text-zinc-500 text-center">
                                                            {kycAadharFront?.name || kyc.aadharFrontName || 'Front Side'}
                                                        </span>
                                                        <input type="file" accept="image/*,.pdf" onChange={(e) => setKycAadharFront(e.target.files?.[0] || null)} className="hidden" />
                                                    </label>
                                                    <label className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 border-dashed cursor-pointer hover:bg-orange-500/5 transition-colors"
                                                        style={{ borderColor: 'var(--color-border)' }}>
                                                        <ShieldCheck size={20} className="text-zinc-400" />
                                                        <span className="text-[10px] font-bold text-zinc-500 text-center">
                                                            {kycAadharBack?.name || kyc.aadharBackName || 'Back Side'}
                                                        </span>
                                                        <input type="file" accept="image/*,.pdf" onChange={(e) => setKycAadharBack(e.target.files?.[0] || null)} className="hidden" />
                                                    </label>
                                                </div>
                                                
                                                <div className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight">Referral Progress</span>
                                                        <span className="text-sm font-black text-zinc-900 dark:text-white">
                                                            {kyc.referredCount} <span className="text-zinc-400">/ {kyc.requiredReferrals}</span>
                                                        </span>
                                                    </div>
                                                    <button
                                                        onClick={handleReferralIncrement}
                                                        className="px-4 py-2 rounded-xl text-xs font-black bg-orange-500 text-white shadow-lg shadow-orange-500/20 active:scale-95 transition-all"
                                                    >
                                                        +1 Demo
                                                    </button>
                                                </div>
                                                
                                                <button
                                                    onClick={handleSubmitKYC}
                                                    disabled={!canSubmitKYC}
                                                    className="w-full py-4 rounded-2xl text-sm font-black bg-zinc-900 dark:bg-white text-white dark:text-black disabled:opacity-30 transition-all shadow-xl"
                                                >
                                                    Submit for Verification
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : null}

                            <div className="space-y-4">
                                <div className="p-1 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex">
                                    {['upi', 'bank'].map((m) => (
                                        <button
                                            key={m}
                                            onClick={() => setWithdrawMethod(m)}
                                            className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${withdrawMethod === m ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white' : 'text-zinc-400'}`}
                                        >
                                            {m.toUpperCase()}
                                        </button>
                                    ))}
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    <div className="relative">
                                        <label className="absolute -top-2 left-4 px-1 text-[10px] font-black bg-white dark:bg-[#121212] text-zinc-400 z-10">AMOUNT TO WITHDRAW</label>
                                        <div className="flex items-center px-4 h-14 rounded-2xl border bg-white dark:bg-zinc-900/50" style={{ borderColor: 'var(--color-border)' }}>
                                            <span className="text-lg font-black mr-2 text-zinc-900 dark:text-zinc-100">{currencySymbol}</span>
                                            <input
                                                type="number"
                                                placeholder={`Min. ${platformSettings.minWithdrawal}`}
                                                value={withdrawAmount}
                                                onChange={(e) => setWithdrawAmount(e.target.value)}
                                                className="bg-transparent border-none outline-none text-lg font-black w-full"
                                            />
                                        </div>
                                    </div>

                                    {withdrawMethod === 'upi' ? (
                                        <div className="relative">
                                            <label className="absolute -top-2 left-4 px-1 text-[10px] font-black bg-white dark:bg-[#121212] text-zinc-400 z-10">UPI ID</label>
                                            <input
                                                type="text"
                                                placeholder="name@bank-id"
                                                value={withdrawUpiId}
                                                onChange={(e) => setWithdrawUpiId(e.target.value)}
                                                className="w-full px-4 h-14 rounded-2xl text-sm outline-none border focus:ring-2 ring-orange-500/20 transition-all font-bold bg-white dark:bg-zinc-900/50"
                                                style={{ color: 'var(--color-text)', borderColor: 'var(--color-border)' }}
                                            />
                                        </div>
                                    ) : (
                                        <>
                                            <input
                                                type="text"
                                                placeholder="Account Number"
                                                value={withdrawAccountNumber}
                                                onChange={(e) => setWithdrawAccountNumber(e.target.value)}
                                                className="w-full px-4 h-14 rounded-2xl border font-bold text-sm bg-white dark:bg-zinc-900/50"
                                                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                                            />
                                            <input
                                                type="text"
                                                placeholder="IFSC Code"
                                                value={withdrawIFSC}
                                                onChange={(e) => setWithdrawIFSC(e.target.value.toUpperCase())}
                                                className="w-full px-4 h-14 rounded-2xl border font-bold text-sm bg-white dark:bg-zinc-900/50"
                                                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                                            />
                                        </>
                                    )}
                                </div>

                                <motion.button
                                    whileTap={{ scale: 0.98 }}
                                    onClick={async () => {
                                        const result = await requestWithdrawal(withdrawAmount, withdrawMethod === 'upi'
                                            ? { type: 'upi', upiId: withdrawUpiId.trim().toLowerCase() }
                                            : { type: 'bank', accountNumber: withdrawAccountNumber.trim(), ifscCode: withdrawIFSC.trim().toUpperCase() })
                                        runWalletAction(result, 'Withdrawal request created successfully!')
                                        if (result?.ok) setWithdrawAmount('')
                                    }}
                                    disabled={!canWithdraw}
                                    className="w-full py-4 rounded-2xl text-sm font-black transition-all shadow-xl shadow-orange-500/20 disabled:opacity-30"
                                    style={{
                                        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                                        color: '#fff',
                                    }}
                                >
                                    Proceed to Withdrawal
                                </motion.button>
                                
                                {earningsWallet < platformSettings.minWithdrawal && (
                                    <p className="text-[10px] text-center font-bold text-zinc-400 px-6 uppercase tracking-wider">
                                        Need {currencySymbol}{Math.max(0, platformSettings.minWithdrawal - earningsWallet)} more for minimum payout
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'Linked' && (
                        <div className="flex flex-col gap-3 py-2">
                            {payoutMethods.map((acc) => (
                                <div
                                    key={acc.id}
                                    className="flex items-center gap-3 p-4 rounded-2xl"
                                    style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                                >
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-surface2)' }}>
                                        <Link size={18} style={{ color: 'var(--color-primary)' }} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                                            {acc.type === 'upi' ? 'UPI' : (acc.bankName || 'Bank Account')}
                                        </p>
                                        <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                                            {acc.type === 'upi' ? acc.upiId : `A/C ${acc.accountNumber} · ${acc.ifscCode}`}
                                        </p>
                                    </div>
                                    {acc.primary && (
                                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                                            style={{ background: 'rgba(16,185,129,0.12)', color: 'var(--color-success)' }}>
                                            Primary
                                        </span>
                                    )}
                                </div>
                            ))}
                            <div className="mt-2 rounded-2xl p-3" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                                <p className="text-xs font-semibold mb-2" style={{ color: 'var(--color-text)' }}>Add payout account</p>
                                <select
                                    value={linkMethodType}
                                    onChange={(e) => setLinkMethodType(e.target.value)}
                                    className="w-full px-3 py-2 mb-2 rounded-lg text-xs outline-none"
                                    style={{ background: 'var(--color-surface2)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
                                >
                                    <option value="upi">UPI</option>
                                    <option value="bank">Bank Account</option>
                                </select>
                                {linkMethodType === 'upi' ? (
                                    <div className="grid grid-cols-1 gap-2">
                                        <input
                                            type="text"
                                            placeholder="Account holder name"
                                            value={linkUpiName}
                                            onChange={(e) => setLinkUpiName(e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg text-xs outline-none"
                                            style={{ background: 'var(--color-surface2)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
                                        />
                                        <input
                                            type="text"
                                            placeholder="name@bank"
                                            value={linkUpiId}
                                            onChange={(e) => setLinkUpiId(e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg text-xs outline-none"
                                            style={{ background: 'var(--color-surface2)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
                                        />
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-2">
                                        <input
                                            type="text"
                                            placeholder="Bank name"
                                            value={linkBankName}
                                            onChange={(e) => setLinkBankName(e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg text-xs outline-none"
                                            style={{ background: 'var(--color-surface2)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
                                        />
                                        <input
                                            type="text"
                                            placeholder="Account holder name"
                                            value={linkBankAccountHolder}
                                            onChange={(e) => setLinkBankAccountHolder(e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg text-xs outline-none"
                                            style={{ background: 'var(--color-surface2)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
                                        />
                                        <input
                                            type="text"
                                            placeholder="Account number"
                                            value={linkBankAccountNumber}
                                            onChange={(e) => setLinkBankAccountNumber(e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg text-xs outline-none"
                                            style={{ background: 'var(--color-surface2)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
                                        />
                                        <input
                                            type="text"
                                            placeholder="IFSC code"
                                            value={linkBankIFSC}
                                            onChange={(e) => setLinkBankIFSC(e.target.value.toUpperCase())}
                                            className="w-full px-3 py-2 rounded-lg text-xs outline-none"
                                            style={{ background: 'var(--color-surface2)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
                                        />
                                    </div>
                                )}
                                <motion.button
                                    whileTap={{ scale: 0.96 }}
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
                                    className="w-full py-2 rounded-lg text-xs font-semibold cursor-pointer mt-2"
                                    style={{ background: 'var(--color-primary)', color: '#fff' }}
                                >
                                    Save account
                                </motion.button>
                            </div>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    )
}
