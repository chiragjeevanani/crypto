const ADMIN_CAMPAIGNS_KEY = 'socialearn_admin_campaigns_v1'

const DEFAULT_ADMIN_CAMPAIGNS = [
    {
        id: 'C-101',
        title: 'Summer Splash Brand Task',
        brand: 'Pepsi Co',
        budget: 5000,
        participants: 1240,
        status: 'Active',
        endDate: '2026-09-12',
        progress: 65,
        color: 'emerald-500',
    },
    {
        id: 'C-102',
        title: 'Eco-Friendly Challenge',
        brand: 'Green Earth',
        budget: 2500,
        participants: 850,
        status: 'Paused',
        endDate: '2026-10-05',
        progress: 30,
        color: 'amber-500',
    },
    {
        id: 'C-103',
        title: 'New App Review Blast',
        brand: 'TechVibe',
        budget: 10000,
        participants: 4500,
        status: 'Active',
        endDate: '2026-08-28',
        progress: 92,
        color: 'primary',
    },
]

function normalizeCampaign(campaign, idx = 0) {
    const budget = Number(campaign?.budget || 0)
    const participants = Number(campaign?.participants || 0)
    const progress = Number(campaign?.progress || 0)
    const status = String(campaign?.status || 'Active')
    const campaignType = String(campaign?.campaignType || 'brand_task')
    const blockchainNetwork = String(campaign?.blockchainNetwork || '')
    const nftPriceMin = Number(campaign?.nftPriceMin || 0)
    const nftPriceMax = Number(campaign?.nftPriceMax || 0)
    const commissionRate = Number(campaign?.commissionRate || 0)
    return {
        id: String(campaign?.id || `C-${200 + idx}`),
        title: String(campaign?.title || 'Campaign'),
        brand: String(campaign?.brand || 'Brand'),
        budget: Number.isFinite(budget) ? Math.max(0, budget) : 0,
        participants: Number.isFinite(participants) ? Math.max(0, participants) : 0,
        status,
        endDate: String(campaign?.endDate || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)),
        progress: Number.isFinite(progress) ? Math.max(0, Math.min(100, progress)) : 0,
        color: String(campaign?.color || 'primary'),
        backgroundImage: String(campaign?.backgroundImage || ''),
        campaignType,
        blockchainNetwork,
        nftPriceMin: Number.isFinite(nftPriceMin) ? Math.max(0, nftPriceMin) : 0,
        nftPriceMax: Number.isFinite(nftPriceMax) ? Math.max(0, nftPriceMax) : 0,
        commissionRate: Number.isFinite(commissionRate) ? Math.max(0, Math.min(100, commissionRate)) : 0,
    }
}

function normalizeCampaigns(list) {
    if (!Array.isArray(list) || !list.length) return DEFAULT_ADMIN_CAMPAIGNS.map(normalizeCampaign)
    return list.map((campaign, idx) => normalizeCampaign(campaign, idx))
}

export function getAdminCampaignsFromStorage() {
    if (typeof window === 'undefined') return normalizeCampaigns(DEFAULT_ADMIN_CAMPAIGNS)
    try {
        const raw = window.localStorage.getItem(ADMIN_CAMPAIGNS_KEY)
        if (!raw) return normalizeCampaigns(DEFAULT_ADMIN_CAMPAIGNS)
        const parsed = JSON.parse(raw)
        return normalizeCampaigns(parsed)
    } catch {
        return normalizeCampaigns(DEFAULT_ADMIN_CAMPAIGNS)
    }
}

export function saveAdminCampaigns(campaigns) {
    if (typeof window === 'undefined') return normalizeCampaigns(campaigns)
    const normalized = normalizeCampaigns(campaigns)
    window.localStorage.setItem(ADMIN_CAMPAIGNS_KEY, JSON.stringify(normalized))
    window.dispatchEvent(new CustomEvent('admin-campaigns-updated', { detail: normalized }))
    return normalized
}

export function syncAdminCampaignsFromService(campaigns) {
    return saveAdminCampaigns(campaigns)
}

export function mapAdminCampaignToUserTask(campaign, idx = 0) {
    const item = normalizeCampaign(campaign, idx)
    const statusLower = item.status.toLowerCase()
    return {
        id: `admin-${item.id}`,
        source: 'admin',
        adminCampaignId: item.id,
        brand: {
            name: item.brand,
            logo: null,
            color: '#f59e0b',
        },
        title: item.title,
        description: item.campaignType === 'nft_launch'
            ? `This NFT campaign is live on ${item.blockchainNetwork || 'blockchain'} network. Current status: ${item.status}.`
            : `This campaign is live now. Current status: ${item.status}. Join and earn rewards.`,
        rewardPool: item.budget,
        myReward: Math.max(100, Math.round(item.budget * 0.1)),
        deadline: `${item.endDate}T00:00:00Z`,
        participants: item.participants,
        maxParticipants: Math.max(item.participants + 500, 2000),
        steps: [
            { id: 1, label: 'Create your campaign post', type: 'selfie', required: true },
            { id: 2, label: 'Upload proof and details', type: 'bill', required: true },
            { id: 3, label: 'Submit your post for voting', type: 'video', required: true },
        ],
        category: item.campaignType === 'nft_launch' ? 'NFT Campaign' : 'Admin Campaign',
        status: statusLower === 'paused' ? 'paused' : (statusLower === 'active' ? 'active' : 'completed'),
        joined: false,
        backgroundImage: item.backgroundImage,
        campaignType: item.campaignType,
        blockchainNetwork: item.blockchainNetwork,
        nftPriceMin: item.nftPriceMin,
        nftPriceMax: item.nftPriceMax,
        commissionRate: item.commissionRate,
    }
}
