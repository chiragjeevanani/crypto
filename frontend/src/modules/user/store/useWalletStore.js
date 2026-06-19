import { create } from 'zustand'
import { getPlatformSettingsFromCookie } from '../../../shared/platformSettings'
import { walletService } from '../services/walletService'

const INR_PER_CRYPTO = 60000

function round2(value) {
    return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100
}

export const useWalletStore = create((set, get) => ({
    inrWallet: 0,
    earningsWallet: 0,
    balance: 0, 
    walletRates: { localRate: 1 },

    giftEarnings: 0,
    taskEarnings: 0,
    nftEarnings: 0,
    giftCount: 0,
    taskCount: 0,
    nftCount: 0,
    gifts: [],
    transactions: [],
    activeTab: 'transactions',
    walletLoading: false,
    giftsLoading: false,
    transactionsLoading: false,
    walletError: '',
    earningsLedger: [
        { id: 'led_1', source: 'gift', amount: 50, status: 'reconciled', createdAt: '2026-02-26T09:14:00Z' },
        { id: 'led_2', source: 'task', amount: 500, status: 'reconciled', createdAt: '2026-02-25T18:00:00Z' },
        { id: 'led_3', source: 'nft', amount: 180, status: 'pending', createdAt: '2026-02-24T12:00:00Z' },
    ],
    payoutMethods: [],
    payoutMethodsLoading: false,

    setActiveTab: (tab) => set({ activeTab: tab }),

    loadWallet: async () => {
        if (get().walletLoading) return;
        set({ walletLoading: true, walletError: '' })
        try {
            const data = await walletService.getBalance()
            const rechargeCoins = Number(data?.rechargeCoins || 0)
            const earningCoins = Number(data?.earningCoins || 0)
            const localRate = Number(data?.localRate || 1)
            
            set((state) => ({
                inrWallet: rechargeCoins,
                earningsWallet: earningCoins,
                balance: rechargeCoins + earningCoins,
                walletRates: { ...state.walletRates, localRate },
                giftEarnings: Number(data?.giftEarnings || 0),
                taskEarnings: Number(data?.taskEarnings || 0),
                nftEarnings: Number(data?.nftEarnings || 0),
                giftCount: Number(data?.giftCount || 0),
                taskCount: Number(data?.taskCount || 0),
                nftCount: Number(data?.nftCount || 0),
                walletLoading: false,
            }))
            // ensure gifts are also in sync
            get().loadGifts()
            // ensure payout methods are loaded
            get().loadPayoutMethods()
        } catch (error) {
            set({ walletLoading: false, walletError: error.message })
        }
    },

    loadPayoutMethods: async () => {
        set({ payoutMethodsLoading: true })
        try {
            const data = await walletService.getPayoutMethods()
            const list = Array.isArray(data?.payoutMethods) ? data.payoutMethods.map(pm => ({
                id: pm._id,
                ...pm,
                accountHolder: pm.holderName // map backend field to frontend
            })) : []
            set({ payoutMethods: list, payoutMethodsLoading: false })
        } catch {
            set({ payoutMethodsLoading: false })
        }
    },

    loadGifts: async () => {
        if (get().giftsLoading) return;
        set({ giftsLoading: true })
        try {
            const data = await walletService.getGifts()
            const list = Array.isArray(data?.gifts) ? data.gifts : []
            
            // Get user's currency preference for price mapping
            const { useUserStore } = await import('./useUserStore')
            const profile = useUserStore.getState().profile
            const currencyCode = profile?.currencyCode || 'INR'
            const isInr = currencyCode === 'INR'

            // Preserve unique IDs while identifying animation types
            const mapped = list.map(g => {
                const emoji = g.icon || '🎁'
                let animationId = 'gift'
                if (emoji === '🌹') animationId = 'rose'
                else if (emoji === '🥚') animationId = 'egg'
                else if (emoji === '🍅') animationId = 'tomato'
                else if (emoji === '💛' || emoji === '❤️' || emoji === '💖') animationId = 'heart'
                
                // Backend now provides localized price converted from USD
                const displayPrice = Number(g.priceLocal || g.priceUsd || g.priceGlobal || g.price || 0)

                return { 
                    ...g, 
                    id: String(g.id || g._id),
                    animationType: animationId,
                    emoji,
                    price: displayPrice, // This is what shows on the button
                    priceUsd: Number(g.priceUsd || 10),
                    currencySymbol: g.currencySymbol || '$',
                    currencyCode: g.currencyCode || 'USD'
                }
            })
            set({ gifts: mapped, giftsLoading: false })
        } catch {
            set({ giftsLoading: false })
        }
    },

    loadTransactions: async (params) => {
        if (get().transactionsLoading) return;
        set({ transactionsLoading: true, walletError: '' })
        try {
            const data = await walletService.getTransactions(params || {})
            const list = Array.isArray(data?.transactions) ? data.transactions : []
            const settings = getPlatformSettingsFromCookie()
            const coinRate = Number(settings.coinRate || 1)
            
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
                
                let title = titleMap[tx.type] || 'Wallet activity'
                if (tx.type === 'gift_received' && tx.meta?.senderName) {
                    title = `Gift from ${tx.meta.senderName}`
                } else if (tx.type === 'gift_sent' && tx.meta?.receiverName) {
                    title = `Gift to ${tx.meta.receiverName}`
                } else if (tx.type === 'post_reward') {
                    title = 'Reel Post Reward'
                }

                // Use backend-provided local currency amount if available, else fall back to coinRate
                // localAmount and localSymbol come from walletController.sendGift() currency conversion
                const localAmount = tx.meta?.localAmount ?? null;
                const localSymbol = tx.meta?.localSymbol ?? null;
                const localCurrency = tx.meta?.localCurrency ?? null;

                // INR amount: from tx.amount (deposit/withdrawal) or coins/coinRate (gift)
                const isFiatTx = tx.type === 'deposit' || tx.type === 'withdrawal' || tx.type === 'withdrawal_request';
                const localRate = Number(get().walletRates?.localRate || 1);
                const rsAmount = isFiatTx && tx.amount !== undefined && tx.amount !== null 
                    ? Number(tx.amount) 
                    : ((coins / coinRate) * localRate)

                return {
                    id: tx._id || tx.id,
                    type: normalizedType,
                    title,
                    amount: sign * rsAmount,
                    // Localized display values
                    localAmount: localAmount !== null ? sign * Math.abs(localAmount) : null,
                    localSymbol,
                    localCurrency,
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
        try {
            await walletService.deposit(parsed, `dep_${Date.now()}`)
            await get().loadWallet()
            await get().loadTransactions()
            return { ok: true }
        } catch (error) {
            return { ok: false, message: error.message }
        }
    },

    initiateRecharge: async (amount) => {
        const parsed = Number(amount || 0)
        if (!Number.isFinite(parsed) || parsed <= 0) return { ok: false, message: 'Invalid amount.' }
        try {
            const data = await walletService.initiateRecharge(parsed)
            if (data?.success) {
                return {
                    ok: true,
                    gateway: data.gateway,           // 'razorpay' or 'stripe'
                    // Razorpay fields
                    orderId: data.orderId,
                    amount: data.amount,
                    currency: data.currency,
                    keyId: data.keyId,
                    // Stripe fields
                    sessionId: data.sessionId,
                    sessionUrl: data.sessionUrl,
                    // Common
                    transactionId: data.transactionId,
                }
            }
            return { ok: false, message: data?.message || 'Could not get payment link.' }
        } catch (error) {
            return { ok: false, message: error.message }
        }
    },

    verifyPayment: async (transactionId, razorpayData) => {
        try {
            await walletService.verifyPayment(transactionId, razorpayData)
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
        
        const localRate = state.walletRates?.localRate || 1
        const parsedInInr = parsed / localRate

        if (state.inrWallet < parsedInInr) {
            return { ok: false, message: 'Not enough balance.', error: 'insufficient_balance' }
        }
        set((prev) => ({
            inrWallet: round2(prev.inrWallet - parsedInInr),
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

    performGift: async ({ gift, receiverId, postId, reelId }) => {
        const state = get()
        const coinsNeeded = Number(gift.coins || gift.price || 0)
        const giftIdForBackend = gift.id

        const localRate = state.walletRates?.localRate || 1
        const coinsNeededInInr = coinsNeeded / localRate

        if (state.inrWallet < coinsNeededInInr) {
            return { ok: false, message: 'Not enough balance.', error: 'insufficient_balance' }
        }

        // Optimistic update
        set((prev) => ({
            inrWallet: round2(prev.inrWallet - coinsNeededInInr),
            balance: round2(prev.balance - coinsNeededInInr)
        }))

        try {
            await walletService.sendGift(giftIdForBackend, receiverId, postId, reelId)
            // Final sync
            await get().loadWallet()
            return { ok: true }
        } catch (error) {
            // Revert
            await get().loadWallet()
            return { ok: false, message: error.message }
        }
    },

    transferEarningsToWallet: ({ wallet, amount }) => {
        // Enforcing policy: Earnings can only be withdrawn, not moved internally.
        return { ok: false, message: 'Earnings can only be withdrawn to your bank/upi account.' }
    },

    buyNft: async (postId, amount, title = 'NFT purchase') => {
        const parsed = Number(amount || 0)
        const state = get()
        if (!Number.isFinite(parsed) || parsed <= 0) return { ok: false, message: 'Invalid NFT price.' }
        
        const localRate = state.walletRates?.localRate || 1
        const parsedInInr = parsed / localRate

        if (state.inrWallet < parsedInInr) return { ok: false, message: 'Not enough wallet balance.' }
        
        try {
            await walletService.buyPostNFT(postId)
            
            // Sync wallet balances
            await get().loadWallet()
            await get().loadTransactions()

            return { ok: true }
        } catch (error) {
            return { ok: false, message: error.message }
        }
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

    addPayoutMethod: async (payload) => {
        const type = payload?.type === 'bank' ? 'bank' : 'upi'
        let backendPayload = { type, primary: false }
        if (type === 'bank') {
            if (!payload.accountHolder || !payload.accountNumber || !payload.ifscCode) return { ok: false }
            backendPayload = {
                ...backendPayload,
                holderName: payload.accountHolder.trim(),
                accountNumber: payload.accountNumber.trim(),
                ifscCode: payload.ifscCode.trim().toUpperCase(),
                bankName: payload.bankName?.trim() || 'Bank',
            }
        } else {
            if (!payload.upiId || !payload.holderName) return { ok: false }
            backendPayload = {
                ...backendPayload,
                upiId: payload.upiId.trim().toLowerCase(),
                holderName: payload.holderName.trim(),
            }
        }

        try {
            await walletService.addPayoutMethod(backendPayload)
            await get().loadPayoutMethods()
            return { ok: true }
        } catch (error) {
            return { ok: false, message: error.message }
        }
    },
    
    removePayoutMethod: async (id) => {
        try {
            await walletService.removePayoutMethod(id)
            await get().loadPayoutMethods()
            return { ok: true }
        } catch (error) {
            return { ok: false, message: error.message }
        }
    },

    setPrimaryPayoutMethod: async (id) => {
        try {
            await walletService.setPrimaryPayoutMethod(id)
            await get().loadPayoutMethods()
            return { ok: true }
        } catch (error) {
            return { ok: false, message: error.message }
        }
    },

    requestWithdrawal: async (coins, payout) => {
        const parsed = Number(coins || 0)
        const state = get()
        if (!Number.isFinite(parsed) || parsed < 1 || parsed > state.earningsWallet) {
            return { ok: false, message: 'Invalid withdrawal amount.' }
        }
        if (!payout || !payout.paymentMethod) return { ok: false, message: 'Select a payout method.' }
        
        try {
            await walletService.requestWithdrawal({
                coins: parsed,
                paymentMethod: payout.paymentMethod,
                bankDetails: payout.bankDetails,
                upiId: payout.upiId,
                kycDetails: payout.kycDetails,
                documents: payout.documents,
                idempotencyKey: `wd_${Date.now()}`
            })
            await get().loadWallet()
            await get().loadTransactions()
            return { ok: true }
        } catch (error) {
            return { ok: false, message: error.message }
        }
    },
}))
