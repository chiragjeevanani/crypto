import { Sliders, RotateCcw, Save, AlertTriangle } from 'lucide-react';
import { AdminPageHeader } from '../components/shared';
import { useSettingsForm } from '../hooks/useSettingsForm';

export default function FinancialRules() {
    const { formData, handleChange, handleCommit, reset, isLoading } = useSettingsForm();

    return (
        <div className="space-y-10 pb-20">
            <AdminPageHeader
                title="Financial Rules"
                subtitle="Adjust fees and transaction caps for the platform."
                actions={
                    <div className="flex gap-3">
                        <button
                            onClick={reset}
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

            <div className="bg-surface border border-surface rounded-lg p-6 space-y-8">
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
                            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted ml-0.5">Min Withdrawal (INR)</label>
                            <input
                                type="number"
                                value={formData.minWithdrawal || 100}
                                onChange={(e) => handleChange('minWithdrawal', parseInt(e.target.value))}
                                className="w-full bg-bg border border-surface rounded-lg py-2.5 px-4 text-xs font-medium focus:ring-1 focus:ring-primary/30 outline-none text-text"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted ml-0.5">Coin Rate (Coins per ₹)</label>
                            <input
                                type="number"
                                value={formData.coinRate || 10}
                                onChange={(e) => handleChange('coinRate', parseInt(e.target.value))}
                                className="w-full bg-bg border border-surface rounded-lg py-2.5 px-4 text-xs font-medium focus:ring-1 focus:ring-primary/30 outline-none text-text"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted ml-0.5">GST (%)</label>
                            <input
                                type="number"
                                value={formData.gstPct || 18}
                                onChange={(e) => handleChange('gstPct', parseFloat(e.target.value))}
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
            </div>

            <div className="bg-amber-500/5 border border-amber-500/10 p-4 rounded-lg flex items-start gap-4">
                <AlertTriangle className="text-amber-500 w-5 h-5 shrink-0" />
                <div>
                    <p className="text-[10px] font-semibold text-amber-500 uppercase tracking-wider mb-1">Administrative Warning</p>
                    <p className="text-[10px] text-amber-500/60 font-medium leading-relaxed uppercase tracking-wider">When you save, these rules are stored in the admin config database and applied across the platform.</p>
                </div>
            </div>
        </div>
    );
}
