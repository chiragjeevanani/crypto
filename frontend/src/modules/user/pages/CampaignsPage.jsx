import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Megaphone, Trophy } from 'lucide-react'
import { mockTasks } from '../data/mockTasks'
import { useCampaignStore } from '../store/useCampaignStore'
import { getAdminCampaignsFromStorage, mapAdminCampaignToUserTask } from '../../../shared/adminCampaignSync'

export default function CampaignsPage() {
    const navigate = useNavigate()
    const { campaigns } = useCampaignStore()
    const [adminTasks, setAdminTasks] = useState([])

    useEffect(() => {
        const hydrateCampaigns = () => {
            const fromAdmin = getAdminCampaignsFromStorage().map((campaign, idx) => mapAdminCampaignToUserTask(campaign, idx))
            setAdminTasks(fromAdmin)
        }
        hydrateCampaigns()
        const onUpdate = () => hydrateCampaigns()
        const onStorage = (event) => {
            if (event.key === 'socialearn_admin_campaigns_v1') hydrateCampaigns()
        }
        window.addEventListener('admin-campaigns-updated', onUpdate)
        window.addEventListener('storage', onStorage)
        return () => {
            window.removeEventListener('admin-campaigns-updated', onUpdate)
            window.removeEventListener('storage', onStorage)
        }
    }, [])

    const allCampaigns = useMemo(
        () => [...adminTasks, ...mockTasks].filter((task) => task.status === 'active'),
        [adminTasks],
    )
    const recentWinners = campaigns.filter((item) => item.votingStatus === 'completed' && item.winner).slice(0, 6)

    return (
        <div className="px-4 pt-4 pb-20">
            <div className="mb-4">
                <h1 className="text-xl font-extrabold" style={{ color: 'var(--color-text)' }}>Campaigns</h1>
                <p className="text-sm mt-0.5" style={{ color: 'var(--color-muted)' }}>
                    Browse live campaigns and recent winners.
                </p>
            </div>

            <div className="rounded-2xl p-4" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                <div className="flex items-center gap-2 mb-3">
                    <Megaphone size={16} style={{ color: 'var(--color-primary)' }} />
                    <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Live Campaigns</p>
                </div>
                <div className="space-y-2.5">
                    {allCampaigns.length === 0 && (
                        <p className="text-[11px]" style={{ color: 'var(--color-muted)' }}>No active campaigns.</p>
                    )}
                    {allCampaigns.map((task) => (
                        <button
                            key={task.id}
                            onClick={() => navigate(`/tasks/${encodeURIComponent(task.id)}`)}
                            className="w-full text-left rounded-xl p-3"
                            style={{ background: 'var(--color-surface2)' }}
                        >
                            <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{task.title}</p>
                            <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>{task.brand.name}</p>
                        </button>
                    ))}
                </div>
            </div>

            <div className="mt-4 rounded-2xl p-4" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                <div className="flex items-center gap-2 mb-3">
                    <Trophy size={16} style={{ color: 'var(--color-success)' }} />
                    <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Task Winner List</p>
                </div>
                <div className="space-y-2">
                    {recentWinners.length === 0 && (
                        <p className="text-[11px]" style={{ color: 'var(--color-muted)' }}>No winners yet.</p>
                    )}
                    {recentWinners.map((campaign) => (
                        <div key={campaign.id} className="flex items-center justify-between text-xs">
                            <span style={{ color: 'var(--color-sub)' }}>{campaign.title}</span>
                            <span style={{ color: 'var(--color-success)' }}>{campaign.winner?.creatorHandle}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
