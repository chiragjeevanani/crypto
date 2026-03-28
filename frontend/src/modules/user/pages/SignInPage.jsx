import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useUserStore } from '../store/useUserStore';

export default function SignInPage() {
    const navigate = useNavigate();
    const loginUser = useUserStore(state => state.loginUser);
    const authLoading = useUserStore(state => state.authLoading);
    const authError = useUserStore(state => state.authError);
    const setAuthError = useUserStore(state => state.setAuthError);
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setAuthError('');
        try {
            await loginUser({
                email: formData.email,
                password: formData.password
            });
            navigate('/home');
        } catch {
            // error handled in store
        }
    };

    return (
        <div className="min-h-screen bg-bg flex items-center justify-center p-4 selection:bg-primary/30">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-[440px] bg-surface border rounded-2xl overflow-hidden shadow-2xl"
                style={{ borderColor: 'var(--color-border)' }}
            >
                {/* form side */}
                <div className="w-full p-8">
                    <div className="text-center mb-8">
                        <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 mx-auto mb-4">
                            <ShieldCheck className="text-white w-8 h-8" />
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-text">Sign In</h1>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-muted uppercase tracking-wider ml-1">Email</label>
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
                            <label className="text-[10px] font-bold text-muted uppercase tracking-wider ml-1">Password</label>
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
                        <button
                            type="submit"
                            disabled={authLoading}
                            className="w-full bg-primary text-black font-bold uppercase tracking-widest text-[11px] py-4 rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
                        >
                            {authLoading ? (
                                <Zap className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    Sign In <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                        {authError && <p className="text-xs text-red-400">{authError}</p>}
                    </form>
                    <p className="mt-6 text-center text-[10px] text-muted">
                        Don&rsquo;t have an account? <Link to="/signup" className="text-primary underline">Sign up</Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
