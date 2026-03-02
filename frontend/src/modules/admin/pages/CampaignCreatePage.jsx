import React from 'react';
import { useNavigate } from 'react-router-dom';
import CampaignWizard from '../components/CampaignWizard';
import { useAdminStore } from '../store/useAdminStore';

export default function CampaignCreatePage() {
    const navigate = useNavigate();
    const { createCampaign } = useAdminStore();

    const handleWizardSubmit = async (formData) => {
        await createCampaign({
            title: formData.title || 'Untitled Campaign',
            brand: formData.brand || 'Brand',
            budget: Number(formData.budget || 0),
            endDate: formData.endDate || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
            status: 'Active',
        });
        navigate('/admin/campaigns');
    };

    return (
        <div className="space-y-10 pb-20 flex justify-center">
            <CampaignWizard
                mode="page"
                onClose={() => navigate('/admin/campaigns')}
                onSubmit={handleWizardSubmit}
            />
        </div>
    );
}
