const User = require("../../models/User");
const WalletTransaction = require("../../models/WalletTransaction");
const Post = require("../../models/Post");
const { getExchangeRates } = require("../../utils/exchangeRate");

exports.getDashboardStats = async (req, res) => {
    try {
        // 1. Total Stats
        const totalUsers = await User.countDocuments();
        const totalContent = await Post.countDocuments();
        
        const revenueAggregation = await WalletTransaction.aggregate([
            { $match: { type: "deposit", status: "success" } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);
        const totalRevenue = revenueAggregation.length > 0 ? revenueAggregation[0].total : 0;

        // 2. Revenue By Month (Last 12 Months)
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);
        twelveMonthsAgo.setDate(1);
        twelveMonthsAgo.setHours(0, 0, 0, 0);

        const revenueByMonth = await WalletTransaction.aggregate([
            {
                $match: {
                    type: "deposit",
                    status: "success",
                    createdAt: { $gte: twelveMonthsAgo }
                }
            },
            {
                $group: {
                    _id: {
                        month: { $month: "$createdAt" },
                        year: { $year: "$createdAt" }
                    },
                    amount: { $sum: "$amount" }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        // 3. Recent Users (Last 5)
        const recentUsers = await User.find()
            .select("name email avatar createdAt role handle")
            .sort({ createdAt: -1 })
            .limit(5);

        // 4. Recent Transactions (Last 5) - Only show deposits (recharges and promotion payments)
        const recentTransactions = await WalletTransaction.find({ 
                type: "deposit",
                status: "success" 
            })
            .populate("userId", "name email handle avatar")
            .sort({ createdAt: -1 })
            .limit(5);


        // 5. Exchange Rates (All pairs)
        let rates = null;
        try {
            const rateData = await getExchangeRates('USD');
            rates = {
                ...rateData.rates,
                lastUpdate: rateData.lastUpdate
            };
        } catch (e) {
            console.error("Dashboard Rates Error:", e.message);
        }

        res.status(200).json({
            success: true,
            data: {
                totalUsers,
                totalContent,
                totalRevenue,
                revenueByMonth,
                recentUsers,
                recentTransactions,
                rates
            }
        });
    } catch (error) {
        console.error("Dashboard Stats Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getFinancialStats = async (req, res) => {
    try {
        // Total platform liquidity flow
        const totalRevenueAgg = await WalletTransaction.aggregate([
            { $match: { type: "deposit", status: "success" } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);
        const totalRevenue = totalRevenueAgg[0]?.total || 0;

        // Specific Revenue: Promotions (based on confirmed wallet transactions)
        const promotionRevenueAgg = await WalletTransaction.aggregate([
            { $match: { type: "deposit", status: "success", referenceType: "post" } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);
        const promotionRevenue = promotionRevenueAgg[0]?.total || 0;

        // Specific Revenue: Wallet Recharges
        const walletRechargeRevenueAgg = await WalletTransaction.aggregate([
            { $match: { type: "deposit", status: "success", referenceType: "payment_gateway" } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);
        const walletRechargeRevenue = walletRechargeRevenueAgg[0]?.total || 0;

        // Platform commissions derived from successful withdrawals (realized profit)
        const Withdrawal = require("../../models/Withdrawal");
        const withdrawalStatsAgg = await Withdrawal.aggregate([
            {
                $facet: {
                    successStats: [
                        { $match: { status: "success" } },
                        { $group: { _id: null, totalCommissions: { $sum: "$platformFee" }, totalPayouts: { $sum: "$finalAmount" } } }
                    ],
                    pendingStats: [
                        { $match: { status: "pending" } },
                        { $group: { _id: null, totalVolume: { $sum: "$grossAmount" } } }
                    ]
                }
            }
        ]);

        const commissions = withdrawalStatsAgg[0]?.successStats[0]?.totalCommissions || 0;
        const totalPayouts = withdrawalStatsAgg[0]?.successStats[0]?.totalPayouts || 0;
        const pendingVolume = withdrawalStatsAgg[0]?.pendingStats[0]?.totalVolume || 0;

        res.status(200).json({
            success: true,
            data: {
                totalRevenue,
                promotionRevenue,
                walletRechargeRevenue,
                commissions,
                totalPayouts,
                pendingVolume,
                // Add metadata to track reconciliation
                syncAt: new Date(),
                node: "FIN-CORE-01"
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getTransactions = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = "", type = "" } = req.query;
        const query = { status: "success" };

        if (type) {
            if (type === "recharge") {
                query.type = "deposit";
                query.referenceType = "payment_gateway";
            } else if (type === "promotion") {
                query.type = "deposit";
                query.referenceType = "post";
            } else if (type === "nft") {
                query.referenceType = { $in: ["nft_purchase", "nft_sale", "nft_royalty", "auction_purchase", "auction_sale"] };
            } else {
                query.type = type;
            }
        }

        let userIdFilter = null;
        if (search) {
            const users = await User.find({
                $or: [
                    { name: { $regex: search, $options: "i" } },
                    { email: { $regex: search, $options: "i" } },
                    { handle: { $regex: search, $options: "i" } }
                ]
            }).select("_id");
            userIdFilter = users.map(u => u._id);
            query.userId = { $in: userIdFilter };
        }

        const transactions = await WalletTransaction.find(query)
            .populate("userId", "name email handle avatar")
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await WalletTransaction.countDocuments(query);

        res.status(200).json({
            success: true,
            data: {
                transactions,
                total,
                page: parseInt(page),
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getAdminExchangeRates = async (req, res) => {
    try {
        const { base = 'USD' } = req.query;
        const data = await getExchangeRates(base);
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

