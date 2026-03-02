import { ShieldCheck, Power, RotateCcw, Save, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { AdminPageHeader } from '../components/shared';
import { useSettingsForm } from '../hooks/useSettingsForm';

export default function SecurityAccess() {
    const { formData, handleChange, handleCommit, reset, isLoading } = useSettingsForm();

    return (
        <div className="space-y-10 pb-20">
            <AdminPageHeader
                title="Security & Access"
                subtitle="Global operational protocols and access controls."
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
                        <ShieldCheck className="w-4 h-4 text-rose-500" />
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
            </div>

            <div className="bg-amber-500/5 border border-amber-500/10 p-4 rounded-lg flex items-start gap-4">
                <AlertTriangle className="text-amber-500 w-5 h-5 shrink-0" />
                <div>
                    <p className="text-[10px] font-semibold text-amber-500 uppercase tracking-wider mb-1">Administrative Warning</p>
                    <p className="text-[10px] text-amber-500/60 font-medium leading-relaxed uppercase tracking-wider">Changes broadcast an engine update to all nodes. All actions are logged to the SuperAdmin vault.</p>
                </div>
            </div>
        </div>
    );
}
