import React, { useState } from 'react';
import {
    Globe,
    ShieldCheck,
    Lock,
    Save,
    RotateCcw,
    Bell,
    Zap,
    Sliders,
    Power,
    AlertTriangle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { AdminPageHeader } from '../components/shared';

export default function PlatformSettings() {
    const [maintenance, setMaintenance] = useState(false);
    const [kycRequired, setKycRequired] = useState(true);

    return (
        <div className="space-y-10 pb-20">
            <AdminPageHeader
                title="Platform Engine"
                subtitle="Core configuration and global operational protocols."
                actions={
                    <>
                        <button className="flex items-center gap-2 px-5 py-2.5 bg-surface border border-surface rounded-lg text-[10px] font-semibold uppercase tracking-wider hover:bg-rose-500/10 hover:text-rose-500 transition-all text-text">
                            <RotateCcw className="w-3.5 h-3.5" />
                            Reset
                        </button>
                        <button className="flex items-center gap-2 px-6 py-2.5 bg-primary text-black rounded-lg text-[10px] font-semibold uppercase tracking-wider shadow-md">
                            <Save className="w-3.5 h-3.5" />
                            Commit Changes
                        </button>
                    </>
                }
            />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* Navigation for Settings Categories */}
                <div className="md:col-span-1 space-y-1.5">
                    {[
                        { icon: Sliders, label: 'Financial Rules', active: true },
                        { icon: ShieldCheck, label: 'Security & Access', active: false },
                        { icon: Globe, label: 'Network Config', active: false },
                        { icon: Bell, label: 'Notification Logic', active: false },
                        { icon: Zap, label: 'Automation Hooks', active: false },
                    ].map((cat, i) => (
                        <button
                            key={i}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all border ${cat.active
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
                    <div className="bg-surface border border-surface rounded-lg p-6 space-y-8">
                        <section className="space-y-6">
                            <div className="flex items-center gap-3">
                                <Sliders className="w-4 h-4 text-primary" />
                                <h3 className="font-semibold text-sm text-text uppercase tracking-wider">Financial Parameters</h3>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-semibold uppercase tracking-wider text-muted ml-0.5">App Commission (%)</label>
                                    <input type="number" defaultValue="15" className="w-full bg-bg border border-surface rounded-lg py-2.5 px-4 text-xs font-medium focus:ring-1 focus:ring-primary/30 outline-none text-text" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-semibold uppercase tracking-wider text-muted ml-0.5">Min Withdrawal (USD)</label>
                                    <input type="number" defaultValue="25" className="w-full bg-bg border border-surface rounded-lg py-2.5 px-4 text-xs font-medium focus:ring-1 focus:ring-primary/30 outline-none text-text" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-semibold uppercase tracking-wider text-muted ml-0.5">Max Votes / User / Day</label>
                                    <input type="number" defaultValue="50" className="w-full bg-bg border border-surface rounded-lg py-2.5 px-4 text-xs font-medium focus:ring-1 focus:ring-primary/30 outline-none text-text" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-semibold uppercase tracking-wider text-muted ml-0.5">Max Gifts / Minute</label>
                                    <input type="number" defaultValue="200" className="w-full bg-bg border border-surface rounded-lg py-2.5 px-4 text-xs font-medium focus:ring-1 focus:ring-primary/30 outline-none text-text" />
                                </div>
                            </div>
                        </section>

                        <div className="h-px bg-surface2/50"></div>

                        <section className="space-y-6">
                            <div className="flex items-center gap-3">
                                <Lock className="w-4 h-4 text-rose-500" />
                                <h3 className="font-semibold text-sm text-text uppercase tracking-wider">Operational Protocols</h3>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-4 bg-bg rounded-lg border border-surface group transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2 rounded-lg transition-all ${maintenance ? 'bg-rose-500/10 text-rose-500' : 'bg-surface text-muted'}`}>
                                            <Power className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-semibold uppercase tracking-wider text-text">Maintenance Mode</p>
                                            <p className="text-[10px] text-sub font-medium uppercase tracking-wider mt-0.5">Suspend public access</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setMaintenance(!maintenance)}
                                        className={`w-10 h-6 rounded-full relative transition-all duration-300 ${maintenance ? 'bg-rose-500' : 'bg-surface'}`}
                                    >
                                        <motion.div
                                            animate={{ x: maintenance ? 18 : 3 }}
                                            className="absolute top-1 left-0 w-4 h-4 bg-white rounded-full shadow-sm"
                                        />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-bg rounded-lg border border-surface group transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2 rounded-lg transition-all ${kycRequired ? 'bg-emerald-500/10 text-emerald-500' : 'bg-surface text-muted'}`}>
                                            <ShieldCheck className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-semibold uppercase tracking-wider text-text">Global KYC Mandate</p>
                                            <p className="text-[10px] text-sub font-medium uppercase tracking-wider mt-0.5">Force identity verification</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setKycRequired(!kycRequired)}
                                        className={`w-10 h-6 rounded-full relative transition-all duration-300 ${kycRequired ? 'bg-emerald-500' : 'bg-surface'}`}
                                    >
                                        <motion.div
                                            animate={{ x: kycRequired ? 18 : 3 }}
                                            className="absolute top-1 left-0 w-4 h-4 bg-white rounded-full shadow-sm"
                                        />
                                    </button>
                                </div>
                            </div>
                        </section>

                        <div className="bg-amber-500/5 border border-amber-500/10 p-4 rounded-lg flex items-start gap-4">
                            <AlertTriangle className="text-amber-500 w-5 h-5 shrink-0" />
                            <div>
                                <p className="text-[10px] font-semibold text-amber-500 uppercase tracking-wider mb-1">Administrative Warning</p>
                                <p className="text-[10px] text-amber-500/60 font-medium leading-relaxed uppercase tracking-wider">Changes broadcast an engine update to all nodes. All actions are logged to the SuperAdmin vault.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
