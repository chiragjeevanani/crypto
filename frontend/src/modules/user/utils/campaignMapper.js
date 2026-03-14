const BRAND_FALLBACK = '#f59e0b'

const BRAND_COLORS = {
    Swiggy: '#FC8019',
    Myntra: '#FF3F6C',
    BoAt: '#E63946',
    Nykaa: '#FC2779',
    Meesho: '#9B51E0',
}

const parseRewardAmount = (rewardDetails) => {
    if (!rewardDetails) return null
    const match = String(rewardDetails).match(/[\d,.]+/)
    if (!match) return null
    const raw = match[0].replace(/,/g, '')
    const value = Number(raw)
    return Number.isFinite(value) ? value : null
}

export const deriveCampaignSteps = (campaign) => {
    if (Array.isArray(campaign?.tasks) && campaign.tasks.length) {
        return campaign.tasks.map((task, idx) => ({
            id: task.id || `${campaign.id || campaign._id || 'task'}-${idx}`,
            label: task.name || task.description || task.instructions || `Task ${idx + 1}`,
            type: task.completionProof || 'text',
            required: true,
        }))
    }
    if (campaign?.taskInstructions) {
        return [
            {
                id: 'instruction',
                label: String(campaign.taskInstructions),
                type: 'text',
                required: true,
            },
        ]
    }
    return []
}

export const mapCampaignToTask = (campaign, joined = false) => {
    if (!campaign) return null
    const id = campaign.id || campaign._id
    const rewardAmount = parseRewardAmount(campaign.rewardDetails)
    const winners = Number(campaign.numberOfWinners || 1) || 1
    const myReward = rewardAmount ? Math.max(1, Math.round(rewardAmount / winners)) : 0
    const brandName = campaign.brandName || 'Brand'
    return {
        id: String(id),
        campaignId: String(id),
        source: 'campaign',
        brand: {
            name: brandName,
            logo: null,
            color: BRAND_COLORS[brandName] || BRAND_FALLBACK,
        },
        title: campaign.title || 'Campaign',
        description: campaign.description || '',
        taskInstructions: campaign.taskInstructions || '',
        rewardDetails: campaign.rewardDetails || '',
        rewardPool: rewardAmount || 0,
        myReward,
        deadline: campaign.endDate || campaign.deadline || '',
        participants: Number(campaign.participants || 0),
        maxParticipants: Number(campaign.maxParticipants || 0),
        steps: deriveCampaignSteps(campaign),
        category: 'Campaign',
        status: String(campaign.status || 'active').toLowerCase(),
        joined: Boolean(joined),
        backgroundImage: campaign.bannerUrl || campaign.backgroundImage || '',
        votingEnabled: campaign.votingEnabled !== false,
        numberOfWinners: Number(campaign.numberOfWinners || 1),
    }
}
