import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, ShieldCheck, Zap, Phone } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useUserStore } from '../store/useUserStore';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const validateEmail = (v) => {
    if (!v?.trim()) return 'Email is required';
    if (!emailRegex.test(v.trim())) return 'Please enter a valid email address';
    return '';
};
const validatePassword = (v) => {
    if (!v) return 'Password is required';
    if (v.length < 6) return 'Password must be at least 6 characters';
    if (!/\d/.test(v)) return 'Password must contain at least one number';
    if (!/[a-zA-Z]/.test(v)) return 'Password must contain at least one letter';
    return '';
};
const validatePhone = (v) => {
    const digits = (v || '').replace(/\D/g, '');
    if (digits.length === 0) return ''; // optional
    if (digits.length !== 10) return 'Phone number must be exactly 10 digits';
    return '';
};

export default function SignUpPage() {
    const navigate = useNavigate();
    const registerUser = useUserStore(state => state.registerUser);
    const authLoading = useUserStore(state => state.authLoading);
    const authError = useUserStore(state => state.authError);
    const setAuthError = useUserStore(state => state.setAuthError);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        countryCode: 'IN',
    });
    const [fieldErrors, setFieldErrors] = useState({
        email: '',
        password: '',
        phone: '',
        country: '',
    });

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setAuthError('');
        // clear field error when user types
        if (fieldErrors[field]) {
            setFieldErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setAuthError('');
        const emailErr = validateEmail(formData.email);
        const passwordErr = validatePassword(formData.password);
        const phoneErr = validatePhone(formData.phone);
        const countryErr = formData.countryCode ? '' : 'Country is required';
        setFieldErrors({
            email: emailErr,
            password: passwordErr,
            phone: phoneErr,
            country: countryErr,
        });
        if (emailErr || passwordErr || phoneErr || countryErr) return;

        try {
            await registerUser({
                name: formData.name.trim(),
                email: formData.email.trim(),
                password: formData.password,
                phone: formData.phone.trim() ? formData.phone.replace(/\D/g, '') : undefined,
                countryCode: formData.countryCode,
            });
            navigate('/signin');
        } catch (err) {
            const msg = err?.message || '';
            if (msg.toLowerCase().includes('email already registered')) {
                setFieldErrors(prev => ({ ...prev, email: 'Email already registered' }));
            }
            // authError is set by store; keep it for generic errors
        }
    };

    return (
        <div className="min-h-screen bg-bg flex items-center justify-center p-4 selection:bg-primary/30">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-[480px] bg-surface border rounded-2xl overflow-hidden shadow-2xl"
                style={{ borderColor: 'var(--color-border)' }}
            >
                <div className="w-full p-8">
                    <div className="text-center mb-8">
                        <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 mx-auto mb-4">
                            <ShieldCheck className="text-white w-8 h-8" />
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-text">Create Account</h1>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-muted uppercase tracking-wider ml-1">Full Name</label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors" />
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => handleChange('name', e.target.value)}
                                    className="w-full bg-bg border border-surface rounded-xl py-3.5 pl-12 pr-4 text-sm font-medium focus:ring-1 focus:ring-primary/20 outline-none transition-all text-text"
                                    placeholder="Jane Doe"
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-muted uppercase tracking-wider ml-1">Email</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors" />
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => handleChange('email', e.target.value)}
                                    className={`w-full bg-bg border rounded-xl py-3.5 pl-12 pr-4 text-sm font-medium focus:ring-1 focus:ring-primary/20 outline-none transition-all text-text ${fieldErrors.email ? 'border-red-500' : 'border-surface'}`}
                                    placeholder="name@domain.io"
                                    required
                                />
                            </div>
                            {fieldErrors.email && (
                                <p className="text-xs text-red-500 ml-1">{fieldErrors.email}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-muted uppercase tracking-wider ml-1">Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors" />
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => handleChange('password', e.target.value)}
                                    className={`w-full bg-bg border rounded-xl py-3.5 pl-12 pr-4 text-sm font-medium focus:ring-1 focus:ring-primary/20 outline-none transition-all text-text ${fieldErrors.password ? 'border-red-500' : 'border-surface'}`}
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                            {fieldErrors.password && (
                                <p className="text-xs text-red-500 ml-1">{fieldErrors.password}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-muted uppercase tracking-wider ml-1">Phone (10 digits)</label>
                            <div className="relative group">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors" />
                                <input
                                    type="tel"
                                    inputMode="numeric"
                                    maxLength={10}
                                    value={formData.phone}
                                    onChange={(e) => handleChange('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                                    className={`w-full bg-bg border rounded-xl py-3.5 pl-12 pr-4 text-sm font-medium focus:ring-1 focus:ring-primary/20 outline-none transition-all text-text ${fieldErrors.phone ? 'border-red-500' : 'border-surface'}`}
                                    placeholder="9876543210"
                                />
                            </div>
                            {fieldErrors.phone && (
                                <p className="text-xs text-red-500 ml-1">{fieldErrors.phone}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-muted uppercase tracking-wider ml-1">Country</label>
                            <select
                                value={formData.countryCode}
                                onChange={(e) => handleChange('countryCode', e.target.value)}
                                className={`w-full bg-bg border rounded-xl py-3.5 px-4 text-sm font-medium focus:ring-1 focus:ring-primary/20 outline-none transition-all text-text ${fieldErrors.country ? 'border-red-500' : 'border-surface'}`}
                            >
                                <option value="IN">India (₹)</option>
                                <option value="US">United States ($)</option>
                                <option value="GB">United Kingdom (£)</option>
                                <option value="EU">Eurozone (€)</option>
                                <option value="AE">UAE (AED)</option>
                            </select>
                            {fieldErrors.country && (
                                <p className="text-xs text-red-500 ml-1">{fieldErrors.country}</p>
                            )}
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
                                    Sign Up <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                        {authError && <p className="text-xs text-red-500">{authError}</p>}
                    </form>
                    <p className="mt-6 text-center text-[10px] text-muted">
                        Already registered? <Link to="/signin" className="text-primary underline">Sign in</Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
