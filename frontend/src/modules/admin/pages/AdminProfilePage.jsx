import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminPageHeader from '../components/shared/AdminPageHeader';
import { useUserStore } from '../../user/store/useUserStore';
import { User, Mail, Phone, FileText, AtSign } from 'lucide-react';

export default function AdminProfilePage() {
    const navigate = useNavigate();
    const { user, profile, updateProfile } = useUserStore();
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [form, setForm] = useState({
        name: '',
        email: '',
        phone: '',
        handle: '',
        bio: '',
    });

    useEffect(() => {
        if (user) {
            setForm({
                name: user.name || profile?.fullName || profile?.username || '',
                email: user.email || profile?.email || '',
                phone: user.phone || profile?.phone || '',
                handle: profile?.handle || `@${(user.name || '').replace(/\s+/g, '').toLowerCase() || 'admin'}`,
                bio: profile?.bio || '',
            });
        }
    }, [user, profile?.fullName, profile?.username, profile?.email, profile?.phone, profile?.handle, profile?.bio]);

    const handleChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSaving(true);
        try {
            await updateProfile({
                name: form.name,
                email: form.email,
                phone: form.phone.replace(/\D/g, '').slice(0, 10),
                handle: form.handle?.startsWith('@') ? form.handle : `@${form.handle || ''}`,
                bio: form.bio,
            });
        } catch (err) {
            setError(err?.message || 'Failed to save profile');
        } finally {
            setSaving(false);
        }
    };

    if (!user) {
        return (
            <div>
                <AdminPageHeader title="Admin Profile" subtitle="Load your profile from the server." />
                <p className="text-sm text-muted">Not logged in or profile not loaded.</p>
            </div>
        );
    }

    return (
        <div>
            <AdminPageHeader
                title="Admin Profile"
                subtitle="View and edit your admin account details (stored in database)."
            />

            <div className="max-w-xl">
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && <p className="text-xs text-red-500">{error}</p>}

                    <div>
                        <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1.5">Name</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                            <input
                                type="text"
                                value={form.name}
                                onChange={(e) => handleChange('name', e.target.value)}
                                className="w-full bg-bg border border-surface rounded-lg py-2.5 pl-10 pr-4 text-sm text-text"
                                placeholder="Full name"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1.5">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                            <input
                                type="email"
                                value={form.email}
                                onChange={(e) => handleChange('email', e.target.value)}
                                className="w-full bg-bg border border-surface rounded-lg py-2.5 pl-10 pr-4 text-sm text-text"
                                placeholder="email@example.com"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1.5">Phone (10 digits)</label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                            <input
                                type="tel"
                                inputMode="numeric"
                                value={form.phone}
                                onChange={(e) => handleChange('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                                className="w-full bg-bg border border-surface rounded-lg py-2.5 pl-10 pr-4 text-sm text-text"
                                placeholder="9876543210"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1.5">Handle</label>
                        <div className="relative">
                            <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                            <input
                                type="text"
                                value={form.handle}
                                onChange={(e) => handleChange('handle', e.target.value)}
                                className="w-full bg-bg border border-surface rounded-lg py-2.5 pl-10 pr-4 text-sm text-text"
                                placeholder="@admin"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1.5">Bio</label>
                        <div className="relative">
                            <FileText className="absolute left-3 top-3 w-4 h-4 text-muted" />
                            <textarea
                                value={form.bio}
                                onChange={(e) => handleChange('bio', e.target.value)}
                                rows={3}
                                className="w-full bg-bg border border-surface rounded-lg py-2.5 pl-10 pr-4 text-sm text-text resize-none"
                                placeholder="Short bio"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-4 py-2.5 rounded-lg text-sm font-bold bg-primary text-black disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Save Profile'}
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/admin')}
                            className="px-4 py-2.5 rounded-lg text-sm font-semibold border border-surface text-text"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
