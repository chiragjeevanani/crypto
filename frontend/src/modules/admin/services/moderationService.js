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
];

export const moderationService = {
    fetchPosts: async () => {
        await delay(700);
        return [...mockPosts];
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
