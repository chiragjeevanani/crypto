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
        brand: '',
        budget: '',
        endDate: '',
        tasks: [],
        assets: [],
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
            brand: '',
            budget: '',
            endDate: '',
            tasks: [],
            assets: [],
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
        ? 'bg-surface border border-surface w-[min(100%,1120px)] max-h-[90vh] rounded-2xl overflow-hidden flex flex-col shadow-lg'
        : 'bg-surface border border-surface w-full max-w-2xl max-h-[90vh] rounded-2xl overflow-hidden flex flex-col shadow-xl';

    const WizardBody = () => (
        <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className={containerClasses}
        >
            {/* Header */}
            <div className="p-6 border-b border-surface flex items-center justify-between bg-surface2/50">
                <div>
                    <h2 className="text-lg font-bold text-text uppercase tracking-tighter">
                        Create Campaign Protocol
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
            <div className="px-6 py-4 border-b border-surface flex items-center gap-3 bg-bg/50">
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
            <div className="flex-1 overflow-y-auto hide-scrollbar">
                <div className="p-6 space-y-6">
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <h3 className="text-[11px] font-bold text-muted uppercase tracking-[0.2em]">
                                    Campaign Basics
                                </h3>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">
                                        Mandate Title *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={e => handleInputChange('title', e.target.value)}
                                        placeholder="e.g., Summer Flash Sale 2026"
                                        className="w-full bg-bg border border-surface rounded-xl py-3 px-4 text-xs font-medium text-text placeholder-muted/50 focus:ring-1 focus:ring-primary/30 outline-none"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">
                                            Brand Authority *
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
                                            Allocated Budget (₹) *
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
                                        Campaign End Date *
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.endDate}
                                        onChange={e => handleInputChange('endDate', e.target.value)}
                                        className="w-full bg-bg border border-surface rounded-xl py-3 px-4 text-xs font-medium text-text focus:ring-1 focus:ring-primary/30 outline-none"
                                    />
                                </div>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <TaskBuilder
                                    tasks={formData.tasks}
                                    onChange={tasks => handleInputChange('tasks', tasks)}
                                    maxTasks={5}
                                />
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <AssetUploader
                                    assets={formData.assets}
                                    onChange={assets => handleInputChange('assets', assets)}
                                    maxAssets={10}
                                />
                            </motion.div>
                        )}

                        {step === 4 && (
                            <motion.div
                                key="step4"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <h3 className="text-[11px] font-bold text-muted uppercase tracking-[0.2em]">
                                    Targeting Rules
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">
                                            Audience Scope
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
                                                Segment Identifier
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
                                            Blacklist Users (comma-separated IDs)
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
                            </motion.div>
                        )}

                        {step === 5 && (
                            <motion.div
                                key="step5"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <h3 className="text-[11px] font-bold text-muted uppercase tracking-[0.2em]">
                                    Review &amp; Deploy
                                </h3>
                                <pre className="bg-bg p-4 rounded-lg text-[10px] overflow-x-auto">
                                    {JSON.stringify(formData, null, 2)}
                                </pre>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Navigation Buttons */}
                <div className="px-6 py-4 border-t border-surface flex justify-between bg-bg/50">
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
                            Deploy
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );

    if (mode === 'modal') {
        return (
            <>
                <div
                    className="fixed inset-0 bg-black/40"
                    onClick={onClose}
                />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <WizardBody />
                </div>
            </>
        );
    }

    // page mode
    return (
        <div className="w-full flex justify-center p-4">
            <WizardBody />
        </div>
    );
}
