import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, ArrowRight, ShieldCheck, Zap, KeyRound, Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../../auth/services/authService';

export default function ForgotPasswordPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    
    const [step, setStep] = useState(1); // 1: Email, 2: OTP & New Password
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    
    const [email, setEmail] = useState(searchParams.get('email') || '');
    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleRequestOtp = async (e, customEmail) => {
        if (e) e.preventDefault();
        const targetEmail = customEmail || email;
        if (!targetEmail) {
            setError('Please enter your registered email address.');
            return;
        }
        
        setError('');
        setLoading(true);
        try {
            const res = await authService.forgotPassword(targetEmail);
            if (res.success) {
                setSuccessMsg(`OTP has been sent to ${targetEmail}`);
                setStep(2);
            } else {
                setError(res.message || 'Failed to request OTP. Please try again.');
            }
        } catch (err) {
            setError(err.message || 'An error occurred while requesting OTP.');
        } finally {
            setLoading(false);
        }
    };

    // Auto-trigger if email is passed in URL
    React.useEffect(() => {
        const urlEmail = searchParams.get('email');
        if (urlEmail) {
            handleRequestOtp(null, urlEmail);
        }
    }, []);

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError('');
        
        if (!otp || otp.length !== 4) {
            setError('Please enter the 4-digit OTP.');
            return;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);
        try {
            const res = await authService.resetPassword(email, otp, password);
            if (res.success) {
                setSuccessMsg('Password reset successfully! Redirecting to login...');
                setTimeout(() => {
                    navigate('/signin');
                }, 2000);
            } else {
                setError(res.message || 'Failed to reset password.');
            }
        } catch (err) {
            setError(err.message || 'Invalid OTP or expired request.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-full w-full overflow-y-auto bg-bg flex items-center justify-center p-4 selection:bg-primary/30 pb-safe">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-[440px] bg-surface border rounded-2xl overflow-hidden shadow-2xl"
                style={{ borderColor: 'var(--color-border)' }}
            >
                <div className="w-full p-8">
                    <div className="text-center mb-8">
                        <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 mx-auto mb-4">
                            <ShieldCheck className="text-white w-8 h-8" />
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-text">Reset Password</h1>
                        <p className="text-xs text-muted mt-2">
                            {step === 1 ? "Enter your email to receive a verification OTP." : "Enter the OTP sent to your email and set a new password."}
                        </p>
                    </div>

                    {successMsg && (
                        <div className="mb-6 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                            <p className="text-xs text-green-500 text-center font-medium">{successMsg}</p>
                        </div>
                    )}

                    <AnimatePresence mode="wait">
                        {step === 1 ? (
                            <motion.form 
                                key="step1"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                onSubmit={handleRequestOtp} 
                                className="space-y-3"
                            >
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-muted uppercase tracking-wider ml-1">Email</label>
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full bg-bg border border-surface rounded-xl py-3.5 pl-12 pr-4 text-sm font-medium focus:ring-1 focus:ring-primary/20 outline-none transition-all text-text"
                                            placeholder="name@domain.io"
                                            required
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-primary text-black font-bold uppercase tracking-widest text-[11px] py-4 rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
                                >
                                    {loading ? (
                                        <Zap className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>
                                            Send OTP <ArrowRight className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                                {error && <p className="text-xs text-red-500 text-center mt-2">{error}</p>}
                            </motion.form>
                        ) : (
                            <motion.form 
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                onSubmit={handleResetPassword} 
                                className="space-y-3"
                            >
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-muted uppercase tracking-wider ml-1">4-Digit OTP</label>
                                    <div className="relative group">
                                        <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors" />
                                        <input
                                            type="text"
                                            maxLength={4}
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                            className="w-full bg-bg border border-surface rounded-xl py-3.5 pl-12 pr-4 text-center tracking-[0.5em] text-lg font-bold focus:ring-1 focus:ring-primary/20 outline-none transition-all text-text uppercase placeholder:tracking-normal placeholder:font-medium placeholder:text-sm"
                                            placeholder="e.g. 1234"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-muted uppercase tracking-wider ml-1">New Password</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors" />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
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
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-muted uppercase tracking-wider ml-1">Confirm New Password</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors" />
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full bg-bg border border-surface rounded-xl py-3.5 pl-12 pr-12 text-sm font-medium focus:ring-1 focus:ring-primary/20 outline-none transition-all text-text"
                                            placeholder="••••••••"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-text transition-colors"
                                        >
                                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-primary text-black font-bold uppercase tracking-widest text-[11px] py-4 rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
                                >
                                    {loading ? (
                                        <Zap className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>
                                            Reset Password <ArrowRight className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                                {error && <p className="text-xs text-red-500 text-center mt-2">{error}</p>}
                                <button
                                    type="button"
                                    onClick={() => { setStep(1); setError(''); setSuccessMsg(''); }}
                                    className="w-full mt-4 text-xs text-muted hover:text-text transition-colors"
                                >
                                    Back to Email
                                </button>
                            </motion.form>
                        )}
                    </AnimatePresence>

                    <p className="mt-8 text-center text-[10px] text-muted">
                        Remember your password? <Link to="/signin" className="text-primary underline">Sign in</Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
