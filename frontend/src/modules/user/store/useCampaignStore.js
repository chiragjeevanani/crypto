import { create } from 'zustand'
import { mockTasks } from '../data/mockTasks'
import { useWalletStore } from './useWalletStore'

function createHash() {
    return `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`
}

const seedCampaigns = mockTasks.map((task, idx) => {
    const base = {
        ...task,
        votingStatus: idx < 2 ? 'completed' : 'live',
        payoutIssued: false,
        winner: null,
        submissions: [
            {
                id: `${task.id}_sub_a`,
                creatorHandle: '@trendmaker',
                creatorName: 'Trend Maker',
                votes: 42 + idx * 5,
                isMine: false,
            },
            {
                id: `${task.id}_sub_b`,
                creatorHandle: '@viralcreator',
                creatorName: 'Viral Creator',
                votes: 37 + idx * 4,
                isMine: false,
            },
        ],
    }

    if (task.joined) {
        base.submissions.unshift({
            id: `${task.id}_sub_me`,
            creatorHandle: '@chiragj',
            creatorName: 'You',
            votes: idx < 2 ? 55 + idx : 14 + idx,
            isMine: true,
        })
    }

    if (base.votingStatus === 'completed') {
        const top = [...base.submissions].sort((a, b) => b.votes - a.votes)[0]
        base.winner = top
    }

    return base
})

const initialAuditLogs = seedCampaigns
    .filter((campaign) => campaign.votingStatus === 'completed')
    .map((campaign, i) => ({
        id: `LOG-${4200 + i}`,
        timestamp: `${2 + i} days ago`,
        event: `Winner finalized — ${campaign.title}`,
        actor: 'Voting Engine',
        status: 'Completed',
        hash: createHash(),
    }))

export const useCampaignStore = create((set, get) => ({
    campaigns: seedCampaigns,
    auditLogs: initialAuditLogs,

    submitEntry: (task) => {
        let submitted = false
        set((state) => ({
            campaigns: state.campaigns.map((campaign) => {
                if (campaign.id !== task.id) return campaign
                const mine = campaign.submissions.find((entry) => entry.isMine)
                if (mine) return campaign
                submitted = true
                return {
                    ...campaign,
                    votingStatus: 'live',
                    submissions: [
                        {
                            id: `${task.id}_sub_${Date.now()}`,
                            creatorHandle: '@chiragj',
                            creatorName: 'You',
                            votes: 0,
                            isMine: true,
                        },
                        ...campaign.submissions,
                    ],
                }
            }),
            auditLogs: submitted
                ? [
                    {
                        id: `LOG-${Date.now()}`,
                        timestamp: 'just now',
                        event: `Entry submitted for voting — ${task.title}`,
                        actor: '@chiragj',
                        status: 'Queued',
                        hash: createHash(),
                    },
                    ...state.auditLogs,
                ]
                : state.auditLogs,
        }))
        return submitted
    },

    voteSubmission: (taskId, submissionId) => set((state) => ({
        campaigns: state.campaigns.map((campaign) => {
            if (campaign.id !== taskId || campaign.votingStatus === 'completed') return campaign
            return {
                ...campaign,
                submissions: campaign.submissions.map((entry) =>
                    entry.id === submissionId ? { ...entry, votes: entry.votes + 1 } : entry,
                ),
            }
        }),
    })),

    finalizeVoting: (taskId) => {
        let payout = null
        set((state) => ({
            campaigns: state.campaigns.map((campaign) => {
                if (campaign.id !== taskId || campaign.votingStatus === 'completed') return campaign
                const winner = [...campaign.submissions].sort((a, b) => b.votes - a.votes)[0] || null
                if (winner?.isMine && !campaign.payoutIssued) {
                    payout = { amount: campaign.myReward, brandName: campaign.brand.name }
                }
                return {
                    ...campaign,
                    votingStatus: 'completed',
                    winner,
                    payoutIssued: Boolean(winner?.isMine),
                }
            }),
            auditLogs: [
                {
                    id: `LOG-${Date.now()}`,
                    timestamp: 'just now',
                    event: 'Campaign winner finalized',
                    actor: 'Voting Engine',
                    status: 'Completed',
                    hash: createHash(),
                },
                ...state.auditLogs,
            ],
        }))
        if (payout) {
            useWalletStore.getState().addTaskEarning(payout.amount, payout.brandName)
        }
    },
}))

