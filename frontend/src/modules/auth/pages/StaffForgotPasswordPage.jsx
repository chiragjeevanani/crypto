import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, Zap, CheckCircle, KeyRound } from 'lucide-react';
import { Link } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5004/api';

export default function StaffForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/auth/staff/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            if (data.success) {
                setSent(true);
            } else {
                setError(data.message || 'Something went wrong');
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
                        <KeyRound className="text-indigo-400 w-7 h-7" />
                    </div>
                    <h1 className="text-xl font-bold tracking-tight text-text">Reset Password</h1>
                    <p className="text-[10px] text-muted font-semibold uppercase tracking-[0.2em] mt-2 opacity-70">
                        Staff Portal
                    </p>
                </div>

                {sent ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center space-y-4"
                    >
                        <CheckCircle className="w-12 h-12 text-green-400 mx-auto" />
                        <p className="text-sm font-medium text-text">OTP sent to your email</p>
                        <p className="text-xs text-muted leading-relaxed">
                            Check your inbox for a 6-digit OTP. It expires in 10 minutes.
                        </p>
                        <Link
                            to="/staff/reset-password"
                            className="inline-flex items-center gap-2 mt-4 bg-indigo-500 text-white font-bold uppercase tracking-widest text-[11px] py-3 px-6 rounded-xl hover:bg-indigo-600 transition-all"
                        >
                            Enter OTP <ArrowRight className="w-4 h-4" />
                        </Link>
                    </motion.div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <p className="text-xs text-muted leading-relaxed">
                            Enter your staff email address and we'll send you an OTP to reset your password.
                        </p>

                        <div className="space-y-2">
                            <label htmlFor="forgot-email" className="text-[10px] font-bold text-muted uppercase tracking-wider ml-1">
                                Staff Email
                            </label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-indigo-400 transition-colors" />
                                <input
                                    id="forgot-email"
                                    type="email"
                                    value={email}
                                    onChange={e => { setError(''); setEmail(e.target.value); }}
                                    className="w-full bg-bg border border-surface rounded-xl py-3.5 pl-12 pr-4 text-sm font-medium focus:ring-1 focus:ring-indigo-500/30 outline-none transition-all text-text"
                                    placeholder="staff@company.io"
                                    required
                                />
                            </div>
                        </div>

                        {error && <p className="text-xs text-red-400">{error}</p>}

                        <button
                            id="staff-forgot-btn"
                            type="submit"
                            disabled={loading}
                            className="w-full bg-indigo-500 text-white font-bold uppercase tracking-widest text-[11px] py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-indigo-600 active:scale-[0.98] transition-all disabled:opacity-50"
                        >
                            {loading ? <Zap className="w-4 h-4 animate-spin" /> : <>Send OTP <ArrowRight className="w-4 h-4" /></>}
                        </button>

                        <Link to="/staff/login" className="block text-center text-[10px] font-bold text-muted uppercase tracking-wider hover:text-text transition-colors mt-2">
                            ← Back to Login
                        </Link>
                    </form>
                )}
            </motion.div>
        </div>
    );
}
