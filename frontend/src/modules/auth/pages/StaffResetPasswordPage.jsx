import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, Zap, CheckCircle, ShieldCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5004/api';

export default function StaffResetPasswordPage() {
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: '', otp: '', newPassword: '', confirmPassword: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [done, setDone] = useState(false);

    const handleChange = (e) => {
        setError('');
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (form.newPassword !== form.confirmPassword) {
            return setError('Passwords do not match');
        }
        if (form.newPassword.length < 6) {
            return setError('Password must be at least 6 characters');
        }
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/auth/staff/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: form.email,
                    otp: form.otp,
                    newPassword: form.newPassword,
                }),
            });
            const data = await res.json();
            if (data.success) {
                setDone(true);
                setTimeout(() => navigate('/staff/login'), 3000);
            } else {
                setError(data.message || 'Reset failed. Please try again.');
            }
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-bg flex items-center justify-center p-6">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[15%] -right-[10%] w-[35%] h-[35%] bg-primary/5 rounded-full blur-[120px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-[420px] bg-surface border border-surface rounded-2xl p-8 relative z-10 shadow-2xl"
            >
                <div className="text-center mb-10">
                    <div className="w-14 h-14 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <ShieldCheck className="text-indigo-400 w-7 h-7" />
                    </div>
                    <h1 className="text-xl font-bold tracking-tight text-text">New Password</h1>
                    <p className="text-[10px] text-muted font-semibold uppercase tracking-[0.2em] mt-2 opacity-70">
                        Staff Portal
                    </p>
                </div>

                {done ? (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-4">
                        <CheckCircle className="w-12 h-12 text-green-400 mx-auto" />
                        <p className="text-sm font-bold text-text">Password Reset!</p>
                        <p className="text-xs text-muted">Redirecting you to login...</p>
                    </motion.div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Email */}
                        <div className="space-y-2">
                            <label htmlFor="reset-email" className="text-[10px] font-bold text-muted uppercase tracking-wider ml-1">Email</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-indigo-400 transition-colors" />
                                <input
                                    id="reset-email" name="email" type="email"
                                    value={form.email} onChange={handleChange}
                                    className="w-full bg-bg border border-surface rounded-xl py-3.5 pl-12 pr-4 text-sm font-medium focus:ring-1 focus:ring-indigo-500/30 outline-none text-text"
                                    placeholder="staff@company.io" required
                                />
                            </div>
                        </div>

                        {/* OTP */}
                        <div className="space-y-2">
                            <label htmlFor="reset-otp" className="text-[10px] font-bold text-muted uppercase tracking-wider ml-1">OTP Code</label>
                            <input
                                id="reset-otp" name="otp" type="text" inputMode="numeric"
                                value={form.otp} onChange={handleChange}
                                className="w-full bg-bg border border-surface rounded-xl py-3.5 px-4 text-sm font-medium focus:ring-1 focus:ring-indigo-500/30 outline-none text-text text-center tracking-[0.4em] text-lg"
                                placeholder="• • • • • •" maxLength={6} required
                            />
                        </div>

                        {/* New Password */}
                        <div className="space-y-2">
                            <label htmlFor="reset-new-pw" className="text-[10px] font-bold text-muted uppercase tracking-wider ml-1">New Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-indigo-400 transition-colors" />
                                <input
                                    id="reset-new-pw" name="newPassword" type="password"
                                    value={form.newPassword} onChange={handleChange}
                                    className="w-full bg-bg border border-surface rounded-xl py-3.5 pl-12 pr-4 text-sm font-medium focus:ring-1 focus:ring-indigo-500/30 outline-none text-text"
                                    placeholder="Min. 6 characters" required
                                />
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-2">
                            <label htmlFor="reset-confirm-pw" className="text-[10px] font-bold text-muted uppercase tracking-wider ml-1">Confirm Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-indigo-400 transition-colors" />
                                <input
                                    id="reset-confirm-pw" name="confirmPassword" type="password"
                                    value={form.confirmPassword} onChange={handleChange}
                                    className="w-full bg-bg border border-surface rounded-xl py-3.5 pl-12 pr-4 text-sm font-medium focus:ring-1 focus:ring-indigo-500/30 outline-none text-text"
                                    placeholder="••••••••" required
                                />
                            </div>
                        </div>

                        {error && <p className="text-xs text-red-400">{error}</p>}

                        <button
                            id="staff-reset-btn"
                            type="submit" disabled={loading}
                            className="w-full bg-indigo-500 text-white font-bold uppercase tracking-widest text-[11px] py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-indigo-600 active:scale-[0.98] transition-all disabled:opacity-50"
                        >
                            {loading ? <Zap className="w-4 h-4 animate-spin" /> : <>Reset Password <ArrowRight className="w-4 h-4" /></>}
                        </button>

                        <Link to="/staff/login" className="block text-center text-[10px] font-bold text-muted uppercase tracking-wider hover:text-text transition-colors">
                            ← Back to Login
                        </Link>
                    </form>
                )}
            </motion.div>
        </div>
    );
}
