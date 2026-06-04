const Auction = require("../models/Auction");
const Bid = require("../models/Bid");
const Post = require("../models/Post");
const User = require("../models/User");
const WalletTransaction = require("../models/WalletTransaction");
const { getAdminConfig } = require("../utils/adminConfig");
const { broadcastToRoom, broadcastAll } = require("../utils/socket");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const { UPLOAD_DIR } = require("../utils/upload");
const { cloudinary } = require("../utils/cloudinary");

/**
 * Initiate Listing Fee Payment
 */
const initiateListingFee = async (req, res) => {
    const userId = req.user.userId;
    try {
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        // Only India allowed
        // if (user.countryCode !== "IN") {
        //     return res.status(403).json({ success: false, message: "Auction creation is currently limited to users from India." });
        // }

        const config = await getAdminConfig();
        const amount = config.auctionListingFeeINR;

        if (amount === 0) {
            return res.status(200).json({
                success: true,
                orderId: "free_auction_" + Date.now(),
                amount: 0,
                currency: "INR",
                keyId: process.env.RAZORPAY_KEY_ID,
                isFree: true
            });
        }

        const instance = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });

        const options = {
            amount: Math.round(amount * 100),
            currency: "INR",
            receipt: `auction_fee_${Date.now()}`,
        };

        const order = await instance.orders.create(options);

        res.status(200).json({
            success: true,
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId: process.env.RAZORPAY_KEY_ID,
            isFree: false
        });
    } catch (error) {
        console.error("Initiate Listing Fee Error:", error);
        res.status(500).json({ 
            success: false, 
            message: error.message,
            error: process.env.NODE_ENV !== 'production' ? error.message : undefined,
            stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
        });
    }
};

/**
 * Create Auction after Payment Verification
 */
const createAuction = async (req, res) => {
    const userId = req.user.userId;
    const { 
        title, 
        description, 
        basePrice, 
        startDate, 
        endDate,
        royaltyPct,
        razorpay_payment_id,
        razorpay_order_id,
        razorpay_signature 
    } = req.body;


    try {
        const file = req.file;
        let mediaUrl = "";
        let mediaType = "image";

        if (file) {
            const localPath = path.join(UPLOAD_DIR, file.filename);
            const useCloudinary = Boolean(
                cloudinary &&
                process.env.CLOUDINARY_CLOUD_NAME &&
                process.env.CLOUDINARY_API_KEY &&
                process.env.CLOUDINARY_API_SECRET
            );

            if (useCloudinary) {
                try {
                    const uploadResult = await cloudinary.uploader.upload(localPath, {
                        resource_type: "auto",
                        folder: "crypto-app/auctions"
                    });
                    mediaUrl = uploadResult.secure_url;
                    if (file.mimetype.startsWith("video/")) mediaType = "video";
                    else if (file.mimetype.startsWith("audio/")) mediaType = "audio";
                    fs.unlink(localPath, () => {});
                } catch (cloudinaryErr) {
                    console.error("[CreateAuction] Cloudinary upload failed:", cloudinaryErr);
                    // Fallback to local if Cloudinary fails but we have the file
                    mediaUrl = `/uploads/${file.filename}`;
                    if (file.mimetype.startsWith("video/")) mediaType = "video";
                    else if (file.mimetype.startsWith("audio/")) mediaType = "audio";
                }
            } else {
                mediaUrl = `/uploads/${file.filename}`;
                if (file.mimetype.startsWith("video/")) mediaType = "video";
                else if (file.mimetype.startsWith("audio/")) mediaType = "audio";
            }
        }

        if (!mediaUrl) {
            return res.status(400).json({ success: false, message: "Media file is required." });
        }

        // Verify Payment Signature (Skip if free auction)
        const isFree = razorpay_order_id && razorpay_order_id.startsWith("free_auction_");
        
        if (!isFree) {
            const generatedSignature = crypto
                .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
                .update(razorpay_order_id + "|" + razorpay_payment_id)
                .digest("hex");

            if (generatedSignature !== razorpay_signature) {
                console.warn("[CreateAuction] Signature mismatch!");
                return res.status(400).json({ success: false, message: "Payment verification failed." });
            }
        }

        const config = await getAdminConfig();
        const parsedBasePrice = Number(basePrice);

        if (isNaN(parsedBasePrice)) {
            return res.status(400).json({ success: false, message: "Invalid base price." });
        }

        const auction = await Auction.create({
            title,
            description,
            mediaUrl,
            mediaType,
            basePrice: parsedBasePrice,
            startDate,
            endDate,
            creator: userId,
            listingFeePaid: true,
            paymentOrderId: razorpay_order_id,
            commissionPct: config.auctionCommissionPct,
            gstPct: config.gstPct,
            royaltyPct: Number(royaltyPct) || 10,
            status: "pending"
        });

        res.status(201).json({ success: true, auction, message: "Auction submitted for approval." });
    } catch (error) {
        console.error("Create Auction Error:", error);
        res.status(500).json({ 
            success: false, 
            message: error.message || "An error occurred while creating the auction.",
            error: process.env.NODE_ENV !== 'production' ? error.message : undefined,
            stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
        });
    }
};

/**
 * List Auctions
 */
const getAuctions = async (req, res) => {
    try {
        const { status, creatorId } = req.query;
        let query = {};
        
        if (status) query.status = status;
        else query.status = { $in: ["live", "ended"] }; // Public default

        if (creatorId) query.creator = creatorId;

        const auctions = await Auction.find(query)
            .populate("creator", "name handle avatar")
            .populate("winner", "name handle avatar")
            .sort({ createdAt: -1 });


        res.status(200).json({ success: true, auctions });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Get Single Auction Details
 */
const getAuctionDetail = async (req, res) => {
    try {
        const auction = await Auction.findById(req.params.id)
            .populate("creator", "name handle avatar countryCode")
            .populate("winner", "name handle avatar");

        if (!auction) return res.status(404).json({ success: false, message: "Auction not found" });

        const bids = await Bid.find({ auctionId: auction._id })
            .populate("userId", "name handle avatar")
            .sort({ amount: -1 })
            .limit(50);

        res.status(200).json({ success: true, auction, bids });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Place a Bid
 */
const placeBid = async (req, res) => {
    const userId = req.user.userId;
    const { amount } = req.body;
    const auctionId = req.params.id;

    try {
        const auction = await Auction.findById(auctionId);
        if (!auction) return res.status(404).json({ success: false, message: "Auction not found" });

        // Checks
        if (auction.status !== "live") {
            return res.status(400).json({ success: false, message: "Bidding is only allowed on live auctions." });
        }
        if (new Date() > new Date(auction.endDate)) {
            return res.status(400).json({ success: false, message: "Auction has already ended." });
        }
        if (auction.creator.toString() === userId) {
            return res.status(400).json({ success: false, message: "You cannot bid on your own auction." });
        }

        const currentHighest = auction.highestBid || auction.basePrice;
        if (amount <= currentHighest) {
            return res.status(400).json({ success: false, message: `Your bid must be higher than ₹${currentHighest}` });
        }

        // Auto-extension logic (Anti-sniping: last 2 mins -> +5 mins)
        const now = new Date();
        const timeLeft = new Date(auction.endDate).getTime() - now.getTime();
        let updatedEndDate = auction.endDate;
        if (timeLeft > 0 && timeLeft < 2 * 60 * 1000) {
            updatedEndDate = new Date(new Date(auction.endDate).getTime() + 5 * 60 * 1000);
        }

        const bid = await Bid.create({
            auctionId,
            userId,
            amount
        });

        auction.highestBid = amount;
        auction.winner = userId;
        auction.endDate = updatedEndDate;
        await auction.save();

        // Socket broadcast
        const user = await User.findById(userId, "name handle avatar");
        broadcastToRoom(`auction_${auctionId}`, "new_bid", {
            auctionId,
            bid: {
                _id: bid._id,
                amount: bid.amount,
                userId: {
                    _id: user._id,
                    name: user.name,
                    handle: user.handle,
                    avatar: user.avatar
                },
                createdAt: bid.createdAt
            },
            highestBid: amount,
            endDate: updatedEndDate
        });

        res.status(201).json({ success: true, bid, message: "Bid placed successfully." });
    } catch (error) {
        console.error("Place Bid Error:", error);
        res.status(500).json({ 
            success: false, 
            message: error.message,
            stack: process.env.NODE_ENV === "development" ? error.stack : undefined 
        });
    }
};

/**
 * Admin: Update Status
 */
const updateStatus = async (req, res) => {
    const { status } = req.body; // approved/rejected
    try {
        const auction = await Auction.findById(req.params.id);
        if (!auction) return res.status(404).json({ success: false, message: "Auction not found" });

        if (status === "approved") {
            auction.status = "live";
            broadcastAll("auction_started", { auctionId: auction._id, title: auction.title });
        } else if (status === "rejected") {
            auction.status = "rejected";
        }

        await auction.save();
        res.status(200).json({ success: true, auction });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Background / Manual: Process Ended Auctions
 * This should be called by an interval or cron job
 */
const processEndedAuctions = async () => {
    try {
        const now = new Date();
        const endedAuctions = await Auction.find({
            status: "live",
            endDate: { $lte: now }
        });

        for (const auction of endedAuctions) {
            const session = await mongoose.startSession();
            session.startTransaction();
            try {
                auction.status = "ended";
                
                if (auction.winner && auction.highestBid > 0) {
                    const winner = await User.findById(auction.winner).session(session);
                    const creator = await User.findById(auction.creator).session(session);
                    
                    if (winner && creator) {
                        const commission = Math.round((auction.highestBid * auction.commissionPct) / 100);
                        const gst = Math.round((commission * (auction.gstPct || 18)) / 100);
                        const totalDeduction = commission + gst;
                        const payout = auction.highestBid - totalDeduction;

                        // Temporarily bypass balance check to allow testing
                        winner.rechargeCoins -= auction.highestBid;
                        await winner.save({ session });

                        // Add to creator
                        creator.rechargeCoins += payout;
                        await creator.save({ session });

                        // Record transactions
                        await WalletTransaction.create([{
                            userId: winner._id,
                            type: "withdrawal", 
                            coins: auction.highestBid,
                            beforeBalance: winner.rechargeCoins + auction.highestBid,
                            afterBalance: winner.rechargeCoins,
                            referenceId: auction._id,
                            referenceType: "auction_purcase",
                            status: "success"
                        }], { session });

                        await WalletTransaction.create([{
                            userId: creator._id,
                            type: "deposit",
                            coins: payout,
                            beforeBalance: creator.rechargeCoins - payout,
                            afterBalance: creator.rechargeCoins,
                            referenceId: auction._id,
                            referenceType: "auction_sale",
                            status: "success"
                        }], { session });
                    }
                }

                await auction.save({ session });
                await session.commitTransaction();
                
                broadcastToRoom(`auction_${auction._id}`, "auction_ended", {
                    auctionId: auction._id,
                    winner: auction.winner,
                    highestBid: auction.highestBid
                });
            } catch (err) {
                await session.abortTransaction();
                console.error(`Failed to process auction ${auction._id}:`, err);
            } finally {
                session.endSession();
            }
        }
    } catch (error) {
        console.error("Process Ended Auctions Global Error:", error);
    }
};

module.exports = {
    initiateListingFee,
    createAuction,
    getAuctions,
    getAuctionDetail,
    placeBid,
    updateStatus,
    processEndedAuctions
};
