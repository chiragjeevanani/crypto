import { useAdminStore } from '../store/useAdminStore';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sliders,
    ShieldCheck,
    Globe,
    Bell,
    Zap,
    RotateCcw,
    Save,
    Lock,
    Power,
    AlertTriangle
} from 'lucide-react';
import { AdminPageHeader } from '../components/shared';

export default function PlatformSettings() {
    const { settings, loadSettings, updatePlatformSettings, isLoading } = useAdminStore();
    const [activeTab, setActiveTab] = useState('Financial Rules');
    const [formData, setFormData] = useState({});

    useEffect(() => {
        loadSettings();
    }, [loadSettings]);

    useEffect(() => {
        if (settings) {
            setFormData(settings);
        }
    }, [settings]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleCommit = () => {
        updatePlatformSettings(formData);
    };

    const tabs = [
        { icon: Sliders, label: 'Financial Rules' },
        { icon: ShieldCheck, label: 'Security & Access' },
        { icon: Globe, label: 'Network Config' },
        { icon: Bell, label: 'Notification Logic' },
        { icon: Zap, label: 'Automation Hooks' },
    ];

    if (!settings && isLoading) return (
        <div className="h-96 flex items-center justify-center">
            <div className="text-center space-y-4">
                <RotateCcw className="w-8 h-8 text-primary animate-spin mx-auto" />
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Syncing Kernel Parameters...</p>
            </div>
        </div>
    );

    return (
        <div className="space-y-10 pb-20">
            <AdminPageHeader
                title="Platform Engine"
                subtitle="Core configuration and global operational protocols."
                actions={
                    <div className="flex gap-3">
                        <button
                            onClick={() => {
                                setFormData(settings);
                                alert('Resetting local changes to kernel state...');
                            }}
                            className="flex items-center gap-2 px-5 py-2.5 bg-surface border border-surface rounded-lg text-[10px] font-semibold uppercase tracking-wider hover:bg-rose-500/10 hover:text-rose-500 transition-all text-text"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Reset
                        </button>
                        <button
                            onClick={handleCommit}
                            disabled={isLoading}
                            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-black rounded-lg text-[10px] font-semibold uppercase tracking-wider shadow-md hover:bg-primary/90 transition-all font-bold disabled:opacity-50"
                        >
                            <Save className={`w-3.5 h-3.5 ${isLoading ? 'animate-pulse' : ''}`} />
                            Commit Changes
                        </button>
                    </div>
                }
            />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* Navigation for Settings Categories */}
                <div className="md:col-span-1 space-y-1.5">
                    {tabs.map((cat, i) => (
                        <button
                            key={i}
                            onClick={() => setActiveTab(cat.label)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all border ${activeTab === cat.label
                                ? 'bg-primary/10 border-primary/20 text-primary'
                                : 'bg-surface border-surface text-muted hover:bg-surface2'
                                }`}
                        >
                            <cat.icon className="w-4 h-4" />
                            <span className="text-[10px] font-semibold uppercase tracking-wider">{cat.label}</span>
                        </button>
                    ))}
                </div>

                {/* Settings Content Area */}
                <div className="md:col-span-3 space-y-6">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.2 }}
                            className="bg-surface border border-surface rounded-lg p-6 space-y-8"
                        >
                            {activeTab === 'Financial Rules' && (
                                <section className="space-y-6">
                                    <div className="flex items-center gap-3">
                                        <Sliders className="w-4 h-4 text-primary" />
                                        <h3 className="font-semibold text-sm text-text uppercase tracking-wider">Financial Parameters</h3>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted ml-0.5">App Commission (%)</label>
                                            <input
                                                type="number"
                                                value={formData.commission || 15}
                                                onChange={(e) => handleChange('commission', parseInt(e.target.value))}
                                                className="w-full bg-bg border border-surface rounded-lg py-2.5 px-4 text-xs font-medium focus:ring-1 focus:ring-primary/30 outline-none text-text"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted ml-0.5">Min Withdrawal (USD)</label>
                                            <input
                                                type="number"
                                                value={formData.minWithdrawal || 25}
                                                onChange={(e) => handleChange('minWithdrawal', parseInt(e.target.value))}
                                                className="w-full bg-bg border border-surface rounded-lg py-2.5 px-4 text-xs font-medium focus:ring-1 focus:ring-primary/30 outline-none text-text"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted ml-0.5">Max Votes / User / Day</label>
                                            <input
                                                type="number"
                                                value={formData.maxVotesDay || 50}
                                                onChange={(e) => handleChange('maxVotesDay', parseInt(e.target.value))}
                                                className="w-full bg-bg border border-surface rounded-lg py-2.5 px-4 text-xs font-medium focus:ring-1 focus:ring-primary/30 outline-none text-text"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted ml-0.5">Max Gifts / Minute</label>
                                            <input
                                                type="number"
                                                value={formData.maxGiftsMinute || 200}
                                                onChange={(e) => handleChange('maxGiftsMinute', parseInt(e.target.value))}
                                                className="w-full bg-bg border border-surface rounded-lg py-2.5 px-4 text-xs font-medium focus:ring-1 focus:ring-primary/30 outline-none text-text"
                                            />
                                        </div>
                                    </div>
                                </section>
                            )}

                            {activeTab === 'Security & Access' && (
                                <section className="space-y-6">
                                    <div className="flex items-center gap-3">
                                        <Lock className="w-4 h-4 text-rose-500" />
                                        <h3 className="font-semibold text-sm text-text uppercase tracking-wider">Operational Protocols</h3>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between p-4 bg-bg rounded-lg border border-surface group transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className={`p-2 rounded-lg transition-all ${formData.maintenanceMode ? 'bg-rose-500/10 text-rose-500' : 'bg-surface text-muted'}`}>
                                                    <Power className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-[11px] font-semibold uppercase tracking-wider text-text">Maintenance Mode</p>
                                                    <p className="text-[10px] text-sub font-medium uppercase tracking-wider mt-0.5">Suspend public access</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleChange('maintenanceMode', !formData.maintenanceMode)}
                                                className={`w-10 h-6 rounded-full relative transition-all duration-300 ${formData.maintenanceMode ? 'bg-rose-500' : 'bg-surface'}`}
                                            >
                                                <motion.div
                                                    animate={{ x: formData.maintenanceMode ? 18 : 3 }}
                                                    className="absolute top-1 left-0 w-4 h-4 bg-white rounded-full shadow-sm"
                                                />
                                            </button>
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-bg rounded-lg border border-surface group transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className={`p-2 rounded-lg transition-all ${formData.kycMandatory ? 'bg-emerald-500/10 text-emerald-500' : 'bg-surface text-muted'}`}>
                                                    <ShieldCheck className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-[11px] font-semibold uppercase tracking-wider text-text">Global KYC Mandate</p>
                                                    <p className="text-[10px] text-sub font-medium uppercase tracking-wider mt-0.5">Force identity verification</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleChange('kycMandatory', !formData.kycMandatory)}
                                                className={`w-10 h-6 rounded-full relative transition-all duration-300 ${formData.kycMandatory ? 'bg-emerald-500' : 'bg-surface'}`}
                                            >
                                                <motion.div
                                                    animate={{ x: formData.kycMandatory ? 18 : 3 }}
                                                    className="absolute top-1 left-0 w-4 h-4 bg-white rounded-full shadow-sm"
                                                />
                                            </button>
                                        </div>
                                    </div>
                                </section>
                            )}

                            {activeTab !== 'Financial Rules' && activeTab !== 'Security & Access' && (
                                <div className="h-64 flex flex-col items-center justify-center text-center p-8 bg-bg/50 rounded-lg border border-dashed border-surface">
                                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary">
                                        <Zap className="w-6 h-6" />
                                    </div>
                                    <h4 className="text-sm font-bold text-text uppercase tracking-widest">{activeTab}</h4>
                                    <p className="text-[10px] text-muted font-medium uppercase tracking-widest mt-2 max-w-xs">Module under hyper-scaling. Configurations are currently locked to protocol defaults.</p>
                                </div>
                            )}

                            <div className="bg-amber-500/5 border border-amber-500/10 p-4 rounded-lg flex items-start gap-4">
                                <AlertTriangle className="text-amber-500 w-5 h-5 shrink-0" />
                                <div>
                                    <p className="text-[10px] font-semibold text-amber-500 uppercase tracking-wider mb-1">Administrative Warning</p>
                                    <p className="text-[10px] text-amber-500/60 font-medium leading-relaxed uppercase tracking-wider">Changes broadcast an engine update to all nodes. All actions are logged to the SuperAdmin vault.</p>
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
