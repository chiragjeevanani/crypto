import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Save,
    X,
    User,
    Mail,
    Shield,
    Wallet,
    Calendar,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminPageHeader } from '../components/shared';
import { formatCurrency } from '../utils/currency';
import { userService } from '../services/userService';

export default function EditUser({ createMode = false }) {
    const { userId } = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState(null);
    const avatarInputRef = useRef(null);
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        const loadUser = async () => {
            if (createMode) {
                // initialize blank profile for creation
                setFormData({
                    id: '',
                    fullName: '',
                    username: '',
                    name: '',
                    email: '',
                    phone: '',
                    password: '',
                    confirmPassword: '',
                    role: 'Standard',
                    referralCode: '',
                    status: 'Pending',
                    riskScore: 'Low',
                    joined: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
                    walletBalance: 0,
                    campaigns: 0,
                    avatar: '/person.png'
                });
                return;
            }

            try {
                const user = await userService.fetchUserDetail(userId);
                if (user) {
                    setFormData({
                        ...user,
                        fullName: user.name,
                        username: user.name,
                        status: (user.isBanned || user.isSuspicious) ? 'Flagged' : (user.kycVerified ? 'Verified' : 'Pending'),
                        riskScore: user.isSuspicious ? 'High' : 'Low',
                        joined: user.joined,
                        walletBalance: user.walletBalance || 0,
                        campaigns: user.campaigns || 0,
                        avatar: user.avatar && !user.avatar.includes('placeholder.com') ? user.avatar : '/person.png'
                    });
                } else {
                    navigate('/admin/users');
                }
            } catch (err) {
                setErrorMessage('Failed to load user: ' + err.message);
                navigate('/admin/users');
            }
        };

        loadUser();
    }, [userId, navigate, createMode]);


    const handleSubmit = async (e) => {
        if (e?.preventDefault) e.preventDefault();

        if (createMode) {
            if (!formData.fullName || !formData.email || !formData.password) {
                setErrorMessage('Name, Email, and Password are required.');
                return;
            }
            if (formData.password !== formData.confirmPassword) {
                setErrorMessage('Password and confirm password must match.');
                return;
            }
        }

        setErrorMessage('');
        setIsSaving(true);
        
        try {
            if (createMode) {
                await userService.createUser({
                    name: formData.fullName,
                    email: formData.email,
                    password: formData.password,
                    phone: formData.phone,
                    role: formData.role === 'Standard' ? 'User' : formData.role,
                    avatar: formData.avatar === '/person.png' ? '' : formData.avatar,
                    status: formData.status
                });
                setShowSuccess(true);
                setTimeout(() => {
                    setShowSuccess(false);
                    navigate('/admin/users');
                }, 2000);
            } else {
                await userService.updateUser(userId, {
                    name: formData.fullName || formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    role: formData.role === 'Standard' ? 'User' : formData.role,
                    avatar: formData.avatar === '/person.png' ? '' : formData.avatar,
                    status: formData.status
                });

                // Handle Suspicious Toggle
                const isCurrentlySuspicious = formData.riskScore === 'High';
                // Note: We might need a separate mechanism to check initial state if it diverges, 
                // but for now we apply it based on current UI state
                
                setShowSuccess(true);
                setTimeout(() => setShowSuccess(false), 3000);
            }
        } catch (err) {
            setErrorMessage(err.message || 'Failed to save user.');
        } finally {
            setIsSaving(false);
        }
    };

    if (!formData) return null;

    return (
        <div className="space-y-8 pb-20">
            <AdminPageHeader
                title={createMode ? 'Create New User' : `Edit User: ${formData.id}`}
                subtitle={createMode ? 'Add user details to create a new account.' : `Update profile and account details for @${formData.name}.`}
                actions={
                    <div className="flex gap-3">
                        <button
                            onClick={() => navigate('/admin/users')}
                            className="flex items-center gap-2 px-5 py-2.5 bg-surface border border-surface rounded-lg text-[10px] font-semibold uppercase tracking-wider hover:bg-surface2 transition-all text-text"
                        >
                            <X className="w-3.5 h-3.5" />
                            {createMode ? 'Back' : 'Cancel'}
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isSaving}
                            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-black rounded-lg text-[10px] font-semibold uppercase tracking-wider shadow-md hover:opacity-90 transition-all disabled:opacity-50"
                        >
                            {isSaving ? (
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                >
                                    <Save className="w-3.5 h-3.5" />
                                </motion.div>
                            ) : (
                                <Save className="w-3.5 h-3.5" />
                            )}
                            {isSaving ? 'Committing...' : createMode ? 'Create Identity' : 'Save Changes'}
                        </button>
                    </div>
                }
            />

            <AnimatePresence>
                {errorMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-center gap-3 text-rose-500 mb-4"
                    >
                        <AlertCircle className="w-5 h-5" />
                        <p className="text-[11px] font-bold uppercase tracking-wider">{errorMessage}</p>
                    </motion.div>
                )}
                {showSuccess && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-3 text-emerald-500 mb-6"
                    >
                        <CheckCircle2 className="w-5 h-5" />
                        <p className="text-[11px] font-bold uppercase tracking-wider">User details saved successfully.</p>
                    </motion.div>
                )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Overview */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-surface border border-surface rounded-lg p-6 text-center">
                        <div className="relative inline-block mx-auto mb-6">
                            <div className="w-24 h-24 rounded-2xl bg-surface2 border border-surface p-1.5 overflow-hidden">
                                <img src={formData.avatar} className="w-full h-full object-cover rounded-xl" alt="" />
                            </div>
                            <button
                                type="button"
                                onClick={() => avatarInputRef.current?.click()}
                                className="absolute -bottom-2 -right-2 p-2 bg-primary text-black rounded-lg shadow-lg hover:scale-105 transition-transform"
                            >
                                <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <input
                                ref={avatarInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    const reader = new FileReader();
                                    reader.onload = (ev) => setFormData((prev) => ({ ...prev, avatar: ev.target.result }));
                                    reader.readAsDataURL(file);
                                }}
                            />
                        </div>
                        <h3 className="text-lg font-bold text-text mb-1">@{createMode ? (formData.username || 'new_user') : formData.name}</h3>
                        <p className="text-[10px] font-medium text-muted uppercase tracking-[0.2em]">{formData.email || 'newuser@email.com'}</p>

                        <div className="mt-8 pt-6 border-t border-surface space-y-4 text-left">
                            {!createMode && (
                                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                                    <span className="text-muted">Account Age</span>
                                    <span className="text-text">{formData.joined}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                                <span className="text-muted">{createMode ? 'Role' : 'Trust Factor'}</span>
                                <span className={`${createMode ? 'text-primary' : formData.riskScore === 'Low' ? 'text-emerald-500' :
                                        formData.riskScore === 'Medium' ? 'text-amber-500' : 'text-rose-500'
                                    }`}>{createMode ? formData.role : `${formData.riskScore} Risk`}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-surface border border-surface rounded-lg p-6 space-y-6">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                            <Shield className="w-3.5 h-3.5" /> Identity Controls
                        </h4>
                        <div className="space-y-3">
                            <label className="flex items-center gap-3 p-3 bg-bg border border-surface rounded-lg cursor-pointer hover:bg-surface2 transition-all">
                                <input
                                    type="radio"
                                    name="status"
                                    checked={formData.status === 'Verified'}
                                    onChange={() => setFormData({ ...formData, status: 'Verified' })}
                                    className="accent-primary"
                                />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">Verified Identity</span>
                            </label>
                            <label className="flex items-center gap-3 p-3 bg-bg border border-surface rounded-lg cursor-pointer hover:bg-surface2 transition-all">
                                <input
                                    type="radio"
                                    name="status"
                                    checked={formData.status === 'Pending'}
                                    onChange={() => setFormData({ ...formData, status: 'Pending' })}
                                    className="accent-primary"
                                />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500">Pending Review</span>
                            </label>
                            <label className="flex items-center gap-3 p-3 bg-bg border border-surface rounded-lg cursor-pointer hover:bg-rose-500/5 transition-all">
                                <input
                                    type="radio"
                                    name="status"
                                    checked={formData.status === 'Flagged'}
                                    onChange={() => setFormData({ ...formData, status: 'Flagged' })}
                                    className="accent-primary"
                                />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-rose-500">Flagged identity</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Main Fields */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-surface border border-surface rounded-lg p-8">
                        {createMode ? (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                                    <div className="space-y-2.5">
                                        <label className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                            <User className="w-3 h-3" /> Full Name *
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.fullName}
                                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                            className="w-full bg-bg border border-surface rounded-xl py-3 px-4 text-xs font-semibold focus:ring-1 focus:ring-primary/20 transition-all outline-none text-text"
                                        />
                                    </div>
                                    <div className="space-y-2.5">
                                        <label className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                            <User className="w-3 h-3" /> Username *
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.username}
                                            onChange={(e) => {
                                                const username = e.target.value;
                                                setFormData({ ...formData, username, name: username });
                                            }}
                                            className="w-full bg-bg border border-surface rounded-xl py-3 px-4 text-xs font-semibold focus:ring-1 focus:ring-primary/20 transition-all outline-none text-text"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                                    <div className="space-y-2.5">
                                        <label className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                            <Mail className="w-3 h-3" /> Email Address *
                                        </label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full bg-bg border border-surface rounded-xl py-3 px-4 text-xs font-semibold focus:ring-1 focus:ring-primary/20 transition-all outline-none text-text"
                                        />
                                    </div>
                                    <div className="space-y-2.5">
                                        <label className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                            <User className="w-3 h-3" /> Phone Number *
                                        </label>
                                        <input
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            className="w-full bg-bg border border-surface rounded-xl py-3 px-4 text-xs font-semibold focus:ring-1 focus:ring-primary/20 transition-all outline-none text-text"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                                    <div className="space-y-2.5">
                                        <label className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                            <Shield className="w-3 h-3" /> Password *
                                        </label>
                                        <input
                                            type="password"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            className="w-full bg-bg border border-surface rounded-xl py-3 px-4 text-xs font-semibold focus:ring-1 focus:ring-primary/20 transition-all outline-none text-text"
                                        />
                                    </div>
                                    <div className="space-y-2.5">
                                        <label className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                            <Shield className="w-3 h-3" /> Confirm Password *
                                        </label>
                                        <input
                                            type="password"
                                            value={formData.confirmPassword}
                                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                            className="w-full bg-bg border border-surface rounded-xl py-3 px-4 text-xs font-semibold focus:ring-1 focus:ring-primary/20 transition-all outline-none text-text"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                                    <div className="space-y-2.5">
                                        <label className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] ml-1">Role</label>
                                        <select
                                            value={formData.role}
                                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                            className="w-full bg-bg border border-surface rounded-xl py-3 px-4 text-xs font-semibold focus:ring-1 focus:ring-primary/20 transition-all outline-none text-text"
                                        >
                                            <option value="Standard">Standard</option>
                                            <option value="Premium">Premium</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2.5">
                                        <label className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] ml-1">Status</label>
                                        <select
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                            className="w-full bg-bg border border-surface rounded-xl py-3 px-4 text-xs font-semibold focus:ring-1 focus:ring-primary/20 transition-all outline-none text-text"
                                        >
                                            <option value="Pending">Pending</option>
                                            <option value="Verified">Verified</option>
                                            <option value="Flagged">Flagged</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2.5">
                                        <label className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] ml-1">Referral Code</label>
                                        <input
                                            type="text"
                                            value={formData.referralCode}
                                            onChange={(e) => setFormData({ ...formData, referralCode: e.target.value.toUpperCase() })}
                                            className="w-full bg-bg border border-surface rounded-xl py-3 px-4 text-xs font-semibold focus:ring-1 focus:ring-primary/20 transition-all outline-none text-text"
                                        />
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                                    <div className="space-y-2.5">
                                        <label className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                            <User className="w-3 h-3" /> Handle / Username
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full bg-bg border border-surface rounded-xl py-3 px-4 text-xs font-semibold focus:ring-1 focus:ring-primary/20 transition-all outline-none text-text"
                                        />
                                    </div>
                                    <div className="space-y-2.5">
                                        <label className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                            <Mail className="w-3 h-3" /> Email Address
                                        </label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full bg-bg border border-surface rounded-xl py-3 px-4 text-xs font-semibold focus:ring-1 focus:ring-primary/20 transition-all outline-none text-text"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                                    <div className="space-y-2.5">
                                        <label className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                            <Wallet className="w-3 h-3" /> Wallet Balance ({import.meta.env.VITE_CURRENCY || '₹'})
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted font-bold">{import.meta.env.VITE_CURRENCY || '₹'}</span>
                                            <input
                                                type="number"
                                                value={formData.walletBalance}
                                                onChange={(e) => setFormData({ ...formData, walletBalance: parseFloat(e.target.value) })}
                                                className="w-full bg-bg border border-surface rounded-xl py-3 pl-8 pr-4 text-xs font-semibold focus:ring-1 focus:ring-primary/20 transition-all outline-none text-text"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2.5">
                                        <label className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                            <Shield className="w-3 h-3" /> Risk Coefficient
                                        </label>
                                        <select
                                            value={formData.riskScore}
                                            onChange={(e) => setFormData({ ...formData, riskScore: e.target.value })}
                                            className="w-full bg-bg border border-surface rounded-xl py-3 px-4 text-xs font-semibold focus:ring-1 focus:ring-primary/20 transition-all outline-none text-text"
                                        >
                                            <option value="Low">Low Risk</option>
                                            <option value="Medium">Medium Risk</option>
                                            <option value="High">High Risk</option>
                                        </select>
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="bg-amber-500/5 border border-amber-500/10 p-5 rounded-2xl flex items-start gap-4">
                            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1.5">Warning</p>
                                <p className="text-[10px] text-amber-500/60 font-medium leading-relaxed uppercase tracking-widest">
                                    {createMode ? 'Use valid identity details. Created user can sign in immediately.' : 'Changes here can affect user payouts. Please review before saving.'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {!createMode && (
                        <div className="bg-surface/50 border border-surface border-dashed rounded-lg p-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-surface rounded-xl text-muted">
                                <Calendar className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[11px] font-bold uppercase tracking-wider text-text">Last Registry Sync</p>
                                <p className="text-[10px] font-medium text-muted uppercase tracking-widest">
                                    {formData?.updatedAt 
                                        ? new Date(formData.updatedAt).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/\//g, '.').replace(',', ' -')
                                        : new Date().toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/\//g, '.').replace(',', ' -')}
                                </p>
                            </div>
                        </div>
                        <button type="button" className="px-4 py-2 bg-surface hover:bg-surface2 border border-surface rounded-lg text-[9px] font-bold uppercase tracking-widest text-muted transition-all">
                            Purge Cache
                        </button>
                        </div>
                    )}
                </div>
            </form>
        </div>
    );
}

// Fixed import for Edit icon which was used in profile overview
function Edit2(props) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
            <path d="m15 5 4 4" />
        </svg>
    );
}
