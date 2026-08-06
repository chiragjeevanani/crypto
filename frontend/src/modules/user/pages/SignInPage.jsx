import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, ShieldCheck, Zap, Globe, Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useUserStore } from '../store/useUserStore';

export default function SignInPage() {
    const navigate = useNavigate();
    const loginUser = useUserStore(state => state.loginUser);
    const authLoading = useUserStore(state => state.authLoading);
    const authError = useUserStore(state => state.authError);
    const setAuthError = useUserStore(state => state.setAuthError);
    const location = useLocation();
    const successMsg = location.state?.message;

    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);


    const handleSubmit = async (e) => {
        e.preventDefault();
        setAuthError('');
        try {
            await loginUser({
                email: formData.email,
                password: formData.password
            });
            navigate('/home');
        } catch (err) {
            if (err?.response?.data?.requireVerification || err?.data?.requireVerification || err?.requireVerification) {
                navigate(`/signup?verify=true&email=${encodeURIComponent(formData.email)}`);
            }
        }
    };

    return (
        <div className="h-full w-full overflow-y-auto bg-bg flex flex-col items-center py-6 px-4 selection:bg-primary/30">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-[440px] my-auto bg-surface border rounded-2xl overflow-hidden shadow-2xl"
                style={{ borderColor: 'var(--color-border)' }}
            >
                {/* form side */}
                <div className="w-full p-8">
                    <div className="text-center mb-8">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 mx-auto mb-4 overflow-hidden">
                            <img src="/knqlogo.jpeg" alt="KnQ Logo" className="w-full h-full object-cover" />
                        </div>
                        <h1 className="text-[2.2rem] font-bold tracking-tight text-text">Sign In</h1>
                    </div>

                    {successMsg && (
                        <div className="mb-6 p-3 rounded-xl bg-green-500/10 border border-green-500/20 flex items-start gap-3">
                            <ShieldCheck className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                            <p className="text-xs text-green-500 font-medium leading-relaxed">{successMsg}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-3">
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
                                    type={showPassword ? "text" : "password"}
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full bg-bg border border-surface rounded-xl py-3.5 pl-12 pr-12 text-sm font-medium focus:ring-1 focus:ring-primary/20 outline-none transition-all text-text"
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-text transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <button 
                                type="button"
                                onClick={() => {
                                    const actualEmail = formData.email || document.querySelector('input[type="email"]')?.value || '';
                                    navigate(`/forgot-password${actualEmail ? `?email=${encodeURIComponent(actualEmail)}` : ''}`);
                                }}
                                className="text-[10px] text-primary hover:underline font-medium"
                            >
                                Forgot Password?
                            </button>
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
                    <p className="mt-6 text-center text-[13px] text-muted">
                        Don&rsquo;t have an account? <Link to="/signup" className="text-primary underline">Sign up</Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
