const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

let mockWithdrawals = [
    { id: 'W-9821', user: 'Alex Rivera', userId: 'U-7721', amount: 450.00, method: 'USDT (TRC20)', status: 'pending', date: '2024-02-26 14:20', kycStatus: 'Verified', historyCount: 15 },
    { id: 'W-9822', user: 'Sarah Chen', userId: 'U-7722', amount: 1200.00, method: 'ETH', status: 'processing', date: '2024-02-26 13:10', kycStatus: 'Pending', historyCount: 2 },
    { id: 'W-9823', user: 'Mike Ross', userId: 'U-7723', amount: 85.00, method: 'Paypal', status: 'pending', date: '2024-02-26 12:45', kycStatus: 'Verified', historyCount: 8 },
];

let mockLedger = [
    { id: 'TX-401', user: 'Alex Rivera', type: 'Gift Payout', amount: 450.00, status: 'Settled', date: '2m ago' },
];

let mockAuditLogs = [
    { id: 'LOG-001', action: 'Login', admin: 'SuperAdmin', timestamp: '2024-02-27 10:00', details: 'Admin logged into gateway.' },
];

let mockNotifications = [];

export const withdrawalService = {
    fetchWithdrawals: async (filter = 'all') => {
        await delay(800);
        if (filter === 'all') return [...mockWithdrawals];
        return mockWithdrawals.filter(w => w.status.toLowerCase() === filter.toLowerCase());
    },

    approveWithdrawal: async (id) => {
        await delay(1200);
        const withdrawal = mockWithdrawals.find(w => w.id === id);
        if (withdrawal) {
            withdrawal.status = 'approved';

            // Deduct wallet balance: add to ledger
            const txId = `TX-${Math.floor(Math.random() * 9000) + 1000}`;
            mockLedger.unshift({
                id: txId,
                user: withdrawal.user,
                type: 'Withdrawal Completed',
                amount: -withdrawal.amount,
                status: 'Settled',
                date: 'Just now'
            });

            // Add to audit log
            mockAuditLogs.unshift({
                id: `LOG-${Date.now()}`,
                action: 'Withdrawal Approval',
                admin: 'SuperAdmin',
                timestamp: new Date().toISOString(),
                details: `Approved ${withdrawal.amount} for ${withdrawal.user}. TX: ${txId}`
            });

            // Simulate notification
            mockNotifications.push({
                userId: withdrawal.userId,
                message: `Your withdrawal of ${withdrawal.amount} has been approved.`,
                type: 'withdrawal_approved'
            });
        }
        return withdrawal;
    },

    rejectWithdrawal: async (id, reason) => {
        if (!reason) throw new Error("Rejection reason is mandatory.");

        await delay(1000);
        const withdrawal = mockWithdrawals.find(w => w.id === id);
        if (withdrawal) {
            withdrawal.status = 'rejected';
            withdrawal.rejectReason = reason;

            // Restore held amount in ledger
            const txId = `TX-${Math.floor(Math.random() * 9000) + 1000}`;
            mockLedger.unshift({
                id: txId,
                user: withdrawal.user,
                type: 'Withdrawal Held Restoration',
                amount: withdrawal.amount, // Positive amount to restore
                status: 'Settled',
                date: 'Just now'
            });

            // Add to audit log
            mockAuditLogs.unshift({
                id: `LOG-${Date.now()}`,
                action: 'Withdrawal Rejection',
                admin: 'SuperAdmin',
                timestamp: new Date().toISOString(),
                details: `Rejected ${withdrawal.amount} for ${withdrawal.user}. Reason: ${reason}. Amount restored.`
            });

            // Simulate notification
            mockNotifications.push({
                userId: withdrawal.userId,
                message: `Your withdrawal of ${withdrawal.amount} was rejected. Reason: ${reason} - Amount restored fully.`,
                type: 'withdrawal_rejected'
            });
        }
        return withdrawal;
    },

    fetchAuditLogs: async () => {
        await delay(500);
        return [...mockAuditLogs];
    },

    getUserFinancialSnapshot: async (userId) => {
        await delay(700);
        // Returns a summary of user financial history for the approval view
        const userTransactions = mockLedger.filter(tx => tx.user.includes(userId));
        return {
            history: userTransactions,
            totalWithdrawn: userTransactions.reduce((acc, tx) => tx.amount < 0 ? acc + Math.abs(tx.amount) : acc, 0)
        };
    },

    fetchLedger: async () => {
        await delay(500);
        return [...mockLedger];
    }
};
