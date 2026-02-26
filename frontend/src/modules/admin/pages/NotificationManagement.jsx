import React from 'react';
import { Bell, ShieldCheck, Mail, Smartphone, Globe, ArrowRight } from 'lucide-react';
import { AdminPageHeader } from '../components/shared';

export default function NotificationManagement() {
    return (
        <div className="space-y-10 pb-20 text-text">
            <AdminPageHeader
                title="Broadcast Center"
                subtitle="System-wide notification protocols and push telemetry."
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { icon: Globe, label: 'In-App Broadcast', desc: 'Real-time websocket events', status: 'Online' },
                    { icon: Mail, label: 'SMTP Relay', desc: 'Email verification queue', status: 'Paused' },
                    { icon: Smartphone, label: 'Push Hub', desc: 'FCM / APNS Integration', status: 'Standby' }
                ].map((hub, i) => (
                    <div key={i} className="bg-surface border border-surface rounded-lg p-5 group hover:border-primary/20 transition-all">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 rounded-lg bg-primary/5 text-primary border border-surface">
                                <hub.icon className="w-5 h-5" />
                            </div>
                            <span className={`text-[8px] font-bold px-2 py-0.5 rounded-lg border uppercase tracking-wider ${hub.status === 'Online' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-surface2 text-muted border-surface'
                                }`}>
                                {hub.status}
                            </span>
                        </div>
                        <h3 className="text-xs font-bold uppercase tracking-widest mb-1">{hub.label}</h3>
                        <p className="text-[10px] text-muted font-medium uppercase tracking-wider mb-6 opacity-60">{hub.desc}</p>
                        <button className="w-full flex items-center justify-between py-2 text-[9px] font-bold uppercase tracking-widest text-muted group-hover:text-primary transition-all">
                            Configure Channel <ArrowRight className="w-3 h-3 translate-x-0 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                ))}
            </div>

            <div className="bg-surface border border-dashed border-surface rounded-lg p-12 flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-bg border border-surface rounded-lg flex items-center justify-center mb-4">
                    <Bell className="w-6 h-6 text-muted opacity-30" />
                </div>
                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted mb-2">Campaign Broadcast Template</h4>
                <p className="text-[10px] text-sub font-medium uppercase tracking-widest max-w-sm mb-6 leading-relaxed opacity-60">Design and automate high-engagement triggers for user rewards and system updates.</p>
                <div className="flex gap-3">
                    <button className="px-6 py-2 bg-surface2 rounded-lg text-xs font-bold uppercase tracking-wider border border-surface opacity-50 cursor-not-allowed">Protocol Offline</button>
                </div>
            </div>
        </div>
    );
}
