import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Gift, CheckSquare, Gem, Link, ShieldCheck, AlertTriangle } from 'lucide-react'
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
    } = useWalletStore()
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
            if (event.key === 'socialearn_kyc_sync_v1') hydrate()
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

            {/* Balance hero */}
            <div
                className="rounded-2xl p-5 mb-4 text-center"
                style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(249,115,22,0.08))', border: '1px solid rgba(245,158,11,0.2)' }}
            >
                <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--color-primary)' }}>
                    Total Balance
                </p>
                <AnimatePresence mode="popLayout">
                    <motion.p
                        key={balance}
                        className="text-4xl font-extrabold"
                        style={{ color: 'var(--color-text)', letterSpacing: '-0.02em' }}
                        initial={{ y: -10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                    >
                        {currencySymbol}{balance.toLocaleString()}
                    </motion.p>
                </AnimatePresence>
                <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
                    Earnings wallet available for withdrawal
                </p>
            </div>

            <div className="rounded-2xl p-4 mb-4" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                <p className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text)' }}>Wallet Balances</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
                    <div className="rounded-xl px-3 py-2" style={{ background: 'var(--color-surface2)' }}>
                        <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>{currencyCode} Wallet</p>
                        <p className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>{currencySymbol}{Math.round(inrWallet)}</p>
                    </div>
                    <div className="rounded-xl px-3 py-2" style={{ background: 'var(--color-surface2)' }}>
                        <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>Crypto Wallet</p>
                        <p className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>{Number(cryptoWallet || 0).toFixed(4)} ETH</p>
                    </div>
                    <div className="rounded-xl px-3 py-2" style={{ background: 'var(--color-surface2)' }}>
                        <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>Earning Wallet</p>
                        <p className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>{currencySymbol}{Math.round(earningsWallet)}</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="rounded-xl p-3" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
                        <p className="text-xs font-semibold mb-2" style={{ color: 'var(--color-text)' }}>Add money to {currencyCode} wallet</p>
                        <div className="flex gap-2">
                            <input
                                type="number"
                                value={addInrAmount}
                                onChange={(e) => setAddInrAmount(e.target.value)}
                                placeholder={`Amount in ${currencyCode}`}
                                className="flex-1 px-3 py-2 rounded-lg text-xs outline-none"
                                style={{ background: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
                            />
                            <button
                                onClick={async () => {
                                    const result = await addFundsToWallet({ wallet: 'inr', amount: addInrAmount })
                                    runWalletAction(result, 'INR wallet updated.')
                                    if (result?.ok) setAddInrAmount('')
                                }}
                                className="px-3 py-2 rounded-lg text-xs font-semibold"
                                style={{ background: 'var(--color-primary)', color: '#fff' }}
                            >
                                Add
                            </button>
                        </div>
                    </div>
                    <div className="rounded-xl p-3" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
                        <p className="text-xs font-semibold mb-2" style={{ color: 'var(--color-text)' }}>Add money to Crypto wallet</p>
                        <div className="flex gap-2">
                            <input
                                type="number"
                                value={addCryptoAmount}
                                onChange={(e) => setAddCryptoAmount(e.target.value)}
                                placeholder="Amount in ETH"
                                className="flex-1 px-3 py-2 rounded-lg text-xs outline-none"
                                style={{ background: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
                            />
                            <button
                                onClick={async () => {
                                    const result = await addFundsToWallet({ wallet: 'crypto', amount: addCryptoAmount })
                                    runWalletAction(result, 'Crypto wallet updated.')
                                    if (result?.ok) setAddCryptoAmount('')
                                }}
                                className="px-3 py-2 rounded-lg text-xs font-semibold"
                                style={{ background: 'var(--color-primary)', color: '#fff' }}
                            >
                                Add
                            </button>
                        </div>
                    </div>
                </div>
                <div className="rounded-xl p-3 mt-3" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
                        <p className="text-xs font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
                        Move from earning wallet to gifting wallet
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-[1fr_130px_auto] gap-2">
                        <input
                            type="number"
                            value={transferAmount}
                            onChange={(e) => setTransferAmount(e.target.value)}
                            placeholder={`Amount in ${currencyCode}`}
                            className="px-3 py-2 rounded-lg text-xs outline-none"
                            style={{ background: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
                        />
                        <select
                            value={transferWallet}
                            onChange={(e) => setTransferWallet(e.target.value)}
                            className="px-3 py-2 rounded-lg text-xs outline-none"
                            style={{ background: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
                        >
                            <option value="inr">{currencyCode} Wallet</option>
                            <option value="crypto">Crypto Wallet</option>
                        </select>
                        <button
                            onClick={() => {
                                const result = transferEarningsToWallet({ wallet: transferWallet, amount: transferAmount })
                                runWalletAction(result, 'Amount moved from earnings wallet.')
                                if (result?.ok) setTransferAmount('')
                            }}
                            className="px-3 py-2 rounded-lg text-xs font-semibold"
                            style={{ background: 'var(--color-primary)', color: '#fff' }}
                        >
                            Move
                        </button>
                    </div>
                    <p className="text-[10px] mt-2" style={{ color: 'var(--color-muted)' }}>
                        Conversion used: 1 ETH = {currencySymbol}{walletRates.inrPerCrypto.toLocaleString()}
                    </p>
                </div>
                {walletActionMessage && (
                    <p className="text-[11px] mt-2 font-medium" style={{ color: 'var(--color-text)' }}>
                        {walletActionMessage}
                    </p>
                )}
            </div>

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
                        <div className="flex flex-col gap-4 py-2">
                            {kyc.status !== 'verified' && (
                                <div className="rounded-2xl p-4" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
                                    <div className="flex items-start gap-2">
                                        <AlertTriangle size={16} style={{ color: 'var(--color-primary)', marginTop: 2 }} />
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>KYC required before withdrawal</p>
                                            <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
                                                Upload Aadhaar (front + back) and maintain 5 referred onboardings.
                                            </p>
                                            <div className="mt-3 grid grid-cols-1 gap-2">
                                                <input
                                                    type="text"
                                                    value={kycReferralCode}
                                                    onChange={(e) => setKycReferralCode(e.target.value)}
                                                    placeholder="Referral code"
                                                    className="w-full px-3 py-2 rounded-lg text-xs outline-none"
                                                    style={{ background: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
                                                />
                                                <div className="grid grid-cols-2 gap-2">
                                                    <label className="block text-[10px] font-semibold px-3 py-2 rounded-lg cursor-pointer text-center"
                                                        style={{ background: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}>
                                                        {kycAadharFront?.name || kyc.aadharFrontName || 'Upload Aadhaar Front'}
                                                        <input
                                                            type="file"
                                                            accept="image/*,.pdf"
                                                            onChange={(e) => setKycAadharFront(e.target.files?.[0] || null)}
                                                            className="hidden"
                                                        />
                                                    </label>
                                                    <label className="block text-[10px] font-semibold px-3 py-2 rounded-lg cursor-pointer text-center"
                                                        style={{ background: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}>
                                                        {kycAadharBack?.name || kyc.aadharBackName || 'Upload Aadhaar Back'}
                                                        <input
                                                            type="file"
                                                            accept="image/*,.pdf"
                                                            onChange={(e) => setKycAadharBack(e.target.files?.[0] || null)}
                                                            className="hidden"
                                                        />
                                                    </label>
                                                </div>
                                                <div className="flex items-center justify-between rounded-lg px-3 py-2"
                                                    style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                                                    <p className="text-[11px]" style={{ color: 'var(--color-muted)' }}>
                                                        Referred onboardings: <span style={{ color: 'var(--color-text)', fontWeight: 700 }}>{kyc.referredCount}/{kyc.requiredReferrals}</span>
                                                    </p>
                                                    <button
                                                        onClick={handleReferralIncrement}
                                                        className="px-2 py-1 rounded-md text-[10px] font-semibold cursor-pointer"
                                                        style={{ background: 'rgba(245,158,11,0.14)', color: 'var(--color-primary)' }}
                                                    >
                                                        +1 Onboarded
                                                    </button>
                                                </div>
                                                <button
                                                    onClick={handleSubmitKYC}
                                                    type="button"
                                                    disabled={!canSubmitKYC}
                                                    className="px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-50"
                                                    style={{ background: 'var(--color-primary)', color: '#fff' }}
                                                >
                                                    Submit KYC
                                                </button>
                                                {kycMessage && (
                                                    <p className="text-[11px] font-medium" style={{ color: 'var(--color-text)' }}>
                                                        {kycMessage}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div>
                                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-sub)' }}>
                                    Amount (₹)
                                </label>
                                <input
                                    type="number"
                                    placeholder={`Min. ${currencySymbol}${platformSettings.minWithdrawal}`}
                                    value={withdrawAmount}
                                    onChange={(e) => setWithdrawAmount(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                                    style={{ background: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-sub)' }}>
                                    Payout method
                                </label>
                                <select
                                    value={withdrawMethod}
                                    onChange={(e) => setWithdrawMethod(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl text-sm outline-none cursor-pointer"
                                    style={{ background: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
                                >
                                    <option value="upi">UPI</option>
                                    <option value="bank">Bank Account</option>
                                </select>
                            </div>
                            {withdrawMethod === 'upi' ? (
                                <div>
                                    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-sub)' }}>
                                        UPI ID
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="name@bank"
                                        value={withdrawUpiId}
                                        onChange={(e) => setWithdrawUpiId(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                                        style={{ background: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
                                    />
                                </div>
                            ) : (
                                <>
                                    <div>
                                        <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-sub)' }}>
                                            Account Number
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Enter account number"
                                            value={withdrawAccountNumber}
                                            onChange={(e) => setWithdrawAccountNumber(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                                            style={{ background: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-sub)' }}>
                                            IFSC Code
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="SBIN0001234"
                                            value={withdrawIFSC}
                                            onChange={(e) => setWithdrawIFSC(e.target.value.toUpperCase())}
                                            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                                            style={{ background: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
                                        />
                                    </div>
                                </>
                            )}
                            <motion.button
                                whileTap={{ scale: 0.96 }}
                                onClick={async () => {
                                    const result = await requestWithdrawal(withdrawAmount, withdrawMethod === 'upi'
                                        ? { type: 'upi', upiId: withdrawUpiId.trim().toLowerCase() }
                                        : { type: 'bank', accountNumber: withdrawAccountNumber.trim(), ifscCode: withdrawIFSC.trim().toUpperCase() })
                                    runWalletAction(result, 'Withdrawal request submitted.')
                                    if (result?.ok) setWithdrawAmount('')
                                }}
                                disabled={!canWithdraw}
                                className="w-full py-3.5 rounded-xl text-sm font-bold cursor-pointer"
                                style={{
                                    background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary2))',
                                    color: '#fff',
                                    opacity: !canWithdraw ? 0.45 : 1,
                                }}
                            >
                                Withdraw Now
                            </motion.button>
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
