import React, { useState } from 'react';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import TaskBuilder from './TaskBuilder';
import AssetUploader from './AssetUploader';

export default function CampaignWizard({ mode = 'modal', isOpen = true, onClose, onSubmit }) {
    // mode: 'modal' (default) renders overlay/backdrop, 'page' renders inline centered
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        brand: '',
        budget: '',
        rewardDetails: '',
        numberOfWinners: 1,
        votingEnabled: true,
        participationType: 'free',
        startDate: '',
        endDate: '',
        taskInstructions: '',
        campaignType: 'brand_task',
        tasks: [],
        assets: [],
        blockchainNetwork: 'polygon',
        nftPriceMin: 1,
        nftPriceMax: 20,
        commissionRate: 10,
        targetAudience: 'all',
        audienceSegment: '',
        maxParticipants: '',
        blacklistedUsers: '',
        status: 'draft',
    });

    const handleNext = () => {
        if (step < 5) setStep(step + 1);
    };
    const handlePrev = () => {
        if (step > 1) setStep(step - 1);
    };
    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };
    const handleSubmit = () => {
        onSubmit(formData);
        // reset state
        setFormData({
            title: '',
            description: '',
            brand: '',
            budget: '',
            rewardDetails: '',
            numberOfWinners: 1,
            votingEnabled: true,
            participationType: 'free',
            startDate: '',
            endDate: '',
            taskInstructions: '',
            campaignType: 'brand_task',
            tasks: [],
            assets: [],
            blockchainNetwork: 'polygon',
            nftPriceMin: 1,
            nftPriceMax: 20,
            commissionRate: 10,
            targetAudience: 'all',
            audienceSegment: '',
            maxParticipants: '',
            blacklistedUsers: '',
            status: 'draft',
        });
        setStep(1);
        onClose();
    };

    if (mode === 'modal' && !isOpen) return null;

    const steps = [
        { number: 1, label: 'Basic Info' },
        { number: 2, label: 'Tasks' },
        { number: 3, label: 'Creatives' },
        { number: 4, label: 'Targeting' },
        { number: 5, label: 'Review' },
    ];

    const containerClasses = mode === 'page'
        ? 'bg-surface border border-surface w-full max-w-4xl rounded-2xl sm:rounded-3xl overflow-hidden flex flex-col shadow-none md:shadow-lg'
        : 'bg-surface border border-surface w-full max-w-2xl max-h-[90vh] rounded-2xl overflow-hidden flex flex-col shadow-xl';

    const renderWizardShell = (children) => {
        if (mode === 'page') {
            return <div className={containerClasses}>{children}</div>
        }
        return (
            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className={containerClasses}
            >
                {children}
            </motion.div>
        )
    }

    const renderStepWrap = (stepKey, children) => {
        if (mode === 'page') {
            return <div key={stepKey}>{children}</div>
        }
        return (
            <motion.div
                key={stepKey}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
            >
                {children}
            </motion.div>
        )
    }

    const renderPresence = (children) => {
        if (mode === 'page') return <>{children}</>
        return <AnimatePresence mode="wait">{children}</AnimatePresence>
    }

    const wizardBody = renderWizardShell(
        <>
            {/* Header */}
            <div className="p-4 sm:p-6 border-b border-surface flex items-center justify-between bg-surface2/50">
                <div>
                    <h2 className="text-lg font-bold text-text uppercase tracking-tighter">
                        Create Campaign
                    </h2>
                    <p className="text-[10px] text-muted uppercase tracking-wider mt-1">
                        Step {step} of {steps.length}
                    </p>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-surface rounded-lg transition-colors text-muted hover:text-text"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Progress Indicator */}
            <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-surface flex items-center gap-3 bg-bg/50">
                {steps.map((s, idx) => (
                    <div key={s.number} className="flex items-center gap-3 flex-1">
                        <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                                step >= s.number
                                    ? 'bg-primary text-black'
                                    : 'bg-surface text-muted'
                            }`}
                        >
                            {s.number}
                        </div>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-muted hidden sm:block">
                            {s.label}
                        </span>
                        {idx < steps.length - 1 && (
                            <div
                                className={`flex-1 h-0.5 transition-all ${
                                    step > s.number ? 'bg-primary' : 'bg-surface'
                                }`}
                            />
                        )}
                    </div>
                ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto md:overflow-y-auto hide-scrollbar">
                <div className="p-4 sm:p-6 space-y-6">
                    {renderPresence(
                        <>
                            {step === 1 && (
                                renderStepWrap("step1",
                                    <div className="space-y-6">
                                <h3 className="text-[11px] font-bold text-muted uppercase tracking-[0.2em]">
                                    Campaign Basics
                                </h3>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">
                                        Campaign Title *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={e => handleInputChange('title', e.target.value)}
                                        placeholder="e.g., Summer Flash Sale 2026"
                                        className="w-full bg-bg border border-surface rounded-xl py-3 px-4 text-xs font-medium text-text placeholder-muted/50 focus:ring-1 focus:ring-primary/30 outline-none"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">
                                            Brand Name *
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.brand}
                                            onChange={e => handleInputChange('brand', e.target.value)}
                                            placeholder="Brand name"
                                            className="w-full bg-bg border border-surface rounded-xl py-3 px-4 text-xs font-medium text-text placeholder-muted/50 focus:ring-1 focus:ring-primary/30 outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">
                                            Prize Pool / Budget (INR) *
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.budget}
                                            onChange={e => handleInputChange('budget', parseFloat(e.target.value) || '')}
                                            placeholder="0.00"
                                            min="0"
                                            step="0.01"
                                            className="w-full bg-bg border border-surface rounded-xl py-3 px-4 text-xs font-medium text-text placeholder-muted/50 focus:ring-1 focus:ring-primary/30 outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">
                                        Campaign Description *
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={e => handleInputChange('description', e.target.value)}
                                        placeholder="Short description to help creators understand the campaign"
                                        rows="3"
                                        className="w-full bg-bg border border-surface rounded-xl py-3 px-4 text-xs font-medium text-text placeholder-muted/50 focus:ring-1 focus:ring-primary/30 outline-none resize-none"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">
                                        Campaign Type
                                    </label>
                                    <select
                                        value={formData.campaignType}
                                        onChange={e => handleInputChange('campaignType', e.target.value)}
                                        className="w-full bg-bg border border-surface rounded-xl py-3 px-4 text-xs font-medium text-text outline-none focus:ring-1 focus:ring-primary/30"
                                    >
                                        <option value="brand_task">Brand Task</option>
                                        <option value="nft_launch">NFT Launch</option>
                                        <option value="mixed">Mixed (Task + NFT)</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">
                                            Campaign Start Date *
                                        </label>
                                        <input
                                            type="date"
                                            value={formData.startDate}
                                            onChange={e => handleInputChange('startDate', e.target.value)}
                                            className="w-full bg-bg border border-surface rounded-xl py-3 px-4 text-xs font-medium text-text focus:ring-1 focus:ring-primary/30 outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">
                                            Campaign End Date *
                                        </label>
                                        <input
                                            type="date"
                                            value={formData.endDate}
                                            onChange={e => handleInputChange('endDate', e.target.value)}
                                            className="w-full bg-bg border border-surface rounded-xl py-3 px-4 text-xs font-medium text-text focus:ring-1 focus:ring-primary/30 outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">
                                            Participation Type
                                        </label>
                                        <select
                                            value={formData.participationType}
                                            onChange={e => handleInputChange('participationType', e.target.value)}
                                            className="w-full bg-bg border border-surface rounded-xl py-3 px-4 text-xs font-medium text-text outline-none focus:ring-1 focus:ring-primary/30"
                                        >
                                            <option value="free">Free for everyone</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">
                                            Number of Winners *
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={formData.numberOfWinners}
                                            onChange={e => handleInputChange('numberOfWinners', parseInt(e.target.value, 10) || 1)}
                                            className="w-full bg-bg border border-surface rounded-xl py-3 px-4 text-xs font-medium text-text focus:ring-1 focus:ring-primary/30 outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">
                                            Voting Enabled
                                        </label>
                                        <select
                                            value={formData.votingEnabled ? 'yes' : 'no'}
                                            onChange={e => handleInputChange('votingEnabled', e.target.value === 'yes')}
                                            className="w-full bg-bg border border-surface rounded-xl py-3 px-4 text-xs font-medium text-text outline-none focus:ring-1 focus:ring-primary/30"
                                        >
                                            <option value="yes">Yes</option>
                                            <option value="no">No</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">
                                            Prize / Reward Details *
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.rewardDetails}
                                            onChange={e => handleInputChange('rewardDetails', e.target.value)}
                                            placeholder="e.g., ₹10,000 cash + merch pack"
                                            className="w-full bg-bg border border-surface rounded-xl py-3 px-4 text-xs font-medium text-text placeholder-muted/50 focus:ring-1 focus:ring-primary/30 outline-none"
                                        />
                                    </div>
                                </div>

                                {(formData.campaignType === 'nft_launch' || formData.campaignType === 'mixed') && (
                                    <div className="space-y-4 rounded-xl border border-surface bg-bg/60 p-4">
                                        <h4 className="text-[10px] font-bold text-muted uppercase tracking-widest">
                                            NFT & Blockchain Settings
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-bold text-muted uppercase tracking-widest">
                                                    Blockchain Network
                                                </label>
                                                <select
                                                    value={formData.blockchainNetwork}
                                                    onChange={e => handleInputChange('blockchainNetwork', e.target.value)}
                                                    className="w-full bg-bg border border-surface rounded-lg py-2 px-3 text-xs font-medium text-text outline-none focus:ring-1 focus:ring-primary/30"
                                                >
                                                    <option value="polygon">Polygon</option>
                                                    <option value="ethereum">Ethereum</option>
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-bold text-muted uppercase tracking-widest">
                                                    Platform Commission (%)
                                                </label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    step="0.1"
                                                    value={formData.commissionRate}
                                                    onChange={e => handleInputChange('commissionRate', parseFloat(e.target.value) || 0)}
                                                    className="w-full bg-bg border border-surface rounded-lg py-2 px-3 text-xs font-medium text-text outline-none focus:ring-1 focus:ring-primary/30"
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-bold text-muted uppercase tracking-widest">
                                                    NFT Min Price (USD)
                                                </label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max={Number(formData.nftPriceMax || 20)}
                                                    step="0.01"
                                                    value={formData.nftPriceMin}
                                                    onChange={e => handleInputChange('nftPriceMin', parseFloat(e.target.value) || 1)}
                                                    className="w-full bg-bg border border-surface rounded-lg py-2 px-3 text-xs font-medium text-text outline-none focus:ring-1 focus:ring-primary/30"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-bold text-muted uppercase tracking-widest">
                                                    NFT Max Price (USD)
                                                </label>
                                                <input
                                                    type="number"
                                                    min={Number(formData.nftPriceMin || 1)}
                                                    max="20"
                                                    step="0.01"
                                                    value={formData.nftPriceMax}
                                                    onChange={e => handleInputChange('nftPriceMax', parseFloat(e.target.value) || 20)}
                                                    className="w-full bg-bg border border-surface rounded-lg py-2 px-3 text-xs font-medium text-text outline-none focus:ring-1 focus:ring-primary/30"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                                    </div>
                                )
                            )}

                            {step === 2 && (
                                renderStepWrap("step2",
                                    <>
                                        <div className="space-y-2 mb-6">
                                    <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">
                                        Task Instructions (Overall) *
                                    </label>
                                    <textarea
                                        value={formData.taskInstructions}
                                        onChange={e => handleInputChange('taskInstructions', e.target.value)}
                                        placeholder="Explain what users must do to participate"
                                        rows="3"
                                        className="w-full bg-bg border border-surface rounded-xl py-3 px-4 text-xs font-medium text-text placeholder-muted/50 focus:ring-1 focus:ring-primary/30 outline-none resize-none"
                                    />
                                        </div>
                                        <TaskBuilder
                                    tasks={formData.tasks}
                                    onChange={tasks => handleInputChange('tasks', tasks)}
                                    maxTasks={5}
                                />
                                    </>
                            )
                        )}

                        {step === 3 && (
                            renderStepWrap("step3",
                                <AssetUploader
                                    assets={formData.assets}
                                    onChange={assets => handleInputChange('assets', assets)}
                                    maxAssets={10}
                                />
                            )
                        )}

                        {step === 4 && (
                            renderStepWrap("step4",
                                <div className="space-y-6">
                                <h3 className="text-[11px] font-bold text-muted uppercase tracking-[0.2em]">
                                    Targeting
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">
                                            Audience
                                            </label>
                                        <select
                                            value={formData.targetAudience}
                                            onChange={e => handleInputChange('targetAudience', e.target.value)}
                                            className="w-full bg-bg border border-surface rounded-xl py-3 px-4 text-xs font-medium text-text outline-none focus:ring-1 focus:ring-primary/30"
                                        >
                                            <option value="all">All Users</option>
                                            <option value="segment">Segment</option>
                                        </select>
                                    </div>
                                    {formData.targetAudience === 'segment' && (
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">
                                                Audience Segment
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.audienceSegment}
                                                onChange={e => handleInputChange('audienceSegment', e.target.value)}
                                                placeholder="e.g. VIP, beta testers"
                                                className="w-full bg-bg border border-surface rounded-xl py-3 px-4 text-xs font-medium text-text outline-none focus:ring-1 focus:ring-primary/30"
                                            />
                                        </div>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">
                                            Max Participants
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.maxParticipants}
                                            onChange={e => handleInputChange('maxParticipants', e.target.value)}
                                            placeholder="Leave blank for unlimited"
                                            min="0"
                                            className="w-full bg-bg border border-surface rounded-xl py-3 px-4 text-xs font-medium text-text outline-none focus:ring-1 focus:ring-primary/30"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">
                                            Excluded Users (comma-separated IDs)
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.blacklistedUsers}
                                            onChange={e => handleInputChange('blacklistedUsers', e.target.value)}
                                            placeholder="U-1234,U-5678"
                                            className="w-full bg-bg border border-surface rounded-xl py-3 px-4 text-xs font-medium text-text outline-none focus:ring-1 focus:ring-primary/30"
                                        />
                                    </div>
                                </div>
                                </div>
                            )
                        )}

                        {step === 5 && (
                            renderStepWrap("step5",
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-[11px] font-bold text-muted uppercase tracking-[0.2em]">
                                            Final Review
                                        </h3>
                                        <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 rounded text-[8px] font-bold uppercase tracking-wider">Ready to Launch</span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <div className="p-4 rounded-xl border border-surface bg-bg/40 space-y-3">
                                                <div className="aspect-video rounded-lg overflow-hidden border border-surface bg-surface shadow-inner relative">
                                                    {(() => {
                                                        const primary = formData.assets.find(a => a.isPrimary) || formData.assets[0];
                                                        if (!primary) return <div className="w-full h-full flex items-center justify-center text-[9px] text-muted">No banner image</div>;
                                                        return primary.type === 'video' ? (
                                                            <video src={primary.url} controls className="w-full h-full object-cover" />
                                                        ) : (
                                                            <img src={primary.url} className="w-full h-full object-cover" />
                                                        );
                                                    })()}
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-primary uppercase tracking-wider">{formData.brand || 'No Brand'}</p>
                                                    <h4 className="text-sm font-extrabold text-text mt-1">{formData.title || 'Untitled Campaign'}</h4>
                                                    <p className="text-xs text-muted mt-2 line-clamp-3 leading-relaxed">{formData.description || 'No description provided'}</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="p-3 rounded-xl border border-surface bg-bg/40">
                                                    <p className="text-[8px] font-bold text-muted uppercase tracking-widest">Start Date</p>
                                                    <p className="text-[10px] font-bold text-text mt-1">{formData.startDate || 'TBD'}</p>
                                                </div>
                                                <div className="p-3 rounded-xl border border-surface bg-bg/40">
                                                    <p className="text-[8px] font-bold text-muted uppercase tracking-widest">End Date</p>
                                                    <p className="text-[10px] font-bold text-text mt-1">{formData.endDate || 'TBD'}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="p-4 rounded-xl border border-surface bg-bg/40">
                                                <h5 className="text-[9px] font-bold text-muted uppercase tracking-widest mb-3 flex items-center justify-between">
                                                    Tasks Checklist
                                                    <span className="text-primary">{formData.tasks.length} Steps</span>
                                                </h5>
                                                <div className="space-y-2">
                                                    {formData.tasks.length > 0 ? formData.tasks.map((t, i) => (
                                                        <div key={i} className="flex items-start gap-3 p-2 rounded-lg bg-surface/40 border border-surface/50">
                                                            <div className="w-4 h-4 rounded-full bg-primary/20 text-primary text-[8px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                                                                {i + 1}
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] font-bold text-text">{t.name || 'Untitled Task'}</p>
                                                                <p className="text-[9px] text-muted mt-0.5">{t.instructions || t.description}</p>
                                                            </div>
                                                        </div>
                                                    )) : (
                                                        <p className="text-[9px] text-muted italic">No specific tasks added.</p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="p-4 rounded-xl border border-surface bg-bg/40">
                                                <h5 className="text-[9px] font-bold text-muted uppercase tracking-widest mb-3">Rewards & Targeting</h5>
                                                <div className="space-y-2 text-[10px]">
                                                    <div className="flex justify-between p-2 rounded-lg bg-surface/20">
                                                        <span className="text-muted">Reward Details</span>
                                                        <span className="font-bold text-text">{formData.rewardDetails || 'N/A'}</span>
                                                    </div>
                                                    <div className="flex justify-between p-2 rounded-lg bg-surface/20">
                                                        <span className="text-muted">Winners</span>
                                                        <span className="font-bold text-text">{formData.numberOfWinners} Users</span>
                                                    </div>
                                                    <div className="flex justify-between p-2 rounded-lg bg-surface/20">
                                                        <span className="text-muted">Targeting</span>
                                                        <span className="font-bold text-text capitalize">{formData.targetAudience === 'all' ? 'All Users' : formData.audienceSegment}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        )}
                        </>
                    )}
                </div>

                {/* Navigation Buttons */}
                <div className="px-4 py-3 sm:px-6 sm:py-4 border-t border-surface flex justify-between bg-bg/50">
                    <button
                        onClick={handlePrev}
                        disabled={step === 1}
                        className="flex items-center gap-2 px-4 py-2 bg-surface border border-surface rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-surface2 transition-all disabled:opacity-50"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Back
                    </button>
                    {step < steps.length ? (
                        <button
                            onClick={handleNext}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-black rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-primary/90 transition-all"
                        >
                            Next
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-black rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-emerald-600 transition-all"
                        >
                            Create Campaign
                        </button>
                    )}
                </div>
            </div>
        </>
    );

    if (mode === 'modal') {
        return (
            <>
                <div
                    className="fixed inset-0 bg-black/40"
                    onClick={onClose}
                />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    {wizardBody}
                </div>
            </>
        );
    }

    // page mode
    return (
        <div className="w-full flex justify-center p-2 sm:p-4">
            {wizardBody}
        </div>
    );
}
