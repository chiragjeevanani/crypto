import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, KeyRound, CheckCircle, Zap, Shield } from 'lucide-react';
import { useStaffStore } from '../store/useStaffStore';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5004/api';
const ROLE_LABELS = { staff: 'Staff', team_leader: 'Team Leader' };

export default function StaffProfilePage() {
    const { staff, getAuthHeader, updateStaffProfile } = useStaffStore();
    const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'password'

    // Profile edit state
    const [profileForm, setProfileForm] = useState({ name: staff?.name || '', phone: staff?.phone || '' });
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileMsg, setProfileMsg] = useState('');

    // Password reset state (email OTP flow)
    const [pwStep, setPwStep] = useState('request'); // 'request' | 'reset' | 'done'
    const [pwForm, setPwForm] = useState({ otp: '', newPassword: '', confirmPassword: '' });
    const [pwLoading, setPwLoading] = useState(false);
    const [pwMsg, setPwMsg] = useState({ type: '', text: '' });

    const handleProfileSave = async (e) => {
        e.preventDefault();
        setProfileLoading(true);
        setProfileMsg('');
        try {
            const res = await fetch(`${API_BASE}/admin/staff/${staff.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
                body: JSON.stringify({ name: profileForm.name, phone: profileForm.phone }),
            });
            const data = await res.json();
            if (data.success) {
                updateStaffProfile({ name: profileForm.name, phone: profileForm.phone });
                setProfileMsg('Profile updated successfully.');
            } else {
                setProfileMsg(data.message || 'Update failed.');
            }
        } catch {
            setProfileMsg('Network error. Please try again.');
        } finally {
            setProfileLoading(false);
        }
    };

    const handleSendOtp = async () => {
        setPwLoading(true);
        setPwMsg({ type: '', text: '' });
        try {
            const res = await fetch(`${API_BASE}/auth/staff/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: staff.email }),
            });
            const data = await res.json();
            if (data.success) {
                setPwStep('reset');
                setPwMsg({ type: 'success', text: 'OTP sent to your email. Check your inbox.' });
            } else {
                setPwMsg({ type: 'error', text: data.message || 'Failed to send OTP.' });
            }
        } catch {
            setPwMsg({ type: 'error', text: 'Network error. Please try again.' });
        } finally {
            setPwLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (pwForm.newPassword !== pwForm.confirmPassword) {
            return setPwMsg({ type: 'error', text: 'Passwords do not match.' });
        }
        if (pwForm.newPassword.length < 6) {
            return setPwMsg({ type: 'error', text: 'Password must be at least 6 characters.' });
        }
        setPwLoading(true);
        try {
            const res = await fetch(`${API_BASE}/auth/staff/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: staff.email, otp: pwForm.otp, newPassword: pwForm.newPassword }),
            });
            const data = await res.json();
            if (data.success) {
                setPwStep('done');
                setPwMsg({ type: 'success', text: 'Password changed successfully!' });
            } else {
                setPwMsg({ type: 'error', text: data.message || 'Reset failed.' });
            }
        } catch {
            setPwMsg({ type: 'error', text: 'Network error. Please try again.' });
        } finally {
            setPwLoading(false);
        }
    };

    const tabs = [
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'password', label: 'Change Password', icon: KeyRound },
    ];

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-xl font-bold text-text tracking-tight">My Profile</h1>
                <p className="text-xs text-muted mt-1">Manage your staff account settings</p>
            </div>

            {/* Role Badge */}
            <div className="flex items-center gap-3 p-4 bg-indigo-500/5 border border-indigo-500/15 rounded-xl">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-sm font-bold text-indigo-400">
                    {staff?.name?.[0]?.toUpperCase() || 'S'}
                </div>
                <div>
                    <p className="text-sm font-bold text-text">{staff?.name}</p>
                    <p className="text-[10px] text-indigo-400 uppercase tracking-widest font-semibold">
                        {ROLE_LABELS[staff?.role] || 'Staff'} · {staff?.email}
                    </p>
                </div>
                <div className="ml-auto">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-500/10 text-green-400 text-[9px] font-bold uppercase tracking-wider rounded-full border border-green-500/20">
                        <Shield className="w-2.5 h-2.5" /> Active
                    </span>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-surface/50 border border-surface rounded-xl p-1">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${
                            activeTab === tab.id
                                ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                                : 'text-muted hover:text-text'
                        }`}
                    >
                        <tab.icon className="w-3.5 h-3.5" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Profile Tab */}
            {activeTab === 'profile' && (
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-surface border border-surface rounded-2xl p-6 space-y-5"
                >
                    <h2 className="text-sm font-bold text-text">Account Details</h2>
                    <form onSubmit={handleProfileSave} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Full Name</label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-indigo-400 transition-colors" />
                                <input
                                    type="text"
                                    value={profileForm.name}
                                    onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))}
                                    className="w-full bg-bg border border-surface rounded-xl py-3 pl-12 pr-4 text-sm font-medium outline-none focus:ring-1 focus:ring-indigo-500/30 text-text"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                                <input
                                    type="email"
                                    value={staff?.email || ''}
                                    disabled
                                    className="w-full bg-surface2 border border-surface rounded-xl py-3 pl-12 pr-4 text-sm font-medium text-muted cursor-not-allowed"
                                />
                            </div>
                            <p className="text-[9px] text-muted opacity-50 ml-1">Email can only be changed by your admin.</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Phone</label>
                            <div className="relative group">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-indigo-400 transition-colors" />
                                <input
                                    type="tel"
                                    value={profileForm.phone}
                                    onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))}
                                    className="w-full bg-bg border border-surface rounded-xl py-3 pl-12 pr-4 text-sm font-medium outline-none focus:ring-1 focus:ring-indigo-500/30 text-text"
                                    placeholder="Optional"
                                />
                            </div>
                        </div>

                        {profileMsg && (
                            <p className={`text-xs ${profileMsg.includes('success') ? 'text-green-400' : 'text-red-400'}`}>{profileMsg}</p>
                        )}

                        <button
                            type="submit"
                            disabled={profileLoading}
                            className="flex items-center gap-2 bg-indigo-500 text-white font-bold uppercase tracking-widest text-[11px] py-3 px-6 rounded-xl hover:bg-indigo-600 transition-all disabled:opacity-50"
                        >
                            {profileLoading ? <Zap className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                        </button>
                    </form>
                </motion.div>
            )}

            {/* Change Password Tab */}
            {activeTab === 'password' && (
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-surface border border-surface rounded-2xl p-6 space-y-5"
                >
                    <h2 className="text-sm font-bold text-text">Change Password</h2>

                    {pwStep === 'done' ? (
                        <div className="text-center py-6 space-y-3">
                            <CheckCircle className="w-10 h-10 text-green-400 mx-auto" />
                            <p className="text-sm font-bold text-text">Password changed successfully!</p>
                            <button onClick={() => { setPwStep('request'); setPwMsg({ type: '', text: '' }); }}
                                className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider hover:opacity-80">
                                Reset Again
                            </button>
                        </div>
                    ) : pwStep === 'request' ? (
                        <div className="space-y-4">
                            <p className="text-xs text-muted leading-relaxed">
                                We'll send a 6-digit OTP to <strong className="text-text">{staff?.email}</strong> to verify it's you.
                            </p>
                            {pwMsg.text && (
                                <p className={`text-xs ${pwMsg.type === 'error' ? 'text-red-400' : 'text-green-400'}`}>{pwMsg.text}</p>
                            )}
                            <button
                                onClick={handleSendOtp}
                                disabled={pwLoading}
                                className="flex items-center gap-2 bg-indigo-500 text-white font-bold uppercase tracking-widest text-[11px] py-3 px-6 rounded-xl hover:bg-indigo-600 transition-all disabled:opacity-50"
                            >
                                {pwLoading ? <Zap className="w-4 h-4 animate-spin" /> : 'Send OTP to Email'}
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleResetPassword} className="space-y-4">
                            <p className="text-xs text-green-400">✓ OTP sent to {staff?.email}</p>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-muted uppercase tracking-wider">OTP Code</label>
                                <input
                                    type="text" inputMode="numeric"
                                    value={pwForm.otp}
                                    onChange={e => setPwForm(p => ({ ...p, otp: e.target.value }))}
                                    className="w-full bg-bg border border-surface rounded-xl py-3 px-4 text-sm font-medium outline-none focus:ring-1 focus:ring-indigo-500/30 text-text text-center tracking-[0.3em] text-lg"
                                    placeholder="• • • • • •" maxLength={6} required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-muted uppercase tracking-wider">New Password</label>
                                <input
                                    type="password"
                                    value={pwForm.newPassword}
                                    onChange={e => setPwForm(p => ({ ...p, newPassword: e.target.value }))}
                                    className="w-full bg-bg border border-surface rounded-xl py-3 px-4 text-sm font-medium outline-none focus:ring-1 focus:ring-indigo-500/30 text-text"
                                    placeholder="Min. 6 characters" required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Confirm Password</label>
                                <input
                                    type="password"
                                    value={pwForm.confirmPassword}
                                    onChange={e => setPwForm(p => ({ ...p, confirmPassword: e.target.value }))}
                                    className="w-full bg-bg border border-surface rounded-xl py-3 px-4 text-sm font-medium outline-none focus:ring-1 focus:ring-indigo-500/30 text-text"
                                    placeholder="••••••••" required
                                />
                            </div>
                            {pwMsg.text && (
                                <p className={`text-xs ${pwMsg.type === 'error' ? 'text-red-400' : 'text-green-400'}`}>{pwMsg.text}</p>
                            )}
                            <div className="flex gap-3">
                                <button type="submit" disabled={pwLoading}
                                    className="flex items-center gap-2 bg-indigo-500 text-white font-bold uppercase tracking-widest text-[11px] py-3 px-6 rounded-xl hover:bg-indigo-600 transition-all disabled:opacity-50">
                                    {pwLoading ? <Zap className="w-4 h-4 animate-spin" /> : 'Change Password'}
                                </button>
                                <button type="button" onClick={() => { setPwStep('request'); setPwMsg({ type: '', text: '' }); }}
                                    className="text-[10px] font-bold text-muted uppercase tracking-wider hover:text-text transition-colors py-3 px-4">
                                    Resend OTP
                                </button>
                            </div>
                        </form>
                    )}
                </motion.div>
            )}
        </div>
    );
}
