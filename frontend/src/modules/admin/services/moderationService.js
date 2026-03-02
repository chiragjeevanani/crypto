const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

let mockPosts = [
    {
        id: 'POST-4821',
        author: 'cryptoking_99',
        type: 'Video',
        content: 'Check out this new NFT drop! Fast money...',
        flagReason: 'Potential Scam Mention',
        status: 'Pending',
        thumbnail: 'https://images.unsplash.com/photo-1620712943543-bcc4628c6bb5?w=200&h=200&fit=crop'
    },
    {
        id: 'POST-4822',
        author: 'art_lover_22',
        type: 'Image',
        content: 'My latest digital painting for the community.',
        flagReason: 'Copyright Check - Visual match',
        status: 'Flagged',
        thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&h=200&fit=crop'
    },
    {
        id: 'POST-4823',
        author: 'meme_lord',
        type: 'Post',
        content: 'Click here for free tokens! 🔥🔥🔥',
        flagReason: 'Spam Pattern Detected',
        status: 'Pending',
        thumbnail: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=200&h=200&fit=crop'
    },
];

export const moderationService = {
    fetchPosts: async () => {
        await delay(700);
        return [...mockPosts];
    },

    fetchPostDetail: async (id) => {
        await delay(600);
        const post = mockPosts.find((p) => p.id === id);
        if (!post) return null;
        return {
            ...post,
            mediaUrl: post.thumbnail.replace('w=200&h=200&fit=crop', 'w=1200&h=900&fit=crop'),
            createdAt: '2026-02-27T11:30:00Z',
            reportCount: post.status === 'Urgent' ? 18 : post.status === 'Flagged' ? 9 : 4,
            aiRiskScore: post.status === 'Urgent' ? '92%' : post.status === 'Flagged' ? '71%' : '48%',
            moderationNotes: post.status === 'Flagged'
                ? 'Possible content duplication detected. Needs manual rights verification.'
                : 'Waiting for admin decision before publishing.',
            authorStats: {
                followers: 12840,
                posts: 167,
                previousFlags: post.status === 'Flagged' ? 2 : 0,
            },
            reports: [
                { id: 'RPT-1', reason: post.flagReason, source: 'Auto-Detection Engine', confidence: 'High' },
                { id: 'RPT-2', reason: 'Community report submitted', source: 'User Report', confidence: 'Medium' },
            ],
        };
    },

    approvePost: async (id) => {
        await delay(800);
        const post = mockPosts.find(p => p.id === id);
        if (post) {
            post.status = 'Approved';
        }
        return post;
    },

    rejectPost: async (id, reason) => {
        await delay(800);
        const post = mockPosts.find(p => p.id === id);
        if (post) {
            post.status = 'Rejected';
            post.rejectReason = reason;
        }
        return post;
    },

    softDelete: async (id) => {
        await delay(1000);
        mockPosts = mockPosts.filter(p => p.id !== id);
        return true;
    }
};
