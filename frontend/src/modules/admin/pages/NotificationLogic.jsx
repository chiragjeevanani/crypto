import { Bell, Zap, RotateCcw, Save, AlertTriangle } from 'lucide-react';
import { AdminPageHeader } from '../components/shared';
import { useSettingsForm } from '../hooks/useSettingsForm';

export default function NotificationLogic() {
    const { formData, handleChange, handleCommit, reset, isLoading } = useSettingsForm();

    return (
        <div className="space-y-10 pb-20">
            <AdminPageHeader
                title="Notification Logic"
                subtitle="Control how system messages are triggered and routed."
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
                <div className="space-y-4">
                    <p className="text-[10px] text-muted">Preview of notification triggers (read-only demo):</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[9px] font-bold uppercase text-muted">Email Opt-in Required</label>
                            <input type="checkbox" checked={formData.emailOptIn ?? true} disabled className="accent-primary" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-bold uppercase text-muted">Max Retries</label>
                            <input type="number" value={formData.maxRetries ?? 3} disabled className="w-full bg-bg border border-surface rounded-lg py-2 px-3 text-xs text-text" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-bold uppercase text-muted">SMS Provider</label>
                            <input type="text" value={formData.smsProvider ?? 'Twilio'} disabled className="w-full bg-bg border border-surface rounded-lg py-2 px-3 text-xs text-text" />
                        </div>
                    </div>
                </div>
                <div className="h-64 flex flex-col items-center justify-center text-center p-8 bg-bg/50 rounded-lg border border-dashed border-surface">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary">
                        <Zap className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-bold text-text uppercase tracking-widest">Notification Logic</h4>
                    <p className="text-[10px] text-muted font-medium uppercase tracking-widest mt-2 max-w-xs">Module under hyper-scaling. Configurations are currently locked to protocol defaults.</p>
                </div>
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
