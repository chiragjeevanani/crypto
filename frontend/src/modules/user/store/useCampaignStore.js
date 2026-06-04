import { create } from 'zustand'
import { userCampaignService } from '../services/campaignService'
import { mapCampaignToTask } from '../utils/campaignMapper'
import { useWalletStore } from './useWalletStore'

function createHash() {
    return `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`
}

export const useCampaignStore = create((set, get) => ({
    campaigns: [],
    campaignsLoading: false,
    campaignsError: null,
    auditLogs: [],

    loadCampaigns: async () => {
        set({ campaignsLoading: true, campaignsError: null })
        try {
            const list = await userCampaignService.listActive()
            // We map to task format so the UI expects standard fields
            const mapped = (list || []).map((c) => mapCampaignToTask(c, false))
            set({ campaigns: mapped, campaignsLoading: false })
        } catch (error) {
            set({ campaignsError: error.message, campaignsLoading: false })
        }
    },

    submitEntry: async (task, formData) => {
        try {
            await userCampaignService.submit(task.id, formData)
            // Reload campaigns to get the updated participant status and submissions
            await get().loadCampaigns()
            
            set((state) => ({
                auditLogs: [
                    {
                        id: `LOG-${Date.now()}`,
                        timestamp: 'just now',
                        event: `Entry submitted for voting — ${task.title}`,
                        actor: 'You',
                        status: 'Queued',
                        hash: createHash(),
                    },
                    ...state.auditLogs,
                ]
            }))
            return true
        } catch (error) {
            console.warn('Submit entry failed:', error)
            return false
        }
    },

    voteSubmission: async (taskId, submissionId) => {
        try {
            await userCampaignService.vote(taskId, submissionId)
            // Ideally we just update the specific campaign/submission locally
            set((state) => ({
                campaigns: state.campaigns.map((campaign) => {
                    if (campaign.id !== taskId || campaign.votingStatus === 'completed') return campaign
                    return {
                        ...campaign,
                        submissions: campaign.submissions ? campaign.submissions.map((entry) =>
                            entry.id === submissionId ? { ...entry, votes: (entry.votes || 0) + 1 } : entry
                        ) : []
                    }
                })
            }))
            return true
        } catch (error) {
            console.warn('Vote failed:', error)
            return false
        }
    },

    finalizeVoting: (taskId) => {
        // Mock method for frontend simulation only if needed by old UI
    }
}))

