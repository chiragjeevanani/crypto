import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    ShieldCheck,
    Mail,
    Lock,
    ArrowRight,
    Command,
    Zap,
    Github,
    Twitter
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../../user/store/useUserStore';

export default function LoginPage() {
    const navigate = useNavigate();
    const login = useUserStore(state => state.login);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: 'admin@socialearn.io',
        password: '••••••••'
    });

    const handleLogin = (e) => {
        e.preventDefault();
        setIsLoading(true);

        // Simulate network delay
        setTimeout(() => {
            login({
                name: 'SuperAdmin',
                email: formData.email,
                role: 'SuperNode'
            });
            setIsLoading(false);
            navigate('/admin');
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-bg flex items-center justify-center p-6 selection:bg-primary/30">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
                <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[120px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-[420px] bg-surface border border-surface rounded-2xl p-8 relative z-10 shadow-2xl"
            >
                <div className="text-center mb-10">
                    <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 mx-auto mb-6">
                        <ShieldCheck className="text-black w-8 h-8" />
                    </div>
                    <h1 className="text-xl font-bold tracking-tight text-text">SocialEarn Infrastructure</h1>
                    <p className="text-[10px] text-muted font-semibold uppercase tracking-[0.2em] mt-2 opacity-60">Authentication Protocol v4.0</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-muted uppercase tracking-wider ml-1">Access Identity</label>
                        <div className="relative group">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors" />
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full bg-bg border border-surface rounded-xl py-3.5 pl-12 pr-4 text-sm font-medium focus:ring-1 focus:ring-primary/20 outline-none transition-all text-text"
                                placeholder="name@domain.io"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center px-1">
                            <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Secure Phrase</label>
                            <button type="button" className="text-[10px] font-bold text-primary uppercase tracking-wider hover:opacity-80 transition-all">Recover</button>
                        </div>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors" />
                            <input
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="w-full bg-bg border border-surface rounded-xl py-3.5 pl-12 pr-4 text-sm font-medium focus:ring-1 focus:ring-primary/20 outline-none transition-all text-text"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 px-1 pt-1 text-[10px] font-bold text-muted uppercase tracking-wider">
                        <input type="checkbox" className="accent-primary w-3.5 h-3.5 rounded border-surface bg-bg" id="persist" />
                        <label htmlFor="persist" className="cursor-pointer">Maintain Session</label>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-primary text-black font-bold uppercase tracking-widest text-[11px] py-4 rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                        {isLoading ? (
                            <Zap className="w-4 h-4 animate-spin" />
                        ) : (
                            <>
                                Initialize Node <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-10 pt-8 border-t border-surface/50">
                    <p className="text-[10px] font-bold text-muted uppercase tracking-widest text-center mb-6 opacity-40">Third-Party Verification</p>
                    <div className="grid grid-cols-2 gap-4">
                        <button className="flex items-center justify-center gap-2 py-3 bg-surface2 hover:bg-surface border border-surface rounded-xl transition-all">
                            <Github className="w-4 h-4" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Github</span>
                        </button>
                        <button className="flex items-center justify-center gap-2 py-3 bg-surface2 hover:bg-surface border border-surface rounded-xl transition-all">
                            <Twitter className="w-4 h-4 text-sky-500" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Twitter</span>
                        </button>
                    </div>
                </div>

                <div className="mt-8 flex items-center justify-center gap-2 text-muted">
                    <Command className="w-3.5 h-3.5 opacity-30" />
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] opacity-30">Encrypted Enterprise Protocol</p>
                </div>
            </motion.div>
        </div>
    );
}
