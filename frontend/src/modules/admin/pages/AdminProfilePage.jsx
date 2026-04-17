import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminPageHeader from '../components/shared/AdminPageHeader';
import { useUserStore } from '../../user/store/useUserStore';
import { 
    User, Mail, Phone, FileText, AtSign, Camera, Check, 
    AlertCircle, Save, X, ShieldCheck, Globe, Hash
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminProfilePage() {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const { user, profile, updateProfile } = useUserStore();
    
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    
    const [form, setForm] = useState({
        name: '',
        email: '',
        phone: '',
        avatar: '',
    });
    
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [avatarFile, setAvatarFile] = useState(null);

    useEffect(() => {
        if (user) {
            setForm({
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || '',
                avatar: user.avatar || '',
            });
            setAvatarPreview(user.avatar || null);
        }
    }, [user]);

    const handleChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        setError('');
        setSuccess(false);
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                setError('Avatar size must be under 2MB');
                return;
            }
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
            setSuccess(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess(false);
        setSaving(true);
        
        try {
            await updateProfile({
                name: form.name,
                email: form.email,
                phone: form.phone.replace(/\D/g, '').slice(0, 10),
                avatarFile: avatarFile, // Passed to useUserStore's updateProfile
            });
            
            setSuccess(true);
            setAvatarFile(null);
            setTimeout(() => setSuccess(false), 5000);
        } catch (err) {
            setError(err?.message || 'Failed to update protocol profile');
        } finally {
            setSaving(false);
        }
    };

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                <div className="w-16 h-16 bg-surface border border-surface rounded-2xl flex items-center justify-center mb-4">
                    <ShieldCheck className="w-8 h-8 text-muted animate-pulse" />
                </div>
                <h2 className="text-sm font-bold uppercase tracking-widest text-text">Session Missing</h2>
                <p className="text-[10px] text-muted font-bold uppercase tracking-tighter mt-2">Re-authentication required to access profile node.</p>
                <button 
                   onClick={() => navigate('/admin/login')}
                   className="mt-6 px-6 py-2.5 bg-primary text-black text-[10px] font-bold uppercase tracking-[0.2em] rounded-lg"
                >
                    Authenticate
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-20 max-w-5xl">
            <AdminPageHeader
                title="Account Intelligence"
                subtitle="Manage your administrative credentials and platform identity."
                actions={
                    <div className="flex gap-3">
                        <button
                            onClick={() => navigate('/admin')}
                            className="px-5 py-2.5 border border-surface rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-surface2 transition-all text-text"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={saving}
                            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-black rounded-lg text-[10px] font-black uppercase tracking-[0.15em] shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                        >
                            {saving ? (
                                <div className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                            ) : (
                                <Save className="w-3.5 h-3.5" />
                            )}
                            {saving ? 'Synchronizing' : 'Commit Changes'}
                        </button>
                    </div>
                }
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Profile Card */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-surface border border-surface rounded-2xl p-8 text-center relative overflow-hidden group">
                        {/* Decorative Background */}
                        <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-br from-primary/10 to-transparent -z-0 opacity-50" />
                        
                        <div className="relative z-10 flex flex-col items-center">
                            <div className="relative mb-6">
                                <div 
                                    onClick={handleAvatarClick}
                                    className="w-32 h-32 rounded-3xl bg-surface2 border-2 border-surface flex items-center justify-center overflow-hidden cursor-pointer group/avatar relative shadow-2xl"
                                >
                                    {avatarPreview ? (
                                        <img src={avatarPreview} alt="Admin" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-3xl font-black text-primary opacity-40">
                                            {user.name?.slice(0, 2).toUpperCase()}
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center">
                                        <Camera className="text-white w-8 h-8" />
                                    </div>
                                </div>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    onChange={handleFileChange} 
                                    accept="image/*"
                                />
                                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary border-4 border-surface rounded-2xl flex items-center justify-center text-black shadow-lg">
                                    <ShieldCheck className="w-5 h-5" />
                                </div>
                            </div>

                            <h3 className="text-lg font-black text-text tracking-tight">{user.name}</h3>
                            <p className="text-[10px] text-primary font-black uppercase tracking-[0.2em] mt-1">{user.role}</p>
                            
                            <div className="mt-8 w-full space-y-3">
                                <div className="flex items-center justify-between p-3 bg-bg border border-surface rounded-xl text-[9px] font-bold uppercase tracking-wider">
                                    <span className="text-muted">Status</span>
                                    <span className="text-emerald-500 flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-bg border border-surface rounded-xl text-[9px] font-bold uppercase tracking-wider">
                                    <span className="text-muted">Access Level</span>
                                    <span className="text-text">Clearance {user.role === 'Developer' ? 'Delta' : 'Alpha'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-surface border border-surface rounded-2xl p-6 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10 text-primary border border-surface">
                                <Globe className="w-4 h-4" />
                            </div>
                            <h4 className="text-[10px] font-bold text-text uppercase tracking-widest">System Metadata</h4>
                        </div>
                        <div className="space-y-4 pt-2">
                             <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-wider">
                                <span className="text-muted">Currency Code</span>
                                <span className="text-text">{import.meta.env.VITE_CURRENCY || 'INR'} / ₹</span>
                             </div>
                             <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-wider">
                                <span className="text-muted">Network Node</span>
                                <span className="text-text">AWS-AP-SOUTH-1</span>
                             </div>
                             <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-wider">
                                <span className="text-muted">IP Restriction</span>
                                <span className="text-emerald-500">Disabled</span>
                             </div>
                        </div>
                    </div>
                </div>

                {/* Edit Form */}
                <div className="lg:col-span-8">
                    <div className="bg-surface border border-surface rounded-2xl overflow-hidden">
                        <div className="p-6 border-b border-surface bg-surface2/30 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-bg border border-surface">
                                    <FileText className="w-4 h-4 text-muted" />
                                </div>
                                <h4 className="text-[10px] font-bold text-text uppercase tracking-widest">Protocol Identity Matrix</h4>
                            </div>

                            <AnimatePresence>
                                {success && (
                                    <motion.div 
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-lg text-[10px] font-bold uppercase tracking-wider"
                                    >
                                        <Check className="w-3.5 h-3.5" />
                                        Data Synchronized
                                    </motion.div>
                                )}
                                {error && (
                                    <motion.div 
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-lg text-[10px] font-bold uppercase tracking-wider"
                                    >
                                        <AlertCircle className="w-3.5 h-3.5" />
                                        {error}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-[10px] font-bold text-muted uppercase tracking-widest ml-1">
                                    <User className="w-3 h-3 text-primary" /> Display Name
                                </label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => handleChange('name', e.target.value)}
                                    className="w-full bg-bg border border-surface rounded-xl py-3 px-4 text-xs font-bold text-text outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                                    placeholder="Enter full name"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-[10px] font-bold text-muted uppercase tracking-widest ml-1">
                                    <Mail className="w-3 h-3 text-primary" /> Admin Email
                                </label>
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => handleChange('email', e.target.value)}
                                    className="w-full bg-bg border border-surface rounded-xl py-3 px-4 text-xs font-bold text-text outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all opacity-80"
                                    placeholder="admin@reels.com"
                                    disabled
                                />
                                <p className="text-[8px] text-muted font-bold uppercase tracking-tighter opacity-40 ml-1">Email changes require root auth</p>
                            </div>

                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-[10px] font-bold text-muted uppercase tracking-widest ml-1">
                                    <Phone className="w-3 h-3 text-primary" /> Recovery Contact
                                </label>
                                <input
                                    type="tel"
                                    value={form.phone}
                                    onChange={(e) => handleChange('phone', e.target.value)}
                                    className="w-full bg-bg border border-surface rounded-xl py-3 px-4 text-xs font-bold text-text outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                                    placeholder="9876543210"
                                />
                            </div>

                            <div className="md:col-span-2 pt-6">
                                <div className="p-4 bg-bg border border-surface rounded-2xl flex items-start gap-4">
                                    <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-500 border border-orange-500/20 mt-0.5">
                                        <AlertCircle className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-text uppercase tracking-widest">Protocol Warning</p>
                                        <p className="text-[9px] text-muted font-medium uppercase tracking-wider mt-1 leading-relaxed">
                                            Updating these records will affect your visibility across the administrative interface and audit logs. 
                                            Ensure all data strictly adheres to platform governance policies.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

