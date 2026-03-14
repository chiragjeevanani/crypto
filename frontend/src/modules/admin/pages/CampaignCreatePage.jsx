import React from 'react';
import { useNavigate } from 'react-router-dom';
import CampaignWizard from '../components/CampaignWizard';
import { useAdminStore } from '../store/useAdminStore';

export default function CampaignCreatePage() {
    const navigate = useNavigate();
    const { createCampaign } = useAdminStore();

    const handleWizardSubmit = async (formData) => {
        const primaryImage = (formData.assets || []).find((asset) => asset?.isPrimary && asset?.type === 'image');
        const firstImage = (formData.assets || []).find((asset) => asset?.type === 'image');
        const backgroundImage = primaryImage?.url || firstImage?.url || '';
        const campaignType = formData.campaignType || 'brand_task';
        const useNftSettings = campaignType === 'nft_launch' || campaignType === 'mixed';
        const nftPriceMin = Number(formData.nftPriceMin || 1);
        const nftPriceMax = Number(formData.nftPriceMax || 20);
        const normalizedNftPriceMin = Math.max(1, Math.min(20, nftPriceMin));
        const normalizedNftPriceMax = Math.max(normalizedNftPriceMin, Math.min(20, nftPriceMax));

        await createCampaign({
            title: formData.title || 'Untitled Campaign',
            description: formData.description || 'Campaign description',
            brandName: formData.brand || 'Brand',
            bannerUrl: backgroundImage,
            startDate: formData.startDate || new Date().toISOString().slice(0, 10),
            endDate: formData.endDate || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
            participationType: formData.participationType || 'free',
            taskInstructions: formData.taskInstructions || 'Follow the campaign steps',
            rewardDetails: formData.rewardDetails || 'Reward to be announced',
            numberOfWinners: Number(formData.numberOfWinners || 1),
            votingEnabled: Boolean(formData.votingEnabled),
            tasks: formData.tasks || [],
            assets: formData.assets || [],
            campaignType,
            blockchainNetwork: useNftSettings ? (formData.blockchainNetwork || 'polygon') : '',
            nftPriceMin: useNftSettings ? normalizedNftPriceMin : 0,
            nftPriceMax: useNftSettings ? normalizedNftPriceMax : 0,
            commissionRate: useNftSettings ? Math.max(0, Math.min(100, Number(formData.commissionRate || 0))) : 0,
            status: 'Active',
            budget: Number(formData.budget || 0),
        });
        navigate('/admin/campaigns');
    };

    return (
        <div className="w-full min-h-[calc(100vh-80px)] flex justify-center items-start md:items-center p-3 sm:p-4 md:p-6 rounded-2xl border border-surface bg-bg">
            <div className="w-full max-w-4xl p-0 sm:p-1 rounded-2xl sm:rounded-3xl shadow-none md:shadow-2xl border border-surface bg-surface">
                <CampaignWizard
                    mode="page"
                    onClose={() => navigate('/admin/campaigns')}
                    onSubmit={handleWizardSubmit}
                />
            </div>
        </div>
    );
}
