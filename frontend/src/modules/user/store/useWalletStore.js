import { create } from 'zustand'
import { getPlatformSettingsFromCookie } from '../../../shared/platformSettings'
import { walletService } from '../services/walletService'

const INR_PER_CRYPTO = 60000

function round2(value) {
    return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100
}

export const useWalletStore = create((set, get) => ({
    inrWallet: 0,
    cryptoWallet: 0.02,
    earningsWallet: 0,
    balance: 0, // kept for backward compatibility (withdrawable = earnings wallet)
    giftSpendWallet: 'inr', // inr | crypto
    walletRates: { inrPerCrypto: INR_PER_CRYPTO },

    giftEarnings: 0,
    taskEarnings: 0,
    nftEarnings: 0,
    transactions: [],
    activeTab: 'transactions',
    walletLoading: false,
    transactionsLoading: false,
    walletError: '',
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

    loadWallet: async () => {
        set({ walletLoading: true, walletError: '' })
        try {
            const data = await walletService.getBalance()
            const rechargeCoins = Number(data?.rechargeCoins || 0)
            const earningCoins = Number(data?.earningCoins || 0)
            set({
                inrWallet: rechargeCoins,
                earningsWallet: earningCoins,
                balance: earningCoins,
                walletLoading: false,
            })
        } catch (error) {
            set({ walletLoading: false, walletError: error.message })
        }
    },

    loadTransactions: async (params) => {
        set({ transactionsLoading: true, walletError: '' })
        try {
            const data = await walletService.getTransactions(params || {})
            const list = Array.isArray(data?.transactions) ? data.transactions : []
            const mapped = list.map((tx) => {
                const coins = Number(tx.coins || 0)
                const isDebit = tx.type === 'gift_sent' || tx.type === 'withdrawal'
                const sign = isDebit ? -1 : 1
                const titleMap = {
                    deposit: 'Wallet top-up',
                    gift_sent: 'Gift sent',
                    gift_received: 'Gift received',
                    withdrawal: 'Withdrawal request',
                }
                const normalizedType = tx.type === 'gift_received'
                    ? 'gift'
                    : tx.type === 'withdrawal'
                        ? 'withdraw'
                        : tx.type === 'deposit'
                            ? 'topup'
                            : tx.type
                return {
                    id: tx._id || tx.id,
                    type: normalizedType,
                    title: titleMap[tx.type] || 'Wallet activity',
                    amount: Math.round(sign * coins),
                    date: tx.createdAt || new Date().toISOString(),
                    status: tx.status === 'success' ? 'completed' : tx.status,
                }
            })
            set({ transactions: mapped, transactionsLoading: false })
        } catch (error) {
            set({ transactionsLoading: false, walletError: error.message })
        }
    },

    setGiftSpendWallet: (wallet) => {
        const next = wallet === 'crypto' ? 'crypto' : 'inr'
        set({ giftSpendWallet: next })
    },

    addFundsToWallet: async ({ wallet, amount }) => {
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
        try {
            await walletService.deposit(parsed, `dep_${Date.now()}`)
            await get().loadWallet()
            await get().loadTransactions()
            return { ok: true }
        } catch (error) {
            return { ok: false, message: error.message }
        }
    },

    spendGiftFromSelectedWallet: (amount) => {
        const parsed = Number(amount || 0)
        const state = get()
        if (!Number.isFinite(parsed) || parsed <= 0) return { ok: false, message: 'Invalid gift amount.' }
        if (state.giftSpendWallet === 'crypto') {
            const neededCrypto = parsed / state.walletRates.inrPerCrypto
            if (state.cryptoWallet < neededCrypto) {
                return { ok: false, message: 'Not enough Crypto balance.', error: 'insufficient_balance' }
            }
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
        if (state.inrWallet < parsed) {
            return { ok: false, message: 'Not enough INR balance.', error: 'insufficient_balance' }
        }
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

    requestWithdrawal: async (amount, payout) => {
        const parsed = Number(amount || 0)
        const state = get()
        if (!Number.isFinite(parsed) || parsed < 1 || parsed > state.earningsWallet) {
            return { ok: false, message: 'Invalid withdrawal amount.' }
        }
        if (!payout || !payout.type) return { ok: false, message: 'Select a payout method.' }
        if (payout.type === 'bank') {
            if (!payout.accountNumber || !payout.ifscCode) return { ok: false, message: 'Bank details required.' }
        }
        if (payout.type === 'upi') {
            if (!payout.upiId) return { ok: false, message: 'UPI ID required.' }
        }
        try {
            await walletService.requestWithdrawal(parsed, `wd_${Date.now()}`)
            await get().loadWallet()
            await get().loadTransactions()
            return { ok: true }
        } catch (error) {
            return { ok: false, message: error.message }
        }
    },
}))
