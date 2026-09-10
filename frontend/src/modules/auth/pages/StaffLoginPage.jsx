import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, Zap, Users } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useStaffStore } from '../../staff/store/useStaffStore';

export default function StaffLoginPage() {
    const navigate = useNavigate();
    const { loginStaff, loading, error, clearError } = useStaffStore();
    const [formData, setFormData] = useState({ email: '', password: '' });

    const handleChange = (e) => {
        clearError();
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const ok = await loginStaff(formData.email, formData.password);
        if (ok) navigate('/staff');
    };

    return (
        <div className="min-h-screen bg-bg flex items-center justify-center p-6">
            {/* Ambient glow */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[15%] -right-[10%] w-[35%] h-[35%] bg-primary/5 rounded-full blur-[120px]" />
                <div className="absolute -bottom-[10%] -left-[10%] w-[35%] h-[35%] bg-indigo-500/5 rounded-full blur-[120px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="w-full max-w-[420px] bg-surface border border-surface rounded-2xl p-8 relative z-10 shadow-2xl"
            >
                {/* Header */}
                <div className="text-center mb-10">
                    <div className="w-14 h-14 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Users className="text-indigo-400 w-7 h-7" />
                    </div>
                    <h1 className="text-xl font-bold tracking-tight text-text">KnQ Reels</h1>
                    <p className="text-[10px] text-muted font-semibold uppercase tracking-[0.2em] mt-2 opacity-70">
                        Staff Portal
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Email */}
                    <div className="space-y-2">
                        <label htmlFor="staff-email" className="text-[10px] font-bold text-muted uppercase tracking-wider ml-1">
                            Email Address
                        </label>
                        <div className="relative group">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-indigo-400 transition-colors" />
                            <input
                                id="staff-email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full bg-bg border border-surface rounded-xl py-3.5 pl-12 pr-4 text-sm font-medium focus:ring-1 focus:ring-indigo-500/30 outline-none transition-all text-text"
                                placeholder="staff@company.io"
                                required
                                autoComplete="email"
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center px-1">
                            <label htmlFor="staff-password" className="text-[10px] font-bold text-muted uppercase tracking-wider">
                                Password
                            </label>
                            <Link
                                to="/staff/forgot-password"
                                className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider hover:opacity-80 transition-all"
                            >
                                Forgot?
                            </Link>
                        </div>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-indigo-400 transition-colors" />
                            <input
                                id="staff-password"
                                name="password"
                                type="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full bg-bg border border-surface rounded-xl py-3.5 pl-12 pr-4 text-sm font-medium focus:ring-1 focus:ring-indigo-500/30 outline-none transition-all text-text"
                                placeholder="••••••••"
                                required
                                autoComplete="current-password"
                            />
                        </div>
                    </div>

                    {error && (
                        <p className="text-xs text-red-400 px-1 leading-relaxed">{error}</p>
                    )}

                    <button
                        id="staff-login-btn"
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-500 text-white font-bold uppercase tracking-widest text-[11px] py-4 rounded-xl shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 hover:bg-indigo-600 active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                        {loading ? (
                            <Zap className="w-4 h-4 animate-spin" />
                        ) : (
                            <>Sign In <ArrowRight className="w-4 h-4" /></>
                        )}
                    </button>
                </form>

                <p className="mt-8 text-center text-[9px] text-muted uppercase tracking-widest opacity-40">
                    Staff Portal · KnQ Reels
                </p>
            </motion.div>
        </div>
    );
}
