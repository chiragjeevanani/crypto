import { create } from 'zustand'
import { mockTransactions } from '../data/mockTransactions'
import { getPlatformSettingsFromCookie } from '../../../shared/platformSettings'

const INR_PER_CRYPTO = 60000

function round2(value) {
    return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100
}

export const useWalletStore = create((set, get) => ({
    inrWallet: 1800,
    cryptoWallet: 0.02,
    earningsWallet: 2847,
    balance: 2847, // kept for backward compatibility (withdrawable = earnings wallet)
    giftSpendWallet: 'inr', // inr | crypto
    walletRates: { inrPerCrypto: INR_PER_CRYPTO },

    giftEarnings: 1245,
    taskEarnings: 980,
    nftEarnings: 622,
    transactions: mockTransactions,
    activeTab: 'transactions',
    earningsLedger: [
        { id: 'led_1', source: 'gift', amount: 50, status: 'reconciled', createdAt: '2026-02-26T09:14:00Z' },
        { id: 'led_2', source: 'task', amount: 500, status: 'reconciled', createdAt: '2026-02-25T18:00:00Z' },
        { id: 'led_3', source: 'nft', amount: 180, status: 'pending', createdAt: '2026-02-24T12:00:00Z' },
    ],
    payoutMethods: [
        { id: 'pm_upi_1', type: 'upi', upiId: '9876543210@upi', holderName: 'Chirag J', primary: true },
        { id: 'pm_bank_1', type: 'bank', accountHolder: 'Chirag J', accountNumber: 'XXXXXX1234', ifscCode: 'SBIN0001234', bankName: 'SBI', primary: false },
    ],

    setActiveTab: (tab) => set({ activeTab: tab }),

    setGiftSpendWallet: (wallet) => {
        const next = wallet === 'crypto' ? 'crypto' : 'inr'
        set({ giftSpendWallet: next })
    },

    addFundsToWallet: ({ wallet, amount }) => {
        const parsed = Number(amount || 0)
        if (!Number.isFinite(parsed) || parsed <= 0) return { ok: false, message: 'Enter valid amount.' }
        if (wallet === 'crypto') {
            set((state) => ({
                cryptoWallet: round2(state.cryptoWallet + parsed),
                transactions: [
                    {
                        id: `tx_${Date.now()}`,
                        type: 'topup',
                        title: `Added ${parsed} ETH to crypto wallet`,
                        amount: Math.round(parsed * state.walletRates.inrPerCrypto),
                        date: new Date().toISOString(),
                        status: 'completed',
                    },
                    ...state.transactions,
                ],
            }))
            return { ok: true }
        }
        set((state) => ({
            inrWallet: round2(state.inrWallet + parsed),
            transactions: [
                {
                    id: `tx_${Date.now()}`,
                    type: 'topup',
                    title: 'Added money to INR wallet',
                    amount: Math.round(parsed),
                    date: new Date().toISOString(),
                    status: 'completed',
                },
                ...state.transactions,
            ],
        }))
        return { ok: true }
    },

    spendGiftFromSelectedWallet: (amount) => {
        const parsed = Number(amount || 0)
        const state = get()
        if (!Number.isFinite(parsed) || parsed <= 0) return { ok: false, message: 'Invalid gift amount.' }
        if (state.giftSpendWallet === 'crypto') {
            const neededCrypto = parsed / state.walletRates.inrPerCrypto
            if (state.cryptoWallet < neededCrypto) return { ok: false, message: 'Not enough Crypto wallet balance.' }
            set((prev) => ({
                cryptoWallet: round2(prev.cryptoWallet - neededCrypto),
                transactions: [
                    {
                        id: `tx_${Date.now()}`,
                        type: 'gift_sent',
                        title: 'Gift sent from Crypto wallet',
                        amount: -Math.round(parsed),
                        date: new Date().toISOString(),
                        status: 'completed',
                    },
                    ...prev.transactions,
                ],
            }))
            return { ok: true }
        }
        if (state.inrWallet < parsed) return { ok: false, message: 'Not enough INR wallet balance.' }
        set((prev) => ({
            inrWallet: round2(prev.inrWallet - parsed),
            transactions: [
                {
                    id: `tx_${Date.now()}`,
                    type: 'gift_sent',
                    title: 'Gift sent from INR wallet',
                    amount: -Math.round(parsed),
                    date: new Date().toISOString(),
                    status: 'completed',
                },
                ...prev.transactions,
            ],
        }))
        return { ok: true }
    },

    transferEarningsToWallet: ({ wallet, amount }) => {
        const parsed = Number(amount || 0)
        const state = get()
        if (!Number.isFinite(parsed) || parsed <= 0) return { ok: false, message: 'Enter valid amount.' }
        if (parsed > state.earningsWallet) return { ok: false, message: 'Not enough earnings balance.' }
        if (wallet === 'crypto') {
            const creditCrypto = parsed / state.walletRates.inrPerCrypto
            set((prev) => ({
                earningsWallet: round2(prev.earningsWallet - parsed),
                balance: round2(prev.earningsWallet - parsed),
                cryptoWallet: round2(prev.cryptoWallet + creditCrypto),
                transactions: [
                    {
                        id: `tx_${Date.now()}`,
                        type: 'transfer',
                        title: 'Moved earnings to Crypto wallet',
                        amount: -Math.round(parsed),
                        date: new Date().toISOString(),
                        status: 'completed',
                    },
                    ...prev.transactions,
                ],
            }))
            return { ok: true }
        }
        set((prev) => ({
            earningsWallet: round2(prev.earningsWallet - parsed),
            balance: round2(prev.earningsWallet - parsed),
            inrWallet: round2(prev.inrWallet + parsed),
            transactions: [
                {
                    id: `tx_${Date.now()}`,
                    type: 'transfer',
                    title: 'Moved earnings to INR wallet',
                    amount: -Math.round(parsed),
                    date: new Date().toISOString(),
                    status: 'completed',
                },
                ...prev.transactions,
            ],
        }))
        return { ok: true }
    },

    buyNft: (amount, title = 'NFT purchase') => {
        const parsed = Number(amount || 0)
        const state = get()
        if (!Number.isFinite(parsed) || parsed <= 0) return { ok: false, message: 'Invalid NFT price.' }
        if (state.inrWallet < parsed) return { ok: false, message: 'Not enough INR wallet balance.' }
        set((prev) => ({
            inrWallet: round2(prev.inrWallet - parsed),
            transactions: [
                {
                    id: `tx_${Date.now()}`,
                    type: 'nft_buy',
                    title: `Bought NFT: ${title}`,
                    amount: -Math.round(parsed),
                    date: new Date().toISOString(),
                    status: 'completed',
                },
                ...prev.transactions,
            ],
        }))
        return { ok: true }
    },

    addGiftEarning: (amount) => set((state) => {
        const gross = Math.round(Number(amount || 0))
        if (!Number.isFinite(gross) || gross <= 0) return state
        return {
            earningsWallet: round2(state.earningsWallet + gross),
            balance: round2(state.earningsWallet + gross),
            giftEarnings: round2(state.giftEarnings + gross),
            earningsLedger: [
                {
                    id: `led_${Date.now()}`,
                    source: 'gift',
                    amount: gross,
                    status: 'pending',
                    createdAt: new Date().toISOString(),
                },
                ...state.earningsLedger,
            ],
            transactions: [
                {
                    id: `tx_${Date.now()}`,
                    type: 'gift',
                    title: 'Gift received on your post',
                    amount: gross,
                    date: new Date().toISOString(),
                    status: 'completed',
                },
                ...state.transactions,
            ],
        }
    }),

    addNftEarning: (grossAmount, nftTitle = 'NFT Sale') => set((state) => {
        const gross = Number(grossAmount || 0)
        const commission = getPlatformSettingsFromCookie().commission || 0
        const net = Math.round((gross * (100 - commission)) / 100)
        if (!Number.isFinite(net) || net <= 0) return state
        return {
            earningsWallet: round2(state.earningsWallet + net),
            balance: round2(state.earningsWallet + net),
            nftEarnings: round2(state.nftEarnings + net),
            earningsLedger: [
                {
                    id: `led_${Date.now()}`,
                    source: 'nft',
                    amount: net,
                    status: 'pending',
                    createdAt: new Date().toISOString(),
                },
                ...state.earningsLedger,
            ],
            transactions: [
                {
                    id: `tx_${Date.now()}`,
                    type: 'nft',
                    title: `NFT sale — ${nftTitle}`,
                    amount: net,
                    date: new Date().toISOString(),
                    status: 'completed',
                },
                ...state.transactions,
            ],
        }
    }),

    addTaskEarning: (amount, brandName) => set((state) => ({
        earningsWallet: round2(state.earningsWallet + amount),
        balance: round2(state.earningsWallet + amount),
        taskEarnings: round2(state.taskEarnings + amount),
        earningsLedger: [
            {
                id: `led_${Date.now()}`,
                source: 'task',
                amount: +amount,
                status: 'pending',
                createdAt: new Date().toISOString(),
            },
            ...state.earningsLedger,
        ],
        transactions: [
            {
                id: `tx_${Date.now()}`,
                type: 'task',
                title: `Task reward — ${brandName}`,
                amount: +amount,
                date: new Date().toISOString(),
                status: 'completed',
            },
            ...state.transactions,
        ],
    })),

    addPayoutMethod: (payload) => set((state) => {
        const type = payload?.type === 'bank' ? 'bank' : 'upi'
        if (type === 'bank') {
            if (!payload.accountHolder || !payload.accountNumber || !payload.ifscCode) return state
            return {
                payoutMethods: [
                    {
                        id: `pm_${Date.now()}`,
                        type: 'bank',
                        accountHolder: payload.accountHolder.trim(),
                        accountNumber: payload.accountNumber.trim(),
                        ifscCode: payload.ifscCode.trim().toUpperCase(),
                        bankName: payload.bankName?.trim() || 'Bank',
                        primary: state.payoutMethods.length === 0,
                    },
                    ...state.payoutMethods,
                ],
            }
        }
        if (!payload.upiId || !payload.holderName) return state
        return {
            payoutMethods: [
                {
                    id: `pm_${Date.now()}`,
                    type: 'upi',
                    upiId: payload.upiId.trim().toLowerCase(),
                    holderName: payload.holderName.trim(),
                    primary: state.payoutMethods.length === 0,
                },
                ...state.payoutMethods,
            ],
        }
    }),

    requestWithdrawal: (amount, payout) => set((state) => {
        const parsed = Number(amount || 0)
        if (!Number.isFinite(parsed) || parsed < 100 || parsed > state.earningsWallet) return state
        if (!payout || !payout.type) return state
        if (payout.type === 'bank') {
            if (!payout.accountNumber || !payout.ifscCode) return state
        }
        if (payout.type === 'upi') {
            if (!payout.upiId) return state
        }
        const accountLabel = payout.type === 'bank'
            ? `Bank ${payout.accountNumber}`
            : `UPI ${payout.upiId}`
        const commission = Number(getPlatformSettingsFromCookie().commission || 0)
        const feeAmount = Math.round((parsed * commission) / 100)
        const payoutAmount = parsed - feeAmount
        return {
            earningsWallet: round2(state.earningsWallet - parsed),
            balance: round2(state.earningsWallet - parsed),
            transactions: [
                {
                    id: `tx_${Date.now()}`,
                    type: 'withdraw',
                    title: `Withdrawal to ${accountLabel} (Fee ${commission}% = ₹${feeAmount}, Net ₹${payoutAmount})`,
                    amount: -parsed,
                    date: new Date().toISOString(),
                    status: 'pending',
                },
                ...state.transactions,
            ],
            earningsLedger: state.earningsLedger.map((entry) =>
                entry.status === 'pending' ? { ...entry, status: 'reconciled' } : entry,
            ),
        }
    }),
}))
