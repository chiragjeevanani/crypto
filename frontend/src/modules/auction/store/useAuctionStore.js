import { create } from 'zustand';
import { auctionService } from '../services/auctionService';
import { getSocket } from '../../../socket';

export const useAuctionStore = create((set, get) => ({
    auctions: [],
    currentAuction: null,
    bids: [],
    loading: false,
    error: null,
    liveAuctionCount: 0,

    fetchAuctions: async (status = '', creatorId = '') => {
        set({ loading: true });
        try {
            const res = await auctionService.getAuctions(status, creatorId);
            set({ auctions: res.auctions, loading: false });
            // Update live count for indicator
            const live = res.auctions.filter(a => a.status === 'live').length;
            set({ liveAuctionCount: live });
        } catch (err) {
            set({ error: err.message, loading: false });
        }
    },

    fetchAuctionDetail: async (id) => {
        set({ loading: true });
        try {
            const res = await auctionService.getAuctionDetail(id);
            set({ currentAuction: res.auction, bids: res.bids, loading: false });
            
            // Join socket room
            const socket = getSocket();
            socket.emit('join_room', `auction_${id}`);
            
            // Clean up existing listeners to prevent duplicates
            socket.off('new_bid');
            socket.off('auction_ended');
            
            // Listen for new bids
            socket.on('new_bid', (data) => {
                if (data.auctionId === id) {
                    set((state) => {
                        // Prevent duplicate bids in state
                        const bidExists = state.bids.some(b => b._id === data.bid._id);
                        if (bidExists) return state;

                        return {
                            bids: [data.bid, ...state.bids],
                            currentAuction: {
                                ...state.currentAuction,
                                highestBid: data.highestBid,
                                endDate: data.endDate
                            }
                        };
                    });
                }
            });

            socket.on('auction_ended', (data) => {
                if (data.auctionId === id) {
                    set((state) => ({
                        currentAuction: {
                            ...state.currentAuction,
                            status: 'ended',
                            winner: data.winner,
                            highestBid: data.highestBid
                        }
                    }));
                }
            });

        } catch (err) {
            set({ error: err.message, loading: false });
        }
    },

    leaveAuctionRoom: (id) => {
        const socket = getSocket();
        socket.off('new_bid');
        socket.off('auction_ended');
        // socket.emit('leave_room', `auction_${id}`); // Optional
    },

    placeBid: async (id, amount) => {
        try {
            const res = await auctionService.placeBid(id, amount);
            return { success: true, bid: res.bid };
        } catch (err) {
            return { success: false, message: err.response?.data?.message || err.message };
        }
    }
}));
