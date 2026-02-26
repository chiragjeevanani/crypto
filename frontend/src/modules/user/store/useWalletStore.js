import { create } from 'zustand'
import { mockTransactions } from '../data/mockTransactions'

export const useWalletStore = create((set, get) => ({
    balance: 2847,
    giftEarnings: 1245,
    taskEarnings: 980,
    nftEarnings: 622,
    transactions: mockTransactions,
    activeTab: 'transactions',

    setActiveTab: (tab) => set({ activeTab: tab }),

    addGiftEarning: (amount) => set((state) => ({
        balance: state.balance + amount,
        giftEarnings: state.giftEarnings + amount,
        transactions: [
            {
                id: `tx_${Date.now()}`,
                type: 'gift',
                title: 'Gift received',
                amount: +amount,
                date: new Date().toISOString(),
                status: 'completed',
            },
            ...state.transactions,
        ],
    })),

    addTaskEarning: (amount, brandName) => set((state) => ({
        balance: state.balance + amount,
        taskEarnings: state.taskEarnings + amount,
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
}))
